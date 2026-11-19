// Quantitative Market Analytics Engine & Evolving Salary Trajectories

export interface SectorSalaryDataPoint {
  year: string;
  aiCompute: number;
  robotics: number;
  fintechQuant: number;
  cyberDefense: number;
  cloudSystems: number;
  biotechML: number;
  spaceTech?: number;
  genomics?: number;
  cleanEnergyGrid?: number;
  userFocusedSalary?: number;
}

export interface CareerPathProfile {
  id: string;
  title: string;
  sectorKey: 'aiCompute' | 'robotics' | 'fintechQuant' | 'cyberDefense' | 'cloudSystems' | 'biotechML' | 'spaceTech' | 'genomics' | 'cleanEnergyGrid';
  sectorLabel: string;
  baseSalary2026: number;
  ttc2026: number; // Total Target Comp
  fiveYearCagr: string;
  scarcityScore: number; // 0-100
  aiResilienceScore: number; // 0-100
  compMultiplier: number;
  growthDriver: string;
  keySkillsPremium: { skill: string; premiumPercent: number }[];
  regionalData: { region: string; salary: number; colIndex: number; multiplier: number }[];
  percentileDistribution: {
    tier: string;
    p25: number;
    median: number;
    p75: number;
    p90: number;
  }[];
  compComposition: {
    seniority: string;
    base: number;
    bonus: number;
    equity: number;
  }[];
}

