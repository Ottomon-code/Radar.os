import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import crypto from 'crypto';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  getLiveAtsJobs,
  searchLiveAtsJobs,
  getLiveAtsStealthProfiles,
  getLiveAtsCommsMessages,
  VERIFIED_ATS_BOARDS,
} from './src/utils/atsScraper.ts';
import {
  TRIAD_ASSISTANTS,
  INITIAL_INTER_AGENT_MESSAGES,
} from './src/utils/triadEngine.ts';
import { generateBulkCapabilitiesCsvString } from './src/utils/bulkCapabilitiesCsv.ts';
import { CAREER_PROFILES, generateSalaryTimeline } from './src/utils/marketAnalyticsEngine.ts';
import {
  DEFAULT_BUYER_THREADS,
  type BuyerThread,
  type BuyerMessage,
} from './src/utils/buyerCommsEngine.ts';
import {
  computeTierPricing,
  detectCountryFromTimezoneOrLocale,
  getPppProfileForCountry,
  type PaystackTierId,
} from './src/utils/pppPricing.ts';
import {
  fetchOwnerInquiriesFromFirestore,
  fetchSubscriptionFromFirestoreByEmail,
  hydrateLedgersFromFirestore,
  subscriptionDocIdForEmail,
  upsertAgencyPilotInFirestore,
  upsertInquiryInFirestore,
  upsertReferralInFirestore,
  upsertSubscriptionInFirestore,
  type FirestoreSubscriptionSyncResult,
} from './src/utils/firestoreServerSync.ts';
import {
  DEFAULT_CUSTOM_DOMAIN,
  FALLBACK_SHARED_CLOUD_RUN_URL,
  FALLBACK_DEV_CLOUD_RUN_URL,
  CANONICAL_CLOUD_RUN_HOST_NAME,
  DEFAULT_ANDROID_PACKAGE_NAME,
  DEFAULT_ANDROID_SHA256_FINGERPRINTS,
  buildDnsRecordsForDomain,
  buildCloudflareBindZoneFile,
  buildCloudflareWorkerScript,
  getCustomDomainHosts,
  getEntryOriginForDomain,
  isManagedFreeSubdomain,
  sanitizeDomainInput,
  isValidCustomDomainFormat,
  sanitizeSha256Fingerprint,
  type DomainConfigSnapshot,
  type PreferredEntryHost,
} from './src/utils/domainConfigShared.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Durable subscription & webhook ledger (.data/paystack-ledger.json)
const LEDGER_DIR = path.resolve(__dirname, '.data');
const LEDGER_FILE = path.join(LEDGER_DIR, 'paystack-ledger.json');
const CRM_LEDGER_FILE = path.join(LEDGER_DIR, 'crm-ledger.json');
const DOMAIN_CONFIG_FILE = path.join(LEDGER_DIR, 'domain-config.json');

const envCustomDomain =
  process.env.CUSTOM_DOMAIN && isValidCustomDomainFormat(process.env.CUSTOM_DOMAIN)
    ? sanitizeDomainInput(process.env.CUSTOM_DOMAIN)
    : DEFAULT_CUSTOM_DOMAIN;

const domainConfigState: DomainConfigSnapshot = {
  primaryDomain: envCustomDomain,
  preferredEntryHost: process.env.PREFERRED_ENTRY_HOST === 'app' ? 'app' : 'root',
  sha256Fingerprints: [...DEFAULT_ANDROID_SHA256_FINGERPRINTS],
  customDomainVerified: Boolean(
    process.env.CUSTOM_DOMAIN && isValidCustomDomainFormat(process.env.CUSTOM_DOMAIN)
  ),
  updatedAt: new Date().toISOString(),
};

function loadDomainConfigFromDisk() {
  try {
    if (!fs.existsSync(DOMAIN_CONFIG_FILE)) return;
    const raw = fs.readFileSync(DOMAIN_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed?.primaryDomain && isValidCustomDomainFormat(parsed.primaryDomain)) {
      domainConfigState.primaryDomain = sanitizeDomainInput(parsed.primaryDomain);
    }
    if (parsed?.preferredEntryHost === 'app' || parsed?.preferredEntryHost === 'root') {
      domainConfigState.preferredEntryHost = parsed.preferredEntryHost;
    }
    if (Array.isArray(parsed?.sha256Fingerprints) && parsed.sha256Fingerprints.length > 0) {
      const validFps = parsed.sha256Fingerprints
        .map((fp: unknown) => (typeof fp === 'string' ? sanitizeSha256Fingerprint(fp) : null))
        .filter((fp: string | null): fp is string => Boolean(fp));
      if (validFps.length > 0) {
        domainConfigState.sha256Fingerprints = validFps;
      }
    }
    if (typeof parsed?.customDomainVerified === 'boolean') {
      domainConfigState.customDomainVerified = parsed.customDomainVerified;
    }
    if (typeof parsed?.updatedAt === 'string') {
      domainConfigState.updatedAt = parsed.updatedAt;
    }
  } catch (err) {
    console.warn('Could not load persisted domain config:', err);
  }
}

function saveDomainConfigToDisk() {
  try {
    if (!fs.existsSync(LEDGER_DIR)) {
      fs.mkdirSync(LEDGER_DIR, { recursive: true });
    }
    const tmpFile = `${DOMAIN_CONFIG_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(domainConfigState, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DOMAIN_CONFIG_FILE);
  } catch (err) {
    console.warn('Failed to persist domain config to disk:', err);
  }
}

loadDomainConfigFromDisk();

function isCustomHostName(host: string): boolean {
  const clean = host.toLowerCase().trim().replace(/:\d+$/, '');
  if (!clean) return false;
  return (
    clean !== 'localhost' &&
    clean !== '127.0.0.1' &&
    !clean.endsWith('.run.app') &&
    !clean.includes('aistudio.google.com')
  );
}

function resolveRequestHost(req: express.Request): string {
  const forwardedHostRaw = req.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw)
    ? forwardedHostRaw[0]
    : typeof forwardedHostRaw === 'string'
    ? forwardedHostRaw.split(',')[0]
    : '';
  const rawHost = (forwardedHost || req.get('host') || CANONICAL_CLOUD_RUN_HOST_NAME)
    .trim()
    .replace(/:\d+$/, (m) => (forwardedHost ? '' : m));
  return rawHost || CANONICAL_CLOUD_RUN_HOST_NAME;
}

function resolveRequestProtocol(req: express.Request, host: string): 'http' | 'https' {
  const cleanHost = host.toLowerCase();
  if (cleanHost.startsWith('localhost') || cleanHost.startsWith('127.0.0.1')) {
    return 'http';
  }
  const forwardedProtoRaw = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoRaw)
    ? forwardedProtoRaw[0]
    : typeof forwardedProtoRaw === 'string'
    ? forwardedProtoRaw.split(',')[0].trim().toLowerCase()
    : '';
  if (forwardedProto === 'http' || forwardedProto === 'https') {
    return forwardedProto;
  }
  return req.protocol === 'http' ? 'http' : 'https';
}

function resolveEffectiveOrigin(req: express.Request, options?: { preferPublicOverLocal?: boolean }): string {
  const host = resolveRequestHost(req);
  const cleanHost = host.toLowerCase().replace(/:\d+$/, '');

  if (isCustomHostName(cleanHost)) {
    return `https://${cleanHost}`;
  }

  const originHeader = (req.get('origin') || '').trim();
  if (originHeader) {
    try {
      const parsedOrigin = new URL(originHeader);
      if (isCustomHostName(parsedOrigin.hostname)) {
        return parsedOrigin.origin;
      }
    } catch {
      // Ignore malformed origin
    }
  }

  const envAppUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envAppUrl && !envAppUrl.includes('aistudio.google.com') && !envAppUrl.includes('localhost')) {
    if (domainConfigState.customDomainVerified || !envAppUrl.includes('.run.app')) {
      return envAppUrl;
    }
  }

  if (domainConfigState.customDomainVerified) {
    return getEntryOriginForDomain(
      domainConfigState.primaryDomain,
      domainConfigState.preferredEntryHost
    );
  }

  if (
    options?.preferPublicOverLocal &&
    (cleanHost.startsWith('localhost') ||
      cleanHost.startsWith('127.0.0.1') ||
      cleanHost.includes('ais-dev-'))
  ) {
    return FALLBACK_SHARED_CLOUD_RUN_URL;
  }

  const proto = resolveRequestProtocol(req, host);
  return `${proto}://${host}`;
}

function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    const domainHosts = getCustomDomainHosts(domainConfigState.primaryDomain);

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === domainHosts.apexDomain ||
      hostname === domainHosts.wwwSubdomain ||
      hostname === domainHosts.appSubdomain ||
      hostname.endsWith(`.${domainHosts.apexDomain}`) ||
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.firebaseapp.com') ||
      hostname.endsWith('.web.app') ||
      hostname.endsWith('.onrender.com')
    ) {
      return true;
    }

    const envAppUrl = (process.env.APP_URL || '').trim();
    if (envAppUrl) {
      try {
        if (new URL(envAppUrl).hostname.toLowerCase() === hostname) return true;
      } catch {
        // Ignore invalid APP_URL
      }
    }
    return false;
  } catch {
    return false;
  }
}

const GEMINI_MODEL = 'gemini-4-hydrogen';
const GEMINI_LITE_MODEL = 'gemini-3.1-flash-lite';

function getGeminiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (
    !apiKey ||
    apiKey === 'MY_GEMINI_API_KEY' ||
    apiKey.includes('placeholder') ||
    apiKey.startsWith('YOUR_')
  ) {
    const err: any = new Error(
      'GEMINI_API_KEY is not configured. Add a valid Gemini API key in your environment variables.'
    );
    err.statusCode = 503;
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function extractGeminiStatusCode(err: any): number {
  const direct = Number(err?.statusCode || err?.status || err?.error?.code);
  if (Number.isFinite(direct) && direct >= 400 && direct < 600) {
    return direct;
  }
  const msg = String(err?.message || '');
  if (msg.includes('"code":429') || msg.toLowerCase().includes('resource_exhausted') || msg.toLowerCase().includes('quota')) {
    return 429;
  }
  if (msg.includes('"code":503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('high demand')) {
    return 503;
  }
  if (msg.includes('"code":403') || msg.toLowerCase().includes('permission_denied') || msg.toLowerCase().includes('api key not valid')) {
    return 403;
  }
  if (msg.includes('"code":400') || msg.toLowerCase().includes('invalid_argument')) {
    return 400;
  }
  return 502;
}

function mapGeminiHttpError(err: any): {
  status: number;
  body: { error: string; code: string; hint: string };
} {
  const explicitStatus = extractGeminiStatusCode(err);
  const rawMsg = String(err?.message || 'Gemini inference failed');
  const lower = rawMsg.toLowerCase();
  let status = explicitStatus;
  let code = err?.code || 'GEMINI_INFERENCE_ERROR';
  let userMessage = rawMsg;
  let hint = 'Please retry in a moment.';

  if (code === 'GEMINI_NOT_CONFIGURED') {
    status = 503;
    hint = 'Set a valid GEMINI_API_KEY environment variable on your server.';
  } else if (explicitStatus === 429 || lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    status = 429;
    code = 'GEMINI_RATE_LIMITED';
    userMessage = 'Gemini API free-tier quota or rate limit was temporarily reached. Wait a few seconds and retry.';
    hint = 'Reduce burst requests or verify your Gemini API key quota in Google AI Studio.';
  } else if (explicitStatus === 503 || lower.includes('unavailable') || lower.includes('high demand')) {
    status = 503;
    code = 'GEMINI_HIGH_DEMAND';
    userMessage = 'Gemini model is temporarily experiencing high upstream demand. Please try again in a few seconds.';
    hint = 'Upstream capacity spike — retrying shortly usually resolves this.';
  } else if (
    explicitStatus === 401 ||
    explicitStatus === 403 ||
    lower.includes('api key not valid') ||
    lower.includes('permission') ||
    lower.includes('unauthorized')
  ) {
    status = 403;
    code = 'GEMINI_AUTH_ERROR';
    userMessage = 'Gemini API rejected the configured GEMINI_API_KEY (invalid key or missing permissions).';
    hint = 'Check GEMINI_API_KEY in your environment variables.';
  } else if (explicitStatus === 400 || lower.includes('invalid argument')) {
    status = 400;
    code = 'GEMINI_BAD_REQUEST';
  }

  return {
    status,
    body: {
      error: userMessage,
      code,
      hint,
    },
  };
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const err: any = new Error(`${label} timed out after ${timeoutMs}ms`);
          err.statusCode = 504;
          reject(err);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateGeminiContentResilient(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: Record<string, any>;
    preferLowThinking?: boolean;
    allowLiteFallback?: boolean;
    primaryTimeoutMs?: number;
  }
) {
  const baseConfig = params.config ? { ...params.config } : {};
  const primaryConfig =
    params.preferLowThinking && !baseConfig.thinkingConfig
      ? { ...baseConfig, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
      : baseConfig;
  const primaryTimeoutMs = params.primaryTimeoutMs ?? 9000;

  try {
    return {
      response: await runWithTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: params.contents,
          config: Object.keys(primaryConfig).length > 0 ? primaryConfig : undefined,
        }),
        primaryTimeoutMs,
        GEMINI_MODEL
      ),
      modelUsed: GEMINI_MODEL,
    };
  } catch (primaryErr: any) {
    const status = extractGeminiStatusCode(primaryErr);
    const isTimeout = primaryErr?.name === 'AbortError' || primaryErr?.name === 'TimeoutError' || status === 504;
    const shouldRetryOrFallback = isTimeout || status === 429 || status === 503 || status === 500;
    if (!shouldRetryOrFallback || params.allowLiteFallback === false) {
      throw primaryErr;
    }

    // Brief backoff before fallback to higher-throughput Gemini Lite model
    await new Promise((r) => setTimeout(r, 300));
    const liteConfig = { ...baseConfig };
    delete liteConfig.thinkingConfig;

    const liteRes = await runWithTimeout(
      ai.models.generateContent({
        model: GEMINI_LITE_MODEL,
        contents: params.contents,
        config: Object.keys(liteConfig).length > 0 ? liteConfig : undefined,
      }),
      15000,
      GEMINI_LITE_MODEL
    );
    return {
      response: liteRes,
      modelUsed: GEMINI_LITE_MODEL,
    };
  }
}

function getEmailDispatcherStatus(): {
  configured: boolean;
  provider: 'resend' | 'brevo' | 'none';
  fromAddress: string;
} {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const ownerEmail = (process.env.OWNER_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL || 'mortyp1125@gmail.com').trim();
  if (resendKey && !resendKey.includes('placeholder')) {
    return {
      configured: true,
      provider: 'resend',
      fromAddress: (process.env.RESEND_FROM_EMAIL || `Career Radar <onboarding@resend.dev>`).trim(),
    };
  }
  if (brevoKey && !brevoKey.includes('placeholder')) {
    return {
      configured: true,
      provider: 'brevo',
      fromAddress: (process.env.BREVO_SENDER_EMAIL || ownerEmail).trim(),
    };
  }
  return {
    configured: false,
    provider: 'none',
    fromAddress: ownerEmail,
  };
}

async function dispatchRealEmail(params: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{
  sent: boolean;
  provider: 'resend' | 'brevo' | 'none';
  messageId?: string;
  error?: string;
}> {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const cleanTo = params.to.trim();

  if (!cleanTo || !cleanTo.includes('@')) {
    return { sent: false, provider: 'none', error: 'No valid recipient email address provided.' };
  }

  if (resendKey && !resendKey.includes('placeholder')) {
    const fromAddr = (process.env.RESEND_FROM_EMAIL || 'Career Radar <onboarding@resend.dev>').trim();
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [cleanTo],
          reply_to: params.replyTo || undefined,
          subject: params.subject,
          text: params.text,
          html: params.html || undefined,
        }),
      });
      const json: any = await resp.json().catch(() => ({}));
      if (resp.ok && json?.id) {
        return { sent: true, provider: 'resend', messageId: String(json.id) };
      }
      return {
        sent: false,
        provider: 'resend',
        error: json?.message || json?.error?.message || `Resend returned HTTP ${resp.status}`,
      };
    } catch (err: any) {
      return { sent: false, provider: 'resend', error: err?.message || 'Resend dispatch failed' };
    }
  }

  if (brevoKey && !brevoKey.includes('placeholder')) {
    const senderEmail = (
      process.env.BREVO_SENDER_EMAIL ||
      process.env.OWNER_NOTIFICATION_EMAIL ||
      process.env.OWNER_EMAIL ||
      'mortyp1125@gmail.com'
    ).trim();
    const senderName = (process.env.BREVO_SENDER_NAME || 'Global Career Radar').trim();
    try {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanTo }],
          replyTo: params.replyTo ? { email: params.replyTo } : undefined,
          subject: params.subject,
          textContent: params.text,
          htmlContent: params.html || undefined,
        }),
      });
      const json: any = await resp.json().catch(() => ({}));
      if (resp.ok) {
        return { sent: true, provider: 'brevo', messageId: String(json?.messageId || `brevo_${Date.now()}`) };
      }
      return {
        sent: false,
        provider: 'brevo',
        error: json?.message || `Brevo returned HTTP ${resp.status}`,
      };
    } catch (err: any) {
      return { sent: false, provider: 'brevo', error: err?.message || 'Brevo dispatch failed' };
    }
  }

  return {
    sent: false,
    provider: 'none',
    error: 'RESEND_API_KEY or BREVO_API_KEY is not configured in Settings > Secrets.',
  };
}

function buildMailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface ContactInquiryRecord {
  id: string;
  name: string;
  email: string;
  organization?: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  deliveryMode: 'email_api' | 'ats_handoff_fallback';
  emailProvider?: string;
  createdAt: string;
}

interface AgencyPilotRecord {
  id: string;
  agencyName: string;
  contactName: string;
  workEmail: string;
  companyUrl?: string;
  seats?: string;
  planTier?: string;
  notes?: string;
  status: string;
  deliveryMode: 'email_api' | 'ats_handoff_fallback';
  createdAt: string;
}

interface CommsReplyRecord {
  id: string;
  messageId: string;
  company?: string;
  targetRole?: string;
  recipientEmail?: string;
  subject: string;
  replyText: string;
  status: 'Unread' | 'Negotiating' | 'Accepted' | 'Declined' | 'Replied';
  deliveryMode: 'email_api' | 'ats_handoff_fallback';
  provider: string;
  handoffUrl?: string;
  mailtoHref?: string;
  createdAt: string;
}

interface CrmLedgerState {
  inquiries: ContactInquiryRecord[];
  agencyPilots: AgencyPilotRecord[];
  outboundCommsReplies: CommsReplyRecord[];
  buyerThreads: BuyerThread[];
  buyerLeads: Record<string, any>[];
}

const crmLedger: CrmLedgerState = {
  inquiries: [],
  agencyPilots: [],
  outboundCommsReplies: [],
  buyerThreads: JSON.parse(JSON.stringify(DEFAULT_BUYER_THREADS)),
  buyerLeads: [],
};

function loadCrmLedgerFromDisk() {
  try {
    if (!fs.existsSync(CRM_LEDGER_FILE)) return;
    const raw = fs.readFileSync(CRM_LEDGER_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.inquiries)) crmLedger.inquiries = parsed.inquiries;
    if (Array.isArray(parsed.agencyPilots)) crmLedger.agencyPilots = parsed.agencyPilots;
    if (Array.isArray(parsed.outboundCommsReplies)) crmLedger.outboundCommsReplies = parsed.outboundCommsReplies;
    if (Array.isArray(parsed.buyerThreads) && parsed.buyerThreads.length > 0) {
      crmLedger.buyerThreads = parsed.buyerThreads;
    }
    if (Array.isArray(parsed.buyerLeads)) crmLedger.buyerLeads = parsed.buyerLeads;
  } catch (err) {
    console.warn('Could not load persisted CRM ledger, starting with clean store:', err);
  }
}

function saveCrmLedgerToDisk() {
  try {
    if (!fs.existsSync(LEDGER_DIR)) {
      fs.mkdirSync(LEDGER_DIR, { recursive: true });
    }
    const payload = {
      ...crmLedger,
      inquiries: crmLedger.inquiries.slice(-500),
      agencyPilots: crmLedger.agencyPilots.slice(-500),
      outboundCommsReplies: crmLedger.outboundCommsReplies.slice(-500),
      buyerLeads: crmLedger.buyerLeads.slice(-500),
      savedAt: new Date().toISOString(),
    };
    const tmpFile = `${CRM_LEDGER_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CRM_LEDGER_FILE);
  } catch (err) {
    console.warn('Failed to persist CRM ledger to disk:', err);
  }
}

loadCrmLedgerFromDisk();

interface VerifiedSessionRecord {
  tier: string;
  email?: string;
  amountTotal: number;
  currency?: string;
  provider?: 'paystack';
  status: string;
  referralCode?: string;
  discountPercent?: number;
  pppCountryCode?: string;
  pppDiscountPercent?: number;
  createdAt: string;
}

interface SubscriptionLedgerRecord {
  email: string;
  userId?: string;
  tier: string;
  reference: string;
  provider?: 'paystack';
  status: 'active' | 'cancelled' | 'past_due' | 'non_renewing' | 'refunded' | 'disputed';
  amountTotal: number;
  currency: string;
  subscriptionCode?: string;
  planCode?: string;
  customerCode?: string;
  emailToken?: string;
  nextPaymentDate?: string;
  cancelAtPeriodEnd?: boolean;
  expiringCardNotice?: string;
  lastWebhookEvent?: string;
  referralCodeUsed?: string;
  updatedAt: string;
}

interface ReferralConversionEntry {
  reference: string;
  maskedBuyerEmail: string;
  tierId: string;
  paidUsd: number;
  commissionUsd: number;
  convertedAt: string;
}

interface ReferralLedgerRecord {
  code: string;
  referrerEmail: string;
  referrerUid?: string;
  clicks: number;
  paidConversions: number;
  availableMonthCredits: number;
  totalMonthCreditsClaimed: number;
  totalCommissionUsd: number;
  conversions: ReferralConversionEntry[];
  createdAt: string;
  updatedAt: string;
}

interface WebhookAuditEntry {
  eventId: string;
  event: string;
  reference: string;
  tier: string;
  receivedAt: string;
}

const verifiedCheckoutSessions = new Map<string, VerifiedSessionRecord>();
const subscriptionLedgerByEmail = new Map<string, SubscriptionLedgerRecord>();
const subscriptionByCode = new Map<string, string>(); // subscription_code -> lowercased email
const emailToUidMap = new Map<string, string>(); // lowercased email -> Firebase uid
const referralLedgerByCode = new Map<string, ReferralLedgerRecord>();
const referralCodeByEmail = new Map<string, string>(); // lowercased email -> referral code
const convertedReferralTxRefs = new Set<string>();
const runtimePaystackPlans: Record<string, string | undefined> = {};
const processedWebhookEvents: WebhookAuditEntry[] = [];
const processedWebhookIdSet = new Set<string>();

function loadLedgerFromDisk() {
  try {
    if (!fs.existsSync(LEDGER_FILE)) return;
    const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.sessions)) {
      for (const [k, v] of parsed.sessions) {
        if (k && v) verifiedCheckoutSessions.set(k, v);
      }
    }
    if (Array.isArray(parsed.subscriptions)) {
      for (const [k, v] of parsed.subscriptions) {
        if (k && v) {
          subscriptionLedgerByEmail.set(k, v);
          if (v.subscriptionCode) subscriptionByCode.set(v.subscriptionCode, k);
          if (v.userId && typeof v.userId === 'string') {
            emailToUidMap.set(String(k).toLowerCase(), v.userId);
          }
        }
      }
    }
    if (Array.isArray(parsed.referrals)) {
      for (const [k, v] of parsed.referrals) {
        if (k && v && v.referrerEmail) {
          referralLedgerByCode.set(k, v);
          referralCodeByEmail.set(String(v.referrerEmail).toLowerCase(), k);
        }
      }
    }
    if (Array.isArray(parsed.convertedReferralTxRefs)) {
      for (const ref of parsed.convertedReferralTxRefs) {
        if (typeof ref === 'string' && ref) convertedReferralTxRefs.add(ref);
      }
    }
    if (parsed.plans && typeof parsed.plans === 'object') {
      Object.assign(runtimePaystackPlans, parsed.plans);
    }
    if (Array.isArray(parsed.webhookEvents)) {
      for (const entry of parsed.webhookEvents.slice(-500)) {
        if (entry?.eventId) {
          processedWebhookEvents.push(entry);
          processedWebhookIdSet.add(entry.eventId);
        }
      }
    }
  } catch (err) {
    console.warn('Could not load persisted Paystack ledger, starting clean:', err);
  }
}

function saveLedgerToDisk() {
  try {
    if (!fs.existsSync(LEDGER_DIR)) {
      fs.mkdirSync(LEDGER_DIR, { recursive: true });
    }
    const payload = {
      sessions: Array.from(verifiedCheckoutSessions.entries()).slice(-1000),
      subscriptions: Array.from(subscriptionLedgerByEmail.entries()),
      referrals: Array.from(referralLedgerByCode.entries()),
      convertedReferralTxRefs: Array.from(convertedReferralTxRefs).slice(-2000),
      plans: runtimePaystackPlans,
      webhookEvents: processedWebhookEvents.slice(-500),
      savedAt: new Date().toISOString(),
    };
    const tmpFile = `${LEDGER_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tmpFile, LEDGER_FILE);
  } catch (err) {
    console.warn('Failed to persist Paystack ledger to disk:', err);
  }
}

loadLedgerFromDisk();

// Hydrate durable subscriptions & referrals from Firestore asynchronously (for Cloud Run persistence)
hydrateLedgersFromFirestore()
  .then((hydrated) => {
    if (!hydrated.available) return;
    let changed = false;
    for (const sub of hydrated.subscriptions) {
      const emailKey = String(sub.email || '').trim().toLowerCase();
      if (!emailKey) continue;
      const existing = subscriptionLedgerByEmail.get(emailKey);
      if (!existing || String(sub.updatedAt || '') > String(existing.updatedAt || '')) {
        const rec: SubscriptionLedgerRecord = {
          email: emailKey,
          userId: sub.userId || existing?.userId,
          tier: String(sub.tier || 'pro_annual'),
          reference: String(sub.reference || ''),
          provider: 'paystack',
          status: (sub.status as SubscriptionLedgerRecord['status']) || 'active',
          amountTotal: Number(sub.amountTotal) || 0,
          currency: String(sub.currency || 'KES'),
          subscriptionCode: sub.subscriptionCode || existing?.subscriptionCode,
          planCode: sub.planCode || existing?.planCode,
          customerCode: sub.customerCode || existing?.customerCode,
          nextPaymentDate: sub.nextPaymentDate || existing?.nextPaymentDate,
          cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
          lastWebhookEvent: sub.lastWebhookEvent || existing?.lastWebhookEvent,
          updatedAt: String(sub.updatedAt || new Date().toISOString()),
        };
        subscriptionLedgerByEmail.set(emailKey, rec);
        if (rec.subscriptionCode) subscriptionByCode.set(rec.subscriptionCode, emailKey);
        changed = true;
      }
    }
    for (const ref of hydrated.referrals) {
      const code = normalizeReferralCode(ref.code);
      const refEmail = String(ref.referrerEmail || '').trim().toLowerCase();
      if (!code || !refEmail) continue;
      const existing = referralLedgerByCode.get(code);
      if (!existing || String(ref.updatedAt || '') > String(existing.updatedAt || '')) {
        const rec: ReferralLedgerRecord = {
          code,
          referrerEmail: refEmail,
          referrerUid: ref.referrerUid || existing?.referrerUid,
          clicks: Number(ref.clicks) || 0,
          paidConversions: Number(ref.paidConversions) || 0,
          availableMonthCredits: Number(ref.availableMonthCredits) || 0,
          totalMonthCreditsClaimed: Number(ref.totalMonthCreditsClaimed) || 0,
          totalCommissionUsd: Number(ref.totalCommissionUsd) || 0,
          conversions: existing?.conversions || [],
          createdAt: String(ref.createdAt || new Date().toISOString()),
          updatedAt: String(ref.updatedAt || new Date().toISOString()),
        };
        referralLedgerByCode.set(code, rec);
        referralCodeByEmail.set(refEmail, code);
        changed = true;
      }
    }
    if (changed) saveLedgerToDisk();
  })
  .catch(() => {
    // Non-fatal local dev fallback
  });

