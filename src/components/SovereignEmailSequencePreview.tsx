import React, { useState } from 'react';
import {
  Mail,
  UserCheck,
  Copy,
  Check,
  Target,
  Filter,
  CheckCircle2,
  Send,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { auth } from '../firebase';

interface PersonaTemplate {
  id: string;
  personaName: string;
  roleTitle: string;
  badgeColor: string;
  icpGrade: string;
  matchScore: number;
  budgetAuthority: string;
  touch1Subject: string;
  touch1Body: string;
  touch2Subject: string;
  touch2Body: string;
}

const getLiveAppUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')) {
    return window.location.origin;
  }
  return 'https://ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
};

const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    id: 'buildkite_contract',
    personaName: 'Buildkite Engineering Recruiting (Simon McSorley)',
    roleTitle: 'Technical Recruiter / Engineering Recruiter Contract',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    icpGrade: 'Active Technical Recruiting Contract (Dec–April, ANZ Remote)',
    matchScore: 99,
    budgetAuthority: '4-5 Month Remote Engineering Recruiting Contract',
    touch1Subject: 'Available for Buildkite Engineering Recruiting Contract (Dec-April) // [Recipient Name]',
    touch1Body: `Hi [Recipient Name],\n\nSaw your post about the 4-to-5 month technical recruiting contract at [Enterprise Name] starting December 1 through April to help power through your engineering hiring sprint.\n\nI am an experienced technical recruiter specializing in high-growth remote engineering teams across [Hub / Region]. I'd love to jump in and help you deliver your hiring goals for Q4 and Q1.\n\nAs a bonus, I also bring a live 14-board ATS intelligence platform (TalentRadar.OS) with pre-indexed Greenhouse/Ashby/Lever engineering talent curves and compensation benchmarks that can accelerate your sourcing workflow.\n\nAre you open to a quick chat this week? Here is my profile / live radar preview: [App URL]\n\nBest regards,\n[Your Name]`,
    touch2Subject: 'Re: Buildkite Engineering Recruiting Contract (Dec-April) // [Recipient Name]',
    touch2Body: `Hi [Recipient Name],\n\nFollowing up on my note. I'm fully available for a 4-5 month remote contract (Dec 1 – April) across [Hub / Region] and ready to hit the ground running on your engineering hiring sprint.\n\nLet me know if you have 10 minutes for an introductory chat or if you'd like me to send over my CV / availability details.\n\nCheers,\n[Your Name]`,
  },
  {
    id: 'agency_staffing',
    personaName: 'IT Staffing & Recruiting Agency (Sovereign)',
    roleTitle: 'US & Domestic IT Recruiting Desk',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    icpGrade: 'Direct Agency Partner — High-Volume US/EU IT Placements',
    matchScore: 99,
    budgetAuthority: 'Agency Sovereign Seat + Branded Client Comp Dossiers',
    touch1Subject: 'Live US Tech Requisitions & Comp Dossiers for [Enterprise Name] IT Recruiters',
    touch1Body: `Hi [Recipient Name],\n\nSaw your post that [Enterprise Name] is actively expanding both your US IT Recruiter and Domestic IT Recruiter desks in [Hub / Region].\n\nWhen onboarding or scaling US IT recruiters, two bottlenecks slow down first-month placements: finding live, un-saturated requisitions and benchmarking real US total compensation bands before submitting candidates.\n\nWe built TalentRadar.OS specifically for recruiting desks like [Enterprise Name]:\n• Live 14-Board External ATS Radar (Greenhouse, Ashby & Lever openings updated live)\n• Instant US/EU/Global Total Comp & Percentile Dossiers (branded PDF exports for your hiring clients)\n• Automated candidate counter-offer & ZOPA negotiation modeling\n\nYou can test the live radar right now here: [App URL]\n\nWould you like me to activate an Agency Sovereign preview for your [Enterprise Name] recruiting team today?`,
    touch2Subject: 'Re: Live US Tech Requisitions & Client Dossiers for [Enterprise Name]',
    touch2Body: `Hi [Recipient Name],\n\nQuick follow-up — I pulled live US Staff/Senior engineering and cloud requisitions from Ashby & Greenhouse boards inside TalentRadar.OS that match what US IT recruiting desks place most.\n\nYour team at [Enterprise Name] can inspect live roles, filter by $180k-$450k+ compensation bands, and export client-ready PDF compensation reports in seconds.\n\nExplore live here: [App URL]\n\nReply anytime or activate Agency Sovereign directly from the billing desk if you'd like seats for your recruiters.`,
  },
  {
    id: 'talent_head',
    personaName: 'Head of Talent / Recruiting',
    roleTitle: 'Head of Global Talent Acquisition',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    icpGrade: 'Tier-2 High-Growth AI Scaleup (100-500 Team)',
    matchScore: 94,
    budgetAuthority: '$50k - $150k Talent Tech Stack Budget',
    touch1Subject: 'Unmasking Top-Decile 2026 Compensation Curves for [Enterprise Name]',
    touch1Body: `Hi [Recipient Name],\n\nWhen sourcing Staff+ AI and distributed systems engineers for [Enterprise Name] in [Hub / Region], standard job boards hide real top-decile compensation bands behind vague tags.\n\nTalentRadar.OS provides real-time Junior/Senior/Principal comp curves, 3D hiring cluster radar, and automated ZOPA negotiation telemetry so your recruiting team closes candidates 3x faster with verified data.\n\nExplore live here: [App URL]\n\nWould you like a live walkthrough of our enterprise talent intelligence suite?`,
    touch2Subject: 'Re: Unmasking Top-Decile 2026 Compensation Curves',
    touch2Body: `Hi [Recipient Name],\n\nFollowing up. We've just updated our compensation benchmarks for accelerated compute and robotics engineering across [Hub / Region].\n\nHere is a live link to explore the platform: [App URL]\n\nLet me know if you’d like to pilot our ATS intelligence suite for your active requisitions!`,
  },
  {
    id: 'cto',
    personaName: 'Chief Technology Officer (CTO)',
    roleTitle: 'CTO / VP of Engineering',
    badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
    icpGrade: 'Tier-1 Sovereign Enterprise (500+ Engineers)',
    matchScore: 98,
    budgetAuthority: '$100k - $500k Software & Infrastructure Budget',
    touch1Subject: 'Zero-Knowledge Compensation Telemetry & Secure Architecture for [Enterprise Name]',
    touch1Body: `Hi [Recipient Name],\n\nIn accelerated compute and enterprise engineering at [Enterprise Name], protecting recruitment telemetry and salary negotiation data against third-party leakage is critical.\n\nTalentRadar.OS provides a zero-knowledge compensation intelligence platform tailored for [Hub / Region], indexing real-time US and European engineering pay curves.\n\nPreview live: [App URL]\n\nWould you be open to a 5-minute briefing?`,
    touch2Subject: 'Re: Zero-Knowledge Compensation Telemetry // Briefing for [Enterprise Name]',
    touch2Body: `Hi [Recipient Name],\n\nFollowing up on my previous note. Our platform indexes 2026 accelerated compute and distributed infrastructure compensation curves across US, European, and remote hubs.\n\nLive preview: [App URL]`,
  },
];

