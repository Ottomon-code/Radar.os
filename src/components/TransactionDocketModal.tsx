import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  Scale,
  Check,
  Copy,
  CheckCircle2,
  Building2,
  DollarSign,
  Calendar,
  Lock,
  Sparkles,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  BadgeCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useCurrency } from '../context/CurrencyContext';

export interface TransactionDocketData {
  docketId: string;
  docketDate: string;
  buyerOrg: string;
  buyerContact: string;
  buyerEmail: string;
  buyerType: string;
  sellerOrg: string;
  sellerContact: string;
  sellerEmail: string;
  totalValuationUsd: number;
  earnestDepositUsd: number;
  escrowProvider: string;
  escrowInspectionHours: number;
  governingLaw: string;
  status: string;
  verificationHash: string;
  assets: {
    name: string;
    description: string;
    status: string;
  }[];
  milestones: {
    phase: string;
    title: string;
    amountUsd: number;
    trigger: string;
  }[];
  covenants: string[];
}

export const DOCKET_PRESETS: Record<string, TransactionDocketData> = {
  aetheris: {
    docketId: 'TR-DOCKET-2026-PE-145K',
    docketDate: 'November 2026',
    buyerOrg: 'Institutional Growth Equity (Fund III)',
    buyerContact: 'Managing Partner (Authorized Signatory)',
    buyerEmail: 'dealteam@growth-capital.com',
    buyerType: 'Strategic Private Equity Acquirer',
    sellerOrg: 'TalentRadar Technologies & Architecture Group',
    sellerContact: 'Principal Founder & Lead Systems Architect',
    sellerEmail: 'founder@talentradar.io',
    totalValuationUsd: 145000,
    earnestDepositUsd: 14500,
    escrowProvider: 'Escrow.com (Premier Institutional Service)',
    escrowInspectionHours: 48,
    governingLaw: 'State of Delaware, United States',
    status: 'ESCROW_BINDING_INSPECTION',
    verificationHash: 'TR-VERIFIED-APA-PE-984F2B-2026',
    assets: [
      {
        name: 'Complete Commercial Source Code & Intellectual Property',
        description: '100% unencumbered Git repository including React 18, TypeScript, Three.js 3D WebGL shader pipeline, Recharts market telemetry, and Node.js Express server.',
        status: 'AUDITED_ZERO_VULNERABILITY',
      },
      {
        name: 'Canonical Domain & Web Brand (talentradar.io)',
        description: 'Direct Cloudflare registrar authorization code transfer with DNS records and SSL edge termination certificates.',
        status: 'DNS_TRANSFER_READY',
      },
      {
        name: 'Android Google Play Store Package & TWA Bundle',
        description: 'Package com.talentradar.app with Digital Asset Links active at /.well-known/assetlinks.json, Bubblewrap manifest, and Play Console release keys.',
        status: 'ASSETLINKS_VERIFIED_HTTP_200',
      },
      {
        name: 'Google Cloud Run Production Deployment Architecture',
        description: 'Container specifications, automated Docker builds, Service Worker offline caching engine, and multi-regional reverse proxy configs.',
        status: 'DEPLOYMENT_PARITY_CONFIRMED',
      },
      {
        name: '30-Calendar-Day Executive Onboarding & Architecture Advisory',
        description: 'Direct engineering handover sessions, API key migration guidance, and architecture transition documentation.',
        status: 'COVENANT_BOUND',
      },
    ],
    milestones: [
      {
        phase: 'Milestone 1',
        title: '10% Earnest Money Deposit',
        amountUsd: 14500,
        trigger: 'Deposited into Escrow.com trust account to lock in the 48-hour inspection period.',
      },
      {
        phase: 'Milestone 2',
        title: 'Technical Diligence Clean-Pass',
        amountUsd: 0,
        trigger: 'Buyer code verification of Three.js canvas, Play Store bundle, and build scripts.',
      },
      {
        phase: 'Milestone 3',
        title: 'Domain & Asset Credential Transfer',
        amountUsd: 0,
        trigger: 'Push of talentradar.io domain auth code and Google Play Console app ownership transfer.',
      },
      {
        phase: 'Milestone 4',
        title: 'Final 90% Escrow Balance Release',
        amountUsd: 130500,
        trigger: 'Escrow.com authorizes final balance payout to Seller and issues Certificate of Closing.',
      },
    ],
    covenants: [
      'Seller guarantees clean, unencumbered title with zero outstanding liens, third-party licensing fees, or patent disputes.',
      'Full mutual non-disclosure and intellectual property assignment covenants survive closing in perpetuity.',
      'Seller provides 30 calendar days of transitional technical support to Buyer engineering team.',
      '48-hour technical inspection window begins immediately upon Escrow.com earnest deposit receipt.',
    ],
  },
  vanguard: {
    docketId: 'TR-DOCKET-2026-VANG-138K',
    docketDate: 'November 2026',
    buyerOrg: 'Vanguard Micro-Tech Holdings',
    buyerContact: 'Marcus Sterling, VP Corporate Development & M&A',
    buyerEmail: 'msterling@vanguardtechholdings.com',
    buyerType: 'Private Equity / Micro-Cap Syndicate',
    sellerOrg: 'TalentRadar Technologies & Architecture Group',
    sellerContact: 'Principal Founder & Lead Systems Architect',
    sellerEmail: 'founder@talentradar.io',
    totalValuationUsd: 138000,
    earnestDepositUsd: 13800,
    escrowProvider: 'Escrow.com / Wire Verification',
    escrowInspectionHours: 72,
    governingLaw: 'Commonwealth of Massachusetts, United States',
    status: 'TECHNICAL_DILIGENCE_REVIEW',
    verificationHash: 'TR-VERIFIED-APA-VANG-771C4A-2026',
    assets: [
      {
        name: 'Full Commercial Source Code & Intellectual Property',
        description: 'Complete front-to-back source code, Three.js shaders, and offline Service Worker architecture.',
        status: 'AUDITED_ZERO_VULNERABILITY',
      },
      {
        name: 'Canonical Domain (talentradar.io)',
        description: 'DNS transfer code and domain ownership handover.',
        status: 'DNS_TRANSFER_READY',
      },
      {
        name: 'Android Google Play Store Package',
        description: 'Package com.talentradar.app and digital asset links.',
        status: 'ASSETLINKS_VERIFIED_HTTP_200',
      },
    ],
    milestones: [
      {
        phase: 'Milestone 1',
        title: '10% Earnest Deposit ($13,800 USD)',
        amountUsd: 13800,
        trigger: 'Deposited into Escrow.com to commence 72-hour inspection.',
      },
      {
        phase: 'Milestone 2',
        title: 'Final 90% Balance ($124,200 USD)',
        amountUsd: 124200,
        trigger: 'Disbursed upon domain and Git repository credential transfer.',
      },
    ],
    covenants: [
      'Zero fatal security vulnerabilities in static analysis and dependency audit.',
      'Post-acquisition transition advisory support for 30 calendar days.',
    ],
  },
  omnitalent: {
    docketId: 'TR-DOCKET-2026-AGENCY-17K',
    docketDate: 'November 2026',
    buyerOrg: 'Retained Executive Search Practice',
    buyerContact: 'Managing Director (Authorized Signatory)',
    buyerEmail: 'procurement@executivesearch.com',
    buyerType: 'Tier-1 Executive Search Practice',
    sellerOrg: 'TalentRadar Technologies & Architecture Group',
    sellerContact: 'Principal Founder & Lead Systems Architect',
    sellerEmail: 'founder@talentradar.io',
    totalValuationUsd: 17400,
    earnestDepositUsd: 17400,
    escrowProvider: 'Escrow.com / Paystack Enterprise Billing',
    escrowInspectionHours: 24,
    governingLaw: 'State of California / Delaware Commercial Court',
    status: 'ANNUAL_LICENSE_EXECUTION',
    verificationHash: 'TR-VERIFIED-AGENCY-SLA-2563EB-2026',
    assets: [
      {
        name: 'Annual Enterprise Agency License (Unlimited Seats)',
        description: 'Full unthrottled access to StealthNet zero-knowledge talent intercepts and real-time compensation models.',
        status: 'ENTERPRISE_PROVISIONED',
      },
      {
        name: 'Custom Agency Presentation Branding & PDF Vector Exporter',
        description: 'Custom Sapphire Blue agency branding, client presentation covenants, and executive compensation dossiers.',
        status: 'ACTIVE_AND_DEPLOYED',
      },
    ],
    milestones: [
      {
        phase: 'Annual Contract',
        title: '100% Upfront Annual License Fee',
        amountUsd: 17400,
        trigger: 'Immediate funding via Escrow.com or Paystack Invoice for 12 months unlimited enterprise agency access.',
      },
    ],
    covenants: [
      'Annual enterprise SLA with 99.9% uptime for StealthNet zero-knowledge talent queries.',
      'Dedicated agency presentation branding support and priority candidate routing.',
    ],
  },
};

