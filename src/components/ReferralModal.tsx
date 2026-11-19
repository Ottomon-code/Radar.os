import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Copy,
  Check,
  X,
  Users,
  DollarSign,
  Award,
  MousePointerClick,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  ExternalLink,
  Tag,
  Unlock,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { getPublicShareBaseUrl } from '../utils/serverConfig';
import { auth } from '../firebase';
import FunctionalQRCode from './FunctionalQRCode';

interface ConversionEntry {
  reference: string;
  maskedBuyerEmail: string;
  tierId: string;
  paidUsd: number;
  commissionUsd: number;
  convertedAt: string;
}

interface ReferralProfile {
  code: string;
  referrerEmail: string;
  inviteUrl: string;
  clicks: number;
  paidConversions: number;
  availableMonthCredits: number;
  totalMonthCreditsClaimed: number;
  totalCommissionUsd: number;
  totalCommissionKes: number;
  conversions: ConversionEntry[];
}

interface OwnerOverview {
  summary: {
    totalReferrers: number;
    totalClicks: number;
    totalPaidConversions: number;
    totalCommissionOwedUsd: number;
    totalFreeMonthsEarned: number;
    totalFreeMonthsClaimed: number;
  };
  referrers: Array<{
    code: string;
    referrerEmail: string;
    clicks: number;
    paidConversions: number;
    availableMonthCredits: number;
    totalMonthCreditsClaimed: number;
    totalCommissionUsd: number;
  }>;
}

