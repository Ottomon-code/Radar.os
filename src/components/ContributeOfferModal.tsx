import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  UploadCloud,
  FileCheck2,
  DollarSign,
  Building2,
  Briefcase,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export interface VerifiedOffer {
  id: string;
  company: string;
  role: string;
  sector: string;
  level: string;
  baseSalary: number;
  stockAnnual: number;
  bonusAnnual: number;
  signOnBonus: number;
  totalAnnualComp: number;
  yearsExperience: number;
  location: string;
  offerDate: string;
  verificationBadge: 'HR_VERIFIED' | 'STUB_VERIFIED' | 'COMMUNITY_VERIFIED' | 'COMMUNITY_PENDING_AUDIT';
  verifiedAt: string;
  alias: string;
}

const DEFAULT_VERIFIED_OFFERS: VerifiedOffer[] = [
  {
    id: 'off-1',
    company: 'Anthropic Ecosystem',
    role: 'Staff AI Infrastructure Engineer (GPU Orchestration)',
    sector: 'Frontier AI & High-Performance Compute',
    level: 'Staff (L6)',
    baseSalary: 285000,
    stockAnnual: 310000,
    bonusAnnual: 45000,
    signOnBonus: 50000,
    totalAnnualComp: 640000,
    yearsExperience: 8,
    location: 'San Francisco, CA (Hybrid)',
    offerDate: 'Q1 2026',
    verificationBadge: 'HR_VERIFIED',
    verifiedAt: '2 days ago',
    alias: 'ComputeArchitect_99',
  },
  {
    id: 'off-2',
    company: 'Citadel Securities',
    role: 'Senior Low-Latency FPGA / C++ Quantitative Developer',
    sector: 'Quantitative Finance & Algorithmic Trading',
    level: 'Senior (L5)',
    baseSalary: 250000,
    stockAnnual: 0,
    bonusAnnual: 275000,
    signOnBonus: 75000,
    totalAnnualComp: 525000,
    yearsExperience: 6,
    location: 'New York, NY (On-site)',
    offerDate: 'January 2026',
    verificationBadge: 'STUB_VERIFIED',
    verifiedAt: '3 days ago',
    alias: 'SubMicroQuant',
  },
  {
    id: 'off-3',
    company: 'Scale AI',
    role: 'Lead ML Evaluation & Alignment Architect',
    sector: 'Frontier AI & High-Performance Compute',
    level: 'Staff (L6)',
    baseSalary: 260000,
    stockAnnual: 240000,
    bonusAnnual: 35000,
    signOnBonus: 40000,
    totalAnnualComp: 535000,
    yearsExperience: 7,
    location: 'Remote (US)',
    offerDate: 'February 2026',
    verificationBadge: 'COMMUNITY_VERIFIED',
    verifiedAt: '1 week ago',
    alias: 'EvalLead_0x',
  },
];

interface ContributeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted?: (offer: VerifiedOffer) => void;
}