export const CAREER_PROFILES: Record<string, CareerPathProfile> = {
  ai_infra: {
    id: 'ai_infra',
    title: 'Principal AI Infrastructure & Cluster Architect',
    sectorKey: 'aiCompute',
    sectorLabel: 'Frontier AI & Accelerated Compute',
    baseSalary2026: 310000,
    ttc2026: 580000,
    fiveYearCagr: '+18.4% YoY',
    scarcityScore: 97,
    aiResilienceScore: 96,
    compMultiplier: 1.34,
    growthDriver: 'Exploding demand for 50k+ GPU cluster orchestration, multi-node inference latency reduction, and custom ASIC compiler architecture.',
    keySkillsPremium: [
      { skill: 'Distributed Sharding (Megatron / DeepSpeed)', premiumPercent: 32 },
      { skill: 'Triton / CUDA Kernel Optimization', premiumPercent: 28 },
      { skill: 'InfiniBand / RoCE v2 Network Topology', premiumPercent: 24 },
      { skill: 'FP8 / INT4 Quantization Quant Pipelines', premiumPercent: 19 },
    ],
    regionalData: [
      { region: 'San Francisco Bay Area', salary: 620000, colIndex: 182, multiplier: 1.0 },
      { region: 'New York City', salary: 575000, colIndex: 195, multiplier: 0.93 },
      { region: 'Zurich, Switzerland', salary: 510000, colIndex: 198, multiplier: 0.82 },
      { region: 'Seattle / Bellevue', salary: 540000, colIndex: 154, multiplier: 0.87 },
      { region: 'London, UK', salary: 440000, colIndex: 160, multiplier: 0.71 },
      { region: 'Singapore', salary: 460000, colIndex: 175, multiplier: 0.74 },
      { region: 'Remote Global (Tier-1 Tech)', salary: 490000, colIndex: 120, multiplier: 0.79 },
    ],
    percentileDistribution: [
      { tier: 'Junior / Entry', p25: 140000, median: 175000, p75: 215000, p90: 260000 },
      { tier: 'Mid-Level', p25: 195000, median: 245000, p75: 310000, p90: 380000 },
      { tier: 'Senior', p25: 275000, median: 360000, p75: 460000, p90: 540000 },
      { tier: 'Staff Engineer', p25: 360000, median: 470000, p75: 590000, p90: 710000 },
      { tier: 'Principal Architect', p25: 440000, median: 580000, p75: 750000, p90: 980000 },
      { tier: 'Distinguished / Fellow', p25: 620000, median: 850000, p75: 1200000, p90: 1750000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 140000, bonus: 20000, equity: 15000 },
      { seniority: 'Mid', base: 180000, bonus: 35000, equity: 30000 },
      { seniority: 'Senior', base: 230000, bonus: 55000, equity: 75000 },
      { seniority: 'Staff', base: 270000, bonus: 80000, equity: 120000 },
      { seniority: 'Principal', base: 310000, bonus: 110000, equity: 160000 },
      { seniority: 'Exec / Fellow', base: 380000, bonus: 170000, equity: 300000 },
    ],
  },

  robotics_perception: {
    id: 'robotics_perception',
    title: 'Perception & Sim2Real Lead (Humanoids & Spatial AI)',
    sectorKey: 'robotics',
    sectorLabel: 'Autonomous Systems & Humanoid Robotics',
    baseSalary2026: 285000,
    ttc2026: 495000,
    fiveYearCagr: '+21.2% YoY',
    scarcityScore: 94,
    aiResilienceScore: 98,
    compMultiplier: 1.28,
    growthDriver: 'Physical AI transition: end-to-end vision-language-action (VLA) models, reinforcement learning from physics simulators, and tactile sensor fusion.',
    keySkillsPremium: [
      { skill: 'Sim2Real Domain Randomization', premiumPercent: 35 },
      { skill: 'Diffusion Policy Action Models', premiumPercent: 30 },
      { skill: 'Isaac Gym / MuJoCo GPU Sim', premiumPercent: 25 },
      { skill: 'Point Cloud LiDAR / NeRF Spatial Fusion', premiumPercent: 22 },
    ],
    regionalData: [
      { region: 'San Francisco Bay Area', salary: 530000, colIndex: 182, multiplier: 1.0 },
      { region: 'Boston / Cambridge Hub', salary: 490000, colIndex: 170, multiplier: 0.92 },
      { region: 'Munich / Stuttgart (Auto Hub)', salary: 410000, colIndex: 150, multiplier: 0.77 },
      { region: 'Tokyo, Japan', salary: 380000, colIndex: 145, multiplier: 0.72 },
      { region: 'Pittsburgh (Carnegie Cluster)', salary: 440000, colIndex: 125, multiplier: 0.83 },
      { region: 'Zurich (ETH Robotics Cluster)', salary: 480000, colIndex: 198, multiplier: 0.9 },
    ],
    percentileDistribution: [
      { tier: 'Junior / Entry', p25: 125000, median: 155000, p75: 190000, p90: 230000 },
      { tier: 'Mid-Level', p25: 175000, median: 220000, p75: 275000, p90: 335000 },
      { tier: 'Senior', p25: 245000, median: 320000, p75: 410000, p90: 485000 },
      { tier: 'Staff Engineer', p25: 320000, median: 420000, p75: 530000, p90: 640000 },
      { tier: 'Principal / Lead', p25: 390000, median: 495000, p75: 660000, p90: 840000 },
      { tier: 'VP / Fellow', p25: 520000, median: 720000, p75: 980000, p90: 1400000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 130000, bonus: 15000, equity: 10000 },
      { seniority: 'Mid', base: 170000, bonus: 30000, equity: 20000 },
      { seniority: 'Senior', base: 215000, bonus: 45000, equity: 60000 },
      { seniority: 'Staff', base: 250000, bonus: 70000, equity: 100000 },
      { seniority: 'Principal', base: 285000, bonus: 90000, equity: 120000 },
      { seniority: 'Exec / Fellow', base: 340000, bonus: 150000, equity: 230000 },
    ],
  },

  quant_research: {
    id: 'quant_research',
    title: 'Lead Quantitative Researcher & Alpha Developer',
    sectorKey: 'fintechQuant',
    sectorLabel: 'Quantitative Finance & High-Frequency Trading',
    baseSalary2026: 325000,
    ttc2026: 720000,
    fiveYearCagr: '+16.5% YoY',
    scarcityScore: 99,
    aiResilienceScore: 95,
    compMultiplier: 1.48,
    growthDriver: 'Application of transformers to tick-level order book dynamics, statistical arbitrage, and multi-asset latency reduction under sub-100 nanoseconds.',
    keySkillsPremium: [
      { skill: 'Ultra-Low-Latency C++23 / FPGA', premiumPercent: 38 },
      { skill: 'Statistical Arbitrage Alpha Research', premiumPercent: 34 },
      { skill: 'Reinforcement Learning Market Making', premiumPercent: 29 },
      { skill: 'Cross-Asset Volatility Modeling', premiumPercent: 25 },
    ],
    regionalData: [
      { region: 'New York City (Wall St / Midtown)', salary: 760000, colIndex: 195, multiplier: 1.0 },
      { region: 'Chicago (Trading Hub)', salary: 690000, colIndex: 140, multiplier: 0.91 },
      { region: 'London, City & Mayfair', salary: 620000, colIndex: 160, multiplier: 0.82 },
      { region: 'Singapore (Marina Bay)', salary: 590000, colIndex: 175, multiplier: 0.78 },
      { region: 'Hong Kong (Central)', salary: 560000, colIndex: 180, multiplier: 0.74 },
      { region: 'Amsterdam (Optiver / Flow Hub)', salary: 540000, colIndex: 155, multiplier: 0.71 },
    ],
    percentileDistribution: [
      { tier: 'Junior / Analyst', p25: 180000, median: 240000, p75: 320000, p90: 420000 },
      { tier: 'Mid-Level Quant', p25: 260000, median: 380000, p75: 520000, p90: 680000 },
      { tier: 'Senior Quant Trader', p25: 390000, median: 560000, p75: 780000, p90: 1050000 },
      { tier: 'Lead Alpha Researcher', p25: 520000, median: 720000, p75: 1100000, p90: 1650000 },
      { tier: 'Portfolio Manager (PM)', p25: 750000, median: 1250000, p75: 2200000, p90: 4500000 },
      { tier: 'Partner / Head of Trading', p25: 1200000, median: 2400000, p75: 4800000, p90: 9500000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 160000, bonus: 80000, equity: 0 },
      { seniority: 'Mid', base: 210000, bonus: 170000, equity: 0 },
      { seniority: 'Senior', base: 260000, bonus: 300000, equity: 0 },
      { seniority: 'Lead', base: 325000, bonus: 395000, equity: 0 },
      { seniority: 'PM Tier', base: 375000, bonus: 875000, equity: 0 },
      { seniority: 'Partner', base: 450000, bonus: 1950000, equity: 0 },
    ],
  },

  cyber_defense: {
    id: 'cyber_defense',
    title: 'Principal Security Architect & Zero-Trust Engineer',
    sectorKey: 'cyberDefense',
    sectorLabel: 'Zero-Trust Cybersecurity & Defense Tech',
    baseSalary2026: 275000,
    ttc2026: 450000,
    fiveYearCagr: '+14.2% YoY',
    scarcityScore: 91,
    aiResilienceScore: 94,
    compMultiplier: 1.18,
    growthDriver: 'Nation-state cyber escalation, post-quantum cryptographic migration, hardware enclaves (SGX/SEV), and AI red-teaming guardrails.',
    keySkillsPremium: [
      { skill: 'Post-Quantum Cryptography (Kyber/Dilithium)', premiumPercent: 31 },
      { skill: 'Hardware Enclave & TEE Architecture', premiumPercent: 26 },
      { skill: 'AI Model Red-Teaming & Jailbreak Defense', premiumPercent: 24 },
      { skill: 'eBPF Kernel Telemetry & Real-Time Isolation', premiumPercent: 20 },
    ],
    regionalData: [
      { region: 'Washington D.C. / Northern VA', salary: 470000, colIndex: 165, multiplier: 1.0 },
      { region: 'San Francisco Bay Area', salary: 490000, colIndex: 182, multiplier: 1.04 },
      { region: 'Tel Aviv, Israel', salary: 430000, colIndex: 160, multiplier: 0.91 },
      { region: 'London, UK (Cheltenham Hub)', salary: 380000, colIndex: 160, multiplier: 0.81 },
      { region: 'Canberra / Sydney, Australia', salary: 370000, colIndex: 155, multiplier: 0.79 },
      { region: 'Austin, Texas', salary: 410000, colIndex: 122, multiplier: 0.87 },
    ],
    percentileDistribution: [
      { tier: 'Junior / SecOps', p25: 110000, median: 135000, p75: 165000, p90: 205000 },
      { tier: 'Mid-Level Engineer', p25: 155000, median: 195000, p75: 245000, p90: 300000 },
      { tier: 'Senior Architect', p25: 220000, median: 290000, p75: 370000, p90: 440000 },
      { tier: 'Staff / Principal', p25: 290000, median: 390000, p75: 490000, p90: 590000 },
      { tier: 'Chief Architect / Fellow', p25: 370000, median: 480000, p75: 620000, p90: 780000 },
      { tier: 'CISO / VP Security', p25: 460000, median: 650000, p75: 890000, p90: 1200000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 115000, bonus: 12000, equity: 8000 },
      { seniority: 'Mid', base: 155000, bonus: 22000, equity: 18000 },
      { seniority: 'Senior', base: 205000, bonus: 40000, equity: 45000 },
      { seniority: 'Staff', base: 245000, bonus: 60000, equity: 85000 },
      { seniority: 'Principal', base: 275000, bonus: 75000, equity: 100000 },
      { seniority: 'VP / CISO', base: 330000, bonus: 130000, equity: 190000 },
    ],
  },

  cloud_distributed: {
    id: 'cloud_distributed',
    title: 'Staff Distributed Systems & Kernel Engineer',
    sectorKey: 'cloudSystems',
    sectorLabel: 'Distributed Systems & Cloud Infrastructure',
    baseSalary2026: 280000,
    ttc2026: 510000,
    fiveYearCagr: '+13.8% YoY',
    scarcityScore: 92,
    aiResilienceScore: 93,
    compMultiplier: 1.22,
    growthDriver: 'Hyperscale edge computing, high-throughput storage engines (NVMe over Fabrics), Raft consensus scaling, and zero-downtime database sharding.',
    keySkillsPremium: [
      { skill: 'Rust Async Systems / Tokio Kernel', premiumPercent: 29 },
      { skill: 'Distributed Consensus (Raft / Paxos)', premiumPercent: 27 },
      { skill: 'Linux Kernel eBPF / io_uring', premiumPercent: 25 },
      { skill: 'High-Concurrency LSM Tree DBs', premiumPercent: 21 },
    ],
    regionalData: [
      { region: 'Seattle (AWS / Azure Corridor)', salary: 540000, colIndex: 154, multiplier: 1.0 },
      { region: 'San Francisco Bay Area', salary: 550000, colIndex: 182, multiplier: 1.02 },
      { region: 'New York City', salary: 510000, colIndex: 195, multiplier: 0.94 },
      { region: 'Austin, Texas', salary: 460000, colIndex: 122, multiplier: 0.85 },
      { region: 'Vancouver, Canada', salary: 390000, colIndex: 140, multiplier: 0.72 },
      { region: 'Dublin, Ireland (Cloud Hub)', salary: 420000, colIndex: 155, multiplier: 0.78 },
    ],
    percentileDistribution: [
      { tier: 'Junior / Cloud Dev', p25: 120000, median: 150000, p75: 185000, p90: 225000 },
      { tier: 'Mid-Level Systems', p25: 170000, median: 215000, p75: 270000, p90: 330000 },
      { tier: 'Senior Distributed', p25: 235000, median: 310000, p75: 395000, p90: 470000 },
      { tier: 'Staff Systems Eng', p25: 310000, median: 410000, p75: 520000, p90: 630000 },
      { tier: 'Principal Architect', p25: 390000, median: 510000, p75: 670000, p90: 820000 },
      { tier: 'Distinguished Eng', p25: 510000, median: 710000, p75: 960000, p90: 1350000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 125000, bonus: 15000, equity: 10000 },
      { seniority: 'Mid', base: 165000, bonus: 25000, equity: 25000 },
      { seniority: 'Senior', base: 210000, bonus: 40000, equity: 60000 },
      { seniority: 'Staff', base: 250000, bonus: 60000, equity: 100000 },
      { seniority: 'Principal', base: 280000, bonus: 85000, equity: 145000 },
      { seniority: 'Fellow', base: 340000, bonus: 140000, equity: 230000 },
    ],
  },

  biotech_ml: {
    id: 'biotech_ml',
    title: 'Computational Biology & Generative Protein Designer',
    sectorKey: 'biotechML',
    sectorLabel: 'Computational Biology & Bio-Informatics',
    baseSalary2026: 270000,
    ttc2026: 465000,
    fiveYearCagr: '+17.1% YoY',
    scarcityScore: 93,
    aiResilienceScore: 97,
    compMultiplier: 1.25,
    growthDriver: 'Diffusion models for de novo protein folding, cryo-EM structure reconstruction, mRNA sequence optimization, and in-silico clinical trial candidate screening.',
    keySkillsPremium: [
      { skill: 'ESM / AlphaFold3 Latent Modeling', premiumPercent: 33 },
      { skill: 'Cryo-EM 3D Density Map Modeling', premiumPercent: 27 },
      { skill: 'Genomic Variant Effect Predictors', premiumPercent: 23 },
      { skill: 'Molecular Dynamics (GROMACS/Amber)', premiumPercent: 19 },
    ],
    regionalData: [
      { region: 'Boston / Cambridge Bio Hub', salary: 510000, colIndex: 170, multiplier: 1.0 },
      { region: 'San Francisco / South SF', salary: 520000, colIndex: 182, multiplier: 1.02 },
      { region: 'Oxford / Cambridge, UK', salary: 410000, colIndex: 150, multiplier: 0.8 },
      { region: 'Basel / Zurich Bio Valley', salary: 480000, colIndex: 198, multiplier: 0.94 },
      { region: 'San Diego (Torrey Pines Hub)', salary: 460000, colIndex: 160, multiplier: 0.9 },
      { region: 'Singapore Biopolis', salary: 430000, colIndex: 175, multiplier: 0.84 },
    ],
    percentileDistribution: [
      { tier: 'Postdoc / Bioinformatician', p25: 110000, median: 135000, p75: 165000, p90: 200000 },
      { tier: 'Scientist I / Mid-Level', p25: 155000, median: 190000, p75: 235000, p90: 290000 },
      { tier: 'Senior Scientist / ML Lead', p25: 215000, median: 280000, p75: 360000, p90: 430000 },
      { tier: 'Principal Computational Bio', p25: 285000, median: 380000, p75: 480000, p90: 590000 },
      { tier: 'Director of In-Silico Discovery', p25: 360000, median: 465000, p75: 610000, p90: 780000 },
      { tier: 'VP / Head of Bio R&D', p25: 470000, median: 660000, p75: 920000, p90: 1300000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 115000, bonus: 10000, equity: 10000 },
      { seniority: 'Mid', base: 155000, bonus: 20000, equity: 15000 },
      { seniority: 'Senior', base: 200000, bonus: 35000, equity: 45000 },
      { seniority: 'Staff', base: 240000, bonus: 55000, equity: 85000 },
      { seniority: 'Principal', base: 270000, bonus: 75000, equity: 120000 },
      { seniority: 'VP Tier', base: 330000, bonus: 125000, equity: 205000 },
    ],
  },
  space_avionics: {
    id: 'space_avionics',
    title: 'Lead Spacecraft Flight Avionics Architect',
    sectorKey: 'spaceTech',
    sectorLabel: 'Commercial SpaceTech / Defense Avionics',
    baseSalary2026: 235000,
    ttc2026: 345000,
    fiveYearCagr: '+23.4% YoY',
    scarcityScore: 97,
    aiResilienceScore: 98,
    compMultiplier: 1.28,
    growthDriver: 'Exploding orbital launch manifests, autonomous satellite constellation telemetry, and defense-critical rad-hard computing architectures.',
    keySkillsPremium: [
      { skill: 'DO-178C Level A Safety Verification', premiumPercent: 36 },
      { skill: 'Rad-Hard Flight Compute Architecture', premiumPercent: 34 },
      { skill: 'Real-Time Telemetry & SpaceWire / MIL-STD-1553', premiumPercent: 30 },
      { skill: 'Autonomous GN&C Guidance Algorithms', premiumPercent: 28 },
      { skill: 'Rust for High-Reliability Flight Software', premiumPercent: 26 },
    ],
    regionalData: [
      { region: 'Austin / Texas Space Coast', salary: 345000, colIndex: 122, multiplier: 1.0 },
      { region: 'Los Angeles (El Segundo Aerospace)', salary: 375000, colIndex: 152, multiplier: 1.09 },
      { region: 'Denver / Colorado Space Hub', salary: 330000, colIndex: 125, multiplier: 0.96 },
      { region: 'Seattle Aerospace Arc', salary: 350000, colIndex: 138, multiplier: 1.01 },
      { region: 'London / European Space Arc', salary: 285000, colIndex: 130, multiplier: 0.83 },
    ],
    percentileDistribution: [
      { tier: 'Foundational (0-2 YOE)', p25: 140000, median: 165000, p75: 195000, p90: 220000 },
      { tier: 'Senior Avionics (3-6 YOE)', p25: 195000, median: 235000, p75: 280000, p90: 320000 },
      { tier: 'Staff / Mission Lead (7-10 YOE)', p25: 255000, median: 310000, p75: 375000, p90: 440000 },
      { tier: 'Chief Flight Architect (10+ YOE)', p25: 325000, median: 410000, p75: 520000, p90: 650000 },
      { tier: 'VP / Space Mission Systems', p25: 450000, median: 580000, p75: 750000, p90: 1050000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 130000, bonus: 15000, equity: 20000 },
      { seniority: 'Mid', base: 170000, bonus: 25000, equity: 40000 },
      { seniority: 'Senior', base: 215000, bonus: 40000, equity: 90000 },
      { seniority: 'Staff', base: 255000, bonus: 60000, equity: 135000 },
      { seniority: 'Principal', base: 295000, bonus: 85000, equity: 190000 },
      { seniority: 'VP Tier', base: 360000, bonus: 140000, equity: 350000 },
    ],
  },
  comp_genomics: {
    id: 'comp_genomics',
    title: 'Principal Computational Genomics Researcher',
    sectorKey: 'genomics',
    sectorLabel: 'Computational Genomics & Precision Bio-ML',
    baseSalary2026: 215000,
    ttc2026: 310000,
    fiveYearCagr: '+20.8% YoY',
    scarcityScore: 94,
    aiResilienceScore: 96,
    compMultiplier: 1.22,
    growthDriver: 'Whole-genome variant calling, AlphaFold3 multi-modal molecular modeling, and single-cell spatial transcriptomics at petabyte scale.',
    keySkillsPremium: [
      { skill: 'Variant Calling Pipeline Engineering (Nextflow)', premiumPercent: 33 },
      { skill: 'AlphaFold3 & Structural Biomolecule ML', premiumPercent: 32 },
      { skill: 'Single-Cell RNA-Seq Spatial Clustering', premiumPercent: 28 },
      { skill: 'Distributed Bio-Data (VCF / Parquet / Hail)', premiumPercent: 26 },
      { skill: 'High-Performance Rust Bio Algorithms', premiumPercent: 25 },
    ],
    regionalData: [
      { region: 'Stockholm (Nordic LifeSci)', salary: 285000, colIndex: 110, multiplier: 0.92 },
      { region: 'Boston / Cambridge Bio Arc', salary: 340000, colIndex: 148, multiplier: 1.10 },
      { region: 'San Francisco Bay Area', salary: 355000, colIndex: 165, multiplier: 1.15 },
      { region: 'London / Oxford Arc', salary: 290000, colIndex: 130, multiplier: 0.94 },
      { region: 'Zurich BioTech Corridor', salary: 320000, colIndex: 170, multiplier: 1.03 },
    ],
    percentileDistribution: [
      { tier: 'Foundational (0-2 YOE)', p25: 125000, median: 150000, p75: 180000, p90: 205000 },
      { tier: 'Senior Genomics (3-6 YOE)', p25: 180000, median: 215000, p75: 260000, p90: 295000 },
      { tier: 'Staff Bio-ML (7-10 YOE)', p25: 235000, median: 285000, p75: 345000, p90: 410000 },
      { tier: 'Principal Genomics Architect', p25: 295000, median: 370000, p75: 470000, p90: 580000 },
      { tier: 'Head of Computational Genomics', p25: 410000, median: 540000, p75: 720000, p90: 950000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 120000, bonus: 15000, equity: 15000 },
      { seniority: 'Mid', base: 160000, bonus: 20000, equity: 35000 },
      { seniority: 'Senior', base: 200000, bonus: 35000, equity: 75000 },
      { seniority: 'Staff', base: 240000, bonus: 50000, equity: 120000 },
      { seniority: 'Principal', base: 280000, bonus: 70000, equity: 170000 },
      { seniority: 'VP Tier', base: 340000, bonus: 120000, equity: 290000 },
    ],
  },
  energy_grid: {
    id: 'energy_grid',
    title: 'Next-Gen Energy Grid Optimization Architect',
    sectorKey: 'cleanEnergyGrid',
    sectorLabel: 'Next-Gen Energy Grid Optimization',
    baseSalary2026: 220000,
    ttc2026: 325000,
    fiveYearCagr: '+22.1% YoY',
    scarcityScore: 95,
    aiResilienceScore: 97,
    compMultiplier: 1.25,
    growthDriver: 'High-density multi-gigawatt AI data center power microgrids, distributed energy resource management (DERMS), and real-time battery storage arbitrage.',
    keySkillsPremium: [
      { skill: 'Smart Grid SCADA & Real-Time OpenDSS', premiumPercent: 35 },
      { skill: 'DERMS Dynamic Dispatch Algorithms', premiumPercent: 32 },
      { skill: 'Grid-Scale Battery Storage Management', premiumPercent: 30 },
      { skill: 'Power Flow Simulation (PyPSA / MATPOWER)', premiumPercent: 27 },
      { skill: 'Reinforcement Learning for Grid Balancing', premiumPercent: 25 },
    ],
    regionalData: [
      { region: 'Toronto Clean Energy Arc', salary: 325000, colIndex: 120, multiplier: 1.0 },
      { region: 'Austin / ERCOT Grid Hub', salary: 335000, colIndex: 122, multiplier: 1.03 },
      { region: 'San Francisco / CAISO Hub', salary: 360000, colIndex: 165, multiplier: 1.11 },
      { region: 'Berlin / European Smart Grid Arc', salary: 275000, colIndex: 115, multiplier: 0.85 },
      { region: 'Sydney / Australian Energy Market', salary: 295000, colIndex: 132, multiplier: 0.91 },
    ],
    percentileDistribution: [
      { tier: 'Foundational (0-2 YOE)', p25: 130000, median: 155000, p75: 185000, p90: 210000 },
      { tier: 'Senior Grid Engineer (3-6 YOE)', p25: 185000, median: 220000, p75: 270000, p90: 305000 },
      { tier: 'Staff DERMS Architect (7-10 YOE)', p25: 240000, median: 295000, p75: 360000, p90: 420000 },
      { tier: 'Principal Energy Systems Lead', p25: 305000, median: 390000, p75: 490000, p90: 610000 },
      { tier: 'VP / Clean Compute & Power Systems', p25: 430000, median: 560000, p75: 740000, p90: 980000 },
    ],
    compComposition: [
      { seniority: 'Junior', base: 125000, bonus: 15000, equity: 15000 },
      { seniority: 'Mid', base: 165000, bonus: 25000, equity: 30000 },
      { seniority: 'Senior', base: 205000, bonus: 35000, equity: 85000 },
      { seniority: 'Staff', base: 245000, bonus: 55000, equity: 125000 },
      { seniority: 'Principal', base: 285000, bonus: 75000, equity: 180000 },
      { seniority: 'VP Tier', base: 350000, bonus: 130000, equity: 320000 },
    ],
  },
};

