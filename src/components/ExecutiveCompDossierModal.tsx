import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
  Settings2,
  UserCheck,
  PenTool,
  RotateCcw,
  Briefcase,
  Sliders,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useCurrency } from '../context/CurrencyContext';
import { CAREER_PROFILES, CareerPathProfile } from '../utils/marketAnalyticsEngine';

export interface PresentationBranding {
  id: string;
  agencyName: string;
  agencySubtitle: string;
  clientName: string;
  candidateName: string;
  presenterName: string;
  presenterTitle: string;
  confidentialityLevel: string;
  themeColorId: 'sapphire' | 'emerald' | 'violet' | 'crimson' | 'obsidian' | 'amber';
  brandColorRgb: [number, number, number];
  primaryHex: string;
  accentBgClass: string;
  accentBorderClass: string;
  accentTextClass: string;
  showWatermark: boolean;
  showClientSignoff: boolean;
  notes: string;
}

export const BRANDING_PRESETS: Record<string, PresentationBranding> = {
  omnitalent: {
    id: 'omnitalent',
    agencyName: 'Apex Executive Search Partners',
    agencySubtitle: 'Frontier AI Executive Search & Compensation Advisory • London / SF / Zurich',
    clientName: 'Confidential Series B Frontier Lab',
    candidateName: 'Principal AI Infrastructure Architect',
    presenterName: 'Executive Search Partner',
    presenterTitle: 'Managing Director, Global AI Search Practice',
    confidentialityLevel: 'STRICTLY CONFIDENTIAL // CLIENT PRESENTATION',
    themeColorId: 'sapphire',
    brandColorRgb: [37, 99, 235], // #2563eb
    primaryHex: '#2563eb',
    accentBgClass: 'bg-blue-50',
    accentBorderClass: 'border-blue-300',
    accentTextClass: 'text-blue-700',
    showWatermark: true,
    showClientSignoff: true,
    notes: 'Mandate: Series B Foundation Model Infrastructure Lead. Annual Enterprise License: $17,400.',
  },
  vanguard: {
    id: 'vanguard',
    agencyName: 'Vanguard Tech Advisory & M&A Holdings',
    agencySubtitle: 'Autonomous Systems & Private Equity Portfolio Oversight • New York / Boston',
    clientName: 'Vanguard Autonomous Portfolio Acquisition Co.',
    candidateName: 'VP of AI Infrastructure & Supercomputing',
    presenterName: 'Marcus Sterling',
    presenterTitle: 'VP Corporate Development & Talent Architecture',
    confidentialityLevel: 'RESTRICTED // M&A COMMITTEE REVIEW',
    themeColorId: 'violet',
    brandColorRgb: [124, 58, 237], // #7c3aed
    primaryHex: '#7c3aed',
    accentBgClass: 'bg-purple-50',
    accentBorderClass: 'border-purple-300',
    accentTextClass: 'text-purple-700',
    showWatermark: true,
    showClientSignoff: true,
    notes: 'Pre-acquisition compensation ceiling diligence. Board approval required above 75th percentile.',
  },
  talentradar: {
    id: 'talentradar',
    agencyName: 'TalentRadar Intelligence Systems',
    agencySubtitle: 'Autonomous Architecture Intelligence • Global Compensation Benchmarks',
    clientName: 'Board Compensation Committee & C-Suite',
    candidateName: 'Autonomous Infrastructure Lead',
    presenterName: 'Autonomous Comp Engine',
    presenterTitle: 'Chief Quantitative Talent Economist',
    confidentialityLevel: 'RESTRICTED // BOARD COMPENSATION COMMITTEE BRIEFING',
    themeColorId: 'emerald',
    brandColorRgb: [16, 185, 129], // #10b981
    primaryHex: '#10b981',
    accentBgClass: 'bg-emerald-50',
    accentBorderClass: 'border-emerald-300',
    accentTextClass: 'text-emerald-700',
    showWatermark: false,
    showClientSignoff: false,
    notes: 'Real-time multi-regional salary telemetry with purchasing power parity normalization.',
  },
  frontier: {
    id: 'frontier',
    agencyName: 'Frontier Executive Search Partners',
    agencySubtitle: 'Deep Tech, Semiconductor & High-Performance Compute Leadership Practice',
    clientName: 'Hyperscale Cloud & Foundry Sponsor',
    candidateName: 'Lead AI Compute Cluster Architect',
    presenterName: 'Dr. Arthur Pendelton',
    presenterTitle: 'Senior Partner, Systems Architecture Practice',
    confidentialityLevel: 'CONFIDENTIAL // EXECUTIVE SEARCH DIRECTIVE',
    themeColorId: 'crimson',
    brandColorRgb: [225, 29, 72], // #e11d48
    primaryHex: '#e11d48',
    accentBgClass: 'bg-rose-50',
    accentBorderClass: 'border-rose-300',
    accentTextClass: 'text-rose-700',
    showWatermark: true,
    showClientSignoff: true,
    notes: 'Off-market candidate recruitment directive with double-trigger change of control acceleration.',
  },
};

const THEME_COLOR_MAP: Record<
  PresentationBranding['themeColorId'],
  { rgb: [number, number, number]; hex: string; bg: string; border: string; text: string; label: string }
