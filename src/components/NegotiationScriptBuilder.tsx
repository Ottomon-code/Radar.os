import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Award,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronRight,
  Bot,
  Zap,
  PhoneCall,
  Sliders,
  Scale,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export type NegotiationTone = 'assertive_executive' | 'collaborative_partner' | 'competing_counter' | 'equity_rebalance' | 'accelerated_rider';

export interface ScriptInputs {
  candidateRole: string;
  targetCompany: string;
  recruiterName: string;
  currentOfferBase: number;
  currentOfferTotal: number;
  counterTargetBase: number;
  counterTargetTotal: number;
  competingCompany: string;
  competingTotalComp: number;
  primaryLeverage: string;
  tone: NegotiationTone;
}

const LEVERAGE_OPTIONS = [
  {
    id: 'cuda_triton_scarcity',
    label: 'Frontier AI & Triton/CUDA Kernel Scarcity',
    desc: 'Specialized low-level compute optimization expertise commanding 90th percentile market premium.',
  },
  {
    id: 'competing_offer_hand',
    label: 'Active Competing Tier-1 Offer in Hand',
    desc: 'Strict decision window from peer lab creates immediate reciprocal closing leverage.',
  },
  {
    id: 'unvested_cliff_forfeiture',
    label: 'Forfeiture of Unvested Equity Cliff',
    desc: 'Walking away from $100k+ in unvested RSUs requires compensatory sign-on buffer.',
  },
  {
    id: 'infra_cost_reduction',
    label: 'Proven Cluster Cost Reduction ($5M - $20M)',
    desc: 'Historical track record of reducing GPU cluster inference and training expenditures.',
  },
  {
    id: 'production_leadership',
    label: 'Architecture Ownership & Team Mentorship',
    desc: 'Staff/Principal level ability to lead cross-functional autonomous systems development.',
  },
];

