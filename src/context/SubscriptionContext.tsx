import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, isFirestorePermissionError, OperationType } from '../firebase';
import {
  type PaystackTierId,
  type PppLocationProfile,
  type PppCountryRule,
  type ComputedTierPricing,
  FEATURED_PPP_COUNTRIES,
  getPppProfileForCountry,
  detectBrowserPppLocation,
  computeTierPricing,
  normalizeCountryCode,
} from '../utils/pppPricing';

export type SubscriptionTier = 'recruit' | 'pro' | 'sovereign';

export type { PaystackTierId, PppLocationProfile, PppCountryRule, ComputedTierPricing };

export const FOUNDER_OWNER_EMAIL = 'mortyp1125@gmail.com';

export interface VerifiedPaymentInfo {
  isVerified: boolean;
  sessionId?: string;
  reference?: string;
  provider?: string;
  customerEmail?: string;
  customerCode?: string;
  amount?: number;
  currency?: string;
  status?: string;
  subscriptionCode?: string;
  planCode?: string;
  nextPaymentDate?: string;
  cancelAtPeriodEnd?: boolean;
  expiringCardNotice?: string;
  lastWebhookEvent?: string;
}

export interface BackendVerificationResult {
  verified: boolean;
  resolvedTier?: SubscriptionTier;
  tierId?: string;
  reference?: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
  error?: string;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  resolvedTier?: SubscriptionTier;
}

export interface PaymentSuccessFlowState {
  active: boolean;
  stage: 'idle' | 'awaiting_webhook' | 'verifying_webhook' | 'firestore_synced' | 'error';
  tierHint?: string;
  resolvedTier?: SubscriptionTier;
  reference?: string;
  firestoreDocId?: string;
  firestoreSynced?: boolean;
  hmacVerified?: boolean;
  signaturePreview?: string;
  message?: string;
}

export interface SampleWebhookResult {
  success: boolean;
  event?: string;
  reference?: string;
  tier?: string;
  status?: string;
  firestoreDocId?: string;
  firestoreSynced?: boolean;
  hmacVerified?: boolean;
  signaturePreview?: string;
  redirectPreviewUrl?: string;
  error?: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  code?: string;
  discountPercent: number;
  referrerHint?: string;
  error?: string;
}

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  isSovereign: boolean;
  isLocalDev: boolean;
  isOwner: boolean;
  isOwnerBypassActive: boolean;
  ownerEmail: string | null;
  isPaywallOpen: boolean;
  isBillingPortalOpen: boolean;
  isReferralModalOpen: boolean;
  paywallTriggerReason: string;
  billingCycle: 'monthly' | 'annual';
  activeReferralCode: string | null;
  referralDiscountPercent: number;
  // Purchasing Power Parity (PPP) region-aware pricing
  pppProfile: PppLocationProfile;
  isPppPricingEnabled: boolean;
  isDetectingPpp: boolean;
  availablePppRegions: PppCountryRule[];
  setPppPricingEnabled: (enabled: boolean) => void;
  setManualPppCountry: (countryCode: string | null) => Promise<void>;
  refreshPppLocation: () => Promise<void>;
  getTierPricing: (
    tierId: PaystackTierId,
    options?: { includeReferral?: boolean }
  ) => ComputedTierPricing;
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
  openBillingPortal: () => void;
  closeBillingPortal: () => void;
  openReferralModal: () => void;
  closeReferralModal: () => void;
  applyReferralCode: (code: string, buyerEmail?: string) => Promise<ReferralValidationResult>;
  clearReferralCode: () => void;
  claimReferralCreditActivation: (reference: string, tierId: string, customerEmail: string) => void;
  upgradeTier: (newTier: SubscriptionTier) => void;
  downgradeToFree: () => void;
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  applyBypassCode: (code: string, email?: string) => Promise<{ success: boolean; message: string }>;
  ownerBypassUnlock: () => Promise<{ success: boolean; message: string }>;
  ownerPreviewFreeTier: () => Promise<{ success: boolean; message: string }>;
  recoverSubscriptionByEmail: (email: string) => Promise<RecoveryResult>;
  searchCount: number;
  incrementSearchCount: () => void;
  resetAll: () => void;
  verifiedPaymentInfo: VerifiedPaymentInfo | null;
  grantCommunityPass: (reason?: string) => void;
  // Backend Paystack verification hook state & methods
  isVerifyingTransaction: boolean;
  verificationStatus: 'idle' | 'verifying' | 'verified' | 'error';
  verificationError: string | null;
  lastVerifiedTransaction: VerifiedPaymentInfo | null;
  paymentSuccessFlow: PaymentSuccessFlowState;
  dismissPaymentSuccessFlow: () => void;
  triggerSampleWebhookFlow: (tierId: PaystackTierId, emailOverride?: string) => Promise<SampleWebhookResult>;
  verifyPaystackTransaction: (
    reference: string,
    expectedTierId?: string
  ) => Promise<BackendVerificationResult>;
  refreshSubscriptionStatus: (email?: string, reference?: string) => Promise<void>;
}

const STORAGE_KEY = 'talent_radar_subscription_state_v1';
const REFERRAL_STORAGE_KEY = 'talent_radar_active_referral_v1';
const PPP_PREFS_STORAGE_KEY = 'talent_radar_subscription_ppp_v1';

