import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Download,
  Share2,
  Check,
  Cpu,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  X,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSubscription } from '../context/SubscriptionContext';

interface FrontierCompReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradePrompt?: () => void;
}

export default function FrontierCompReportModal({
  isOpen,
  onClose,
  onUpgradePrompt,
}: FrontierCompReportModalProps) {
  const { isPro, openPaywall } = useSubscription();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}?report=frontier-comp-2026`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Cover Header
      doc.setFillColor(15, 23, 32);
      doc.rect(0, 0, pageWidth, 120, 'F');

      doc.setTextColor(34, 211, 165);
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text('TALENT_RADAR.OS // EXECUTIVE COMPENSATION REPORT', 40, 40);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('2026 State of Frontier AI & High-Performance Compute Comp', 40, 70);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text('A Quantitative Analysis of 100+ Senior Engineering & Research Offers', 40, 95);

      // Section 1: Executive Findings
      doc.setTextColor(34, 211, 165);
      doc.setFontSize(12);
      doc.text('1. EXECUTIVE SUMMARY & KEY TELEMETRY', 40, 150);

      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const findings = [
        '• CUDA & Kernel Optimization Premium: Compensation for low-level CUDA, Triton, and GPU kernel developers surged +42% YoY.',
        '• Cluster Orchestration Bands: Staff GPU Cluster Infrastructure engineers at frontier labs command $480k - $720k total comp.',
        '• Quantitative Liquidity Clauses: 78% of non-public frontier AI offers now feature annual liquidity buyback or secondary market tender guarantees.',
        '• 5-Year Comp Trajectory CAGR: High-performance compute roles demonstrate an 18.4% 5-year annualized comp appreciation rate.',
      ];
      let y = 175;
      findings.forEach((line) => {
        doc.text(line, 40, y);
        y += 24;
      });

      // Section 2: Compensation Benchmark Matrix
      y += 15;
      doc.setTextColor(34, 211, 165);
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('2. 2026 FRONTIER COMP DISTRIBUTION (MEDIAN BASE + EQUITY + BONUS)', 40, y);

      y += 25;
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const compMatrix = [
        ['Staff AI Infrastructure Engineer (GPU Orchestration)', '$285,000 Base', '$310,000 Equity', '$640,000 Total'],
        ['Senior Low-Latency FPGA / Quant Developer', '$250,000 Base', '$275,000 Bonus', '$525,000 Total'],
        ['Lead ML Evaluation & Alignment Architect', '$260,000 Base', '$240,000 Equity', '$535,000 Total'],
        ['Principal Autonomous Robotics Systems Lead', '$245,000 Base', '$210,000 Equity', '$495,000 Total'],
      ];

      compMatrix.forEach(([role, base, eq, tot]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(role, 40, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${base} | ${eq} | Total: ${tot}`, 40, y + 14);
        y += 30;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Published by TalentRadar.OS • Verified Data Source: Verified Offer Letter Submissions & Market Comms', 40, 780);

      doc.save('TalentRadar_2026_Frontier_AI_Comp_Report.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in font-mono text-xs text-[#dce7f0]"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-[#0c131a] border-2 border-[#22d3a5]/70 rounded-2xl shadow-[0_0_50px_rgba(34,211,165,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Accent Stripe */}
        <div className="bg-gradient-to-r from-[#22d3a5] via-[#38bdf8] to-[#fbbf24] h-1.5 w-full shrink-0" />

        {/* Header */}
        <div className="p-5 border-b border-[#1e2b36] flex items-start justify-between gap-4 bg-[#0f1720] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40">
                <FileText className="w-4 h-4 text-[#22d3a5]" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/50 font-bold uppercase tracking-wider">
                EXECUTIVE RESEARCH WHITE PAPER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 font-bold">
                Q1 2026 EDITION
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              2026 State of Frontier AI &amp; High-Performance Compute Comp Report
            </h2>
            <p className="text-xs text-[#7a8b99] mt-0.5 font-sans">
              Quantitative compensation telemetry, CUDA premiums, and 5-year CAGR forecasts across Tier-1 AI labs and quant funds.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
              <span className="text-[10px] text-[#7a8b99] block">CUDA TALENT PREMIUM</span>
              <span className="text-xl font-bold text-[#22d3a5]">+42% YoY</span>
              <span className="text-[10px] text-[#7a8b99] block mt-0.5">Over standard SWE</span>
            </div>

            <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
              <span className="text-[10px] text-[#7a8b99] block">MEDIAN STAFF COMP</span>
              <span className="text-xl font-bold text-[#fbbf24]">$585,000</span>
              <span className="text-[10px] text-[#7a8b99] block mt-0.5">Top quartile: $720k</span>
            </div>

            <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
              <span className="text-[10px] text-[#7a8b99] block">5-YR COMP CAGR</span>
              <span className="text-xl font-bold text-[#38bdf8]">18.4%</span>
              <span className="text-[10px] text-[#7a8b99] block mt-0.5">Annualized growth</span>
            </div>

            <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
              <span className="text-[10px] text-[#7a8b99] block">ANALYZED OFFERS</span>
              <span className="text-xl font-bold text-white">148 Verified</span>
              <span className="text-[10px] text-[#7a8b99] block mt-0.5">100% Verified Slips</span>
            </div>
          </div>

          {/* Key Findings Callout */}
          <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fbbf24]" />
              <span>KEY MARKET OBSERVATIONS &amp; HEADHUNTER TELEMETRY</span>
            </h3>

            <div className="space-y-2 text-xs text-[#94a3b8] font-sans">
              <div className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                <strong className="text-white block font-mono mb-0.5">1. GPU Cluster Orchestration is the New Moat:</strong>
                Engineers with hands-on track records managing multi-thousand H100/B200 GPU topologies with high Model Flop Utilization (MFU) are receiving aggressive multi-year sign-on packages ($50k - $120k cash).
              </div>

              <div className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                <strong className="text-white block font-mono mb-0.5">2. Quantitative Trading &amp; AI Infra Convergence:</strong>
                Prop trading shops like Citadel, HRT, and Jane Street are matching frontier AI research labs with all-cash compensation structures ($500k - $800k W-2) to avoid illiquid paper stock.
              </div>

              <div className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                <strong className="text-white block font-mono mb-0.5">3. Secondary Market Liquidity Guarantees:</strong>
                Over 78% of accepted senior offers at pre-IPO frontier AI ventures incorporate guaranteed secondary tender rights every 12 to 18 months.
              </div>
            </div>
          </div>

          {/* Action Row: PDF Download & Pro Upsell */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1e2b36]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs transition shadow cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'GENERATING PDF...' : 'DOWNLOAD FULL REPORT (PDF)'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e2b36] hover:bg-[#283847] border border-[#2e3e4e] text-white text-xs transition cursor-pointer"
                title="Copy shareable link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#22d3a5]" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'LINK COPIED' : 'SHARE'}</span>
              </button>
            </div>

            {!isPro && (
              <button
                onClick={() => {
                  onClose();
                  openPaywall('Unlock Full 2026 Executive Comp Benchmark Telemetry');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24] text-[#fbbf24] font-bold text-xs transition cursor-pointer"
              >
                <span>UNLOCK ALL 148 RAW OFFERS (PRO)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
