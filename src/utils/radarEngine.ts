/**
 * Radar Intelligence Engine
 * Provides career modeling, predictive forecasting, market news intelligence,
 * and encrypted comms interception telemetry.
 */

export interface CareerInput {
  currentRole?: string;
  targetRole?: string;
  yearsExperience?: number;
  skills?: string[];
  currentSalary?: number;
  targetIndustry?: string;
  targetSalary?: number;
}

export interface CareerPathResult {
  currentRole: string;
  targetRole: string;
  readinessScore: number;
  estimatedTimelineMonths: number;
  targetSalary: number;
  salaryProgression: Array<{ name: string; salary: number; percentile: number }>;
  forecastDemand: Array<{ year: string; demand: number; growthRate: string }>;
  milestones: Array<{
    step: number;
    phase: string;
    duration: string;
    goals: string[];
    criticalSkills: string[];
  }>;
  skillGaps: Array<{
    skill: string;
    importance: 'Critical' | 'High' | 'Moderate';
    currentLevel: number; // 0 - 100
    targetLevel: number;
  }>;
  tacticalAdvice: string[];
  matchingJobsCount?: number;
}

export interface IntelBrief {
  company: string;
  sector: string;
  generatedAt: string;
  sentiment: 'Bullish' | 'Neutral' | 'Cautious' | 'Aggressive Hiring';
  hiringVelocityScore: number; // 0 - 100
  summary: string;
  keySignals: string[];
  openRequisitionsCount: number;
  avgCompensationBand: string;
  recentDevelopments: Array<{
    headline: string;
    date: string;
    source: string;
    impact: 'Positive' | 'Neutral' | 'Risk';
  }>;
  strategicAssessment: string;
}

export interface CommsMessage {
  id: string;
  sender: string;
  senderTitle: string;
  company: string;
  avatarSeed: string;
  channel: 'Direct Headhunter' | 'Executive Search' | 'Stealth Referral' | 'Talent Partner';
  urgency: 'Immediate' | 'Active' | 'Discreet';
  timestamp: string;
  subject: string;
  preview: string;
  fullMessage: string;
  proposedComp: string;
  targetRole: string;
  status: 'Unread' | 'Negotiating' | 'Archived' | 'Flagged';
  externalUrl?: string;
  sourceAts?: 'ashby' | 'greenhouse' | 'lever';
  location?: string;
  department?: string;
}

export interface JobAlert {
  id: string;
  title: string;
  company: string;
  location: string;
  coordinates: [number, number]; // lat, lng for globe
  salaryRange: string;
  numericMinSalary: number;
  numericMaxSalary: number;
  sector: string;
  type: 'Full-Time' | 'Contract' | 'Founding Engineer';
  urgency: 'HIGH PRIORITY' | 'URGENT' | 'NEW SIGNAL' | 'DISCREET';
  matchScore: number;
  skills: string[];
  postedAgo: string;
  headcountDelta: string;
  description: string;
  applyUrl?: string;
  sourceAts?: 'ashby' | 'greenhouse' | 'lever' | 'curated';
  sourceBoard?: string;
  department?: string;
  isCompDisclosed?: boolean;
}

export interface JobSearchParams {
  keywords?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  sector?: string;
  urgency?: string;
}