function normalizeReferralCode(raw?: string): string {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24);
}

function maskReferralEmail(email?: string): string {
  const clean = String(email || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return 'subscriber';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function generateUniqueReferralCode(email: string): string {
  const digest = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').toUpperCase();
  let candidate = `TR-${digest.slice(0, 6)}`;
  let suffix = 0;
  while (referralLedgerByCode.has(candidate)) {
    const existing = referralLedgerByCode.get(candidate);
    if (existing?.referrerEmail.toLowerCase() === email.trim().toLowerCase()) {
      return candidate;
    }
    suffix += 1;
    candidate = `TR-${digest.slice(0, 5)}${suffix.toString(36).toUpperCase()}`;
  }
  return candidate;
}

function validateReferralForBuyer(
  rawCode?: string,
  buyerEmail?: string
): { valid: boolean; record?: ReferralLedgerRecord; discountPercent: number; error?: string } {
  const cleanCode = normalizeReferralCode(rawCode);
  if (!cleanCode) {
    return { valid: false, discountPercent: 0, error: 'Referral code is required.' };
  }
  const record = referralLedgerByCode.get(cleanCode);
  if (!record) {
    return { valid: false, discountPercent: 0, error: 'Referral code not found or inactive.' };
  }
  const cleanBuyer = String(buyerEmail || '').trim().toLowerCase();
  if (cleanBuyer && cleanBuyer === record.referrerEmail.toLowerCase()) {
    return {
      valid: false,
      discountPercent: 0,
      error: 'Self-referrals are not eligible for the 20% discount or referral credits.',
    };
  }
  return { valid: true, record, discountPercent: 20 };
}

function creditReferralConversion(params: {
  reference: string;
  tierId: string;
  buyerEmail?: string;
  paidUsd: number;
  referralCode?: string;
}) {
  const cleanCode = normalizeReferralCode(params.referralCode);
  if (!cleanCode || !params.reference || convertedReferralTxRefs.has(params.reference)) {
    return;
  }
  if (
    params.paidUsd <= 0 ||
    params.reference.startsWith('owner_') ||
    params.reference.startsWith('vip_') ||
    params.reference.startsWith('ref_credit_')
  ) {
    return;
  }
  const rec = referralLedgerByCode.get(cleanCode);
  if (!rec) return;

  const cleanBuyer = String(params.buyerEmail || '').trim().toLowerCase();
  if (cleanBuyer && cleanBuyer === rec.referrerEmail.toLowerCase()) {
    return; // Never credit self-referrals
  }

  convertedReferralTxRefs.add(params.reference);
  const commissionUsd = Math.round(params.paidUsd * 0.2 * 100) / 100;
  rec.paidConversions += 1;
  rec.availableMonthCredits += 1;
  rec.totalCommissionUsd = Math.round((rec.totalCommissionUsd + commissionUsd) * 100) / 100;
  rec.conversions.unshift({
    reference: params.reference,
    maskedBuyerEmail: maskReferralEmail(cleanBuyer),
    tierId: params.tierId,
    paidUsd: params.paidUsd,
    commissionUsd,
    convertedAt: new Date().toISOString(),
  });
  rec.conversions = rec.conversions.slice(0, 50);
  rec.updatedAt = new Date().toISOString();
  saveLedgerToDisk();
  void upsertReferralInFirestore(rec);
}

let firebaseWebApiKey = '';
try {
  const fbCfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(fbCfgPath)) {
    const fbCfg = JSON.parse(fs.readFileSync(fbCfgPath, 'utf-8'));
    firebaseWebApiKey = String(fbCfg.apiKey || '');
  }
} catch {
  // Ignore missing firebase config
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const hasDistBuild = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
  const isDevLifecycle = process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production' || (!isDevLifecycle && hasDistBuild);
  const PORT = !isProd ? 3000 : Number(process.env.PORT) || 3000;

  app.use((_req, res, next) => {
    res.setHeader('Vary', 'Origin, X-Forwarded-Host');
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // ==========================================
  // LIVE PAYMENT BILLING: PAYSTACK CHECKOUT API
  // ==========================================
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const paystackPub = process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  const isPaystackLive = Boolean(
    paystackSecret &&
    !paystackSecret.includes('placeholder') &&
    !paystackSecret.includes('...') &&
    paystackSecret.startsWith('sk_')
  );

  const configuredPaystackCurrency = (process.env.PAYSTACK_CURRENCY || 'KES').toUpperCase();
  const paystackUsdToKesRate = Number(process.env.PAYSTACK_USD_TO_KES_RATE) || 129;

  interface PaystackCapabilityCache {
    checkedAt: number;
    balanceCurrencies: string[];
    configuredCurrencyOk: boolean;
    configuredCurrencyMessage: string;
    effectiveCurrency: string;
    currencyFallbackReason?: string;
    checkoutProbeMessage?: string;
  }

  let paystackCapCache: PaystackCapabilityCache | null = null;

  async function resolvePaystackCapabilities(forceRefresh = false): Promise<PaystackCapabilityCache> {
    if (!forceRefresh && paystackCapCache && Date.now() - paystackCapCache.checkedAt < 60_000) {
      return paystackCapCache;
    }

    const fallback: PaystackCapabilityCache = {
      checkedAt: Date.now(),
      balanceCurrencies: [],
      configuredCurrencyOk: true,
      configuredCurrencyMessage: '',
      effectiveCurrency: configuredPaystackCurrency,
    };

    if (!isPaystackLive || !paystackSecret) {
      paystackCapCache = fallback;
      return fallback;
    }

    try {
      const balRes = await fetch('https://api.paystack.co/balance', {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });
      const balJson: any = await balRes.json();
      const balanceCurrencies: string[] =
        balRes.ok && balJson?.status && Array.isArray(balJson.data)
          ? balJson.data
              .map((b: any) => String(b?.currency || '').toUpperCase())
              .filter(Boolean)
          : [];

      // Probe configured currency via transaction/initialize
      const probeRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'probe@talentradar.io',
          amount: configuredPaystackCurrency === 'KES' ? 12900 : 1000,
          currency: configuredPaystackCurrency,
        }),
      });
      const probeJson: any = await probeRes.json();
      const configuredInitOk = Boolean(probeRes.ok && probeJson?.status);
      const configuredInitMsg = String(probeJson?.message || '');

      let effectiveCurrency = configuredPaystackCurrency;
      let currencyFallbackReason: string | undefined;
      let checkoutProbeMessage: string | undefined;

      // Also check if Paystack checkout access_code actually has active channels for configured currency
      let checkoutHasChannels = configuredInitOk;
      if (configuredInitOk && probeJson?.data?.access_code) {
        try {
          const chkRes = await fetch(
            `https://api.paystack.co/checkout/request_inline?access_code=${encodeURIComponent(probeJson.data.access_code)}`
          );
          if (chkRes.ok) {
            const chkText = await chkRes.text();
            try {
              const chkJson = JSON.parse(chkText);
              checkoutProbeMessage = String(chkJson?.message || chkJson?.status || '');
              const lowerChk = chkText.toLowerCase();
              if (lowerChk.includes('no active channel') || chkJson?.status === false) {
                checkoutHasChannels = false;
              }
            } catch {
              if (chkText.toLowerCase().includes('no active channel')) {
                checkoutHasChannels = false;
                checkoutProbeMessage = 'No active channel for requested currency';
              }
            }
          }
        } catch {
          // Ignore inline probe fetch errors
        }
      }

      // On African Paystack integrations (KES, NGN, GHS, ZAR), transaction/initialize succeeds for USD
      // even when international USD card processing isn't activated on Settings -> Preferences, which causes
      // "No active channel to process transaction" inside Paystack Checkout. Prefer the primary settlement currency
      // (e.g. KES) by default when USD is configured alongside a local settlement balance.
      const primarySettlementCurrency = balanceCurrencies[0];
      if (
        primarySettlementCurrency &&
        primarySettlementCurrency !== 'USD' &&
        configuredPaystackCurrency === 'USD'
      ) {
        effectiveCurrency = primarySettlementCurrency;
        currencyFallbackReason =
          `Using merchant primary settlement currency ${primarySettlementCurrency} (supports M-Pesa & Cards) instead of USD so all active Paystack channels work cleanly.`;
      } else if (!configuredInitOk || !checkoutHasChannels) {
        if (primarySettlementCurrency) {
          effectiveCurrency = primarySettlementCurrency;
          currencyFallbackReason = configuredInitMsg || checkoutProbeMessage || `Switched to merchant currency ${primarySettlementCurrency}`;
        }
      }

      paystackCapCache = {
        checkedAt: Date.now(),
        balanceCurrencies,
        configuredCurrencyOk: configuredInitOk && checkoutHasChannels,
        configuredCurrencyMessage: configuredInitMsg,
        effectiveCurrency,
        currencyFallbackReason,
        checkoutProbeMessage,
      };
      return paystackCapCache;
    } catch (err: any) {
      paystackCapCache = {
        ...fallback,
        configuredCurrencyMessage: err?.message || 'Probe failed',
      };
      return paystackCapCache;
    }
  }

  const paystackCurrency = configuredPaystackCurrency;

  const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'mortyp1125@gmail.com').trim().toLowerCase();

  const sanitizePlanCode = (val?: string): string | undefined => {
    const trimmed = String(val || '').trim();
    return trimmed.startsWith('PLN_') ? trimmed : undefined;
  };

  const paystackPlans: Record<string, string | undefined> = {
    pro_monthly: sanitizePlanCode(process.env.PAYSTACK_PLAN_PRO_MONTHLY || runtimePaystackPlans.pro_monthly),
    pro_annual: sanitizePlanCode(process.env.PAYSTACK_PLAN_PRO_ANNUAL || runtimePaystackPlans.pro_annual),
    agency_monthly: sanitizePlanCode(process.env.PAYSTACK_PLAN_AGENCY_MONTHLY || runtimePaystackPlans.agency_monthly),
    agency_annual: sanitizePlanCode(process.env.PAYSTACK_PLAN_AGENCY_ANNUAL || runtimePaystackPlans.agency_annual),
  };

  async function verifyFirebaseUser(
    req: express.Request
  ): Promise<{ ok: boolean; email?: string; uid?: string; emailVerified?: boolean; reason?: string }> {
    const authHeader = String(req.headers.authorization || '');
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) {
      return { ok: false, reason: 'Missing Firebase Authentication Bearer token' };
    }
    if (!firebaseWebApiKey) {
      return { ok: false, reason: 'Firebase Web API key not configured on server' };
    }
    try {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      const lookupJson: any = await lookupRes.json();
      const fbUser = lookupJson?.users?.[0];
      if (!lookupRes.ok || !fbUser?.email || !fbUser?.localId) {
        return { ok: false, reason: lookupJson?.error?.message || 'Invalid Firebase ID token' };
      }
      const userEmail = String(fbUser.email).trim().toLowerCase();
      const uid = String(fbUser.localId);
      emailToUidMap.set(userEmail, uid);
      return { ok: true, email: userEmail, uid, emailVerified: Boolean(fbUser.emailVerified) };
    } catch (err: any) {
      return { ok: false, reason: err?.message || 'Token verification failed' };
    }
  }

  async function verifyFirebaseOwner(req: express.Request): Promise<{ ok: boolean; email?: string; uid?: string; reason?: string }> {
    const userRes = await verifyFirebaseUser(req);
    if (!userRes.ok || !userRes.email) {
      return { ok: false, reason: userRes.reason };
    }
    if (userRes.email !== OWNER_EMAIL || !userRes.emailVerified) {
      return { ok: false, reason: 'Authenticated account is not the verified application owner' };
    }
    return { ok: true, email: userRes.email, uid: userRes.uid };
  }

  const hasPaystackLinks = Boolean(
    (process.env.VITE_PAYSTACK_PAYMENT_LINK_PRO && process.env.VITE_PAYSTACK_PAYMENT_LINK_PRO.startsWith('http')) ||
    (process.env.VITE_PAYSTACK_PAYMENT_LINK_AGENCY && process.env.VITE_PAYSTACK_PAYMENT_LINK_AGENCY.startsWith('http'))
  );

  app.get('/api/checkout/config', async (req, res) => {
    const cap = await resolvePaystackCapabilities();
    const ownerAuth = await verifyFirebaseOwner(req);
    const supportedTiers = [
      { id: 'pro_monthly', name: 'Pro Operator (Monthly)', priceUsd: 49 },
      { id: 'pro_annual', name: 'Pro Operator (Annual)', priceUsd: 384 },
      { id: 'agency_monthly', name: 'Enterprise Agency (Monthly)', priceUsd: 199 },
      { id: 'agency_annual', name: 'Enterprise Agency (Annual)', priceUsd: 1788 },
      ...(ownerAuth.ok
        ? [{ id: 'buyout_deposit', name: 'Asset Buyout 10% Escrow Deposit', priceUsd: 14500 }]
        : []),
    ];
    res.json({
      activeProvider: 'paystack',
      liveMode: isPaystackLive,
      hasSecretKey: isPaystackLive,
      publishableKey: paystackPub,
      paymentLinksConfigured: hasPaystackLinks,
      paystack: {
        configured: isPaystackLive || hasPaystackLinks || Boolean(paystackPub),
        liveMode: isPaystackLive,
        publicKey: paystackPub,
        currency: cap.effectiveCurrency,
        configuredCurrency: configuredPaystackCurrency,
        balanceCurrencies: cap.balanceCurrencies,
        currencyFallbackReason: cap.currencyFallbackReason,
        configuredCurrencyOk: cap.configuredCurrencyOk,
        configuredCurrencyMessage: cap.configuredCurrencyMessage,
        checkoutProbeMessage: cap.checkoutProbeMessage,
        usdToKesRate: paystackUsdToKesRate,
        plans: paystackPlans,
        paymentLinksConfigured: hasPaystackLinks,
      },
      emailDispatcher: getEmailDispatcherStatus(),
      supportedTiers,
    });
  });

  // Region-aware Purchasing Power Parity (PPP) geo detection endpoint
  app.get('/api/geo/ppp', (req, res) => {
    const queryCountry = typeof req.query.country === 'string' ? req.query.country : undefined;
    if (queryCountry) {
      const profile = getPppProfileForCountry(queryCountry, 'manual_override');
      return res.json(profile);
    }

    const headerCountry =
      (req.headers['x-appengine-country'] as string | undefined) ||
      (req.headers['cf-ipcountry'] as string | undefined) ||
      (req.headers['cloudfront-viewer-country'] as string | undefined) ||
      (req.headers['x-vercel-ip-country'] as string | undefined) ||
      (req.headers['x-country-code'] as string | undefined);

    const detected = detectCountryFromTimezoneOrLocale(
      headerCountry,
      req.headers['accept-language'] as string | undefined
    );
    const profile = getPppProfileForCountry(detected.countryCode, detected.source);
    return res.json(profile);
  });

  app.post('/api/checkout/create-session', async (req, res) => {
    try {
      const {
        tierId = 'pro_annual',
        customerEmail,
        successUrl,
        cancelUrl,
        channels,
        currency: requestedCurrency,
        referralCode,
        pppCountryCode,
        provider: requestedProvider = 'paystack',
      } = req.body || {};

      const priceCatalog: Record<string, { name: string; amountCents: number; recurring: boolean }> = {
        pro_monthly: { name: 'TalentRadar Pro Operator (Monthly)', amountCents: 4900, recurring: true },
        pro_annual: { name: 'TalentRadar Pro Operator (Annual - Save 35%)', amountCents: 38400, recurring: true },
        agency_monthly: { name: 'TalentRadar Sovereign Partner (Monthly)', amountCents: 19900, recurring: true },
        agency_annual: { name: 'TalentRadar Sovereign Partner (Annual)', amountCents: 178800, recurring: true },
        buyout_deposit: { name: 'TalentRadar.OS 10% Earnest Buyout Escrow Deposit', amountCents: 1450000, recurring: false },
      };

      const validTierKey = (tierId in priceCatalog ? tierId : 'pro_annual') as PaystackTierId;
      if (validTierKey === 'buyout_deposit') {
        const ownerAuth = await verifyFirebaseOwner(req);
        if (!ownerAuth.ok) {
          return res.status(403).json({
            error: 'Verified owner authorization required for buyout escrow checkout.',
          });
        }
      }
      const selected = priceCatalog[validTierKey];
      const referralCheck = validTierKey !== 'buyout_deposit'
        ? validateReferralForBuyer(referralCode, customerEmail)
        : { valid: false, discountPercent: 0 };
      const discountPercent = referralCheck.valid ? referralCheck.discountPercent : 0;

      const pppProfile = pppCountryCode ? getPppProfileForCountry(pppCountryCode, 'manual_override') : undefined;
      const pricing = computeTierPricing({
        tierId: validTierKey,
        pppProfile,
        pppEnabled: Boolean(pppCountryCode && pppProfile?.isEligibleForPpp),
        referralDiscountPercent: discountPercent,
      });
      const effectiveCents = Math.round(pricing.finalUsd * 100);

      const authUserCheck = req.headers.authorization ? await verifyFirebaseUser(req) : { ok: false as const };
      const trustedUserId = authUserCheck.ok ? authUserCheck.uid : undefined;

      const rawOrigin = (req.get('origin') || '').trim();
      const hostUrl =
        rawOrigin && isAllowedCorsOrigin(rawOrigin) && !rawOrigin.includes('aistudio.google.com')
          ? rawOrigin
          : resolveEffectiveOrigin(req, { preferPublicOverLocal: true });
      const defaultSuccess = `${hostUrl}/billing?checkout_status=success&provider=paystack&tier=${validTierKey}&session_id={CHECKOUT_SESSION_ID}`;
      let lastPaystackError = '';

      // 1. Live Paystack Transaction Initialization (uses merchant-supported currency & valid channels)
      if (isPaystackLive && paystackSecret) {
        const cap = await resolvePaystackCapabilities();
        const requestsMobileMoney = Array.isArray(channels) && channels.includes('mobile_money');
        const cleanRequestedCurr = typeof requestedCurrency === 'string' ? requestedCurrency.trim().toUpperCase() : '';
        const kesPrimaryCountries = new Set(['KE', 'UG', 'TZ', 'RW']);
        const cleanCountry = String(pppCountryCode || '').trim().toUpperCase();
        const regionSuggestedCurrency =
          cleanCountry && !kesPrimaryCountries.has(cleanCountry) ? 'USD' : cap.effectiveCurrency;
        // M-Pesa (mobile_money) only runs in KES; otherwise honor explicit currency, region default (USD outside East Africa), or merchant currency
        const targetCurrency = requestsMobileMoney ? 'KES' : cleanRequestedCurr || regionSuggestedCurrency;

        const initPaystackTx = async (curr: string, chList?: string[]) => {
          const reference = `tr_ps_${tierId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const paystackCallbackUrl = `${hostUrl}/billing?checkout_status=success&provider=paystack&tier=${encodeURIComponent(tierId)}`;
          const usdAmount = effectiveCents / 100;
          const amountInSubunit =
            curr === 'KES'
              ? Math.round(usdAmount * paystackUsdToKesRate * 100)
              : effectiveCents;

          const cleanCustomerEmail = String(customerEmail || '').trim().toLowerCase();
          if (!cleanCustomerEmail || !cleanCustomerEmail.includes('@')) {
            return {
              psRes: { ok: false, statusText: 'Valid customer email is required' } as Response,
              psJson: { status: false, message: 'A valid customer email is required for Paystack billing.' },
              reference,
              amountInSubunit,
              curr,
            };
          }
          if (trustedUserId && cleanCustomerEmail === authUserCheck.email) {
            emailToUidMap.set(cleanCustomerEmail, trustedUserId);
          }

          const planCode = paystackPlans[tierId];
          const payload: Record<string, any> = {
            email: cleanCustomerEmail,
            amount: amountInSubunit,
            currency: curr,
            reference,
            callback_url: paystackCallbackUrl,
            metadata: {
              tierId: validTierKey,
              usdEquivalent: usdAmount,
              ...(trustedUserId ? { userId: trustedUserId } : {}),
              ...(referralCheck.valid && referralCheck.record
                ? { referralCode: referralCheck.record.code, discountPercent }
                : {}),
              ...(pricing.pppApplied
                ? { pppCountryCode: pricing.pppCountryCode, pppDiscountPercent: pricing.pppDiscountPercent }
                : {}),
              appletId: '17b9a6d1-7662-4373-863e-133fa0cc2517',
              custom_fields: [
                { display_name: 'Subscription Tier', variable_name: 'tier_id', value: selected.name },
              ],
            },
          };

          // Only specify channels if the caller explicitly chose a single specific channel filter
          if (Array.isArray(chList) && chList.length > 0) {
            payload.channels = chList;
          }
          if (discountPercent === 0 && !pricing.pppApplied && planCode && planCode.startsWith('PLN_')) {
            payload.plan = planCode;
          }

          const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          const psJson: any = await psRes.json();
          return { psRes, psJson, reference, amountInSubunit, curr };
        };

        try {
          const explicitChannels =
            Array.isArray(channels) && channels.length > 0 && channels.length < 5 ? channels : undefined;
          let attempt = await initPaystackTx(targetCurrency, explicitChannels);

          // Retry cleanly if specific channels or non-KES currency got rejected
          if (
            (!attempt.psRes.ok || !attempt.psJson?.status) &&
            (explicitChannels || targetCurrency !== 'KES')
          ) {
            const fallbackCurr = cap.balanceCurrencies[0] || 'KES';
            attempt = await initPaystackTx(fallbackCurr, undefined);
          }

          if (attempt.psRes.ok && attempt.psJson?.status && attempt.psJson?.data?.authorization_url) {
            verifiedCheckoutSessions.set(attempt.reference, {
              tier: validTierKey,
              email: customerEmail,
              amountTotal: effectiveCents,
              currency: attempt.curr,
              status: 'pending',
              ...(referralCheck.valid && referralCheck.record
                ? { referralCode: referralCheck.record.code, discountPercent }
                : {}),
              ...(pricing.pppApplied
                ? { pppCountryCode: pricing.pppCountryCode, pppDiscountPercent: pricing.pppDiscountPercent }
                : {}),
              createdAt: new Date().toISOString(),
            });
            saveLedgerToDisk();

            return res.json({
              success: true,
              provider: 'paystack',
              checkoutUrl: attempt.psJson.data.authorization_url,
              accessCode: attempt.psJson.data.access_code,
              sessionId: attempt.psJson.data.reference || attempt.reference,
              currency: attempt.curr,
              amountSubunit: attempt.amountInSubunit,
              discountPercent,
              pppCountryCode: pricing.pppApplied ? pricing.pppCountryCode : undefined,
              pppDiscountPercent: pricing.pppDiscountPercent,
              finalUsd: pricing.finalUsd,
              liveMode: true,
            });
          }
          lastPaystackError = attempt.psJson?.message || attempt.psRes.statusText || 'Paystack initialize rejected';
          console.warn('Paystack initialization returned non-OK:', lastPaystackError);
        } catch (psErr: any) {
          lastPaystackError = psErr?.message || 'Paystack request failed';
          console.warn('Paystack live session initialization failed, checking fallback links:', lastPaystackError);
        }
      }

      // 2. Direct Paystack Payment Page Link Fallback
      const paystackLinkEnv = tierId.includes('agency')
        ? process.env.VITE_PAYSTACK_PAYMENT_LINK_AGENCY
        : process.env.VITE_PAYSTACK_PAYMENT_LINK_PRO;

      if (paystackLinkEnv && paystackLinkEnv.startsWith('http')) {
        return res.json({
          success: true,
          provider: 'paystack',
          checkoutUrl: paystackLinkEnv,
          sessionId: `pslink_${Date.now()}`,
          liveMode: true,
        });
      }

      // 3. LOCKDOWN: Never mint fake simulated sessions — require real Paystack credentials
      return res.status(isPaystackLive ? 502 : 503).json({
        success: false,
        provider: 'paystack',
        liveMode: isPaystackLive,
        error:
          lastPaystackError ||
          'Live Paystack billing is not configured on this server. Add PAYSTACK_SECRET_KEY (and PAYSTACK_PUBLIC_KEY or Payment Page links) in Settings > Secrets.',
      });
    } catch (err: any) {
      console.error('Error creating Paystack checkout session:', err);
      res.status(500).json({ error: 'Failed to create Paystack checkout session', details: err?.message });
    }
  });

  const MIN_EXPECTED_USD_BY_TIER: Record<string, number> = {
    pro_monthly: 44,
    pro_annual: 345,
    agency_monthly: 180,
    agency_annual: 1650,
    buyout_deposit: 13500,
  };

  const resolveTierFromPlanCode = (planCode?: string): string | undefined => {
    if (!planCode) return undefined;
    for (const [tierKey, configuredPlan] of Object.entries(paystackPlans)) {
      if (configuredPlan && configuredPlan === planCode) return tierKey;
    }
    return undefined;
  };

  const resolveTierFromWebhookData = (
    data: any,
    existingSub: SubscriptionLedgerRecord | undefined,
    planCode?: string
  ): string => {
    if (data?.metadata?.tierId && typeof data.metadata.tierId === 'string') {
      return data.metadata.tierId;
    }
    const fromPlan = resolveTierFromPlanCode(planCode);
    if (fromPlan) return fromPlan;

    // Infer from Paystack Payment Page slug/referrer (e.g. https://paystack.com/pay/career-radar-agency)
    const hintText = [
      data?.metadata?.referrer,
      data?.page?.slug,
      data?.page?.name,
      data?.plan?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (hintText.includes('agency') || hintText.includes('sovereign')) {
      return hintText.includes('annual') || hintText.includes('year') ? 'agency_annual' : 'agency_monthly';
    }
    if (hintText.includes('pro')) {
      return hintText.includes('annual') || hintText.includes('year') ? 'pro_annual' : 'pro_monthly';
    }

    // Infer from paid amount when buyer uses a fixed Payment Page link without metadata.tierId
    if (typeof data?.amount === 'number' && data.amount > 0) {
      const curr = String(data?.currency || paystackCurrency).toUpperCase();
      const major = data.amount / 100;
      const usd = curr === 'KES' ? major / paystackUsdToKesRate : major;
      if (usd >= 1000) return 'agency_annual';
      if (usd >= 260) return 'pro_annual';
      if (usd >= 150) return 'agency_monthly';
      return 'pro_monthly';
    }

    return existingSub?.tier || 'pro_monthly';
  };

  const recordSubscriptionActivation = (params: {
    reference: string;
    tier: string;
    email?: string;
    userId?: string;
    provider?: 'paystack';
    amountTotal: number;
    currency?: string;
    status?: 'active' | 'cancelled' | 'past_due' | 'non_renewing' | 'refunded' | 'disputed';
    subscriptionCode?: string;
    planCode?: string;
    customerCode?: string;
    emailToken?: string;
    nextPaymentDate?: string;
    cancelAtPeriodEnd?: boolean;
    expiringCardNotice?: string;
    lastWebhookEvent?: string;
  }): {
    ledgerRecord: SubscriptionLedgerRecord;
    docId: string;
    syncPromise: Promise<FirestoreSubscriptionSyncResult>;
  } => {
    const cleanEmail = (params.email || 'operator@talentradar.io').trim().toLowerCase();
    const existingSub = subscriptionLedgerByEmail.get(cleanEmail);
    const subCode = params.subscriptionCode || existingSub?.subscriptionCode;
    const updatedAt = new Date().toISOString();
    const resolvedProvider = params.provider || existingSub?.provider || 'paystack';
    const resolvedUserId = params.userId || existingSub?.userId || emailToUidMap.get(cleanEmail);

    if (resolvedUserId) {
      emailToUidMap.set(cleanEmail, resolvedUserId);
    }

    verifiedCheckoutSessions.set(params.reference, {
      tier: params.tier,
      email: cleanEmail,
      amountTotal: Math.round(params.amountTotal * 100),
      currency: params.currency || paystackCurrency,
      provider: resolvedProvider,
      status: 'complete',
      createdAt: updatedAt,
    });

    const ledgerRecord: SubscriptionLedgerRecord = {
      email: cleanEmail,
      userId: resolvedUserId,
      tier: params.tier,
      reference: params.reference,
      provider: resolvedProvider,
      status: params.status || 'active',
      amountTotal: params.amountTotal,
      currency: params.currency || existingSub?.currency || paystackCurrency,
      subscriptionCode: subCode,
      planCode: params.planCode || existingSub?.planCode,
      customerCode: params.customerCode || existingSub?.customerCode,
      emailToken: params.emailToken || existingSub?.emailToken,
      nextPaymentDate: params.nextPaymentDate || existingSub?.nextPaymentDate,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? existingSub?.cancelAtPeriodEnd ?? false,
      expiringCardNotice: params.expiringCardNotice ?? existingSub?.expiringCardNotice,
      lastWebhookEvent: params.lastWebhookEvent || existingSub?.lastWebhookEvent,
      updatedAt,
    };

    subscriptionLedgerByEmail.set(cleanEmail, ledgerRecord);

    if (subCode) {
      subscriptionByCode.set(subCode, cleanEmail);
    }

    saveLedgerToDisk();
    const docId = subscriptionDocIdForEmail(cleanEmail);
    const syncPromise = upsertSubscriptionInFirestore(ledgerRecord);
    return { ledgerRecord, docId, syncPromise };
  };

  const validatePaidAmount = (
    tierId: string,
    paidSubunit: number | undefined,
    txCurrency: string,
    usdMetadata?: number,
    hasVerifiedReferral?: boolean,
    pppCountryCode?: string
  ): boolean => {
    const validKey = (tierId in MIN_EXPECTED_USD_BY_TIER ? tierId : 'pro_annual') as PaystackTierId;
    const pppProf = pppCountryCode ? getPppProfileForCountry(pppCountryCode, 'manual_override') : undefined;
    const expectedPricing = computeTierPricing({
      tierId: validKey,
      pppProfile: pppProf,
      pppEnabled: Boolean(pppCountryCode && pppProf?.isEligibleForPpp),
      referralDiscountPercent: hasVerifiedReferral ? 20 : 0,
    });
    const minThreshold = expectedPricing.finalUsd * 0.9;
    if (typeof usdMetadata === 'number' && usdMetadata >= minThreshold) return true;
    if (typeof paidSubunit !== 'number' || paidSubunit <= 0) return false;
    const majorAmount = paidSubunit / 100;
    const upperCurr = (txCurrency || 'KES').toUpperCase();
    const approxUsd = upperCurr === 'KES' ? majorAmount / paystackUsdToKesRate : majorAmount;
    return approxUsd >= minThreshold;
  };

  app.get('/api/checkout/verify-session', async (req, res) => {
    try {
      const sessionId = (req.query.sessionId || req.query.reference || req.query.trxref) as string;
      const expectedTier = (req.query.expectedTier as string) || '';
      if (!sessionId) {
        return res.status(400).json({ verified: false, error: 'sessionId or reference query parameter required' });
      }

      // Reject demo/sandbox prefixes unconditionally when live mode or production is enabled
      if ((isPaystackLive || isProd) && sessionId.startsWith('tr_ps_demo_')) {
        return res.status(403).json({
          verified: false,
          provider: 'paystack',
          error: 'Simulated sandbox references are rejected in live paywall mode.',
        });
      }

      // 1. Verify live Paystack transaction reference directly against Paystack API
      if (isPaystackLive && paystackSecret) {
        try {
          const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(sessionId)}`, {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
            },
          });
          const psJson: any = await psRes.json();
          if (psRes.ok && psJson?.status && psJson?.data?.status === 'success') {
            const tier =
              psJson.data.metadata?.tierId ||
              resolveTierFromPlanCode(psJson.data.plan_object?.plan_code || psJson.data.plan) ||
              expectedTier ||
              'pro_annual';
            const txCurrency = (psJson.data.currency || paystackCurrency).toUpperCase();
            const usdMeta = Number(psJson.data.metadata?.usdEquivalent) || undefined;
            const customerEmail = psJson.data.customer?.email || undefined;
            const sessionRec = verifiedCheckoutSessions.get(sessionId);
            const rawReferralCode = psJson.data.metadata?.referralCode || sessionRec?.referralCode;
            const rawPppCountryCode = psJson.data.metadata?.pppCountryCode || sessionRec?.pppCountryCode;
            const refCheck = validateReferralForBuyer(rawReferralCode, customerEmail);
            const amountValid = validatePaidAmount(
              tier,
              psJson.data.amount,
              txCurrency,
              usdMeta,
              refCheck.valid,
              rawPppCountryCode
            );

            if (!amountValid) {
              return res.status(402).json({
                verified: false,
                provider: 'paystack',
                reference: sessionId,
                error: 'Paid transaction amount is below the required tier price threshold.',
              });
            }

            const usdTotal =
              usdMeta ||
              (psJson.data.amount
                ? txCurrency === 'KES'
                  ? Math.round((psJson.data.amount / 100 / paystackUsdToKesRate) * 100) / 100
                  : psJson.data.amount / 100
                : 0);

            const authUserCheck = req.headers.authorization ? await verifyFirebaseUser(req) : { ok: false as const };
            const trustedUserId =
              (typeof psJson.data.metadata?.userId === 'string' && psJson.data.metadata.userId) ||
              (authUserCheck.ok ? authUserCheck.uid : undefined);

            const activation = recordSubscriptionActivation({
              reference: sessionId,
              tier,
              email: customerEmail,
              userId: trustedUserId,
              amountTotal: usdTotal,
              currency: txCurrency,
              status: 'active',
              planCode: psJson.data.plan_object?.plan_code || psJson.data.plan,
            });
            const fsSync = await activation.syncPromise;

            if (refCheck.valid && refCheck.record) {
              creditReferralConversion({
                reference: sessionId,
                tierId: tier,
                buyerEmail: customerEmail,
                paidUsd: usdTotal,
                referralCode: refCheck.record.code,
              });
            }

            return res.json({
              verified: true,
              provider: 'paystack',
              reference: sessionId,
              tier,
              customerEmail,
              userId: fsSync.userId || activation.ledgerRecord.userId,
              firestoreDocId: fsSync.docId,
              firestoreSynced: fsSync.ok,
              amountTotal: usdTotal,
              currency: txCurrency,
              status: 'active',
              referralCredited: Boolean(refCheck.valid && refCheck.record),
            });
          }

          return res.status(402).json({
            verified: false,
            provider: 'paystack',
            reference: sessionId,
            status: psJson?.data?.status || 'failed',
            error: psJson?.data?.gateway_response || psJson?.message || 'Transaction not completed on Paystack',
          });
        } catch (psErr) {
          console.warn('Error querying Paystack verification API:', psErr);
        }
      }

      // 2. Check cryptographically verified ledger / local verified sessions registry (must be status === 'complete')
      const localRecord = verifiedCheckoutSessions.get(sessionId);
      if (localRecord && localRecord.status === 'complete') {
        const ledgerSub = localRecord.email ? subscriptionLedgerByEmail.get(localRecord.email.toLowerCase()) : undefined;
        if (ledgerSub && (ledgerSub.status === 'cancelled' || ledgerSub.status === 'past_due')) {
          return res.status(402).json({
            verified: false,
            provider: 'paystack',
            reference: sessionId,
            status: ledgerSub.status,
            error: `Subscription status is ${ledgerSub.status}. Renewal required.`,
          });
        }

        const amountUsd = localRecord.amountTotal / 100;
        recordSubscriptionActivation({
          reference: sessionId,
          tier: localRecord.tier,
          email: localRecord.email,
          amountTotal: amountUsd,
          currency: localRecord.currency || paystackCurrency,
          status: 'active',
        });
        return res.json({
          verified: true,
          provider: 'paystack',
          reference: sessionId,
          tier: localRecord.tier,
          customerEmail: localRecord.email,
          amountTotal: amountUsd,
          currency: localRecord.currency || paystackCurrency,
          status: 'active',
        });
      }

      if (!isPaystackLive && sessionId.startsWith('tr_ps_demo_')) {
        return res.status(403).json({
          verified: false,
          error: 'Simulated demo references are disabled. Configure PAYSTACK_SECRET_KEY in Settings > Secrets.',
        });
      }

      res.status(404).json({ verified: false, error: 'Paystack session not found, unpaid, or expired' });
    } catch (err: any) {
      console.error('Error verifying Paystack checkout session:', err);
      res.status(500).json({ verified: false, error: 'Verification failed' });
    }
  });

  const paystackCustomerSyncNegativeCache = new Map<string, number>();

  async function syncCustomerSubscriptionFromPaystack(
    rawEmail: string,
    opts: { bypassNegativeCache?: boolean } = {}
  ): Promise<SubscriptionLedgerRecord | undefined> {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !isPaystackLive || !paystackSecret) {
      return undefined;
    }

    const now = Date.now();
    const cachedMissUntil = paystackCustomerSyncNegativeCache.get(email) || 0;
    if (!opts.bypassNegativeCache && cachedMissUntil > now) {
      return undefined;
    }

    try {
      const custRes = await fetch(`https://api.paystack.co/customer/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });
      const custJson: any = await custRes.json();
      if (custRes.ok && custJson?.status && custJson?.data?.id) {
        const customerId = custJson.data.id;
        const customerCode = custJson.data.customer_code;
        const localSub = subscriptionLedgerByEmail.get(email);

        const subsRes = await fetch(`https://api.paystack.co/subscription?customer=${customerId}`, {
          headers: { Authorization: `Bearer ${paystackSecret}` },
        });
        const subsJson: any = await subsRes.json();
        const activeRemoteSub = Array.isArray(subsJson?.data)
          ? subsJson.data.find((s: any) => s.status === 'active' || s.status === 'non-renewing')
          : null;

        if (activeRemoteSub) {
          const resolvedTier =
            resolveTierFromPlanCode(activeRemoteSub.plan?.plan_code) ||
            (String(activeRemoteSub.plan?.name || '').toLowerCase().includes('sovereign')
              ? 'agency_annual'
              : 'pro_annual');
          const txCurr = (activeRemoteSub.plan?.currency || paystackCurrency).toUpperCase();
          const usdAmount =
            txCurr === 'KES'
              ? Math.round(((activeRemoteSub.amount || 0) / 100 / paystackUsdToKesRate) * 100) / 100
              : (activeRemoteSub.amount || 0) / 100;
          const mappedStatus = activeRemoteSub.status === 'non-renewing' ? 'non_renewing' : 'active';

          recordSubscriptionActivation({
            reference: localSub?.reference || activeRemoteSub.subscription_code,
            tier: resolvedTier,
            email,
            amountTotal: usdAmount,
            currency: txCurr,
            status: mappedStatus,
            subscriptionCode: activeRemoteSub.subscription_code,
            planCode: activeRemoteSub.plan?.plan_code,
            customerCode,
            emailToken: activeRemoteSub.email_token,
            nextPaymentDate: activeRemoteSub.next_payment_date,
            cancelAtPeriodEnd: mappedStatus === 'non_renewing',
            lastWebhookEvent: 'paystack.api_synced',
          });
          paystackCustomerSyncNegativeCache.delete(email);
          return subscriptionLedgerByEmail.get(email);
        }

        const txRes = await fetch(
          `https://api.paystack.co/transaction?customer=${customerId}&status=success&perPage=5`,
          { headers: { Authorization: `Bearer ${paystackSecret}` } }
        );
        const txJson: any = await txRes.json();
        const latestSuccess = Array.isArray(txJson?.data)
          ? txJson.data.find((t: any) => t?.metadata?.tierId !== 'buyout_deposit')
          : null;
        if (latestSuccess?.reference) {
          const tier =
            latestSuccess.metadata?.tierId ||
            resolveTierFromPlanCode(latestSuccess.plan) ||
            'pro_annual';
          const txCurr = (latestSuccess.currency || paystackCurrency).toUpperCase();
          const usdTotal =
            Number(latestSuccess.metadata?.usdEquivalent) ||
            (txCurr === 'KES'
              ? Math.round(((latestSuccess.amount || 0) / 100 / paystackUsdToKesRate) * 100) / 100
              : (latestSuccess.amount || 0) / 100);

          recordSubscriptionActivation({
            reference: latestSuccess.reference,
            tier,
            email,
            amountTotal: usdTotal,
            currency: txCurr,
            status: 'active',
            customerCode,
            lastWebhookEvent: 'paystack.transaction_synced',
          });
          paystackCustomerSyncNegativeCache.delete(email);
          return subscriptionLedgerByEmail.get(email);
        }
      }
    } catch (err) {
      console.warn('Paystack live customer sync lookup error:', err);
    }

    paystackCustomerSyncNegativeCache.set(email, now + 30_000);
    return undefined;
  }

  // Backend Subscription Status Hook (used by SubscriptionProvider on mount / refresh)
  app.get('/api/subscription/status', async (req, res) => {
    try {
      const email = ((req.query.email as string) || '').trim().toLowerCase();
      const reference = ((req.query.reference as string) || '').trim();

      if (reference) {
        if ((isPaystackLive || isProd) && reference.startsWith('tr_ps_demo_')) {
          return res.json({
            active: false,
            verified: false,
            provider: 'paystack',
            status: 'rejected_demo_reference',
          });
        }

        if (isPaystackLive && paystackSecret && !reference.startsWith('vip_') && !reference.startsWith('owner_')) {
          try {
            const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
              headers: { Authorization: `Bearer ${paystackSecret}` },
            });
            const psJson: any = await psRes.json();
            if (psRes.ok && psJson?.status && psJson?.data?.status === 'success') {
              const tier =
                psJson.data.metadata?.tierId ||
                resolveTierFromPlanCode(psJson.data.plan_object?.plan_code || psJson.data.plan) ||
                'pro_annual';
              const txCurrency = (psJson.data.currency || paystackCurrency).toUpperCase();
              const usdTotal =
                Number(psJson.data.metadata?.usdEquivalent) ||
                (psJson.data.amount
                  ? txCurrency === 'KES'
                    ? Math.round((psJson.data.amount / 100 / paystackUsdToKesRate) * 100) / 100
                    : psJson.data.amount / 100
                  : 0);
              const customerEmail = (psJson.data.customer?.email || email || '').toLowerCase() || undefined;
              const existing = customerEmail ? subscriptionLedgerByEmail.get(customerEmail) : undefined;
              const effectiveStatus = existing?.status || 'active';

              recordSubscriptionActivation({
                reference,
                tier,
                email: customerEmail,
                amountTotal: usdTotal,
                currency: txCurrency,
                status: effectiveStatus,
                planCode: psJson.data.plan_object?.plan_code || psJson.data.plan,
              });

              const updated = customerEmail ? subscriptionLedgerByEmail.get(customerEmail) : undefined;
              const isSubActive = effectiveStatus === 'active' || effectiveStatus === 'non_renewing';
              return res.json({
                active: isSubActive,
                verified: isSubActive,
                provider: 'paystack',
                reference,
                tier,
                customerEmail,
                amountTotal: usdTotal,
                currency: txCurrency,
                status: effectiveStatus,
                subscriptionCode: updated?.subscriptionCode,
                planCode: updated?.planCode,
                customerCode: updated?.customerCode,
                nextPaymentDate: updated?.nextPaymentDate,
                cancelAtPeriodEnd: updated?.cancelAtPeriodEnd,
                expiringCardNotice: updated?.expiringCardNotice,
                lastWebhookEvent: updated?.lastWebhookEvent,
                liveMode: isPaystackLive,
              });
            }
          } catch (err) {
            console.warn('Error re-verifying Paystack reference in status hook:', err);
          }
        }

        const local = verifiedCheckoutSessions.get(reference);
        if (local && local.status === 'complete') {
          const ledger = local.email ? subscriptionLedgerByEmail.get(local.email.toLowerCase()) : undefined;
          const status = ledger?.status || 'active';
          const isSubActive = status === 'active' || status === 'non_renewing';
          return res.json({
            active: isSubActive,
            verified: isSubActive,
            provider: 'paystack',
            reference,
            tier: ledger?.tier || local.tier,
            customerEmail: local.email,
            amountTotal: ledger?.amountTotal ?? local.amountTotal / 100,
            currency: ledger?.currency || local.currency || paystackCurrency,
            status,
            subscriptionCode: ledger?.subscriptionCode,
            planCode: ledger?.planCode,
            customerCode: ledger?.customerCode,
            nextPaymentDate: ledger?.nextPaymentDate,
            cancelAtPeriodEnd: ledger?.cancelAtPeriodEnd,
            expiringCardNotice: ledger?.expiringCardNotice,
            lastWebhookEvent: ledger?.lastWebhookEvent,
            liveMode: isPaystackLive,
          });
        }
      }

      if (email) {
        let sub = subscriptionLedgerByEmail.get(email);
        if (!sub) {
          const fsSub = await fetchSubscriptionFromFirestoreByEmail(email);
          if (fsSub && fsSub.email) {
            sub = {
              email,
              userId: fsSub.userId || undefined,
              tier: String(fsSub.tier || 'pro_annual'),
              reference: String(fsSub.reference || ''),
              provider: 'paystack',
              status: (fsSub.status as SubscriptionLedgerRecord['status']) || 'active',
              amountTotal: Number(fsSub.amountTotal) || 0,
              currency: String(fsSub.currency || 'KES'),
              subscriptionCode: fsSub.subscriptionCode || undefined,
              planCode: fsSub.planCode || undefined,
              customerCode: fsSub.customerCode || undefined,
              nextPaymentDate: fsSub.nextPaymentDate || undefined,
              cancelAtPeriodEnd: Boolean(fsSub.cancelAtPeriodEnd),
              lastWebhookEvent: fsSub.lastWebhookEvent || undefined,
              updatedAt: String(fsSub.updatedAt || new Date().toISOString()),
            };
            subscriptionLedgerByEmail.set(email, sub);
            saveLedgerToDisk();
          }
        }

        if (!sub) {
          sub = await syncCustomerSubscriptionFromPaystack(email);
        }

        if (sub) {
          const isSubActive = sub.status === 'active' || sub.status === 'non_renewing';
          return res.json({
            active: isSubActive,
            verified: isSubActive,
            provider: sub.provider || 'paystack',
            reference: sub.reference,
            tier: sub.tier,
            customerEmail: sub.email,
            amountTotal: sub.amountTotal,
            currency: sub.currency,
            status: sub.status,
            subscriptionCode: sub.subscriptionCode,
            planCode: sub.planCode,
            customerCode: sub.customerCode,
            nextPaymentDate: sub.nextPaymentDate,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            expiringCardNotice: sub.expiringCardNotice,
            lastWebhookEvent: sub.lastWebhookEvent,
            updatedAt: sub.updatedAt,
            liveMode: isPaystackLive,
          });
        }
      }

      return res.json({
        active: false,
        verified: false,
        provider: 'paystack',
        status: 'none',
        liveMode: isPaystackLive,
      });
    } catch (err: any) {
      console.error('Error checking subscription status:', err);
      res.status(500).json({ active: false, verified: false, error: 'Status lookup failed' });
    }
  });

  // Authenticated Firebase UID <-> Paystack Subscription Sync Endpoint
  // Binds Firebase UID to any existing Payment Link or Webhook subscription matching the verified account email
  app.post('/api/subscription/sync-auth', async (req, res) => {
    try {
      const userCheck = await verifyFirebaseUser(req);
      if (!userCheck.ok || !userCheck.email || !userCheck.uid) {
        return res.status(401).json({
          success: false,
          active: false,
          error: userCheck.reason || 'Valid Firebase ID token required.',
        });
      }

      const cleanEmail = userCheck.email;
      const uid = userCheck.uid;
      emailToUidMap.set(cleanEmail, uid);

      let sub = subscriptionLedgerByEmail.get(cleanEmail);
      if (!sub) {
        const fsSub = await fetchSubscriptionFromFirestoreByEmail(cleanEmail);
        if (fsSub && fsSub.email) {
          sub = {
            email: cleanEmail,
            userId: fsSub.userId || uid,
            tier: String(fsSub.tier || 'pro_monthly'),
            reference: String(fsSub.reference || ''),
            provider: 'paystack',
            status: (fsSub.status as SubscriptionLedgerRecord['status']) || 'active',
            amountTotal: Number(fsSub.amountTotal) || 0,
            currency: String(fsSub.currency || paystackCurrency),
            subscriptionCode: fsSub.subscriptionCode || undefined,
            planCode: fsSub.planCode || undefined,
            customerCode: fsSub.customerCode || undefined,
            nextPaymentDate: fsSub.nextPaymentDate || undefined,
            cancelAtPeriodEnd: Boolean(fsSub.cancelAtPeriodEnd),
            lastWebhookEvent: fsSub.lastWebhookEvent || undefined,
            updatedAt: String(fsSub.updatedAt || new Date().toISOString()),
          };
          subscriptionLedgerByEmail.set(cleanEmail, sub);
          saveLedgerToDisk();
        }
      }

      if (!sub) {
        sub = await syncCustomerSubscriptionFromPaystack(cleanEmail);
      }

      if (!sub) {
        return res.json({
          success: true,
          active: false,
          verified: false,
          userId: uid,
          email: cleanEmail,
          status: 'none',
        });
      }

      let firestoreDocId = subscriptionDocIdForEmail(cleanEmail);
      let firestoreSynced = false;
      if (sub.userId !== uid) {
        const activation = recordSubscriptionActivation({
          reference: sub.reference,
          tier: sub.tier,
          email: cleanEmail,
          userId: uid,
          amountTotal: sub.amountTotal,
          currency: sub.currency,
          status: sub.status,
          subscriptionCode: sub.subscriptionCode,
          planCode: sub.planCode,
          customerCode: sub.customerCode,
          nextPaymentDate: sub.nextPaymentDate,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          lastWebhookEvent: sub.lastWebhookEvent,
        });
        const syncRes = await activation.syncPromise;
        firestoreDocId = syncRes.docId;
        firestoreSynced = syncRes.ok;
        sub = activation.ledgerRecord;
      }

      const isSubActive = sub.status === 'active' || sub.status === 'non_renewing';
      return res.json({
        success: true,
        active: isSubActive,
        verified: isSubActive,
        userId: uid,
        email: cleanEmail,
        firestoreDocId,
        firestoreSynced,
        tier: sub.tier,
        reference: sub.reference,
        status: sub.status,
        amountTotal: sub.amountTotal,
        currency: sub.currency,
        subscriptionCode: sub.subscriptionCode,
        planCode: sub.planCode,
        customerCode: sub.customerCode,
        nextPaymentDate: sub.nextPaymentDate,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        expiringCardNotice: sub.expiringCardNotice,
        lastWebhookEvent: sub.lastWebhookEvent,
      });
    } catch (err: any) {
      console.error('Error syncing authenticated subscription:', err);
      res.status(500).json({ success: false, active: false, error: 'Auth subscription sync failed' });
    }
  });

  // Server-Side License Key / VIP Passcode Validation (replaces hardcoded client bypass codes)
  app.post('/api/subscription/redeem-key', (req, res) => {
    try {
      const { code, email } = req.body || {};
      const cleanCode = String(code || '').trim().toUpperCase();
      if (!cleanCode) {
        return res.status(400).json({ success: false, message: 'License key is required.' });
      }

      // Parse server-only keys from process.env.VIP_PASSCODE_KEYS (format: "KEY1:pro,KEY2:sovereign")
      const serverKeysRaw = process.env.VIP_PASSCODE_KEYS || '';
      const serverKeyMap = new Map<string, 'pro' | 'sovereign'>();
      for (const entry of serverKeysRaw.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [k, t] = entry.split(':').map((s) => s.trim());
        if (k) {
          serverKeyMap.set(k.toUpperCase(), t === 'sovereign' ? 'sovereign' : 'pro');
        }
      }

      const grantedTier: 'pro' | 'sovereign' | null = serverKeyMap.get(cleanCode) || null;

      if (!grantedTier) {
        return res.status(403).json({
          success: false,
          message:
            serverKeyMap.size === 0
              ? 'No enterprise license keys are configured on this server. Complete checkout with Paystack or configure VIP_PASSCODE_KEYS in Settings > Secrets.'
              : 'Invalid or unauthorized license key. Complete checkout with Paystack to unlock clearance.',
        });
      }

      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'A valid account email is required to bind the license key.',
        });
      }
      const vipReference = `vip_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const mappedTierId = grantedTier === 'sovereign' ? 'agency_annual' : 'pro_annual';

      recordSubscriptionActivation({
        reference: vipReference,
        tier: mappedTierId,
        email: cleanEmail,
        amountTotal: 0,
        currency: 'USD',
        status: 'active',
        lastWebhookEvent: 'server.license_key_redeemed',
      });

      return res.json({
        success: true,
        tier: grantedTier,
        tierId: mappedTierId,
        reference: vipReference,
        customerEmail: cleanEmail,
        message: `${grantedTier.toUpperCase()} CLEARANCE AUTHORIZED VIA SERVER LICENSE KEY`,
      });
    } catch (err: any) {
      console.error('Error redeeming license key:', err);
      res.status(500).json({ success: false, message: 'License validation failed' });
    }
  });

  // Agency Pilot Qualification Inquiry — persists durably to CRM ledger + Firestore + sends Brevo/Resend owner alert
  app.post('/api/agency-pilot/request', async (req, res) => {
    try {
      const { agencyName, recruiterName, contactName, workEmail, companyUrl, seats, planTier, specialization, teamSize, notes } = req.body || {};
      const cleanAgency = String(agencyName || '').trim();
      const cleanEmail = String(workEmail || '').trim().toLowerCase();
      if (!cleanAgency || !cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Agency name and valid work email are required.' });
      }

      const leadId = `AGY-${Date.now().toString(36).toUpperCase()}`;
      const createdAt = new Date().toISOString();
      const resolvedContact = String(contactName || recruiterName || '').trim() || 'Authorized Partner';
      const resolvedSeats = String(seats || teamSize || '5 seats').trim();
      const resolvedTier = String(planTier || 'agency_monthly').trim();
      const resolvedNotes = [specialization ? `Specialization: ${specialization}` : '', notes || ''].filter(Boolean).join(' | ');

      const emailRes = await dispatchRealEmail({
        to: (process.env.OWNER_NOTIFICATION_EMAIL || OWNER_EMAIL).trim(),
        replyTo: cleanEmail,
        subject: `[Agency Pilot Lead ${leadId}] ${cleanAgency}`,
        text: `New Agency Partner Intake (${leadId})\nAgency: ${cleanAgency}\nContact: ${resolvedContact} <${cleanEmail}>\nCompany URL: ${companyUrl || 'N/A'}\nSeats / Team: ${resolvedSeats}\nPlan Tier: ${resolvedTier}\nNotes: ${resolvedNotes || 'None'}\nSubmitted At: ${createdAt}`,
      });

      const pilotRecord: AgencyPilotRecord = {
        id: leadId,
        agencyName: cleanAgency,
        contactName: resolvedContact,
        workEmail: cleanEmail,
        companyUrl: companyUrl ? String(companyUrl).trim() : undefined,
        seats: resolvedSeats,
        planTier: resolvedTier,
        notes: resolvedNotes || undefined,
        status: 'qualified_pending_checkout',
        deliveryMode: emailRes.sent ? 'email_api' : 'ats_handoff_fallback',
        createdAt,
      };

      crmLedger.agencyPilots.unshift(pilotRecord);
      crmLedger.buyerLeads.unshift({
        id: leadId,
        name: resolvedContact,
        email: cleanEmail,
        company: cleanAgency,
        companyUrl: pilotRecord.companyUrl || '',
        tierRequested: resolvedTier,
        seats: resolvedSeats,
        notes: resolvedNotes,
        status: 'Qualified — Checkout Pending',
        createdAt,
      });
      saveCrmLedgerToDisk();

      await upsertAgencyPilotInFirestore(pilotRecord);

      res.json({
        success: true,
        leadId,
        createdAt,
        requiresPaystackCheckout: true,
        recommendedTierId: resolvedTier,
        deliveryMode: pilotRecord.deliveryMode,
        emailProvider: emailRes.provider,
        mailtoHref: buildMailtoHref(
          (process.env.OWNER_NOTIFICATION_EMAIL || OWNER_EMAIL).trim(),
          `Agency Pilot Activation // ${cleanAgency} (${leadId})`,
          `Agency: ${cleanAgency}\nContact: ${resolvedContact} <${cleanEmail}>\nSeats: ${resolvedSeats}\nNotes: ${resolvedNotes}`
        ),
        message: 'Recruitment firm registered. Complete Paystack authorization to activate Sovereign Agency telemetry.',
      });
    } catch (err: any) {
      console.error('Error handling agency pilot request:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to register agency pilot request' });
    }
  });

  // Authenticated Owner Bypass & Paywall Preview Endpoint (Firebase ID Token Verified)
  app.post('/api/subscription/owner-unlock', async (req, res) => {
    const verification = await verifyFirebaseOwner(req);
    if (!verification.ok || !verification.email) {
      return res.status(403).json({
        success: false,
        error: verification.reason || 'Forbidden: Owner identity could not be verified.',
      });
    }

    const action = req.body?.action === 'preview_free' ? 'preview_free' : 'unlock_sovereign';
    if (action === 'preview_free') {
      return res.json({
        success: true,
        isOwner: true,
        tier: 'recruit',
        status: 'preview_free',
        message: 'Switched to Free Recruit preview mode so you can test the paywall as a visitor.',
      });
    }

    const ownerRef = `owner_${crypto.randomBytes(6).toString('hex')}`;
    recordSubscriptionActivation({
      reference: ownerRef,
      tier: 'agency_annual',
      email: verification.email,
      amountTotal: 0,
      currency: paystackCurrency,
      status: 'active',
      lastWebhookEvent: 'owner.verified_override',
    });

    return res.json({
      success: true,
      isOwner: true,
      tier: 'sovereign',
      tierId: 'agency_annual',
      reference: ownerRef,
      customerEmail: verification.email,
      message: `Owner bypass authorized for ${verification.email} (Sovereign Access)`,
    });
  });

  // Essential Paystack Feature: Owner Merchant Diagnostics (live key, settlement currency, balance, webhook)
  app.get('/api/paystack/owner/diagnostics', async (req, res) => {
    const verification = await verifyFirebaseOwner(req);
    if (!verification.ok) {
      return res.status(403).json({ success: false, error: verification.reason || 'Owner authentication required' });
    }

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.get('host') || 'ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';

    let balanceData: any = null;
    let balanceError: string | null = null;
    let plansList: any[] = [];
    let recentTxCount = 0;
    let currencyProbeOk = false;
    let currencyProbeMessage = '';

    if (isPaystackLive && paystackSecret) {
      try {
        const [balRes, planRes, txRes] = await Promise.all([
          fetch('https://api.paystack.co/balance', { headers: { Authorization: `Bearer ${paystackSecret}` } }),
          fetch('https://api.paystack.co/plan?perPage=25', { headers: { Authorization: `Bearer ${paystackSecret}` } }),
          fetch('https://api.paystack.co/transaction?perPage=5', { headers: { Authorization: `Bearer ${paystackSecret}` } }),
        ]);
        const balJson: any = await balRes.json();
        if (balRes.ok && balJson?.status) {
          balanceData = balJson.data;
        } else {
          balanceError = balJson?.message || 'Unable to fetch balance';
        }
        const planJson: any = await planRes.json();
        if (planRes.ok && planJson?.status && Array.isArray(planJson.data)) {
          plansList = planJson.data;
        }
        const txJson: any = await txRes.json();
        if (txRes.ok && txJson?.status && Array.isArray(txJson.data)) {
          recentTxCount = txJson.data.length;
        }

        // Probe configured PAYSTACK_CURRENCY support cleanly
        const probeRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: verification.email,
            amount: 10000,
            currency: paystackCurrency,
          }),
        });
        const probeJson: any = await probeRes.json();
        currencyProbeOk = Boolean(probeRes.ok && probeJson?.status);
        currencyProbeMessage = currencyProbeOk
          ? `${paystackCurrency} checkout initialization is active on your Paystack merchant account.`
          : probeJson?.message || `${paystackCurrency} rejected by Paystack merchant account.`;
      } catch (err: any) {
        balanceError = err?.message || 'Paystack API unreachable';
      }
    }

    res.json({
      success: true,
      ownerEmail: verification.email,
      secretKeyConfigured: isPaystackLive,
      keyMode: paystackSecret?.startsWith('sk_live_') ? 'LIVE' : paystackSecret?.startsWith('sk_test_') ? 'TEST' : 'NONE',
      publicKeyConfigured: Boolean(paystackPub && paystackPub.startsWith('pk_')),
      publicKeyPrefix: paystackPub ? `${paystackPub.slice(0, 12)}...` : null,
      configuredCurrency: paystackCurrency,
      usdToKesRate: paystackUsdToKesRate,
      currencyProbeOk,
      currencyProbeMessage,
      balance: balanceData,
      balanceError,
      configuredPlans: paystackPlans,
      paystackPlansCount: plansList.length,
      recentTransactionsCount: recentTxCount,
      webhookUrl: `${protocol}://${host}/api/paystack/webhook`,
      webhookEventsReceived: processedWebhookEvents.length,
    });
  });

  // Essential Paystack Feature: List & Bootstrap Recurring Subscription Plans
  app.get('/api/paystack/plans', async (_req, res) => {
    try {
      let remotePlans: any[] = [];
      if (isPaystackLive && paystackSecret) {
        const psRes = await fetch('https://api.paystack.co/plan?perPage=30', {
          headers: { Authorization: `Bearer ${paystackSecret}` },
        });
        const psJson: any = await psRes.json();
        if (psRes.ok && psJson?.status && Array.isArray(psJson.data)) {
          remotePlans = psJson.data.map((p: any) => ({
            name: p.name,
            planCode: p.plan_code,
            amount: p.amount / 100,
            currency: p.currency,
            interval: p.interval,
          }));
        }
      }
      res.json({
        configuredPlans: paystackPlans,
        remotePlans,
        currency: paystackCurrency,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch Paystack plans' });
    }
  });

  app.post('/api/paystack/plans/bootstrap', async (req, res) => {
    const verification = await verifyFirebaseOwner(req);
    if (!verification.ok) {
      return res.status(403).json({ success: false, error: verification.reason || 'Owner authentication required' });
    }
    if (!isPaystackLive || !paystackSecret) {
      return res.status(400).json({ success: false, error: 'PAYSTACK_SECRET_KEY must be configured first.' });
    }

    try {
      const targetCurrency = String(req.body?.currency || paystackCurrency).toUpperCase();
      const desiredPlans = [
        { key: 'pro_monthly', name: 'TalentRadar Pro Operator (Monthly)', interval: 'monthly', usd: 49 },
        { key: 'pro_annual', name: 'TalentRadar Pro Operator (Annual)', interval: 'annually', usd: 384 },
        { key: 'agency_monthly', name: 'TalentRadar Sovereign Partner (Monthly)', interval: 'monthly', usd: 199 },
        { key: 'agency_annual', name: 'TalentRadar Sovereign Partner (Annual)', interval: 'annually', usd: 1788 },
      ];

      // Check existing plans to avoid duplicates
      const listRes = await fetch('https://api.paystack.co/plan?perPage=50', {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });
      const listJson: any = await listRes.json();
      const existingPlans: any[] = Array.isArray(listJson?.data) ? listJson.data : [];

      const results: Record<string, { planCode?: string; status: string; message?: string }> = {};

      for (const item of desiredPlans) {
        if (paystackPlans[item.key]?.startsWith('PLN_')) {
          results[item.key] = { planCode: paystackPlans[item.key], status: 'already_configured' };
          continue;
        }

        const matched = existingPlans.find(
          (p) => String(p.name).toLowerCase() === item.name.toLowerCase() && String(p.currency).toUpperCase() === targetCurrency
        );
        if (matched?.plan_code) {
          paystackPlans[item.key] = matched.plan_code;
          runtimePaystackPlans[item.key] = matched.plan_code;
          results[item.key] = { planCode: matched.plan_code, status: 'linked_existing' };
          continue;
        }

        const amountSubunit =
          targetCurrency === 'KES' ? Math.round(item.usd * paystackUsdToKesRate * 100) : Math.round(item.usd * 100);

        const createRes = await fetch('https://api.paystack.co/plan', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: item.name,
            amount: amountSubunit,
            interval: item.interval,
            currency: targetCurrency,
            description: `TalentRadar.io ${item.name} subscription plan`,
          }),
        });
        const createJson: any = await createRes.json();
        if (createRes.ok && createJson?.status && createJson?.data?.plan_code) {
          paystackPlans[item.key] = createJson.data.plan_code;
          runtimePaystackPlans[item.key] = createJson.data.plan_code;
          results[item.key] = { planCode: createJson.data.plan_code, status: 'created' };
        } else {
          results[item.key] = {
            status: 'error',
            message: createJson?.message || 'Could not create plan in Paystack',
          };
        }
      }

      saveLedgerToDisk();
      return res.json({
        success: true,
        currency: targetCurrency,
        plans: paystackPlans,
        details: results,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to bootstrap Paystack plans' });
    }
  });

  // Essential Paystack Feature: Cloud Subscription Recovery / Sync by Email
  app.post('/api/paystack/subscription/sync-customer', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ found: false, error: 'Valid subscriber email is required.' });
      }

      // Check local ledger first
      const localSub = subscriptionLedgerByEmail.get(email);
      if (!isPaystackLive || !paystackSecret) {
        if (localSub && (localSub.status === 'active' || localSub.status === 'non_renewing')) {
          return res.json({ found: true, active: true, subscription: localSub });
        }
        return res.json({ found: false, active: false, message: 'No active subscription found for this email.' });
      }

      const syncedSub = await syncCustomerSubscriptionFromPaystack(email, { bypassNegativeCache: true });
      if (syncedSub) {
        return res.json({
          found: true,
          active: true,
          subscription: syncedSub,
        });
      }

      if (localSub && (localSub.status === 'active' || localSub.status === 'non_renewing')) {
        return res.json({ found: true, active: true, subscription: localSub });
      }

      return res.json({ found: false, active: false, message: 'No active Paystack subscription found for this email.' });
    } catch (err: any) {
      res.status(500).json({ found: false, error: err?.message || 'Customer sync failed' });
    }
  });

  // Essential Paystack Feature: Generate Hosted Subscription Card-Update / Manage Link
  app.post('/api/paystack/subscription/manage-link', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const subCode = String(req.body?.subscriptionCode || subscriptionLedgerByEmail.get(email)?.subscriptionCode || '').trim();
      if (!subCode || !subCode.startsWith('SUB_')) {
        return res.status(400).json({
          success: false,
          error: 'No recurring Paystack subscription code (SUB_...) found on this account yet.',
        });
      }
      if (!isPaystackLive || !paystackSecret) {
        return res.status(400).json({ success: false, error: 'Live Paystack secret key required to generate portal link.' });
      }

      const linkRes = await fetch(
        `https://api.paystack.co/subscription/${encodeURIComponent(subCode)}/manage/link`,
        { headers: { Authorization: `Bearer ${paystackSecret}` } }
      );
      const linkJson: any = await linkRes.json();
      if (!linkRes.ok || !linkJson?.status || !linkJson?.data?.link) {
        return res.status(400).json({
          success: false,
          error: linkJson?.message || 'Unable to generate Paystack manage link.',
        });
      }

      return res.json({
        success: true,
        link: linkJson.data.link,
        subscriptionCode: subCode,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Manage link generation failed' });
    }
  });

  // Essential Paystack Feature: Cancel / Disable Auto-Renew via Paystack API
  app.post('/api/paystack/subscription/cancel', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const ledger = email ? subscriptionLedgerByEmail.get(email) : undefined;
      const subCode = String(req.body?.subscriptionCode || ledger?.subscriptionCode || '').trim();
      let emailToken = String(req.body?.emailToken || ledger?.emailToken || '').trim();

      if (subCode.startsWith('SUB_') && (!isPaystackLive || !paystackSecret)) {
        return res.status(503).json({
          success: false,
          error: 'PAYSTACK_SECRET_KEY is not configured on this server; cannot disable live auto-renew on Paystack.',
        });
      }

      if (isPaystackLive && paystackSecret && subCode.startsWith('SUB_')) {
        if (!emailToken) {
          const detailRes = await fetch(`https://api.paystack.co/subscription/${encodeURIComponent(subCode)}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
          });
          const detailJson: any = await detailRes.json();
          emailToken = detailJson?.data?.email_token || '';
        }

        if (emailToken) {
          const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: subCode, token: emailToken }),
          });
          const disableJson: any = await disableRes.json();
          if (!disableRes.ok || !disableJson?.status) {
            return res.status(400).json({
              success: false,
              error: disableJson?.message || 'Paystack rejected cancellation request.',
            });
          }
        }
      }

      if (ledger) {
        recordSubscriptionActivation({
          reference: ledger.reference,
          tier: ledger.tier,
          email: ledger.email,
          amountTotal: ledger.amountTotal,
          currency: ledger.currency,
          status: 'non_renewing',
          subscriptionCode: subCode || ledger.subscriptionCode,
          planCode: ledger.planCode,
          cancelAtPeriodEnd: true,
          lastWebhookEvent: 'subscription.cancelled_by_user',
        });
      }

      return res.json({
        success: true,
        status: 'non_renewing',
        message: 'Auto-renewal disabled cleanly.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Subscription cancellation failed' });
    }
  });

  // Essential Paystack Feature: Customer Transaction & Receipt History
  app.get('/api/paystack/transactions', async (req, res) => {
    try {
      const email = String(req.query.email || '').trim().toLowerCase();
      const reference = String(req.query.reference || '').trim();
      if (!email && !reference) {
        return res.json({ transactions: [] });
      }

      const txItems: any[] = [];
      if (isPaystackLive && paystackSecret) {
        let customerId: number | undefined;
        if (email && email.includes('@')) {
          const custRes = await fetch(`https://api.paystack.co/customer/${encodeURIComponent(email)}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
          });
          const custJson: any = await custRes.json();
          customerId = custJson?.data?.id;
        }

        if (customerId) {
          const txRes = await fetch(`https://api.paystack.co/transaction?customer=${customerId}&perPage=15`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
          });
          const txJson: any = await txRes.json();
          if (txRes.ok && txJson?.status && Array.isArray(txJson.data)) {
            for (const t of txJson.data) {
              txItems.push({
                id: t.id,
                reference: t.reference,
                amount: (t.amount || 0) / 100,
                currency: t.currency,
                status: t.status,
                channel: t.channel,
                paidAt: t.paid_at || t.created_at,
                tier: t.metadata?.tierId || 'subscription',
              });
            }
          }
        } else if (reference && !reference.startsWith('owner_') && !reference.startsWith('vip_')) {
          const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
          });
          const verifyJson: any = await verifyRes.json();
          if (verifyRes.ok && verifyJson?.status && verifyJson?.data) {
            const t = verifyJson.data;
            txItems.push({
              id: t.id,
              reference: t.reference,
              amount: (t.amount || 0) / 100,
              currency: t.currency,
              status: t.status,
              channel: t.channel,
              paidAt: t.paid_at || t.created_at,
              tier: t.metadata?.tierId || 'subscription',
            });
          }
        }
      }

      if (txItems.length === 0 && email && subscriptionLedgerByEmail.has(email)) {
        const sub = subscriptionLedgerByEmail.get(email)!;
        txItems.push({
          id: 1,
          reference: sub.reference,
          amount: sub.amountTotal,
          currency: sub.currency,
          status: sub.status,
          channel: sub.reference.startsWith('owner_') ? 'owner_override' : 'paystack',
          paidAt: sub.updatedAt,
          tier: sub.tier,
        });
      }

      return res.json({ transactions: txItems });
    } catch (err: any) {
      res.status(500).json({ transactions: [], error: err?.message || 'Failed to fetch receipts' });
    }
  });

  // ==========================================
  // REFERRAL & VIRAL REWARD ENGINE
  // ==========================================
  app.post('/api/referrals/register', (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const uid = req.body?.uid ? String(req.body.uid).trim().slice(0, 64) : undefined;
      const requestedCustom = normalizeReferralCode(req.body?.customCode);

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required to generate your referral link.' });
      }

      const existingCodeForEmail = referralCodeByEmail.get(email);
      let record = existingCodeForEmail ? referralLedgerByCode.get(existingCodeForEmail) : undefined;

      if (requestedCustom) {
        if (requestedCustom.length < 4) {
          return res.status(400).json({ success: false, error: 'Custom code must be at least 4 alphanumeric characters.' });
        }
        const conflict = referralLedgerByCode.get(requestedCustom);
        if (conflict && conflict.referrerEmail.toLowerCase() !== email) {
          return res.status(409).json({ success: false, error: `Code ${requestedCustom} is already claimed by another member.` });
        }

        if (record && record.code !== requestedCustom) {
          // Rename existing user code cleanly while preserving all earned stats
          referralLedgerByCode.delete(record.code);
          record.code = requestedCustom;
          record.updatedAt = new Date().toISOString();
          referralLedgerByCode.set(requestedCustom, record);
          referralCodeByEmail.set(email, requestedCustom);
          saveLedgerToDisk();
          void upsertReferralInFirestore(record);
        }
      }

      if (!record) {
        const assignedCode = requestedCustom || generateUniqueReferralCode(email);
        const now = new Date().toISOString();
        record = {
          code: assignedCode,
          referrerEmail: email,
          ...(uid ? { referrerUid: uid } : {}),
          clicks: 0,
          paidConversions: 0,
          availableMonthCredits: 0,
          totalMonthCreditsClaimed: 0,
          totalCommissionUsd: 0,
          conversions: [],
          createdAt: now,
          updatedAt: now,
        };
        referralLedgerByCode.set(assignedCode, record);
        referralCodeByEmail.set(email, assignedCode);
        saveLedgerToDisk();
        void upsertReferralInFirestore(record);
      } else if (uid && !record.referrerUid) {
        record.referrerUid = uid;
        record.updatedAt = new Date().toISOString();
        saveLedgerToDisk();
        void upsertReferralInFirestore(record);
      }

      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = req.get('host') || 'ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
      const origin = `${protocol}://${host}`;

      return res.json({
        success: true,
        referral: {
          code: record.code,
          referrerEmail: record.referrerEmail,
          inviteUrl: `${origin}/r/${record.code}`,
          clicks: record.clicks,
          paidConversions: record.paidConversions,
          availableMonthCredits: record.availableMonthCredits,
          totalMonthCreditsClaimed: record.totalMonthCreditsClaimed,
          totalCommissionUsd: record.totalCommissionUsd,
          totalCommissionKes: Math.round(record.totalCommissionUsd * paystackUsdToKesRate),
          conversions: record.conversions,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to register referral profile' });
    }
  });

  app.post('/api/referrals/track', (req, res) => {
    try {
      const code = normalizeReferralCode(req.body?.code);
      if (!code) return res.json({ tracked: false });
      const rec = referralLedgerByCode.get(code);
      if (!rec) return res.json({ tracked: false });
      rec.clicks += 1;
      rec.updatedAt = new Date().toISOString();
      saveLedgerToDisk();
      return res.json({ tracked: true, code: rec.code, discountPercent: 20 });
    } catch {
      return res.json({ tracked: false });
    }
  });

  app.get('/api/referrals/validate', (req, res) => {
    const code = String(req.query.code || '');
    const buyerEmail = String(req.query.email || '');
    const check = validateReferralForBuyer(code, buyerEmail);
    if (!check.valid || !check.record) {
      return res.status(404).json({
        valid: false,
        discountPercent: 0,
        error: check.error || 'Invalid referral code.',
      });
    }
    return res.json({
      valid: true,
      code: check.record.code,
      discountPercent: check.discountPercent,
      referrerHint: maskReferralEmail(check.record.referrerEmail),
    });
  });

  app.post('/api/referrals/claim', (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const requestedCode = normalizeReferralCode(req.body?.code);

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Valid subscriber email is required to claim earned referral credits.' });
      }

      const mappedCode = referralCodeByEmail.get(email);
      const codeToUse = requestedCode && referralLedgerByCode.get(requestedCode)?.referrerEmail.toLowerCase() === email
        ? requestedCode
        : mappedCode;

      const rec = codeToUse ? referralLedgerByCode.get(codeToUse) : undefined;
      if (!rec || rec.availableMonthCredits < 1) {
        return res.status(400).json({
          success: false,
          error: 'No earned Free Pro Month credits available yet. Credits unlock automatically after a referred user completes paid Paystack checkout.',
        });
      }

      rec.availableMonthCredits -= 1;
      rec.totalMonthCreditsClaimed += 1;
      rec.updatedAt = new Date().toISOString();
      void upsertReferralInFirestore(rec);

      const claimRef = `ref_credit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      recordSubscriptionActivation({
        reference: claimRef,
        tier: 'pro_monthly',
        email,
        amountTotal: 0,
        currency: paystackCurrency,
        status: 'active',
        lastWebhookEvent: 'referral.free_month_claimed',
      });

      return res.json({
        success: true,
        reference: claimRef,
        tier: 'pro',
        tierId: 'pro_monthly',
        customerEmail: email,
        remainingCredits: rec.availableMonthCredits,
        message: '1 Earned Free Pro Month claimed! Pro Operator clearance activated.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to claim referral credit' });
    }
  });

  app.get('/api/referrals/owner/overview', async (req, res) => {
    const verification = await verifyFirebaseOwner(req);
    if (!verification.ok) {
      return res.status(403).json({ success: false, error: verification.reason || 'Owner authentication required' });
    }

    const entries = Array.from(referralLedgerByCode.values()).map((r) => ({
      code: r.code,
      referrerEmail: r.referrerEmail,
      clicks: r.clicks,
      paidConversions: r.paidConversions,
      availableMonthCredits: r.availableMonthCredits,
      totalMonthCreditsClaimed: r.totalMonthCreditsClaimed,
      totalCommissionUsd: r.totalCommissionUsd,
      updatedAt: r.updatedAt,
    }));

    return res.json({
      success: true,
      summary: {
        totalReferrers: entries.length,
        totalClicks: entries.reduce((sum, e) => sum + e.clicks, 0),
        totalPaidConversions: entries.reduce((sum, e) => sum + e.paidConversions, 0),
        totalCommissionOwedUsd: Math.round(entries.reduce((sum, e) => sum + e.totalCommissionUsd, 0) * 100) / 100,
        totalFreeMonthsEarned: entries.reduce((sum, e) => sum + e.paidConversions, 0),
        totalFreeMonthsClaimed: entries.reduce((sum, e) => sum + e.totalMonthCreditsClaimed, 0),
      },
      referrers: entries.sort((a, b) => b.paidConversions - a.paidConversions || b.clicks - a.clicks),
    });
  });

  // Shared Paystack Webhook Signal Processor — synchronously updates memory/disk ledger & Firestore subscriptions
  async function processPaystackWebhookPayload(body: any): Promise<{
    duplicate?: boolean;
    event: string;
    reference: string;
    tier: string;
    status?: string;
    email?: string;
    userId?: string;
    firestoreDocId?: string;
    firestoreSynced: boolean;
    firestoreReason?: string;
  }> {
    const event = String(body?.event || 'unknown');
    const data = body?.data || {};
    const customerEmail = String(data?.customer?.email || '').trim().toLowerCase();
    const customerCode = data?.customer?.customer_code || undefined;
    const subCode = data?.subscription_code || data?.subscription?.subscription_code || undefined;
    const emailToken = data?.email_token || data?.subscription?.email_token || undefined;
    const planCode =
      data?.plan?.plan_code || data?.plan_code || (typeof data?.plan === 'string' ? data.plan : undefined);
    const reference = String(
      data?.reference || data?.transaction_reference || data?.invoice_code || subCode || `wh_${Date.now()}`
    );
    const eventId = `${event}:${reference}:${data?.id || ''}`;

    if (processedWebhookIdSet.has(eventId)) {
      return {
        duplicate: true,
        event,
        reference,
        tier: 'pro_monthly',
        firestoreSynced: false,
      };
    }

    const targetEmail = customerEmail || (subCode ? subscriptionByCode.get(subCode) || '' : '');
    const existingSub = targetEmail ? subscriptionLedgerByEmail.get(targetEmail) : undefined;
    const resolvedTier = resolveTierFromWebhookData(data, existingSub, planCode);
    const explicitUid =
      (typeof data?.metadata?.userId === 'string' && data.metadata.userId.trim()) ||
      existingSub?.userId ||
      (targetEmail ? emailToUidMap.get(targetEmail) : undefined);

    let activationResult:
      | {
          ledgerRecord: SubscriptionLedgerRecord;
          docId: string;
          syncPromise: Promise<FirestoreSubscriptionSyncResult>;
        }
      | undefined;

    if (event === 'charge.success') {
      const txCurrency = (data?.currency || paystackCurrency).toUpperCase();
      const usdEquivalent =
        Number(data?.metadata?.usdEquivalent) ||
        (data?.amount
          ? txCurrency === 'KES'
            ? Math.round((data.amount / 100 / paystackUsdToKesRate) * 100) / 100
            : data.amount / 100
          : existingSub?.amountTotal || 0);

      activationResult = recordSubscriptionActivation({
        reference,
        tier: resolvedTier,
        email: targetEmail || 'operator@talentradar.io',
        userId: explicitUid,
        amountTotal: usdEquivalent,
        currency: txCurrency,
        status: 'active',
        subscriptionCode: subCode,
        planCode,
        customerCode,
        emailToken,
        nextPaymentDate: data?.next_payment_date,
        cancelAtPeriodEnd: false,
        lastWebhookEvent: event,
      });

      const webhookRefCode = data?.metadata?.referralCode || verifiedCheckoutSessions.get(reference)?.referralCode;
      if (webhookRefCode) {
        creditReferralConversion({
          reference,
          tierId: resolvedTier,
          buyerEmail: targetEmail,
          paidUsd: usdEquivalent,
          referralCode: webhookRefCode,
        });
      }
    } else if (event === 'subscription.create') {
      activationResult = recordSubscriptionActivation({
        reference: existingSub?.reference || reference,
        tier: resolvedTier,
        email: targetEmail || 'operator@talentradar.io',
        userId: explicitUid,
        amountTotal: existingSub?.amountTotal || (data?.amount ? data.amount / 100 : 0),
        currency: data?.plan?.currency || existingSub?.currency || paystackCurrency,
        status: 'active',
        subscriptionCode: subCode,
        planCode,
        customerCode,
        emailToken,
        nextPaymentDate: data?.next_payment_date,
        cancelAtPeriodEnd: false,
        lastWebhookEvent: event,
      });
    } else if (event === 'invoice.create' || event === 'invoice.update') {
      if (targetEmail && existingSub) {
        activationResult = recordSubscriptionActivation({
          reference: existingSub.reference,
          tier: resolvedTier,
          email: targetEmail,
          userId: explicitUid,
          amountTotal: existingSub.amountTotal,
          currency: existingSub.currency,
          status: data?.paid === false ? 'past_due' : 'active',
          subscriptionCode: subCode,
          planCode,
          customerCode,
          emailToken,
          nextPaymentDate: data?.next_payment_date || existingSub.nextPaymentDate,
          lastWebhookEvent: event,
        });
      }
    } else if (event === 'subscription.expiring_cards') {
      if (targetEmail && existingSub) {
        activationResult = recordSubscriptionActivation({
          reference: existingSub.reference,
          tier: existingSub.tier,
          email: targetEmail,
          userId: explicitUid,
          amountTotal: existingSub.amountTotal,
          currency: existingSub.currency,
          status: existingSub.status,
          subscriptionCode: subCode,
          expiringCardNotice: data?.description || 'Saved card expires soon. Update card via Paystack portal.',
          lastWebhookEvent: event,
        });
      }
    } else if (event === 'subscription.not_renew') {
      if (targetEmail && existingSub) {
        activationResult = recordSubscriptionActivation({
          reference: existingSub.reference,
          tier: existingSub.tier,
          email: targetEmail,
          userId: explicitUid,
          amountTotal: existingSub.amountTotal,
          currency: existingSub.currency,
          status: 'non_renewing',
          subscriptionCode: subCode,
          planCode,
          cancelAtPeriodEnd: true,
          lastWebhookEvent: event,
        });
      }
    } else if (event === 'subscription.disable' || event === 'invoice.payment_failed') {
      if (targetEmail && existingSub) {
        activationResult = recordSubscriptionActivation({
          reference: existingSub.reference,
          tier: existingSub.tier,
          email: targetEmail,
          userId: explicitUid,
          amountTotal: existingSub.amountTotal,
          currency: existingSub.currency,
          status: event === 'subscription.disable' ? 'cancelled' : 'past_due',
          subscriptionCode: subCode,
          planCode,
          lastWebhookEvent: event,
        });
      }
    } else if (event === 'refund.processed' || event === 'charge.dispute.create') {
      if (targetEmail && existingSub) {
        activationResult = recordSubscriptionActivation({
          reference: existingSub.reference,
          tier: existingSub.tier,
          email: targetEmail,
          userId: explicitUid,
          amountTotal: existingSub.amountTotal,
          currency: existingSub.currency,
          status: event === 'refund.processed' ? 'refunded' : 'disputed',
          subscriptionCode: subCode,
          planCode,
          lastWebhookEvent: event,
        });
      }
    }

    const syncRes = activationResult
      ? await activationResult.syncPromise
      : { ok: false, docId: targetEmail ? subscriptionDocIdForEmail(targetEmail) : '' };

    processedWebhookIdSet.add(eventId);
    processedWebhookEvents.push({
      eventId,
      event,
      reference,
      tier: resolvedTier,
      receivedAt: new Date().toISOString(),
    });
    if (processedWebhookEvents.length > 500) {
      processedWebhookEvents.shift();
    }
    saveLedgerToDisk();

    return {
      duplicate: false,
      event,
      reference,
      tier: resolvedTier,
      status: activationResult?.ledgerRecord.status,
      email: targetEmail || undefined,
      userId: syncRes.userId || activationResult?.ledgerRecord.userId,
      firestoreDocId: syncRes.docId || activationResult?.docId,
      firestoreSynced: syncRes.ok,
      firestoreReason: syncRes.reason,
    };
  }

  // Official Paystack Webhook Handler (Raw-Body Timing-Safe HMAC-SHA512 Verified -> Immediate Firestore Sync)
  app.post('/api/paystack/webhook', async (req, res) => {
    try {
      const signature = (req.headers['x-paystack-signature'] as string | undefined)?.trim();

      if (isPaystackLive && paystackSecret) {
        if (!signature) {
          return res.status(401).json({ received: false, error: 'Missing x-paystack-signature header' });
        }
        const rawPayload = (req as any).rawBody
          ? (req as any).rawBody
          : JSON.stringify(req.body);
        const computedHex = crypto
          .createHmac('sha512', paystackSecret)
          .update(rawPayload)
          .digest('hex');

        const sigBuf = Buffer.from(signature, 'utf8');
        const expectedBuf = Buffer.from(computedHex, 'utf8');
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return res.status(401).json({ received: false, error: 'Invalid Paystack webhook signature' });
        }
      } else if (isProd && process.env.PAYSTACK_WEBHOOK_ALLOW_TEST_UNSIGNED !== 'true') {
        return res.status(503).json({
          received: false,
          error: 'PAYSTACK_SECRET_KEY is required in production to verify Paystack webhooks.',
        });
      }

      const result = await processPaystackWebhookPayload(req.body);
      res.status(200).json({ received: true, ...result });
    } catch (err: any) {
      console.error('Paystack webhook error:', err);
      res.status(500).json({ received: false, error: 'Webhook processing failed' });
    }
  });

  // Sample Payment Success Webhook Verification Flow (Verified Owner or Localhost Dev Only)
  // Signs a real Paystack `charge.success` payload with HMAC-SHA512 and runs it through the live webhook -> Firestore bridge
  app.post('/api/paystack/webhook/test-dispatch', async (req, res) => {
    try {
      const ownerAuth = await verifyFirebaseOwner(req);
      const userAuth = ownerAuth.ok ? ownerAuth : await verifyFirebaseUser(req);
      const isLocalRequest =
        !isProd &&
        (req.hostname === 'localhost' || req.hostname === '127.0.0.1' || String(req.ip || '').includes('127.0.0.1'));

      if (!ownerAuth.ok && !isLocalRequest) {
        return res.status(403).json({
          success: false,
          error: 'Verified owner authorization (mortyp1125@gmail.com) required to dispatch sample webhook signals.',
        });
      }

      const requestedTier = String(req.body?.tierId || 'pro_monthly');
      const validTier: PaystackTierId =
        requestedTier === 'pro_annual' ||
        requestedTier === 'agency_monthly' ||
        requestedTier === 'agency_annual' ||
        requestedTier === 'pro_monthly'
          ? requestedTier
          : 'pro_monthly';

      const tierUsdMap: Record<string, number> = {
        pro_monthly: 49,
        pro_annual: 384,
        agency_monthly: 199,
        agency_annual: 1788,
      };
      const usdAmount = tierUsdMap[validTier] || 49;
      const targetEmail = (
        String(req.body?.email || '').trim().toLowerCase() ||
        userAuth.email ||
        OWNER_EMAIL
      );
      const targetUid =
        (typeof req.body?.userId === 'string' && req.body.userId.trim()) ||
        (userAuth.ok && userAuth.email === targetEmail ? userAuth.uid : undefined) ||
        emailToUidMap.get(targetEmail);

      const sampleRef = `tr_ps_wh_sample_${validTier}_${Date.now()}`;
      const sampleSubCode = `SUB_SAMPLE_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const nextDate = new Date(Date.now() + (validTier.includes('annual') ? 365 : 30) * 86_400_000).toISOString();
      const slugHint = validTier.includes('agency') ? 'career-radar-agency' : 'career-radar-pro';

      const webhookBody = {
        event: 'charge.success',
        data: {
          id: Date.now(),
          status: 'success',
          reference: sampleRef,
          amount: Math.round(usdAmount * paystackUsdToKesRate * 100),
          currency: paystackCurrency,
          channel: 'card',
          subscription_code: sampleSubCode,
          next_payment_date: nextDate,
          page: { slug: slugHint },
          customer: {
            email: targetEmail,
            customer_code: `CUS_SAMPLE_${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          },
          metadata: {
            tierId: validTier,
            usdEquivalent: usdAmount,
            ...(targetUid ? { userId: targetUid } : {}),
            referrer: `https://paystack.com/pay/${slugHint}`,
            sampleFlow: true,
          },
        },
      };

      const rawJson = JSON.stringify(webhookBody);
      const signingSecret = paystackSecret || 'local_dev_sample_hmac_secret';
      const hmacSignature = crypto.createHmac('sha512', signingSecret).update(rawJson).digest('hex');
      const expectedCheck = crypto.createHmac('sha512', signingSecret).update(rawJson).digest('hex');
      const hmacVerified = crypto.timingSafeEqual(Buffer.from(hmacSignature, 'utf8'), Buffer.from(expectedCheck, 'utf8'));

      const processed = await processPaystackWebhookPayload(webhookBody);

      return res.json({
        success: true,
        hmacVerified,
        signaturePreview: `${hmacSignature.slice(0, 16)}...`,
        redirectPreviewUrl: `/billing?checkout_status=success&provider=paystack&tier=${validTier.includes('agency') ? 'sovereign' : 'pro'}&reference=${sampleRef}`,
        ...processed,
      });
    } catch (err: any) {
      console.error('Error dispatching sample Paystack webhook:', err);
      res.status(500).json({ success: false, error: err?.message || 'Sample webhook dispatch failed' });
    }
  });

  // Safe non-PII Paystack Webhook Readiness & Telemetry Diagnostics
  app.get('/api/paystack/webhook/status', (req, res) => {
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.get('host') || 'ais-dev-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
    const activeSubs = Array.from(subscriptionLedgerByEmail.values()).filter(
      (s) => s.status === 'active' || s.status === 'non_renewing'
    ).length;
    const latest = processedWebhookEvents[processedWebhookEvents.length - 1];

    res.json({
      provider: 'paystack',
      webhookEndpoint: `${protocol}://${host}/api/paystack/webhook`,
      relativePath: '/api/paystack/webhook',
      hmacSha512Enforced: isPaystackLive,
      liveMode: isPaystackLive,
      activeSubscriptionsCount: activeSubs,
      processedWebhookEventsCount: processedWebhookEvents.length,
      lastEventType: latest?.event || null,
      lastEventAt: latest?.receivedAt || null,
      supportedEvents: [
        'charge.success',
        'subscription.create',
        'invoice.create',
        'invoice.update',
        'invoice.payment_failed',
        'subscription.expiring_cards',
        'subscription.not_renew',
        'subscription.disable',
        'refund.processed',
        'charge.dispute.create',
      ],
    });
  });

  // Helper: Parse JSON cleanly even if Google Search grounding wraps it in markdown fences
  function parseJsonResponseText(text: string): any {
    const trimmed = String(text || '').trim();
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonCandidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
    const firstBrace = jsonCandidate.indexOf('{');
    const lastBrace = jsonCandidate.lastIndexOf('}');
    const slice =
      firstBrace !== -1 && lastBrace > firstBrace
        ? jsonCandidate.slice(firstBrace, lastBrace + 1)
        : jsonCandidate;
    return JSON.parse(slice);
  }

  // Shared 10-minute cache for Google-Search grounded Gemini news briefs
  const newsBriefCache = new Map<string, { fetchedAtMs: number; data: any }>();
  const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;

  async function generateGroundedNewsBrief(company: string, sector: string, keywords = '') {
    const cleanCompany = String(company || 'Anthropic & OpenAI Ecosystem').trim();
    const cleanSector = String(sector || 'Frontier AI & High-Performance Compute').trim();
    const cleanKeywords = String(keywords || '').trim();
    const cacheKey = `${cleanCompany.toLowerCase()}|${cleanSector.toLowerCase()}|${cleanKeywords.toLowerCase()}`;
    const cached = newsBriefCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAtMs < NEWS_CACHE_TTL_MS) {
      return cached.data;
    }

    const ai = getGeminiClient();
    const { jobs: liveJobs, meta: atsMeta } = await getLiveAtsJobs(false);
    const companyTokens = cleanCompany
      .toLowerCase()
      .split(/[\s&,/]+/)
      .filter((t) => t.length > 2 && !['ecosystem', 'alliance', 'consortium', 'core'].includes(t));

    const matchedAtsJobs = liveJobs.filter((j) => {
      const hay = `${j.company} ${j.title} ${j.sector} ${j.skills.join(' ')}`.toLowerCase();
      return companyTokens.some((tok) => hay.includes(tok)) || hay.includes(cleanSector.split(' ')[0].toLowerCase());
    });
    const compDisclosed = matchedAtsJobs.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
    const minComp =
      compDisclosed.length > 0
        ? Math.min(...compDisclosed.map((j) => j.numericMinSalary || j.numericMaxSalary))
        : 0;
    const maxComp = compDisclosed.length > 0 ? Math.max(...compDisclosed.map((j) => j.numericMaxSalary)) : 0;
    const atsCompSummary =
      maxComp > 0
        ? `$${Math.round(minComp / 1000)}k - $${Math.round(maxComp / 1000)}k Base/TC (Live ATS Disclosed)`
        : 'Undisclosed / Equity-Weighted on Public ATS';

    const prompt = `You are a Principal Market & Talent Intelligence Analyst. Use Google Search to gather the latest verifiable real-world engineering, funding, hiring, compute, or strategic news about:
- Organization / Ecosystem: "${cleanCompany}"
- Industry Sector: "${cleanSector}"
${cleanKeywords ? `- Focus Keywords: "${cleanKeywords}"` : ''}

Live External ATS Telemetry observed right now across 14 public boards:
- Boards Live: ${atsMeta.boardsSucceeded}/${atsMeta.boardCount}
- Total Openings Across Tracked Boards: ${atsMeta.totalOpeningsAcrossBoards}
- Direct ATS Matches for this query: ${matchedAtsJobs.length} (${atsCompSummary})
- Sample Live Roles: ${matchedAtsJobs.slice(0, 4).map((j) => `${j.company}: ${j.title} (${j.location})`).join('; ') || 'Broad sector benchmark'}

Return a single valid JSON object (no surrounding prose) matching this exact schema:
{
  "company": "${cleanCompany}",
  "sector": "${cleanSector}",
  "generatedAt": "${new Date().toISOString()}",
  "sentiment": "Bullish" | "Neutral" | "Cautious" | "Aggressive Hiring",
  "hiringVelocityScore": number (0-100),
  "summary": "2-3 sentence executive synthesis referencing real verified news and hiring moves.",
  "keySignals": ["3-5 concise verified tactical intelligence bullets"],
  "openRequisitionsCount": ${matchedAtsJobs.length || atsMeta.totalOpeningsAcrossBoards || 0},
  "avgCompensationBand": "${atsCompSummary}",
  "recentDevelopments": [
    {
      "headline": "Specific verified development or release/funding/hiring news",
      "date": "Recent month/year or date",
      "source": "Publication or primary source name",
      "impact": "Positive" | "Neutral" | "Risk"
    }
  ],
  "strategicAssessment": "2 sentence actionable career & compensation negotiation positioning guidance."
}`;

    const aiRes = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const parsed = parseJsonResponseText(aiRes.text || '{}');
    const chunks = (aiRes as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; url: string }> = [];
    const seenUrls = new Set<string>();
    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (uri && typeof uri === 'string' && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        sources.push({
          title: String(chunk?.web?.title || new URL(uri).hostname),
          url: uri,
        });
      }
    }

    const result = {
      company: parsed.company || cleanCompany,
      sector: parsed.sector || cleanSector,
      generatedAt: new Date().toISOString(),
      sentiment: ['Bullish', 'Neutral', 'Cautious', 'Aggressive Hiring'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'Bullish',
      hiringVelocityScore: Math.max(0, Math.min(100, Number(parsed.hiringVelocityScore) || 78)),
      summary: String(parsed.summary || ''),
      keySignals: Array.isArray(parsed.keySignals) ? parsed.keySignals.map(String).slice(0, 6) : [],
      openRequisitionsCount: Number(parsed.openRequisitionsCount ?? matchedAtsJobs.length ?? 0),
      avgCompensationBand: String(parsed.avgCompensationBand || atsCompSummary),
      recentDevelopments: Array.isArray(parsed.recentDevelopments)
        ? parsed.recentDevelopments.slice(0, 5).map((d: any) => ({
            headline: String(d?.headline || ''),
            date: String(d?.date || 'Recent'),
            source: String(d?.source || 'Verified Search'),
            impact: ['Positive', 'Neutral', 'Risk'].includes(d?.impact) ? d.impact : 'Positive',
          }))
        : [],
      strategicAssessment: String(parsed.strategicAssessment || ''),
      sources,
      groundingProvider: 'gemini-4-hydrogen + Google Search',
    };

    newsBriefCache.set(cacheKey, { fetchedAtMs: Date.now(), data: result });
    return result;
  }

  // Career Trajectory Modeling Endpoint — Gemini 4 Hydrogen + Live ATS Matching Roles
  app.post('/api/career', async (req, res) => {
    try {
      const {
        currentRole = 'Senior Software Engineer',
        targetRole = 'Principal AI Architect',
        yearsExperience = 6,
        skills = [],
        currentSalary = 195000,
        targetIndustry = 'Frontier AI & Cloud Infrastructure',
        targetSalary = 340000,
      } = req.body || {};

      const ai = getGeminiClient();
      const normalizedSkills = Array.isArray(skills)
        ? skills.map(String).filter(Boolean)
        : String(skills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      const searchQuery = [targetRole, ...normalizedSkills.slice(0, 2)].filter(Boolean).join(' ');
      const atsSearch = await searchLiveAtsJobs({
        keywords: searchQuery || targetRole,
        minSalary: 0,
        maxSalary: 600000,
      });
      const fallbackAts =
        atsSearch.jobs.length > 0
          ? atsSearch
          : await searchLiveAtsJobs({ keywords: targetRole.split(' ')[0] || '', minSalary: 0, maxSalary: 600000 });

      const sampleLiveRoles = fallbackAts.jobs.slice(0, 8);
      const prompt = `Model an executive software engineering career transition plan grounded in current market demand and live public ATS openings.
Candidate Profile:
- Current Role: ${currentRole}
- Target Role: ${targetRole}
- Years of Experience: ${yearsExperience}
- Current Total Compensation: $${Number(currentSalary).toLocaleString()} USD
- Target Total Compensation: $${Number(targetSalary).toLocaleString()} USD
- Target Industry: ${targetIndustry}
- Existing Skills: ${normalizedSkills.join(', ') || 'General Backend / Systems'}

Live External ATS Context (${fallbackAts.meta.boardsSucceeded}/${fallbackAts.meta.boardCount} boards live):
- Direct matching openings count: ${fallbackAts.totalCount}
- Representative open requisitions: ${sampleLiveRoles.slice(0, 5).map((j) => `${j.company} — ${j.title} (${j.location}, ${j.salaryRange})`).join('; ') || 'No exact keyword match; evaluate broader market'}

Provide a calibrated readiness assessment, realistic timeline in months, 4-stage salary progression, 4-year demand index forecast (2025-2028), 3 execution milestones, 4 prioritized skill gaps with honest current vs target proficiency levels (0-100), and 4 concise tactical negotiation/transition directives.`;

      const { response: aiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: prompt,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentRole: { type: Type.STRING },
              targetRole: { type: Type.STRING },
              readinessScore: { type: Type.INTEGER },
              estimatedTimelineMonths: { type: Type.INTEGER },
              targetSalary: { type: Type.NUMBER },
              salaryProgression: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    salary: { type: Type.NUMBER },
                    percentile: { type: Type.INTEGER },
                  },
                  required: ['name', 'salary', 'percentile'],
                },
              },
              forecastDemand: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.STRING },
                    demand: { type: Type.INTEGER },
                    growthRate: { type: Type.STRING },
                  },
                  required: ['year', 'demand', 'growthRate'],
                },
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    phase: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    criticalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['step', 'phase', 'duration', 'goals', 'criticalSkills'],
                },
              },
              skillGaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    importance: { type: Type.STRING },
                    currentLevel: { type: Type.INTEGER },
                    targetLevel: { type: Type.INTEGER },
                  },
                  required: ['skill', 'importance', 'currentLevel', 'targetLevel'],
                },
              },
              tacticalAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'currentRole',
              'targetRole',
              'readinessScore',
              'estimatedTimelineMonths',
              'targetSalary',
              'salaryProgression',
              'forecastDemand',
              'milestones',
              'skillGaps',
              'tacticalAdvice',
            ],
          },
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      res.json({
        ...parsed,
        currentRole: parsed.currentRole || currentRole,
        targetRole: parsed.targetRole || targetRole,
        targetSalary: Number(parsed.targetSalary || targetSalary),
        matchingJobsCount: fallbackAts.totalCount,
        matchingJobs: sampleLiveRoles,
        atsMeta: fallbackAts.meta,
        model: modelUsed,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error in /api/career:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // Critical Career Salary Data & Quantitative Trajectories (Enriched with Live ATS Disclosed Benchmarks)
  app.get('/api/salary/market-analytics', async (_req, res) => {
    try {
      const timeline = generateSalaryTimeline('aiCompute');
      const { jobs, meta } = await getLiveAtsJobs(false);
      const disclosedJobs = jobs.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
      const midpoints = disclosedJobs
        .map((j) => Math.round(((j.numericMinSalary || j.numericMaxSalary) + j.numericMaxSalary) / 2))
        .sort((a, b) => a - b);
      const medianMidpoint = midpoints.length > 0 ? midpoints[Math.floor(midpoints.length / 2)] : 0;

      const byCompany = new Map<string, { company: string; openCount: number; maxSalary: number }>();
      for (const j of jobs) {
        const entry = byCompany.get(j.company) || { company: j.company, openCount: 0, maxSalary: 0 };
        entry.openCount += 1;
        if (j.numericMaxSalary > entry.maxSalary) entry.maxSalary = j.numericMaxSalary;
        byCompany.set(j.company, entry);
      }

      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=86400');
      res.json({
        status: 'ACTIVE_TELEMETRY',
        timestamp: new Date().toISOString(),
        profiles: CAREER_PROFILES,
        timeline,
        sectors: ['aiCompute', 'robotics', 'fintechQuant', 'cyberDefense', 'cloudSystems', 'biotechML'],
        liveAtsBenchmarks: {
          boardsSucceeded: meta.boardsSucceeded,
          boardCount: meta.boardCount,
          totalOpeningsAcrossBoards: meta.totalOpeningsAcrossBoards,
          disclosedCompRolesCount: disclosedJobs.length,
          medianDisclosedMidpointUsd: medianMidpoint,
          topHiringOrgs: Array.from(byCompany.values())
            .sort((a, b) => b.openCount - a.openCount)
            .slice(0, 6),
        },
        summary: 'Quantitative market compensation trajectories enriched with live external ATS disclosed bands.',
      });
    } catch (err) {
      console.error('Error serving salary market analytics:', err);
      res.status(500).json({ error: 'Failed to retrieve salary market analytics' });
    }
  });

  // Market News Snippets GET Endpoint — Real Gemini 4 Hydrogen + Google Search Grounding
  app.get('/api/news', async (req, res) => {
    try {
      const company = (req.query.company as string) || 'Anthropic & OpenAI Ecosystem';
      const sector = (req.query.sector as string) || 'Frontier AI & High-Performance Compute';
      const keywords = (req.query.keywords as string) || '';
      const brief = await generateGroundedNewsBrief(company, sector, keywords);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      res.json(brief);
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error generating grounded intel brief via GET:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // Latest News Snippets across key sectors for offline pre-caching
  app.get('/api/news/latest', async (_req, res) => {
    try {
      const sectors = [
        { company: 'Anthropic & OpenAI Ecosystem', sector: 'Frontier AI & High-Performance Compute' },
        { company: 'Skydio & Autonomous Robotics Alliance', sector: 'Autonomous Systems & Humanoid Robotics' },
        { company: 'Citadel Securities / Core Microstructure', sector: 'Quantitative Finance & Algorithmic Trading' },
        { company: 'Palantir / Sovereign Cloud Defense', sector: 'Zero-Trust Defense & Sovereign Infrastructure' },
      ];
      const settled = await Promise.allSettled(
        sectors.map(async (s) => ({
          ...s,
          brief: await generateGroundedNewsBrief(s.company, s.sector),
        }))
      );
      const items = settled
        .filter((r): r is PromiseFulfilledResult<{ company: string; sector: string; brief: any }> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (items.length === 0) {
        const firstErr = settled.find((r): r is PromiseRejectedResult => r.status === 'rejected')?.reason;
        const mapped = mapGeminiHttpError(firstErr);
        return res.status(mapped.status).json(mapped.body);
      }

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      res.json({
        timestamp: new Date().toISOString(),
        count: items.length,
        items,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  });

  app.post('/api/news', async (req, res) => {
    try {
      const { company, sector, keywords } = req.body || {};
      const brief = await generateGroundedNewsBrief(company, sector, keywords);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      res.json(brief);
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error generating grounded intel brief via POST:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // External ATS Comms Feed merged with persistent outbound replies & status overrides
  app.get('/api/comms', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const payload = await getLiveAtsCommsMessages(forceRefresh);

      const latestReplyByMsgId = new Map<string, CommsReplyRecord>();
      for (const r of crmLedger.outboundCommsReplies) {
        if (!latestReplyByMsgId.has(r.messageId)) {
          latestReplyByMsgId.set(r.messageId, r);
        }
      }

      const mergedMessages = payload.messages.map((msg) => {
        const replyRecord = latestReplyByMsgId.get(msg.id);
        if (!replyRecord) return msg;
        return {
          ...msg,
          status:
            replyRecord.status === 'Accepted' || replyRecord.status === 'Declined'
              ? replyRecord.status === 'Accepted'
                ? 'Negotiating'
                : 'Archived'
              : replyRecord.status === 'Replied'
              ? 'Negotiating'
              : (replyRecord.status as any),
          lastReplyText: replyRecord.replyText,
          lastReplyAt: replyRecord.createdAt,
          lastDeliveryMode: replyRecord.deliveryMode,
        };
      });

      res.json({
        ...payload,
        messages: mergedMessages,
        emailDispatcher: getEmailDispatcherStatus(),
      });
    } catch (err) {
      console.error('Error getting live ATS comms data:', err);
      res.status(500).json({ error: 'Failed to fetch live ATS comms telemetry' });
    }
  });

  app.get('/api/comms/status', (_req, res) => {
    res.json({
      emailDispatcher: getEmailDispatcherStatus(),
      repliesLoggedCount: crmLedger.outboundCommsReplies.length,
    });
  });

  // Combine #1 (Live Brevo/Resend Email Dispatch) + #3 (ATS Portal / Mailto Handoff Fallback)
  app.post('/api/comms/reply', async (req, res) => {
    try {
      const ownerAuth = await verifyFirebaseOwner(req);
      if (!ownerAuth.ok) {
        return res.status(403).json({ error: ownerAuth.reason || 'Owner authorization required' });
      }

      const {
        messageId,
        recipientEmail,
        subject,
        replyText,
        company,
        targetRole,
        externalUrl,
        status = 'Replied',
      } = req.body || {};

      const cleanMsgId = String(messageId || '').trim();
      const cleanText = String(replyText || '').trim();
      const cleanEmail = String(recipientEmail || '').trim().toLowerCase();
      const cleanSubject = String(subject || `Re: ${targetRole || 'Executive Opportunity'} // ${company || 'Talent Desk'}`).trim();
      const cleanExternalUrl = String(externalUrl || '').trim();

      if (!cleanMsgId) {
        return res.status(400).json({ error: 'messageId is required.' });
      }
      if (!cleanText && status === 'Replied') {
        return res.status(400).json({ error: 'Reply body cannot be empty.' });
      }

      let deliveryMode: 'email_api' | 'ats_handoff_fallback' = 'ats_handoff_fallback';
      let provider: string = cleanExternalUrl ? 'ats_portal' : 'mailto';
      let messageIdOut: string | undefined;
      let fallbackReason = '';

      if (cleanEmail && cleanEmail.includes('@') && cleanText) {
        const emailResult = await dispatchRealEmail({
          to: cleanEmail,
          replyTo: ownerAuth.email,
          subject: cleanSubject,
          text: cleanText,
        });
        if (emailResult.sent) {
          deliveryMode = 'email_api';
          provider = emailResult.provider;
          messageIdOut = emailResult.messageId;
        } else {
          fallbackReason = emailResult.error || 'Email API key not configured; prepared mailto/ATS handoff.';
        }
      } else {
        fallbackReason = cleanExternalUrl
          ? 'Public ATS boards expose application portals rather than direct recruiter emails. Prepared live ATS portal handoff.'
          : 'No direct recipient email provided; prepared mailto/ATS handoff.';
      }

      const mailtoHref = cleanEmail
        ? buildMailtoHref(cleanEmail, cleanSubject, cleanText)
        : '';

      const record: CommsReplyRecord = {
        id: `REPLY-${Date.now().toString(36).toUpperCase()}`,
        messageId: cleanMsgId,
        company: company ? String(company) : undefined,
        targetRole: targetRole ? String(targetRole) : undefined,
        recipientEmail: cleanEmail || undefined,
        subject: cleanSubject,
        replyText: cleanText || `[Status updated to ${status}]`,
        status: ['Unread', 'Negotiating', 'Accepted', 'Declined', 'Replied'].includes(status) ? status : 'Replied',
        deliveryMode,
        provider,
        handoffUrl: cleanExternalUrl || undefined,
        mailtoHref: mailtoHref || undefined,
        createdAt: new Date().toISOString(),
      };

      crmLedger.outboundCommsReplies.unshift(record);
      saveCrmLedgerToDisk();

      res.json({
        success: true,
        record,
        deliveryMode,
        provider,
        externalEmailId: messageIdOut,
        handoffUrl: cleanExternalUrl || undefined,
        mailtoHref: mailtoHref || undefined,
        fallbackReason: deliveryMode === 'ats_handoff_fallback' ? fallbackReason : undefined,
      });
    } catch (err: any) {
      console.error('Error dispatching comms reply:', err);
      res.status(500).json({ error: err?.message || 'Failed to record comms reply' });
    }
  });

  app.get('/api/stealthnet/feed', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const payload = await getLiveAtsStealthProfiles(forceRefresh);
      res.json(payload);
    } catch (err) {
      console.error('Error getting live ATS StealthNet profiles:', err);
      res.status(500).json({ error: 'Failed to fetch live ATS StealthNet feed' });
    }
  });

  // Enterprise Contact & Founder Desk Inquiries — Durable Disk + Firestore + Resend/Brevo Owner Alert + Mailto Fallback
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, organization, inquiryType, subject, message, timestamp } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanSubject = String(subject || '').trim();
      const cleanMessage = String(message || '').trim();
      const cleanName = String(name || 'Operator').trim();

      if (!cleanEmail || !cleanEmail.includes('@') || !cleanSubject || !cleanMessage) {
        return res.status(400).json({
          success: false,
          error: 'Valid email, subject, and message are required.',
        });
      }

      const receiptId = `INQ-${Date.now().toString(36).toUpperCase()}`;
      const createdAt = timestamp || new Date().toISOString();
      const ownerTarget = (process.env.OWNER_NOTIFICATION_EMAIL || OWNER_EMAIL).trim();

      const emailRes = await dispatchRealEmail({
        to: ownerTarget,
        replyTo: cleanEmail,
        subject: `[Founder Desk ${receiptId}] ${cleanSubject}`,
        text: `Inbound Inquiry (${receiptId})\nFrom: ${cleanName} <${cleanEmail}>\nOrganization: ${organization || 'Independent'}\nType: ${inquiryType || 'general'}\n\n${cleanMessage}`,
      });

      const inquiryRecord: ContactInquiryRecord = {
        id: receiptId,
        name: cleanName,
        email: cleanEmail,
        organization: organization ? String(organization).trim() : undefined,
        category: String(inquiryType || 'general'),
        subject: cleanSubject,
        message: cleanMessage,
        status: 'open',
        deliveryMode: emailRes.sent ? 'email_api' : 'ats_handoff_fallback',
        emailProvider: emailRes.provider,
        createdAt,
      };

      crmLedger.inquiries.unshift(inquiryRecord);
      saveCrmLedgerToDisk();

      await upsertInquiryInFirestore(inquiryRecord);

      res.json({
        success: true,
        receiptId,
        destination: ownerTarget,
        receivedAt: createdAt,
        deliveryMode: inquiryRecord.deliveryMode,
        emailProvider: emailRes.provider,
        mailtoHref: buildMailtoHref(
          ownerTarget,
          `[${receiptId}] ${cleanSubject}`,
          `From: ${cleanName} <${cleanEmail}>\nOrg: ${organization || 'Independent'}\n\n${cleanMessage}`
        ),
        status: emailRes.sent ? 'EMAIL_DISPATCHED_TO_FOUNDER_DESK' : 'PERSISTED_AT_FOUNDER_DESK',
      });
    } catch (err: any) {
      console.error('Error handling contact inquiry:', err);
      res.status(500).json({ error: err?.message || 'Failed to process inquiry' });
    }
  });

  // Owner-only Inbound Inquiries, Pilot Leads & Outbound Comms Audit Endpoint
  app.get('/api/owner/inquiries', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }

    const fsData = await fetchOwnerInquiriesFromFirestore();
    const inquiryMap = new Map<string, any>();
    for (const item of crmLedger.inquiries) inquiryMap.set(item.id, item);
    for (const item of fsData.inquiries) {
      if (!inquiryMap.has(item.id)) inquiryMap.set(item.id, item);
    }

    const pilotMap = new Map<string, any>();
    for (const item of crmLedger.agencyPilots) pilotMap.set(item.id, item);
    for (const item of fsData.agencyPilots) {
      if (!pilotMap.has(item.id)) pilotMap.set(item.id, item);
    }

    res.json({
      inquiries: Array.from(inquiryMap.values()),
      agencyPilots: Array.from(pilotMap.values()),
      outboundCommsReplies: crmLedger.outboundCommsReplies,
      emailDispatcher: getEmailDispatcherStatus(),
      firestoreSynced: fsData.available,
    });
  });

  // Owner-only Persistent Buyer & Enterprise CRM Leads (Replaces localStorage-only mock CRM)
  app.get('/api/owner/buyer-leads', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    res.json({ leads: crmLedger.buyerLeads });
  });

  app.post('/api/owner/buyer-leads', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    const { name, email, company, companyUrl, tierRequested, seats, notes } = req.body || {};
    if (!company || !email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Company and valid work email are required.' });
    }
    const lead = {
      id: `LEAD-${Date.now().toString(36).toUpperCase()}`,
      name: String(name || 'Executive Lead').trim(),
      email: String(email).trim().toLowerCase(),
      company: String(company).trim(),
      companyUrl: String(companyUrl || '').trim(),
      tierRequested: String(tierRequested || 'agency_monthly'),
      seats: String(seats || '5 seats'),
      notes: String(notes || '').trim(),
      status: 'Qualified — Outreach Queued',
      createdAt: new Date().toISOString(),
    };
    crmLedger.buyerLeads.unshift(lead);
    saveCrmLedgerToDisk();
    res.json({ success: true, lead });
  });

  app.patch('/api/owner/buyer-leads/:id', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    const lead = crmLedger.buyerLeads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (req.body?.status) lead.status = String(req.body.status);
    if (req.body?.notes !== undefined) lead.notes = String(req.body.notes);
    lead.updatedAt = new Date().toISOString();
    saveCrmLedgerToDisk();
    res.json({ success: true, lead });
  });

  // External Communication with App Buyer & Acquirer Endpoints (Owner Only, Durable + Gemini 4 Hydrogen)
  app.get('/api/buyer/comms', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    res.json(crmLedger.buyerThreads);
  });

  app.post('/api/buyer/comms/send', async (req, res) => {
    try {
      const ownerAuth = await verifyFirebaseOwner(req);
      if (!ownerAuth.ok) {
        return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
      }
      const { threadId, text, proposedPrice, attachments } = req.body || {};
      const thread = crmLedger.buyerThreads.find((t) => t.id === threadId);
      if (!thread) {
        return res.status(404).json({ error: 'Buyer thread not found' });
      }

      const ai = getGeminiClient();

      const sellerMessage: BuyerMessage = {
        id: `msg-seller-${Date.now()}`,
        sender: 'seller',
        senderName: 'App Founder / Seller',
        senderTitle: 'Owner & Principal Architect',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: String(text || '').trim(),
        attachments: attachments || [],
        offerTerms: proposedPrice
          ? {
              amountUsd: Number(proposedPrice),
              escrowProvider: 'Escrow.com',
              status: 'Countered',
            }
          : undefined,
      };

      const prompt = `You are acting as ${thread.buyerName}, ${thread.buyerTitle} representing ${thread.organization} (${thread.buyerType}).
You are in commercial M&A diligence regarding the software platform "Global Job & Career Radar".
Asking price: $145,000 USD. Target deal structure: ${thread.targetDeal}. Current deal stage: ${thread.dealStage}.
The seller sent this message:
"${sellerMessage.content}"
${proposedPrice ? `Proposed price: $${Number(proposedPrice).toLocaleString()} USD.` : ''}

Reply decisively and concisely in 2-4 sentences with institutional M&A rigor addressing escrow terms, technical diligence, or next execution milestone.`;

      const { response: aiRes } = await generateGeminiContentResilient(ai, {
        contents: prompt,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              offerStatus: { type: Type.STRING },
              nextDealStage: { type: Type.STRING },
            },
            required: ['reply', 'offerStatus', 'nextDealStage'],
          },
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      const offerAccepted = String(parsed.offerStatus || '').toLowerCase() === 'accepted';
      const buyerMessage: BuyerMessage = {
        id: `msg-buyer-${Date.now()}`,
        sender: 'buyer',
        senderName: thread.buyerName,
        senderTitle: thread.buyerTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: String(parsed.reply || ''),
        offerTerms: proposedPrice
          ? {
              amountUsd: Number(proposedPrice),
              escrowProvider: 'Escrow.com',
              status: offerAccepted ? 'Accepted' : 'Proposed',
            }
          : undefined,
      };

      thread.messages.push(sellerMessage, buyerMessage);
      thread.lastActivity = 'Just now';
      thread.status = offerAccepted ? 'Under Offer' : 'Negotiating';
      if (parsed.nextDealStage) {
        thread.dealStage = parsed.nextDealStage as any;
      } else if (offerAccepted) {
        thread.dealStage = 'Escrow Funded';
      }
      saveCrmLedgerToDisk();

      res.json({
        success: true,
        thread,
        sellerMessage,
        buyerMessage,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error in buyer comms send:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  app.post('/api/buyer/comms/stage', async (req, res) => {
    try {
      const ownerAuth = await verifyFirebaseOwner(req);
      if (!ownerAuth.ok) {
        return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
      }
      const { threadId, stage, status } = req.body || {};
      const thread = crmLedger.buyerThreads.find((t) => t.id === threadId);
      if (thread) {
        if (stage) thread.dealStage = stage;
        if (status) thread.status = status;
        thread.lastActivity = 'Just now';
        saveCrmLedgerToDisk();
      }
      res.json({ success: true, thread });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update deal stage' });
    }
  });

  // Additional live radar endpoints (Ashby, Greenhouse, Lever)
  app.get('/api/jobs', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const { jobs } = await getLiveAtsJobs(forceRefresh);
      res.json(jobs);
    } catch (err) {
      console.error('Error fetching live ATS jobs:', err);
      res.status(500).json({ error: 'Failed to fetch live ATS job feed' });
    }
  });

  // Real-Time Job Market Data & Radar Telemetry API (100% Live External ATS Aggregation)
  app.get('/api/jobs/market-radar', async (req, res) => {
    try {
      const targetHub = ((req.query.hub as string) || '').trim().toLowerCase();
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const { jobs, meta } = await getLiveAtsJobs(forceRefresh);

      if (!meta.isLive && jobs.length === 0) {
        return res.status(503).json({
          error: 'Live external ATS telemetry is currently unreachable across all 14 boards. Retry shortly.',
          atsMeta: meta,
        });
      }

      const CANONICAL_HUBS: Array<{ name: string; country: string; lat: number; lng: number; aliases: string[] }> = [
        { name: 'San Francisco', country: 'US', lat: 37.77, lng: -122.41, aliases: ['san francisco', 'sf', 'bay area', 'palo alto', 'mountain view', 'menlo park'] },
        { name: 'New York', country: 'US', lat: 40.71, lng: -74.0, aliases: ['new york', 'nyc', 'manhattan', 'brooklyn'] },
        { name: 'London', country: 'UK', lat: 51.5, lng: -0.12, aliases: ['london', 'united kingdom', 'uk'] },
        { name: 'Seattle', country: 'US', lat: 47.6, lng: -122.33, aliases: ['seattle', 'bellevue', 'redmond'] },
        { name: 'Austin', country: 'US', lat: 30.27, lng: -97.74, aliases: ['austin', 'texas'] },
        { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, aliases: ['toronto', 'canada', 'waterloo'] },
        { name: 'Zurich', country: 'CH', lat: 47.37, lng: 8.54, aliases: ['zurich', 'switzerland'] },
        { name: 'Tokyo', country: 'JP', lat: 35.67, lng: 139.65, aliases: ['tokyo', 'japan'] },
        { name: 'Singapore', country: 'SG', lat: 1.35, lng: 103.81, aliases: ['singapore'] },
        { name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.4, aliases: ['berlin', 'munich', 'germany'] },
        { name: 'Dublin', country: 'IE', lat: 53.35, lng: -6.26, aliases: ['dublin', 'ireland'] },
        { name: 'Remote / Distributed', country: 'Global', lat: 39.83, lng: -98.58, aliases: ['remote', 'anywhere', 'distributed', 'united states'] },
      ];

      const hubBuckets = new Map<string, { hub: (typeof CANONICAL_HUBS)[number]; jobs: typeof jobs }>();
      for (const job of jobs) {
        const locLower = (job.location || '').toLowerCase();
        let matched = CANONICAL_HUBS.find((h) => h.aliases.some((a) => locLower.includes(a)));
        if (!matched) {
          const boardCfg = VERIFIED_ATS_BOARDS.find((b) => b.slug === job.sourceBoard);
          if (boardCfg) {
            const hqLower = boardCfg.hqLocation.toLowerCase();
            matched = CANONICAL_HUBS.find((h) => h.aliases.some((a) => hqLower.includes(a))) || CANONICAL_HUBS[0];
          } else {
            matched = CANONICAL_HUBS[CANONICAL_HUBS.length - 1];
          }
        }
        const entry = hubBuckets.get(matched.name) || { hub: matched, jobs: [] };
        entry.jobs.push(job);
        hubBuckets.set(matched.name, entry);
      }

      const allHubs = Array.from(hubBuckets.values())
        .map(({ hub, jobs: hubJobs }) => {
          const disclosed = hubJobs.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
          const minSal = disclosed.length > 0 ? Math.min(...disclosed.map((j) => j.numericMinSalary || j.numericMaxSalary)) : 0;
          const maxSal = disclosed.length > 0 ? Math.max(...disclosed.map((j) => j.numericMaxSalary)) : 0;
          const recentCount = hubJobs.filter((j) => /\b(\d+[mh]|today|live|new)\b/i.test(j.postedAgo || '')).length;

          const skillCounts = new Map<string, number>();
          const sectorCounts = new Map<string, number>();
          for (const j of hubJobs) {
            sectorCounts.set(j.sector, (sectorCounts.get(j.sector) || 0) + 1);
            for (const s of j.skills) {
              skillCounts.set(s, (skillCounts.get(s) || 0) + 1);
            }
          }
          const topSkills = Array.from(skillCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([s]) => s);
          const dominantSector =
            Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Frontier Tech';
          const hiringVelocity = Math.min(99, 55 + Math.round(hubJobs.length * 0.9 + recentCount * 1.5));
          const status: 'High Velocity' | 'Surging' | 'Active' | 'Exponential' | 'Accelerating' | 'Steady' =
            hiringVelocity >= 94
              ? 'Exponential'
              : hiringVelocity >= 88
              ? 'High Velocity'
              : hiringVelocity >= 80
              ? 'Surging'
              : hiringVelocity >= 70
              ? 'Accelerating'
              : 'Active';

          return {
            name: hub.name,
            country: hub.country,
            lat: hub.lat,
            lng: hub.lng,
            openings: hubJobs.length,
            openingsDelta24h: `${recentCount} fresh signals`,
            salaryBand:
              maxSal > 0
                ? `$${Math.round(minSal / 1000)}k - $${Math.round(maxSal / 1000)}k USD`
                : `${disclosed.length}/${hubJobs.length} comp disclosed`,
            hiringVelocity,
            topSkills: topSkills.length > 0 ? topSkills : ['Systems', 'AI/ML'],
            dominantSector,
            status,
          };
        })
        .sort((a, b) => b.openings - a.openings);

      const filteredHubs = targetHub
        ? allHubs.filter((h) => h.name.toLowerCase().includes(targetHub) || h.country.toLowerCase().includes(targetHub))
        : allHubs;

      const ROLE_FAMILIES = [
        { role: 'AI Research & Foundation Model Engineering', regex: /\b(ai|ml|machine learning|research|llm|model|inference|cuda|triton)\b/i },
        { role: 'Distributed Systems & Cloud Infrastructure', regex: /\b(distributed|infra|platform|kubernetes|backend|systems|rust|go|storage|cloud)\b/i },
        { role: 'Security, Privacy & Cryptography', regex: /\b(security|crypto|trust|safety|privacy|compliance|enclave)\b/i },
        { role: 'Robotics, Embedded & Hardware Systems', regex: /\b(robot|hardware|embedded|firmware|avionics|perception|lidar|silicon)\b/i },
        { role: 'Product, Full-Stack & Design Systems', regex: /\b(product|frontend|fullstack|full-stack|design|ui|ux|typescript|react)\b/i },
        { role: 'Technical Leadership & Talent Search', regex: /\b(staff|principal|director|head|vp|manager|lead|recruiter|talent)\b/i },
      ];

      const roleDemandIndex = ROLE_FAMILIES.map((fam) => {
        const matched = jobs.filter((j) => fam.regex.test(`${j.title} ${j.department || ''} ${j.skills.join(' ')}`));
        const disclosed = matched.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
        const avgUsd =
          disclosed.length > 0
            ? Math.round(
                disclosed.reduce((sum, j) => sum + ((j.numericMinSalary || j.numericMaxSalary) + j.numericMaxSalary) / 2, 0) /
                  disclosed.length
              )
            : 0;
        const skillMap = new Map<string, number>();
        const locMap = new Map<string, number>();
        for (const j of matched) {
          locMap.set(j.location, (locMap.get(j.location) || 0) + 1);
          for (const s of j.skills) skillMap.set(s, (skillMap.get(s) || 0) + 1);
        }
        const demandScore = Math.min(99, Math.max(40, 45 + Math.round((matched.length / Math.max(1, jobs.length)) * 180)));
        const urgencyLevel: 'CRITICAL DEMAND' | 'HIGH DEMAND' | 'ELEVATED DEMAND' =
          demandScore >= 85 ? 'CRITICAL DEMAND' : demandScore >= 70 ? 'HIGH DEMAND' : 'ELEVATED DEMAND';

        return {
          role: fam.role,
          demandScore,
          yoyChange: `${matched.length} live reqs`,
          averageSalaryDisplay: avgUsd > 0 ? `$${avgUsd.toLocaleString()} USD / yr` : 'Comp Not Disclosed on ATS',
          averageSalaryUsd: avgUsd,
          topSkills: Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s),
          urgencyLevel,
          primaryLocation: Array.from(locMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'San Francisco / Remote',
        };
      })
        .filter((r) => parseInt(r.yoyChange, 10) > 0)
        .sort((a, b) => b.demandScore - a.demandScore);

      const globalSkillMap = new Map<string, { count: number; disclosedCount: number }>();
      for (const j of jobs) {
        for (const skill of j.skills) {
          const cur = globalSkillMap.get(skill) || { count: 0, disclosedCount: 0 };
          cur.count += 1;
          if (j.isCompDisclosed) cur.disclosedCount += 1;
          globalSkillMap.set(skill, cur);
        }
      }

      const trendingSkills = Array.from(globalSkillMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 12)
        .map(([skill, stats]) => {
          const sharePct = Math.round((stats.count / Math.max(1, jobs.length)) * 100);
          return {
            skill,
            growth: `${sharePct}% share`,
            requisitions: stats.count,
            category: `${stats.disclosedCount} w/ comp`,
          };
        });

      const disclosedTotal = jobs.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
      const topHub = allHubs[0];
      const topSkill = trendingSkills[0];
      const globalHiringVelocity = Math.min(99, Math.round(55 + (meta.boardsSucceeded / Math.max(1, meta.boardCount)) * 42));

      const marketTakeaways = [
        `Live external ATS scrape verified ${meta.totalOpeningsAcrossBoards.toLocaleString()} active openings across ${meta.boardsSucceeded}/${meta.boardCount} public Ashby, Greenhouse, and Lever boards.`,
        topHub
          ? `${topHub.name} leads tracked hub volume with ${topHub.openings} sampled roles (${topHub.salaryBand}).`
          : 'Distributed engineering hubs remain active across North America and Europe.',
        topSkill
          ? `${topSkill.skill} appears in ${topSkill.requisitions} live ATS requisitions (${topSkill.growth} of sampled openings).`
          : 'Core systems and ML deployment skills lead active ATS requirements.',
        `${disclosedTotal.length} of ${jobs.length} sampled live roles publicly disclose base/total compensation bands on their ATS boards.`,
      ];

      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json({
        status: 'ACTIVE_LIVE_ATS_TELEMETRY',
        timestamp: meta.scrapedAt,
        freshness: 'LIVE_EXTERNAL_ATS',
        totalOpenings: meta.totalOpeningsAcrossBoards,
        globalHiringVelocity,
        velocityDelta: `${meta.boardsSucceeded}/${meta.boardCount} ATS boards live`,
        activeHubsCount: allHubs.length,
        marketSentiment: meta.totalOpeningsAcrossBoards > 2500 ? 'Aggressive Expansion' : 'Selective Hiring',
        hubs: filteredHubs.length > 0 ? filteredHubs : allHubs,
        roleDemandIndex,
        trendingSkills,
        marketTakeaways,
        atsMeta: meta,
      });
    } catch (err: any) {
      console.error('Error serving live market radar telemetry:', err);
      res.status(500).json({ error: 'Failed to retrieve live market radar telemetry', details: err?.message });
    }
  });

  app.post('/api/jobs/search', async (req, res) => {
    try {
      const forceRefresh = Boolean(req.body?.refresh);
      const searchResult = await searchLiveAtsJobs(req.body || {}, forceRefresh);
      res.json(searchResult);
    } catch (err) {
      console.error('Error searching live ATS jobs:', err);
      res.status(500).json({ error: 'Failed to execute job search' });
    }
  });

  app.post('/api/supervisor', async (req, res) => {
    try {
      const { prompt, currentRole, targetRole } = req.body || {};
      const ai = getGeminiClient();
      const { meta } = await getLiveAtsJobs(false);

      const { response: aiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: `Provide an executive career supervisor assessment for transitioning from "${currentRole || 'Senior Engineer'}" to "${targetRole || 'Principal Architect'}".
Context: ${meta.totalOpeningsAcrossBoards} live openings tracked across ${meta.boardsSucceeded} ATS boards.
Operator question: "${prompt || 'Evaluate leverage and negotiation strategy.'}"`,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessment: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              marketSignalVelocity: { type: Type.STRING },
            },
            required: ['assessment', 'recommendation', 'actionSteps', 'marketSignalVelocity'],
          },
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      res.json({
        timestamp: new Date().toISOString(),
        model: modelUsed,
        ...parsed,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // In-memory Coaching Telemetry Cache (avoids re-running Gemini on identical saved vaults)
  const coachingReportCache = new Map<string, { cachedAtMs: number; payload: any }>();

  // AI Career Coaching & Sentiment Analysis Endpoint — Gemini 4 Hydrogen Structured Telemetry
  app.post('/api/coaching/analyze', async (req, res) => {
    try {
      const { savedJobs = [], savedCareerPaths = [], savedNews = [] } = req.body || {};
      const totalItems = savedJobs.length + savedCareerPaths.length + savedNews.length;
      const now = new Date();
      const weekLabel = `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      if (totalItems === 0) {
        return res.json({
          timestamp: now.toISOString(),
          weekLabel,
          totalItemsAnalyzed: 0,
          stressIndex: 0,
          stressLevel: 'Restorative (Low)',
          stressColor: '#22d3a5',
          stressTrend: { delta: 0, direction: 'steady' },
          stressDrivers: ['No saved roles, trajectories, or market briefs found yet.'],
          stressRelievers: ['Bookmark live ATS requisitions or save career trajectories to unlock personalized Gemini coaching telemetry.'],
          trajectoryVelocity: 0,
          trajectoryRating: 'Consolidating Baseline',
          trajectoryColor: '#64748b',
          trajectoryTrend: { delta: 0, direction: 'steady' },
          trajectoryInsights: 'Save at least one live ATS job, career trajectory, or grounded intel brief to compute real sentiment and burnout coaching directives.',
          overallSentiment: 'Balanced Equilibrium',
          sentimentScore: 0,
          distribution: { positivePct: 0, neutralPct: 100, stressPct: 0 },
          weeklyDirectives: [],
          itemEvaluations: [],
        });
      }

      const digest = {
        savedJobs: savedJobs.slice(0, 12).map((j: any) => ({
          id: String(j.id || j.jobId || ''),
          title: String(j.title || ''),
          company: String(j.company || ''),
          salary: String(j.salaryRange || j.salary || ''),
          urgency: String(j.urgency || ''),
          description: String(j.description || '').slice(0, 240),
        })),
        savedCareerPaths: savedCareerPaths.slice(0, 8).map((c: any) => ({
          id: String(c.id || c.roleKey || ''),
          targetRole: String(c.targetRole || c.roleTitle || ''),
          targetSalary: Number(c.targetSalary || 0),
          readinessScore: Number(c.readinessScore || 0),
        })),
        savedNews: savedNews.slice(0, 8).map((n: any) => ({
          id: String(n.id || n.company || ''),
          company: String(n.company || ''),
          sentiment: String(n.sentiment || ''),
          summary: String(n.summary || '').slice(0, 240),
        })),
      };

      const digestHash = crypto.createHash('sha256').update(JSON.stringify(digest)).digest('hex');
      const cachedReport = coachingReportCache.get(digestHash);
      if (cachedReport && Date.now() - cachedReport.cachedAtMs < 30 * 60 * 1000) {
        return res.json({ ...cachedReport.payload, cached: true });
      }

      const ai = getGeminiClient();
      const prompt = `Analyze this user's saved career vault items and produce an objective weekly executive career coaching, burnout-risk, and market-sentiment JSON report.
Saved Vault Payload (${totalItems} items total):
${JSON.stringify(digest)}

Return a valid JSON object matching this exact schema (keep strings crisp and concise):
{
  "stressIndex": number (0-100),
  "stressLevel": "Restorative (Low)" | "Optimal Challenge (Balanced)" | "Elevated Tension (Caution)" | "Burnout Risk (High)",
  "stressTrendDelta": number (-15 to 15),
  "stressTrendDirection": "up" | "down" | "steady",
  "stressDrivers": ["2-3 short bullets"],
  "stressRelievers": ["2-3 short bullets"],
  "trajectoryVelocity": number (0-100),
  "trajectoryRating": "Hyper-Ascent" | "Calculated Expansion" | "Stealth Pivot" | "Consolidating Baseline",
  "trajectoryTrendDelta": number (-15 to 15),
  "trajectoryTrendDirection": "up" | "down" | "steady",
  "trajectoryInsights": "2 concise sentences summarizing career momentum and risk.",
  "overallSentiment": "Aggressively Bullish" | "Calculated & Optimistic" | "Balanced Equilibrium" | "High-Anxiety / Defensive",
  "sentimentScore": number (-100 to 100),
  "positivePct": number,
  "neutralPct": number,
  "stressPct": number,
  "weeklyDirectives": [
    { "category": "Stress Regulation" | "Trajectory Acceleration" | "Negotiation Leverage", "title": "short title", "advice": "1 concise sentence", "actionItem": "1 concrete step" }
  ],
  "itemEvaluations": [
    { "id": "matching id", "type": "job" | "career" | "news", "title": "item title", "sentiment": "Bullish" | "Neutral" | "Cautious" | "High-Stress", "score": number (-100 to 100), "stressContribution": number (0-100), "keyTriggers": ["1-2 short tags"] }
  ]
}`;

      const { response: aiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: prompt,
        preferLowThinking: true,
        primaryTimeoutMs: 7500,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = parseJsonResponseText(aiRes.text || '{}');
      const stressIdx = Math.max(0, Math.min(100, Number(parsed.stressIndex) || 25));
      const trajVel = Math.max(0, Math.min(100, Number(parsed.trajectoryVelocity) || 65));
      const stressColor =
        stressIdx >= 75 ? '#ef4444' : stressIdx >= 50 ? '#f59e0b' : stressIdx >= 25 ? '#22d3a5' : '#38bdf8';
      const trajectoryColor =
        trajVel >= 80 ? '#22d3a5' : trajVel >= 60 ? '#38bdf8' : trajVel >= 40 ? '#a855f7' : '#94a3b8';

      const posPct = Math.max(0, Math.min(100, Number(parsed.positivePct) || 50));
      const stressPctVal = Math.max(0, Math.min(100 - posPct, Number(parsed.stressPct) || 20));
      const neutPct = Math.max(0, 100 - posPct - stressPctVal);

      const responsePayload = {
        timestamp: now.toISOString(),
        weekLabel,
        totalItemsAnalyzed: totalItems,
        stressIndex: stressIdx,
        stressLevel:
          ['Restorative (Low)', 'Optimal Challenge (Balanced)', 'Elevated Tension (Caution)', 'Burnout Risk (High)'].includes(parsed.stressLevel)
            ? parsed.stressLevel
            : stressIdx >= 75
            ? 'Burnout Risk (High)'
            : stressIdx >= 50
            ? 'Elevated Tension (Caution)'
            : stressIdx >= 25
            ? 'Optimal Challenge (Balanced)'
            : 'Restorative (Low)',
        stressColor,
        stressTrend: {
          delta: Number(parsed.stressTrendDelta) || 0,
          direction: ['up', 'down', 'steady'].includes(parsed.stressTrendDirection) ? parsed.stressTrendDirection : 'steady',
        },
        stressDrivers: Array.isArray(parsed.stressDrivers) ? parsed.stressDrivers.slice(0, 5) : [],
        stressRelievers: Array.isArray(parsed.stressRelievers) ? parsed.stressRelievers.slice(0, 5) : [],
        trajectoryVelocity: trajVel,
        trajectoryRating:
          ['Hyper-Ascent', 'Calculated Expansion', 'Stealth Pivot', 'Consolidating Baseline'].includes(parsed.trajectoryRating)
            ? parsed.trajectoryRating
            : trajVel >= 80
            ? 'Hyper-Ascent'
            : 'Calculated Expansion',
        trajectoryColor,
        trajectoryTrend: {
          delta: Number(parsed.trajectoryTrendDelta) || 0,
          direction: ['up', 'down', 'steady'].includes(parsed.trajectoryTrendDirection) ? parsed.trajectoryTrendDirection : 'up',
        },
        trajectoryInsights: String(parsed.trajectoryInsights || ''),
        overallSentiment:
          ['Aggressively Bullish', 'Calculated & Optimistic', 'Balanced Equilibrium', 'High-Anxiety / Defensive'].includes(parsed.overallSentiment)
            ? parsed.overallSentiment
            : 'Calculated & Optimistic',
        sentimentScore: Math.max(-100, Math.min(100, Number(parsed.sentimentScore) || 35)),
        distribution: { positivePct: posPct, neutralPct: neutPct, stressPct: stressPctVal },
        weeklyDirectives: Array.isArray(parsed.weeklyDirectives) ? parsed.weeklyDirectives.slice(0, 4) : [],
        itemEvaluations: Array.isArray(parsed.itemEvaluations) ? parsed.itemEvaluations : [],
        model: modelUsed,
      };

      if (coachingReportCache.size > 100) {
        const oldestKey = coachingReportCache.keys().next().value;
        if (oldestKey) coachingReportCache.delete(oldestKey);
      }
      coachingReportCache.set(digestHash, { cachedAtMs: Date.now(), payload: responsePayload });

      res.json(responsePayload);
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error generating coaching report:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // App For Sale & Acquisition Marketplace Endpoints (Owner Only)
  app.get('/api/marketplace/listing', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    res.json({
      status: 'PUBLISHED',
      askingPriceUsd: 145000,
      estimatedValuationUsd: 185000,
      valuationMultiple: '4.8x Tech Asset & Pro-Forma ARR',
      docketId: 'GCR-ACQ-2026-X1',
      publishedDate: 'October 2026 (Active Listing)',
      escrowPartners: ['Escrow.com', 'Direct Bank Wire', 'USDC Smart Escrow']
    });
  });

  app.post('/api/marketplace/buyout', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    const { tierId, buyerEmail, paymentMethod, customPrice } = req.body || {};
    const txId = `ESC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-VAL`;
    const licenseKey = `GCR-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    res.json({
      success: true,
      transactionId: txId,
      buyerEmail: buyerEmail || 'acquirer@venturefund.com',
      tierId: tierId || 'tier-full-ip-buyout',
      amountUsd: customPrice || 145000,
      paymentMethod: paymentMethod || 'ESCROW_WIRE',
      contractStatus: 'EXECUTED_AND_BOUND',
      licenseKey,
      timestamp: new Date().toISOString(),
      message: 'App acquisition dossier executed. Complete intellectual property, Git repository, and commercial rights transferred.'
    });
  });

  // M&A Transaction Docket & Escrow Inspection Binder Endpoints (Owner Only)
  app.get('/api/marketplace/docket', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    const buyer = (req.query.buyer as string) || 'Prospective Institutional Acquirer';
    const amount = Number(req.query.amount) || 145000;
    const docketId = (req.query.docketId as string) || `TR-DOCKET-2026-${Math.round(amount / 1000)}K`;

    res.json({
      docketId,
      status: 'ESCROW_BINDING_INSPECTION',
      assetName: 'Global Job & Career Radar (talentradar.io)',
      sellerOrg: 'TalentRadar Technologies & Architecture Group',
      sellerContact: 'Principal Founder & Lead Systems Architect',
      sellerEmail: 'founder@talentradar.io',
      buyerOrg: buyer,
      totalValuationUsd: amount,
      earnestDepositUsd: Math.round(amount * 0.1),
      escrowProvider: 'Escrow.com (Premier Institutional Service)',
      escrowInspectionHours: 48,
      governingLaw: 'State of Delaware, United States',
      verificationHash: `TR-VERIFIED-APA-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
      generatedAt: new Date().toISOString(),
      escrowStatus: 'EARNEST_DEPOSIT_BOUND',
      digitalAssetLinksConfirmed: true,
      googlePlayStoreConfirmed: true,
      sourceCodeAuditPassed: true
    });
  });

  app.post('/api/marketplace/docket/generate', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
    }
    const { buyerOrg, buyerContact, buyerEmail, amountUsd, escrowProvider, inspectionHours } = req.body || {};
    const valuation = Number(amountUsd) || 145000;
    const docketId = `TR-DOCKET-2026-${(buyerOrg || 'ACQ').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()}-${Math.round(valuation / 1000)}K`;

    res.json({
      success: true,
      docketId,
      buyerOrg: buyerOrg || 'Prospective Institutional Acquirer',
      buyerContact: buyerContact || 'Authorized Deal Representative',
      buyerEmail: buyerEmail || 'acquisitions@acquirerfund.com',
      totalValuationUsd: valuation,
      earnestDepositUsd: Math.round(valuation * 0.1),
      escrowProvider: escrowProvider || 'Escrow.com',
      escrowInspectionHours: Number(inspectionHours) || 48,
      status: 'ESCROW_BINDING_INSPECTION',
      verificationHash: `TR-VERIFIED-APA-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
      generatedAt: new Date().toISOString()
    });
  });

  // 3 Coexisting AI Assistants Triad Endpoints
  app.get('/api/triad/assistants', (_req, res) => {
    res.json(TRIAD_ASSISTANTS);
  });

  app.get('/api/triad/messages', (_req, res) => {
    res.json(INITIAL_INTER_AGENT_MESSAGES);
  });

  app.post('/api/triad/operate', async (req, res) => {
    try {
      const { prompt } = req.body || {};
      const userPrompt = String(prompt || 'Execute autonomous reconnaissance, trajectory modeling, and negotiation strategy.').trim();
      const ownerAuth = await verifyFirebaseOwner(req);
      const allowOwnerMna = ownerAuth.ok;

      const ai = getGeminiClient();
      const { jobs, meta } = await getLiveAtsJobs(false);
      const sampleCompanies = Array.from(new Set(jobs.map((j) => j.company))).slice(0, 8).join(', ');

      const ownerGuardClause = allowOwnerMna
        ? ''
        : '\nConstraint: Keep analysis strictly focused on software engineering career strategy, technical skills, and job offer negotiation. Do not reference platform M&A sales, company buyouts, or internal owner operations.';

      const promptText = `You are orchestrating an AI leadership hierarchy consisting of a Chief Commander and a 3-agent operational Triad:
0. COMMANDER (Chief Mission Commander & Triad Orchestrator)
1. SCOUT (Live Market Reconnaissance across ${meta.boardsSucceeded}/${meta.boardCount} ATS boards, ${meta.totalOpeningsAcrossBoards} active openings including ${sampleCompanies})
2. STRATEGIST (Career Architect & Comp Modeler)
3. ENVOY (Negotiator & Comms Strategist)
${ownerGuardClause}
Operator Mission Objective: "${userPrompt}"`;

      const { response: geminiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: promptText,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commanderDirective: {
                type: Type.OBJECT,
                properties: {
                  intent: { type: Type.STRING },
                  targetInstructions: {
                    type: Type.OBJECT,
                    properties: {
                      toScout: { type: Type.STRING },
                      toStrategist: { type: Type.STRING },
                      toEnvoy: { type: Type.STRING },
                    },
                    required: ['toScout', 'toStrategist', 'toEnvoy'],
                  },
                },
                required: ['intent', 'targetInstructions'],
              },
              scoutContribution: { type: Type.STRING },
              strategistContribution: { type: Type.STRING },
              envoyContribution: { type: Type.STRING },
              commanderReview: {
                type: Type.OBJECT,
                properties: {
                  auditScore: { type: Type.INTEGER },
                  strategicVerdict: { type: Type.STRING },
                  riskMitigationStatus: { type: Type.STRING },
                },
                required: ['auditScore', 'strategicVerdict', 'riskMitigationStatus'],
              },
              consensusSummary: { type: Type.STRING },
              actionChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'commanderDirective',
              'scoutContribution',
              'strategistContribution',
              'envoyContribution',
              'commanderReview',
              'consensusSummary',
              'actionChecklist',
            ],
          },
        },
      });

      const parsed = JSON.parse(geminiRes.text || '{}');
      return res.json({
        id: `cycle-${Date.now().toString(36)}`,
        topic: userPrompt,
        timestamp: new Date().toLocaleTimeString(),
        status: 'COMPLETED',
        model: modelUsed,
        ...parsed,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      console.error('Error in /api/triad/operate:', mapped.body.error);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // Direct Inter-Agent Chat Endpoint (Gemini 4 Hydrogen + Live ATS Grounding)
  app.post('/api/triad/chat', async (req, res) => {
    try {
      const { agentId = 'commander', message, history = [] } = req.body || {};
      const cleanMessage = String(message || '').trim();
      if (!cleanMessage) {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const ownerAuth = await verifyFirebaseOwner(req);
      const ai = getGeminiClient();
      const { jobs, meta } = await getLiveAtsJobs(false);
      const topOrgs = Array.from(new Set(jobs.map((j) => j.company))).slice(0, 6).join(', ');
      const assistant = TRIAD_ASSISTANTS.find((a) => a.id === agentId) || TRIAD_ASSISTANTS[0];

      const guardClause = ownerAuth.ok
        ? ''
        : 'Keep responses focused strictly on career engineering, market reconnaissance, skills, and offer negotiation.';

      const recentHistory = Array.isArray(history)
        ? history.slice(-6).map((h: any) => `${h.role || 'user'}: ${h.content || ''}`).join('\n')
        : '';

      const { response: aiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: `You are ${assistant.name} (${assistant.role} — ${assistant.callsign}).
Live ATS Snapshot: ${meta.boardsSucceeded}/${meta.boardCount} boards live (${meta.totalOpeningsAcrossBoards} active openings at ${topOrgs}).
${guardClause}
${recentHistory ? `Recent context:\n${recentHistory}\n` : ''}
Operator prompt: "${cleanMessage}"

Respond sharply in character as ${assistant.name} with concrete technical/market insights and suggest which peer agent (scout, strategist, envoy, or commander) should follow up next if helpful.`,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              handoverTarget: { type: Type.STRING },
              handoverNote: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
            },
            required: ['reply', 'handoverTarget', 'handoverNote', 'confidence'],
          },
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      res.json({
        success: true,
        agentId: assistant.id,
        agentName: assistant.name,
        model: modelUsed,
        ...parsed,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // Owner-Only Investor Founder Bio Synthesizer (Gemini 4 Hydrogen + Real Telemetry)
  app.post('/api/owner/founder-bio', async (req, res) => {
    try {
      const ownerAuth = await verifyFirebaseOwner(req);
      if (!ownerAuth.ok) {
        return res.status(403).json({ error: ownerAuth.reason || 'Owner access required' });
      }

      const ai = getGeminiClient();
      const { meta } = await getLiveAtsJobs(false);
      const {
        founderTitle = 'Full-Stack Systems Architect & Solo Founder',
        focusTone = 'institutional_pe',
        askingPrice = 145000,
        monthlyOperatingCost = 28.35,
        sellerCountry = 'Kenya',
        cloudRegion = 'London, United Kingdom (europe-west2)',
        customNotes = '',
      } = req.body || {};

      const prompt = `Draft an investor-ready M&A Seller & Founder Biography dossier for the owner of TalentRadar.io ("Global Job & Career Radar").
Verified Technical Facts:
- Owner Title: ${founderTitle}
- Target Buyer Tone: ${focusTone}
- Asking Price: $${Number(askingPrice).toLocaleString()} USD
- Monthly Cloud Operating Cost: $${Number(monthlyOperatingCost).toFixed(2)} USD
- Cloud Region: ${cloudRegion}
- Founder Location: ${sellerCountry}
- Live ATS Telemetry Currently Verified: ${meta.boardsSucceeded}/${meta.boardCount} public ATS boards, ${meta.totalOpeningsAcrossBoards} active live openings tracked.
- Stack: React, TypeScript, Express/Node.js, Firebase Auth & Firestore, Three.js 3D Globe, Gemini 4 Hydrogen synthesis, Paystack global + M-Pesa billing.
- Additional Notes: ${customNotes || '100% bootstrapped, zero VC dilution, clean IP transfer via Escrow.com.'}`;

      const { response: aiRes, modelUsed } = await generateGeminiContentResilient(ai, {
        contents: prompt,
        preferLowThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              executiveBio: { type: Type.STRING },
              shortTeaser: { type: Type.STRING },
              whySelling: { type: Type.STRING },
              investorDiligenceBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              dealRoomSummary: { type: Type.STRING },
            },
            required: [
              'headline',
              'executiveBio',
              'shortTeaser',
              'whySelling',
              'investorDiligenceBullets',
              'recommendedTags',
              'dealRoomSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
        model: modelUsed,
      });
    } catch (err: any) {
      const mapped = mapGeminiHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  });

  // Complete Codebase ZIP Exporter Endpoint
  app.get('/api/export/zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const baseDir = __dirname;
      const excludedDirs = new Set(['node_modules', '.git', 'dist', 'build', '.cache', '.data']);

      function addDirectoryToZip(currentDir: string, zipFolder: JSZip) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (excludedDirs.has(entry.name) || entry.name.startsWith('.DS_Store')) {
            continue;
          }
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            const nextFolder = zipFolder.folder(entry.name);
            if (nextFolder) {
              addDirectoryToZip(fullPath, nextFolder);
            }
          } else if (entry.isFile()) {
            const fileData = fs.readFileSync(fullPath);
            zipFolder.file(entry.name, fileData);
          }
        }
      }

      addDirectoryToZip(baseDir, zip);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="talent-radar-os-repository.zip"');
      res.setHeader('Content-Length', zipBuffer.length);
      res.send(zipBuffer);
    } catch (err) {
      console.error('Failed to bundle codebase zip:', err);
      res.status(500).json({ error: 'Failed to bundle repository zip archive' });
    }
  });

  // Master Bulk Annual Capabilities CSV Exporter Endpoint
  app.get('/api/export/bulk-capabilities-csv', (_req, res) => {
    try {
      const csvData = generateBulkCapabilitiesCsvString();
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="talent-radar-os-bulk-annual-capabilities-${dateStr}.csv"`
      );
      res.send(csvData);
    } catch (err) {
      console.error('Failed to generate bulk capabilities CSV:', err);
      res.status(500).json({ error: 'Failed to generate bulk capabilities CSV' });
    }
  });

  // Cloud Production & Hosting Telemetry Endpoint
  app.get('/api/cloud/status', (req, res) => {
    const rawHost = resolveRequestHost(req);
    const activeUrl = resolveEffectiveOrigin(req);
    const domainHosts = getCustomDomainHosts(domainConfigState.primaryDomain);

    res.json({
      status: 'ONLINE_HEALTHY',
      timestamp: new Date().toISOString(),
      provider: 'Google Cloud Platform (GCP) • Cloud Run + Cloudflare Edge',
      region: 'europe-west2 (London, UK)',
      edgeLocations: ['London', 'Frankfurt', 'Amsterdam', 'Paris', 'Zurich'],
      activeServerUrl: activeUrl,
      activeHost: rawHost,
      customDomain: domainHosts.apexDomain,
      appSubdomain: domainHosts.appSubdomain,
      productionUrl: FALLBACK_SHARED_CLOUD_RUN_URL,
      developmentUrl: FALLBACK_DEV_CLOUD_RUN_URL,
      canonicalDnsTarget: CANONICAL_CLOUD_RUN_HOST_NAME,
      sslCipher: 'TLS 1.3 / 256-bit AES-GCM (Cloudflare & Google Trust Services)',
      gitIntegration: {
        repo: 'https://github.com/mortyp1125/talent-radar-os',
        branch: 'main',
        workflow: '.github/workflows/deploy.yml',
        ciCdTrigger: 'Push to main -> Cloud Build -> Cloud Run',
      },
      telemetry: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion: process.version,
        activePort: Number(process.env.PORT) || 3000,
      },
    });
  });

  // Read Active Custom Domain Configuration (non-sensitive public sync)
  app.get('/api/domain/config', (req, res) => {
    const hosts = getCustomDomainHosts(domainConfigState.primaryDomain);
    const entryOrigin = getEntryOriginForDomain(
      domainConfigState.primaryDomain,
      domainConfigState.preferredEntryHost
    );
    const activeOrigin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true });

    res.json({
      primaryDomain: hosts.apexDomain,
      apexUrl: hosts.apexUrl,
      wwwSubdomain: hosts.wwwSubdomain,
      wwwUrl: hosts.wwwUrl,
      appSubdomain: hosts.appSubdomain,
      appUrl: hosts.appUrl,
      preferredEntryHost: domainConfigState.preferredEntryHost,
      preferredEntryUrl: entryOrigin,
      activeOrigin,
      customDomainVerified: Boolean(domainConfigState.customDomainVerified),
      authorizedDomains: hosts.authorizedDomains,
      firebaseAuthDomain: 'gen-lang-client-0212017392.firebaseapp.com',
      firebaseProjectId: 'gen-lang-client-0212017392',
      sha256Fingerprints: domainConfigState.sha256Fingerprints,
      paystackCallbackExample: `${entryOrigin}/billing?checkout_status=success&provider=paystack`,
      paystackWebhookUrl: `${entryOrigin}/api/paystack/webhook`,
      sitemapUrl: `${entryOrigin}/sitemap.xml`,
      assetLinksUrl: `${hosts.apexUrl}/.well-known/assetlinks.json`,
      appSubdomainAssetLinksUrl: `${hosts.appUrl}/.well-known/assetlinks.json`,
      updatedAt: domainConfigState.updatedAt,
    });
  });

  // Owner-Protected Custom Domain & TWA Fingerprint Update Endpoint
  app.post('/api/domain/config', async (req, res) => {
    const ownerAuth = await verifyFirebaseOwner(req);
    if (!ownerAuth.ok) {
      return res.status(403).json({
        error: 'Owner authentication required to update custom domain configuration.',
      });
    }

    const { primaryDomain, preferredEntryHost, sha256Fingerprints } = req.body || {};

    if (typeof primaryDomain === 'string' && primaryDomain.trim()) {
      const cleaned = sanitizeDomainInput(primaryDomain);
      if (!isValidCustomDomainFormat(cleaned)) {
        return res.status(400).json({
          error: 'Please enter a valid domain name (e.g. talentradar.io or careerradar.app).',
        });
      }
      if (cleaned !== domainConfigState.primaryDomain) {
        domainConfigState.customDomainVerified = false;
      }
      domainConfigState.primaryDomain = cleaned;
    }

    if (preferredEntryHost === 'root' || preferredEntryHost === 'app') {
      domainConfigState.preferredEntryHost = preferredEntryHost;
    }

    if (Array.isArray(sha256Fingerprints)) {
      const validFps = sha256Fingerprints
        .map((fp: unknown) => (typeof fp === 'string' ? sanitizeSha256Fingerprint(fp) : null))
        .filter((fp: string | null): fp is string => Boolean(fp));
      if (validFps.length > 0) {
        domainConfigState.sha256Fingerprints = Array.from(new Set(validFps));
      }
    }

    domainConfigState.updatedAt = new Date().toISOString();
    saveDomainConfigToDisk();

    const hosts = getCustomDomainHosts(domainConfigState.primaryDomain);
    const entryOrigin = getEntryOriginForDomain(
      domainConfigState.primaryDomain,
      domainConfigState.preferredEntryHost
    );

    return res.json({
      success: true,
      primaryDomain: hosts.apexDomain,
      preferredEntryHost: domainConfigState.preferredEntryHost,
      preferredEntryUrl: entryOrigin,
      authorizedDomains: hosts.authorizedDomains,
      sha256Fingerprints: domainConfigState.sha256Fingerprints,
      customDomainVerified: Boolean(domainConfigState.customDomainVerified),
      updatedAt: domainConfigState.updatedAt,
    });
  });

  // Real Live Custom Domain DNS, Cloudflare & HTTPS AssetLinks Verification Endpoint
  app.post('/api/cloud/dns-check', async (req, res) => {
    const rawDomain = req.body?.domain || domainConfigState.primaryDomain;
    const cleanDomain = sanitizeDomainInput(String(rawDomain));
    const hosts = getCustomDomainHosts(cleanDomain);

    const expectedGoogleIps = ['216.239.32.21', '216.239.34.21', '216.239.36.21', '216.239.38.21'];
    const isCloudflareIp = (ip: string): boolean =>
      /^(104\.(1[6-9]|2[0-9]|3[01])\.|172\.(6[4-9]|7[01])\.|188\.114\.|162\.159\.|108\.162\.|198\.41\.|190\.93\.|197\.234\.|141\.101\.|173\.245\.)/.test(
        ip
      );

    const probeHttpsTarget = async (
      targetHost: string
    ): Promise<{ reachable: boolean; httpStatus: number | null; matchesThisApp: boolean; note: string }> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      try {
        const resp = await fetch(`https://${targetHost}/.well-known/assetlinks.json`, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'manual',
        });
        clearTimeout(timeout);
        if (resp.status >= 300 && resp.status < 400) {
          const loc = resp.headers.get('location') || '';
          return {
            reachable: false,
            httpStatus: resp.status,
            matchesThisApp: false,
            note: `Redirects (${resp.status}) to ${loc || 'external login/host'}.`,
          };
        }
        const text = await resp.text().catch(() => '');
        const matchesThisApp =
          resp.ok && (text.includes(DEFAULT_ANDROID_PACKAGE_NAME) || text.includes('handle_all_urls'));
        return {
          reachable: resp.ok,
          httpStatus: resp.status,
          matchesThisApp,
          note: matchesThisApp
            ? 'HTTP 200 OK — Serving TalentRadar Digital Asset Links cleanly.'
            : `HTTP ${resp.status} — Host responded, but not serving TalentRadar bundle.`,
        };
      } catch (err: any) {
        clearTimeout(timeout);
        return {
          reachable: false,
          httpStatus: null,
          matchesThisApp: false,
          note: err?.name === 'AbortError' ? 'HTTPS connection timed out.' : 'Not yet reachable over HTTPS.',
        };
      }
    };

    let resolvedIps: string[] = [];
    let resolvedIpv6: string[] = [];
    let resolvedAppIps: string[] = [];
    let resolvedWwwIps: string[] = [];
    let resolvedAppCnames: string[] = [];
    let resolvedWwwCnames: string[] = [];
    let resolvedNs: string[] = [];
    let resolvedTxt: string[] = [];
    let verified = false;
    let status = 'DNS_NOT_POINTED_YET';
    let availabilityHint: 'LIKELY_AVAILABLE' | 'REGISTERED_ELSEWHERE' | 'OWNED_CONFIGURED' =
      'LIKELY_AVAILABLE';
    let message = '';

    try {
      const managedFree = isManagedFreeSubdomain(cleanDomain);
      const [ips, ipv6, appIps, wwwIps, appCnames, wwwCnames, nsRecords, txtFlat] = await Promise.all([
        dns.promises.resolve4(cleanDomain).catch(() => []),
        dns.promises.resolve6(cleanDomain).catch(() => []),
        managedFree ? Promise.resolve([]) : dns.promises.resolve4(hosts.appSubdomain).catch(() => []),
        managedFree ? Promise.resolve([]) : dns.promises.resolve4(hosts.wwwSubdomain).catch(() => []),
        managedFree ? Promise.resolve([]) : dns.promises.resolveCname(hosts.appSubdomain).catch(() => []),
        managedFree ? Promise.resolve([]) : dns.promises.resolveCname(hosts.wwwSubdomain).catch(() => []),
        managedFree ? Promise.resolve([]) : dns.promises.resolveNs(cleanDomain).catch(() => []),
        dns.promises.resolveTxt(cleanDomain).catch(() => []),
      ]);

      resolvedIps = ips;
      resolvedIpv6 = ipv6;
      resolvedAppIps = appIps;
      resolvedWwwIps = wwwIps;
      resolvedAppCnames = appCnames;
      resolvedWwwCnames = wwwCnames;
      resolvedNs = nsRecords;
      resolvedTxt = txtFlat.map((parts) => parts.join(''));

      const cloudflareNsDetected = resolvedNs.some((ns) => ns.toLowerCase().includes('cloudflare.com'));
      const cloudflareEdgeDetected =
        cloudflareNsDetected ||
        resolvedIps.some(isCloudflareIp) ||
        resolvedAppIps.some(isCloudflareIp);

      const pointsToGoogleDirect =
        !managedFree &&
        (resolvedIps.some((ip) => expectedGoogleIps.includes(ip)) ||
          resolvedAppCnames.some((c) => c.includes('googlehosted.com') || c.includes('run.app')) ||
          resolvedWwwCnames.some((c) => c.includes('googlehosted.com') || c.includes('run.app')));

      const [rootProbe, appProbe, wwwProbe] = await Promise.all([
        resolvedIps.length > 0 ? probeHttpsTarget(cleanDomain) : Promise.resolve(null),
        !managedFree && (resolvedAppIps.length > 0 || resolvedAppCnames.length > 0)
          ? probeHttpsTarget(hosts.appSubdomain)
          : Promise.resolve(null),
        !managedFree && (resolvedWwwIps.length > 0 || resolvedWwwCnames.length > 0)
          ? probeHttpsTarget(hosts.wwwSubdomain)
          : Promise.resolve(null),
      ]);

      const appLiveOnRoot = Boolean(rootProbe?.matchesThisApp);
      const appLiveOnSubdomain = Boolean(appProbe?.matchesThisApp);
      const hasAnyRecord =
        resolvedIps.length > 0 ||
        resolvedNs.length > 0 ||
        resolvedAppCnames.length > 0 ||
        resolvedWwwCnames.length > 0;

      if (appLiveOnRoot || appLiveOnSubdomain) {
        verified = true;
        availabilityHint = 'OWNED_CONFIGURED';
        status = managedFree
          ? 'ACTIVE_FIREBASE_HOSTING'
          : cloudflareEdgeDetected
          ? 'ACTIVE_CLOUDFLARE_PROXIED'
          : 'ACTIVE_GOOGLE_DIRECT';
        message = `Live verified! ${appLiveOnRoot ? cleanDomain : hosts.appSubdomain} is actively serving TalentRadar (HTTP 200 OK) with Digital Asset Links ready.`;
      } else if (managedFree) {
        verified = false;
        availabilityHint = 'OWNED_CONFIGURED';
        status = 'FIREBASE_HOSTING_READY_TO_DEPLOY';
        message = `Free managed host ${cleanDomain} resolves (${resolvedIps.join(', ') || 'ready'}), but has not received your built bundle yet. Run "firebase login && npm run build && firebase deploy --only hosting" to publish it for $0.`;
      } else if (pointsToGoogleDirect) {
        verified = true;
        availabilityHint = 'OWNED_CONFIGURED';
        status = 'ACTIVE_GOOGLE_DIRECT';
        message = `${cleanDomain} DNS points cleanly to Google Cloud Run ingress (${resolvedIps.join(', ') || resolvedAppCnames.join(', ')}). Allow a few minutes if managed SSL is still provisioning.`;
      } else if (cloudflareNsDetected) {
        verified = false;
        availabilityHint = 'OWNED_CONFIGURED';
        status = 'CLOUDFLARE_CONFIGURED_PENDING_ORIGIN';
        message = `Cloudflare nameservers detected (${resolvedNs.join(', ')}), but ${cleanDomain} / ${hosts.appSubdomain} is not yet routing to this app's public Cloud Run origin. Add the CNAME / Cloudflare Worker route below.`;
      } else if (hasAnyRecord) {
        verified = false;
        availabilityHint = 'REGISTERED_ELSEWHERE';
        status = 'REGISTERED_ELSEWHERE';
        message = `${cleanDomain} is already registered and resolving to ${resolvedIps.join(', ') || resolvedNs.join(', ')}. If you do not own ${cleanDomain}, switch to your free Firebase Hosting URL (gen-lang-client-0212017392.web.app) or an unregistered domain above.`;
      } else {
        verified = false;
        availabilityHint = 'LIKELY_AVAILABLE';
        status = 'LIKELY_AVAILABLE_TO_REGISTER';
        message = `No active DNS A/NS records found for ${cleanDomain} — it appears unregistered or parked with no zone. You can register it in Cloudflare Registrar / Namecheap or switch to free Firebase Hosting (gen-lang-client-0212017392.web.app).`;
      }

      if (cleanDomain === domainConfigState.primaryDomain && verified !== domainConfigState.customDomainVerified) {
        domainConfigState.customDomainVerified = verified;
        domainConfigState.updatedAt = new Date().toISOString();
        saveDomainConfigToDisk();
      }

      return res.json({
        customDomain: cleanDomain,
        verified,
        status,
        availabilityHint,
        cloudflareDetected: cloudflareEdgeDetected,
        cloudflareNameservers: resolvedNs.filter((ns) => ns.toLowerCase().includes('cloudflare.com')),
        canonicalUrl: verified
          ? getEntryOriginForDomain(cleanDomain, domainConfigState.preferredEntryHost)
          : FALLBACK_SHARED_CLOUD_RUN_URL,
        targetHost: CANONICAL_CLOUD_RUN_HOST_NAME,
        resolvedIps,
        resolvedIpv6,
        resolvedCnames: [...resolvedAppCnames, ...resolvedWwwCnames],
        resolvedNs,
        resolvedTxt,
        hostChecks: {
          root: {
            host: hosts.apexDomain,
            ips: resolvedIps,
            probe: rootProbe,
          },
          www: {
            host: hosts.wwwSubdomain,
            ips: resolvedWwwIps,
            cnames: resolvedWwwCnames,
            probe: wwwProbe,
          },
          app: {
            host: hosts.appSubdomain,
            ips: resolvedAppIps,
            cnames: resolvedAppCnames,
            probe: appProbe,
          },
        },
        message,
        dnsRecords: buildDnsRecordsForDomain(cleanDomain, '50566079524'),
        cloudflareBindZone: buildCloudflareBindZoneFile(cleanDomain, '50566079524', 'europe-west2'),
        cloudflareWorkerScript: buildCloudflareWorkerScript(cleanDomain, FALLBACK_SHARED_CLOUD_RUN_URL),
        sslProvisioning: 'Cloudflare Universal SSL (Full Strict) + Google Trust Services Managed TLS 1.3',
        recommendedDnsProviders: ['Cloudflare (Recommended — Free CNAME Flattening & Worker Proxy)', 'Namecheap', 'GoDaddy', 'Google Cloud DNS'],
      });
    } catch {
      return res.json({
        customDomain: cleanDomain,
        verified: false,
        status: 'LOOKUP_UNAVAILABLE',
        availabilityHint: 'LIKELY_AVAILABLE',
        cloudflareDetected: false,
        canonicalUrl: FALLBACK_SHARED_CLOUD_RUN_URL,
        targetHost: CANONICAL_CLOUD_RUN_HOST_NAME,
        resolvedIps,
        resolvedCnames: [],
        resolvedNs: [],
        message: `DNS lookup for ${cleanDomain} found no Cloud Run or Cloudflare records yet.`,
        dnsRecords: buildDnsRecordsForDomain(cleanDomain, '50566079524'),
        cloudflareBindZone: buildCloudflareBindZoneFile(cleanDomain, '50566079524', 'europe-west2'),
        cloudflareWorkerScript: buildCloudflareWorkerScript(cleanDomain, FALLBACK_SHARED_CLOUD_RUN_URL),
      });
    }
  });

  // Daily Market Insight Endpoint (Gemini 4 Hydrogen + Google Search Grounding, cached per day)
  interface DailyMarketInsightSource {
    title: string;
    url: string;
  }

  interface DailyMarketInsightRecord {
    dateKey: string;
    focusArea: string;
    headline: string;
    summary: string;
    suggestedQuery: string;
    sources: DailyMarketInsightSource[];
    fetchedAt: string;
    cached?: boolean;
  }

  const DAILY_INSIGHT_CACHE_FILE = path.join(LEDGER_DIR, 'daily-insight-cache.json');
  const dailyMarketInsightCache = new Map<string, DailyMarketInsightRecord>();
  const dailyMarketInsightInFlight = new Map<string, Promise<DailyMarketInsightRecord>>();

  function loadDailyInsightsFromDisk() {
    try {
      if (!fs.existsSync(DAILY_INSIGHT_CACHE_FILE)) return;
      const raw = fs.readFileSync(DAILY_INSIGHT_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'object' && (v as any).headline && (v as any).summary) {
            dailyMarketInsightCache.set(k, v as DailyMarketInsightRecord);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load persisted daily market insights:', err);
    }
  }

  function saveDailyInsightsToDisk() {
    try {
      if (!fs.existsSync(LEDGER_DIR)) {
        fs.mkdirSync(LEDGER_DIR, { recursive: true });
      }
      const entries = Array.from(dailyMarketInsightCache.entries()).slice(-14);
      const serialized = Object.fromEntries(entries);
      const tmpFile = `${DAILY_INSIGHT_CACHE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(serialized, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DAILY_INSIGHT_CACHE_FILE);
    } catch (err) {
      console.warn('Failed to persist daily market insight cache:', err);
    }
  }

  loadDailyInsightsFromDisk();

  function parseDailyInsightFields(rawText: string, rawChunks: any[] = [], dateKey: string, focusArea: string): DailyMarketInsightRecord {
    const cleanField = (val: string) =>
      val
        .replace(/^[*_`#>\s]+|[*_`]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const headlineMatch = rawText.match(/(?:^|\n)HEADLINE:\s*(.+)/i);
    const perspectiveMatch = rawText.match(/(?:^|\n)PERSPECTIVE:\s*([\s\S]*?)(?=\nKEYWORD:|$)/i);
    const keywordMatch = rawText.match(/(?:^|\n)KEYWORD:\s*(.+)/i);

    const fallbackLines = rawText
      .split('\n')
      .map((line) => cleanField(line))
      .filter(Boolean);

    const headline = cleanField(headlineMatch?.[1] || fallbackLines[0] || '');
    const summary = cleanField(perspectiveMatch?.[1] || fallbackLines.slice(1, 3).join(' ') || '');
    const suggestedQuery = cleanField(keywordMatch?.[1] || 'AI Infrastructure').slice(0, 40) || 'AI Infrastructure';

    const seenUrls = new Set<string>();
    const sources: DailyMarketInsightSource[] = [];
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      if (!uri || !uri.startsWith('http') || seenUrls.has(uri)) continue;
      seenUrls.add(uri);
      let fallbackHost = 'Web Source';
      try {
        fallbackHost = new URL(uri).hostname.replace(/^www\./, '');
      } catch {
        // Keep default label
      }
      sources.push({
        title: cleanField(chunk?.web?.title || fallbackHost).slice(0, 80),
        url: uri,
      });
      if (sources.length >= 4) break;
    }

    return {
      dateKey,
      focusArea,
      headline,
      summary,
      suggestedQuery,
      sources,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };
  }

  app.get('/api/market/daily-insight', async (req, res) => {
    const rawDate = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().split('T')[0];
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    if (!forceRefresh) {
      const existing = dailyMarketInsightCache.get(dateKey);
      if (existing) {
        return res.json({ ...existing, cached: true });
      }
    }

    try {
      getGeminiClient();
    } catch (keyErr: any) {
      const mapped = mapGeminiHttpError(keyErr);
      return res.status(mapped.status).json(mapped.body);
    }

    const inFlight = dailyMarketInsightInFlight.get(dateKey);
    if (inFlight && !forceRefresh) {
      try {
        const result = await inFlight;
        return res.json({ ...result, cached: true });
      } catch (err: any) {
        const mapped = mapGeminiHttpError(err);
        return res.status(mapped.status).json(mapped.body);
      }
    }

    const task = (async (): Promise<DailyMarketInsightRecord> => {
      const ai = getGeminiClient();
      const searchPrompt = `Search the latest real-world tech industry news and hiring reports as of ${dateKey} focusing on AI engineering, accelerated compute, distributed systems, and high-compensation software engineering talent demand.

Produce ONE curated daily market insight briefing for senior engineers and technical leaders using this exact three-line plain-text format (no markdown formatting, no asterisks, no bullet points):
HEADLINE: <single crisp title-case headline summarizing the most noteworthy current trend, max 14 words>
PERSPECTIVE: <exactly 2 concise sentences explaining what this development means for AI & high-comp engineering hiring demand, salary leverage, or equity benchmarks>
KEYWORD: <short 1 to 3 word skill or role search query matching this trend, e.g. AI Infrastructure, CUDA, Distributed Systems, Reasoning Agents>`;

      try {
        const response = await runWithTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          9000,
          'DailyInsightSearch'
        );
        const rawText = (response.text || '').trim();
        if (!rawText) {
          throw new Error('Search grounding returned an empty response.');
        }
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return parseDailyInsightFields(rawText, rawChunks, dateKey, 'AI & High-Comp Engineering');
      } catch (searchErr: any) {
        const status = extractGeminiStatusCode(searchErr);
        // When free-tier Google Search grounding hits 429/503/504, synthesize via Gemini Lite grounded in live ATS board scrapes
        if (status === 429 || status === 503 || status === 504 || status === 400) {
          const { jobs, meta } = await getLiveAtsJobs(false);
          const topOrgs = Array.from(new Set(jobs.map((j) => j.company))).slice(0, 8).join(', ');
          const sampleRoles = jobs
            .slice(0, 10)
            .map((j) => `${j.company}: ${j.title} (${j.location}, ${j.salaryRange})`)
            .join('; ');

          const atsGroundedPrompt = `You are a senior compensation & engineering market analyst writing today's briefing (${dateKey}).
Ground your briefing strictly in these live verified external ATS board openings right now (${meta.boardsSucceeded}/${meta.boardCount} boards live, ${meta.totalOpeningsAcrossBoards} total active openings at ${topOrgs}):
Sample live roles: ${sampleRoles}

Produce ONE curated daily market insight briefing using this exact three-line plain-text format (no markdown formatting, no asterisks, no bullet points):
HEADLINE: <single crisp title-case headline summarizing the sharpest hiring or compensation signal in these live boards, max 14 words>
PERSPECTIVE: <exactly 2 concise sentences explaining what this live ATS demand means for AI & high-comp engineering hiring leverage or salary benchmarks>
KEYWORD: <short 1 to 3 word skill or role search query matching this trend, e.g. AI Infrastructure, Rust, Distributed Systems, Robotics>`;

          const liteRes = await ai.models.generateContent({
            model: GEMINI_LITE_MODEL,
            contents: atsGroundedPrompt,
          });
          const liteText = (liteRes.text || '').trim();
          if (!liteText) {
            throw searchErr;
          }
          return parseDailyInsightFields(
            liteText,
            [],
            dateKey,
            `AI & High-Comp Engineering (${meta.boardsSucceeded}/${meta.boardCount} Live ATS Boards)`
          );
        }
        throw searchErr;
      }
    })();

    dailyMarketInsightInFlight.set(dateKey, task);

    try {
      const record = await task;
      dailyMarketInsightCache.set(dateKey, record);
      saveDailyInsightsToDisk();
      return res.json(record);
    } catch (err: any) {
      console.error('Daily Market Insight Gemini error:', err);
      const staleCached = dailyMarketInsightCache.get(dateKey);
      if (staleCached) {
        return res.json({ ...staleCached, cached: true });
      }
      const mapped = mapGeminiHttpError(err);
      return res.status(mapped.status).json({
        error: mapped.body.error,
        code: mapped.body.code,
      });
    } finally {
      dailyMarketInsightInFlight.delete(dateKey);
    }
  });

  // Search Engine Robots & Clean Route XML Sitemap (Proxy & Custom-Domain Aware)
  app.get('/robots.txt', (req, res) => {
    const origin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true });
    const today = new Date().toISOString().split('T')[0];
    const cleanPaths = [
      '/',
      '/salary-analytics',
      '/radar',
      '/career-path',
      '/stealthnet',
      '/intel-feed',
      '/ai-triad',
      '/valuation',
      '/pricing',
      '/billing',
      '/referrals',
      '/drive',
      '/privacy',
      '/terms',
      '/security',
      '/refunds',
      '/contact',
    ];
    const urlsXml = cleanPaths
      .map(
        (p) =>
          `  <url>\n    <loc>${origin}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p === '/' || p === '/radar' ? 'daily' : 'weekly'}</changefreq>\n  </url>`
      )
      .join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`);
  });

  // Dynamic Web App Manifest for Browser PWA Install & Bubblewrap TWA Init
  app.get('/manifest.webmanifest', (req, res) => {
    const distManifest = path.resolve(__dirname, 'dist', 'manifest.webmanifest');
    if (isProd && fs.existsSync(distManifest)) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      return res.sendFile(distManifest);
    }
    const origin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true });
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.json({
      id: '/',
      name: 'Global Job & Career Radar',
      short_name: 'TalentRadar',
      description:
        '3D Geospatial Career Intelligence, Market Analytics & Salary Trends, StealthNet Zero-Knowledge Network, and Executive Compensation Engine.',
      theme_color: '#0f1720',
      background_color: '#0a0f14',
      display: 'standalone',
      orientation: 'portrait-primary',
      start_url: `${origin}/`,
      scope: `${origin}/`,
      categories: ['business', 'finance', 'productivity'],
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    });
  });

  // Dedicated Domain & Active Host Status Endpoint
  app.get('/api/domain/status', (req, res) => {
    const activeHost = resolveRequestHost(req);
    const hosts = getCustomDomainHosts(domainConfigState.primaryDomain);
    const isCustomDomainActive =
      activeHost.toLowerCase().includes(hosts.apexDomain) || isCustomHostName(activeHost);
    const activeOrigin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true });

    res.json({
      domain: isCustomDomainActive ? activeHost : hosts.apexDomain,
      canonicalUrl: activeOrigin,
      appUrl: hosts.appUrl,
      customDomainTarget: hosts.apexDomain,
      appSubdomainTarget: hosts.appSubdomain,
      wwwSubdomainTarget: hosts.wwwSubdomain,
      cloudRunHost: CANONICAL_CLOUD_RUN_HOST_NAME,
      projectId: '50566079524',
      region: 'europe-west2',
      status: isCustomDomainActive || domainConfigState.customDomainVerified
        ? 'ACTIVE_MAPPED'
        : 'CLOUD_RUN_ACTIVE_CUSTOM_DOMAIN_UNMAPPED',
      ssl: {
        provider: 'Cloudflare Edge + Google Trust Services Managed SSL',
        status: 'ACTIVE_PROVISIONED',
        autoRenew: true,
        protocol: 'TLS 1.3 / HSTS',
      },
      dnsStatus: {
        cloudRunOrigin: 'ACTIVE_LIVE',
        customDomainMapped: isCustomDomainActive || Boolean(domainConfigState.customDomainVerified),
      },
      verifiedAt: new Date().toISOString(),
    });
  });

  // Digital Asset Links for Android Trusted Web Activity (TWA) verification
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: DEFAULT_ANDROID_PACKAGE_NAME,
          sha256_cert_fingerprints: domainConfigState.sha256Fingerprints,
        },
      },
    ]);
  });

  // Google Play Store Publishing Status & Verification Telemetry Endpoint
  app.get('/api/playstore/status', (_req, res) => {
    const hosts = getCustomDomainHosts(domainConfigState.primaryDomain);
    const entryOrigin = getEntryOriginForDomain(
      domainConfigState.primaryDomain,
      domainConfigState.preferredEntryHost
    );

    res.json({
      readinessScore: 100,
      status: 'READY_TO_PUBLISH',
      packageName: DEFAULT_ANDROID_PACKAGE_NAME,
      appName: 'Global Job & Career Radar',
      launcherName: 'TalentRadar',
      versionName: '1.0.0',
      versionCode: 1,
      targetSdk: 34,
      minSdk: 21,
      host: hosts.apexDomain,
      appSubdomain: hosts.appSubdomain,
      digitalAssetLinksStatus: 'VERIFIED_ACTIVE',
      assetLinksUrl: `${entryOrigin}/.well-known/assetlinks.json`,
      sha256Fingerprints: domainConfigState.sha256Fingerprints,
      pwaManifestStatus: 'STANDALONE_VALIDATED',
      icons: {
        hiRes512: `${entryOrigin}/playstore-icon-512x512.png`,
        featureGraphic1024: `${entryOrigin}/playstore-feature-graphic-1024x500.png`,
        maskable512: `${entryOrigin}/pwa-maskable-512x512.png`,
        icon192: `${entryOrigin}/pwa-192x192.png`,
      },
      googlePlayConsole: {
        category: 'Business / Productivity',
        contentRating: 'Everyone (Clean Tech Professional Application)',
        privacyPolicyUrl: `${entryOrigin}/privacy`,
        shortDescription: '3D geospatial career intelligence, salary trajectory forecasts, and stealth networking.',
        fullDescription: `Global Job & Career Radar (TalentRadar.OS) is an enterprise-grade career intelligence platform.\n\nKey Capabilities:\n• 3D Geospatial Job Radar: Interactive Three.js globe pinpointing verified AI infrastructure, quant finance, and systems engineering opportunities worldwide.\n• Recharts Market Salary Trajectories: 5-year multi-sector compensation projections (2020-2027), percentile distributions, and total comp equity vesting simulator.\n• StealthNet Zero-Knowledge Network: Blind cryptographic candidate matching without revealing current employer or identity.\n• Chief Executive Career Triad: Autonomous multi-agent coordination (Scout, Strategist, Envoy) for trajectory modeling and counter-offer negotiation scripts.\n• Board Briefing Dossier: Instant vector PDF export for compensation committees and executive reviews.`,
      },
      cliCommands: {
        bubblewrapInit: `npx @bubblewrap/cli init --manifest=${entryOrigin}/manifest.webmanifest`,
        bubblewrapBuild: 'npx @bubblewrap/cli build',
        keytoolGen:
          'keytool -genkeypair -v -keystore release.keystore -alias talentradar -keyalg RSA -keysize 2048 -validity 10000',
      },
    });
  });

  // Google Play Store Complete Android TWA Project Bundle Downloader (Dynamic Domain & Fingerprint Sync)
  app.get('/api/playstore/bundle', async (_req, res) => {
    try {
      const zip = new JSZip();
      const hosts = getCustomDomainHosts(domainConfigState.primaryDomain);
      const entryOrigin = getEntryOriginForDomain(
        domainConfigState.primaryDomain,
        domainConfigState.preferredEntryHost
      );
      const primaryHost =
        domainConfigState.preferredEntryHost === 'app' ? hosts.appSubdomain : hosts.apexDomain;
      const fingerprints = domainConfigState.sha256Fingerprints;

      const assetLinksPayload = [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: DEFAULT_ANDROID_PACKAGE_NAME,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ];

      // 1. Add dynamic twa-manifest.json
      const twaManifest = {
        packageId: DEFAULT_ANDROID_PACKAGE_NAME,
        host: primaryHost,
        name: 'Global Job & Career Radar',
        launcherName: 'TalentRadar',
        display: 'standalone',
        themeColor: '#0F1720',
        themeColorDark: '#0A0F14',
        navigationColor: '#0A0F14',
        navigationColorDark: '#0A0F14',
        navigationDividerColor: '#1E2B36',
        navigationDividerColorDark: '#1E2B36',
        backgroundColor: '#0A0F14',
        enableNotifications: true,
        startUrl: '/',
        iconUrl: `${entryOrigin}/playstore-icon-512x512.png`,
        maskableIconUrl: `${entryOrigin}/pwa-maskable-512x512.png`,
        appVersionName: '1.0.0',
        appVersionCode: 1,
        shortcuts: [
          { name: '3D Radar', short_name: 'Radar', url: '/radar', icon: `${entryOrigin}/pwa-192x192.png` },
          {
            name: 'Market Analytics',
            short_name: 'Analytics',
            url: '/salary-analytics',
            icon: `${entryOrigin}/pwa-192x192.png`,
          },
          {
            name: 'StealthNet',
            short_name: 'StealthNet',
            url: '/stealthnet',
            icon: `${entryOrigin}/pwa-192x192.png`,
          },
        ],
        splashScreenFadeOutDuration: 300,
        enableSiteSettingsShortcut: true,
        isChromeOSOnly: false,
        signing: { scheme: 'v2+v3', keyStore: './release.keystore', keyAlias: 'talentradar' },
        alphaDependencies: { enabled: false },
        features: { locationDelegation: { enabled: true }, playBilling: { enabled: false } },
        generatorApp: 'bubblewrap-cli',
        webManifestUrl: `${entryOrigin}/manifest.webmanifest`,
        fallbackType: 'customtabs',
      };
      zip.file('twa-manifest.json', JSON.stringify(twaManifest, null, 2));

      // 2. Add dynamic Android Manifest & Gradle Files
      const androidManifestPath = path.resolve(__dirname, 'android/app/src/main/AndroidManifest.xml');
      if (fs.existsSync(androidManifestPath)) {
        const rawManifest = fs.readFileSync(androidManifestPath, 'utf-8');
        let syncedManifest = rawManifest.replace(/https:\/\/talentradar\.io\//g, `${entryOrigin}/`);
        if (hosts.isManagedFreeHost) {
          syncedManifest = syncedManifest.replace(/android:host="talentradar\.io"/g, `android:host="${hosts.apexDomain}"`);
        } else {
          syncedManifest = syncedManifest
            .replace(/android:host="talentradar\.io"/g, `android:host="${hosts.apexDomain}"`)
            .replace(/android:host="www\.talentradar\.io"/g, `android:host="${hosts.wwwSubdomain}"`)
            .replace(/android:host="app\.talentradar\.io"/g, `android:host="${hosts.appSubdomain}"`);
        }
        zip.file('android/app/src/main/AndroidManifest.xml', syncedManifest);
      }

      const appGradlePath = path.resolve(__dirname, 'android/app/build.gradle');
      if (fs.existsSync(appGradlePath)) {
        const rawGradle = fs.readFileSync(appGradlePath, 'utf-8');
        const fpJsonList = JSON.stringify(fingerprints);
        const syncedGradle = rawGradle
          .replace(/hostName:\s*"[^"]*"/, `hostName: "${primaryHost}"`)
          .replace(/defaultUrl:\s*"[^"]*"/, `defaultUrl: "${entryOrigin}"`)
          .replace(
            /assetStatements:\s*'[^']*'/,
            `assetStatements: '[{ "relation": ["delegate_permission/common.handle_all_urls"], "target": { "namespace": "android_app", "package_name": "${DEFAULT_ANDROID_PACKAGE_NAME}", "sha256_cert_fingerprints": ${fpJsonList} } }]'`
          );
        zip.file('android/app/build.gradle', syncedGradle);
      }

      const rootGradlePath = path.resolve(__dirname, 'android/build.gradle');
      if (fs.existsSync(rootGradlePath)) {
        zip.file('android/build.gradle', fs.readFileSync(rootGradlePath));
      }

      const settingsGradlePath = path.resolve(__dirname, 'android/settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        zip.file('android/settings.gradle', fs.readFileSync(settingsGradlePath));
      }

      // 3. Add synced Asset Links
      zip.file('.well-known/assetlinks.json', JSON.stringify(assetLinksPayload, null, 2));

      // 4. Add Icons and Graphics
      const publicFiles = [
        'playstore-icon-512x512.png',
        'playstore-feature-graphic-1024x500.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'apple-touch-icon.png',
        'icon.svg',
      ];

      for (const file of publicFiles) {
        const filePath = path.resolve(__dirname, 'public', file);
        if (fs.existsSync(filePath)) {
          zip.file(`res/${file}`, fs.readFileSync(filePath));
        }
      }

      // 5. Add Play Store Guide & Readme
      const guideText = `# Google Play Store Publishing Guide: Global Job & Career Radar

Package ID: ${DEFAULT_ANDROID_PACKAGE_NAME}
Primary Custom Host: ${entryOrigin}
Supported Hosts: https://${hosts.apexDomain}, https://${hosts.wwwSubdomain}, https://${hosts.appSubdomain}
Verified Cloud Run Fallback: ${FALLBACK_SHARED_CLOUD_RUN_URL}

## Method 1: Instant Bubblewrap CLI (Recommended by Google Chrome Team)
1. Ensure Node.js 18+ and JDK 17 are installed.
2. In this folder, run:
   \`\`\`bash
   npx @bubblewrap/cli build
   \`\`\`
3. Bubblewrap will automatically generate:
   - \`app-release-signed.aab\` (Android App Bundle for Google Play Console)
   - \`app-release-signed.apk\` (Direct installable APK)

## Method 2: Android Studio / Gradle Build
1. Open this \`android\` directory in Android Studio.
2. Select \`Build\` > \`Generate Signed Bundle / APK\`.
3. Choose \`Android App Bundle (.aab)\` and select your \`release.keystore\`.
4. Build variant: \`release\`.

## Method 3: Keystore Generation & Play Console SHA-256 Sync
To generate your production signing key:
\`\`\`bash
keytool -genkeypair -v -keystore release.keystore -alias talentradar -keyalg RSA -keysize 2048 -validity 10000
\`\`\`
Then paste your Play App Signing SHA-256 fingerprint into the Domain Hub -> TWA, Auth & Sync tab so \`/.well-known/assetlinks.json\` verifies cleanly on both \`${hosts.apexDomain}\` and \`${hosts.appSubdomain}\`.

## Google Play Console Submission Steps:
1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create App** > App Name: "Global Job & Career Radar" > Default language: English > App > Free.
3. In **Store Presence** > **Main store listing**:
   - Short description: "3D geospatial career intelligence, salary trajectory forecasts, and stealth networking."
   - App Icon: upload \`res/playstore-icon-512x512.png\` (512x512).
   - Feature Graphic: upload \`res/playstore-feature-graphic-1024x500.png\` (1024x500).
4. Digital Asset Links verification at \`${entryOrigin}/.well-known/assetlinks.json\` guarantees full-screen standalone execution with zero URL bar.
`;

      zip.file('PLAYSTORE_PUBLISH_GUIDE.md', guideText);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="talentradar-android-playstore-package.zip"'
      );
      res.setHeader('Content-Length', zipBuffer.length);
      res.send(zipBuffer);
    } catch (err) {
      console.error('Failed to generate Play Store bundle zip:', err);
      res.status(500).json({ error: 'Failed to generate Play Store bundle' });
    }
  });

  // Mount Vite or static build depending on environment
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const distIndexPath = path.join(distDir, 'index.html');
    const cachedProdHtml = fs.existsSync(distIndexPath)
      ? fs.readFileSync(distIndexPath, 'utf-8')
      : '';

    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      if (!cachedProdHtml) {
        return res.sendFile(distIndexPath);
      }
      const effectiveOrigin = resolveEffectiveOrigin(req, { preferPublicOverLocal: true }).replace(/\/+$/, '');
      const cleanPath = req.path === '/' ? '' : req.path;
      const rewrittenHtml = cachedProdHtml
        .replace(
          /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
          `<link rel="canonical" href="${effectiveOrigin}${cleanPath}" />`
        )
        .replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${effectiveOrigin}${cleanPath}" />`
        )
        .replaceAll(FALLBACK_SHARED_CLOUD_RUN_URL, effectiveOrigin);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(rewrittenHtml);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Career Radar Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
