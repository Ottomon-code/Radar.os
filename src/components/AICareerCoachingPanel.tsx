import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  HeartPulse,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCw,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useSavedItems } from '../context/SavedItemsContext';
import { WeeklyCoachingReport } from '../utils/sentimentCoachEngine';

interface AICareerCoachingPanelProps {
  onNavigateToCareer?: (role: string, salary?: number) => void;
  onNavigateToJobs?: (keyword?: string) => void;
  onNavigateToFinance?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

const EMPTY_REPORT: WeeklyCoachingReport = {
  timestamp: '',
  weekLabel: 'Current Sprint',
  totalItemsAnalyzed: 0,
  stressIndex: 0,
  stressLevel: 'Restorative (Low)',
  stressColor: '#22d3a5',
  stressTrend: { delta: 0, direction: 'steady' },
  stressDrivers: [],
  stressRelievers: [],
  trajectoryVelocity: 0,
  trajectoryRating: 'Consolidating Baseline',
  trajectoryColor: '#64748b',
  trajectoryTrend: { delta: 0, direction: 'steady' },
  trajectoryInsights:
    'Save at least one live ATS job, career roadmap, or grounded brief to analyze real sentiment and burnout coaching telemetry.',
  overallSentiment: 'Balanced Equilibrium',
  sentimentScore: 0,
  distribution: { positivePct: 0, neutralPct: 100, stressPct: 0 },
  weeklyDirectives: [],
  itemEvaluations: [],
};

export default function AICareerCoachingPanel({
  onNavigateToFinance,
  defaultExpanded = true,
  className = '',
}: AICareerCoachingPanelProps) {
  const { savedJobs, savedCareerPaths, savedNews } = useSavedItems();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeSubTab, setActiveSubTab] = useState<'brief' | 'stress' | 'items'>('brief');
  const [completedDirectives, setCompletedDirectives] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [showDeescalateModal, setShowDeescalateModal] = useState(false);
  const [coachingReport, setCoachingReport] = useState<WeeklyCoachingReport>(EMPTY_REPORT);

