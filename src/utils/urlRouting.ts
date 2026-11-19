import type { LegalTabType } from '../components/LegalComplianceModal';
import { getPublicShareBaseUrl } from './serverConfig';

export type AppTabId =
  | 'analytics'
  | 'finance'
  | 'growth'
  | 'radar'
  | 'stealthnet'
  | 'career'
  | 'news'
  | 'ai'
  | 'bookmarks'
  | 'comms'
  | 'studio';

export interface RouteMeta {
  path: string;
  title: string;
  tab?: AppTabId;
  legalTab?: LegalTabType;
  modal?: 'contact' | 'pricing' | 'billing' | 'referrals' | 'drive';
  referralCode?: string;
}

export const TAB_TO_PATH: Record<AppTabId, string> = {
  analytics: '/salary-analytics',
  finance: '/valuation',
  growth: '/growth',
  radar: '/radar',
  stealthnet: '/stealthnet',
  career: '/career-path',
  news: '/intel-feed',
  ai: '/ai-triad',
  bookmarks: '/saved',
  comms: '/deal-room',
  studio: '/studio',
};

export const TAB_TITLES: Record<AppTabId, string> = {
  analytics: 'Market Salary Analytics & Trends | TalentRadar.OS',
  finance: 'Compensation, Equity & Tax Platform | TalentRadar.OS',
  growth: 'Growth & Public Launch Hub | TalentRadar.OS',
  radar: '3D Geospatial Job Radar | TalentRadar.OS',
  stealthnet: 'StealthNet Anonymous Network | TalentRadar.OS',
  career: 'Career Trajectory & Skill Tree | TalentRadar.OS',
  news: 'Live Market Intel & News Feed | TalentRadar.OS',
  ai: '4-Agent Autonomous AI Triad | TalentRadar.OS',
  bookmarks: 'Saved Roles & Benchmarks | TalentRadar.OS',
  comms: 'Institutional Buyer Deal Room | TalentRadar.OS',
  studio: 'Walkthrough Studio & Explainer Model | TalentRadar.OS',
};

const PATH_TO_ROUTE: Record<string, RouteMeta> = {
  '/': { path: '/', title: 'TalentRadar.OS | 3D Career & Compensation Intelligence', tab: 'analytics' },
  '/salary-analytics': { path: '/salary-analytics', title: TAB_TITLES.analytics, tab: 'analytics' },
  '/analytics': { path: '/salary-analytics', title: TAB_TITLES.analytics, tab: 'analytics' },
  '/valuation': { path: '/valuation', title: TAB_TITLES.finance, tab: 'finance' },
  '/buyout': { path: '/valuation', title: TAB_TITLES.finance, tab: 'finance' },
  '/finance': { path: '/valuation', title: TAB_TITLES.finance, tab: 'finance' },
  '/growth': { path: '/growth', title: TAB_TITLES.growth, tab: 'growth' },
  '/radar': { path: '/radar', title: TAB_TITLES.radar, tab: 'radar' },
  '/stealthnet': { path: '/stealthnet', title: TAB_TITLES.stealthnet, tab: 'stealthnet' },
  '/career-path': { path: '/career-path', title: TAB_TITLES.career, tab: 'career' },
  '/career': { path: '/career-path', title: TAB_TITLES.career, tab: 'career' },
  '/intel-feed': { path: '/intel-feed', title: TAB_TITLES.news, tab: 'news' },
  '/news': { path: '/intel-feed', title: TAB_TITLES.news, tab: 'news' },
  '/ai-triad': { path: '/ai-triad', title: TAB_TITLES.ai, tab: 'ai' },
  '/ai': { path: '/ai-triad', title: TAB_TITLES.ai, tab: 'ai' },
  '/saved': { path: '/saved', title: TAB_TITLES.bookmarks, tab: 'bookmarks' },
  '/bookmarks': { path: '/saved', title: TAB_TITLES.bookmarks, tab: 'bookmarks' },
  '/deal-room': { path: '/deal-room', title: TAB_TITLES.comms, tab: 'comms' },
  '/comms': { path: '/deal-room', title: TAB_TITLES.comms, tab: 'comms' },
  '/studio': { path: '/studio', title: TAB_TITLES.studio, tab: 'studio' },
  '/privacy': { path: '/privacy', title: 'Privacy Policy | TalentRadar.OS', legalTab: 'privacy' },
  '/terms': { path: '/terms', title: 'Terms of Service | TalentRadar.OS', legalTab: 'terms' },
  '/security': { path: '/security', title: 'Security & Cryptography Standard | TalentRadar.OS', legalTab: 'security' },
  '/refunds': { path: '/refunds', title: 'Refund & Paystack Billing Policy | TalentRadar.OS', legalTab: 'refund' },
  '/contact': { path: '/contact', title: 'Contact Founder & Procurement | TalentRadar.OS', modal: 'contact' },
  '/pricing': { path: '/pricing', title: 'Subscription Plans & Pricing | TalentRadar.OS', modal: 'pricing' },
  '/billing': { path: '/billing', title: 'Paystack Billing Portal & Receipts | TalentRadar.OS', modal: 'billing' },
  '/referrals': { path: '/referrals', title: 'Referral Program — Earn 20% + Free Pro Months | TalentRadar.OS', modal: 'referrals' },
  '/refer': { path: '/referrals', title: 'Referral Program — Earn 20% + Free Pro Months | TalentRadar.OS', modal: 'referrals' },
  '/drive': { path: '/drive', title: 'Google Drive Dossier Vault | TalentRadar.OS', modal: 'drive' },
};

