/**
 * AI Career Coaching & Sentiment Analysis Engine
 * Evaluates sentiment, stress markers, ambition velocity, and cognitive load
 * across user's bookmarked jobs, career trajectories, and news briefs.
 */

import type { SavedJobItem, SavedCareerPathItem, SavedNewsItem } from '../context/SavedItemsContext';

export interface ItemSentimentEvaluation {
  id: string;
  type: 'job' | 'career' | 'news';
  title: string;
  sentiment: 'Bullish' | 'Neutral' | 'Cautious' | 'High-Stress';
  score: number; // -100 to +100
  stressContribution: number; // 0 to 100
  keyTriggers: string[];
}

export interface WeeklyCoachingReport {
  timestamp: string;
  weekLabel: string;
  totalItemsAnalyzed: number;
  
  // Stress metrics
  stressIndex: number; // 0 - 100
  stressLevel: 'Restorative (Low)' | 'Optimal Challenge (Balanced)' | 'Elevated Tension (Caution)' | 'Burnout Risk (High)';
  stressColor: string;
  stressTrend: { delta: number; direction: 'up' | 'down' | 'steady' };
  stressDrivers: string[];
  stressRelievers: string[];

  // Trajectory metrics
  trajectoryVelocity: number; // 0 - 100
  trajectoryRating: 'Hyper-Ascent' | 'Calculated Expansion' | 'Stealth Pivot' | 'Consolidating Baseline';
  trajectoryColor: string;
  trajectoryTrend: { delta: number; direction: 'up' | 'down' | 'steady' };
  trajectoryInsights: string;

  // Sentiment metrics
  overallSentiment: 'Aggressively Bullish' | 'Calculated & Optimistic' | 'Balanced Equilibrium' | 'High-Anxiety / Defensive';
  sentimentScore: number; // -100 to +100
  distribution: {
    positivePct: number;
    neutralPct: number;
    stressPct: number;
  };

  // Weekly Actionable Coaching Directives
  weeklyDirectives: {
    category: 'Stress Regulation' | 'Trajectory Acceleration' | 'Negotiation Leverage';
    title: string;
    advice: string;
    actionItem: string;
  }[];

  // Itemized breakdown
  itemEvaluations: ItemSentimentEvaluation[];
}

// Lexicons for NLP Sentiment & Stress Detection
const STRESS_LEXICON = [
  'crunch', 'grind', 'fast-paced', 'fast paced', '24/7', 'on-call', 'oncall',
  'high pressure', 'tight deadline', 'demanding', 'unpredictable', 'wear many hats',
  'layoff', 'downsizing', 'freeze', 'cuts', 'restructuring', 'attrition', 'strike',
  'hostile', 'turnaround', 'struggling', 'regulatory risk', 'litigation', 'antitrust',
  'crunch time', 'urgent', 'firefighting', 'overtime', 'intense', 'under pressure',
  'debt', 'deficit', 'scrutiny', 'fallout', 'threat', 'investigation'
];

const RESILIENCE_LEXICON = [
  'mentorship', 'work-life', 'work life balance', 'wellness', 'flexible', 'remote',
  'equity', 'bonus', 'stability', 'sustainable', 'empowerment', 'collaborative',
  'inclusive', 'growth', 'learning stipend', 'breakthrough', 'expansion', 'funding',
  'profitable', 'record revenue', 'upbeat', 'bullish', 'strategic advantage', 'moat',
  'retention', 'supportive', 'health', 'autonomy', 'generous', 'transparent'
];

const AMBITION_LEXICON = [
  'principal', 'staff', 'director', 'lead', 'architect', 'founding', 'cutting-edge',
  'frontier', 'autonomous', 'breakthrough', 'scale', 'cluster', 'accelerator', 'seed',
  'series a', 'series b', 'ipo', 'multi-million', 'leadership', 'executive'
];

/**
 * Analyzes a single text string for stress and sentiment score
 */
