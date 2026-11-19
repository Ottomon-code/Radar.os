import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirestorePermissionError,
  OperationType,
} from '../firebase';
import {
  FOUNDER_OWNER_EMAIL,
  useSubscription,
  SubscriptionTier,
} from '../context/SubscriptionContext';
import { ShieldCheck, Lock, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export type NormalizedSubscriptionStatus =
  | 'active'
  | 'non_renewing'
  | 'past_due'
  | 'cancelled'
  | 'trial'
  | 'free'
  | 'unknown';

export interface SubscriptionStatusState {
  /** The raw string stored in the user's Firestore 'subscriptionStatus' field */
  subscriptionStatus: string | null;
  /** Normalized application tier: 'recruit' | 'pro' | 'sovereign' */
  tier: SubscriptionTier;
  /** True if the user has Pro Operator or higher clearance */
  isPro: boolean;
  /** True if the user has Sovereign Agency clearance */
  isSovereign: boolean;
  /** True if user has any paid premium clearance (Pro or Sovereign) */
  isPremium: boolean;
  /** True if user is on the free Recruit tier */
  isFree: boolean;
  /** Normalized status lifecycle */
  status: NormalizedSubscriptionStatus;
  /** Checks if the user meets the required tier ('pro' | 'sovereign') */
  hasAccess: (requiredTier?: 'pro' | 'sovereign') => boolean;
  /** Checks access; if false, opens the Paystack paywall modal with the given reason */
  gateAccess: (requiredTier?: 'pro' | 'sovereign', reason?: string) => boolean;
  /** Initializing or syncing from Firestore */
  loading: boolean;
  /** Error message if Firestore listener encountered an issue */
  error: string | null;
  /** Provenance of the active status */
  source:
    | 'firestore_user_doc'
    | 'firestore_subscriptions'
    | 'owner_override'
    | 'context_fallback'
    | 'cache';
  /** Timestamp of the last received real-time Firestore snapshot */
  lastSyncedAt: string | null;
  /** Opens the billing / clearance modal */
  openUpgradeModal: (reason?: string) => void;
}

/**
 * Normalizes a raw Firestore subscriptionStatus string into a canonical SubscriptionTier
 */
export function normalizeSubscriptionTier(raw?: string | null): SubscriptionTier {
  if (!raw) return 'recruit';
  const clean = raw.trim().toLowerCase();
  if (
    clean.includes('sovereign') ||
    clean.includes('agency') ||
    clean.includes('enterprise') ||
    clean.includes('buyout')
  ) {
    return 'sovereign';
  }
  if (
    clean.includes('pro') ||
    clean.includes('operator') ||
    clean === 'active' ||
    clean === 'paid'
  ) {
    return 'pro';
  }
  return 'recruit';
}

/**
 * Normalizes a raw status string into a lifecycle status
 */
export function normalizeLifecycleStatus(
  raw?: string | null,
  tier?: SubscriptionTier
): NormalizedSubscriptionStatus {
  if (!raw) return tier && tier !== 'recruit' ? 'active' : 'free';
  const clean = raw.trim().toLowerCase();
  if (clean === 'cancelled' || clean === 'canceled') return 'cancelled';
  if (clean === 'past_due' || clean === 'pastdue') return 'past_due';
  if (clean === 'non_renewing' || clean === 'nonrenewing') return 'non_renewing';
  if (clean === 'trial') return 'trial';
  if (clean === 'active' || clean.includes('pro') || clean.includes('sovereign')) return 'active';
  return 'free';
}

const STORAGE_CACHE_KEY = 'talent_radar_firestore_subscription_status_cache';

/**
 * Reusable real-time hook that listens for live changes to the user's Firestore 'subscriptionStatus' field
 * on doc(db, 'users', uid) and cross-references doc(db, 'subscriptions', subId).
 *
 * Dynamically toggles premium UI elements and access gates across the entire application without reloads.
 */
export function useSubscriptionStatus(): SubscriptionStatusState {
  const {
    tier: contextTier,
    isOwner,
    isOwnerBypassActive,
    openPaywall,
  } = useSubscription();

  const [rawStatus, setRawStatus] = useState<string | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.rawStatus || null;
      }
    } catch {}
    return null;
  });

  const [docTier, setDocTier] = useState<SubscriptionTier>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.tier) return parsed.tier;
      }
    } catch {}
    return contextTier || 'recruit';
  });

  const [statusLifecycle, setStatusLifecycle] = useState<NormalizedSubscriptionStatus>('free');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SubscriptionStatusState['source']>('context_fallback');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      setRawStatus(null);
      setDocTier('recruit');
      setStatusLifecycle('free');
      setSource('context_fallback');
      return;
    }

    // Verified owner override takes priority unless owner is previewing free tier
    const isOwnerUser = Boolean(
      currentUser.email &&
        currentUser.email.trim().toLowerCase() === FOUNDER_OWNER_EMAIL &&
        currentUser.emailVerified
    );

    if (isOwnerUser && isOwnerBypassActive) {
      setRawStatus('sovereign_owner_override');
      setDocTier('sovereign');
      setStatusLifecycle('active');
      setSource('owner_override');
      setLoading(false);
      setLastSyncedAt(new Date().toISOString());
      return;
    }

    let isSubscribed = true;
    const userDocRef = doc(db, 'users', currentUser.uid);

    // 1. Primary real-time listener on the user's Firestore document
    const unsubUserDoc = onSnapshot(
      userDocRef,
      (userSnap) => {
        if (!isSubscribed) return;
        setLoading(false);
        const data = userSnap.data();
        const firestoreFieldStatus = data?.subscriptionStatus;

        if (firestoreFieldStatus !== undefined && firestoreFieldStatus !== null) {
          const raw = String(firestoreFieldStatus);
          const resolvedTier = normalizeSubscriptionTier(raw);
          const lifecycle = normalizeLifecycleStatus(raw, resolvedTier);

          setRawStatus(raw);
          setDocTier(resolvedTier);
          setStatusLifecycle(lifecycle);
          setSource('firestore_user_doc');
          const syncTime = new Date().toISOString();
          setLastSyncedAt(syncTime);
          setError(null);

          try {
            localStorage.setItem(
              STORAGE_CACHE_KEY,
              JSON.stringify({ rawStatus: raw, tier: resolvedTier, updatedAt: syncTime })
            );
          } catch {}
        }
      },
      (err) => {
        if (!isSubscribed) return;
        setLoading(false);
        if (isFirestorePermissionError(err)) {
          // Rule or auth barrier; fall back gracefully to context
          setSource('context_fallback');
          return;
        }
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        setError(err instanceof Error ? err.message : String(err));
      }
    );

    // 2. Secondary listener on the user's subscriptions sub/query in Firestore
    const subsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubSubscriptions = onSnapshot(
      subsQuery,
      (subSnap) => {
        if (!isSubscribed || subSnap.empty) return;
        const docs: Array<{ id: string; [key: string]: any }> = subSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, any>),
        }));
        docs.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        const latest = docs[0];
        if (!latest) return;

        const subStatus = String(latest.status || '').toLowerCase();
        const subTier = String(latest.tier || '');

        if (subStatus === 'active' || subStatus === 'non_renewing') {
          const resolvedTier = normalizeSubscriptionTier(subTier);
          setRawStatus(subTier || subStatus);
          setDocTier(resolvedTier);
          setStatusLifecycle(subStatus === 'non_renewing' ? 'non_renewing' : 'active');
          setSource('firestore_subscriptions');
          setLastSyncedAt(new Date().toISOString());
        } else if (subStatus === 'cancelled' || subStatus === 'past_due') {
          setStatusLifecycle(subStatus === 'cancelled' ? 'cancelled' : 'past_due');
          setDocTier('recruit');
        }
      },
      (err) => {
        if (isFirestorePermissionError(err)) return;
        console.warn('Subscription ledger listener paused:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubUserDoc();
      unsubSubscriptions();
    };
  }, [isOwner, isOwnerBypassActive]);

  // Merge Firestore listener state with Context state (takes whichever reflects verified active status)
  const effectiveTier: SubscriptionTier = useMemo(() => {
    if (isOwner && isOwnerBypassActive) return 'sovereign';
    if (docTier === 'sovereign' || contextTier === 'sovereign') return 'sovereign';
    if (docTier === 'pro' || contextTier === 'pro') return 'pro';
    return 'recruit';
  }, [docTier, contextTier, isOwner, isOwnerBypassActive]);

  const isPro = effectiveTier === 'pro' || effectiveTier === 'sovereign';
  const isSovereign = effectiveTier === 'sovereign';
  const isPremium = isPro || isSovereign;
  const isFree = !isPremium;

  const hasAccess = useCallback(
    (requiredTier: 'pro' | 'sovereign' = 'pro'): boolean => {
      if (isOwner && isOwnerBypassActive) return true;
      if (requiredTier === 'sovereign') return isSovereign;
      return isPro;
    },
    [isOwner, isOwnerBypassActive, isPro, isSovereign]
  );

  const gateAccess = useCallback(
    (
      requiredTier: 'pro' | 'sovereign' = 'pro',
      reason = 'Upgrade Clearance to Access Real-Time Market Intelligence'
    ): boolean => {
      const allowed = hasAccess(requiredTier);
      if (!allowed) {
        openPaywall(
          reason ||
            (requiredTier === 'sovereign'
              ? 'Sovereign Clearance Required for Deep Organizational Access'
              : 'Pro Operator Clearance Required')
        );
        return false;
      }
      return true;
    },
    [hasAccess, openPaywall]
  );

  return {
    subscriptionStatus: rawStatus,
    tier: effectiveTier,
    isPro,
    isSovereign,
    isPremium,
    isFree,
    status: statusLifecycle,
    hasAccess,
    gateAccess,
    loading,
    error,
    source,
    lastSyncedAt,
    openUpgradeModal: openPaywall,
  };
}