> = {
  sapphire: {
    rgb: [37, 99, 235],
    hex: '#2563eb',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    label: 'Sapphire Blue (OmniTalent)',
  },
  emerald: {
    rgb: [16, 185, 129],
    hex: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    label: 'Emerald Teal (TalentRadar)',
  },
  violet: {
    rgb: [124, 58, 237],
    hex: '#7c3aed',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    label: 'Royal Violet (Vanguard M&A)',
  },
  crimson: {
    rgb: [225, 29, 72],
    hex: '#e11d48',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
    label: 'Crimson Ruby (Frontier)',
  },
  obsidian: {
    rgb: [15, 23, 42],
    hex: '#0f172a',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-800',
    label: 'Obsidian Midnight (Stealth)',
  },
  amber: {
    rgb: [217, 119, 6],
    hex: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    label: 'Imperial Amber (Private Bank)',
  },
};

interface ExecutiveCompDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoleKey?: string;
  initialPresetId?: string;
}

export default function ExecutiveCompDossierModal({
  isOpen,
  onClose,
  initialRoleKey = 'ai_infra',
  initialPresetId = 'omnitalent',
}: ExecutiveCompDossierModalProps) {
  const { currency, formatAmount, toLocal, isPppMode } = useCurrency();
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(initialRoleKey);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [showBrandingEditor, setShowBrandingEditor] = useState(false);

  // Presentation Branding State
  const [branding, setBranding] = useState<PresentationBranding>(() => {
    try {
      const stored = localStorage.getItem('talentradar_presentation_branding');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.agencyName) {
          return parsed;
        }
      }
    } catch (_) {}
    return BRANDING_PRESETS[initialPresetId] || BRANDING_PRESETS.omnitalent;
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Sync when initialPresetId changes
  useEffect(() => {
    if (initialPresetId && BRANDING_PRESETS[initialPresetId]) {
      setBranding(BRANDING_PRESETS[initialPresetId]);
    }
  }, [initialPresetId]);

  // Persist branding to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('talentradar_presentation_branding', JSON.stringify(branding));
    } catch (_) {}
  }, [branding]);

  if (!isOpen) return null;

  const profile: CareerPathProfile = CAREER_PROFILES[selectedRoleKey] || CAREER_PROFILES.ai_infra;

  const handleSelectPreset = (presetId: string) => {
    const preset = BRANDING_PRESETS[presetId];
    if (preset) {
      setBranding({ ...preset });
    }
  };

  const handleThemeColorChange = (themeColorId: PresentationBranding['themeColorId']) => {
    const theme = THEME_COLOR_MAP[themeColorId];
    if (theme) {
      setBranding((prev) => ({
        ...prev,
        themeColorId,
        brandColorRgb: theme.rgb,
        primaryHex: theme.hex,
        accentBgClass: theme.bg,
        accentBorderClass: theme.border,
        accentTextClass: theme.text,
      }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  /**
   * Universal ASCII-safe currency formatter for jsPDF standard fonts
   */
  const formatPdfCurrency = (amountUsd: number): string => {
    const local = Math.round(toLocal(amountUsd));
    let prefix = '$';
    if (currency === 'EUR') prefix = 'EUR ';
    else if (currency === 'GBP') prefix = 'GBP ';
    else if (currency === 'JPY') prefix = 'JPY ';
    else if (currency === 'CHF') prefix = 'CHF ';
    else if (currency === 'CAD') prefix = 'C$';
    else if (currency === 'AUD') prefix = 'A$';
    else if (currency === 'SGD') prefix = 'S$';
    return `${prefix}${local.toLocaleString('en-US')}`;
  };

  /**
   * Programmatic Custom-Branded High-Fidelity Client Presentation PDF Generation
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
      const [brR, brG, brB] = branding.brandColorRgb;

      // 0. Optional Light Presentation Watermark
      if (branding.showWatermark) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(243, 244, 246); // extremely faint gray
        doc.text('CLIENT PRESENTATION // STRICTLY CONFIDENTIAL', pageWidth / 2, 140, {
          align: 'center',
          angle: 45,
        });
      }

      // 1. Top Agency Ribbon in Custom Brand Theme Color
      doc.setFillColor(brR, brG, brB);
      doc.rect(marginX, 10, contentWidth, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(branding.confidentialityLevel.toUpperCase(), marginX + 3, 15.3);

      doc.setTextColor(240, 245, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const safeAgencyHeader = branding.agencyName.toUpperCase().substring(0, 38);
      doc.text(`${safeAgencyHeader} • FISCAL YEAR 2026/2027`, marginX + contentWidth - 3, 15.3, {
        align: 'right',
      });

      // 2. Document Title & Subtitle with Agency Identity
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TALENT SCARCITY & EXECUTIVE COMPENSATION DOSSIER', marginX, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(branding.agencySubtitle.substring(0, 95), marginX, 29);

      // 3. Client & Presentation Target Metadata Banner
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(brR, brG, brB);
      doc.setLineWidth(0.4);
      doc.roundedRect(marginX, 32, contentWidth, 18, 1.5, 1.5, 'FD');

      // Left Column: Client, Target Candidate & Role
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Client Engagement:', marginX + 4, 37.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brR, brG, brB);
      doc.text(branding.clientName.substring(0, 36), marginX + 32, 37.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Target Role:', marginX + 4, 42.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${profile.title} (${profile.sectorLabel})`, marginX + 32, 42.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Prepared & Presented by: ${branding.presenterName} • ${branding.presenterTitle}`,
        marginX + 4,
        47.5
      );

      // Right Column: Scarcity & Document Metadata
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(
        `SCARCITY RATING: CRITICAL DEFICIT (${profile.scarcityScore || 94}/100)`,
        marginX + contentWidth - 4,
        37.5,
        { align: 'right' }
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const agencyShort = branding.agencyName.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();
      doc.text(
        `Doc ID: ${agencyShort}-2026-${profile.id.toUpperCase()} • Currency: ${currency} ${isPppMode ? '(PPP)' : '(Nominal)'}`,
        marginX + contentWidth - 4,
        42.5,
        { align: 'right' }
      );
      doc.text(`Agency: ${branding.agencyName}`, marginX + contentWidth - 4, 47.5, {
        align: 'right',
      });

      // 4. Section 1: Macro Market Scorecard & Velocity
      let currentY = 55;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(brR, brG, brB);
      doc.text('1. MACRO MARKET SCORECARD & VELOCITY', marginX, currentY);

      currentY += 3;
      const cardW = (contentWidth - 9) / 4;
      const cardH = 16.5;
      const cardGap = 3;

      const scorecards = [
        {
          title: '90TH PERCENTILE TTC',
          value: formatPdfCurrency(profile.percentileDistribution[3]?.p90 || 520000),
          sub: '+18.5% YoY Growth',
          subColor: [16, 185, 129],
        },
        {
          title: 'MEAN TIME-TO-FILL',
          value: '78 Calendar Days',
          sub: 'vs 42d Tech Avg (+85%)',
          subColor: [100, 116, 139],
        },
        {
          title: 'CANDIDATE PIPELINE',
          value: '3.2 : 1 Ratio',
          sub: 'Roles / Verified Lead',
          subColor: [220, 38, 38],
        },
        {
          title: 'BAY AREA / HUB PREMIUM',
          value: '+18.0%',
          sub: 'Over Remote Benchmark',
          subColor: [100, 116, 139],
        },
      ];

      scorecards.forEach((sc, i) => {
        const cx = marginX + i * (cardW + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(cx, currentY, cardW, cardH, 1, 1, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(sc.title, cx + cardW / 2, currentY + 4.2, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sc.value, cx + cardW / 2, currentY + 9.5, { align: 'center' });

        doc.setFontSize(6.5);
        doc.setTextColor(sc.subColor[0], sc.subColor[1], sc.subColor[2]);
        doc.text(sc.sub, cx + cardW / 2, currentY + 14, { align: 'center' });
      });

      // 5. Section 2: Total Target Compensation Distribution Table
      currentY += cardH + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(brR, brG, brB);
      doc.text('2. TOTAL TARGET COMPENSATION (TTC) PERCENTILE DISTRIBUTION', marginX, currentY);

      currentY += 3;
      const thHeight = 6.2;
      const colWidths = [42, 34, 34, 36, 36];

      // Header row
      doc.setFillColor(30, 41, 59);
      doc.rect(marginX, currentY, contentWidth, thHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      let colX = marginX + 3;
      doc.text('Percentile Band', colX, currentY + 4.3);
      colX += colWidths[0];
      doc.text('Base Salary', colX, currentY + 4.3);
      colX += colWidths[1];
      doc.text('Annual Bonus', colX, currentY + 4.3);
      colX += colWidths[2];
      doc.text('4-Year RSU Grant', colX, currentY + 4.3);
      colX += colWidths[3];
      doc.text('Annualized Total (TTC)', colX, currentY + 4.3);

      currentY += thHeight;

      const compRows = [
        {
          band: '25th Percentile',
          base: profile.percentileDistribution[0]?.p25 || 185000,
          bonusPct: '15%',
          bonusVal: Math.round((profile.percentileDistribution[0]?.p25 || 185000) * 0.15),
          rsu: 240000,
          ttc: Math.round((profile.percentileDistribution[0]?.p25 || 185000) * 1.15 + 240000 / 4),
          highlight: false,
        },
        {
          band: 'Median (50th Percentile)',
          base: profile.percentileDistribution[1]?.median || 240000,
          bonusPct: '20%',
          bonusVal: Math.round((profile.percentileDistribution[1]?.median || 240000) * 0.2),
          rsu: 480000,
          ttc: Math.round((profile.percentileDistribution[1]?.median || 240000) * 1.2 + 480000 / 4),
          highlight: false,
        },
        {
          band: '75th Percentile',
          base: profile.percentileDistribution[2]?.p75 || 285000,
          bonusPct: '25%',
          bonusVal: Math.round((profile.percentileDistribution[2]?.p75 || 285000) * 0.25),
          rsu: 720000,
          ttc: Math.round((profile.percentileDistribution[2]?.p75 || 285000) * 1.25 + 720000 / 4),
          highlight: false,
        },
        {
          band: '90th Percentile (Elite / Lead)',
          base: profile.percentileDistribution[3]?.p90 || 340000,
          bonusPct: '30%',
          bonusVal: Math.round((profile.percentileDistribution[3]?.p90 || 340000) * 0.3),
          rsu: 1100000,
          ttc: Math.round((profile.percentileDistribution[3]?.p90 || 340000) * 1.3 + 1100000 / 4),
          highlight: true,
        },
      ];

      const rowH = 6.8;
      compRows.forEach((r, idx) => {
        if (r.highlight) {
          // Tinted highlight row using theme color
          doc.setFillColor(245, 248, 255);
          doc.setDrawColor(brR, brG, brB);
          doc.setLineWidth(0.35);
          doc.rect(marginX, currentY, contentWidth, rowH, 'FD');
        } else {
          doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.rect(marginX, currentY, contentWidth, rowH, 'FD');
        }

        doc.setFontSize(7.2);
        let rx = marginX + 3;

        // Band Name
        doc.setFont('helvetica', r.highlight ? 'bold' : 'normal');
        doc.setTextColor(r.highlight ? brR : 30, r.highlight ? brG : 41, r.highlight ? brB : 59);
        doc.text(r.band, rx, currentY + 4.6);

        // Base Salary
        rx += colWidths[0];
        doc.setFont('helvetica', r.highlight ? 'bold' : 'normal');
        doc.text(formatPdfCurrency(r.base), rx, currentY + 4.6);

        // Bonus
        rx += colWidths[1];
        doc.setFont('helvetica', 'normal');
        doc.text(`${r.bonusPct} (${formatPdfCurrency(r.bonusVal)})`, rx, currentY + 4.6);

        // RSU
        rx += colWidths[2];
        doc.setFont('helvetica', r.highlight ? 'bold' : 'normal');
        doc.text(formatPdfCurrency(r.rsu), rx, currentY + 4.6);

        // Annualized TTC
        rx += colWidths[3];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(r.highlight ? brR : 15, r.highlight ? brG : 23, r.highlight ? brB : 42);
        doc.text(formatPdfCurrency(r.ttc), rx, currentY + 4.6);

        currentY += rowH;
      });

      // 6. Section 3: High-Scarcity Skill Premiums & Peer Lab Bands
      currentY += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(brR, brG, brB);

      const splitColW = (contentWidth - 6) / 2;
      const col1X = marginX;
      const col2X = marginX + splitColW + 6;

      doc.text('3. HIGH-SCARCITY SKILL PREMIUMS', col1X, currentY);
      doc.text('4. PEER LABORATORY COMP BANDS', col2X, currentY);

      currentY += 3;
      const splitBoxH = 32;

      // Box 1: High Scarcity Skills
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(col1X, currentY, splitColW, splitBoxH, 1, 1, 'FD');

      const skillsList = profile.keySkillsPremium?.length
        ? profile.keySkillsPremium.slice(0, 4)
        : [
            { skill: 'Triton / CUDA Kernel Optimization', premiumPercent: 28 },
            { skill: 'FlashAttention-3 & Megatron Scaling', premiumPercent: 24 },
            { skill: 'vLLM & PagedAttention Inference', premiumPercent: 20 },
            { skill: 'Multi-Tenant Slurm / GPU Fabrics', premiumPercent: 18 },
          ];

      const itemH = splitBoxH / 4;
      skillsList.forEach((sk, idx) => {
        const sy = currentY + idx * itemH;
        if (idx > 0) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.line(col1X, sy, col1X + splitColW, sy);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(30, 41, 59);
        const skillTitle = sk.skill.length > 33 ? sk.skill.substring(0, 33) + '...' : sk.skill;
        doc.text(skillTitle, col1X + 3, sy + 4.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(`+${sk.premiumPercent}% Prem.`, col1X + splitColW - 3, sy + 4.8, { align: 'right' });
      });

      // Box 2: Peer Lab Anchors
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(col2X, currentY, splitColW, splitBoxH, 1, 1, 'FD');

      const peerLabs = [
        { lab: 'OpenAI (L6/L7 Research)', band: '$580k - $920k TC' },
        { lab: 'Anthropic (MTS Lead)', band: '$520k - $850k TC' },
        { lab: 'Meta FAIR / GenAI Infrastructure', band: '$500k - $780k TC' },
        { lab: 'Google DeepMind (Senior Staff)', band: '$480k - $760k TC' },
      ];

      peerLabs.forEach((pl, idx) => {
        const sy = currentY + idx * itemH;
        if (idx > 0) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.line(col2X, sy, col2X + splitColW, sy);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(30, 41, 59);
        doc.text(pl.lab, col2X + 3, sy + 4.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(pl.band, col2X + splitColW - 3, sy + 4.8, { align: 'right' });
      });

      // 7. Section 4: Formal Recommendation & Client Presentation Governance
      currentY += splitBoxH + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(brR, brG, brB);
      doc.text('5. EXECUTIVE RECOMMENDATION & CLIENT ACCEPTANCE COVENANTS', marginX, currentY);

      currentY += 3;
      const recBoxH = branding.showClientSignoff ? 44 : 36;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(brR, brG, brB);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, recBoxH, 1.5, 1.5, 'FD');

      const recColW = (contentWidth - 8) / 2;
      const rcol1 = marginX + 4;
      const rcol2 = marginX + recColW + 4;

      // Offer Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text('Approved Target Offer Structure:', rcol1, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text(`• Base Salary: ${formatPdfCurrency(275000)} / yr (Target 55th-60th percentile)`, rcol1, currentY + 8.8);
      doc.text(`• Performance Bonus: 20% target (${formatPdfCurrency(55000)} annualized)`, rcol1, currentY + 12.8);
      doc.text(`• 4-Year RSU Grant: ${formatPdfCurrency(650000)} (Standard 25% annual vesting)`, rcol1, currentY + 16.8);
      doc.text(`• Year-1 Realized Target Liquidity: ${formatPdfCurrency(492500)} (Base + Bonus + Vest)`, rcol1, currentY + 20.8);

      // Ceilings & Conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text('Maximum Walk-Away Signing Authority Ceiling:', rcol2, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text(`• Base Salary Ceiling: ${formatPdfCurrency(310000)} (Requires Client Exec approval)`, rcol2, currentY + 8.8);
      doc.text(`• 4-Year RSU Cap: ${formatPdfCurrency(850000)} with 1-year cliff + monthly vest`, rcol2, currentY + 12.8);
      doc.text(`• Sign-on Bonus Cap: ${formatPdfCurrency(50000)} (12-month clawback rider)`, rcol2, currentY + 16.8);
      doc.text('• Acceleration Rider: Double-trigger acceleration upon change-of-control', rcol2, currentY + 20.8);

      // Sign-off line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(marginX + 4, currentY + 25, marginX + contentWidth - 4, currentY + 25);

      if (branding.showClientSignoff) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(brR, brG, brB);
        doc.text(`Client Representative Acceptance (${branding.clientName}):`, rcol1, currentY + 29.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Signature: __________________________________   Date: ______________', rcol1, currentY + 34.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Advisory Verification (${branding.agencyName}):`, rcol2, currentY + 29.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Certified by: ${branding.presenterName} • ${branding.presenterTitle}`, rcol2, currentY + 34.5);
        doc.text('Audit Hash: TR-VERIFIED-AGENCY-DOSSIER // talentradar.io', rcol2, currentY + 39);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Prepared by: ${branding.presenterName} (${branding.agencyName})`, rcol1, currentY + 29.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Audit Hash: TR-VERIFIED-AGENCY-DOSSIER // talentradar.io', marginX + contentWidth - 4, currentY + 29.5, {
          align: 'right',
        });
      }

      // 8. Document Footer
      const footerY = 278;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY, marginX + contentWidth, footerY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${branding.confidentialityLevel} • PRESENTED BY ${branding.agencyName.toUpperCase()}`,
        marginX,
        footerY + 4.5
      );
      doc.text(
        `Page 1 of 1 • Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
        marginX + contentWidth,
        footerY + 4.5,
        { align: 'right' }
      );

      // Direct dynamic file naming using agency branding
      const safeAgencyName = branding.agencyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 24);
      const safeRoleName = profile.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 24);
      const fileName = `${safeAgencyName}_Client_Dossier_${safeRoleName}_${currency}.pdf`;
      doc.save(fileName);

      setIsGeneratingPdf(false);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `
# ${branding.agencyName.toUpperCase()}
## EXECUTIVE COMPENSATION & TALENT SCARCITY CLIENT DOSSIER
**Classification:** ${branding.confidentialityLevel}
**Client Reference:** ${branding.clientName}
**Candidate / Role:** ${profile.title} (${profile.sectorLabel})
**Presented By:** ${branding.presenterName}, ${branding.presenterTitle}
**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

### 1. MACRO SCARCITY & VELOCITY METRICS
- **90th Percentile TTC:** ${formatAmount(profile.percentileDistribution[3]?.p90 || 520000)} / yr
- **Talent Scarcity Score:** ${profile.scarcityScore || 94} / 100 (Critical Deficit)
- **Mean Time-to-Fill:** 78 Calendar Days (vs 42d tech average)
- **Bay Area / Metro Premium:** +18% over remote baseline

### 2. COMPENSATION PERCENTILE DISTRIBUTION (TTC)
| Percentile Band | Base Salary | Annual Bonus | 4-Year RSU Grant | Annualized TTC |
|---|---|---|---|---|
| 25th Percentile | ${formatAmount(profile.percentileDistribution[0]?.p25 || 185000)} | 15% | ${formatAmount(240000)} | ${formatAmount(272750)} |
| Median (50th) | ${formatAmount(profile.percentileDistribution[1]?.median || 240000)} | 20% | ${formatAmount(480000)} | ${formatAmount(408000)} |
| 75th Percentile | ${formatAmount(profile.percentileDistribution[2]?.p75 || 285000)} | 25% | ${formatAmount(720000)} | ${formatAmount(536250)} |
| 90th (Elite) | ${formatAmount(profile.percentileDistribution[3]?.p90 || 340000)} | 30% | ${formatAmount(1100000)} | ${formatAmount(717000)} |

### 3. CLIENT ACCEPTANCE & SIGNING AUTHORITY
- **Recommended Offer:** Base ${formatAmount(275000)} + 20% bonus + ${formatAmount(650000)} 4-yr RSU
- **Walk-Away Authority Ceiling:** Base ${formatAmount(310000)} + ${formatAmount(850000)} RSU cap
- **Prepared By Agency:** ${branding.agencyName}
- **Lead Presenter:** ${branding.presenterName} (${branding.presenterTitle})
`;

    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0f171e] border border-[#1e2b36] rounded-xl shadow-2xl overflow-hidden font-mono text-[#dce7f0] max-h-[94vh] flex flex-col">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 border-b border-[#1e2b36] bg-[#111a22] gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg border text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: branding.primaryHex, borderColor: `${branding.primaryHex}aa` }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#dce7f0]">
                  CLIENT PRESENTATION &amp; EXECUTIVE DOSSIER
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: branding.primaryHex }}
                >
                  {branding.agencyName.split(' ')[0]} BRANDED
                </span>
              </div>
              <p className="text-[11px] text-[#7a8b99]">
                Presented by <strong className="text-white">{branding.agencyName}</strong> for{' '}
                <span className="text-[#38bdf8]">{branding.clientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Custom Branding Drawer Toggle */}
            <button
              onClick={() => setShowBrandingEditor(!showBrandingEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                showBrandingEditor
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-[#16222f] hover:bg-[#1e2f42] border-[#2563eb]/60 text-[#60a5fa]'
              }`}
              title="Customize agency branding, client name, colors, and presenter signature"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>CUSTOM BRANDING</span>
              {showBrandingEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Role Switcher */}
            <select
              value={selectedRoleKey}
              onChange={(e) => setSelectedRoleKey(e.target.value)}
              className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-2.5 py-1.5 text-xs text-[#dce7f0] focus:border-[#22d3a5] outline-none"
            >
              {Object.keys(CAREER_PROFILES).map((key) => (
                <option key={key} value={key}>
                  {CAREER_PROFILES[key].title}
                </option>
              ))}
            </select>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-semibold text-[#dce7f0] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5 text-[#7a8b99]" />}
              <span>{copied ? 'COPIED MD' : 'COPY MD'}</span>
            </button>

            {/* Direct Vector jsPDF Download with Custom Branding */}
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: branding.primaryHex }}
              title="Export branded client presentation vector PDF document directly to disk via jsPDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>EXPORTING PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF EXPORTED!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT PDF (jsPDF)</span>
                </>
              )}
            </button>

            {/* Standard Browser Print */}
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

        {/* Custom Branding & Presentation Customizer Bar */}
        {showBrandingEditor && (
          <div className="print:hidden bg-[#0c131a] border-b border-[#1e2b36] p-4 text-xs font-sans space-y-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                  Client Presentation Branding Presets
                </span>
                <span className="text-[10px] text-[#7a8b99] font-mono">
                  (Changes reflect in real time on screen and in vector PDF export)
                </span>
              </div>

              {/* 1-Click Agency Presets */}
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  onClick={() => handleSelectPreset('omnitalent')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                    branding.agencyName.includes('Apex') || branding.agencyName.includes('OmniTalent')
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-300'
                      : 'bg-[#16222f] text-blue-400 hover:bg-[#1f2e3e] border border-blue-500/30'
                  }`}
                >
                  Sapphire Agency Preset
                </button>
                <button
                  onClick={() => handleSelectPreset('vanguard')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                    branding.agencyName.includes('Vanguard')
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-300'
                      : 'bg-[#16222f] text-purple-400 hover:bg-[#1f2e3e] border border-purple-500/30'
                  }`}
                >
                  Vanguard Advisory
                </button>
                <button
                  onClick={() => handleSelectPreset('talentradar')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                    branding.agencyName.includes('TalentRadar')
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                      : 'bg-[#16222f] text-emerald-400 hover:bg-[#1f2e3e] border border-emerald-500/30'
                  }`}
                >
                  TalentRadar Default
                </button>
                <button
                  onClick={() => handleSelectPreset('frontier')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                    branding.agencyName.includes('Frontier')
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-300'
                      : 'bg-[#16222f] text-rose-400 hover:bg-[#1f2e3e] border border-rose-500/30'
                  }`}
                >
                  Frontier Search
                </button>
              </div>
            </div>

            {/* Custom Brand Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Agency / Firm Name
                </label>
                <input
                  type="text"
                  value={branding.agencyName}
                  onChange={(e) => setBranding({ ...branding, agencyName: e.target.value })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. OmniTalent AI Executive Group"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Client Engagement / Reference
                </label>
                <input
                  type="text"
                  value={branding.clientName}
                  onChange={(e) => setBranding({ ...branding, clientName: e.target.value })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. Confidential Series B Frontier Lab"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Presenter Name &amp; Title
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={branding.presenterName}
                    onChange={(e) => setBranding({ ...branding, presenterName: e.target.value })}
                    className="w-1/2 bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                    placeholder="Jane Doe, Partner"
                  />
                  <input
                    type="text"
                    value={branding.presenterTitle}
                    onChange={(e) => setBranding({ ...branding, presenterTitle: e.target.value })}
                    className="w-1/2 bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                    placeholder="Managing Director"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Brand Theme Color
                </label>
                <select
                  value={branding.themeColorId}
                  onChange={(e) => handleThemeColorChange(e.target.value as PresentationBranding['themeColorId'])}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                >
                  {Object.entries(THEME_COLOR_MAP).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Branding Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Confidentiality Level / Header
                </label>
                <select
                  value={branding.confidentialityLevel}
                  onChange={(e) => setBranding({ ...branding, confidentialityLevel: e.target.value })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                >
                  <option value="STRICTLY CONFIDENTIAL // CLIENT PRESENTATION">
                    STRICTLY CONFIDENTIAL // CLIENT PRESENTATION
                  </option>
                  <option value="RESTRICTED // BOARD COMPENSATION COMMITTEE BRIEFING">
                    RESTRICTED // BOARD COMPENSATION COMMITTEE BRIEFING
                  </option>
                  <option value="RESTRICTED // M&A COMMITTEE REVIEW">
                    RESTRICTED // M&A COMMITTEE REVIEW
                  </option>
                  <option value="CONFIDENTIAL // EXECUTIVE SEARCH DIRECTIVE">
                    CONFIDENTIAL // EXECUTIVE SEARCH DIRECTIVE
                  </option>
                  <option value="PRIVATE & CONFIDENTIAL // C-SUITE EYES ONLY">
                    PRIVATE &amp; CONFIDENTIAL // C-SUITE EYES ONLY
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#7a8b99] mb-1">
                  Agency Subtitle / Practice Focus
                </label>
                <input
                  type="text"
                  value={branding.agencySubtitle}
                  onChange={(e) => setBranding({ ...branding, agencySubtitle: e.target.value })}
                  className="w-full bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                  placeholder="Frontier AI Executive Search & Compensation Advisory"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#dce7f0]">
                  <input
                    type="checkbox"
                    checked={branding.showClientSignoff}
                    onChange={(e) => setBranding({ ...branding, showClientSignoff: e.target.checked })}
                    className="accent-blue-500 w-4 h-4 rounded"
                  />
                  <span>Include Client Sign-off Line in PDF</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#dce7f0]">
                  <input
                    type="checkbox"
                    checked={branding.showWatermark}
                    onChange={(e) => setBranding({ ...branding, showWatermark: e.target.checked })}
                    className="accent-blue-500 w-4 h-4 rounded"
                  />
                  <span>Render Presentation Watermark</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Printable & On-Screen Custom Branded Document Body */}
        <div
          ref={printRef}
          className="relative p-8 overflow-y-auto space-y-6 bg-white text-slate-900 print:p-6 print:m-0 print:text-black"
        >
          {/* Subtle Watermark in background if enabled */}
          {branding.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
              <span className="text-7xl font-black font-sans tracking-widest text-slate-900 uppercase transform -rotate-45">
                CLIENT PRESENTATION • CONFIDENTIAL
              </span>
            </div>
          )}

          {/* Executive Agency Header with dynamic brand bar */}
          <div className="border-b-2 border-slate-900 pb-4 relative z-10">
            {/* Dynamic Brand Color Top Ribbon */}
            <div
              className="h-1.5 w-full rounded-t mb-3"
              style={{ backgroundColor: branding.primaryHex }}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 text-white font-bold inline-block rounded-sm"
                    style={{ backgroundColor: branding.primaryHex }}
                  >
                    {branding.confidentialityLevel}
                  </span>
                  <span className="text-[11px] font-sans font-bold text-slate-600">
                    {branding.agencyName}
                  </span>
                </div>

                <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-950">
                  TALENT SCARCITY &amp; EXECUTIVE COMPENSATION DOSSIER
                </h1>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  {branding.agencySubtitle}
                </p>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-500 shrink-0">
                <div className="font-bold text-slate-900">
                  Doc ID: {branding.agencyName.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase()}-2026-
                  {profile.id.toUpperCase()}
                </div>
                <div>Date: November 2026</div>
                <div>
                  Currency: {currency} {isPppMode ? '(PPP)' : '(Nominal)'}
                </div>
              </div>
            </div>

            {/* Target Role & Client Engagement Banner */}
            <div
              className={`mt-4 p-3.5 rounded border flex flex-wrap items-center justify-between text-xs font-sans gap-2 ${branding.accentBgClass} ${branding.accentBorderClass}`}
            >
              <div>
                <strong className="text-slate-900">Client Engagement:</strong>{' '}
                <span className="font-bold" style={{ color: branding.primaryHex }}>
                  {branding.clientName}
                </span>
              </div>
              <div>
                <strong className="text-slate-900">Target Role:</strong> {profile.title}
              </div>
              <div>
                <strong className="text-slate-900">Presented By:</strong>{' '}
                <span className="text-slate-700">
                  {branding.presenterName} ({branding.presenterTitle})
                </span>
              </div>
              <div>
                <strong className="text-slate-900">Scarcity Rating:</strong>{' '}
                <span className="text-red-600 font-bold">
                  CRITICAL DEFICIT ({profile.scarcityScore || 94}/100)
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Macro Scorecard */}
          <div className="relative z-10">
            <h2
              className="text-xs font-bold uppercase tracking-wider font-mono mb-2"
              style={{ color: branding.primaryHex }}
            >
              1. Macro Market Scorecard &amp; Velocity
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-3 border border-slate-300 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 uppercase">90th Percentile TTC</div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {formatAmount(profile.percentileDistribution[3]?.p90 || 520000)}
                </div>
                <div className="text-[9px] text-emerald-600 font-semibold">+18.5% YoY Growth</div>
              </div>

              <div className="p-3 border border-slate-300 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 uppercase">Mean Time-to-Fill</div>
                <div className="text-lg font-bold text-slate-900 mt-1">78 Days</div>
                <div className="text-[9px] text-slate-500">vs 42d Tech Avg</div>
              </div>

              <div className="p-3 border border-slate-300 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 uppercase">Candidate Pipeline</div>
                <div className="text-lg font-bold text-slate-900 mt-1">3.2 : 1</div>
                <div className="text-[9px] text-red-600 font-semibold">Roles per Verified Lead</div>
              </div>

              <div className="p-3 border border-slate-300 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 uppercase">Bay Area / Hub Premium</div>
                <div className="text-lg font-bold text-slate-900 mt-1">+18.0%</div>
                <div className="text-[9px] text-slate-500">Over Remote Benchmark</div>
              </div>
            </div>
          </div>

          {/* Section 2: Compensation Percentile Table */}
          <div className="relative z-10">
            <h2
              className="text-xs font-bold uppercase tracking-wider font-mono mb-2"
              style={{ color: branding.primaryHex }}
            >
              2. Total Target Compensation (TTC) Distribution
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold border-b border-slate-300 text-left">
                    <th className="p-2 border-r border-slate-700">Percentile Band</th>
                    <th className="p-2 border-r border-slate-700">Base Salary</th>
                    <th className="p-2 border-r border-slate-700">Annual Bonus</th>
                    <th className="p-2 border-r border-slate-700">4-Year RSU Grant</th>
                    <th className="p-2 font-mono" style={{ backgroundColor: branding.primaryHex }}>
                      Annualized Total (TTC)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  <tr>
                    <td className="p-2 font-bold font-sans border-r border-slate-300">25th Percentile</td>
                    <td className="p-2 border-r border-slate-300">
                      {formatAmount(profile.percentileDistribution[0]?.p25 || 185000)}
                    </td>
                    <td className="p-2 border-r border-slate-300">15% ({formatAmount(27750)})</td>
                    <td className="p-2 border-r border-slate-300">{formatAmount(240000)}</td>
                    <td className="p-2 font-bold bg-slate-50">{formatAmount(272750)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans border-r border-slate-300">Median (50th)</td>
                    <td className="p-2 border-r border-slate-300">
                      {formatAmount(profile.percentileDistribution[1]?.median || 240000)}
                    </td>
                    <td className="p-2 border-r border-slate-300">20% ({formatAmount(48000)})</td>
                    <td className="p-2 border-r border-slate-300">{formatAmount(480000)}</td>
                    <td className="p-2 font-bold bg-slate-50">{formatAmount(408000)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans border-r border-slate-300">75th Percentile</td>
                    <td className="p-2 border-r border-slate-300">
                      {formatAmount(profile.percentileDistribution[2]?.p75 || 285000)}
                    </td>
                    <td className="p-2 border-r border-slate-300">25% ({formatAmount(71250)})</td>
                    <td className="p-2 border-r border-slate-300">{formatAmount(720000)}</td>
                    <td className="p-2 font-bold bg-slate-50">{formatAmount(536250)}</td>
                  </tr>
                  <tr className={`${branding.accentBgClass}`}>
                    <td
                      className="p-2 font-bold font-sans border-r border-slate-300"
                      style={{ color: branding.primaryHex }}
                    >
                      90th Percentile (Elite / Lead)
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold">
                      {formatAmount(profile.percentileDistribution[3]?.p90 || 340000)}
                    </td>
                    <td className="p-2 border-r border-slate-300">30% ({formatAmount(102000)})</td>
                    <td className="p-2 border-r border-slate-300 font-bold">{formatAmount(1100000)}</td>
                    <td
                      className="p-2 font-bold font-mono"
                      style={{ color: branding.primaryHex, backgroundColor: `${branding.primaryHex}15` }}
                    >
                      {formatAmount(717000)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Skill Premiums & Peer Lab Comp Bands */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider font-mono mb-2"
                style={{ color: branding.primaryHex }}
              >
                3. High-Scarcity Skill Premiums
              </h2>
              <div className="border border-slate-300 rounded divide-y divide-slate-200 text-xs font-sans">
                <div className="p-2 flex justify-between items-center">
                  <span>Triton / CUDA Kernel Optimization</span>
                  <strong className="text-emerald-700 font-mono">+$65,000 / yr</strong>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>FlashAttention-3 &amp; Megatron Scaling</span>
                  <strong className="text-emerald-700 font-mono">+$55,000 / yr</strong>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>vLLM &amp; PagedAttention Inference</span>
                  <strong className="text-emerald-700 font-mono">+$45,000 / yr</strong>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>Multi-Tenant Slurm / Kubernetes Fabrics</span>
                  <strong className="text-emerald-700 font-mono">+$40,000 / yr</strong>
                </div>
              </div>
            </div>

            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider font-mono mb-2"
                style={{ color: branding.primaryHex }}
              >
                4. Peer Laboratory Comp Bands
              </h2>
              <div className="border border-slate-300 rounded divide-y divide-slate-200 text-xs font-sans">
                <div className="p-2 flex justify-between items-center">
                  <span>OpenAI (L6/L7 Research Track)</span>
                  <span className="font-mono font-semibold">$580k - $920k TC</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>Anthropic (MTS Lead Level)</span>
                  <span className="font-mono font-semibold">$520k - $850k TC</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>Meta FAIR / GenAI Infrastructure</span>
                  <span className="font-mono font-semibold">$500k - $780k TC</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span>Google DeepMind (Senior Staff)</span>
                  <span className="font-mono font-semibold">$480k - $760k TC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Recommendation & Client Sign-off */}
          <div
            className={`border rounded-lg p-4 bg-slate-50 text-xs font-sans space-y-3 relative z-10 ${branding.accentBorderClass}`}
          >
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <h2
                className="font-bold font-mono uppercase text-xs"
                style={{ color: branding.primaryHex }}
              >
                5. Executive Recommendation &amp; Client Acceptance Covenants
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                Mandate: {branding.clientName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
              <div>
                <p className="leading-relaxed">
                  <strong>Approved Target Offer Package:</strong> Base Salary of{' '}
                  <span className="font-mono font-bold text-slate-900">{formatAmount(275000)}</span>, 20% target
                  annual bonus, and a 4-year equity grant valued at{' '}
                  <span className="font-mono font-bold text-slate-900">{formatAmount(650000)}</span> with standard 25% annual vesting.
                </p>
              </div>
              <div>
                <p className="leading-relaxed">
                  <strong>Maximum Walk-Away Signing Authority:</strong> Base Salary ceiling of{' '}
                  <span className="font-mono font-bold text-slate-900">{formatAmount(310000)}</span>, up to{' '}
                  <span className="font-mono font-bold text-slate-900">{formatAmount(850000)}</span> in 4-year equity grant cap, and a sign-on bonus not to exceed{' '}
                  <span className="font-mono font-bold text-slate-900">{formatAmount(50000)}</span>.
                </p>
              </div>
            </div>

            {/* Client Presentation Sign-off Block */}
            {branding.showClientSignoff && (
              <div className="mt-3 pt-3 border-t border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Client Representative Acceptance ({branding.clientName}):
                  </div>
                  <div className="h-7 border-b border-dashed border-slate-400 mt-2 flex items-end">
                    <span className="text-[10px] text-slate-400 font-mono">Signature: _______________________</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Authorized Signing Officer</span>
                    <span>Date: ____________</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Advisory Certification ({branding.agencyName}):
                  </div>
                  <div className="text-[11px] font-sans font-semibold text-slate-900 mt-1">
                    {branding.presenterName} • {branding.presenterTitle}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-2 flex justify-between">
                    <span>Verified via TalentRadar Intel</span>
                    <span>Audit: TR-AGENCY-2026</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="print:hidden px-6 py-3 border-t border-[#1e2b36] bg-[#111a22] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7a8b99] gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: branding.primaryHex }}
            />
            <span>
              Branded for <strong className="text-white">{branding.agencyName}</strong> • Direct Client Presentation Export ({currency})
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBrandingEditor(!showBrandingEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16222f] hover:bg-[#1e2f42] border border-[#2563eb]/40 text-[#60a5fa] font-semibold transition cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{showBrandingEditor ? 'HIDE BRANDING' : 'CUSTOM BRANDING'}</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white font-semibold transition cursor-pointer disabled:opacity-50 shadow-md"
              style={{ backgroundColor: branding.primaryHex }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'GENERATING PDF...' : 'EXPORT BRANDED PDF'}</span>
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
