/**
 * Purchasing Power Parity (PPP) Region-Aware Subscription Pricing Engine
 *
 * Shared between client contexts (SubscriptionContext, PaywallModal, PaystackSubscriptionService)
 * and server billing/verification routes (server.ts) so displayed prices, Paystack charges,
 * and backend threshold verification stay deterministically synchronized.
 */

export type PaystackTierId =
  | 'pro_monthly'
  | 'pro_annual'
  | 'agency_monthly'
  | 'agency_annual'
  | 'buyout_deposit';

export type PppBandId =
  | 'global_baseline'
  | 'developed_adjusted'
  | 'emerging_eu_latam'
  | 'growth_markets'
  | 'emerging_africa_asia';

export interface PppBandDefinition {
  id: PppBandId;
  label: string;
  discountPercent: number;
  multiplier: number;
  description: string;
}

export interface PppCountryRule {
  countryCode: string;
  countryName: string;
  regionName: string;
  bandId: PppBandId;
  localCurrencyHint: string;
}

export interface PppLocationProfile {
  countryCode: string;
  countryName: string;
  regionName: string;
  bandId: PppBandId;
  bandLabel: string;
  discountPercent: number;
  multiplier: number;
  localCurrencyHint: string;
  isEligibleForPpp: boolean;
  detectionSource: 'server_header' | 'timezone' | 'locale' | 'manual_override' | 'default';
}

export interface ComputedTierPricing {
  tierId: PaystackTierId;
  baseUsd: number;
  afterPppUsd: number;
  finalUsd: number;
  monthlyEquivalentUsd: number;
  savingsUsd: number;
  pppDiscountPercent: number;
  referralDiscountPercent: number;
  effectiveDiscountPercent: number;
  pppApplied: boolean;
  pppCountryCode: string;
  pppBandLabel: string;
}

export const TIER_BASE_PRICES_USD: Record<
  PaystackTierId,
  { label: string; usd: number; intervalMonths: number; pppEligible: boolean }
> = {
  pro_monthly: { label: 'Pro Operator (Monthly)', usd: 49, intervalMonths: 1, pppEligible: true },
  pro_annual: { label: 'Pro Operator (Annual)', usd: 384, intervalMonths: 12, pppEligible: true },
  agency_monthly: { label: 'Sovereign / Agency (Monthly)', usd: 199, intervalMonths: 1, pppEligible: true },
  agency_annual: { label: 'Sovereign / Agency (Annual)', usd: 1788, intervalMonths: 12, pppEligible: true },
  buyout_deposit: { label: 'Asset Buyout Deposit (10%)', usd: 14500, intervalMonths: 1, pppEligible: false },
};

export const PPP_BANDS: Record<PppBandId, PppBandDefinition> = {
  global_baseline: {
    id: 'global_baseline',
    label: 'Global Tier 1 Standard',
    discountPercent: 0,
    multiplier: 1.0,
    description: 'Standard global USD/EUR/GBP pricing for Tier-1 high-income markets.',
  },
  developed_adjusted: {
    id: 'developed_adjusted',
    label: 'Southern Europe & Regional Hub PPP (-15%)',
    discountPercent: 15,
    multiplier: 0.85,
    description: 'Calibrated for Southern European & regional engineering markets.',
  },
  emerging_eu_latam: {
    id: 'emerging_eu_latam',
    label: 'Central / Eastern EU & Growth Hubs PPP (-30%)',
    discountPercent: 30,
    multiplier: 0.7,
    description: 'Adjusted for CEE, Baltic, and upper-middle-income remote engineering hubs.',
  },
  growth_markets: {
    id: 'growth_markets',
    label: 'LATAM / MENA / Southern Africa PPP (-45%)',
    discountPercent: 45,
    multiplier: 0.55,
    description: 'Purchasing-power parity parity rate for LATAM, MENA, and South Africa.',
  },
  emerging_africa_asia: {
    id: 'emerging_africa_asia',
    label: 'Africa & South Asia Emerging PPP (-55%)',
    discountPercent: 55,
    multiplier: 0.45,
    description: 'Local parity discount enabling global engineers across East/West Africa & South Asia.',
  },
};

