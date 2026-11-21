import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  MapPin,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  X,
  Crosshair,
  Compass,
  Newspaper,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  RotateCcw,
  Bookmark,
  SlidersHorizontal,
  Lock,
  Unlock,
  Zap,
  Crown,
  Bell,
  BellRing,
  BellOff,
  Activity,
  Flame,
  RefreshCw,
  BarChart3,
  Globe2,
  ExternalLink,
} from 'lucide-react';
import RadarGlobe3D from './RadarGlobe3D';
import AICareerCoachingPanel from './AICareerCoachingPanel';
import JobAlertsNotificationDrawer from './JobAlertsNotificationDrawer';
import DailyMarketInsightBanner from './DailyMarketInsightBanner';
import HighlightText from './HighlightText';
import {
  JobAlert,
  JobSearchParams,
} from '../utils/radarEngine';
import { useSavedItems } from '../context/SavedItemsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useJobAlerts } from '../context/JobAlertsContext';
import { MarketRadarData } from '../types/marketRadar';
import { RadarSkeleton } from './Skeletons';

interface RadarTabProps {
  onNavigateToCareer?: (targetRole: string, targetSalary?: number, job?: JobAlert) => void;
  onNavigateToNews?: (company: string, sector: string, keywords?: string) => void;
  onNavigateToFinance?: () => void;
  initialSearch?: {
    keywords?: string;
    location?: string;
    minSalary?: number;
    maxSalary?: number;
  };
}

const LOCATION_PRESETS = [
  'All',
  'Remote',
  'San Francisco',
  'New York',
  'London',
  'Chicago',
  'Zurich',
  'Tokyo',
  'Singapore',
  'Austin',
  'Toronto',
  'Bengaluru',
  'Tel Aviv',
  'Stockholm',
];

const SALARY_PRESETS = [
  { label: 'Any Salary', min: 0 },
  { label: '$180k+', min: 180000 },
  { label: '$220k+', min: 220000 },
  { label: '$260k+', min: 260000 },
  { label: '$300k+', min: 300000 },
];

const SALARY_RANGE_BRACKETS = [
  { label: 'All ($0 - $600k+)', min: 0, max: 600000 },
  { label: 'Foundational ($120k - $220k)', min: 120000, max: 220000 },
  { label: 'Senior ($180k - $320k)', min: 180000, max: 320000 },
  { label: 'Staff / Tech Lead ($240k - $420k)', min: 240000, max: 420000 },
  { label: 'Principal ($300k - $520k)', min: 300000, max: 520000 },
  { label: 'Executive ($380k - $600k+)', min: 380000, max: 600000 },
];

const SUGGESTED_KEYWORDS = [
  'Commercial SpaceTech / Defense Avionics',
  'Computational Genomics',
  'Next-Gen Energy Grid Optimization',
  'CUDA & Triton',
  'Distributed Systems',
  'Rust',
  'Autonomous Robotics',
  'HFT C++',
  'Zero Trust GovCloud',
  'Reasoning Agents',
];