// In-memory rich radar datasets
export const DEFAULT_JOB_ALERTS: JobAlert[] = [
  {
    id: 'ALERT-901',
    title: 'Staff Autonomous Systems Engineer',
    company: 'Skydio / Horizon Dynamics',
    location: 'San Francisco, CA (Hybrid)',
    coordinates: [37.7749, -122.4194],
    salaryRange: '$220,000 - $295,000 + 0.15% Equity',
    numericMinSalary: 220000,
    numericMaxSalary: 295000,
    sector: 'Autonomous Robotics',
    type: 'Full-Time',
    urgency: 'URGENT',
    matchScore: 96,
    skills: ['Rust', 'ROS 2', 'Embedded Linux', 'Computer Vision', 'CUDA'],
    postedAgo: '12m ago',
    headcountDelta: '+28% Q3 Growth',
    description: 'Lead next-generation edge perception algorithms for autonomous aerial platforms. High security clearance preferred but not mandatory.'
  },
  {
    id: 'ALERT-902',
    title: 'Principal AI Infrastructure Architect',
    company: 'TensorScale Labs',
    location: 'New York, NY / Remote',
    coordinates: [40.7128, -74.006],
    salaryRange: '$250,000 - $340,000 + Top Tier Grants',
    numericMinSalary: 250000,
    numericMaxSalary: 340000,
    sector: 'Frontier AI & Cloud Infrastructure',
    type: 'Full-Time',
    urgency: 'HIGH PRIORITY',
    matchScore: 94,
    skills: ['Distributed Systems', 'Ray', 'vLLM', 'Kubernetes', 'InfiniBand'],
    postedAgo: '42m ago',
    headcountDelta: 'Series B ($120M)',
    description: 'Orchestrating 32,000 GPU cluster topologies with ultra-low latency inter-node communication and fault-tolerant checkpoints.'
  },
  {
    id: 'ALERT-903',
    title: 'VP of Platform Engineering',
    company: 'Vanguard Cyber Systems',
    location: 'London, UK / Hybrid',
    coordinates: [51.5074, -0.1278],
    salaryRange: '£180,000 - £230,000 + Equity ($235k - $300k)',
    numericMinSalary: 235000,
    numericMaxSalary: 300000,
    sector: 'Cyber Defense & Sovereign Cloud',
    type: 'Full-Time',
    urgency: 'DISCREET',
    matchScore: 89,
    skills: ['Zero Trust', 'Go', 'AWS GovCloud', 'SOC2/FedRAMP', 'Team Leadership'],
    postedAgo: '2h ago',
    headcountDelta: 'Defense Tech Expansion',
    description: 'Direct stealth expansion into European sovereign cloud infrastructure. Managing 4 squads across identity, telemetry, and platform security.'
  },
  {
    id: 'ALERT-904',
    title: 'Quantitative Research Developer (HFT)',
    company: 'Aethelgard Capital',
    location: 'Chicago, IL (On-site)',
    coordinates: [41.8781, -87.6298],
    salaryRange: '$300,000 - $450,000 Base + Up to 200% Bonus',
    numericMinSalary: 300000,
    numericMaxSalary: 450000,
    sector: 'High-Frequency Trading',
    type: 'Full-Time',
    urgency: 'HIGH PRIORITY',
    matchScore: 91,
    skills: ['C++23', 'FPGA', 'Kernel Bypass', 'Market Microstructure', 'SIMD'],
    postedAgo: '3h ago',
    headcountDelta: 'Record PnL Year',
    description: 'Optimizing sub-microsecond algorithmic order routing engines for European and North American fixed income venues.'
  },
  {
    id: 'ALERT-905',
    title: 'Senior Applied Research Scientist (Reasoning & Agents)',
    company: 'Cortex Synthetic Intelligence',
    location: 'Zurich, Switzerland',
    coordinates: [47.3769, 8.5417],
    salaryRange: 'CHF 210,000 - CHF 270,000 ($240k - $310k)',
    numericMinSalary: 240000,
    numericMaxSalary: 310000,
    sector: 'Frontier AI & Cloud Infrastructure',
    type: 'Full-Time',
    urgency: 'NEW SIGNAL',
    matchScore: 93,
    skills: ['PyTorch', 'RLHF / GRPO', 'Synthetic Data Gen', 'Tree Search', 'Transformers'],
    postedAgo: '4h ago',
    headcountDelta: 'Doubling AI Core Team',
    description: 'Pioneering test-time compute scaling and autonomous planning agents capable of verified code synthesis and mathematical proofs.'
  },
  {
    id: 'ALERT-906',
    title: 'Founding Lead Systems Engineer',
    company: 'Orbital Pulse Networks',
    location: 'Tokyo, Japan / Remote',
    coordinates: [35.6762, 139.6503],
    salaryRange: '$210,000 - $280,000 + 1.2% Equity',
    numericMinSalary: 210000,
    numericMaxSalary: 280000,
    sector: 'Space & Satellite Comms',
    type: 'Founding Engineer',
    urgency: 'URGENT',
    matchScore: 88,
    skills: ['Satellite Comms', 'DSP', 'Rust', 'Real-Time Telemetry', 'Optical Links'],
    postedAgo: '6h ago',
    headcountDelta: 'Seed funded ($18M)',
    description: 'Deploying low-Earth orbit laser optical inter-satellite communication constellations. Direct report to CTO.'
  },
  {
    id: 'ALERT-907',
    title: 'Director of Applied Robotics',
    company: 'Kinetic Bionics',
    location: 'Singapore',
    coordinates: [1.3521, 103.8198],
    salaryRange: '$240,000 - $320,000 SGD equivalent',
    numericMinSalary: 240000,
    numericMaxSalary: 320000,
    sector: 'Autonomous Robotics',
    type: 'Full-Time',
    urgency: 'NEW SIGNAL',
    matchScore: 90,
    skills: ['Humanoid Robotics', 'Actuator Control', 'MuJoCo', 'Reinforcement Learning'],
    postedAgo: '8h ago',
    headcountDelta: '+45% R&D Budget',
    description: 'Leading field trials for bipedal and dexterous manipulation robotics deployed in advanced precision manufacturing.'
  },
  {
    id: 'ALERT-908',
    title: 'Senior Distributed Data Architect (Exabyte Scale)',
    company: 'Palantir / Defense Tech Alliance',
    location: 'Washington, DC / Remote',
    coordinates: [38.9072, -77.0369],
    salaryRange: '$215,000 - $285,000 + TS/SCI Clearance Bonus',
    numericMinSalary: 215000,
    numericMaxSalary: 285000,
    sector: 'Cyber Defense & Sovereign Cloud',
    type: 'Full-Time',
    urgency: 'HIGH PRIORITY',
    matchScore: 92,
    skills: ['Spark', 'Rust', 'Distributed Storage', 'Zero Trust', 'Kafka'],
    postedAgo: '9h ago',
    headcountDelta: 'Major Defense Contract ($480M)',
    description: 'Architecting fault-tolerant partitioned data lakes across disconnected, intermittent edge networks for national intelligence clients.'
  },
  {
    id: 'ALERT-909',
    title: 'Lead Compiler & Hardware Acceleration Engineer (Triton / CUDA)',
    company: 'NVIDIA & Custom ASIC Fabric',
    location: 'Seattle, WA / San Francisco, CA',
    coordinates: [47.6062, -122.3321],
    salaryRange: '$260,000 - $360,000 + Top RSU Band',
    numericMinSalary: 260000,
    numericMaxSalary: 360000,
    sector: 'Frontier AI & Cloud Infrastructure',
    type: 'Full-Time',
    urgency: 'URGENT',
    matchScore: 97,
    skills: ['CUDA', 'Triton', 'LLVM', 'GPU Microarchitecture', 'C++20'],
    postedAgo: '11h ago',
    headcountDelta: 'Blackwell Architecture Expansion',
    description: 'Writing custom compute kernels and compiler intermediate representations targeting next-generation Blackwell and custom hyperscaler silicon.'
  },
  {
    id: 'ALERT-910',
    title: 'Quantum Algorithms Research Scientist',
    company: 'Aether Quantum Systems',
    location: 'Berlin, Germany / Remote',
    coordinates: [52.52, 13.405],
    salaryRange: '€140,000 - €190,000 ($155k - $210k)',
    numericMinSalary: 155000,
    numericMaxSalary: 210000,
    sector: 'Quantum Computing',
    type: 'Full-Time',
    urgency: 'NEW SIGNAL',
    matchScore: 87,
    skills: ['Qiskit', 'Quantum Error Correction', 'Hamiltonian Simulation', 'Python', 'C++'],
    postedAgo: '14h ago',
    headcountDelta: 'Horizon Europe Grant',
    description: 'Designing fault-tolerant surface code decoding algorithms and hybrid classical-quantum variational solvers for pharmaceutical molecular modeling.'
  },
  {
    id: 'ALERT-911',
    title: 'Staff Full-Stack Protocol Engineer',
    company: 'Citadel Securities / Aethelgard',
    location: 'New York, NY (Hybrid)',
    coordinates: [40.7128, -74.006],
    salaryRange: '$230,000 - $310,000 + Discretionary Bonus',
    numericMinSalary: 230000,
    numericMaxSalary: 310000,
    sector: 'High-Frequency Trading',
    type: 'Full-Time',
    urgency: 'HIGH PRIORITY',
    matchScore: 89,
    skills: ['TypeScript', 'Rust', 'WebSockets', 'React', 'FIX Protocol'],
    postedAgo: '1d ago',
    headcountDelta: '+15% Trading Volumes',
    description: 'Developing mission-critical internal trading consoles, real-time risk monitors, and order execution visualization suites.'
  },
  {
    id: 'ALERT-912',
    title: 'Autonomous Navigation & SLAM Specialist',
    company: 'Skydio / Horizon Dynamics',
    location: 'Austin, TX / San Francisco, CA',
    coordinates: [30.2672, -97.7431],
    salaryRange: '$195,000 - $265,000 + Equity',
    numericMinSalary: 195000,
    numericMaxSalary: 265000,
    sector: 'Autonomous Robotics',
    type: 'Full-Time',
    urgency: 'DISCREET',
    matchScore: 91,
    skills: ['Visual SLAM', 'C++', 'LiDAR', 'Kalman Filters', 'Eigen'],
    postedAgo: '1d ago',
    headcountDelta: 'Expansion in Industrial Inspection',
    description: 'Creating GPS-denied state estimation and real-time 3D volumetric mapping systems for mission-critical industrial inspections.'
  },
  {
    id: 'ALERT-913',
    title: 'Lead Spacecraft Flight Avionics Architect',
    company: 'Apex Space / Firefly Avionics',
    location: 'Austin, TX',
    coordinates: [30.2672, -97.7431],
    salaryRange: '$225,000 - $315,000 + Top Equity',
    numericMinSalary: 225000,
    numericMaxSalary: 315000,
    sector: 'Commercial SpaceTech / Defense Avionics',
    type: 'Full-Time',
    urgency: 'HIGH PRIORITY',
    matchScore: 97,
    skills: ['Rad-Hard Avionics', 'DO-178C', 'RTOS', 'C++', 'GN&C Guidance', 'Rust'],
    postedAgo: '18m ago',
    headcountDelta: '+45% Space Defense Contract',
    description: 'Designing fault-tolerant orbital flight computers, radiation-hardened satellite bus controllers, and autonomous trajectory guidance systems.'
  },
  {
    id: 'ALERT-914',
    title: 'Staff Energy Grid Optimization & DERMS Lead',
    company: 'Form Energy / Hydro Grid AI',
    location: 'Toronto, Canada (Hybrid)',
    coordinates: [43.6532, -79.3832],
    salaryRange: 'C$210,000 - C$295,000 ($160k - $225k USD)',
    numericMinSalary: 210000,
    numericMaxSalary: 295000,
    sector: 'Next-Gen Energy Grid Optimization',
    type: 'Full-Time',
    urgency: 'URGENT',
    matchScore: 95,
    skills: ['Smart Grid SCADA', 'DERMS Optimization', 'OpenDSS', 'Clean Compute', 'Python', 'Rust'],
    postedAgo: '45m ago',
    headcountDelta: 'Series C Clean Grid ($150M)',
    description: 'Engineering multi-gigawatt dispatch algorithms, battery storage peak shaving, and AI datacenter micro-grid synchronization.'
  },
  {
    id: 'ALERT-915',
    title: 'Principal Computational Genomics Researcher',
    company: 'SciLifeLab / DeepGenomics Nordic',
    location: 'Stockholm, Sweden',
    coordinates: [59.3293, 18.0686],
    salaryRange: 'SEK 1,200,000 - 1,750,000 (€110k - €160k + Equity)',
    numericMinSalary: 180000,
    numericMaxSalary: 260000,
    sector: 'Computational Genomics',
    type: 'Full-Time',
    urgency: 'NEW SIGNAL',
    matchScore: 94,
    skills: ['Variant Calling Pipelines', 'AlphaFold3', 'Nextflow', 'PyTorch', 'Bioinformatics'],
    postedAgo: '1h ago',
    headcountDelta: 'Horizon Europe Grant (€45M)',
    description: 'Developing population-scale deep learning models for whole-genome variant prediction and in-silico therapeutic target discovery.'
  },
  {
    id: 'ALERT-916',
    title: 'Staff Distributed GPU Cluster Systems Architect',
    company: 'TensorScale Cloud India',
    location: 'Bengaluru, India',
    coordinates: [12.9716, 77.5946],
    salaryRange: '₹4,800,000 - ₹8,200,000 + RSU ($60k - $105k USD)',
    numericMinSalary: 190000,
    numericMaxSalary: 280000,
    sector: 'Frontier AI & Cloud Infrastructure',
    type: 'Full-Time',
    urgency: 'URGENT',
    matchScore: 93,
    skills: ['Kubernetes', 'Slurm Orchestration', 'RDMA InfiniBand', 'Ray', 'Linux Kernel'],
    postedAgo: '2h ago',
    headcountDelta: '+60% Hyperscale Intake',
    description: 'Managing 64k accelerator cluster topologies, low-latency inter-rack interconnects, and non-blocking checkpoint storage.'
  },
  {
    id: 'ALERT-917',
    title: 'Lead Post-Quantum Cryptography & Enclave Specialist',
    company: 'Sovereign Enclave Systems',
    location: 'Tel Aviv, Israel',
    coordinates: [32.0853, 34.7818],
    salaryRange: '₪600,000 - ₪920,000 ($165k - $250k USD)',
    numericMinSalary: 220000,
    numericMaxSalary: 320000,
    sector: 'Zero-Trust Defense & Sovereign Security',
    type: 'Full-Time',
    urgency: 'DISCREET',
    matchScore: 96,
    skills: ['Rust', 'Halo2', 'Intel SGX/AMD SEV', 'Post-Quantum Crypto', 'C++'],
    postedAgo: '3h ago',
    headcountDelta: 'Defense Sovereign Scale',
    description: 'Architecting zero-knowledge attestation, secure hardware enclave execution, and quantum-resistant key exchange for critical national infrastructure.'
  }
];

