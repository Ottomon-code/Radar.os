import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { CareerPathProfile } from '../utils/marketAnalyticsEngine';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrencyValue, CurrencyCode } from '../utils/currencyPppEngine';

interface SalaryDistributionChartProps {
  profile: CareerPathProfile;
  allProfiles?: Record<string, CareerPathProfile>;
  selectedProfileKey?: string;
  onSelectProfile?: (key: string) => void;
}

type CompBasis = 'total' | 'base';

interface DistributionBin {
  id: string;
  shortLabel: string;
  fullRangeLabel: string;
  minAmount: number;
  maxAmount: number;
  midpoint: number;
  sharePct: number;
  cumulativeStartPct: number;
  cumulativeEndPct: number;
  zone: 'lower' | 'core' | 'median' | 'upper_quartile' | 'top_decile';
  zoneLabel: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DistributionBin }>;
}

const LADDER_WEIGHTS_BY_COUNT: Record<number, number[]> = {
  3: [0.35, 0.45, 0.2],
  4: [0.22, 0.38, 0.26, 0.14],
  5: [0.18, 0.32, 0.28, 0.15, 0.07],
  6: [0.16, 0.28, 0.29, 0.16, 0.08, 0.03],
};

function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function getNiceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 25000;
  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  const fraction = rawStep / base;
  const candidates = [1, 1.5, 2, 2.5, 5, 10];
  const chosen = candidates.find((c) => c >= fraction) ?? 10;
  return chosen * base;
}

function getTierBaseRatio(profile: CareerPathProfile, tierIndex: number, totalTiers: number): number {
  const comps = profile.compComposition || [];
  if (comps.length === 0) {
    return profile.ttc2026 > 0 ? Math.min(0.85, Math.max(0.35, profile.baseSalary2026 / profile.ttc2026)) : 0.62;
  }
  const mappedIndex = Math.min(
    comps.length - 1,
    Math.round((tierIndex / Math.max(1, totalTiers - 1)) * (comps.length - 1))
  );
  const comp = comps[mappedIndex];
  const total = comp.base + comp.bonus + comp.equity;
  return total > 0 ? comp.base / total : 0.62;
}

