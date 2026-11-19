import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let projectId = 'gen-lang-client-0212017392';
let databaseId = 'ai-studio-careerradar-17b9a6d1-7662-4373-863e-133fa0cc2517';

try {
  const cfgPath = path.resolve(__dirname, '../../firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    if (cfg.projectId) projectId = String(cfg.projectId);
    if (cfg.firestoreDatabaseId) databaseId = String(cfg.firestoreDatabaseId);
  }
} catch {
  // Use defaults
}

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

let cachedAccessToken: string | null = null;
let cachedTokenExpiryMs = 0;
let metadataUnavailableUntilMs = 0;

async function getGcpAccessToken(): Promise<string | null> {
  const explicitToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
  if (explicitToken) return explicitToken;

  const now = Date.now();
  if (cachedAccessToken && now < cachedTokenExpiryMs - 60_000) {
    return cachedAccessToken;
  }
  if (now < metadataUnavailableUntilMs) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      metadataUnavailableUntilMs = now + 5 * 60_000;
      return null;
    }

    const json: any = await res.json();
    if (json?.access_token) {
      cachedAccessToken = String(json.access_token);
      cachedTokenExpiryMs = now + (Number(json.expires_in) || 3600) * 1000;
      return cachedAccessToken;
    }
  } catch {
    // Not running on Cloud Run / GCE or metadata server unreachable
    metadataUnavailableUntilMs = now + 5 * 60_000;
  }
  return null;
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null };

function toFirestoreValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(fv: any): any {
  if (!fv || typeof fv !== 'object') return undefined;
  if ('stringValue' in fv) return fv.stringValue;
  if ('integerValue' in fv) return Number(fv.integerValue);
  if ('doubleValue' in fv) return Number(fv.doubleValue);
  if ('booleanValue' in fv) return Boolean(fv.booleanValue);
  if ('nullValue' in fv) return null;
  return undefined;
}

function encodeDocFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

function decodeDocFields(doc: any): Record<string, any> {
  const result: Record<string, any> = {};
  const fields = doc?.fields || {};
  for (const [key, fv] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(fv);
  }
  return result;
}

export function subscriptionDocIdForEmail(email: string): string {
  const digest = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  return `sub_${digest.slice(0, 24)}`;
}

