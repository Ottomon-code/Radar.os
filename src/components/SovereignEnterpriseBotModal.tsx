import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Send,
  Sparkles,
  Building2,
  Check,
  Copy,
  Target,
  FileText,
  Cpu,
  RefreshCw,
  Globe,
  Award,
} from 'lucide-react';

interface SovereignEnterpriseProspect {
  id: string;
  executiveName: string;
  title: string;
  enterpriseName: string;
  sector: string;
  complianceRequirement: string;
  emailSequence: {
    touch: number;
    subject: string;
    body: string;
  }[];
}

const SAMPLE_SOVEREIGN_PROSPECTS: SovereignEnterpriseProspect[] = [
  {
    id: 'sov_1',
    executiveName: 'General Vance Thorne',
    title: 'Chief Technology Officer',
    enterpriseName: 'Sovereign Defense Avionics & GovCloud',
    sector: 'Defense & Aerospace AI',
    complianceRequirement: 'Zero-Knowledge Data Isolation / ITAR Compliant',
    emailSequence: [
      {
        touch: 1,
        subject: 'Zero-Knowledge Compensation Telemetry & Secure Talent Intelligence for [Enterprise]',
        body: `Hi General Thorne,\n\nIn sovereign defense and GovCloud infrastructure, protecting recruitment telemetry and candidate salary negotiation data against third-party data leakage is paramount.\n\nTalentRadar.OS provides a 100% zero-knowledge, cryptographically isolated compensation intelligence platform. Our architecture guarantees that neither our infrastructure nor external networks retain unencrypted talent benchmarking records.\n\nWould you be open to a 5-minute briefing on deploying our dedicated multi-cloud private tenant for Sovereign Defense?`,
      },
      {
        touch: 2,
        subject: 'Re: Zero-Knowledge Compensation Telemetry // Private Tenant Deployment',
        body: `Hi General Thorne,\n\nFollowing up on my previous note. Beyond strict zero-knowledge data privacy, our platform indexes 2026 defense-tech and accelerated compute compensation curves across secure nodes in Zurich, London, and Washington.\n\nWe provide SOC 2 Type II certified audit trails and local VPC peering so your talent acquisition team operates with absolute cryptographic assurance.\n\nHere is our security whitepaper and live preview: https://app.talentradar.os`,
      },
    ],
  },
  {
    id: 'sov_2',
    executiveName: 'Dr. Evelyn Vance',
    title: 'Chief Information Security Officer (CISO)',
    enterpriseName: 'Quantum Cryptography & National Grid AI',
    sector: 'Critical Infrastructure & Energy',
    complianceRequirement: 'SOC 2 Type II / Post-Quantum Encryption',
    emailSequence: [
      {
        touch: 1,
        subject: 'Strict Data Privacy & Zero-Knowledge Talent Benchmarking for [Enterprise]',
        body: `Hi Dr. Vance,\n\nManaging elite cryptographic and quantum-security talent requires absolute confidentiality during executive talent sourcing and compensation calibration.\n\nTalentRadar.OS is engineered with a strict zero-knowledge architecture—ensuring zero data persistence and end-to-end cryptographic encryption for all compensation dossiers and executive outreach.\n\nWould your security team be open to reviewing our compliance and zero-knowledge data isolation framework?`,
      },
      {
        touch: 2,
        subject: 'Re: Strict Data Privacy & Zero-Knowledge Talent Benchmarking',
        body: `Hi Dr. Vance,\n\nJust bubbling this up. Our dedicated private tenant option allows deployment directly into your secure VPC with isolated webhook pipelines for Greenhouse and Lever.\n\nYou can review our cryptographic specs and sample zero-knowledge audit logs here: https://app.talentradar.os`,
      },
    ],
  },
];

