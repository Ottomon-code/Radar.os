import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Radar,
  Bot,
  TrendingUp,
  Users,
  BadgeDollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Target,
  Download,
  Terminal,
} from 'lucide-react';

export interface TourStep {
  id: string;
  tabId: string;
  title: string;
  badge: string;
  badgeColor: string;
  targetFeature: string;
  description: string;
  keyHighlights: string[];
  recommendedAction?: {
    label: string;
    actionType: string;
  };
  icon: React.ReactNode;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: '3d-radar',
    tabId: 'radar',
    title: '3D Geospatial Requisition Radar',
    badge: 'CORE VISUALIZER',
    badgeColor: 'border-[#22d3a5]/50 text-[#22d3a5] bg-[#22d3a5]/10',
    targetFeature: 'Interactive Three.js 3D Globe with Floating Continent Spheres & Live Requisitions',
    description:
      'The heart of TalentRadar. Experience a full 3D rotating globe plotting global high-yield engineering and quant opportunities with live salary HUD telemetry when hovering over continental clusters.',
    keyHighlights: [
      'Interactive 3D Sphere & Floating Continent Hubs (SF, NYC, London, Zurich, Tokyo)',
      'Click or hover on floating nodes to reveal local salary medians & cost-of-living premiums',
      'Real-time Job Alert Subscriptions: Subscribe to simulated push notifications for matching roles',
      'Live compensation radar filtering with $0 to $500k+ dynamic range sliders',
    ],
    recommendedAction: {
      label: 'Explore 3D Globe & Continents',
      actionType: 'focus_radar',
    },
    icon: <Radar className="w-6 h-6 text-[#22d3a5]" />,
  },
  {
    id: 'ai-supervisor',
    tabId: 'ai',
    title: 'Autonomous AI Supervisor & Triad',
    badge: '4-AGENT INTELLIGENCE',
    badgeColor: 'border-[#38bdf8]/50 text-[#38bdf8] bg-[#38bdf8]/10',
    targetFeature: 'Multi-Agent Autonomous Triad: Commander, Strategist, Scout, and Envoy',
    description:
      'A synchronized 4-agent AI command staff operating in continuous autonomous cycles. The Commander synthesizes directives while specialized sub-agents scout requisitions, model compensation, and draft stealth outreach.',
    keyHighlights: [
      'Autonomous Inter-Agent Cycle: Run collaborative cycles with simulated inter-agent message buses',
      'Direct Channels: Command individual agents (e.g. prompt Envoy for negotiation scripts)',
      'Telemetry HUD: Real-time agent status, token throughput, and directive priority matrix',
      'Zero recruiter friction: Let the AI triad scout and negotiate on your behalf',
    ],
    recommendedAction: {
      label: 'Inspect 4-Agent Triad Console',
      actionType: 'focus_ai',
    },
    icon: <Bot className="w-6 h-6 text-[#38bdf8]" />,
  },
  {
    id: 'market-analytics',
    tabId: 'analytics',
    title: 'Quantitative Market Analytics & CSV Export',
    badge: 'MACRO COMP INTELLIGENCE',
    badgeColor: 'border-[#22d3a5]/50 text-[#22d3a5] bg-[#22d3a5]/10',
    targetFeature: 'Evolving Multi-Sector Salary Trajectories (2020–2027) & 1-Click CSV Download',
    description:
      'Macro compensation intelligence across 6 high-growth tech sectors. Observe historical trends (2020–2025) and calibrated forward projections (2026–2027), percentile distributions, and download spreadsheet-ready CSV files.',
    keyHighlights: [
      'Multi-Sector Time-Series: AI Compute, Quant/HFT, Robotics, Cloud, Cyber Defense, Bio ML',
      'Export Data (CSV): Download filtered projections and market charts with 1 click',
      'Multi-Currency Calibration: Instant recalculation in USD ($), EUR (€), GBP (£), and CHF (Fr.)',
      'Compensation Breakdown: Visual base cash vs. performance bonus vs. liquid equity splits',
    ],
    recommendedAction: {
      label: 'View Market Charts & Export CSV',
      actionType: 'focus_analytics',
    },
    icon: <TrendingUp className="w-6 h-6 text-[#22d3a5]" />,
  },
  {
    id: 'career-skilltree',
    tabId: 'career',
    title: 'Career Path & D3 Interactive Skill Tree',
    badge: 'D3 NODE VISUALIZATION',
    badgeColor: 'border-[#a78bfa]/50 text-[#a78bfa] bg-[#a78bfa]/10',
    targetFeature: 'Force-Directed Node Graph of Required Competencies & Experience Progression',
    description:
      'Map your progression toward executive compensation. An interactive, node-based D3 skill tree visualizes required technical competencies, market premiums (+32% for sharding), and milestone gates.',
    keyHighlights: [
      'Interactive D3 node physics: Click, drag, and inspect core skills and prerequisites',
      'Milestone Gateways: From Senior to Staff to Principal and Distinguished Architect',
      'High-Yield Skill Premiums: Real-time compensation delta badges for in-demand skills',
      'Custom Role Roadmapping: Align your background with target requisition profiles',
    ],
    recommendedAction: {
      label: 'Inspect D3 Skill Tree Nodes',
      actionType: 'focus_career',
    },
    icon: <Compass className="w-6 h-6 text-[#a78bfa]" />,
  },
  {
    id: 'stealthnet',
    tabId: 'stealthnet',
    title: 'StealthNet: Zero-Knowledge Talent Mesh',
    badge: 'ANONYMOUS NETWORKING',
    badgeColor: 'border-[#f472b6]/50 text-[#f472b6] bg-[#f472b6]/10',
    targetFeature: 'Anonymous Verified Talent Matching Without Public Profiling or Recruiter Spam',
    description:
      'An anonymous alternative to LinkedIn. Broadcast cryptographic beacons of your verified technical capabilities while keeping your identity masked behind zero-knowledge credentials.',
    keyHighlights: [
      'Zero-Knowledge Proofs: Prove compensation tier and engineering seniority anonymously',
      'Blind Direct Connect: Engage with top hiring engineering directors without spam',
      'Masked Beacons: Broadcast your availability strictly to verified frontier labs',
      'Full Privacy Shield: No public profile indexing or current employer discovery',
    ],
    recommendedAction: {
      label: 'View Stealth Beacons',
      actionType: 'focus_stealthnet',
    },
    icon: <Users className="w-6 h-6 text-[#f472b6]" />,
  },
  {
    id: 'financial-platform',
    tabId: 'finance',
    title: 'Compensation, Equity & Tax Platform',
    badge: 'COMP & TAX MODELER',
    badgeColor: 'border-[#fbbf24]/50 text-[#fbbf24] bg-[#fbbf24]/10',
    targetFeature: 'Total Target Comp Modeling, Global Tax Arbitrage & Offer Negotiation',
    description:
      'Model 4-year equity vesting schedules, compare net take-home pay across global tax jurisdictions, and benchmark counter-offers using ZOPA bargaining analytics.',
    keyHighlights: [
      'Total Target Comp Calculator: Model 4-year equity vesting schedules & cliff events',
      'Global Tax Arbitrage: Benchmark net take-home pay across 10 global tax jurisdictions',
      'ZOPA & Offer Countering: Quantify employer reservation price and candidate walkaway floor',
      'Advisory Invoicing: Generate executive search retainers and settlement vouchers',
    ],
    recommendedAction: {
      label: 'Explore Compensation & Tax Engine',
      actionType: 'focus_finance',
    },
    icon: <BadgeDollarSign className="w-6 h-6 text-[#fbbf24]" />,
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function GuidedTour({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Automatically navigate to step tab if not currently on it
  useEffect(() => {
    if (isOpen && currentStep && activeTab !== currentStep.tabId) {
      setActiveTab(currentStep.tabId);
    }
  }, [isOpen, currentStepIndex, currentStep, activeTab, setActiveTab]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setActiveTab(TOUR_STEPS[nextIndex].tabId);
    } else {
      // Completed tour
      try {
        localStorage.setItem('talent_radar_tour_completed', 'true');
      } catch (_) {}
      onClose();
    }
  }, [currentStepIndex, totalSteps, setActiveTab, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setActiveTab(TOUR_STEPS[prevIndex].tabId);
    }
  }, [currentStepIndex, setActiveTab]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Soft spotlight highlight frame on viewport border */}
      <div className="fixed inset-0 pointer-events-none z-40 border-4 border-[#22d3a5]/40 shadow-[inset_0_0_80px_rgba(34,211,165,0.15)] animate-pulse" />

      {/* Floating Tactical Tour Card */}
      <aside aria-label="Interactive Guided Tour" className="fixed bottom-6 right-6 z-50 w-full max-w-lg font-mono">
        <div className="bg-[#0f1720]/95 backdrop-blur-xl border-2 border-[#22d3a5] rounded-2xl shadow-[0_0_50px_rgba(34,211,165,0.35)] overflow-hidden text-[#dce7f0] transition-all duration-300">
          
          {/* Top Progress & Tactical Bar */}
          <div className="h-1.5 w-full bg-[#111a22]">
            <div
              className="h-full bg-gradient-to-r from-[#22d3a5] via-[#38bdf8] to-[#fbbf24] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-4 sm:p-5">
            {/* Header: Badge, Step Counter, Controls */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 ${currentStep.badgeColor}`}>
                  <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                  {currentStep.badge}
                </span>
                <span className="text-xs text-[#22d3a5] font-bold">
                  STEP {currentStepIndex + 1} OF {totalSteps}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="px-2 py-1 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-xs text-[#7a8b99] hover:text-white transition"
                  title={isMinimized ? 'Expand tour details' : 'Minimize tour card'}
                >
                  {isMinimized ? 'Expand' : 'Minimize'}
                </button>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('talent_radar_tour_completed', 'true');
                    } catch (_) {}
                    onClose();
                  }}
                  className="p-1 rounded bg-[#1e2b36] hover:bg-[#f87171]/20 hover:text-[#f87171] text-[#7a8b99] transition"
                  title="Close tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Minimized View */}
            {isMinimized ? (
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStep.icon}
                  <span className="text-sm font-bold text-white">{currentStep.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    className="p-1.5 rounded bg-[#1e2b36] disabled:opacity-30 text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-3 py-1.5 rounded bg-[#22d3a5] text-black font-bold text-xs"
                  >
                    {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded View */
              <div className="space-y-4 pt-3.5">
                {/* Step Title & Icon */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#152330] border border-[#22d3a5]/40 shadow-[0_0_15px_rgba(34,211,165,0.2)] shrink-0">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs text-[#38bdf8] font-semibold mt-0.5">
                      {currentStep.targetFeature}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#a0b2c6] leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Key Highlights Checklist */}
                <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] space-y-1.5 text-xs">
                  <div className="text-[10px] uppercase font-bold text-[#7a8b99] tracking-wider mb-1 flex items-center justify-between">
                    <span>Tactical Capabilities</span>
                    <span className="text-[#22d3a5]">Active on screen</span>
                  </div>
                  {currentStep.keyHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-[#dce7f0]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                {/* Step Navigation Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Step dots */}
                  <div className="flex items-center gap-1.5">
                    {TOUR_STEPS.map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          setCurrentStepIndex(idx);
                          setActiveTab(step.tabId);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentStepIndex
                            ? 'w-6 bg-[#22d3a5] shadow-[0_0_8px_rgba(34,211,165,0.8)]'
                            : idx < currentStepIndex
                            ? 'w-2 bg-[#22d3a5]/50'
                            : 'w-2 bg-[#1e2b36]'
                        }`}
                        title={`Jump to: ${step.title}`}
                      />
                    ))}
                  </div>

                  {/* Previous / Next buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handlePrevious}
                      disabled={currentStepIndex === 0}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] disabled:opacity-30 disabled:pointer-events-none border border-[#1e2b36] text-xs font-bold text-[#dce7f0] transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={handleNext}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,165,0.35)] active:scale-95 cursor-pointer"
                    >
                      <span>
                        {currentStepIndex === totalSteps - 1 ? 'Finish Tour' : 'Next Feature'}
                      </span>
                      {currentStepIndex === totalSteps - 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#7a8b99] pt-1">
                  <span>Tip: Use Left/Right Arrow keys to navigate</span>
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem('talent_radar_tour_completed', 'true');
                      } catch (_) {}
                      onClose();
                    }}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Skip Tour
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </aside>
    </>
  );
}
