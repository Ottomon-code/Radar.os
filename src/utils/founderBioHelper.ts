/**
 * Founder Biography Generator Helper for Acquisition Listings & M&A Diligence
 * 
 * Specially calibrated for Acquire.com, MicroAcquire, Flippa VIP, and Private Equity buyers.
 * Emphasizes: 100% Bootstrapped / Self-Funded status, zero outside equity dilution,
 * full-stack technical mastery (React, TypeScript, Three.js, Node.js), and clean IP transfer.
 */

export interface FounderBioConfig {
  founderTitle?: string;
  focusTone?: 'institutional_pe' | 'tech_strategic' | 'recruiting_agency';
  fundingStatus?: string;
  cloudRegion?: string;
  sellerCountry?: string;
  askingPrice?: number;
  monthlyOperatingCost?: number;
  activeHubsCount?: number;
  totalOpeningsCount?: number;
  customNotes?: string;
}

export interface FounderBioResult {
  headline: string;
  executiveBio: string;
  shortTeaser: string;
  whySelling: string;
  investorDiligenceBullets: string[];
  recommendedTags: string[];
  dealRoomSummary: string;
  generatedAt: string;
}

export function generateInvestorReadyFounderBio(config: FounderBioConfig = {}): FounderBioResult {
  const title = config.founderTitle || 'Full-Stack Systems Architect & Solo Founder';
  const tone = config.focusTone || 'institutional_pe';
  const askingPrice = config.askingPrice || 145000;
  const hubs = config.activeHubsCount || 17;
  const openings = config.totalOpeningsCount || 4402;
  const monthlyCost = config.monthlyOperatingCost || 28.35;
  const sellerCountry = config.sellerCountry || 'Kenya';
  const cloudRegion = config.cloudRegion || 'London, United Kingdom (europe-west2)';

  let headline = '';
  let executiveBio = '';
  let shortTeaser = '';
  let whySelling = '';

  if (tone === 'institutional_pe') {
    headline = `${title} // 100% Bootstrapped Software Builder & Systems Architect`;
    executiveBio = `I am a full-stack software engineer and systems architect specializing in high-throughput data visualization, geospatial intelligence, and modern cloud infrastructure. Operating as a solo, self-funded developer, I conceived, architected, and built TalentRadar.io from zero to a fully deployed, production-grade enterprise platform.

By deliberately self-funding and bootstrapping 100% of the platform's development, I retained complete creative and structural freedom, resulting in a lean, high-velocity codebase with zero technical debt, zero outside venture capital dilution, and zero debt or convertible notes. The platform runs at an exceptionally low operating expenditure of ~$${monthlyCost.toFixed(2)}/month across Google Cloud Run and Cloudflare, ensuring a verified 98.2% gross software margin on incoming subscription revenues.

My engineering philosophy centers on local-first performance, strict TypeScript type safety, and mathematically rigorous 3D WebGL visualizations. Having completed the entire software ecosystem—including 3D geospatial telemetry for ${hubs} global hubs, regex-token highlighting, offline PWA caching, and Android Google Play TWA packaging—I am seeking an unencumbered $${askingPrice.toLocaleString()} USD asset buyout to transition the platform into the hands of an operational group equipped to scale enterprise sales, while I provide 30 days of full architectural onboarding.`;

    shortTeaser = `Self-funded full-stack engineer and creator of TalentRadar.io. 100% bootstrapped with zero outside equity dilution, zero debt, and clean title. Architected the complete TypeScript/React/Three.js/Node.js stack tracking ${openings}+ requisitions across ${hubs} global hubs at just $${monthlyCost.toFixed(2)}/mo operating cost. Seeking full IP buyout ($${askingPrice.toLocaleString()} USD via Escrow.com) with 30-day technical handover.`;

    whySelling = `I am an engineering-first systems builder whose primary competitive edge is zero-to-one architecture, 3D WebGL engineering, and full-stack software development. Having successfully proven, hardened, and deployed TalentRadar.io, the business is now ready for aggressive go-to-market execution, sales partnerships, and outbound commercialization. Rather than splitting focus between commercial enterprise sales and pure engineering, I am selling the complete, unencumbered asset to an operator, private equity syndicate, or strategic recruiting firm with the bandwidth to monetize it, while I re-invest my capital and time into early-stage technical R&D.`;

  } else if (tone === 'tech_strategic') {
    headline = `${title} // Full-Stack TypeScript & 3D WebGL Systems Engineer`;
    executiveBio = `I am a software engineer with deep domain expertise in distributed frontend architectures, Three.js WebGL rendering, and Node.js REST services. As a 100% self-funded developer, I built TalentRadar.io to eliminate information asymmetry in global engineering labor markets and executive compensation.

Every layer of the platform was engineered by hand with an emphasis on production resilience: a modular React 18 single-page application, 100% strict TypeScript typing with zero compiler warnings, responsive Tailwind CSS styling, custom WebGL orbital projection algorithms, and a containerized Node.js backend running on Google Cloud Run (${cloudRegion}). 

Because the startup is entirely self-funded with zero external debt, SAFE notes, or institutional warrants, the intellectual property is 100% unencumbered. The codebase is clean, well-commented, and ready for immediate deployment into the acquiring team's CI/CD pipeline, backed by my commitment to provide comprehensive 30-day code audits and deployment assistance.`;

    shortTeaser = `Solo technical creator and full-stack engineer. 100% self-funded, zero technical debt, and zero outside investors. Hand-coded 3D WebGL radar, live requisition token highlighter, and multi-hub telemetry in strict TypeScript/React/Node.js. Offering clean asset sale ($${askingPrice.toLocaleString()} USD) with complete source code, domains, Play Store package, and 30-day founder transition support.`;

    whySelling = `My goal as a self-funded developer was to build an institutional-grade technical asset that functions flawlessly without bloat or ongoing technical maintenance. With the core 3D engine, live requisition streams, and multi-platform distribution fully operational, the platform is ready for an engineering or media company to integrate directly into their product suite or launch as a standalone ARR engine. I am ready to hand over 100% clean intellectual property so I can dedicate myself to new deep-tech software projects.`;

  } else {
    // recruiting_agency
    headline = `${title} // HR-Tech & Executive Talent Intelligence Engineer`;
    executiveBio = `I am a technical founder and software developer specializing in quantitative talent market intelligence, compensation benchmarking, and executive search analytics. I built TalentRadar.io as a self-funded developer to provide boutique headhunters, corporate talent acquisition leaders, and venture funds with real-time geospatial radar across global tech nodes.

The platform was built entirely on personal capital and founder sweat equity, freeing the project from outside investor demands and allowing me to craft an intuitive, high-leverage interface tracking ${openings}+ active requisitions across ${hubs} high-growth hubs (including Austin, Toronto, Bengaluru, Tel Aviv, Stockholm, SF, and London) and emerging frontier sectors (SpaceTech Avionics, Computational Genomics, Clean Energy Grid).

Operating at an ultra-lean $${monthlyCost.toFixed(2)}/month footprint with an expected 98.2% gross margin, TalentRadar is an ideal turnkey bolt-on for an executive search firm, specialized staffing agency, or job-board network looking to instantly offer premium 3D talent intelligence without building software from scratch.`;

    shortTeaser = `Self-funded software developer and creator of TalentRadar.io. Built with zero outside capital to map 4,402+ high-yield tech requisitions across 17 global hubs. Low $28.35/mo overhead, 100% unencumbered code, and turnkey Escrow.com closing ($145k USD buyout) tailored for executive search agencies and talent platforms.`;

    whySelling = `TalentRadar has reached full functional maturity as a standalone software product. To realize its commercial potential ($1,450/month agency seats and enterprise search licenses), it needs the industry relationships and outbound recruiter network that an established recruiting firm or agency aggregator already possesses. An asset buyout enables the buyer to instantly own proprietary talent software while allowing me to transition to my next engineering project.`;
  }

  const investorDiligenceBullets = [
    `100% Bootstrapped & Self-Funded: No venture capital, no angel investors, no SAFE notes, and zero debt. 100% common founder ownership.`,
    `Clean Title & Unencumbered IP: Sole founder ownership (mortyp1125@gmail.com) with legal authority to execute immediate Bill of Sale and APA.`,
    `Production-Grade Architecture: React 18, TypeScript, Three.js WebGL, Node.js Express, Google Cloud Run (${cloudRegion}), PWA Service Worker, and Google Play Store TWA (com.talentradar.app).`,
    `Sub-Zero Operating Cost: Verifiable monthly operating run-rate of ~$${monthlyCost.toFixed(2)}/mo ($12.50 Cloud Run + $1.85 Cloudflare + $8.00 Gemini Tokens + $6.00 Workspace) yielding a 98.2% gross software margin.`,
    `Seller KYC & International Escrow: Seller residency in ${sellerCountry}, fully verified on Escrow.com for standard USD international SWIFT wire payouts with zero cross-border tax complications for buyers.`,
    `Turnkey Closing & Onboarding: 10% refundable inspection deposit ($${(askingPrice * 0.1).toLocaleString()} USD), 48-hour code audit window, and 30 days of direct founder technical handover support.`
  ];

  const recommendedTags = [
    'Self-Funded Developer',
    'Bootstrapped SaaS',
    'Solo Technical Founder',
    '100% Clean IP',
    'Full-Stack TypeScript',
    'Three.js WebGL',
    'Geospatial Talent Intelligence',
    'Zero Technical Debt',
    'Escrow.com Wire Ready',
    'Turnkey Asset Sale'
  ];

  const dealRoomSummary = `TALENT_RADAR.OS // FOUNDER & DEAL SUMMARY
Creator: ${title}
Funding Status: 100% Bootstrapped / Self-Funded (Zero Dilution)
Seller Location: ${sellerCountry} (Global Remote)
Hosting Infrastructure: Google Cloud Run, ${cloudRegion}
Asking Price: $${askingPrice.toLocaleString()} USD via Escrow.com Wire
Monthly Operating Run-Rate: $${monthlyCost.toFixed(2)} / month
Active Global Nodes Tracked: ${hubs} Hubs (${openings}+ Requisitions)
Transition Support: 30 Days Architecture Handover & Code Audit Support
Canonical Domain & Package: talentradar.io // com.talentradar.app`;

  return {
    headline,
    executiveBio,
    shortTeaser,
    whySelling,
    investorDiligenceBullets,
    recommendedTags,
    dealRoomSummary,
    generatedAt: new Date().toISOString()
  };
}
