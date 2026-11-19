import React, { useState, useMemo } from 'react';
import {
  Scale,
  DollarSign,
  TrendingUp,
  Building2,
  Briefcase,
  Layers,
  Award,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Percent,
  Compass,
  Download,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import { TECH_HUBS_PPP } from '../utils/currencyPppEngine';

export interface OfferProfile {
  id: string;
  employerName: string;
  roleTitle: string;
  hubLocation: string; // id matching TECH_HUBS_PPP
  baseSalary: number;
  bonusPercent: number;
  signOnBonusYr1: number;
  signOnBonusYr2: number;
  equityTotalGrant: number;
  vestingSchedule: 'standard_equal' | 'amazon_backloaded' | 'frontloaded' | 'quarterly_no_cliff';
  stockScenario: 'bear' | 'base' | 'bull' | 'hyper';
  retirementMatch: number;
}

export const INITIAL_OFFERS: OfferProfile[] = [
  {
    id: 'offer_current',
    employerName: 'Current Employer (Baseline)',
    roleTitle: 'Senior Systems Engineer',
    hubLocation: 'sf_bay',
    baseSalary: 215000,
    bonusPercent: 15,
    signOnBonusYr1: 0,
    signOnBonusYr2: 0,
    equityTotalGrant: 280000,
    vestingSchedule: 'standard_equal',
    stockScenario: 'base',
    retirementMatch: 9500,
  },
  {
    id: 'offer_anthropic',
    employerName: 'Frontier AI Lab (Anthropic/OpenAI)',
    roleTitle: 'Staff AI Infrastructure Architect',
    hubLocation: 'sf_bay',
    baseSalary: 295000,
    bonusPercent: 20,
    signOnBonusYr1: 65000,
    signOnBonusYr2: 25000,
    equityTotalGrant: 750000,
    vestingSchedule: 'standard_equal',
    stockScenario: 'bull',
    retirementMatch: 12000,
  },
  {
    id: 'offer_cloud_fintech',
    employerName: 'High-Frequency Fintech / Scaleup',
    roleTitle: 'Principal Distributed Systems Lead',
    hubLocation: 'nyc',
    baseSalary: 320000,
    bonusPercent: 40,
    signOnBonusYr1: 100000,
    signOnBonusYr2: 0,
    equityTotalGrant: 450000,
    vestingSchedule: 'frontloaded',
    stockScenario: 'base',
    retirementMatch: 15000,
  },
];

export default function TotalCompSimulator({
  onSendToNegotiation,
}: {
  onSendToNegotiation?: (compData: { firm: string; base: number; totalComp: number }) => void;
}) {
  const { currency, currencySymbol, formatAmount, toLocal } = useCurrency();
  const [offers, setOffers] = useState<OfferProfile[]>(INITIAL_OFFERS);
  const [activeOfferTab, setActiveOfferTab] = useState<string>(offers[1]?.id || 'offer_anthropic');
  const [comparisonMode, setComparisonMode] = useState<'annual' | 'cumulative'>('annual');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Growth scenario multiplier applied to 4-year equity
  const getGrowthMultiplier = (scenario: OfferProfile['stockScenario'], yrIndex: number) => {
    switch (scenario) {
      case 'bear':
        return Math.pow(0.92, yrIndex); // -8% YoY drop
      case 'bull':
        return Math.pow(1.20, yrIndex); // +20% YoY compound
      case 'hyper':
        return Math.pow(1.40, yrIndex); // +40% YoY hyper-scale
      case 'base':
      default:
        return 1.0;
    }
  };

  // Compute breakdown for an offer
  const computeOfferMetrics = (offer: OfferProfile) => {
    const hub = TECH_HUBS_PPP.find((h) => h.id === offer.hubLocation) || TECH_HUBS_PPP[0];

    // Vesting distribution percentages
    let vestingPercentages = [0.25, 0.25, 0.25, 0.25];
    if (offer.vestingSchedule === 'amazon_backloaded') {
      vestingPercentages = [0.05, 0.15, 0.40, 0.40];
    } else if (offer.vestingSchedule === 'frontloaded') {
      vestingPercentages = [0.35, 0.30, 0.20, 0.15];
    }

    const yearlyData = vestingPercentages.map((pct, idx) => {
      const year = idx + 1;
      const base = offer.baseSalary;
      const bonus = Math.round(base * (offer.bonusPercent / 100));
      const signOn = year === 1 ? offer.signOnBonusYr1 : year === 2 ? offer.signOnBonusYr2 : 0;
      const equity = Math.round(offer.equityTotalGrant * pct * getGrowthMultiplier(offer.stockScenario, idx));
      const match = offer.retirementMatch;

      const totalCash = base + bonus + signOn;
      const totalComp = totalCash + equity + match;
      const netTakeHome = Math.round(totalComp * (1 - hub.taxAverageRate));

      return {
        year: `Year ${year}`,
        yearNum: year,
        base,
        bonus,
        signOn,
        equity,
        match,
        totalCash,
        totalComp,
        netTakeHome,
      };
    });

    const fourYearTotalComp = yearlyData.reduce((acc, curr) => acc + curr.totalComp, 0);
    const avgAnnualComp = Math.round(fourYearTotalComp / 4);
    const yr1TotalComp = yearlyData[0].totalComp;
    const yr1Cash = yearlyData[0].totalCash;
    const fourYearNetTakeHome = yearlyData.reduce((acc, curr) => acc + curr.netTakeHome, 0);

    return {
      offer,
      hub,
      yearlyData,
      fourYearTotalComp,
      avgAnnualComp,
      yr1TotalComp,
      yr1Cash,
      fourYearNetTakeHome,
    };
  };

  const computedOffers = useMemo(() => {
    return offers.map((o) => computeOfferMetrics(o));
  }, [offers]);

  // Determine top winning offer
  const winningOffer = useMemo(() => {
    if (computedOffers.length === 0) return null;
    return [...computedOffers].sort((a, b) => b.fourYearTotalComp - a.fourYearTotalComp)[0];
  }, [computedOffers]);

  // Combined chart comparison data across offers
  const comparisonChartData = useMemo(() => {
    return [1, 2, 3, 4].map((yr) => {
      const point: any = { year: `Year ${yr}` };
      computedOffers.forEach((co) => {
        const yrData = co.yearlyData[yr - 1];
        point[`${co.offer.employerName}`] = toLocal(yrData.totalComp);
      });
      return point;
    });
  }, [computedOffers, toLocal]);

  // Cumulative wealth chart data
  const cumulativeChartData = useMemo(() => {
    let totals: Record<string, number> = {};
    computedOffers.forEach((co) => {
      totals[co.offer.employerName] = 0;
    });

    return [1, 2, 3, 4].map((yr) => {
      const point: any = { year: `End of Yr ${yr}` };
      computedOffers.forEach((co) => {
        const yrData = co.yearlyData[yr - 1];
        totals[co.offer.employerName] += yrData.totalComp;
        point[`${co.offer.employerName}`] = toLocal(totals[co.offer.employerName]);
      });
      return point;
    });
  }, [computedOffers, toLocal]);

  const updateOfferField = (id: string, field: keyof OfferProfile, value: any) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleAddOffer = () => {
    const newId = `offer_${Date.now()}`;
    const newOffer: OfferProfile = {
      id: newId,
      employerName: `New Opportunity ${offers.length + 1}`,
      roleTitle: 'Principal AI Engineer',
      hubLocation: 'sf_bay',
      baseSalary: 260000,
      bonusPercent: 20,
      signOnBonusYr1: 50000,
      signOnBonusYr2: 0,
      equityTotalGrant: 500000,
      vestingSchedule: 'standard_equal',
      stockScenario: 'base',
      retirementMatch: 10000,
    };
    setOffers([...offers, newOffer]);
    setActiveOfferTab(newId);
  };

  const handleRemoveOffer = (id: string) => {
    if (offers.length <= 1) return;
    const filtered = offers.filter((o) => o.id !== id);
    setOffers(filtered);
    if (activeOfferTab === id) {
      setActiveOfferTab(filtered[0].id);
    }
  };

  const handleCopySummary = () => {
    let summary = `=== TOTAL COMPENSATION & COUNTER-OFFER COMPARISON ===\nGenerated via AI Talent Radar Terminal 2026\n\n`;
    computedOffers.forEach((co, idx) => {
      summary += `${idx + 1}. ${co.offer.employerName} (${co.offer.roleTitle}) - ${co.hub.cityName}\n`;
      summary += `   • Base Salary: $${co.offer.baseSalary.toLocaleString()}\n`;
      summary += `   • Year 1 Cash: $${co.yr1Cash.toLocaleString()}\n`;
      summary += `   • Avg Annual Total Comp (TTC): $${co.avgAnnualComp.toLocaleString()}\n`;
      summary += `   • 4-Year Cumulative Total: $${co.fourYearTotalComp.toLocaleString()}\n`;
      summary += `   • 4-Year Net Take-Home (Tax Adjusted): $${co.fourYearNetTakeHome.toLocaleString()}\n\n`;
    });
    if (winningOffer) {
      summary += `WINNER: ${winningOffer.offer.employerName} provides the highest 4-Year TC ($${winningOffer.fourYearTotalComp.toLocaleString()}).\n`;
    }
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const activeOfferObj = computedOffers.find((co) => co.offer.id === activeOfferTab) || computedOffers[0];

  const chartColors = ['#22d3a5', '#38bdf8', '#fbbf24', '#a78bfa'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="panel bg-gradient-to-br from-[#111a22] via-[#0d1620] to-[#162738] border border-[#1e2b36] rounded-xl p-5 shadow-xl font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold">
                FINANCIAL SIMULATION OS
              </span>
              <span className="text-xs text-[#7a8b99]">
                SIDE-BY-SIDE MULTI-OFFER VALUATION MATRIX
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#dce7f0] mt-1 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#22d3a5]" />
              TOTAL COMP (TC) &amp; COUNTER-OFFER ARBITRAGE SIMULATOR
            </h2>
            <p className="text-xs text-[#7a8b99] mt-0.5">
              Stress-test competing packages across 4-year equity vesting cliffs, stock scenarios, and regional tax brackets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-semibold text-[#dce7f0] transition cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5 text-[#7a8b99]" />}
              <span>{copiedSummary ? 'COPIED SUMMARY' : 'COPY SUMMARY'}</span>
            </button>
            <button
              onClick={handleAddOffer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.2)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD COMPETING OFFER</span>
            </button>
          </div>
        </div>

        {/* Winner Highlight Strip */}
        {winningOffer && (
          <div className="mt-4 p-3 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#22d3a5]/20 text-[#22d3a5]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#22d3a5]">TOP VALUATION LEADER: </span>
                <span className="text-[#dce7f0] font-semibold">{winningOffer.offer.employerName}</span>
                <span className="text-[#7a8b99] ml-2">
                  (Annualized TC: <strong className="text-[#22d3a5]">{formatAmount(winningOffer.avgAnnualComp)}/yr</strong> • 4-Yr Total:{' '}
                  <strong className="text-[#22d3a5]">{formatAmount(winningOffer.fourYearTotalComp)}</strong>)
                </span>
              </div>
            </div>
            {onSendToNegotiation && (
              <button
                onClick={() =>
                  onSendToNegotiation({
                    firm: winningOffer.offer.employerName,
                    base: winningOffer.offer.baseSalary,
                    totalComp: winningOffer.avgAnnualComp,
                  })
                }
                className="px-3 py-1 rounded bg-[#22d3a5] text-black font-bold hover:bg-[#1db890] transition shrink-0 cursor-pointer"
              >
                TACTICAL COUNTER SCRIPT →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Offer Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {computedOffers.map((co, idx) => {
          const isSelected = co.offer.id === activeOfferTab;
          const isWinner = winningOffer?.offer.id === co.offer.id;
          return (
            <div
              key={co.offer.id}
              onClick={() => setActiveOfferTab(co.offer.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs cursor-pointer transition shrink-0 ${
                isSelected
                  ? 'bg-[#162738] border-[#22d3a5] text-[#dce7f0] shadow-[0_0_15px_rgba(34,211,165,0.15)]'
                  : 'bg-[#0f171e] border-[#1e2b36] text-[#7a8b99] hover:border-[#7a8b99]/40'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: chartColors[idx % chartColors.length] }}
              />
              <span className="font-bold">{co.offer.employerName}</span>
              <span className="text-[10px] text-[#22d3a5] font-semibold">
                {formatAmount(co.avgAnnualComp, true)}/yr
              </span>
              {isWinner && (
                <span className="px-1 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] text-[9px] font-bold">
                  WINNER
                </span>
              )}
              {offers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOffer(co.offer.id);
                  }}
                  className="p-1 rounded text-[#7a8b99] hover:text-red-400 hover:bg-[#1e2b36] transition ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Offer Details & Config Form */}
      {activeOfferObj && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
          {/* Inputs Column */}
          <div className="lg:col-span-1 space-y-4 bg-[#0f171e] border border-[#1e2b36] rounded-xl p-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
              <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#38bdf8]" />
                OFFER PARAMETERS
              </h3>
              <span className="text-[10px] text-[#7a8b99]">LIVE PARAMETERS</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#7a8b99] block mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={activeOfferObj.offer.employerName}
                  onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'employerName', e.target.value)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                />
              </div>

              <div>
                <label className="text-[#7a8b99] block mb-1">Role Title</label>
                <input
                  type="text"
                  value={activeOfferObj.offer.roleTitle}
                  onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'roleTitle', e.target.value)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                />
              </div>

              <div>
                <label className="text-[#7a8b99] block mb-1">Hub Location (Taxes &amp; Living Cost)</label>
                <select
                  value={activeOfferObj.offer.hubLocation}
                  onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'hubLocation', e.target.value)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                >
                  {TECH_HUBS_PPP.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.cityName} ({(hub.taxAverageRate * 100).toFixed(0)}% Tax)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#7a8b99] block mb-1">Base Salary (USD)</label>
                  <input
                    type="number"
                    value={activeOfferObj.offer.baseSalary}
                    onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'baseSalary', Number(e.target.value))}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#7a8b99] block mb-1">Annual Bonus (%)</label>
                  <input
                    type="number"
                    value={activeOfferObj.offer.bonusPercent}
                    onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'bonusPercent', Number(e.target.value))}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#7a8b99] block mb-1">Yr 1 Sign-On Bonus</label>
                  <input
                    type="number"
                    value={activeOfferObj.offer.signOnBonusYr1}
                    onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'signOnBonusYr1', Number(e.target.value))}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#7a8b99] block mb-1">Yr 2 Sign-On Bonus</label>
                  <input
                    type="number"
                    value={activeOfferObj.offer.signOnBonusYr2}
                    onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'signOnBonusYr2', Number(e.target.value))}
                    className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#7a8b99] block mb-1">4-Year Total Equity Grant (USD)</label>
                <input
                  type="number"
                  value={activeOfferObj.offer.equityTotalGrant}
                  onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'equityTotalGrant', Number(e.target.value))}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#22d3a5] focus:border-[#22d3a5] outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[#7a8b99] block mb-1">Vesting Schedule Structure</label>
                <select
                  value={activeOfferObj.offer.vestingSchedule}
                  onChange={(e) => updateOfferField(activeOfferObj.offer.id, 'vestingSchedule', e.target.value as any)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                >
                  <option value="standard_equal">Standard Equal (25% / 25% / 25% / 25%)</option>
                  <option value="amazon_backloaded">Amazon Backloaded (5% / 15% / 40% / 40%)</option>
                  <option value="frontloaded">Frontloaded (35% / 30% / 20% / 15%)</option>
                  <option value="quarterly_no_cliff">Quarterly No-Cliff (25% / 25% / 25% / 25%)</option>
                </select>
              </div>

              <div>
                <label className="text-[#7a8b99] block mb-1">Stock Scenario Sensitivity</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['bear', 'base', 'bull', 'hyper'] as const).map((scen) => (
                    <button
                      key={scen}
                      onClick={() => updateOfferField(activeOfferObj.offer.id, 'stockScenario', scen)}
                      className={`py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer border ${
                        activeOfferObj.offer.stockScenario === scen
                          ? scen === 'bear'
                            ? 'bg-red-500/20 text-red-400 border-red-500'
                            : scen === 'bull'
                            ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                            : scen === 'hyper'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                            : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                          : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36]'
                      }`}
                    >
                      {scen}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown & Visualizations */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#0f171e] border border-[#1e2b36]">
                <div className="text-[10px] text-[#7a8b99]">Avg Annual TC (TTC)</div>
                <div className="text-lg font-bold text-[#22d3a5] mt-0.5">
                  {formatAmount(activeOfferObj.avgAnnualComp)}
                </div>
                <div className="text-[10px] text-[#7a8b99]">/ year annualized</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f171e] border border-[#1e2b36]">
                <div className="text-[10px] text-[#7a8b99]">Year 1 Liquid Cash</div>
                <div className="text-lg font-bold text-[#38bdf8] mt-0.5">
                  {formatAmount(activeOfferObj.yr1Cash)}
                </div>
                <div className="text-[10px] text-[#7a8b99]">Base + Bonus + Sign-on</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f171e] border border-[#1e2b36]">
                <div className="text-[10px] text-[#7a8b99]">4-Year Cumulative Total</div>
                <div className="text-lg font-bold text-[#fbbf24] mt-0.5">
                  {formatAmount(activeOfferObj.fourYearTotalComp)}
                </div>
                <div className="text-[10px] text-[#7a8b99]">Full contract value</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f171e] border border-[#1e2b36]">
                <div className="text-[10px] text-[#7a8b99]">4-Yr Net Take-Home</div>
                <div className="text-lg font-bold text-[#a78bfa] mt-0.5">
                  {formatAmount(activeOfferObj.fourYearNetTakeHome)}
                </div>
                <div className="text-[10px] text-[#7a8b99]">
                  {(activeOfferObj.hub.taxAverageRate * 100).toFixed(0)}% tax bracket
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Chart */}
            <div className="p-4 rounded-xl bg-[#0f171e] border border-[#1e2b36]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e2b36]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#22d3a5]" />
                  <h4 className="text-xs font-bold text-[#dce7f0]">
                    {comparisonMode === 'annual'
                      ? 'YEAR-BY-YEAR TOTAL COMPENSATION COMPARISON'
                      : '4-YEAR CUMULATIVE WEALTH ACCUMULATION'}
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-[#111a22] p-1 rounded-lg border border-[#1e2b36]">
                  <button
                    onClick={() => setComparisonMode('annual')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      comparisonMode === 'annual'
                        ? 'bg-[#22d3a5] text-black'
                        : 'text-[#7a8b99] hover:text-[#dce7f0]'
                    }`}
                  >
                    Annual TC
                  </button>
                  <button
                    onClick={() => setComparisonMode('cumulative')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      comparisonMode === 'cumulative'
                        ? 'bg-[#22d3a5] text-black'
                        : 'text-[#7a8b99] hover:text-[#dce7f0]'
                    }`}
                  >
                    Cumulative Wealth
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {comparisonMode === 'annual' ? (
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                      <XAxis dataKey="year" stroke="#7a8b99" fontSize={11} />
                      <YAxis
                        stroke="#7a8b99"
                        fontSize={11}
                        tickFormatter={(val) => `${currencySymbol}${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111a22', borderColor: '#1e2b36', borderRadius: 8 }}
                        formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {computedOffers.map((co, idx) => (
                        <Bar
                          key={co.offer.id}
                          dataKey={co.offer.employerName}
                          fill={chartColors[idx % chartColors.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={cumulativeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                      <XAxis dataKey="year" stroke="#7a8b99" fontSize={11} />
                      <YAxis
                        stroke="#7a8b99"
                        fontSize={11}
                        tickFormatter={(val) => `${currencySymbol}${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111a22', borderColor: '#1e2b36', borderRadius: 8 }}
                        formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {computedOffers.map((co, idx) => (
                        <Line
                          key={co.offer.id}
                          type="monotone"
                          dataKey={co.offer.employerName}
                          stroke={chartColors[idx % chartColors.length]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-by-Year Stacked Table for Active Offer */}
            <div className="p-4 rounded-xl bg-[#0f171e] border border-[#1e2b36] overflow-x-auto">
              <h4 className="text-xs font-bold text-[#dce7f0] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#fbbf24]" />
                YEAR-BY-YEAR STREAM BREAKDOWN: {activeOfferObj.offer.employerName}
              </h4>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#1e2b36] text-[#7a8b99] text-[10px] uppercase">
                    <th className="py-2">Period</th>
                    <th className="py-2">Base Salary</th>
                    <th className="py-2">Target Bonus</th>
                    <th className="py-2">Sign-On</th>
                    <th className="py-2">Equity Vest</th>
                    <th className="py-2 font-bold text-[#22d3a5]">Total Comp</th>
                    <th className="py-2 text-[#38bdf8]">Est. Net Take-Home</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b36]/60">
                  {activeOfferObj.yearlyData.map((yr) => (
                    <tr key={yr.year} className="hover:bg-[#111a22]/50">
                      <td className="py-2 font-bold text-[#dce7f0]">{yr.year}</td>
                      <td className="py-2 text-[#7a8b99]">{formatAmount(yr.base)}</td>
                      <td className="py-2 text-[#7a8b99]">{formatAmount(yr.bonus)}</td>
                      <td className="py-2 text-[#7a8b99]">{yr.signOn > 0 ? formatAmount(yr.signOn) : '—'}</td>
                      <td className="py-2 text-[#a78bfa] font-semibold">{formatAmount(yr.equity)}</td>
                      <td className="py-2 font-bold text-[#22d3a5]">{formatAmount(yr.totalComp)}</td>
                      <td className="py-2 text-[#38bdf8] font-semibold">{formatAmount(yr.netTakeHome)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
