import React, { useState } from 'react';
import {
  Building2,
  Users,
  ExternalLink,
  Copy,
  Check,
  DollarSign,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Plus,
  Landmark,
  BadgeDollarSign,
  FileText,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  MessageSquare,
  Video,
  Presentation,
  RefreshCw,
} from 'lucide-react';
import { getActiveServerUrl } from '../utils/serverConfig';
import BuyerCommunicationPanel from './BuyerCommunicationPanel';
import { auth } from '../firebase';

export interface BuyerLead {
  id: string;
  name: string;
  type: 'Strategic Acquirer' | 'Private Equity / Syndicate' | 'Enterprise Customer' | 'Executive Search Agency';
  organization: string;
  contactEmail: string;
  targetDeal: string;
  budgetBand: string;
  status: string;
  escrowReady: boolean;
  notes: string;
  updatedAt: string;
}

function mapServerLeadToBuyerLead(l: any): BuyerLead {
  const tierReq = String(l.tierRequested || '');
  const derivedType: BuyerLead['type'] =
    l.type ||
    (tierReq.includes('agency')
      ? 'Executive Search Agency'
      : tierReq.includes('enterprise')
      ? 'Enterprise Customer'
      : 'Strategic Acquirer');
  return {
    id: String(l.id || ''),
    name: String(l.name || 'Executive Lead'),
    organization: String(l.company || l.organization || 'Enterprise Account'),
    type: derivedType,
    contactEmail: String(l.email || l.contactEmail || ''),
    targetDeal: String(l.targetDeal || tierReq || 'Full IP Buyout ($145,000 USD)'),
    budgetBand: String(l.budgetBand || l.seats || '$145,000 USD'),
    status: String(l.status || 'Lead'),
    escrowReady: l.escrowReady ?? true,
    notes: String(l.notes || ''),
    updatedAt: String(l.updatedAt || l.createdAt || 'Synced'),
  };
}