export default function ReferralModal() {
  const { user } = useAuth();
  const {
    isReferralModalOpen,
    closeReferralModal,
    isOwner,
    activeReferralCode,
    referralDiscountPercent,
    applyReferralCode,
    clearReferralCode,
    openPaywall,
    claimReferralCreditActivation,
  } = useSubscription();

  const [emailInput, setEmailInput] = useState<string>(user?.email || '');
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimingCredit, setClaimingCredit] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const [buyerCodeInput, setBuyerCodeInput] = useState<string>(activeReferralCode || '');
  const [applyingBuyerCode, setApplyingBuyerCode] = useState(false);
  const [buyerCodeFeedback, setBuyerCodeFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [ownerOverview, setOwnerOverview] = useState<OwnerOverview | null>(null);

  const fetchOrRegisterProfile = useCallback(
    async (targetEmail: string, requestedCode?: string) => {
      const clean = targetEmail.trim();
      if (!clean || !clean.includes('@')) return;
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const res = await fetch('/api/referrals/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clean,
            uid: user?.uid || undefined,
            ...(requestedCode ? { customCode: requestedCode } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.referral) {
          setProfileError(data?.error || 'Could not load referral link.');
        } else {
          setProfile(data.referral);
          setCustomCodeInput(data.referral.code);
        }
      } catch (err: any) {
        setProfileError(err?.message || 'Network error registering referral link.');
      } finally {
        setLoadingProfile(false);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    if (!isReferralModalOpen) return;
    if (user?.email) {
      setEmailInput(user.email);
      fetchOrRegisterProfile(user.email);
    }
    if (activeReferralCode) {
      setBuyerCodeInput(activeReferralCode);
    }
  }, [isReferralModalOpen, user?.email, activeReferralCode, fetchOrRegisterProfile]);

  useEffect(() => {
    if (!isReferralModalOpen || !isOwner || !auth.currentUser) return;
    auth.currentUser
      .getIdToken()
      .then((idToken) =>
        fetch('/api/referrals/owner/overview', {
          headers: { Authorization: `Bearer ${idToken}` },
        })
      )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setOwnerOverview(data);
      })
      .catch(() => {});
  }, [isReferralModalOpen, isOwner]);

  if (!isReferralModalOpen) return null;

  const publicBase = getPublicShareBaseUrl();
  const shareUrl = profile ? `${publicBase}/r/${profile.code}` : '';

  const handleCopy = (value: string, type: 'url' | 'code') => {
    navigator.clipboard?.writeText(value);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClaimCredit = async () => {
    const email = (profile?.referrerEmail || emailInput || user?.email || '').trim();
    if (!email) return;
    setClaimingCredit(true);
    setClaimMessage(null);
    setProfileError(null);
    try {
      const res = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: profile?.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setProfileError(data?.error || 'Could not claim free month credit.');
      } else {
        claimReferralCreditActivation(data.reference, data.tierId, data.customerEmail);
        setClaimMessage(data.message || '1 Free Pro Month Activated!');
        await fetchOrRegisterProfile(email);
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Network error claiming referral credit.');
    } finally {
      setClaimingCredit(false);
    }
  };

  const handleApplyFriendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerCodeInput.trim()) return;
    setApplyingBuyerCode(true);
    setBuyerCodeFeedback(null);
    const res = await applyReferralCode(buyerCodeInput, user?.email || emailInput || undefined);
    setApplyingBuyerCode(false);
    if (res.valid) {
      setBuyerCodeFeedback({
        ok: true,
        msg: `Code ${res.code} active! ${res.discountPercent}% launch discount applied to your first Paystack subscription.`,
      });
    } else {
      setBuyerCodeFeedback({
        ok: false,
        msg: res.error || 'Invalid or self-owned referral code.',
      });
    }
  };

  const shareText = encodeURIComponent(
    `Unlock 20% off TalentRadar.OS — 3D Geospatial AI Job Radar, Salary Trajectories & Paystack Pro Clearance:`
  );
  const encodedShareUrl = encodeURIComponent(shareUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0c131a] border-2 border-[#fbbf24]/50 rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.2)] overflow-hidden my-auto text-[#dce7f0]">
        <div className="bg-gradient-to-r from-[#fbbf24] via-[#22d3a5] to-[#38bdf8] h-1.5 w-full" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#1e2b36] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/40">
                <Gift className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold uppercase tracking-wider">
                DOUBLE-SIDED REFERRAL ENGINE
              </span>
            </div>
            <h2 id="referral-modal-title" className="text-xl sm:text-2xl font-bold font-mono text-white">
              REFER &amp; EARN <span className="text-[#fbbf24]">20% + FREE PRO MONTHS</span>
            </h2>
            <p className="text-xs font-mono text-[#7a8b99]">
              Give friends <strong className="text-[#22d3a5]">20% OFF</strong> their first Paystack checkout. Earn{' '}
              <strong className="text-[#fbbf24]">20% commission + 1 Free Pro Month</strong> on every verified paid conversion.
            </p>
          </div>

          <button
            type="button"
            onClick={closeReferralModal}
            className="p-2 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition cursor-pointer"
            aria-label="Close referral modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Email & Custom Code Registration Bar */}
          <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22d3a5]" />
              <span>1. GENERATE OR MANAGE YOUR REFERRAL INVITE LINK</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchOrRegisterProfile(emailInput, customCodeInput);
              }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Your email (e.g. alex@domain.com)"
                className="sm:col-span-5 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-[#7a8b99] outline-none"
              />
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                placeholder="Custom code (optional, e.g. ALEX20)"
                className="sm:col-span-4 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#fbbf24] text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-[#7a8b99] outline-none uppercase"
              />
              <button
                type="submit"
                disabled={loadingProfile}
                className="sm:col-span-3 px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                {loadingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                <span>{profile ? 'UPDATE CODE' : 'GET MY LINK'}</span>
              </button>
            </form>

            {profileError && (
              <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {claimMessage && (
              <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-[#22d3a5]/15 border border-[#22d3a5]/50 text-[#22d3a5]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{claimMessage}</span>
              </div>
            )}
          </div>

          {/* Active Referral Link & Stats Dashboard */}
          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 8 cols: Share URL + KPI cards */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-[#0e1720] p-4 rounded-xl border border-[#22d3a5]/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-[#7a8b99]">YOUR CLEAN REFERRAL URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.code, 'code')}
                      className="px-2.5 py-1 rounded bg-[#fbbf24]/15 border border-[#fbbf24]/50 text-[#fbbf24] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>CODE: {profile.code}</span>
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-[#0a0f14] border border-[#1e2b36] text-xs font-mono rounded-lg px-3 py-2 text-[#22d3a5] select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(shareUrl, 'url')}
                      className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'COPIED' : 'COPY LINK'}</span>
                    </button>
                  </div>

                  {/* Quick Social Share Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                    <span className="text-[#7a8b99]">SHARE VIA:</span>
                    <a
                      href={`https://wa.me/?text=${shareText}%20${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/40 text-[#22d3a5] inline-flex items-center gap-1"
                    >
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/40 text-[#38bdf8] inline-flex items-center gap-1"
                    >
                      <span>X / Twitter</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 border border-[#3b82f6]/40 text-[#93c5fd] inline-flex items-center gap-1"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                  <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>INVITE CLICKS</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1">{profile.clicks}</div>
                  </div>
                  <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#22d3a5]" />
                      <span>PAID SUBSCRIBERS</span>
                    </div>
                    <div className="text-xl font-bold text-[#22d3a5] mt-1">{profile.paidConversions}</div>
                  </div>
                  <div className="bg-[#111a22] p-3 rounded-xl border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#fbbf24]" />
                      <span>20% COMMISSION</span>
                    </div>
                    <div className="text-xl font-bold text-[#fbbf24] mt-1">
                      ${profile.totalCommissionUsd.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#7a8b99]">
                      ≈ KES {profile.totalCommissionKes.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#111a22] p-3 rounded-xl border border-[#fbbf24]/40 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span>FREE PRO MONTHS</span>
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {profile.availableMonthCredits}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={profile.availableMonthCredits < 1 || claimingCredit}
                      onClick={handleClaimCredit}
                      className="mt-2 w-full py-1 px-2 rounded bg-[#fbbf24] hover:bg-[#eab308] disabled:bg-[#1e2b36] disabled:text-[#7a8b99] text-black font-bold text-[10px] transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      {claimingCredit ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      <span>CLAIM FREE MONTH</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Scannable Invite QR Code */}
              <div className="lg:col-span-4 bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] flex flex-col items-center justify-center text-center space-y-2.5">
                <FunctionalQRCode value={shareUrl} size={136} />
                <div className="text-xs font-mono font-bold text-white">SCANNABLE 20% OFF INVITE</div>
                <p className="text-[10px] font-mono text-[#7a8b99]">
                  Credits are verified server-side only after Paystack settles a real non-self subscription.
                </p>
              </div>
            </div>
          )}

          {/* Referred Subscriber Code Entry (Redeem 20% Off First Checkout) */}
          <div className="bg-[#111a22] p-4 rounded-xl border border-[#22d3a5]/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#22d3a5]" />
                <span>2. WERE YOU REFERRED? APPLY A FRIEND&apos;S CODE FOR 20% OFF</span>
              </div>
              {activeReferralCode && (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#22d3a5]/20 border border-[#22d3a5]/50 text-[#22d3a5] font-bold">
                    ACTIVE: {activeReferralCode} (-{referralDiscountPercent}%)
                  </span>
                  <button
                    type="button"
                    onClick={clearReferralCode}
                    className="text-[#f87171] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleApplyFriendCode} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={buyerCodeInput}
                onChange={(e) => setBuyerCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter invite code (e.g. TR-XXXXXX)"
                className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-[#7a8b99] outline-none uppercase"
              />
              <button
                type="submit"
                disabled={applyingBuyerCode}
                className="px-4 py-2 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5]/60 text-[#22d3a5] font-mono font-bold text-xs transition cursor-pointer shrink-0"
              >
                {applyingBuyerCode ? 'VALIDATING...' : 'APPLY 20% OFF'}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeReferralModal();
                  openPaywall('Checkout with 20% Referral Savings');
                }}
                className="px-4 py-2 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-mono font-bold text-xs transition cursor-pointer shrink-0"
              >
                GO TO PAYSTACK CHECKOUT →
              </button>
            </form>

            {buyerCodeFeedback && (
              <div
                className={`text-xs font-mono p-2 rounded border ${
                  buyerCodeFeedback.ok
                    ? 'bg-[#22d3a5]/15 border-[#22d3a5]/50 text-[#22d3a5]'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                {buyerCodeFeedback.msg}
              </div>
            )}
          </div>

          {/* Recent Verified Paid Conversions Table */}
          {profile && profile.conversions.length > 0 && (
            <div className="bg-[#0e1720] p-4 rounded-xl border border-[#1e2b36] space-y-2">
              <div className="text-xs font-mono font-bold text-white">VERIFIED PAID REFERRAL LEDGER</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="text-[#7a8b99] border-b border-[#1e2b36]">
                    <tr>
                      <th className="py-1.5 pr-3">Subscriber</th>
                      <th className="py-1.5 pr-3">Tier</th>
                      <th className="py-1.5 pr-3">Paid</th>
                      <th className="py-1.5 pr-3">20% Earned</th>
                      <th className="py-1.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2b36]/60">
                    {profile.conversions.map((c) => (
                      <tr key={c.reference}>
                        <td className="py-1.5 pr-3 text-[#dce7f0]">{c.maskedBuyerEmail}</td>
                        <td className="py-1.5 pr-3 text-[#38bdf8]">{c.tierId}</td>
                        <td className="py-1.5 pr-3 text-white">${c.paidUsd.toFixed(2)}</td>
                        <td className="py-1.5 pr-3 text-[#22d3a5] font-bold">
                          +${c.commissionUsd.toFixed(2)} + 1 Free Mo
                        </td>
                        <td className="py-1.5 text-[#7a8b99]">{new Date(c.convertedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verified Owner Global Referral Overview */}
          {isOwner && ownerOverview && (
            <div className="bg-[#191408] p-4 rounded-xl border border-[#fbbf24]/40 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs font-bold text-[#fbbf24]">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  <span>OWNER REFERRAL LEDGER OVERVIEW</span>
                </span>
                <span>
                  {ownerOverview.summary.totalReferrers} Referrers • {ownerOverview.summary.totalPaidConversions}{' '}
                  Conversions • ${ownerOverview.summary.totalCommissionOwedUsd.toFixed(2)} Commissions
                </span>
              </div>
              {ownerOverview.referrers.length > 0 && (
                <div className="text-[11px] text-[#dce7f0] space-y-1 max-h-32 overflow-y-auto">
                  {ownerOverview.referrers.slice(0, 8).map((r) => (
                    <div key={r.code} className="flex items-center justify-between border-b border-[#fbbf24]/15 pb-1">
                      <span>
                        <strong>{r.code}</strong> ({r.referrerEmail})
                      </span>
                      <span className="text-[#22d3a5]">
                        {r.clicks} clicks • {r.paidConversions} paid • ${r.totalCommissionUsd.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
