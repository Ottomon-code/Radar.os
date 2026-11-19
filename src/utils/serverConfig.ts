/**
 * Centralized Server Configuration & Dynamic Custom Domain Resolution
 * Provides functional URLs for API endpoints, clean vanity routes, sharing, and Cloudflare DNS routing.
 */

import {
  DEFAULT_CUSTOM_DOMAIN,
  FREE_FIREBASE_HOSTING_DOMAIN,
  FALLBACK_DEV_CLOUD_RUN_URL,
  FALLBACK_SHARED_CLOUD_RUN_URL,
  CANONICAL_CLOUD_RUN_HOST_NAME,
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
  type DnsRecordSpec,
} from './domainConfigShared';

const CUSTOM_DOMAIN_STORAGE_KEY = 'talent_radar_custom_domain_config_v1';

// Active verified Google Cloud Run public & development URLs
export const VERIFIED_FUNCTIONAL_DEV_URL = FALLBACK_DEV_CLOUD_RUN_URL;
export const VERIFIED_SHARED_PRE_URL = FALLBACK_SHARED_CLOUD_RUN_URL;
export const CANONICAL_CLOUD_RUN_HOST = CANONICAL_CLOUD_RUN_HOST_NAME;

export const GOOGLE_CLOUD_PROJECT_ID = '50566079524';
export const GOOGLE_CLOUD_REGION = 'europe-west2';

function resolveEnvCustomDomain(): string {
  try {
    const viteEnv = (import.meta as any)?.env?.VITE_CUSTOM_DOMAIN;
    if (viteEnv && isValidCustomDomainFormat(viteEnv)) {
      return sanitizeDomainInput(viteEnv);
    }
  } catch {
    // Ignore SSR/node env access
  }
  return DEFAULT_CUSTOM_DOMAIN;
}

export function getStoredDomainConfig(): DomainConfigSnapshot {
  const envDomain = resolveEnvCustomDomain();
  const fallback: DomainConfigSnapshot = {
    primaryDomain: envDomain,
    preferredEntryHost: 'root',
    sha256Fingerprints: [...DEFAULT_ANDROID_SHA256_FINGERPRINTS],
    customDomainVerified: false,
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CUSTOM_DOMAIN_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const primaryDomain = isValidCustomDomainFormat(parsed?.primaryDomain)
      ? sanitizeDomainInput(parsed.primaryDomain)
      : envDomain;
    const preferredEntryHost: PreferredEntryHost = parsed?.preferredEntryHost === 'app' ? 'app' : 'root';
    const sha256Fingerprints = Array.isArray(parsed?.sha256Fingerprints) && parsed.sha256Fingerprints.length > 0
      ? parsed.sha256Fingerprints.filter((fp: unknown): fp is string => typeof fp === 'string' && fp.length > 20)
      : [...DEFAULT_ANDROID_SHA256_FINGERPRINTS];

    return {
      primaryDomain,
      preferredEntryHost,
      sha256Fingerprints,
      customDomainVerified: Boolean(parsed?.customDomainVerified),
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : undefined,
    };
  } catch {
    return fallback;
  }
}

export function saveStoredDomainConfig(next: Partial<DomainConfigSnapshot>): DomainConfigSnapshot {
  const current = getStoredDomainConfig();
  const merged: DomainConfigSnapshot = {
    primaryDomain: next.primaryDomain
      ? sanitizeDomainInput(next.primaryDomain)
      : current.primaryDomain,
    preferredEntryHost: next.preferredEntryHost || current.preferredEntryHost,
    sha256Fingerprints:
      Array.isArray(next.sha256Fingerprints) && next.sha256Fingerprints.length > 0
        ? next.sha256Fingerprints
        : current.sha256Fingerprints,
    customDomainVerified:
      typeof next.customDomainVerified === 'boolean'
        ? next.customDomainVerified
        : current.customDomainVerified,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_DOMAIN_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage quota errors
    }
  }
  return merged;
}

// Backward-compatible named constants anchored to initial active config
const INITIAL_DOMAIN_CONFIG = getStoredDomainConfig();
const INITIAL_HOSTS = getCustomDomainHosts(INITIAL_DOMAIN_CONFIG.primaryDomain);

export const BRANDED_CUSTOM_DOMAIN = INITIAL_HOSTS.apexDomain;
export const BRANDED_CUSTOM_URL = INITIAL_HOSTS.apexUrl;
export const BRANDED_APP_SUBDOMAIN = INITIAL_HOSTS.appSubdomain;
export const BRANDED_APP_URL = INITIAL_HOSTS.appUrl;

export interface DnsRecordConfig {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  cloudflareProxy?: string;
  status: 'READY' | 'VERIFY_VIA_DNS';
  purpose: string;
}

export const TALENT_RADAR_DNS_RECORDS: DnsRecordConfig[] = buildDnsRecordsForDomain(
  BRANDED_CUSTOM_DOMAIN,
  GOOGLE_CLOUD_PROJECT_ID
);

export function isCustomDomainHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().trim();
  if (!clean) return false;
  return (
    clean !== 'localhost' &&
    clean !== '127.0.0.1' &&
    !clean.endsWith('.run.app') &&
    !clean.includes('aistudio.google.com')
  );
}

/**
 * Resolves the active functional server address.
 * In the browser runtime, dynamically uses `window.location.origin`.
 * Falls back to the live public Shared App URL.
 */
export function getActiveServerUrl(): string {
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    window.location.origin !== 'null'
  ) {
    return window.location.origin;
  }
  return VERIFIED_SHARED_PRE_URL;
}

/**
 * Resolves the best shareable public URL for external visitors, QR codes, and social links.
 * - If visited on your connected custom domain, keeps that custom domain origin.
 * - If custom domain DNS has been verified (or explicitly configured via VITE_CUSTOM_DOMAIN), uses that custom domain origin.
 * - Otherwise maps localhost / internal dev URLs to the live public Shared Cloud Run URL (never aistudio.google.com).
 */
export function getPublicShareBaseUrl(): string {
  const stored = getStoredDomainConfig();
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const hostname = window.location.hostname || '';
    if (isCustomDomainHost(hostname)) {
      return origin;
    }
    if (stored.customDomainVerified) {
      return getEntryOriginForDomain(stored.primaryDomain, stored.preferredEntryHost);
    }
    const isInternalDevOrLocal =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('ais-dev-');
    return isInternalDevOrLocal ? VERIFIED_SHARED_PRE_URL : origin;
  }

  if (stored.customDomainVerified) {
    return getEntryOriginForDomain(stored.primaryDomain, stored.preferredEntryHost);
  }
  return VERIFIED_SHARED_PRE_URL;
}

/**
 * Full functional API address for Bulk Annual Capabilities CSV
 */
export function getBulkCapabilitiesCsvApiUrl(): string {
  return `${getActiveServerUrl()}/api/export/bulk-capabilities-csv`;
}

/**
 * Full functional API address for Codebase ZIP Export
 */
export function getRepositoryZipApiUrl(): string {
  return `${getActiveServerUrl()}/api/export/zip`;
}

export {
  FREE_FIREBASE_HOSTING_DOMAIN,
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
  type DnsRecordSpec,
};