export default function BuyerCustomerPlatforms() {
  const publishedUrl = getActiveServerUrl();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplaces' | 'customers' | 'crm'>('marketplaces');
  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [isSavingLead, setIsSavingLead] = useState(false);

  // Modal State for New Lead & External Comms
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLeadForOffer, setSelectedLeadForOffer] = useState<BuyerLead | null>(null);
  const [offerActionFeedback, setOfferActionFeedback] = useState<string | null>(null);
  const [commsModalThreadId, setCommsModalThreadId] = useState<string | null>(null);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadOrg, setNewLeadOrg] = useState('');
  const [newLeadType, setNewLeadType] = useState<BuyerLead['type']>('Strategic Acquirer');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadDeal, setNewLeadDeal] = useState('Full IP Buyout ($145,000 USD)');
  const [newLeadBudget, setNewLeadBudget] = useState('$145,000 USD');
  const [newLeadStatus, setNewLeadStatus] = useState<string>('Lead');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  const fetchServerLeads = async () => {
    setIsLoadingLeads(true);
    setCrmError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setCrmError('Sign in with your verified owner account to load the server CRM ledger.');
        return;
      }
      const res = await fetch('/api/owner/buyer-leads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load server buyer CRM leads.');
      }
      const list = Array.isArray(data?.leads) ? data.leads.map(mapServerLeadToBuyerLead) : [];
      setLeads(list);
    } catch (err: any) {
      setCrmError(err?.message || 'Unable to connect to /api/owner/buyer-leads.');
    } finally {
      setIsLoadingLeads(false);
    }
  };

  React.useEffect(() => {
    fetchServerLeads();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadOrg.trim() || !newLeadEmail.trim()) return;

    setIsSavingLead(true);
    setCrmError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Owner authentication token required to record CRM leads.');
      }
      const res = await fetch('/api/owner/buyer-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLeadName.trim(),
          company: newLeadOrg.trim(),
          email: newLeadEmail.trim(),
          tierRequested: newLeadDeal.trim(),
          seats: newLeadBudget.trim(),
          notes: `[${newLeadType} | Stage: ${newLeadStatus}] ${newLeadNotes.trim()}`.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save lead to server CRM ledger.');
      }
      const savedLead = mapServerLeadToBuyerLead(data.lead);
      setLeads((prev) => [savedLead, ...prev]);
      setShowNewLeadModal(false);
      setNewLeadName('');
      setNewLeadOrg('');
      setNewLeadEmail('');
      setNewLeadNotes('');
      setActiveTab('crm');
    } catch (err: any) {
      setCrmError(err?.message || 'Unable to save buyer lead.');
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setCrmError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setCrmError('Owner authentication token required to update CRM status.');
        return;
      }
      const res = await fetch(`/api/owner/buyer-leads/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update lead stage.');
      }
      const updatedLead = mapServerLeadToBuyerLead(data.lead);
      setLeads((prev) => prev.map((l) => (l.id === id ? updatedLead : l)));
      setSelectedLeadForOffer((prev) => (prev && prev.id === id ? updatedLead : prev));
    } catch (err: any) {
      setCrmError(err?.message || 'Unable to update buyer lead status.');
    }
  };

  // Buyer Platforms for Selling the Entire App ($145,000 Buyout)
  const acquisitionMarketplaces = [
    {
      id: 'acquire',
      name: 'Acquire.com (MicroAcquire)',
      category: '#1 Curated Tech & SaaS Marketplace',
      tagline: '350,000+ verified buyers, Private Equity funds, and strategic tech acquirers',
      typicalDealSize: '$25,000 – $10,000,000 USD',
      escrowPartner: 'Escrow.com / Direct Bank Wire',
      listingFee: 'Free listing, buyer pays commission',
      url: 'https://acquire.com',
      listingGuide: `ACQUIRE.COM LISTING DOSSIER // TALENT_RADAR.OS\nAsking Price: $145,000 USD\nAsset Type: SaaS Web Application + Geospatial Radar IP\nTech Stack: React, TypeScript, Three.js, Recharts, Local-First Architecture\nLive URL: ${publishedUrl}\nKey Assets: 100% Unencumbered Git Repository, 3D Shaders, AI Triad Orchestrator, StealthNet ZK Network, Bill of Sale\nEscrow: Escrow.com Wire Ready\nContact: mortyp1125@gmail.com`,
      highlights: [
        'Direct access to institutional tech PE & holding companies',
        'Standardized Letter of Intent (LOI) & APA workflows',
        'Built-in Escrow.com integration for safe fund release',
      ],
    },
    {
      id: 'flippa',
      name: 'Flippa (VIP Tech Brokerage)',
      category: 'Largest Global Digital Asset Marketplace',
      tagline: '3,000,000+ registered buyers and institutional brokers worldwide',
      typicalDealSize: '$10,000 – $2,500,000 USD',
      escrowPartner: 'Flippa Escrow / Escrow.com',
      listingFee: 'Standard listing + success fee upon sale',
      url: 'https://flippa.com/sell',
      listingGuide: `FLIPPA LISTING SUMMARY // GLOBAL TALENT & CAREER RADAR\nBuy It Now Price: $145,000 USD\nReserve Price: $135,000 USD\nCategory: Internet Software & SaaS / AI Careers\nURL: ${publishedUrl}\nCodebase: 25+ Production Components, Zero Compiler Errors\nIncludes: Full source code, deployment assets, intellectual property rights, commercial licenses`,
      highlights: [
        'Global exposure to high-net-worth investors and dev shops',
        'Automated valuation tool and legal contract generation',
        'VIP concierge broker support for deals over $100k',
      ],
    },
    {
      id: 'empire-flippers',
      name: 'Empire Flippers',
      category: 'Vetted Online Business & SaaS Brokerage',
      tagline: 'Hand-vetted buyer pool with guaranteed funds verification before contact',
      typicalDealSize: '$100,000 – $15,000,000 USD',
      escrowPartner: 'Empire Flippers In-House Escrow Vault',
      listingFee: 'Exclusivity fee on successful transfer',
      url: 'https://empireflippers.com',
      listingGuide: `EMPIRE FLIPPERS SUBMISSION BRIEF\nAsset: Talent Radar OS - Geospatial Career Intelligence & StealthNet\nTarget Multiple: 4.8x Annualized Asset Value\nAsking Price: $145,000 USD\nVerification URL: ${publishedUrl}`,
      highlights: [
        'Buyers must deposit 5% liquidity proof before inspecting code',
        'Full M&A broker handles the entire transfer and escrow process',
        'Zero risk of code leaks or unverified tire-kickers',
      ],
    },
    {
      id: 'microns',
      name: 'Microns.io & TinyAcquisitions',
      category: 'Micro-SaaS & Developer Projects Marketplace',
      tagline: 'Thousands of founders and software engineers looking for turnkey tech assets',
      typicalDealSize: '$5,000 – $250,000 USD',
      escrowPartner: 'Escrow.com / Direct Bank Wire',
      listingFee: '0% commission on micro-acquisitions',
      url: 'https://microns.io',
      listingGuide: `MICRONS.IO PROJECT PROFILE\nName: Talent Radar OS\nAsking: $145,000\nReady-to-deploy enterprise career radar with Three.js WebGL globe and anonymous networking.\nDemo: ${publishedUrl}`,
      highlights: [
        'Fast listing approvals (under 24 hours)',
        'Direct connection with tech-native founders & builders',
        'No complicated bureaucratic red tape',
      ],
    },
  ];

  // Target Customer & Subscriber Platforms ($79 - $1,450/mo)
  const targetCustomerSegments = [
    {
      id: 'headhunters',
      name: 'Executive Tech Search & Retained Headhunting Firms',
      platforms: 'LinkedIn Recruiter, TopFunnel, Gem, Riviera Partners, Spencer Stuart',
      tier: 'Enterprise Agency Tier ($1,450 / month)',
      valueProp: 'Access anonymous candidate radar and salary trajectory curves to win high-ticket $400k+ executive placements.',
      sampleTargets: ['Riviera Partners', 'True Search', 'Heidrick & Struggles', 'Daversa Partners'],
      outreachEmail: `Subject: High-yield engineering & quant talent intelligence console\n\nHi [Name],\n\nWe built Talent Radar OS — a 3D geospatial career radar with real-time compensation trajectory modeling and StealthNet anonymous candidate networking.\n\nFirms use our Enterprise console ($1,450/mo) to benchmark executive comp bands ($300k-$600k) and intercept top talent before they hit public boards.\n\nLive demo: ${publishedUrl}\n\nWould you like a 14-day agency access pass?`,
    },
    {
      id: 'frontier-ai',
      name: 'Frontier AI Labs & Foundation Model Developers',
      platforms: 'Direct Head of Talent / VP Engineering at AI Labs',
      tier: 'Enterprise Agency Tier ($1,450 / month)',
      valueProp: 'Source high-priority CUDA, LLM evaluation, and distributed systems architects in stealth mode without public job board clutter.',
      sampleTargets: ['OpenAI Ecosystem', 'Anthropic Labs', 'xAI Research', 'Mistral AI', 'Cohere'],
      outreachEmail: `Subject: Stealth talent radar for distributed compute & CUDA leads\n\nHi [Name],\n\nFinding sub-microsecond CUDA and distributed systems engineers is brutal right now. We engineered Talent Radar OS to intercept high-performing engineers anonymously.\n\nLive system: ${publishedUrl}\n\nCan I set up an enterprise trial for your talent team?`,
    },
    {
      id: 'quant-firms',
      name: 'High-Frequency Trading & Quantitative Hedge Funds',
      platforms: 'Wall Street Oasis, QuantConnect, eFinancialCareers, Direct CTO Outreach',
      tier: 'Enterprise Agency Tier ($1,450 / month)',
      valueProp: 'Model real-time compensation bands ($350k - $550k + carry) across competitive quant trading shops and track talent migration.',
      sampleTargets: ['Citadel Securities', 'Jane Street Capital', 'Two Sigma', 'Hudson River Trading'],
      outreachEmail: `Subject: Quantitative engineering compensation & talent telemetry\n\nHi [Name],\n\nWe published a real-time geospatial intelligence terminal tracking senior quant and low-latency systems compensation curves.\n\nLive URL: ${publishedUrl}\n\nLet me know if your analytics team would like institutional access.`,
    },
    {
      id: 'senior-operators',
      name: 'Senior & Staff+ Tech Engineers ($250k–$600k Earners)',
      platforms: 'Blind, Hacker News, Reddit (r/ExperiencedDevs, r/cscareerquestions), X/Twitter',
      tier: 'Pro Operator Tier ($79 / month)',
      valueProp: 'Track unadvertised high-yield requisitions, run 4-year total compensation models, and network completely anonymously.',
      sampleTargets: ['Staff Engineers', 'Principal Architects', 'Engineering Directors', 'Quant Developers'],
      outreachEmail: `Subject: Stop applying into resume black holes\n\nHey,\n\nBuilt a 3D geospatial career radar with real salary curves and instant alert intercepts:\n${publishedUrl}\n\n100% anonymous networking on StealthNet.`,
    },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#111a22] via-[#162534] to-[#111a22] border border-[#22d3a5]/40 rounded-xl p-5 shadow-[0_0_25px_rgba(34,211,165,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] text-[10px] font-bold border border-[#22d3a5]/40 flex items-center gap-1.5 animate-pulse">
              <Building2 className="w-3.5 h-3.5" />
              BUYER &amp; CUSTOMER ECOSYSTEM
            </span>
            <span className="text-xs text-[#7a8b99]">M&amp;A DEAL FLOW &amp; B2B CLIENT PIPELINE</span>
          </div>
          <h2 className="text-lg font-bold text-[#dce7f0] mt-1">
            Potential Customers &amp; Acquirer Marketplace Platforms
          </h2>
          <p className="text-xs text-[#94a3b8] font-sans mt-0.5 max-w-2xl">
            Where to sell the app for $145,000 cash, where to sign up $1,450/mo enterprise agency customers, and your live buyer relationship pipeline.
          </p>
        </div>

        {/* Action Button: Log New Buyer */}
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs transition shadow-[0_0_15px_rgba(34,211,165,0.25)] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>LOG NEW BUYER / CUSTOMER</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#0a0f14] p-1.5 rounded-lg border border-[#1e2b36] overflow-x-auto">
        <button
          onClick={() => setActiveTab('marketplaces')}
          className={`px-3.5 py-2 rounded-md transition flex items-center gap-2 shrink-0 ${
            activeTab === 'marketplaces'
              ? 'bg-[#22d3a5] text-black font-bold shadow'
              : 'text-[#7a8b99] hover:text-[#dce7f0]'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>1. App Acquirer Marketplaces ($145K Buyout)</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3.5 py-2 rounded-md transition flex items-center gap-2 shrink-0 ${
            activeTab === 'customers'
              ? 'bg-[#38bdf8] text-black font-bold shadow'
              : 'text-[#7a8b99] hover:text-[#dce7f0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. B2B Customer Platforms ($1,450/mo Subscriptions)</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`px-3.5 py-2 rounded-md transition flex items-center gap-2 shrink-0 ${
            activeTab === 'crm'
              ? 'bg-[#fbbf24] text-black font-bold shadow'
              : 'text-[#7a8b99] hover:text-[#dce7f0]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>3. Active Buyer &amp; Customer CRM ({leads.length})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* =========================================================================
          TAB 1: APP ACQUIRER MARKETPLACES ($145K BUYOUT)
         ========================================================================= */}
      {activeTab === 'marketplaces' && (
        <div className="space-y-4">
          <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#22d3a5]" />
                Top Marketplaces to List &amp; Sell Talent Radar OS ($145,000 USD)
              </h3>
              <p className="text-xs text-[#7a8b99] font-sans">
                These platforms host hundreds of thousands of accredited buyers, private equity syndicates, and corporate acquirers looking for turnkey software.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#22d3a5]/10 text-[#22d3a5] text-[11px] font-bold border border-[#22d3a5]/40 shrink-0">
              ESCROW PROTECTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acquisitionMarketplaces.map((market) => (
              <div
                key={market.id}
                className="bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/50 transition rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#1e2b36] pb-3 mb-3">
                    <div>
                      <span className="text-[10px] text-[#22d3a5] font-bold block">{market.category}</span>
                      <h4 className="text-base font-bold text-[#dce7f0]">{market.name}</h4>
                      <p className="text-xs text-[#7a8b99] font-sans mt-0.5">{market.tagline}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#94a3b8] mb-3">
                    <div className="flex items-center justify-between py-1 border-b border-[#1e2b36]/60">
                      <span className="text-[#7a8b99]">Typical Deal Size:</span>
                      <span className="font-bold text-[#dce7f0]">{market.typicalDealSize}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#1e2b36]/60">
                      <span className="text-[#7a8b99]">Escrow Partner:</span>
                      <span className="text-[#22d3a5] font-semibold">{market.escrowPartner}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#7a8b99]">Listing Terms:</span>
                      <span className="text-[#fbbf24]">{market.listingFee}</span>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="space-y-1 bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36] mb-3 text-[11px]">
                    <span className="text-[10px] text-[#7a8b99] block font-bold mb-1">PLATFORM HIGHLIGHTS:</span>
                    {market.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[#dce7f0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e2b36]">
                  <button
                    onClick={() => copyToClipboard(market.listingGuide, `guide-${market.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#2e3e4e] text-[#dce7f0] text-xs transition cursor-pointer"
                  >
                    {copiedKey === `guide-${market.id}` ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === `guide-${market.id}` ? 'DOSSIER COPIED' : 'COPY LISTING DOSSIER'}</span>
                  </button>

                  {market.id === 'acquire' && (
                    <>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-walkthrough-video'))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5] text-[#22d3a5] font-bold text-xs transition cursor-pointer active:scale-95 animate-pulse"
                        title="Generate and export walkthrough video (.webm) for Acquire.com curation review"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>📹 WALKTHROUGH VIDEO</span>
                      </button>

                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-diligence-vault'))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa] text-[#a78bfa] font-bold text-xs transition cursor-pointer active:scale-95 animate-pulse"
                        title="Open M&A Due Diligence Vault: Marketing Spend, Tax Filings (W-8BEN), 10-Slide Pitch Deck (PDF), and Operational Runbooks"
                      >
                        <Presentation className="w-3.5 h-3.5" />
                        <span>📁 BUYER DATA ROOM</span>
                      </button>
                    </>
                  )}

                  <a
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs transition"
                  >
                    <span>OPEN {market.name.split(' ')[0].toUpperCase()}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: B2B CUSTOMER & SUBSCRIBER PLATFORMS ($1,450/mo)
         ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#38bdf8]" />
                Target Customer Segments &amp; Subscription Buyer Platforms
              </h3>
              <p className="text-xs text-[#7a8b99] font-sans">
                These industry client categories have high willingness-to-pay for talent intelligence ($79/mo Pro to $1,450/mo Enterprise Agency subscriptions).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#38bdf8]/10 text-[#38bdf8] text-[11px] font-bold border border-[#38bdf8]/40 shrink-0">
              HIGH MRR VALUE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targetCustomerSegments.map((cust) => (
              <div
                key={cust.id}
                className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="border-b border-[#1e2b36] pb-3 mb-3">
                    <span className="text-[10px] text-[#38bdf8] font-bold block">{cust.tier}</span>
                    <h4 className="text-base font-bold text-[#dce7f0] mt-0.5">{cust.name}</h4>
                    <p className="text-xs text-[#7a8b99] mt-1 font-sans">
                      <strong className="text-[#94a3b8]">Platforms / Channels:</strong> {cust.platforms}
                    </p>
                  </div>

                  <div className="space-y-2 mb-3 text-xs">
                    <div className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#94a3b8] font-sans">
                      <strong className="text-[#22d3a5] block font-mono mb-0.5">CORE VALUE PROPOSITION:</strong>
                      {cust.valueProp}
                    </div>

                    <div className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                      <span className="text-[10px] text-[#7a8b99] block font-bold mb-1">TARGET CLIENT ACCOUNTS:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cust.sampleTargets.map((st, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#dce7f0] text-[10px]">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2b36] flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => copyToClipboard(cust.outreachEmail, `email-${cust.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#38bdf8]/40 text-[#38bdf8] font-bold text-xs transition cursor-pointer"
                  >
                    {copiedKey === `email-${cust.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === `email-${cust.id}` ? 'COPIED' : 'COPY PITCH'}</span>
                  </button>

                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-agency-pilot-modal'))}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8] text-[#38bdf8] font-bold text-xs transition cursor-pointer"
                  >
                    <span>14-DAY AGENCY PASS</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ACTIVE BUYER & CUSTOMER CRM
         ========================================================================= */}
      {activeTab === 'crm' && (
        <div className="space-y-4">
          <div className="bg-[#111a22] border border-[#fbbf24]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div>
              <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#fbbf24]" />
                Live Buyer &amp; Customer Relationship Pipeline
              </h3>
              <p className="text-xs text-[#7a8b99] font-sans">
                Server-persisted acquisition offers, NDAs, and enterprise agency pilot leads.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchServerLeads}
                disabled={isLoadingLeads}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f14] hover:bg-[#162330] border border-[#1e2b36] text-[#dce7f0] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeads ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowNewLeadModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Prospective Acquirer</span>
              </button>
            </div>
          </div>

          {crmError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{crmError}</span>
            </div>
          )}

          {/* CRM Pipeline Table */}
          <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0f14] text-[#7a8b99] border-b border-[#1e2b36] text-[11px]">
                  <tr>
                    <th className="p-3">PROSPECT &amp; ORGANIZATION</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">TARGET DEAL &amp; BUDGET</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ESCROW</th>
                    <th className="p-3 text-right">PIPELINE ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b36]">
                  {isLoadingLeads && leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#38bdf8]">
                        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                        <div className="font-bold text-xs">LOADING SERVER CRM LEDGER...</div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#7a8b99]">
                        <Briefcase className="w-8 h-8 text-[#7a8b99] mx-auto opacity-40 mb-2" />
                        <div className="font-bold text-[#dce7f0] text-sm">No Active Buyer Leads in Pipeline</div>
                        <p className="text-[11px] max-w-md mx-auto mt-1">
                          When recruiters activate the 14-day agency pilot or prospective acquirers submit letters of intent on Acquire.com, they will appear here in your live deal pipeline.
                        </p>
                      </td>
                    </tr>
                  ) : leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#162330] transition">
                        <td className="p-3">
                          <div className="font-bold text-[#dce7f0]">{lead.name}</div>
                          <div className="text-[11px] text-[#7a8b99]">{lead.organization}</div>
                          <div className="text-[10px] text-[#38bdf8] mt-0.5">{lead.contactEmail}</div>
                        </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#dce7f0] text-[10px] border border-[#2e3e4e]">
                          {lead.type}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#fbbf24]">{lead.targetDeal}</div>
                        <div className="text-[10px] text-[#7a8b99]">Cap: {lead.budgetBand}</div>
                      </td>

                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border outline-none cursor-pointer ${
                            lead.status === 'LOI Received'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                              : lead.status === 'Due Diligence'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : lead.status === 'Escrow Funded' || lead.status === 'Closed Won'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : lead.status.includes('Qualified') || lead.status === 'NDA Signed'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          <option value="Lead">Lead</option>
                          <option value="Qualified — Checkout Pending">Qualified — Checkout Pending</option>
                          <option value="Qualified — Outreach Queued">Qualified — Outreach Queued</option>
                          <option value="NDA Signed">NDA Signed</option>
                          <option value="Due Diligence">Due Diligence</option>
                          <option value="LOI Received">LOI Received</option>
                          <option value="Escrow Funded">Escrow Funded</option>
                          <option value="Closed Won">Closed Won</option>
                        </select>
                      </td>

                      <td className="p-3">
                        {lead.escrowReady ? (
                          <span className="flex items-center gap-1 text-[#22d3a5] text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-[#7a8b99] text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const threadMap: Record<string, string> = {
                                'lead-1': 'buyer-thread-1',
                                'lead-2': 'buyer-thread-3',
                                'lead-3': 'buyer-thread-2',
                                'lead-4': 'buyer-thread-4',
                              };
                              setCommsModalThreadId(threadMap[lead.id] || 'buyer-thread-1');
                            }}
                            className="px-2 py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/50 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                            title="Open direct external communication thread with this buyer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Comms</span>
                          </button>
                          <button
                            onClick={() => setSelectedLeadForOffer(lead)}
                            className="px-2.5 py-1 rounded bg-[#22d3a5]/15 hover:bg-[#22d3a5]/30 text-[#22d3a5] border border-[#22d3a5]/50 text-[11px] font-bold transition cursor-pointer"
                          >
                            Review Offer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REVIEW OFFER & ESCROW DEPOSIT ACTION
         ========================================================================= */}
      {selectedLeadForOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111a22] border border-[#22d3a5] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#22d3a5]" />
                <h4 className="text-base font-bold text-[#dce7f0]">
                  REVIEW INBOUND ACQUISITION OFFER
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedLeadForOffer(null);
                  setOfferActionFeedback(null);
                }}
                className="text-[#7a8b99] hover:text-[#dce7f0] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#0a0f14] rounded-lg border border-[#1e2b36] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#7a8b99]">PROSPECT / FIRM:</span>
                <span className="text-[#dce7f0] font-bold">{selectedLeadForOffer.organization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7a8b99]">BUYER REPRESENTATIVE:</span>
                <span className="text-[#dce7f0]">{selectedLeadForOffer.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7a8b99]">PROPOSED TERMS:</span>
                <span className="text-[#fbbf24] font-bold">{selectedLeadForOffer.targetDeal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7a8b99]">CURRENT STAGE:</span>
                <span className="text-[#22d3a5] font-bold">{selectedLeadForOffer.status}</span>
              </div>
              <div className="pt-2 border-t border-[#1e2b36] text-[11px] text-[#94a3b8] font-sans">
                <strong>Buyer Notes:</strong> {selectedLeadForOffer.notes}
              </div>
            </div>

            {offerActionFeedback && (
              <div className="p-3 bg-[#22d3a5]/20 border border-[#22d3a5] rounded-lg text-[#22d3a5] font-bold text-center animate-pulse">
                {offerActionFeedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  handleUpdateStatus(selectedLeadForOffer.id, 'Due Diligence');
                  setOfferActionFeedback('Counter-offer sent for $145,000 firm. Escrow instructions dispatched!');
                }}
                className="p-2.5 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#2e3e4e] text-[#dce7f0] font-bold transition cursor-pointer"
              >
                Send Counter-Offer ($145K)
              </button>

              <button
                onClick={() => {
                  handleUpdateStatus(selectedLeadForOffer.id, 'Escrow Funded');
                  setOfferActionFeedback('LOI Accepted! Escrow.com deposit transaction initiated.');
                }}
                className="p-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold transition shadow cursor-pointer"
              >
                Accept &amp; Open Escrow
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const threadMap: Record<string, string> = {
                  'lead-1': 'buyer-thread-1',
                  'lead-2': 'buyer-thread-3',
                  'lead-3': 'buyer-thread-2',
                  'lead-4': 'buyer-thread-4',
                };
                setCommsModalThreadId(threadMap[selectedLeadForOffer.id] || 'buyer-thread-1');
                setSelectedLeadForOffer(null);
              }}
              className="w-full py-2.5 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/60 text-[#38bdf8] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#38bdf8]" />
              <span>Open External Deal Comms Thread with {selectedLeadForOffer.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW PROSPECTIVE BUYER OR CUSTOMER
         ========================================================================= */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111a22] border border-[#fbbf24] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#fbbf24]" />
                <h4 className="text-base font-bold text-[#dce7f0]">
                  LOG NEW PROSPECTIVE BUYER / CUSTOMER
                </h4>
              </div>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">CONTACT PERSON NAME:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">ORGANIZATION / FIRM:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Strategic Acquisitions LLC"
                  value={newLeadOrg}
                  onChange={(e) => setNewLeadOrg(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">PROSPECT TYPE:</label>
                  <select
                    value={newLeadType}
                    onChange={(e) => setNewLeadType(e.target.value as any)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                  >
                    <option value="Strategic Acquirer">Strategic Acquirer</option>
                    <option value="Private Equity / Syndicate">Private Equity / Syndicate</option>
                    <option value="Enterprise Customer">Enterprise Customer</option>
                    <option value="Executive Search Agency">Executive Search Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">PIPELINE STAGE:</label>
                  <select
                    value={newLeadStatus}
                    onChange={(e) => setNewLeadStatus(e.target.value as any)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                  >
                    <option value="Lead">Lead</option>
                    <option value="NDA Signed">NDA Signed</option>
                    <option value="Due Diligence">Due Diligence</option>
                    <option value="LOI Received">LOI Received</option>
                    <option value="Escrow Funded">Escrow Funded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">TARGET TRANSACTION:</label>
                  <input
                    type="text"
                    value={newLeadDeal}
                    onChange={(e) => setNewLeadDeal(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">BUDGET / CAPACITY:</label>
                  <input
                    type="text"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">CONTACT EMAIL *:</label>
                <input
                  type="email"
                  required
                  placeholder="acquisitions@buyerfirm.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">ACQUISITION / TRIAL NOTES:</label>
                <textarea
                  rows={2}
                  placeholder="Details on their acquisition criteria, timeline, or licensing scope..."
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="px-5 py-2 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-black font-bold cursor-pointer"
                >
                  {isSavingLead ? 'Saving...' : 'Save to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DIRECT EXTERNAL BUYER COMMUNICATION DISPATCH
         ========================================================================= */}
      {commsModalThreadId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-[#0c1218] border border-[#22d3a5] rounded-2xl w-full max-w-6xl shadow-2xl p-4 md:p-6 relative max-h-[92vh] overflow-y-auto">
            <BuyerCommunicationPanel
              initialThreadId={commsModalThreadId}
              isModal
              onClose={() => setCommsModalThreadId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
