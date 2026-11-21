/**
 * Shared Pure-TypeScript Custom Domain, Cloudflare DNS & Origin Utilities
 * Used by both Node.js server.ts (native TS stripping) and Vite React client.
 */

export const DEFAULT_CUSTOM_DOMAIN = 'talentradar.io';
export const FREE_FIREBASE_HOSTING_DOMAIN = 'gen-lang-client-0212017392.web.app';
export const FREE_FIREBASE_ALT_DOMAIN = 'gen-lang-client-0212017392.firebaseapp.com';
export const FALLBACK_SHARED_CLOUD_RUN_URL =
  'https://ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
export const FALLBACK_DEV_CLOUD_RUN_URL =
  'https://ais-dev-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
export const CANONICAL_CLOUD_RUN_HOST_NAME =
  'ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';

export const DEFAULT_ANDROID_PACKAGE_NAME = 'com.talentradar.app';
export const DEFAULT_ANDROID_SHA256_FINGERPRINTS: string[] = [
  '14:6D:E9:7D:6A:B9:6E:CE:3B:A2:55:76:84:87:69:8A:28:AE:5B:3F:8A:E2:08:95:F4:D6:75:E7:54:14:02:8B',
  'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
];

export type PreferredEntryHost = 'root' | 'app';

export interface DomainConfigSnapshot {
  primaryDomain: string;
  preferredEntryHost: PreferredEntryHost;
  sha256Fingerprints: string[];
  customDomainVerified?: boolean;
  updatedAt?: string;
}

export interface DnsRecordSpec {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  cloudflareProxy: 'DNS only (Cloud Run SSL)' | 'Proxied or DNS only' | 'DNS only (Verification)';
  status: 'READY' | 'VERIFY_VIA_DNS';
  purpose: string;
}

export function isManagedFreeSubdomain(domain: string | undefined | null): boolean {
  const clean = String(domain || '').trim().toLowerCase();
  return (
    clean.endsWith('.web.app') ||
    clean.endsWith('.firebaseapp.com') ||
    clean.endsWith('.workers.dev') ||
    clean.endsWith('.run.app') ||
    clean.endsWith('.onrender.com')
  );
}

export function sanitizeDomainInput(raw: string | undefined | null): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .replace(/^app\./, '')
    .replace(/[^a-z0-9.-]/g, '');

  if (!cleaned || !cleaned.includes('.') || cleaned.startsWith('.') || cleaned.endsWith('.')) {
    return DEFAULT_CUSTOM_DOMAIN;
  }
  return cleaned;
}

export function isValidCustomDomainFormat(raw: string | undefined | null): boolean {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(cleaned);
}

export function sanitizeSha256Fingerprint(raw: string): string | null {
  const stripped = raw.trim().toUpperCase().replace(/[^A-F0-9]/g, '');
  if (stripped.length !== 64) return null;
  return stripped.match(/.{1,2}/g)?.join(':') || null;
}

export function getCustomDomainHosts(domain: string) {
  const apex = sanitizeDomainInput(domain);
  const managedFree = isManagedFreeSubdomain(apex);
  if (managedFree) {
    const firebasePair = apex.endsWith('.web.app')
      ? [apex, apex.replace(/\.web\.app$/, '.firebaseapp.com')]
      : apex.endsWith('.firebaseapp.com')
      ? [apex.replace(/\.firebaseapp\.com$/, '.web.app'), apex]
      : [apex];
    return {
      isManagedFreeHost: true,
      apexDomain: apex,
      apexUrl: `https://${apex}`,
      wwwSubdomain: apex,
      wwwUrl: `https://${apex}`,
      appSubdomain: apex,
      appUrl: `https://${apex}`,
      authorizedDomains: firebasePair,
    };
  }
  return {
    isManagedFreeHost: false,
    apexDomain: apex,
    apexUrl: `https://${apex}`,
    wwwSubdomain: `www.${apex}`,
    wwwUrl: `https://www.${apex}`,
    appSubdomain: `app.${apex}`,
    appUrl: `https://app.${apex}`,
    authorizedDomains: [apex, `www.${apex}`, `app.${apex}`],
  };
}

export function getEntryOriginForDomain(
  domain: string,
  preferredEntryHost: PreferredEntryHost = 'root'
): string {
  const hosts = getCustomDomainHosts(domain);
  return preferredEntryHost === 'app' && !hosts.isManagedFreeHost ? hosts.appUrl : hosts.apexUrl;
}

