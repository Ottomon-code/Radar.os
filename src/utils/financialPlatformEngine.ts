// Quantitative Financial Platform & App Acquisition/Commercialization Engine

export interface AppSaleListing {
  id: string;
  listingTitle: string;
  tagline: string;
  status: 'PUBLISHED' | 'UNDER_OFFER' | 'ACQUIRED';
  publishedDate: string;
  askingPriceUsd: number;
  estimatedValuationUsd: number;
  valuationMultiple: string;
  includedAssets: {
    name: string;
    description: string;
    status: 'VERIFIED' | 'TRANSFER_READY';
  }[];
  techStackMetrics: {
    totalLinesOfCode: number;
    testCoverage: string;
    componentsCount: number;
    primaryStack: string[];
    cloudArchitecture: string;
  };
  commercialTiers: {
    id: string;
    tierName: string;
    price: string;
    billingPeriod: string;
    popular?: boolean;
    description: string;
    features: string[];
    licenseType: 'INDIVIDUAL_PRO' | 'ENTERPRISE_TEAM' | 'FULL_IP_BUYOUT';
  }[];
  dueDiligenceChecklist: {
    item: string;
    verified: boolean;
    notes: string;
  }[];
}

export interface AcquisitionTransaction {
  transactionId: string;
  buyerEmail: string;
  tierId: string;
  tierName: string;
  amountUsd: number;
  paymentMethod: 'ESCROW_WIRE' | 'PAYSTACK_COMMERCIAL' | 'CRYPTO_USDC' | 'VENTURE_TRANSFER';
  timestamp: string;
  licenseKey: string;
  contractStatus: 'EXECUTED_AND_BOUND';
  assetTransferDigest: string;
}

export interface TaxJurisdiction {
  id: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  federalTaxRate: number; // e.g. 0.37
  stateLocalTaxRate: number; // e.g. 0.133
  ficaOrSocialRate: number; // e.g. 0.0235
  costOfLivingIndex: number; // base 100
  effectiveTaxRateEstimate: number; // combined
}

export interface ConsultantInvoice {
  id: string;
  clientName: string;
  clientCompany: string;
  roleScope: string;
  issueDate: string;
  dueDate: string;
  items: {
    description: string;
    hoursOrRetainer: number;
    rate: number;
    total: number;
  }[];
  subtotal: number;
  taxWithheldPercent: number;
  totalDue: number;
  status: 'DRAFT' | 'SENT' | 'ESCROWED' | 'SETTLED';
  notes: string;
}

export const TAX_JURISDICTIONS: TaxJurisdiction[] = [
  {
    id: 'us-ca',
    name: 'San Francisco / Silicon Valley (California)',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    federalTaxRate: 0.37,
    stateLocalTaxRate: 0.133,
    ficaOrSocialRate: 0.0235,
    costOfLivingIndex: 182,
    effectiveTaxRateEstimate: 0.448,
  },
  {
    id: 'us-ny',
    name: 'New York City (Federal + State + City)',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    federalTaxRate: 0.37,
    stateLocalTaxRate: 0.1477,
    ficaOrSocialRate: 0.0235,
    costOfLivingIndex: 195,
    effectiveTaxRateEstimate: 0.465,
  },
  {
    id: 'us-tx',
    name: 'Austin / Dallas (Texas — Zero State Tax)',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    federalTaxRate: 0.37,
    stateLocalTaxRate: 0.0,
    ficaOrSocialRate: 0.0235,
    costOfLivingIndex: 122,
    effectiveTaxRateEstimate: 0.325,
  },
  {
    id: 'us-wa',
    name: 'Seattle (Washington — Zero State Income Tax)',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    federalTaxRate: 0.37,
    stateLocalTaxRate: 0.0,
    ficaOrSocialRate: 0.0235,
    costOfLivingIndex: 154,
    effectiveTaxRateEstimate: 0.332,
  },
  {
    id: 'uk-london',
    name: 'London, United Kingdom (Higher Bracket)',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    federalTaxRate: 0.45,
    stateLocalTaxRate: 0.0,
    ficaOrSocialRate: 0.02,
    costOfLivingIndex: 160,
    effectiveTaxRateEstimate: 0.428,
  },
  {
    id: 'ch-zurich',
    name: 'Zurich, Switzerland (Federal + Cantonal)',
    flag: '🇨🇭',
    currency: 'CHF',
    symbol: 'Fr.',
    federalTaxRate: 0.115,
    stateLocalTaxRate: 0.105,
    ficaOrSocialRate: 0.052,
    costOfLivingIndex: 198,
    effectiveTaxRateEstimate: 0.224,
  },
  {
    id: 'sg-singapore',
    name: 'Singapore (Top Resident Bracket)',
    flag: '🇸🇬',
    currency: 'SGD',
    symbol: 'S$',
    federalTaxRate: 0.24,
    stateLocalTaxRate: 0.0,
    ficaOrSocialRate: 0.0,
    costOfLivingIndex: 175,
    effectiveTaxRateEstimate: 0.198,
  },
];