export function searchJobs(
  params: JobSearchParams,
  sourceJobs: JobAlert[] = DEFAULT_JOB_ALERTS
): {
  jobs: JobAlert[];
  totalCount: number;
  matchedSector?: string;
  recommendedKeywords: string[];
} {
  const kw = (params.keywords || '').trim().toLowerCase();
  const loc = (params.location || '').trim().toLowerCase();
  const minSal = Number(params.minSalary) || 0;
  const maxSal = Number(params.maxSalary) || 1000000;
  const urgencyFilter = params.urgency || 'All';
  const sectorFilter = params.sector || 'All';

  const kwTokens = kw.split(/\s+/).filter(Boolean);

  const scored = sourceJobs.map((job) => {
    let score = job.matchScore;

    // Keyword match check
    if (kwTokens.length > 0) {
      const haystack = `${job.title} ${job.company} ${job.sector} ${job.department || ''} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
      let matchCount = 0;
      for (const token of kwTokens) {
        if (haystack.includes(token)) {
          matchCount++;
        }
      }
      if (matchCount === 0) {
        score -= 40;
      } else {
        score += matchCount * 6;
      }
    }

    // Location match check
    if (loc && loc !== 'all') {
      const locHaystack = job.location.toLowerCase();
      if (loc === 'remote' && locHaystack.includes('remote')) {
        score += 15;
      } else if (locHaystack.includes(loc)) {
        score += 12;
      } else {
        score -= 25;
      }
    }

    // Salary match check (only penalize disclosed salaries or when user sets a min floor)
    if (minSal > 0) {
      if (job.numericMaxSalary > 0 && job.numericMaxSalary < minSal) {
        score -= 30;
      } else if (job.numericMinSalary >= minSal) {
        score += 10;
      }
    }

    if (maxSal < 1000000 && job.numericMinSalary > maxSal) {
      score -= 15;
    }

    // Urgency match
    if (urgencyFilter !== 'All' && job.urgency === urgencyFilter) {
      score += 5;
    }

    // Sector match
    if (sectorFilter !== 'All' && job.sector.toLowerCase().includes(sectorFilter.toLowerCase())) {
      score += 10;
    }

    return {
      ...job,
      matchScore: Math.min(99, Math.max(35, score))
    };
  });

  // Filter out severely mismatched jobs if search queries were specified
  const filtered = scored.filter((job) => {
    if (kwTokens.length > 0) {
      const haystack = `${job.title} ${job.company} ${job.sector} ${job.department || ''} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
      const hasAnyToken = kwTokens.some((t) => haystack.includes(t));
      if (!hasAnyToken) return false;
    }

    if (loc && loc !== 'all') {
      const locHaystack = job.location.toLowerCase();
      if (loc === 'remote' && !locHaystack.includes('remote')) return false;
      if (loc !== 'remote' && !locHaystack.includes(loc)) return false;
    }

    // If user requested a specific min salary floor, require disclosed salary >= floor
    if (minSal > 0 && (job.numericMaxSalary === 0 || job.numericMaxSalary < minSal)) {
      return false;
    }

    if (maxSal > 0 && maxSal < 1000000 && job.numericMinSalary > maxSal) {
      return false;
    }

    if (urgencyFilter !== 'All' && job.urgency !== urgencyFilter) {
      return false;
    }

    return true;
  });

  // Sort by match score descending
  filtered.sort((a, b) => b.matchScore - a.matchScore);

  // Identify most relevant sector from matched jobs
  const sectorCounts: Record<string, number> = {};
  filtered.forEach((j) => {
    sectorCounts[j.sector] = (sectorCounts[j.sector] || 0) + 1;
  });
  let matchedSector = 'Frontier AI & High-Performance Compute';
  let maxCount = 0;
  for (const [sec, count] of Object.entries(sectorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      matchedSector = sec;
    }
  }

  return {
    jobs: filtered.length > 0 ? filtered : scored.slice(0, 4), // Fallback to best candidates if too restrictive
    totalCount: filtered.length,
    matchedSector,
    recommendedKeywords: ['CUDA & Triton', 'Distributed InfiniBand', 'Zero Trust GovCloud', 'C++23 Market Microstructure', 'ROS 2 & Perception']
  };
}