export default function NegotiationScriptBuilder({
  initialRole = 'Staff AI Infrastructure Architect',
  initialCompany = 'Frontier AI Labs',
  onSendToAIEnvoy,
}: {
  initialRole?: string;
  initialCompany?: string;
  onSendToAIEnvoy?: (script: string) => void;
}) {
  const { formatAmount } = useCurrency();

  const [inputs, setInputs] = useState<ScriptInputs>({
    candidateRole: initialRole,
    targetCompany: initialCompany,
    recruiterName: 'Hiring Team',
    currentOfferBase: 265000,
    currentOfferTotal: 480000,
    counterTargetBase: 295000,
    counterTargetTotal: 550000,
    competingCompany: 'Leading Frontier Lab',
    competingTotalComp: 540000,
    primaryLeverage: 'cuda_triton_scarcity',
    tone: 'assertive_executive',
  });

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Generate Email Script
  const emailDraft = useMemo(() => {
    const baseGap = inputs.counterTargetBase - inputs.currentOfferBase;
    const totalGap = inputs.counterTargetTotal - inputs.currentOfferTotal;

    let toneParagraph = '';
    let subject = '';

    switch (inputs.tone) {
      case 'assertive_executive':
        subject = `Advancing Our Discussion: Compensation Calibration for ${inputs.candidateRole} (${inputs.targetCompany})`;
        toneParagraph = `I have spent significant time reviewing the scope of the ${inputs.candidateRole} mandate and the high-leverage challenges ahead for ${inputs.targetCompany}. I am exceptionally enthusiastic about the mission. However, given my deep expertise in high-performance model infrastructure and direct track record of accelerating GPU cluster throughput, the current total target compensation of ${formatAmount(inputs.currentOfferTotal)} does not fully align with market benchmarks for top-decile contributors in this space.

To establish immediate alignment and allow me to sign without hesitation, I am targeting a base salary of ${formatAmount(inputs.counterTargetBase)} and an annualized total package of ${formatAmount(inputs.counterTargetTotal)}. This structure reflects the specialized, scarce nature of this role and the immediate multi-million dollar architectural upside I will deliver.`;
        break;

      case 'collaborative_partner':
        subject = `Thank You & Next Steps: ${inputs.candidateRole} Offer Calibration`;
        toneParagraph = `I want to express how excited I am by the conversations I have had with the team. ${inputs.targetCompany}'s trajectory is remarkable, and I see a natural, high-impact fit for me as your ${inputs.candidateRole}.

To make this decision straightforward and ensure long-term partnership parity, I would love to explore bridging the delta between the current offer (${formatAmount(inputs.currentOfferTotal)}) and my target annualized package of ${formatAmount(inputs.counterTargetTotal)}. Specifically, adjusting base compensation to ${formatAmount(inputs.counterTargetBase)} (or expanding the upfront equity pool) would bring the package in line with senior industry percentiles and allow me to commit immediately.`;
        break;

      case 'competing_counter':
        subject = `Offer Consideration & Final Calibration: ${inputs.candidateRole} - Decision Timeline`;
        toneParagraph = `Thank you for extending the formal offer for the ${inputs.candidateRole} role at ${inputs.targetCompany}. You and the team have built something truly exceptional, and ${inputs.targetCompany} remains my clear first choice.

In transparency, I am currently evaluating a concurrent offer from ${inputs.competingCompany} with an annualized total compensation package of ${formatAmount(inputs.competingTotalComp)}. Because I strongly prefer your culture and technical roadmap, if ${inputs.targetCompany} is able to calibrate the package to ${formatAmount(inputs.counterTargetTotal)} (targeting ${formatAmount(inputs.counterTargetBase)} base), I am prepared to decline all other opportunities and sign the agreement today.`;
        break;

      case 'equity_rebalance':
        subject = `Offer Structure Discussion: Equity & Sign-on Optimization for ${inputs.candidateRole}`;
        toneParagraph = `I am very enthusiastic about joining ${inputs.targetCompany} and fully appreciate internal base salary constraints. Because I am deeply committed to the long-term equity upside of what we are building, I would be pleased to keep the base salary close to your proposed band if we can rebalance the package through equity and an upfront signing grant.

Specifically, increasing the 4-year equity grant or introducing an upfront signing buffer to bridge the package to ${formatAmount(inputs.counterTargetTotal)} would offset my unvested equity forfeiture and enable me to finalize the contract immediately.`;
        break;

      case 'accelerated_rider':
        subject = `Offer Acceptance Calibration & Accelerated Milestone Review: ${inputs.candidateRole}`;
        toneParagraph = `I am thrilled by the offer to join ${inputs.targetCompany}. To resolve the gap between the initial offer (${formatAmount(inputs.currentOfferTotal)}) and my target (${formatAmount(inputs.counterTargetTotal)}), I propose a performance-anchored structure:

We proceed with the proposed initial compensation today, accompanied by a formal 6-month milestone review with a predetermined equity refresher and compensation adjustment upon achieving our core cluster efficiency and throughput targets.`;
        break;
    }

    return {
      subject,
      body: `Hi ${inputs.recruiterName},

${toneParagraph}

I would welcome a brief 10-minute phone call to finalize these details and transition swiftly into onboarding.

Warm regards,

[Your Name]
Candidate for ${inputs.candidateRole}`,
    };
  }, [inputs, formatAmount]);

  // Generate Phone Script & Objection Busters
  const phoneBattlecard = useMemo(() => {
    return {
      openingAnchor: `"Thank you for walking me through the numbers. I want to reiterate that ${inputs.targetCompany} is where I want to build. Based on the specialized scope of the ${inputs.candidateRole} and market benchmarks, I am targeting ${formatAmount(inputs.counterTargetTotal)}. If we can reach that threshold, I am ready to sign today."`,
      tacticalSilence: `CRITICAL TACTIC: After stating your target number (${formatAmount(inputs.counterTargetTotal)}), STOP TALKING. Do not fill the silence with justifications. Allow the recruiter or VP to speak first.`,
      objections: [
        {
          trigger: `"Our salary bands are strictly capped by HR."`,
          response: `"I understand base salary bands can have rigid internal ranges. In that case, can we solve this via a frontloaded sign-on bonus or an expanded equity grant to hit the ${formatAmount(inputs.counterTargetTotal)} annual target?"`,
        },
        {
          trigger: `"Our annual equity refreshers will make up for the lower starting grant."`,
          response: `"I appreciate that the company offers refreshers, but since refreshers are subject to future committee discretion, I need our agreed-upon target to be guaranteed in the formal offer letter."`,
        },
        {
          trigger: `"We need your answer by tomorrow morning."`,
          response: `"I respect your timeline and am equally motivated to close this quickly. If you can confirm the calibrated package of ${formatAmount(inputs.counterTargetTotal)}, you won't need to wait until tomorrow—I will sign immediately today."`,
        },
      ],
    };
  }, [inputs, formatAmount]);

  const handleCopyEmail = () => {
    const fullText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    let script = `=== LIVE PHONE NEGOTIATION BATTLECARD ===\nTarget: ${inputs.targetCompany} (${inputs.candidateRole})\n\n`;
    script += `OPENING STATEMENT:\n${phoneBattlecard.openingAnchor}\n\n`;
    script += `TACTICAL RULE:\n${phoneBattlecard.tacticalSilence}\n\n`;
    script += `OBJECTION HANDLING:\n`;
    phoneBattlecard.objections.forEach((obj, idx) => {
      script += `${idx + 1}. When they say: ${obj.trigger}\n   You say: ${obj.response}\n\n`;
    });
    navigator.clipboard.writeText(script);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Banner */}
      <div className="panel bg-gradient-to-br from-[#111a22] via-[#0d1620] to-[#162738] border border-[#1e2b36] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold">
                TACTICAL NEGOTIATION OS
              </span>
              <span className="text-xs text-[#7a8b99]">
                STRATEGIC VALUE-ANCHORED COUNTER-OFFER ENGINE
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#dce7f0] mt-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#22d3a5]" />
              TACTICAL SALARY NEGOTIATION SCRIPT BUILDER
            </h2>
            <p className="text-xs text-[#7a8b99] mt-0.5">
              Generate custom, battle-tested counter-offer scripts, objection busters, and live phone call cheat sheets tailored to frontier AI roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSendToAIEnvoy && (
              <button
                onClick={() => onSendToAIEnvoy(emailDraft.body)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/50 hover:bg-[#38bdf8]/25 text-xs font-bold text-[#38bdf8] transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>PRACTICE WITH AI ENVOY</span>
              </button>
            )}
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.2)] cursor-pointer"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'COPIED TO CLIPBOARD' : 'COPY EMAIL DRAFT'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Config Panel */}
        <div className="lg:col-span-1 space-y-4 bg-[#0f171e] border border-[#1e2b36] rounded-xl p-5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
            <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              LEVERAGE &amp; OFFER INPUTS
            </h3>
            <span className="text-[10px] text-[#7a8b99]">REAL-TIME TACTICS</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[#7a8b99] block mb-1">Target Company Name</label>
              <input
                type="text"
                value={inputs.targetCompany}
                onChange={(e) => setInputs({ ...inputs, targetCompany: e.target.value })}
                className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
              />
            </div>

            <div>
              <label className="text-[#7a8b99] block mb-1">Role Title</label>
              <input
                type="text"
                value={inputs.candidateRole}
                onChange={(e) => setInputs({ ...inputs, candidateRole: e.target.value })}
                className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#7a8b99] block mb-1">Current Offer Base</label>
                <input
                  type="number"
                  value={inputs.currentOfferBase}
                  onChange={(e) => setInputs({ ...inputs, currentOfferBase: Number(e.target.value) })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[#7a8b99] block mb-1">Current Offer Total</label>
                <input
                  type="number"
                  value={inputs.currentOfferTotal}
                  onChange={(e) => setInputs({ ...inputs, currentOfferTotal: Number(e.target.value) })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#22d3a5] font-semibold block mb-1">Counter Target Base</label>
                <input
                  type="number"
                  value={inputs.counterTargetBase}
                  onChange={(e) => setInputs({ ...inputs, counterTargetBase: Number(e.target.value) })}
                  className="w-full bg-[#111a22] border border-[#22d3a5]/50 rounded-lg px-3 py-1.5 text-xs text-[#22d3a5] focus:border-[#22d3a5] outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[#22d3a5] font-semibold block mb-1">Counter Target Total</label>
                <input
                  type="number"
                  value={inputs.counterTargetTotal}
                  onChange={(e) => setInputs({ ...inputs, counterTargetTotal: Number(e.target.value) })}
                  className="w-full bg-[#111a22] border border-[#22d3a5]/50 rounded-lg px-3 py-1.5 text-xs text-[#22d3a5] focus:border-[#22d3a5] outline-none font-bold"
                />
              </div>
            </div>

            {/* Strategic Tone Archetype */}
            <div>
              <label className="text-[#7a8b99] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Negotiation Strategy &amp; Tone
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'assertive_executive', label: 'Assertive Executive', tag: 'Value-Anchor' },
                  { id: 'collaborative_partner', label: 'Collaborative Partner', tag: 'Market-Data' },
                  { id: 'competing_counter', label: 'Competing Offer Play', tag: 'High-Urgency' },
                  { id: 'equity_rebalance', label: 'Equity/Sign-on Rebalance', tag: 'Creative Cash' },
                  { id: 'accelerated_rider', label: 'Milestone Refresher', tag: 'Low-Risk' },
                ].map((toneOpt) => (
                  <button
                    key={toneOpt.id}
                    onClick={() => setInputs({ ...inputs, tone: toneOpt.id as any })}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                      inputs.tone === toneOpt.id
                        ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5]'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                    }`}
                  >
                    <span className="font-semibold">{toneOpt.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#7a8b99]">
                      {toneOpt.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Competing Offer details if tone is competing */}
            {inputs.tone === 'competing_counter' && (
              <div className="p-3 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 space-y-2">
                <div className="text-[10px] text-[#38bdf8] font-bold">COMPETING OFFER LEVERAGE</div>
                <div>
                  <label className="text-[#7a8b99] block mb-1">Competing Lab / Company</label>
                  <input
                    type="text"
                    value={inputs.competingCompany}
                    onChange={(e) => setInputs({ ...inputs, competingCompany: e.target.value })}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-2.5 py-1 text-xs text-[#dce7f0] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#7a8b99] block mb-1">Competing Total Comp ($)</label>
                  <input
                    type="number"
                    value={inputs.competingTotalComp}
                    onChange={(e) => setInputs({ ...inputs, competingTotalComp: Number(e.target.value) })}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-2.5 py-1 text-xs text-[#38bdf8] font-bold outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Email & Phone Cheat Sheet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Draft Box */}
          <div className="bg-[#0f171e] border border-[#1e2b36] rounded-xl p-5 font-mono space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#22d3a5]" />
                <h3 className="text-xs font-bold text-[#dce7f0]">
                  CUSTOM WRITTEN COUNTER-OFFER EMAIL DRAFT
                </h3>
              </div>
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1 text-[11px] text-[#22d3a5] hover:underline cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
              </button>
            </div>

            <div className="text-xs text-[#7a8b99]">
              <span className="text-[#dce7f0] font-semibold">Subject: </span>
              {emailDraft.subject}
            </div>

            <div className="p-4 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#dce7f0] leading-relaxed whitespace-pre-wrap font-sans">
              {emailDraft.body}
            </div>
          </div>

          {/* Live Phone Call Battlecard */}
          <div className="bg-[#0f171e] border border-[#1e2b36] rounded-xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-xs font-bold text-[#dce7f0]">
                  LIVE PHONE CALL SCRIPT &amp; OBJECTION BUSTERS
                </h3>
              </div>
              <button
                onClick={handleCopyPhone}
                className="flex items-center gap-1 text-[11px] text-[#38bdf8] hover:underline cursor-pointer"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPhone ? 'Copied Battlecard!' : 'Copy Battlecard'}</span>
              </button>
            </div>

            {/* Opening Anchor */}
            <div className="p-3 rounded-lg bg-[#111a22] border border-[#38bdf8]/30 text-xs">
              <div className="text-[10px] text-[#38bdf8] font-bold uppercase mb-1">
                Your Exact Opening Verbal Anchor
              </div>
              <p className="text-[#dce7f0] italic font-sans leading-relaxed">
                {phoneBattlecard.openingAnchor}
              </p>
            </div>

            {/* Tactical Discipline Rule */}
            <div className="p-2.5 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-xs text-[#fbbf24] flex items-start gap-2">
              <Zap className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{phoneBattlecard.tacticalSilence}</span>
            </div>

            {/* Objection Busters Grid */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#7a8b99] uppercase font-bold">
                Recruiter Objections &amp; Instant Pivot Responses
              </div>
              {phoneBattlecard.objections.map((obj, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs space-y-1">
                  <div className="text-red-400 font-semibold font-sans">
                    Recruiter: {obj.trigger}
                  </div>
                  <div className="text-[#22d3a5] font-sans pl-3 border-l-2 border-[#22d3a5]">
                    You: {obj.response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
