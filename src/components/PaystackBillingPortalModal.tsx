import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Crown,
  CreditCard,
  RefreshCw,
  Receipt,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Wrench,
  Copy,
  Check,
  Loader2,
  Eye,
  Unlock,
  Ban,
  LogIn,
  Webhook,
  Database,
  Zap,
} from 'lucide-react';
import {
  FOUNDER_OWNER_EMAIL,
  useSubscription,
  type PaystackTierId,
  type SampleWebhookResult,
} from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

interface PaystackTransactionItem {
  id: number | string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  channel: string;
  paidAt?: string;
  tier?: string;
}

interface OwnerDiagnostics {
  success: boolean;
  ownerEmail: string;
  secretKeyConfigured: boolean;
  keyMode: 'LIVE' | 'TEST' | 'NONE';
  publicKeyConfigured: boolean;
  publicKeyPrefix: string | null;
  configuredCurrency: string;
  usdToKesRate: number;
  currencyProbeOk: boolean;
  currencyProbeMessage: string;
  balance?: Array<{ currency: string; balance: number }>;
  balanceError?: string | null;
  configuredPlans: Record<string, string | undefined>;
  paystackPlansCount: number;
  recentTransactionsCount: number;
  webhookUrl: string;
  webhookEventsReceived: number;
}

