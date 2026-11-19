import React, { useEffect, useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Lock,
  Share2,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
  TrendingUp,
  BadgeDollarSign,
  Megaphone,
  FileCode,
  RefreshCw,
  AlertTriangle,
  Bot,
  CreditCard,
  Smartphone,
  KeyRound,
  Download,
  Cloud,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  FREE_FIREBASE_HOSTING_DOMAIN,
  GOOGLE_CLOUD_PROJECT_ID,
  GOOGLE_CLOUD_REGION,
  CANONICAL_CLOUD_RUN_HOST,
  VERIFIED_FUNCTIONAL_DEV_URL,
  VERIFIED_SHARED_PRE_URL,
  getPublicShareBaseUrl,
  getStoredDomainConfig,
  saveStoredDomainConfig,
  buildDnsRecordsForDomain,
  buildCloudflareBindZoneFile,
  buildCloudflareWorkerScript,
  getCustomDomainHosts,
  getEntryOriginForDomain,
  isManagedFreeSubdomain,
  sanitizeDomainInput,
  isValidCustomDomainFormat,
  sanitizeSha256Fingerprint,
  type PreferredEntryHost,
} from '../utils/serverConfig';
import { TAB_TO_PATH } from '../utils/urlRouting';
import { useSubscription } from '../context/SubscriptionContext';
import { auth } from '../firebase';
import FunctionalQRCode from './FunctionalQRCode';

interface AuthenticUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface HostCheckEntry {
  host: string;
  ips: string[];
  cnames?: string[];
  probe: {
    reachable: boolean;
    httpStatus: number | null;
    matchesThisApp: boolean;
    note: string;
  } | null;
}

interface DnsVerificationResult {
  customDomain: string;
  status: string;
  verified: boolean;
  availabilityHint?: 'LIKELY_AVAILABLE' | 'REGISTERED_ELSEWHERE' | 'OWNED_CONFIGURED';
  cloudflareDetected?: boolean;
  cloudflareNameservers?: string[];
  message?: string;
  resolvedIps?: string[];
  resolvedNs?: string[];
  hostChecks?: {
    root: HostCheckEntry;
    www: HostCheckEntry;
    app: HostCheckEntry;
  };
  cloudflareBindZone?: string;
  cloudflareWorkerScript?: string;
  timestamp: string;
}

const SUGGESTED_ALTERNATIVE_DOMAINS = [
  FREE_FIREBASE_HOSTING_DOMAIN,
  'talentradar.io',
  'radarintel.io',
  'globalcareerradar.io',
  'globalcareerradar.app',
];

