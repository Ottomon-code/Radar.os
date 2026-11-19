/**
 * Triad & Commander Engine: Autonomous Multi-Agent Hierarchy
 * 
 * 0. COMMANDER (ARCHON-0) // Chief Mission Commander & Triad Orchestrator
 *    Instructs, assigns directives, resolves conflicts, and audits the Triad.
 * 
 * THE OPERATIONAL TRIAD:
 * 1. SCOUT (ARC-1) // Reconnaissance & Market Sensing
 * 2. STRATEGIST (NEXUS-2) // Career Architecture & Competency Synthesis
 * 3. ENVOY (CIPHER-3) // Tactical Negotiation & Discreet Outbound Comms
 */

export type AgentId = 'commander' | 'scout' | 'strategist' | 'envoy';

export interface AIAssistant {
  id: AgentId;
  callsign: string;
  name: string;
  role: string;
  tier: 'Commander (Tier 0)' | 'Specialist (Tier 1)';
  avatarColor: string;
  accentHex: string;
  status: 'COMMANDING' | 'IDLE' | 'PROCESSING' | 'TRANSMITTING' | 'SYNCING';
  mission: string;
  operatesFor: string;
  instructs?: string;
  coreMetrics: {
    label: string;
    value: string;
  }[];
}

export interface InterAgentMessage {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId | 'collective';
  timestamp: string;
  actionType: 'COMMAND' | 'DELEGATE' | 'HANDOVER' | 'AUDIT' | 'CHALLENGE' | 'SYNTHESIZE' | 'REPORT' | 'VALIDATE';
  headline: string;
  details: string;
  confidence: number;
}

export interface CommanderDirective {
  id: string;
  target: 'collective' | 'scout' | 'strategist' | 'envoy';
  title: string;
  instruction: string;
  strategicIntent: string;
  priority: 'CRITICAL' | 'HIGH' | 'TACTICAL';
}

export interface TriadCollaborativeCycle {
  id: string;
  topic: string;
  timestamp: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  commanderDirective: {
    intent: string;
    targetInstructions: {
      toScout: string;
      toStrategist: string;
      toEnvoy: string;
    };
  };
  scoutContribution: string;
  strategistContribution: string;
  envoyContribution: string;
  commanderReview: {
    auditScore: number;
    strategicVerdict: string;
    riskMitigationStatus: string;
  };
  consensusSummary: string;
  actionChecklist: string[];
}

export const PRESET_COMMANDER_DIRECTIVES: CommanderDirective[] = [
  {
    id: 'cmd-comp-surge',
    target: 'collective',
    title: 'Directive 01: High-Yield Compensation Maximization',
    instruction: 'Instruct Scout to filter >$320k requisitions. Instruct Strategist to model high-density GPU kernel competencies. Instruct Envoy to anchor negotiations at the 85th percentile.',
    strategicIntent: 'Capture top-decile market compensation by weaponizing deep technical scarcity.',
    priority: 'CRITICAL'
  },
  {
    id: 'cmd-stealth-pivot',
    target: 'collective',
    title: 'Directive 02: Stealth Sovereign AI & Infrastructure Pivot',
    instruction: 'Instruct Scout to scan European & US sovereign cloud nodes. Instruct Strategist to shorten transition runway to 9 months. Instruct Envoy to secure double-trigger equity acceleration.',
    strategicIntent: 'Reposition profile into sovereign AI infrastructure before market saturates.',
    priority: 'HIGH'
  },
  {
    id: 'cmd-stress-mitigation',
    target: 'collective',
    title: 'Directive 03: De-risk Pipeline & Burnout Prevention',
    instruction: 'Instruct Scout to penalize on-call crunch requisitions. Instruct Strategist to prioritize remote-first enterprise architectures. Instruct Envoy to enforce strict 2-stage interview caps.',
    strategicIntent: 'Preserve cognitive bandwidth while securing stable L6/L7 total compensation.',
    priority: 'TACTICAL'
  },
  {
    id: 'cmd-scout-targeted',
    target: 'scout',
    title: 'Directive 04 [To Scout]: Deep-Scan Frontier AI Spinouts',
    instruction: 'Reallocate 80% of radar sensor telemetry to seed/series-A stealth labs founded by ex-DeepMind and ex-OpenAI principals.',
    strategicIntent: 'Intercept high-equity founding engineer opportunities prior to public ATS listings.',
    priority: 'CRITICAL'
  },
  {
    id: 'cmd-strategist-targeted',
    target: 'strategist',
    title: 'Directive 05 [To Strategist]: Compress Architecture Runway',
    instruction: 'Eliminate non-essential enterprise certs from the roadmap. Focus 100% of study sprints on Triton, vLLM, and InfiniBand RDMA benchmarks.',
    strategicIntent: 'Accelerate interview readiness from 18 months down to 90 days.',
    priority: 'HIGH'
  },
  {
    id: 'cmd-envoy-targeted',
    target: 'envoy',
    title: 'Directive 06 [To Envoy]: Deploy Aggressive Dual-Offer BATNA',
    instruction: 'Construct high-pressure counter-offer letter using Citadel and Anthropic comp data. Refuse signing bonus below $50,000 cash.',
    strategicIntent: 'Maximize immediate upfront liquidity and break standard hiring salary bands.',
    priority: 'CRITICAL'
  }
];

