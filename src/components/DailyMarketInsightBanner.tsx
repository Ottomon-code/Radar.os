import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ArrowUpRight,
  Search,
  AlertCircle,
} from 'lucide-react';

export interface DailyMarketInsightSource {
  title: string;
  url: string;
}

export interface DailyMarketInsightData {
  dateKey: string;
  focusArea: string;
  headline: string;
  summary: string;
  suggestedQuery: string;
  sources: DailyMarketInsightSource[];
  fetchedAt: string;
  cached?: boolean;
}

interface DailyMarketInsightBannerProps {
  onExploreRoles?: (keyword: string) => void;
}

const STORAGE_KEY = 'talent_radar_daily_insight_v1';

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFetchedTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DailyMarketInsightBanner({
  onExploreRoles,
}: DailyMarketInsightBannerProps) {
  const [insight, setInsight] = useState<DailyMarketInsightData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInsight = useCallback(async (forceRefresh = false) => {
    const todayKey = getTodayDateKey();

    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(STORAGE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw) as DailyMarketInsightData;
          if (parsed?.dateKey === todayKey && parsed?.headline && parsed?.summary) {
            setInsight({ ...parsed, cached: true });
            setIsLoading(false);
            setErrorMsg(null);
            return;
          }
        }
      } catch {
        // Proceed with network fetch if local cache is unreadable
      }
    }

    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({ date: todayKey });
      if (forceRefresh) params.set('refresh', '1');

      const res = await fetch(`/api/market/daily-insight?${params.toString()}`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'Unable to retrieve daily market insight.');
      }

      const normalized: DailyMarketInsightData = {
        dateKey: String(payload.dateKey || todayKey),
        focusArea: String(payload.focusArea || 'AI & High-Comp Engineering'),
        headline: String(payload.headline || ''),
        summary: String(payload.summary || ''),
        suggestedQuery: String(payload.suggestedQuery || 'AI Infrastructure'),
        sources: Array.isArray(payload.sources) ? payload.sources : [],
        fetchedAt: String(payload.fetchedAt || new Date().toISOString()),
        cached: Boolean(payload.cached && !forceRefresh),
      };

      setInsight(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // Ignore quota limits cleanly
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load today’s market insight.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInsight(false);
  }, [loadInsight]);

  if (isLoading && !insight) {
    return (
      <section
        aria-label="Daily Market Insight loading"
        className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 space-y-3 animate-pulse"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="h-3.5 w-64 bg-[#1e2b36] rounded" />
          <div className="h-8 w-32 bg-[#1e2b36] rounded-lg" />
        </div>
        <div className="h-6 w-3/4 bg-[#1e2b36] rounded" />
        <div className="h-4 w-full bg-[#1e2b36]/80 rounded" />
        <div className="h-4 w-2/3 bg-[#1e2b36]/70 rounded" />
      </section>
    );
  }

  return (
    <section
      aria-label="Daily Market Insight"
      className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 space-y-3.5"
    >
      {/* Top Row: Quiet Unboxed Metadata + Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7a8b99]">
          <span className="font-semibold text-[#dce7f0]">Daily Market Insight</span>
          <span aria-hidden="true">·</span>
          <span>{insight?.focusArea || 'AI & High-Comp Engineering'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {formatReadableDate(insight?.dateKey || getTodayDateKey())}
          </span>
          {insight?.fetchedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Updated {formatFetchedTime(insight.fetchedAt)}
                {insight.cached ? ' (Cached)' : ''}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {insight?.suggestedQuery && onExploreRoles && (
            <button
              type="button"
              onClick={() => onExploreRoles(insight.suggestedQuery)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2b36] bg-[#0a0f14] hover:border-[#22d3a5]/50 hover:text-[#22d3a5] text-xs font-medium text-[#dce7f0] transition-colors duration-150 whitespace-nowrap shrink-0 max-w-[240px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3a5]"
              title={`Filter Radar by ${insight.suggestedQuery}`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Filter Radar: {insight.suggestedQuery}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadInsight(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2b36] bg-[#0a0f14] hover:border-[#22d3a5]/60 hover:text-[#22d3a5] text-xs font-medium text-[#dce7f0] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3a5]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#22d3a5]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Insight'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {insight ? (
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold text-[#dce7f0] tracking-tight leading-snug text-balance max-w-4xl">
            {insight.headline}
          </h2>
          <p className="text-[14px] text-[#9fb0be] leading-relaxed max-w-4xl">
            {insight.summary}
          </p>
        </div>
      ) : null}

      {/* Inline Error Alert (Preserves cached insight if refresh failed, or offers retry on cold failure) */}
      {errorMsg && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#0a0f14] border border-rose-500/40 text-xs text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => loadInsight(true)}
            className="px-2.5 py-1 rounded border border-rose-500/40 hover:bg-rose-500/10 text-rose-200 font-medium whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Grounded Web Sources from Google Search */}
      {insight?.sources && insight.sources.length > 0 && (
        <div className="pt-2.5 border-t border-[#1e2b36] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#7a8b99]">
          <span className="text-[#9fb0be] font-medium">Grounded Sources:</span>
          {insight.sources.map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1 text-[#dce7f0] hover:text-[#22d3a5] underline decoration-[#1e2b36] hover:decoration-[#22d3a5] underline-offset-4 transition-colors duration-150 max-w-[260px]"
              title={src.title}
            >
              <span className="truncate">{src.title}</span>
              <ArrowUpRight className="w-3 h-3 shrink-0 opacity-75" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