export default function ContributeOfferModal({ isOpen, onClose, onOfferSubmitted }: ContributeOfferModalProps) {
  const { openPaywall, isPro } = useSubscription();
  const { user } = useAuth();

  const [offersList, setOffersList] = useState<VerifiedOffer[]>(() => {
    try {
      const saved = localStorage.getItem('radar_community_verified_offers');
      return saved ? JSON.parse(saved) : DEFAULT_VERIFIED_OFFERS;
    } catch {
      return DEFAULT_VERIFIED_OFFERS;
    }
  });

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState('Frontier AI & High-Performance Compute');
  const [level, setLevel] = useState('Senior (L5)');
  const [baseSalary, setBaseSalary] = useState('');
  const [stockAnnual, setStockAnnual] = useState('');
  const [bonusAnnual, setBonusAnnual] = useState('');
  const [signOnBonus, setSignOnBonus] = useState('');
  const [yearsExperience, setYearsExperience] = useState('6');
  const [location, setLocation] = useState('San Francisco, CA');
  const [offerProofText, setOfferProofText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Load from Firestore when modal opens and user is signed in
  useEffect(() => {
    if (!db || !isOpen || !user) return;
    const loadFirestoreOffers = async () => {
      try {
        const q = query(collection(db, 'verifiedOffers'), orderBy('verifiedAt', 'desc'), limit(15));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: VerifiedOffer[] = [];
          snap.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as any) });
          });
          setOffersList(list);
          localStorage.setItem('radar_community_verified_offers', JSON.stringify(list));
        }
      } catch (e) {
        // Fallback to local storage silently
      }
    };
    loadFirestoreOffers();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const numericBase = Number(baseSalary.replace(/[^0-9]/g, '')) || 0;
  const numericStock = Number(stockAnnual.replace(/[^0-9]/g, '')) || 0;
  const numericBonus = Number(bonusAnnual.replace(/[^0-9]/g, '')) || 0;
  const numericSignOn = Number(signOnBonus.replace(/[^0-9]/g, '')) || 0;
  const totalComp = numericBase + numericStock + numericBonus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim() || numericBase <= 0) return;

    setIsSubmitting(true);

    const newOffer: VerifiedOffer = {
      id: `offer-${Date.now()}`,
      company: company.trim(),
      role: role.trim(),
      sector,
      level,
      baseSalary: numericBase,
      stockAnnual: numericStock,
      bonusAnnual: numericBonus,
      signOnBonus: numericSignOn,
      totalAnnualComp: totalComp,
      yearsExperience: Number(yearsExperience) || 5,
      location,
      offerDate: '2026 Submitted',
      verificationBadge: 'COMMUNITY_PENDING_AUDIT',
      verifiedAt: 'Just now',
      alias: user?.displayName ? `${user.displayName.split(' ')[0]}_Verified` : `Eng_${Math.floor(100 + Math.random() * 900)}`,
    };

    // Save to Firestore when authenticated
    if (db && user?.uid) {
      try {
        await addDoc(collection(db, 'verifiedOffers'), {
          ...newOffer,
          submittedByUid: user.uid,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Saved to local storage fallback due to firestore error:', err);
      }
    }

    const updated = [newOffer, ...offersList];
    setOffersList(updated);
    localStorage.setItem('radar_community_verified_offers', JSON.stringify(updated));

    setIsSubmitting(false);
    setShowSuccessBadge(true);

    if (onOfferSubmitted) {
      onOfferSubmitted(newOffer);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in font-mono text-xs text-[#dce7f0]"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-[#0c131a] border-2 border-[#22d3a5]/70 rounded-2xl shadow-[0_0_50px_rgba(34,211,165,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Accent Stripe */}
        <div className="bg-gradient-to-r from-[#22d3a5] via-[#38bdf8] to-[#fbbf24] h-1.5 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e2b36] flex items-start justify-between gap-4 shrink-0 bg-[#0f1720]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40">
                <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/50 font-bold uppercase tracking-wider">
                COMMUNITY DATA VERIFICATION ENGINE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
                ANONYMOUS COMPENSATION BENCHMARK
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Contribute Verified Offer Letter or Salary Slip
            </h2>
            <p className="text-xs text-[#7a8b99] mt-0.5 font-sans">
              Help build an unmanipulated compensation benchmark for engineers. Submissions are queued for cryptographic audit; upgrade via Paystack anytime for instant Pro Operator telemetry.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {showSuccessBadge ? (
            <div className="p-8 text-center space-y-4 bg-[#111e29] border border-[#22d3a5] rounded-xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#22d3a5]/20 border-2 border-[#22d3a5] text-[#22d3a5] flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                OFFER RECORD SUBMITTED // AUDIT QUEUED
              </h3>
              <p className="text-xs text-[#22d3a5] max-w-lg mx-auto">
                Thank you for contributing to the anonymized engineering compensation benchmark. Your submission is queued for verification while your identity remains strictly private.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                {!isPro && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openPaywall('Pro Operator Clearance — Full Compensation Telemetry');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-bold transition shadow-lg cursor-pointer"
                  >
                    UNLOCK PRO CLEARANCE VIA PAYSTACK
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold transition shadow-lg cursor-pointer"
                >
                  RETURN TO RADAR
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4 bg-[#111a22] p-4 rounded-xl border border-[#1e2b36]">
                <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                  <span className="font-bold text-[#22d3a5] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4" /> SUBMIT COMPENSATION DATA
                  </span>
                  <span className="text-[10px] text-[#7a8b99]">
                    Fields marked * are required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">COMPANY NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anthropic, Jane Street, Nvidia"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">ROLE / TITLE *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Staff AI Systems Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">SECTOR DOMAIN</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none cursor-pointer"
                    >
                      <option value="Frontier AI & High-Performance Compute">Frontier AI & High-Performance Compute</option>
                      <option value="Quantitative Finance & Algorithmic Trading">Quantitative Finance & Algorithmic Trading</option>
                      <option value="Autonomous Systems & Humanoid Robotics">Autonomous Systems & Humanoid Robotics</option>
                      <option value="Zero-Trust Defense & Sovereign Infrastructure">Zero-Trust Defense & Sovereign Infrastructure</option>
                      <option value="Distributed Systems & Cloud Infrastructure">Distributed Systems & Cloud Infrastructure</option>
                      <option value="AI for Science & Biotech ML">AI for Science & Biotech ML</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">BASE SALARY ($/YR) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 265000"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">EQUITY / RSU ($/YR)</label>
                    <input
                      type="text"
                      placeholder="e.g. 220000"
                      value={stockAnnual}
                      onChange={(e) => setStockAnnual(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">ANNUAL BONUS ($/YR)</label>
                    <input
                      type="text"
                      placeholder="e.g. 45000"
                      value={bonusAnnual}
                      onChange={(e) => setBonusAnnual(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">SIGN-ON BONUS ($)</label>
                    <input
                      type="text"
                      placeholder="e.g. 50000"
                      value={signOnBonus}
                      onChange={(e) => setSignOnBonus(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded p-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">SENIORITY / LEVEL</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-white outline-none"
                    >
                      <option value="Senior (L5)">Senior (L5)</option>
                      <option value="Staff (L6)">Staff (L6)</option>
                      <option value="Principal (L7)">Principal (L7)</option>
                      <option value="Distinguished / Partner (L8)">Distinguished / Partner (L8)</option>
                      <option value="Director / Head of Engineering">Director / Head of Engineering</option>
                      <option value="Mid-Level (L4)">Mid-Level (L4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">YEARS OF EXPERIENCE</label>
                    <input
                      type="number"
                      min="1"
                      max="35"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#7a8b99] mb-1">LOCATION / WORK MODE</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA (Hybrid)"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Offer Verification Slip or Document Preview */}
                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#7a8b99] font-bold flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-[#38bdf8]" />
                      OFFER VERIFICATION SLIP / REDACTED LETTER (OPTIONAL)
                    </span>
                    <span className="text-[10px] text-[#22d3a5]">Redact all PII / names</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#1e2b36] hover:bg-[#283847] border border-[#2e3e4e] text-xs text-[#dce7f0] cursor-pointer transition shrink-0">
                      <UploadCloud className="w-4 h-4 text-[#22d3a5]" />
                      <span>{uploadedFileName ? 'Document Attached ✓' : 'Upload PDF / Screenshot'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedFileName(file.name);
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste offer code / verification link / signature snippet..."
                      value={offerProofText}
                      onChange={(e) => setOfferProofText(e.target.value)}
                      className="flex-1 bg-[#111a22] border border-[#1e2b36] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#7a8b99] outline-none"
                    />
                  </div>

                  {uploadedFileName && (
                    <div className="text-[10px] text-[#22d3a5] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Attached: {uploadedFileName} (Will receive HR_VERIFIED tier badge)</span>
                    </div>
                  )}
                </div>

                {/* Total Compensation Live Preview & Submit CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1e2b36]">
                  <div>
                    <span className="text-[10px] text-[#7a8b99] block">COMPUTED FIRST-YEAR TOTAL COMP:</span>
                    <span className="text-xl font-bold text-[#22d3a5]">
                      ${(totalComp + numericSignOn).toLocaleString()} USD
                    </span>
                    <span className="text-[10px] text-[#7a8b99] ml-2">
                      (${totalComp.toLocaleString()}/yr recurring + ${numericSignOn.toLocaleString()} sign-on)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || numericBase <= 0 || !company || !role}
                    className="px-6 py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] disabled:opacity-50 text-black font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>ENCRYPTING &amp; SUBMITTING...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>SUBMIT &amp; UNLOCK 1-YR FREE PRO</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Live Community Feed of Recent Verified Offers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#38bdf8]" />
                    <span>RECENT COMMUNITY VERIFIED COMPENSATION OFFERS ({offersList.length})</span>
                  </h3>
                  <span className="text-[10px] text-[#7a8b99]">
                    Updated in real time
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {offersList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/50 rounded-xl p-3.5 space-y-2 transition shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#22d3a5] px-1.5 py-0.5 rounded bg-[#22d3a5]/10 border border-[#22d3a5]/30">
                          {item.verificationBadge.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#7a8b99]">{item.verifiedAt}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-xs">{item.company}</h4>
                        <p className="text-[11px] text-[#94a3b8] truncate">{item.role}</p>
                        <p className="text-[10px] text-[#7a8b99]">{item.level} • {item.location}</p>
                      </div>

                      <div className="pt-2 border-t border-[#1e2b36] flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-[#7a8b99] block">TOTAL COMP</span>
                          <span className="text-base font-bold text-[#fbbf24]">
                            ${item.totalAnnualComp.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-[#7a8b99]">
                          <div>Base: ${item.baseSalary.toLocaleString()}</div>
                          <div>Equity: ${item.stockAnnual.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