  const runLiveCoachingAnalysis = useCallback(async () => {
    setIsScanning(true);
    setCoachError(null);
    try {
      const res = await fetch('/api/coaching/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedJobs,
          savedCareerPaths,
          savedNews,
        }),
      });
      if (res.ok) {
        const data: WeeklyCoachingReport = await res.json();
        setCoachingReport(data);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setCoachError(
          errBody?.error ||
            `Live Gemini coaching engine unavailable (${res.status}). Verify GEMINI_API_KEY in Settings > Secrets.`
        );
      }
    } catch (err: any) {
      setCoachError(
        err?.message ||
          'Unable to reach /api/coaching/analyze. Check GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsScanning(false);
    }
  }, [savedJobs, savedCareerPaths, savedNews]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runLiveCoachingAnalysis();
    }, 250);
    return () => clearTimeout(timer);
  }, [runLiveCoachingAnalysis]);

  const toggleDirective = (idx: number) => {
    if (completedDirectives.includes(idx)) {
      setCompletedDirectives(completedDirectives.filter((i) => i !== idx));
    } else {
      setCompletedDirectives([...completedDirectives, idx]);
    }
  };

  const handleCopyReport = () => {
    const text = `=== AI CAREER COACHING TELEMETRY ===
${coachingReport.weekLabel}
Total Items Analyzed: ${coachingReport.totalItemsAnalyzed}

• STRESS INDEX: ${coachingReport.stressIndex}/100 (${coachingReport.stressLevel})
• TRAJECTORY VELOCITY: ${coachingReport.trajectoryVelocity}/100 (${coachingReport.trajectoryRating})
• OVERALL SENTIMENT: ${coachingReport.overallSentiment} (${coachingReport.sentimentScore > 0 ? '+' : ''}${coachingReport.sentimentScore})

EXECUTIVE SUMMARY:
${coachingReport.trajectoryInsights}

WEEKLY ACTIONABLE DIRECTIVES:
${coachingReport.weeklyDirectives
  .map(
    (d, i) =>
      `${i + 1}. [${d.category}] ${d.title}
   - Advice: ${d.advice}
   - Action: ${d.actionItem}`
  )
  .join('\n\n')}

PRIMARY STRESS DRIVERS:
${coachingReport.stressDrivers.map((s) => `• ${s}`).join('\n') || 'None detected'}

PRIMARY BUFFER RELIEVERS:
${coachingReport.stressRelievers.map((s) => `• ${s}`).join('\n') || 'None detected'}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const directiveTotal = Math.max(1, coachingReport.weeklyDirectives.length);

  return (
    <div className={`panel bg-gradient-to-br from-[#0c131a] via-[#111a22] to-[#142332] border border-[#1e2b36] hover:border-[#3b82f6]/40 rounded-xl overflow-hidden shadow-2xl transition duration-200 ${className}`}>
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-[#1e2b36] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-[#0a0f14] border border-[#22d3a5]/40 text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.15)] shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22d3a5] ring-2 ring-[#0a0f14]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30 font-bold tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI CAREER COACHING
              </span>
              <span className="text-[11px] font-mono text-[#7a8b99]">
                {coachingReport.weekLabel}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0a0f14] text-[#7a8b99] border border-[#1e2b36]">
                {coachingReport.totalItemsAnalyzed} Saved Artifacts
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-mono text-[#dce7f0] mt-1 flex items-center gap-2">
              TRAJECTORY VELOCITY &amp; STRESS TELEMETRY
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
              Live Gemini 4 Hydrogen sentiment evaluation and cognitive load profiling synthesized from your bookmarked vault.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          <button
            onClick={runLiveCoachingAnalysis}
            disabled={isScanning}
            title="Recalculate with Gemini 4 Hydrogen"
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-[#7a8b99] hover:text-[#22d3a5] transition flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#22d3a5]' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'Analyzing...' : 'Recalculate'}</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6] text-[#7a8b99] hover:text-[#3b82f6] transition flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                <span className="text-[#22d3a5]">Copied Brief</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Brief</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#7a8b99] text-[#7a8b99] hover:text-[#dce7f0] transition flex items-center gap-1"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KPI Gauge Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#0a0f14]/60 border-b border-[#1e2b36] font-mono">
        <div className="p-3 rounded-lg bg-[#111a22]/80 border border-[#1e2b36] relative overflow-hidden group">
          <div className="flex items-center justify-between text-[10px] text-[#7a8b99]">
            <span className="flex items-center gap-1 font-semibold">
              <HeartPulse className="w-3.5 h-3.5 text-[#f87171]" />
              STRESS INDEX
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                coachingReport.stressIndex > 65
                  ? 'bg-[#f87171]/20 text-[#f87171]'
                  : coachingReport.stressIndex > 40
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                  : 'bg-[#22d3a5]/20 text-[#22d3a5]'
              }`}
            >
              {coachingReport.stressIndex > 65 ? 'ELEVATED' : coachingReport.stressIndex > 40 ? 'BALANCED' : 'RESTORATIVE'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-mono text-[#dce7f0]">
              {coachingReport.stressIndex}
            </span>
            <span className="text-xs text-[#7a8b99]">/100</span>

            <span
              className={`text-[10px] ml-auto flex items-center gap-0.5 font-bold ${
                coachingReport.stressTrend.direction === 'down' ? 'text-[#22d3a5]' : 'text-[#f87171]'
              }`}
            >
              {coachingReport.stressTrend.direction === 'down' ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <ArrowUpRight className="w-3 h-3" />
              )}
              {Math.abs(coachingReport.stressTrend.delta)}%
            </span>
          </div>

          <div className="w-full bg-[#0a0f14] h-1.5 rounded-full overflow-hidden mt-2 border border-[#1e2b36]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${coachingReport.stressIndex}%`,
                backgroundColor: coachingReport.stressColor,
              }}
            />
          </div>
          <div className="text-[10px] text-[#7a8b99] mt-1.5 truncate">
            {coachingReport.stressLevel}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#111a22]/80 border border-[#1e2b36] relative overflow-hidden group">
          <div className="flex items-center justify-between text-[10px] text-[#7a8b99]">
            <span className="flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-[#22d3a5]" />
              CAREER VELOCITY
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#22d3a5]/10 text-[#22d3a5] font-bold">
              {coachingReport.totalItemsAnalyzed > 0 ? 'TRACKING' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-mono text-[#22d3a5]">
              {coachingReport.trajectoryVelocity}
            </span>
            <span className="text-xs text-[#7a8b99]">/100</span>

            <span className="text-[10px] ml-auto flex items-center gap-0.5 text-[#22d3a5] font-bold">
              <ArrowUpRight className="w-3 h-3" />
              {coachingReport.trajectoryTrend.delta >= 0 ? `+${coachingReport.trajectoryTrend.delta}%` : `${coachingReport.trajectoryTrend.delta}%`}
            </span>
          </div>

          <div className="w-full bg-[#0a0f14] h-1.5 rounded-full overflow-hidden mt-2 border border-[#1e2b36]">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#22d3a5]"
              style={{ width: `${coachingReport.trajectoryVelocity}%` }}
            />
          </div>
          <div className="text-[10px] text-[#dce7f0] font-semibold mt-1.5 truncate">
            {coachingReport.trajectoryRating}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#111a22]/80 border border-[#1e2b36]">
          <div className="flex items-center justify-between text-[10px] text-[#7a8b99]">
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#3b82f6]" />
              VALENCE SCORE
            </span>
            <span className="text-[9px] text-[#7a8b99]">
              {coachingReport.sentimentScore > 0 ? `+${coachingReport.sentimentScore}` : coachingReport.sentimentScore}
            </span>
          </div>

          <div className="text-sm font-bold text-[#dce7f0] mt-1.5 truncate">
            {coachingReport.overallSentiment}
          </div>

          <div className="flex w-full h-1.5 rounded-full overflow-hidden mt-2 bg-[#0a0f14] border border-[#1e2b36]">
            <div
              style={{ width: `${coachingReport.distribution.positivePct}%` }}
              className="bg-[#22d3a5] h-full"
            />
            <div
              style={{ width: `${coachingReport.distribution.neutralPct}%` }}
              className="bg-[#3b82f6] h-full"
            />
            <div
              style={{ width: `${coachingReport.distribution.stressPct}%` }}
              className="bg-[#f87171] h-full"
            />
          </div>

          <div className="flex justify-between text-[9px] text-[#7a8b99] mt-1.5">
            <span className="text-[#22d3a5]">{coachingReport.distribution.positivePct}% Bullish</span>
            <span className="text-[#f87171]">{coachingReport.distribution.stressPct}% Friction</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#111a22]/80 border border-[#1e2b36] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-[#7a8b99]">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
              WEEKLY PACING
            </span>
            <span className="text-[9px] text-[#fbbf24] font-bold">
              {completedDirectives.length}/{coachingReport.weeklyDirectives.length} DONE
            </span>
          </div>

          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-[#dce7f0]">
              {coachingReport.weeklyDirectives.length === 0
                ? 0
                : Math.round((completedDirectives.length / directiveTotal) * 100)}%
            </span>
            <span className="text-xs text-[#7a8b99] ml-1">Directives Checked</span>
          </div>

          <button
            onClick={() => setShowDeescalateModal(true)}
            className="mt-1 text-[10px] text-[#3b82f6] hover:text-[#60a5fa] hover:underline flex items-center gap-1 text-left"
          >
            <span>Stress Protocol &gt;</span>
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 font-mono">
          {coachError && (
            <div className="p-3 rounded-lg bg-[#f87171]/10 border border-[#f87171]/40 text-xs text-[#f87171] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{coachError}</span>
              </div>
              <button
                onClick={runLiveCoachingAnalysis}
                className="px-2.5 py-1 rounded bg-[#0a0f14] border border-[#f87171]/40 hover:border-[#f87171] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('brief')}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  activeSubTab === 'brief'
                    ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                Weekly Coaching Brief &amp; Directives
              </button>

              <button
                onClick={() => setActiveSubTab('stress')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                  activeSubTab === 'stress'
                    ? 'bg-[#f87171]/20 border-[#f87171] text-[#f87171] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Stress Drivers &amp; Buffers</span>
              </button>

              <button
                onClick={() => setActiveSubTab('items')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                  activeSubTab === 'items'
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Saved Items Inspector ({coachingReport.itemEvaluations.length})</span>
              </button>
            </div>

            <span className="hidden sm:inline text-[11px] text-[#7a8b99]">
              {coachingReport.totalItemsAnalyzed === 0
                ? 'Awaiting Saved Vault Items'
                : 'Model Confidence: Live Gemini Assessment'}
            </span>
          </div>

          {/* VIEW 1: WEEKLY COACHING BRIEF */}
          {activeSubTab === 'brief' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#7a8b99]">
                  <span className="text-[#22d3a5] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    EXECUTIVE TRAJECTORY ASSESSMENT
                  </span>
                  <span>{isScanning ? 'Analyzing saved vault...' : 'Live Gemini evaluation'}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#dce7f0] leading-relaxed">
                  {coachingReport.trajectoryInsights}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#7a8b99] px-1">
                  <span className="text-[#3b82f6] font-bold">
                    PRIORITY ACTION DIRECTIVES FOR THIS SPRINT ({coachingReport.weeklyDirectives.length})
                  </span>
                  <span>Click checkbox to track completion</span>
                </div>

                {coachingReport.weeklyDirectives.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#7a8b99]">
                    Bookmark at least one live job requisition, career roadmap, or industry brief to generate personalized weekly directives.
                  </div>
                ) : (
                  coachingReport.weeklyDirectives.map((directive, idx) => {
                    const isChecked = completedDirectives.includes(idx);
                    return (
                      <div
                        key={directive.title}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#0a0f14]/80 border-[#22d3a5]/40 opacity-75'
                            : 'bg-[#111a22] border-[#1e2b36] hover:border-[#3b82f6]/60'
                        }`}
                        onClick={() => toggleDirective(idx)}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 text-[#22d3a5]"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDirective(idx);
                            }}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 fill-[#22d3a5]/20 text-[#22d3a5]" />
                            ) : (
                              <div className="w-5 h-5 rounded-md border border-[#7a8b99]/50 hover:border-[#22d3a5]" />
                            )}
                          </button>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  directive.category === 'Stress Regulation'
                                    ? 'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30'
                                    : directive.category === 'Trajectory Acceleration'
                                    ? 'bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30'
                                    : 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                                }`}
                              >
                                {directive.category}
                              </span>
                              <h4
                                className={`text-sm font-bold ${
                                  isChecked ? 'line-through text-[#7a8b99]' : 'text-[#dce7f0]'
                                }`}
                              >
                                {directive.title}
                              </h4>
                            </div>

                            <p className="text-xs text-[#7a8b99] leading-relaxed">
                              {directive.advice}
                            </p>

                            <div className="pt-1 flex items-center gap-1.5 text-xs text-[#22d3a5]">
                              <span className="font-bold">Next Action:</span>
                              <span className="text-[#dce7f0]">{directive.actionItem}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: STRESS DRIVERS & BUFFERS */}
          {activeSubTab === 'stress' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#f87171]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>IDENTIFIED STRESS DRIVERS &amp; FRICTIONS</span>
                </div>
                <p className="text-[11px] text-[#7a8b99]">
                  Factors detected in your saved jobs, skill gaps, or macro news raising cognitive tension.
                </p>

                {coachingReport.stressDrivers.length > 0 ? (
                  <ul className="space-y-2">
                    {coachingReport.stressDrivers.map((driver, i) => (
                      <li
                        key={i}
                        className="text-xs p-2.5 rounded bg-[#0a0f14] border border-[#f87171]/20 text-[#dce7f0] flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] mt-1.5 shrink-0" />
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 rounded bg-[#0a0f14] text-xs text-[#22d3a5] text-center">
                    Zero major stress drivers detected in current saved items.
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setShowDeescalateModal(true)}
                    className="w-full py-2 rounded-lg bg-[#f87171]/10 hover:bg-[#f87171]/20 border border-[#f87171]/30 text-xs font-bold text-[#f87171] transition flex items-center justify-center gap-1.5"
                  >
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>Run Stress De-escalation Protocol</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#22d3a5]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>STRESS BUFFERS &amp; QUALIFICATION ADVANTAGES</span>
                </div>
                <p className="text-[11px] text-[#7a8b99]">
                  Assets in your bookmarks that actively protect you against career burnout and market risk.
                </p>

                {coachingReport.stressRelievers.length > 0 ? (
                  <ul className="space-y-2">
                    {coachingReport.stressRelievers.map((reliever, i) => (
                      <li
                        key={i}
                        className="text-xs p-2.5 rounded bg-[#0a0f14] border border-[#22d3a5]/20 text-[#dce7f0] flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] mt-1.5 shrink-0" />
                        <span>{reliever}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 rounded bg-[#0a0f14] text-xs text-[#7a8b99] text-center">
                    Bookmark requisitions with high match scores or remote flexibility to build buffers.
                  </div>
                )}

                {onNavigateToFinance && (
                  <div className="pt-2">
                    <button
                      onClick={onNavigateToFinance}
                      className="w-full py-2 rounded-lg bg-[#22d3a5]/10 hover:bg-[#22d3a5]/20 border border-[#22d3a5]/30 text-xs font-bold text-[#22d3a5] transition flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Review ZOPA Leverage Range</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: SAVED ITEMS SENTIMENT INSPECTOR */}
          {activeSubTab === 'items' && (
            <div className="space-y-3">
              <div className="text-xs text-[#7a8b99] px-1 flex items-center justify-between">
                <span>ITEM-LEVEL SENTIMENT &amp; STRESS WEIGHTING</span>
                <span>Evaluated via Gemini 4 Hydrogen</span>
              </div>

              {coachingReport.itemEvaluations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7a8b99] bg-[#0a0f14] rounded-xl border border-[#1e2b36]">
                  No items currently bookmarked in vault. Save requisitions or news to inspect sentiment tags.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {coachingReport.itemEvaluations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.type === 'job'
                                ? 'bg-[#3b82f6]/20 text-[#3b82f6]'
                                : item.type === 'career'
                                ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              item.sentiment === 'Bullish'
                                ? 'text-[#22d3a5]'
                                : item.sentiment === 'High-Stress'
                                ? 'text-[#f87171]'
                                : 'text-[#7a8b99]'
                            }`}
                          >
                            {item.sentiment}
                          </span>
                        </div>

                        <div className="font-bold text-[#dce7f0]">{item.title}</div>

                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.keyTriggers.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 text-right">
                        <div className="text-[10px] text-[#7a8b99]">STRESS LOAD</div>
                        <div
                          className={`text-sm font-bold ${
                            item.stressContribution > 65
                              ? 'text-[#f87171]'
                              : item.stressContribution > 40
                              ? 'text-[#fbbf24]'
                              : 'text-[#22d3a5]'
                          }`}
                        >
                          {item.stressContribution}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stress De-escalation Protocol Modal */}
      {showDeescalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
          <div className="bg-[#111a22] border border-[#22d3a5] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-2 text-[#22d3a5]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">AI CAREER STRESS DE-ESCALATION</h3>
              </div>
              <button
                onClick={() => setShowDeescalateModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#7a8b99]">
              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-[#dce7f0]">
                <span className="text-[#22d3a5] font-bold block mb-1">1. COGNITIVE PIPELINE LIMIT:</span>
                Never interview at more than 3 companies concurrently. Human context switching degrades technical interview performance by up to 40%.
              </div>

              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-[#dce7f0]">
                <span className="text-[#3b82f6] font-bold block mb-1">2. ARCHIVE SPECULATIVE RISK:</span>
                Remove bookmark alerts for volatile layoffs unless you are actively employed at that specific firm.
              </div>

              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-[#dce7f0]">
                <span className="text-[#fbbf24] font-bold block mb-1">3. BATNA ANCHORING:</span>
                Your strongest psychological shield against interview tension is having a clear Best Alternative to a Negotiated Agreement.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDeescalateModal(false)}
                className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs"
              >
                Acknowledge &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