export default function PaystackBillingPortalModal() {
  const {
    tier,
    isOwner,
    isOwnerBypassActive,
    ownerEmail,
    isBillingPortalOpen,
    closeBillingPortal,
    openPaywall,
    verifiedPaymentInfo,
    ownerBypassUnlock,
    ownerPreviewFreeTier,
    recoverSubscriptionByEmail,
    refreshSubscriptionStatus,
    paymentSuccessFlow,
    dismissPaymentSuccessFlow,
    triggerSampleWebhookFlow,
  } = useSubscription();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'portal' | 'owner'>('portal');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [transactions, setTransactions] = useState<PaystackTransactionItem[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  const [manageLink, setManageLink] = useState<string | null>(null);
  const [isGeneratingManageLink, setIsGeneratingManageLink] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [diagnostics, setDiagnostics] = useState<OwnerDiagnostics | null>(null);
  const [isLoadingDiag, setIsLoadingDiag] = useState(false);
  const [bootstrapCurrency, setBootstrapCurrency] = useState<'KES' | 'USD'>('KES');
  const [isBootstrappingPlans, setIsBootstrappingPlans] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<Record<string, { planCode?: string; status: string; message?: string }> | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [sampleTierId, setSampleTierId] = useState<PaystackTierId>('pro_monthly');
  const [sampleTargetEmail, setSampleTargetEmail] = useState('');
  const [isRunningSampleWebhook, setIsRunningSampleWebhook] = useState(false);
  const [sampleWebhookResult, setSampleWebhookResult] = useState<SampleWebhookResult | null>(null);

  useEffect(() => {
    const fallbackEmail = verifiedPaymentInfo?.customerEmail || user?.email || '';
    if (!recoveryEmail && fallbackEmail) {
      setRecoveryEmail(fallbackEmail);
    }
  }, [verifiedPaymentInfo?.customerEmail, user?.email, recoveryEmail]);

  const fetchTransactions = useCallback(async () => {
    const email = verifiedPaymentInfo?.customerEmail || user?.email || recoveryEmail;
    const reference = verifiedPaymentInfo?.reference || verifiedPaymentInfo?.sessionId || '';
    if (!email && !reference) return;

    setIsLoadingTx(true);
    try {
      const qs = new URLSearchParams();
      if (email) qs.set('email', email);
      if (reference) qs.set('reference', reference);
      const res = await fetch(`/api/paystack/transactions?${qs.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch {
      // Ignore network errors cleanly
    } finally {
      setIsLoadingTx(false);
    }
  }, [verifiedPaymentInfo?.customerEmail, verifiedPaymentInfo?.reference, verifiedPaymentInfo?.sessionId, user?.email, recoveryEmail]);

  const fetchOwnerDiagnostics = useCallback(async () => {
    if (!isOwner || !auth.currentUser) return;
    setIsLoadingDiag(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/paystack/owner/diagnostics', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setDiagnostics(data);
        if (data.configuredCurrency === 'KES' || data.configuredCurrency === 'USD') {
          setBootstrapCurrency(data.configuredCurrency);
        }
      } else {
        setActionFeedback({ success: false, message: data?.error || 'Could not load owner diagnostics.' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err?.message || 'Failed to load diagnostics.' });
    } finally {
      setIsLoadingDiag(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (!isBillingPortalOpen) return;
    fetchTransactions();
    if (isOwner) {
      fetchOwnerDiagnostics();
    }
  }, [isBillingPortalOpen, isOwner, fetchTransactions, fetchOwnerDiagnostics]);

  if (!isBillingPortalOpen) return null;

  const handleRecoverByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || isRecovering) return;
    setIsRecovering(true);
    setActionFeedback(null);
    const result = await recoverSubscriptionByEmail(recoveryEmail);
    setIsRecovering(false);
    setActionFeedback({ success: result.success, message: result.message });
    if (result.success) {
      fetchTransactions();
    }
  };

  const handleGenerateManageLink = async () => {
    setIsGeneratingManageLink(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/paystack/subscription/manage-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedPaymentInfo?.customerEmail || user?.email || recoveryEmail,
          subscriptionCode: verifiedPaymentInfo?.subscriptionCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.link) {
        setActionFeedback({
          success: false,
          message: data?.error || 'Could not generate Paystack self-serve card update link.',
        });
      } else {
        setManageLink(data.link);
        setActionFeedback({
          success: true,
          message: 'Paystack secure billing portal link ready below.',
        });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err?.message || 'Manage link request failed.' });
    } finally {
      setIsGeneratingManageLink(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    setIsCancelling(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/paystack/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedPaymentInfo?.customerEmail || user?.email || recoveryEmail,
          subscriptionCode: verifiedPaymentInfo?.subscriptionCode,
        }),
      });
      const data = await res.json();
      setConfirmCancel(false);
      if (!res.ok || !data?.success) {
        setActionFeedback({ success: false, message: data?.error || 'Cancellation request failed.' });
      } else {
        setActionFeedback({
          success: true,
          message: data.message || 'Auto-renewal disabled. Access remains valid until period end.',
        });
        await refreshSubscriptionStatus(
          verifiedPaymentInfo?.customerEmail || user?.email || recoveryEmail,
          verifiedPaymentInfo?.reference
        );
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err?.message || 'Error cancelling auto-renewal.' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOwnerUnlock = async () => {
    setActionFeedback(null);
    const res = await ownerBypassUnlock();
    setActionFeedback(res);
    if (res.success) {
      fetchTransactions();
    }
  };

  const handleOwnerPreviewFree = async () => {
    setActionFeedback(null);
    const res = await ownerPreviewFreeTier();
    setActionFeedback(res);
  };

  const handleBootstrapPlans = async () => {
    if (!auth.currentUser) return;
    setIsBootstrappingPlans(true);
    setActionFeedback(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/paystack/plans/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ currency: bootstrapCurrency }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setActionFeedback({ success: false, message: data?.error || 'Failed to bootstrap plans in Paystack.' });
      } else {
        setBootstrapResult(data.details || null);
        setActionFeedback({
          success: true,
          message: `Linked/created recurring Paystack plans in ${data.currency}.`,
        });
        fetchOwnerDiagnostics();
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err?.message || 'Error bootstrapping plans.' });
    } finally {
      setIsBootstrappingPlans(false);
    }
  };

  const productionWebhookUrl =
    diagnostics?.webhookUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app'}/api/paystack/webhook`;

  const copyWebhook = () => {
    navigator.clipboard?.writeText(productionWebhookUrl).catch(() => {});
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 1800);
  };

  const handleRunSampleWebhook = async () => {
    setIsRunningSampleWebhook(true);
    setActionFeedback(null);
    const res = await triggerSampleWebhookFlow(
      sampleTierId,
      sampleTargetEmail.trim() || user?.email || undefined
    );
    setSampleWebhookResult(res);
    setIsRunningSampleWebhook(false);
    if (res.success) {
      setActionFeedback({
        success: true,
        message: `Sample ${res.event || 'charge.success'} webhook verified (${res.reference}) — ${
          res.firestoreSynced
            ? `Firestore subscriptions/${res.firestoreDocId} updated & account unlocked.`
            : `server ledger active (${res.firestoreDocId}).`
        }`,
      });
      fetchTransactions();
      if (isOwner) fetchOwnerDiagnostics();
    } else {
      setActionFeedback({
        success: false,
        message: res.error || 'Sample webhook dispatch failed.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-portal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0c131a] border border-[#22d3a5]/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,165,0.2)] overflow-hidden my-auto text-[#dce7f0]">
        <div className="bg-gradient-to-r from-[#22d3a5] via-[#38bdf8] to-[#fbbf24] h-1.5 w-full" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-[#1e2b36] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold uppercase">
                PAYSTACK BILLING PORTAL &amp; OWNER CONSOLE
              </span>
              {isOwner && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50 font-bold">
                  VERIFIED OWNER: {ownerEmail}
                </span>
              )}
            </div>
            <h2 id="billing-portal-title" className="text-xl font-bold font-mono text-white">
              SUBSCRIPTION MANAGEMENT &amp; RECEIPTS
            </h2>
          </div>

          <button
            type="button"
            onClick={closeBillingPortal}
            className="p-2 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white border border-[#1e2b36] transition cursor-pointer"
            aria-label="Close billing portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1e2b36] bg-[#0a0f14] px-5 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'portal'
                ? 'border-[#22d3a5] text-[#22d3a5]'
                : 'border-transparent text-[#7a8b99] hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Subscriber Portal &amp; Receipts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'owner'
                ? 'border-[#fbbf24] text-[#fbbf24]'
                : 'border-transparent text-[#7a8b99] hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Owner Bypass &amp; Paystack Setup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {actionFeedback && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-mono ${
                actionFeedback.success
                  ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5]'
                  : 'bg-[#f87171]/15 border-[#f87171]/50 text-[#f87171]'
              }`}
            >
              {actionFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {activeTab === 'portal' ? (
            <>
              {/* Live Payment Success & Webhook-to-Firestore Sync Bridge */}
              {paymentSuccessFlow.active && (
                <div
                  className={`p-4 rounded-xl border space-y-3 text-xs font-mono ${
                    paymentSuccessFlow.stage === 'error'
                      ? 'bg-[#f87171]/10 border-[#f87171]/50 text-[#f87171]'
                      : paymentSuccessFlow.stage === 'firestore_synced'
                      ? 'bg-[#22d3a5]/10 border-[#22d3a5]/50 text-[#dce7f0]'
                      : 'bg-[#38bdf8]/10 border-[#38bdf8]/50 text-[#dce7f0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      {paymentSuccessFlow.stage === 'firestore_synced' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      ) : paymentSuccessFlow.stage === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-[#f87171] shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-[#38bdf8] animate-spin shrink-0" />
                      )}
                      <span>
                        {paymentSuccessFlow.stage === 'firestore_synced'
                          ? 'PAYMENT SUCCESS — FIRESTORE CLEARANCE ACTIVE'
                          : paymentSuccessFlow.stage === 'error'
                          ? 'PAYMENT VERIFICATION ATTENTION NEEDED'
                          : 'BRIDGING PAYSTACK PAYMENT -> FIRESTORE WEBHOOK'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={dismissPaymentSuccessFlow}
                      className="text-[10px] text-[#7a8b99] hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  {paymentSuccessFlow.message && (
                    <p className="text-[11px] text-[#dce7f0]">{paymentSuccessFlow.message}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#22d3a5]/40">
                      <div className="text-[#7a8b99]">1. REDIRECT</div>
                      <div className="text-[#22d3a5] font-bold">RECEIVED</div>
                    </div>
                    <div
                      className={`p-2 rounded-lg bg-[#0a0f14] border ${
                        paymentSuccessFlow.stage === 'firestore_synced'
                          ? 'border-[#22d3a5]/40'
                          : 'border-[#38bdf8]/40'
                      }`}
                    >
                      <div className="text-[#7a8b99]">2. WEBHOOK SIGNAL</div>
                      <div
                        className={`font-bold ${
                          paymentSuccessFlow.stage === 'firestore_synced'
                            ? 'text-[#22d3a5]'
                            : paymentSuccessFlow.stage === 'error'
                            ? 'text-[#f87171]'
                            : 'text-[#38bdf8]'
                        }`}
                      >
                        {paymentSuccessFlow.stage === 'firestore_synced'
                          ? 'HMAC VERIFIED'
                          : paymentSuccessFlow.stage === 'error'
                          ? 'FAILED'
                          : 'LISTENING...'}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg bg-[#0a0f14] border ${
                        paymentSuccessFlow.stage === 'firestore_synced'
                          ? 'border-[#22d3a5]/40'
                          : 'border-[#1e2b36]'
                      }`}
                    >
                      <div className="text-[#7a8b99]">3. FIRESTORE SYNC</div>
                      <div
                        className={`font-bold truncate ${
                          paymentSuccessFlow.stage === 'firestore_synced'
                            ? 'text-[#22d3a5]'
                            : 'text-[#7a8b99]'
                        }`}
                      >
                        {paymentSuccessFlow.firestoreDocId ||
                          (paymentSuccessFlow.stage === 'firestore_synced' ? 'SYNCED' : 'PENDING')}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg bg-[#0a0f14] border ${
                        paymentSuccessFlow.stage === 'firestore_synced'
                          ? 'border-[#22d3a5]/40'
                          : 'border-[#1e2b36]'
                      }`}
                    >
                      <div className="text-[#7a8b99]">4. CLEARANCE</div>
                      <div
                        className={`font-bold ${
                          paymentSuccessFlow.stage === 'firestore_synced'
                            ? 'text-[#22d3a5]'
                            : 'text-[#7a8b99]'
                        }`}
                      >
                        {paymentSuccessFlow.resolvedTier
                          ? paymentSuccessFlow.resolvedTier.toUpperCase()
                          : tier.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiring Card Dunning Alert */}
              {verifiedPaymentInfo?.expiringCardNotice && (
                <div className="p-3.5 rounded-xl bg-[#fbbf24]/15 border border-[#fbbf24]/50 text-[#fbbf24] text-xs font-mono flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">CARD EXPIRING NOTICE</div>
                    <p className="opacity-90">{verifiedPaymentInfo.expiringCardNotice}</p>
                  </div>
                </div>
              )}

              {/* Current Active Clearance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7 bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#7a8b99] uppercase">Current Clearance</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                        tier === 'sovereign'
                          ? 'bg-[#fbbf24]/15 border-[#fbbf24]/50 text-[#fbbf24]'
                          : tier === 'pro'
                          ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5]'
                          : 'bg-[#7a8b99]/15 border-[#7a8b99]/40 text-[#dce7f0]'
                      }`}
                    >
                      {tier.toUpperCase()}
                      {isOwnerBypassActive ? ' (OWNER OVERRIDE)' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                      <div className="text-[10px] text-[#7a8b99]">BILLING EMAIL</div>
                      <div className="text-white truncate">
                        {verifiedPaymentInfo?.customerEmail || user?.email || 'Not linked'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                      <div className="text-[10px] text-[#7a8b99]">STATUS</div>
                      <div className="text-[#22d3a5] uppercase">
                        {verifiedPaymentInfo?.status || (tier === 'recruit' ? 'free_tier' : 'active')}
                        {verifiedPaymentInfo?.cancelAtPeriodEnd ? ' (ends soon)' : ''}
                      </div>
                    </div>
                    {verifiedPaymentInfo?.subscriptionCode && (
                      <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                        <div className="text-[10px] text-[#7a8b99]">SUBSCRIPTION CODE</div>
                        <div className="text-white truncate">{verifiedPaymentInfo.subscriptionCode}</div>
                      </div>
                    )}
                    {verifiedPaymentInfo?.nextPaymentDate && (
                      <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                        <div className="text-[10px] text-[#7a8b99]">NEXT RENEWAL</div>
                        <div className="text-white">
                          {new Date(verifiedPaymentInfo.nextPaymentDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Self-Serve Paystack Manage / Cancel Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tier === 'recruit' ? (
                      <button
                        type="button"
                        onClick={() => {
                          closeBillingPortal();
                          openPaywall('Upgrade Subscription via Paystack');
                        }}
                        className="px-3 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Upgrade Plan with Paystack
                      </button>
                    ) : (
                      <>
                        {verifiedPaymentInfo?.subscriptionCode && (
                          <button
                            type="button"
                            onClick={handleGenerateManageLink}
                            disabled={isGeneratingManageLink}
                            className="px-3 py-2 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                          >
                            {isGeneratingManageLink ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                            <span>Update Card on Paystack</span>
                          </button>
                        )}

                        {!isOwnerBypassActive && !verifiedPaymentInfo?.cancelAtPeriodEnd && (
                          confirmCancel ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleCancelAutoRenew}
                                disabled={isCancelling}
                                className="px-3 py-2 rounded-lg bg-[#f87171] text-black text-xs font-mono font-bold cursor-pointer"
                              >
                                {isCancelling ? 'Disabling...' : 'Confirm Cancel Auto-Renew'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmCancel(false)}
                                className="px-2.5 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs font-mono text-[#7a8b99] cursor-pointer"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmCancel(true)}
                              className="px-3 py-2 rounded-lg bg-[#f87171]/15 hover:bg-[#f87171]/25 border border-[#f87171]/40 text-[#f87171] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Disable Auto-Renew</span>
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {manageLink && (
                    <a
                      href={manageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22d3a5] text-black text-xs font-mono font-bold hover:bg-[#1db890] transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Hosted Paystack Card &amp; Subscription Portal</span>
                    </a>
                  )}
                </div>

                {/* Restore / Sync Subscription Across Devices */}
                <div className="md:col-span-5 bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                    <RefreshCw className="w-3.5 h-3.5 text-[#22d3a5]" />
                    <span>RESTORE PAYSTACK PURCHASE</span>
                  </div>
                  <p className="text-[11px] font-mono text-[#7a8b99]">
                    Already paid via Card, M-Pesa, or Bank on another device? Enter your receipt email to sync directly from Paystack.
                  </p>
                  <form onSubmit={handleRecoverByEmail} className="space-y-2">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="subscriber@email.com"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-[#7a8b99] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isRecovering}
                      className="w-full py-2 px-3 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5]/60 text-[#22d3a5] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      {isRecovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Sync Status from Paystack</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Receipt & Transaction History Table */}
              <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                    <Receipt className="w-4 h-4 text-[#22d3a5]" />
                    <span>PAYSTACK TRANSACTION RECEIPTS</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchTransactions}
                    disabled={isLoadingTx}
                    className="text-[11px] font-mono text-[#22d3a5] hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingTx ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <p className="text-xs font-mono text-[#7a8b99] py-3">
                    No verified Paystack receipts found yet for the current email/session.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] text-[#7a8b99] border-b border-[#1e2b36]">
                        <tr>
                          <th className="py-2 pr-3">REFERENCE</th>
                          <th className="py-2 pr-3">TIER</th>
                          <th className="py-2 pr-3">CHANNEL</th>
                          <th className="py-2 pr-3">AMOUNT</th>
                          <th className="py-2 pr-3">STATUS</th>
                          <th className="py-2">DATE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2b36]/60">
                        {transactions.map((tx) => (
                          <tr key={`${tx.id}-${tx.reference}`}>
                            <td className="py-2 pr-3 text-[#dce7f0] max-w-[160px] truncate">{tx.reference}</td>
                            <td className="py-2 pr-3 text-[#7a8b99]">{tx.tier || 'subscription'}</td>
                            <td className="py-2 pr-3 uppercase text-[#38bdf8]">{tx.channel}</td>
                            <td className="py-2 pr-3 text-white font-bold">
                              {tx.amount?.toLocaleString()} {tx.currency}
                            </td>
                            <td className="py-2 pr-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  tx.status === 'success' || tx.status === 'active'
                                    ? 'bg-[#22d3a5]/15 text-[#22d3a5]'
                                    : 'bg-[#fbbf24]/15 text-[#fbbf24]'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-2 text-[#7a8b99]">
                              {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Owner Bypass & Paystack Setup Console */
            !isOwner ? (
              <div className="bg-[#111a22] p-6 rounded-xl border border-[#fbbf24]/40 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/50 text-[#fbbf24] flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-mono text-white">
                  FOUNDER OWNER BYPASS &amp; PAYSTACK ADMIN
                </h3>
                <p className="text-xs font-mono text-[#7a8b99] max-w-lg mx-auto">
                  Owner bypass is locked cryptographically on the server to your verified Google account (
                  <span className="text-[#fbbf24]">{FOUNDER_OWNER_EMAIL}</span>). Visitors cannot use or forge this override.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeBillingPortal();
                      window.dispatchEvent(new CustomEvent('open-auth-modal'));
                    }}
                    className="px-4 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In With Google ({FOUNDER_OWNER_EMAIL})</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Owner Bypass Controls */}
                <div className="bg-[#111a22] p-4 rounded-xl border border-[#fbbf24]/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#fbbf24]">
                      <Crown className="w-4 h-4" />
                      <span>OWNER SUBSCRIPTION OVERRIDE ({ownerEmail})</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold">
                      CURRENT TIER: {tier.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#7a8b99]">
                    Unlock full Sovereign Partner access free via Firebase ID Token verification, or switch to Free Recruit preview mode anytime to test the paywall as a new visitor.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleOwnerUnlock}
                      className="px-3.5 py-2 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Sovereign (Owner Bypass)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOwnerPreviewFree}
                      className="px-3.5 py-2 rounded-lg bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Free Paywall (Test as Visitor)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Live Paystack Diagnostics */}
                <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                      <Wrench className="w-4 h-4 text-[#22d3a5]" />
                      <span>PAYSTACK LIVE MERCHANT DIAGNOSTICS</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchOwnerDiagnostics}
                      disabled={isLoadingDiag}
                      className="px-2.5 py-1 rounded bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDiag ? 'animate-spin' : ''}`} />
                      <span>Run Probe</span>
                    </button>
                  </div>

                  {diagnostics && (
                    <div className="space-y-3 text-xs font-mono">
                      <div
                        className={`p-3 rounded-lg border flex items-start gap-2 ${
                          diagnostics.currencyProbeOk
                            ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5]'
                            : 'bg-[#f87171]/15 border-[#f87171]/50 text-[#f87171]'
                        }`}
                      >
                        {diagnostics.currencyProbeOk ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">
                            Currency Check ({diagnostics.configuredCurrency}):{' '}
                            {diagnostics.currencyProbeOk ? 'ACTIVE & ACCEPTED' : 'ACTION REQUIRED'}
                          </div>
                          <div>{diagnostics.currencyProbeMessage}</div>
                          {!diagnostics.currencyProbeOk && diagnostics.configuredCurrency === 'USD' && (
                            <div className="mt-1 text-[#dce7f0]">
                              Tip: Kenyan Paystack accounts default to KES. Update secret PAYSTACK_CURRENCY="KES" in AI Studio Secrets (M-Pesa + Visa/MC stay enabled and auto-convert from USD).
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                          <div className="text-[10px] text-[#7a8b99]">KEY MODE</div>
                          <div className="text-[#22d3a5] font-bold">{diagnostics.keyMode}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                          <div className="text-[10px] text-[#7a8b99]">PUBLIC KEY</div>
                          <div className="text-white truncate">{diagnostics.publicKeyPrefix || 'Missing'}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                          <div className="text-[10px] text-[#7a8b99]">PAYSTACK PLANS</div>
                          <div className="text-white font-bold">{diagnostics.paystackPlansCount} on Paystack</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                          <div className="text-[10px] text-[#7a8b99]">WEBHOOK EVENTS</div>
                          <div className="text-white font-bold">{diagnostics.webhookEventsReceived} received</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Recurring Plans Bootstrapper */}
                <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
                      <span>RECURRING SUBSCRIPTION PLANS (PLN_...)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={bootstrapCurrency}
                        onChange={(e) => setBootstrapCurrency(e.target.value === 'USD' ? 'USD' : 'KES')}
                        className="bg-[#0a0f14] border border-[#1e2b36] text-xs font-mono rounded px-2 py-1 text-white"
                      >
                        <option value="KES">KES (Recommended for KE)</option>
                        <option value="USD">USD</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleBootstrapPlans}
                        disabled={isBootstrappingPlans}
                        className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                      >
                        {isBootstrappingPlans ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Create / Link 4 Paystack Plans</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {(['pro_monthly', 'pro_annual', 'agency_monthly', 'agency_annual'] as const).map((planKey) => {
                      const code =
                        bootstrapResult?.[planKey]?.planCode ||
                        diagnostics?.configuredPlans?.[planKey] ||
                        'Not created yet';
                      const status = bootstrapResult?.[planKey]?.status;
                      return (
                        <div
                          key={planKey}
                          className="p-2.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] flex items-center justify-between gap-2"
                        >
                          <span className="text-[#7a8b99]">{planKey}</span>
                          <span className="text-[#22d3a5] font-bold truncate">
                            {code} {status ? `(${status})` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Webhook Endpoint Copy Card */}
                <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Webhook className="w-4 h-4 text-[#38bdf8]" />
                    <span>PRODUCTION PAYSTACK WEBHOOK URL</span>
                  </div>
                  <p className="text-[#7a8b99] text-[11px]">
                    Paste this URL into Paystack Dashboard → Settings → API Keys &amp; Webhooks → Live Webhook URL:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[#0a0f14] border border-[#1e2b36] rounded-lg px-3 py-2 text-[#22d3a5] break-all">
                      {productionWebhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={copyWebhook}
                      className="px-3 py-2 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/40 text-[#22d3a5] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 5. Sample Payment Success -> Webhook -> Firestore Flow Verifier */}
                <div className="bg-[#111a22] p-4 rounded-xl border border-[#38bdf8]/40 space-y-3 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Zap className="w-4 h-4 text-[#38bdf8]" />
                      <span>SAMPLE PAYMENT SUCCESS → WEBHOOK → FIRESTORE FLOW</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8]">
                      HMAC-SHA512 + REAL-TIME ONSNAPSHOT
                    </span>
                  </div>
                  <p className="text-[#7a8b99] text-[11px]">
                    Bridges hosted Payment Link checkouts to live account access: signs a sample Paystack{' '}
                    <code className="text-[#22d3a5]">charge.success</code> signal, updates Firestore{' '}
                    <code className="text-[#22d3a5]">subscriptions/sub_...</code> immediately, and unlocks your active clearance without reloading.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      value={sampleTierId}
                      onChange={(e) => setSampleTierId(e.target.value as PaystackTierId)}
                      className="sm:col-span-4 bg-[#0a0f14] border border-[#1e2b36] text-xs rounded-lg px-2.5 py-2 text-white outline-none"
                    >
                      <option value="pro_monthly">Pro Operator (Monthly • $49)</option>
                      <option value="pro_annual">Pro Operator (Annual • $384)</option>
                      <option value="agency_monthly">Sovereign Agency (Monthly • $199)</option>
                      <option value="agency_annual">Sovereign Agency (Annual • $1,788)</option>
                    </select>
                    <input
                      type="email"
                      value={sampleTargetEmail}
                      onChange={(e) => setSampleTargetEmail(e.target.value)}
                      placeholder={user?.email || FOUNDER_OWNER_EMAIL}
                      className="sm:col-span-4 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] text-xs rounded-lg px-3 py-2 text-white placeholder-[#7a8b99] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRunSampleWebhook}
                      disabled={isRunningSampleWebhook}
                      className="sm:col-span-4 px-3 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      {isRunningSampleWebhook ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      <span>Dispatch Webhook &amp; Sync</span>
                    </button>
                  </div>

                  {sampleWebhookResult?.success && (
                    <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#22d3a5]/40 space-y-1.5 text-[11px]">
                      <div className="flex flex-wrap items-center gap-3 text-[#22d3a5] font-bold">
                        <span>EVENT: {sampleWebhookResult.event}</span>
                        <span>HMAC: {sampleWebhookResult.hmacVerified ? 'VERIFIED' : 'DEV'}</span>
                        <span>
                          FIRESTORE: {sampleWebhookResult.firestoreSynced ? 'SYNCED' : 'LEDGER READY'}
                        </span>
                      </div>
                      <div className="text-[#dce7f0] break-all">
                        Doc Path: <code className="text-[#22d3a5]">subscriptions/{sampleWebhookResult.firestoreDocId}</code> • Ref:{' '}
                        <code className="text-[#38bdf8]">{sampleWebhookResult.reference}</code>
                      </div>
                      {sampleWebhookResult.redirectPreviewUrl && (
                        <div className="text-[#7a8b99] break-all">
                          Payment Link Return Path: <code className="text-[#dce7f0]">{sampleWebhookResult.redirectPreviewUrl}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
