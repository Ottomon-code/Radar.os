import React, { useState, useEffect, useRef } from 'react';
import {
  Radar,
  ShieldCheck,
  Radio,
  Bookmark,
  Lock,
  Crown,
  BellRing,
  Megaphone,
  Globe,
  Compass,
  FolderGit2,
  FileText,
  Scale,
  Smartphone,
  LogIn,
  KeyRound,
  QrCode,
  Video,
  Presentation,
  CreditCard,
  Unlock,
  Gift,
  HardDrive,
  ChevronDown,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { SubscriptionStatusIndicator } from '../hooks/useSubscriptionStatus';
import { useJobAlerts } from '../context/JobAlertsContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

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
  bookmarksCount = 0,
  setActiveTab,
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
  const { tier, isOwner, isOwnerBypassActive, openPaywall, openBillingPortal, ownerBypassUnlock } =
    useSubscription();
  const { subscriptions, unreadCount } = useJobAlerts();
  const { currency, currencySymbol, isPppMode } = useCurrency();
  const { user } = useAuth();

  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const ownerMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(target)) {
        setOwnerMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        setToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOwnerMenuOpen(false);
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const runOwnerAction = (fn?: () => void) => {
    setOwnerMenuOpen(false);
    fn?.();
  };

  const runToolAction = (fn?: () => void) => {
    setToolsMenuOpen(false);
    fn?.();
  };

  return (
    <header className="border-b border-[#1e2b36] pb-3.5 mb-3">
      {/* Row 1: Brand + Primary Account / Billing / Compact Owner Menu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#111a22] to-[#1e2b36] border border-[#22d3a5]/40 text-[#22d3a5] shrink-0">
              <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '14s' }} />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#22d3a5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#dce7f0] font-mono truncate">
                  TALENT_RADAR<span className="text-[#22d3a5]">.OS</span>
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-mono font-semibold shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[#7a8b99] font-mono truncate">
                Live Career Radar • Salary Modeling • AI Strategy
              </p>
            </div>
          </div>

          {/* Mobile quick Sign-in or Owner Badge */}
          <div className="sm:hidden shrink-0">
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                  user
                    ? 'bg-[#111a22] border-[#22d3a5]/50 text-[#22d3a5]'
                    : 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5]'
                }`}
              >
                {user ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-[#22d3a5] text-black flex items-center justify-center text-[10px] font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                    <span className="max-w-[72px] truncate">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>LOG IN</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Auth (Desktop), Clearance, Billing, Owner Menu */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer ${
                user
                  ? 'bg-[#111a22] hover:bg-[#162738] border-[#22d3a5]/50 text-[#dce7f0]'
                  : 'bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border-[#22d3a5] text-[#22d3a5]'
              }`}
              title={user ? 'View profile and cloud sync' : 'Sign in or create an account'}
            >
              {user ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#22d3a5] to-[#38bdf8] flex items-center justify-center text-black font-bold text-[10px] overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="truncate max-w-[100px] text-[#22d3a5]">
                    {user.displayName || user.email?.split('@')[0] || 'Account'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#22d3a5]" />
                  <span>LOG IN / SIGN UP</span>
                </>
              )}
            </button>
          )}

          {/* Clearance / Upgrade CTA */}
          {tier === 'recruit' ? (
            <button
              type="button"
              onClick={() => openPaywall('Security Clearance Upgrade')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f87171]/15 hover:bg-[#f87171]/25 border border-[#f87171]/50 text-[#f87171] font-bold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>UPGRADE PRO</span>
            </button>
          ) : tier === 'pro' ? (
            <button
              type="button"
              onClick={() => openPaywall('Manage Pro Operator Clearance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/50 text-[#22d3a5] font-bold transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRO ACTIVE</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openPaywall('Manage Sovereign Clearance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] font-bold transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>SOVEREIGN{isOwnerBypassActive ? ' (OWNER)' : ''}</span>
            </button>
          )}

          {/* Billing / Receipts */}
          <button
            type="button"
            onClick={openBillingPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#22d3a5]/40 text-[#dce7f0] font-bold transition cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>BILLING</span>
          </button>

          {/* Compact Owner Menu (Tucks all Owner/Admin/M&A Tools into One Dropdown) */}
          {isOwner && (
            <div className="relative" ref={ownerMenuRef}>
              <button
                type="button"
                onClick={() => setOwnerMenuOpen((prev) => !prev)}
                aria-expanded={ownerMenuOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-bold transition shadow cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>OWNER</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${ownerMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {ownerMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-[#0f171e] border border-[#fbbf24]/50 rounded-xl shadow-2xl z-50 p-2 space-y-1 text-xs font-mono">
                  <div className="px-2.5 py-1.5 border-b border-[#1e2b36] flex items-center justify-between text-[10px] text-[#fbbf24]">
                    <span className="font-bold uppercase tracking-wider">Owner Control Menu</span>
                    <span className="text-[#22d3a5]">{tier.toUpperCase()}</span>
                  </div>

                  {tier !== 'sovereign' && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(() => ownerBypassUnlock())}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] font-bold text-left cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5 shrink-0" />
                      <span>Unlock Sovereign Free (Bypass)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => runOwnerAction(openBillingPortal)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                    <span>Paystack Setup &amp; Webhook</span>
                  </button>

                  {setActiveTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => runOwnerAction(() => setActiveTab('growth'))}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        <span>Subscriber Growth Hub</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => runOwnerAction(() => setActiveTab('comms'))}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                        <span>External Comms &amp; Deal Room</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => runOwnerAction(() => setActiveTab('studio'))}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        <span>Walkthrough Studio</span>
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-[#1e2b36]" />

                  {onOpenAuthenticUrlModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenAuthenticUrlModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>App URL, Routes &amp; QR Code</span>
                    </button>
                  )}

                  {onOpenGithubModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenGithubModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <FolderGit2 className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                      <span>GitHub &amp; Codebase ZIP</span>
                    </button>
                  )}

                  {onOpenPlayStoreModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenPlayStoreModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>Google Play Store Package</span>
                    </button>
                  )}

                  {onOpenWalkthroughModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenWalkthroughModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>Walkthrough Video Recorder</span>
                    </button>
                  )}

                  {onOpenDocketModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenDocketModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <span>M&amp;A Docket (PDF)</span>
                    </button>
                  )}

                  {onOpenTransferModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenTransferModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                      <span>Asset Transfer Vault</span>
                    </button>
                  )}

                  {onOpenDiligenceVaultModal && (
                    <button
                      type="button"
                      onClick={() => runOwnerAction(onOpenDiligenceVaultModal)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                    >
                      <Presentation className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                      <span>Buyer Data Room</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Compact Subscriber Utility Bar (Single Clean Row on Mobile & Desktop) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenCurrencyModal && (
            <button
              type="button"
              onClick={onOpenCurrencyModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] font-bold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {currency} ({currencySymbol})
              </span>
              {isPppMode && <span className="text-[9px] text-[#38bdf8]">PPP</span>}
            </button>
          )}

          {onOpenReferralModal && (
            <button
              type="button"
              onClick={onOpenReferralModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fbbf24]/15 border border-[#fbbf24]/50 text-[#fbbf24] font-bold cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>REFER 20%</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onOpenAlertsModal) {
                onOpenAlertsModal();
              } else if (setActiveTab) {
                setActiveTab('radar');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#dce7f0] cursor-pointer"
          >
            <BellRing
              className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-[#22d3a5] animate-pulse' : 'text-[#7a8b99]'}`}
            />
            <span>ALERTS: {subscriptions.length}</span>
            {unreadCount > 0 && (
              <span className="px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab?.('bookmarks')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#fbbf24] text-[#fbbf24] cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>SAVED: {bookmarksCount}</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
            <Radio className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>RADAR:</span>
            <span className="text-[#22d3a5] font-bold">{activeJobsCount}</span>
          </div>

          <div className="hidden lg:flex items-center">
            <SubscriptionStatusIndicator />
          </div>
        </div>

        {/* Subscriber Extra Tools Dropdown (Removes 6 Extra Header Buttons on Mobile) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setToolsMenuOpen((prev) => !prev)}
            aria-expanded={toolsMenuOpen}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111a22] hover:bg-[#162738] border border-[#1e2b36] hover:border-[#38bdf8] text-[#dce7f0] font-bold cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>TOOLS &amp; REPORTS</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {toolsMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-[#0f171e] border border-[#1e2b36] rounded-xl shadow-2xl z-50 p-2 space-y-1 text-xs font-mono">
              {onOpenDossierModal && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenDossierModal)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#fbbf24] text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Client Comp Dossier (PDF)</span>
                </button>
              )}
              {onOpenFrontierReportModal && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenFrontierReportModal)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                  <span>2026 Frontier Comp Report</span>
                </button>
              )}
              {onOpenContributeModal && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenContributeModal)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#22d3a5] text-left cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Submit Offer Benchmark</span>
                </button>
              )}
              {onOpenAgencyPilotModal && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenAgencyPilotModal)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#38bdf8] text-left cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>Agency Sovereign Checkout</span>
                </button>
              )}
              {onOpenDriveModal && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenDriveModal)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#38bdf8] text-left cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 shrink-0" />
                  <span>Google Drive Vault</span>
                </button>
              )}
              {onOpenTour && (
                <button
                  type="button"
                  onClick={() => runToolAction(onOpenTour)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#162738] text-[#dce7f0] text-left cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span>Guided Tour</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
