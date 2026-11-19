import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  TrendingUp,
  Search,
  Building,
  Layers,
  Sparkles,
  ExternalLink,
  Bookmark,
  AlertTriangle,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { IntelBrief } from '../utils/radarEngine';
import { useSavedItems } from '../context/SavedItemsContext';
import { OfflineCacheStatusBadge } from './OfflineCacheStatusBadge';
import {
  saveNewsBriefToCache,
  getCachedNewsBrief,
  formatRefreshedTime,
  isOnline,
} from '../utils/offlineMarketCache';

type GroundedIntelBrief = IntelBrief & {
  sources?: Array<{ title: string; url: string }>;
  groundingProvider?: string;
};

const POPULAR_COMPANIES = [
  'Anthropic & OpenAI Ecosystem',
  'Palantir / Defense Tech Alliance',
  'Citadel Securities / HFT Core',
  'Skydio & Autonomous Robotics',
  'NVIDIA & Custom ASIC Fabric',
  'Meta Supercomputing Group',
];

interface NewsTabProps {
  initialCompany?: string;
  initialSector?: string;
  initialKeywords?: string;
  onSearchJobsForCompany?: (company: string, sector?: string) => void;
  onNavigateToCareer?: (targetRole: string, targetSalary?: number) => void;
}

export default function NewsTab({
  initialCompany,
  initialSector,
  initialKeywords,
  onSearchJobsForCompany,
}: NewsTabProps) {
  const [company, setCompany] = useState(
    initialCompany || 'Anthropic & OpenAI Ecosystem'
  );
  const [sector, setSector] = useState(
    initialSector || 'Frontier AI & High-Performance Compute'
  );
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toggleSaveNewsItem, isNewsSaved } = useSavedItems();

  const [intelBrief, setIntelBrief] = useState<GroundedIntelBrief | null>(() => {
    const cached = getCachedNewsBrief(
      initialCompany || 'Anthropic & OpenAI Ecosystem',
      initialSector || 'Frontier AI & High-Performance Compute'
    );
    return cached?.brief || null;
  });

  const [isOfflineSnippet, setIsOfflineSnippet] = useState<boolean>(!isOnline());
  const [cachedSnippetTimestamp, setCachedSnippetTimestamp] = useState<string | null>(null);

  const fetchIntel = useCallback(
    async (
      targetCo = company,
      targetSec = sector,
      kw = initialKeywords
    ) => {
      setLoading(true);
      setApiError(null);
      try {
        const params = new URLSearchParams({
          company: targetCo,
          sector: targetSec,
          keywords: kw || '',
        });
        const getRes = await fetch(`/api/news?${params.toString()}`);
        if (getRes.ok) {
          const data: GroundedIntelBrief = await getRes.json();
          setIntelBrief(data);
          setIsOfflineSnippet(false);
          setCachedSnippetTimestamp(new Date().toISOString());
          await saveNewsBriefToCache(targetCo, targetSec, data);
          return;
        }

        const errData = await getRes.json().catch(() => ({}));
        const cached = getCachedNewsBrief(targetCo, targetSec);
        if (cached) {
          setIntelBrief(cached.brief);
          setIsOfflineSnippet(true);
          setCachedSnippetTimestamp(cached.timestamp);
          setApiError(
            errData?.error ||
              `Live grounded brief failed (${getRes.status}). Showing last cached network brief.`
          );
        } else {
          setApiError(
            errData?.error ||
              `Live Gemini + Google Search briefing unavailable (${getRes.status}). Verify GEMINI_API_KEY in Settings > Secrets.`
          );
        }
      } catch (err: any) {
        const cached = getCachedNewsBrief(targetCo, targetSec);
        if (cached) {
          setIntelBrief(cached.brief);
          setIsOfflineSnippet(true);
          setCachedSnippetTimestamp(cached.timestamp);
          setApiError('Network error while reaching news endpoint. Showing last cached network brief.');
        } else {
          setApiError(
            err?.message ||
              'Unable to reach /api/news. Check network connectivity and GEMINI_API_KEY in Settings > Secrets.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [company, sector, initialKeywords]
  );

  // Initial mount fetch + sync when coming from job search
  useEffect(() => {
    const nextCo = initialCompany || company;
    const nextSec = initialSector || sector;
    if (initialCompany) setCompany(initialCompany);
    if (initialSector) setSector(initialSector);
    fetchIntel(nextCo, nextSec, initialKeywords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompany, initialSector, initialKeywords]);

  const handleSelectQuickCompany = (c: string) => {
    setCompany(c);
    fetchIntel(c, sector, initialKeywords);
  };

  return (
    <div className="space-y-6">
      {/* Search-to-News Alignment Notice */}
      {initialCompany && (
        <div className="panel bg-gradient-to-r from-[#111a22] to-[#162534] border border-[#3b82f6]/40 rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-[#3b82f6] font-semibold">
                INDUSTRY INTEL ALIGNED WITH JOB SEARCH
              </div>
              <div className="text-sm font-bold font-mono text-[#dce7f0]">
                Company: {company} • Sector: {sector} {initialKeywords ? `• Filtered by "${initialKeywords}"` : ''}
              </div>
            </div>
          </div>

          {onSearchJobsForCompany && (
            <button
              onClick={() => onSearchJobsForCompany(company, sector)}
              className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6] text-xs font-mono text-[#3b82f6] flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              Search All Openings at {company.split('/')[0]}
            </button>
          )}
        </div>
      )}

      {/* Reconnaissance Search Header */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1e2b36]">
          <div>
            <h2 className="text-lg font-bold text-[#dce7f0] font-mono flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#22d3a5]" />
              MARKET INTEL BRIEFING &amp; INDUSTRY NEWS
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono">
              Google Search-grounded talent reconnaissance, funding telemetry, and live ATS hiring velocity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <OfflineCacheStatusBadge category="news" label="Sync Sector News" />
            <span className="text-xs font-mono text-[#3b82f6] px-2.5 py-1 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded">
              GEMINI + GOOGLE SEARCH
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              TARGET FIRM / CONSORTIUM
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-[#7a8b99]" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Anthropic, Stripe, Scale AI..."
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#7a8b99] mb-1">
              INDUSTRY SECTOR
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-4 h-4 text-[#7a8b99]" />
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. Defense, HFT, Frontier AI..."
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchIntel()}
              disabled={loading}
              className="w-full bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'GROUNDING SIGNALS...' : 'GENERATE INTEL BRIEF'}
            </button>
          </div>
        </div>

        {/* Quick select presets */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-[#7a8b99]">
          <span className="shrink-0 text-[#7a8b99]">HOT TARGETS:</span>
          {POPULAR_COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => handleSelectQuickCompany(c)}
              className={`px-2.5 py-1 rounded-md border transition whitespace-nowrap ${
                company === c
                  ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6] font-semibold'
                  : 'bg-[#0a0f14] border-[#1e2b36] hover:text-[#dce7f0]'
              }`}
            >
              {c.split('/')[0].split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Explicit Error Banner */}
      {apiError && (
        <div className="p-4 rounded-xl bg-[#f87171]/10 border border-[#f87171]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#f87171]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">GROUNDED INTEL STREAM NOTICE</span>
              <span className="text-[#dce7f0]">{apiError}</span>
            </div>
          </div>
          <button
            onClick={() => fetchIntel()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#f87171]/50 hover:border-[#f87171] text-[#f87171] flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Retry Live Brief
          </button>
        </div>
      )}

      {/* Initial Loading Placeholder */}
      {loading && !intelBrief && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-8 text-center font-mono space-y-3">
          <RefreshCw className="w-7 h-7 text-[#22d3a5] animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#dce7f0]">
            Querying Gemini 4 Hydrogen + Google Search Grounding...
          </div>
          <p className="text-xs text-[#7a8b99]">
            Synthesizing live news wires and matching ATS requisition counts for {company}.
          </p>
        </div>
      )}

      {/* Intel Brief Summary Card */}
      {intelBrief && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#1e2b36]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                  {intelBrief.groundingProvider || 'GEMINI + GOOGLE SEARCH'}
                </span>
                <span className="text-xs font-mono text-[#7a8b99]">
                  STAMP: {intelBrief.generatedAt}
                </span>
                {isOfflineSnippet && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    CACHED BRIEF ({formatRefreshedTime(cachedSnippetTimestamp)})
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold font-mono text-[#dce7f0] mt-1">
                {intelBrief.company}
              </h3>
              <div className="text-xs text-[#7a8b99] font-mono">{intelBrief.sector}</div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const briefId = `brief-${intelBrief.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                  toggleSaveNewsItem({
                    id: briefId,
                    headline: `${intelBrief.company}: ${intelBrief.summary.slice(0, 90)}...`,
                    company: intelBrief.company,
                    sector: intelBrief.sector,
                    source: intelBrief.groundingProvider || 'Recon Briefing',
                    date: intelBrief.generatedAt,
                    impact: 'Positive',
                    summary: intelBrief.summary,
                    savedAt: 'Today',
                  });
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${
                  isNewsSaved(`brief-${intelBrief.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <Bookmark
                  className="w-3.5 h-3.5"
                  fill={
                    isNewsSaved(`brief-${intelBrief.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
                      ? 'currentColor'
                      : 'none'
                  }
                />
                <span>
                  {isNewsSaved(`brief-${intelBrief.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
                    ? 'Brief Saved'
                    : 'Bookmark Brief'}
                </span>
              </button>

              <div className="text-right">
                <span className="text-[10px] font-mono text-[#7a8b99] block">
                  HIRING VELOCITY
                </span>
                <span className="text-xl font-bold font-mono text-[#22d3a5]">
                  {intelBrief.hiringVelocityScore}/100
                </span>
              </div>
              <div className="text-right border-l border-[#1e2b36] pl-4">
                <span className="text-[10px] font-mono text-[#7a8b99] block">SENTIMENT</span>
                <span className="text-sm font-bold font-mono text-[#3b82f6]">
                  {intelBrief.sentiment}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 mb-4">
            <div className="text-xs font-mono text-[#22d3a5] font-semibold mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              RECONNAISSANCE SYNTHESIS:
            </div>
            <p className="text-xs text-[#dce7f0] leading-relaxed">
              {intelBrief.summary}
            </p>
            {intelBrief.strategicAssessment && (
              <p className="text-xs text-[#94a3b8] leading-relaxed mt-2 pt-2 border-t border-[#1e2b36]">
                <strong className="text-[#3b82f6]">Strategic Guidance:</strong> {intelBrief.strategicAssessment}
              </p>
            )}
          </div>

          {/* Key Signals & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4">
              <h4 className="text-xs font-mono font-semibold text-[#7a8b99] mb-2 uppercase">
                Key Signal Intercepts
              </h4>
              <ul className="space-y-2 text-xs font-mono text-[#dce7f0]">
                {intelBrief.keySignals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#22d3a5] font-bold">›</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-semibold text-[#7a8b99] mb-2 uppercase">
                  Requisition Statistics
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7a8b99]">ACTIVE VERIFIED REQUISITIONS:</span>
                    <span className="text-base font-bold text-[#22d3a5]">
                      {intelBrief.openRequisitionsCount} Positions
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#7a8b99]">COMPENSATION BENCHMARK:</span>
                    <span className="text-xs font-bold text-[#dce7f0] text-right">
                      {intelBrief.avgCompensationBand}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2b36] mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#7a8b99] block">
                    OPPORTUNITY RADAR:
                  </span>
                  <span className="text-xs text-[#22d3a5] font-mono font-semibold">
                    Live External ATS Synced
                  </span>
                </div>
                {onSearchJobsForCompany && (
                  <button
                    onClick={() => onSearchJobsForCompany(intelBrief.company, intelBrief.sector)}
                    className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 text-[#22d3a5] text-xs font-mono flex items-center gap-1.5 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>View Openings</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grounded Web Sources */}
          {Array.isArray(intelBrief.sources) && intelBrief.sources.length > 0 && (
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-4 mb-4">
              <h4 className="text-xs font-mono font-semibold text-[#3b82f6] mb-2 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Verified Web Grounding Sources ({intelBrief.sources.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {intelBrief.sources.map((src, idx) => (
                  <a
                    key={`${src.url}-${idx}`}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111a22] border border-[#1e2b36] hover:border-[#3b82f6] text-[11px] font-mono text-[#dce7f0] hover:text-[#3b82f6] transition"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[260px]">{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Developments Timeline */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#7a8b99] mb-2 uppercase flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Verified Wire Transmissions
            </h4>

            <div className="space-y-2 font-mono text-xs">
              {intelBrief.recentDevelopments.map((dev, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full mt-1 sm:mt-0 ${
                        dev.impact === 'Positive'
                          ? 'bg-[#22d3a5]'
                          : dev.impact === 'Risk'
                          ? 'bg-[#f87171]'
                          : 'bg-[#fbbf24]'
                      }`}
                    />
                    <div>
                      <span className="text-[#dce7f0] font-medium">{dev.headline}</span>
                      <div className="text-[10px] text-[#7a8b99]">
                        Source: {dev.source} • {dev.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        dev.impact === 'Positive'
                          ? 'bg-[#22d3a5]/10 text-[#22d3a5] border-[#22d3a5]/30'
                          : dev.impact === 'Risk'
                          ? 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30'
                          : 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30'
                      }`}
                    >
                      {dev.impact}
                    </span>

                    <button
                      onClick={() => {
                        const wireId = `wire-${idx}-${dev.headline.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        toggleSaveNewsItem({
                          id: wireId,
                          headline: dev.headline,
                          company: intelBrief.company,
                          sector: intelBrief.sector,
                          source: dev.source,
                          date: dev.date,
                          impact: dev.impact,
                          savedAt: 'Today',
                        });
                      }}
                      title="Bookmark wire item"
                      className={`p-1 rounded border transition ${
                        isNewsSaved(`wire-${idx}-${dev.headline.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-[#111a22] border-[#1e2b36] hover:border-purple-500 text-[#7a8b99] hover:text-[#dce7f0]'
                      }`}
                    >
                      <Bookmark
                        className="w-3 h-3"
                        fill={
                          isNewsSaved(`wire-${idx}-${dev.headline.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
