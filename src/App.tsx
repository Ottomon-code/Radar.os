import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Compass,
  Newspaper,
  Bot,
  Radio,
  Bookmark,
  Users,
  BadgeDollarSign,
  TrendingUp,
  Megaphone,
  Video,
} from 'lucide-react';
import Header from './components/Header';
import RadarTab from './components/RadarTab';
import CareerTab from './components/CareerTab';
import NewsTab from './components/NewsTab';
import AISupervisorTab from './components/AISupervisorTab';
import ExternalCommsTab from './components/ExternalCommsTab';
import FinancialPlatformTab from './components/FinancialPlatformTab';
import MarketAnalyticsTab from './components/MarketAnalyticsTab';
import GrowthAdHubTab from './components/GrowthAdHubTab';
import BookmarksTab from './components/BookmarksTab';
import StealthNetTab from './components/StealthNetTab';
import WalkthroughStudioTab from './components/WalkthroughStudioTab';
import PaywallModal from './components/PaywallModal';
import PaystackBillingPortalModal from './components/PaystackBillingPortalModal';
import ReferralModal from './components/ReferralModal';
import AuthenticUrlModal from './components/AuthenticUrlModal';
import GuidedTour from './components/GuidedTour';
import GithubRepoModal from './components/GithubRepoModal';
import CurrencyPppModal from './components/CurrencyPppModal';
import ExecutiveCompDossierModal from './components/ExecutiveCompDossierModal';
import GooglePlayPublishModal from './components/GooglePlayPublishModal';
import TransactionDocketModal from './components/TransactionDocketModal';
import AuthModal from './components/AuthModal';
import DomainAssetTransferModal from './components/DomainAssetTransferModal';
import ContributeOfferModal from './components/ContributeOfferModal';
import AgencyPilotModal from './components/AgencyPilotModal';
import FrontierCompReportModal from './components/FrontierCompReportModal';
import Footer from './components/Footer';
import LegalComplianceModal, { LegalTabType } from './components/LegalComplianceModal';
import ContactInquiryModal from './components/ContactInquiryModal';
import WalkthroughVideoStudioModal from './components/WalkthroughVideoStudioModal';
import BuyerDiligenceVaultModal from './components/BuyerDiligenceVaultModal';
import GoogleDriveModal from './components/GoogleDriveModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FloatingInstallButton } from './components/FloatingInstallButton';
import { SavedItemsProvider, useSavedItems } from './context/SavedItemsContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { useAuth } from './context/AuthContext';
import { JobAlertsProvider } from './context/JobAlertsContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { JobAlert } from './utils/radarEngine';
import {
  AppTabId,
  resolveRouteFromLocation,
  pushCleanUrl,
  syncSeoCanonicalMeta,
  isOwnerOnlyTab,
  isOwnerOnlyLocation,
  TAB_TO_PATH,
  TAB_TITLES,
} from './utils/urlRouting';
import { saveStoredDomainConfig } from './utils/serverConfig';
import './index.css';