export const TRIAD_ASSISTANTS: AIAssistant[] = [
  {
    id: 'commander',
    callsign: 'ARCHON-0',
    name: 'Commander',
    role: 'Chief Mission Commander & Triad Orchestrator',
    tier: 'Commander (Tier 0)',
    avatarColor: 'from-purple-600/30 to-violet-950/60 text-purple-300 border-purple-500/50',
    accentHex: '#a855f7',
    status: 'COMMANDING',
    mission: 'Governs the Triad collective: translates user objectives into authoritative sub-agent directives, arbitrates inter-agent friction, and audits final mission execution.',
    operatesFor: 'Instructs Scout, Strategist, and Envoy. Oversees end-to-end tactical alignment and ensures sub-agents execute in synchronized sequence.',
    instructs: 'Commands Scout on recon vectors, dictates Strategist risk/runway balances, and calibrates Envoy negotiation aggressiveness.',
    coreMetrics: [
      { label: 'Hierarchy Level', value: 'Tier 0 Master' },
      { label: 'Directives Issued', value: '42 Active' },
      { label: 'Triad Alignment', value: '99.4%' }
    ]
  },
  {
    id: 'scout',
    callsign: 'ARC-1',
    name: 'Scout',
    role: 'Market Reconnaissance & Talent Radar',
    tier: 'Specialist (Tier 1)',
    avatarColor: 'from-emerald-500/20 to-teal-900/40 text-emerald-400 border-emerald-500/40',
    accentHex: '#22d3a5',
    status: 'SYNCING',
    mission: 'Executes Commander recon directives: intercepts unadvertised opportunities, tracks stealth funding wires, and feeds validated market telemetry to Strategist.',
    operatesFor: 'Supplies validated employer liquidity, tech stack requirements, and salary ceilings to Strategist under Commander guidance.',
    instructs: 'Reports findings to Commander and feeds structured target schemas to Strategist.',
    coreMetrics: [
      { label: 'Recon Signals', value: '142 Active' },
      { label: 'Signal Freshness', value: '< 15m' },
      { label: 'Radar Coverage', value: '9 Hubs' }
    ]
  },
  {
    id: 'strategist',
    callsign: 'NEXUS-2',
    name: 'Strategist',
    role: 'Career Architect & Competency Modeler',
    tier: 'Specialist (Tier 1)',
    avatarColor: 'from-blue-500/20 to-indigo-900/40 text-blue-400 border-blue-500/40',
    accentHex: '#3b82f6',
    status: 'PROCESSING',
    mission: 'Executes Commander architecture directives: synthesizes skill gap matrices, projects 5-year compensation yield, and formulates tactical leverage formulas for Envoy.',
    operatesFor: 'Audits Scout targets for viability and arms Envoy with game-theoretic compensation anchor scripts.',
    instructs: 'Reports feasibility to Commander and transmits negotiation leverage boundaries to Envoy.',
    coreMetrics: [
      { label: 'Leverage Index', value: '88 / 100' },
      { label: 'Roadmap Velocity', value: '14 Months' },
      { label: 'Model Confidence', value: '96.4%' }
    ]
  },
  {
    id: 'envoy',
    callsign: 'CIPHER-3',
    name: 'Envoy',
    role: 'High-Stakes Negotiator & Stealth Envoy',
    tier: 'Specialist (Tier 1)',
    avatarColor: 'from-amber-500/20 to-yellow-900/40 text-amber-400 border-amber-500/40',
    accentHex: '#fbbf24',
    status: 'TRANSMITTING',
    mission: 'Executes Commander negotiation directives: deploys encrypted recruiter interactions, executes counter-proposals, and feeds employer behavioral responses back to the collective.',
    operatesFor: 'Stress-tests Strategist compensation formulas in live simulations and reports real-world market friction to Scout and Commander.',
    instructs: 'Reports recruiter concessions to Commander and triggers radar weight adjustments in Scout.',
    coreMetrics: [
      { label: 'Counter Premium', value: '+22.4%' },
      { label: 'Stealth Shield', value: 'Active' },
      { label: 'Channels Monitored', value: '4 Encrypted' }
    ]
  }
];

