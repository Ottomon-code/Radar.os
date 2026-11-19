import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Globe2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Target,
  ArrowUpRight,
  Filter,
  DollarSign,
  Briefcase,
  Compass,
  Download,
  Check,
  FileSpreadsheet,
  ChevronDown,
  Copy,
  Table,
  Eye,
  FileText,
  Bookmark,
  CheckCircle2,
  Lock,
  Crown,
  Activity,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CAREER_PROFILES,
  generateSalaryTimeline,
  matchCareerProfile,
  CareerPathProfile,
} from '../utils/marketAnalyticsEngine';
import { downloadBulkCapabilitiesCsv } from '../utils/bulkCapabilitiesCsv';
import {
  getActiveServerUrl,
  getBulkCapabilitiesCsvApiUrl,
} from '../utils/serverConfig';
import CsvCapabilitiesPreviewPanel from './CsvCapabilitiesPreviewPanel';
import TotalCompSimulator from './TotalCompSimulator';
import NegotiationScriptBuilder from './NegotiationScriptBuilder';
import SalaryDistributionChart from './SalaryDistributionChart';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { OfflineCacheStatusBadge } from './OfflineCacheStatusBadge';
import { saveSalaryDataToCache } from '../utils/offlineMarketCache';
import { MarketAnalyticsSkeleton } from './Skeletons';
import {
  useSubscriptionStatus,
  PremiumBadge,
  PremiumGate,
  SubscriptionStatusIndicator,
} from '../hooks/useSubscriptionStatus';

interface MarketAnalyticsTabProps {
  initialCareerInterest?: string;
  onNavigateToCareerPath?: (role: string, targetSalary?: number) => void;
  onNavigateToJobRadar?: (keyword: string) => void;
  onOpenDossierModal?: () => void;
  onOpenCurrencyModal?: () => void;
  onSendToEnvoy?: (script: string) => void;
}