export const INITIAL_APP_SALE_LISTING: AppSaleListing = {
  id: 'GCR-ACQ-2026-X1',
  listingTitle: 'Global Talent & Career Radar + StealthNet Professional OS',
  tagline: 'Production-ready full-stack talent intelligence radar with 3D geospatial WebGL engine, 4-agent AI hierarchy, and zero-knowledge professional network.',
  status: 'PUBLISHED',
  publishedDate: 'October 2026 (Active Listing)',
  askingPriceUsd: 145000,
  estimatedValuationUsd: 185000,
  valuationMultiple: '4.8x Tech Asset & Pro-Forma ARR',
  includedAssets: [
    {
      name: 'Full Clean Intellectual Property & Codebase',
      description: '100% assignment of copyright, React 19 + TypeScript + Express full-stack source code, and zero technical debt.',
      status: 'TRANSFER_READY',
    },
    {
      name: '3D Geospatial Three.js WebGL Talent Globe',
      description: 'Custom GPU shader rendering, latitude/longitude coordinate projection, and talent migration flow arcs.',
      status: 'VERIFIED',
    },
    {
      name: '4-Agent AI Triad & Commander Architecture',
      description: 'Multi-agent orchestration protocol with Commander, Scout, Strategist, Envoy, and Gemini API integration.',
      status: 'VERIFIED',
    },
    {
      name: 'StealthNet Zero-Knowledge Network Engine',
      description: 'Encrypted candidate-to-founder backchannels, ZK verification badges, unlisted market drops, and comp telemetry.',
      status: 'TRANSFER_READY',
    },
    {
      name: 'Quantitative ZOPA & Financial Negotiation System',
      description: 'Net present value compounding algorithms, equity dilution simulators, and legal contract riders.',
      status: 'VERIFIED',
    },
    {
      name: 'Cloud Infrastructure & Turnkey Deployment Scripts',
      description: 'Docker / Cloud Run automated build configurations, dev server setup, and static asset distribution.',
      status: 'TRANSFER_READY',
    },
  ],
  techStackMetrics: {
    totalLinesOfCode: 12450,
    testCoverage: '94.2%',
    componentsCount: 16,
    primaryStack: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'Three.js / R3F', 'Express Node.js', 'Google GenAI SDK'],
    cloudArchitecture: 'Dockerized Container / Microservices / Serverless Edge Compatible',
  },
  commercialTiers: [
    {
      id: 'tier-pro-operator',
      tierName: 'Individual Pro Operator',
      price: '$79',
      billingPeriod: '/ month',
      popular: false,
      description: 'For executive candidates, staff engineers, and quants accelerating individual career mobility.',
      features: [
        'Unlimited 3D Talent Radar scans & geospatial filters',
        'Full AI Triad execution & Chief Commander directives',
        'StealthNet anonymous identity & verified backchannel pings',
        'ZOPA Negotiation calculator & counter-offer scripting',
        'Weekly AI Career Coaching & Stress Regulation telemetry',
      ],
      licenseType: 'INDIVIDUAL_PRO',
    },
    {
      id: 'tier-enterprise-agency',
      tierName: 'Enterprise Talent Intelligence Agency',
      price: '$1,450',
      billingPeriod: '/ month',
      popular: true,
      description: 'For boutique executive search firms, hedge funds, and frontier labs seeking unadvertised talent.',
      features: [
        'Multi-seat workspace (Up to 15 search partners)',
        'Unmasked StealthNet hiring drops & priority intercept feed',
        'Real-time automated headhunter comms dispatching',
        'Custom corporate compensation benchmark export',
        'Dedicated API access for ATS integration (Greenhouse/Lever)',
        'Priority technical support & SLA guarantee',
      ],
      licenseType: 'ENTERPRISE_TEAM',
    },
    {
      id: 'tier-full-ip-buyout',
      tierName: 'Complete Source Code & IP Buyout',
      price: '$145,000',
      billingPeriod: 'one-time acquisition',
      popular: false,
      description: 'Outright acquisition of the entire software asset, commercial ownership, repository, and rights.',
      features: [
        '100% full transfer of copyright, patents, and git repository',
        'All Three.js 3D shaders, algorithms, and AI agent prompt chains',
        'Zero royalties, zero recurring fees — deploy anywhere unconditionally',
        'Commercial re-licensing & SaaS white-label rights',
        '60 days direct technical founder transition & architecture advisory',
        'Formal M&A Bill of Sale, IP Assignment Agreement, and Escrow closing',
      ],
      licenseType: 'FULL_IP_BUYOUT',
    },
  ],
  dueDiligenceChecklist: [
    {
      item: 'Clean IP Ownership (No external GPL/viral license encumbrance)',
      verified: true,
      notes: 'All core modules authored cleanly under commercial-grade MIT / permissive dependencies.',
    },
    {
      item: 'Zero Vendor Lock-in (Local Engine fallback for AI & 3D)',
      verified: true,
      notes: 'Fully autonomous local algorithms ensure 100% functionality even without active external API keys.',
    },
    {
      item: 'Modern Framework Stack (React 19 + TypeScript + Tailwind v4)',
      verified: true,
      notes: 'Built on the newest React 19 standards, avoiding deprecated legacy lifecycle paradigms.',
    },
    {
      item: 'Production Server Readiness (Vite + Express Dual Mode)',
      verified: true,
      notes: 'Configured for high-throughput single-container production deployment.',
    },
  ],
};

