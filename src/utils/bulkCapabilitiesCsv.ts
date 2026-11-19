// Master Bulk Annual Capabilities CSV Exporter with exact columns: item name, item description, price


export interface CapabilityItem {
  itemName: string;
  itemDescription: string;
  price: string;
  category?: string;
}

/**
 * Master catalog of all the website's annual capabilities, software modules,
 * commercial packages, career trajectory benchmarks, and specialized tools.
 */
export const WEBSITE_ANNUAL_CAPABILITIES: CapabilityItem[] = [
  // ==========================================
  // 1. CORE PLATFORM CAPABILITIES & SOFTWARE MODULES
  // ==========================================
  {
    itemName: '3D Geospatial Requisition Radar',
    itemDescription: 'Real-time WebGL and React Three Fiber orbital globe visualizer tracking global engineering requisitions, talent densities, and salary bands across 6 continents at 60 FPS.',
    price: '$18,000 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Market Salary Analytics & Projections Engine',
    itemDescription: 'Comprehensive 2020-2027 forward-calibrated compensation timelines, seniority percentile distributions (P25, P50, P75, P90), and multi-sector regression forecasting models.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Interactive D3 Force-Directed Skill Tree',
    itemDescription: 'Physics-simulated directed acyclic graph mapping prerequisite skill dependencies, mastery tiers, and compensation deltas across 6 frontier technology domains.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Autonomous 4-Agent AI Triad (Commander, Scout, Strategist, Envoy)',
    itemDescription: 'Multi-agent state machine utilizing Google Gemini 3.8 Flash for 24/7 continuous talent reconnaissance, counter-offer modeling, and automated recruiter interaction.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'StealthNet Zero-Knowledge Anonymous Network',
    itemDescription: 'Cryptographic availability broadcast protocol with ZK verification badges, unlisted market drops, and zero-spam encrypted employer backchannels.',
    price: '$17,400 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Quantitative ZOPA & Financial Negotiation System',
    itemDescription: 'Game-theoretic bargaining engine calculating employer reservation prices, candidate salary floors, and net present value (NPV) equity dilution modeling.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'AI Career Sentiment & Stress Regulation Coach',
    itemDescription: 'Biometric and telemetry analysis of job search stress, interview anxiety, burnout risk, and strategic negotiation posture.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Commercial Acquisition & M&A Escrow Platform',
    itemDescription: 'Turnkey software asset transfer framework supporting Escrow.com, Paystack commercial settlement, and USDC smart contracts with verified legal due diligence docket.',
    price: '$145,000',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Credible Subscriber Acquisition & Referral Engine',
    itemDescription: 'Targeted regional outreach templates and /r/CODE 20%-off referral link generator for European, African, and global engineering subscribers.',
    price: '$0 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Google Cloud Run Production Hosting & Global DNS',
    itemDescription: 'Containerized high-availability infrastructure on Google Cloud Run (europe-west2) with zero cold-start latency and TLS 1.3 256-bit SSL encryption.',
    price: '$1,200 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'GitHub Source Code Repository & Live Zip Exporter',
    itemDescription: 'Complete version-controlled codebase export with architecture documentation, setup scripts, and automated Docker multi-stage buildfiles.',
    price: '$145,000',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Real-Time Headhunter Comms Telemetry Intercept',
    itemDescription: 'Automated executive search outreach analyzer classifying message urgency, comp bands, and firm reputational score.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'AI Career Supervisor Strategic Analysis Engine',
    itemDescription: 'Real-time strategic career recommendations, leverage-point auditing, and high-velocity market signal telemetry.',
    price: '$948 / year',
    category: 'Platform & Modules',
  },
  {
    itemName: 'Multi-Sector Job Alerts Notification Drawer',
    itemDescription: 'Custom threshold alerts for newly indexed high-comp roles with match percentages and instant application dispatch.',
    price: '$0 / year',
    category: 'Platform & Modules',
  },

  // ==========================================
  // 2. COMMERCIAL SUBSCRIPTIONS & LICENSING TIERS
  // ==========================================
  {
    itemName: 'Community Free Operator License',
    itemDescription: 'Access to public 3D radar scans, standard job listings, community benchmarks, and basic skill trees.',
    price: '$0 / year',
    category: 'Commercial & Licensing',
  },
  {
    itemName: 'Individual Pro Operator License (Annual)',
    itemDescription: 'Full access to 3D geospatial radar, AI Triad agents, StealthNet anonymous beacon, ZOPA negotiation calculator, and personal career trajectory projections.',
    price: '$948 / year',
    category: 'Commercial & Licensing',
  },
  {
    itemName: 'Individual Pro Operator License (Monthly)',
    itemDescription: 'Monthly rolling subscription for individual staff engineers and quants accelerating career mobility ($79/month).',
    price: '$79 / month',
    category: 'Commercial & Licensing',
  },
  {
    itemName: 'Enterprise Talent Intelligence Agency (Annual)',
    itemDescription: 'Multi-seat corporate subscription for up to 15 search partners, unmasked StealthNet hiring drops, priority intercept feed, custom compensation exports, and ATS API access.',
    price: '$17,400 / year',
    category: 'Commercial & Licensing',
  },
  {
    itemName: 'Enterprise Talent Intelligence Agency (Monthly)',
    itemDescription: 'Monthly rolling corporate subscription for hedge funds, venture capital firms, and executive search agencies ($1,450/month).',
    price: '$1,450 / month',
    category: 'Commercial & Licensing',
  },
  {
    itemName: 'Complete Source Code & Full IP Buyout Docket',
    itemDescription: '100% full transfer of copyright, patents, git repository, Three.js 3D shaders, AI agent prompt chains, and 60 days technical founder advisory.',
    price: '$145,000',
    category: 'Commercial & Licensing',
  },

  // ==========================================
  // 3. ANNUAL CAREER CAPABILITIES & 2026 SALARY BENCHMARKS
  // ==========================================
  {
    itemName: 'AI & Accelerated Compute Infrastructure Architect - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for distributed training, CUDA/Triton optimization, and large-scale cluster orchestration.',
    price: '$620,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'AI & Accelerated Compute Infrastructure Architect - Total Target Comp',
    itemDescription: 'Annual total realization capability package including base cash, performance bonuses, and liquid equity for AI infra leads.',
    price: '$1,050,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Quantitative HFT & Low-Latency Core Engineer - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for ultra-low latency C++, FPGA kernel bypass, and sub-microsecond matching engines.',
    price: '$740,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Quantitative HFT & Low-Latency Core Engineer - Total Target Comp',
    itemDescription: 'Elite quantitative hedge fund annual total package benchmark with performance profit-share and discretionary trading bonus.',
    price: '$1,420,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Autonomous Systems & Embodied Robotics Lead - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for spatial intelligence, ROS2 control loops, sensor fusion, and Isaac Sim physics.',
    price: '$495,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Autonomous Systems & Embodied Robotics Lead - Total Target Comp',
    itemDescription: 'Annual total realization compensation benchmark for autonomous vehicles and humanoid robotics engineering leadership.',
    price: '$820,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Distributed Cloud Systems Architect - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for multi-region Kubernetes, fault-tolerant consensus (Raft/Paxos), and zero-trust service mesh.',
    price: '$470,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Distributed Cloud Systems Architect - Total Target Comp',
    itemDescription: 'Global cloud infrastructure leadership annual compensation capability package with liquid RSU grants.',
    price: '$780,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Zero Trust Cyber Defense & Offensive Security Director - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for cryptographic authentication, kernel exploit defense, and automated red-team orchestration.',
    price: '$420,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Zero Trust Cyber Defense & Offensive Security Director - Total Target Comp',
    itemDescription: 'Annual total package capability benchmark for enterprise security leadership and sovereign defense technical directors.',
    price: '$690,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Computational Biology & Frontier ML Scientist - Base Salary',
    itemDescription: 'Annual baseline compensation capability benchmark for AlphaFold structural prediction, generative molecular modeling, and bioinformatics ML.',
    price: '$440,000 / year',
    category: 'Salary Benchmarks (2026)',
  },
  {
    itemName: 'Computational Biology & Frontier ML Scientist - Total Target Comp',
    itemDescription: 'Frontier AI biotech research scientist annual total compensation package benchmark with intellectual property royalties.',
    price: '$710,000 / year',
    category: 'Salary Benchmarks (2026)',
  },

  // ==========================================
  // 4. SENIORITY PROGRESSION ANNUAL CAPABILITIES
  // ==========================================
  {
    itemName: 'Junior Engineer (L3 / IC3) Annual Capabilities Benchmark',
    itemDescription: 'Feature implementation, unit testing, continuous integration adherence, and modular code delivery.',
    price: '$165,000 / year',
    category: 'Seniority Progression',
  },
  {
    itemName: 'Mid-Level Engineer (L4 / IC4) Annual Capabilities Benchmark',
    itemDescription: 'Independent subsystem ownership, service design, peer code review, and production issue resolution.',
    price: '$260,000 / year',
    category: 'Seniority Progression',
  },
  {
    itemName: 'Senior Engineer (L5 / IC5) Annual Capabilities Benchmark',
    itemDescription: 'End-to-end architecture ownership, cross-service scaling, fault isolation, and junior mentorship.',
    price: '$385,000 / year',
    category: 'Seniority Progression',
  },
  {
    itemName: 'Staff Engineer (L6 / IC6) Annual Capabilities Benchmark',
    itemDescription: 'System-wide technical leadership, multi-quarter roadmap execution, and cross-organization architectural consensus.',
    price: '$540,000 / year',
    category: 'Seniority Progression',
  },
  {
    itemName: 'Principal Engineer (L7 / IC7) Annual Capabilities Benchmark',
    itemDescription: 'Strategic technical vision, frontier problem decomposition, and firm-wide technical standard setting.',
    price: '$780,000 / year',
    category: 'Seniority Progression',
  },
  {
    itemName: 'Distinguished Engineer / Fellow (L8+ / IC8+) Annual Capabilities Benchmark',
    itemDescription: 'Industry-defining technical innovation, boardroom strategic advisement, and multi-billion dollar architecture governance.',
    price: '$1,250,000 / year',
    category: 'Seniority Progression',
  },

  // ==========================================
  // 5. HIGH-PREMIUM TECHNICAL SKILL CAPABILITIES
  // ==========================================
  {
    itemName: 'CUDA & Triton GPU Kernel Optimization Premium',
    itemDescription: 'Low-level GPU memory hierarchy tuning, flash attention customization, and warp-level tensor parallelism.',
    price: '$124,000 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'FPGA & SystemVerilog Ultra-Low Latency Trading Premium',
    itemDescription: 'Sub-nanosecond tick-to-trade hardware pipeline design and direct NIC integration.',
    price: '$148,000 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'Distributed MoE & 3D Pipeline Parallelism Premium',
    itemDescription: 'Megatron-LM, DeepSpeed, and custom collective communication scheduling at 10,000+ GPU scale.',
    price: '$111,600 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'eBPF Runtime Security & Cilium Kernel Tracing Premium',
    itemDescription: 'Programmable kernel probe instrumentation, zero-overhead observability, and network layer telemetry.',
    price: '$75,600 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'Linux Kernel Bypass (DPDK / Solarflare Onload) Premium',
    itemDescription: 'Zero-copy packet processing, ring buffer management, and realtime core isolation.',
    price: '$133,200 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'ROS2 & Isaac Sim Synthetic Robotics Simulation Premium',
    itemDescription: 'Photorealistic sensor simulation, domain randomization, and sim-to-real policy transfer.',
    price: '$89,100 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'Cryo-EM & Diffusion-Based Molecular Docking Premium',
    itemDescription: 'Structural biology ML, conformer generation, and active site binding affinity prediction.',
    price: '$92,400 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'FlashAttention & PagedAttention Implementation Premium',
    itemDescription: 'Tiling memory access patterns, IO-aware exact attention, and KV cache compression for LLM serving.',
    price: '$105,000 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'Asynchronous Rust & Lock-Free Data Structures Premium',
    itemDescription: 'Wait-free ring buffers, cache-line alignment, and crossbeam memory reclamation.',
    price: '$96,000 / year',
    category: 'Skill Premiums',
  },
  {
    itemName: 'Post-Quantum Cryptography (ML-KEM / Dilithium) Premium',
    itemDescription: 'Lattice-based encryption, NIST FIPS 203/204 standard compliance, and hybrid TLS migration.',
    price: '$88,000 / year',
    category: 'Skill Premiums',
  },

  // ==========================================
  // 6. GLOBAL METROPOLITAN ANNUAL CAPABILITIES
  // ==========================================
  {
    itemName: 'San Francisco / Silicon Valley Tech Hub Capability Benchmark',
    itemDescription: 'Core epicenter of frontier generative AI labs, accelerated compute ventures, and top-bracket compensation.',
    price: '$620,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'New York City Quantitative & AI Financial Cluster Benchmark',
    itemDescription: 'Global capital center for low-latency market making, prop trading desks, and executive tech leadership.',
    price: '$645,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'Zurich Deep Tech & Quantum Systems Hub Benchmark',
    itemDescription: 'European center for high-density systems engineering, quantum research, and low-tax compensation efficiency.',
    price: '$525,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'London Tech City & Mayfair FinTech Core Benchmark',
    itemDescription: 'Leading EMEA ecosystem for algorithmic finance, AI safety labs, and cross-border tech scaleups.',
    price: '$490,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'Singapore ASEAN FinTech & AI Trading Hub Benchmark',
    itemDescription: 'Asia-Pacific headquarters for high-frequency trading networks, sovereign wealth funds, and zero-capital-gains tech talent.',
    price: '$455,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'Tokyo Robotics & Embodied Intelligence Complex Benchmark',
    itemDescription: 'World-leading hardware-software integration for humanoid robotics, industrial automation, and automotive AI.',
    price: '$410,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'Seattle Cloud & Distributed Systems Cluster Benchmark',
    itemDescription: 'Global hub for hyperscale cloud storage, distributed databases, and serverless compute infrastructure.',
    price: '$530,000 / year',
    category: 'Metropolitan Hubs',
  },
  {
    itemName: 'Austin Texas Emerging Frontier Tech Hub Benchmark',
    itemDescription: 'Zero state income tax tech cluster with high concentration of semiconductor and autonomous vehicle talent.',
    price: '$460,000 / year',
    category: 'Metropolitan Hubs',
  },

  // ==========================================
  // 7. ANNUAL CAPABILITY TRAJECTORIES (2020-2027 MACRO MODEL)
  // ==========================================
  {
    itemName: '2020 Annual Capabilities Baseline Benchmark',
    itemDescription: 'Foundational cloud systems and accelerated compute baseline across high-growth technology domains.',
    price: '$235,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2021 Annual Capabilities Scaled Benchmark',
    itemDescription: 'Post-pandemic distributed engineering expansion and global compensation leveling across tech hubs.',
    price: '$275,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2022 Annual Capabilities Realized Benchmark',
    itemDescription: 'Emergence of large-scale foundation model engineering and early LLM compute clusters.',
    price: '$325,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2023 Annual Capabilities Generative AI Wave Benchmark',
    itemDescription: 'Hyperscaler GPU cluster deployments, transformer optimization, and surge in generative AI talent demand.',
    price: '$390,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2024 Annual Capabilities Production AI Infrastructure Benchmark',
    itemDescription: 'Trillion-parameter model training, specialized inference hardware, and production agentic workflows.',
    price: '$470,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2025 Annual Capabilities Autonomous Systems Wave Benchmark',
    itemDescription: 'Autonomous agent swarms, physical embodied AI, and multi-modal edge compute integration.',
    price: '$555,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2026 Annual Capabilities Current Calibrated Benchmark',
    itemDescription: 'State-of-the-art frontier model orchestration, quantum-safe cryptography, and high-frequency inference.',
    price: '$645,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },
  {
    itemName: '2027 Annual Capabilities Forward Projected Benchmark',
    itemDescription: 'Fully autonomous engineering pipelines, neuromorphic computing, and synthetic biology ML maturity.',
    price: '$745,000 / year',
    category: 'Macro Trajectories (2020-2027)',
  },

  // ==========================================
  // 8. ENTERPRISE GOVERNANCE, SECURITY & INFRASTRUCTURE CAPABILITIES
  // ==========================================
  {
    itemName: 'SOC 2 Type II Compliance & Zero-Knowledge Architecture',
    itemDescription: 'Verified zero-knowledge audit trails, cryptographic data isolation, and encrypted candidate communications.',
    price: '$12,000 / year',
    category: 'Enterprise Governance',
  },
  {
    itemName: 'Dedicated Multi-Cloud Private Tenant Deployment',
    itemDescription: 'VPC peering, dedicated Cloud Run / GKE clusters, and custom DNS domain routing.',
    price: '$24,000 / year',
    category: 'Enterprise Governance',
  },
  {
    itemName: 'High-Throughput Webhook & ATS Integration Feed',
    itemDescription: 'Real-time streaming API for Greenhouse, Lever, Workday, and custom HRIS data sync.',
    price: '$6,000 / year',
    category: 'Enterprise Governance',
  },
  {
    itemName: '24/7 Dedicated Strategic Architecture Advisory & SLA',
    itemDescription: 'Guaranteed 15-minute response SLA, direct founder hotline, and quarterly compensation re-calibration audits.',
    price: '$15,000 / year',
    category: 'Enterprise Governance',
  },
];

/**
 * Generates the clean, RFC 4180-compliant CSV string containing all annual capabilities.
 * Exactly adheres to user specification: columns are "item name", "item description", and "price".
 */
export function generateBulkCapabilitiesCsvString(): string {
  const sanitize = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines: string[] = [];

  // Line 1: Exact column header as requested by the user
  lines.push('item name,item description,price');

  // Lines 2..N: Data rows
  WEBSITE_ANNUAL_CAPABILITIES.forEach((item) => {
    lines.push([
      sanitize(item.itemName),
      sanitize(item.itemDescription),
      sanitize(item.price),
    ].join(','));
  });

  return lines.join('\r\n');
}

/**
 * Triggers client-side browser download of the bulk capabilities CSV file.
 */
export function downloadBulkCapabilitiesCsv(): void {
  const csvContent = generateBulkCapabilitiesCsvString();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `TalentRadar_Bulk_Annual_Capabilities_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