export const INITIAL_INTER_AGENT_MESSAGES: InterAgentMessage[] = [
  {
    id: 'IAM-200',
    fromAgent: 'commander',
    toAgent: 'collective',
    timestamp: '14:27:50',
    actionType: 'COMMAND',
    headline: 'COMMANDER DIRECTIVE 01-ALPHA: Orient All Sub-Agents to Frontier Systems Architecture',
    details: 'Authorize operational sprint. Scout: filter for >$300k base. Strategist: compress study runway down to 12 months. Envoy: prepare high-leverage counter-offer anchors. Maintain 98% telemetry sync.',
    confidence: 99
  },
  {
    id: 'IAM-101',
    fromAgent: 'scout',
    toAgent: 'strategist',
    timestamp: '14:28:10',
    actionType: 'HANDOVER',
    headline: 'Acknowledged Commander Directive. Intercepted cluster requisition from Skydio / Horizon Dynamics',
    details: 'Verified $295k ceiling + 0.15% equity per Commander specs. Requires ROS 2, Triton kernels, and edge inference. Forwarding to Strategist for competency delta extraction.',
    confidence: 96
  },
  {
    id: 'IAM-102',
    fromAgent: 'strategist',
    toAgent: 'envoy',
    timestamp: '14:28:18',
    actionType: 'DELEGATE',
    headline: 'Formulated negotiation leverage playbook for Anthropic & Citadel requisitions',
    details: 'Candidate shows 94% alignment in distributed systems. Executing Commander order: optimal anchor at $340k base + accelerated 1-year cliff. Instructing Envoy to simulate counter-salvo.',
    confidence: 94
  },
  {
    id: 'IAM-103',
    fromAgent: 'envoy',
    toAgent: 'scout',
    timestamp: '14:28:26',
    actionType: 'REPORT',
    headline: 'Executive search partner conceded +$45k sign-on liquidity in benchmark simulation',
    details: 'Recruiter partner accepted higher base parameters without requesting additional code screen. Scout: calibrate radar to increase weight on benchmark-backed spinouts.',
    confidence: 92
  },
  {
    id: 'IAM-201',
    fromAgent: 'commander',
    toAgent: 'collective',
    timestamp: '14:28:40',
    actionType: 'VALIDATE',
    headline: 'COMMANDER EXECUTIVE AUDIT: Triad Synchronization Confirmed at 99.4%',
    details: 'Scout, Strategist, and Envoy outputs have satisfied mission directives. Concession delta (+22.4%) approved. Authorized next sprint for sovereign cloud nodes.',
    confidence: 99
  }
];

export const PRESET_TRIAD_MISSIONS: Array<{
  id: string;
  title: string;
  description: string;
  prompt: string;
  ownerOnly?: boolean;
}> = [
  {
    id: 'mission-pivot',
    title: 'Autonomous Career Pivot & Comp Maximization',
    description: 'Commander orders Triad -> Scout finds top clusters -> Strategist computes skill gaps -> Envoy generates counter-offer scripts.',
    prompt: 'Pivot current profile toward Principal AI Systems Architect ($320k+) with maximum market leverage.'
  },
  {
    id: 'mission-negotiate',
    title: 'Multi-Offer Bidding War Orchestration',
    description: 'Commander sets BATNA parameters -> Envoy drafts counter-offers -> Strategist models equity scenarios -> Scout verifies solvency.',
    prompt: 'Orchestrate a bidding war between a tier-1 AI lab offer and an HFT algorithmic trading package.'
  },
  {
    id: 'mission-audit',
    title: 'Discreet Resume & Portfolio Hardening',
    description: 'Commander defines L7 benchmark -> Scout extracts hiring keywords -> Strategist audits code benchmarks -> Envoy generates stealth outreach.',
    prompt: 'Audit technical competencies to clear L7 hiring committee screens at OpenAI, Meta Supercomputing, and Palantir.'
  },
  {
    id: 'mission-founder-bio',
    title: 'Investor-Ready Founder Bio & M&A Pitch',
    description: 'Commander orders Triad -> Scout verifies M&A market multiples -> Strategist crafts self-funded developer narrative -> Envoy drafts Acquire.com pitch.',
    prompt: 'Generate an investor-ready founder biography and Acquire.com listing pitch emphasizing 100% self-funded developer background, $28/mo P&L, and clean $145k IP transfer.',
    ownerOnly: true
  }
];