export const PPP_COUNTRY_RULES: Record<string, PppCountryRule> = {
  // Tier 1 / Global Baseline (0%)
  US: { countryCode: 'US', countryName: 'United States', regionName: 'North America', bandId: 'global_baseline', localCurrencyHint: 'USD' },
  CA: { countryCode: 'CA', countryName: 'Canada', regionName: 'North America', bandId: 'global_baseline', localCurrencyHint: 'CAD' },
  GB: { countryCode: 'GB', countryName: 'United Kingdom', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'GBP' },
  DE: { countryCode: 'DE', countryName: 'Germany', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  FR: { countryCode: 'FR', countryName: 'France', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  CH: { countryCode: 'CH', countryName: 'Switzerland', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'CHF' },
  NL: { countryCode: 'NL', countryName: 'Netherlands', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  SE: { countryCode: 'SE', countryName: 'Sweden', regionName: 'Northern Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  NO: { countryCode: 'NO', countryName: 'Norway', regionName: 'Northern Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  DK: { countryCode: 'DK', countryName: 'Denmark', regionName: 'Northern Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  FI: { countryCode: 'FI', countryName: 'Finland', regionName: 'Northern Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  IE: { countryCode: 'IE', countryName: 'Ireland', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  BE: { countryCode: 'BE', countryName: 'Belgium', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  AT: { countryCode: 'AT', countryName: 'Austria', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  LU: { countryCode: 'LU', countryName: 'Luxembourg', regionName: 'Western Europe', bandId: 'global_baseline', localCurrencyHint: 'EUR' },
  AU: { countryCode: 'AU', countryName: 'Australia', regionName: 'Oceania', bandId: 'global_baseline', localCurrencyHint: 'AUD' },
  NZ: { countryCode: 'NZ', countryName: 'New Zealand', regionName: 'Oceania', bandId: 'global_baseline', localCurrencyHint: 'USD' },
  SG: { countryCode: 'SG', countryName: 'Singapore', regionName: 'APAC', bandId: 'global_baseline', localCurrencyHint: 'SGD' },
  AE: { countryCode: 'AE', countryName: 'United Arab Emirates', regionName: 'MENA', bandId: 'global_baseline', localCurrencyHint: 'USD' },
  JP: { countryCode: 'JP', countryName: 'Japan', regionName: 'APAC', bandId: 'global_baseline', localCurrencyHint: 'JPY' },
  KR: { countryCode: 'KR', countryName: 'South Korea', regionName: 'APAC', bandId: 'global_baseline', localCurrencyHint: 'USD' },
  IL: { countryCode: 'IL', countryName: 'Israel', regionName: 'MENA', bandId: 'global_baseline', localCurrencyHint: 'USD' },

  // Southern Europe & Developed Adjusted (-15%)
  ES: { countryCode: 'ES', countryName: 'Spain', regionName: 'Southern Europe', bandId: 'developed_adjusted', localCurrencyHint: 'EUR' },
  IT: { countryCode: 'IT', countryName: 'Italy', regionName: 'Southern Europe', bandId: 'developed_adjusted', localCurrencyHint: 'EUR' },
  PT: { countryCode: 'PT', countryName: 'Portugal', regionName: 'Southern Europe', bandId: 'developed_adjusted', localCurrencyHint: 'EUR' },
  GR: { countryCode: 'GR', countryName: 'Greece', regionName: 'Southern Europe', bandId: 'developed_adjusted', localCurrencyHint: 'EUR' },
  CY: { countryCode: 'CY', countryName: 'Cyprus', regionName: 'Southern Europe', bandId: 'developed_adjusted', localCurrencyHint: 'EUR' },
  SA: { countryCode: 'SA', countryName: 'Saudi Arabia', regionName: 'MENA', bandId: 'developed_adjusted', localCurrencyHint: 'USD' },

  // Central & Eastern Europe + Upper-Mid Growth (-30%)
  PL: { countryCode: 'PL', countryName: 'Poland', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  RO: { countryCode: 'RO', countryName: 'Romania', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  CZ: { countryCode: 'CZ', countryName: 'Czechia', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  HU: { countryCode: 'HU', countryName: 'Hungary', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  BG: { countryCode: 'BG', countryName: 'Bulgaria', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  HR: { countryCode: 'HR', countryName: 'Croatia', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  SK: { countryCode: 'SK', countryName: 'Slovakia', regionName: 'Central & Eastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  EE: { countryCode: 'EE', countryName: 'Estonia', regionName: 'Baltics / Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  LV: { countryCode: 'LV', countryName: 'Latvia', regionName: 'Baltics / Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  LT: { countryCode: 'LT', countryName: 'Lithuania', regionName: 'Baltics / Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  RS: { countryCode: 'RS', countryName: 'Serbia', regionName: 'Southeastern Europe', bandId: 'emerging_eu_latam', localCurrencyHint: 'EUR' },
  CL: { countryCode: 'CL', countryName: 'Chile', regionName: 'LATAM', bandId: 'emerging_eu_latam', localCurrencyHint: 'USD' },
  MY: { countryCode: 'MY', countryName: 'Malaysia', regionName: 'Southeast Asia', bandId: 'emerging_eu_latam', localCurrencyHint: 'USD' },
  TR: { countryCode: 'TR', countryName: 'Turkey', regionName: 'Eurasia', bandId: 'emerging_eu_latam', localCurrencyHint: 'USD' },

  // Growth Markets (-45%)
  ZA: { countryCode: 'ZA', countryName: 'South Africa', regionName: 'Southern Africa', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  BR: { countryCode: 'BR', countryName: 'Brazil', regionName: 'LATAM', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  MX: { countryCode: 'MX', countryName: 'Mexico', regionName: 'LATAM', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  CO: { countryCode: 'CO', countryName: 'Colombia', regionName: 'LATAM', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  AR: { countryCode: 'AR', countryName: 'Argentina', regionName: 'LATAM', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  EG: { countryCode: 'EG', countryName: 'Egypt', regionName: 'North Africa', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  MA: { countryCode: 'MA', countryName: 'Morocco', regionName: 'North Africa', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  ID: { countryCode: 'ID', countryName: 'Indonesia', regionName: 'Southeast Asia', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  PH: { countryCode: 'PH', countryName: 'Philippines', regionName: 'Southeast Asia', bandId: 'growth_markets', localCurrencyHint: 'USD' },
  VN: { countryCode: 'VN', countryName: 'Vietnam', regionName: 'Southeast Asia', bandId: 'growth_markets', localCurrencyHint: 'USD' },

  // Emerging Africa & South Asia (-55%)
  KE: { countryCode: 'KE', countryName: 'Kenya', regionName: 'East Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'KES' },
  NG: { countryCode: 'NG', countryName: 'Nigeria', regionName: 'West Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  GH: { countryCode: 'GH', countryName: 'Ghana', regionName: 'West Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  RW: { countryCode: 'RW', countryName: 'Rwanda', regionName: 'East Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'KES' },
  UG: { countryCode: 'UG', countryName: 'Uganda', regionName: 'East Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'KES' },
  TZ: { countryCode: 'TZ', countryName: 'Tanzania', regionName: 'East Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'KES' },
  ET: { countryCode: 'ET', countryName: 'Ethiopia', regionName: 'East Africa', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  IN: { countryCode: 'IN', countryName: 'India', regionName: 'South Asia', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  PK: { countryCode: 'PK', countryName: 'Pakistan', regionName: 'South Asia', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  BD: { countryCode: 'BD', countryName: 'Bangladesh', regionName: 'South Asia', bandId: 'emerging_africa_asia', localCurrencyHint: 'USD' },
  UA: { countryCode: 'UA', countryName: 'Ukraine', regionName: 'Eastern Europe', bandId: 'emerging_africa_asia', localCurrencyHint: 'EUR' },
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Africa/Nairobi': 'KE',
  'Africa/Lagos': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Kigali': 'RW',
  'Africa/Kampala': 'UG',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Zurich': 'CH',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Dublin': 'IE',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Warsaw': 'PL',
  'Europe/Bucharest': 'RO',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR',
  'Europe/Tallinn': 'EE',
  'Europe/Vilnius': 'LT',
  'Europe/Riga': 'LV',
  'Europe/Belgrade': 'RS',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Istanbul': 'TR',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Singapore': 'SG',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Kuala_Lumpur': 'MY',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'America/Bogota': 'CO',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
};

export function normalizeCountryCode(raw?: string | null): string {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);
}

export function getPppProfileForCountry(
  rawCountryCode?: string | null,
  detectionSource: PppLocationProfile['detectionSource'] = 'default'
): PppLocationProfile {
  const code = normalizeCountryCode(rawCountryCode) || 'US';
  const rule = PPP_COUNTRY_RULES[code];

  if (!rule) {
    const band = PPP_BANDS.global_baseline;
    return {
      countryCode: code,
      countryName: code,
      regionName: 'International',
      bandId: band.id,
      bandLabel: band.label,
      discountPercent: band.discountPercent,
      multiplier: band.multiplier,
      localCurrencyHint: 'USD',
      isEligibleForPpp: false,
      detectionSource,
    };
  }

  const band = PPP_BANDS[rule.bandId];
  return {
    countryCode: rule.countryCode,
    countryName: rule.countryName,
    regionName: rule.regionName,
    bandId: band.id,
    bandLabel: band.label,
    discountPercent: band.discountPercent,
    multiplier: band.multiplier,
    localCurrencyHint: rule.localCurrencyHint,
    isEligibleForPpp: band.discountPercent > 0,
    detectionSource,
  };
}

export function detectBrowserPppLocation(): PppLocationProfile {
  if (typeof window === 'undefined') {
    return getPppProfileForCountry('US', 'default');
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return getPppProfileForCountry(TIMEZONE_TO_COUNTRY[tz], 'timezone');
    }
  } catch {
    // Ignore Intl errors
  }

  try {
    const lang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
    const parts = lang.split(/[-_]/);
    if (parts.length >= 2) {
      const regionCode = normalizeCountryCode(parts[1]);
      if (regionCode && PPP_COUNTRY_RULES[regionCode]) {
        return getPppProfileForCountry(regionCode, 'locale');
      }
    }
  } catch {
    // Ignore navigator locale errors
  }

  return getPppProfileForCountry('US', 'default');
}

export function detectCountryFromTimezoneOrLocale(
  countryHeader?: string | null,
  acceptLanguage?: string | null
): { countryCode: string; source: 'server_header' | 'locale' | 'default' } {
  const hdrCode = normalizeCountryCode(countryHeader);
  if (hdrCode && hdrCode !== 'XX' && hdrCode !== 'T1') {
    return { countryCode: hdrCode, source: 'server_header' };
  }

  if (acceptLanguage) {
    const tokens = acceptLanguage.split(',');
    for (const token of tokens) {
      const tag = token.split(';')[0].trim();
      const parts = tag.split(/[-_]/);
      if (parts.length >= 2) {
        const reg = normalizeCountryCode(parts[1]);
        if (reg && PPP_COUNTRY_RULES[reg]) {
          return { countryCode: reg, source: 'locale' };
        }
      }
    }
  }

  return { countryCode: 'US', source: 'default' };
}

/**
 * Computes PPP and optional Referral pricing for any tier.
 * Caps combined stacked discount at 65% so unit economics stay protected.
 */
export function computeTierPricing(params: {
  tierId: PaystackTierId;
  pppProfile?: PppLocationProfile | null;
  pppEnabled?: boolean;
  referralDiscountPercent?: number;
}): ComputedTierPricing {
  const tierMeta = TIER_BASE_PRICES_USD[params.tierId] || TIER_BASE_PRICES_USD.pro_annual;
  const baseUsd = tierMeta.usd;
  const profile = params.pppProfile || getPppProfileForCountry('US', 'default');
  const shouldApplyPpp = Boolean(
    params.pppEnabled !== false && tierMeta.pppEligible && profile.discountPercent > 0
  );

  const pppDiscountPercent = shouldApplyPpp ? profile.discountPercent : 0;
  const afterPppUsd = Math.max(
    1,
    Math.round(baseUsd * ((100 - pppDiscountPercent) / 100) * 100) / 100
  );

  const rawRefDiscount =
    tierMeta.pppEligible && params.referralDiscountPercent && params.referralDiscountPercent > 0
      ? params.referralDiscountPercent
      : 0;

  let finalUsd = afterPppUsd;
  if (rawRefDiscount > 0) {
    const stackedUsd = afterPppUsd * ((100 - rawRefDiscount) / 100);
    // Floor at 35% of base USD (max 65% combined discount)
    const floorUsd = Math.round(baseUsd * 0.35 * 100) / 100;
    finalUsd = Math.max(floorUsd, Math.round(stackedUsd * 100) / 100);
  }

  const effectiveDiscountPercent = Math.max(
    0,
    Math.round(((baseUsd - finalUsd) / baseUsd) * 100)
  );
  const monthlyEquivalentUsd = Math.round((finalUsd / tierMeta.intervalMonths) * 100) / 100;
  const savingsUsd = Math.max(0, Math.round((baseUsd - finalUsd) * 100) / 100);

  return {
    tierId: params.tierId,
    baseUsd,
    afterPppUsd,
    finalUsd,
    monthlyEquivalentUsd,
    savingsUsd,
    pppDiscountPercent,
    referralDiscountPercent: rawRefDiscount,
    effectiveDiscountPercent,
    pppApplied: pppDiscountPercent > 0,
    pppCountryCode: profile.countryCode,
    pppBandLabel: profile.bandLabel,
  };
}

export const FEATURED_PPP_COUNTRIES: PppCountryRule[] = [
  PPP_COUNTRY_RULES.KE,
  PPP_COUNTRY_RULES.NG,
  PPP_COUNTRY_RULES.ZA,
  PPP_COUNTRY_RULES.GH,
  PPP_COUNTRY_RULES.IN,
  PPP_COUNTRY_RULES.BR,
  PPP_COUNTRY_RULES.PL,
  PPP_COUNTRY_RULES.RO,
  PPP_COUNTRY_RULES.ES,
  PPP_COUNTRY_RULES.PT,
  PPP_COUNTRY_RULES.GB,
  PPP_COUNTRY_RULES.DE,
  PPP_COUNTRY_RULES.FR,
  PPP_COUNTRY_RULES.CH,
  PPP_COUNTRY_RULES.US,
];

const CHECKOUT_FX_FROM_USD: Record<'USD' | 'EUR' | 'GBP' | 'KES', number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  KES: 129,
};

export function formatLocalizedCheckoutAmount(
  amountUsd: number,
  currencyHint: string = 'USD',
  kesRate: number = 129
): {
  currency: 'USD' | 'EUR' | 'GBP' | 'KES';
  amount: number;
  formatted: string;
} {
  const upper = String(currencyHint || 'USD').toUpperCase();
  const target: 'USD' | 'EUR' | 'GBP' | 'KES' =
    upper === 'EUR' || upper === 'GBP' || upper === 'KES' ? upper : 'USD';
  const rate = target === 'KES' ? kesRate : CHECKOUT_FX_FROM_USD[target];
  const converted =
    target === 'KES' ? Math.round(amountUsd * rate) : Math.round(amountUsd * rate * 100) / 100;

  if (target === 'KES') {
    return { currency: 'KES', amount: converted, formatted: `KES ${converted.toLocaleString()}` };
  }
  const symbol = target === 'EUR' ? '€' : target === 'GBP' ? '£' : '$';
  const display = Number.isInteger(converted) ? converted.toLocaleString() : converted.toFixed(2);
  return { currency: target, amount: converted, formatted: `${symbol}${display}` };
}

