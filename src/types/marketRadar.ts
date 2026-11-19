export interface LiveTechHubData {
  name: string;
  country: string;
  lat: number;
  lng: number;
  openings: number;
  openingsDelta24h: string;
  salaryBand: string;
  hiringVelocity: number;
  topSkills: string[];
  dominantSector: string;
  status: 'High Velocity' | 'Surging' | 'Active' | 'Exponential' | 'Accelerating' | 'Steady';
}

export interface RoleDemandMetric {
  role: string;
  demandScore: number; // 0 - 100
  yoyChange: string;
  averageSalaryDisplay: string;
  averageSalaryUsd: number;
  topSkills: string[];
  urgencyLevel: 'CRITICAL DEMAND' | 'HIGH DEMAND' | 'ELEVATED DEMAND';
  primaryLocation: string;
}

export interface TrendingSkillMetric {
  skill: string;
  growth: string;
  requisitions: number;
  category: string;
}

export interface MarketRadarData {
  status: string;
  timestamp: string;
  freshness: string;
  totalOpenings: number;
  globalHiringVelocity: number;
  velocityDelta: string;
  activeHubsCount: number;
  marketSentiment: string;
  hubs: LiveTechHubData[];
  roleDemandIndex: RoleDemandMetric[];
  trendingSkills: TrendingSkillMetric[];
  marketTakeaways: string[];
}
