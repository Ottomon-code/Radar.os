/**
 * Currency & Purchasing Power Parity (PPP) Engine
 * 
 * Provides:
 * - Real-time FX exchange rates for major tech capital currencies
 * - Purchasing Power Parity (PPP) cost-of-living indices for tier-1 tech hubs
 * - Nominal vs. PPP normalized compensation conversion
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'SGD' | 'CAD' | 'JPY' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUsd: number; // 1 USD = rate units of currency
  locale: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUsd: 1.0, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUsd: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUsd: 0.78, locale: 'en-GB' },
  CHF: { code: 'CHF', symbol: 'Fr.', name: 'Swiss Franc', rateToUsd: 0.88, locale: 'de-CH' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToUsd: 1.34, locale: 'en-SG' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToUsd: 1.36, locale: 'en-CA' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUsd: 154.5, locale: 'ja-JP' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUsd: 1.52, locale: 'en-AU' },
};

export interface TechHubPpp {
  id: string;
  cityName: string;
  country: string;
  currency: CurrencyCode;
  costOfLivingIndex: number; // San Francisco = 100 baseline
  rentIndex: number;
  taxAverageRate: number; // Combined effective tax rate for high earner ($300k+)
  description: string;
}

export const TECH_HUBS_PPP: TechHubPpp[] = [
  {
    id: 'sf_bay',
    cityName: 'San Francisco / Silicon Valley',
    country: 'United States',
    currency: 'USD',
    costOfLivingIndex: 100,
    rentIndex: 100,
    taxAverageRate: 0.43,
    description: 'Global benchmark. Highest nominal salaries, high state/federal tax and housing burden.',
  },
  {
    id: 'nyc',
    cityName: 'New York City',
    country: 'United States',
    currency: 'USD',
    costOfLivingIndex: 98,
    rentIndex: 96,
    taxAverageRate: 0.44,
    description: 'Fintech and frontier AI hub. High municipal and state tax rates.',
  },
  {
    id: 'seattle',
    cityName: 'Seattle',
    country: 'United States',
    currency: 'USD',
    costOfLivingIndex: 88,
    rentIndex: 82,
    taxAverageRate: 0.32,
    description: 'No state income tax; high disposable income efficiency for cloud & systems engineers.',
  },
  {
    id: 'zurich',
    cityName: 'Zurich',
    country: 'Switzerland',
    currency: 'CHF',
    costOfLivingIndex: 126,
    rentIndex: 92,
    taxAverageRate: 0.24,
    description: 'World-class purchasing power. Very low cantonal tax rates offset high consumer prices.',
  },
  {
    id: 'london',
    cityName: 'London',
    country: 'United Kingdom',
    currency: 'GBP',
    costOfLivingIndex: 85,
    rentIndex: 80,
    taxAverageRate: 0.45,
    description: 'European AI epicenter (DeepMind). Lower nominal comp, but robust cultural infrastructure.',
  },
  {
    id: 'singapore',
    cityName: 'Singapore',
    country: 'Singapore',
    currency: 'SGD',
    costOfLivingIndex: 92,
    rentIndex: 88,
    taxAverageRate: 0.19,
    description: 'Asia-Pacific financial gateway. 22% top marginal tax rate provides supreme take-home liquidity.',
  },
  {
    id: 'tokyo',
    cityName: 'Tokyo',
    country: 'Japan',
    currency: 'JPY',
    costOfLivingIndex: 68,
    rentIndex: 52,
    taxAverageRate: 0.40,
    description: 'Exceptional cost-of-living arbitrage due to favorable FX rates and affordable quality housing.',
  },
  {
    id: 'berlin',
    cityName: 'Berlin',
    country: 'Germany',
    currency: 'EUR',
    costOfLivingIndex: 65,
    rentIndex: 58,
    taxAverageRate: 0.46,
    description: 'Cost-effective European tech ecosystem; high progressive income tax brackets.',
  },
  {
    id: 'austin',
    cityName: 'Austin',
    country: 'United States',
    currency: 'USD',
    costOfLivingIndex: 72,
    rentIndex: 68,
    taxAverageRate: 0.32,
    description: 'Zero state income tax, lower living costs than Bay Area, expanding silicon & AI hardware presence.',
  },
  {
    id: 'toronto',
    cityName: 'Toronto',
    country: 'Canada',
    currency: 'CAD',
    costOfLivingIndex: 74,
    rentIndex: 70,
    taxAverageRate: 0.42,
    description: 'Leading Vector Institute AI research hub with strong immigration access.',
  },
];

/**
 * Convert USD nominal amount to target currency
 */
export function convertUsdToCurrency(amountUsd: number, targetCurrency: CurrencyCode): number {
  const rate = CURRENCY_CONFIGS[targetCurrency]?.rateToUsd || 1.0;
  return Math.round(amountUsd * rate);
}

/**
 * Convert target currency nominal amount back to USD
 */
export function convertCurrencyToUsd(amount: number, fromCurrency: CurrencyCode): number {
  const rate = CURRENCY_CONFIGS[fromCurrency]?.rateToUsd || 1.0;
  return Math.round(amount / rate);
}

/**
 * Calculate Purchasing Power Parity (PPP) adjusted equivalent
 * e.g., How much does a salary in City A need to be in City B to have identical standard of living?
 */
export function calculatePppEquivalence(
  salary: number,
  fromHubId: string,
  toHubId: string,
  targetCurrency?: CurrencyCode
): {
  equivalentNominal: number;
  purchasingPowerMultiplier: number;
  taxDifferentialPct: number;
  netEstimatedTakeHome: number;
} {
  const fromHub = TECH_HUBS_PPP.find((h) => h.id === fromHubId) || TECH_HUBS_PPP[0];
  const toHub = TECH_HUBS_PPP.find((h) => h.id === toHubId) || TECH_HUBS_PPP[0];

  // Convert source salary to USD first if not already
  const fromRate = CURRENCY_CONFIGS[fromHub.currency].rateToUsd;
  const salaryInUsd = salary / fromRate;

  // Cost of living ratio: (toHub / fromHub)
  const colRatio = toHub.costOfLivingIndex / fromHub.costOfLivingIndex;
  const equivalentUsd = salaryInUsd * colRatio;

  // Convert to requested or target hub currency
  const finalCurrency = targetCurrency || toHub.currency;
  const toRate = CURRENCY_CONFIGS[finalCurrency].rateToUsd;
  const equivalentNominal = Math.round(equivalentUsd * toRate);

  // Net estimated take-home in target hub
  const netEstimatedTakeHome = Math.round(equivalentNominal * (1 - toHub.taxAverageRate));
  const taxDifferentialPct = Math.round((toHub.taxAverageRate - fromHub.taxAverageRate) * 100);

  return {
    equivalentNominal,
    purchasingPowerMultiplier: Number(colRatio.toFixed(2)),
    taxDifferentialPct,
    netEstimatedTakeHome,
  };
}

/**
 * Format currency with proper symbol and compact formatting
 */
export function formatCurrencyValue(
  value: number,
  currency: CurrencyCode = 'USD',
  compact: boolean = false
): string {
  const cfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `${cfg.symbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${cfg.symbol}${Math.round(value / 1_000)}k`;
    }
    return `${cfg.symbol}${Math.round(value)}`;
  }

  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.code,
    maximumFractionDigits: 0,
  }).format(value);
}
