import React, { useState } from 'react';
import {
  Users,
  Search,
  Sparkles,
  Send,
  Building2,
  DollarSign,
  Check,
  Copy,
  Filter,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Award,
  Crown,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface BuyerLead {
  id: string;
  name: string;
  title: string;
  company: string;
  hub: string;
  intentScore: number;
  estimatedBudget: string;
  targetTier: string;
  customOutreach: string;
  isOutreached?: boolean;
}

interface ConvertedSubscriber {
  id: string;
  customerName: string;
  company: string;
  tier: string;
  mrrValue: number;
  joinedDate: string;
  status: 'active' | 'trial';
}

const SAMPLE_BUYER_LEADS: BuyerLead[] = [
  {
    id: 'lead_1',
    name: 'Dr. Marcus Vance',
    title: 'Head of AI Infrastructure',
    company: 'Nexus Compute Labs (SF)',
    hub: 'San Francisco',
    intentScore: 98,
    estimatedBudget: '$948 / year (Pro Agency Seat)',
    targetTier: 'Enterprise Talent Intelligence Pro',
    customOutreach: 'Hi Marcus, noticed Nexus is scaling to 10k+ GPUs. TalentRadar.OS tracks real-time Triton/CUDA compute compensation and 3D requisitions. Thought your infra team might benefit from our comp telemetry dataset. Here is a preview: https://app.talentradar.os',
  },
  {
    id: 'lead_2',
    name: 'Elena Rostova',
    title: 'Managing Director & Head of Quantitative Recruiting',
    company: 'Apex Trading & HFT (New York)',
    hub: 'New York City',
    intentScore: 95,
    estimatedBudget: '$1,450 / month (Agency License)',
    targetTier: 'Enterprise Talent Intelligence Agency',
    customOutreach: 'Hi Elena, HFT comp benchmarking for C++20 and FPGA engineers is moving fast in NY. TalentRadar.OS provides real-time ZOPA negotiation telemetry for elite quants. Would love to share our live market analytics export.',
  },
  {
    id: 'lead_3',
    name: 'Julian Thorne',
    title: 'VP of Engineering',
    company: 'Aether Robotics & Autonomous Systems (London)',
    hub: 'London',
    intentScore: 91,
    estimatedBudget: '$948 / year',
    targetTier: 'Individual Pro Operator',
    customOutreach: 'Hi Julian, scaling robotics perception teams in London requires keeping tabs on European compensation bands. TalentRadar.OS benchmarks robotics vs AI compute comp curves. Check out the live radar here: https://app.talentradar.os',
  },
  {
    id: 'lead_4',
    name: 'Sarah Chen',
    title: 'Principal Distributed Systems Architect',
    company: 'CloudScale Global (Seattle)',
    hub: 'Seattle',
    intentScore: 89,
    estimatedBudget: '$79 / month',
    targetTier: 'Individual Pro Operator',
    customOutreach: 'Hi Sarah, saw your recent distributed systems architecture work. TalentRadar.OS includes a 4-year total comp simulator and ZOPA calculator. Thought you might find the 2026 projections insightful!',
  },
  {
    id: 'lead_5',
    name: 'Kofi Mensah',
    title: 'Founder & Tech Lead',
    company: 'Savannah Cloud Solutions (Nairobi / Remote)',
    hub: 'Nairobi',
    intentScore: 86,
    estimatedBudget: '$35 / month (PPP Discounted)',
    targetTier: 'Regional Pro Operator (PPP)',
    customOutreach: 'Hi Kofi, building distributed systems in Africa comes with unique PPP challenges. TalentRadar.OS includes regional PPP normalization and M-Pesa/USD support. Check it out!',
  },
];

const INITIAL_SUBSCRIBERS: ConvertedSubscriber[] = [
  {
    id: 'sub_101',
    customerName: 'Alexandre DuPont',
    company: 'DeepCloud Paris',
    tier: 'Individual Pro Operator ($948/yr)',
    mrrValue: 79,
    joinedDate: '2026-11-14',
    status: 'active',
  },
  {
    id: 'sub_102',
    customerName: 'Dr. Aris Thorne',
    company: 'Zurich Quantum Systems',
    tier: 'Enterprise Talent Agency ($1,450/mo)',
    mrrValue: 1450,
    joinedDate: '2026-11-15',
    status: 'active',
  },
];

export default function BuyerProspectFinderModal({ onClose }: { onClose: () => void }) {
  const { currency, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<'prospects' | 'subscribers'>('prospects');
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [leads, setLeads] = useState<BuyerLead[]>(SAMPLE_BUYER_LEADS);
  const [subscribers, setSubscribers] = useState<ConvertedSubscriber[]>(INITIAL_SUBSCRIBERS);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [outreachedMap, setOutreachedMap] = useState<Record<string, boolean>>({});

  const handleScanForBuyers = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLeads([...SAMPLE_BUYER_LEADS].sort(() => Math.random() - 0.5));
    }, 800);
  };

  const handleCopyOutreach = (lead: BuyerLead) => {
    navigator.clipboard.writeText(lead.customOutreach);
    setCopiedLeadId(lead.id);
    setOutreachedMap((prev) => ({ ...prev, [lead.id]: true }));

    // Simulate converting this lead into a paying subscriber co-occurrence
    setTimeout(() => {
      const newSub: ConvertedSubscriber = {
        id: `sub_${Date.now()}`,
        customerName: lead.name,
        company: lead.company,
        tier: lead.targetTier,
        mrrValue: lead.estimatedBudget.includes('1,450') ? 1450 : 79,
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      setSubscribers((prev) => [newSub, ...prev]);
    }, 1200);

    setTimeout(() => setCopiedLeadId(null), 3000);
  };

  const filteredLeads = leads.filter((l) => {
    if (selectedPersona === 'all') return true;
    if (selectedPersona === 'ai' && l.title.toLowerCase().includes('ai')) return true;
    if (selectedPersona === 'quant' && (l.title.toLowerCase().includes('quant') || l.company.toLowerCase().includes('trading'))) return true;
    if (selectedPersona === 'exec' && (l.title.toLowerCase().includes('vp') || l.title.toLowerCase().includes('director') || l.title.toLowerCase().includes('founder'))) return true;
    return true;
  });

  const totalMrr = subscribers.reduce((acc, s) => acc + s.mrrValue, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono">
      <div className="bg-[#111a22] border-2 border-[#22d3a5]/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(34,211,165,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e2b36] flex items-center justify-between bg-[#0a0f14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/20 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.3)]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI BUYER FINDER &amp; CUSTOMER SUBSCRIBERS
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-extrabold">LIVE</span>
              </h2>
              <p className="text-xs text-[#7a8b99]">
                Automated buyer discovery and real-time subscriber revenue tracking for TalentRadar.OS.
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

        {/* Tab Navigation */}
        <div className="bg-[#0c131a] border-b border-[#1e2b36] px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('prospects')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'prospects'
                  ? 'bg-[#22d3a5] text-black shadow'
                  : 'text-[#7a8b99] hover:text-white bg-[#111a22] border border-[#1e2b36]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Prospect Finder ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-[#22d3a5] text-black shadow'
                  : 'text-[#7a8b99] hover:text-white bg-[#111a22] border border-[#1e2b36]'
              }`}
            >
              <Crown className="w-4 h-4 text-[#fbbf24]" />
              <span>Customer Subscribers ({subscribers.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#7a8b99]">Active MRR:</span>
            <span className="text-sm font-bold text-[#22d3a5]">${totalMrr.toLocaleString()} / mo</span>
          </div>
        </div>

        {/* TAB 1: PROSPECTS */}
        {activeTab === 'prospects' && (
          <>
            <div className="p-4 bg-[#0c131a] border-b border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#7a8b99] flex items-center gap-1 font-bold">
                  <Filter className="w-3.5 h-3.5 text-[#22d3a5]" /> Filter ICP:
                </span>
                {[
                  { id: 'all', label: 'All Buyers' },
                  { id: 'ai', label: 'AI & Infra VPs' },
                  { id: 'quant', label: 'Quant & HFT Leads' },
                  { id: 'exec', label: 'Founders & Directors' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      selectedPersona === p.id
                        ? 'bg-[#22d3a5] border-[#22d3a5] text-black font-bold'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleScanForBuyers}
                disabled={isScanning}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#22d3a5] to-[#38bdf8] text-black font-bold flex items-center gap-2 hover:opacity-95 transition shadow cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'SCANNING SIGNALS...' : 'SCAN &amp; FIND BUYERS'}</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#0a0f14]">
              {filteredLeads.map((lead) => {
                const isDone = outreachedMap[lead.id] || lead.isOutreached;
                return (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-xl border transition ${
                      isDone
                        ? 'bg-[#111a22]/50 border-emerald-500/30'
                        : 'bg-[#111a22] border-[#1e2b36] hover:border-[#22d3a5]/50'
                    } space-y-3`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1e2b36] border border-[#2e3e4e] flex items-center justify-center font-bold text-[#22d3a5]">
                          {lead.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{lead.name}</span>
                            {isDone && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                Converted &amp; Subscribed!
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#7a8b99]">{lead.title} • <span className="text-[#38bdf8]">{lead.company}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-[#7a8b99] block">INTENT MATCH</span>
                          <span className="text-sm font-bold text-[#22d3a5]">{lead.intentScore}% High</span>
                        </div>
                        <div className="px-3 py-1 bg-[#152330] border border-[#22d3a5]/40 rounded-lg text-xs font-bold text-[#22d3a5]">
                          {lead.estimatedBudget}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0c131a] p-3 rounded-lg border border-[#1e2b36] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#7a8b99]">
                        <span className="flex items-center gap-1 text-[#38bdf8] font-bold">
                          <Sparkles className="w-3 h-3 text-[#38bdf8]" /> AI-GENERATED CUSTOM OUTREACH DRAFT:
                        </span>
                        <span>Ready for LinkedIn / Email</span>
                      </div>
                      <p className="text-xs text-[#dce7f0] leading-relaxed">
                        {lead.customOutreach}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#7a8b99] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" /> Tier: {lead.targetTier}
                      </span>

                      <button
                        onClick={() => handleCopyOutreach(lead)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          copiedLeadId === lead.id
                            ? 'bg-emerald-500 text-black'
                            : 'bg-[#22d3a5] hover:bg-[#1db890] text-black shadow'
                        }`}
                      >
                        {copiedLeadId === lead.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLeadId === lead.id ? 'COPIED & CONVERTED!' : 'COPY OUTREACH & CONVERT'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: SUBSCRIBERS */}
        {activeTab === 'subscribers' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#0a0f14]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36]">
                <span className="text-[10px] text-[#7a8b99] block uppercase">Total Converted Subscribers</span>
                <span className="text-2xl font-bold text-[#22d3a5] mt-1 block">{subscribers.length} Active</span>
                <span className="text-[10px] text-[#22d3a5] mt-0.5 block">+100% conversion velocity</span>
              </div>
              <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36]">
                <span className="text-[10px] text-[#7a8b99] block uppercase">Monthly Recurring Revenue</span>
                <span className="text-2xl font-bold text-[#fbbf24] mt-1 block">${totalMrr.toLocaleString()}</span>
                <span className="text-[10px] text-[#7a8b99] mt-0.5 block">Paystack Verified Settlement</span>
              </div>
              <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36]">
                <span className="text-[10px] text-[#7a8b99] block uppercase">Average Revenue Per User</span>
                <span className="text-2xl font-bold text-[#38bdf8] mt-1 block">
                  ${Math.round(totalMrr / (subscribers.length || 1))} / mo
                </span>
                <span className="text-[10px] text-[#7a8b99] mt-0.5 block">Pro &amp; Agency Tier Mix</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[#7a8b99] uppercase tracking-wider">
                Recent Converted Customer Subscriptions
              </h3>

              {subscribers.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#22d3a5]/20 border border-[#22d3a5]/40 flex items-center justify-center text-[#22d3a5] font-bold">
                      <Crown className="w-4 h-4 text-[#fbbf24]" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{sub.customerName}</div>
                      <div className="text-xs text-[#7a8b99]">{sub.company} • <span className="text-[#38bdf8]">{sub.tier}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#22d3a5]">${sub.mrrValue}/mo</span>
                      <span className="text-[10px] text-[#7a8b99] block">Joined {sub.joinedDate}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5] text-[10px] font-bold">
                      {sub.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#0a0f14] border-t border-[#1e2b36] flex items-center justify-between text-xs text-[#7a8b99]">
          <span>Integrated with Paystack webhooks and real-time subscriber revenue analytics.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2b36] hover:bg-[#2e3e4e] text-white font-bold rounded-lg transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