export function runTriadCycle(
  userPrompt: string,
  options: { allowOwnerMna?: boolean } = {}
): TriadCollaborativeCycle {
  const isFounderBio =
    Boolean(options.allowOwnerMna) &&
    (userPrompt.toLowerCase().includes('founder') ||
      userPrompt.toLowerCase().includes('bio') ||
      userPrompt.toLowerCase().includes('acquire') ||
      userPrompt.toLowerCase().includes('self-funded') ||
      userPrompt.toLowerCase().includes('buyout'));

  if (isFounderBio) {
    return {
      id: `cycle-${Date.now()}`,
      topic: userPrompt,
      timestamp: new Date().toLocaleTimeString(),
      status: 'COMPLETED',
      commanderDirective: {
        intent: `COMMANDER MANDATE // M&A ACQUISITION DOSSIER: Synthesize an institutional-grade founder biography positioning candidate as a 100% self-funded, zero-debt systems builder for a $145,000 USD full software and IP buyout on Acquire.com.`,
        targetInstructions: {
          toScout: `[DIRECTIVE TO SCOUT]: Scan comparable micro-SaaS M&A transactions on Acquire.com and Flippa VIP. Validate pre-revenue software asset valuations and confirm benchmark pricing for 100% unencumbered codebases.`,
          toStrategist: `[DIRECTIVE TO STRATEGIST]: Formulate a high-credibility narrative emphasizing the founder's self-funded discipline, modular TypeScript/Three.js architecture, and the strategic rationale for passing the baton to a commercial operator.`,
          toEnvoy: `[DIRECTIVE TO ENVOY]: Package the executive biography, 150-word teaser, and Escrow.com terms for the Acquire.com Curation Team, ensuring compliance with zero-revenue reporting and $28.35/mo verified P&L.`
        }
      },
      scoutContribution: `[SCOUT // M&A RECONNAISSANCE EXECUTION — DIRECTIVE COMPLIED]
• Scanned 48 recent pre-revenue and early-stage developer asset transactions in the HR-Tech & Developer Tools sectors.
• Verified median acquisition multiple for turnkey, production-grade 3D/AI software assets: $120,000 – $180,000 USD.
• Confirmed high acquirer willingness-to-pay for 100% bootstrapped assets with zero debt and clean single-founder equity.
• Forwarded buyer criteria to Strategist: institutional buyers demand verified clean title, low maintenance overhead (<$50/mo), and 30-day technical handover.`,
      strategistContribution: `[STRATEGIST // FOUNDER BIOGRAPHY & POSITIONING SYNTHESIS — DIRECTIVE COMPLIED]
• Crafted 3-tier investor narrative highlighting the founder as a Full-Stack Systems Architect & Solo Developer:
  - 100% Self-Funded / Bootstrapped: Zero venture dilution, zero debt, complete unencumbered ownership.
  - Architectural Excellence: React 18, TypeScript, Three.js WebGL, Node.js Express, Google Cloud Run (London, UK europe-west2), PWA + Android TWA.
  - Extreme Capital Efficiency: Running 17 global tech nodes and 4,402+ requisitions on just $28.35/month operating cost (98.2% gross margin).
  - Rationalized Exit: "Zero-to-one engineering builder passing the baton to an enterprise commercial scaling partner."`,
      envoyContribution: `[ENVOY // ACQUIRE.COM DEAL ROOM SALVO — DIRECTIVE COMPLIED]
• Packaged investor-ready founder biography and Acquire.com listing dossier:
  "Full-stack systems architect and solo self-funded developer. 100% bootstrapped with zero outside equity dilution and zero debt. Hand-coded 3D WebGL radar, live requisition token highlighter, and multi-hub telemetry at $28.35/mo overhead. Seeking $145,000 USD full IP buyout via Escrow.com wire with 30-day founder technical handover."
• Added verification disclosures: Beneficiary residency in Kenya, infrastructure in London UK, 10% refundable inspection deposit ($14,500 USD).`,
      commanderReview: {
        auditScore: 99,
        strategicVerdict: 'APPROVED BY COMMANDER: Founder biography and M&A positioning package satisfies all Acquire.com curation standards. High-trust posture established for Private Equity and strategic buyers.',
        riskMitigationStatus: 'GREEN — 100% unencumbered title verified; clean Escrow.com structure removes cross-border legal friction.'
      },
      consensusSummary: 'EXECUTIVE CONSENSUS VALIDATED: Triad has completed the Founder Biography & M&A Dossier synthesis. Scout validated market multiples, Strategist structured the self-funded narrative, and Envoy primed the Acquire.com listing pitch.',
      actionChecklist: [
        'Commander: Approved investor biography for export to Acquire.com seller listing.',
        'Scout: Monitored active PE search syndicates tracking HR-Tech and 3D geospatial SaaS assets.',
        'Strategist: Synced founder bio with $28.35/mo P&L statement and 17 global tech hubs.',
        'Envoy: Deployed copyable biography sections directly into AI Supervisor workspace.'
      ]
    };
  }

  return {
    id: `cycle-${Date.now()}`,
    topic: userPrompt,
    timestamp: new Date().toLocaleTimeString(),
    status: 'COMPLETED',
    commanderDirective: {
      intent: `COMMANDER STRATEGIC MANDATE: Execute unified career campaign for: "${userPrompt}". Enforce asymmetric leverage and zero-compromise equity acceleration.`,
      targetInstructions: {
        toScout: `[DIRECTIVE TO SCOUT]: Scan high-frequency talent exchanges and intercept unadvertised L6/L7 requisitions exceeding $280k. Filter out low-liquidity startups and focus on high-compute clusters.`,
        toStrategist: `[DIRECTIVE TO STRATEGIST]: Model a high-velocity transition roadmap. Identify top 2 critical competency deltas and bridge them with demonstrable code assets within 12 months.`,
        toEnvoy: `[DIRECTIVE TO ENVOY]: Formulate an aggressive counter-proposal anchoring candidate at 85th percentile. Enforce double-trigger vesting and reject unilateral NDA constraints.`
      }
    },
    scoutContribution: `[SCOUT // RECONNAISSANCE EXECUTION — DIRECTIVE COMPLIED]
• Intercepted 16 active radar signals and wire feeds aligned with Commander's mandate.
• Detected critical talent deficit in distributed kernel optimization (Triton, vLLM) and low-latency RoCE networking.
• Key target firms: Anthropic, Citadel Securities, Skydio, TensorScale Labs.
• Passing verified $280k - $360k compensation range and hiring manager profiles to Strategist for delta modeling.`,
    strategistContribution: `[STRATEGIST // ARCHITECTURE & GAP ANALYSIS — DIRECTIVE COMPLIED]
• Ingested Scout targets under Commander's 12-month constraint.
• Identified 2 critical skill gaps: (1) InfiniBand / RoCE telemetry, (2) Hardware-aware inference kernel tuning.
• Modeled 12-month transition roadmap yielding a +48% baseline compensation surge ($175k -> $295k+).
• Formulated tactical leverage index: 93/100 based on verified scarcity ratios.
• Directing Envoy: anchor candidate counter-offer at $340k base with accelerated vesting.`,
    envoyContribution: `[ENVOY // TACTICAL NEGOTIATION SALVO — DIRECTIVE COMPLIED]
• Deployed Commander-approved counter-offer script:
  "Given current active technical conversations in the frontier compute space offering $340k total target comp, candidate is prepared to commit immediately if base is set to $310k with $50k sign-on liquidity."
• Verified 4 encrypted recruiter channels; stealth proxy shields employer telemetry.
• Transmitting employer concession telemetry back to Commander and Scout.`,
    commanderReview: {
      auditScore: 98,
      strategicVerdict: 'APPROVED BY COMMANDER: Triad executed in flawless synchrony. High-leverage compensation posture established with manageable cognitive friction.',
      riskMitigationStatus: 'GREEN — All sub-agents operating within approved risk tolerance parameters.'
    },
    consensusSummary: 'EXECUTIVE CONSENSUS VALIDATED: Commander has approved the Triad operational package. Scout has locked 4 target clusters, Strategist has mapped the 12-month competency sprint, and Envoy has prepared counter-offer salvo.',
    actionChecklist: [
      'Commander: Authorize Phase 2 execution and monitor Triad telemetry bus.',
      'Scout: Lock 3 newly intercepted high-priority vacancies on candidate radar.',
      'Strategist: Publish Milestone 1 Triton kernel micro-benchmarks to portfolio.',
      'Envoy: Deploy discreet introductory NDA response to verified talent partner.'
    ]
  };
}
