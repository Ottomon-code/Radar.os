import React from 'react';
import {
  Compass,
  TrendingUp,
  Radio,
  Briefcase,
  ShieldCheck,
  Scale,
  Lock,
  Mail,
  Smartphone,
  Globe,
  QrCode,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { getPublicShareBaseUrl } from '../utils/serverConfig';
import { LegalTabType } from './LegalComplianceModal';
import { useSubscription } from '../context/SubscriptionContext';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
  onOpenLegal: (tab?: LegalTabType) => void;
  onOpenContact: () => void;
  onOpenAgencyPilot: () => void;
  onOpenUrlModal: () => void;
  onOpenReferrals?: () => void;
  onOpenDrive?: () => void;
}

export default function Footer({
  onNavigateTab,
  onOpenLegal,
  onOpenContact,
  onOpenAgencyPilot,
  onOpenUrlModal,
  onOpenReferrals,
  onOpenDrive,
}: FooterProps) {
  const { isOwner } = useSubscription();
  return (
    <footer className="mt-16 border-t border-[#1e2b36] bg-[#080d12] text-[#7a8b99] font-mono text-xs select-none">
      {/* Top Banner: Infrastructure Telemetry Status */}
      <div className="border-b border-[#141e28] px-4 sm:px-8 py-3 bg-[#0a0f16]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-[#dce7f0]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3a5] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3a5]" />
            </span>
            <span className="font-bold tracking-wide">SYSTEM STATUS: ALL ENGINES OPERATIONAL</span>
            <span className="text-[#3e5060]">|</span>
            <span className="text-[#38bdf8]">Google Cloud Run europe-west2 • Paystack Billing Active</span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-[#22d3a5]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS 1.3 Managed SSL</span>
            </span>
            <span className="text-[#3e5060]">•</span>
            <span className="text-[#a78bfa]">Zero-Knowledge AES-256</span>
            <span className="text-[#3e5060]">•</span>
            <span className="text-[#fbbf24]">PWA Offline Standalone Ready</span>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Col 1: Platform Brand & Mission */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wider">
            <div className="p-1.5 rounded-lg bg-[#22d3a5]/20 border border-[#22d3a5]/50 text-[#22d3a5]">
              <Compass className="w-4 h-4" />
            </div>
            <span>TALENTRADAR OS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-semibold">
              v1.0.4
            </span>
          </div>

          <p className="text-xs leading-relaxed text-[#94a3b8] max-w-sm">
            3D Geospatial Career Intelligence, Recharts Salary Trajectory Forecasts, StealthNet Zero-Knowledge Networking, and Board-Ready Executive Compensation Dossiers.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <button
              onClick={onOpenAgencyPilot}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/40 text-[#22d3a5] font-bold transition cursor-pointer"
            >
              Agency Sovereign
            </button>
            {onOpenReferrals && (
              <button
                onClick={onOpenReferrals}
                className="px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/40 text-[#fbbf24] font-bold transition cursor-pointer"
              >
                Refer &amp; Earn 20%
              </button>
            )}
            {onOpenDrive && (
              <button
                onClick={onOpenDrive}
                className="px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/40 text-[#38bdf8] font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive Vault</span>
              </button>
            )}
            <button
              onClick={onOpenContact}
              className="px-3 py-1.5 rounded-lg bg-[#141e28] hover:bg-[#1a2936] border border-[#1e2b36] text-[#dce7f0] transition cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Contact Founder</span>
            </button>
          </div>
        </div>

        {/* Col 2: Core Intelligence Modules */}
        <div className="space-y-2.5">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>Modules</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-[#94a3b8]">
            <li>
              <button
                onClick={() => onNavigateTab('radar')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                3D Geospatial Job Radar
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                Market Salary Trends &amp; Percentiles
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateTab('career')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                Career Milestones &amp; Trajectories
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateTab('news')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                Intel Briefs &amp; Recruiter Signals
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateTab('stealthnet')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                StealthNet Zero-Knowledge Bus
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateTab('ai')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                Triad AI Supervisor (Scout/Envoy)
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Enterprise & Monetization */}
        <div className="space-y-2.5">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>B2B &amp; Finance</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-[#94a3b8]">
            <li>
              <button
                onClick={() => onNavigateTab('finance')}
                className="hover:text-[#38bdf8] transition cursor-pointer"
              >
                Comp, Equity &amp; Tax Engine
              </button>
            </li>
            {onOpenReferrals && (
              <li>
                <button
                  onClick={onOpenReferrals}
                  className="hover:text-[#38bdf8] transition cursor-pointer"
                >
                  20% Referral Partner Program
                </button>
              </li>
            )}
            {isOwner && (
              <>
                <li>
                  <button
                    onClick={() => onNavigateTab('comms')}
                    className="hover:text-[#38bdf8] transition cursor-pointer"
                  >
                    Executive Recruiter Signals
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenUrlModal}
                    className="hover:text-[#38bdf8] transition cursor-pointer flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3 text-[#22d3a5]" />
                    <span>QR Code Matrix &amp; DNS Records</span>
                  </button>
                </li>
                <li>
                  <a
                    href="/.well-known/assetlinks.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#38bdf8] transition flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3 text-[#38bdf8]" />
                    <span>Android Play Store AssetLinks</span>
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Col 4: Legal & Compliance Governance */}
        <div className="space-y-2.5">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Legal Governance</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-[#94a3b8]">
            <li>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-[#22d3a5] transition cursor-pointer"
              >
                Privacy Policy (GDPR / CCPA)
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-[#38bdf8] transition cursor-pointer"
              >
                Terms of Service &amp; Master SLA
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('security')}
                className="hover:text-[#a78bfa] transition cursor-pointer"
              >
                Security &amp; Cryptography Standard
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('refund')}
                className="hover:text-[#fbbf24] transition cursor-pointer"
              >
                Refund &amp; Paystack Billing Policy
              </button>
            </li>
            <li>
              <button
                onClick={onOpenContact}
                className="hover:text-white transition cursor-pointer"
              >
                Enterprise Procurement Desk
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Covenants & Canonical Attribution */}
      <div className="border-t border-[#141e28] px-4 sm:px-8 py-5 bg-[#05080c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748b]">
          <div>
            © 2026 <strong>TalentRadar Technologies &amp; Architecture Group</strong>. All rights reserved. Live App:{' '}
            <a
              href={getPublicShareBaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:underline"
            >
              {getPublicShareBaseUrl().replace(/^https?:\/\//, '')}
            </a>.
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <button onClick={() => onOpenLegal('privacy')} className="hover:text-[#dce7f0] transition cursor-pointer">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onOpenLegal('terms')} className="hover:text-[#dce7f0] transition cursor-pointer">
              Terms
            </button>
            <span>•</span>
            <button onClick={() => onOpenLegal('security')} className="hover:text-[#dce7f0] transition cursor-pointer">
              Security
            </button>
            <span>•</span>
            <button onClick={() => onOpenLegal('refund')} className="hover:text-[#dce7f0] transition cursor-pointer">
              Refunds
            </button>
            <span>•</span>
            <button onClick={onOpenContact} className="hover:text-[#22d3a5] transition cursor-pointer">
              Contact Desk
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