export default function MarketAnalyticsTab({
  initialCareerInterest,
  onNavigateToCareerPath,
  onNavigateToJobRadar,
  onOpenDossierModal,
  onOpenCurrencyModal,
  onSendToEnvoy,
}: MarketAnalyticsTabProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Determine profile from initialCareerInterest or default
  const defaultProfileKey = useMemo(
    () => matchCareerProfile(initialCareerInterest),
    [initialCareerInterest]
  );

  const { currency, setCurrency, isPppMode, currencySymbol, rateToUsd: currencyMultiplier } = useCurrency();
  const { user, saveCareerPath, savedCareerPaths, updateUserPreferences } = useAuth();
  const { isPro, gateAccess } = useSubscriptionStatus();

  const [selectedProfileKey, setSelectedProfileKey] = useState<string>(defaultProfileKey);
  const [activeChartMode, setActiveChartMode] = useState<
    'trends' | 'percentiles' | 'composition' | 'geography' | 'tc_simulator' | 'negotiation_scripts'
  >('trends');
  const [trendDisplayMode, setTrendDisplayMode] = useState<'chart' | 'table'>('chart');
  const [copiedTableData, setCopiedTableData] = useState(false);
  const [negotiationPreload, setNegotiationPreload] = useState<{ firm: string; base: number; totalComp: number } | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [visibleSectors, setVisibleSectors] = useState<{ [key: string]: boolean }>({
    aiCompute: true,
    robotics: true,
    fintechQuant: true,
    cyberDefense: true,
    cloudSystems: true,
    biotechML: true,
    userFocusedSalary: true,
  });

  const activeProfile: CareerPathProfile = CAREER_PROFILES[selectedProfileKey] || CAREER_PROFILES.ai_infra;

  const isProfileSaved = useMemo(() => {
    return savedCareerPaths.some((p) => p.roleKey === selectedProfileKey);
  }, [savedCareerPaths, selectedProfileKey]);

  const handleSaveToProfile = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    const targetComp = Math.round(activeProfile.ttc2026 * currencyMultiplier);
    await saveCareerPath(selectedProfileKey, activeProfile.title, targetComp);
    await updateUserPreferences({
      targetRole: activeProfile.title,
      targetSalary: targetComp,
      targetSector: activeProfile.sectorLabel,
    });
    setSaveSuccessMsg(`Career path "${activeProfile.title}" saved to your cloud profile!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Evolving salary timeline based on active career interest
  const rawTimeline = useMemo(() => generateSalaryTimeline(selectedProfileKey), [selectedProfileKey]);

  const [liveAtsBenchmarks, setLiveAtsBenchmarks] = useState<{
    boardsSucceeded: number;
    boardCount: number;
    totalOpeningsAcrossBoards: number;
    disclosedCompRolesCount: number;
    medianDisclosedMidpointUsd: number;
    topHiringOrgs: Array<{ company: string; openCount: number; maxSalary: number }>;
  } | null>(null);

  // Synchronize career salary market data with Service Worker & Live External ATS telemetry
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    async function syncSalaryTelemetry() {
      try {
        const res = await fetch('/api/salary/market-analytics');
        if (res.ok) {
          const data = await res.json();
          if (active && data && data.profiles && data.timeline) {
            await saveSalaryDataToCache(data.profiles, data.timeline);
          }
          if (active && data?.liveAtsBenchmarks) {
            setLiveAtsBenchmarks(data.liveAtsBenchmarks);
          }
        } else {
          await saveSalaryDataToCache(CAREER_PROFILES, rawTimeline);
        }
      } catch {
        await saveSalaryDataToCache(CAREER_PROFILES, rawTimeline);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    syncSalaryTelemetry();
    return () => { active = false; };
  }, [selectedProfileKey, rawTimeline]);

  const timelineData = useMemo(() => {
    return rawTimeline.map((item) => ({
      ...item,
      aiCompute: Math.round(item.aiCompute * currencyMultiplier),
      robotics: Math.round(item.robotics * currencyMultiplier),
      fintechQuant: Math.round(item.fintechQuant * currencyMultiplier),
      cyberDefense: Math.round(item.cyberDefense * currencyMultiplier),
      cloudSystems: Math.round(item.cloudSystems * currencyMultiplier),
      biotechML: Math.round(item.biotechML * currencyMultiplier),
      userFocusedSalary: item.userFocusedSalary
        ? Math.round(item.userFocusedSalary * currencyMultiplier)
        : undefined,
    }));
  }, [rawTimeline, currencyMultiplier]);

  // Career Growth Index KPI computation over time
  const careerGrowthIndexData = useMemo(() => {
    const base2020 = timelineData.find((d) => d.year === '2020')?.aiCompute || 150000;
    return timelineData.map((d) => {
      const val = d.userFocusedSalary !== undefined ? d.userFocusedSalary : d.aiCompute;
      const indexScore = Math.round((val / base2020) * 100);
      return {
        year: d.year,
        'Career Growth Index': indexScore,
        'Comp Benchmark': Math.round(val / 1000),
      };
    });
  }, [timelineData]);

  // Percentiles for the active profile
  const percentileData = useMemo(() => {
    return activeProfile.percentileDistribution.map((tier) => ({
      tier: tier.tier,
      '25th Percentile': Math.round(tier.p25 * currencyMultiplier),
      'Median (50th)': Math.round(tier.median * currencyMultiplier),
      '75th Percentile': Math.round(tier.p75 * currencyMultiplier),
      '90th Percentile': Math.round(tier.p90 * currencyMultiplier),
    }));
  }, [activeProfile, currencyMultiplier]);

  // Composition data
  const compositionData = useMemo(() => {
    return activeProfile.compComposition.map((item) => ({
      seniority: item.seniority,
      'Base Salary': Math.round(item.base * currencyMultiplier),
      'Annual Bonus': Math.round(item.bonus * currencyMultiplier),
      'Equity / RSU Value': Math.round(item.equity * currencyMultiplier),
      Total: Math.round((item.base + item.bonus + item.equity) * currencyMultiplier),
    }));
  }, [activeProfile, currencyMultiplier]);

  // Regional data
  const regionalData = useMemo(() => {
    return activeProfile.regionalData.map((reg) => ({
      region: reg.region,
      salary: Math.round(reg.salary * currencyMultiplier),
      colIndex: reg.colIndex,
    }));
  }, [activeProfile, currencyMultiplier]);

  const toggleSector = (key: string) => {
    setVisibleSectors((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportCSV = (exportScope: 'all' | 'current' = 'all') => {
    try {
      const sanitize = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const lines: string[] = [];
      const timestamp = new Date().toISOString();
      const exportDate = timestamp.split('T')[0];
      const roleName = activeProfile.title;

      lines.push('item name,item description,price');

      if (exportScope === 'all' || activeChartMode === 'trends') {
        timelineData.forEach((row) => {
          const isForecast = parseInt(row.year, 10) >= 2026;
          const salaryVal = row.userFocusedSalary !== undefined ? row.userFocusedSalary : row.aiCompute;
          lines.push([
            sanitize(`${roleName} - ${row.year} Compensation Benchmark`),
            sanitize(`${isForecast ? 'Calibrated forward projection' : 'Historical realized benchmark'} for ${roleName} (${currency})`),
            sanitize(`${currencySymbol}${salaryVal.toLocaleString()} ${currency}`),
          ].join(','));
        });
      }

      if (exportScope === 'all' || activeChartMode === 'percentiles') {
        percentileData.forEach((row) => {
          lines.push([
            sanitize(`${roleName} - ${row.tier} Seniority Percentile`),
            sanitize(`${row.tier} distribution: 25th (${currencySymbol}${row['25th Percentile'].toLocaleString()}), 75th (${currencySymbol}${row['75th Percentile'].toLocaleString()}), 90th (${currencySymbol}${row['90th Percentile'].toLocaleString()})`),
            sanitize(`${currencySymbol}${row['Median (50th)'].toLocaleString()} ${currency}`),
          ].join(','));
        });
      }

      if (exportScope === 'all' || activeChartMode === 'composition') {
        compositionData.forEach((row) => {
          lines.push([
            sanitize(`${roleName} - ${row.seniority} Total Target Compensation`),
            sanitize(`Total annual package breakdown: Base Salary (${currencySymbol}${row['Base Salary'].toLocaleString()}), Annual Bonus (${currencySymbol}${row['Annual Bonus'].toLocaleString()}), Equity/RSU (${currencySymbol}${row['Equity / RSU Value'].toLocaleString()})`),
            sanitize(`${currencySymbol}${row.Total.toLocaleString()} ${currency}`),
          ].join(','));
        });
      }

      if (exportScope === 'all' || activeChartMode === 'geography') {
        regionalData.forEach((row) => {
          lines.push([
            sanitize(`${roleName} - ${row.region} Regional Hub Benchmark`),
            sanitize(`Metropolitan compensation baseline in ${row.region} (Cost of Living Index: ${row.colIndex} relative to SF 100)`),
            sanitize(`${currencySymbol}${row.salary.toLocaleString()} ${currency}`),
          ].join(','));
        });
      }

      if (exportScope === 'all') {
        activeProfile.keySkillsPremium.forEach((skill) => {
          const valueAdd = Math.round(activeProfile.baseSalary2026 * currencyMultiplier * (skill.premiumPercent / 100));
          lines.push([
            sanitize(`${roleName} - ${skill.skill} Skill Premium`),
            sanitize(`Market compensation premium accelerator (+${skill.premiumPercent}%) for ${skill.skill}`),
            sanitize(`+${currencySymbol}${valueAdd.toLocaleString()} ${currency}`),
          ].join(','));
        });
      }

      const csvContent = lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeProfile = activeProfile.title.replace(/[^a-zA-Z0-9]/g, '_').replace(/__+/g, '_');
      const scopeSuffix = exportScope === 'current' ? `_${activeChartMode}` : '_AllAnalytics';
      link.setAttribute('href', url);
      link.setAttribute('download', `TalentRadar_Market_${safeProfile}_${currency}${scopeSuffix}_${exportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(
        `Exported ${safeProfile} (${currency}) ${exportScope === 'all' ? 'All Projections & Trends' : activeChartMode.toUpperCase()} to CSV`
      );
      setShowExportMenu(false);
      setTimeout(() => {
        setExportSuccessMessage(null);
      }, 4500);
    } catch (err) {
      console.error('CSV export error:', err);
    }
  };

  const handleBulkCapabilitiesDownload = () => {
    try {
      downloadBulkCapabilitiesCsv();
      setExportSuccessMessage(`Downloaded Master Bulk Capabilities CSV (${currency}) successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Bulk capabilities CSV export error:', err);
    }
  };

  if (isLoading) {
    return <MarketAnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Offline Status & Header Telemetry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#22d3a5]" />
              RECHARTS SALARY TRAJECTORY FORECASTS (2020–2027)
            </span>
            <OfflineCacheStatusBadge category="salary" />
          </div>
          <h2 className="text-xl font-bold font-mono text-[#dce7f0] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#22d3a5]" />
            GLOBAL MARKET ANALYTICS &amp; COMPENSATION BENCHMARKING
          </h2>
          <p className="text-xs text-[#7a8b99] font-mono">
            Calibrated against real-time frontier AI, robotics, fintech quant, and cloud infrastructure telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Firestore Subscription Sync Indicator */}
          <SubscriptionStatusIndicator />

          {/* Currency Switcher Trigger */}
          {onOpenCurrencyModal && (
            <button
              onClick={onOpenCurrencyModal}
              className="px-3.5 py-2 rounded-lg bg-[#0a0f14] hover:bg-[#162738] border border-[#22d3a5]/50 text-[#22d3a5] text-xs font-mono font-bold flex items-center gap-1.5 transition shadow cursor-pointer active:scale-95"
              title="Change active currency and PPP normalization"
            >
              <Globe2 className="w-4 h-4 text-[#22d3a5]" />
              <span>{currency} ({currencySymbol})</span>
              {isPppMode && <span className="text-[9px] bg-[#38bdf8]/20 px-1 rounded text-[#38bdf8]">PPP</span>}
            </button>
          )}

          {/* Direct Download Current View CSV Button */}
          <button
            type="button"
            onClick={() => handleExportCSV('current')}
            className="px-3.5 py-2 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-mono font-bold flex items-center gap-1.5 transition shadow cursor-pointer active:scale-95"
            title={`Download currently viewed market data (${activeChartMode}) as CSV`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" />
            <span>Download CSV ({activeChartMode.toUpperCase()})</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(34,211,165,0.25)] cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Telemetry</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0f1720] border-2 border-[#22d3a5]/60 rounded-xl shadow-2xl p-2 z-50 font-mono text-xs space-y-1 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#7a8b99] uppercase tracking-wider border-b border-[#1e2b36] mb-1">
                  Export Options ({currency})
                </div>

                <button
                  onClick={() => {
                    if (gateAccess('pro', 'Bulk All Capabilities CSV Master Dossier export')) {
                      handleBulkCapabilitiesDownload();
                    }
                  }}
                  className="w-full text-left px-2.5 py-2.5 rounded-lg bg-gradient-to-r from-[#22d3a5]/20 via-[#38bdf8]/20 to-[#fbbf24]/10 hover:from-[#22d3a5]/30 hover:to-[#38bdf8]/30 border border-[#22d3a5]/60 text-[#22d3a5] transition flex items-center justify-between group shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#22d3a5] shrink-0 fill-[#22d3a5]" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-white">
                        <span>Bulk All Capabilities CSV</span>
                        <PremiumBadge requiredTier="pro" />
                      </div>
                      <div className="text-[10px] text-[#7a8b99]">All 8 Sections, 2020-2027 Projections, Tax &amp; Platform</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[#22d3a5] shrink-0 group-hover:scale-110 transition" />
                </button>

                <button
                  onClick={() => handleExportCSV('all')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#152330] text-[#dce7f0] hover:text-[#22d3a5] transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#22d3a5]" />
                    <div>
                      <div className="font-semibold">Current Profile Full Analytics</div>
                      <div className="text-[10px] text-[#7a8b99]">Trends, Percentiles, Comp &amp; Hubs for {activeProfile.title.split('(')[0]}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">Profile</span>
                </button>
                <button
                  onClick={() => handleExportCSV('current')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#152330] text-[#dce7f0] hover:text-[#38bdf8] transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#3b82f6]" />
                    <div>
                      <div className="font-semibold capitalize">{activeChartMode} View Only</div>
                      <div className="text-[10px] text-[#7a8b99]">Active chart visualization matrix</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">View</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('csv-capabilities-preview-panel');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-[#22d3a5]/40 bg-[#22d3a5]/10 hover:bg-[#22d3a5]/20 text-[#22d3a5] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>PREVIEW CSV</span>
          </button>
        </div>
      </div>

      {exportSuccessMessage && (
        <div className="p-3 bg-[#22d3a5]/10 border border-[#22d3a5]/50 rounded-lg flex items-center justify-between text-xs font-mono text-[#22d3a5] animate-pulse">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
            <div>
              <span className="font-bold text-white">Export Complete: </span>
              <span>{exportSuccessMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Career Path Interest Selector Bar */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#1e2b36]">
          <span className="text-xs font-bold text-[#dce7f0] flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#22d3a5]" />
            SELECT CAREER PATH INTEREST (DATA DYNAMICALLY RECALIBRATES):
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#22d3a5]">
              Active Focus: <strong>{activeProfile.title}</strong>
            </span>
            <button
              onClick={handleSaveToProfile}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isProfileSaved
                  ? 'bg-[#22d3a5]/20 border border-[#22d3a5] text-[#22d3a5]'
                  : 'bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isProfileSaved ? 'SAVED TO ACCOUNT' : 'SAVE TO ACCOUNT'}</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {Object.entries(CAREER_PROFILES).map(([key, prof]) => {
            const isSelected = selectedProfileKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedProfileKey(key)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#152330] border-[#22d3a5] text-[#dce7f0] shadow-[0_0_12px_rgba(34,211,165,0.2)]'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] hover:border-[#3b82f6]/50'
                }`}
              >
                <div className="font-bold text-[11px] line-clamp-1">{prof.title.split('(')[0]}</div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-[#22d3a5] font-semibold">
                    {currencySymbol}{Math.round(prof.ttc2026 * currencyMultiplier / 1000)}k TTC
                  </span>
                  <span className="text-[#7a8b99]">{prof.fiveYearCagr}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Career Interest Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] shadow">
          <span className="text-[#7a8b99] text-[10px] block">TARGET TOTAL COMP (TTC 2026)</span>
          <span className="text-xl font-bold text-[#22d3a5] mt-0.5 block">
            {currencySymbol}{Math.round(activeProfile.ttc2026 * currencyMultiplier).toLocaleString()} {currency}
          </span>
          <span className="text-[10px] text-[#7a8b99] mt-1 block">
            Base: {currencySymbol}{Math.round(activeProfile.baseSalary2026 * currencyMultiplier).toLocaleString()} + Liquid Equity
          </span>
        </div>

        <div className="bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] shadow">
          <span className="text-[#7a8b99] text-[10px] block">5-YEAR COMP VELOCITY</span>
          <span className="text-xl font-bold text-[#3b82f6] mt-0.5 block">
            {activeProfile.fiveYearCagr}
          </span>
          <span className="text-[10px] text-[#7a8b99] mt-1 block">
            Compounding Historical Trajectory
          </span>
        </div>

        <div className="bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] shadow">
          <span className="text-[#7a8b99] text-[10px] block">MARKET SCARCITY INDEX</span>
          <span className="text-xl font-bold text-[#a78bfa] mt-0.5 block">
            {activeProfile.scarcityScore} / 100
          </span>
          <span className="text-[10px] text-[#7a8b99] mt-1 block">
            High Compute / Specialized Domain
          </span>
        </div>

        <div className="bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] shadow">
          <span className="text-[#7a8b99] text-[10px] block">SECTOR CLASSIFICATION</span>
          <span className="text-sm font-bold text-[#fbbf24] mt-1 block truncate">
            {activeProfile.sectorLabel}
          </span>
          <span className="text-[10px] text-[#7a8b99] mt-1 block">
            Verified ATS Requisition Stream
          </span>
        </div>
      </div>

      {liveAtsBenchmarks && liveAtsBenchmarks.boardsSucceeded > 0 && (
        <div className="bg-[#0a0f14] border border-[#22d3a5]/30 rounded-xl p-4 font-mono text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold text-[10px]">
                LIVE EXTERNAL ATS BENCHMARKING
              </span>
              <span className="text-[#dce7f0] font-semibold">
                {liveAtsBenchmarks.boardsSucceeded}/{liveAtsBenchmarks.boardCount} Boards Live •{' '}
                {liveAtsBenchmarks.totalOpeningsAcrossBoards.toLocaleString()} Open Roles •{' '}
                {liveAtsBenchmarks.disclosedCompRolesCount} Disclosed Comp Bands
              </span>
            </div>
            {liveAtsBenchmarks.medianDisclosedMidpointUsd > 0 && (
              <div className="text-[11px] text-[#7a8b99]">
                Live Disclosed ATS Median Midpoint:{' '}
                <strong className="text-[#22d3a5]">
                  {currencySymbol}
                  {Math.round(liveAtsBenchmarks.medianDisclosedMidpointUsd * currencyMultiplier).toLocaleString()} {currency}
                </strong>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {liveAtsBenchmarks.topHiringOrgs.slice(0, 4).map((org) => (
              <span
                key={org.company}
                className="px-2 py-1 rounded bg-[#111a22] border border-[#1e2b36] text-[10px] text-[#dce7f0]"
              >
                {org.company}: <strong className="text-[#22d3a5]">{org.openCount}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW RECHARTS SUMMARY KPI COMPONENT: CAREER GROWTH INDEX (CGI)
         ========================================================================= */}
      <div className="panel bg-[#111a22] border-2 border-[#22d3a5]/40 rounded-xl p-5 shadow-[0_0_25px_rgba(34,211,165,0.15)] space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/20 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.2)] shrink-0">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  CAREER GROWTH INDEX (CGI) // 2020–2027 TRAJECTORY
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-bold">
                  BASE 100 (2020)
                </span>
              </div>
              <p className="text-xs text-[#7a8b99]">
                Visualizing compounding salary velocity and purchasing power acceleration over time for <strong className="text-[#22d3a5]">{activeProfile.title}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-right">
              <span className="text-[10px] text-[#7a8b99] block">CURRENT CGI SCORE</span>
              <span className="text-lg font-bold text-[#22d3a5]">
                {careerGrowthIndexData[careerGrowthIndexData.length - 1]?.['Career Growth Index'] || 185} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Career Growth Index Area / Line Chart */}
        <div className="h-64 w-full bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={careerGrowthIndexData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
              <XAxis dataKey="year" stroke="#7a8b99" fontSize={11} />
              <YAxis stroke="#7a8b99" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c131a',
                  borderColor: '#22d3a5',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line
                type="monotone"
                dataKey="Career Growth Index"
                stroke="#22d3a5"
                strokeWidth={3}
                dot={{ fill: '#22d3a5', r: 4 }}
                activeDot={{ r: 7 }}
                name="Career Growth Index (Base 100)"
              />
              <Line
                type="monotone"
                dataKey="Comp Benchmark"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#38bdf8', r: 3 }}
                name={`Comp Benchmark (${currencySymbol}k)`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Role Salary Distribution Visualization (Recharts) */}
      <SalaryDistributionChart
        profile={activeProfile}
        allProfiles={CAREER_PROFILES}
        selectedProfileKey={selectedProfileKey}
        onSelectProfile={setSelectedProfileKey}
      />

      {/* Main Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0a0f14] p-2 rounded-xl border border-[#1e2b36] font-mono text-xs">
        <button
          onClick={() => setActiveChartMode('trends')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'trends'
              ? 'bg-[#22d3a5] text-black shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Multi-Sector Salary Trends</span>
        </button>

        <button
          onClick={() => setActiveChartMode('percentiles')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'percentiles'
              ? 'bg-[#22d3a5] text-black shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Seniority Percentiles</span>
        </button>

        <button
          onClick={() => setActiveChartMode('composition')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'composition'
              ? 'bg-[#22d3a5] text-black shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Comp Composition (Base/Bonus/Equity)</span>
        </button>

        <button
          onClick={() => setActiveChartMode('geography')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'geography'
              ? 'bg-[#22d3a5] text-black shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Metropolitan Hubs &amp; Col Index</span>
        </button>

        <button
          onClick={() => setActiveChartMode('tc_simulator')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'tc_simulator'
              ? 'bg-[#3b82f6] text-white shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>4-Year Total Comp Simulator</span>
          <PremiumBadge requiredTier="pro" />
        </button>

        <button
          onClick={() => setActiveChartMode('negotiation_scripts')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
            activeChartMode === 'negotiation_scripts'
              ? 'bg-[#a78bfa] text-black shadow'
              : 'text-[#7a8b99] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Counter-Offer &amp; Negotiation Scripts</span>
        </button>
      </div>

      {/* RENDER ACTIVE MODE */}
      {activeChartMode === 'trends' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-xl space-y-5 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2b36]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#22d3a5]" />
                COMPENSATION TRAJECTORY MATRIX (2020–2027)
              </h3>
              <p className="text-xs text-[#7a8b99]">
                Historical realization and calibrated forward forecasts across frontier technical domains ({currency}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTrendDisplayMode('chart')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                  trendDisplayMode === 'chart'
                    ? 'bg-[#22d3a5] text-black'
                    : 'bg-[#0a0f14] text-[#7a8b99] hover:text-white border border-[#1e2b36]'
                }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setTrendDisplayMode('table')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                  trendDisplayMode === 'table'
                    ? 'bg-[#22d3a5] text-black'
                    : 'bg-[#0a0f14] text-[#7a8b99] hover:text-white border border-[#1e2b36]'
                }`}
              >
                Table Data
              </button>
            </div>
          </div>

          {/* Sector Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#7a8b99]">Sectors:</span>
            {[
              { key: 'aiCompute', label: 'AI & GPU Compute', color: '#22d3a5' },
              { key: 'robotics', label: 'Autonomous Robotics', color: '#38bdf8' },
              { key: 'fintechQuant', label: 'Fintech & HFT Quant', color: '#fbbf24' },
              { key: 'cyberDefense', label: 'Cyber & GovCloud', color: '#f87171' },
              { key: 'cloudSystems', label: 'Cloud Systems', color: '#a78bfa' },
              { key: 'userFocusedSalary', label: `${activeProfile.title.split('(')[0]} Baseline`, color: '#ec4899' },
            ].map((sec) => (
              <button
                key={sec.key}
                onClick={() => toggleSector(sec.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  visibleSectors[sec.key]
                    ? 'bg-[#152330] border-current text-white'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                }`}
                style={{ borderColor: visibleSectors[sec.key] ? sec.color : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          {trendDisplayMode === 'chart' ? (
            <div className="h-80 w-full bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                  <XAxis dataKey="year" stroke="#7a8b99" fontSize={11} />
                  <YAxis stroke="#7a8b99" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c131a',
                      borderColor: '#22d3a5',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  {visibleSectors.aiCompute && (
                    <Line type="monotone" dataKey="aiCompute" stroke="#22d3a5" strokeWidth={3} name="AI & GPU Compute" />
                  )}
                  {visibleSectors.robotics && (
                    <Line type="monotone" dataKey="robotics" stroke="#38bdf8" strokeWidth={2} name="Robotics" />
                  )}
                  {visibleSectors.fintechQuant && (
                    <Line type="monotone" dataKey="fintechQuant" stroke="#fbbf24" strokeWidth={2} name="Fintech Quant" />
                  )}
                  {visibleSectors.cyberDefense && (
                    <Line type="monotone" dataKey="cyberDefense" stroke="#f87171" strokeWidth={2} name="Cyber Defense" />
                  )}
                  {visibleSectors.cloudSystems && (
                    <Line type="monotone" dataKey="cloudSystems" stroke="#a78bfa" strokeWidth={2} name="Cloud Systems" />
                  )}
                  {visibleSectors.userFocusedSalary && (
                    <Line
                      type="monotone"
                      dataKey="userFocusedSalary"
                      stroke="#ec4899"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      name={`${activeProfile.title.split('(')[0]} (Focus)`}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0a0f14] border-b border-[#1e2b36] text-[#7a8b99]">
                    <th className="p-3">Year</th>
                    <th className="p-3">AI &amp; Compute</th>
                    <th className="p-3">Robotics</th>
                    <th className="p-3">Fintech Quant</th>
                    <th className="p-3">Cyber Defense</th>
                    <th className="p-3">Cloud Systems</th>
                    <th className="p-3 text-[#22d3a5]">Active Profile Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b36]">
                  {timelineData.map((row) => (
                    <tr key={row.year} className="hover:bg-[#152330]/50 transition">
                      <td className="p-3 font-bold text-white">{row.year}</td>
                      <td className="p-3">{currencySymbol}{row.aiCompute.toLocaleString()}</td>
                      <td className="p-3">{currencySymbol}{row.robotics.toLocaleString()}</td>
                      <td className="p-3">{currencySymbol}{row.fintechQuant.toLocaleString()}</td>
                      <td className="p-3">{currencySymbol}{row.cyberDefense.toLocaleString()}</td>
                      <td className="p-3">{currencySymbol}{row.cloudSystems.toLocaleString()}</td>
                      <td className="p-3 font-bold text-[#22d3a5]">
                        {row.userFocusedSalary ? `${currencySymbol}${row.userFocusedSalary.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeChartMode === 'percentiles' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-xl space-y-4 font-mono">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#22d3a5]" />
            SENIORITY PERCENTILE SPREAD // {activeProfile.title.toUpperCase()}
          </h3>
          <p className="text-xs text-[#7a8b99]">
            Compare 25th, median, 75th, and elite 90th percentile total compensation packages across seniority brackets.
          </p>

          <div className="h-80 w-full bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={percentileData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                <XAxis dataKey="tier" stroke="#7a8b99" fontSize={11} />
                <YAxis stroke="#7a8b99" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c131a',
                    borderColor: '#22d3a5',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="25th Percentile" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Median (50th)" fill="#22d3a5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="75th Percentile" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="90th Percentile" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeChartMode === 'composition' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-xl space-y-4 font-mono">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#22d3a5]" />
            TOTAL COMPENSATION COMPOSITION (BASE + BONUS + EQUITY)
          </h3>
          <p className="text-xs text-[#7a8b99]">
            Breakdown of cash salary versus liquid equity and annual performance bonuses for {activeProfile.title}.
          </p>

          <div className="h-80 w-full bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compositionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                <XAxis dataKey="seniority" stroke="#7a8b99" fontSize={11} />
                <YAxis stroke="#7a8b99" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c131a',
                    borderColor: '#22d3a5',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="Base Salary" stackId="a" fill="#22d3a5" />
                <Bar dataKey="Annual Bonus" stackId="a" fill="#38bdf8" />
                <Bar dataKey="Equity / RSU Value" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeChartMode === 'geography' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-xl space-y-4 font-mono">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#22d3a5]" />
            METROPOLITAN HUBS &amp; COST OF LIVING INDEX
          </h3>
          <p className="text-xs text-[#7a8b99]">
            Regional compensation benchmarking across global technology centers relative to San Francisco baseline (100).
          </p>

          <div className="h-80 w-full bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                <XAxis dataKey="region" stroke="#7a8b99" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#7a8b99" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c131a',
                    borderColor: '#22d3a5',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="salary" fill="#38bdf8" name={`Compensation (${currency})`} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeChartMode === 'tc_simulator' && (
        <PremiumGate
          requiredTier="pro"
          featureTitle="4-Year Total Comp & Equity Vesting Simulator"
          reason="Unlock 4-year total compensation modeling, equity vesting cliff schedules, strike price valuations, and scenario planning."
        >
          <TotalCompSimulator
            onSendToNegotiation={(compData) => {
              setNegotiationPreload(compData);
              setActiveChartMode('negotiation_scripts');
            }}
          />
        </PremiumGate>
      )}

      {activeChartMode === 'negotiation_scripts' && (
        <NegotiationScriptBuilder
          initialRole={activeProfile.title}
          initialCompany={activeProfile.sectorLabel}
          onSendToAIEnvoy={onSendToEnvoy}
        />
      )}

      {/* CSV Capabilities Preview Panel */}
      <div id="csv-capabilities-preview-panel">
        <CsvCapabilitiesPreviewPanel />
      </div>
    </div>
  );
}