export default function AuthenticUrlModal({
  isOpen,
  onClose,
  onNavigateToTab,
}: AuthenticUrlModalProps) {
  const { openPaywall, openBillingPortal } = useSubscription();
  const livePublicUrl = getPublicShareBaseUrl();
  const authenticDevUrl = VERIFIED_FUNCTIONAL_DEV_URL;

  const initialConfig = getStoredDomainConfig();
  const [primaryDomain, setPrimaryDomain] = useState<string>(initialConfig.primaryDomain);
  const [domainInput, setDomainInput] = useState<string>(initialConfig.primaryDomain);
  const [preferredEntryHost, setPreferredEntryHost] = useState<PreferredEntryHost>(
    initialConfig.preferredEntryHost
  );
  const [sha256Fingerprints, setSha256Fingerprints] = useState<string[]>(
    initialConfig.sha256Fingerprints
  );
  const [newFingerprintInput, setNewFingerprintInput] = useState('');
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [customDomainVerified, setCustomDomainVerified] = useState<boolean>(
    Boolean(initialConfig.customDomainVerified)
  );

  const [urlMode, setUrlMode] = useState<'live' | 'custom'>(
    initialConfig.customDomainVerified ? 'custom' : 'live'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'url' | 'deeplinks' | 'customdomain' | 'sync' | 'share'
  >('url');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsVerificationResult, setDnsVerificationResult] =
    useState<DnsVerificationResult | null>(null);
  const [showWorkerScript, setShowWorkerScript] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/domain/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.primaryDomain) return;
        const nextDomain = sanitizeDomainInput(data.primaryDomain);
        const nextEntry: PreferredEntryHost =
          data.preferredEntryHost === 'app' ? 'app' : 'root';
        const nextFps =
          Array.isArray(data.sha256Fingerprints) && data.sha256Fingerprints.length > 0
            ? data.sha256Fingerprints
            : initialConfig.sha256Fingerprints;
        const nextVerified = Boolean(data.customDomainVerified);

        setPrimaryDomain(nextDomain);
        setDomainInput(nextDomain);
        setPreferredEntryHost(nextEntry);
        setSha256Fingerprints(nextFps);
        setCustomDomainVerified(nextVerified);
        saveStoredDomainConfig({
          primaryDomain: nextDomain,
          preferredEntryHost: nextEntry,
          sha256Fingerprints: nextFps,
          customDomainVerified: nextVerified,
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeHosts = getCustomDomainHosts(primaryDomain);
  const preferredCustomOrigin = getEntryOriginForDomain(primaryDomain, preferredEntryHost);
  const activeDnsRecords = buildDnsRecordsForDomain(primaryDomain, GOOGLE_CLOUD_PROJECT_ID);
  const activeBindZone = buildCloudflareBindZoneFile(
    primaryDomain,
    GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_REGION
  );
  const activeWorkerScript = buildCloudflareWorkerScript(
    primaryDomain,
    VERIFIED_SHARED_PRE_URL
  );

  const activeBaseUrl = urlMode === 'custom' ? preferredCustomOrigin : livePublicUrl;
  const activeHostLabel = activeBaseUrl.replace(/^https?:\/\//, '');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const persistServerDomainConfig = async (
    nextDomain: string,
    nextEntryHost: PreferredEntryHost,
    nextFingerprints: string[]
  ) => {
    setIsSavingConfig(true);
    setSaveNotice(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const resp = await fetch('/api/domain/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          primaryDomain: nextDomain,
          preferredEntryHost: nextEntryHost,
          sha256Fingerprints: nextFingerprints,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json?.success) {
        const saved = saveStoredDomainConfig({
          primaryDomain: json.primaryDomain,
          preferredEntryHost: json.preferredEntryHost,
          sha256Fingerprints: json.sha256Fingerprints,
          customDomainVerified: Boolean(json.customDomainVerified),
        });
        setPrimaryDomain(saved.primaryDomain);
        setDomainInput(saved.primaryDomain);
        setPreferredEntryHost(saved.preferredEntryHost);
        setSha256Fingerprints(saved.sha256Fingerprints);
        setCustomDomainVerified(Boolean(saved.customDomainVerified));
        setSaveNotice(`Saved domain config for ${saved.primaryDomain} (${saved.preferredEntryHost === 'app' ? `app.${saved.primaryDomain}` : saved.primaryDomain}).`);
      } else {
        saveStoredDomainConfig({
          primaryDomain: nextDomain,
          preferredEntryHost: nextEntryHost,
          sha256Fingerprints: nextFingerprints,
        });
        setSaveNotice(json?.error || 'Updated local domain preview (sign in as owner to persist server-side).');
      }
    } catch {
      saveStoredDomainConfig({
        primaryDomain: nextDomain,
        preferredEntryHost: nextEntryHost,
        sha256Fingerprints: nextFingerprints,
      });
      setSaveNotice('Updated local domain configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleApplyDomainInput = async (overrideDomain?: string) => {
    const raw = (overrideDomain ?? domainInput).trim();
    if (!isValidCustomDomainFormat(raw)) {
      setSaveNotice('Enter a valid domain such as talentradar.io or careerradar.app.');
      return;
    }
    const cleaned = sanitizeDomainInput(raw);
    setPrimaryDomain(cleaned);
    setDomainInput(cleaned);
    await persistServerDomainConfig(cleaned, preferredEntryHost, sha256Fingerprints);
  };

  const handleEntryHostChange = async (nextHost: PreferredEntryHost) => {
    setPreferredEntryHost(nextHost);
    await persistServerDomainConfig(primaryDomain, nextHost, sha256Fingerprints);
  };

  const handleAddFingerprint = async () => {
    setFingerprintError(null);
    const normalized = sanitizeSha256Fingerprint(newFingerprintInput);
    if (!normalized) {
      setFingerprintError('Invalid SHA-256 fingerprint. Expected 64 hex characters (with or without colons).');
      return;
    }
    if (sha256Fingerprints.includes(normalized)) {
      setFingerprintError('That SHA-256 fingerprint is already listed.');
      return;
    }
    const nextList = [...sha256Fingerprints, normalized];
    setSha256Fingerprints(nextList);
    setNewFingerprintInput('');
    await persistServerDomainConfig(primaryDomain, preferredEntryHost, nextList);
  };

  const handleRemoveFingerprint = async (fpToRemove: string) => {
    if (sha256Fingerprints.length <= 1) {
      setFingerprintError('Keep at least one SHA-256 certificate fingerprint active for TWA verification.');
      return;
    }
    const nextList = sha256Fingerprints.filter((fp) => fp !== fpToRemove);
    setSha256Fingerprints(nextList);
    await persistServerDomainConfig(primaryDomain, preferredEntryHost, nextList);
  };

  const handleTestLiveDns = async (overrideDomain?: string) => {
    const targetDomain = sanitizeDomainInput(overrideDomain || domainInput || primaryDomain);
    setIsVerifyingDns(true);
    try {
      const resp = await fetch('/api/cloud/dns-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });
      const data = await resp.json();
      const verified = Boolean(data.verified);
      setDnsVerificationResult({
        customDomain: data.customDomain || targetDomain,
        status: data.status || 'DNS_NOT_POINTED_YET',
        verified,
        availabilityHint: data.availabilityHint,
        cloudflareDetected: Boolean(data.cloudflareDetected),
        cloudflareNameservers: data.cloudflareNameservers || [],
        message: data.message,
        resolvedIps: data.resolvedIps || [],
        resolvedNs: data.resolvedNs || [],
        hostChecks: data.hostChecks,
        cloudflareBindZone: data.cloudflareBindZone,
        cloudflareWorkerScript: data.cloudflareWorkerScript,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (targetDomain === primaryDomain) {
        setCustomDomainVerified(verified);
        saveStoredDomainConfig({ customDomainVerified: verified });
        if (verified) setUrlMode('custom');
      }
    } catch {
      setDnsVerificationResult({
        customDomain: targetDomain,
        status: 'LOOKUP_UNAVAILABLE',
        verified: false,
        message: 'Could not reach DNS verification endpoint.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifyingDns(false);
    }
  };

  const deepLinks = [
    {
      title: 'Market Salary Analytics & Projections',
      desc: 'Multi-sector trajectories (2020-2027), percentile spreads, and CSV export',
      actionType: 'tab' as const,
      tabKey: 'analytics',
      url: `${activeBaseUrl}${TAB_TO_PATH.analytics}`,
      icon: <TrendingUp className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      title: 'Full 3D Talent Radar Console',
      desc: 'Interactive Three.js globe requisitions & live job alert subscriptions',
      actionType: 'tab' as const,
      tabKey: 'radar',
      url: `${activeBaseUrl}${TAB_TO_PATH.radar}`,
      icon: <Globe className="w-4 h-4 text-[#22d3a5]" />,
    },
    {
      title: 'Career Path & D3 Interactive Skill Tree',
      desc: 'Dynamic node-based skill progression & milestone roadmap',
      actionType: 'tab' as const,
      tabKey: 'career',
      url: `${activeBaseUrl}${TAB_TO_PATH.career}`,
      icon: <Compass className="w-4 h-4 text-[#a78bfa]" />,
    },
    {
      title: '4-Agent Autonomous AI Triad',
      desc: 'Scout, Strategist, Envoy & Risk Auditor real-time coordination',
      actionType: 'tab' as const,
      tabKey: 'ai',
      url: `${activeBaseUrl}${TAB_TO_PATH.ai}`,
      icon: <Bot className="w-4 h-4 text-[#22d3a5]" />,
    },
    {
      title: 'Compensation, Equity & Tax Platform',
      desc: '4-year TTC modeling, global net tax comparison, and ZOPA counter-offer calculator',
      actionType: 'tab' as const,
      tabKey: 'finance',
      url: `${activeBaseUrl}${TAB_TO_PATH.finance}`,
      icon: <BadgeDollarSign className="w-4 h-4 text-[#fbbf24]" />,
    },
    {
      title: 'Paystack Subscriptions & Billing Portal',
      desc: 'Clean vanity URL for checkout plans (/pricing) and receipts (/billing)',
      actionType: 'billing' as const,
      tabKey: 'billing',
      url: `${activeBaseUrl}/billing`,
      icon: <CreditCard className="w-4 h-4 text-[#22d3a5]" />,
    },
    {
      title: '20% Referral Partner Invite Hub',
      desc: 'Shareable /r/CODE discount links for Europe, Africa, and global engineering teams',
      actionType: 'tab' as const,
      tabKey: 'analytics',
      url: `${activeBaseUrl}/referrals`,
      icon: <Megaphone className="w-4 h-4 text-[#38bdf8]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f1720] border border-[#22d3a5]/50 rounded-2xl shadow-[0_0_60px_rgba(34,211,165,0.25)] text-[#dce7f0] font-mono overflow-hidden animate-fadeIn my-8">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-[#111a22] via-[#152330] to-[#111a22] border-b border-[#1e2b36] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shadow-[0_0_18px_rgba(34,211,165,0.3)] shrink-0">
              <Globe className="w-6 h-6 animate-spin" style={{ animationDuration: '18s' }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40 tracking-wider">
                  CLOUDFLARE &amp; CUSTOM DOMAIN HUB
                </span>
                <span className="text-[11px] text-[#38bdf8] flex items-center gap-1">
                  <Server className="w-3 h-3 text-[#38bdf8]" />
                  CLOUD RUN ({GOOGLE_CLOUD_REGION})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide mt-0.5 truncate max-w-[480px]">
                {activeHostLabel}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-[#7a8b99] hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close URL modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-[#1e2b36] bg-[#0a0f14] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('url')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeSubTab === 'url'
                ? 'border-[#22d3a5] text-[#22d3a5] bg-[#22d3a5]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            Live URL &amp; QR
          </button>
          <button
            onClick={() => setActiveSubTab('deeplinks')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeSubTab === 'deeplinks'
                ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            Vanity Routes
          </button>
          <button
            onClick={() => setActiveSubTab('customdomain')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeSubTab === 'customdomain'
                ? 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            {isManagedFreeSubdomain(primaryDomain)
              ? `Firebase Hosting (${activeHosts.apexDomain})`
              : `Cloudflare DNS (${activeHosts.apexDomain})`}
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeSubTab === 'sync'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            TWA, Auth &amp; Sync
          </button>
          <button
            onClick={() => setActiveSubTab('share')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeSubTab === 'share'
                ? 'border-[#a78bfa] text-[#a78bfa] bg-[#a78bfa]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            Share
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Host Switcher Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0a0f14] border border-[#1e2b36] text-xs">
            <span className="text-[#7a8b99]">
              Share Target Mode:{' '}
              <strong className="text-[#dce7f0]">
                {urlMode === 'custom'
                  ? `${preferredCustomOrigin} (${
                      customDomainVerified
                        ? 'Verified Active'
                        : isManagedFreeSubdomain(primaryDomain)
                        ? 'Ready for Firebase Deploy'
                        : 'Awaiting Cloudflare Cutover'
                    })`
                  : 'Verified Live Cloud Run Origin'}
              </strong>
            </span>
            <div className="flex items-center gap-1 bg-[#111a22] p-1 rounded-lg border border-[#1e2b36] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUrlMode('live')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  urlMode === 'live' ? 'bg-[#22d3a5] text-black' : 'text-[#7a8b99] hover:text-white'
                }`}
              >
                Live Origin URL
              </button>
              <button
                type="button"
                onClick={() => setUrlMode('custom')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  urlMode === 'custom' ? 'bg-[#fbbf24] text-black' : 'text-[#7a8b99] hover:text-white'
                }`}
              >
                {preferredEntryHost === 'app' && !isManagedFreeSubdomain(primaryDomain)
                  ? activeHosts.appSubdomain
                  : activeHosts.apexDomain}
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE WORKING URL & QR CODE */}
          {activeSubTab === 'url' && (
            <div className="space-y-5">
              {/* Primary URL Box */}
              <div className="bg-[#111a22] border-2 border-[#22d3a5]/70 rounded-xl p-4 shadow-[0_0_25px_rgba(34,211,165,0.2)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#22d3a5] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22d3a5]" />
                    <span>
                      {urlMode === 'custom'
                        ? isManagedFreeSubdomain(primaryDomain)
                          ? 'FREE FIREBASE HOSTING ORIGIN:'
                          : `CUSTOM DOMAIN (${preferredEntryHost === 'app' ? 'APP SUBDOMAIN' : 'ROOT APEX'}):`
                        : 'ACTIVE SHAREABLE APP URL (NO AI STUDIO REDIRECT):'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold">
                    TLS 1.3 HTTPS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-[#0a0f14] border border-[#22d3a5]/40 rounded-lg px-3.5 py-2.5 text-xs text-[#22d3a5] font-mono break-all select-all flex items-center gap-2 font-bold">
                    <Lock className="w-4 h-4 text-[#22d3a5] shrink-0" />
                    <span className="text-xs sm:text-sm">{activeBaseUrl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(activeBaseUrl, 'primary-url')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(34,211,165,0.3)] active:scale-95 cursor-pointer"
                    >
                      {copiedKey === 'primary-url' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                    <a
                      href={activeBaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-white text-xs transition flex items-center justify-center gap-1 active:scale-95"
                      title={`Open ${activeBaseUrl} in new tab`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <p className="text-[11px] text-[#7a8b99] leading-relaxed">
                  {urlMode === 'live' ? (
                    <>
                      All routes use clean semantic URLs (<code className="text-[#22d3a5]">/radar</code>,{' '}
                      <code className="text-[#22d3a5]">/salary-analytics</code>, <code className="text-[#22d3a5]">/pricing</code>,{' '}
                      <code className="text-[#22d3a5]">/billing</code>). Deploy or connect{' '}
                      <strong>{activeHosts.apexDomain}</strong> in the{' '}
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('customdomain')}
                        className="text-[#fbbf24] underline cursor-pointer"
                      >
                        {isManagedFreeSubdomain(primaryDomain) ? 'Firebase Hosting tab' : 'Cloudflare DNS tab'}
                      </button>{' '}
                      to bypass AI Studio preview walls for external users.
                    </>
                  ) : isManagedFreeSubdomain(primaryDomain) ? (
                    <>
                      Routes directly to free Firebase Hosting origin <strong>{preferredCustomOrigin}</strong> (with mirror{' '}
                      <code className="text-[#22d3a5]">{activeHosts.authorizedDomains[1] || activeHosts.apexDomain}</code>),{' '}
                      automatic SSL, Firebase Auth, PWA install, and Android TWA verification.
                    </>
                  ) : (
                    <>
                      Routes directly to <strong>{preferredCustomOrigin}</strong> (both{' '}
                      <code className="text-[#22d3a5]">{activeHosts.apexDomain}</code> and{' '}
                      <code className="text-[#22d3a5]">{activeHosts.appSubdomain}</code> are configured) with automatic{' '}
                      <code className="text-[#38bdf8]">/sitemap.xml</code>, Paystack return callbacks, and Android TWA verification.
                    </>
                  )}
                </p>
              </div>

              {/* Endpoint Reference Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#22d3a5] font-bold">
                      {isManagedFreeSubdomain(primaryDomain) ? 'FREE FIREBASE HOSTING (.WEB.APP):' : 'ROOT APEX & WWW:'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#fbbf24]/15 text-[#fbbf24]">
                      {customDomainVerified
                        ? 'VERIFIED'
                        : isManagedFreeSubdomain(primaryDomain)
                        ? '$0 FREE'
                        : 'CLOUDFLARE'}
                    </span>
                  </div>
                  <div className="text-white font-bold font-mono text-[11px] truncate" title={activeHosts.apexUrl}>
                    {isManagedFreeSubdomain(primaryDomain)
                      ? activeHosts.apexUrl
                      : `${activeHosts.apexUrl} • ${activeHosts.wwwSubdomain}`}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#7a8b99]">Cloud Run Origin: {VERIFIED_SHARED_PRE_URL.slice(8, 28)}...</span>
                    <button
                      onClick={() => handleCopy(activeHosts.apexUrl, 'custom-apex')}
                      className="text-[11px] text-[#22d3a5] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'custom-apex' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#38bdf8] font-bold">
                      {isManagedFreeSubdomain(primaryDomain) ? 'FIREBASE MIRROR HOST:' : 'APP SUBDOMAIN:'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38bdf8]/15 text-[#38bdf8]">
                      {isManagedFreeSubdomain(primaryDomain) ? 'AUTO-ALT' : 'SUBDOMAIN'}
                    </span>
                  </div>
                  <div
                    className="text-white font-bold font-mono text-[11px] truncate"
                    title={
                      isManagedFreeSubdomain(primaryDomain)
                        ? `https://${activeHosts.authorizedDomains[1] || activeHosts.apexDomain}`
                        : activeHosts.appUrl
                    }
                  >
                    {isManagedFreeSubdomain(primaryDomain)
                      ? `https://${activeHosts.authorizedDomains[1] || activeHosts.apexDomain}`
                      : activeHosts.appUrl}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#7a8b99]">Dev URL: {authenticDevUrl.slice(8, 28)}...</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          isManagedFreeSubdomain(primaryDomain)
                            ? `https://${activeHosts.authorizedDomains[1] || activeHosts.apexDomain}`
                            : activeHosts.appUrl,
                          'custom-app'
                        )
                      }
                      className="text-[11px] text-[#38bdf8] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'custom-app' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Functional Mobile QR Code Quick Access */}
              <FunctionalQRCode
                value={`${activeBaseUrl}/radar`}
                title={`Instant Smartphone QR: ${activeHostLabel}/radar`}
                subtitle={`Scan with any phone camera to launch the 3D Talent Radar directly on ${activeHostLabel}/radar.`}
              />
            </div>
          )}

          {/* TAB 2: CLEAN VANITY ROUTES */}
          {activeSubTab === 'deeplinks' && (
            <div className="space-y-4">
              <p className="text-xs text-[#7a8b99]">
                Every section uses clean, shareable paths (no cluttered query strings) with automatic browser history &amp; deep-load support:
              </p>

              <div className="space-y-2.5">
                {deepLinks.map((item) => (
                  <div
                    key={item.tabKey + item.title}
                    className="p-3 bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/40 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="font-bold text-white">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-[#7a8b99]">{item.desc}</div>
                      <div className="text-[10px] text-[#22d3a5] font-mono break-all">{item.url}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(item.url, `dl-${item.title}`)}
                        className="px-3 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-white font-semibold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        {copiedKey === `dl-${item.title}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (item.actionType === 'billing') {
                            onClose();
                            openBillingPortal();
                          } else {
                            if (onNavigateToTab) onNavigateToTab(item.tabKey);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#22d3a5]/10 hover:bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/30 transition text-xs font-semibold cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLOUDFLARE CUSTOM DOMAIN WIZARD & LIVE CHECKER */}
          {activeSubTab === 'customdomain' && (
            <div className="space-y-5 text-xs">
              {/* Domain Selection & Availability Box */}
              <div className="p-4 bg-[#111a22] border border-[#22d3a5]/50 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#22d3a5] font-bold">
                    <Cloud className="w-4 h-4" />
                    <span>1. CHOOSE OR SWITCH CUSTOM DOMAIN</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40 w-fit">
                    {isManagedFreeSubdomain(primaryDomain)
                      ? 'FREE $0 FIREBASE HOSTING'
                      : 'CLOUDFLARE ROOT + APP SUBDOMAIN'}
                  </span>
                </div>

                <p className="text-[11px] text-[#7a8b99] leading-relaxed">
                  {isManagedFreeSubdomain(primaryDomain) ? (
                    <>
                      Using free Firebase Hosting <code className="text-[#22d3a5]">{activeHosts.apexDomain}</code> ($0 domain cost, auto SSL, zero Cloudflare setup). Click{' '}
                      <strong>SAVE ACTIVE DOMAIN</strong> to persist, or switch to a custom domain anytime.
                    </>
                  ) : (
                    <>
                      Select your free Firebase Hosting URL (<strong>{FREE_FIREBASE_HOSTING_DOMAIN}</strong>) for $0 deployment, or test a custom domain name below. Both{' '}
                      <code className="text-[#22d3a5]">{activeHosts.apexDomain}</code> and{' '}
                      <code className="text-[#38bdf8]">{activeHosts.appSubdomain}</code> stay synchronized automatically.
                    </>
                  )}
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="e.g. gen-lang-client-0212017392.web.app or talentradar.io"
                    className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyDomainInput()}
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    {isSavingConfig ? 'SAVING...' : 'SAVE ACTIVE DOMAIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestLiveDns()}
                    disabled={isVerifyingDns}
                    className="px-3.5 py-2 rounded-lg bg-[#0a0f14] border border-[#38bdf8]/60 hover:bg-[#38bdf8]/15 text-[#38bdf8] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDns ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingDns ? 'CHECKING...' : 'CHECK AVAILABILITY & DNS'}</span>
                  </button>
                </div>

                {/* Quick Alternative Domain Candidates & Primary Host Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#7a8b99]">Quick test / free &amp; paid alternatives:</span>
                    {SUGGESTED_ALTERNATIVE_DOMAINS.map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        onClick={() => {
                          setDomainInput(candidate);
                          setPrimaryDomain(candidate);
                          saveStoredDomainConfig({ primaryDomain: candidate, customDomainVerified: false });
                          void handleTestLiveDns(candidate);
                        }}
                        className={`px-2 py-0.5 rounded border text-[10px] transition cursor-pointer ${
                          primaryDomain === candidate
                            ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                            : candidate === FREE_FIREBASE_HOSTING_DOMAIN
                            ? 'bg-emerald-500/10 border-emerald-400/50 text-emerald-300 font-bold hover:border-[#22d3a5]'
                            : 'bg-[#0a0f14] border-[#1e2b36] text-[#dce7f0] hover:border-[#38bdf8]'
                        }`}
                      >
                        {candidate === FREE_FIREBASE_HOSTING_DOMAIN ? `FREE: ${candidate}` : candidate}
                      </button>
                    ))}
                  </div>

                  {!isManagedFreeSubdomain(primaryDomain) && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[#7a8b99]">Primary Share Host:</span>
                      <button
                        type="button"
                        onClick={() => handleEntryHostChange('root')}
                        className={`px-2 py-0.5 rounded border cursor-pointer ${
                          preferredEntryHost === 'root'
                            ? 'bg-[#22d3a5] text-black border-[#22d3a5] font-bold'
                            : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36]'
                        }`}
                      >
                        {activeHosts.apexDomain}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEntryHostChange('app')}
                        className={`px-2 py-0.5 rounded border cursor-pointer ${
                          preferredEntryHost === 'app'
                            ? 'bg-[#38bdf8] text-black border-[#38bdf8] font-bold'
                            : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36]'
                        }`}
                      >
                        {activeHosts.appSubdomain}
                      </button>
                    </div>
                  )}
                </div>

                {saveNotice && (
                  <div className="p-2.5 rounded bg-[#0a0f14] border border-[#22d3a5]/40 text-[#22d3a5] text-[11px]">
                    {saveNotice}
                  </div>
                )}

                {/* Live Verification Diagnostic Result */}
                {dnsVerificationResult && (
                  <div
                    className={`p-3.5 rounded-lg border text-[11px] space-y-2.5 ${
                      dnsVerificationResult.verified
                        ? 'bg-[#0a0f14] border-[#22d3a5]/50 text-[#22d3a5]'
                        : dnsVerificationResult.availabilityHint === 'REGISTERED_ELSEWHERE'
                        ? 'bg-[#0a0f14] border-red-400/50 text-red-300'
                        : 'bg-[#0a0f14] border-[#fbbf24]/50 text-[#fbbf24]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {dnsVerificationResult.verified ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#22d3a5]" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">
                            {dnsVerificationResult.customDomain} — {dnsVerificationResult.status}
                          </div>
                          {dnsVerificationResult.message && (
                            <div className="text-[#dce7f0] mt-0.5 leading-relaxed">
                              {dnsVerificationResult.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[#7a8b99] shrink-0">{dnsVerificationResult.timestamp}</span>
                    </div>

                    {dnsVerificationResult.hostChecks && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {(['root', 'www', 'app'] as const).map((k) => {
                          const hc = dnsVerificationResult.hostChecks?.[k];
                          if (!hc) return null;
                          const ok = Boolean(hc.probe?.matchesThisApp);
                          return (
                            <div key={k} className="p-2 rounded bg-[#111a22] border border-[#1e2b36] text-[10px]">
                              <div className="flex items-center justify-between font-bold text-white">
                                <span className="truncate">{hc.host}</span>
                                <span className={ok ? 'text-[#22d3a5]' : 'text-[#fbbf24]'}>
                                  {hc.probe?.httpStatus ? `HTTP ${hc.probe.httpStatus}` : hc.ips.length > 0 ? 'DNS' : 'NONE'}
                                </span>
                              </div>
                              <div className="text-[#7a8b99] mt-0.5 truncate">
                                {hc.probe?.note || (hc.ips.length > 0 ? hc.ips.join(', ') : 'No A/CNAME yet')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Firebase Hosting $0 Quick Deploy OR Cloudflare DNS Setup */}
              {isManagedFreeSubdomain(primaryDomain) ? (
                <div className="p-4 bg-gradient-to-r from-[#111a22] to-[#132924] border border-[#22d3a5]/50 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#22d3a5] font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>2. FREE $0 FIREBASE HOSTING DEPLOY ({activeHosts.apexDomain})</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40">
                      NO DOMAIN PURCHASE REQUIRED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#dce7f0] leading-relaxed">
                    Your workspace already includes <code>firebase.json</code> and <code>.firebaserc</code> pre-wired for{' '}
                    <strong>{activeHosts.apexDomain}</strong> (with <code>/.well-known/assetlinks.json</code> CORS headers, clean SPA routes, and automatic Firebase Auth authorization). Run these commands in your project folder after authenticating Firebase CLI:
                  </p>
                  <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                    <code className="text-[11px] text-[#22d3a5] font-mono break-all">
                      firebase login &amp;&amp; npm run build &amp;&amp; firebase deploy --only hosting
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'firebase login && npm run build && firebase deploy --only hosting',
                          'fb-deploy-cmd'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-[#22d3a5] text-black font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'fb-deploy-cmd' ? 'Copied!' : 'Copy CLI'}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f14]/80 border border-[#1e2b36] text-[11px] text-[#7a8b99] space-y-1">
                    <div className="text-[#dce7f0] font-bold">Static Frontend ($0) vs. Backend API (/api/*):</div>
                    <p className="leading-relaxed">
                      <code className="text-[#22d3a5]">firebase deploy --only hosting</code> immediately publishes the React app, Auth, Firestore, PWA, and Digital Asset Links at{' '}
                      <strong>https://{activeHosts.apexDomain}</strong>. To also serve <code className="text-[#38bdf8]">/api/*</code> routes (Paystack checkout &amp; Gemini intelligence) under the same URL, deploy the Cloud Run backend service and map{' '}
                      <code>&quot;source&quot;: &quot;/api/**&quot;</code> in <code>firebase.json</code>.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gradient-to-r from-[#111a22] to-[#162738] border border-[#38bdf8]/40 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
                        <Sparkles className="w-4 h-4" />
                        <span>2. CLOUDFLARE SSL, PROXY &amp; ZERO-403 ROUTING</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(activeBindZone, 'zone-file')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-[11px] transition cursor-pointer"
                        >
                          {copiedKey === 'zone-file' ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'zone-file' ? 'COPIED ZONE FILE!' : 'COPY CLOUDFLARE BIND ZONE'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowWorkerScript((v) => !v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] border border-[#38bdf8]/50 hover:bg-[#38bdf8]/15 text-[#38bdf8] font-bold text-[11px] transition cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>{showWorkerScript ? 'HIDE WORKER PROXY' : 'CLOUDFLARE WORKER PROXY'}</span>
                        </button>
                      </div>
                    </div>

                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#dce7f0]">
                      <li>
                        In <strong>Cloudflare Dashboard → SSL/TLS → Overview</strong>, set encryption mode to{' '}
                        <strong className="text-[#22d3a5]">Full (Strict)</strong>.
                      </li>
                      <li>
                        Add the DNS records below (Cloudflare supports <strong>CNAME Flattening at @</strong> so both apex{' '}
                        <code>{activeHosts.apexDomain}</code>, <code>www</code>, and <code>app</code> can point to{' '}
                        <code className="text-[#38bdf8]">ghs.googlehosted.com.</code>). Keep proxy <strong>DNS Only (grey cloud)</strong> while Google Cloud Run verifies SSL, then enable Orange Cloud proxy.
                      </li>
                      <li>
                        <strong>Avoiding AI Studio Redirect / 403</strong>: Ensure your Cloud Run service allows public unauthenticated ingress (<code>allUsers</code> Cloud Run Invoker), or attach the <strong>Cloudflare Worker Proxy</strong> to <code>{activeHosts.apexDomain}/*</code> and <code>{activeHosts.appSubdomain}/*</code> so visitors never hit preview workspace redirects.
                      </li>
                    </ol>

                    {showWorkerScript && (
                      <div className="space-y-2 pt-2 border-t border-[#1e2b36]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#fbbf24] font-bold">
                            Cloudflare Worker Reverse-Proxy Script (Preserves X-Forwarded-Host)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeWorkerScript, 'cf-worker')}
                            className="px-2.5 py-1 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-white cursor-pointer"
                          >
                            {copiedKey === 'cf-worker' ? 'Copied Worker!' : 'Copy Worker JS'}
                          </button>
                        </div>
                        <pre className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[10px] text-[#22d3a5] overflow-x-auto max-h-48">
                          {activeWorkerScript}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Exact DNS Records Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[#7a8b99]">
                      <span className="font-bold text-[#dce7f0] uppercase text-[10px] tracking-wider">
                        CLOUDFLARE DNS RECORDS FOR {activeHosts.apexDomain}
                      </span>
                      <span>TTL: Auto / 300s</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#1e2b36] bg-[#0a0f14]">
                      <table className="w-full text-xs text-left font-mono">
                        <thead>
                          <tr className="bg-[#111a22] border-b border-[#1e2b36] text-[10px] text-[#7a8b99] uppercase tracking-wider">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Target / Content</th>
                            <th className="py-2.5 px-3">CF Proxy</th>
                            <th className="py-2.5 px-3 text-right">Copy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2b36]/60">
                          {activeDnsRecords.map((rec, i) => (
                            <tr key={i} className="hover:bg-[#111a22]/70 transition">
                              <td className="py-2 px-3 font-bold text-[#fbbf24]">{rec.type}</td>
                              <td className="py-2 px-3 text-white font-semibold">{rec.host}</td>
                              <td className="py-2 px-3 text-[#22d3a5] truncate max-w-[190px]" title={rec.value}>
                                {rec.value}
                              </td>
                              <td className="py-2 px-3 text-[#7a8b99] text-[10px]">{rec.cloudflareProxy}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleCopy(rec.value, `rec-${i}`)}
                                  className="px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-[10px] text-white transition cursor-pointer"
                                >
                                  {copiedKey === `rec-${i}` ? 'Copied' : 'Copy'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: TWA ASSETLINKS, FIREBASE AUTH, PAYSTACK & SEO SYNC */}
          {activeSubTab === 'sync' && (
            <div className="space-y-5 text-xs">
              {/* Firebase Auth & Express CORS */}
              <div className="p-4 bg-[#111a22] border border-[#38bdf8]/40 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>FIREBASE AUTH AUTHORIZED DOMAINS &amp; EXPRESS CORS</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold">
                    CORS AUTO-ALLOWLISTED
                  </span>
                </div>
                <p className="text-[11px] text-[#7a8b99] leading-relaxed">
                  Express CORS automatically allows requests from your root domain, <code>www</code>, and <code>app</code> subdomain. To enable Google Sign-In on your custom domain without <code>auth/unauthorized-domain</code> errors, add these three hostnames in{' '}
                  <strong>Firebase Console → Project gen-lang-client-0212017392 → Authentication → Settings → Authorized domains</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeHosts.authorizedDomains.map((host) => (
                    <div
                      key={host}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36]"
                    >
                      <span className="text-[11px] text-[#22d3a5] font-bold truncate">{host}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(host, `fb-${host}`)}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-white cursor-pointer shrink-0"
                      >
                        {copiedKey === `fb-${host}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>

                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0212017392/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#38bdf8] hover:underline"
                >
                  <span>Open Firebase Auth Authorized Domains Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Paystack & SEO Canonical Sync */}
              <div className="p-4 bg-[#111a22] border border-[#1e2b36] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[#fbbf24] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PAYSTACK CALLBACKS, SITEMAP &amp; CANONICAL TAGS</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                    <div>
                      <div className="text-[#7a8b99] text-[10px]">Paystack Callback &amp; Webhook Target</div>
                      <div className="text-white font-mono break-all">
                        {preferredCustomOrigin}/api/paystack/webhook
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${preferredCustomOrigin}/api/paystack/webhook`, 'ps-webhook')}
                      className="px-2.5 py-1 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-white text-[10px] cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      {copiedKey === 'ps-webhook' ? 'Copied' : 'Copy Webhook URL'}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                    <div>
                      <div className="text-[#7a8b99] text-[10px]">Live Sitemap &amp; Canonical Root</div>
                      <div className="text-[#22d3a5] font-mono break-all">
                        {preferredCustomOrigin}/sitemap.xml
                      </div>
                    </div>
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-white text-[10px] inline-flex items-center gap-1 shrink-0 self-start sm:self-center"
                    >
                      <span>Inspect Sitemap</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Android TWA Digital Asset Links & SHA-256 Fingerprints */}
              <div className="p-4 bg-[#111a22] border border-[#a78bfa]/40 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#a78bfa] font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>ANDROID TWA ASSETLINKS &amp; SHA-256 FINGERPRINTS</span>
                  </div>
                  <a
                    href="/api/playstore/bundle"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-[10px] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD SYNCED ANDROID BUNDLE (.ZIP)</span>
                  </a>
                </div>

                <p className="text-[11px] text-[#7a8b99]">
                  The server serves <code className="text-[#22d3a5]">/.well-known/assetlinks.json</code> for{' '}
                  <code>com.talentradar.app</code> on both apex and subdomain hosts. Add your Play Console App Signing SHA-256 fingerprint below so TWA deep links launch inside the Android app instead of Chrome:
                </p>

                <div className="space-y-2">
                  {sha256Fingerprints.map((fp) => (
                    <div
                      key={fp}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-[#0a0f14] border border-[#1e2b36] text-[10px]"
                    >
                      <span className="text-[#22d3a5] break-all font-mono">{fp}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(fp, `fp-${fp}`)}
                          className="px-2 py-0.5 rounded bg-[#1e2b36] text-white cursor-pointer"
                        >
                          {copiedKey === `fp-${fp}` ? 'Copied' : 'Copy'}
                        </button>
                        {sha256Fingerprints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFingerprint(fp)}
                            className="p-1 rounded bg-[#1e2b36] hover:bg-red-500/20 text-[#7a8b99] hover:text-red-300 cursor-pointer"
                            title="Remove fingerprint"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newFingerprintInput}
                    onChange={(e) => setNewFingerprintInput(e.target.value)}
                    placeholder="Paste SHA-256 fingerprint (AA:BB:CC:...)"
                    className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#a78bfa] rounded-lg px-3 py-2 text-[11px] text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFingerprint}
                    className="px-3.5 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#9370f7] text-black font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD &amp; SYNC SHA-256</span>
                  </button>
                </div>

                {fingerprintError && (
                  <div className="text-[11px] text-red-400">{fingerprintError}</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BROADCAST / SHARE */}
          {activeSubTab === 'share' && (
            <div className="space-y-4">
              <p className="text-xs text-[#7a8b99]">
                Share <strong>{activeBaseUrl}</strong> across social platforms with clean vanity URLs:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Explore TALENT_RADAR.OS: 3D Geospatial Career Intel, salary trajectory forecasts, and anonymous stealth networking — ${activeBaseUrl}/radar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#111a22] border border-[#1e2b36] hover:border-sky-500 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-sky-400">𝕏</span>
                    <span className="font-semibold text-white group-hover:text-sky-400">Post to X (Twitter)</span>
                  </div>
                  <Share2 className="w-4 h-4 text-[#7a8b99] group-hover:text-sky-400" />
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${activeBaseUrl}/salary-analytics`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#111a22] border border-[#1e2b36] hover:border-blue-500 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-blue-400">in</span>
                    <span className="font-semibold text-white group-hover:text-blue-400">Share to LinkedIn</span>
                  </div>
                  <Share2 className="w-4 h-4 text-[#7a8b99] group-hover:text-blue-400" />
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Explore high-yield tech careers & live salary trajectories on TalentRadar.OS: ${activeBaseUrl}/radar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#111a22] border border-[#1e2b36] hover:border-emerald-500 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-emerald-400">💬</span>
                    <span className="font-semibold text-white group-hover:text-emerald-400">Send on WhatsApp</span>
                  </div>
                  <Share2 className="w-4 h-4 text-[#7a8b99] group-hover:text-emerald-400" />
                </a>

                <a
                  href={`https://reddit.com/submit?url=${encodeURIComponent(`${activeBaseUrl}/salary-analytics`)}&title=${encodeURIComponent(
                    'TALENT_RADAR.OS — 3D Geospatial Career Intel & Salary Trajectories'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#111a22] border border-[#1e2b36] hover:border-orange-500 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-orange-400">🤖</span>
                    <span className="font-semibold text-white group-hover:text-orange-400">Share to Reddit</span>
                  </div>
                  <Share2 className="w-4 h-4 text-[#7a8b99] group-hover:text-orange-400" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-[#111a22] border-t border-[#1e2b36] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7a8b99]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22d3a5]" />
            <span>Active Origin Target: <strong>{CANONICAL_CLOUD_RUN_HOST}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold transition active:scale-95 cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