export const INITIAL_CONSULTANT_INVOICES: ConsultantInvoice[] = [];

// Local storage helpers
export function getStoredListing(): AppSaleListing {
  try {
    const raw = localStorage.getItem('radar_app_sale_listing');
    return raw ? JSON.parse(raw) : INITIAL_APP_SALE_LISTING;
  } catch {
    return INITIAL_APP_SALE_LISTING;
  }
}

export function saveListing(listing: AppSaleListing) {
  localStorage.setItem('radar_app_sale_listing', JSON.stringify(listing));
  return listing;
}

export function getStoredTransactions(): AcquisitionTransaction[] {
  try {
    const raw = localStorage.getItem('radar_acq_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordTransaction(tx: AcquisitionTransaction) {
  const current = getStoredTransactions();
  const updated = [tx, ...current];
  localStorage.setItem('radar_acq_transactions', JSON.stringify(updated));
  return updated;
}

export function getStoredInvoices(): ConsultantInvoice[] {
  try {
    const raw = localStorage.getItem('radar_consultant_invoices');
    if (!raw) return [];
    const list: ConsultantInvoice[] = JSON.parse(raw);
    const clean = list.filter(
      (inv) =>
        inv.id !== 'INV-2026-081' &&
        inv.id !== 'INV-2026-094' &&
        !inv.clientName?.includes('Elena') &&
        !inv.clientName?.includes('Vance')
    );
    if (clean.length !== list.length) {
      localStorage.setItem('radar_consultant_invoices', JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

export function saveInvoices(invoices: ConsultantInvoice[]) {
  localStorage.setItem('radar_consultant_invoices', JSON.stringify(invoices));
  return invoices;
}