export function generateCareerPath(params?: CareerInput): CareerPathResult {
  const currentRole = params?.currentRole?.trim() || 'Senior Software Engineer';
  const targetRole = params?.targetRole?.trim() || 'Principal AI Systems Architect';
  const exp = Number(params?.yearsExperience) || 6;
  const currentSal = Number(params?.currentSalary) || 165000;
  const targetSal = Number(params?.targetSalary) || Math.round(currentSal * 1.6);

  const baseSalary = currentSal > 50000 ? currentSal : 165000;
  const targetSalary = targetSal > baseSalary ? targetSal : Math.round(baseSalary * 1.6);
  const salaryDelta = targetSalary - baseSalary;

  const salaryProgression = [
    { name: 'Now', salary: baseSalary, percentile: 68 },
    { name: '+1yr', salary: Math.round(baseSalary + salaryDelta * 0.22), percentile: 74 },
    { name: '+2yr', salary: Math.round(baseSalary + salaryDelta * 0.45), percentile: 82 },
    { name: '+3yr', salary: Math.round(baseSalary + salaryDelta * 0.68), percentile: 89 },
    { name: '+4yr', salary: Math.round(baseSalary + salaryDelta * 0.88), percentile: 94 },
    { name: '+5yr', salary: targetSalary, percentile: 98 },
  ];

  const currentYear = new Date().getFullYear();
  const forecastDemand = [
    { year: `${currentYear}`, demand: 4200, growthRate: '+18%' },
    { year: `${currentYear + 1}`, demand: 5900, growthRate: '+24%' },
    { year: `${currentYear + 2}`, demand: 8100, growthRate: '+31%' },
    { year: `${currentYear + 3}`, demand: 10400, growthRate: '+28%' },
    { year: `${currentYear + 4}`, demand: 13800, growthRate: '+33%' },
  ];

  // Tailor skills based on target role
  const isRobotics = targetRole.toLowerCase().includes('robot') || targetRole.toLowerCase().includes('autonomous');
  const isQuant = targetRole.toLowerCase().includes('quant') || targetRole.toLowerCase().includes('hft');
  const isSecurity = targetRole.toLowerCase().includes('security') || targetRole.toLowerCase().includes('cyber') || targetRole.toLowerCase().includes('zero trust');

  let skillGaps = [
    {
      skill: 'Large-Scale Distributed Training & Cluster Interconnects (InfiniBand, RoCE)',
      importance: 'Critical' as const,
      currentLevel: 45,
      targetLevel: 92,
    },
    {
      skill: 'Hardware-Aware Inference Acceleration (TensorRT-LLM, FlashAttention-3, Triton)',
      importance: 'Critical' as const,
      currentLevel: 55,
      targetLevel: 95,
    },
    {
      skill: 'Autonomous Agent Orchestration & Verification Testbeds',
      importance: 'High' as const,
      currentLevel: 62,
      targetLevel: 90,
    },
    {
      skill: 'Executive Technical Influence & Architecture Governance',
      importance: 'High' as const,
      currentLevel: 70,
      targetLevel: 94,
    },
    {
      skill: 'Sovereign Cloud & High-Assurance Security Frameworks',
      importance: 'Moderate' as const,
      currentLevel: 58,
      targetLevel: 85,
    },
  ];

  if (isRobotics) {
    skillGaps = [
      { skill: 'Real-Time ROS 2 & Distributed Micro-ROS Nodes', importance: 'Critical', currentLevel: 48, targetLevel: 94 },
      { skill: 'Edge GPU Inference & CUDA TensorRT Optimization', importance: 'Critical', currentLevel: 52, targetLevel: 96 },
      { skill: 'Visual-Inertial Odometry & 3D LiDAR SLAM', importance: 'High', currentLevel: 58, targetLevel: 91 },
      { skill: 'Hardware-in-the-Loop (HIL) Flight / Actuator Testing', importance: 'High', currentLevel: 64, targetLevel: 88 },
      { skill: 'FAA / ISO 26262 Functional Safety Architecture', importance: 'Moderate', currentLevel: 40, targetLevel: 84 },
    ];
  } else if (isQuant) {
    skillGaps = [
      { skill: 'Modern C++23, SIMD & Cache Line Alignment', importance: 'Critical', currentLevel: 58, targetLevel: 98 },
      { skill: 'Kernel Bypass Networking (Solarflare OpenOnload / DPDK)', importance: 'Critical', currentLevel: 42, targetLevel: 95 },
      { skill: 'Market Microstructure & Limit Order Book Modeling', importance: 'High', currentLevel: 50, targetLevel: 92 },
      { skill: 'FPGA Hardware Acceleration & PCIe Interconnects', importance: 'High', currentLevel: 35, targetLevel: 86 },
      { skill: 'Real-Time Statistical Arbitrage & Risk Telemetry', importance: 'Moderate', currentLevel: 60, targetLevel: 89 },
    ];
  } else if (isSecurity) {
    skillGaps = [
      { skill: 'Zero Trust Architecture & Cryptographic Enclaves', importance: 'Critical', currentLevel: 54, targetLevel: 96 },
      { skill: 'FedRAMP High & IL-5/IL-6 Sovereign Cloud Compliance', importance: 'Critical', currentLevel: 46, targetLevel: 92 },
      { skill: 'Automated Threat Modeling & Memory-Safe Rust Rewrites', importance: 'High', currentLevel: 62, targetLevel: 90 },
      { skill: 'Side-Channel Telemetry & Hardware Security Modules (HSM)', importance: 'High', currentLevel: 45, targetLevel: 86 },
      { skill: 'Enterprise Identity Governance & Multi-Cloud IAM', importance: 'Moderate', currentLevel: 68, targetLevel: 92 },
    ];
  }

  const milestones = [
    {
      step: 1,
      phase: 'Technical Specialization & Benchmark Anchoring',
      duration: 'Months 1 - 4',
      goals: [
        `Complete deep kernel profiling aligned with ${targetRole} standards`,
        'Lead architectural RFC demonstrating verifiable throughput or latency gains',
        'Publish reproducible technical benchmark or high-visibility industry writeup'
      ],
      criticalSkills: skillGaps.slice(0, 2).map((s) => s.skill.split('(')[0].trim())
    },
    {
      step: 2,
      phase: 'Systems Scale & Multi-Team Technical Influence',
      duration: 'Months 5 - 10',
      goals: [
        'Orchestrate cross-functional initiative reducing operational infrastructure burn by 20%+',
        'Establish technical sponsorship with VP/Director peers in target industry',
        'Demonstrate executive governance and hiring bar calibration'
      ],
      criticalSkills: skillGaps.slice(2, 4).map((s) => s.skill.split('(')[0].trim())
    },
    {
      step: 3,
      phase: 'Target Role Acquisition & Compensation Execution',
      duration: 'Months 11 - 16',
      goals: [
        `Finalize formal transition to ${targetRole}`,
        `Secure verified compensation package targeting $${targetSalary.toLocaleString()}`,
        'Establish patent portfolio or strategic advisory seat'
      ],
      criticalSkills: ['CapEx / OpEx Optimization', 'Multi-Million Tier Vendor Negotiation', 'Talent Magnetism']
    }
  ];

  const matchingJobs = DEFAULT_JOB_ALERTS.filter(
    (j) => j.title.toLowerCase().includes(targetRole.toLowerCase().split(' ')[0]) ||
           j.skills.some((s) => targetRole.toLowerCase().includes(s.toLowerCase()))
  );

  const tacticalAdvice = [
    `Targeting ${targetRole} currently yields an average market premium of +${Math.round(((targetSalary - baseSalary) / baseSalary) * 100)}% over your baseline.`,
    'Focus interview preparation on architecture trade-offs under degraded network and high-concurrency failure modes.',
    'Anchor early negotiation rounds on total target compensation with liquid vesting schedules.',
    'Leverage live radar signals to obtain competing offers from peer ventures before signing.'
  ];

  return {
    currentRole,
    targetRole,
    readinessScore: 78,
    estimatedTimelineMonths: 14,
    targetSalary,
    salaryProgression,
    forecastDemand,
    milestones,
    skillGaps,
    tacticalAdvice,
    matchingJobsCount: Math.max(1, matchingJobs.length)
  };
}

