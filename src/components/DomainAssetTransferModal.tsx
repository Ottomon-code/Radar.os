import React, { useState } from 'react';
import {
  X,
  Globe,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Download,
  FolderGit2,
  Smartphone,
  Server,
  FileText,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface DomainAssetTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName?: string;
  buyerOrg?: string;
  transactionId?: string;
}

export default function DomainAssetTransferModal({
  isOpen,
  onClose,
  buyerName = 'Designated Institutional Acquirer',
  buyerOrg = 'Institutional Escrow Transferee',
  transactionId = 'ESC-2026-8812-VAL',
}: DomainAssetTransferModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [activeTransferTab, setActiveTransferTab] = useState<'domain' | 'github' | 'playstore' | 'cloud' | 'manifest'>('domain');
  const [escrowChecklist, setEscrowChecklist] = useState<Record<string, boolean>>({
    domain_unlocked: true,
    epp_shared: true,
    github_invited: true,
    playstore_initiated: true,
    cloud_invited: false,
    escrow_inspection_accepted: false,
  });

  if (!isOpen) return null;

  const credentials = {
    domain: {
      name: 'talentradar.io',
      registrar: 'Cloudflare Registrar LLC',
      status: 'Transfer Lock Lifted (CLIENT_TRANSFER_ALLOWED)',
      eppCode: 'EPP#TLNT-9982-CLDF-VNC9',
      zoneId: '8f93e1b74c204d98a0c5678291f3a201',
      primaryNameservers: ['ada.ns.cloudflare.com', 'lex.ns.cloudflare.com'],
      dnssec: 'Enabled (Algorithm 13 - ECDSAP256SHA256)',
      adminEmail: 'mortyp1125@gmail.com',
      expiryDate: '2028-11-20T00:00:00Z',
    },
    github: {
      repository: 'github.com/talentradar/talentradar-platform',
      transferToken: 'ghp_tLntRdr9982AuthKeyM0rtyP1125Escrow',
      deployKeyFingerprint: 'SHA256:7bX9fKm402pQ91Lw4ZtR6aXp80Kq42m1vV9zN',
      buyerInviteHandle: 'acquirer-ops',
      buyerEmail: 'acquisitions@acquirer-fund.com',
      branchProtection: 'Main branch rules & CI/CD workflow secrets',
    },
    playStore: {
      packageName: 'com.talentradar.app',
      targetDeveloperAccountId: '1893049281928401 (Acquirer Developer Account)',
      digitalAssetLinksUrl: 'https://talentradar.io/.well-known/assetlinks.json',
      sha256Fingerprint: '14:6D:E9:7D:C5:3F:8A:2B:9C:0E:5D:8A:1B:3C:7E:9F:4A:2B:6C:8D:0E:1F:3A:5B:7C:9D:1E:3F:5A:7B',
      keystoreAlias: 'talentradar_release',
      keystorePassword: 'KSTR#TalentRadar9982ReleaseSecret!',
      twaVersionCode: '10402',
    },
    cloud: {
      projectId: 'gen-lang-client-0212017392',
      firestoreDatabaseId: 'ai-studio-careerradar-17b9a6d1-7662-4373-863e-133fa0cc2517',
      cloudRunUrl: 'https://talentradar.io',
      customDomainSsl: 'Google-Managed SSL Certificate (Active)',
      iamRoleHandoff: 'roles/owner to buyer service account / group',
    },
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChecklist = (itemKey: string) => {
    setEscrowChecklist((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const handleDownloadManifest = () => {
    const manifestData = {
      manifestHeader: 'TALENT RADAR PLATFORM // DOMAIN & ASSET CREDENTIALS TRANSFER DOCKET',
      generatedTimestamp: new Date().toISOString(),
      escrowDocketNumber: transactionId,
      designatedBuyer: {
        name: buyerName,
        organization: buyerOrg,
      },
      sellerBeneficiary: {
        legalName: localStorage.getItem('seller_payout_name') || 'Lead Platform Engineer / Founder',
        settlementBank: localStorage.getItem('seller_bank_name') || 'JPMorgan Chase / SVB',
        routingABA: localStorage.getItem('seller_routing') || '021000021',
        notificationEmail: localStorage.getItem('seller_payout_email') || 'mortyp1125@gmail.com',
      },
      credentialsVault: credentials,
      inspectionPeriodHours: 48,
      legalStatus: 'BINDING ASSET HANDOVER UNDER DELAWARE COMMERCIAL CODE & ESCROW.COM AGREEMENT',
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalentRadar-AssetTransfer-Manifest-${transactionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c131a] border border-[#1e2b36] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#dce7f0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b36] bg-[#111a22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/15 border border-[#22d3a5]/40 flex items-center justify-center text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.2)]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#dce7f0]">
                  DOMAIN &amp; ASSET CREDENTIALS TRANSFER VAULT
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
                  ESCROW.COM BINDING
                </span>
              </div>
              <p className="text-xs text-[#7a8b99]">
                Canonical Domain (talentradar.io), GitHub Repos, Android Play Store, and GCP Cloud Handover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#1e2b36] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Bar */}
        <div className="px-6 py-2.5 bg-[#080d12] border-b border-[#1e2b36] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7a8b99]">
          <div className="flex items-center gap-4">
            <span>Escrow Transaction: <strong className="text-[#22d3a5]">{transactionId}</strong></span>
            <span className="text-[#1e2b36]">|</span>
            <span>Designated Buyer: <strong className="text-[#dce7f0]">{buyerOrg}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadManifest}
              className="px-2.5 py-1 rounded bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/40 text-[#22d3a5] font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT MANIFEST (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#1e2b36] bg-[#0f171e] px-6 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTransferTab('domain')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTransferTab === 'domain'
                ? 'border-[#22d3a5] text-[#22d3a5] bg-[#22d3a5]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Domain EPP &amp; DNS</span>
          </button>
          <button
            onClick={() => setActiveTransferTab('github')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTransferTab === 'github'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>2. GitHub Repository</span>
          </button>
          <button
            onClick={() => setActiveTransferTab('playstore')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTransferTab === 'playstore'
                ? 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>3. Google Play Store Console</span>
          </button>
          <button
            onClick={() => setActiveTransferTab('cloud')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTransferTab === 'cloud'
                ? 'border-[#a78bfa] text-[#a78bfa] bg-[#a78bfa]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>4. GCP &amp; Firebase</span>
          </button>
          <button
            onClick={() => setActiveTransferTab('manifest')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTransferTab === 'manifest'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>5. Escrow 48h Inspection</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: DOMAIN TRANSFER */}
          {activeTransferTab === 'domain' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111a22] border border-[#22d3a5]/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#22d3a5]" />
                    <span className="text-sm font-bold text-[#dce7f0]">
                      Primary Domain: talentradar.io
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40">
                    TRANSFER UNLOCKED
                  </span>
                </div>
                <p className="text-[#7a8b99] text-xs font-sans">
                  The domain is hosted on Cloudflare Registrar. Transfer locks have been lifted and Whois privacy protection is temporarily cleared for buyer registrar acceptance.
                </p>
              </div>

              {/* Domain Credential Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Authorization / EPP Code */}
                <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between text-[#7a8b99]">
                    <span className="text-[10px] uppercase font-bold text-[#fbbf24] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      EPP AUTHORIZATION CODE (TRANSFER SECRET)
                    </span>
                    <button
                      onClick={() => toggleReveal('epp')}
                      className="text-[#38bdf8] hover:text-[#7dd3fc] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {revealedKeys['epp'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{revealedKeys['epp'] ? 'Mask Secret' : 'Reveal Secret'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#111a22] px-3 py-2 rounded border border-[#1e2b36]">
                    <span className="text-xs font-bold text-[#22d3a5] tracking-wider">
                      {revealedKeys['epp'] ? credentials.domain.eppCode : '••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => handleCopy('epp', credentials.domain.eppCode)}
                      className="px-2 py-1 rounded bg-[#1e2b36] hover:bg-[#22d3a5]/20 hover:text-[#22d3a5] text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === 'epp' ? <Check className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'epp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#7a8b99] mt-1">
                    Provide this code to your receiving registrar (e.g. Namecheap, GoDaddy, Cloudflare, Google Domains) to execute immediate inbound domain transfer.
                  </p>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Current Registrar</span>
                  <div className="font-bold text-[#dce7f0]">{credentials.domain.registrar}</div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Transfer Status</span>
                  <div className="font-bold text-emerald-400">{credentials.domain.status}</div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Cloudflare Zone ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#38bdf8] text-[11px]">{credentials.domain.zoneId}</span>
                    <button
                      onClick={() => handleCopy('zoneId', credentials.domain.zoneId)}
                      className="p-1 rounded text-[#7a8b99] hover:text-[#dce7f0]"
                    >
                      {copiedKey === 'zoneId' ? <Check className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">DNSSEC Status</span>
                  <div className="font-bold text-[#22d3a5] text-[11px]">{credentials.domain.dnssec}</div>
                </div>
              </div>

              {/* Cloudflare Zone Transfer Procedure */}
              <div className="p-4 bg-[#080d12] border border-[#1e2b36] rounded-lg space-y-2">
                <span className="font-bold text-[#dce7f0] block text-xs">
                  DIRECT CLOUDFLARE ACCOUNT-TO-ACCOUNT PUSH INSTRUCTIONS:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[#7a8b99] text-[11px] font-sans">
                  <li>Seller triggers Cloudflare Registrar internal transfer to buyer account email: <strong className="text-[#38bdf8]">harrison.vance@aetheriscapital.com</strong>.</li>
                  <li>Buyer signs in to Cloudflare dashboard and accepts the pending domain transfer.</li>
                  <li>DNS Zone records (including Root CNAME, DKIM, DMARC, and Google Play AssetLinks) automatically preserve uninterrupted uptime during handover.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB REPO */}
          {activeTransferTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111a22] border border-[#38bdf8]/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-[#38bdf8]" />
                    <span className="text-sm font-bold text-[#dce7f0]">
                      Repository: {credentials.github.repository}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40">
                    OWNERSHIP TRANSFER READY
                  </span>
                </div>
                <p className="text-[#7a8b99] text-xs font-sans">
                  Contains 100% of the production TypeScript, React SPA, Three.js 3D geospatial radar, AI Supervior agents, Recharts analytics, and Firebase rule definitions.
                </p>
              </div>

              {/* GitHub Transfer Credentials */}
              <div className="space-y-3">
                <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[#7a8b99]">
                    <span className="text-[10px] uppercase font-bold text-[#38bdf8]">
                      ORGANIZATION HANDOVER PAT TOKEN (DEPLOY TOKEN)
                    </span>
                    <button
                      onClick={() => toggleReveal('ghToken')}
                      className="text-[#38bdf8] hover:text-[#7dd3fc] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {revealedKeys['ghToken'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{revealedKeys['ghToken'] ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#111a22] px-3 py-2 rounded border border-[#1e2b36]">
                    <span className="text-xs font-bold text-[#38bdf8] tracking-wider">
                      {revealedKeys['ghToken'] ? credentials.github.transferToken : '••••••••••••••••••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => handleCopy('ghToken', credentials.github.transferToken)}
                      className="px-2 py-1 rounded bg-[#1e2b36] hover:bg-[#38bdf8]/20 hover:text-[#38bdf8] text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === 'ghToken' ? <Check className="w-3 h-3 text-[#38bdf8]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ghToken' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#7a8b99] uppercase block">Buyer GitHub Handle</span>
                    <div className="font-bold text-[#dce7f0]">{credentials.github.buyerInviteHandle}</div>
                  </div>

                  <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#7a8b99] uppercase block">Deploy Key Fingerprint</span>
                    <div className="font-bold text-[#22d3a5] text-[10px] truncate">{credentials.github.deployKeyFingerprint}</div>
                  </div>
                </div>

                {/* Git Clone Verification */}
                <div className="p-3.5 bg-[#080d12] border border-[#1e2b36] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#7a8b99] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#22d3a5]" />
                      SSH CLONE COMMAND FOR BUYER ENGINEERING TEAM
                    </span>
                    <button
                      onClick={() => handleCopy('cloneCmd', 'git clone git@github.com:talentradar/talentradar-platform.git')}
                      className="text-[10px] text-[#22d3a5] hover:underline"
                    >
                      {copiedKey === 'cloneCmd' ? 'Copied' : 'Copy Command'}
                    </button>
                  </div>
                  <div className="p-2 bg-black/60 rounded border border-[#1e2b36] text-[11px] text-[#22d3a5]">
                    git clone git@github.com:talentradar/talentradar-platform.git
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLAY STORE */}
          {activeTransferTab === 'playstore' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111a22] border border-[#fbbf24]/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#fbbf24]" />
                    <span className="text-sm font-bold text-[#dce7f0]">
                      Google Play Console Transfer: {credentials.playStore.packageName}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40">
                    CONSOLE TRANSFER READY
                  </span>
                </div>
                <p className="text-[#7a8b99] text-xs font-sans">
                  Official Android application package bundle (.aab) registered with Verified Digital Asset Links for seamless, full-screen PWA/TWA app store distribution.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[#7a8b99]">
                    <span className="text-[10px] uppercase font-bold text-[#fbbf24]">
                      ANDROID RELEASE KEYSTORE PASSWORD &amp; KEY ALIAS
                    </span>
                    <button
                      onClick={() => toggleReveal('kstr')}
                      className="text-[#fbbf24] hover:text-[#fde047] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {revealedKeys['kstr'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{revealedKeys['kstr'] ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#111a22] px-3 py-2 rounded border border-[#1e2b36]">
                    <span className="text-xs font-bold text-[#fbbf24] tracking-wider">
                      {revealedKeys['kstr'] ? credentials.playStore.keystorePassword : '••••••••••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => handleCopy('kstr', credentials.playStore.keystorePassword)}
                      className="px-2 py-1 rounded bg-[#1e2b36] hover:bg-[#fbbf24]/20 hover:text-[#fbbf24] text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === 'kstr' ? <Check className="w-3 h-3 text-[#fbbf24]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'kstr' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#7a8b99] uppercase block">Target Developer Account</span>
                    <div className="font-bold text-[#dce7f0] text-[11px]">{credentials.playStore.targetDeveloperAccountId}</div>
                  </div>

                  <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#7a8b99] uppercase block">Verified AssetLinks Endpoint</span>
                    <a
                      href="/.well-known/assetlinks.json"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#22d3a5] text-[11px] flex items-center gap-1 hover:underline"
                    >
                      <span>/.well-known/assetlinks.json</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#7a8b99] uppercase block">SHA-256 App Certificate Fingerprint</span>
                    <button
                      onClick={() => handleCopy('sha256', credentials.playStore.sha256Fingerprint)}
                      className="text-[10px] text-[#22d3a5] hover:underline"
                    >
                      {copiedKey === 'sha256' ? 'Copied' : 'Copy Fingerprint'}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-[#7a8b99] break-all bg-black/40 p-1.5 rounded border border-[#1e2b36]">
                    {credentials.playStore.sha256Fingerprint}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GCP & CLOUD */}
          {activeTransferTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111a22] border border-[#a78bfa]/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#a78bfa]" />
                    <span className="text-sm font-bold text-[#dce7f0]">
                      Google Cloud &amp; Firestore Production Handover
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] font-bold border border-[#a78bfa]/40">
                    IAM ROLES/OWNER PENDING
                  </span>
                </div>
                <p className="text-[#7a8b99] text-xs font-sans">
                  The application is deployed on Google Cloud Run with an active Firestore database for user auth and telemetry persistence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Google Cloud Project ID</span>
                  <div className="font-bold text-[#22d3a5]">{credentials.cloud.projectId}</div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Firestore Database ID</span>
                  <div className="font-bold text-[#38bdf8] text-[10px] truncate">{credentials.cloud.firestoreDatabaseId}</div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">Cloud Run Custom Domain</span>
                  <div className="font-bold text-[#dce7f0]">{credentials.cloud.cloudRunUrl}</div>
                </div>

                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1">
                  <span className="text-[10px] text-[#7a8b99] uppercase block">SSL Certificate Authority</span>
                  <div className="font-bold text-emerald-400 text-[11px]">{credentials.cloud.customDomainSsl}</div>
                </div>
              </div>

              <div className="p-4 bg-[#080d12] border border-[#1e2b36] rounded-lg space-y-2">
                <span className="font-bold text-[#dce7f0] block text-xs">
                  GCP PROJECT OWNERSHIP TRANSFER PROCEDURE:
                </span>
                <p className="text-[11px] text-[#7a8b99] font-sans">
                  Seller navigates to IAM &amp; Admin in Google Cloud Console, adds the buyer&apos;s Google Workspace account as <code>roles/resourcemanager.organizationAdmin</code> and <code>roles/owner</code>, then removes seller credentials after verification.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: ESCROW 48H INSPECTION */}
          {activeTransferTab === 'manifest' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111a22] border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-[#dce7f0]">
                      48-Hour Escrow.com Inspection Period &amp; Release Protocol
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                    ESCROW MILESTONE TRACKER
                  </span>
                </div>
                <p className="text-[#7a8b99] text-xs font-sans">
                  Both parties track completion of each handover step. Once buyer confirms all 6 inspection milestones, Escrow.com wires the full $145,000 buyout funds directly to the seller&apos;s bank.
                </p>
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-2">
                {[
                  {
                    key: 'domain_unlocked',
                    title: '1. Domain talentradar.io unlocked & registrar auth code provided',
                    desc: 'EPP Code verified valid by Cloudflare Registrar.',
                  },
                  {
                    key: 'epp_shared',
                    title: '2. Cloudflare Zone & DNSSEC transferred to buyer account',
                    desc: 'Nameservers and DNS records intact without routing downtime.',
                  },
                  {
                    key: 'github_invited',
                    title: '3. GitHub organization admin & repository ownership transferred',
                    desc: 'Buyer engineering invited with Owner clearance.',
                  },
                  {
                    key: 'playstore_initiated',
                    title: '4. Android Play Console app transfer request submitted',
                    desc: 'com.talentradar.app linked to Acquirer developer account.',
                  },
                  {
                    key: 'cloud_invited',
                    title: '5. Google Cloud Run & Firestore IAM roles/owner granted',
                    desc: 'Production database schemas and API quotas transferred.',
                  },
                  {
                    key: 'escrow_inspection_accepted',
                    title: '6. Escrow.com digital inspection approval executed',
                    desc: 'Buyer clicks "Accept Assets" on Escrow.com -> Wire released.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => toggleChecklist(item.key)}
                    className={`p-3 rounded-lg border flex items-start gap-3 transition cursor-pointer select-none ${
                      escrowChecklist[item.key]
                        ? 'bg-[#111a22] border-emerald-500/40'
                        : 'bg-[#0a0f14] border-[#1e2b36] hover:border-gray-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {escrowChecklist[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${escrowChecklist[item.key] ? 'text-[#dce7f0]' : 'text-gray-400'}`}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#7a8b99] font-sans mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      {escrowChecklist[item.key] ? (
                        <span className="text-emerald-400 bg-emerald-500/10">COMPLETED</span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10">PENDING</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1e2b36] bg-[#0c131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#7a8b99]">
            <Lock className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>End-to-End Escrow Protection • 48-Hour Statutory Inspection Window</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadManifest}
              className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(34,211,165,0.25)]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD TRANSFER MANIFEST (.JSON)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1e2b36] hover:bg-[#2b3e50] text-[#dce7f0] font-bold text-xs transition cursor-pointer"
            >
              CLOSE VAULT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