function MainRadarApp() {
  const initialRoute =
    typeof window !== 'undefined'
      ? resolveRouteFromLocation(window.location)
      : { path: '/', title: 'TalentRadar.OS', tab: 'analytics' as AppTabId };

  const [activeTab, setActiveTabState] = useState<string>(initialRoute.tab || 'analytics');
  const [showAuthenticUrlModal, setShowAuthenticUrlModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierPresetId, setDossierPresetId] = useState<string>('omnitalent');
  const [dossierRoleKey, setDossierRoleKey] = useState<string>('ai_infra');
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false);
  const [showDocketModal, setShowDocketModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showAgencyPilotModal, setShowAgencyPilotModal] = useState(false);
  const [showFrontierReportModal, setShowFrontierReportModal] = useState(false);
  const [showWalkthroughModal, setShowWalkthroughModal] = useState(false);
  const [showDiligenceVaultModal, setShowDiligenceVaultModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTabType>('privacy');
  const [showContactModal, setShowContactModal] = useState(false);
  const [docketPresetId, setDocketPresetId] = useState<'aetheris' | 'vanguard' | 'omnitalent' | 'custom'>('aetheris');
  const [docketAmount, setDocketAmount] = useState<number | undefined>(145000);
  const [docketBuyerOrg, setDocketBuyerOrg] = useState<string | undefined>('Institutional Growth Equity (Fund III)');
  const [docketBuyerName, setDocketBuyerName] = useState<string | undefined>('Managing Partner (Authorized Signatory)');
  const { totalSavedCount } = useSavedItems();
  const { isPro, isOwner, openPaywall, openBillingPortal, openReferralModal, applyReferralCode } = useSubscription();
  const { loading: authLoading } = useAuth();
  const isOwnerRef = useRef(isOwner);
  isOwnerRef.current = isOwner;

  const silentlyRedirectToAnalytics = () => {
    setActiveTabState('analytics');
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState({ path: TAB_TO_PATH.analytics }, '', TAB_TO_PATH.analytics);
        document.title = TAB_TITLES.analytics;
        syncSeoCanonicalMeta(TAB_TO_PATH.analytics);
      } catch {
        // Ignore history restrictions
      }
    }
  };

  const setActiveTab = (nextTab: string, syncUrl = true) => {
    const validTabs: AppTabId[] = [
      'analytics',
      'finance',
      'growth',
      'radar',
      'stealthnet',
      'career',
      'news',
      'ai',
      'bookmarks',
      'comms',
      'studio',
    ];
    let resolved = validTabs.includes(nextTab as AppTabId) ? (nextTab as AppTabId) : 'analytics';
    if (!isOwner && isOwnerOnlyTab(resolved)) {
      resolved = 'analytics';
    }
    setActiveTabState(resolved);
    if (syncUrl) {
      pushCleanUrl(TAB_TO_PATH[resolved], TAB_TITLES[resolved]);
    }
  };

  // Sync clean URL routes on initial load & browser back/forward navigation
  useEffect(() => {
    const applyRouteFromCurrentUrl = () => {
      try {
        const route = resolveRouteFromLocation(window.location);
        const blockedForNonOwner =
          !authLoading &&
          !isOwnerRef.current &&
          (isOwnerOnlyTab(route.tab) || isOwnerOnlyLocation(window.location));

        if (blockedForNonOwner) {
          silentlyRedirectToAnalytics();
        } else if (route.tab) {
          setActiveTabState(route.tab);
        }
        if (route.referralCode) {
          const refCode = route.referralCode;
          fetch('/api/referrals/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: refCode }),
          }).catch(() => {});
          applyReferralCode(refCode);
        }
        if (route.legalTab) {
          setLegalTab(route.legalTab);
          setShowLegalModal(true);
        } else if (route.modal === 'contact') {
          setShowContactModal(true);
        } else if (route.modal === 'pricing') {
          openPaywall(
            route.referralCode
              ? `20% Referral Launch Discount Activated (${route.referralCode})`
              : 'Direct Pricing & Clearance Access'
          );
          if (window.location.pathname.toLowerCase().startsWith('/r/')) {
            pushCleanUrl('/pricing', '20% Referral Launch Invite | TalentRadar.OS');
          }
        } else if (route.modal === 'billing') {
          openBillingPortal();
        } else if (route.modal === 'referrals') {
          openReferralModal();
        } else if (route.modal === 'drive') {
          setShowDriveModal(true);
        }
        if (route.title && !blockedForNonOwner) {
          document.title = route.title;
        }
        syncSeoCanonicalMeta(window.location.pathname || '/');
      } catch (_) {}
    };

    applyRouteFromCurrentUrl();
    fetch('/api/domain/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.primaryDomain) return;
        saveStoredDomainConfig({
          primaryDomain: data.primaryDomain,
          preferredEntryHost: data.preferredEntryHost === 'app' ? 'app' : 'root',
          sha256Fingerprints: Array.isArray(data.sha256Fingerprints) ? data.sha256Fingerprints : undefined,
          customDomainVerified: Boolean(data.customDomainVerified),
        });
        syncSeoCanonicalMeta(window.location.pathname || '/');
      })
      .catch(() => {});
    window.addEventListener('popstate', applyRouteFromCurrentUrl);

    const handleOpenBrandedDossier = (e: Event) => {
      const customEvent = e as CustomEvent<{ presetId?: string; roleKey?: string }>;
      if (customEvent.detail?.presetId) setDossierPresetId(customEvent.detail.presetId);
      if (customEvent.detail?.roleKey) setDossierRoleKey(customEvent.detail.roleKey);
      setShowDossierModal(true);
    };
    const handleOpenPlayStore = () => {
      if (!isOwnerRef.current) return;
      setShowPlayStoreModal(true);
    };
    const handleOpenAuth = () => setShowAuthModal(true);
    const handleOpenTransfer = () => {
      if (!isOwnerRef.current) return;
      setShowTransferModal(true);
    };
    const handleOpenContribute = () => setShowContributeModal(true);
    const handleOpenAgencyPilot = () => setShowAgencyPilotModal(true);
    const handleOpenFrontierReport = () => setShowFrontierReportModal(true);
    const handleOpenWalkthrough = () => {
      if (!isOwnerRef.current) return;
      setShowWalkthroughModal(true);
    };
    const handleOpenDiligenceVault = () => {
      if (!isOwnerRef.current) return;
      setShowDiligenceVaultModal(true);
    };
    const handleOpenLegal = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: LegalTabType }>;
      if (customEvent.detail?.tab) setLegalTab(customEvent.detail.tab);
      setShowLegalModal(true);
    };
    const handleOpenContact = () => setShowContactModal(true);
    const handleOpenDocket = (e: Event) => {
      if (!isOwnerRef.current) return;
      const customEvent = e as CustomEvent<{
        presetId?: 'aetheris' | 'vanguard' | 'omnitalent' | 'custom';
        amount?: number;
        buyerOrg?: string;
        buyerName?: string;
      }>;
      if (customEvent.detail?.presetId) setDocketPresetId(customEvent.detail.presetId);
      if (customEvent.detail?.amount) setDocketAmount(customEvent.detail.amount);
      if (customEvent.detail?.buyerOrg) setDocketBuyerOrg(customEvent.detail.buyerOrg);
      if (customEvent.detail?.buyerName) setDocketBuyerName(customEvent.detail.buyerName);
      setShowDocketModal(true);
    };

    const handleOpenReferralModal = () => openReferralModal();
    const handleOpenDriveModal = () => setShowDriveModal(true);

    window.addEventListener('open-branded-dossier', handleOpenBrandedDossier);
    window.addEventListener('open-playstore-modal', handleOpenPlayStore);
    window.addEventListener('open-transaction-docket', handleOpenDocket);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    window.addEventListener('open-transfer-modal', handleOpenTransfer);
    window.addEventListener('open-contribute-modal', handleOpenContribute);
    window.addEventListener('open-agency-pilot-modal', handleOpenAgencyPilot);
    window.addEventListener('open-frontier-report-modal', handleOpenFrontierReport);
    window.addEventListener('open-walkthrough-video', handleOpenWalkthrough);
    window.addEventListener('open-diligence-vault', handleOpenDiligenceVault);
    window.addEventListener('open-legal-modal', handleOpenLegal);
    window.addEventListener('open-contact-modal', handleOpenContact);
    window.addEventListener('open-referral-modal', handleOpenReferralModal);
    window.addEventListener('open-drive-modal', handleOpenDriveModal);

    return () => {
      window.removeEventListener('open-branded-dossier', handleOpenBrandedDossier);
      window.removeEventListener('open-playstore-modal', handleOpenPlayStore);
      window.removeEventListener('open-transaction-docket', handleOpenDocket);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('open-transfer-modal', handleOpenTransfer);
      window.removeEventListener('open-contribute-modal', handleOpenContribute);
      window.removeEventListener('open-agency-pilot-modal', handleOpenAgencyPilot);
      window.removeEventListener('open-frontier-report-modal', handleOpenFrontierReport);
      window.removeEventListener('open-walkthrough-video', handleOpenWalkthrough);
      window.removeEventListener('open-diligence-vault', handleOpenDiligenceVault);
      window.removeEventListener('open-legal-modal', handleOpenLegal);
      window.removeEventListener('open-contact-modal', handleOpenContact);
      window.removeEventListener('open-referral-modal', handleOpenReferralModal);
      window.removeEventListener('open-drive-modal', handleOpenDriveModal);
      window.removeEventListener('popstate', applyRouteFromCurrentUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent redirect whenever auth settles or owner status changes on an owner-only route/tab
  useEffect(() => {
    if (authLoading || isOwner) return;
    if (isOwnerOnlyTab(activeTab) || (typeof window !== 'undefined' && isOwnerOnlyLocation(window.location))) {
      silentlyRedirectToAnalytics();
    }
    setShowAuthenticUrlModal(false);
    setShowGithubModal(false);
    setShowPlayStoreModal(false);
    setShowDocketModal(false);
    setShowTransferModal(false);
    setShowWalkthroughModal(false);
    setShowDiligenceVaultModal(false);
  }, [authLoading, isOwner, activeTab]);

  // Prompt guided tour on first visit or if query param ?tour=true is present
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('talent_radar_tour_completed');
      const params = new URLSearchParams(window.location.search);
      if (params.get('tour') === 'true' || !hasCompleted) {
        const timer = setTimeout(() => setShowTour(true), 900);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  // Cross-tab search state
  const [searchParams, setSearchParams] = useState<{
    keywords?: string;
    location?: string;
    minSalary?: number;
    maxSalary?: number;
  }>({
    keywords: '',
    location: 'All',
    minSalary: 0,
    maxSalary: 500000,
  });

  // Cross-tab career path state
  const [careerTarget, setCareerTarget] = useState<{
    targetRole?: string;
    targetSalary?: number;
    activeJob?: JobAlert | null;
  }>({
    targetRole: 'Principal AI Infrastructure Architect',
    targetSalary: 310000,
    activeJob: null,
  });

  // Cross-tab news feed state
  const [newsTarget, setNewsTarget] = useState<{
    company?: string;
    sector?: string;
    keywords?: string;
  }>({
    company: 'Anthropic & OpenAI Ecosystem',
    sector: 'Frontier AI & High-Performance Compute',
    keywords: '',
  });

  // Navigate to Career Path from Job Search or Analytics
  const handleNavigateToCareer = (targetRole: string, targetSalary?: number, job?: JobAlert) => {
    setCareerTarget({
      targetRole,
      targetSalary: targetSalary || (job ? job.numericMaxSalary : 280000),
      activeJob: job || null,
    });
    setActiveTab('career');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to News Feed from Job Search
  const handleNavigateToNews = (company: string, sector: string, keywords?: string) => {
    setNewsTarget({
      company,
      sector,
      keywords: keywords || '',
    });
    setActiveTab('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to Job Search from Career Path, Analytics, or News
  const handleSearchJobs = (keywords: string, minSalary?: number, location?: string) => {
    setSearchParams({
      keywords,
      location: location || 'All',
      minSalary: minSalary || 0,
      maxSalary: 500000,
    });
    setActiveTab('radar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    {
      id: 'analytics',
      label: 'Market Analytics',
      icon: <TrendingUp size={18} className="text-[#22d3a5]" />,
      badge: 'RECHARTS SALARY TRENDS',
    },
    {
      id: 'finance',
      label: 'Comp & Equity Platform',
      icon: <BadgeDollarSign size={18} className="text-[#fbbf24]" />,
      badge: 'COMP & TAX MODELER',
    },
    ...(isOwner
      ? [
          {
            id: 'growth',
            label: 'Subscriber Growth Hub',
            icon: <Megaphone size={18} className="text-[#38bdf8]" />,
            badge: 'OWNER GROWTH HUB',
          },
        ]
      : []),
    { id: 'radar', label: 'Job Search & Radar', icon: <Activity size={18} /> },
    { id: 'stealthnet', label: 'StealthNet (Anon LinkedIn)', icon: <Users size={18} /> },
    { id: 'career', label: 'Career Path', icon: <Compass size={18} /> },
    { id: 'news', label: 'News Feed', icon: <Newspaper size={18} /> },
    { id: 'ai', label: 'AI Commander & Triad (4 AIs)', icon: <Bot size={18} /> },
    {
      id: 'bookmarks',
      label: totalSavedCount > 0 ? `Bookmarks (${totalSavedCount})` : 'Bookmarks',
      icon: <Bookmark size={18} />,
    },
    ...(isOwner
      ? [
          { id: 'comms', label: 'External Comms', icon: <Radio size={18} /> },
          {
            id: 'studio',
            label: 'Walkthrough Studio',
            icon: <Video size={18} className="text-[#38bdf8]" />,
            badge: 'EXPLAINER MODEL',
          },
        ]
      : []),
  ];

  return (
    <div className="app-container">
      <PaywallModal />
      <PaystackBillingPortalModal />
      <ReferralModal />
      {isOwner && (
        <>
          <AuthenticUrlModal
            isOpen={showAuthenticUrlModal}
            onClose={() => setShowAuthenticUrlModal(false)}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <GithubRepoModal
            isOpen={showGithubModal}
            onClose={() => setShowGithubModal(false)}
          />
          <GooglePlayPublishModal
            isOpen={showPlayStoreModal}
            onClose={() => setShowPlayStoreModal(false)}
          />
          <TransactionDocketModal
            isOpen={showDocketModal}
            onClose={() => setShowDocketModal(false)}
            initialPresetId={docketPresetId}
            initialAmount={docketAmount}
            initialBuyerOrg={docketBuyerOrg}
            initialBuyerName={docketBuyerName}
          />
          <DomainAssetTransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            buyerOrg={docketBuyerOrg}
            buyerName={docketBuyerName}
            transactionId="ESC-2026-8812-VAL"
          />
          <WalkthroughVideoStudioModal
            isOpen={showWalkthroughModal}
            onClose={() => setShowWalkthroughModal(false)}
          />
          <BuyerDiligenceVaultModal
            isOpen={showDiligenceVaultModal}
            onClose={() => setShowDiligenceVaultModal(false)}
          />
        </>
      )}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <CurrencyPppModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
      <ExecutiveCompDossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        initialRoleKey={dossierRoleKey}
        initialPresetId={dossierPresetId}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <ContributeOfferModal
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
      />
      <AgencyPilotModal
        isOpen={showAgencyPilotModal}
        onClose={() => setShowAgencyPilotModal(false)}
      />
      <FrontierCompReportModal
        isOpen={showFrontierReportModal}
        onClose={() => setShowFrontierReportModal(false)}
      />
      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />
      <LegalComplianceModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalTab}
      />
      <ContactInquiryModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
      <Header
        bookmarksCount={totalSavedCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSaleModal={() => setActiveTab('finance')}
        onOpenReferralModal={() => openReferralModal()}
        onOpenAuthenticUrlModal={isOwner ? () => setShowAuthenticUrlModal(true) : undefined}
        onOpenTour={() => setShowTour(true)}
        onOpenGithubModal={isOwner ? () => setShowGithubModal(true) : undefined}
        onOpenCurrencyModal={() => setShowCurrencyModal(true)}
        onOpenDossierModal={() => setShowDossierModal(true)}
        onOpenPlayStoreModal={isOwner ? () => setShowPlayStoreModal(true) : undefined}
        onOpenDocketModal={isOwner ? () => setShowDocketModal(true) : undefined}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenTransferModal={isOwner ? () => setShowTransferModal(true) : undefined}
        onOpenContributeModal={() => setShowContributeModal(true)}
        onOpenAgencyPilotModal={() => setShowAgencyPilotModal(true)}
        onOpenFrontierReportModal={() => setShowFrontierReportModal(true)}
        onOpenWalkthroughModal={isOwner ? () => setShowWalkthroughModal(true) : undefined}
        onOpenDiligenceVaultModal={isOwner ? () => setShowDiligenceVaultModal(true) : undefined}
        onOpenDriveModal={() => setShowDriveModal(true)}
      />

      <nav className="tabs" role="tablist" aria-label="Radar Navigation Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''} ${
              tab.id === 'analytics'
                ? 'border-b-2 border-[#22d3a5] text-[#22d3a5]'
                : tab.id === 'finance'
                ? 'border-b-2 border-[#fbbf24] text-[#fbbf24]'
                : tab.id === 'growth'
                ? 'border-b-2 border-[#38bdf8] text-[#38bdf8]'
                : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-mono border border-[#22d3a5]/40 font-bold hidden sm:inline-block">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="grid">
        {activeTab === 'analytics' && (
          <MarketAnalyticsTab
            initialCareerInterest={careerTarget.targetRole}
            onNavigateToCareerPath={(role, sal) => handleNavigateToCareer(role, sal)}
            onNavigateToJobRadar={(kw) => handleSearchJobs(kw, undefined, 'All')}
            onOpenDossierModal={() => setShowDossierModal(true)}
            onOpenCurrencyModal={() => setShowCurrencyModal(true)}
            onSendToEnvoy={() => {
              setActiveTab('ai');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {activeTab === 'finance' && (
          <FinancialPlatformTab
            onSendToEnvoy={() => {
              setActiveTab('ai');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSendToStrategist={(comp) => {
              handleNavigateToCareer('Principal AI Systems Architect', comp);
            }}
          />
        )}
        {isOwner && activeTab === 'growth' && (
          <GrowthAdHubTab onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'radar' && (
          <RadarTab
            initialSearch={searchParams}
            onNavigateToCareer={handleNavigateToCareer}
            onNavigateToNews={handleNavigateToNews}
            onNavigateToFinance={() => {
              setActiveTab('finance');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {activeTab === 'stealthnet' && (
          <StealthNetTab
            onNavigateToCareer={handleNavigateToCareer}
            onNavigateToJobs={(kw) => handleSearchJobs(kw || '', undefined, 'All')}
            onNavigateToFinance={() => {
              setActiveTab('finance');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {activeTab === 'career' && (
          <CareerTab
            initialTargetRole={careerTarget.targetRole}
            initialSalary={careerTarget.targetSalary}
            activeJob={careerTarget.activeJob}
            onSearchJobsForRole={(role, minSal) => handleSearchJobs(role, minSal)}
            onNavigateToNews={handleNavigateToNews}
          />
        )}
        {activeTab === 'news' && (
          <NewsTab
            initialCompany={newsTarget.company}
            initialSector={newsTarget.sector}
            initialKeywords={newsTarget.keywords}
            onSearchJobsForCompany={(co) => handleSearchJobs(co.split('/')[0].trim(), undefined, 'All')}
            onNavigateToCareer={handleNavigateToCareer}
          />
        )}
        {activeTab === 'ai' && (
          <AISupervisorTab
            onNavigateToCareer={handleNavigateToCareer}
            onNavigateToNews={handleNavigateToNews}
            onNavigateToComms={
              isOwner
                ? () => {
                    setActiveTab('comms');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                : undefined
            }
          />
        )}
        {activeTab === 'bookmarks' && (
          <BookmarksTab
            onNavigateToJobRadar={(kw) => handleSearchJobs(kw || '', undefined, 'All')}
            onNavigateToCareer={handleNavigateToCareer}
            onNavigateToNews={handleNavigateToNews}
            onNavigateToFinance={() => {
              setActiveTab('finance');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {isOwner && activeTab === 'comms' && <ExternalCommsTab />}
        {isOwner && activeTab === 'studio' && <WalkthroughStudioTab />}
      </main>

      {/* Global Application Footer & Enterprise Compliance Governance */}
      <Footer
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLegal={(tab = 'privacy') => {
          setLegalTab(tab);
          setShowLegalModal(true);
        }}
        onOpenContact={() => setShowContactModal(true)}
        onOpenAgencyPilot={() => setShowAgencyPilotModal(true)}
        onOpenUrlModal={() => setShowAuthenticUrlModal(true)}
        onOpenReferrals={() => openReferralModal()}
        onOpenDrive={() => setShowDriveModal(true)}
      />

      {/* Global Offline Service Worker & Data Cache Indicator */}
      <OfflineIndicator />

      {/* Floating PWA Install App Trigger */}
      <FloatingInstallButton />
    </div>
  );
}

export default function App() {
  return (
    <SubscriptionProvider>
      <CurrencyProvider>
        <SavedItemsProvider>
          <JobAlertsProvider>
            <MainRadarApp />
          </JobAlertsProvider>
        </SavedItemsProvider>
      </CurrencyProvider>
    </SubscriptionProvider>
  );
}