export function generateIntelBrief(company?: string, sector?: string, keywords?: string): IntelBrief {
  const targetCompany = company?.trim() || 'Anthropic & OpenAI Ecosystem';
  const targetSector = sector?.trim() || 'Frontier AI & High-Performance Compute';

  const dateNow = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const kwHighlight = keywords ? ` Specifically highlighting competencies in ${keywords}.` : '';

  return {
    company: targetCompany,
    sector: targetSector,
    generatedAt: dateNow,
    sentiment: 'Aggressive Hiring',
    hiringVelocityScore: 94,
    summary: `Strategic intel reconnaissance indicates ${targetCompany} is executing aggressive talent poaching across ${targetSector}, prioritizing systems infrastructure, distributed scheduling, and post-training reinforcement learning researchers.${kwHighlight}`,
    keySignals: [
      `38% increase in stealth requisitions over the past 45 days in ${targetSector}.`,
      'Sign-on bonus packages in this sector are currently clearing $75,000 - $180,000 upfront.',
      'Active bidding wars observed between hyperscalers and top research labs for engineers with 4+ years cluster experience.',
      'Remote flexibility remains high for L6+ equivalents, with full travel stipends for quarterly offsites.'
    ],
    openRequisitionsCount: 142,
    avgCompensationBand: '$310,000 - $485,000 Total Target Compensation',
    recentDevelopments: [
      {
        headline: `${targetCompany} expands dedicated inference optimization task force`,
        date: '3 days ago',
        source: 'Silicon Intel Intercept',
        impact: 'Positive'
      },
      {
        headline: `Multi-gigawatt computing agreement signed with major sovereign power provider in ${targetSector}`,
        date: '5 days ago',
        source: 'Global Compute Wire',
        impact: 'Positive'
      },
      {
        headline: `New patent filings reveal novel hierarchical token pruning and memory-efficient KV cache`,
        date: '1 week ago',
        source: 'USPTO Radar',
        impact: 'Neutral'
      },
      {
        headline: `Competitor executive talent attrition accelerating toward new spinout ventures in ${targetSector}`,
        date: '2 weeks ago',
        source: 'Market Confidential',
        impact: 'Positive'
      }
    ],
    strategicAssessment: `Candidate positioning opportunity is at an all-time peak for Q4. Market participants who demonstrate expertise in ${targetSector} command immediate expedited interview loops.`
  };
}

export function getCommsData(): CommsMessage[] {
  return [];
}
