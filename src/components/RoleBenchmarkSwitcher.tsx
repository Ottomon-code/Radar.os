import React from 'react';
import { Layers, ArrowUpRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export type RoleSeniorityLevel = 'Junior' | 'Senior' | 'Principal';

export interface RoleCompensationBenchmark {
  level: RoleSeniorityLevel;
  bandLabel: string;
  domainLabel: string;
  sampleTitle: string;
  experienceRange: string;
  suggestedYearsExp: number;
  baselineCurrentSalary: number;
  baseSalary: number;
  annualBonus: number;
  annualEquity: number;
  totalComp: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  vestingSchedule: string;
  scopeSummary: string;
  negotiationFocus: string[];
}

export const ROLE_SENIORITY_LEVELS: RoleSeniorityLevel[] = ['Junior', 'Senior', 'Principal'];

function detectDomainProfile(targetRole: string, targetIndustry?: string) {
  const text = `${targetRole} ${targetIndustry || ''}`.toLowerCase();

  if (text.includes('quant') || text.includes('hft') || text.includes('trading')) {
    return {
      key: 'quant',
      domainLabel: 'Quantitative Trading & HFT',
      roleStem: 'Quantitative Systems Developer',
      levels: {
        Junior: {
          bandLabel: 'L3 · Quantitative Analyst / Dev I',
          experienceRange: '0–2 yrs',
          suggestedYearsExp: 2,
          baselineCurrentSalary: 145000,
          baseSalary: 165000,
          annualBonus: 55000,
          annualEquity: 15000,
          totalComp: 235000,
          percentiles: { p25: 195000, p50: 235000, p75: 275000, p90: 320000 },
          vestingSchedule: 'Cash-heavy annual PnL bonus (Feb payout)',
          scopeSummary: 'Implement low-latency market data parsers, backtesting modules, and execution adapters under desk lead review.',
          negotiationFocus: [
            'Negotiate guaranteed first-year minimum cash bonus alongside base salary',
            'Clarify non-compete garden leave duration before signing',
            'Benchmark sign-on bonus against competing prop trading new-grad offers',
          ],
        },
        Senior: {
          bandLabel: 'L5 · Senior Quant Systems Engineer',
          experienceRange: '4–7 yrs',
          suggestedYearsExp: 6,
          baselineCurrentSalary: 240000,
          baseSalary: 250000,
          annualBonus: 145000,
          annualEquity: 45000,
          totalComp: 440000,
          percentiles: { p25: 365000, p50: 440000, p75: 530000, p90: 650000 },
          vestingSchedule: 'Desk-linked cash bonus + 2-yr deferred retention',
          scopeSummary: 'Own sub-microsecond kernel-bypass order routing pipelines and co-develop alpha execution infrastructure.',
          negotiationFocus: [
            'Anchor on formulaic desk PnL cut rather than discretionary pool language',
            'Request sign-on buyout covering unvested equity from prior firm',
            'Secure explicit hardware & FPGA research compute budget allocation',
          ],
        },
        Principal: {
          bandLabel: 'L7+ · Principal Quant Architect / Desk Lead',
          experienceRange: '9+ yrs',
          suggestedYearsExp: 11,
          baselineCurrentSalary: 350000,
          baseSalary: 325000,
          annualBonus: 340000,
          annualEquity: 115000,
          totalComp: 780000,
          percentiles: { p25: 620000, p50: 780000, p75: 980000, p90: 1250000 },
          vestingSchedule: 'Direct strategy PnL share + multi-year partner carry',
          scopeSummary: 'Architect multi-venue execution topologies, lead core latency R&D, and govern firm-wide risk engines.',
          negotiationFocus: [
            'Lock contractual percentage of desk net trading PnL above hurdle',
            'Negotiate paid non-compete compensation at full base + draw rate',
            'Structure multi-year guaranteed floor during greenfield desk ramp',
          ],
        },
      },
    };
  }

  if (text.includes('robot') || text.includes('autonomous') || text.includes('embedded')) {
    return {
      key: 'robotics',
      domainLabel: 'Autonomous Robotics & Physical AI',
      roleStem: 'Autonomous Systems Engineer',
      levels: {
        Junior: {
          bandLabel: 'L3 · Robotics Software Engineer I',
          experienceRange: '0–2 yrs',
          suggestedYearsExp: 2,
          baselineCurrentSalary: 110000,
          baseSalary: 128000,
          annualBonus: 12000,
          annualEquity: 25000,
          totalComp: 165000,
          percentiles: { p25: 142000, p50: 165000, p75: 188000, p90: 215000 },
          vestingSchedule: '4-yr vesting (1-yr cliff, quarterly thereafter)',
          scopeSummary: 'Build ROS 2 perception nodes, sensor calibration pipelines, and simulation regression harnesses.',
          negotiationFocus: [
            'Request relocation stipend and early-exercise ISO tax election window',
            'Benchmark Series B/C option strike spread vs. public robotics comps',
            'Confirm patent filing bonuses for novel control & SLAM contributions',
          ],
        },
        Senior: {
          bandLabel: 'L5 · Senior Autonomy & Perception Engineer',
          experienceRange: '5–8 yrs',
          suggestedYearsExp: 6,
          baselineCurrentSalary: 175000,
          baseSalary: 188000,
          annualBonus: 26000,
          annualEquity: 76000,
          totalComp: 290000,
          percentiles: { p25: 250000, p50: 290000, p75: 335000, p90: 385000 },
          vestingSchedule: '4-yr vesting + annual performance equity refresher',
          scopeSummary: 'Lead real-time CUDA edge inference optimization, HIL validation, and deterministic flight/actuator control.',
          negotiationFocus: [
            'Negotiate higher equity weighting with secondary tender eligibility',
            'Include upfront sign-on cash to bridge unvested cliff forfeitures',
            'Clarify safety certification ownership across DO-178C / ISO 26262 tracks',
          ],
        },
        Principal: {
          bandLabel: 'L7 · Principal Autonomous Systems Architect',
          experienceRange: '10+ yrs',
          suggestedYearsExp: 11,
          baselineCurrentSalary: 235000,
          baseSalary: 235000,
          annualBonus: 45000,
          annualEquity: 155000,
          totalComp: 435000,
          percentiles: { p25: 375000, p50: 435000, p75: 510000, p90: 595000 },
          vestingSchedule: 'Dual-track liquid equity + milestone acceleration clause',
          scopeSummary: 'Set fleet-wide embodied AI architecture, compute-to-power budgets, and multi-team safety governance.',
          negotiationFocus: [
            'Secure single-trigger or double-trigger M&A vesting acceleration',
            'Establish annual cash retention bonus tied to fleet deployment milestones',
            'Negotiate executive advisory board carve-outs for academic publications',
          ],
        },
      },
    };
  }

  if (text.includes('security') || text.includes('cyber') || text.includes('zero trust')) {
    return {
      key: 'security',
      domainLabel: 'Cyber Defense & Sovereign Cloud',
      roleStem: 'Zero-Trust Security Architect',
      levels: {
        Junior: {
          bandLabel: 'L3 · Security Platform Engineer I',
          experienceRange: '0–2 yrs',
          suggestedYearsExp: 2,
          baselineCurrentSalary: 112000,
          baseSalary: 126000,
          annualBonus: 14000,
          annualEquity: 22000,
          totalComp: 162000,
          percentiles: { p25: 138000, p50: 162000, p75: 185000, p90: 210000 },
          vestingSchedule: '4-yr quarterly vesting + clearance premium',
          scopeSummary: 'Implement IAM policy-as-code, automated vulnerability scanners, and enclave telemetry collectors.',
          negotiationFocus: [
            'Verify clearance sponsorship bonus and annual certification reimbursement',
            'Benchmark base salary against defense-tech and hyperscaler security bands',
            'Request paid on-call rotation stipends in employment offer',
          ],
        },
        Senior: {
          bandLabel: 'L5 · Senior Cryptographic & Enclave Engineer',
          experienceRange: '5–8 yrs',
          suggestedYearsExp: 6,
          baselineCurrentSalary: 175000,
          baseSalary: 192000,
          annualBonus: 28000,
          annualEquity: 72000,
          totalComp: 292000,
          percentiles: { p25: 252000, p50: 292000, p75: 340000, p90: 390000 },
          vestingSchedule: '4-yr vesting + quarterly RSU / tender liquidity',
          scopeSummary: 'Architect FedRAMP High / IL-5 isolation boundaries, HSM key ceremonies, and memory-safe Rust services.',
          negotiationFocus: [
            'Negotiate TS/SCI or sovereign clearance differential on top of base',
            'Secure guaranteed annual equity refreshers tied to compliance delivery',
            'Confirm remote vs. SCIF on-site stipend terms in writing',
          ],
        },
        Principal: {
          bandLabel: 'L7 · Principal Sovereign Security Architect',
          experienceRange: '10+ yrs',
          suggestedYearsExp: 11,
          baselineCurrentSalary: 235000,
          baseSalary: 242000,
          annualBonus: 48000,
          annualEquity: 160000,
          totalComp: 450000,
          percentiles: { p25: 385000, p50: 450000, p75: 530000, p90: 620000 },
          vestingSchedule: '4-yr RSU + change-of-control acceleration',
          scopeSummary: 'Govern cryptographic attestation standards, post-quantum migration roadmaps, and board-level risk posture.',
          negotiationFocus: [
            'Anchor total package at P75+ using peer sovereign cloud benchmarks',
            'Include D&O liability indemnification rider for CISO-adjacent sign-offs',
            'Negotiate multi-year cliff-free quarterly equity refresh guarantees',
          ],
        },
      },
    };
  }

  return {
    key: 'ai_infra',
    domainLabel: 'Frontier AI & Distributed Compute',
    roleStem: 'AI Infrastructure Architect',
    levels: {
      Junior: {
        bandLabel: 'L3 · AI Systems Engineer I',
        experienceRange: '0–2 yrs',
        suggestedYearsExp: 2,
        baselineCurrentSalary: 118000,
        baseSalary: 138000,
        annualBonus: 16000,
        annualEquity: 36000,
        totalComp: 190000,
        percentiles: { p25: 162000, p50: 190000, p75: 220000, p90: 255000 },
        vestingSchedule: '4-yr RSU / tender-eligible equity (quarterly vest)',
        scopeSummary: 'Maintain Kubernetes GPU training jobs, benchmark inference throughput, and automate cluster health telemetry.',
        negotiationFocus: [
          'Optimize for cash sign-on + base growth while capturing early equity upside',
          'Confirm compute lab access and conference publication budget',
          'Use competing frontier lab new-grad bands to move from P50 toward P75',
        ],
      },
      Senior: {
        bandLabel: 'L5 · Senior Distributed Systems Engineer',
        experienceRange: '5–8 yrs',
        suggestedYearsExp: 6,
        baselineCurrentSalary: 175000,
        baseSalary: 198000,
        annualBonus: 32000,
        annualEquity: 105000,
        totalComp: 335000,
        percentiles: { p25: 285000, p50: 335000, p75: 395000, p90: 460000 },
        vestingSchedule: '4-yr vesting + annual performance equity refresher',
        scopeSummary: 'Design multi-node Ray / vLLM serving topologies, InfiniBand RDMA tuning, and fault-tolerant checkpointing.',
        negotiationFocus: [
          'Anchor negotiation on Year-1 liquid equity + sign-on cliff bridge',
          'Leverage scarce GPU kernel / cluster optimization scarcity for +15% RSU bump',
          'Request structured 6-month promo review toward Staff / Principal scope',
        ],
      },
      Principal: {
        bandLabel: 'L7 · Principal AI Infrastructure Architect',
        experienceRange: '10+ yrs',
        suggestedYearsExp: 11,
        baselineCurrentSalary: 235000,
        baseSalary: 255000,
        annualBonus: 55000,
        annualEquity: 230000,
        totalComp: 540000,
        percentiles: { p25: 445000, p50: 540000, p75: 650000, p90: 790000 },
        vestingSchedule: 'High-liquidity tender RSU + annual executive refresher',
        scopeSummary: 'Architect 32k+ accelerator fabrics, define company-wide inference cost SLAs, and sponsor cross-org RFCs.',
        negotiationFocus: [
          'Negotiate upfront annual equity refresh schedule locked into offer letter',
          'Benchmark total comp against hyperscaler L7 and top AI lab Principal bands',
          'Include severance protection + accelerated vesting on organizational re-scope',
        ],
      },
    },
  };
}

export function buildLevelRoleTitle(currentTargetRole: string, level: RoleSeniorityLevel, fallbackStem: string): string {
  const cleaned = (currentTargetRole || '').trim();
  if (!cleaned) {
    return `${level} ${fallbackStem}`;
  }
  const stripped = cleaned.replace(/^(junior|entry-level|mid-level|senior|staff|principal|lead)\s+/i, '').trim();
  return `${level} ${stripped || fallbackStem}`;
}

export function getRoleCompensationBenchmarks(
  targetRole: string,
  targetIndustry?: string
): Record<RoleSeniorityLevel, RoleCompensationBenchmark> {
  const profile = detectDomainProfile(targetRole, targetIndustry);
  return {
    Junior: {
      level: 'Junior',
      domainLabel: profile.domainLabel,
      sampleTitle: buildLevelRoleTitle(targetRole, 'Junior', profile.roleStem),
      ...profile.levels.Junior,
    },
    Senior: {
      level: 'Senior',
      domainLabel: profile.domainLabel,
      sampleTitle: buildLevelRoleTitle(targetRole, 'Senior', profile.roleStem),
      ...profile.levels.Senior,
    },
    Principal: {
      level: 'Principal',
      domainLabel: profile.domainLabel,
      sampleTitle: buildLevelRoleTitle(targetRole, 'Principal', profile.roleStem),
      ...profile.levels.Principal,
    },
  };
}

interface RoleBenchmarkSwitcherProps {
  selectedLevel: RoleSeniorityLevel;
  onSelectLevel: (level: RoleSeniorityLevel, benchmark: RoleCompensationBenchmark) => void;
  targetRole: string;
  targetIndustry?: string;
  currentTargetSalary: number;
  autoSyncRoadmap: boolean;
  onToggleAutoSync: (next: boolean) => void;
  onApplyBenchmark: (benchmark: RoleCompensationBenchmark) => void;
}

export default function RoleBenchmarkSwitcher({
  selectedLevel,
  onSelectLevel,
  targetRole,
  targetIndustry,
  currentTargetSalary,
  autoSyncRoadmap,
  onToggleAutoSync,
  onApplyBenchmark,
}: RoleBenchmarkSwitcherProps) {
  const benchmarks = getRoleCompensationBenchmarks(targetRole, targetIndustry);
  const active = benchmarks[selectedLevel];

  const basePct = Math.round((active.baseSalary / active.totalComp) * 100);
  const bonusPct = Math.round((active.annualBonus / active.totalComp) * 100);
  const equityPct = Math.max(0, 100 - basePct - bonusPct);

  const deltaVsMedian = currentTargetSalary - active.percentiles.p50;
  const deltaSign = deltaVsMedian >= 0 ? '+' : '-';
  const absDelta = Math.abs(deltaVsMedian);

  return (
    <section
      aria-label="Role Compensation Benchmarks by Seniority Level"
      className="panel border border-[#1e2b36] bg-[#111a22] rounded-xl p-5 shadow-lg space-y-5"
    >
      {/* Top Row: Heading + Junior / Senior / Principal Segmented Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1e2b36]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#7a8b99] font-mono">
            <span>Compensation Benchmark Explorer</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#22d3a5]">{active.domainLabel}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#dce7f0] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#22d3a5] shrink-0" />
            <span>{active.sampleTitle}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7a8b99]">
            <span>{active.bandLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{active.experienceRange}</span>
            <span aria-hidden="true">·</span>
            <span>{active.vestingSchedule}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          {/* Segmented Control */}
          <div
            role="tablist"
            aria-label="Select seniority benchmark tier"
            className="inline-flex items-center p-1 bg-[#0a0f14] border border-[#1e2b36] rounded-lg gap-1"
          >
            {ROLE_SENIORITY_LEVELS.map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectLevel(level, benchmarks[level])}
                  className={`px-4 py-2 min-h-[40px] rounded-md text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3a5] ${
                    isSelected
                      ? 'bg-[#22d3a5] text-black shadow-sm'
                      : 'text-[#94a3b8] hover:text-[#dce7f0] hover:bg-[#141f2a]'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {/* Sync Control */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-mono text-[#94a3b8] cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoSyncRoadmap}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#22d3a5] rounded cursor-pointer"
              />
              <span>Auto-sync roadmap</span>
            </label>
            {!autoSyncRoadmap && (
              <button
                type="button"
                onClick={() => onApplyBenchmark(active)}
                className="px-3 py-2 min-h-[40px] rounded-lg bg-[#0a0f14] hover:bg-[#162738] border border-[#22d3a5]/60 text-[#22d3a5] text-xs font-mono font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Apply to Roadmap</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compensation Mix Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3.5">
          <div className="text-[11px] font-mono text-[#7a8b99]">Base Salary</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#dce7f0] mt-1">
            ${active.baseSalary.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[#7a8b99] mt-0.5">
            {basePct}% of total comp
          </div>
        </div>

        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3.5">
          <div className="text-[11px] font-mono text-[#7a8b99]">Target Bonus</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#38bdf8] mt-1">
            ${active.annualBonus.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[#7a8b99] mt-0.5">
            {bonusPct}% annual cash target
          </div>
        </div>

        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3.5">
          <div className="text-[11px] font-mono text-[#7a8b99]">Annual Equity / RSU</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#fbbf24] mt-1">
            ${active.annualEquity.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[#7a8b99] mt-0.5">
            {equityPct}% annualized grant
          </div>
        </div>

        <div className="bg-[#0a0f14] border border-[#22d3a5]/50 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#22d3a5]">
            <span>Median Total Comp (P50)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#22d3a5] mt-1">
            ${active.totalComp.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[#94a3b8] mt-0.5">
            {absDelta < 1000
              ? 'Aligned with roadmap target'
              : `Roadmap ${deltaSign}$${absDelta.toLocaleString()} vs P50`}
          </div>
        </div>
      </div>

      {/* Compensation Mix Bar & Market Percentile Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>Market Total Compensation Distribution (USD / yr)</span>
            <span className="tabular-nums text-[#dce7f0]">
              Spread: ${active.percentiles.p25.toLocaleString()} – ${active.percentiles.p90.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {(
              [
                { label: 'P25 Entry', val: active.percentiles.p25, highlight: false },
                { label: 'P50 Median', val: active.percentiles.p50, highlight: true },
                { label: 'P75 Upper', val: active.percentiles.p75, highlight: false },
                { label: 'P90 Top Decile', val: active.percentiles.p90, highlight: false },
              ] as const
            ).map((band) => (
              <div
                key={band.label}
                className={`p-2.5 rounded-lg border ${
                  band.highlight
                    ? 'bg-[#22d3a5]/10 border-[#22d3a5]/50 text-[#22d3a5]'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#dce7f0]'
                }`}
              >
                <div className="text-[10px] text-[#7a8b99]">{band.label}</div>
                <div className="font-bold tabular-nums mt-0.5">${band.val.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Base / Bonus / Equity Composition Split Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#7a8b99]">
              <span>Compensation Structure Mix</span>
              <span className="tabular-nums">
                Base {basePct}% · Bonus {bonusPct}% · Equity {equityPct}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden bg-[#0a0f14] border border-[#1e2b36] flex">
              <div
                className="h-full bg-[#dce7f0] transition-all duration-200"
                style={{ width: `${basePct}%` }}
                title={`Base: ${basePct}%`}
              />
              <div
                className="h-full bg-[#38bdf8] transition-all duration-200"
                style={{ width: `${bonusPct}%` }}
                title={`Bonus: ${bonusPct}%`}
              />
              <div
                className="h-full bg-[#fbbf24] transition-all duration-200"
                style={{ width: `${equityPct}%` }}
                title={`Equity: ${equityPct}%`}
              />
            </div>
          </div>
        </div>

        {/* Scope & Negotiation Levers for Selected Level */}
        <div className="lg:col-span-5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 space-y-2.5">
          <div className="text-xs font-mono font-semibold text-[#dce7f0]">
            {selectedLevel} Scope &amp; Negotiation Levers
          </div>
          <p className="text-xs text-[#94a3b8] leading-relaxed">{active.scopeSummary}</p>
          <ul className="space-y-1.5 pt-1 border-t border-[#1e2b36]">
            {active.negotiationFocus.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#dce7f0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
