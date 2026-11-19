import { CAREER_PROFILES, CareerPathProfile, generateSalaryTimeline, SectorSalaryDataPoint } from './marketAnalyticsEngine';
import { IntelBrief } from './radarEngine';

export interface CachedSalaryPayload {
  timestamp: string;
  profiles: Record<string, CareerPathProfile>;
  timeline: SectorSalaryDataPoint[];
  source: 'network' | 'cache_storage' | 'local_storage' | 'preseed';
}

export interface CachedNewsPayload {
  timestamp: string;
  company: string;
  sector: string;
  brief: IntelBrief & { sources?: Array<{ title: string; url: string }>; groundingProvider?: string };
  source: 'network' | 'cache_storage' | 'local_storage';
}

const STORAGE_KEY_SALARY = 'talentradar_cached_salary_v1';
const STORAGE_KEY_NEWS_INDEX = 'talentradar_cached_news_index_v1';
const CACHE_NAME = 'career-salary-cache-v1';

/**
 * Check if the browser currently has active internet connectivity
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Format a timestamp into a human-readable "Last refreshed" string
 */
export function formatRefreshedTime(isoString?: string | null): string {
  if (!isoString) return 'Not yet synced from network';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently refreshed';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently refreshed';
  }
}

/**
 * Store salary market data into both LocalStorage and CacheStorage (if available)
 */
export async function saveSalaryDataToCache(
  profiles: Record<string, CareerPathProfile>,
  timeline: SectorSalaryDataPoint[]
): Promise<CachedSalaryPayload> {
  const payload: CachedSalaryPayload = {
    timestamp: new Date().toISOString(),
    profiles,
    timeline,
    source: 'network',
  };

  try {
    localStorage.setItem(STORAGE_KEY_SALARY, JSON.stringify(payload));
  } catch (err) {
    console.warn('LocalStorage quota exceeded for salary cache:', err);
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-TalentRadar-Cached-At': payload.timestamp,
        },
      });
      await cache.put('/api/salary/market-analytics', response);
    } catch (err) {
      console.warn('CacheStorage write failed:', err);
    }
  }

  return payload;
}

/**
 * Retrieve cached salary data with fallback to actuarial baseline
 */
export function getCachedSalaryData(): CachedSalaryPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SALARY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profiles && parsed.timeline) {
        return {
          ...parsed,
          source: 'local_storage',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached salary data from LocalStorage:', err);
  }

  const timeline = generateSalaryTimeline('aiCompute');
  return {
    timestamp: new Date().toISOString(),
    profiles: CAREER_PROFILES,
    timeline,
    source: 'preseed',
  };
}

/**
 * Store a real company/sector news snippet brief into offline cache
 */
export async function saveNewsBriefToCache(
  company: string,
  sector: string,
  brief: CachedNewsPayload['brief']
): Promise<CachedNewsPayload> {
  const cacheKey = `news_${encodeURIComponent(company.trim().toLowerCase())}_${encodeURIComponent(sector.trim().toLowerCase())}`;
  const payload: CachedNewsPayload = {
    timestamp: new Date().toISOString(),
    company,
    sector,
    brief,
    source: 'network',
  };

  try {
    localStorage.setItem(`tr_${cacheKey}`, JSON.stringify(payload));

    const rawIndex = localStorage.getItem(STORAGE_KEY_NEWS_INDEX);
    const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    if (!index.includes(cacheKey)) {
      index.unshift(cacheKey);
      if (index.length > 30) index.pop();
      localStorage.setItem(STORAGE_KEY_NEWS_INDEX, JSON.stringify(index));
    }
  } catch (err) {
    console.warn('LocalStorage error while saving news brief:', err);
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open('news-snippets-cache-v1');
      const url = `/api/news?company=${encodeURIComponent(company)}&sector=${encodeURIComponent(sector)}`;
      const response = new Response(JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-TalentRadar-Cached-At': payload.timestamp,
        },
      });
      await cache.put(url, response);
    } catch (err) {
      console.warn('CacheStorage write failed for news snippet:', err);
    }
  }

  return payload;
}

/**
 * Retrieve a previously cached real network news brief for a company and sector.
 * Returns null if no real brief has been cached yet (no synthetic generation).
 */
export function getCachedNewsBrief(company: string, sector: string): CachedNewsPayload | null {
  const cacheKey = `news_${encodeURIComponent(company.trim().toLowerCase())}_${encodeURIComponent(sector.trim().toLowerCase())}`;
  try {
    const raw = localStorage.getItem(`tr_${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.brief && parsed.brief.summary) {
        return {
          ...parsed,
          source: 'local_storage',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached news brief:', err);
  }
  return null;
}

/**
 * Refresh and cache real market analytics and Google Search grounded sector news from backend endpoints.
 */
export async function seedAndRefreshAllMarketDataOffline(): Promise<{
  refreshedAt: string;
  cachedSalaryCount: number;
  cachedNewsCount: number;
}> {
  let salaryCount = 0;
  let newsCount = 0;

  if (isOnline()) {
    try {
      const salRes = await fetch('/api/salary/market-analytics');
      if (salRes.ok) {
        const salData = await salRes.json();
        if (salData?.profiles && salData?.timeline) {
          await saveSalaryDataToCache(salData.profiles, salData.timeline);
          salaryCount = Object.keys(salData.profiles).length;
        }
      }
    } catch (e) {
      console.warn('Salary analytics sync skipped:', e);
    }

    try {
      const newsRes = await fetch('/api/news/latest');
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const items = Array.isArray(newsData?.items) ? newsData.items : [];
        for (const item of items) {
          if (item?.company && item?.sector && item?.brief) {
            await saveNewsBriefToCache(item.company, item.sector, item.brief);
            newsCount++;
          }
        }
      }
    } catch (e) {
      console.warn('Live sector news sync skipped:', e);
    }
  }

  const refreshedAt = new Date().toISOString();
  try {
    if (salaryCount > 0 || newsCount > 0) {
      localStorage.setItem('talentradar_last_global_sync', refreshedAt);
    }
  } catch {
    // ignore storage errors
  }

  return {
    refreshedAt,
    cachedSalaryCount: salaryCount || Object.keys(CAREER_PROFILES).length,
    cachedNewsCount: newsCount,
  };
}

/**
 * Get comprehensive offline cache summary for UI indicators
 */
export function getOfflineCacheMetadata() {
  const isCurrentlyOnline = isOnline();
  let lastSalarySync: string | null = null;
  let lastNewsSync: string | null = null;
  let cachedNewsCount = 0;

  try {
    const rawSalary = localStorage.getItem(STORAGE_KEY_SALARY);
    if (rawSalary) {
      const parsed = JSON.parse(rawSalary);
      lastSalarySync = parsed.timestamp || null;
    }

    const rawIndex = localStorage.getItem(STORAGE_KEY_NEWS_INDEX);
    if (rawIndex) {
      const index = JSON.parse(rawIndex);
      cachedNewsCount = Array.isArray(index) ? index.length : 0;
    }

    lastNewsSync = localStorage.getItem('talentradar_last_global_sync') || lastSalarySync;
  } catch {
    // ignore storage read errors
  }

  return {
    isOnline: isCurrentlyOnline,
    isOffline: !isCurrentlyOnline,
    lastSalarySync,
    lastNewsSync,
    formattedSalarySync: formatRefreshedTime(lastSalarySync),
    formattedNewsSync: formatRefreshedTime(lastNewsSync),
    cachedNewsCount,
    cachedProfilesCount: Object.keys(CAREER_PROFILES).length,
  };
}
