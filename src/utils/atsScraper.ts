import {
  type CommsMessage,
  type JobAlert,
  type JobSearchParams,
  searchJobs,
} from './radarEngine.ts';
import type { StealthPost, StealthSector, VerificationTier } from './stealthNetData.ts';

export type AtsProvider = 'ashby' | 'greenhouse' | 'lever';

export interface AtsBoardConfig {
  provider: AtsProvider;
  slug: string;
  companyName: string;
  sector: string;
  stealthSector: Exclude<StealthSector, 'All'>;
  verificationTier: VerificationTier;
  hqLocation: string;
  hqCoordinates: [number, number];
  boardUrl: string;
}

export interface AtsScraperMeta {
  isLive: boolean;
  scrapedAt: string;
  boardCount: number;
  boardsSucceeded: number;
  totalOpeningsAcrossBoards: number;
  returnedSignals: number;
  providers: AtsProvider[];
}

interface AtsCacheEntry {
  fetchedAtMs: number;
  scrapedAt: string;
  jobs: JobAlert[];
  boardsSucceeded: number;
  totalOpeningsAcrossBoards: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5500;
const PER_BOARD_LIMIT = 50;

// 14 Verified Public Unauthenticated ATS Job Boards (Ashby, Greenhouse, Lever)
export const VERIFIED_ATS_BOARDS: AtsBoardConfig[] = [
  // Ashby Boards
  {
    provider: 'ashby',
    slug: 'openai',
    companyName: 'OpenAI',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'San Francisco, CA',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://jobs.ashbyhq.com/openai',
  },
  {
    provider: 'ashby',
    slug: 'perplexity',
    companyName: 'Perplexity AI',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'San Francisco, CA',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://jobs.ashbyhq.com/perplexity',
  },
  {
    provider: 'ashby',
    slug: 'cohere',
    companyName: 'Cohere',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'Toronto, Canada',
    hqCoordinates: [43.6532, -79.3832],
    boardUrl: 'https://jobs.ashbyhq.com/cohere',
  },
  {
    provider: 'ashby',
    slug: 'elevenlabs',
    companyName: 'ElevenLabs',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'New York, NY / London, UK',
    hqCoordinates: [40.7128, -74.006],
    boardUrl: 'https://jobs.ashbyhq.com/elevenlabs',
  },
  {
    provider: 'ashby',
    slug: 'harvey',
    companyName: 'Harvey',
    sector: 'Enterprise AI & Legal Systems',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Series B Founder / VP',
    hqLocation: 'San Francisco, CA / New York, NY',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://jobs.ashbyhq.com/harvey',
  },
  {
    provider: 'ashby',
    slug: 'ramp',
    companyName: 'Ramp',
    sector: 'FinTech & Quantitative Infrastructure',
    stealthSector: 'Distributed Systems & Cloud',
    verificationTier: 'Verified Hyperscaler Systems',
    hqLocation: 'New York, NY',
    hqCoordinates: [40.7128, -74.006],
    boardUrl: 'https://jobs.ashbyhq.com/ramp',
  },
  {
    provider: 'ashby',
    slug: 'linear',
    companyName: 'Linear',
    sector: 'Developer Tools & Distributed Cloud',
    stealthSector: 'Distributed Systems & Cloud',
    verificationTier: 'Verified Principal Architect',
    hqLocation: 'San Francisco, CA / Remote',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://jobs.ashbyhq.com/linear',
  },
  // Greenhouse Boards
  {
    provider: 'greenhouse',
    slug: 'anthropic',
    companyName: 'Anthropic',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'San Francisco, CA',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://job-boards.greenhouse.io/anthropic',
  },
  {
    provider: 'greenhouse',
    slug: 'scaleai',
    companyName: 'Scale AI',
    sector: 'Frontier AI & Cloud Infrastructure',
    stealthSector: 'Frontier AI & GPU Systems',
    verificationTier: 'Verified Frontier AI (Tier-1)',
    hqLocation: 'San Francisco, CA',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://job-boards.greenhouse.io/scaleai',
  },
  {
    provider: 'greenhouse',
    slug: 'databricks',
    companyName: 'Databricks',
    sector: 'Distributed Systems & Cloud',
    stealthSector: 'Distributed Systems & Cloud',
    verificationTier: 'Verified Hyperscaler Systems',
    hqLocation: 'San Francisco, CA',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://job-boards.greenhouse.io/databricks',
  },
  {
    provider: 'greenhouse',
    slug: 'stripe',
    companyName: 'Stripe',
    sector: 'FinTech & Quantitative Infrastructure',
    stealthSector: 'Distributed Systems & Cloud',
    verificationTier: 'Verified Hyperscaler Systems',
    hqLocation: 'San Francisco, CA / Dublin',
    hqCoordinates: [37.7749, -122.4194],
    boardUrl: 'https://job-boards.greenhouse.io/stripe',
  },
  {
    provider: 'greenhouse',
    slug: 'andurilindustries',
    companyName: 'Anduril Industries',
    sector: 'Defense & Autonomous Robotics',
    stealthSector: 'Defense Tech & Dual-Use',
    verificationTier: 'Verified Defense Prime (Dual-Use)',
    hqLocation: 'Costa Mesa, CA / Washington, DC',
    hqCoordinates: [33.6411, -117.9187],
    boardUrl: 'https://job-boards.greenhouse.io/andurilindustries',
  },
  // Lever Boards
  {
    provider: 'lever',
    slug: 'palantir',
    companyName: 'Palantir Technologies',
    sector: 'Defense & Autonomous Robotics',
    stealthSector: 'Defense Tech & Dual-Use',
    verificationTier: 'Verified Defense Prime (Dual-Use)',
    hqLocation: 'Denver, CO / New York / London',
    hqCoordinates: [39.7392, -104.9903],
    boardUrl: 'https://jobs.lever.co/palantir',
  },
  {
    provider: 'lever',
    slug: 'spotify',
    companyName: 'Spotify',
    sector: 'Distributed Systems & Cloud',
    stealthSector: 'Distributed Systems & Cloud',
    verificationTier: 'Verified Hyperscaler Systems',
    hqLocation: 'Stockholm / New York / London',
    hqCoordinates: [59.3293, 18.0686],
    boardUrl: 'https://jobs.lever.co/spotify',
  },
];

let cachedSnapshot: AtsCacheEntry | null = null;
let inflightScrape: Promise<AtsCacheEntry> | null = null;

function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : ' ';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : ' ';
    });
}

