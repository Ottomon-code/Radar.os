import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Check,
  X,
  Zap,
  KeyRound,
  CheckCircle2,
  Crown,
  Receipt,
  Eye,
  Gift,
  Globe,
} from 'lucide-react';
import { useSubscription, SubscriptionTier } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import PaystackSubscriptionService from './PaystackSubscriptionService';
import { formatLocalizedCheckoutAmount } from '../utils/pppPricing';

export default function PaywallModal() {
  const {
    tier,
    isLocalDev,
    isOwner,
    ownerEmail,
    isPaywallOpen,
    paywallTriggerReason,
    billingCycle,
    activeReferralCode,
    referralDiscountPercent,
    pppProfile,
    isPppPricingEnabled,
    availablePppRegions,
    setPppPricingEnabled,
    setManualPppCountry,
    getTierPricing,
    closePaywall,
    openBillingPortal,
    openReferralModal,
    upgradeTier,
    downgradeToFree,
    setBillingCycle,
    applyBypassCode,
    ownerBypassUnlock,
    ownerPreviewFreeTier,
    verifiedPaymentInfo,
    refreshSubscriptionStatus,
  } = useSubscription();
  const { user } = useAuth();

  const proTierId = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';
  const agencyTierId = billingCycle === 'annual' ? 'agency_annual' : 'agency_monthly';
  const proPricing = getTierPricing(proTierId, { includeReferral: false });
  const agencyPricing = getTierPricing(agencyTierId, { includeReferral: false });
  const showLocalizedCurrency =
    pppProfile.localCurrencyHint === 'EUR' ||
    pppProfile.localCurrencyHint === 'GBP' ||
    pppProfile.localCurrencyHint === 'KES';
  const proLocalEstimate = formatLocalizedCheckoutAmount(
    proPricing.monthlyEquivalentUsd,
    pppProfile.localCurrencyHint
  );
  const agencyLocalEstimate = formatLocalizedCheckoutAmount(
    agencyPricing.monthlyEquivalentUsd,
    pppProfile.localCurrencyHint
  );

  const [promoCode, setPromoCode] = useState('');
  const [isRedeemingKey, setIsRedeemingKey] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [selectedCheckoutTier, setSelectedCheckoutTier] = useState<'pro' | 'sovereign'>('pro');
  const [justUpgradedTier, setJustUpgradedTier] = useState<SubscriptionTier | null>(null);

  if (!isPaywallOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim() || isRedeemingKey) return;
    setIsRedeemingKey(true);
    const res = await applyBypassCode(promoCode, user?.email || undefined);
    setIsRedeemingKey(false);
    setPromoFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setPromoFeedback(null);
      }, 3000);
    }
  };

  const handleReverifySubscription = async () => {
    if (!verifiedPaymentInfo?.reference && !verifiedPaymentInfo?.customerEmail && !user?.email) return;
    setIsSyncingStatus(true);
    await refreshSubscriptionStatus(
      verifiedPaymentInfo?.customerEmail || user?.email || undefined,
      verifiedPaymentInfo?.reference || verifiedPaymentInfo?.sessionId
    );
    setIsSyncingStatus(false);
  };

  const handleSelectPlanForCheckout = (targetTier: 'pro' | 'sovereign') => {
    setSelectedCheckoutTier(targetTier);
    const panel = document.getElementById('paystack-subscription-checkout-panel');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handlePaystackVerifiedSuccess = (resolvedTier: SubscriptionTier) => {
    setJustUpgradedTier(resolvedTier);
    setTimeout(() => {
      setJustUpgradedTier(null);
      closePaywall();
    }, 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0c131a] border-2 border-[#22d3a5]/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,165,0.25)] overflow-hidden my-auto text-[#dce7f0]">
        {/* Top Warning Cyber Stripe */}
        <div className="bg-gradient-to-r from-[#22d3a5] via-[#3b82f6] to-[#fbbf24] h-1.5 w-full" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#1e2b36] flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                <ShieldAlert className="w-5 h-5 text-[#22d3a5]" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40 font-bold tracking-widest uppercase">
                RESTRICTED TELEMETRY // CLEARANCE REQUIRED
              </span>
            </div>
            <h2 id="paywall-title" className="text-xl sm:text-2xl font-bold font-mono text-white">
              UPGRADE TO TALENT_RADAR<span className="text-[#22d3a5]">.PRO</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-[#7a8b99]">
              <span className="text-[#22d3a5] font-semibold">REASON FOR PROMPT:</span>
              <span className="text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded border border-[#fbbf24]/30">
                {paywallTriggerReason || 'Executive Compensation Telemetry & AI Triad Access'}
              </span>
            </div>
          </div>

          <button
            onClick={closePaywall}
            className="p-2 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition"
            aria-label="Close paywall modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Animation if checkout completed */}
        {justUpgradedTier ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#22d3a5]/20 border-2 border-[#22d3a5] text-[#22d3a5] flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-mono text-white">
              CLEARANCE ELEVATED TO {justUpgradedTier.toUpperCase()}
            </h3>
            <p className="text-sm font-mono text-[#22d3a5]">
              Authorization token registered. All orbital telemetry and AI Triad features unlocked.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Verified Owner Sovereign Override Banner */}
            {isOwner && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fbbf24]/15 p-3.5 rounded-xl border border-[#fbbf24]/50 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#fbbf24]">
                  <Crown className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>FOUNDER OWNER VERIFIED ({ownerEmail}):</strong> Bypass Paystack checkout or preview the free paywall.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await ownerBypassUnlock();
                      setPromoFeedback(res);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Sovereign Free</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await ownerPreviewFreeTier();
                      setPromoFeedback(res);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#38bdf8]/50 text-[#38bdf8] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Free Paywall</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Referral Invite Discount Banner or Refer & Earn CTA */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111a22] p-3 rounded-xl border border-[#fbbf24]/30 text-xs font-mono">
              {activeReferralCode ? (
                <div className="flex items-center gap-2 text-[#22d3a5]">
                  <Gift className="w-4 h-4 text-[#fbbf24] shrink-0" />
                  <span>
                    <strong>{referralDiscountPercent}% REFERRAL DISCOUNT ACTIVE ({activeReferralCode}):</strong>{' '}
                    Automatically deducted below at Paystack checkout.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#dce7f0]">
                  <Gift className="w-4 h-4 text-[#fbbf24] shrink-0" />
                  <span>
                    Refer friends to give <strong className="text-[#22d3a5]">20% off</strong> &amp; earn{' '}
                    <strong className="text-[#fbbf24]">20% commission + Free Pro Month</strong>.
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  closePaywall();
                  openReferralModal();
                }}
                className="px-3 py-1 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] font-bold text-[11px] cursor-pointer"
              >
                {activeReferralCode ? 'Manage / Share Referrals' : 'Get Referral Link →'}
              </button>
            </div>

            {/* Billing Toggle (Monthly vs Annual) & Region-Aware PPP Parity Banner */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
                <div className="text-xs font-mono">
                  <span className="text-white font-semibold">SELECT BILLING CADENCE:</span>
                  <span className="text-[#7a8b99] ml-2">
                    Enterprise-grade security • Cancel anytime
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#0a0f14] p-1 rounded-lg border border-[#1e2b36] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-[#22d3a5] text-black shadow'
                        : 'text-[#7a8b99] hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      billingCycle === 'annual'
                        ? 'bg-[#22d3a5] text-black shadow'
                        : 'text-[#7a8b99] hover:text-white'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#fbbf24] text-black font-bold">
                      SAVE 35%
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0e1923] px-3.5 py-2.5 rounded-xl border border-[#38bdf8]/40 text-xs font-mono">
                <div className="flex items-start sm:items-center gap-2">
                  <Globe className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <div className="text-[#dce7f0]">
                      <span className="text-[#38bdf8] font-bold">REGION-AWARE PPP:</span>{' '}
                      <strong className="text-white">
                        {pppProfile.countryName} ({pppProfile.countryCode})
                      </strong>{' '}
                      {pppProfile.isEligibleForPpp ? (
                        <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-[#22d3a5]/20 border border-[#22d3a5]/40 text-[#22d3a5] text-[10px] font-bold">
                          {isPppPricingEnabled
                            ? `-${pppProfile.discountPercent}% PARITY APPLIED`
                            : `${pppProfile.discountPercent}% ELIGIBLE (PAUSED)`}
                        </span>
                      ) : (
                        <span className="text-[#7a8b99] text-[11px]">• Global Baseline Tier (0% PPP)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#7a8b99]">{pppProfile.bandLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label="Select PPP Country Region"
                    value={pppProfile.countryCode}
                    onChange={(e) => setManualPppCountry(e.target.value || null)}
                    className="bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-2 py-1 text-[11px] text-[#dce7f0] outline-none cursor-pointer"
                  >
                    {!availablePppRegions.some((r) => r.countryCode === pppProfile.countryCode) && (
                      <option value={pppProfile.countryCode}>
                        {pppProfile.countryName} ({pppProfile.countryCode})
                      </option>
                    )}
                    {availablePppRegions.map((reg) => (
                      <option key={reg.countryCode} value={reg.countryCode}>
                        {reg.countryName} ({reg.countryCode})
                      </option>
                    ))}
                    {pppProfile.detectionSource === 'manual_override' && (
                      <option value="">↻ Reset to Auto-Detect</option>
                    )}
                  </select>
                  {pppProfile.isEligibleForPpp && (
                    <button
                      type="button"
                      onClick={() => setPppPricingEnabled(!isPppPricingEnabled)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                        isPppPricingEnabled
                          ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                          : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-white'
                      }`}
                    >
                      {isPppPricingEnabled ? 'PPP ON' : 'PPP OFF'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Tier Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tier 1: Recruit (Free) */}
              <div
                className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                  tier === 'recruit'
                    ? 'bg-[#111a22]/90 border-[#7a8b99]/40'
                    : 'bg-[#0e161f]/50 border-[#1e2b36]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#7a8b99] font-bold">BASE TIER</span>
                    {tier === 'recruit' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7a8b99]/20 text-[#dce7f0] border border-[#7a8b99]/40">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white">RECRUIT</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-2xl font-bold font-mono text-white">$0</span>
                    <span className="text-xs font-mono text-[#7a8b99]"> / forever</span>
                  </div>
                  <p className="text-xs font-mono text-[#7a8b99] mb-4">
                    Basic entry level signal scouting for early engineers and researchers.
                  </p>

                  <ul className="space-y-2 text-xs font-mono text-[#7a8b99]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>3 orbital radar searches per session</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>Standard public market news</span>
                    </li>
                    <li className="flex items-center gap-2 text-[#f87171]">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Comp capped at $280k (high bands masked)</span>
                    </li>
                    <li className="flex items-center gap-2 text-[#f87171]">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>No autonomous AI Triad execution</span>
                    </li>
                    <li className="flex items-center gap-2 text-[#f87171]">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>StealthNet outreach locked</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5">
                  {tier === 'recruit' ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99] text-xs font-mono cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={downgradeToFree}
                      className="w-full py-2 rounded-lg bg-[#111a22] border border-[#1e2b36] text-[#7a8b99] hover:text-white text-xs font-mono transition"
                    >
                      Downgrade to Free
                    </button>
                  )}
                </div>
              </div>

              {/* Tier 2: Pro Operator (RECOMMENDED) */}
              <div
                className={`relative rounded-xl border-2 p-5 flex flex-col justify-between transition shadow-xl ${
                  tier === 'pro'
                    ? 'bg-[#152330] border-[#22d3a5] shadow-[0_0_20px_rgba(34,211,165,0.25)]'
                    : 'bg-[#111e29] border-[#22d3a5]/70 hover:border-[#22d3a5]'
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#22d3a5] to-[#3b82f6] text-black text-[10px] font-bold font-mono tracking-wider shadow">
                  ★ MOST POPULAR // COMBAT READY
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#22d3a5] font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> PRO OPERATOR
                    </span>
                    {tier === 'pro' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/50 font-bold">
                        ACTIVE CLEARANCE
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">OPERATOR CLEARANCE</h3>
                  <div className="mt-2 mb-4">
                    {proPricing.pppApplied && (
                      <span className="text-sm font-mono text-[#7a8b99] line-through mr-2">
                        ${billingCycle === 'annual' ? '32' : '49'}
                      </span>
                    )}
                    <span className="text-3xl font-bold font-mono text-white">
                      ${proPricing.monthlyEquivalentUsd}
                    </span>
                    <span className="text-xs font-mono text-[#7a8b99]">
                      {' '}
                      / month {billingCycle === 'annual' ? `(billed $${proPricing.afterPppUsd}/yr)` : ''}
                    </span>
                    {showLocalizedCurrency && (
                      <div className="text-[11px] font-mono text-[#22d3a5] mt-1 font-semibold">
                        ≈ {proLocalEstimate.formatted} / mo ({pppProfile.localCurrencyHint} regional rail)
                      </div>
                    )}
                    {proPricing.pppApplied && (
                      <div className="text-[10px] font-mono text-[#38bdf8] mt-1 font-bold">
                        Region PPP (-{proPricing.pppDiscountPercent}% {proPricing.pppCountryCode}) Applied
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#dce7f0] mb-4">
                    Full unmasked telemetry, 4-Agent Autonomous AI Triad, and executive defense radar.
                  </p>

                  <ul className="space-y-2.5 text-xs font-mono text-[#dce7f0]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      <strong className="text-white">UNMASKED $300k - $600k+ Salaries</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      <span>Unlimited orbital radar scans &amp; alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      <span>Autonomous 4-Agent AI Triad Synthesis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      <span>StealthNet ZK Direct Candidate Outreach</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22d3a5] shrink-0" />
                      <span>5-Year Career Trajectory &amp; Equity Simulation</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlanForCheckout('pro')}
                    disabled={tier === 'pro'}
                    className={`w-full py-2.5 px-3 rounded-lg font-bold font-mono text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                      tier === 'pro'
                        ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 cursor-default'
                        : selectedCheckoutTier === 'pro'
                        ? 'bg-[#22d3a5] hover:bg-[#1db890] text-black ring-2 ring-[#22d3a5]/50'
                        : 'bg-[#17303d] hover:bg-[#22d3a5] hover:text-black text-[#22d3a5] border border-[#22d3a5]/50'
                    }`}
                  >
                    {tier === 'pro' ? (
                      'CURRENT ACTIVE TIER'
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        {selectedCheckoutTier === 'pro'
                          ? 'SELECTED FOR CHECKOUT ↓'
                          : 'SELECT PRO OPERATOR'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tier 3: Sovereign Partner (Agency & Teams) */}
              <div
                className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                  tier === 'sovereign'
                    ? 'bg-[#1c180e] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                    : 'bg-[#14120d]/70 border-[#fbbf24]/40 hover:border-[#fbbf24]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#fbbf24] font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> SOVEREIGN
                    </span>
                    {tier === 'sovereign' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white">SOVEREIGN PARTNER</h3>
                  <div className="mt-2 mb-4">
                    {agencyPricing.pppApplied && (
                      <span className="text-xs font-mono text-[#7a8b99] line-through mr-1.5">
                        ${billingCycle === 'annual' ? '149' : '199'}
                      </span>
                    )}
                    <span className="text-2xl font-bold font-mono text-white">
                      ${agencyPricing.monthlyEquivalentUsd}
                    </span>
                    <span className="text-xs font-mono text-[#7a8b99]">
                      {' '}
                      / month {billingCycle === 'annual' ? `(billed $${agencyPricing.afterPppUsd}/yr)` : ''}
                    </span>
                    {showLocalizedCurrency && (
                      <div className="text-[11px] font-mono text-[#22d3a5] mt-1 font-semibold">
                        ≈ {agencyLocalEstimate.formatted} / mo ({pppProfile.localCurrencyHint} regional rail)
                      </div>
                    )}
                    {agencyPricing.pppApplied && (
                      <div className="text-[10px] font-mono text-[#38bdf8] mt-0.5 font-bold">
                        Region PPP (-{agencyPricing.pppDiscountPercent}% {agencyPricing.pppCountryCode}) Applied
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#7a8b99] mb-4">
                    For recruiting agencies, executive search teams, and technical talent leaders.
                  </p>

                  <ul className="space-y-2 text-xs font-mono text-[#dce7f0]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <span>All Operator Pro Capabilities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <strong className="text-[#fbbf24]">Multi-Seat Agency Team Access</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <span>Branded Client Comp Dossiers (PDF)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <span>Priority Agency Pilot Onboarding</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleSelectPlanForCheckout('sovereign')}
                    disabled={tier === 'sovereign'}
                    className={`w-full py-2 rounded-lg font-bold font-mono text-xs transition cursor-pointer ${
                      tier === 'sovereign'
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 cursor-default'
                        : selectedCheckoutTier === 'sovereign'
                        ? 'bg-[#fbbf24] hover:bg-[#eab308] text-black shadow ring-2 ring-[#fbbf24]/50'
                        : 'bg-[#251f10] hover:bg-[#fbbf24] hover:text-black text-[#fbbf24] border border-[#fbbf24]/50'
                    }`}
                  >
                    {tier === 'sovereign'
                      ? 'ACTIVE SOVEREIGN'
                      : selectedCheckoutTier === 'sovereign'
                      ? 'SELECTED FOR CHECKOUT ↓'
                      : 'SELECT SOVEREIGN PARTNER'}
                  </button>
                </div>
              </div>
            </div>

            {/* Paystack Subscription Checkout & Backend Verification Hook */}
            <div
              id="paystack-subscription-checkout-panel"
              className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-[#1e2b36]"
            >
              <div className="md:col-span-7">
                <PaystackSubscriptionService
                  selectedTier={selectedCheckoutTier}
                  billingCycle={billingCycle}
                  defaultEmail={user?.email || verifiedPaymentInfo?.customerEmail || ''}
                  onSuccess={(resolvedTier) => handlePaystackVerifiedSuccess(resolvedTier)}
                />
              </div>

              {/* Clearance Bypass Token / Enterprise Access Key */}
              <div className="md:col-span-5 bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#7a8b99] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#fbbf24]" /> VIP / ENTERPRISE PASSCODE:
                  </span>
                  <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter issued license key"
                      className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-xs font-mono rounded-lg px-2.5 py-1.5 text-white placeholder-[#7a8b99] outline-none uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isRedeemingKey}
                      className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 disabled:opacity-60 border border-[#22d3a5]/50 text-[#22d3a5] text-xs font-mono font-bold transition shrink-0 cursor-pointer"
                    >
                      {isRedeemingKey ? 'VERIFYING...' : 'APPLY'}
                    </button>
                  </form>

                  {promoFeedback && (
                    <div
                      className={`text-[10px] font-mono p-1.5 rounded border ${
                        promoFeedback.success
                          ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5]'
                          : 'bg-[#f87171]/15 border-[#f87171] text-[#f87171]'
                      }`}
                    >
                      {promoFeedback.message}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1e2b36]/80 space-y-1.5 text-[10px] font-mono text-[#7a8b99]">
                  <div className="flex items-center justify-between gap-2 text-[#dce7f0]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>Paystack Webhook Ledger</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {(verifiedPaymentInfo?.reference || verifiedPaymentInfo?.customerEmail || user?.email) && (
                        <button
                          type="button"
                          onClick={handleReverifySubscription}
                          disabled={isSyncingStatus}
                          className="text-[10px] text-[#22d3a5] hover:text-white underline cursor-pointer disabled:opacity-50"
                        >
                          {isSyncingStatus ? 'Syncing...' : 'Re-verify'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          closePaywall();
                          openBillingPortal();
                        }}
                        className="text-[10px] text-[#38bdf8] hover:text-white underline flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Billing Portal</span>
                      </button>
                    </div>
                  </div>
                  <p className="break-all">
                    {verifiedPaymentInfo?.isVerified
                      ? `Verified ref: ${verifiedPaymentInfo.reference || verifiedPaymentInfo.sessionId}${
                          verifiedPaymentInfo.lastWebhookEvent
                            ? ` • Event: ${verifiedPaymentInfo.lastWebhookEvent}`
                            : ''
                        }`
                      : 'HMAC-SHA512 webhook, /api/checkout/verify-session & Firestore ledger enforce server-verified Paystack access (M-Pesa & Int’l Cards).'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Controls for local development evaluation only */}
            {isLocalDev && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg text-xs font-mono">
                <span className="text-[#7a8b99] text-[11px]">
                  LOCALHOST DEVELOPER CONTROLS:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => upgradeTier('pro')}
                    className="px-2.5 py-1 rounded bg-[#22d3a5]/10 hover:bg-[#22d3a5]/20 border border-[#22d3a5]/40 text-[#22d3a5] text-[11px] font-bold transition"
                  >
                    Instant Unlock Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => upgradeTier('sovereign')}
                    className="px-2.5 py-1 rounded bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-[11px] font-bold transition"
                  >
                    Instant Unlock Sovereign
                  </button>
                  <button
                    type="button"
                    onClick={() => downgradeToFree()}
                    className="px-2.5 py-1 rounded bg-[#f87171]/10 hover:bg-[#f87171]/20 border border-[#f87171]/40 text-[#f87171] text-[11px] font-bold transition"
                  >
                    Reset to Recruit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
