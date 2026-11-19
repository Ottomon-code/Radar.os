import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Scale,
  RefreshCw,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Database,
  Building2,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import { BRANDED_CUSTOM_DOMAIN, BRANDED_CUSTOM_URL } from '../utils/serverConfig';

export type LegalTabType = 'privacy' | 'terms' | 'security' | 'refund';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
}

export default function LegalComplianceModal({
  isOpen,
  onClose,
  initialTab = 'privacy',
}: LegalComplianceModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [copied, setCopied] = useState(false);

  // Sync tab if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleCopyLegalSummary = () => {
    const summary = `TalentRadar Technologies Compliance Summary (${BRANDED_CUSTOM_DOMAIN})\n• Privacy: Zero-knowledge StealthNet architecture; no employer tracking or public indexing.\n• Security: TLS 1.3 edge termination, AES-256-GCM encrypted message buffers.\n• Terms & Billing: Paystack recurring billing (Card, M-Pesa, Bank) managed via /billing.\n• Compliance Contact: mortyp1125@gmail.com`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 font-mono"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c131a] border border-[#1e2b36] rounded-2xl shadow-2xl flex flex-col text-[#dce7f0] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1e2b36] flex items-center justify-between bg-[#080d12]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22d3a5]/15 border border-[#22d3a5]/30 text-[#22d3a5]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  LEGAL, PRIVACY &amp; SECURITY GOVERNANCE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-semibold">
                  AUDITED 2026
                </span>
              </div>
              <p className="text-[11px] text-[#7a8b99]">
                Enterprise covenants, GDPR/CCPA protections, and StealthNet data isolation standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLegalSummary}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e28] hover:bg-[#1a2936] border border-[#1e2b36] text-[11px] text-[#7a8b99] hover:text-[#dce7f0] transition cursor-pointer"
              title="Copy verified legal covenants summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY SUMMARY'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7a8b99] hover:text-white hover:bg-[#162330] transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1720] border-b border-[#1e2b36] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-[#22d3a5]/20 border border-[#22d3a5] text-[#22d3a5] shadow-[0_0_12px_rgba(34,211,165,0.2)]'
                : 'text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>1. PRIVACY POLICY</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'terms'
                ? 'bg-[#38bdf8]/20 border border-[#38bdf8] text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. TERMS OF SERVICE</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'security'
                ? 'bg-[#a78bfa]/20 border border-[#a78bfa] text-[#a78bfa] shadow-[0_0_12px_rgba(167,139,250,0.2)]'
                : 'text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>3. SECURITY &amp; CRYPTOGRAPHY</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'refund'
                ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                : 'text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>4. REFUND &amp; BILLING POLICY</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#94a3b8] leading-relaxed">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#111a24] border border-[#1e2b36] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#22d3a5] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm">TalentRadar Privacy Policy</h3>
                  <p className="text-[11px] text-[#7a8b99] mt-0.5">
                    Effective Date: November 2026 • Canonical Entity: TalentRadar Technologies &amp; Architecture Group ({BRANDED_CUSTOM_DOMAIN})
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]" />
                  1. Zero-Knowledge Candidate Confidentiality (StealthNet)
                </h4>
                <p>
                  TalentRadar operates on a local-first, zero-knowledge architecture. When tech professionals analyze market compensation or simulate counter-offers, personal compensation trajectories and current employer names are never sold, auctioned, or transmitted to third-party data brokers. Candidate profiles on StealthNet remain fully anonymous until the candidate explicitly authorizes an encrypted introductory sync.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]" />
                  2. Data Collection &amp; Processing Minimization
                </h4>
                <p>
                  We collect only the minimum telemetry required to fulfill your career intelligence requests:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[#cbd5e1]">
                  <li><strong>Account Credentials</strong>: Email address and authentication tokens via Google Firebase Auth.</li>
                  <li><strong>Market Preferences</strong>: Saved target roles, compensation bands, and currency preferences stored locally in your browser session.</li>
                  <li><strong>B2B Inquiries &amp; Receipts</strong>: Corporate billing email and transaction metadata required for Paystack subscription processing and receipt generation.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]" />
                  3. GDPR &amp; CCPA User Rights
                </h4>
                <p>
                  In accordance with the European General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you retain the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[#cbd5e1]">
                  <li>Access and export your complete user profile and saved items via downloadable JSON/CSV.</li>
                  <li>Request permanent deletion of your account records by contacting <strong>mortyp1125@gmail.com</strong>.</li>
                  <li>Opt out of any marketing or job alert telemetry at any time with zero service disruption.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]" />
                  4. Cookies &amp; Local Storage Usage
                </h4>
                <p>
                  We do not deploy invasive third-party ad-tracking cookies. Browser <code className="text-[#22d3a5] bg-[#0a0f14] px-1 rounded">localStorage</code> is utilized strictly to preserve your saved bookmarks, job alerts, and preferred currency indicators between sessions.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#111a24] border border-[#1e2b36] flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm">Terms of Service &amp; Master Subscription Agreement</h3>
                  <p className="text-[11px] text-[#7a8b99] mt-0.5">
                    Governing Jurisdiction: State of Delaware / London Commercial Court • Platform: {BRANDED_CUSTOM_URL}
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  1. License Grant &amp; Permitted Commercial Use
                </h4>
                <p>
                  TalentRadar Technologies grants subscribers a non-exclusive, worldwide, revocable license to access our 3D geospatial career intelligence engine, Recharts salary models, and executive search dossiers. Retained search agencies and corporate recruiters may white-label and export vector PDF compensation dossiers for confidential executive client presentations.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  2. Prohibited Conduct &amp; Platform Safeguards
                </h4>
                <p>
                  Subscribers agree NOT to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[#cbd5e1]">
                  <li>Attempt to de-anonymize StealthNet candidates through external correlation attacks.</li>
                  <li>Exceed rate limits or execute automated scraping loops against proprietary salary trajectory APIs.</li>
                  <li>Resell raw market telemetry without prior written authorization from TalentRadar Technologies.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  3. Disclaimer of Financial Advice
                </h4>
                <p>
                  All compensation projections, equity vesting models, and tax bracket telemetry are provided for market benchmarking and negotiation preparation only. They do not constitute formal legal, tax, or financial investment advice.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  4. Intellectual Property &amp; Brand Covenants
                </h4>
                <p>
                  TalentRadar, the 3D globe visualization shader pipelines, and the Triad multi-agent orchestration algorithms are proprietary intellectual property. All source code rights remain unencumbered unless transferred via executed Asset Purchase Agreement on Escrow.com.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: SECURITY & CRYPTOGRAPHY */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#111a24] border border-[#1e2b36] flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#a78bfa] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm">Security Architecture &amp; Cryptography Standard</h3>
                  <p className="text-[11px] text-[#7a8b99] mt-0.5">
                    Zero-Trust Container Isolation • TLS 1.3 / HSTS • AES-256-GCM Ingress
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Database className="w-4 h-4 text-[#22d3a5]" />
                    <span>Isolated Cloud Run Runtime</span>
                  </div>
                  <p className="text-[11px] text-[#7a8b99]">
                    Each microservice container executes in gVisor sandboxed environments on Google Cloud Platform (europe-west2) with zero root privileges.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Lock className="w-4 h-4 text-[#a78bfa]" />
                    <span>Edge SSL &amp; Anycast Routing</span>
                  </div>
                  <p className="text-[11px] text-[#7a8b99]">
                    Managed TLS 1.3 certificates by Google Trust Services with strict HTTP Strict Transport Security (HSTS) headers enforced globally.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                  Vulnerability Disclosure Program
                </h4>
                <p>
                  We welcome responsible security research. If you discover a potential vulnerability in our APIs or client bundles, please transmit your encrypted findings to <strong>mortyp1125@gmail.com</strong> with reproduction steps. We respond to verified security disclosures within 24 hours.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: REFUND & BILLING POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#111a24] border border-[#1e2b36] flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm">Subscription, Billing &amp; Refund Policy</h3>
                  <p className="text-[11px] text-[#7a8b99] mt-0.5">
                    Paystack Automated Billing (Card • M-Pesa • Bank) • Self-Service Portal (/billing)
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  1. Free Recruit Tier &amp; Referral Credits
                </h4>
                <p>
                  Every visitor receives complimentary access to core compensation benchmarks and initial radar searches under the Recruit tier. Subscribers who invite peers via their verified referral link (<code className="text-[#22d3a5]">/r/YOUR_CODE</code>) grant friends 20% off their first Paystack checkout and earn 30-day Pro Operator credits upon each paid conversion.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  2. Paystack Subscription Cancellation
                </h4>
                <p>
                  Subscribers may disable auto-renewal or update saved cards at any time directly through the Paystack Billing Portal (<code className="text-[#22d3a5]">/billing</code>). Upon cancellation, your clearance remains active until the end of the current paid billing cycle with zero penalty fees.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  3. Refund Eligibility &amp; Dispute Resolution
                </h4>
                <p>
                  If you experience technical disruption or inadvertent renewal charges, contact billing support at <strong>mortyp1125@gmail.com</strong> within 7 business days for prompt review and full refund issuance.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#080d12] border-t border-[#1e2b36] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#7a8b99]">
            <Building2 className="w-4 h-4 text-[#22d3a5]" />
            <span>Direct Inquiries: <a href="mailto:mortyp1125@gmail.com" className="text-[#38bdf8] hover:underline">mortyp1125@gmail.com</a></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(34,211,165,0.25)]"
            >
              ACKNOWLEDGE &amp; CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