function htmlToPlainText(raw: string): string {
  if (!raw) return '';
  const decoded = decodeHtmlEntities(raw);
  // Decode a second pass in case content was double-escaped (&amp;lt;p&gt;)
  const unescaped = decodeHtmlEntities(decoded);
  return unescaped
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const KNOWN_HUB_COORDS: Array<{ match: string; coords: [number, number] }> = [
  { match: 'san francisco', coords: [37.7749, -122.4194] },
  { match: 'bay area', coords: [37.7749, -122.4194] },
  { match: 'palo alto', coords: [37.4419, -122.143] },
  { match: 'mountain view', coords: [37.3861, -122.0839] },
  { match: 'new york', coords: [40.7128, -74.006] },
  { match: 'nyc', coords: [40.7128, -74.006] },
  { match: 'seattle', coords: [47.6062, -122.3321] },
  { match: 'bellevue', coords: [47.6101, -122.2015] },
  { match: 'costa mesa', coords: [33.6411, -117.9187] },
  { match: 'los angeles', coords: [34.0522, -118.2437] },
  { match: 'austin', coords: [30.2672, -97.7431] },
  { match: 'boston', coords: [42.3601, -71.0589] },
  { match: 'chicago', coords: [41.8781, -87.6298] },
  { match: 'denver', coords: [39.7392, -104.9903] },
  { match: 'washington', coords: [38.9072, -77.0369] },
  { match: 'reston', coords: [38.9586, -77.357] },
  { match: 'london', coords: [51.5074, -0.1278] },
  { match: 'dublin', coords: [53.3498, -6.2603] },
  { match: 'paris', coords: [48.8566, 2.3522] },
  { match: 'berlin', coords: [52.52, 13.405] },
  { match: 'zurich', coords: [47.3769, 8.5417] },
  { match: 'stockholm', coords: [59.3293, 18.0686] },
  { match: 'toronto', coords: [43.6532, -79.3832] },
  { match: 'tokyo', coords: [35.6762, 139.6503] },
  { match: 'singapore', coords: [1.3521, 103.8198] },
  { match: 'bengaluru', coords: [12.9716, 77.5946] },
  { match: 'sydney', coords: [-33.8688, 151.2093] },
  { match: 'tel aviv', coords: [32.0853, 34.7818] },
];

function resolveCoordinates(locationText: string, fallback: [number, number]): [number, number] {
  const lower = (locationText || '').toLowerCase();
  for (const hub of KNOWN_HUB_COORDS) {
    if (lower.includes(hub.match)) return hub.coords;
  }
  return fallback;
}

const TECH_SIGNALS: Array<{ token: RegExp; label: string }> = [
  { token: /\bpython\b/i, label: 'Python' },
  { token: /\brust\b/i, label: 'Rust' },
  { token: /\bc\+\+\b/i, label: 'C++' },
  { token: /\btypescript\b/i, label: 'TypeScript' },
  { token: /\bgolang\b|\bgo\b/i, label: 'Go' },
  { token: /\bcuda\b/i, label: 'CUDA' },
  { token: /\btriton\b/i, label: 'Triton' },
  { token: /\bpytorch\b/i, label: 'PyTorch' },
  { token: /\bkubernetes\b|\bk8s\b/i, label: 'Kubernetes' },
  { token: /\bdistributed systems\b/i, label: 'Distributed Systems' },
  { token: /\binference\b/i, label: 'Inference' },
  { token: /\bllm\b|\blarge language/i, label: 'LLM Systems' },
  { token: /\bsecurity\b|\bzero trust\b/i, label: 'Security' },
  { token: /\baws\b|\bgcp\b|\bcloud\b/i, label: 'Cloud Infra' },
  { token: /\breact\b/i, label: 'React' },
  { token: /\bpostgresql\b|\bsql\b/i, label: 'SQL' },
  { token: /\bkafka\b|\bspark\b/i, label: 'Data Pipelines' },
  { token: /\bterraform\b/i, label: 'Terraform' },
  { token: /\bros\b|\brobotics\b|\bautonom/i, label: 'Autonomous Systems' },
  { token: /\binfiniband\b|\bgpu\b|\bcluster/i, label: 'GPU Clusters' },
];

function extractSkills(title: string, department: string, plainText: string): string[] {
  const haystack = `${title} ${department} ${plainText.slice(0, 2200)}`;
  const found: string[] = [];
  for (const sig of TECH_SIGNALS) {
    if (sig.token.test(haystack) && !found.includes(sig.label)) {
      found.push(sig.label);
      if (found.length >= 6) break;
    }
  }
  if (found.length === 0 && department) {
    found.push(department);
  }
  if (found.length === 0) {
    found.push('Systems Engineering');
  }
  return found;
}

function formatUsdRange(minVal: number, maxVal: number, suffix = ''): string {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
  if (minVal > 0 && maxVal > minVal) {
    return `${fmt(minVal)} - ${fmt(maxVal)}${suffix}`;
  }
  const single = Math.max(minVal, maxVal);
  return single > 0 ? `${fmt(single)}${suffix}` : 'Compensation Not Disclosed on ATS';
}

function extractSalaryFromText(plainText: string): {
  min: number;
  max: number;
  label: string;
  disclosed: boolean;
} {
  if (!plainText) {
    return { min: 0, max: 0, label: 'Compensation Not Disclosed on ATS', disclosed: false };
  }

  // Match explicit USD annual salary ranges: "$180,000 - $260,000" or "$180k - $250k"
  const rangeRegex =
    /\$\s?(\d{2,3}(?:,\d{3})+|\d{3}k)\s*(?:-|–|—|to)\s*\$\s?(\d{2,3}(?:,\d{3})+|\d{3}k)/gi;
  const parseAmount = (raw: string): number => {
    const clean = raw.toLowerCase().replace(/,/g, '').trim();
    if (clean.endsWith('k')) return Number(clean.slice(0, -1)) * 1000;
    return Number(clean);
  };

  let bestMin = 0;
  let bestMax = 0;
  let match: RegExpExecArray | null;
  while ((match = rangeRegex.exec(plainText)) !== null) {
    const a = parseAmount(match[1]);
    const b = parseAmount(match[2]);
    if (a >= 50000 && b >= a && b <= 2000000) {
      if (b > bestMax) {
        bestMin = a;
        bestMax = b;
      }
    }
  }

  if (bestMax > 0) {
    return {
      min: bestMin,
      max: bestMax,
      label: formatUsdRange(bestMin, bestMax),
      disclosed: true,
    };
  }

  // Single figure e.g. "$240,000" near salary/compensation/base keywords
  const singleRegex = /(?:salary|compensation|base|pay|ote)[^.$\n]{0,60}\$\s?(\d{2,3}(?:,\d{3})+)/gi;
  const singleMatch = singleRegex.exec(plainText);
  if (singleMatch) {
    const amt = parseAmount(singleMatch[1]);
    if (amt >= 50000 && amt <= 2000000) {
      return {
        min: amt,
        max: amt,
        label: formatUsdRange(amt, amt),
        disclosed: true,
      };
    }
  }

  return { min: 0, max: 0, label: 'Compensation Not Disclosed on ATS', disclosed: false };
}

function formatPostedAgo(rawDate?: string | number): { label: string; epochMs: number } {
  if (!rawDate) return { label: 'Live ATS', epochMs: 0 };
  const epoch = typeof rawDate === 'number' ? rawDate : Date.parse(rawDate);
  if (!Number.isFinite(epoch) || epoch <= 0) return { label: 'Live ATS', epochMs: 0 };
  const diffMs = Math.max(0, Date.now() - epoch);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { label: `${Math.max(1, mins)}m ago`, epochMs: epoch };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `${hours}h ago`, epochMs: epoch };
  const days = Math.floor(hours / 24);
  if (days < 30) return { label: `${days}d ago`, epochMs: epoch };
  const months = Math.floor(days / 30);
  return { label: `${months}mo ago`, epochMs: epoch };
}