export async function findUserIdByEmailInFirestore(email: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  const token = await getGcpAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'email' },
              op: 'EQUAL',
              value: { stringValue: cleanEmail },
            },
          },
          limit: 1,
        },
      }),
    });
    if (!res.ok) return null;
    const rows: any = await res.json();
    if (!Array.isArray(rows)) return null;
    for (const row of rows) {
      const docName = row?.document?.name;
      if (typeof docName === 'string' && docName.includes('/users/')) {
        const uid = docName.split('/').pop();
        if (uid) return uid;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface FirestoreSubscriptionSyncResult {
  ok: boolean;
  docId: string;
  userId?: string;
  reason?: string;
}

export async function upsertSubscriptionInFirestore(record: {
  email: string;
  userId?: string;
  tier: string;
  reference: string;
  status: string;
  provider?: string;
  amountTotal: number;
  currency: string;
  subscriptionCode?: string;
  planCode?: string;
  customerCode?: string;
  nextPaymentDate?: string;
  cancelAtPeriodEnd?: boolean;
  lastWebhookEvent?: string;
  updatedAt: string;
}): Promise<FirestoreSubscriptionSyncResult> {
  const docId = subscriptionDocIdForEmail(record.email);
  const token = await getGcpAccessToken();
  if (!token) {
    return { ok: false, docId, userId: record.userId, reason: 'GCP access token unavailable outside Cloud Run runtime' };
  }

  try {
    let resolvedUserId = record.userId || '';
    if (!resolvedUserId && record.email) {
      const matchedUid = await findUserIdByEmailInFirestore(record.email);
      if (matchedUid) resolvedUserId = matchedUid;
    }

    const payload = {
      fields: encodeDocFields({
        id: docId,
        userId: resolvedUserId,
        email: record.email.trim().toLowerCase(),
        tier: record.tier,
        reference: record.reference,
        status: record.status,
        provider: record.provider || 'paystack',
        amountTotal: record.amountTotal,
        currency: record.currency,
        subscriptionCode: record.subscriptionCode || '',
        planCode: record.planCode || '',
        customerCode: record.customerCode || '',
        nextPaymentDate: record.nextPaymentDate || '',
        cancelAtPeriodEnd: Boolean(record.cancelAtPeriodEnd),
        lastWebhookEvent: record.lastWebhookEvent || '',
        updatedAt: record.updatedAt,
      }),
    };

    const res = await fetch(`${FIRESTORE_BASE_URL}/subscriptions/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (resolvedUserId) {
      try {
        const userStatusPayload = {
          fields: encodeDocFields({
            subscriptionStatus:
              record.status === 'active' || record.status === 'non_renewing'
                ? record.tier
                : record.status,
            updatedAt: record.updatedAt,
          }),
        };
        await fetch(
          `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(resolvedUserId)}?updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=updatedAt`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userStatusPayload),
          }
        );
      } catch {
        // Non-blocking fallback
      }
    }

    return {
      ok: res.ok,
      docId,
      userId: resolvedUserId || undefined,
      reason: res.ok ? undefined : `Firestore REST ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      docId,
      userId: record.userId,
      reason: err?.message || 'Firestore write exception',
    };
  }
}

export async function upsertReferralInFirestore(record: {
  code: string;
  referrerEmail: string;
  referrerUid?: string;
  clicks: number;
  paidConversions: number;
  availableMonthCredits: number;
  totalMonthCreditsClaimed: number;
  totalCommissionUsd: number;
  createdAt: string;
  updatedAt: string;
}): Promise<boolean> {
  const token = await getGcpAccessToken();
  if (!token) return false;

  try {
    const payload = {
      fields: encodeDocFields({
        code: record.code,
        referrerEmail: record.referrerEmail,
        referrerUid: record.referrerUid || '',
        clicks: record.clicks,
        paidConversions: record.paidConversions,
        availableMonthCredits: record.availableMonthCredits,
        totalMonthCreditsClaimed: record.totalMonthCreditsClaimed,
        totalCommissionUsd: record.totalCommissionUsd,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }),
    };

    const res = await fetch(`${FIRESTORE_BASE_URL}/referrals/${encodeURIComponent(record.code)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hydrateLedgersFromFirestore(): Promise<{
  available: boolean;
  subscriptions: Record<string, any>[];
  referrals: Record<string, any>[];
}> {
  const token = await getGcpAccessToken();
  if (!token) {
    return { available: false, subscriptions: [], referrals: [] };
  }

  try {
    const [subsRes, refsRes] = await Promise.all([
      fetch(`${FIRESTORE_BASE_URL}/subscriptions?pageSize=300`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${FIRESTORE_BASE_URL}/referrals?pageSize=300`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const subscriptions: Record<string, any>[] = [];
    const referrals: Record<string, any>[] = [];

    if (subsRes.ok) {
      const subsJson: any = await subsRes.json();
      if (Array.isArray(subsJson.documents)) {
        for (const doc of subsJson.documents) {
          const decoded = decodeDocFields(doc);
          if (decoded.email) subscriptions.push(decoded);
        }
      }
    }

    if (refsRes.ok) {
      const refsJson: any = await refsRes.json();
      if (Array.isArray(refsJson.documents)) {
        for (const doc of refsJson.documents) {
          const decoded = decodeDocFields(doc);
          if (decoded.code && decoded.referrerEmail) referrals.push(decoded);
        }
      }
    }

    return { available: true, subscriptions, referrals };
  } catch {
    return { available: false, subscriptions: [], referrals: [] };
  }
}

export async function fetchSubscriptionFromFirestoreByEmail(email: string): Promise<Record<string, any> | null> {
  const token = await getGcpAccessToken();
  if (!token || !email) return null;

  try {
    const docId = subscriptionDocIdForEmail(email);
    const res = await fetch(`${FIRESTORE_BASE_URL}/subscriptions/${encodeURIComponent(docId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const decoded = decodeDocFields(json);
    return decoded.email ? decoded : null;
  } catch {
    return null;
  }
}

export async function upsertInquiryInFirestore(record: {
  id: string;
  name: string;
  email: string;
  organization?: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  deliveryMode?: string;
  createdAt: string;
}): Promise<boolean> {
  const token = await getGcpAccessToken();
  if (!token) return false;

  try {
    const payload = {
      fields: encodeDocFields({
        id: record.id,
        name: record.name || '',
        email: record.email,
        category: record.category || 'general',
        subject: record.subject,
        message: record.message,
        status: record.status || 'open',
        createdAt: record.createdAt,
      }),
    };

    const res = await fetch(`${FIRESTORE_BASE_URL}/contactInquiries/${encodeURIComponent(record.id)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function upsertAgencyPilotInFirestore(record: {
  id: string;
  agencyName: string;
  contactName: string;
  workEmail: string;
  companyUrl?: string;
  seats?: string;
  planTier?: string;
  notes?: string;
  status: string;
  createdAt: string;
}): Promise<boolean> {
  const token = await getGcpAccessToken();
  if (!token) return false;

  try {
    const payload = {
      fields: encodeDocFields({
        id: record.id,
        agencyName: record.agencyName,
        contactName: record.contactName || '',
        workEmail: record.workEmail,
        companyUrl: record.companyUrl || '',
        seats: record.seats || '',
        planTier: record.planTier || 'agency_monthly',
        notes: record.notes || '',
        status: record.status || 'qualified_pending_checkout',
        createdAt: record.createdAt,
      }),
    };

    const res = await fetch(`${FIRESTORE_BASE_URL}/agencyPilotRequests/${encodeURIComponent(record.id)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchOwnerInquiriesFromFirestore(): Promise<{
  available: boolean;
  inquiries: Record<string, any>[];
  agencyPilots: Record<string, any>[];
}> {
  const token = await getGcpAccessToken();
  if (!token) {
    return { available: false, inquiries: [], agencyPilots: [] };
  }

  try {
    const [inqRes, pilotRes] = await Promise.all([
      fetch(`${FIRESTORE_BASE_URL}/contactInquiries?pageSize=200`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${FIRESTORE_BASE_URL}/agencyPilotRequests?pageSize=200`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const inquiries: Record<string, any>[] = [];
    const agencyPilots: Record<string, any>[] = [];

    if (inqRes.ok) {
      const json: any = await inqRes.json();
      if (Array.isArray(json.documents)) {
        for (const doc of json.documents) {
          const decoded = decodeDocFields(doc);
          if (decoded.id && decoded.email) inquiries.push(decoded);
        }
      }
    }

    if (pilotRes.ok) {
      const json: any = await pilotRes.json();
      if (Array.isArray(json.documents)) {
        for (const doc of json.documents) {
          const decoded = decodeDocFields(doc);
          if (decoded.id && decoded.workEmail) agencyPilots.push(decoded);
        }
      }
    }

    return { available: true, inquiries, agencyPilots };
  } catch {
    return { available: false, inquiries: [], agencyPilots: [] };
  }
}

