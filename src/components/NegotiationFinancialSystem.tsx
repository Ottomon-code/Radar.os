import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Sliders,
  Scale,
  ShieldCheck,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  OfferBreakdown,
  DEFAULT_OFFERS,
  computeYearByYear,
  calculateZopa,
  VestingType,
  EquityType,
} from '../utils/negotiationFinanceEngine';

interface NegotiationFinancialSystemProps {
  onSendToEnvoy?: (counterScript: string) => void;
  onSendToStrategist?: (targetComp: number) => void;
}

export default function NegotiationFinancialSystem({
  onSendToEnvoy,
  onSendToStrategist,
}: NegotiationFinancialSystemProps) {
  const [activeTab, setActiveTab] = useState<'ttc_model' | 'zopa_batna' | 'arbitrage' | 'riders'>('ttc_model');

  // Single Offer State for TTC Model
  const [offer, setOffer] = useState<OfferBreakdown>(DEFAULT_OFFERS[0]);

  // ZOPA State
  const [employerInitial, setEmployerInitial] = useState(270000);
  const [candidateFloor, setCandidateFloor] = useState(285000);
  const [hasCompetingLeverage, setHasCompetingLeverage] = useState(true);

  // Copied indicator for riders
  const [copiedRiderId, setCopiedRiderId] = useState<string | null>(null);

  // Computed Year-by-Year data
  const yearData = computeYearByYear(offer);
  const total4YrComp = yearData[yearData.length - 1]?.cumulativeTotal || 0;
  const avgAnnualComp = Math.round(total4YrComp / 4);
  const year1Cash = yearData[0]?.totalCash || 0;

  // Computed ZOPA
  const zopa = calculateZopa(employerInitial, candidateFloor, 290000, hasCompetingLeverage);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRiderId(id);
    setTimeout(() => setCopiedRiderId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Financial System Header Banner */}
      <div className="panel bg-gradient-to-br from-[#111a22] via-[#0d1620] to-[#162738] border border-[#1e2b36] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold tracking-wider">
                QUANTITATIVE FINANCIAL OS
              </span>
              <span className="text-xs font-mono text-[#7a8b99]">
                BUILT-IN NEGOTIATION VALUATION MATRIX
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-[#dce7f0] mt-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#22d3a5]" />
              EXECUTIVE COMPENSATION &amp; ZOPA FINANCIAL ENGINE
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
              Multi-variable Net Present Value (NPV), equity compounding models, and game-theoretic bargaining surplus calculators.
            </p>
          </div>

          {/* Module Selector Navigation */}
          <div className="flex items-center gap-1.5 bg-[#0a0f14] p-1.5 rounded-lg border border-[#1e2b36] text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setActiveTab('ttc_model')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ttc_model'
                  ? 'bg-[#22d3a5] text-black font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>4-Yr TTC &amp; NPV</span>
            </button>

            <button
              onClick={() => setActiveTab('zopa_batna')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'zopa_batna'
                  ? 'bg-[#3b82f6] text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>ZOPA &amp; BATNA</span>
            </button>

            <button
              onClick={() => setActiveTab('arbitrage')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'arbitrage'
                  ? 'bg-[#fbbf24] text-black font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Offer Arbitrage</span>
            </button>

            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'riders'
                  ? 'bg-purple-500 text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contract Riders</span>
            </button>
          </div>
        </div>

        {/* Top Ticker Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">4-YEAR TOTAL VALUE (NPV)</span>
            <span className="text-lg font-bold text-[#22d3a5]">
              ${total4YrComp.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">ANNUALIZED AVERAGE COMP</span>
            <span className="text-lg font-bold text-[#3b82f6]">
              ${avgAnnualComp.toLocaleString()} / yr
            </span>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">YEAR 1 CASH LIQUIDITY</span>
            <span className="text-lg font-bold text-[#dce7f0]">
              ${year1Cash.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">ZOPA SURPLUS ZONE</span>
            <span className="text-lg font-bold text-[#fbbf24]">
              +${zopa.zopaSpread.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* MODULE 1: TOTAL TARGET COMP & 4-YEAR NPV MODELER */}
      {activeTab === 'ttc_model' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Form */}
          <div className="lg:col-span-5 panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
              <span className="font-bold text-[#dce7f0] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#22d3a5]" />
                COMPENSATION ARCHITECTURE INPUTS
              </span>
              <span className="text-[10px] text-[#7a8b99]">CALIBRATE TERMS</span>
            </div>

            <div>
              <label className="block text-[11px] text-[#7a8b99] mb-1">
                FIRM &amp; PROPOSED ROLE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={offer.firmName}
                  onChange={(e) => setOffer({ ...offer, firmName: e.target.value })}
                  placeholder="Firm Name"
                  className="bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
                <input
                  type="text"
                  value={offer.roleTitle}
                  onChange={(e) => setOffer({ ...offer, roleTitle: e.target.value })}
                  placeholder="Role Title"
                  className="bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  BASE SALARY ($)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={offer.baseSalary}
                  onChange={(e) => setOffer({ ...offer, baseSalary: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5] font-semibold rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  PERF BONUS (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={offer.annualBonusPercent}
                  onChange={(e) => setOffer({ ...offer, annualBonusPercent: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  SIGN-ON BONUS ($)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={offer.signOnBonus}
                  onChange={(e) => setOffer({ ...offer, signOnBonus: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  4-YR EQUITY GRANT ($)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={offer.equityTotalGrant}
                  onChange={(e) => setOffer({ ...offer, equityTotalGrant: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#3b82f6] font-semibold rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  VESTING SCHEDULE
                </label>
                <select
                  value={offer.vestingSchedule}
                  onChange={(e) => setOffer({ ...offer, vestingSchedule: e.target.value as VestingType })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none text-xs"
                >
                  <option value="standard_equal">Standard (25/25/25/25)</option>
                  <option value="amazon_backloaded">Backloaded (5/15/40/40)</option>
                  <option value="frontloaded">Frontloaded (35/30/20/15)</option>
                  <option value="quarterly_no_cliff">No-Cliff Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  EQUITY GROWTH (%/YR)
                </label>
                <input
                  type="number"
                  value={offer.annualEquityGrowthRate}
                  onChange={(e) => setOffer({ ...offer, annualEquityGrowthRate: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#1e2b36]">
              <span className="text-[#7a8b99] text-[11px]">DOUBLE-TRIGGER ACCELERATION:</span>
              <button
                type="button"
                onClick={() => setOffer({ ...offer, hasDoubleTrigger: !offer.hasDoubleTrigger })}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                  offer.hasDoubleTrigger
                    ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                    : 'bg-[#1e2b36] text-[#7a8b99] border-transparent'
                }`}
              >
                {offer.hasDoubleTrigger ? 'INCLUDED (SECURE)' : 'EXCLUDED (RISK)'}
              </button>
            </div>

            {/* Quick Action to AI Triad */}
            <div className="pt-3 border-t border-[#1e2b36] flex gap-2">
              {onSendToStrategist && (
                <button
                  onClick={() => onSendToStrategist(avgAnnualComp)}
                  className="flex-1 py-2 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#3b82f6] border border-[#3b82f6]/40 flex items-center justify-center gap-1.5 transition text-xs"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Sync to Strategist</span>
                </button>
              )}
            </div>
          </div>

          {/* Visual 4-Year Stacked Realization Chart */}
          <div className="lg:col-span-7 panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2b36]">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#22d3a5]" />
                    4-YEAR ANNUALIZED CASH VS. EQUITY STACK
                  </h3>
                  <p className="text-xs text-[#7a8b99] font-mono">
                    Year-by-year cashflow liquidity and equity vesting trajectory
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                  COMPOUNDED
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearData.map((y) => ({
                      name: `Year ${y.year}`,
                      Cash: y.totalCash,
                      Equity: y.equity,
                      Total: y.totalComp,
                    }))}
                    margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                    <XAxis dataKey="name" stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
                    <YAxis
                      stroke="#7a8b99"
                      tick={{ fill: '#7a8b99', fontSize: 12 }}
                      tickFormatter={(val: number) => `$${Math.round(val / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111a22',
                        borderColor: '#1e2b36',
                        borderRadius: '8px',
                        color: '#dce7f0',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`$${Number(val || 0).toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="Cash" stackId="a" fill="#22d3a5" />
                    <Bar dataKey="Equity" stackId="a" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-by-Year Table Summary */}
            <div className="mt-4 pt-3 border-t border-[#1e2b36] overflow-x-auto text-[11px] font-mono">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#7a8b99] border-b border-[#1e2b36]">
                    <th className="pb-1">YEAR</th>
                    <th className="pb-1">BASE + BONUS</th>
                    <th className="pb-1">SIGN-ON</th>
                    <th className="pb-1">EQUITY VEST</th>
                    <th className="pb-1">ANNUAL TOTAL</th>
                    <th className="pb-1 text-right">CUMULATIVE</th>
                  </tr>
                </thead>
                <tbody className="text-[#dce7f0]">
                  {yearData.map((y) => (
                    <tr key={y.year} className="border-b border-[#1e2b36]/40">
                      <td className="py-1 text-[#22d3a5] font-bold">Yr {y.year}</td>
                      <td>${(y.base + y.bonus).toLocaleString()}</td>
                      <td>{y.signOn > 0 ? `$${y.signOn.toLocaleString()}` : '—'}</td>
                      <td className="text-[#3b82f6]">${y.equity.toLocaleString()}</td>
                      <td className="font-semibold">${y.totalComp.toLocaleString()}</td>
                      <td className="text-right text-[#fbbf24]">${y.cumulativeTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: ZOPA & BATNA BARGAINING SURPLUS ZONE */}
      {activeTab === 'zopa_batna' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
            <div>
              <h3 className="text-base font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#3b82f6]" />
                ZONE OF POSSIBLE AGREEMENT (ZOPA) &amp; BATNA ANALYZER
              </h3>
              <p className="text-xs text-[#7a8b99] font-mono">
                Calculate employer reservation price, candidate walkaway floor, and surplus distribution.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#7a8b99]">LEVERAGE SCORE:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border ${
                  zopa.leverageRating === 'EXCEPTIONAL'
                    ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                    : zopa.leverageRating === 'STRONG'
                    ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]'
                    : 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]'
                }`}
              >
                {zopa.leverageRating}
              </span>
            </div>
          </div>

          {/* Interactive Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36]">
              <label className="block text-[11px] text-[#7a8b99] mb-1">
                EMPLOYER INITIAL OFFER ($)
              </label>
              <input
                type="number"
                step="5000"
                value={employerInitial}
                onChange={(e) => setEmployerInitial(Number(e.target.value))}
                className="w-full bg-[#111a22] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none font-bold text-sm"
              />
              <span className="text-[10px] text-[#7a8b99] block mt-1">Starting anchor presented by hiring team</span>
            </div>

            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36]">
              <label className="block text-[11px] text-[#7a8b99] mb-1">
                CANDIDATE WALKAWAY FLOOR (BATNA)
              </label>
              <input
                type="number"
                step="5000"
                value={candidateFloor}
                onChange={(e) => setCandidateFloor(Number(e.target.value))}
                className="w-full bg-[#111a22] border border-[#1e2b36] text-[#f87171] rounded p-2 outline-none font-bold text-sm"
              />
              <span className="text-[10px] text-[#7a8b99] block mt-1">Absolute minimum threshold to accept offer</span>
            </div>

            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36] flex flex-col justify-between">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  COMPETING OFFER LEVERAGE
                </label>
                <button
                  type="button"
                  onClick={() => setHasCompetingLeverage(!hasCompetingLeverage)}
                  className={`w-full py-2 rounded text-xs font-semibold border transition ${
                    hasCompetingLeverage
                      ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                      : 'bg-[#1e2b36] text-[#7a8b99] border-transparent'
                  }`}
                >
                  {hasCompetingLeverage ? 'ACTIVE (HOT COMPETITION)' : 'NONE (STANDARD POOL)'}
                </button>
              </div>
              <span className="text-[10px] text-[#7a8b99] block mt-1">Expands employer ceiling by +12% to +25%</span>
            </div>
          </div>

          {/* Visual ZOPA Bargaining Range Graphic */}
          <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7a8b99]">
              <span>BARGAINING HORIZON MATRIX</span>
              <span>SURPLUS ZONE: <strong className="text-[#22d3a5]">${zopa.zopaSpread.toLocaleString()}</strong></span>
            </div>

            {/* Visual Segmented Progress Bar */}
            <div className="relative pt-6 pb-2">
              <div className="h-4 bg-[#111a22] rounded-full overflow-hidden border border-[#1e2b36] flex relative">
                {/* Visual marker positions */}
                <div
                  className="bg-[#3b82f6]/30 h-full"
                  style={{ width: '35%' }}
                  title="Employer Initial"
                />
                <div
                  className="bg-[#22d3a5] h-full"
                  style={{ width: '45%' }}
                  title="ZOPA Zone"
                />
                <div
                  className="bg-[#fbbf24]/40 h-full"
                  style={{ width: '20%' }}
                  title="Target Anchor"
                />
              </div>

              {/* Range Indicator Labels */}
              <div className="grid grid-cols-4 gap-2 text-[10px] mt-3">
                <div className="border-l border-[#3b82f6] pl-1.5">
                  <span className="text-[#7a8b99] block">EMPLOYER INITIAL</span>
                  <span className="text-[#3b82f6] font-bold text-xs">${employerInitial.toLocaleString()}</span>
                </div>
                <div className="border-l border-[#f87171] pl-1.5">
                  <span className="text-[#7a8b99] block">CANDIDATE FLOOR</span>
                  <span className="text-[#f87171] font-bold text-xs">${candidateFloor.toLocaleString()}</span>
                </div>
                <div className="border-l border-[#22d3a5] pl-1.5">
                  <span className="text-[#7a8b99] block">ESTIMATED CEILING</span>
                  <span className="text-[#22d3a5] font-bold text-xs">${zopa.employerCeiling.toLocaleString()}</span>
                </div>
                <div className="border-l border-[#fbbf24] pl-1.5">
                  <span className="text-[#7a8b99] block">RECOMMENDED ANCHOR</span>
                  <span className="text-[#fbbf24] font-bold text-xs">${zopa.candidateAnchor.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Recommendation & Counter Dispatch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-[#0a0f14] p-4 rounded-lg border border-[#1e2b36] space-y-2">
              <div className="text-[#22d3a5] font-bold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                OPTIMAL COUNTER-OFFER: ${zopa.recommendedCounter.toLocaleString()}
              </div>
              <p className="text-[#dce7f0] text-xs leading-relaxed">
                By anchoring at ${zopa.recommendedCounter.toLocaleString()}, you capture 85% of the employer's unallocated discretionary budget while maintaining an estimated <strong>{zopa.acceptanceProbability}% acceptance probability</strong> without risk of deal collapse.
              </p>
            </div>

            <div className="bg-[#0a0f14] p-4 rounded-lg border border-[#1e2b36] flex flex-col justify-between">
              <div>
                <span className="text-[#7a8b99] text-[10px] block mb-1">DISPATCH TO ENVOY (CIPHER-3):</span>
                <p className="text-[#7a8b99] text-[11px]">
                  Pass this financial surplus model directly to Envoy to generate an encrypted counter-offer transmission.
                </p>
              </div>

              {onSendToEnvoy && (
                <button
                  onClick={() =>
                    onSendToEnvoy(
                      `Tactical Counter-Offer Script based on ZOPA model ($${zopa.recommendedCounter.toLocaleString()} target with competing leverage).`
                    )
                  }
                  className="mt-3 w-full py-2 bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Transfer to Envoy Negotiation Console</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: HEAD-TO-HEAD OFFER ARBITRAGE */}
      {activeTab === 'arbitrage' && (
        <div className="space-y-5">
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-bold font-mono text-[#dce7f0] flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-[#fbbf24]" />
              HEAD-TO-HEAD OFFER ARBITRAGE (FRONTIER AI VS QUANT/HFT)
            </h3>
            <p className="text-xs text-[#7a8b99] font-mono mb-4">
              Compare liquid cash guarantee vs high-upside equity compounding over a 4-year horizon.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {DEFAULT_OFFERS.map((compOffer, idx) => {
                const cYearData = computeYearByYear(compOffer);
                const cTotal4Yr = cYearData[cYearData.length - 1]?.cumulativeTotal || 0;
                const isOfferA = idx === 0;

                return (
                  <div
                    key={compOffer.id}
                    className={`p-4 rounded-xl border bg-[#0a0f14] space-y-3 ${
                      isOfferA ? 'border-[#3b82f6]/40' : 'border-[#22d3a5]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
                      <div>
                        <span className="text-[10px] text-[#7a8b99]">{compOffer.id}</span>
                        <div className="text-sm font-bold text-[#dce7f0]">{compOffer.firmName}</div>
                        <div className="text-[11px] text-[#7a8b99]">{compOffer.roleTitle}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isOfferA ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 'bg-[#22d3a5]/10 text-[#22d3a5]'
                        }`}
                      >
                        {isOfferA ? 'EQUITY GROWTH PROFILE' : 'CASH LIQUIDITY PROFILE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#7a8b99] block">BASE SALARY:</span>
                        <span className="text-[#dce7f0] font-bold">${compOffer.baseSalary.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[#7a8b99] block">VARIABLE BONUS:</span>
                        <span className="text-[#22d3a5] font-bold">{compOffer.annualBonusPercent}% target</span>
                      </div>
                      <div>
                        <span className="text-[#7a8b99] block">SIGN-ON BONUS:</span>
                        <span className="text-[#fbbf24] font-bold">${compOffer.signOnBonus.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[#7a8b99] block">4-YR EQUITY:</span>
                        <span className="text-[#3b82f6] font-bold">${compOffer.equityTotalGrant.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1e2b36] flex items-center justify-between">
                      <div>
                        <span className="text-[#7a8b99] text-[10px] block">4-YEAR TOTAL VALUE (NPV)</span>
                        <span className="text-base font-bold text-[#22d3a5]">
                          ${cTotal4Yr.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7a8b99]">
                        Avg: ${Math.round(cTotal4Yr / 4).toLocaleString()} / yr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: HIGH-LEVERAGE CONTRACT RIDERS & CLAUSES */}
      {activeTab === 'riders' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2b36]">
            <div>
              <h3 className="text-base font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                EXECUTIVE CONTRACT CLAUSES &amp; PROTECTIVE RIDERS
              </h3>
              <p className="text-xs text-[#7a8b99] font-mono">
                Pre-formulated legal clauses engineered to protect candidate equity upside and mitigate clawback liability.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400 px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
              LEGAL-TESTED FORMULAS
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Rider 1 */}
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#22d3a5] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Double-Trigger Change of Control Equity Acceleration
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'rider-1',
                      `"In the event of a Change of Control of the Company, if the Employee is terminated without Cause or resigns for Good Reason within twelve (12) months following such transaction, one hundred percent (100%) of all unvested equity awards shall immediately vest and become exercisable."`
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[11px] text-[#22d3a5] flex items-center gap-1 transition"
                >
                  {copiedRiderId === 'rider-1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRiderId === 'rider-1' ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <p className="text-[#7a8b99] text-[11px] leading-relaxed">
                Prevents incoming acquirers or private equity buyers from cancelling unvested equity pools without fair realization.
              </p>
            </div>

            {/* Rider 2 */}
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#3b82f6] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Pro-Rata Sign-On Bonus Amortization (Clawback Shield)
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'rider-2',
                      `"The Sign-On Transition Bonus shall be earned on a monthly pro-rata basis over the initial twelve (12) months of employment (1/12th per full month of service completed). In the event of resignation, any clawback obligation shall apply only to the unearned pro-rata balance."`
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#3b82f6] text-[11px] text-[#3b82f6] flex items-center gap-1 transition"
                >
                  {copiedRiderId === 'rider-2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRiderId === 'rider-2' ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <p className="text-[#7a8b99] text-[11px] leading-relaxed">
                Replaces brutal 100% repayment demands with fair monthly amortization if career dynamics evolve in year 1.
              </p>
            </div>

            {/* Rider 3 */}
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#fbbf24] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Annual Equity Refresh Parity Floor
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'rider-3',
                      `"The Employee shall be eligible for annual equity refresh grants calibrated to maintain a rolling unvested equity value of no less than sixty percent (60%) of the initial grant value, subject to standard performance calibration."`
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#fbbf24] text-[11px] text-[#fbbf24] flex items-center gap-1 transition"
                >
                  {copiedRiderId === 'rider-3' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRiderId === 'rider-3' ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <p className="text-[#7a8b99] text-[11px] leading-relaxed">
                Eliminates the "cliff drop" in total compensation that typically hits engineers in Year 3 and Year 4.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