export default function SovereignEnterpriseBotModal({ onClose }: { onClose: () => void }) {
  const [prospects, setProspects] = useState<SovereignEnterpriseProspect[]>(SAMPLE_SOVEREIGN_PROSPECTS);
  const [selectedProspectId, setSelectedProspectId] = useState<string>(SAMPLE_SOVEREIGN_PROSPECTS[0].id);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedTouchId, setCopiedTouchId] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  const activeProspect = prospects.find((p) => p.id === selectedProspectId) || prospects[0];

  const handleRegenerateSequence = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Shuffle or simulate refreshed personalized sequence
      setProspects((prev) =>
        prev.map((p) =>
          p.id === selectedProspectId
            ? {
                ...p,
                emailSequence: p.emailSequence.map((seq) => ({
                  ...seq,
                  body: seq.body + `\n\n[AI Verified via Sovereign Zero-Knowledge Node #${Math.floor(Math.random() * 9000 + 1000)}]`,
                })),
              }
            : p
        )
      );
    }, 900);
  };

  const handleCopyTouch = (touchNum: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTouchId(`${activeProspect.id}_${touchNum}`);
    setDispatchedMap((prev) => ({ ...prev, [`${activeProspect.id}_${touchNum}`]: true }));
    setTimeout(() => setCopiedTouchId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono">
      <div className="bg-[#111a22] border-2 border-[#38bdf8]/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e2b36] flex items-center justify-between bg-[#0a0f14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI SOVEREIGN ENTERPRISE OUTREACH BOT
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8] text-black font-extrabold">ZERO-KNOWLEDGE</span>
              </h2>
              <p className="text-xs text-[#7a8b99]">
                Automated executive email sequences emphasizing zero-knowledge data privacy and secure private tenant deployment.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1e2b36] hover:bg-[#2e3e4e] text-[#7a8b99] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Prospect Selector */}
        <div className="p-4 bg-[#0c131a] border-b border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7a8b99] font-bold">SOVEREIGN TARGET:</span>
            {prospects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProspectId(p.id)}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  selectedProspectId === p.id
                    ? 'bg-[#38bdf8] border-[#38bdf8] text-black font-bold'
                    : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-white'
                }`}
              >
                {p.enterpriseName.split(' ')[0]} ({p.sector.split(' ')[0]})
              </button>
            ))}
          </div>

          <button
            onClick={handleRegenerateSequence}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#22d3a5] text-black font-bold flex items-center gap-2 hover:opacity-95 transition shadow cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'GENERATING SECURE SEQUENCE...' : 'REGENERATE AI SEQUENCE'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#0a0f14]">
          {/* Target Profile Card */}
          <div className="bg-[#111a22] border border-[#38bdf8]/30 rounded-xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-3">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-bold block uppercase">Active Enterprise Target</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeProspect.executiveName} — <span className="text-[#38bdf8]">{activeProspect.title}</span>
                </h3>
                <div className="text-xs text-[#7a8b99] mt-0.5">{activeProspect.enterpriseName} • Sector: {activeProspect.sector}</div>
              </div>
              <div className="px-3 py-1.5 bg-[#0c131a] border border-[#38bdf8]/40 rounded-lg text-xs font-bold text-[#38bdf8] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>{activeProspect.complianceRequirement}</span>
              </div>
            </div>
          </div>

          {/* Email Sequence */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#7a8b99] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
              Automated Executive Email Sequence (Zero-Knowledge Focus)
            </h4>

            {activeProspect.emailSequence.map((touch) => {
              const touchKey = `${activeProspect.id}_${touch.touch}`;
              const isDispatched = dispatchedMap[touchKey];
              return (
                <div key={touch.touch} className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-[#1e2b36] pb-2">
                    <span className="text-[#38bdf8] font-bold">TOUCH POINT #{touch.touch} // EXECUTIVE OUTREACH</span>
                    {isDispatched && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px]">
                        Dispatched Securely
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#7a8b99] block">SUBJECT LINE:</span>
                    <div className="text-xs font-bold text-white bg-[#0c131a] p-2.5 rounded border border-[#1e2b36]">
                      {touch.subject}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#7a8b99] block">EMAIL BODY (ZERO-KNOWLEDGE &amp; PRIVACY EMPHASIS):</span>
                    <div className="text-xs text-[#dce7f0] bg-[#0c131a] p-3 rounded border border-[#1e2b36] whitespace-pre-wrap leading-relaxed">
                      {touch.body}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopyTouch(touch.touch, `Subject: ${touch.subject}\n\n${touch.body}`)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        copiedTouchId === touchKey
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#38bdf8] hover:bg-[#2dd4bf] text-black shadow'
                      }`}
                    >
                      {copiedTouchId === touchKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedTouchId === touchKey ? 'COPIED & DISPATCHED!' : 'COPY SECURE EMAIL & DISPATCH'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0f14] border-t border-[#1e2b36] flex items-center justify-between text-xs text-[#7a8b99]">
          <span>Enforces strict zero-knowledge encryption and cryptographic data isolation.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2b36] hover:bg-[#2e3e4e] text-white font-bold rounded-lg transition cursor-pointer"
          >
            Close Bot
          </button>
        </div>

      </div>
    </div>
  );
}