function inferUrgency(title: string, epochMs: number): JobAlert['urgency'] {
  const lower = title.toLowerCase();
  const ageDays = epochMs > 0 ? (Date.now() - epochMs) / 86400000 : 30;
  if (ageDays <= 3) return 'NEW SIGNAL';
  if (lower.includes('staff') || lower.includes('principal') || lower.includes('founding') || lower.includes('head')) {
    return 'HIGH PRIORITY';
  }
  if (lower.includes('director') || lower.includes('vp') || lower.includes('lead')) {
    return 'URGENT';
  }
  return 'DISCREET';
}

function inferSector(board: AtsBoardConfig, title: string, department: string): string {
  const text = `${title} ${department}`.toLowerCase();
  if (text.includes('robot') || text.includes('autonom') || text.includes('hardware') || text.includes('defense') || text.includes('embedded')) {
    return 'Defense & Autonomous Robotics';
  }
  if (text.includes('research') || text.includes('ai') || text.includes('ml') || text.includes('inference') || text.includes('model')) {
    return 'Frontier AI & Cloud Infrastructure';
  }
  if (text.includes('security') || text.includes('privacy') || text.includes('trust')) {
    return 'Cybersecurity & Zero-Trust Infra';
  }
  if (text.includes('payments') || text.includes('risk') || text.includes('treasury') || text.includes('fintech')) {
    return 'FinTech & Quantitative Infrastructure';
  }
  return board.sector;
}

