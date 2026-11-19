import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Zap,
  Building,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  KeyRound,
  QrCode,
  RefreshCw,
  Tag,
  Gift,
} from 'lucide-react';
import {
  SubscriptionTier,
  usePaystackTransactionVerifier,
  useSubscription,
} from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { initiateCheckout } from '../utils/stripeBilling';
import { formatLocalizedCheckoutAmount } from '../utils/pppPricing';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        plan?: string;
        channels?: string[];
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string; status?: string; trans?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export type PaystackTierId =
  | 'pro_monthly'
  | 'pro_annual'
  | 'agency_monthly'
  | 'agency_annual'
  | 'buyout_deposit';

export type PaystackChannelOption = 'all' | 'card' | 'mpesa' | 'bank' | 'ussd';

interface PaystackServerConfig {
  activeProvider?: string;
  liveMode: boolean;
  publishableKey?: string;
  paystack?: {
    configured: boolean;
    liveMode: boolean;
    publicKey: string;
    currency: string;
    configuredCurrency?: string;
    balanceCurrencies?: string[];
    currencyFallbackReason?: string;
    usdToKesRate?: number;
    plans?: Partial<Record<PaystackTierId, string>>;
    paymentLinksConfigured?: boolean;
  };
}

export interface PaystackSubscriptionServiceProps {
  selectedTier?: SubscriptionTier;
  billingCycle?: 'monthly' | 'annual';
  selectedTierId?: PaystackTierId;
  defaultEmail?: string;
  onSuccess?: (targetTier: SubscriptionTier, reference: string) => void;
  onError?: (message: string) => void;
  compact?: boolean;
}

const TIER_PRICE_MAP: Record<PaystackTierId, { label: string; usd: number; targetTier: SubscriptionTier }> = {
  pro_monthly: { label: 'Pro Operator (Monthly)', usd: 49, targetTier: 'pro' },
  pro_annual: { label: 'Pro Operator (Annual)', usd: 384, targetTier: 'pro' },
  agency_monthly: { label: 'Sovereign / Agency (Monthly)', usd: 199, targetTier: 'sovereign' },
  agency_annual: { label: 'Sovereign / Agency (Annual)', usd: 1788, targetTier: 'sovereign' },
  buyout_deposit: { label: 'Asset Buyout Deposit (10%)', usd: 14500, targetTier: 'sovereign' },
};

let paystackScriptPromise: Promise<boolean> | null = null;

function loadPaystackInlineScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);
  if (paystackScriptPromise) return paystackScriptPromise;

  paystackScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.paystack.co/v1/inline.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.PaystackPop)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.PaystackPop));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
}

