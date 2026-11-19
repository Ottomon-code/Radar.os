import React, { useState } from 'react';
import {
  Globe,
  X,
  ArrowRight,
  TrendingUp,
  Percent,
  Landmark,
  Building2,
  DollarSign,
  Scale,
  Sparkles,
  Check,
  Info,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import {
  CurrencyCode,
  CURRENCY_CONFIGS,
  TECH_HUBS_PPP,
  calculatePppEquivalence,
  formatCurrencyValue,
} from '../utils/currencyPppEngine';

interface CurrencyPppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CurrencyPppModal({ isOpen, onClose }: CurrencyPppModalProps) {
  const { currency, setCurrency, isPppMode, setIsPppMode } = useCurrency();

  // Arbitrage Calculator Local State
  const [originHubId, setOriginHubId] = useState<string>('sf_bay');
  const [destHubId, setDestHubId] = useState<string>('zurich');
  const [inputSalary, setInputSalary] = useState<number>(350000);

  if (!isOpen) return null;

  const originHub = TECH_HUBS_PPP.find((h) => h.id === originHubId) || TECH_HUBS_PPP[0];
  const destHub = TECH_HUBS_PPP.find((h) => h.id === destHubId) || TECH_HUBS_PPP[3];

  const pppResult = calculatePppEquivalence(inputSalary, originHubId, destHubId);
  const originNet = Math.round(inputSalary * (1 - originHub.taxAverageRate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0f171e] border border-[#1e2b36] rounded-xl shadow-2xl overflow-hidden font-mono text-[#dce7f0] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b36] bg-[#111a22]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/30 text-[#22d3a5]">
              <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#dce7f0]">
                  GLOBAL CURRENCY &amp; PURCHASING POWER PARITY (PPP) ENGINE
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold">
                  V4.2 LIVE FX
                </span>
              </div>
              <p className="text-xs text-[#7a8b99]">
                Normalize compensation across 8 global currencies and 10 tier-1 tech capitals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#1e2b36] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Active Currency Selector */}
          <div>
            <label className="text-xs text-[#7a8b99] uppercase tracking-wider block mb-2 font-semibold">
              1. Platform Base Display Currency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((code) => {
                const cfg = CURRENCY_CONFIGS[code];
                const isSelected = currency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5] shadow-[0_0_12px_rgba(34,211,165,0.2)]'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:border-[#7a8b99]/50 hover:text-[#dce7f0]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-[#dce7f0] flex items-center gap-1.5">
                        <span className="text-[#22d3a5] font-mono">{cfg.symbol}</span>
                        <span>{cfg.code}</span>
                      </div>
                      <div className="text-[11px] text-[#7a8b99] truncate">{cfg.name}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#22d3a5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: PPP Normalization Toggle */}
          <div className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                  <span>Purchasing Power Parity (PPP) Real-Living Normalization</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8]">
                    RECOMMENDED
                  </span>
                </h4>
                <p className="text-xs text-[#7a8b99] mt-1 leading-relaxed">
                  Adjusts nominal foreign benchmarks by local housing costs, groceries, and effective taxes.
                  Prevents underestimating high-standard European (Zurich/London) or Asian (Singapore/Tokyo) roles.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPppMode(!isPppMode)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer border ${
                isPppMode
                  ? 'bg-[#22d3a5] text-black border-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.3)]'
                  : 'bg-[#1a2632] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
              }`}
            >
              {isPppMode ? '✓ PPP MODE ENABLED' : 'ENABLE PPP MODE'}
            </button>
          </div>

          {/* Section 3: Interactive City-to-City PPP & Net Arbitrage Calculator */}
          <div className="border border-[#1e2b36] rounded-xl p-5 bg-[#0a0f14]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#fbbf24]" />
                <h4 className="text-sm font-bold text-[#dce7f0]">
                  TECH HUB PURCHASING POWER &amp; TAX ARBITRAGE SIMULATOR
                </h4>
              </div>
              <span className="text-xs text-[#7a8b99]">Real Net Take-Home Index</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Origin Hub */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7a8b99] uppercase font-semibold">
                  From Origin Hub
                </label>
                <select
                  value={originHubId}
                  onChange={(e) => setOriginHubId(e.target.value)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-2 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                >
                  {TECH_HUBS_PPP.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.cityName} ({hub.currency})
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <label className="text-[11px] text-[#7a8b99]">Benchmark Nominal Salary ({originHub.currency})</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-[#7a8b99] text-xs">
                      {CURRENCY_CONFIGS[originHub.currency].symbol}
                    </span>
                    <input
                      type="number"
                      value={inputSalary}
                      onChange={(e) => setInputSalary(Number(e.target.value))}
                      className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none font-bold"
                    />
                  </div>
                  <div className="text-[10px] text-[#7a8b99] mt-1 flex justify-between">
                    <span>Avg Tax Rate: {(originHub.taxAverageRate * 100).toFixed(0)}%</span>
                    <span>Net: {formatCurrencyValue(originNet, originHub.currency, true)}</span>
                  </div>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <div className="w-9 h-9 rounded-full bg-[#22d3a5]/10 border border-[#22d3a5]/30 flex items-center justify-center text-[#22d3a5] mb-1">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#7a8b99] font-mono">PPP Multiplier</span>
                <span className="text-xs font-bold text-[#22d3a5]">
                  {pppResult.purchasingPowerMultiplier}x
                </span>
              </div>

              {/* Destination Hub */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7a8b99] uppercase font-semibold">
                  To Destination Hub
                </label>
                <select
                  value={destHubId}
                  onChange={(e) => setDestHubId(e.target.value)}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-2 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
                >
                  {TECH_HUBS_PPP.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.cityName} ({hub.currency})
                    </option>
                  ))}
                </select>

                <div className="mt-2 p-2.5 rounded-lg bg-[#111a22] border border-[#22d3a5]/30">
                  <div className="text-[10px] text-[#7a8b99]">Equivalent Required Compensation</div>
                  <div className="text-base font-bold text-[#22d3a5] mt-0.5">
                    {formatCurrencyValue(pppResult.equivalentNominal, destHub.currency)}
                  </div>
                  <div className="text-[10px] text-[#7a8b99] mt-1 flex justify-between">
                    <span>Tax: {(destHub.taxAverageRate * 100).toFixed(0)}%</span>
                    <span className="text-[#38bdf8] font-semibold">
                      Est. Take-Home: {formatCurrencyValue(pppResult.netEstimatedTakeHome, destHub.currency, true)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hub Context Insight */}
            <div className="mt-4 pt-3 border-t border-[#1e2b36] flex items-start gap-2 text-xs text-[#7a8b99]">
              <Info className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
              <span>
                <strong>{destHub.cityName}:</strong> {destHub.description} Living costs are{' '}
                <span className="text-[#dce7f0] font-semibold">
                  {destHub.costOfLivingIndex}%
                </span>{' '}
                of the San Francisco baseline with effective high-bracket tax rate of{' '}
                <span className="text-[#dce7f0] font-semibold">
                  {(destHub.taxAverageRate * 100).toFixed(0)}%
                </span>.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1e2b36] bg-[#111a22] flex items-center justify-between">
          <div className="text-xs text-[#7a8b99]">
            Active Rate: 1 USD = {CURRENCY_CONFIGS[currency].rateToUsd} {currency}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#22d3a5] text-black font-bold text-xs hover:bg-[#1db890] transition cursor-pointer"
          >
            APPLY &amp; RETURN TO TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
}
