import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  DollarSign,
  Milestone,
  CheckCircle,
  Award,
  Zap,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Search,
  MapPin,
  ExternalLink,
  Sparkles,
  Newspaper,
  AlertTriangle,
  Bookmark,
} from 'lucide-react';
import SalaryProgressionChart from './SalaryProgressionChart';
import FiveYearForecastChart from './FiveYearForecastChart';
import InteractiveSkillTree from './InteractiveSkillTree';
import PaywallGate from './PaywallGate';
import RoleBenchmarkSwitcher, {
  RoleSeniorityLevel,
  RoleCompensationBenchmark,
} from './RoleBenchmarkSwitcher';
import {
  CareerPathResult,
  JobAlert,
} from '../utils/radarEngine';
import { useSavedItems } from '../context/SavedItemsContext';

type LiveCareerPathResult = CareerPathResult & {
  matchingJobs?: JobAlert[];
  model?: string;
};

interface CareerTabProps {
  initialTargetRole?: string;
  initialSalary?: number;
  activeJob?: JobAlert | null;
  onSearchJobsForRole?: (role: string, minSalary?: number) => void;
  onNavigateToNews?: (company: string, sector: string) => void;
}

export default function CareerTab({
  initialTargetRole,
  initialSalary,
  onSearchJobsForRole,
  onNavigateToNews,
}: CareerTabProps) {
  const [currentRole, setCurrentRole] = useState('Senior Distributed Systems Engineer');
  const [targetRole, setTargetRole] = useState(
    initialTargetRole || 'Principal AI Infrastructure Architect'
  );
  const [yearsExperience, setYearsExperience] = useState('6');
  const [currentSalary, setCurrentSalary] = useState('175000');
  const [targetSalary, setTargetSalary] = useState(
    initialSalary ? String(initialSalary) : '290000'
  );
  const [targetIndustry, setTargetIndustry] = useState('Frontier Compute & Robotics');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toggleSaveCareerPath, isCareerPathSaved } = useSavedItems();

  const inferLevelFromRole = (role?: string): RoleSeniorityLevel => {
    const lower = (role || '').toLowerCase();
    if (lower.includes('junior') || lower.includes('entry')) return 'Junior';
    if (lower.includes('senior') || lower.includes('staff')) return 'Senior';
    return 'Principal';
  };

  const [selectedBenchmarkLevel, setSelectedBenchmarkLevel] = useState<RoleSeniorityLevel>(() =>
    inferLevelFromRole(initialTargetRole)
  );
  const [autoSyncBenchmark, setAutoSyncBenchmark] = useState<boolean>(true);
  const [careerPath, setCareerPath] = useState<LiveCareerPathResult | null>(null);

  const handleCalculate = useCallback(
    async (
      e?: React.FormEvent,
      overrides?: {
        targetRole?: string;
        targetSalary?: number;
        currentSalary?: number;
        yearsExperience?: number;
      }
    ) => {
      if (e) e.preventDefault();
      setLoading(true);
      setApiError(null);

      const roleToUse = overrides?.targetRole || targetRole;
      const targetSalToUse = overrides?.targetSalary ?? (Number(targetSalary) || 290000);
      const currentSalToUse = overrides?.currentSalary ?? (Number(currentSalary) || 175000);
      const yearsExpToUse = overrides?.yearsExperience ?? (Number(yearsExperience) || 6);

      const payload = {
        currentRole,
        targetRole: roleToUse,
        yearsExperience: yearsExpToUse,
        currentSalary: currentSalToUse,
        targetSalary: targetSalToUse,
        targetIndustry,
      };

      try {
        const res = await fetch('/api/career', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data: LiveCareerPathResult = await res.json();
          setCareerPath(data);
        } else {
          const errBody = await res.json().catch(() => ({}));
          setApiError(
            errBody?.error ||
              `Career trajectory synthesis failed (${res.status}). Verify GEMINI_API_KEY in Settings > Secrets.`
          );
        }
      } catch (err: any) {
        setApiError(
          err?.message ||
            'Unable to reach /api/career. Verify server status and GEMINI_API_KEY in Settings > Secrets.'
        );
      } finally {
        setLoading(false);
      }
    },
    [currentRole, targetRole, yearsExperience, currentSalary, targetSalary, targetIndustry]
  );

  // Initial calculate on mount and when navigating from Radar job search
  useEffect(() => {
    if (initialTargetRole) {
      setTargetRole(initialTargetRole);
      setSelectedBenchmarkLevel(inferLevelFromRole(initialTargetRole));
    }
    if (initialSalary) {
      setTargetSalary(String(initialSalary));
    }
    handleCalculate(undefined, {
      targetRole: initialTargetRole,
      targetSalary: initialSalary,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTargetRole, initialSalary]);

  const applyBenchmarkToTrajectory = (benchmark: RoleCompensationBenchmark) => {
    setTargetRole(benchmark.sampleTitle);
    setCurrentSalary(String(benchmark.baselineCurrentSalary));
    setTargetSalary(String(benchmark.totalComp));
    setYearsExperience(String(benchmark.suggestedYearsExp));
    handleCalculate(undefined, {
      targetRole: benchmark.sampleTitle,
      currentSalary: benchmark.baselineCurrentSalary,
      targetSalary: benchmark.totalComp,
      yearsExperience: benchmark.suggestedYearsExp,
    });
  };

  const handleSelectBenchmarkLevel = (
    level: RoleSeniorityLevel,
    benchmark: RoleCompensationBenchmark
  ) => {
    setSelectedBenchmarkLevel(level);
    if (autoSyncBenchmark) {
      applyBenchmarkToTrajectory(benchmark);
    }
  };

  const matchingLiveJobs = careerPath?.matchingJobs || [];
  const firstSalary = careerPath?.salaryProgression?.[0]?.salary || 0;
  const lastSalary =
    careerPath?.salaryProgression?.[careerPath.salaryProgression.length - 1]?.salary || 0;
  const overallDeltaPct =
    firstSalary > 0 ? Math.round(((lastSalary - firstSalary) / firstSalary) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Search-to-Career Alignment Notice */}
      {initialTargetRole && (
        <div className="panel bg-gradient-to-r from-[#111a22] to-[#142330] border border-[#22d3a5]/40 rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#22d3a5]/20 text-[#22d3a5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-[#22d3a5] font-semibold">
                ROADMAP CALIBRATED FROM JOB SEARCH
              </div>
              <div className="text-sm font-bold font-mono text-[#dce7f0]">
                Target: {targetRole} {targetSalary ? `• Target Comp: $${Number(targetSalary).toLocaleString()}` : ''}
              </div>
            </div>
          </div>

          {onSearchJobsForRole && (
            <button
              onClick={() => onSearchJobsForRole(targetRole, Number(targetSalary))}
              className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-mono text-[#22d3a5] flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              Scan Live Openings on Radar
            </button>
          )}
        </div>
      )}

      {/* Trajectory Configurator Panel */}
      <div className="panel border border-[#1e2b36] bg-[#111a22] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1e2b36]">
          <div>
            <h2 className="text-lg font-bold text-[#dce7f0] font-mono flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#22d3a5]" />
              RADAR TRAJECTORY CALCULATOR
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono">
              Live Gemini 4 Hydrogen career modeling grounded in active external ATS requisitions.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {careerPath && (
              <button
                type="button"
                onClick={() => toggleSaveCareerPath(careerPath)}
                className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition ${
                  isCareerPathSaved(careerPath.targetRole)
                    ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                    : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#22d3a5] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={isCareerPathSaved(careerPath.targetRole) ? '#22d3a5' : 'none'} />
                <span>{isCareerPathSaved(careerPath.targetRole) ? 'Roadmap Bookmarked' : 'Bookmark Roadmap'}</span>
              </button>
            )}
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold">
              {careerPath?.model || 'GEMINI 4 HYDROGEN'}
            </span>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              CURRENT ROLE
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              TARGET ROLE
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              CURRENT SALARY ($)
            </label>
            <input
              type="number"
              value={currentSalary}
              onChange={(e) => setCurrentSalary(e.target.value)}
              className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              TARGET COMP ($)
            </label>
            <input
              type="number"
              value={targetSalary}
              onChange={(e) => setTargetSalary(e.target.value)}
              className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              EXPERIENCE (YRS)
            </label>
            <input
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'SYNTHESIZING...' : 'PROJECT PATH'}
            </button>
          </div>
        </form>
      </div>

      {/* Explicit Error Alert */}
      {apiError && (
        <div className="p-4 rounded-xl bg-[#f87171]/10 border border-[#f87171]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#f87171]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">TRAJECTORY MODELING ERROR</span>
              <span className="text-[#dce7f0]">{apiError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCalculate()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#f87171]/50 hover:border-[#f87171] text-[#f87171] flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Retry Trajectory
          </button>
        </div>
      )}

      {/* Role Level Compensation Benchmark Switcher */}
      <RoleBenchmarkSwitcher
        selectedLevel={selectedBenchmarkLevel}
        onSelectLevel={handleSelectBenchmarkLevel}
        targetRole={targetRole}
        targetIndustry={targetIndustry}
        currentTargetSalary={Number(targetSalary) || careerPath?.targetSalary || 290000}
        autoSyncRoadmap={autoSyncBenchmark}
        onToggleAutoSync={setAutoSyncBenchmark}
        onApplyBenchmark={applyBenchmarkToTrajectory}
      />

      {loading && !careerPath && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-8 text-center font-mono space-y-3">
          <RefreshCw className="w-7 h-7 text-[#22d3a5] animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#dce7f0]">
            Modeling Live Career Trajectory &amp; Matching ATS Open Roles...
          </div>
          <p className="text-xs text-[#7a8b99]">
            Evaluating skill gaps, 5-year salary progression, and public board openings for {targetRole}.
          </p>
        </div>
      )}

      {careerPath && (
        <>
          {/* Trajectory Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#7a8b99]">
                <span>TRANSITION READINESS</span>
                <Award className="w-4 h-4 text-[#22d3a5]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#22d3a5] mt-1">
                {careerPath.readinessScore}%
              </div>
              <p className="text-[11px] text-[#7a8b99] mt-1">
                Estimated runway: <span className="text-[#dce7f0]">{careerPath.estimatedTimelineMonths} months</span> to target offer
              </p>
            </div>

            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#7a8b99]">
                <span>TARGET 5-YR COMP</span>
                <DollarSign className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#3b82f6] mt-1">
                ${lastSalary.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#7a8b99] mt-1">
                Up +{overallDeltaPct}% overall delta
              </p>
            </div>

            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#7a8b99]">
                <span>MATCHING REQUISITIONS</span>
                <Search className="w-4 h-4 text-[#fbbf24]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#fbbf24] mt-1">
                {careerPath.matchingJobsCount ?? matchingLiveJobs.length} Live Openings
              </div>
              <p className="text-[11px] text-[#7a8b99] mt-1">
                Verified across public ATS boards
              </p>
            </div>
          </div>

          {/* Visual Analytics Grid (Line Chart & Area Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#22d3a5]" />
                    SALARY &amp; COMPENSATION PROGRESSION
                  </h3>
                  <p className="text-xs text-[#7a8b99] font-mono">
                    Projected total compensation milestones
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                  LIVE CALIBRATION
                </span>
              </div>

              <SalaryProgressionChart data={careerPath.salaryProgression} />
            </div>

            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
                    REQUISITION DEMAND FORECAST
                  </h3>
                  <p className="text-xs text-[#7a8b99] font-mono">
                    Industry-wide demand curve for {careerPath.targetRole}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">
                  MARKET MODEL
                </span>
              </div>

              <FiveYearForecastChart data={careerPath.forecastDemand} />
            </div>
          </div>

          {/* D3 Interactive Skill Tree */}
          <InteractiveSkillTree
            targetRole={targetRole}
            targetSalary={Number(targetSalary) || 290000}
            currentRole={currentRole}
          />

          {/* Live Market Opportunities for this Target Role */}
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1e2b36]">
              <div>
                <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#22d3a5]" />
                  LIVE ATS REQUISITIONS MATCHING YOUR TARGET ROLE
                </h3>
                <p className="text-xs text-[#7a8b99] font-mono">
                  Positions currently active on Ashby, Greenhouse, and Lever matching this roadmap.
                </p>
              </div>
              {onSearchJobsForRole && (
                <button
                  onClick={() => onSearchJobsForRole(targetRole, Number(targetSalary))}
                  className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 text-[#22d3a5] border border-[#22d3a5]/50 text-xs font-mono flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <span>Search All Openings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {matchingLiveJobs.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs font-mono text-[#7a8b99]">
                No direct live ATS roles matched exact title tokens right now. Use &quot;Search All Openings&quot; to broaden filters on the Radar tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchingLiveJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5]/40 rounded-lg p-3.5 text-xs font-mono flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-[#7a8b99] mb-1">
                        <span className="text-[#3b82f6] font-semibold">{job.company}</span>
                        <span className="text-[#22d3a5]">{job.matchScore}% Match</span>
                      </div>
                      <div className="text-[#dce7f0] font-bold text-sm mb-1">{job.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-[#7a8b99]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        <span className="text-[#22d3a5] font-semibold">{job.salaryRange}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1e2b36]/60 gap-2">
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((s) => (
                          <span key={s} className="px-1.5 py-0.2 bg-[#111a22] text-[#7a8b99] rounded text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#22d3a5] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Apply ATS</span>
                          </a>
                        )}
                        {onNavigateToNews && (
                          <button
                            onClick={() => onNavigateToNews(job.company, job.sector)}
                            className="text-[11px] text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1"
                          >
                            <Newspaper className="w-3 h-3" />
                            <span>Intel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestone Roadmap */}
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow">
            <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2 mb-4">
              <Milestone className="w-4 h-4 text-[#22d3a5]" />
              ACTIONABLE MILESTONE TIMELINE
            </h3>

            <div className="space-y-4">
              {careerPath.milestones.map((m) => (
                <div
                  key={m.step}
                  className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 transition hover:border-[#22d3a5]/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-[#1e2b36]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#22d3a5] text-black text-xs font-mono font-bold">
                        {m.step}
                      </span>
                      <h4 className="text-sm font-bold text-[#dce7f0] font-mono">
                        {m.phase}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-[#3b82f6] px-2 py-0.5 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20">
                      {m.duration}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-[#7a8b99] font-mono text-[11px] block mb-1">
                        EXECUTION GOALS:
                      </span>
                      <ul className="space-y-1.5">
                        {m.goals.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[#dce7f0]">
                            <CheckCircle className="w-3.5 h-3.5 text-[#22d3a5] shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[#7a8b99] font-mono text-[11px] block mb-1">
                        CRITICAL COMPETENCIES TO ACQUIRE:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.criticalSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#22d3a5]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gaps & Strategic Advice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow">
              <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#fbbf24]" />
                CRITICAL SKILL DEFICIT AUDIT FOR {targetRole.toUpperCase()}
              </h3>

              <div className="space-y-3.5">
                {careerPath.skillGaps.map((sg, idx) => (
                  <div key={idx} className="space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-[#dce7f0]">
                      <span className="truncate pr-2">{sg.skill}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          sg.importance === 'Critical'
                            ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30'
                            : 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                        }`}
                      >
                        {sg.importance}
                      </span>
                    </div>
                    <div className="w-full bg-[#0a0f14] rounded-full h-2 overflow-hidden border border-[#1e2b36] flex">
                      <div
                        className="bg-[#22d3a5] h-full transition-all duration-500"
                        style={{ width: `${sg.currentLevel}%` }}
                        title={`Current: ${sg.currentLevel}%`}
                      />
                      <div
                        className="bg-[#3b82f6]/40 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, sg.targetLevel - sg.currentLevel)}%` }}
                        title={`Target Delta: ${sg.targetLevel}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#7a8b99]">
                      <span>Current: {sg.currentLevel}%</span>
                      <span>Target: {sg.targetLevel}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PaywallGate
              requiredTier="pro"
              featureTitle="TACTICAL RECONNAISSANCE & COMPENSATION SCRIPTS"
              featureDescription="Detailed executive negotiation leverage, sign-on acceleration clauses, and unencumbered vesting tactics are restricted to Pro Operators."
              className="h-full"
            >
              <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow h-full">
                <h3 className="text-sm font-bold font-mono text-[#dce7f0] flex items-center gap-2 mb-4">
                  <ArrowRight className="w-4 h-4 text-[#22d3a5]" />
                  TACTICAL RECONNAISSANCE ADVICE
                </h3>

                <div className="space-y-2.5">
                  {careerPath.tacticalAdvice.map((advice, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3 text-xs text-[#dce7f0] flex items-start gap-2.5"
                    >
                      <span className="font-mono text-[#22d3a5] font-bold">0{idx + 1}.</span>
                      <p className="leading-relaxed">{advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PaywallGate>
          </div>
        </>
      )}
    </div>
  );
}