function buildDescriptionSnippet(plainText: string, fallback: string): string {
  const clean = plainText.replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  return clean.length > 340 ? `${clean.slice(0, 337).trim()}...` : clean;
}

async function fetchAshbyBoard(board: AtsBoardConfig): Promise<{ jobs: JobAlert[]; totalOpenings: number }> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.slug)}?includeCompensation=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'TalentRadarOS/1.0' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ashby ${board.slug} HTTP ${res.status}`);
  const data: any = await res.json();
  const rawJobs: any[] = Array.isArray(data?.jobs) ? data.jobs : [];
  const totalOpenings = rawJobs.length;

  const sorted = [...rawJobs].sort((a, b) => {
    const ta = Date.parse(a?.publishedAt || '') || 0;
    const tb = Date.parse(b?.publishedAt || '') || 0;
    return tb - ta;
  });

  const normalized: JobAlert[] = sorted.slice(0, PER_BOARD_LIMIT).map((j, idx) => {
    const title = String(j?.title || 'Engineering Role').trim();
    const department = String(j?.department || j?.team || 'Engineering').trim();
    const locParts = [j?.location, j?.isRemote ? 'Remote' : ''].filter(Boolean);
    const location = locParts.join(' / ') || board.hqLocation;
    const plain = j?.descriptionPlain
      ? String(j.descriptionPlain)
      : htmlToPlainText(String(j?.descriptionHtml || ''));

    // Extract Ashby structured compensation first, fall back to plain text regex
    let minSal = 0;
    let maxSal = 0;
    let salaryLabel = 'Compensation Not Disclosed on ATS';
    let isCompDisclosed = false;

    const components: any[] = Array.isArray(j?.compensation?.summaryComponents)
      ? j.compensation.summaryComponents
      : [];
    const salaryComp =
      components.find((c) => String(c?.compensationType || '').toLowerCase() === 'salary') ||
      components[0];

    if (salaryComp && (Number(salaryComp.minValue) > 0 || Number(salaryComp.maxValue) > 0)) {
      minSal = Number(salaryComp.minValue) || Number(salaryComp.maxValue) || 0;
      maxSal = Number(salaryComp.maxValue) || minSal;
      const curr = String(salaryComp.currencyCode || 'USD').toUpperCase();
      salaryLabel =
        j?.compensation?.compensationTierSummary ||
        (curr === 'USD'
          ? formatUsdRange(minSal, maxSal)
          : `${curr} ${minSal.toLocaleString()} - ${maxSal.toLocaleString()}`);
      isCompDisclosed = true;
    } else if (j?.compensation?.compensationTierSummary) {
      const parsed = extractSalaryFromText(String(j.compensation.compensationTierSummary));
      minSal = parsed.min;
      maxSal = parsed.max;
      salaryLabel = String(j.compensation.compensationTierSummary).split('•')[0].trim() || parsed.label;
      isCompDisclosed = true;
    } else {
      const parsed = extractSalaryFromText(plain);
      minSal = parsed.min;
      maxSal = parsed.max;
      salaryLabel = parsed.label;
      isCompDisclosed = parsed.disclosed;
    }

    const posted = formatPostedAgo(j?.publishedAt);
    const rawId = String(j?.id || '').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    const empType = String(j?.employmentType || '').toLowerCase();

    return {
      id: `ASH-${board.slug.toUpperCase()}-${rawId || `${idx + 1}`}`,
      title,
      company: board.companyName,
      location,
      coordinates: resolveCoordinates(location, board.hqCoordinates),
      salaryRange: salaryLabel,
      numericMinSalary: minSal,
      numericMaxSalary: maxSal,
      sector: inferSector(board, title, department),
      type: empType.includes('contract') ? 'Contract' : 'Full-Time',
      urgency: inferUrgency(title, posted.epochMs),
      matchScore: isCompDisclosed ? 91 : 86,
      skills: extractSkills(title, department, plain),
      postedAgo: posted.label,
      headcountDelta: `${totalOpenings} Live Open Roles`,
      description: buildDescriptionSnippet(
        plain,
        `${title} in ${department} at ${board.companyName} (${location}).`
      ),
      applyUrl: String(j?.applyUrl || j?.jobUrl || board.boardUrl),
      sourceAts: 'ashby',
      sourceBoard: board.slug,
      department,
      isCompDisclosed,
    };
  });

  return { jobs: normalized, totalOpenings };
}

async function fetchGreenhouseBoard(board: AtsBoardConfig): Promise<{ jobs: JobAlert[]; totalOpenings: number }> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'TalentRadarOS/1.0' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Greenhouse ${board.slug} HTTP ${res.status}`);
  const data: any = await res.json();
  const rawJobs: any[] = Array.isArray(data?.jobs) ? data.jobs : [];
  const totalOpenings = rawJobs.length;

  const sorted = [...rawJobs].sort((a, b) => {
    const ta = Date.parse(a?.updated_at || a?.first_published || '') || 0;
    const tb = Date.parse(b?.updated_at || b?.first_published || '') || 0;
    return tb - ta;
  });

  const normalized: JobAlert[] = sorted.slice(0, PER_BOARD_LIMIT).map((j, idx) => {
    const title = String(j?.title || 'Engineering Role').trim();
    const department = String(j?.departments?.[0]?.name || 'Engineering').trim();
    const location = String(j?.location?.name || board.hqLocation).trim();
    const plain = htmlToPlainText(String(j?.content || ''));
    const salary = extractSalaryFromText(plain);
    const posted = formatPostedAgo(j?.updated_at || j?.first_published);
    const rawId = String(j?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');

    return {
      id: `GH-${board.slug.toUpperCase()}-${rawId || `${idx + 1}`}`,
      title,
      company: String(j?.company_name || board.companyName).trim(),
      location,
      coordinates: resolveCoordinates(location, board.hqCoordinates),
      salaryRange: salary.label,
      numericMinSalary: salary.min,
      numericMaxSalary: salary.max,
      sector: inferSector(board, title, department),
      type: 'Full-Time',
      urgency: inferUrgency(title, posted.epochMs),
      matchScore: salary.disclosed ? 90 : 85,
      skills: extractSkills(title, department, plain),
      postedAgo: posted.label,
      headcountDelta: `${totalOpenings} Live Open Roles`,
      description: buildDescriptionSnippet(
        plain,
        `${title} in ${department} at ${board.companyName} (${location}).`
      ),
      applyUrl: String(j?.absolute_url || board.boardUrl),
      sourceAts: 'greenhouse',
      sourceBoard: board.slug,
      department,
      isCompDisclosed: salary.disclosed,
    };
  });

  return { jobs: normalized, totalOpenings };
}