interface TransactionDocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: 'aetheris' | 'vanguard' | 'omnitalent' | 'custom';
  initialAmount?: number;
  initialBuyerOrg?: string;
  initialBuyerName?: string;
}

export default function TransactionDocketModal({
  isOpen,
  onClose,
  initialPresetId = 'aetheris',
  initialAmount,
  initialBuyerOrg,
  initialBuyerName,
}: TransactionDocketModalProps) {
  const { currency, formatAmount } = useCurrency();
  const [activePreset, setActivePreset] = useState<string>(initialPresetId);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Docket Configuration State
  const [docket, setDocket] = useState<TransactionDocketData>(() => {
    const base = DOCKET_PRESETS[initialPresetId] || DOCKET_PRESETS.aetheris;
    return {
      ...base,
      totalValuationUsd: initialAmount || base.totalValuationUsd,
      earnestDepositUsd: initialAmount ? Math.round(initialAmount * 0.1) : base.earnestDepositUsd,
      buyerOrg: initialBuyerOrg || base.buyerOrg,
      buyerContact: initialBuyerName || base.buyerContact,
    };
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPresetId && DOCKET_PRESETS[initialPresetId]) {
      setActivePreset(initialPresetId);
      const base = DOCKET_PRESETS[initialPresetId];
      setDocket({
        ...base,
        totalValuationUsd: initialAmount || base.totalValuationUsd,
        earnestDepositUsd: initialAmount ? Math.round(initialAmount * 0.1) : base.earnestDepositUsd,
        buyerOrg: initialBuyerOrg || base.buyerOrg,
        buyerContact: initialBuyerName || base.buyerContact,
      });
    }
  }, [initialPresetId, initialAmount, initialBuyerOrg, initialBuyerName]);

  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    if (DOCKET_PRESETS[key]) {
      setDocket({ ...DOCKET_PRESETS[key] });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  /**
   * Programmatic high-fidelity legal M&A Transaction Docket PDF Generator via jsPDF
   */
  const handleExportPdf = () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const marginX = 14;
      const contentWidth = 182; // 210 - 28

      // 1. Top Security & Legal Escrow Ribbon
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(marginX, 10, contentWidth, 8, 'F');

      doc.setTextColor(251, 191, 36); // gold #fbbf24
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('CONFIDENTIAL M&A TRANSACTION DOCKET // ESCROW.COM BINDING PROTOCOL', marginX + 3, 15.3);

      doc.setTextColor(203, 213, 225);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`DOCKET ID: ${docket.docketId} • ${docket.docketDate.toUpperCase()}`, marginX + contentWidth - 3, 15.3, {
        align: 'right',
      });

      // 2. Document Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('DEFINITIVE ASSET PURCHASE AGREEMENT & ESCROW TRANSACTION DOCKET', marginX, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Intellectual Property Assignment, Escrow Closing Schedule & 48-Hour Technical Diligence Protocol',
        marginX,
        29
      );

      // 3. Parties & Commercial Valuation Matrix Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, 32, contentWidth, 23, 1.5, 1.5, 'FD');

      // Left Column: Buyer & Seller
      const colW = contentWidth / 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('ACQUIRING PARTY (BUYER):', marginX + 3.5, 37.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(docket.buyerOrg.substring(0, 42), marginX + 3.5, 42);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Attn: ${docket.buyerContact} • ${docket.buyerEmail}`, marginX + 3.5, 46.5);
      doc.text(`Entity Type: ${docket.buyerType}`, marginX + 3.5, 51);

      // Right Column: Seller & Commercial Terms
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('SELLING ENTITY & ASSET OWNER:', marginX + colW + 3.5, 37.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(docket.sellerOrg.substring(0, 42), marginX + colW + 3.5, 42);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Attn: ${docket.sellerContact} • ${docket.sellerEmail}`, marginX + colW + 3.5, 46.5);
      doc.text(`Asset: Global Job & Career Radar (talentradar.io)`, marginX + colW + 3.5, 51);

      // 4. Commercial Settlement Scorecards
      let currentY = 58;
      const cardW = (contentWidth - 9) / 4;
      const cardH = 15;
      const cardGap = 3;

      const scorecards = [
        {
          label: 'TOTAL ASSET VALUATION',
          val: `$${docket.totalValuationUsd.toLocaleString()} USD`,
          sub: 'Firm Agreed Price',
          color: [245, 158, 11], // amber
        },
        {
          label: '10% EARNEST DEPOSIT',
          val: `$${docket.earnestDepositUsd.toLocaleString()} USD`,
          sub: 'Locks Diligence Window',
          color: [16, 185, 129], // emerald
        },
        {
          label: 'ESCROW SETTLEMENT',
          val: docket.escrowProvider.split(' ')[0],
          sub: 'Standard Tri-Party Trust',
          color: [59, 130, 246], // blue
        },
        {
          label: 'INSPECTION WINDOW',
          val: `${docket.escrowInspectionHours} Hours`,
          sub: 'Delaware Standard APA',
          color: [100, 116, 139],
        },
      ];

      scorecards.forEach((sc, i) => {
        const cx = marginX + i * (cardW + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(cx, currentY, cardW, cardH, 1, 1, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(sc.label, cx + cardW / 2, currentY + 3.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sc.val, cx + cardW / 2, currentY + 8.8, { align: 'center' });

        doc.setFontSize(6);
        doc.setTextColor(sc.color[0], sc.color[1], sc.color[2]);
        doc.text(sc.sub, cx + cardW / 2, currentY + 12.8, { align: 'center' });
      });

      // 5. Section 1: Transferred Asset Schedule & Deliverables
      currentY += cardH + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('1. INTELLECTUAL PROPERTY & TRANSFERRED ASSET INVENTORY', marginX, currentY);

      currentY += 2.5;
      const thHeight = 5.5;
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(marginX, currentY, contentWidth, thHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Asset Component & Verification Deliverable', marginX + 3, currentY + 3.8);
      doc.text('Verification Status', marginX + contentWidth - 3, currentY + 3.8, { align: 'right' });

      currentY += thHeight;
      const assetRowH = 7.5;
      docket.assets.forEach((ast, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, currentY, contentWidth, assetRowH, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(ast.name, marginX + 3, currentY + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const descText = ast.description.length > 105 ? ast.description.substring(0, 105) + '...' : ast.description;
        doc.text(descText, marginX + 3, currentY + 6.3);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(16, 185, 129); // emerald
        doc.text(`[ ${ast.status} ]`, marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });

        currentY += assetRowH;
      });

      // 6. Section 2: Escrow Funding Milestones & Inspection Protocol
      currentY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('2. ESCROW.COM FUNDING MILESTONES & 48-HOUR INSPECTION WINDOW', marginX, currentY);

      currentY += 2.5;
      doc.setFillColor(30, 41, 59);
      doc.rect(marginX, currentY, contentWidth, thHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Milestone Phase & Trigger Event', marginX + 3, currentY + 3.8);
      doc.text('Settlement Amount', marginX + contentWidth - 3, currentY + 3.8, { align: 'right' });

      currentY += thHeight;
      const msRowH = 7.2;
      docket.milestones.forEach((ms, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, currentY, contentWidth, msRowH, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(`${ms.phase}: ${ms.title}`, marginX + 3, currentY + 3.4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const trigText = ms.trigger.length > 100 ? ms.trigger.substring(0, 100) + '...' : ms.trigger;
        doc.text(trigText, marginX + 3, currentY + 6.1);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(ms.amountUsd > 0 ? 245 : 71, ms.amountUsd > 0 ? 158 : 85, ms.amountUsd > 0 ? 11 : 105);
        const amtStr = ms.amountUsd > 0 ? `$${ms.amountUsd.toLocaleString()} USD` : 'Verification Gate';
        doc.text(amtStr, marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });

        currentY += msRowH;
      });

      // 7. Section 3: Legal Covenants & Represented Warranties
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('3. SELLER WARRANTIES & TRANSITIONAL COVENANTS', marginX, currentY);

      currentY += 2.5;
      const covBoxH = 18;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(marginX, currentY, contentWidth, covBoxH, 1, 1, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(51, 65, 85);
      let covY = currentY + 4;
      docket.covenants.forEach((cov) => {
        doc.text(`• ${cov.substring(0, 115)}`, marginX + 3, covY);
        covY += 3.4;
      });

      // 8. Section 4: Dual Execution & Notarization Sign-off
      currentY += covBoxH + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('4. AUTHORIZED M&A SIGN-OFF & ESCROW EXECUTION', marginX, currentY);

      currentY += 2.5;
      const signBoxH = 26;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(marginX, currentY, contentWidth, signBoxH, 1.5, 1.5, 'FD');

      const signColW = contentWidth / 2;
      // Seller Column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Seller Signature (Founder & IP Assignor):', marginX + 3.5, currentY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Signature: _____________________________________   Date: ____________', marginX + 3.5, currentY + 11);
      doc.text(`Name: ${docket.sellerContact} (${docket.sellerOrg})`, marginX + 3.5, currentY + 16);
      doc.text(`Digital Seal: ${docket.verificationHash}`, marginX + 3.5, currentY + 21);

      // Buyer Column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Buyer Acceptance (Lead Diligence Officer):', marginX + signColW + 3.5, currentY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Signature: _____________________________________   Date: ____________', marginX + signColW + 3.5, currentY + 11);
      doc.text(`Name: ${docket.buyerContact} (${docket.buyerOrg})`, marginX + signColW + 3.5, currentY + 16);
      doc.text(`Escrow Agent Stamp: Escrow.com Transaction Verified // 48-Hr Diligence`, marginX + signColW + 3.5, currentY + 21);

      // 9. Document Footer
      const footerY = 282;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY, marginX + contentWidth, footerY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `STRICTLY CONFIDENTIAL // M&A TRANSACTION DOCKET • GOVERNING LAW: ${docket.governingLaw.toUpperCase()}`,
        marginX,
        footerY + 3.5
      );
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • talentradar.io`,
        marginX + contentWidth,
        footerY + 3.5,
        { align: 'right' }
      );

      // Save PDF directly to user's downloads
      const cleanBuyer = docket.buyerOrg.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const fileName = `TalentRadar_Transaction_Docket_${cleanBuyer}_$${docket.totalValuationUsd}.pdf`;
      doc.save(fileName);

      setIsGeneratingPdf(false);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate transaction docket PDF:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `
# DEFINITIVE ASSET PURCHASE AGREEMENT & ESCROW TRANSACTION DOCKET
**Docket ID:** ${docket.docketId}
**Issue Date:** ${docket.docketDate}
**Status:** ${docket.status}
**Governing Jurisdiction:** ${docket.governingLaw}

---

### PARTIES
- **Acquiring Party (Buyer):** ${docket.buyerOrg}
  - Representative: ${docket.buyerContact} (${docket.buyerEmail})
  - Entity Type: ${docket.buyerType}
- **Selling Party (Seller):** ${docket.sellerOrg}
  - Representative: ${docket.sellerContact} (${docket.sellerEmail})
  - Asset: Global Job & Career Radar (talentradar.io)

---

### COMMERCIAL SETTLEMENT & ESCROW SCHEDULE
- **Agreed Asset Valuation:** $${docket.totalValuationUsd.toLocaleString()} USD
- **Earnest Money Deposit (10%):** $${docket.earnestDepositUsd.toLocaleString()} USD
- **Escrow Settlement Provider:** ${docket.escrowProvider}
- **Inspection Window:** ${docket.escrowInspectionHours} Calendar Hours from deposit confirmation

---

### TRANSFERRED ASSETS & INTELLECTUAL PROPERTY
1. **Full Commercial Source Code**: Git repo, React Vite frontend, Three.js 3D shaders, Recharts telemetry, Express backend.
2. **Canonical Domain Ownership**: talentradar.io DNS authorization code via Cloudflare.
3. **Android Google Play Store Bundle**: Package com.talentradar.app with AssetLinks active at /.well-known/assetlinks.json.
4. **Google Cloud Run Deployment Manifests**: Production container specs and offline Service Worker caching engine.
5. **Transitional Advisory**: 30 calendar days technical onboarding and architecture guidance.

---

### EXECUTION AUDIT HASH
\`${docket.verificationHash}\`
Verified via TalentRadar.OS M&A Governance Portal
`;

    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0f171e] border border-[#1e2b36] rounded-xl shadow-2xl overflow-hidden font-mono text-[#dce7f0] max-h-[94vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 border-b border-[#1e2b36] bg-[#111a22] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#dce7f0]">
                  TRANSACTION DOCKET GENERATOR
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40">
                  ESCROW.COM BINDING
                </span>
              </div>
              <p className="text-[11px] text-[#7a8b99]">
                Legal M&amp;A Diligence Packet &amp; 48-Hour Inspection Binder
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Preset Selector */}
            <div className="flex items-center gap-1 bg-[#0a0f14] p-1 rounded-lg border border-[#1e2b36]">
              <button
                onClick={() => handleSelectPreset('aetheris')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  activePreset === 'aetheris'
                    ? 'bg-[#fbbf24] text-black shadow-sm'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                Growth PE ($145k)
              </button>
              <button
                onClick={() => handleSelectPreset('vanguard')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  activePreset === 'vanguard'
                    ? 'bg-[#a78bfa] text-black shadow-sm'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                Vanguard ($138k)
              </button>
              <button
                onClick={() => handleSelectPreset('omnitalent')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  activePreset === 'omnitalent'
                    ? 'bg-[#38bdf8] text-black shadow-sm'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                Agency SLA ($17.4k)
              </button>
            </div>

            {/* Edit Terms Toggle */}
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                showEditor
                  ? 'bg-[#1e2b36] text-[#22d3a5] border-[#22d3a5]'
                  : 'bg-[#111a22] hover:bg-[#162330] text-[#7a8b99] border-[#1e2b36]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>EDIT TERMS</span>
              {showEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-semibold text-[#dce7f0] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5 text-[#7a8b99]" />}
              <span>{copied ? 'COPIED MD' : 'COPY MD'}</span>
            </button>

            {/* Direct Vector jsPDF Download */}
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-bold transition shadow-[0_0_15px_rgba(251,191,36,0.25)] cursor-pointer disabled:opacity-50"
              title="Save formal legal transaction docket directly as a vector PDF document"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>GENERATING PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>DOCKET EXPORTED!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT DOCKET (PDF)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-semibold text-[#dce7f0] transition cursor-pointer"
              title="Open browser print preview"
            >
              <Printer className="w-3.5 h-3.5 text-[#7a8b99]" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#1e2b36] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Custom Terms Editor Drawer */}
        {showEditor && (
          <div className="print:hidden bg-[#0c131a] border-b border-[#1e2b36] p-4 text-xs font-sans space-y-3 animate-fadeIn">
            <div className="font-bold text-[#fbbf24] font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              <span>Calibrate Commercial Terms &amp; Escrow Inspection Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Acquiring Party (Buyer Org)
                </label>
                <input
                  type="text"
                  value={docket.buyerOrg}
                  onChange={(e) => setDocket({ ...docket, buyerOrg: e.target.value })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-[#fbbf24] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Buyer Lead Contact &amp; Email
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={docket.buyerContact}
                    onChange={(e) => setDocket({ ...docket, buyerContact: e.target.value })}
                    className="w-1/2 bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-[#fbbf24] outline-none"
                  />
                  <input
                    type="text"
                    value={docket.buyerEmail}
                    onChange={(e) => setDocket({ ...docket, buyerEmail: e.target.value })}
                    className="w-1/2 bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-[#fbbf24] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Total Valuation (USD)
                </label>
                <input
                  type="number"
                  value={docket.totalValuationUsd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDocket({
                      ...docket,
                      totalValuationUsd: val,
                      earnestDepositUsd: Math.round(val * 0.1),
                    });
                  }}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-[#fbbf24] font-bold font-mono focus:border-[#fbbf24] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Escrow Provider &amp; Hours
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={docket.escrowProvider}
                    onChange={(e) => setDocket({ ...docket, escrowProvider: e.target.value })}
                    className="w-2/3 bg-[#111a22] border border-[#1e2b36] rounded px-2 py-1.5 text-xs text-white focus:border-[#fbbf24] outline-none"
                  >
                    <option value="Escrow.com (Premier Institutional Service)">Escrow.com</option>
                    <option value="Paystack / Escrow Wire">Paystack / Escrow Wire</option>
                    <option value="Direct Bank Wire / Law Firm Trust">Bank Wire</option>
                    <option value="USDC Smart Contract Escrow">USDC Smart Escrow</option>
                  </select>
                  <select
                    value={docket.escrowInspectionHours}
                    onChange={(e) => setDocket({ ...docket, escrowInspectionHours: Number(e.target.value) })}
                    className="w-1/3 bg-[#111a22] border border-[#1e2b36] rounded px-2 py-1.5 text-xs text-white focus:border-[#fbbf24] outline-none"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                    <option value={120}>5 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Document Body */}
        <div
          ref={printRef}
          className="p-8 overflow-y-auto space-y-5 bg-white text-slate-900 print:p-6 print:m-0 print:text-black font-sans leading-normal"
        >
          {/* Top Classification Ribbon */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="px-2 py-0.5 bg-slate-900 text-[#fbbf24] font-bold tracking-wider uppercase rounded-sm">
                CONFIDENTIAL M&amp;A TRANSACTION DOCKET // ESCROW.COM BINDING
              </span>
              <span className="text-slate-500 font-bold">
                DOCKET ID: {docket.docketId} • {docket.docketDate.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-950">
                  DEFINITIVE ASSET PURCHASE AGREEMENT &amp; ESCROW DOCKET
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Intellectual Property Assignment, Escrow Closing Schedule &amp; {docket.escrowInspectionHours}-Hour Technical Diligence Protocol
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-600 shrink-0">
                <div className="font-bold text-slate-900">Governing Law: {docket.governingLaw}</div>
                <div className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>DELAWARE STANDARD APA</span>
                </div>
              </div>
            </div>

            {/* Parties Matrix Box */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="border-r sm:border-r-slate-200 sm:pr-4">
                <div className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">
                  Acquiring Entity (Buyer)
                </div>
                <div className="font-bold text-slate-900 text-sm">{docket.buyerOrg}</div>
                <div className="text-slate-600 mt-0.5">Authorized Officer: {docket.buyerContact}</div>
                <div className="text-slate-500 font-mono text-[11px]">{docket.buyerEmail}</div>
                <div className="text-[11px] text-blue-700 mt-1 font-semibold">{docket.buyerType}</div>
              </div>

              <div className="sm:pl-2">
                <div className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">
                  Selling Entity &amp; IP Assignor (Seller)
                </div>
                <div className="font-bold text-slate-900 text-sm">{docket.sellerOrg}</div>
                <div className="text-slate-600 mt-0.5">Principal Owner: {docket.sellerContact}</div>
                <div className="text-slate-500 font-mono text-[11px]">{docket.sellerEmail}</div>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  Canonical Asset: Global Job &amp; Career Radar (talentradar.io)
                </div>
              </div>
            </div>
          </div>

          {/* Commercial Settlement Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 border border-amber-300 rounded-lg bg-amber-50/60">
              <div className="text-[10px] text-amber-800 uppercase font-bold">Total Asset Valuation</div>
              <div className="text-lg font-bold text-amber-950 mt-1">
                ${docket.totalValuationUsd.toLocaleString()} USD
              </div>
              <div className="text-[9px] text-amber-700 font-semibold">Firm Agreed Price</div>
            </div>

            <div className="p-3 border border-emerald-300 rounded-lg bg-emerald-50/60">
              <div className="text-[10px] text-emerald-800 uppercase font-bold">10% Earnest Deposit</div>
              <div className="text-lg font-bold text-emerald-950 mt-1">
                ${docket.earnestDepositUsd.toLocaleString()} USD
              </div>
              <div className="text-[9px] text-emerald-700 font-semibold">Locks Inspection Window</div>
            </div>

            <div className="p-3 border border-blue-300 rounded-lg bg-blue-50/60">
              <div className="text-[10px] text-blue-800 uppercase font-bold">Escrow Settlement</div>
              <div className="text-sm font-bold text-blue-950 mt-2 truncate">
                {docket.escrowProvider.split(' ')[0]}
              </div>
              <div className="text-[9px] text-blue-700 font-semibold">Tri-Party Trust</div>
            </div>

            <div className="p-3 border border-slate-300 rounded-lg bg-slate-100">
              <div className="text-[10px] text-slate-600 uppercase font-bold">Inspection Window</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {docket.escrowInspectionHours} Hours
              </div>
              <div className="text-[9px] text-slate-500">Delaware Standard</div>
            </div>
          </div>

          {/* Section 1: Transferred Asset Schedule & Deliverables */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-2 flex items-center justify-between">
              <span>1. Intellectual Property &amp; Transferred Asset Inventory</span>
              <span className="text-[10px] font-normal text-slate-500">Exhibit A — Definitive Deliverables</span>
            </h2>
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-left text-[11px]">
                    <th className="p-2.5">Asset Component &amp; Verification Specification</th>
                    <th className="p-2.5 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {docket.assets.map((asset, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{asset.description}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-[11px]">
                        [{asset.status}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Escrow Funding Milestones & Inspection Schedule */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-2 flex items-center justify-between">
              <span>2. Escrow.com Funding Milestones &amp; Inspection Protocol</span>
              <span className="text-[10px] font-normal text-slate-500">Exhibit B — Settlement Flow</span>
            </h2>
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-left text-[11px]">
                    <th className="p-2.5">Milestone Phase</th>
                    <th className="p-2.5">Trigger Condition &amp; Action Required</th>
                    <th className="p-2.5 text-right font-mono">Disbursement Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {docket.milestones.map((ms, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{ms.phase}: {ms.title}</td>
                      <td className="p-2.5 text-slate-600 text-[11px]">{ms.trigger}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                        {ms.amountUsd > 0 ? `$${ms.amountUsd.toLocaleString()} USD` : 'Verification Gate'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Legal Warranties & Transitional Covenants */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2 text-xs">
            <h2 className="font-bold text-slate-900 font-mono uppercase text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Seller Warranties &amp; Post-Closing Transitional Covenants</span>
            </h2>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
              {docket.covenants.map((cov, idx) => (
                <li key={idx} className="leading-relaxed">{cov}</li>
              ))}
            </ul>
          </div>

          {/* Section 4: Dual Execution & Digital Notarization Blocks */}
          <div className="border border-slate-400 rounded-lg p-4 bg-white space-y-3">
            <h2 className="font-bold text-slate-900 font-mono uppercase text-xs">
              4. Authorized M&amp;A Execution &amp; Escrow Closing Signatures
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Seller Signature Line */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Selling Entity (Founder &amp; IP Assignor):
                </div>
                <div className="h-8 border-b border-dashed border-slate-400 mt-3 flex items-end">
                  <span className="text-[10px] text-slate-400 font-mono">Signature: __________________________________</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span>{docket.sellerContact}</span>
                  <span>Date: ____________</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">
                  Digital Seal: {docket.verificationHash}
                </div>
              </div>

              {/* Buyer Signature Line */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Acquiring Entity (Lead Diligence Officer):
                </div>
                <div className="h-8 border-b border-dashed border-slate-400 mt-3 flex items-end">
                  <span className="text-[10px] text-slate-400 font-mono">Signature: __________________________________</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span>{docket.buyerContact}</span>
                  <span>Date: ____________</span>
                </div>
                <div className="text-[10px] text-blue-700 font-mono mt-1">
                  Escrow Protocol: Verified via {docket.escrowProvider.split(' ')[0]}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <span>Binding Protocol under Delaware Commercial Uniform Arbitration Act</span>
              <span>Audit Version: TR-APA-2026-RELEASE-V1</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="print:hidden px-6 py-3 border-t border-[#1e2b36] bg-[#111a22] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7a8b99] gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" />
            <span>
              Transaction Docket for <strong className="text-white">{docket.buyerOrg}</strong> • Valuation: ${docket.totalValuationUsd.toLocaleString()} USD
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162330] hover:bg-[#1e2f3f] border border-[#2b3e50] text-[#dce7f0] font-semibold transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showEditor ? 'HIDE EDITOR' : 'EDIT TERMS'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold transition cursor-pointer disabled:opacity-50 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'GENERATING PDF...' : 'EXPORT DOCKET (PDF)'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#2a3c4c] text-[#dce7f0] font-semibold transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