// ============================================================================
// REUSABLE PREMIUM UI COMPONENTS POWERED BY REAL-TIME FIRESTORE SUBSCRIPTION STATUS
// ============================================================================

export interface PremiumGateProps {
  requiredTier?: 'pro' | 'sovereign';
  featureTitle?: string;
  reason?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declares a component gate that only renders its children if the user's
 * real-time Firestore subscriptionStatus satisfies the required tier.
 */
export function PremiumGate({
  requiredTier = 'pro',
  featureTitle,
  reason,
  fallback,
  children,
}: PremiumGateProps) {
  const { hasAccess, gateAccess } = useSubscriptionStatus();
  const allowed = hasAccess(requiredTier);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0c131a] border border-[#22d3a5]/40 text-[#dce7f0] space-y-3 font-mono">
      <div className="flex items-center gap-2 text-xs font-bold text-[#22d3a5]">
        <Lock className="w-4 h-4 shrink-0" />
        <span className="uppercase">
          {featureTitle || (requiredTier === 'sovereign' ? 'SOVEREIGN PARTNER ACCESS' : 'PRO OPERATOR ACCESS')}
        </span>
      </div>
      <p className="text-xs text-[#7a8b99]">
        {reason ||
          `This real-time telemetry component requires ${requiredTier.toUpperCase()} clearance in your Firestore subscription status.`}
      </p>
      <button
        type="button"
        onClick={() => gateAccess(requiredTier, reason)}
        className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Unlock {requiredTier.toUpperCase()} Clearance</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Compact pill badge indicating premium requirement or active unlocked status
 */
export function PremiumBadge({
  requiredTier = 'pro',
  className = '',
}: {
  requiredTier?: 'pro' | 'sovereign';
  className?: string;
}) {
  const { hasAccess, gateAccess } = useSubscriptionStatus();
  const unlocked = hasAccess(requiredTier);

  if (unlocked) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5] ${className}`}
        title={`Unlocked via Firestore ${requiredTier.toUpperCase()} status`}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>{requiredTier === 'sovereign' ? 'SOVEREIGN' : 'PRO'}</span>
      </span>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        gateAccess(requiredTier);
      }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/40 text-[#fbbf24] transition cursor-pointer select-none ${className}`}
      title={`Click to upgrade clearance to ${requiredTier.toUpperCase()}`}
    >
      <Lock className="w-3 h-3" />
      <span>{requiredTier === 'sovereign' ? 'SOVEREIGN ONLY' : 'PRO REQUIRED'}</span>
    </span>
  );
}

