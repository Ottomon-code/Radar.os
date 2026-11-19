/**
 * Built-in Negotiation Financial System & Valuation Matrix
 * 
 * Provides:
 * 1. Total Target Compensation (TTC) & 4-Year NPV modeling
 * 2. ZOPA (Zone of Possible Agreement) & BATNA calibration
 * 3. Competing Offer Arbitrage (Cash vs Equity vs Bonus trade-offs)
 * 4. Contract Rider & Counter-Offer Financial Clauses
 */

export type VestingType = 'standard_equal' | 'amazon_backloaded' | 'frontloaded' | 'quarterly_no_cliff';
export type EquityType = 'liquid_rsu' | 'pre_ipo_options' | 'hft_profit_pool';

export interface OfferBreakdown {
  id: string;
  firmName: string;
  roleTitle: string;
  baseSalary: number;
  annualBonusPercent: number; // e.g. 20%
  signOnBonus: number;
  equityTotalGrant: number; // 4-year grant value
  equityType: EquityType;
  vestingSchedule: VestingType;
  annualEquityGrowthRate: number; // expected YoY growth (e.g. 15%)
  hasDoubleTrigger: boolean;
  clawbackMonths: number;
}

export interface YearByYearComp {
  year: number;
  base: number;
  bonus: number;
  signOn: number;
  equity: number;
  totalCash: number;
  totalComp: number;
  cumulativeTotal: number;
}

export interface ZopaAnalysis {
  employerInitial: number;
  employerCeiling: number;
  candidateFloor: number;
  candidateAnchor: number;
  zopaSpread: number; // employerCeiling - candidateFloor
  hasZopa: boolean;
  recommendedCounter: number;
  acceptanceProbability: number; // 0 - 100
  leverageRating: 'EXCEPTIONAL' | 'STRONG' | 'MODERATE' | 'VULNERABLE';
}

export function calculateVestingDistribution(
  totalGrant: number,
  schedule: VestingType,
  growthRate: number
): number[] {
  let percentages: number[] = [0.25, 0.25, 0.25, 0.25];
  if (schedule === 'amazon_backloaded') {
    percentages = [0.05, 0.15, 0.40, 0.40];
  } else if (schedule === 'frontloaded') {
    percentages = [0.35, 0.30, 0.20, 0.15];
  } else if (schedule === 'quarterly_no_cliff') {
    percentages = [0.25, 0.25, 0.25, 0.25];
  }

  // Compound equity value with YoY growth expectation
  return percentages.map((pct, idx) => {
    const compoundedFactor = Math.pow(1 + growthRate / 100, idx);
    return Math.round(totalGrant * pct * compoundedFactor);
  });
}

export function computeYearByYear(offer: OfferBreakdown): YearByYearComp[] {
  const equityByYear = calculateVestingDistribution(
    offer.equityTotalGrant,
    offer.vestingSchedule,
    offer.annualEquityGrowthRate
  );

  let cumulative = 0;
  const results: YearByYearComp[] = [];

  for (let yr = 1; yr <= 4; yr++) {
    const base = offer.baseSalary;
    const bonus = Math.round(base * (offer.annualBonusPercent / 100));
    const signOn = yr === 1 ? offer.signOnBonus : 0;
    const equity = equityByYear[yr - 1] || 0;
    const totalCash = base + bonus + signOn;
    const totalComp = totalCash + equity;
    cumulative += totalComp;

    results.push({
      year: yr,
      base,
      bonus,
      signOn,
      equity,
      totalCash,
      totalComp,
      cumulativeTotal: cumulative
    });
  }

  return results;
}

export function calculateZopa(
  employerInitial: number,
  candidateFloor: number,
  marketMedian: number,
  hasCompetingOffer: boolean
): ZopaAnalysis {
  // Estimated employer ceiling (typically 15% - 25% above initial offer in tech/defense)
  const employerCeiling = Math.round(employerInitial * (hasCompetingOffer ? 1.25 : 1.18));
  // Recommended anchor (anchored at top 5% of employer's estimated flexibility)
  const candidateAnchor = Math.round(employerCeiling * 1.05);
  const zopaSpread = employerCeiling - candidateFloor;
  const hasZopa = zopaSpread > 0;

  let leverageRating: ZopaAnalysis['leverageRating'] = 'STRONG';
  let acceptanceProbability = 78;

  if (hasCompetingOffer) {
    leverageRating = 'EXCEPTIONAL';
    acceptanceProbability = 89;
  } else if (candidateFloor > employerCeiling) {
    leverageRating = 'VULNERABLE';
    acceptanceProbability = 35;
  } else if (zopaSpread > 40000) {
    leverageRating = 'STRONG';
    acceptanceProbability = 82;
  } else {
    leverageRating = 'MODERATE';
    acceptanceProbability = 64;
  }

  const recommendedCounter = Math.round(
    employerInitial + (employerCeiling - employerInitial) * 0.85
  );

  return {
    employerInitial,
    employerCeiling,
    candidateFloor,
    candidateAnchor,
    zopaSpread: Math.max(0, zopaSpread),
    hasZopa,
    recommendedCounter,
    acceptanceProbability,
    leverageRating
  };
}

export const DEFAULT_OFFERS: OfferBreakdown[] = [
  {
    id: 'OFFER-A',
    firmName: 'Anthropic / Frontier AI Labs',
    roleTitle: 'Staff Distributed Systems Engineer',
    baseSalary: 285000,
    annualBonusPercent: 15,
    signOnBonus: 50000,
    equityTotalGrant: 480000, // $120k / yr
    equityType: 'liquid_rsu',
    vestingSchedule: 'standard_equal',
    annualEquityGrowthRate: 18,
    hasDoubleTrigger: true,
    clawbackMonths: 12
  },
  {
    id: 'OFFER-B',
    firmName: 'Citadel Securities / Quantitative Core',
    roleTitle: 'Lead Low-Latency Systems Architect',
    baseSalary: 320000,
    annualBonusPercent: 65, // High discretionary performance bonus
    signOnBonus: 100000,
    equityTotalGrant: 160000, // Profit pool allocation
    equityType: 'hft_profit_pool',
    vestingSchedule: 'frontloaded',
    annualEquityGrowthRate: 8,
    hasDoubleTrigger: false,
    clawbackMonths: 24
  }
];