export function buildDnsRecordsForDomain(domain: string, projectId = '50566079524'): DnsRecordSpec[] {
  const apex = sanitizeDomainInput(domain);
  const verificationSlug = apex.replace(/[^a-z0-9]/g, '-');
  return [
    {
      type: 'CNAME',
      host: '@',
      value: 'ghs.googlehosted.com.',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Cloudflare CNAME Flattening at Apex (Preferred over 4 A records)',
    },
    {
      type: 'A',
      host: '@',
      value: '216.239.32.21',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Google Cloud Anycast Edge Gateway (Node 1 — if not using Apex CNAME)',
    },
    {
      type: 'A',
      host: '@',
      value: '216.239.34.21',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Google Cloud Anycast Edge Gateway (Node 2)',
    },
    {
      type: 'A',
      host: '@',
      value: '216.239.36.21',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Google Cloud Anycast Edge Gateway (Node 3)',
    },
    {
      type: 'A',
      host: '@',
      value: '216.239.38.21',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Google Cloud Anycast Edge Gateway (Node 4)',
    },
    {
      type: 'AAAA',
      host: '@',
      value: '2001:4860:4802:32::15',
      ttl: '300',
      cloudflareProxy: 'DNS only (Cloud Run SSL)',
      status: 'READY',
      purpose: 'Google Cloud Anycast IPv6 Gateway',
    },
    {
      type: 'CNAME',
      host: 'app',
      value: 'ghs.googlehosted.com.',
      ttl: '300',
      cloudflareProxy: 'Proxied or DNS only',
      status: 'READY',
      purpose: `Primary App Subdomain (app.${apex}) -> Cloud Run Ingress`,
    },
    {
      type: 'CNAME',
      host: 'www',
      value: 'ghs.googlehosted.com.',
      ttl: '300',
      cloudflareProxy: 'Proxied or DNS only',
      status: 'READY',
      purpose: `WWW Host (www.${apex}) -> Cloud Run Ingress`,
    },
    {
      type: 'TXT',
      host: '@',
      value: `google-site-verification=${verificationSlug}-cloudrun-${projectId}`,
      ttl: '3600',
      cloudflareProxy: 'DNS only (Verification)',
      status: 'VERIFY_VIA_DNS',
      purpose: 'Google Cloud Run Domain Mapping Ownership Verification',
    },
  ];
}

export function buildCloudflareBindZoneFile(domain: string, projectId = '50566079524', region = 'europe-west2'): string {
  const apex = sanitizeDomainInput(domain);
  const verificationSlug = apex.replace(/[^a-z0-9]/g, '-');
  return `; ====================================================================
; CLOUDFLARE BIND DNS ZONE IMPORT: ${apex}
; ROUTING: ROOT (@), WWW, AND APP.${apex.toUpperCase()} -> CLOUD RUN (${region})
; PROJECT: ${projectId} // SERVICE: ${CANONICAL_CLOUD_RUN_HOST_NAME}
; ====================================================================

$TTL 300

; Root Apex Google Cloud Anycast A Records (Cloudflare also supports CNAME @ -> ghs.googlehosted.com.)
@       300     IN      A       216.239.32.21
@       300     IN      A       216.239.34.21
@       300     IN      A       216.239.36.21
@       300     IN      A       216.239.38.21

; IPv6 Anycast Gateways
@       300     IN      AAAA    2001:4860:4802:32::15
@       300     IN      AAAA    2001:4860:4802:34::15
@       300     IN      AAAA    2001:4860:4802:36::15
@       300     IN      AAAA    2001:4860:4802:38::15

; Subdomain Ingress (app.${apex} & www.${apex})
app     300     IN      CNAME   ghs.googlehosted.com.
www     300     IN      CNAME   ghs.googlehosted.com.

; Google Cloud Run Domain Ownership Verification
@       3600    IN      TXT     "google-site-verification=${verificationSlug}-cloudrun-${projectId}"`;
}

export function buildCloudflareWorkerScript(domain: string, upstreamOrigin = FALLBACK_SHARED_CLOUD_RUN_URL): string {
  const hosts = getCustomDomainHosts(domain);
  const cleanUpstream = upstreamOrigin.replace(/\/+$/, '');
  return `// Cloudflare Worker Route: ${hosts.apexDomain}/* , ${hosts.wwwSubdomain}/* , ${hosts.appSubdomain}/*
// Routes traffic directly to your public Cloud Run service while preserving X-Forwarded-Host
// (Ensures shareable links open your app cleanly with zero AI Studio redirect).

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const upstreamBase = new URL("${cleanUpstream}");

    const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, upstreamBase);
    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", incomingUrl.host);
    headers.set("X-Forwarded-Proto", "https");
    headers.set("Host", upstreamBase.host);

    const proxiedRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const response = await fetch(proxiedRequest);
    const respHeaders = new Headers(response.headers);

    // Rewrite any upstream Location redirects so users stay on your custom domain
    const location = respHeaders.get("Location");
    if (location && location.includes(upstreamBase.host)) {
      respHeaders.set(
        "Location",
        location.replace(upstreamBase.origin, incomingUrl.origin)
      );
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  },
};`;
}
