import React, { useEffect, useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Megaphone,
  Layers,
  Send,
  Target,
  CheckCircle2,
  Building2,
  ArrowRight,
  Gift,
  Users,
  Briefcase,
  Sparkles,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { getPublicShareBaseUrl } from '../utils/serverConfig';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import FunctionalQRCode from './FunctionalQRCode';
import BuyerProspectFinderModal from './BuyerProspectFinderModal';
import SovereignEnterpriseBotModal from './SovereignEnterpriseBotModal';

interface GrowthAdHubTabProps {
  onNavigateToTab?: (tab: string) => void;
}

type CampaignCategory = 'europe' | 'africa' | 'b2b' | 'social' | 'ads';

interface ChecklistStep {
  id: string;
  regionTag: string;
  title: string;
  detail: string;
}

const ACQUISITION_CHECKLIST: ChecklistStep[] = [
  {
    id: 'webhook_live',
    regionTag: 'INFRA',
    title: 'Register Paystack webhook & run 1 live KES/USD smoke check',
    detail: 'Confirm /api/paystack/webhook is saved in Paystack Dashboard and test 1 real transaction end-to-end.',
  },
  {
    id: 'referral_link',
    regionTag: 'VIRAL',
    title: 'Generate your 20%-off Partner Referral Link below',
    detail: 'Attach /r/YOURCODE to outreach so early engineers get 20% off their first subscription.',
  },
  {
    id: 'eu_outbound',
    regionTag: 'EUROPE',
    title: 'DM 15 Staff/Principal Engineers in Berlin, London, Amsterdam & Warsaw',
    detail: 'Lead with unmasked $300k–$600k remote/EU compensation curves (/salary-analytics), not generic pitches.',
  },
  {
    id: 'africa_outbound',
    regionTag: 'AFRICA',
    title: 'Share PPP + M-Pesa/USD access in 5 Nairobi, Lagos & Cape Town dev communities',
    detail: 'Highlight -45%/-55% regional PPP pricing + M-Pesa (KE) and USD Int’l Card support.',
  },
  {
    id: 'agency_pilot',
    regionTag: 'B2B ($199)',
    title: 'Pitch 5 boutique tech recruiters on Sovereign Agency clearance',
    detail: 'Send 3-line LinkedIn note linking /salary-analytics and Agency Pilot onboarding ($199/mo).',
  },
];

const CHECKLIST_STORAGE_KEY = 'radar_credible_acquisition_checklist_v1';

export default function GrowthAdHubTab({ onNavigateToTab }: GrowthAdHubTabProps) {
  const publicBaseUrl = getPublicShareBaseUrl();
  const { user } = useAuth();
  const { openReferralModal, openPaywall } = useSubscription();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showBuyerFinder, setShowBuyerFinder] = useState<boolean>(false);
  const [showSovereignBot, setShowSovereignBot] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | CampaignCategory>('all');
  const [referralCode, setReferralCode] = useState<string>('');
  const [useTrackedReferralUrl, setUseTrackedReferralUrl] = useState<boolean>(false);
  const [isLoadingRef, setIsLoadingRef] = useState<boolean>(false);
  const [activeSubscribersCount, setActiveSubscribersCount] = useState<number | null>(null);
  const [paystackLiveMode, setPaystackLiveMode] = useState<boolean | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let active = true;
    fetch('/api/paystack/webhook/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (typeof data.activeSubscriptionsCount === 'number') {
          setActiveSubscribersCount(data.activeSubscriptionsCount);
        }
        if (typeof data.liveMode === 'boolean') {
          setPaystackLiveMode(data.liveMode);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    setIsLoadingRef(true);
    fetch('/api/referrals/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, uid: user.uid }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.referral?.code) return;
        setReferralCode(data.referral.code);
        setUseTrackedReferralUrl(true);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingRef(false);
      });
    return () => {
      active = false;
    };
  }, [user?.email, user?.uid]);

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const trackedShareUrl =
    useTrackedReferralUrl && referralCode
      ? `${publicBaseUrl}/r/${referralCode}`
      : publicBaseUrl;

  const analyticsShareUrl =
    useTrackedReferralUrl && referralCode
      ? `${publicBaseUrl}/salary-analytics?ref=${encodeURIComponent(referralCode)}`
      : `${publicBaseUrl}/salary-analytics`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const completedCount = ACQUISITION_CHECKLIST.filter((s) => Boolean(completedSteps[s.id])).length;

  const campaigns: Array<{
    id: string;
    platform: string;
    icon: string;
    category: CampaignCategory;
    badge: string;
    badgeColor: string;
    title: string;
    targetAudience: string;
    shareUrl: string | null;
    copyText: string;
  }> = [
    {
      id: 'eu-staff-dm',
      platform: 'Europe Senior / Staff DM',
      icon: 'EU',
      category: 'europe',
      badge: 'DIRECT OUTREACH',
      badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
      title: '1-to-1 LinkedIn / Slack Note for European Engineers',
      targetAudience: 'Senior, Staff & Principal Engineers in Berlin, London, Amsterdam, Zurich, Warsaw & Madrid',
      shareUrl: null,
      copyText: `Hi [First Name] — saw your background in [Distributed Systems / AI / Backend].\n\nI built TalentRadar.OS to solve a gap we keep seeing in Europe: job boards hide real top-decile total comp (equity + remote US/CH/UK bands) behind vague "competitive salary" tags.\n\nYou can benchmark Junior → Principal compensation trajectories and see unmasked global clusters right in the browser (CEE & Southern Europe get automatic PPP pricing, and Visa/Mastercard checkout works globally):\n${analyticsShareUrl}\n\nHappy to share a direct ${referralCode ? `20% launch invite (${referralCode})` : 'early partner pass'} if it’s useful for your next negotiation or role move—curious what roles feel most under-reported in [City]?`,
    },
    {
      id: 'africa-remote-post',
      platform: 'Africa Remote Talent & Dev Hubs',
      icon: 'AF',
      category: 'africa',
      badge: 'PPP + M-PESA',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      title: 'Community Post for Nairobi, Lagos, Cape Town & Kigali Engineers',
      targetAudience: 'Senior Remote Engineers in Kenya, Nigeria, South Africa, Ghana & Rwanda',
      shareUrl: null,
      copyText: `For senior engineers across Nairobi, Lagos, Kigali & Cape Town targeting global remote roles or negotiating USD/EUR comp:\n\nWe launched TalentRadar.OS — a live compensation benchmarking & 3D hiring radar showing real remote AI, Quant & Distributed Systems pay bands ($200k–$600k+).\n\nTwo things built specifically so global talent isn’t priced out:\n• Automatic Region-Aware PPP (-45% to -55% off Pro tiers across Africa)\n• Instant Paystack checkout via M-Pesa (Kenya/East Africa) or USD Visa/Mastercard across NG, GH & ZA\n\nExplore the live salary curves here:\n${trackedShareUrl}\n\nFeedback from folks actively negotiating remote offers is welcome!`,
    },
    {
      id: 'b2b-agency-pitch',
      platform: 'Boutique Tech Recruiting Agencies',
      icon: 'B2B',
      category: 'b2b',
      badge: '$199/MO SOVEREIGN',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      title: 'Cold Email / LinkedIn Pitch for Recruiting Agency Founders',
      targetAudience: 'Founders & Managing Partners at European/Global Technical Search Firms',
      shareUrl: null,
      copyText: `Subject: Comp telemetry for [Agency Name]'s $250k+ AI/Infra searches\n\nHi [Name],\n\nBoutique technical search teams placing Staff+ and AI engineers often spend hours pulling disparate Levels.fyi / Carta data just to set realistic client comp bands.\n\nI built TalentRadar.OS — an interactive 3D hiring cluster radar + real-time Junior/Senior/Principal comp curve benchmark tool used during client intake calls:\n${analyticsShareUrl}\n\nIf you’d like seat access under our Sovereign Partner tier ($199/mo via Paystack card checkout, cancel anytime), let me know and I’ll walk your team through a 5-minute live benchmark for one of your active requisitions.\n\nBest,\nMorty — TalentRadar.OS`,
    },
    {
      id: 'hackernews',
      platform: 'Hacker News (Show HN)',
      icon: 'Y',
      category: 'social',
      badge: 'HIGH-INTENT DEVS',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      title: 'Show HN: TalentRadar – 3D Geospatial Tech Compensation & Hiring Radar',
      targetAudience: 'Staff Engineers, Technical Founders, Quant & Systems Developers',
      shareUrl: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
        trackedShareUrl
      )}&t=${encodeURIComponent('Show HN: TalentRadar – 3D geospatial tech compensation and role radar')}`,
      copyText: `Show HN: TalentRadar – 3D geospatial tech compensation and role radar\n\nURL: ${trackedShareUrl}\n\nHi HN,\n\nI built TalentRadar.OS because compensation transparency in European, African, and cross-border remote engineering is still fragmented compared to SF/NYC.\n\nWhat it does:\n- Maps active engineering/AI/quant hiring clusters on a 3D globe\n- Benchmarks Junior, Senior, and Principal comp trajectories across hubs\n- Supports custom salary-band alert intercepts & zero-knowledge StealthNet outreach\n- Region-aware PPP pricing automatically adjusts Pro tiers by geography\n\nStack: React, TypeScript, Three.js, Recharts, Express, Firebase.\n\nI'd love blunt technical and data-accuracy feedback from engineers who recently negotiated offers in Europe or globally!`,
    },
    {
      id: 'linkedin',
      platform: 'LinkedIn Data Post',
      icon: 'in',
      category: 'social',
      badge: 'EU & GLOBAL PROS',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      title: 'LinkedIn Compensation Transparency Post',
      targetAudience: 'Engineering Managers, Principal Engineers, Heads of Talent across EU & UK',
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(analyticsShareUrl)}`,
      copyText: `Why do two Staff Engineers doing identical distributed-systems work in Berlin, London, and remote US hubs see a 2.4x total-comp gap?\n\nWe just updated TalentRadar.OS with a Junior / Senior / Principal benchmark switcher and multi-year compensation trajectory curves:\n• Benchmark real cash vs equity splits by seniority\n• Filter global hubs on the interactive 3D hiring radar\n• Regional Purchasing Power Parity (PPP) pricing so talent everywhere gets fair access\n\nInspect the live salary analytics console here:\n${analyticsShareUrl}\n\nWhich role or European hub should we benchmark next?`,
    },
    {
      id: 'reddit',
      platform: 'Reddit (EU & ExperiencedDevs)',
      icon: 'r/',
      category: 'social',
      badge: 'ORGANIC DISCUSSION',
      badgeColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
      title: 'Reddit Value-First Post (r/ExperiencedDevs, r/cscareerquestionsEU)',
      targetAudience: 'Experienced Developers (5+ YOE), EU Tech Workers, Remote Contractors',
      shareUrl: `https://reddit.com/submit?url=${encodeURIComponent(
        analyticsShareUrl
      )}&title=${encodeURIComponent('Built a browser tool to compare Junior/Senior/Principal comp curves across EU, Africa & US hubs')}`,
      copyText: `I put together a live compensation & hiring cluster tool aimed at making cross-border and Senior/Principal tech comp easier to benchmark outside US-only trackers.\n\nLink: ${analyticsShareUrl}\n\nIt breaks down:\n- Junior vs Senior vs Principal comp trajectories over 5 years\n- Sector differences (AI Foundation Labs, Quant Systems, Cloud Infra, SpaceTech)\n- Region-aware PPP tiers for EU/CEE/Africa users\n\nHappy to hear what feels accurate or off for your local market (especially Berlin, Amsterdam, London, Warsaw, and Nairobi).`,
    },
    {
      id: 'x-twitter',
      platform: 'X (Twitter)',
      icon: '𝕏',
      category: 'social',
      badge: 'PRODUCT THREAD',
      badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
      title: 'X / Twitter Product Breakdown',
      targetAudience: 'Tech Founders, Indie Hackers, AI & Systems Engineers',
      shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Built TalentRadar.OS — a live 3D hiring cluster globe + Junior/Senior/Principal comp trajectory terminal for global & remote engineers.\n\nIncludes region-aware PPP pricing & live alerts:\n${trackedShareUrl}`
      )}`,
      copyText: `Most salary trackers stop at SF Bay Area averages.\n\nBuilt TalentRadar.OS to track global hiring clusters + Junior/Senior/Principal compensation trajectories across Europe, North America, and Africa:\n\n• 3D Geospatial Role Radar\n• 5-Year Cash + Equity Simulation\n• StealthNet Anonymous Outreach\n• Region-Aware PPP + Instant Paystack Access\n\nTry it live:\n${trackedShareUrl}`,
    },
    {
      id: 'google-ads',
      platform: 'Google Search Ads (High-Intent)',
      icon: 'G',
      category: 'ads',
      badge: 'SEARCH INTENT',
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      title: 'Targeted Search Ad Spec (Start Small: €10/day Exact/Phrase)',
      targetAudience: 'Engineers & Recruiters actively searching senior tech compensation benchmarks',
      shareUrl: null,
      copyText: `=== HIGH-INTENT SEARCH SPEC ===\nLanding URL: ${analyticsShareUrl}\nGeos to Test First: UK, Germany, Netherlands, Switzerland, Poland (separate campaign from Kenya/South Africa)\n\n[Headlines (30 chars max)]:\n1. Principal Engineer Comp Data\n2. Live Tech Salary Trajectories\n3. 3D Global Hiring Radar\n4. Benchmark Senior & AI Roles\n\n[Descriptions (90 chars max)]:\n1. Compare Junior, Senior & Principal tech pay across Europe, US & remote hubs.\n2. Track high-yield AI, Quant & Cloud roles with real-time alert intercepts.\n\n[Exact / Phrase Keywords]:\n"staff engineer salary europe"\n"principal engineer compensation"\n"ai engineer salary benchmark"\n"quant developer salary london"`,
    },
  ];

  const filteredCampaigns = campaigns.filter(
    (c) => activeFilter === 'all' || c.category === activeFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Credible Subscriber Acquisition Command Center */}
      <div className="bg-gradient-to-r from-[#111a22] via-[#162330] to-[#111a22] border border-[#22d3a5]/40 rounded-xl p-5 shadow-[0_0_25px_rgba(34,211,165,0.1)] relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#22d3a5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] text-xs font-mono font-bold border border-[#22d3a5]/50">
                <Globe className="w-3.5 h-3.5" />
                PUBLIC APP LIVE
              </span>
              {paystackLiveMode !== null && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0]">
                  Paystack: <strong className="text-[#22d3a5]">{paystackLiveMode ? 'LIVE' : 'TEST'}</strong>
                </span>
              )}
              {activeSubscribersCount !== null && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0]">
                  Verified Subscribers: <strong className="text-[#fbbf24]">{activeSubscribersCount}</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#dce7f0] tracking-tight font-mono">
              Credible Subscriber Acquisition Command Center
            </h2>
            <p className="text-sm text-[#94a3b8] max-w-2xl">
              Direct outreach playbooks, tracked 20%-off invite links, and high-intent distribution tailored for European senior engineers, African remote talent (PPP + M-Pesa), and boutique recruiting agencies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => copyToClipboard(trackedShareUrl, 'published-url')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-[#0a0f14] font-bold font-mono text-xs transition shadow-[0_0_15px_rgba(34,211,165,0.3)] cursor-pointer"
            >
              {copiedKey === 'published-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>
                {copiedKey === 'published-url'
                  ? 'SHARE URL COPIED!'
                  : referralCode && useTrackedReferralUrl
                  ? 'COPY 20%-OFF INVITE URL'
                  : 'COPY LIVE SHARE URL'}
              </span>
            </button>
            <button
              type="button"
              onClick={openReferralModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#fbbf24]/50 text-[#fbbf24] font-mono text-xs font-semibold transition cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>REFERRAL CONSOLE</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBuyerFinder(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#22d3a5] to-[#38bdf8] text-black font-mono text-xs font-extrabold transition shadow-[0_0_20px_rgba(34,211,165,0.4)] cursor-pointer hover:opacity-95"
            >
              <Target className="w-4 h-4" />
              <span>LAUNCH BUYER FINDER SOFTWARE</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSovereignBot(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-black font-mono text-xs font-extrabold transition shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer hover:opacity-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>LAUNCH SOVEREIGN BOT</span>
            </button>
          </div>
        </div>

        {/* Share URL & Referral Attacher Bar */}
        <div className="mt-4 pt-4 border-t border-[#1e2b36] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#7a8b99] overflow-hidden">
            <span className="text-[#22d3a5] font-semibold shrink-0">ACTIVE SHARE URL:</span>
            <span className="text-[#dce7f0] bg-[#0a0f14] px-2.5 py-1 rounded border border-[#1e2b36] truncate">
              {trackedShareUrl}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {referralCode ? (
              <button
                type="button"
                onClick={() => setUseTrackedReferralUrl(!useTrackedReferralUrl)}
                className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer transition ${
                  useTrackedReferralUrl
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
                }`}
              >
                {useTrackedReferralUrl
                  ? `✓ 20% Off Code Attached (${referralCode})`
                  : `+ Attach 20% Off Code (${referralCode})`}
              </button>
            ) : (
              <button
                type="button"
                onClick={openReferralModal}
                disabled={isLoadingRef}
                className="px-2.5 py-1 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/40 text-[#fbbf24] text-[11px] font-bold cursor-pointer"
              >
                {isLoadingRef ? 'Loading Referral Code...' : 'Generate Tracked 20%-Off Partner Link →'}
              </button>
            )}
            <a
              href={trackedShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#38bdf8] hover:text-white underline text-[11px]"
            >
              <span>Preview Live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive First-Subscriber Execution Checklist */}
      <div className="bg-[#111a22] border border-[#38bdf8]/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-[#38bdf8]" />
            <div>
              <h3 className="text-base font-bold text-[#dce7f0] font-mono">
                First-Subscriber Execution Checklist ({completedCount}/{ACQUISITION_CHECKLIST.length})
              </h3>
              <p className="text-xs text-[#7a8b99]">
                Focus exclusively on real high-intent engineers &amp; recruiters—zero paid click farms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openPaywall('Inspect Live Customer Paywall & PPP Checkout')}
            className="px-3 py-1.5 rounded-lg bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#22d3a5]/40 text-[#22d3a5] font-mono text-[11px] font-bold transition cursor-pointer shrink-0"
          >
            Preview Customer Checkout Flow →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACQUISITION_CHECKLIST.map((step) => {
            const done = Boolean(completedSteps[step.id]);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(step.id)}
                className={`text-left p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                  done
                    ? 'bg-[#22d3a5]/10 border-[#22d3a5]/50'
                    : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#38bdf8]/50'
                }`}
              >
                {done ? (
                  <CheckSquare className="w-4 h-4 text-[#22d3a5] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#7a8b99] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#38bdf8] font-bold">
                      {step.regionTag}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        done ? 'text-[#22d3a5] line-through' : 'text-[#dce7f0]'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7a8b99] leading-snug">{step.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* B2B / Agency & Acquisition Cross-Link Card */}
      <div className="bg-gradient-to-r from-[#fbbf24]/10 via-[#111a22] to-[#38bdf8]/10 border border-[#fbbf24]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24] flex items-center justify-center shrink-0 text-[#fbbf24]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#dce7f0]">
                HIGHEST-VALUE CONVERSIONS: $199/MO RECRUITING AGENCIES
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#fbbf24] text-black text-[9px] font-bold">
                SOVEREIGN CRM
              </span>
            </div>
            <p className="text-[11px] text-[#7a8b99] font-sans mt-0.5">
              One retained technical search agency at $199/mo equals 4 Pro subscribers. Track agency leads &amp; pilot inquiries inside the CRM vault.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-agency-pilot-modal'))}
            className="px-3 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>OPEN AGENCY PILOT</span>
          </button>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('finance')}
              className="px-3 py-2 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>BUYER &amp; AGENCY CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Regional & Organic Distribution Playbooks */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#dce7f0] font-mono flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#22d3a5]" />
              Regional &amp; High-Intent Subscriber Playbooks
            </h3>
            <p className="text-xs text-[#7a8b99]">
              Pre-loaded with your live public URL{referralCode && useTrackedReferralUrl ? ` + tracked code (${referralCode})` : ''}. Copy, personalize the bracketed name/city, and send.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-[#111a22] p-1 rounded-lg border border-[#1e2b36] text-xs font-mono">
            {(
              [
                { id: 'all', label: `ALL (${campaigns.length})` },
                { id: 'europe', label: 'EUROPE' },
                { id: 'africa', label: 'AFRICA' },
                { id: 'b2b', label: 'B2B AGENCIES' },
                { id: 'social', label: 'COMMUNITIES' },
                { id: 'ads', label: 'SEARCH ADS' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#22d3a5] text-[#0a0f14] font-bold'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playbook Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/50 transition rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#1e2b36] border border-[#2e3e4e] flex items-center justify-center font-bold font-mono text-xs text-[#dce7f0]">
                      {camp.icon}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#dce7f0]">{camp.platform}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${camp.badgeColor}`}>
                    {camp.badge}
                  </span>
                </div>

                <div className="text-xs text-[#7a8b99] font-mono mb-2">
                  <span className="text-[#94a3b8] font-semibold">Audience:</span> {camp.targetAudience}
                </div>

                <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3 my-2.5">
                  <pre className="text-xs text-[#dce7f0] whitespace-pre-wrap font-sans max-h-44 overflow-y-auto leading-relaxed">
                    {camp.copyText}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e2b36] mt-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(camp.copyText, camp.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#2e3e4e] text-[#dce7f0] font-mono text-xs transition cursor-pointer"
                >
                  {copiedKey === camp.id ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === camp.id ? 'COPIED!' : 'COPY SCRIPT'}</span>
                </button>

                {camp.shareUrl ? (
                  <a
                    href={camp.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-[#0a0f14] font-mono text-xs font-bold transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>OPEN {camp.platform.split(' ')[0].toUpperCase()}</span>
                  </a>
                ) : (
                  <span className="text-[11px] font-mono text-[#7a8b99] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Personalize [Bracketed] Fields
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Preview Card */}
      <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-5">
        <h3 className="text-base font-bold text-[#dce7f0] font-mono flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-[#fbbf24]" />
          Live OpenGraph Link Preview
        </h3>
        <p className="text-xs text-[#7a8b99] mb-4">
          How your public URL renders when pasted into LinkedIn DMs, Hacker News, Discord/Slack guilds, and X posts.
        </p>

        <div className="bg-[#0a0f14] border border-[#22d3a5]/30 rounded-xl p-5 max-w-2xl mx-auto shadow-[0_0_20px_rgba(34,211,165,0.08)]">
          <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3 mb-3 text-xs font-mono">
            <span className="text-[#22d3a5] font-bold">TALENT_RADAR.OS // LIVE PREVIEW</span>
            <span className="text-[#7a8b99] truncate ml-2">{trackedShareUrl}</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22d3a5]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D GEOSPATIAL RADAR • SALARY TRAJECTORIES • REGION-AWARE PPP</span>
            </div>
            <h4 className="text-lg font-bold text-[#dce7f0] font-mono">
              Global Job &amp; Career Radar – 3D Geospatial Intel &amp; Compensation Benchmarks
            </h4>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Benchmark Junior, Senior, and Principal compensation curves across Europe, North America, and Africa—with custom job alert intercepts, StealthNet outreach, and Paystack checkout.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#22d3a5] border border-[#22d3a5]/30">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                3D Role Globe
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#fbbf24] border border-[#fbbf24]/30">
                Junior → Principal Benchmarks
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#38bdf8] border border-[#38bdf8]/30">
                Region-Aware PPP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shareable QR Code (embeds tracked 20%-off invite URL when enabled) */}
      <FunctionalQRCode
        value={trackedShareUrl}
        title="Tracked Acquisition QR Code"
        subtitle="Scan or embed in meetup slides, LinkedIn carousels, and agency pitch PDFs."
        size={190}
      />

      {showBuyerFinder && <BuyerProspectFinderModal onClose={() => setShowBuyerFinder(false)} />}
      {showSovereignBot && <SovereignEnterpriseBotModal onClose={() => setShowSovereignBot(false)} />}
    </div>
  );
}