// Generates time series data (2020 - 2027 Projected) dynamically calibrated to career profile
export function generateSalaryTimeline(selectedProfileKey: string): SectorSalaryDataPoint[] {
  const profile = CAREER_PROFILES[selectedProfileKey] || CAREER_PROFILES.ai_infra;
  const mult = profile.compMultiplier;

  return [
    {
      year: '2020',
      aiCompute: 220000,
      robotics: 195000,
      fintechQuant: 310000,
      cyberDefense: 190000,
      cloudSystems: 215000,
      biotechML: 180000,
      userFocusedSalary: Math.round(205000 * (mult * 0.88)),
    },
    {
      year: '2021',
      aiCompute: 260000,
      robotics: 215000,
      fintechQuant: 370000,
      cyberDefense: 210000,
      cloudSystems: 250000,
      biotechML: 205000,
      userFocusedSalary: Math.round(245000 * (mult * 0.9)),
    },
    {
      year: '2022',
      aiCompute: 310000,
      robotics: 240000,
      fintechQuant: 440000,
      cyberDefense: 235000,
      cloudSystems: 285000,
      biotechML: 230000,
      userFocusedSalary: Math.round(295000 * (mult * 0.94)),
    },
    {
      year: '2023',
      aiCompute: 380000,
      robotics: 280000,
      fintechQuant: 495000,
      cyberDefense: 265000,
      cloudSystems: 320000,
      biotechML: 260000,
      userFocusedSalary: Math.round(360000 * (mult * 0.97)),
    },
    {
      year: '2024',
      aiCompute: 460000,
      robotics: 340000,
      fintechQuant: 560000,
      cyberDefense: 310000,
      cloudSystems: 375000,
      biotechML: 315000,
      userFocusedSalary: Math.round(440000 * mult),
    },
    {
      year: '2025',
      aiCompute: 530000,
      robotics: 420000,
      fintechQuant: 640000,
      cyberDefense: 370000,
      cloudSystems: 440000,
      biotechML: 385000,
      userFocusedSalary: Math.round(510000 * (mult * 1.04)),
    },
    {
      year: '2026 (Live)',
      aiCompute: 580000,
      robotics: 495000,
      fintechQuant: 720000,
      cyberDefense: 450000,
      cloudSystems: 510000,
      biotechML: 465000,
      userFocusedSalary: profile.ttc2026,
    },
    {
      year: '2027 (Proj)',
      aiCompute: 645000,
      robotics: 580000,
      fintechQuant: 810000,
      cyberDefense: 520000,
      cloudSystems: 580000,
      biotechML: 540000,
      userFocusedSalary: Math.round(profile.ttc2026 * 1.15),
    },
  ];
}

// Maps arbitrary career title strings from the app to the closest profile
export function matchCareerProfile(roleTitle?: string): string {
  if (!roleTitle) return 'ai_infra';
  const lower = roleTitle.toLowerCase();
  if (lower.includes('quant') || lower.includes('trading') || lower.includes('alpha') || lower.includes('hft')) {
    return 'quant_research';
  }
  if (lower.includes('robot') || lower.includes('sim2real') || lower.includes('autonom') || lower.includes('perception')) {
    return 'robotics_perception';
  }
  if (lower.includes('security') || lower.includes('cyber') || lower.includes('zero-trust') || lower.includes('defense')) {
    return 'cyber_defense';
  }
  if (lower.includes('cloud') || lower.includes('distribut') || lower.includes('kernel') || lower.includes('rust')) {
    return 'cloud_distributed';
  }
  if (lower.includes('bio') || lower.includes('genom') || lower.includes('protein') || lower.includes('pharma')) {
    return 'biotech_ml';
  }
  return 'ai_infra';
}