export default function RadarTab({
  onNavigateToCareer,
  onNavigateToNews,
  onNavigateToFinance,
  initialSearch,
}: RadarTabProps) {
  // Search inputs
  const [keywords, setKeywords] = useState(initialSearch?.keywords || '');
  const [location, setLocation] = useState(initialSearch?.location || 'All');
  const [minSalary, setMinSalary] = useState<number>(initialSearch?.minSalary || 0);
  const [maxSalary, setMaxSalary] = useState<number>(initialSearch?.maxSalary || 600000);
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');

  // Search Results State (Live External ATS Feed)
  const [jobs, setJobs] = useState<JobAlert[]>([]);
  const [matchedSector, setMatchedSector] = useState<string>('Frontier AI & Cloud Infrastructure');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(true);
  const [atsMeta, setAtsMeta] = useState<{
    isLive: boolean;
    scrapedAt: string;
    boardCount: number;
    boardsSucceeded: number;
    totalOpeningsAcrossBoards: number;
    returnedSignals: number;
  } | null>(null);
  const [isRefreshingAts, setIsRefreshingAts] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Interaction State
  const [selectedJob, setSelectedJob] = useState<JobAlert | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [selectedCityNode, setSelectedCityNode] = useState<string | null>(null);

  // Global Saved Items / Bookmarking
  const { toggleSaveJob, isJobSaved } = useSavedItems();

  // Subscription / Security Clearance State
  const { tier, isPro, openPaywall } = useSubscription();

  // Job Alert Telemetry & Subscriptions
  const {
    subscriptions,
    subscribeToAlert,
    isSubscribedToCriteria,
    unreadCount,
    notifications,
    markNotificationAsRead,
  } = useJobAlerts();
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [alertSubscriptionToast, setAlertSubscriptionToast] = useState<string | null>(null);
  const [activeSimulatedAlertPopup, setActiveSimulatedAlertPopup] = useState<any | null>(null);

  // Real-Time Job Market Data & Radar Telemetry State
  const [marketRadar, setMarketRadar] = useState<MarketRadarData | null>(null);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);
  const [radarLastFetched, setRadarLastFetched] = useState<string>('');

  const fetchMarketRadarTelemetry = useCallback(async (hub?: string) => {
    setIsLoadingRadar(true);
    try {
      const url = hub && hub !== 'All' 
        ? `/api/jobs/market-radar?hub=${encodeURIComponent(hub)}` 
        : '/api/jobs/market-radar';
      const res = await fetch(url);
      if (res.ok) {
        const data: MarketRadarData = await res.json();
        setMarketRadar(data);
        setRadarLastFetched(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.warn('Real-time market radar telemetry fetch fallback:', err);
    } finally {
      setIsLoadingRadar(false);
    }
  }, []);

  // Fetch real-time market data on mount & periodic 60s stream update
  useEffect(() => {
    fetchMarketRadarTelemetry();
    const interval = setInterval(() => {
      fetchMarketRadarTelemetry();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketRadarTelemetry]);

  const currentCriteria = {
    keywords,
    location,
    minSalary,
    maxSalary,
    urgency: selectedUrgency,
  };
  const isCurrentlySubscribed = isSubscribedToCriteria(currentCriteria);

  const handleSubscribeCurrentSearch = () => {
    const sub = subscribeToAlert(currentCriteria);
    setAlertSubscriptionToast(
      `ALERT SUBSCRIBED // Logged criteria: "${sub.title}". Monitoring live Ashby, Greenhouse & Lever feeds.`
    );
    setTimeout(() => {
      setAlertSubscriptionToast(null);
    }, 4500);
  };

  // Real-time listener for incoming simulated alerts
  const lastNotifCountRef = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > lastNotifCountRef.current) {
      const newest = notifications[0];
      if (newest && !newest.isRead) {
        setActiveSimulatedAlertPopup(newest);
      }
    }
    lastNotifCountRef.current = notifications.length;
  }, [notifications]);

  // Debounce ref for live interactive range slider updates
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Execute Search
  const executeSearch = async (
    kw = keywords,
    loc = location,
    minSal = minSalary,
    maxSal = maxSalary,
    urg = selectedUrgency,
    forceRefresh = false
  ) => {
    setIsSearching(true);
    setSearchError(null);
    if (forceRefresh) setIsRefreshingAts(true);
    const params: JobSearchParams & { refresh?: boolean } = {
      keywords: kw,
      location: loc === 'All' ? '' : loc,
      minSalary: minSal,
      maxSalary: maxSal,
      urgency: urg,
      refresh: forceRefresh,
    };

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalCount(data.totalCount || 0);
        if (data.matchedSector) setMatchedSector(data.matchedSector);
        if (data.meta) setAtsMeta(data.meta);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setJobs([]);
        setTotalCount(0);
        setSearchError(errBody?.error || `Live external ATS search returned HTTP ${res.status}. Retry shortly.`);
      }
    } catch (err: any) {
      setJobs([]);
      setTotalCount(0);
      setSearchError(err?.message || 'Unable to reach /api/jobs/search. Check network connectivity.');
    } finally {
      setIsSearching(false);
      setIsRefreshingAts(false);
    }
  };

  // Initial load
  useEffect(() => {
    executeSearch();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Real-time dynamic range slider update with debounced search
  const handleRangeSliderChange = (newMin: number, newMax: number) => {
    const safeMin = Math.max(0, Math.min(newMin, newMax - 10000));
    const safeMax = Math.min(600000, Math.max(newMax, safeMin + 10000));
    setMinSalary(safeMin);
    setMaxSalary(safeMax);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      executeSearch(keywords, location, safeMin, safeMax, selectedUrgency);
    }, 150);
  };

  // Immediate commit on slider thumb release (mouseUp / touchEnd)
  const handleSliderCommit = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    executeSearch(keywords, location, minSalary, maxSalary, selectedUrgency);
  };

  // Quick preset bracket selection with paywall protection
  const handleSalaryBracketSelect = (min: number, max: number) => {
    if (min >= 350000 && !isPro) {
      openPaywall('Executive $380k - $600k+ Compensation Band & Telemetry');
      return;
    }
    setMinSalary(min);
    setMaxSalary(max);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    executeSearch(keywords, location, min, max, selectedUrgency);
  };

  const handleReset = () => {
    setKeywords('');
    setLocation('All');
    setMinSalary(0);
    setMaxSalary(600000);
    setSelectedUrgency('All');
    setSelectedCityNode(null);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    executeSearch('', 'All', 0, 600000, 'All');
  };

  const handleApply = (jobId: string) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs([...appliedJobs, jobId]);
    }
  };

  const handleKeywordPillClick = (kw: string) => {
    setKeywords(kw);
    executeSearch(kw, location, minSalary, maxSalary, selectedUrgency);
  };

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    setSelectedCityNode(loc === 'All' ? null : loc);
    executeSearch(keywords, loc, minSalary, maxSalary, selectedUrgency);
  };

  const handleSalaryPreset = (min: number) => {
    setMinSalary(min);
    executeSearch(keywords, location, min, maxSalary, selectedUrgency);
  };

  // Quick action: Project career path for current search
  const handleProjectSearchCareer = () => {
    const targetRole = keywords.trim() || jobs[0]?.title || 'Principal Systems Architect';
    const targetSal = minSalary > 0 ? minSalary : (jobs[0]?.numericMaxSalary || 280000);
    if (onNavigateToCareer) {
      onNavigateToCareer(targetRole, targetSal, jobs[0]);
    }
  };

  // Quick action: View industry news for current search
  const handleViewSearchNews = () => {
    const targetCompany = jobs[0]?.company || 'Anthropic & OpenAI Ecosystem';
    if (onNavigateToNews) {
      onNavigateToNews(targetCompany, matchedSector, keywords);
    }
  };

  if ((isLoadingRadar && !marketRadar) || (isSearching && jobs.length === 0)) {
    return <RadarSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Daily Market Insight Banner (Google Search Grounded, Daily Cached) */}
      <DailyMarketInsightBanner
        onExploreRoles={(kw) => {
          if (kw) {
            setKeywords(kw);
            executeSearch(kw, location, minSalary, maxSalary, selectedUrgency);
          }
        }}
      />

      {/* AI Career Coaching Executive Telemetry & Stress Dashboard */}
      <AICareerCoachingPanel
        onNavigateToCareer={(role, salary) => {
          if (onNavigateToCareer) onNavigateToCareer(role, salary);
        }}
        onNavigateToJobs={(kw) => {
          if (kw) {
            setKeywords(kw);
            executeSearch(kw, location, minSalary, maxSalary, selectedUrgency);
          }
        }}
        onNavigateToFinance={onNavigateToFinance}
      />

      {/* 3D Geospatial Talent Radar */}
      <div className="panel border border-[#1e2b36] bg-[#111a22] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#dce7f0] font-mono flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-[#22d3a5]" />
              GLOBAL SIGNAL RADAR // ORBITAL INTERCEPT
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono">
              Live geospatial mapping of defense, frontier compute, and low-latency infrastructure vacancies.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#7a8b99]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22d3a5]" /> Active Nodes ({LOCATION_PRESETS.length - 1})
            </span>
            {location !== 'All' && (
              <span className="flex items-center gap-1.5 text-[#fbbf24]">
                <MapPin className="w-3.5 h-3.5" /> Filter: {location}
              </span>
            )}
          </div>
        </div>

        <RadarGlobe3D
          selectedCity={selectedCityNode}
          liveHubs={marketRadar?.hubs}
          liveDemandData={marketRadar}
          isRefreshingLive={isLoadingRadar}
          onRefreshTelemetry={() => fetchMarketRadarTelemetry(location)}
          onSelectHub={(hub) => {
            handleLocationChange(hub.name);
          }}
          onSelectSector={(sector) => {
            setKeywords(sector);
            executeSearch(sector, location, minSalary, maxSalary, selectedUrgency);
          }}
        />
      </div>

      {/* Real-Time Job Market Data & Demand Insights Telemetry Console */}
      <div className="panel border border-[#1e2b36] bg-[#111a22] rounded-xl p-5 shadow-lg space-y-4">
        {/* Telemetry Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#22d3a5] animate-pulse" />
              <h3 className="text-base font-bold font-mono text-[#dce7f0]">
                REAL-TIME JOB MARKET DEMAND &amp; SKILLS RADAR
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5]">
                API STREAM ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#7a8b99] font-mono">
              Live quantitative analysis of hiring demand, requisition velocity, and surging technical competencies across global tech hubs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#7a8b99] hidden md:inline">
              {radarLastFetched ? `Streamed: ${radarLastFetched}` : 'Real-time telemetry'}
            </span>
            <button
              onClick={() => fetchMarketRadarTelemetry(location)}
              disabled={isLoadingRadar}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition cursor-pointer shadow-sm bg-[#0a0f14] border-[#22d3a5]/50 text-[#22d3a5] hover:bg-[#22d3a5]/10 ${
                isLoadingRadar ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title="Refresh real-time API job market data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRadar ? 'animate-spin' : ''}`} />
              <span>{isLoadingRadar ? 'Fetching Stream...' : 'Refresh Radar Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Key Metric Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <div className="text-[10px] text-[#7a8b99] uppercase tracking-wider flex items-center justify-between">
              <span>TRACKED GLOBAL REQS</span>
              <Globe2 className="w-3.5 h-3.5 text-[#3b82f6]" />
            </div>
            <div className="text-lg font-bold text-[#22d3a5] mt-1">
              {marketRadar?.totalOpenings ? marketRadar.totalOpenings.toLocaleString() : '3,140+'}
            </div>
            <div className="text-[10px] text-[#7a8b99] mt-0.5">
              Across {marketRadar?.activeHubsCount || 12} global tech nodes
            </div>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <div className="text-[10px] text-[#7a8b99] uppercase tracking-wider flex items-center justify-between">
              <span>HIRING VELOCITY INDEX</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#fbbf24]" />
            </div>
            <div className="text-lg font-bold text-[#fbbf24] mt-1">
              {marketRadar?.globalHiringVelocity || '94.2'} / 100
            </div>
            <div className="text-[10px] text-[#22d3a5] mt-0.5">
              {marketRadar?.velocityDelta || '+34.8% YoY surge'}
            </div>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <div className="text-[10px] text-[#7a8b99] uppercase tracking-wider flex items-center justify-between">
              <span>MARKET SENTIMENT</span>
              <Flame className="w-3.5 h-3.5 text-[#f87171]" />
            </div>
            <div className="text-lg font-bold text-[#f87171] mt-1">
              {marketRadar?.marketSentiment || 'Aggressive Expansion'}
            </div>
            <div className="text-[10px] text-[#7a8b99] mt-0.5">
              High-concurrency &amp; GPU focus
            </div>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <div className="text-[10px] text-[#7a8b99] uppercase tracking-wider flex items-center justify-between">
              <span>ACTIVE LOCATION FILTER</span>
              <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
            </div>
            <div className="text-lg font-bold text-[#38bdf8] mt-1 truncate">
              {location === 'All' ? 'All Global Hubs' : location}
            </div>
            <div className="text-[10px] text-[#7a8b99] mt-0.5">
              Real-time feed sync enabled
            </div>
          </div>
        </div>

        {/* Real-Time Demand Insights & Surging Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
          {/* Left Column: Top Roles in Current Demand */}
          <div className="md:col-span-7 bg-[#0a0f14] p-4 rounded-xl border border-[#1e2b36] space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#22d3a5]" />
                <h4 className="text-xs font-bold text-[#dce7f0] uppercase tracking-wider">
                  Top Roles in Current Market Demand
                </h4>
              </div>
              <span className="text-[10px] text-[#7a8b99]">
                Click role to search &amp; highlight
              </span>
            </div>

            <div className="space-y-2.5">
              {(marketRadar?.roleDemandIndex || []).slice(0, 5).map((roleItem) => (
                <div
                  key={roleItem.role}
                  onClick={() => {
                    setKeywords(roleItem.role);
                    executeSearch(roleItem.role, location, minSalary, maxSalary, selectedUrgency);
                  }}
                  className="p-2.5 rounded-lg border border-[#1e2b36] hover:border-[#22d3a5]/50 bg-[#111a22]/60 hover:bg-[#111a22] transition cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-[#dce7f0] group-hover:text-[#22d3a5] transition">
                      {roleItem.role}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#22d3a5] font-semibold text-[11px]">
                        {roleItem.averageSalaryDisplay}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#fbbf24]/15 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
                        {roleItem.yoyChange}
                      </span>
                    </div>
                  </div>

                  {/* Demand Score Bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-[#1e2b36] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3b82f6] via-[#22d3a5] to-[#fbbf24] rounded-full transition-all duration-500"
                        style={{ width: `${roleItem.demandScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#7a8b99] shrink-0 font-bold">
                      {roleItem.demandScore}/100
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[10px] text-[#7a8b99]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#38bdf8]" /> {roleItem.primaryLocation}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {roleItem.topSkills.slice(0, 3).map((sk) => (
                        <span key={sk} className="px-1.5 py-0.2 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Surging Skills Velocity Radar */}
          <div className="md:col-span-5 bg-[#0a0f14] p-4 rounded-xl border border-[#1e2b36] space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#fbbf24]" />
                <h4 className="text-xs font-bold text-[#dce7f0] uppercase tracking-wider">
                  Surging Skills Velocity
                </h4>
              </div>
              <span className="text-[10px] text-[#22d3a5] font-bold">
                HIGH CONCURRENCY
              </span>
            </div>

            <p className="text-[11px] text-[#7a8b99] leading-relaxed">
              Click any trending skill below to dynamically filter listings and activate instant keyword highlighting across all requisitions:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {(marketRadar?.trendingSkills || [
                { skill: 'Triton (OpenAI)', growth: '+46%', requisitions: 194 },
                { skill: 'CUDA Kernel Tuning', growth: '+42%', requisitions: 382 },
                { skill: 'Rust Systems Programming', growth: '+38%', requisitions: 418 },
                { skill: 'vLLM / TensorRT-LLM', growth: '+35%', requisitions: 265 },
                { skill: 'Low-Latency C++20/23', growth: '+31%', requisitions: 310 },
                { skill: 'Slurm Cluster Management', growth: '+29%', requisitions: 215 },
                { skill: 'ROS 2 & Real-Time Linux', growth: '+28%', requisitions: 178 },
                { skill: 'Zero-Knowledge Proofs', growth: '+26%', requisitions: 142 },
                { skill: 'InfiniBand / RoCE', growth: '+24%', requisitions: 164 },
                { skill: 'PyTorch Geometric', growth: '+22%', requisitions: 153 },
              ]).map((skillItem) => {
                const isCurrent = keywords && keywords.toLowerCase().includes(skillItem.skill.toLowerCase());
                return (
                  <button
                    key={skillItem.skill}
                    onClick={() => {
                      setKeywords(skillItem.skill);
                      executeSearch(skillItem.skill, location, minSalary, maxSalary, selectedUrgency);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer shadow-sm ${
                      isCurrent
                        ? 'bg-[#22d3a5]/25 border-[#22d3a5] text-[#22d3a5] font-bold ring-1 ring-[#22d3a5]/50'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#dce7f0] hover:border-[#22d3a5]/50 hover:text-[#22d3a5]'
                    }`}
                    title={`Click to search "${skillItem.skill}" with keyword highlighting`}
                  >
                    <span>{skillItem.skill}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#fbbf24]/15 text-[#fbbf24] font-bold">
                      {skillItem.growth}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Takeaway Bullet */}
            <div className="mt-3 p-2.5 rounded-lg bg-[#111a22]/70 border border-[#1e2b36] text-[11px] text-[#7a8b99] space-y-1">
              <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#38bdf8]" /> RECONNAISSANCE TAKEAWAY:
              </span>
              <p className="leading-relaxed text-[#94a3b8]">
                {marketRadar?.marketTakeaways?.[0] || 'High-performance GPU orchestration and low-latency C++ command the highest compensation premiums worldwide.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Job Search Console */}
      <div className="panel border border-[#1e2b36] bg-[#111a22] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#1e2b36]">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#22d3a5]" />
            <h3 className="text-base font-bold font-mono text-[#dce7f0]">
              OPPORTUNITY SEARCH &amp; RADAR TELEMETRY
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Subscribe to Alerts Button */}
            <button
              onClick={handleSubscribeCurrentSearch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition cursor-pointer shadow-sm ${
                isCurrentlySubscribed
                  ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                  : 'bg-[#0a0f14] border-[#22d3a5]/60 hover:bg-[#22d3a5]/15 text-[#22d3a5]'
              }`}
              title="Subscribe to live ATS alert monitoring for these criteria"
            >
              <BellRing className={`w-3.5 h-3.5 ${isCurrentlySubscribed ? 'animate-pulse' : ''}`} />
              <span>{isCurrentlySubscribed ? 'Alert Active' : 'Subscribe to Alerts'}</span>
            </button>

            {/* View Subscriptions / Notifications Drawer */}
            <button
              onClick={() => setIsAlertsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6] text-[#7a8b99] hover:text-[#dce7f0] text-xs font-mono transition cursor-pointer"
              title="View alert subscriptions and live ATS matches"
            >
              <Bell className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="hidden sm:inline">Alerts</span>
              <span>({subscriptions.length})</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <span className="text-[#7a8b99] hidden lg:inline">MATCHED:</span>
            <span className="text-[#22d3a5] font-bold hidden lg:inline">{totalCount} POSITIONS</span>
            {(keywords || location !== 'All' || minSalary > 0 || maxSalary < 600000) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] transition text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* 2 Main Inputs: Keywords & Location + Scan Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          {/* Keywords input */}
          <div className="md:col-span-7">
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              KEYWORDS &amp; TECH STACK (TITLE, SKILL, COMPANY)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#7a8b99]" />
              <input
                type="text"
                placeholder="e.g. Distributed, Rust, CUDA, vLLM, HFT, Vision..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] placeholder-[#7a8b99] text-xs font-mono rounded-lg pl-9 pr-8 py-2 outline-none transition"
              />
              {keywords && (
                <button
                  onClick={() => {
                    setKeywords('');
                    executeSearch('', location, minSalary, maxSalary, selectedUrgency);
                  }}
                  className="absolute right-2.5 top-2.5 text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Location input */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              LOCATION / REGION
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#7a8b99]" />
              <input
                type="text"
                placeholder="e.g. San Francisco, London, Remote..."
                value={location === 'All' ? '' : location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] placeholder-[#7a8b99] text-xs font-mono rounded-lg pl-9 pr-3 py-2 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Search Button */}
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => executeSearch()}
              disabled={isSearching}
              className="w-full bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow"
            >
              <Search className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              {isSearching ? 'SCANNING...' : 'SCAN RADAR'}
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Salary Range-Slider Control Panel */}
        <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 space-y-3 mb-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#22d3a5]" />
              <span className="text-xs font-mono font-bold text-[#dce7f0] tracking-wide">
                COMPENSATION BAND RANGE SLIDER
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5] font-semibold">
                ${minSalary.toLocaleString()} — {maxSalary >= 600000 ? '$600,000+ (Uncapped)' : '$' + maxSalary.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#7a8b99] hidden sm:inline">
                Spread: ${Math.max(0, maxSalary - minSalary).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#22d3a5] font-semibold bg-[#22d3a5]/10 px-2 py-0.5 rounded border border-[#22d3a5]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
                {totalCount} POSITIONS MATCHED
              </span>
            </div>
          </div>

          {/* Visual Dual Range-Slider Control */}
          <div className="pt-2 pb-1 px-1">
            <div className="relative w-full h-8 flex items-center select-none">
              {/* Background rail */}
              <div className="absolute left-0 right-0 h-2.5 bg-[#141e28] border border-[#1e2b36] rounded-full overflow-hidden" />

              {/* Dynamic highlighted range band */}
              <div
                className="absolute h-2.5 bg-gradient-to-r from-[#22d3a5] via-[#2dd4bf] to-[#3b82f6] rounded-full shadow-[0_0_12px_rgba(34,211,165,0.45)] pointer-events-none transition-all duration-75"
                style={{
                  left: `${(minSalary / 600000) * 100}%`,
                  width: `${Math.max(1, ((maxSalary - minSalary) / 600000) * 100)}%`,
                }}
              />

              {/* Min Salary Slider Input */}
              <input
                type="range"
                min="0"
                max="600000"
                step="10000"
                value={minSalary}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleRangeSliderChange(Math.min(val, maxSalary - 10000), maxSalary);
                }}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className={`absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none cursor-pointer ${
                  minSalary > 300000 ? 'z-30' : 'z-20'
                }
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#22d3a5]
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-[#0a0f14]
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,165,0.9)]
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-webkit-slider-thumb]:active:scale-125
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#22d3a5]
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-[#0a0f14]
                  [&::-moz-range-thumb]:cursor-grab`}
                aria-label="Filter minimum salary"
              />

              {/* Max Salary Slider Input */}
              <input
                type="range"
                min="0"
                max="600000"
                step="10000"
                value={maxSalary}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleRangeSliderChange(minSalary, Math.max(val, minSalary + 10000));
                }}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className={`absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none cursor-pointer ${
                  minSalary > 300000 ? 'z-20' : 'z-30'
                }
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#3b82f6]
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-[#0a0f14]
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.9)]
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-webkit-slider-thumb]:active:scale-125
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#3b82f6]
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-[#0a0f14]
                  [&::-moz-range-thumb]:cursor-grab`}
                aria-label="Filter maximum salary"
              />
            </div>

            {/* Clickable Tick Marks Scale */}
            <div className="relative flex justify-between text-[10px] font-mono text-[#7a8b99] pt-1 select-none">
              {[
                { label: '$0', val: 0 },
                { label: '$150k', val: 150000 },
                { label: '$300k', val: 300000 },
                { label: '$450k', val: 450000 },
                { label: '$600k+', val: 600000 },
              ].map((tick) => (
                <button
                  key={tick.label}
                  type="button"
                  onClick={() => {
                    const distMin = Math.abs(tick.val - minSalary);
                    const distMax = Math.abs(tick.val - maxSalary);
                    if (distMin < distMax) {
                      handleRangeSliderChange(Math.min(tick.val, maxSalary - 10000), maxSalary);
                    } else {
                      handleRangeSliderChange(minSalary, Math.max(tick.val, minSalary + 10000));
                    }
                  }}
                  className="hover:text-[#22d3a5] transition cursor-pointer"
                  title={`Click to snap slider near ${tick.label}`}
                >
                  <span className="block w-px h-1.5 bg-[#1e2b36] mx-auto mb-0.5" />
                  {tick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Bracket Presets and Exact Number Inputs */}
          <div className="pt-2 border-t border-[#1e2b36]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono">
            {/* Quick Brackets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#7a8b99] shrink-0 mr-1">PRESETS:</span>
              {SALARY_RANGE_BRACKETS.map((b) => {
                const isActive = minSalary === b.min && maxSalary === b.max;
                const isRestricted = b.min >= 350000 && !isPro;
                return (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => handleSalaryBracketSelect(b.min, b.max)}
                    className={`px-2 py-0.5 rounded border text-[11px] transition shrink-0 flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-semibold shadow-sm'
                        : isRestricted
                        ? 'bg-[#111a22] border-[#f87171]/40 text-[#f87171]/90 hover:border-[#f87171] hover:text-[#f87171]'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] hover:border-[#7a8b99]'
                    }`}
                  >
                    <span>{b.label}</span>
                    {isRestricted && <Lock className="w-2.5 h-2.5 text-[#f87171]" />}
                  </button>
                );
              })}
            </div>

            {/* Direct Numerical Fine-Tuning */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#111a22] border border-[#1e2b36] rounded px-2 py-1">
                <span className="text-[10px] text-[#22d3a5] font-bold">MIN $</span>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  max={maxSalary - 10000}
                  value={minSalary}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    handleRangeSliderChange(Math.min(val, maxSalary - 10000), maxSalary);
                  }}
                  className="w-16 bg-transparent text-[#dce7f0] text-xs font-mono outline-none text-right"
                  aria-label="Direct minimum salary input"
                />
              </div>
              <span className="text-[#7a8b99]">—</span>
              <div className="flex items-center gap-1 bg-[#111a22] border border-[#1e2b36] rounded px-2 py-1">
                <span className="text-[10px] text-[#3b82f6] font-bold">MAX $</span>
                <input
                  type="number"
                  step="10000"
                  min={minSalary + 10000}
                  max="600000"
                  value={maxSalary}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 600000;
                    handleRangeSliderChange(minSalary, Math.max(val, minSalary + 10000));
                  }}
                  className="w-16 bg-transparent text-[#dce7f0] text-xs font-mono outline-none text-right"
                  aria-label="Direct maximum salary input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filter Presets Bar */}
        <div className="space-y-2 pt-2 border-t border-[#1e2b36]">
          {/* Location Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none pb-1">
            <span className="text-[#7a8b99] shrink-0">HUBS:</span>
            {LOCATION_PRESETS.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocationChange(loc)}
                className={`px-2 py-0.5 rounded border transition shrink-0 ${
                  location.toLowerCase() === loc.toLowerCase()
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Quick Target Min Salary Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none pb-1">
            <span className="text-[#7a8b99] shrink-0">TARGET MIN:</span>
            {SALARY_PRESETS.map((sal) => (
              <button
                key={sal.label}
                onClick={() => handleSalaryPreset(sal.min)}
                className={`px-2 py-0.5 rounded border transition shrink-0 ${
                  minSalary === sal.min
                    ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                {sal.label}
              </button>
            ))}
          </div>

          {/* Keyword Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
            <span className="text-[#7a8b99] shrink-0">SIGNALS:</span>
            {SUGGESTED_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => handleKeywordPillClick(kw)}
                className={`px-2 py-0.5 rounded border transition shrink-0 ${
                  keywords.toLowerCase().includes(kw.toLowerCase())
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24] font-semibold'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CROSS-TAB INTEGRATION BANNER */}
      {(keywords || minSalary > 0 || maxSalary < 600000 || location !== 'All') && (
        <div className="panel bg-gradient-to-r from-[#111a22] to-[#152433] border border-[#22d3a5]/30 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22d3a5] font-semibold">
              <Sparkles className="w-4 h-4" />
              SEARCH INTEGRATION ACTIVE: {keywords ? `"${keywords}"` : 'Target Query'}
            </div>
            <p className="text-xs text-[#dce7f0] font-mono">
              Sector: <span className="text-[#3b82f6] font-semibold">{matchedSector}</span> • Desired Comp Band: <span className="text-[#22d3a5] font-semibold">${minSalary ? minSalary.toLocaleString() : '0'} – ${maxSalary >= 600000 ? '$600,000+' : '$' + maxSalary.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleProjectSearchCareer}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono flex items-center gap-1.5 transition shadow"
            >
              <Compass className="w-3.5 h-3.5" />
              Project Career Path for this Search
            </button>

            <button
              onClick={handleViewSearchNews}
              className="px-3 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-xs font-mono flex items-center gap-1.5 transition shadow"
            >
              <Newspaper className="w-3.5 h-3.5" />
              View Sector News &amp; Intel
            </button>
          </div>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-3">
        {/* Subscription Confirmation Toast */}
        {alertSubscriptionToast && (
          <div className="bg-[#22d3a5]/15 border border-[#22d3a5] text-[#22d3a5] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono shadow-[0_0_15px_rgba(34,211,165,0.2)] animate-fade-in">
            <span className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 shrink-0 text-[#22d3a5]" />
              {alertSubscriptionToast}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAlertsDrawerOpen(true)}
                className="px-2 py-0.5 rounded bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 text-[#22d3a5] border border-[#22d3a5]/40 text-[11px] font-bold"
              >
                View Logged Alerts
              </button>
              <button
                onClick={() => setAlertSubscriptionToast(null)}
                className="text-[#7a8b99] hover:text-white p-1"
                aria-label="Dismiss confirmation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Live Simulated Match Alert Banner */}
        {activeSimulatedAlertPopup && (
          <div className="bg-gradient-to-r from-[#0d1e18] via-[#122820] to-[#0d1e18] border-2 border-[#22d3a5] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono shadow-[0_0_25px_rgba(34,211,165,0.3)] animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#22d3a5] text-black shrink-0">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold text-[10px] tracking-wider uppercase">
                    LIVE ATS MATCH INTERCEPT
                  </span>
                  <span className="text-white font-bold text-sm">
                    {activeSimulatedAlertPopup.job.title}
                  </span>
                  <span className="text-[#3b82f6] font-semibold">
                    @ {activeSimulatedAlertPopup.job.company}
                  </span>
                </div>
                <div className="text-[11px] text-[#7a8b99]">
                  Comp: <strong className="text-[#22d3a5]">{activeSimulatedAlertPopup.job.salaryRange}</strong> • Match Score: <strong className="text-[#22d3a5]">{activeSimulatedAlertPopup.job.matchScore}%</strong> • Matched alert: <em className="text-[#dce7f0]">"{activeSimulatedAlertPopup.alertTitle}"</em>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => {
                  setSelectedJob(activeSimulatedAlertPopup.job);
                  markNotificationAsRead(activeSimulatedAlertPopup.id);
                  setActiveSimulatedAlertPopup(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs flex items-center gap-1.5 transition shadow"
              >
                <Eye className="w-3.5 h-3.5" /> Inspect Match
              </button>
              <button
                onClick={() => {
                  markNotificationAsRead(activeSimulatedAlertPopup.id);
                  setActiveSimulatedAlertPopup(null);
                }}
                className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] hover:text-white transition"
                title="Dismiss alert popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Query Monitoring & Alert Subscription Bar */}
        <div className="bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5]/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isCurrentlySubscribed ? 'bg-[#22d3a5]/20 text-[#22d3a5]' : 'bg-[#111a22] text-[#7a8b99]'}`}>
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">
                  {isCurrentlySubscribed ? 'MONITORING THIS QUERY ACTIVE' : 'LOG SEARCH CRITERIA TO ALERTS'}
                </span>
                {isCurrentlySubscribed && (
                  <span className="text-[10px] px-2 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#7a8b99]">
                {keywords ? `Keywords: "${keywords}"` : 'All Technical Sectors'} • {location !== 'All' ? `Location: ${location} • ` : ''}Comp: ${minSalary.toLocaleString()}–${maxSalary >= 600000 ? '$600k+' : '$' + maxSalary.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubscribeCurrentSearch}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow ${
                isCurrentlySubscribed
                  ? 'bg-[#22d3a5]/20 border border-[#22d3a5] text-[#22d3a5]'
                  : 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{isCurrentlySubscribed ? 'Alert Active (Subscribed)' : 'Subscribe to Alerts'}</span>
            </button>
          </div>
        </div>

        {/* Recruit Clearance Elevation Prompt */}
        {tier === 'recruit' && (
          <div className="bg-gradient-to-r from-[#111a22] via-[#162330] to-[#111a22] border border-[#f87171]/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-white font-bold">SECURITY CLEARANCE: RECRUIT (FREE)</span>
                <span className="text-[#7a8b99] ml-2 hidden sm:inline">
                  Executive $350k - $600k+ compensation bands and AI Triad autonomy are restricted.
                </span>
              </div>
            </div>
            <button
              onClick={() => openPaywall('Search Results Security Clearance Elevation')}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro ($49/mo)
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#7a8b99] px-1">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              SEARCH RESULTS ({jobs.length} OF {totalCount} SIGNALS)
            </span>
            {atsMeta?.isLive && (
              <span className="px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 text-[10px] font-bold">
                LIVE EXTERNAL ATS • {atsMeta.boardsSucceeded} BOARDS • {atsMeta.totalOpeningsAcrossBoards.toLocaleString()} OPEN ROLES
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline">ASHBY • GREENHOUSE • LEVER</span>
            <button
              type="button"
              onClick={() => executeSearch(keywords, location, minSalary, maxSalary, selectedUrgency, true)}
              disabled={isRefreshingAts}
              className="px-2.5 py-1 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingAts ? 'animate-spin' : ''}`} />
              <span>{isRefreshingAts ? 'Refreshing ATS...' : 'Refresh Live ATS'}</span>
            </button>
          </div>
        </div>

        {searchError ? (
          <div className="panel p-6 bg-[#f87171]/10 border border-[#f87171]/40 rounded-xl text-xs font-mono text-[#f87171] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold block">LIVE ATS FEED UNREACHABLE</span>
              <span className="text-[#dce7f0]">{searchError}</span>
            </div>
            <button
              onClick={() => executeSearch(keywords, location, minSalary, maxSalary, selectedUrgency, true)}
              className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#f87171] text-[#f87171] inline-flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Live ATS Scrape
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="panel p-8 text-center bg-[#111a22] border border-[#1e2b36] rounded-xl text-xs font-mono text-[#7a8b99] space-y-3">
            <p>No live ATS requisitions match: &quot;{keywords}&quot; in {location} with comp between ${minSalary.toLocaleString()} and {maxSalary >= 600000 ? '$600,000+' : '$' + maxSalary.toLocaleString()}.</p>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5] inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset Search Filters
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const isApplied = appliedJobs.includes(job.id);
            const matchesSalary = (minSalary === 0 || job.numericMaxSalary >= minSalary) && (maxSalary >= 600000 || job.numericMinSalary <= maxSalary);
            const isCompClassified = !isPro && job.numericMaxSalary >= 350000;

            return (
              <div
                key={job.id}
                className="panel bg-[#111a22] hover:border-[#22d3a5]/50 transition-all border border-[#1e2b36] rounded-xl p-4 shadow relative group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Job Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]">
                        {job.id}
                      </span>
                      {job.sourceAts && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 border border-[#22d3a5]/30 text-[#22d3a5] font-bold uppercase">
                          {job.sourceAts} ATS
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          job.urgency === 'URGENT'
                            ? 'bg-[#f87171]/15 text-[#f87171] border-[#f87171]/30'
                            : job.urgency === 'HIGH PRIORITY'
                            ? 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30'
                            : 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30'
                        }`}
                      >
                        {job.urgency}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">
                        {job.sector}
                      </span>
                      <span className="text-xs font-mono text-[#7a8b99] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {job.postedAgo}
                      </span>
                      <span className="text-xs font-mono text-[#22d3a5] bg-[#22d3a5]/10 px-2 py-0.5 rounded">
                        {job.headcountDelta}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#dce7f0] group-hover:text-[#22d3a5] transition">
                        <HighlightText text={job.title} query={keywords} />
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a8b99] mt-1 font-mono">
                        <span className="text-[#dce7f0] font-semibold">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#3b82f6]" /> {job.location}
                        </span>
                        {isCompClassified ? (
                          <button
                            type="button"
                            onClick={() =>
                              openPaywall(
                                `Classified Compensation Band for ${job.title} at ${job.company}`
                              )
                            }
                            className="font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f87171]/10 border border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/20 transition cursor-pointer"
                            title="Click to elevate clearance and unmask salary"
                          >
                            <Lock className="w-3 h-3 text-[#f87171]" />
                            <span>$280k - [PRO CLEARANCE RESTRICTED]</span>
                          </button>
                        ) : (
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              matchesSalary ? 'text-[#22d3a5]' : 'text-[#fbbf24]'
                            }`}
                          >
                            <DollarSign className="w-3 h-3" /> {job.salaryRange}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#7a8b99] line-clamp-2">
                      <HighlightText text={job.description} query={keywords} />
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill) => {
                        const isMatched =
                          keywords &&
                          keywords.toLowerCase().includes(skill.toLowerCase());
                        return (
                          <span
                            key={skill}
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                              isMatched
                                ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5] font-semibold'
                                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                            }`}
                          >
                            <HighlightText
                              text={skill}
                              query={keywords}
                              highlightClassName="bg-[#22d3a5]/30 text-[#22d3a5] px-1 py-0.2 rounded font-semibold font-mono"
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions & Cross-Tab Links */}
                  <div className="flex lg:flex-col items-center justify-between lg:items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1e2b36]">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#7a8b99]">SEARCH ALIGNMENT</div>
                      <div className="text-xl font-bold font-mono text-[#22d3a5]">
                        {job.matchScore}%
                      </div>
                    </div>

                    {/* Cross-integration Action Buttons */}
                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (onNavigateToCareer) {
                              onNavigateToCareer(job.title, job.numericMaxSalary, job);
                            }
                          }}
                          title="Plan career transition for this role"
                          className="px-2.5 py-1.5 rounded-lg border border-[#22d3a5]/30 bg-[#22d3a5]/10 hover:bg-[#22d3a5]/20 text-[#22d3a5] text-xs font-mono flex items-center gap-1 transition"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Career Path</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onNavigateToNews) {
                              onNavigateToNews(job.company, job.sector, keywords);
                            }
                          }}
                          title="Inspect company news and hiring velocity"
                          className="px-2.5 py-1.5 rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] text-xs font-mono flex items-center gap-1 transition"
                        >
                          <Newspaper className="w-3 h-3" />
                          <span>Intel Brief</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSaveJob(job)}
                          title={isJobSaved(job.id) ? 'Remove bookmark' : 'Bookmark job'}
                          className={`p-1.5 rounded-lg border transition ${
                            isJobSaved(job.id)
                              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                              : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#22d3a5] text-[#7a8b99] hover:text-[#dce7f0]'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" fill={isJobSaved(job.id) ? '#22d3a5' : 'none'} />
                        </button>

                        <button
                          onClick={() => setSelectedJob(job)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#1e2b36] bg-[#0a0f14] hover:border-[#3b82f6] text-[#dce7f0] text-xs font-mono flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-[#3b82f6]" />
                          Inspect
                        </button>

                        {job.applyUrl ? (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleApply(job.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition ${
                              isApplied
                                ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]'
                                : 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Opened ATS
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-3 h-3" /> Apply on ATS
                              </>
                            )}
                          </a>
                        ) : (
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={isApplied}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition ${
                              isApplied
                                ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]'
                                : 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Applied
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" /> Fast Apply
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl max-w-2xl w-full p-6 text-[#dce7f0] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-[#7a8b99] hover:text-[#dce7f0] p-1 rounded-lg bg-[#0a0f14] border border-[#1e2b36]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#22d3a5]">
                <Shield className="w-4 h-4" />
                <span>CONFIDENTIAL REQUISITION DOSSIER // {selectedJob.id}</span>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-[#dce7f0]">
                  <HighlightText text={selectedJob.title} query={keywords} />
                </h2>
                <div className="text-sm text-[#7a8b99] font-mono mt-1">
                  {selectedJob.company} • {selectedJob.location} • Sector: {selectedJob.sector}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                  <span className="text-[#7a8b99] block text-[10px]">COMPENSATION BAND</span>
                  <span className="text-[#22d3a5] font-semibold">{selectedJob.salaryRange}</span>
                </div>
                <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                  <span className="text-[#7a8b99] block text-[10px]">RADAR ALIGNMENT</span>
                  <span className="text-[#3b82f6] font-semibold">{selectedJob.matchScore}% Match</span>
                </div>
                <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                  <span className="text-[#7a8b99] block text-[10px]">REQUISITION STATUS</span>
                  <span className="text-[#fbbf24] font-semibold">{selectedJob.urgency}</span>
                </div>
              </div>

              {!isPro && selectedJob.numericMaxSalary >= 350000 && (
                <div className="bg-[#f87171]/10 border border-[#f87171]/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[#f87171] font-bold">
                      <Lock className="w-4 h-4" /> CLASSIFIED EXECUTIVE COMPENSATION AUDIT
                    </div>
                    <div className="text-[11px] text-[#7a8b99]">
                      Sign-on bonuses, equity liquidity multiplier, and direct recruiter backchannel are restricted to Pro Operators.
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      openPaywall(`Classified Compensation Dossier for ${selectedJob.title}`)
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Zap className="w-3.5 h-3.5" /> Unlock Full Dossier
                  </button>
                </div>
              )}

              <div>
                <h4 className="text-xs font-mono font-semibold text-[#7a8b99] mb-1.5 uppercase">
                  Requisition Overview
                </h4>
                <p className="text-xs leading-relaxed text-[#dce7f0] bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
                  <HighlightText text={selectedJob.description} query={keywords} />
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-semibold text-[#7a8b99] mb-1.5 uppercase">
                  Identified Tech Stack &amp; Signals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-[#0a0f14] border border-[#22d3a5]/40 text-[#22d3a5]"
                    >
                      <HighlightText
                        text={s}
                        query={keywords}
                        highlightClassName="bg-[#22d3a5]/30 text-[#22d3a5] px-1 py-0.2 rounded font-semibold font-mono"
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Cross-Tab Integration Quick Launchers */}
              <div className="pt-2 bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <span className="text-[#7a8b99]">CROSS-TAB RECONNAISSANCE:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (onNavigateToCareer) {
                        onNavigateToCareer(selectedJob.title, selectedJob.numericMaxSalary, selectedJob);
                      }
                      setSelectedJob(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 text-[#22d3a5] border border-[#22d3a5]/40 flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Career Roadmap
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateToNews) {
                        onNavigateToNews(selectedJob.company, selectedJob.sector);
                      }
                      setSelectedJob(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#3b82f6] border border-[#3b82f6]/40 flex items-center gap-1.5"
                  >
                    <Newspaper className="w-3.5 h-3.5" />
                    Company Intel Feed
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e2b36] flex items-center justify-end gap-3">
                <button
                  onClick={() => toggleSaveJob(selectedJob)}
                  className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${
                    isJobSaved(selectedJob.id)
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" fill={isJobSaved(selectedJob.id) ? '#22d3a5' : 'none'} />
                  <span>{isJobSaved(selectedJob.id) ? 'Bookmarked' : 'Bookmark Job'}</span>
                </button>

                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-lg border border-[#1e2b36] text-xs font-mono text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  Close Dossier
                </button>
                {selectedJob.applyUrl ? (
                  <a
                    href={selectedJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleApply(selectedJob.id);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Apply Directly on {selectedJob.sourceAts ? selectedJob.sourceAts.toUpperCase() : 'External'} ATS
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      handleApply(selectedJob.id);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Initiate Secure Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Alert Subscriptions & Simulated Notification Management Drawer */}
      <JobAlertsNotificationDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        onSelectJob={(job) => setSelectedJob(job)}
        onApplyCriteria={(crit) => {
          setKeywords(crit.keywords);
          setLocation(crit.location);
          setMinSalary(crit.minSalary);
          setMaxSalary(crit.maxSalary);
          executeSearch(crit.keywords, crit.location, crit.minSalary, crit.maxSalary, selectedUrgency);
        }}
      />
    </div>
  );
}