/**
 * Frosted glass lock overlay for confidential figures, charts, or dossiers
 */
export function PremiumLockOverlay({
  requiredTier = 'pro',
  title,
  description,
  children,
}: {
  requiredTier?: 'pro' | 'sovereign';
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { hasAccess, gateAccess } = useSubscriptionStatus();
  const allowed = hasAccess(requiredTier);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-xl overflow-hidden group">
      <div className="filter blur-sm select-none pointer-events-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-[3px] text-center font-mono">
        <div className="p-2 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-[#fbbf24] mb-2">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs font-bold text-white mb-1">
          {title || (requiredTier === 'sovereign' ? 'CLASSIFIED SOVEREIGN DOSSIER' : 'RESTRICTED COMPENSATION DATA')}
        </div>
        <p className="text-[11px] text-[#7a8b99] max-w-sm mb-3">
          {description || 'Live Firestore subscriptionStatus update required to decrypt full market figures.'}
        </p>
        <button
          type="button"
          onClick={() => gateAccess(requiredTier, title)}
          className="px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Elevate to {requiredTier.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Floating or inline status pill displaying live Firestore sync health
 */
export function SubscriptionStatusIndicator({ className = '' }: { className?: string }) {
  const { tier, source, lastSyncedAt, subscriptionStatus, openUpgradeModal } = useSubscriptionStatus();

  return (
    <div
      onClick={() => openUpgradeModal('Review Subscription & Firestore Telemetry')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition ${
        tier === 'sovereign'
          ? 'bg-[#fbbf24]/15 border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#fbbf24]/25'
          : tier === 'pro'
          ? 'bg-[#22d3a5]/15 border-[#22d3a5]/40 text-[#22d3a5] hover:bg-[#22d3a5]/25'
          : 'bg-[#0c131a] border-[#1e2b36] text-[#7a8b99] hover:text-white'
      } ${className}`}
      title={`Firestore Source: ${source} (${subscriptionStatus || tier})${lastSyncedAt ? ` • Synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          tier === 'sovereign'
            ? 'bg-[#fbbf24] animate-pulse'
            : tier === 'pro'
            ? 'bg-[#22d3a5] animate-pulse'
            : 'bg-[#7a8b99]'
        }`}
      />
      <span className="font-bold uppercase tracking-wider">{tier}</span>
      <span className="text-[9px] opacity-75 hidden sm:inline">
        {tier !== 'recruit' ? '• LIVE SYNC' : '• FREE'}
      </span>
    </div>
  );
}