export default function PaystackSubscriptionService({
  selectedTier = 'pro',
  billingCycle = 'annual',
  selectedTierId,
  defaultEmail,
  onSuccess,
  onError,
  compact = false,
}: PaystackSubscriptionServiceProps) {
  const { user } = useAuth();
  const {
    openPaywall,
    openBillingPortal,
    recoverSubscriptionByEmail,
    activeReferralCode,
    referralDiscountPercent,
    applyReferralCode,
    clearReferralCode,
    openReferralModal,
    pppProfile,
    isPppPricingEnabled,
    getTierPricing,
  } = useSubscription();
  const {
    verifyPaystackTransaction,
    isVerifyingTransaction,
    verificationStatus,
    verificationError,
    lastVerifiedTransaction,
  } = usePaystackTransactionVerifier();

  const resolvedTierId: PaystackTierId =
    selectedTierId ||
    (selectedTier === 'sovereign'
      ? billingCycle === 'annual'
        ? 'agency_annual'
        : 'agency_monthly'
      : billingCycle === 'annual'
      ? 'pro_annual'
      : 'pro_monthly');

  const tierDetails = TIER_PRICE_MAP[resolvedTierId];

  const [email, setEmail] = useState<string>(defaultEmail || user?.email || '');
  const [channel, setChannel] = useState<PaystackChannelOption>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'KES' | 'USD' | null>(null);
  const [config, setConfig] = useState<PaystackServerConfig | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [localStatusMsg, setLocalStatusMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showChannelTroubleshooting, setShowChannelTroubleshooting] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState<string>('');
  const [showRefInput, setShowRefInput] = useState<boolean>(false);

  useEffect(() => {
    if (!email && (defaultEmail || user?.email)) {
      setEmail(defaultEmail || user?.email || '');
    }
  }, [defaultEmail, user?.email, email]);

  // Fetch Paystack public key, currency, FX rate, and plan codes from backend
  useEffect(() => {
    let active = true;
    fetch('/api/checkout/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PaystackServerConfig | null) => {
        if (active && data) {
          setConfig(data);
        }
      })
      .catch(() => {
        // Ignore config preload failure; handleCheckout will retry or use VITE_PAYSTACK_PUBLIC_KEY
      });
    return () => {
      active = false;
    };
  }, []);

  const envPublicKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) || '';
  const publicKey =
    (config?.paystack?.publicKey && !config.paystack.publicKey.includes('...')
      ? config.paystack.publicKey
      : '') ||
    (!envPublicKey.includes('...') ? envPublicKey : '');

  const hasValidPublicKey = Boolean(publicKey && publicKey.startsWith('pk_'));
  const serverResolvedCurrency = (
    config?.paystack?.currency ||
    config?.paystack?.balanceCurrencies?.[0] ||
    'KES'
  ).toUpperCase();
  const KES_PRIMARY_COUNTRIES = new Set(['KE', 'UG', 'TZ', 'RW']);
  const REST_OF_AFRICA_COUNTRIES = new Set(['NG', 'GH', 'ZA', 'EG', 'MA', 'ET']);
  const isEastAfricaRegion = KES_PRIMARY_COUNTRIES.has(pppProfile.countryCode);
  const isRestOfAfricaRegion = REST_OF_AFRICA_COUNTRIES.has(pppProfile.countryCode);
  const regionDefaultCurrency: 'KES' | 'USD' = isEastAfricaRegion ? 'KES' : 'USD';
  // M-Pesa (mobile_money) strictly requires KES; otherwise honor explicit user toggle, or region-appropriate default (KES for East Africa, USD for Rest of Africa/Europe/Global)
  const currency: 'KES' | 'USD' =
    channel === 'mpesa'
      ? 'KES'
      : selectedCurrency ||
        (serverResolvedCurrency === 'USD' ? 'USD' : regionDefaultCurrency);
  const usdToKesRate = config?.paystack?.usdToKesRate || 129;
  const pricingSummary = getTierPricing(resolvedTierId, { includeReferral: true });
  const hasPppDiscount = pricingSummary.pppApplied;
  const hasReferralDiscount = Boolean(
    resolvedTierId !== 'buyout_deposit' && activeReferralCode && referralDiscountPercent > 0
  );
  const planCode =
    currency === serverResolvedCurrency && !hasPppDiscount && !hasReferralDiscount
      ? config?.paystack?.plans?.[resolvedTierId]
      : undefined;
  const effectiveUsd = pricingSummary.finalUsd;
  const displayAmountKes = Math.round(effectiveUsd * usdToKesRate);

  // IMPORTANT: When 'all' is selected, return undefined so Paystack automatically loads all active merchant channels.
  // Passing unactivated channel names (e.g. bank_transfer/ussd/qr on Kenya KES or USD) triggers "No active channel to process transaction".
  const mapChannels = (selectedChannel: PaystackChannelOption): string[] | undefined => {
    if (selectedChannel === 'card') return ['card'];
    if (selectedChannel === 'mpesa') return ['mobile_money'];
    if (selectedChannel === 'bank') return ['bank'];
    if (selectedChannel === 'ussd') return ['ussd'];
    return undefined;
  };

  const handleCheckout = useCallback(async () => {
    const cleanEmail = (email || user?.email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Please enter a valid receipt email address for your Paystack subscription.';
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setLocalError(null);
    setLocalStatusMsg('Initializing Paystack checkout session...');
    setIsLaunching(true);

    try {
      // Re-verify any active referral code against buyer email (blocks self-referral discount)
      let verifiedRefCode: string | undefined;
      let verifiedDiscountPct = 0;
      if (hasReferralDiscount && activeReferralCode) {
        const refCheck = await applyReferralCode(activeReferralCode, cleanEmail);
        if (refCheck.valid && refCheck.code) {
          verifiedRefCode = refCheck.code;
          verifiedDiscountPct = refCheck.discountPercent;
        }
      }
      const verifiedPricing = getTierPricing(resolvedTierId, {
        includeReferral: verifiedDiscountPct > 0,
      });
      const checkoutUsd = verifiedPricing.finalUsd;
      const activePppCountry = verifiedPricing.pppApplied ? verifiedPricing.pppCountryCode : undefined;

      // 1. Primary Paystack path: Native Paystack InlineJS checkout using the Paystack Public Key
      if (hasValidPublicKey) {
        const inlineReady = await loadPaystackInlineScript();
        if (inlineReady && window.PaystackPop) {
          const reference = `tr_ps_${resolvedTierId}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 7)}`;

          const amountSubunit =
            currency === 'KES'
              ? Math.round(checkoutUsd * usdToKesRate * 100)
              : Math.round(checkoutUsd * 100);

          const filteredChannels = mapChannels(channel);
          setLocalStatusMsg(`Paystack ${currency} Checkout active. Complete authorization in popup...`);

          const handler = window.PaystackPop.setup({
            key: publicKey,
            email: cleanEmail,
            amount: amountSubunit,
            currency,
            ref: reference,
            // Only attach fixed recurring plan when no discounted initial price applies
            ...(verifiedDiscountPct === 0 && !verifiedPricing.pppApplied && planCode && planCode.startsWith('PLN_')
              ? { plan: planCode }
              : {}),
            // Only send channels array if user filtered to a single channel; omitting sends all enabled merchant channels
            ...(filteredChannels ? { channels: filteredChannels } : {}),
            metadata: {
              tierId: resolvedTierId,
              usdEquivalent: checkoutUsd,
              paymentChannel: channel,
              ...(user?.uid ? { userId: user.uid } : {}),
              ...(verifiedRefCode ? { referralCode: verifiedRefCode, discountPercent: verifiedDiscountPct } : {}),
              ...(verifiedPricing.pppApplied
                ? {
                    pppCountryCode: verifiedPricing.pppCountryCode,
                    pppDiscountPercent: verifiedPricing.pppDiscountPercent,
                  }
                : {}),
              appletId: '17b9a6d1-7662-4373-863e-133fa0cc2517',
            },
            callback: (response) => {
              const verifiedRef = response?.reference || reference;
              setShowChannelTroubleshooting(false);
              setLocalStatusMsg(`Payment authorized (${verifiedRef}). Verifying via backend hook...`);
              verifyPaystackTransaction(verifiedRef, resolvedTierId)
                .then((result) => {
                  setIsLaunching(false);
                  if (result.verified) {
                    setLocalStatusMsg(`Subscription active: ${tierDetails.label}`);
                    onSuccess?.(result.resolvedTier || tierDetails.targetTier, verifiedRef);
                  } else {
                    const errMsg = result.error || 'Backend verification could not confirm payment.';
                    setLocalError(errMsg);
                    onError?.(errMsg);
                  }
                })
                .catch((err: any) => {
                  setIsLaunching(false);
                  const errMsg = err?.message || 'Transaction verification failed.';
                  setLocalError(errMsg);
                  onError?.(errMsg);
                });
            },
            onClose: () => {
              setIsLaunching(false);
              setLocalStatusMsg(null);
              setShowChannelTroubleshooting(true);
            },
          });

          handler.openIframe();
          return;
        }
      }

      // 2. Fallback path: Server-initialized Paystack Hosted Checkout URL
      const serverRes = await initiateCheckout({
        tierId: resolvedTierId,
        customerEmail: cleanEmail,
        paymentMethod: channel === 'all' ? 'paystack' : channel,
        channels: mapChannels(channel),
        currency,
        referralCode: verifiedRefCode,
        pppCountryCode: activePppCountry,
      });

      if (!serverRes.success && !serverRes.checkoutUrl) {
        throw new Error(serverRes.message || 'Unable to start Paystack session.');
      }

      // Redirect happened inside initiateCheckout if checkoutUrl was returned
      setIsLaunching(false);
    } catch (err: any) {
      setIsLaunching(false);
      const errMsg = err?.message || 'Paystack checkout failed';
      setLocalError(errMsg);
      setLocalStatusMsg(null);
      onError?.(errMsg);
    }
  }, [
    activeReferralCode,
    applyReferralCode,
    channel,
    currency,
    email,
    getTierPricing,
    hasReferralDiscount,
    hasValidPublicKey,
    onError,
    onSuccess,
    planCode,
    publicKey,
    resolvedTierId,
    tierDetails.label,
    tierDetails.targetTier,
    usdToKesRate,
    user?.email,
    verifyPaystackTransaction,
  ]);

  const localHintDisplay = formatLocalizedCheckoutAmount(
    effectiveUsd,
    currency === 'KES' ? 'KES' : pppProfile.localCurrencyHint,
    usdToKesRate
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => (email ? handleCheckout() : openPaywall(`Upgrade to ${tierDetails.label}`))}
        disabled={isLaunching || isVerifyingTransaction}
        className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
      >
        {isLaunching || isVerifyingTransaction ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CreditCard className="w-3.5 h-3.5" />
        )}
        <span>PAY WITH PAYSTACK (${effectiveUsd})</span>
      </button>
    );
  }

  return (
    <div className="bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] space-y-3">
      {/* Header Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-[#22d3a5]" />
          <span className="text-[11px] font-mono text-[#dce7f0] font-bold">
            PAYSTACK SUBSCRIPTION SERVICE
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
            hasValidPublicKey
              ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5]'
              : config?.paystack?.configured
              ? 'bg-[#38bdf8]/15 border-[#38bdf8]/50 text-[#38bdf8]'
              : 'bg-[#f87171]/15 border-[#f87171]/50 text-[#f87171]'
          }`}
        >
          {hasValidPublicKey
            ? `INLINE PK ACTIVE (${publicKey.slice(0, 10)}...)`
            : config?.paystack?.configured
            ? 'HOSTED PAYSTACK READY'
            : 'GATEWAY UNCONFIGURED'}
        </span>
      </div>

      {/* Selected Plan Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#7a8b99]">SELECTED PLAN: </span>
          <strong className="text-white">{tierDetails.label}</strong>
          {hasPppDiscount && isPppPricingEnabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 text-[#38bdf8] font-bold">
              -{pricingSummary.pppDiscountPercent}% {pppProfile.countryCode} PPP
            </span>
          )}
          {hasReferralDiscount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fbbf24]/20 border border-[#fbbf24]/50 text-[#fbbf24] font-bold">
              -{referralDiscountPercent}% REFERRAL ({activeReferralCode})
            </span>
          )}
        </div>
        <div className="text-[#22d3a5] font-bold">
          {(hasReferralDiscount || hasPppDiscount) && (
            <span className="text-[#7a8b99] line-through font-normal mr-1.5">
              ${tierDetails.usd.toLocaleString()}
            </span>
          )}
          ${effectiveUsd.toLocaleString()} USD
          {localHintDisplay.currency !== 'USD' && (
            <span className="text-[#7a8b99] font-normal ml-1.5">
              (≈ {localHintDisplay.formatted})
            </span>
          )}
        </div>
      </div>

      {/* Receipt Email Input */}
      <div className="flex items-center gap-2">
        <label htmlFor="paystack-receipt-email" className="text-[10px] font-mono text-[#7a8b99] shrink-0">
          RECEIPT EMAIL:
        </label>
        <input
          id="paystack-receipt-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@talentradar.io"
          className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-xs font-mono rounded-lg px-2.5 py-1.5 text-white placeholder-[#7a8b99] outline-none"
        />
      </div>

      {/* Optional Referral Discount Code Row */}
      {resolvedTierId !== 'buyout_deposit' && (
        <div className="text-[11px] font-mono">
          {hasReferralDiscount ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5]">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>20% referral discount applied ({activeReferralCode})</span>
              </span>
              <button
                type="button"
                onClick={clearReferralCode}
                className="text-[#f87171] hover:underline text-[10px] cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : showRefInput ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={refCodeInput}
                onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
                placeholder="Referral code (e.g. TR-XXXXXX)"
                className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#fbbf24] text-xs font-mono rounded-lg px-2.5 py-1 text-white placeholder-[#7a8b99] outline-none uppercase"
              />
              <button
                type="button"
                onClick={async () => {
                  const res = await applyReferralCode(refCodeInput, email || user?.email || undefined);
                  if (res.valid) {
                    setShowRefInput(false);
                    setLocalError(null);
                  } else {
                    setLocalError(res.error || 'Invalid referral code.');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#fbbf24] text-black font-bold text-[10px] cursor-pointer"
              >
                APPLY
              </button>
              <button
                type="button"
                onClick={() => setShowRefInput(false)}
                className="text-[#7a8b99] hover:text-white text-[10px] px-1.5 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRefInput(true)}
              className="text-[#fbbf24] hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
            >
              <Tag className="w-3 h-3" />
              <span>Have a friend&apos;s referral code? Get 20% off</span>
            </button>
          )}
        </div>
      )}

      {/* Paystack Channel Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        <button
          type="button"
          onClick={() => setChannel('all')}
          className={`py-2 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
            channel === 'all'
              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> All
        </button>
        <button
          type="button"
          onClick={() => setChannel('card')}
          className={`py-2 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
            channel === 'card'
              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 shrink-0" /> Card
        </button>
        <button
          type="button"
          onClick={() => setChannel('mpesa')}
          className={`py-2 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
            channel === 'mpesa'
              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" /> M-Pesa
        </button>
        <button
          type="button"
          onClick={() => setChannel('bank')}
          className={`py-2 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
            channel === 'bank'
              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5 shrink-0" /> Bank
        </button>
        <button
          type="button"
          onClick={() => setChannel('ussd')}
          className={`py-2 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer col-span-2 sm:col-span-1 ${
            channel === 'ussd'
              ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
              : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 shrink-0" /> USSD/QR
        </button>
      </div>

      {/* Currency & Settlement Switcher */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[11px] font-mono">
          <span className="text-[#7a8b99]">CHECKOUT CURRENCY:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCurrency('KES')}
              className={`px-2.5 py-1 rounded border font-bold cursor-pointer transition ${
                currency === 'KES'
                  ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                  : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-white'
              }`}
            >
              KES (M-Pesa &amp; Cards)
            </button>
            <button
              type="button"
              onClick={() => {
                if (channel === 'mpesa') setChannel('card');
                setSelectedCurrency('USD');
              }}
              className={`px-2.5 py-1 rounded border font-bold cursor-pointer transition ${
                currency === 'USD'
                  ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                  : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-white'
              }`}
            >
              USD (Int&apos;l Card)
            </button>
          </div>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-[#0e1923] border border-[#1e2b36] text-[10px] font-mono text-[#7a8b99]">
          {isEastAfricaRegion
            ? 'East Africa Rail: M-Pesa Mobile Money, Airtel Money & Cards active in KES.'
            : isRestOfAfricaRegion
            ? 'Pan-Africa Cross-Border Rail: Checkout defaults to USD for Visa, Mastercard & USD virtual cards across NG, GH, ZA, EG & MA.'
            : 'Global Card Rail: Checkout defaults to USD for International Visa, Mastercard & Apple Pay worldwide.'}
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLaunching || isVerifyingTransaction}
        className="w-full py-2.5 px-4 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-60"
      >
        {isLaunching || isVerifyingTransaction ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {isVerifyingTransaction
                ? 'VERIFYING TRANSACTION WITH BACKEND HOOK...'
                : 'LAUNCHING PAYSTACK CHECKOUT...'}
            </span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>
              START PAYSTACK SUBSCRIPTION ({currency === 'KES' ? `KES ${displayAmountKes.toLocaleString()}` : `$${effectiveUsd.toLocaleString()} USD`})
            </span>
          </>
        )}
      </button>

      {/* Channel Troubleshooting Help (appears if popup closed / cancelled or merchant channels disabled) */}
      {showChannelTroubleshooting && (
        <div className="p-3 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/50 text-[11px] font-mono text-[#dce7f0] space-y-2">
          <div className="font-bold text-[#fbbf24]">
            Saw &quot;No active channel to process transaction&quot;?
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[#94a3b8]">
            <li>
              Make sure <strong className="text-white">KES (M-Pesa &amp; Cards)</strong> is selected above (USD requires separate International Card activation on Paystack).
            </li>
            <li>
              Keep channel set to <strong className="text-white">All</strong> so Paystack automatically shows every active method on your account.
            </li>
            <li>
              In your <strong className="text-white">Paystack Dashboard → Settings → Preferences → Payment Channels</strong>, ensure <strong className="text-white">Cards</strong> and/or <strong className="text-white">Mobile Money (M-Pesa)</strong> are toggled ON and your business compliance is live.
            </li>
          </ol>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {currency === 'USD' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCurrency('KES');
                  setChannel('all');
                  setShowChannelTroubleshooting(false);
                }}
                className="px-2.5 py-1 rounded bg-[#22d3a5] text-black font-bold text-[10px] cursor-pointer"
              >
                Switch to KES &amp; All Channels
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                const cleanEmail = (email || user?.email || 'operator@talentradar.io').trim();
                setIsLaunching(true);
                const res = await initiateCheckout({
                  tierId: resolvedTierId,
                  customerEmail: cleanEmail,
                  paymentMethod: channel === 'all' ? 'paystack' : channel,
                  channels: mapChannels(channel),
                  currency,
                  referralCode: activeReferralCode || undefined,
                  pppCountryCode: hasPppDiscount ? pppProfile.countryCode : undefined,
                });
                setIsLaunching(false);
                if (!res.success && res.message) {
                  setLocalError(res.message);
                }
              }}
              className="px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1e2b36] border border-[#38bdf8]/50 text-[#38bdf8] font-bold text-[10px] cursor-pointer"
            >
              Open Paystack Hosted Checkout ↗
            </button>
          </div>
        </div>
      )}

      {/* Live Status / Error Feedback */}
      {(localError || verificationError) && (
        <div className="flex items-start gap-2 text-[11px] font-mono p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{localError || verificationError}</span>
        </div>
      )}

      {(localStatusMsg || verificationStatus === 'verified') && !(localError || verificationError) && (
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono p-2 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{localStatusMsg || 'Transaction verified via backend hook'}</span>
          </span>
          {lastVerifiedTransaction?.reference && (
            <span className="text-[10px] opacity-80">{lastVerifiedTransaction.reference}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#7a8b99]">
        <button
          type="button"
          onClick={openReferralModal}
          className="flex items-center gap-1 text-[#fbbf24] hover:underline cursor-pointer"
        >
          <Gift className="w-3 h-3 shrink-0" />
          <span>Refer friends → Earn 20% + Free Pro Month</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const targetEmail = (email || user?.email || '').trim();
              if (!targetEmail) {
                openBillingPortal();
                return;
              }
              setLocalStatusMsg('Syncing Paystack customer subscription...');
              const res = await recoverSubscriptionByEmail(targetEmail);
              if (res.success) {
                setLocalStatusMsg(res.message);
                onSuccess?.(res.resolvedTier || tierDetails.targetTier, 'synced');
              } else {
                setLocalStatusMsg(null);
                setLocalError(res.message);
              }
            }}
            className="text-[#38bdf8] hover:text-white underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restore by Email</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={openBillingPortal}
            className="text-[#22d3a5] hover:text-white underline cursor-pointer"
          >
            Billing Portal
          </button>
        </div>
      </div>
    </div>
  );
}