async function fetchLeverBoard(board: AtsBoardConfig): Promise<{ jobs: JobAlert[]; totalOpenings: number }> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'TalentRadarOS/1.0' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Lever ${board.slug} HTTP ${res.status}`);
  const rawJobs: any[] = await res.json();
  if (!Array.isArray(rawJobs)) throw new Error(`Lever ${board.slug} invalid response`);
  const totalOpenings = rawJobs.length;

  const sorted = [...rawJobs].sort((a, b) => (Number(b?.createdAt) || 0) - (Number(a?.createdAt) || 0));

  const normalized: JobAlert[] = sorted.slice(0, PER_BOARD_LIMIT).map((j, idx) => {
    const title = String(j?.text || 'Engineering Role').trim();
    const department = String(j?.categories?.team || j?.categories?.department || 'Engineering').trim();
    const baseLocation = String(j?.categories?.location || board.hqLocation).trim();
    const workplace = String(j?.workplaceType || '').trim();
    const location =
      workplace && workplace.toLowerCase() === 'remote' && !baseLocation.toLowerCase().includes('remote')
        ? `${baseLocation} / Remote`
        : baseLocation;
    const listText = Array.isArray(j?.lists)
      ? j.lists.map((l: any) => `${l?.text || ''}: ${htmlToPlainText(String(l?.content || ''))}`).join(' ')
      : '';
    const plain = `${String(j?.descriptionPlain || '')} ${listText} ${String(j?.additionalPlain || '')}`.trim();

    let minSal = 0;
    let maxSal = 0;
    let salaryLabel = 'Compensation Not Disclosed on ATS';
    let isCompDisclosed = false;

    if (j?.salaryRange && (Number(j.salaryRange.min) > 0 || Number(j.salaryRange.max) > 0)) {
      minSal = Number(j.salaryRange.min) || Number(j.salaryRange.max) || 0;
      maxSal = Number(j.salaryRange.max) || minSal;
      const curr = String(j.salaryRange.currency || 'USD').toUpperCase();
      salaryLabel =
        curr === 'USD'
          ? formatUsdRange(minSal, maxSal)
          : `${curr} ${minSal.toLocaleString()} - ${maxSal.toLocaleString()}`;
      isCompDisclosed = true;
    } else {
      const parsed = extractSalaryFromText(plain);
      minSal = parsed.min;
      maxSal = parsed.max;
      salaryLabel = parsed.label;
      isCompDisclosed = parsed.disclosed;
    }

    const posted = formatPostedAgo(Number(j?.createdAt));
    const commitment = String(j?.categories?.commitment || '').toLowerCase();
    const rawId = String(j?.id || '').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();

    return {
      id: `LEV-${board.slug.toUpperCase()}-${rawId || `${idx + 1}`}`,
      title,
      company: board.companyName,
      location,
      coordinates: resolveCoordinates(location, board.hqCoordinates),
      salaryRange: salaryLabel,
      numericMinSalary: minSal,
      numericMaxSalary: maxSal,
      sector: inferSector(board, title, department),
      type: commitment.includes('contract') ? 'Contract' : 'Full-Time',
      urgency: inferUrgency(title, posted.epochMs),
      matchScore: isCompDisclosed ? 90 : 85,
      skills: extractSkills(title, department, plain),
      postedAgo: posted.label,
      headcountDelta: `${totalOpenings} Live Open Roles`,
      description: buildDescriptionSnippet(
        plain,
        `${title} in ${department} at ${board.companyName} (${location}).`
      ),
      applyUrl: String(j?.applyUrl || j?.hostedUrl || board.boardUrl),
      sourceAts: 'lever',
      sourceBoard: board.slug,
      department,
      isCompDisclosed,
    };
  });

  return { jobs: normalized, totalOpenings };
}

async function fetchBoard(board: AtsBoardConfig): Promise<{ jobs: JobAlert[]; totalOpenings: number }> {
  if (board.provider === 'ashby') return fetchAshbyBoard(board);
  if (board.provider === 'greenhouse') return fetchGreenhouseBoard(board);
  return fetchLeverBoard(board);
}

async function scrapeAllBoards(forceRefresh = false): Promise<AtsCacheEntry> {
  if (!forceRefresh && cachedSnapshot && Date.now() - cachedSnapshot.fetchedAtMs < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  if (!forceRefresh && inflightScrape) {
    return inflightScrape;
  }

  const runScrape = async (): Promise<AtsCacheEntry> => {
    const results = await Promise.allSettled(VERIFIED_ATS_BOARDS.map((b) => fetchBoard(b)));
    const perBoardJobs: JobAlert[][] = [];
    let boardsSucceeded = 0;
    let totalOpeningsAcrossBoards = 0;

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.jobs.length > 0) {
        boardsSucceeded += 1;
        totalOpeningsAcrossBoards += result.value.totalOpenings;
        perBoardJobs.push(result.value.jobs);
      } else if (result.status === 'rejected') {
        console.warn(`[ATS Scraper] ${VERIFIED_ATS_BOARDS[idx].provider}:${VERIFIED_ATS_BOARDS[idx].slug} skipped:`, result.reason?.message || result.reason);
      }
    });

    if (boardsSucceeded === 0) {
      if (cachedSnapshot) {
        return cachedSnapshot;
      }
      return {
        fetchedAtMs: Date.now(),
        scrapedAt: new Date().toISOString(),
        jobs: [],
        boardsSucceeded: 0,
        totalOpeningsAcrossBoards: 0,
      };
    }

    // Interleave jobs across boards round-robin and enforce strictly unique IDs
    const interleaved: JobAlert[] = [];
    const seenIds = new Set<string>();
    const maxLen = Math.max(...perBoardJobs.map((list) => list.length));
    for (let i = 0; i < maxLen; i += 1) {
      for (const boardList of perBoardJobs) {
        const candidate = boardList[i];
        if (!candidate) continue;
        let uniqueId = candidate.id;
        let suffix = 2;
        while (seenIds.has(uniqueId)) {
          uniqueId = `${candidate.id}-${suffix}`;
          suffix += 1;
        }
        seenIds.add(uniqueId);
        interleaved.push(uniqueId === candidate.id ? candidate : { ...candidate, id: uniqueId });
      }
    }

    const snapshot: AtsCacheEntry = {
      fetchedAtMs: Date.now(),
      scrapedAt: new Date().toISOString(),
      jobs: interleaved,
      boardsSucceeded,
      totalOpeningsAcrossBoards,
    };

    cachedSnapshot = snapshot;
    return snapshot;
  };

  inflightScrape = runScrape().finally(() => {
    inflightScrape = null;
  });

  return inflightScrape;
}

export async function getLiveAtsJobs(forceRefresh = false): Promise<{
  jobs: JobAlert[];
  meta: AtsScraperMeta;
}> {
  const snap = await scrapeAllBoards(forceRefresh);
  return {
    jobs: snap.jobs,
    meta: {
      isLive: snap.boardsSucceeded > 0,
      scrapedAt: snap.scrapedAt,
      boardCount: VERIFIED_ATS_BOARDS.length,
      boardsSucceeded: snap.boardsSucceeded,
      totalOpeningsAcrossBoards: snap.totalOpeningsAcrossBoards,
      returnedSignals: snap.jobs.length,
      providers: ['ashby', 'greenhouse', 'lever'],
    },
  };
}

export async function searchLiveAtsJobs(
  params: JobSearchParams,
  forceRefresh = false
): Promise<ReturnType<typeof searchJobs> & { meta: AtsScraperMeta }> {
  const { jobs: sourceJobs, meta } = await getLiveAtsJobs(forceRefresh);
  const result = searchJobs(params, sourceJobs);
  return {
    ...result,
    meta: {
      ...meta,
      returnedSignals: result.jobs.length,
    },
  };
}

export async function getLiveAtsStealthProfiles(forceRefresh = false): Promise<{
  posts: StealthPost[];
  meta: AtsScraperMeta;
}> {
  const { jobs, meta } = await getLiveAtsJobs(forceRefresh);
  const posts: StealthPost[] = [];

  if (!meta.isLive) {
    return { posts: [], meta };
  }

  for (const board of VERIFIED_ATS_BOARDS) {
    const boardJobs = jobs.filter((j) => j.sourceBoard === board.slug);
    if (boardJobs.length === 0) continue;

    const compDisclosed = boardJobs.filter((j) => j.isCompDisclosed && j.numericMaxSalary > 0);
    const minBand =
      compDisclosed.length > 0
        ? Math.min(...compDisclosed.map((j) => j.numericMinSalary || j.numericMaxSalary))
        : 0;
    const maxBand =
      compDisclosed.length > 0 ? Math.max(...compDisclosed.map((j) => j.numericMaxSalary)) : 0;

    const topSkills = Array.from(new Set(boardJobs.flatMap((j) => j.skills))).slice(0, 6);
    const topLocations = Array.from(new Set(boardJobs.map((j) => j.location))).slice(0, 3);
    const sampleRoles = boardJobs.slice(0, 4).map((j) => `• ${j.title} (${j.location})`);

    const compSummary =
      maxBand > 0
        ? formatUsdRange(minBand, maxBand, ' (Disclosed ATS Bands)')
        : 'Compensation Not Disclosed on ATS';

    const providerLabel = board.provider.charAt(0).toUpperCase() + board.provider.slice(1);
    const featuredJob = compDisclosed[0] || boardJobs[0];

    posts.push({
      id: `ats-org-${board.provider}-${board.slug}`,
      category: compDisclosed.length > 0 ? 'comp_intel' : 'unlisted_drop',
      sector: board.stealthSector,
      authorHandle: `${board.companyName} // ${providerLabel} ATS`,
      authorBadge: `${board.companyName} Verified Board (${boardJobs[0].headcountDelta})`,
      authorTier: board.verificationTier,
      zkVerified: true,
      title: `${board.companyName}: ${boardJobs[0].headcountDelta} — Live ${providerLabel} Organization & Comp Telemetry`,
      content: `Live public ${providerLabel} ATS scrape verified ${boardJobs[0].headcountDelta} active at ${board.companyName} across ${topLocations.join(', ')}.\n\nRepresentative active requisitions observed right now:\n${sampleRoles.join('\n')}`,
      compensationTag: compSummary,
      locationTag: topLocations[0] || board.hqLocation,
      tags: [providerLabel, board.companyName, ...topSkills].slice(0, 6),
      upvotes: Math.max(12, Math.min(98, boardJobs.length * 3)),
      downvotes: 0,
      peerVouches: Math.max(4, compDisclosed.length),
      comments: [],
      timestamp: boardJobs[0].postedAgo || 'Live ATS',
      isUrgent: boardJobs.some((j) => j.urgency === 'NEW SIGNAL'),
      canDirectPing: true,
      contactActionLabel: 'Log Backchannel Note',
      isLiveAts: true,
      sourceAts: board.provider,
      externalUrl: featuredJob?.applyUrl || board.boardUrl,
      companyName: board.companyName,
    });
  }

  return { posts, meta };
}

