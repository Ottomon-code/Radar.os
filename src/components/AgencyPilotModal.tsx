import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Crown,
  X,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaystackSubscriptionService from './PaystackSubscriptionService';

interface AgencyPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: (agencyDetails: any) => void;
}

export default function AgencyPilotModal({ isOpen, onClose, onActivated }: AgencyPilotModalProps) {
  const { user } = useAuth();

  const [agencyName, setAgencyName] = useState('');
  const [recruiterName, setRecruiterName] = useState(user?.displayName || '');
  const [workEmail, setWorkEmail] = useState(user?.email || '');
  const [specialization, setSpecialization] = useState('Frontier AI & High-Performance Compute');
  const [teamSize, setTeamSize] = useState('5 - 15 Retained Search Consultants');
  const [isActivating, setIsActivating] = useState(false);
  const [step, setStep] = useState<'form' | 'checkout' | 'activated'>('form');
  const [leadId, setLeadId] = useState<string>('');
  const [verifiedRef, setVerifiedRef] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivatePilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !workEmail.trim()) return;

    setIsActivating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/agency-pilot/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          recruiterName: recruiterName.trim(),
          workEmail: workEmail.trim(),
          specialization,
          teamSize,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Could not register agency details.');
      }
      setLeadId(data.leadId || `AGY-${Date.now().toString(36).toUpperCase()}`);
      setStep('checkout');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to register firm details.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in font-mono text-xs text-[#dce7f0]"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-[#0c131a] border-2 border-[#38bdf8]/70 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.25)] overflow-hidden my-auto">
        {/* Top Accent Stripe */}
        <div className="bg-gradient-to-r from-[#38bdf8] via-[#22d3a5] to-[#fbbf24] h-1.5 w-full" />

        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e2b36] flex items-start justify-between gap-4 bg-[#0f1720]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                <Building2 className="w-4 h-4 text-[#38bdf8]" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 font-bold uppercase tracking-wider">
                CORPORATE SEARCH AGENCY ONBOARDING
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
                PAYSTACK VERIFIED ACCESS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Activate Sovereign Search Agency License
            </h2>
            <p className="text-xs text-[#7a8b99] mt-0.5 font-sans">
              Designed for retained boutique headhunters, executive search partners, and talent venture funds placing $300k - $600k+ leaders.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {step === 'activated' ? (
            <div className="p-8 text-center space-y-4 bg-[#11202e] border border-[#38bdf8] rounded-xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#38bdf8]/20 border-2 border-[#38bdf8] text-[#38bdf8] flex items-center justify-center mx-auto animate-bounce">
                <Crown className="w-10 h-10 text-[#38bdf8]" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                SOVEREIGN AGENCY LICENSE VERIFIED!
              </h3>
              <p className="text-xs text-[#38bdf8] max-w-md mx-auto">
                Welcome, <strong>{recruiterName}</strong> ({agencyName}). Paystack payment reference{' '}
                <span className="text-white font-bold">{verifiedRef}</span> has been confirmed by the backend webhook ledger.
              </p>
              <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg max-w-md mx-auto text-left space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7a8b99]">AGENCY REGISTRATION ID:</span>
                  <span className="text-[#22d3a5] font-bold">{leadId}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7a8b99]">PAYSTACK REFERENCE:</span>
                  <span className="text-white">{verifiedRef}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7a8b99]">CLIENT SECTOR:</span>
                  <span className="text-[#fbbf24]">{specialization}</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold transition shadow-lg cursor-pointer"
                >
                  START SOURCING EXECUTIVE CANDIDATES
                </button>
              </div>
            </div>
          ) : step === 'checkout' ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#0a0f14] border border-[#38bdf8]/40 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[#38bdf8] font-bold block">
                    STEP 2 OF 2 // COMPLETE PAYSTACK AUTHORIZATION ({leadId})
                  </span>
                  <span className="text-xs text-white">
                    {agencyName} ({workEmail})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-[11px] text-[#7a8b99] hover:text-white underline cursor-pointer"
                >
                  Edit firm details
                </button>
              </div>

              <PaystackSubscriptionService
                selectedTier="sovereign"
                selectedTierId="agency_monthly"
                defaultEmail={workEmail}
                onSuccess={(_tier, reference) => {
                  setVerifiedRef(reference);
                  setStep('activated');
                  onActivated?.({ agencyName, recruiterName, workEmail, specialization, reference });
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleActivatePilot} className="space-y-4">
              <div className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-3">
                <span className="text-xs font-bold text-[#38bdf8] flex items-center gap-1.5 border-b border-[#1e2b36] pb-2">
                  <Briefcase className="w-4 h-4" /> RECRUITMENT FIRM DETAILS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">SEARCH FIRM / AGENCY NAME *</label>
                    <input
                      type="text"
                      required
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="e.g. Apex Executive Search Partners"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">MANAGING PARTNER / RECRUITER NAME *</label>
                    <input
                      type="text"
                      required
                      value={recruiterName}
                      onChange={(e) => setRecruiterName(e.target.value)}
                      placeholder="e.g. Jane Doe, Partner"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded p-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">CORPORATE WORK EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="partner@searchfirm.com"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">RETAINED SEARCH SPECIALIZATION</label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded p-2 text-white outline-none cursor-pointer"
                    >
                      <option value="Frontier AI & High-Performance Compute">Frontier AI & High-Performance Compute</option>
                      <option value="Quantitative Finance & Low Latency Systems">Quantitative Finance & Low Latency Systems</option>
                      <option value="Autonomous Robotics & Embedded Vision">Autonomous Robotics & Embedded Vision</option>
                      <option value="Zero-Trust Defense & Sovereign Infrastructure">Zero-Trust Defense & Sovereign Infrastructure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">FIRM CONSULTANT HEADCOUNT</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-white outline-none cursor-pointer"
                  >
                    <option value="Solo Retained Partner">Solo Retained Partner</option>
                    <option value="2 - 5 Search Consultants">2 - 5 Search Consultants</option>
                    <option value="5 - 15 Retained Search Consultants">5 - 15 Retained Search Consultants</option>
                    <option value="15+ Global Practice Leads">15+ Global Practice Leads</option>
                  </select>
                </div>
              </div>

              {/* What is Included in Sovereign Agency License */}
              <div className="bg-[#0a0f14] p-4 rounded-xl border border-[#1e2b36] space-y-2">
                <span className="text-[10px] font-bold text-[#7a8b99] block">
                  INCLUDED WITH YOUR PAYSTACK-VERIFIED SOVEREIGN AGENCY ACCESS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#dce7f0]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                    <span>Unmasked $300k–$600k+ Executive Comp Bands</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                    <span>StealthNet Candidate Anonymous Outreach</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                    <span>Export Vector PDF Dossiers for Clients</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                    <span>Autonomous AI Triad Offer Negotiation Scripting</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[11px]">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e2b36]">
                <div className="text-[11px] text-[#7a8b99]">
                  Paystack Card, M-Pesa &amp; Bank EFT Supported • Cancel anytime
                </div>
                <button
                  type="submit"
                  disabled={isActivating || !agencyName || !workEmail}
                  className="px-6 py-2.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] disabled:opacity-50 text-black font-bold transition shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center gap-2 cursor-pointer"
                >
                  {isActivating ? (
                    <span>REGISTERING FIRM...</span>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      <span>CONTINUE TO PAYSTACK CHECKOUT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