export function resolveRouteFromLocation(loc: { pathname: string; search: string }): RouteMeta {
  const rawPathname = (loc.pathname || '/').replace(/\/+$/, '') || '/';
  const normalizedPath = rawPathname.toLowerCase();
  const params = new URLSearchParams(loc.search || '');
  const queryRef = (params.get('ref') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  // Support clean vanity referral invite links: /r/<CODE>
  if (normalizedPath.startsWith('/r/')) {
    const rawCode = rawPathname.slice(3).split('/')[0] || '';
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    return {
      path: '/',
      title: '20% Referral Launch Invite | TalentRadar.OS',
      tab: 'analytics',
      modal: 'pricing',
      referralCode: cleanCode || undefined,
    };
  }

  // Support legacy query-param deep links (?tab=..., ?view=..., ?contact=true)
  const viewParam = params.get('view');
  if (viewParam === 'privacy' || viewParam === 'terms' || viewParam === 'security' || viewParam === 'refund') {
    const cleanPath = viewParam === 'refund' ? '/refunds' : `/${viewParam}`;
    const base = PATH_TO_ROUTE[cleanPath] || PATH_TO_ROUTE['/privacy'];
    return queryRef ? { ...base, referralCode: queryRef } : base;
  }

  if (params.get('contact') === 'true') {
    const base = PATH_TO_ROUTE['/contact'];
    return queryRef ? { ...base, referralCode: queryRef } : base;
  }

  const tabParam = params.get('tab') as AppTabId | null;
  if (tabParam && tabParam in TAB_TO_PATH) {
    return {
      path: TAB_TO_PATH[tabParam],
      title: TAB_TITLES[tabParam],
      tab: tabParam,
      ...(queryRef ? { referralCode: queryRef } : {}),
    };
  }

  if (PATH_TO_ROUTE[normalizedPath]) {
    const base = PATH_TO_ROUTE[normalizedPath];
    return queryRef ? { ...base, referralCode: queryRef } : base;
  }

  return queryRef ? { ...PATH_TO_ROUTE['/'], referralCode: queryRef } : PATH_TO_ROUTE['/'];
}

export const OWNER_ONLY_TABS: ReadonlySet<AppTabId> = new Set(['growth', 'comms', 'studio']);

export function isOwnerOnlyTab(tab?: string | null): boolean {
  return Boolean(tab && OWNER_ONLY_TABS.has(tab as AppTabId));
}

export function isOwnerOnlyLocation(loc: { pathname: string; search: string }): boolean {
  const normalizedPath = (loc.pathname || '/').replace(/\/+$/, '').toLowerCase() || '/';
  if (
    normalizedPath === '/buyout' ||
    normalizedPath === '/growth' ||
    normalizedPath === '/studio' ||
    normalizedPath === '/deal-room' ||
    normalizedPath === '/comms'
  ) {
    return true;
  }
  const params = new URLSearchParams(loc.search || '');
  const tabParam = (params.get('tab') || '').toLowerCase();
  return tabParam === 'growth' || tabParam === 'studio' || tabParam === 'comms' || tabParam === 'buyout';
}

export function syncSeoCanonicalMeta(cleanPath: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const publicBase = getPublicShareBaseUrl().replace(/\/+$/, '');
    const canonicalHref = `${publicBase}${normalizedPath === '/' ? '' : normalizedPath}`;

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.href = canonicalHref;
    }
    const ogUrlEl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlEl) {
      ogUrlEl.content = canonicalHref;
    }
  } catch {
    // Ignore DOM access issues
  }
}

export function pushCleanUrl(path: string, title?: string, preserveSearchParams = false): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const currentPath = window.location.pathname || '/';
    const suffix = preserveSearchParams ? window.location.search : '';
    const nextUrl = `${cleanPath}${suffix}`;

    if (currentPath !== cleanPath) {
      window.history.pushState({ path: cleanPath }, '', nextUrl);
    }
    if (title) {
      document.title = title;
    }

    syncSeoCanonicalMeta(cleanPath);
  } catch {
    // Ignore history restrictions in sandboxed environments
  }
}