function evaluateTextSentiment(text: string): { score: number; stress: number; triggers: string[] } {
  const lower = text.toLowerCase();
  let positiveScore = 0;
  let stressScore = 0;
  const triggers: string[] = [];

  for (const word of STRESS_LEXICON) {
    if (lower.includes(word)) {
      stressScore += 16;
      triggers.push(`Stress: "${word}"`);
    }
  }

  for (const word of RESILIENCE_LEXICON) {
    if (lower.includes(word)) {
      positiveScore += 14;
      triggers.push(`Buffer: "${word}"`);
    }
  }

  for (const word of AMBITION_LEXICON) {
    if (lower.includes(word)) {
      positiveScore += 8;
      // Ambition adds minor pressure but high trajectory
      stressScore += 4;
    }
  }

  const score = Math.max(-100, Math.min(100, positiveScore * 4 - stressScore * 3));
  const stress = Math.max(5, Math.min(95, 30 + stressScore - positiveScore));

  return { score, stress, triggers: triggers.slice(0, 3) };
}

/**
 * Main coaching and sentiment analysis generator
 */
export function analyzeCareerSentimentAndStress(
  savedJobs: SavedJobItem[],
  savedCareerPaths: SavedCareerPathItem[],
  savedNews: SavedNewsItem[]
): WeeklyCoachingReport {
  const now = new Date();
  const weekLabel = `Weekly Insight • Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const totalItems = savedJobs.length + savedCareerPaths.length + savedNews.length;

  // Fallback defaults if vault is completely empty
  if (totalItems === 0) {
    return {
      timestamp: now.toISOString(),
      weekLabel,
      totalItemsAnalyzed: 0,
      stressIndex: 28,
      stressLevel: 'Restorative (Low)',
      stressColor: '#22d3a5',
      stressTrend: { delta: -4, direction: 'down' },
      stressDrivers: ['Vault is currently clear of high-stress requisitions and volatile industry news.'],
      stressRelievers: ['Low cognitive overload; clean mental slate to survey strategic opportunities.'],
      trajectoryVelocity: 50,
      trajectoryRating: 'Consolidating Baseline',
      trajectoryColor: '#3b82f6',
      trajectoryTrend: { delta: 0, direction: 'steady' },
      trajectoryInsights: 'Bookmark requisitions, target career trajectories, or market news to activate real-time telemetry.',
      overallSentiment: 'Balanced Equilibrium',
      sentimentScore: 15,
      distribution: { positivePct: 50, neutralPct: 40, stressPct: 10 },
      weeklyDirectives: [
        {
          category: 'Trajectory Acceleration',
          title: 'Establish Repertoire Baseline',
          advice: 'Bookmark 2-3 target job requisitions and 1 career trajectory to enable personalized stress-velocity modeling.',
          actionItem: 'Browse Job Radar and save top matches with compensation above your baseline.'
        },
        {
          category: 'Stress Regulation',
          title: 'Pre-emptive Stress Protection',
          advice: 'Define your absolute non-negotiables (e.g., maximum travel, on-call limits) before entering interviews.',
          actionItem: 'Write down 3 boundaries for work-life integration in your notes.'
        },
        {
          category: 'Negotiation Leverage',
          title: 'Benchmark Compensation Bands',
          advice: 'Gather industry comp percentiles early so negotiation is fact-driven rather than emotionally draining.',
          actionItem: 'Review the Financial System & ZOPA tab to calibrate your walk-away numbers.'
        }
      ],
      itemEvaluations: []
    };
  }

  const itemEvaluations: ItemSentimentEvaluation[] = [];
  let cumulativeSentiment = 0;
  let cumulativeStress = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let stressCount = 0;

  const detectedDrivers: string[] = [];
  const detectedRelievers: string[] = [];

  // 1. Analyze Saved Jobs
  savedJobs.forEach((job) => {
    const textBlob = `${job.title} ${job.company} ${job.sector} ${job.location} ${job.skills.join(' ')} ${job.urgency}`;
    const evalResult = evaluateTextSentiment(textBlob);

    // Contextual job heuristics
    let jobStress = evalResult.stress;
    let jobScore = evalResult.score;

    // High match score cushions stress
    if (job.matchScore >= 90) {
      jobStress = Math.max(10, jobStress - 15);
      jobScore += 15;
      detectedRelievers.push(`High qualifications match (${job.matchScore}%) for ${job.title} at ${job.company}`);
    } else if (job.matchScore < 70) {
      jobStress = Math.min(95, jobStress + 18);
      detectedDrivers.push(`Skill deficit gap (${job.matchScore}% match) on ${job.title}`);
    }

    // Remote flexibility reduces stress
    if (job.location.toLowerCase().includes('remote')) {
      jobStress = Math.max(5, jobStress - 10);
      detectedRelievers.push(`Remote autonomy for ${job.company}`);
    }

    // High compensation ambition
    if (job.numericMaxSalary > 250000) {
      jobScore += 10;
    }

    cumulativeStress += jobStress;
    cumulativeSentiment += jobScore;

    let sentimentLabel: 'Bullish' | 'Neutral' | 'Cautious' | 'High-Stress' = 'Neutral';
    if (jobStress > 65) {
      sentimentLabel = 'High-Stress';
      stressCount++;
    } else if (jobScore > 20) {
      sentimentLabel = 'Bullish';
      positiveCount++;
    } else if (jobScore < -10) {
      sentimentLabel = 'Cautious';
      stressCount++;
    } else {
      neutralCount++;
    }

    itemEvaluations.push({
      id: job.id,
      type: 'job',
      title: `${job.title} (${job.company})`,
      sentiment: sentimentLabel,
      score: Math.max(-100, Math.min(100, jobScore)),
      stressContribution: Math.round(jobStress),
      keyTriggers: evalResult.triggers
    });
  });

  // 2. Analyze Saved Career Paths
  savedCareerPaths.forEach((cp) => {
    // Jump pressure: large salary jump with short timeline creates high stress
    const salaryJumpRatio = cp.targetSalary / 150000;
    const isAggressiveTimeline = cp.timelineMonths <= 12;
    const isHighReadiness = cp.readinessScore >= 80;

    let cpStress = 35;
    let cpScore = 30;

    if (isAggressiveTimeline && !isHighReadiness) {
      cpStress += 35;
      cpScore -= 10;
      detectedDrivers.push(`Compressed ${cp.timelineMonths}-month target runway for ${cp.targetRole} with ${cp.readinessScore}% readiness.`);
    } else if (isHighReadiness) {
      cpStress -= 15;
      cpScore += 25;
      detectedRelievers.push(`Strong existing trajectory foundation (${cp.readinessScore}% readiness) toward ${cp.targetRole}.`);
    }

    if (cp.criticalSkills.length > 3) {
      cpStress += 12;
      detectedDrivers.push(`Demanding critical skill deficit: ${cp.criticalSkills.slice(0, 3).join(', ')}.`);
    }

    cumulativeStress += cpStress;
    cumulativeSentiment += cpScore;

    if (cpStress > 60) {
      stressCount++;
    } else if (cpScore > 25) {
      positiveCount++;
    } else {
      neutralCount++;
    }

    itemEvaluations.push({
      id: cp.id,
      type: 'career',
      title: `Path: ${cp.targetRole}`,
      sentiment: cpStress > 60 ? 'High-Stress' : cpScore > 30 ? 'Bullish' : 'Neutral',
      score: Math.max(-100, Math.min(100, cpScore)),
      stressContribution: Math.round(cpStress),
      keyTriggers: [`Timeline: ${cp.timelineMonths}mo`, `Readiness: ${cp.readinessScore}%`, `Skills gap: ${cp.criticalSkills.length}`]
    });
  });

  // 3. Analyze Saved News & Intel
  savedNews.forEach((news) => {
    let newsStress = 25;
    let newsScore = 10;

    if (news.impact === 'Risk') {
      newsStress += 40;
      newsScore -= 45;
      detectedDrivers.push(`Market headwind in ${news.sector}: ${news.headline}`);
    } else if (news.impact === 'Positive') {
      newsStress -= 10;
      newsScore += 40;
      detectedRelievers.push(`Macro tailwind: ${news.company} reporting bullish momentum.`);
    }

    // Additional keyword check on headline & summary
    const textEval = evaluateTextSentiment(`${news.headline} ${news.summary || ''}`);
    newsStress = Math.max(5, Math.min(95, (newsStress + textEval.stress) / 2));
    newsScore = Math.max(-100, Math.min(100, (newsScore + textEval.score) / 2));

    cumulativeStress += newsStress;
    cumulativeSentiment += newsScore;

    if (newsStress > 55) {
      stressCount++;
    } else if (newsScore > 15) {
      positiveCount++;
    } else {
      neutralCount++;
    }

    itemEvaluations.push({
      id: news.id,
      type: 'news',
      title: `News: ${news.headline.slice(0, 45)}...`,
      sentiment: newsStress > 55 ? 'High-Stress' : newsScore > 20 ? 'Bullish' : 'Neutral',
      score: Math.round(newsScore),
      stressContribution: Math.round(newsStress),
      keyTriggers: textEval.triggers.length > 0 ? textEval.triggers : [`Impact: ${news.impact}`]
    });
  });

  // Average Calculations
  const avgStress = Math.round(Math.max(10, Math.min(95, cumulativeStress / totalItems)));
  const avgSentiment = Math.round(Math.max(-100, Math.min(100, cumulativeSentiment / totalItems)));

  // Trajectory Velocity calculation (0-100)
  // Driven by high match scores, aggressive salary goals, and positive news
  const baseVelocity = 60;
  const sentimentBonus = avgSentiment > 0 ? Math.round(avgSentiment * 0.25) : Math.round(avgSentiment * 0.15);
  const itemsBonus = Math.min(15, totalItems * 2.5);
  const trajectoryVelocity = Math.max(15, Math.min(98, baseVelocity + sentimentBonus + itemsBonus));

  // Determine Categorical Classifications
  let stressLevel: 'Restorative (Low)' | 'Optimal Challenge (Balanced)' | 'Elevated Tension (Caution)' | 'Burnout Risk (High)' = 'Optimal Challenge (Balanced)';
  let stressColor = '#3b82f6';

  if (avgStress <= 32) {
    stressLevel = 'Restorative (Low)';
    stressColor = '#22d3a5';
  } else if (avgStress <= 60) {
    stressLevel = 'Optimal Challenge (Balanced)';
    stressColor = '#3b82f6';
  } else if (avgStress <= 78) {
    stressLevel = 'Elevated Tension (Caution)';
    stressColor = '#fbbf24';
  } else {
    stressLevel = 'Burnout Risk (High)';
    stressColor = '#f87171';
  }

  let trajectoryRating: 'Hyper-Ascent' | 'Calculated Expansion' | 'Stealth Pivot' | 'Consolidating Baseline' = 'Calculated Expansion';
  let trajectoryColor = '#22d3a5';

  if (trajectoryVelocity >= 85) {
    trajectoryRating = 'Hyper-Ascent';
    trajectoryColor = '#22d3a5';
  } else if (trajectoryVelocity >= 65) {
    trajectoryRating = 'Calculated Expansion';
    trajectoryColor = '#3b82f6';
  } else if (trajectoryVelocity >= 45) {
    trajectoryRating = 'Stealth Pivot';
    trajectoryColor = '#fbbf24';
  } else {
    trajectoryRating = 'Consolidating Baseline';
    trajectoryColor = '#7a8b99';
  }

  let overallSentiment: 'Aggressively Bullish' | 'Calculated & Optimistic' | 'Balanced Equilibrium' | 'High-Anxiety / Defensive' = 'Calculated & Optimistic';
  if (avgSentiment >= 45) {
    overallSentiment = 'Aggressively Bullish';
  } else if (avgSentiment >= 10) {
    overallSentiment = 'Calculated & Optimistic';
  } else if (avgSentiment >= -20) {
    overallSentiment = 'Balanced Equilibrium';
  } else {
    overallSentiment = 'High-Anxiety / Defensive';
  }

  // Sentiment Distribution Percentages
  const positivePct = Math.round((positiveCount / totalItems) * 100);
  const stressPct = Math.round((stressCount / totalItems) * 100);
  const neutralPct = Math.max(0, 100 - positivePct - stressPct);

  // Trajectory Insights Synthesis
  let trajectoryInsights = '';
  if (overallSentiment === 'Aggressively Bullish') {
    trajectoryInsights = `Your bookmarked radar exhibits strong offensive momentum. You are tracking frontier roles in high-yield segments with strong compensation upside ($240k - $340k range).`;
  } else if (overallSentiment === 'Calculated & Optimistic') {
    trajectoryInsights = `Your saved profiles indicate a disciplined, risk-managed progression. You balance high-upside targets with solid qualification buffers and flexible working arrangements.`;
  } else if (overallSentiment === 'Balanced Equilibrium') {
    trajectoryInsights = `Your telemetry demonstrates cautious curiosity. You are testing both conservative fallback requisitions and ambitious step-up trajectories.`;
  } else {
    trajectoryInsights = `Your bookmarked items suggest reactive or defensive browsing during sector volatility. Focus on high-signal fundamentals to regain strategic initiative.`;
  }

  // Generate Bespoke Weekly Actionable Directives
  const weeklyDirectives: WeeklyCoachingReport['weeklyDirectives'] = [];

  // Directive 1: Stress Regulation
  if (avgStress > 65) {
    weeklyDirectives.push({
      category: 'Stress Regulation',
      title: 'Decouple From Volatile Market Headlines',
      advice: `Your saved items contain ${stressCount} high-friction signals (crunch terms or volatile industry briefs). Excessive exposure to macro headwind headlines increases perceived career vulnerability without aiding technical prep.`,
      actionItem: 'Remove or archive 2 speculative risk news items and limit recruitment outreach to 2 vetted opportunities this week.'
    });
  } else if (avgStress > 40) {
    weeklyDirectives.push({
      category: 'Stress Regulation',
      title: 'Maintain Healthy Cognitive Bandwidth',
      advice: 'You are operating in the sweet spot of optimal stretch. Ensure you preserve 90 minutes of daily uninterrupted focus time away from job portals.',
      actionItem: 'Batch interview prep into two 45-minute focused blocks rather than continuous passive scanning.'
    });
  } else {
    weeklyDirectives.push({
      category: 'Stress Regulation',
      title: 'Leverage Low-Stress Surplus Bandwidth',
      advice: 'Your stress indicators are comfortably grounded (Restorative Zone). This is the ideal psychological window to tackle ambitious mock interviews or reach out to dream-tier contacts.',
      actionItem: 'Submit 1 high-ambition application to an organization you previously deemed intimidating.'
    });
  }

  // Directive 2: Trajectory Acceleration
  const topDeficits = savedCareerPaths.flatMap((c) => c.criticalSkills).slice(0, 2);
  const deficitText = topDeficits.length > 0 ? topDeficits.join(' and ') : 'distributed systems telemetry';

  weeklyDirectives.push({
    category: 'Trajectory Acceleration',
    title: `Close Leverage Deficit on ${deficitText}`,
    advice: `Your saved career roadmaps emphasize high-value proficiency in ${deficitText}. Interview panels reward concrete GitHub deliverables and architectural war-stories over theoretical familiarity.`,
    actionItem: `Spend 3 hours constructing a working micro-benchmark or case study demonstrating ${deficitText}.`
  });

  // Directive 3: Negotiation Leverage
  const highestSalary = Math.max(...savedJobs.map((j) => j.numericMaxSalary), 220000);
  weeklyDirectives.push({
    category: 'Negotiation Leverage',
    title: `Anchor Expectations at $${(highestSalary * 0.95).toLocaleString().split('.')[0]} Level`,
    advice: `The compensation spread across your saved requisitions supports anchoring base discussions above median tiers. Envoy recommends framing your current interview cycles as a multi-firm selection process.`,
    actionItem: 'Review the Financial System & ZOPA tab to simulate your counter-offer scripts before live screening calls.'
  });

  return {
    timestamp: now.toISOString(),
    weekLabel,
    totalItemsAnalyzed: totalItems,
    stressIndex: avgStress,
    stressLevel,
    stressColor,
    stressTrend: { delta: avgStress > 50 ? +8 : -5, direction: avgStress > 50 ? 'up' : 'down' },
    stressDrivers: detectedDrivers.slice(0, 4),
    stressRelievers: detectedRelievers.slice(0, 4),
    trajectoryVelocity,
    trajectoryRating,
    trajectoryColor,
    trajectoryTrend: { delta: +6, direction: 'up' },
    trajectoryInsights,
    overallSentiment,
    sentimentScore: avgSentiment,
    distribution: {
      positivePct,
      neutralPct,
      stressPct
    },
    weeklyDirectives,
    itemEvaluations
  };
}