export default function SovereignEmailSequencePreview() {
  const [activePersonaId, setActivePersonaId] = useState<string>('buildkite_contract');
  const [recipientName, setRecipientName] = useState<string>('Simon McSorley');
  const [recipientEmail, setRecipientEmail] = useState<string>('simon.mcsorley@buildkite.com');
  const [enterpriseName, setEnterpriseName] = useState<string>('Buildkite');
  const [hubRegion, setHubRegion] = useState<string>('Australia or New Zealand (Remote)');
  const [strictIcpFilter, setStrictIcpFilter] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sendingTouch, setSendingTouch] = useState<'touch1' | 'touch2' | null>(null);
  const [sendFeedback, setSendFeedback] = useState<{
    ok: boolean;
    message: string;
    mailtoHref?: string;
  } | null>(null);

  const activePersona = PERSONA_TEMPLATES.find((p) => p.id === activePersonaId) || PERSONA_TEMPLATES[0];

  const renderInterpolated = (text: string) => {
    const appUrl = getLiveAppUrl();
    return text
      .replace(/\[Recipient Name\]/g, recipientName || '[Recipient Name]')
      .replace(/\[Enterprise Name\]/g, enterpriseName || '[Enterprise Name]')
      .replace(/\[Hub \/ Region\]/g, hubRegion || '[Hub / Region]')
      .replace(/\[App URL\]/g, appUrl);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(renderInterpolated(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleSendPitch = async (touch: 'touch1' | 'touch2') => {
    const cleanEmail = recipientEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSendFeedback({ ok: false, message: 'Enter a valid recipient email address first.' });
      return;
    }

    const subject = renderInterpolated(
      touch === 'touch1' ? activePersona.touch1Subject : activePersona.touch2Subject
    );
    const body = renderInterpolated(
      touch === 'touch1' ? activePersona.touch1Body : activePersona.touch2Body
    );

    setSendingTouch(touch);
    setSendFeedback(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        const mailtoHref = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setSendFeedback({
          ok: true,
          message: 'Mailto draft prepared for your email client.',
          mailtoHref,
        });
        return;
      }

      const res = await fetch('/api/comms/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: `AGENCY-${enterpriseName.replace(/[^a-z0-9]/gi, '').toUpperCase() || 'LEAD'}`,
          recipientEmail: cleanEmail,
          subject,
          replyText: body,
          company: enterpriseName,
          targetRole: activePersona.roleTitle,
          status: 'Replied',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to transmit agency pitch.');
      }

      if (data.deliveryMode === 'email_api') {
        setSendFeedback({
          ok: true,
          message: `Pitch delivered live to ${cleanEmail} via ${String(data.provider || 'email API').toUpperCase()}!`,
        });
      } else {
        setSendFeedback({
          ok: true,
          message:
            data.fallbackReason ||
            'Email API key not active on server yet — click Open Mailto Client below to send immediately from your inbox.',
          mailtoHref:
            data.mailtoHref ||
            `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        });
      }
    } catch (err: any) {
      setSendFeedback({
        ok: false,
        message: err?.message || 'Unable to transmit pitch.',
      });
    } finally {
      setSendingTouch(null);
    }
  };

  return (
    <div className="panel bg-[#111a22] border-2 border-[#38bdf8]/40 rounded-xl p-6 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2b36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              ICP PRECISION TARGETING &amp; AGENCY PITCH DISPATCHER
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-extrabold">
                LIVE B2B OUTREACH
              </span>
            </h3>
            <p className="text-xs text-[#7a8b99]">
              Pre-configured for direct IT staffing &amp; recruiting agency outreach with live Resend/Brevo + Mailto handoff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStrictIcpFilter(!strictIcpFilter)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              strictIcpFilter
                ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{strictIcpFilter ? 'Strict ICP Filter: ON (95%+ Match)' : 'Strict ICP Filter: OFF'}</span>
          </button>
        </div>
      </div>

      {/* ICP Fit Score Telemetry Banner */}
      <div className="bg-[#0a0f14] border border-[#22d3a5]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#22d3a5]" />
            <span className="text-white font-bold">{activePersona.icpGrade}</span>
          </div>
          <div className="text-[11px] text-[#7a8b99]">
            Target Plan Fit: <strong className="text-[#fbbf24]">{activePersona.budgetAuthority}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[#7a8b99] block">ICP FIT SCORE</span>
            <span className="text-lg font-bold text-[#22d3a5]">{activePersona.matchScore}% PRECISION</span>
          </div>
        </div>
      </div>

      {/* Recipient Placeholders Editor Bar */}
      <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[10px] text-[#7a8b99] mb-1">RECIPIENT EMAIL:</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full bg-[#111a22] border border-[#22d3a5]/40 focus:border-[#22d3a5] text-[#22d3a5] font-semibold rounded-lg px-3 py-2 outline-none"
            placeholder="e.g. varun.n@esolglobal.com"
          />
        </div>

        <div>
          <label className="block text-[10px] text-[#7a8b99] mb-1">RECIPIENT NAME:</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] text-[#dce7f0] rounded-lg px-3 py-2 outline-none"
            placeholder="e.g. Varun N."
          />
        </div>

        <div>
          <label className="block text-[10px] text-[#7a8b99] mb-1">AGENCY / ENTERPRISE:</label>
          <input
            type="text"
            value={enterpriseName}
            onChange={(e) => setEnterpriseName(e.target.value)}
            className="w-full bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] text-[#dce7f0] rounded-lg px-3 py-2 outline-none"
            placeholder="e.g. Esol Global"
          />
        </div>

        <div>
          <label className="block text-[10px] text-[#7a8b99] mb-1">DESK / REGION:</label>
          <input
            type="text"
            value={hubRegion}
            onChange={(e) => setHubRegion(e.target.value)}
            className="w-full bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] text-[#dce7f0] rounded-lg px-3 py-2 outline-none"
            placeholder="e.g. Jaipur / US IT Recruiting"
          />
        </div>
      </div>

      {sendFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            sendFeedback.ok
              ? 'bg-[#22d3a5]/10 border-[#22d3a5]/50 text-[#22d3a5]'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {sendFeedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{sendFeedback.message}</span>
          </div>
          {sendFeedback.mailtoHref && (
            <a
              href={sendFeedback.mailtoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5] text-black font-bold text-[11px] shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Mailto Client</span>
            </a>
          )}
        </div>
      )}

      {/* Persona Toggle Buttons */}
      <div className="space-y-2">
        <label className="block text-xs text-[#7a8b99] font-bold">SELECT QUALIFIED DECISION-MAKER PERSONA:</label>
        <div className="flex flex-wrap gap-2">
          {PERSONA_TEMPLATES.map((persona) => {
            const isActive = activePersonaId === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setActivePersonaId(persona.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#152330] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white hover:border-[#3b82f6]/50'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-[#7a8b99]'}`} />
                <span>{persona.personaName}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${persona.badgeColor}`}>
                  {persona.matchScore}% Match
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Touch Point 1 Preview */}
      <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#1e2b36] pb-2">
          <span className="text-[#38bdf8] font-bold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> TOUCH POINT #1 // DIRECT AGENCY OUTREACH
          </span>
          <span className="text-[10px] text-[#22d3a5]">Target: {recipientEmail || 'Agency Lead'}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-[#7a8b99] block">SUBJECT:</span>
          <div className="text-xs font-bold text-white bg-[#111a22] p-2.5 rounded border border-[#1e2b36]">
            {renderInterpolated(activePersona.touch1Subject)}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-[#7a8b99] block">BODY:</span>
          <div className="text-xs text-[#dce7f0] bg-[#111a22] p-3.5 rounded border border-[#1e2b36] whitespace-pre-wrap leading-relaxed">
            {renderInterpolated(activePersona.touch1Body)}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCopy(activePersona.touch1Subject + '\n\n' + activePersona.touch1Body, 'touch1')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              copiedKey === 'touch1' ? 'bg-emerald-500 text-black' : 'bg-[#1e2b36] hover:bg-[#2a3b49] text-white'
            }`}
          >
            {copiedKey === 'touch1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'touch1' ? 'COPIED TOUCH 1!' : 'COPY TOUCH 1'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPitch('touch1')}
            disabled={sendingTouch === 'touch1'}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer bg-[#22d3a5] hover:bg-[#1db890] text-black shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sendingTouch === 'touch1' ? 'DISPATCHING...' : `SEND TO ${recipientEmail || 'LEAD'}`}</span>
          </button>
        </div>
      </div>

      {/* Touch Point 2 Preview */}
      <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#1e2b36] pb-2">
          <span className="text-[#38bdf8] font-bold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> TOUCH POINT #2 // 48-HOUR FOLLOW-UP
          </span>
          <span className="text-[10px] text-[#22d3a5]">Sovereign Seat Conversion</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-[#7a8b99] block">SUBJECT:</span>
          <div className="text-xs font-bold text-white bg-[#111a22] p-2.5 rounded border border-[#1e2b36]">
            {renderInterpolated(activePersona.touch2Subject)}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-[#7a8b99] block">BODY:</span>
          <div className="text-xs text-[#dce7f0] bg-[#111a22] p-3.5 rounded border border-[#1e2b36] whitespace-pre-wrap leading-relaxed">
            {renderInterpolated(activePersona.touch2Body)}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCopy(activePersona.touch2Subject + '\n\n' + activePersona.touch2Body, 'touch2')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              copiedKey === 'touch2' ? 'bg-emerald-500 text-black' : 'bg-[#1e2b36] hover:bg-[#2a3b49] text-white'
            }`}
          >
            {copiedKey === 'touch2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'touch2' ? 'COPIED TOUCH 2!' : 'COPY TOUCH 2'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPitch('touch2')}
            disabled={sendingTouch === 'touch2'}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer bg-[#38bdf8] hover:bg-[#2dd4bf] text-black shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sendingTouch === 'touch2' ? 'DISPATCHING...' : 'SEND FOLLOW-UP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