export async function getLiveAtsCommsMessages(forceRefresh = false): Promise<{
  messages: CommsMessage[];
  meta: AtsScraperMeta;
}> {
  const { jobs, meta } = await getLiveAtsJobs(forceRefresh);
  if (!meta.isLive) {
    return { messages: [], meta };
  }

  // Prioritize senior/staff/principal/director/head/talent roles with disclosed comp or recent timestamps
  const priorityPattern = /\b(staff|principal|director|head|vp|lead|partner|recruiter|talent|founding|distinguished|architect)\b/i;

  const prioritized = jobs.filter(
    (j) => priorityPattern.test(j.title) || j.isCompDisclosed
  );
  const pool = (prioritized.length >= 12 ? prioritized : jobs).slice(0, 28);

  const messages: CommsMessage[] = pool.map((job, idx) => {
    const providerLabel = (job.sourceAts || 'ashby').toUpperCase();
    const isTalentRole = /\b(recruiter|talent|search|sourcer)\b/i.test(job.title);
    const channel: CommsMessage['channel'] = isTalentRole
      ? 'Talent Partner'
      : /\b(director|vp|head|principal)\b/i.test(job.title)
      ? 'Executive Search'
      : 'Direct Headhunter';

    const urgency: CommsMessage['urgency'] =
      job.urgency === 'URGENT' || job.urgency === 'NEW SIGNAL'
        ? 'Immediate'
        : job.urgency === 'HIGH PRIORITY'
        ? 'Active'
        : 'Discreet';

    const dept = job.department || 'Engineering';
    const atsSource = job.sourceAts === 'greenhouse' || job.sourceAts === 'lever' ? job.sourceAts : 'ashby';

    return {
      id: `ATS-${providerLabel.slice(0, 3)}-${String(idx + 1).padStart(3, '0')}`,
      sender: `${job.company} Talent Acquisition`,
      senderTitle: `${dept} Recruiting Desk (${providerLabel} ATS)`,
      company: job.company,
      avatarSeed: job.company.slice(0, 2).toUpperCase(),
      channel,
      urgency,
      timestamp: job.postedAgo || 'Live ATS',
      subject: `[Live ${providerLabel}] ${job.title} — ${job.location}`,
      preview: `${job.salaryRange} • Skills: ${job.skills.slice(0, 3).join(', ')} • ${job.description.slice(0, 110)}`,
      fullMessage: `LIVE EXTERNAL ATS REQUISITION (${providerLabel})\nOrganization: ${job.company}\nDepartment / Team: ${dept}\nLocation: ${job.location}\nPosted Compensation: ${job.salaryRange}\nBoard Velocity: ${job.headcountDelta}\n\nRole Summary:\n${job.description}\n\nIdentified Stack Signals: ${job.skills.join(', ')}\nDirect Application Portal: ${job.applyUrl || ''}`,
      proposedComp: job.salaryRange,
      targetRole: job.title,
      status: idx < 4 ? 'Unread' : 'Negotiating',
      externalUrl: job.applyUrl,
      sourceAts: atsSource,
      location: job.location,
      department: dept,
    };
  });

  return { messages, meta };
}