const isLocalDevEnvironment = (): boolean =>
  Boolean(
    import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

function mapTierIdToSubscriptionTier(tierStr?: string): SubscriptionTier {
  if (!tierStr) return 'pro';
  if (tierStr.includes('agency') || tierStr.includes('sovereign') || tierStr.includes('buyout')) {
    return 'sovereign';
  }
  return 'pro';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>('recruit');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isBillingPortalOpen, setIsBillingPortalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem(REFERRAL_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number>(() => {
    try {
      return localStorage.getItem(REFERRAL_STORAGE_KEY) ? 20 : 0;
    } catch {
      return 0;
    }
  });
  const [paywallTriggerReason, setPaywallTriggerReason] = useState<string>(
    'Unlock Executive Compensation Bands & Autonomous AI Triad'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [searchCount, setSearchCount] = useState<number>(0);
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<VerifiedPaymentInfo | null>(null);
  const [isVerifyingTransaction, setIsVerifyingTransaction] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentSuccessFlow, setPaymentSuccessFlow] = useState<PaymentSuccessFlowState>({
    active: false,
    stage: 'idle',
  });
  const [authUser, setAuthUser] = useState<User | null>(() => auth.currentUser);

  // Region-aware PPP pricing state
  const [isPppPricingEnabled, setIsPppPricingEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PPP_PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.enabled === 'boolean') return parsed.enabled;
      }
    } catch {}
    return true;
  });
  const [pppProfile, setPppProfile] = useState<PppLocationProfile>(() => {
    try {
      const saved = localStorage.getItem(PPP_PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.manualCountryCode) {
          return getPppProfileForCountry(parsed.manualCountryCode, 'manual_override');
        }
      }
    } catch {}
    return detectBrowserPppLocation();
  });
  const [isDetectingPpp, setIsDetectingPpp] = useState<boolean>(false);

  const persistPppPrefs = useCallback((enabled: boolean, manualCountryCode?: string | null) => {
    try {
      const existingRaw = localStorage.getItem(PPP_PREFS_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const next = {
        enabled,
        manualCountryCode:
          manualCountryCode === undefined ? existing.manualCountryCode || null : manualCountryCode,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(PPP_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const refreshPppLocation = useCallback(async () => {
    setIsDetectingPpp(true);
    try {
      const browserDetected = detectBrowserPppLocation();
      const res = await fetch('/api/geo/ppp');
      if (res.ok) {
        const data = await res.json();
        if (data?.countryCode && data?.detectionSource === 'server_header') {
          setPppProfile(getPppProfileForCountry(data.countryCode, 'server_header'));
          setIsDetectingPpp(false);
          return;
        }
        if (
          browserDetected.detectionSource === 'timezone' ||
          browserDetected.detectionSource === 'locale'
        ) {
          setPppProfile(browserDetected);
          setIsDetectingPpp(false);
          return;
        }
        if (data?.countryCode) {
          setPppProfile(getPppProfileForCountry(data.countryCode, data.detectionSource || 'default'));
          setIsDetectingPpp(false);
          return;
        }
      }
      setPppProfile(browserDetected);
    } catch {
      setPppProfile(detectBrowserPppLocation());
    } finally {
      setIsDetectingPpp(false);
    }
  }, []);

  useEffect(() => {
    let hasManualOverride = false;
    try {
      const saved = localStorage.getItem(PPP_PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.manualCountryCode) {
          hasManualOverride = true;
          setPppProfile(getPppProfileForCountry(parsed.manualCountryCode, 'manual_override'));
        }
      }
    } catch {}

    if (!hasManualOverride) {
      refreshPppLocation();
    }
  }, [refreshPppLocation]);

  const setPppPricingEnabled = useCallback(
    (enabled: boolean) => {
      setIsPppPricingEnabledState(enabled);
      persistPppPrefs(enabled);
    },
    [persistPppPrefs]
  );

  const setManualPppCountry = useCallback(
    async (countryCode: string | null) => {
      const cleanCode = normalizeCountryCode(countryCode);
      if (!cleanCode) {
        persistPppPrefs(isPppPricingEnabled, null);
        await refreshPppLocation();
        return;
      }
      const nextProfile = getPppProfileForCountry(cleanCode, 'manual_override');
      setPppProfile(nextProfile);
      setIsPppPricingEnabledState(true);
      persistPppPrefs(true, cleanCode);
    },
    [isPppPricingEnabled, persistPppPrefs, refreshPppLocation]
  );

  const getTierPricing = useCallback(
    (tierId: PaystackTierId, options?: { includeReferral?: boolean }): ComputedTierPricing => {
      const includeReferral = options?.includeReferral !== false;
      return computeTierPricing({
        tierId,
        pppProfile,
        pppEnabled: isPppPricingEnabled,
        referralDiscountPercent: includeReferral ? referralDiscountPercent : 0,
      });
    },
    [isPppPricingEnabled, pppProfile, referralDiscountPercent]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(
    authUser?.email &&
      authUser.email.trim().toLowerCase() === FOUNDER_OWNER_EMAIL &&
      authUser.emailVerified
  );
  const ownerEmail = isOwner ? authUser?.email || FOUNDER_OWNER_EMAIL : null;
  const isOwnerBypassActive = Boolean(isOwner && verifiedPaymentInfo?.reference?.startsWith('owner_'));

  const persistState = useCallback(
    (
      newTier: SubscriptionTier,
      newCycle: 'monthly' | 'annual',
      count: number,
      paymentInfo?: VerifiedPaymentInfo | null
    ) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            tier: newTier,
            billingCycle: newCycle,
            searchCount: count,
            verifiedPaymentInfo: paymentInfo !== undefined ? paymentInfo : verifiedPaymentInfo,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore local storage quota errors
      }
    },
    [verifiedPaymentInfo]
  );

  // Backend Hook: Verifies a Paystack transaction reference via server endpoint
  const verifyPaystackTransaction = useCallback(
    async (
      reference: string,
      expectedTierId?: string
    ): Promise<BackendVerificationResult> => {
      if (!reference) {
        return { verified: false, error: 'Transaction reference is required' };
      }

      setIsVerifyingTransaction(true);
      setVerificationStatus('verifying');
      setVerificationError(null);

      try {
        const query = new URLSearchParams({
          sessionId: reference,
          reference,
          provider: 'paystack',
        });
        if (expectedTierId) {
          query.set('expectedTier', expectedTierId);
        }

        const headers: Record<string, string> = {};
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // Optional auth header
        }

        const res = await fetch(`/api/checkout/verify-session?${query.toString()}`, { headers });
        const data = await res.json().catch(() => ({ verified: false, error: 'Invalid backend verification response' }));

        if (!res.ok || !data?.verified) {
          const errMsg = data?.error || 'Transaction could not be verified by backend';
          setVerificationStatus('error');
          setVerificationError(errMsg);
          setIsVerifyingTransaction(false);
          setPaymentSuccessFlow((prev) =>
            prev.active
              ? { ...prev, stage: 'error', reference, message: errMsg }
              : prev
          );
          return { verified: false, reference, error: errMsg };
        }

        const resolvedTierId = data.tier || expectedTierId || 'pro_annual';
        const targetTier = mapTierIdToSubscriptionTier(resolvedTierId);
        const resolvedCycle: 'monthly' | 'annual' = resolvedTierId.includes('monthly') ? 'monthly' : 'annual';

        const info: VerifiedPaymentInfo = {
          isVerified: true,
          sessionId: reference,
          reference: data.reference || reference,
          provider: data.provider || 'paystack',
          customerEmail: data.customerEmail,
          amount: data.amountTotal,
          currency: data.currency || 'KES',
          status: data.status || 'active',
        };

        setTier(targetTier);
        setBillingCycle(resolvedCycle);
        setVerifiedPaymentInfo(info);
        setVerificationStatus('verified');
        setVerificationError(null);
        setIsVerifyingTransaction(false);

        setPaymentSuccessFlow({
          active: true,
          stage: 'firestore_synced',
          tierHint: resolvedTierId,
          resolvedTier: targetTier,
          reference: info.reference,
          firestoreDocId: data.firestoreDocId,
          firestoreSynced: Boolean(data.firestoreSynced),
          message: `Paystack reference ${info.reference} verified and synced to your account (${targetTier.toUpperCase()}).`,
        });

        persistState(targetTier, resolvedCycle, 0, info);

        return {
          verified: true,
          resolvedTier: targetTier,
          tierId: resolvedTierId,
          reference: info.reference,
          amountTotal: data.amountTotal,
          currency: info.currency,
          customerEmail: info.customerEmail,
        };
      } catch (err: any) {
        const errMsg = err?.message || 'Network error verifying Paystack transaction';
        setVerificationStatus('error');
        setVerificationError(errMsg);
        setIsVerifyingTransaction(false);
        return { verified: false, reference, error: errMsg };
      }
    },
    [persistState]
  );

  // Sync Firebase UID <-> Paystack Subscription & attach Real-Time Firestore onSnapshot listener
  useEffect(() => {
    if (!authUser?.uid) return;
    let cancelled = false;

    const syncAuthAndBindUid = async () => {
      try {
        const idToken = await authUser.getIdToken();
        const res = await fetch('/api/subscription/sync-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data?.active && data?.verified) {
          const targetTier = mapTierIdToSubscriptionTier(data.tier);
          const resolvedCycle: 'monthly' | 'annual' = String(data.tier || '').includes('monthly')
            ? 'monthly'
            : 'annual';
          const info: VerifiedPaymentInfo = {
            isVerified: true,
            sessionId: data.reference,
            reference: data.reference,
            provider: data.provider || 'paystack',
            customerEmail: data.email || authUser.email || undefined,
            customerCode: data.customerCode,
            amount: data.amountTotal,
            currency: data.currency || 'KES',
            status: data.status || 'active',
            subscriptionCode: data.subscriptionCode,
            planCode: data.planCode,
            nextPaymentDate: data.nextPaymentDate,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            expiringCardNotice: data.expiringCardNotice,
            lastWebhookEvent: data.lastWebhookEvent,
          };
          setTier(targetTier);
          setBillingCycle(resolvedCycle);
          setVerifiedPaymentInfo(info);
          setVerificationStatus('verified');
          persistState(targetTier, resolvedCycle, searchCount, info);
        }
      } catch {
        // Non-blocking fallback
      }
    };

    syncAuthAndBindUid();

    const userDocRef = doc(db, 'users', authUser.uid);
    const unsubUserDoc = onSnapshot(
      userDocRef,
      (userSnap) => {
        if (cancelled || !userSnap.exists()) return;
        const data = userSnap.data();
        const firestoreStatus = data?.subscriptionStatus;
        if (firestoreStatus !== undefined && firestoreStatus !== null) {
          const raw = String(firestoreStatus).trim().toLowerCase();
          if (raw.includes('sovereign') || raw.includes('agency')) {
            setTier('sovereign');
            persistState('sovereign', 'annual', 0);
          } else if (raw.includes('pro') || raw === 'active') {
            setTier('pro');
            persistState('pro', 'monthly', 0);
          } else if (raw === 'cancelled' || raw === 'past_due' || raw === 'recruit') {
            setTier('recruit');
            persistState('recruit', 'monthly', 0, null);
          }
        }
      },
      (error) => {
        if (!isFirestorePermissionError(error)) {
          console.warn('User doc subscriptionStatus listener paused:', error);
        }
      }
    );

    const subQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', authUser.uid)
    );

    const unsubscribe = onSnapshot(
      subQuery,
      (snapshot) => {
        if (cancelled || snapshot.empty) return;
        const docs: Array<Record<string, any> & { id: string }> = snapshot.docs.map((d) => ({
          ...(d.data() as Record<string, any>),
          id: d.id,
        }));
        docs.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        const latest = docs[0];
        if (!latest) return;

        const status = String(latest.status || '').toLowerCase();
        if (status === 'active' || status === 'non_renewing') {
          const resolvedTier = mapTierIdToSubscriptionTier(String(latest.tier || 'pro_monthly'));
          const resolvedCycle: 'monthly' | 'annual' = String(latest.tier || '').includes('monthly')
            ? 'monthly'
            : 'annual';
          const info: VerifiedPaymentInfo = {
            isVerified: true,
            sessionId: latest.reference || latest.id,
            reference: latest.reference || latest.id,
            provider: latest.provider || 'paystack',
            customerEmail: latest.email || authUser.email || undefined,
            customerCode: latest.customerCode || undefined,
            amount: typeof latest.amountTotal === 'number' ? latest.amountTotal : undefined,
            currency: latest.currency || 'KES',
            status,
            subscriptionCode: latest.subscriptionCode || undefined,
            planCode: latest.planCode || undefined,
            nextPaymentDate: latest.nextPaymentDate || undefined,
            cancelAtPeriodEnd: Boolean(latest.cancelAtPeriodEnd),
            lastWebhookEvent: latest.lastWebhookEvent || 'firestore.webhook_sync',
          };
          setTier(resolvedTier);
          setBillingCycle(resolvedCycle);
          setVerifiedPaymentInfo(info);
          setVerificationStatus('verified');
          persistState(resolvedTier, resolvedCycle, 0, info);
          setPaymentSuccessFlow((prev) =>
            prev.active
              ? {
                  active: true,
                  stage: 'firestore_synced',
                  tierHint: String(latest.tier || prev.tierHint || ''),
                  resolvedTier,
                  reference: info.reference,
                  firestoreDocId: latest.id,
                  firestoreSynced: true,
                  message: `Firestore live update received (${latest.lastWebhookEvent || 'charge.success'}). ${resolvedTier.toUpperCase()} access unlocked.`,
                }
              : prev
          );
        } else if (
          status === 'cancelled' ||
          status === 'past_due' ||
          status === 'refunded' ||
          status === 'disputed'
        ) {
          setTier('recruit');
          setVerifiedPaymentInfo(null);
          setVerificationStatus('idle');
          persistState('recruit', billingCycle, searchCount, null);
        }
      },
      (error) => {
        if (isFirestorePermissionError(error)) {
          console.warn('Firestore subscriptions listener paused due to auth state/rules.');
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'subscriptions');
      }
    );

    return () => {
      cancelled = true;
      unsubUserDoc();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  // Backend Hook: Re-checks persisted subscription status against backend ledger / Paystack
  const refreshSubscriptionStatus = useCallback(
    async (email?: string, reference?: string) => {
      if (!email && !reference) return;
      try {
        const query = new URLSearchParams();
        if (reference) query.set('reference', reference);
        if (email) query.set('email', email);

        const res = await fetch(`/api/subscription/status?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data?.active && data?.verified) {
          const targetTier = mapTierIdToSubscriptionTier(data.tier);
          const resolvedCycle: 'monthly' | 'annual' = String(data.tier || '').includes('monthly')
            ? 'monthly'
            : 'annual';
          const info: VerifiedPaymentInfo = {
            isVerified: true,
            sessionId: data.reference || reference,
            reference: data.reference || reference,
            provider: data.provider || 'paystack',
            customerEmail: data.customerEmail || email,
            customerCode: data.customerCode,
            amount: data.amountTotal,
            currency: data.currency,
            status: data.status || 'active',
            subscriptionCode: data.subscriptionCode,
            planCode: data.planCode,
            nextPaymentDate: data.nextPaymentDate,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            expiringCardNotice: data.expiringCardNotice,
            lastWebhookEvent: data.lastWebhookEvent,
          };
          setTier(targetTier);
          setBillingCycle(resolvedCycle);
          setVerifiedPaymentInfo(info);
          setVerificationStatus('verified');
          persistState(targetTier, resolvedCycle, searchCount, info);
        } else if (
          data?.status === 'cancelled' ||
          data?.status === 'past_due' ||
          data?.status === 'refunded' ||
          data?.status === 'disputed' ||
          data?.status === 'rejected_demo_reference' ||
          (data?.active === false && (data?.liveMode || !isLocalDevEnvironment()))
        ) {
          setTier('recruit');
          setVerifiedPaymentInfo(null);
          setVerificationStatus('idle');
          persistState('recruit', billingCycle, searchCount, null);
        }
      } catch {
        // Silent fallback when backend temporarily unreachable
      }
    },
    [billingCycle, persistState, searchCount]
  );

  // Load persisted subscription state on mount & enforce verified Paystack ledger check
  useEffect(() => {
    const isLocalDev = isLocalDevEnvironment();
    let savedInfo: VerifiedPaymentInfo | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.billingCycle) setBillingCycle(parsed.billingCycle);
        if (typeof parsed.searchCount === 'number') setSearchCount(parsed.searchCount);

        const hasValidProof = Boolean(
          parsed.verifiedPaymentInfo?.isVerified &&
            (parsed.verifiedPaymentInfo?.reference || parsed.verifiedPaymentInfo?.sessionId)
        );

        if (parsed.tier && (parsed.tier === 'recruit' || hasValidProof || isLocalDev)) {
          setTier(parsed.tier);
        } else {
          setTier('recruit');
        }

        if (hasValidProof) {
          savedInfo = parsed.verifiedPaymentInfo;
          setVerifiedPaymentInfo(parsed.verifiedPaymentInfo);
          setVerificationStatus('verified');
        }
      }
    } catch {
      // Ignore local storage parse errors
    }

    // Inspect URL for Paystack redirect callback (?reference=... / ?trxref=... / ?checkout_status=success)
    try {
      const params = new URLSearchParams(window.location.search);
      const checkoutStatus = params.get('checkout_status');
      const sessionId = params.get('session_id') || params.get('reference') || params.get('trxref');
      const returnTier = params.get('tier') || undefined;

      if (checkoutStatus === 'success' || params.get('reference') || params.get('trxref')) {
        setIsBillingPortalOpen(true);

        if (sessionId) {
          setPaymentSuccessFlow({
            active: true,
            stage: 'verifying_webhook',
            tierHint: returnTier,
            reference: sessionId,
            message: 'Verifying Paystack transaction & syncing Firestore subscription ledger...',
          });
          verifyPaystackTransaction(sessionId, returnTier).then((result) => {
            if (result.verified) {
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          });
          return;
        }

        // Hosted Paystack Payment Link redirect without ?reference= query parameter:
        // Bridge via Firestore onSnapshot + backend webhook polling
        setPaymentSuccessFlow({
          active: true,
          stage: 'awaiting_webhook',
          tierHint: returnTier,
          message: 'Payment redirect received. Waiting for Paystack webhook signal to unlock your Firestore subscription...',
        });

        let attempts = 0;
        const maxAttempts = 12;
        const pollTimer = window.setInterval(async () => {
          attempts += 1;
          const lookupEmail = auth.currentUser?.email || savedInfo?.customerEmail;
          if (lookupEmail) {
            try {
              const res = await fetch(
                `/api/subscription/status?email=${encodeURIComponent(lookupEmail)}`
              );
              const data = await res.json().catch(() => ({}));
              if (res.ok && data?.active && data?.verified) {
                const targetTier = mapTierIdToSubscriptionTier(data.tier);
                const resolvedCycle: 'monthly' | 'annual' = String(data.tier || '').includes('monthly')
                  ? 'monthly'
                  : 'annual';
                const info: VerifiedPaymentInfo = {
                  isVerified: true,
                  sessionId: data.reference,
                  reference: data.reference,
                  provider: 'paystack',
                  customerEmail: data.customerEmail || lookupEmail,
                  customerCode: data.customerCode,
                  amount: data.amountTotal,
                  currency: data.currency || 'KES',
                  status: data.status || 'active',
                  subscriptionCode: data.subscriptionCode,
                  planCode: data.planCode,
                  nextPaymentDate: data.nextPaymentDate,
                  cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                  lastWebhookEvent: data.lastWebhookEvent || 'charge.success',
                };
                setTier(targetTier);
                setBillingCycle(resolvedCycle);
                setVerifiedPaymentInfo(info);
                setVerificationStatus('verified');
                persistState(targetTier, resolvedCycle, 0, info);
                setPaymentSuccessFlow({
                  active: true,
                  stage: 'firestore_synced',
                  tierHint: data.tier,
                  resolvedTier: targetTier,
                  reference: data.reference,
                  firestoreSynced: true,
                  message: `Paystack webhook signal (${data.lastWebhookEvent || 'charge.success'}) confirmed & account unlocked.`,
                });
                window.clearInterval(pollTimer);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              }
            } catch {
              // Retry until maxAttempts
            }
          }
          if (attempts >= maxAttempts) {
            window.clearInterval(pollTimer);
          }
        }, 2500);

        return () => window.clearInterval(pollTimer);
      }
    } catch (e) {
      console.warn('Error processing checkout URL parameters:', e);
    }

    // Re-verify persisted subscription against live backend & Paystack webhook ledger
    if (savedInfo?.reference || savedInfo?.customerEmail) {
      refreshSubscriptionStatus(savedInfo.customerEmail, savedInfo.reference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissPaymentSuccessFlow = useCallback(() => {
    setPaymentSuccessFlow({ active: false, stage: 'idle' });
  }, []);

  const triggerSampleWebhookFlow = useCallback(
    async (tierId: PaystackTierId, emailOverride?: string): Promise<SampleWebhookResult> => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // Allow localhost dev test dispatch without token
        }

        const targetEmail = (
          emailOverride ||
          auth.currentUser?.email ||
          verifiedPaymentInfo?.customerEmail ||
          ''
        ).trim();

        setPaymentSuccessFlow({
          active: true,
          stage: 'verifying_webhook',
          tierHint: tierId,
          message: `Dispatching signed HMAC-SHA512 charge.success webhook for ${tierId}...`,
        });

        const res = await fetch('/api/paystack/webhook/test-dispatch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tierId,
            email: targetEmail || undefined,
            userId: auth.currentUser?.uid || undefined,
          }),
        });
        const data = await res.json().catch(() => ({ success: false, error: 'Invalid server response' }));

        if (!res.ok || !data?.success) {
          const errMsg = data?.error || 'Sample webhook dispatch rejected.';
          setPaymentSuccessFlow({
            active: true,
            stage: 'error',
            tierHint: tierId,
            message: errMsg,
          });
          return { success: false, error: errMsg };
        }

        const resolvedTier = mapTierIdToSubscriptionTier(data.tier || tierId);
        const resolvedCycle: 'monthly' | 'annual' = String(data.tier || tierId).includes('monthly')
          ? 'monthly'
          : 'annual';

        const info: VerifiedPaymentInfo = {
          isVerified: true,
          sessionId: data.reference,
          reference: data.reference,
          provider: 'paystack',
          customerEmail: data.email || targetEmail || undefined,
          status: data.status || 'active',
          currency: 'KES',
          lastWebhookEvent: data.event || 'charge.success',
        };

        setTier(resolvedTier);
        setBillingCycle(resolvedCycle);
        setVerifiedPaymentInfo(info);
        setVerificationStatus('verified');
        persistState(resolvedTier, resolvedCycle, 0, info);

        setPaymentSuccessFlow({
          active: true,
          stage: 'firestore_synced',
          tierHint: data.tier || tierId,
          resolvedTier,
          reference: data.reference,
          firestoreDocId: data.firestoreDocId,
          firestoreSynced: Boolean(data.firestoreSynced),
          hmacVerified: Boolean(data.hmacVerified),
          signaturePreview: data.signaturePreview,
          message: data.firestoreSynced
            ? `Signed webhook verified -> Firestore subscriptions/${data.firestoreDocId} updated -> ${resolvedTier.toUpperCase()} unlocked.`
            : `Signed webhook verified -> Server ledger updated (${data.firestoreDocId}); Firestore REST token active on Cloud Run.`,
        });

        return {
          success: true,
          event: data.event,
          reference: data.reference,
          tier: data.tier,
          status: data.status,
          firestoreDocId: data.firestoreDocId,
          firestoreSynced: Boolean(data.firestoreSynced),
          hmacVerified: Boolean(data.hmacVerified),
          signaturePreview: data.signaturePreview,
          redirectPreviewUrl: data.redirectPreviewUrl,
        };
      } catch (err: any) {
        const msg = err?.message || 'Failed to dispatch sample Paystack webhook.';
        setPaymentSuccessFlow({
          active: true,
          stage: 'error',
          tierHint: tierId,
          message: msg,
        });
        return { success: false, error: msg };
      }
    },
    [persistState, verifiedPaymentInfo?.customerEmail]
  );

  const openPaywall = (reason?: string) => {
    if (reason) setPaywallTriggerReason(reason);
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
  };

  const openBillingPortal = () => {
    setIsBillingPortalOpen(true);
  };

  const closeBillingPortal = () => {
    setIsBillingPortalOpen(false);
  };

  const openReferralModal = () => {
    setIsReferralModalOpen(true);
  };

  const closeReferralModal = () => {
    setIsReferralModalOpen(false);
  };

  const applyReferralCode = useCallback(
    async (code: string, buyerEmail?: string): Promise<ReferralValidationResult> => {
      const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!clean) {
        return { valid: false, discountPercent: 0, error: 'Enter a referral invite code.' };
      }
      try {
        const query = new URLSearchParams({ code: clean });
        if (buyerEmail) query.set('email', buyerEmail);
        const res = await fetch(`/api/referrals/validate?${query.toString()}`);
        const data = await res.json().catch(() => ({ valid: false, discountPercent: 0 }));
        if (!res.ok || !data?.valid) {
          return {
            valid: false,
            discountPercent: 0,
            error: data?.error || 'Referral code not found or ineligible.',
          };
        }

        setActiveReferralCode(data.code || clean);
        setReferralDiscountPercent(data.discountPercent || 20);
        try {
          localStorage.setItem(REFERRAL_STORAGE_KEY, data.code || clean);
        } catch {}

        return {
          valid: true,
          code: data.code || clean,
          discountPercent: data.discountPercent || 20,
          referrerHint: data.referrerHint,
        };
      } catch {
        return { valid: false, discountPercent: 0, error: 'Unable to validate referral code right now.' };
      }
    },
    []
  );

  const clearReferralCode = useCallback(() => {
    setActiveReferralCode(null);
    setReferralDiscountPercent(0);
    try {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch {}
  }, []);

  const claimReferralCreditActivation = useCallback(
    (reference: string, _tierId: string, customerEmail: string) => {
      const info: VerifiedPaymentInfo = {
        isVerified: true,
        sessionId: reference,
        reference,
        provider: 'paystack',
        customerEmail,
        amount: 0,
        currency: 'USD',
        status: 'active',
        lastWebhookEvent: 'referral.free_month_claimed',
      };
      setTier('pro');
      setBillingCycle('monthly');
      setVerifiedPaymentInfo(info);
      setVerificationStatus('verified');
      persistState('pro', 'monthly', 0, info);
    },
    [persistState]
  );

  const upgradeTier = (newTier: SubscriptionTier) => {
    // Locked down: Free direct tier upgrades are forbidden outside localhost DEV mode
    if (!isLocalDevEnvironment()) {
      openPaywall('Authorized Paystack Checkout Required');
      return;
    }
    setTier(newTier);
    persistState(newTier, billingCycle, searchCount);
    setIsPaywallOpen(false);
  };

  const downgradeToFree = () => {
    setTier('recruit');
    setVerifiedPaymentInfo(null);
    setVerificationStatus('idle');
    persistState('recruit', billingCycle, searchCount, null);
  };

  const handleSetBillingCycle = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle);
    persistState(tier, cycle, searchCount);
  };

  const incrementSearchCount = () => {
    setSearchCount((prev) => {
      const next = prev + 1;
      persistState(tier, billingCycle, next);
      return next;
    });
  };

  const resetAll = () => {
    setTier('recruit');
    setSearchCount(0);
    setVerifiedPaymentInfo(null);
    setVerificationStatus('idle');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Verified Owner Sovereign Bypass via cryptographic Firebase ID Token check
  const ownerBypassUnlock = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: `Sign in with Google using ${FOUNDER_OWNER_EMAIL} to activate Owner Bypass.`,
      };
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/subscription/owner-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: 'unlock_sovereign' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        return {
          success: false,
          message: data?.error || 'Server rejected Owner Bypass request.',
        };
      }

      const info: VerifiedPaymentInfo = {
        isVerified: true,
        sessionId: data.reference,
        reference: data.reference,
        provider: 'paystack',
        customerEmail: data.customerEmail || currentUser.email || FOUNDER_OWNER_EMAIL,
        amount: 0,
        currency: 'USD',
        status: 'active',
        lastWebhookEvent: 'owner.verified_override',
      };

      setTier('sovereign');
      setBillingCycle('annual');
      setVerifiedPaymentInfo(info);
      setVerificationStatus('verified');
      persistState('sovereign', 'annual', searchCount, info);
      setIsPaywallOpen(false);

      return {
        success: true,
        message: data.message || 'Owner Sovereign Bypass authorized cleanly.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Unable to verify owner credentials with backend.',
      };
    }
  }, [persistState, searchCount]);

  // Verified Owner Free Paywall Preview toggle (lets owner test the paywall as a visitor)
  const ownerPreviewFreeTier = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Sign in as owner first.' };
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/subscription/owner-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: 'preview_free' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        return { success: false, message: data?.error || 'Could not toggle free preview mode.' };
      }

      setTier('recruit');
      setVerifiedPaymentInfo(null);
      setVerificationStatus('idle');
      persistState('recruit', billingCycle, 0, null);

      return {
        success: true,
        message: data.message || 'Switched to Free Recruit preview mode so you can test the paywall.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error switching to preview mode.' };
    }
  }, [billingCycle, persistState]);

  // Essential Paystack Feature: Restore / Sync existing paid subscription by customer email
  const recoverSubscriptionByEmail = useCallback(
    async (email: string): Promise<RecoveryResult> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'Enter a valid Paystack subscriber email address.' };
      }

      try {
        const res = await fetch('/api/paystack/subscription/sync-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.found || !data?.active || !data?.subscription) {
          return {
            success: false,
            message: data?.message || data?.error || 'No active Paystack subscription found for that email.',
          };
        }

        const sub = data.subscription;
        const resolvedTier = mapTierIdToSubscriptionTier(sub.tier);
        const resolvedCycle: 'monthly' | 'annual' = String(sub.tier || '').includes('monthly')
          ? 'monthly'
          : 'annual';

        const info: VerifiedPaymentInfo = {
          isVerified: true,
          sessionId: sub.reference,
          reference: sub.reference,
          provider: 'paystack',
          customerEmail: sub.email || cleanEmail,
          customerCode: sub.customerCode,
          amount: sub.amountTotal,
          currency: sub.currency || 'KES',
          status: sub.status || 'active',
          subscriptionCode: sub.subscriptionCode,
          planCode: sub.planCode,
          nextPaymentDate: sub.nextPaymentDate,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          expiringCardNotice: sub.expiringCardNotice,
          lastWebhookEvent: sub.lastWebhookEvent || 'paystack.api_synced',
        };

        setTier(resolvedTier);
        setBillingCycle(resolvedCycle);
        setVerifiedPaymentInfo(info);
        setVerificationStatus('verified');
        persistState(resolvedTier, resolvedCycle, 0, info);

        return {
          success: true,
          resolvedTier,
          message: `Restored ${resolvedTier.toUpperCase()} subscription for ${info.customerEmail}.`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Failed to sync subscription from Paystack.',
        };
      }
    },
    [persistState]
  );

  // Locked down: Validate promo/VIP keys strictly via server endpoint (no hardcoded client bypass codes)
  const applyBypassCode = async (
    code: string,
    email?: string
  ): Promise<{ success: boolean; message: string }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Enter a valid license passcode.' };
    }
    if (clean === 'RESET') {
      downgradeToFree();
      return { success: true, message: 'CLEARANCE REVERTED TO RECRUIT (FREE)' };
    }

    try {
      const res = await fetch('/api/subscription/redeem-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        return {
          success: false,
          message:
            data?.message ||
            'Invalid license passcode. Complete checkout with Paystack to unlock clearance.',
        };
      }

      const grantedTier: SubscriptionTier = data.tier === 'sovereign' ? 'sovereign' : 'pro';
      const info: VerifiedPaymentInfo = {
        isVerified: true,
        sessionId: data.reference,
        reference: data.reference,
        provider: 'paystack',
        customerEmail: data.customerEmail || email,
        amount: 0,
        currency: 'USD',
        status: 'active',
        lastWebhookEvent: 'server.license_key_redeemed',
      };

      setTier(grantedTier);
      setVerifiedPaymentInfo(info);
      setVerificationStatus('verified');
      persistState(grantedTier, billingCycle, searchCount, info);
      setIsPaywallOpen(false);

      return {
        success: true,
        message: data.message || `${grantedTier.toUpperCase()} CLEARANCE AUTHORIZED`,
      };
    } catch {
      return {
        success: false,
        message: 'Unable to validate license passcode against server.',
      };
    }
  };

  // Locked down: Submitting an unverified salary record no longer bypasses paid Paystack subscriptions
  const grantCommunityPass = (_reason = 'Submitted Compensation Record') => {
    // Submission recorded for audit only; paid Paystack checkout is required for Pro/Sovereign clearance.
  };

  const isPro = tier === 'pro' || tier === 'sovereign';
  const isSovereign = tier === 'sovereign';

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isPro,
        isSovereign,
        isLocalDev: isLocalDevEnvironment(),
        isOwner,
        isOwnerBypassActive,
        ownerEmail,
        isPaywallOpen,
        isBillingPortalOpen,
        isReferralModalOpen,
        paywallTriggerReason,
        billingCycle,
        activeReferralCode,
        referralDiscountPercent,
        pppProfile,
        isPppPricingEnabled,
        isDetectingPpp,
        availablePppRegions: FEATURED_PPP_COUNTRIES,
        setPppPricingEnabled,
        setManualPppCountry,
        refreshPppLocation,
        getTierPricing,
        openPaywall,
        closePaywall,
        openBillingPortal,
        closeBillingPortal,
        openReferralModal,
        closeReferralModal,
        applyReferralCode,
        clearReferralCode,
        claimReferralCreditActivation,
        upgradeTier,
        downgradeToFree,
        setBillingCycle: handleSetBillingCycle,
        applyBypassCode,
        ownerBypassUnlock,
        ownerPreviewFreeTier,
        recoverSubscriptionByEmail,
        searchCount,
        incrementSearchCount,
        resetAll,
        verifiedPaymentInfo,
        grantCommunityPass,
        isVerifyingTransaction,
        verificationStatus,
        verificationError,
        lastVerifiedTransaction: verifiedPaymentInfo,
        paymentSuccessFlow,
        dismissPaymentSuccessFlow,
        triggerSampleWebhookFlow,
        verifyPaystackTransaction,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

/**
 * Dedicated hook wrapping SubscriptionProvider's backend Paystack transaction verifier.
 */
export function usePaystackTransactionVerifier() {
  const {
    verifyPaystackTransaction,
    refreshSubscriptionStatus,
    isVerifyingTransaction,
    verificationStatus,
    verificationError,
    lastVerifiedTransaction,
  } = useSubscription();

  return {
    verifyPaystackTransaction,
    refreshSubscriptionStatus,
    isVerifyingTransaction,
    verificationStatus,
    verificationError,
    lastVerifiedTransaction,
  };
}

export {
  useSubscriptionStatus,
  PremiumGate,
  PremiumBadge,
  PremiumLockOverlay,
  SubscriptionStatusIndicator,
  normalizeSubscriptionTier,
  normalizeLifecycleStatus,
  type SubscriptionStatusState,
  type NormalizedSubscriptionStatus,
  type PremiumGateProps,
} from '../hooks/useSubscriptionStatus';
