import React from 'react';
import {
  Radar,
  ShieldCheck,
  Cpu,
  Terminal,
  Radio,
  Sparkles,
  Bookmark,
  BadgeDollarSign,
  Building2,
  Lock,
  Crown,
  BellRing,
  Megaphone,
  Zap,
  Globe,
  Compass,
  FolderGit2,
  FileText,
  Scale,
  Smartphone,
  User as UserIcon,
  LogIn,
  KeyRound,
  QrCode,
  Video,
  Presentation,
  CreditCard,
  Unlock,
  Gift,
  HardDrive,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { SubscriptionStatusIndicator } from '../hooks/useSubscriptionStatus';
import { useJobAlerts } from '../context/JobAlertsContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineCacheStatusBadge } from './OfflineCacheStatusBadge';

interface HeaderProps {
  activeJobsCount?: number;
  unreadCommsCount?: number;
  bookmarksCount?: number;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  onOpenSaleModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenAlertsModal?: () => void;
  onOpenAuthenticUrlModal?: () => void;
  onOpenTour?: () => void;
  onOpenGithubModal?: () => void;
  onOpenCurrencyModal?: () => void;
  onOpenDossierModal?: () => void;
  onOpenPlayStoreModal?: () => void;
  onOpenDocketModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenContributeModal?: () => void;
  onOpenAgencyPilotModal?: () => void;
  onOpenFrontierReportModal?: () => void;
  onOpenWalkthroughModal?: () => void;
  onOpenDiligenceVaultModal?: () => void;
  onOpenDriveModal?: () => void;
}

export default function Header({
  activeJobsCount = 7,
  unreadCommsCount = 2,
  bookmarksCount = 0,
  activeTab,
  setActiveTab,
  onOpenSaleModal,
  onOpenReferralModal,
  onOpenAlertsModal,
  onOpenAuthenticUrlModal,
  onOpenTour,
  onOpenGithubModal,
  onOpenCurrencyModal,
  onOpenDossierModal,
  onOpenPlayStoreModal,
  onOpenDocketModal,
  onOpenAuthModal,
  onOpenTransferModal,
  onOpenContributeModal,
  onOpenAgencyPilotModal,
  onOpenFrontierReportModal,
  onOpenWalkthroughModal,
  onOpenDiligenceVaultModal,
  onOpenDriveModal,
}: HeaderProps) {
  const { tier, isOwner, isOwnerBypassActive, openPaywall, openBillingPortal, ownerBypassUnlock } = useSubscription();
  const { subscriptions, unreadCount } = useJobAlerts();
  const { currency, currencySymbol, isPppMode } = useCurrency();
  const { user } = useAuth();

  return (
    <header className="border-b border-[#1e2b36] pb-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo and Tactical Identification */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#111a22] to-[#1e2b36] border border-[#22d3a5]/40 text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.15)]">
            <Radar className="w-6 h-6 animate-spin" style={{ animationDuration: '14s' }} />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#22d3a5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#dce7f0] font-mono">
                TALENT_RADAR<span className="text-[#22d3a5]">.OS</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-mono tracking-wider font-semibold">
                V4.2-LIVE
              </span>
            </div>
            <p className="text-xs text-[#7a8b99] font-mono">
              3D Geospatial Radar • StealthNet ZK Network • Quantitative Career &amp; Equity Platform
            </p>
          </div>
        </div>

        {/* Tactical Status Badges & App For Sale Quick Action */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Contribute Verified Offer Benchmark Button */}
          {onOpenContributeModal && (
            <button
              onClick={onOpenContributeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.2)] cursor-pointer active:scale-95"
              title="Submit an executive compensation offer benchmark for verification audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>★ SUBMIT OFFER BENCHMARK</span>
            </button>
          )}

          {/* Agency Sovereign Checkout */}
          {onOpenAgencyPilotModal && (
            <button
              onClick={onOpenAgencyPilotModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8] text-[#38bdf8] font-bold transition shadow-[0_0_12px_rgba(56,189,248,0.2)] cursor-pointer active:scale-95"
              title="Register recruitment agency & authorize Sovereign clearance via Paystack"
            >
              <Crown className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>👑 AGENCY SOVEREIGN</span>
            </button>
          )}

          {/* 2026 Frontier AI Comp Report Hub */}
          {onOpenFrontierReportModal && (
            <button
              onClick={onOpenFrontierReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24] text-[#fbbf24] font-bold transition shadow-[0_0_12px_rgba(251,191,36,0.2)] cursor-pointer active:scale-95"
              title="View & download 2026 State of Frontier AI & High-Performance Compute Comp Report"
            >
              <FileText className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>📊 2026 COMP REPORT</span>
            </button>
          )}

          {/* Branded URL, Clean Routes & Live QR Code Trigger (Owner Only) */}
          {isOwner && onOpenAuthenticUrlModal && (
            <button
              onClick={onOpenAuthenticUrlModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.2)] cursor-pointer active:scale-95"
              title="Open Live App URL, Clean Vanity Routes (/radar, /pricing, /billing), Scannable QR Code & Custom Domain Setup"
            >
              <QrCode className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>🔗 APP URL &amp; QR</span>
            </button>
          )}

          {/* Interactive Guided Tour Trigger */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/60 text-[#38bdf8] font-bold transition shadow-[0_0_12px_rgba(56,189,248,0.2)] cursor-pointer active:scale-95"
              title="Start interactive guided walkthrough of 3D Radar, AI Supervisor, and Market Analytics"
            >
              <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>🧭 GUIDED TOUR</span>
            </button>
          )}

          {/* GitHub Repository & Codebase ZIP Exporter (Owner Only) */}
          {isOwner && onOpenGithubModal && (
            <button
              onClick={onOpenGithubModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#22d3a5]/20 to-[#a78bfa]/20 hover:from-[#22d3a5]/30 hover:to-[#a78bfa]/30 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.2)] cursor-pointer active:scale-95"
              title="Open GitHub Repository Setup, README.md, and Download Complete Codebase ZIP"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>📦 GITHUB &amp; ZIP</span>
            </button>
          )}

          {/* Global Currency & PPP Switcher Trigger */}
          {onOpenCurrencyModal && (
            <button
              onClick={onOpenCurrencyModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#22d3a5]/40 hover:border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.15)] cursor-pointer active:scale-95"
              title="Change platform display currency and configure Purchasing Power Parity (PPP) normalization"
            >
              <Globe className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>{currency} ({currencySymbol})</span>
              {isPppMode && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40">
                  PPP
                </span>
              )}
            </button>
          )}

          {/* Executive Compensation Dossier & Client Presentation PDF Exporter */}
          {onOpenDossierModal && (
            <button
              onClick={onOpenDossierModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] font-bold transition shadow-[0_0_12px_rgba(251,191,36,0.15)] cursor-pointer active:scale-95"
              title="Open Custom Branded Executive Compensation Dossier for Client Presentations and Export Vector PDF"
            >
              <FileText className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>📋 BRANDED CLIENT DOSSIER (PDF)</span>
            </button>
          )}

          {/* Google Play Store Publisher Button (Owner Only) */}
          {isOwner && onOpenPlayStoreModal && (
            <button
              onClick={onOpenPlayStoreModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#22d3a5]/20 via-[#38bdf8]/20 to-[#a78bfa]/20 hover:from-[#22d3a5]/30 hover:to-[#a78bfa]/30 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.25)] cursor-pointer active:scale-95"
              title="Publish to Android Google Play Store with TWA package, AssetLinks, and Play Console listing"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>📲 PLAY STORE</span>
            </button>
          )}

          {/* M&A Transaction Docket & Escrow Inspection Binder (Owner Only) */}
          {isOwner && onOpenDocketModal && (
            <button
              onClick={onOpenDocketModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24] text-[#fbbf24] font-bold transition shadow-[0_0_12px_rgba(251,191,36,0.2)] cursor-pointer active:scale-95"
              title="Generate Legal M&A Transaction Docket & 48-Hour Escrow Inspection Binder (PDF)"
            >
              <Scale className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>⚖️ M&amp;A DOCKET (PDF)</span>
            </button>
          )}

          {/* Domain & Asset Credentials Transfer Hub (Owner Only) */}
          {isOwner && onOpenTransferModal && (
            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa] text-[#a78bfa] font-bold transition shadow-[0_0_15px_rgba(167,139,250,0.2)] cursor-pointer active:scale-95"
              title="Open Domain & Asset Credentials Transfer Vault (EPP Auth Code, Git Deploy Token, Play Store Handover)"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>🔐 ASSET TRANSFER</span>
            </button>
          )}

          {/* User Authentication & Account Pill */}
          {onOpenAuthModal && (
            user ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#22d3a5]/50 text-[#dce7f0] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.15)] cursor-pointer active:scale-95"
                title="View Authenticated Operator Profile and Cloud Sync Status"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#22d3a5] to-[#38bdf8] flex items-center justify-center text-black font-bold text-[10px] overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs truncate max-w-[100px] text-[#22d3a5]">
                  {user.displayName || user.email?.split('@')[0] || 'Operator'}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40">
                  CLOUD SYNC
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.2)] cursor-pointer active:scale-95 animate-pulse"
                title="Sign in or register an account to sync saved career trajectories and preferences"
              >
                <LogIn className="w-3.5 h-3.5 text-[#22d3a5]" />
                <span>🔑 LOG IN / SIGN UP</span>
              </button>
            )
          )}

          {/* Offline Cache Status & PWA Install Actions */}
          <OfflineCacheStatusBadge category="all" />
          <PWAInstallButton variant="button" />

          {/* Prominent Clearance / Paywall Trigger */}
          {tier === 'recruit' ? (
            <button
              onClick={() => openPaywall('Security Clearance Upgrade')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f87171]/15 hover:bg-[#f87171]/25 border border-[#f87171]/50 text-[#f87171] font-bold transition shadow animate-pulse cursor-pointer"
              title="Click to elevate clearance and unlock paywall"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>CLEARANCE: RECRUIT (UPGRADE)</span>
            </button>
          ) : tier === 'pro' ? (
            <button
              onClick={() => openPaywall('Manage Pro Operator Clearance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/50 text-[#22d3a5] font-bold transition shadow cursor-pointer"
              title="Pro Operator Clearance Active"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
              <span>CLEARANCE: PRO OPERATOR</span>
            </button>
          ) : (
            <button
              onClick={() => openPaywall('Manage Sovereign Clearance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] font-bold transition shadow cursor-pointer"
              title="Sovereign Partner Clearance Active"
            >
              <Crown className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>CLEARANCE: SOVEREIGN{isOwnerBypassActive ? ' (OWNER)' : ''}</span>
            </button>
          )}

          {/* Real-time Firestore Subscription Status Sync Pill */}
          <SubscriptionStatusIndicator />

          {/* Paystack Billing Portal & Receipts Trigger */}
          <button
            onClick={openBillingPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#22d3a5]/40 hover:border-[#22d3a5] text-[#dce7f0] font-bold transition cursor-pointer"
            title="Open Paystack Billing Portal, Receipts, Email Restore, and Owner Console"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>{isOwner ? 'BILLING / OWNER' : 'BILLING / RECEIPTS'}</span>
          </button>

          {/* One-Click Verified Owner Bypass (Visible ONLY to authenticated Founder Google account) */}
          {isOwner && tier !== 'sovereign' && (
            <button
              onClick={() => ownerBypassUnlock()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-bold transition shadow cursor-pointer"
              title="Founder Owner Bypass: Unlock Sovereign Partner clearance free"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>OWNER UNLOCK</span>
            </button>
          )}

          {/* Google Drive Dossier Vault */}
          {onOpenDriveModal && (
            <button
              onClick={onOpenDriveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/70 text-[#38bdf8] font-bold transition shadow-[0_0_12px_rgba(56,189,248,0.2)] cursor-pointer active:scale-95"
              title="Open Google Drive Dossier Vault to browse, upload, edit, and export career reports"
            >
              <HardDrive className="w-4 h-4 text-[#38bdf8]" />
              <span>GOOGLE DRIVE</span>
            </button>
          )}

          {/* Refer & Earn 20% Viral Referral CTA */}
          {onOpenReferralModal && (
            <button
              onClick={onOpenReferralModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#fbbf24]/20 to-[#22d3a5]/20 border border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/30 font-bold transition shadow-[0_0_12px_rgba(251,191,36,0.2)] cursor-pointer active:scale-95"
              title="Refer friends for 20% off & earn 20% commission + Free Pro Months"
            >
              <Gift className="w-4 h-4 text-[#fbbf24]" />
              <span>REFER &amp; EARN 20%</span>
            </button>
          )}

          {/* Founder Walkthrough Video Studio (Owner Only) */}
          {isOwner && onOpenWalkthroughModal && (
            <button
              onClick={onOpenWalkthroughModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.25)] cursor-pointer active:scale-95"
              title="Open In-App Walkthrough Video Studio, Recorder & Exporter (.webm)"
            >
              <Video className="w-4 h-4 text-[#22d3a5]" />
              <span>📹 WALKTHROUGH VIDEO</span>
            </button>
          )}

          {/* M&A Diligence Data Room & Supporting Documents (Owner Only) */}
          {isOwner && onOpenDiligenceVaultModal && (
            <button
              onClick={onOpenDiligenceVaultModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#a78bfa]/20 via-[#38bdf8]/20 to-[#22d3a5]/20 hover:from-[#a78bfa]/30 hover:to-[#22d3a5]/30 border border-[#a78bfa] text-[#a78bfa] font-bold transition shadow-[0_0_15px_rgba(167,139,250,0.25)] cursor-pointer active:scale-95"
              title="Open Due Diligence Vault: Marketing Spend, Tax Filings (W-8BEN), Pitch Deck (PDF), and Operational Runbooks"
            >
              <Presentation className="w-4 h-4 text-[#a78bfa]" />
              <span>📁 BUYER DATA ROOM</span>
            </button>
          )}

          {/* Subscriber Growth Hub Trigger (Owner Only) */}
          {isOwner && (
            <button
              onClick={() => {
                if (setActiveTab) setActiveTab('growth');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-[#38bdf8] font-bold transition shadow cursor-pointer"
              title="Open Credible Subscriber Acquisition & Regional Outreach Hub"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>📣 SUBSCRIBER GROWTH HUB</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
            <Radio className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>RADAR:</span>
            <span className="text-[#22d3a5] font-bold">{activeJobsCount}</span>
          </div>

          <button
            onClick={() => {
              if (onOpenAlertsModal) {
                onOpenAlertsModal();
              } else if (setActiveTab) {
                setActiveTab('radar');
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#7a8b99] hover:text-[#dce7f0] transition cursor-pointer"
            title={`${subscriptions.length} search alert subscriptions active`}
          >
            <BellRing className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-[#22d3a5] animate-pulse' : 'text-[#7a8b99]'}`} />
            <span>ALERTS:</span>
            <span className={`font-bold ${unreadCount > 0 ? 'text-[#22d3a5]' : 'text-[#7a8b99]'}`}>
              {subscriptions.length}
            </span>
            {unreadCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
            <Bookmark className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>SAVED:</span>
            <span className="text-[#fbbf24] font-bold">{bookmarksCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
            <Cpu className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>AI TRIAD:</span>
            <span className="text-[#22d3a5] font-bold">4-AGENT</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>STEALTH:</span>
            <span className="text-[#dce7f0]">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Real-time Platform & Paystack Pricing Ticker */}
      <div className="mt-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono text-[#7a8b99] overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-2 text-[#22d3a5] font-semibold shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PLATFORM STATUS:</span>
        </div>
        <div className="flex items-center gap-6 pl-4 text-[11px]">
          <span>Telemetry: <strong className="text-[#22d3a5]">Live SaaS Production</strong></span>
          <span className="text-[#1e2b36]">|</span>
          <span>Pro Operator: <strong className="text-[#dce7f0]">$49 / mo</strong> ($32/mo Annual)</span>
          <span className="text-[#1e2b36]">|</span>
          <span>Sovereign Partner: <strong className="text-[#3b82f6]">$199 / mo</strong> ($149/mo Annual)</span>
          <span className="text-[#1e2b36]">|</span>
          <button
            type="button"
            onClick={() => onOpenReferralModal && onOpenReferralModal()}
            className="text-[#fbbf24] hover:text-white font-bold cursor-pointer inline-flex items-center gap-1 transition"
            title="Open Referral Program & 20% Launch Discount"
          >
            <Gift className="w-3 h-3 text-[#fbbf24]" />
            <span>Referrals: <strong className="text-[#22d3a5]">Give 20% Off • Earn 20% + Free Pro</strong></span>
          </button>
          <span className="text-[#1e2b36]">|</span>
          <span>Payments: <strong className="text-[#22d3a5]">Paystack Live (Card • M-Pesa • Bank)</strong></span>
        </div>
      </div>
    </header>
  );
}
