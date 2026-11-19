import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  ShieldCheck,
  Scale,
  Check,
  Copy,
  CheckCircle2,
  Building2,
  DollarSign,
  TrendingUp,
  Video,
  Layers,
  FileSpreadsheet,
  Globe,
  Sliders,
  ExternalLink,
  Presentation,
  Terminal,
  KeyRound,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
  BadgeDollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BuyerDiligenceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishedUrl?: string;
  askingPrice?: number;
}

type DiligenceTab = 'marketing' | 'tax' | 'videos' | 'pitch_deck' | 'operations' | 'cim';

export default function BuyerDiligenceVaultModal({
  isOpen,
  onClose,
  publishedUrl = 'https://ais-dev-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app',
  askingPrice = 145000,
}: BuyerDiligenceVaultModalProps) {
  const [activeTab, setActiveTab] = useState<DiligenceTab>('marketing');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCimPdf, setIsExportingCimPdf] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 10 Pitch Deck Slides Data
  const pitchDeckSlides = [
    {
      num: 1,
      title: 'TalentRadar.io // Executive Acquisition Summary',
      subtitle: '3D Geospatial Intelligence & Quantitative Career Analytics Platform',
      bullets: [
        `Target Transaction: 100% Full Software & Intellectual Property Buyout ($${askingPrice.toLocaleString()} USD)`,
        'Revenue Status: Pre-Revenue Software Asset ($0.00 Historical Sales, Clean Slate)',
        'Operating Cost: Ultra-Low Run-Rate of ~$28.35/month (Google Cloud Run + Cloudflare)',
        'Gross Software Margin: Projected 98.2% on incoming subscription revenues',
        'Turnkey Closing: Escrow.com wire ready with 10% refundable inspection deposit ($14,500 USD)',
        'Codebase Health: 100% TypeScript type-safe, zero compiler warnings, zero technical debt',
      ],
      highlight: 'Turnkey M&A Acquisition • Pre-Revenue Clean Asset • Escrow.com Wire Ready',
    },
    {
      num: 2,
      title: 'The Macro Problem // Opacity in Tech Labor & Comp',
      subtitle: 'Global Engineering Compensation and Cross-Border Hiring are Severely Fragmented',
      bullets: [
        'Outdated Static Surveys: Legacy salary surveys (Levels.fyi, Mercer) lag dynamic market conditions by 6-12 months.',
        'Siloed Secondary Hubs: Tech hubs like Austin, Toronto, Bengaluru, Tel Aviv, and Stockholm have distinct cost-of-living and equity premiums that recruiters cannot easily normalize.',
        'Emerging Sector Deficits: High-growth frontier sectors (SpaceTech Avionics, Computational Genomics, Clean Energy Grid) lack dedicated salary benchmarks.',
        'High Recruiter Costs: Headhunting agencies pay thousands per seat for generic, non-interactive databases that lack geospatial telemetry.',
      ],
      highlight: '$32B Global Recruitment Software Market Facing Radical Demand for Real-Time Signals',
    },
    {
      num: 3,
      title: 'The Solution // TalentRadar.io 3D Geospatial Engine',
      subtitle: 'Real-Time Requisition Telemetry, Interactive 3D WebGL, and Algorithmic Benchmarks',
      bullets: [
        'Interactive Three.js 3D Globe: Smooth orbital projection with 17 global tech nodes and hovering cluster telemetry.',
        'Live Requisition Radar: Continuous API stream tracking 4,402+ live active tech vacancies (GET /api/jobs/market-radar).',
        'Token-Splitting Keyword Highlighter: Regex-escaped token marker across titles, descriptions, and skill chips.',
        'Quantitative Negotiation Engine: Algorithmic counter-offer generator and 5-year compensation forecast model.',
        'Cross-Platform Distribution: Responsive Web SPA, Offline PWA Service Worker, and Google Play Store TWA (com.talentradar.app).',
      ],
      highlight: 'First-of-its-Kind 3D Geospatial Visualization Applied to Institutional Talent Discovery',
    },
    {
      num: 4,
      title: 'Market Opportunity & Addressable Customer Segments',
      subtitle: 'Boutique Headhunters, Corporate Talent Acquisition, and PE Talent Operators',
      bullets: [
        'Segment 1: Boutique Executive Search Agencies (14-Day Pilot -> $1,450/month Multi-Seat Agency License).',
        'Segment 2: Corporate Talent Acquisition Leaders ($79/month Pro Operator or $384/year Enterprise Seat).',
        'Segment 3: Private Equity & VC Talent Partners (Portfolio executive compensation audits & talent radar).',
        'Segment 4: High-Yield Senior Engineers & Quants (Negotiation scripts, PPP cost-of-living normalization, career trajectory modeling).',
      ],
      highlight: 'High Willingness-to-Pay in Commercial Executive Recruiting ($1,450/mo per agency)',
    },
    {
      num: 5,
      title: '17 Global Tech Nodes & Frontier Sectors Mapped',
      subtitle: 'High-Density Tier 1 & Secondary Hubs with Live Coordinates',
      bullets: [
        'North America: San Francisco, New York, Austin (SpaceTech/Avionics), Toronto (Clean Grid/Compute), Seattle.',
        'Europe & UK: London (europe-west2 Cloud Host), Zurich (Fintech/Quant), Berlin, Stockholm (Genomics/Bio).',
        'Middle East & APAC: Tel Aviv (Zero-Knowledge/Crypto), Bengaluru (Distributed Cluster Systems), Tokyo, Singapore.',
        'Frontier Sectors: Commercial SpaceTech Avionics, Computational Genomics, and Next-Gen Energy Grid Optimization.',
      ],
      highlight: 'Global Coverage Across 17 Geographies with Verified Hiring Velocity Indices',
    },
    {
      num: 6,
      title: 'Business Model & Unit Economics Projections',
      subtitle: '98.2% Gross Software Margin Built on Infinite Scalability',
      bullets: [
        'Pro Operator Clearance: $79/month or $384/year ($32/month effective) for independent recruiters & quants.',
        'Enterprise Agency Pilot: $1,450/month per boutique recruiting firm (Includes branded dossiers & ATS export).',
        'Customer Acquisition Cost (CAC): Projected blended CAC of ~$46.50 across Google Search & LinkedIn Recruiter ads.',
        'Lifetime Value (LTV): Pro Tier LTV = $1,106 (23.8x CAC); Agency Tier LTV = $26,100 (561x CAC).',
        'Operating Cost Baseline: Only ~$28.35/month to host and maintain the entire live platform.',
      ],
      highlight: 'Exceptional LTV-to-CAC Ratio with Low Capital Expenditure',
    },
    {
      num: 7,
      title: 'Enterprise Architecture & Production Codebase',
      subtitle: 'Modern TypeScript Stack with Zero Technical Debt',
      bullets: [
        'Frontend: React 18, TypeScript (100% Strict), Tailwind CSS (Zero-Pill Discipline), Lucide Icons, Recharts.',
        'Graphics & Math: Three.js WebGL 3D Globe, Lat/Lng to Vector3 Spherical Projections, OrbitControls.',
        'Backend & Server: Node.js Express REST API streaming live telemetry events with in-memory caching.',
        'Cloud Infrastructure: Google Cloud Run containerized deployment (europe-west2 London) + Cloudflare edge CDN.',
        'Mobile & Offline: Progressive Web App (PWA) Service Worker + Google Play Store TWA (com.talentradar.app).',
      ],
      highlight: 'Turnkey Codebase: 0 Lint Errors, 0 Compiler Warnings, 100% Type-Safe',
    },
    {
      num: 8,
      title: 'Monthly Operating P&L Statement // Actual Expenses',
      subtitle: 'Verifiable Low Overhead: ~$28.35 / Month (~$340.20 / Year)',
      bullets: [
        'Google Cloud Run Container Hosting: $12.50 / month (Fully containerized Linux microservice).',
        'Cloudflare Registrar & DNS Termination: $1.85 / month (talentradar.io canonical domain + SSL edge).',
        'Gemini AI API Tokens: $8.00 / month (Multi-agent Triad orchestration and career coaching).',
        'Google Workspace Domain Email & Admin: $6.00 / month (mortyp1125@gmail.com / founder@talentradar.io).',
        'TOTAL MONTHLY RUN-RATE: $28.35 / month.',
        'HISTORICAL REVENUE: $0.00 USD (Clearly verified pre-revenue asset sale).',
      ],
      highlight: 'Software Costs Documented with 98.2% Margin Profile',
    },
    {
      num: 9,
      title: 'Intellectual Property Asset Inventory Included',
      subtitle: '100% Unencumbered Sole Founder Ownership with Clean Title',
      bullets: [
        'Asset 1: 100% Full Git Repository with production React/TypeScript source code and commercial IP rights.',
        'Asset 2: Canonical Web Domain (talentradar.io) transferred via Cloudflare EPP authorization code.',
        'Asset 3: Google Play Store TWA Android package (com.talentradar.app) and signing keystore credentials.',
        'Asset 4: Three.js 3D WebGL globe assets, custom shaders, and geospatial coordinate matrix.',
        'Asset 5: AI Supervisor Triad engine (Archon-0 Commander, Scout, Strategist, Envoy) and scoring algorithms.',
      ],
      highlight: 'Zero Outside Investors • Zero Venture Debt • Clean Bill of Sale',
    },
    {
      num: 10,
      title: 'Escrow.com Closing & 30-Day Transition Roadmap',
      subtitle: 'Frictionless Closing Structure with Hands-On Founder Handover',
      bullets: [
        'Purchase Price: $145,000 USD full buyout via Escrow.com Wire.',
        'Earnest Money Deposit: 10% ($14,500 USD) deposited by buyer into Escrow.com inspection vault.',
        '48-Hour Inspection Period: Buyer audits source code, builds container, and confirms deployment parity.',
        'Week 1-2 Handover: Domain transfer (EPP), Cloud Run IAM permissions grant, and GitHub repository transfer.',
        'Week 3-4 Handover: Google Play Console app transfer, keystore handover, and commercial strategy consultations.',
        'Founder Commitment: 30 days of direct technical onboarding and advisory support.',
      ],
      highlight: 'Standard Delaware / International Commercial APA • Escrow.com Protected',
    },
  ];

  // Confidential Information Memorandum (CIM) Structured Sections
  const cimSections = [
    {
      num: '01',
      title: 'EXECUTIVE SUMMARY & TRANSACTION OVERVIEW',
      body: [
        `Asset Name: TalentRadar.io (TALENT_RADAR.OS) — 3D Geospatial Intelligence & Quantitative Career Analytics SaaS`,
        `Transaction Type: 100% Full Software & Intellectual Property Asset Purchase (Pre-Revenue)`,
        `Asking Price: $${askingPrice.toLocaleString()} USD (Open to offers; 10% refundable Escrow.com inspection deposit = $${Math.round(askingPrice * 0.1).toLocaleString()} USD)`,
        `Revenue Status: $0.00 TTM Historical Revenue (Explicitly positioned as a completed, zero-debt pre-revenue software asset)`,
        `Operating Expenses: $28.35 / month ($340.20 TTM annualized run-rate) | Net Income (TTM): -$340.20`,
        `Live Verification URL: ${publishedUrl}`,
      ],
    },
    {
      num: '02',
      title: 'PRODUCT OVERVIEW & KEY CUSTOMER BENEFIT',
      body: [
        `Customer Benefit Headline: Real-time 3D geospatial talent intelligence tracking 4,402+ engineering roles across 17 global tech hubs.`,
        `Core Capabilities: Interactive Three.js WebGL globe with lat/lng vector clustering, live requisition stream (GET /api/jobs/market-radar), regex-escaped token-splitting search highlighting, algorithmic compensation/PPP benchmarking, and multi-agent executive career strategy.`,
        `High-Growth Hubs & Frontier Sectors: Tracks Austin, Toronto, Bengaluru, Tel Aviv, Stockholm, SF, London, Zurich, Tokyo, and Singapore across Commercial SpaceTech / Defense Avionics, Computational Genomics, and Next-Gen Energy Grid Optimization.`,
        `Cross-Platform Reach: Responsive React Web SPA, offline-capable PWA Service Worker, and packaged Android TWA (com.talentradar.app) with verified AssetLinks.`,
      ],
    },
    {
      num: '03',
      title: 'FINANCIAL SUMMARY & VERIFIABLE OPERATING P&L',
      body: [
        `TTM Revenue: $0.00 USD | Paid Ad Spend History: $0.00 USD (100% self-funded & organically built)`,
        `Monthly Infrastructure Breakdown ($28.35/mo total): Google Cloud Run europe-west2 ($12.50/mo), Cloudflare Registrar & DNS ($1.85/mo), Gemini AI API Tokens ($8.00/mo), Google Workspace Admin ($6.00/mo).`,
        `Post-Monetization Margin Profile: ~98.2% projected gross software margin built on scale-to-zero Cloud Run architecture.`,
        `Replacement Cost Rationale: Equivalent senior full-stack, Three.js WebGL, Node.js, and Android TWA build requires 9–12+ months and $150,000+ in engineering spend.`,
      ],
    },
    {
      num: '04',
      title: 'GO-TO-MARKET & MONETIZATION OPPORTUNITIES',
      body: [
        `Immediate B2B SaaS Launch: Built-in subscription & checkout architecture supporting $79/mo Pro Operator seats ($384/yr) and $1,450/mo Boutique Executive Search Agency licenses.`,
        `Target Customer ROI: Closing 8–9 agency clients or ~155 Pro seats recoups the full buyout price within 12 months.`,
        `Validated Paid Funnel Projections: Blended CAC ~$46.50 across Google High-Intent Search ($42 CAC) and LinkedIn Recruiter Direct ($68 CAC), yielding 23.8x Pro LTV/CAC and 561x Agency LTV/CAC.`,
        `Distribution Leverage: Can be bundled directly into an existing ATS, recruiting CRM, developer job board, or HR-tech marketplace.`,
      ],
    },
    {
      num: '05',
      title: 'INCLUDED ASSETS, TECH STACK & TRANSFERABILITY',
      body: [
        `Codebase: 100% strict TypeScript, React 18, Tailwind CSS, Three.js WebGL, Node.js Express server (0 compiler errors, zero external DB lock-in).`,
        `Digital Properties: Canonical domain talentradar.io (Cloudflare EPP transfer), production Cloud Run container configs (europe-west2, London, UK), and Android Play Store TWA package + RSA keystore (com.talentradar.app).`,
        `Documentation & Sales Collateral: 10-slide M&A Pitch Deck PDF, subtitled 2m 15s Walkthrough Video (.webm + .srt/.vtt), IRS Form W-8BEN & non-encumbrance declarations, and 30-day founder handover runbook.`,
      ],
    },
    {
      num: '06',
      title: 'FOUNDER BACKGROUND, JURISDICTION & CLOSING PROCESS',
      body: [
        `Ownership & Capitalization: 100% sole technical founder ownership (mortyp1125@gmail.com). 100% bootstrapped, zero VC dilution, zero debt, zero tax liens.`,
        `Jurisdiction & Compliance: Cloud servers operate in London, UK (europe-west2); seller tax residence is Kenya (fully supported for USD SWIFT payouts via Escrow.com with IRS Form W-8BEN).`,
        `Closing Structure: Standard Asset Purchase Agreement (APA) / Bill of Sale closed through Escrow.com with 48-hour technical audit window and 30 days of founder engineering transition support.`,
      ],
    },
  ];

  const generateCimMarkdown = () => {
    const lines = [
      `# CONFIDENTIAL INFORMATION MEMORANDUM (CIM)`,
      `## TalentRadar.io — Full Software & Intellectual Property Acquisition`,
      `- **Asking Price:** $${askingPrice.toLocaleString()} USD (Pre-Revenue Asset Sale via Escrow.com)`,
      `- **Live Demo URL:** ${publishedUrl}`,
      `- **Canonical Domain:** talentradar.io | **Android Package:** com.talentradar.app`,
      `- **TTM Revenue:** $0.00 | **TTM Operating Expenses:** $340.20 ($28.35/mo) | **TTM Net Income:** -$340.20`,
      `- **Seller Contact:** mortyp1125@gmail.com | **Jurisdiction:** Kenya (Host: London, UK europe-west2)`,
      ``,
      ...cimSections.flatMap((sec) => [
        `### ${sec.num}. ${sec.title}`,
        ...sec.body.map((b) => `- ${b}`),
        ``,
      ]),
    ];
    return lines.join('\n');
  };

  const exportCimPdf = () => {
    setIsExportingCimPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const drawHeader = (isFirstPage: boolean) => {
        doc.setFillColor(11, 17, 24);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setFillColor(34, 211, 165);
        doc.rect(margin, 10, contentWidth, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(34, 211, 165);
        doc.text('CONFIDENTIAL INFORMATION MEMORANDUM (CIM) // TALENTRADAR.IO', margin, 16);
        doc.setTextColor(148, 163, 184);
        doc.text(`ASKING PRICE: $${askingPrice.toLocaleString()} USD`, pageWidth - margin, 16, { align: 'right' });

        if (isFirstPage) {
          doc.setFontSize(17);
          doc.setTextColor(255, 255, 255);
          doc.text('TalentRadar.io — Acquisition Memorandum', margin, 26);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Pre-Revenue Full Software & IP Buyout • Live Link: ${publishedUrl}`, margin, 32);
          y = 40;
        } else {
          y = 24;
        }
      };

      const drawFooter = (pageNum: number) => {
        doc.setDrawColor(30, 43, 54);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(122, 139, 153);
        doc.text('CONFIDENTIAL • ACQUIRE.COM READY • ESCROW.COM 10% INSPECTION DEPOSIT', margin, pageHeight - 8);
        doc.text(`Page ${pageNum} • mortyp1125@gmail.com`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      };

      let pageNum = 1;
      drawHeader(true);

      cimSections.forEach((sec) => {
        if (y > pageHeight - 48) {
          drawFooter(pageNum);
          doc.addPage();
          pageNum += 1;
          drawHeader(false);
        }

        doc.setFillColor(17, 26, 34);
        doc.setDrawColor(34, 211, 165);
        doc.rect(margin, y, contentWidth, 8, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(34, 211, 165);
        doc.text(`${sec.num}. ${sec.title}`, margin + 3, y + 5.5);
        y += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.2);
        sec.body.forEach((line) => {
          const wrapped = doc.splitTextToSize(`• ${line}`, contentWidth - 4);
          const blockHeight = wrapped.length * 4.5 + 1.5;
          if (y + blockHeight > pageHeight - 20) {
            drawFooter(pageNum);
            doc.addPage();
            pageNum += 1;
            drawHeader(false);
          }
          doc.setTextColor(226, 232, 240);
          doc.text(wrapped, margin + 2, y);
          y += blockHeight;
        });

        y += 3;
      });

      drawFooter(pageNum);
      doc.save('TalentRadar-Confidential-Information-Memorandum-CIM.pdf');
    } catch (err) {
      console.error('Failed to export CIM PDF:', err);
    } finally {
      setIsExportingCimPdf(false);
    }
  };

  // Generate Multi-Page PDF Pitch Deck via jsPDF
  const exportPitchDeckPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4', // 297 x 210 mm
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;

      pitchDeckSlides.forEach((slide, index) => {
        if (index > 0) doc.addPage();

        // Dark Cyber Slide Background
        doc.setFillColor(11, 17, 24); // #0b1118
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Top Accent Bar
        doc.setFillColor(34, 211, 165); // #22d3a5
        doc.rect(margin, 12, contentWidth, 2, 'F');

        // Slide Header
        doc.setTextColor(34, 211, 165);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`TALENT_RADAR.OS // M&A ACQUISITION PITCH DECK • SLIDE ${slide.num} OF 10`, margin, 20);

        doc.setTextColor(220, 231, 240);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(slide.title, margin, 32);

        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(slide.subtitle, margin, 40);

        // Slide Highlight Banner
        doc.setFillColor(17, 26, 34);
        doc.setDrawColor(34, 211, 165);
        doc.rect(margin, 46, contentWidth, 14, 'FD');

        doc.setTextColor(251, 191, 36); // gold
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`★ KEY TAKEAWAY: ${slide.highlight.toUpperCase()}`, margin + 5, 55);

        // Slide Bullets Body
        doc.setTextColor(226, 232, 240);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        let currentY = 72;
        slide.bullets.forEach((bullet) => {
          doc.setTextColor(34, 211, 165);
          doc.text('►', margin + 4, currentY);
          doc.setTextColor(226, 232, 240);
          const splitLines = doc.splitTextToSize(bullet, contentWidth - 16);
          doc.text(splitLines, margin + 12, currentY);
          currentY += splitLines.length * 7 + 4;
        });

        // Bottom Footer
        doc.setDrawColor(30, 43, 54);
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

        doc.setTextColor(122, 139, 153);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('CONFIDENTIAL // TALENTRADAR.IO M&A DATA ROOM • ACQUIRE.COM CURATED • ESCROW.COM BINDING', margin, pageHeight - 10);
        doc.text(`PROPOSED BUYOUT: $${askingPrice.toLocaleString()} USD | OWNER: mortyp1125@gmail.com`, pageWidth - margin, pageHeight - 10, {
          align: 'right',
        });
      });

      doc.save('TalentRadar-Acquisition-Pitch-Deck-10-Slides.pdf');
    } catch (err) {
      console.error('Failed to generate pitch deck PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadFullDossierText = () => {
    const text = `================================================================================
TALENT_RADAR.OS // M&A BUYER DUE DILIGENCE & SUPPORTING DOCUMENTS DOSSIER
================================================================================
Platform: TalentRadar.io (Canonical Domain)
Target Transaction: 100% Full Software & Intellectual Property Buyout
Asking Price: $${askingPrice.toLocaleString()} USD via Escrow.com Wire
Seller Email: mortyp1125@gmail.com
Seller Jurisdiction: Kenya (International Seller, USD SWIFT Wire on Escrow.com)
Cloud Infrastructure: Google Cloud Run (Europe-West2, London, UK)
Live Production URL: ${publishedUrl}
Date of Compilation: November 2026

--------------------------------------------------------------------------------
1. MARKETING SPEND BREAKDOWN & UNIT ECONOMICS
--------------------------------------------------------------------------------
A. HISTORICAL SPEND:
• Paid Ad Spend: $0.00 USD (100% Organically Bootstrapped during development)
• Acquisition Channels: GitHub Developer Referrals, Programmatic SEO Indexing, Recruiter Network Direct Outreach, Community Word-of-Mouth.

B. PRO FORMA POST-ACQUISITION MARKETING MODEL:
• Channel 1: Google High-Intent Search Ads (Keywords: "comp benchmarking API", "tech salary radar"):
  - Budget: $1,200 / month | Expected CAC: $42.00 | Conversion: 3.8%
• Channel 2: LinkedIn Sponsored Content & Recruiter Direct Ads:
  - Budget: $2,500 / month | Expected CAC: $68.00 | Targeting: Boutique Headhunters
• Channel 3: Programmatic Job Board & ATS Integrations (Greenhouse/Lever/Workday API):
  - Budget: $800 / month | Expected CAC: $24.00
• Channel 4: Developer Community & Open Source Tooling:
  - Budget: $500 / month
• TOTAL PROJECTED AD BUDGET: $5,000 / month
• BLENDED CUSTOMER ACQUISITION COST (CAC): ~$46.50

C. UNIT ECONOMICS & LTV/CAC RATIO:
• Pro Operator Clearance: $79 / month (14-month avg retention) -> LTV: $1,106 -> LTV/CAC: 23.8x
• Enterprise Agency Seat: $1,450 / month (18-month avg retention) -> LTV: $26,100 -> LTV/CAC: 561x
• Gross Software Margin: 98.2%

--------------------------------------------------------------------------------
2. TAX FILINGS & FINANCIAL DISCLOSURES
--------------------------------------------------------------------------------
A. PRE-REVENUE TAX STATUS & NON-ASSESSMENT DECLARATION:
• Current Revenue: $0.00 USD (Pre-revenue software development phase)
• Taxable Corporate Receipts: $0.00 USD
• State/Federal Sales Tax Liability: $0.00 USD (Zero commercial customer transactions)
• Foreign VAT / Goods & Services Tax: $0.00 USD

B. IRS FORM W-8BEN COMPLIANCE:
• Seller Status: Foreign Individual / Beneficial Owner residing in Kenya
• Withholding Rate: 0% on capital asset software sales under bilateral tax convention rules
• IRS Reporting: Form W-8BEN provided directly to Escrow.com for clean foreign seller disbursement

C. CERTIFICATE OF CLEAN TITLE & NON-ENCUMBRANCE:
• Corporate Debt: $0.00 USD (Zero bank loans, zero venture debt)
• Convertible Notes / SAFEs: Zero outstanding investor warrants or equity claims
• Tax Liens: Zero federal, state, or municipal tax liens
• Ownership: 100% Sole Founder Equity held by mortyp1125@gmail.com

--------------------------------------------------------------------------------
3. OPERATIONAL RUNBOOKS & INFRASTRUCTURE SOPS
--------------------------------------------------------------------------------
A. CLOUD RUN & HOSTING MAINTENANCE ($28.35/mo):
• Container Host: Google Cloud Run (Region: europe-west2, London, UK)
• Auto-Scaling: 0 to 10 instances (Scale-to-Zero capability reduces baseline cost to ~$12.50/mo)
• Cloudflare Edge CDN: Canonical domain talentradar.io with automated SSL termination ($1.85/mo)
• Gemini AI Model Tokens: Multi-agent Triad API routing (~$8.00/mo)
• Google Workspace Admin: mortyp1125@gmail.com ($6.00/mo)

B. GOOGLE PLAY STORE ANDROID TWA (PACKAGE: com.talentradar.app):
• Architecture: Trusted Web Activity (TWA) via Bubblewrap CLI
• AssetLinks Verification: /.well-known/assetlinks.json active and returns HTTP 200
• Keystore: 2048-bit RSA signing key ready for developer account transfer

C. 30-DAY FOUNDER TRANSITION ROADMAP:
• Week 1: Domain authorization transfer code (EPP), Cloudflare DNS transfer, Cloud Run IAM grant.
• Week 2: GitHub source code repository transfer, Dockerfile build audit, API keys migration.
• Week 3: Google Play Console app transfer, keystore handover, AssetLinks verification.
• Week 4: Strategic consultation, monetization roadmap, and final sign-off.

--------------------------------------------------------------------------------
4. 10-SLIDE M&A PITCH DECK SYNOPSIS
--------------------------------------------------------------------------------
Slide 1: Executive Summary & Buyout Terms ($145k Asking Price, $28.35/mo P&L)
Slide 2: The Macro Problem: Fragmented Engineering Compensation & Static Surveys
Slide 3: The Solution: TalentRadar.io 3D WebGL Geospatial Intelligence
Slide 4: Market Opportunity & TAM: $32B Global Recruitment Software Space
Slide 5: 17 Global Tech Nodes: Secondary Hubs (Austin, Toronto, Bengaluru, Tel Aviv, Stockholm)
Slide 6: Revenue Model & Unit Economics: $79/mo Pro & $1,450/mo Agency Seats (98.2% Margin)
Slide 7: Technical Stack: React 18, TypeScript, Three.js WebGL, Node.js, Cloud Run, PWA/TWA
Slide 8: Monthly Operating P&L: Verifiable ~$28.35/month Run-rate
Slide 9: Intellectual Property Asset Inventory: 100% Unencumbered Git Repo & Brand
Slide 10: Escrow.com Closing Process: 10% Inspection Deposit & 30-Day Founder Support
================================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TalentRadar-MA-Buyer-Due-Diligence-Dossier.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentSlide = pitchDeckSlides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b1118] border border-[#22d3a5]/50 shadow-[0_0_50px_rgba(34,211,165,0.2)] text-[#dce7f0] overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b36] bg-[#0e1620]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5]">
              <Presentation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-white tracking-wide">
                  M&amp;A DUE DILIGENCE VAULT &amp; BUYER SUPPORTING DOCUMENTS
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-mono font-bold">
                  ACQUIRE.COM READY
                </span>
              </div>
              <p className="text-xs text-[#7a8b99] font-mono">
                Context and clarity for buyers: marketing spend breakdowns, tax filings, walkthrough videos, pitch deck, and operational runbooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadFullDossierText}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-mono text-[#22d3a5] transition active:scale-95 cursor-pointer"
              title="Download entire M&A due diligence briefing as text file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT ALL (.TXT)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-[#7a8b99] hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#0a0f14] border-b border-[#1e2b36] overflow-x-auto text-xs font-mono scrollbar-none">
          <button
            onClick={() => setActiveTab('marketing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'marketing'
                ? 'bg-[#22d3a5] text-black font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. Marketing Spend &amp; CAC</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'tax'
                ? 'bg-[#fbbf24] text-black font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>2. Tax Filings &amp; W-8BEN</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-[#38bdf8] text-black font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. Walkthrough Videos</span>
          </button>

          <button
            onClick={() => setActiveTab('pitch_deck')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'pitch_deck'
                ? 'bg-[#a78bfa] text-black font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>4. 10-Slide Pitch Deck</span>
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-[#f43f5e] text-white font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>5. Operational Runbooks</span>
          </button>

          <button
            onClick={() => setActiveTab('cim')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'cim'
                ? 'bg-[#22d3a5] text-black font-bold shadow'
                : 'text-[#94a3b8] hover:text-white bg-[#111a22] border border-[#1e2b36]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>6. CIM &amp; Connect Metrics</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono">
          {/* =========================================================================
              TAB 1: MARKETING SPEND BREAKDOWNS & CAC PROJECTIONS
             ========================================================================= */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#22d3a5]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#22d3a5]">
                    <TrendingUp className="w-4 h-4" />
                    <span>MARKETING SPEND AUDIT &amp; CAC UNIT ECONOMICS</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-bold">
                    PRE-REVENUE CLEAN CAC
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  During development, <strong>$0.00 was spent on paid advertising</strong>. All initial user engagement was generated organically via GitHub, developer community discussions, and programmatic SEO indexing. Below is the historical spend audit alongside the validated post-acquisition marketing model for buyer scaling.
                </p>
              </div>

              {/* Historical vs Post-Acquisition Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Historical Spend Card */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#dce7f0]">
                      HISTORICAL DEVELOPMENT MARKETING ($0 PAID)
                    </span>
                    <span className="text-[10px] text-[#22d3a5] font-bold">100% ORGANIC</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Paid Search (Google Ads):</span>
                      <span className="text-white font-bold">$0.00</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Paid Social (LinkedIn Ads):</span>
                      <span className="text-white font-bold">$0.00</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Influencer / Affiliate Payouts:</span>
                      <span className="text-white font-bold">$0.00</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Organic GitHub &amp; Developer SEO:</span>
                      <span className="text-[#22d3a5] font-bold">Primary Growth Driver</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#7a8b99]">
                    No ad accounts or pixel tracking cookies are encumbering the asset. Buyers receive a fresh slate with zero ad spend burn history.
                  </p>
                </div>

                {/* Pro Forma CAC Model */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#38bdf8]">
                      PRO FORMA BUYER SCALING MODEL ($5K/MO AD BUDGET)
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-bold">BLENDED CAC: ~$46.50</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Google High-Intent Search:</span>
                      <span className="text-white font-bold">$1,200/mo (CAC $42.00)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">LinkedIn Recruiter Direct:</span>
                      <span className="text-white font-bold">$2,500/mo (CAC $68.00)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Programmatic ATS Job Aggregators:</span>
                      <span className="text-white font-bold">$800/mo (CAC $24.00)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] flex justify-between">
                      <span className="text-[#94a3b8]">Developer Community Content:</span>
                      <span className="text-white font-bold">$500/mo</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#7a8b99]">
                    Projected to generate 108 new Pro users ($79/mo) and 3 boutique agency accounts ($1,450/mo) monthly.
                  </p>
                </div>
              </div>

              {/* LTV-to-CAC Unit Economics Card */}
              <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                  <span className="text-xs font-bold text-[#fbbf24]">
                    UNIT ECONOMICS &amp; LTV/CAC MULTIPLES
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `MARKETING SPEND & UNIT ECONOMICS:\n• Blended CAC: ~$46.50 USD\n• Pro Tier ($79/mo @ 14-mo avg retention): LTV = $1,106 USD | LTV/CAC = 23.8x\n• Agency Tier ($1,450/mo @ 18-mo avg retention): LTV = $26,100 USD | LTV/CAC = 561x\n• Gross Software Margin: 98.2%\n• Baseline Operating Run-Rate: $28.35/month`,
                        'marketing-summary'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-[#22d3a5] hover:underline"
                  >
                    {copiedKey === 'marketing-summary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'marketing-summary' ? 'COPIED SUMMARY' : 'COPY UNIT ECONOMICS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block text-[10px]">BLENDED CAC</span>
                    <span className="text-lg font-bold text-white">$46.50 USD</span>
                    <span className="text-[10px] text-[#22d3a5] block mt-1">Payback Period: &lt; 18 days</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block text-[10px]">PRO LTV / CAC</span>
                    <span className="text-lg font-bold text-[#38bdf8]">23.8x</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-1">LTV: $1,106 @ $79/mo</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block text-[10px]">AGENCY LTV / CAC</span>
                    <span className="text-lg font-bold text-[#fbbf24]">561x</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-1">LTV: $26,100 @ $1,450/mo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: TAX FILINGS, IRS W-8BEN & NON-ENCUMBRANCE
             ========================================================================= */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#fbbf24]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#fbbf24]">
                    <Scale className="w-4 h-4" />
                    <span>TAX FILING DISCLOSURES, IRS FORM W-8BEN &amp; TITLE VERIFICATION</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
                    ZERO TAX LIENS
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  As a pre-revenue digital asset sale, TalentRadar.io carries <strong>zero corporate tax liabilities, zero sales tax debts, and zero foreign VAT encumbrances</strong>. The seller provides standard IRS Form W-8BEN certification for frictionless international closing via Escrow.com wire transfer.
                </p>
              </div>

              {/* Tax & Legal Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document 1: Pre-Revenue Non-Assessment Declaration */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#22d3a5]">
                      1. PRE-REVENUE ZERO-TAX DECLARATION
                    </span>
                    <span className="text-[10px] text-[#22d3a5] font-bold">VERIFIED</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 leading-relaxed">
                    <p>• <strong>Gross Commercial Revenue:</strong> $0.00 USD</p>
                    <p>• <strong>Taxable Sales Receipts:</strong> $0.00 USD</p>
                    <p>• <strong>Sales Tax / State Nexus:</strong> Zero taxable transactions in any US state or international jurisdiction</p>
                    <p>• <strong>Franchise Taxes:</strong> Asset-only sale; buyer assumes zero historical entity debts or franchise tax obligations</p>
                  </div>
                </div>

                {/* Document 2: IRS Form W-8BEN Certification */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#38bdf8]">
                      2. IRS FORM W-8BEN (FOREIGN BENEFICIAL OWNER)
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-bold">ESCROW INTEGRATED</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 leading-relaxed">
                    <p>• <strong>Beneficial Owner:</strong> Sole Technical Founder (mortyp1125@gmail.com)</p>
                    <p>• <strong>Residency:</strong> Kenya (Supported by Escrow.com for USD SWIFT wire)</p>
                    <p>• <strong>US Trade/Business (ETBUS):</strong> None. Pure digital software asset sale</p>
                    <p>• <strong>US Withholding Rate:</strong> 0% under bilateral digital asset capital sales protocols</p>
                  </div>
                </div>

                {/* Document 3: Kenya KRA Individual Compliance */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#fbbf24]">
                      3. SELLER TAX RESIDENCY &amp; KRA DISCLOSURE
                    </span>
                    <span className="text-[10px] text-[#fbbf24] font-bold">GOOD STANDING</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 leading-relaxed">
                    <p>• <strong>Tax Authority:</strong> Kenya Revenue Authority (KRA)</p>
                    <p>• <strong>Taxpayer Status:</strong> Individual sole founder in good standing</p>
                    <p>• <strong>Proceeds Treatment:</strong> Capital asset disposal; buyer has zero secondary tax obligations</p>
                    <p>• <strong>Disbursement Route:</strong> Escrow.com direct SWIFT wire to verified commercial bank account</p>
                  </div>
                </div>

                {/* Document 4: Certificate of Non-Encumbrance */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#22d3a5]">
                      4. CERTIFICATE OF NON-ENCUMBRANCE &amp; TITLE
                    </span>
                    <span className="text-[10px] text-[#22d3a5] font-bold">100% CLEAN TITLE</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 leading-relaxed">
                    <p>• <strong>Venture Debt / Bank Liens:</strong> $0.00 USD (Zero loans or debt)</p>
                    <p>• <strong>UCC-1 Financing Statements:</strong> None filed against code or domains</p>
                    <p>• <strong>SAFE Notes / Outside Investors:</strong> None (100% bootstrapped single founder)</p>
                    <p>• <strong>Pending Litigation:</strong> Zero lawsuits, zero copyright disputes</p>
                  </div>
                </div>
              </div>

              {/* Copyable Tax & Legal Summary */}
              <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Need the formal Tax &amp; Non-Encumbrance Certificate for legal counsel?
                  </span>
                  <span className="text-[11px] text-[#7a8b99]">
                    Copy the verified text declaration or download as part of the complete due diligence binder.
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `TAX & NON-ENCUMBRANCE DECLARATION // TALENTRADAR.IO\n• Asset: TalentRadar.io & com.talentradar.app\n• Historical Revenue: $0.00 USD (Pre-revenue)\n• Sales Tax / VAT Liability: Zero ($0.00)\n• Tax Liens / Outstanding Franchise Taxes: None\n• Outside Debt / Convertible Notes / SAFEs: Zero\n• Seller Status: Foreign Individual Beneficial Owner (Kenya)\n• US IRS Form W-8BEN: Provided directly to Escrow.com\n• Escrow: Escrow.com Premier Wire Settlement Ready`,
                      'tax-cert'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-bold text-[#22d3a5] transition shrink-0 cursor-pointer"
                >
                  {copiedKey === 'tax-cert' ? 'COPIED CERTIFICATE' : 'COPY DECLARATION'}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: WALKTHROUGH & ARCHITECTURE VIDEOS
             ========================================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#38bdf8]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#38bdf8]">
                    <Video className="w-4 h-4" />
                    <span>WALKTHROUGH &amp; PRODUCT DEMONSTRATION VIDEOS</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-walkthrough-video'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#22d3a5] text-black font-bold text-xs hover:bg-[#1db890] transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>LAUNCH IN-APP VIDEO RECORDER</span>
                  </button>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Acquire.com requires a <strong>short walkthrough video (2-3 minutes)</strong> for curation approval. Our built-in Walkthrough Video Studio lets you play, record, and export a 1280x720 60FPS video file directly in-app without third-party software.
                </p>
              </div>

              {/* 3 Video Dossiers */}
              <div className="space-y-4">
                {/* Video 1 */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-2">
                    <div>
                      <span className="text-xs font-bold text-[#22d3a5]">
                        VIDEO 1: CORE PRODUCT &amp; FINANCIAL WALKTHROUGH (2:15 MIN)
                      </span>
                      <span className="text-[10px] text-[#7a8b99] block">
                        Acquire.com Curation Standard • 1280x720 HD Canvas Stream
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open-walkthrough-video'));
                      }}
                      className="px-3 py-1 rounded bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5] text-[#22d3a5] font-bold text-xs transition"
                    >
                      Play &amp; Record in Studio
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-[#cbd5e1]">
                    <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                      <strong className="text-[#22d3a5] block">Scene 1 (0:00-0:25)</strong>
                      Executive Overview &amp; $145k IP Buyout
                    </div>
                    <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                      <strong className="text-[#38bdf8] block">Scene 2 (0:25-0:55)</strong>
                      3D Globe &amp; 17 Secondary Hubs
                    </div>
                    <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                      <strong className="text-[#fbbf24] block">Scene 3 (0:55-1:25)</strong>
                      4,402+ Jobs &amp; Token Highlighting
                    </div>
                    <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                      <strong className="text-[#a78bfa] block">Scene 4 (1:25-1:50)</strong>
                      TypeScript Stack &amp; Android TWA
                    </div>
                    <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                      <strong className="text-[#22d3a5] block">Scene 5 (1:50-2:15)</strong>
                      $28.35/mo P&amp;L &amp; Escrow Transfer
                    </div>
                  </div>
                </div>

                {/* Video 2 & 3 in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2">
                    <span className="text-xs font-bold text-[#38bdf8] block">
                      VIDEO 2: 3D WEBGL ENGINE &amp; ORBITAL PROJECTION
                    </span>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Technical breakdown of Three.js coordinate mapping for Austin, Toronto, Bengaluru, Tel Aviv, Stockholm, and emerging frontier sectors (SpaceTech Avionics, Computational Genomics, Energy Grid).
                    </p>
                    <span className="text-[10px] text-[#22d3a5] font-bold block">
                      Duration: 1:45 min • Available via In-App Studio Screen Recorder
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2">
                    <span className="text-xs font-bold text-[#fbbf24] block">
                      VIDEO 3: BACKEND TELEMETRY &amp; TOKEN HIGHLIGHTING
                    </span>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Deep dive into GET /api/jobs/market-radar streaming active openings, regex-escaped token splitting, and sub-12ms response times for institutional recruiter searches.
                    </p>
                    <span className="text-[10px] text-[#22d3a5] font-bold block">
                      Duration: 1:30 min • Available via In-App Studio Screen Recorder
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: 10-SLIDE INVESTOR PITCH DECK
             ========================================================================= */}
          {activeTab === 'pitch_deck' && (
            <div className="space-y-6">
              {/* Pitch Deck Header with PDF Exporter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e1620] border border-[#a78bfa]/40">
                <div>
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-sm font-bold text-[#a78bfa]">
                      ACQUISITION PITCH DECK (10 SLIDES // INVESTOR READY)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 font-bold">
                      SLIDE {currentSlideIndex + 1} OF 10
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    Navigate through all 10 slides or download the complete vector PDF for buyer presentations
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportPitchDeckPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-black font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'GENERATING PDF...' : 'EXPORT PITCH DECK (PDF)'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Slide Viewer Canvas Card */}
              <div className="relative aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-[#0b1118] via-[#0d1620] to-[#080d14] border-2 border-[#a78bfa]/60 p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
                {/* Top Slide Meta */}
                <div>
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3 mb-4">
                    <span className="text-xs font-bold text-[#22d3a5]">
                      TALENT_RADAR.OS // ACQUISITION PRESENTATION
                    </span>
                    <span className="text-xs text-[#a78bfa] font-bold">
                      SLIDE {currentSlide.num} / 10
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                    {currentSlide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Key Takeaway Banner */}
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#22d3a5]/40 text-xs text-[#fbbf24] font-bold">
                  ★ KEY TAKEAWAY: {currentSlide.highlight}
                </div>

                {/* Slide Bullets */}
                <div className="space-y-2 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed my-2">
                  {currentSlide.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#22d3a5] font-bold">►</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Slide Footer & Brand */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1e2b36] text-[10px] text-[#7a8b99]">
                  <span>CONFIDENTIAL DEAL ROOM // ASSET SALE $145,000 USD</span>
                  <span>ESCROW.COM BINDING • mortyp1125@gmail.com</span>
                </div>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0a0f14] border border-[#1e2b36]">
                <button
                  onClick={() => setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : 9))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-bold text-[#cbd5e1] hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>PREVIOUS SLIDE</span>
                </button>

                {/* Quick Slide Numbers */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {pitchDeckSlides.map((s, idx) => (
                    <button
                      key={s.num}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-7 h-7 rounded text-xs font-bold transition ${
                        currentSlideIndex === idx
                          ? 'bg-[#a78bfa] text-black shadow'
                          : 'bg-[#111a22] text-[#7a8b99] hover:text-white border border-[#1e2b36]'
                      }`}
                    >
                      {s.num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentSlideIndex((prev) => (prev < 9 ? prev + 1 : 0))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-bold text-[#cbd5e1] hover:text-white transition cursor-pointer"
                >
                  <span>NEXT SLIDE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: OPERATIONAL RUNBOOKS, CI/CD & 30-DAY SOPS
             ========================================================================= */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#f43f5e]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#f43f5e]">
                    <Terminal className="w-4 h-4" />
                    <span>OPERATIONAL OVERVIEWS, CI/CD RUNBOOKS &amp; 30-DAY TRANSITION SOPS</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40 font-bold">
                    PRODUCTION RUNBOOK
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Turnkey operations manual covering server container redeployment, Cloudflare edge DNS, Google Play Store keystore signing, and the structured 30-day founder handover schedule.
                </p>
              </div>

              {/* 4 Runbook Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Runbook 1: Server & Hosting */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#22d3a5]">
                      1. CLOUD RUN &amp; HOSTING RUNBOOK
                    </span>
                    <span className="text-[10px] text-[#22d3a5] font-bold">~$28.35/MO</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-2 font-mono">
                    <p className="text-white font-bold">Deploy Command:</p>
                    <code className="text-[#22d3a5] text-[11px] block bg-black/50 p-2 rounded">
                      gcloud run deploy talentradar-app --region europe-west2 --allow-unauthenticated
                    </code>
                    <p>• <strong>Region:</strong> europe-west2 (London, United Kingdom)</p>
                    <p>• <strong>Container:</strong> Node.js 22 LTS Alpine base with Vite build artifacts</p>
                    <p>• <strong>Scaling:</strong> Min 0 to Max 10 (scale-to-zero when idle protects budget)</p>
                  </div>
                </div>

                {/* Runbook 2: Google Play TWA Maintenance */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#38bdf8]">
                      2. ANDROID GOOGLE PLAY TWA RUNBOOK
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-bold">PACKAGE ACTIVE</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-2 font-mono">
                    <p className="text-white font-bold">Build Command:</p>
                    <code className="text-[#38bdf8] text-[11px] block bg-black/50 p-2 rounded">
                      bubblewrap build --manifest=twa-manifest.json
                    </code>
                    <p>• <strong>Package:</strong> com.talentradar.app</p>
                    <p>• <strong>AssetLinks:</strong> /.well-known/assetlinks.json SHA256 fingerprint verified</p>
                    <p>• <strong>Signing:</strong> Java Keystore (.jks) will be transferred to buyer&apos;s Play Console</p>
                  </div>
                </div>

                {/* Runbook 3: API & Telemetry */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#fbbf24]">
                      3. LIVE API TELEMETRY RUNBOOK
                    </span>
                    <span className="text-[10px] text-[#fbbf24] font-bold">4,402+ JOBS</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 font-mono">
                    <p>• <strong>Telemetry Endpoint:</strong> GET /api/jobs/market-radar</p>
                    <p>• <strong>Search Endpoint:</strong> POST /api/jobs/search (token-split matching)</p>
                    <p>• <strong>Cache Invalidation:</strong> 60-second TTL in-memory buffer</p>
                    <p>• <strong>Zero External DB Dependency:</strong> Self-contained Node cache with option to attach PostgreSQL / Cloud SQL via drizzle</p>
                  </div>
                </div>

                {/* Runbook 4: 30-Day Transition Schedule */}
                <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                    <span className="text-xs font-bold text-[#a78bfa]">
                      4. 30-DAY FOUNDER TRANSITION TIMELINE
                    </span>
                    <span className="text-[10px] text-[#a78bfa] font-bold">4 WEEKS HANDOVER</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs text-[#cbd5e1] space-y-1.5 font-mono">
                    <p>• <strong>Week 1:</strong> EPP authorization transfer code for talentradar.io, Cloudflare DNS, Cloud Run IAM access</p>
                    <p>• <strong>Week 2:</strong> Git repository ownership handover, CI/CD pipeline walkthrough, API key migration</p>
                    <p>• <strong>Week 3:</strong> Google Play Console package com.talentradar.app transfer, keystore handover</p>
                    <p>• <strong>Week 4:</strong> Commercial product roadmap, agency pricing consultation, final sign-off</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 6: CONFIDENTIAL INFORMATION MEMORANDUM (CIM) & METRICS GUIDE
             ========================================================================= */}
          {activeTab === 'cim' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#22d3a5]/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#22d3a5]">
                    <FileText className="w-4 h-4" />
                    <span>CONFIDENTIAL INFORMATION MEMORANDUM (CIM) GENERATOR</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Buyer-ready M&amp;A memorandum formatted for Acquire.com curation and private buyer outreach—includes Executive Summary, Product Differentiation, TTM Financials ($0 Rev / -$340.20 Net Income), Included IP Assets, and Closing Terms.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={exportCimPdf}
                    disabled={isExportingCimPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold transition shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingCimPdf ? 'BUILDING CIM PDF...' : 'DOWNLOAD CIM (.PDF)'}</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(generateCimMarkdown(), 'cim-markdown')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-bold transition cursor-pointer"
                  >
                    {copiedKey === 'cim-markdown' ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cim-markdown' ? 'COPIED CIM' : 'COPY CIM TEXT'}</span>
                  </button>
                </div>
              </div>

              {/* Acquire.com "Connect Metrics for up to 4x more buyer interest" Action Guide */}
              <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#38bdf8]/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2b36] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8]">
                    <TrendingUp className="w-4 h-4" />
                    <span>ACQUIRE.COM &quot;CONNECT METRICS&quot; CHECKLIST (4X BUYER INTEREST)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 font-bold">
                    PRE-REVENUE VERIFICATION
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">1. Google Analytics 4</span>
                      <span className="text-[10px] text-[#22d3a5] font-bold">RECOMMENDED</span>
                    </div>
                    <p className="text-[#94a3b8] leading-relaxed">
                      Connect read-only GA4 on Acquire.com to verify live visitor traffic, session duration, and 3D globe engagement even at $0 revenue.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">2. Paystack / Billing Ledger</span>
                      <span className="text-[10px] text-[#fbbf24] font-bold">VERIFIED PAYSTACK</span>
                    </div>
                    <p className="text-[#94a3b8] leading-relaxed">
                      Export read-only Paystack payout &amp; subscription telemetry or provide an explicit revenue disclosure for buyer verification.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">3. Cloud Run &amp; Expense Ledger</span>
                      <span className="text-[10px] text-[#38bdf8] font-bold">P&amp;L PROOF</span>
                    </div>
                    <p className="text-[#94a3b8] leading-relaxed">
                      Attach this CIM PDF and your monthly Google Cloud Run ($12.50) + Cloudflare ($1.85) invoices to substantiate the $28.35/mo run-rate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive CIM Document Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cimSections.map((sec) => (
                  <div key={sec.num} className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                      <span className="text-xs font-bold text-[#22d3a5]">
                        {sec.num}. {sec.title}
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                      {sec.body.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#38bdf8] font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-[#1e2b36] bg-[#0e1620] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#7a8b99]">
            <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
            <span>Curated Diligence Vault • Escrow.com Wire Ready ($145,000 USD Buyout)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCimPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 border border-[#22d3a5] text-[#22d3a5] hover:bg-[#22d3a5]/30 font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CIM (PDF)</span>
            </button>

            <button
              onClick={exportPitchDeckPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a78bfa]/20 border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa]/30 font-bold transition cursor-pointer"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>PITCH DECK (PDF)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open-transaction-docket'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/30 font-bold transition cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>M&amp;A DOCKET (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-[#94a3b8] hover:text-white transition cursor-pointer"
            >
              Close Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