function shortenTierLabel(tierName: string): string {
  const clean = tierName.split('/')[0].split('(')[0].trim();
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 15)}…`;
}

function formatCompactAxis(val: number, currency: CurrencyCode): string {
  return formatCurrencyValue(val, currency, true);
}

function DistributionTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const bin = payload[0].payload;

  return (
    <div className="bg-[#0c131a] border border-[#1e2b36] rounded-lg px-3.5 py-2.5 shadow-xl text-xs font-mono space-y-1.5 min-w-[220px]">
      <div className="font-semibold text-[#dce7f0] tabular-nums">{bin.fullRangeLabel}</div>
      <div className="flex items-center justify-between gap-4 text-[#7a8b99]">
        <span>Market Share</span>
        <span className="font-bold text-[#22d3a5] tabular-nums">{bin.sharePct.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#7a8b99]">
        <span>Percentile Band</span>
        <span className="text-[#dce7f0] tabular-nums">
          P{Math.round(bin.cumulativeStartPct)} – P{Math.round(bin.cumulativeEndPct)}
        </span>
      </div>
      <div className="pt-1 border-t border-[#1e2b36] text-[11px] text-[#94a3b8]">{bin.zoneLabel}</div>
    </div>
  );
}

export default function SalaryDistributionChart({
  profile,
  allProfiles,
  selectedProfileKey,
  onSelectProfile,
}: SalaryDistributionChartProps) {
  const { currency, isPppMode, rateToUsd } = useCurrency();
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(-1);
  const [compBasis, setCompBasis] = useState<CompBasis>('total');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  const tiers = profile.percentileDistribution || [];

  useEffect(() => {
    if (selectedTierIndex >= tiers.length) {
      setSelectedTierIndex(-1);
    }
    setSelectedBinId(null);
  }, [profile.id, tiers.length, selectedTierIndex]);

  const { bins, summary, medianBinLabel } = useMemo(() => {
    if (tiers.length === 0) {
      return {
        bins: [] as DistributionBin[],
        summary: { p25: 0, median: 0, p75: 0, p90: 0 },
        medianBinLabel: undefined as string | undefined,
      };
    }

    const activeIndices =
      selectedTierIndex >= 0 && selectedTierIndex < tiers.length
        ? [selectedTierIndex]
        : tiers.map((_, idx) => idx);

    const rawWeights =
      activeIndices.length === 1
        ? [1]
        : LADDER_WEIGHTS_BY_COUNT[activeIndices.length] ||
          activeIndices.map(() => 1 / activeIndices.length);
    const weightSum = rawWeights.reduce((acc, w) => acc + w, 0) || 1;
    const weights = rawWeights.map((w) => w / weightSum);

    const tierModels = activeIndices.map((tierIdx, i) => {
      const t = tiers[tierIdx];
      const ratio = compBasis === 'base' ? getTierBaseRatio(profile, tierIdx, tiers.length) : 1;
      const scale = ratio * rateToUsd;
      const p25 = Math.max(1000, t.p25 * scale);
      const median = Math.max(p25 * 1.05, t.median * scale);
      const p90 = Math.max(median * 1.08, t.p90 * scale);
      const mu = Math.log(median);
      // z(0.90) - z(0.25) = 1.28155 - (-0.67449) = 1.95604
      const rawSigma = (Math.log(p90) - Math.log(p25)) / 1.95604;
      const sigma = Math.min(0.72, Math.max(0.14, rawSigma));
      return { mu, sigma, weight: weights[i] };
    });

    const evalCdf = (x: number): number => {
      if (x <= 0) return 0;
      const lnX = Math.log(x);
      let total = 0;
      for (const m of tierModels) {
        total += m.weight * normalCdf((lnX - m.mu) / m.sigma);
      }
      return Math.min(1, Math.max(0, total));
    };

    const findQuantile = (q: number): number => {
      let lo = 100;
      let hi = 1000;
      while (evalCdf(hi) < q && hi < 1e11) {
        hi *= 2;
      }
      for (let iter = 0; iter < 48; iter++) {
        const mid = (lo + hi) / 2;
        if (evalCdf(mid) < q) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    const q04 = findQuantile(0.04);
    const q25 = findQuantile(0.25);
    const q50 = findQuantile(0.5);
    const q75 = findQuantile(0.75);
    const q90 = findQuantile(0.9);
    const q96 = findQuantile(0.96);

    const step = getNiceStep(Math.max(1, (q96 - q04) / 8));
    const startEdge = Math.max(0, Math.floor(q04 / step) * step);
    const edges: number[] = [startEdge];
    let cursor = startEdge;
    while (cursor < q96 && edges.length < 11) {
      cursor += step;
      edges.push(cursor);
    }
    if (edges.length < 6) {
      while (edges.length < 7) {
        cursor += step;
        edges.push(cursor);
      }
    }

    const rawMasses: number[] = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const low = edges[i];
      const high = edges[i + 1];
      // Include extreme tails neatly in first/last brackets so distribution covers full market spread
      const cdfLow = i === 0 ? 0 : evalCdf(low);
      const cdfHigh = i === edges.length - 2 ? 1 : evalCdf(high);
      rawMasses.push(Math.max(0, cdfHigh - cdfLow));
    }

    const totalMass = rawMasses.reduce((a, b) => a + b, 0) || 1;
    let runningPct = 0;
    let detectedMedianLabel: string | undefined;

    const builtBins: DistributionBin[] = rawMasses.map((mass, i) => {
      const minAmount = edges[i];
      const maxAmount = edges[i + 1];
      const midpoint = (minAmount + maxAmount) / 2;
      const sharePct = Number(((mass / totalMass) * 100).toFixed(1));
      const cumulativeStartPct = runningPct;
      runningPct = Math.min(100, runningPct + sharePct);
      const cumulativeEndPct = i === rawMasses.length - 1 ? 100 : runningPct;

      const shortLabel = `${formatCompactAxis(minAmount, currency)}–${formatCompactAxis(maxAmount, currency)}`;
      const fullRangeLabel = `${formatCurrencyValue(minAmount, currency, false)} – ${formatCurrencyValue(
        maxAmount,
        currency,
        false
      )}`;

      const containsMedian = q50 >= minAmount && q50 < maxAmount;
      if (containsMedian) {
        detectedMedianLabel = shortLabel;
      }

      let zone: DistributionBin['zone'] = 'core';
      let zoneLabel = 'Core Market Range (P25–P50)';
      if (containsMedian) {
        zone = 'median';
        zoneLabel = 'Median Compensation Band (50th Percentile)';
      } else if (maxAmount <= q25) {
        zone = 'lower';
        zoneLabel = 'Lower Quartile Entry Band (< P25)';
      } else if (midpoint >= q90) {
        zone = 'top_decile';
        zoneLabel = 'Top-Decile Outlier Band (P90+)';
      } else if (minAmount >= q50) {
        zone = 'upper_quartile';
        zoneLabel = 'Upper-Quartile Upside (P50–P90)';
      }

      return {
        id: `bin-${i}-${minAmount}`,
        shortLabel,
        fullRangeLabel,
        minAmount,
        maxAmount,
        midpoint,
        sharePct,
        cumulativeStartPct,
        cumulativeEndPct,
        zone,
        zoneLabel,
      };
    });

    if (!detectedMedianLabel && builtBins.length > 0) {
      const fallbackMedianBin = builtBins.reduce((best, cur) =>
        Math.abs(cur.midpoint - q50) < Math.abs(best.midpoint - q50) ? cur : best
      );
      fallbackMedianBin.zone = 'median';
      fallbackMedianBin.zoneLabel = 'Median Compensation Band (50th Percentile)';
      detectedMedianLabel = fallbackMedianBin.shortLabel;
    }

    return {
      bins: builtBins,
      summary: {
        p25: Math.round(q25),
        median: Math.round(q50),
        p75: Math.round(q75),
        p90: Math.round(q90),
      },
      medianBinLabel: detectedMedianLabel,
    };
  }, [tiers, selectedTierIndex, compBasis, profile, rateToUsd, currency]);

  const activeTierLabel =
    selectedTierIndex >= 0 && tiers[selectedTierIndex]
      ? tiers[selectedTierIndex].tier
      : 'All Career Levels (Weighted)';

  const focusedBin = bins.find((b) => b.id === selectedBinId) || null;

  const getBarFill = (bin: DistributionBin) => {
    if (selectedBinId && bin.id === selectedBinId) return '#fbbf24';
    switch (bin.zone) {
      case 'median':
        return '#22d3a5';
      case 'upper_quartile':
        return '#38bdf8';
      case 'top_decile':
        return '#a78bfa';
      case 'lower':
        return '#334e68';
      default:
        return '#2b6cb0';
    }
  };

  if (tiers.length === 0) {
    return (
      <section className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 font-mono space-y-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-[#22d3a5]" />
          <h3 className="text-base font-semibold text-[#dce7f0]">
            Salary Distribution by Compensation Band
          </h3>
        </div>
        <p className="text-xs text-[#7a8b99]">
          No percentile brackets are available for {profile.title}. Select another role above to inspect its salary distribution.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Role Salary Distribution Visualization"
      className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-lg space-y-5 font-mono"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1e2b36]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a8b99]">
            <span>{profile.sectorLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{activeTierLabel}</span>
            <span aria-hidden="true">·</span>
            <span>
              {compBasis === 'total' ? 'Total Target Compensation' : 'Base Salary'} ({currency}
              {isPppMode ? ' · PPP Active' : ''})
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#dce7f0] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#22d3a5] shrink-0" />
            <span>Salary Distribution: {profile.title}</span>
          </h3>
        </div>

        {/* Interactive Role + Compensation Basis Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {allProfiles && onSelectProfile && selectedProfileKey && (
            <label className="flex items-center gap-2 text-xs text-[#7a8b99]">
              <span className="sr-only">Select Role</span>
              <select
                aria-label="Select role for salary distribution"
                value={selectedProfileKey}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none max-w-[260px] truncate cursor-pointer"
              >
                {Object.entries(allProfiles).map(([key, prof]) => (
                  <option key={key} value={key}>
                    {prof.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div
            role="group"
            aria-label="Compensation Basis"
            className="flex items-center gap-1 p-1 bg-[#0a0f14] border border-[#1e2b36] rounded-lg"
          >
            <button
              type="button"
              onClick={() => setCompBasis('total')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                compBasis === 'total'
                  ? 'bg-[#22d3a5] text-[#0a0f14]'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              Total Comp
            </button>
            <button
              type="button"
              onClick={() => setCompBasis('base')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                compBasis === 'base'
                  ? 'bg-[#22d3a5] text-[#0a0f14]'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              Base Salary
            </button>
          </div>
        </div>
      </div>

      {/* Seniority Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-[#7a8b99] whitespace-nowrap shrink-0 mr-1">Seniority:</span>
        <button
          type="button"
          onClick={() => {
            setSelectedTierIndex(-1);
            setSelectedBinId(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
            selectedTierIndex === -1
              ? 'bg-[#152330] border-[#22d3a5] text-[#22d3a5]'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
          }`}
        >
          All Levels
        </button>
        {tiers.map((tier, idx) => (
          <button
            key={tier.tier}
            type="button"
            onClick={() => {
              setSelectedTierIndex(idx);
              setSelectedBinId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
              selectedTierIndex === idx
                ? 'bg-[#152330] border-[#22d3a5] text-[#22d3a5]'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            {shortenTierLabel(tier.tier)}
          </button>
        ))}
      </div>

      {/* Summary Percentile Figures (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-[#7a8b99]">25th Percentile</div>
          <div className="text-sm font-bold text-[#dce7f0] tabular-nums mt-0.5">
            {formatCurrencyValue(summary.p25, currency, false)}
          </div>
        </div>
        <div className="bg-[#0a0f14] border border-[#22d3a5]/40 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-[#22d3a5]">Median (50th)</div>
          <div className="text-sm font-bold text-[#22d3a5] tabular-nums mt-0.5">
            {formatCurrencyValue(summary.median, currency, false)}
          </div>
        </div>
        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-[#7a8b99]">75th Percentile</div>
          <div className="text-sm font-bold text-[#38bdf8] tabular-nums mt-0.5">
            {formatCurrencyValue(summary.p75, currency, false)}
          </div>
        </div>
        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-[#7a8b99]">90th Percentile</div>
          <div className="text-sm font-bold text-[#a78bfa] tabular-nums mt-0.5">
            {formatCurrencyValue(summary.p90, currency, false)}
          </div>
        </div>
      </div>

      {/* Recharts Distribution Bar Chart */}
      <div className="h-80 w-full bg-[#0a0f14] p-3.5 rounded-xl border border-[#1e2b36]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 22, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              stroke="#7a8b99"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e2b36' }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={46}
            />
            <YAxis
              stroke="#7a8b99"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
              width={42}
            />
            <Tooltip
              content={<DistributionTooltip />}
              cursor={{ fill: 'rgba(34, 211, 165, 0.06)' }}
            />
            {medianBinLabel && (
              <ReferenceLine
                x={medianBinLabel}
                stroke="#22d3a5"
                strokeDasharray="4 4"
                label={{
                  value: 'Median',
                  position: 'top',
                  fill: '#22d3a5',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              />
            )}
            <Bar
              dataKey="sharePct"
              name="Share of Offers"
              radius={[5, 5, 0, 0]}
              maxBarSize={56}
              onClick={(data: any) => {
                if (data?.id) {
                  setSelectedBinId((prev) => (prev === data.id ? null : data.id));
                }
              }}
              className="cursor-pointer"
            >
              {bins.map((bin) => (
                <Cell key={bin.id} fill={getBarFill(bin)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Bracket Selection Callout & Clean Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[#7a8b99]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2b6cb0] inline-block" />
            Core Range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#22d3a5] inline-block" />
            Median Band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] inline-block" />
            Upper Quartile (P50–P90)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#a78bfa] inline-block" />
            Top Decile (P90+)
          </span>
        </div>

        <div className="text-[#94a3b8] tabular-nums">
          {focusedBin ? (
            <span>
              Selected: <strong className="text-[#fbbf24]">{focusedBin.fullRangeLabel}</strong> ·{' '}
              {focusedBin.sharePct.toFixed(1)}% of offers (P{Math.round(focusedBin.cumulativeStartPct)}–P
              {Math.round(focusedBin.cumulativeEndPct)})
            </span>
          ) : (
            <span>Click any bar to inspect exact bracket percentiles</span>
          )}
        </div>
      </div>
    </section>
  );
}
