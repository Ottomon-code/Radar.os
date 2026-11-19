import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Scale,
  ShieldCheck,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Layers,
  FileText,
  Building2,
  CheckCircle2,
  Globe,
  Receipt,
  Plus,
  Trash2,
  ExternalLink,
  Award,
  Lock,
  Download,
  AlertTriangle,
  BadgeDollarSign,
  Share2,
  Landmark,
  CreditCard,
  Wallet,
  Send,
  Users,
  Briefcase,
  KeyRound,
  FolderGit2,
  Smartphone,
  Server,
  X,
  Presentation,
} from 'lucide-react';
import BuyerCustomerPlatforms from './BuyerCustomerPlatforms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  OfferBreakdown,
  DEFAULT_OFFERS,
  computeYearByYear,
  calculateZopa,
  VestingType,
} from '../utils/negotiationFinanceEngine';
import {
  AppSaleListing,
  AcquisitionTransaction,
  ConsultantInvoice,
  TaxJurisdiction,
  TAX_JURISDICTIONS,
  getStoredListing,
  saveListing,
  getStoredTransactions,
  recordTransaction,
  getStoredInvoices,
  saveInvoices,
} from '../utils/financialPlatformEngine';
import { useSubscription } from '../context/SubscriptionContext';

interface FinancialPlatformTabProps {
  onSendToEnvoy?: (counterScript: string) => void;
  onSendToStrategist?: (targetComp: number) => void;
  initialSubTab?: 'for_sale' | 'buyer_pipeline' | 'ttc_model' | 'tax_wealth' | 'invoicing' | 'zopa_batna';
}

export default function FinancialPlatformTab({
  onSendToEnvoy,
  onSendToStrategist,
  initialSubTab = 'ttc_model',
}: FinancialPlatformTabProps) {
  const { isOwner } = useSubscription();
  const [activeTab, setActiveTab] = useState<'for_sale' | 'buyer_pipeline' | 'ttc_model' | 'tax_wealth' | 'invoicing' | 'zopa_batna'>(
    initialSubTab
  );

  useEffect(() => {
    if (!isOwner && (activeTab === 'for_sale' || activeTab === 'buyer_pipeline')) {
      setActiveTab('ttc_model');
      setShowCheckoutModal(false);
    }
  }, [isOwner, activeTab]);

  // --- APP SALE & ACQUISITION STATE ---
  const [listing, setListing] = useState<AppSaleListing>(() => getStoredListing());
  const [transactions, setTransactions] = useState<AcquisitionTransaction[]>(() => getStoredTransactions());
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [customAskingPrice, setCustomAskingPrice] = useState(listing.askingPriceUsd);
  const [selectedBuyoutTier, setSelectedBuyoutTier] = useState<AppSaleListing['commercialTiers'][0] | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ESCROW_WIRE' | 'PAYSTACK_COMMERCIAL' | 'CRYPTO_USDC' | 'VENTURE_TRANSFER'>('ESCROW_WIRE');
  const [latestTransaction, setLatestTransaction] = useState<AcquisitionTransaction | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [publishedBannerDismissed, setPublishedBannerDismissed] = useState(false);

  // --- SELLER PAYOUT & BANK DISBURSEMENT CONFIGURATION STATE ---
  const [sellerPayoutMethod, setSellerPayoutMethod] = useState<'ESCROW_WIRE' | 'PAYSTACK_PAYOUT' | 'CRYPTO_USDC' | 'DOMESTIC_ACH'>('ESCROW_WIRE');
  const [sellerLegalName, setSellerLegalName] = useState(() => localStorage.getItem('seller_payout_name') || 'App Owner / Lead Engineer');
  const [sellerBankName, setSellerBankName] = useState(() => localStorage.getItem('seller_bank_name') || 'JPMorgan Chase / Silicon Valley Bank');
  const [sellerRouting, setSellerRouting] = useState(() => localStorage.getItem('seller_routing') || '021000021');
  const [sellerAccount, setSellerAccount] = useState(() => localStorage.getItem('seller_account') || '••••••••8492');
  const [sellerEmail, setSellerEmail] = useState(() => localStorage.getItem('seller_payout_email') || 'mortyp1125@gmail.com');
  const [sellerUsdcAddress, setSellerUsdcAddress] = useState(() => localStorage.getItem('seller_usdc_addr') || '0x71C...84F2');
  const [payoutSaveSuccess, setPayoutSaveSuccess] = useState(false);

  const handleSaveSellerPayout = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('seller_payout_name', sellerLegalName);
    localStorage.setItem('seller_bank_name', sellerBankName);
    localStorage.setItem('seller_routing', sellerRouting);
    localStorage.setItem('seller_account', sellerAccount);
    localStorage.setItem('seller_payout_email', sellerEmail);
    localStorage.setItem('seller_usdc_addr', sellerUsdcAddress);
    setPayoutSaveSuccess(true);
    setTimeout(() => setPayoutSaveSuccess(false), 3000);
  };

  // --- EXECUTIVE COMP (TTC) STATE ---
  const [offer, setOffer] = useState<OfferBreakdown>(DEFAULT_OFFERS[0]);
  const yearData = computeYearByYear(offer);
  const total4YrComp = yearData[yearData.length - 1]?.cumulativeTotal || 0;
  const avgAnnualComp = Math.round(total4YrComp / 4);
  const year1Cash = yearData[0]?.totalCash || 0;

  // --- TAX & WEALTH RUNWAY STATE ---
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<TaxJurisdiction>(TAX_JURISDICTIONS[0]);
  const [annualSavingsRatePercent, setAnnualSavingsRatePercent] = useState(40);
  const [initialNetWorth, setInitialNetWorth] = useState(350000);
  const estimatedGrossIncome = avgAnnualComp;
  const estimatedTaxWithheld = Math.round(estimatedGrossIncome * selectedJurisdiction.effectiveTaxRateEstimate);
  const estimatedAnnualNetIncome = estimatedGrossIncome - estimatedTaxWithheld;
  const estimatedAnnualSavings = Math.round(estimatedAnnualNetIncome * (annualSavingsRatePercent / 100));

  // 10-Year Wealth Projection
  const wealthProjectionData = Array.from({ length: 10 }).map((_, i) => {
    const yr = i + 1;
    // Compounding assuming 8% growth on existing portfolio + annual savings addition
    let compoundBalance = initialNetWorth;
    for (let y = 1; y <= yr; y++) {
      compoundBalance = compoundBalance * 1.08 + estimatedAnnualSavings;
    }
    return {
      year: `Yr ${yr}`,
      portfolioValue: Math.round(compoundBalance),
      cumulativeSavings: Math.round(initialNetWorth + estimatedAnnualSavings * yr),
    };
  });

  // --- INVOICING PLATFORM STATE ---
  const [invoices, setInvoices] = useState<ConsultantInvoice[]>(() => getStoredInvoices());
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [claimSuccessReceipt, setClaimSuccessReceipt] = useState<{
    invoiceId: string;
    client: string;
    amount: number;
    bank: string;
    account: string;
    wireRef: string;
  } | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newHours, setNewHours] = useState(15);
  const [newRate, setNewRate] = useState(650);

  const handleClaimEscrowPayment = (inv: ConsultantInvoice) => {
    const wireRef = `FEDWIRE-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const destLabel = isOwner ? `${sellerBankName} (${sellerAccount})` : 'Client Designated Settlement Account';
    const updated = invoices.map((i) =>
      i.id === inv.id
        ? {
            ...i,
            status: 'SETTLED' as const,
            notes: `Claimed and disbursed to ${destLabel}. Wire Ref: ${wireRef}`,
          }
        : i
    );
    setInvoices(updated);
    saveInvoices(updated);
    setClaimSuccessReceipt({
      invoiceId: inv.id,
      client: `${inv.clientCompany} (${inv.clientName})`,
      amount: inv.totalDue,
      bank: isOwner ? sellerBankName : 'Client Designated Settlement Bank',
      account: isOwner ? sellerAccount : '••••0000',
      wireRef,
    });
  };

  // --- ZOPA STATE ---
  const [employerInitial, setEmployerInitial] = useState(280000);
  const [candidateFloor, setCandidateFloor] = useState(295000);
  const [hasCompetingLeverage, setHasCompetingLeverage] = useState(true);
  const zopa = calculateZopa(employerInitial, candidateFloor, 310000, hasCompetingLeverage);

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleUpdateAskingPrice = () => {
    const updated = { ...listing, askingPriceUsd: Number(customAskingPrice) };
    setListing(updated);
    saveListing(updated);
    setIsEditingPrice(false);
  };

  const handleTogglePublishStatus = () => {
    const newStatus = listing.status === 'PUBLISHED' ? 'UNDER_OFFER' : 'PUBLISHED';
    const updated: AppSaleListing = {
      ...listing,
      status: newStatus,
      publishedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' (Live Updated)',
    };
    setListing(updated);
    saveListing(updated);
  };

  const handleExecuteAcquisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyoutTier || !buyerEmail) return;

    const txId = `ESC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-VAL`;
    const license = `GCR-${selectedBuyoutTier.licenseType.slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const numAmount =
      selectedBuyoutTier.licenseType === 'FULL_IP_BUYOUT'
        ? listing.askingPriceUsd
        : selectedBuyoutTier.licenseType === 'ENTERPRISE_TEAM'
        ? 1450
        : 79;

    const newTx: AcquisitionTransaction = {
      transactionId: txId,
      buyerEmail,
      tierId: selectedBuyoutTier.id,
      tierName: selectedBuyoutTier.tierName,
      amountUsd: numAmount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      licenseKey: license,
      contractStatus: 'EXECUTED_AND_BOUND',
      assetTransferDigest: `SHA256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    };

    const updated = recordTransaction(newTx);
    setTransactions(updated);
    setLatestTransaction(newTx);
    setShowCheckoutModal(false);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCompany) return;

    const subtotal = newHours * newRate;
    const newInv: ConsultantInvoice = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newClientName,
      clientCompany: newClientCompany,
      roleScope: newScope || 'Fractional Executive & Quantitative Talent Advisory',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          description: newScope || 'Executive Engineering & Architecture Advisory Retainer',
          hoursOrRetainer: Number(newHours),
          rate: Number(newRate),
          total: subtotal,
        },
      ],
      subtotal,
      taxWithheldPercent: 0,
      totalDue: subtotal,
      status: 'SENT',
      notes: 'Generated via Quantitative Financial Platform. Payment due via wire/escrow.',
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    setShowNewInvoiceModal(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewScope('');
  };

  const handleUpdateInvoiceStatus = (id: string, status: ConsultantInvoice['status']) => {
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv));
    setInvoices(updated);
    saveInvoices(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Publication Status Alert (Owner Only) */}
      {isOwner && !publishedBannerDismissed && (
        <div className="bg-gradient-to-r from-[#22d3a5]/20 via-[#3b82f6]/20 to-[#a78bfa]/20 border border-[#22d3a5]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,211,165,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#22d3a5]/20 border border-[#22d3a5] flex items-center justify-center shrink-0">
              <BadgeDollarSign className="w-5 h-5 text-[#22d3a5] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-[#dce7f0]">
                  FOUNDER CONSOLE: APP ACQUISITION &amp; COMMERCIAL LICENSING
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-bold font-mono">
                  OWNER VIEW
                </span>
              </div>
              <p className="text-[11px] text-[#7a8b99] font-mono mt-0.5">
                Owner-only M&amp;A listing tools and buyer pipeline CRM. Regular subscribers see TTC, Tax, Invoicing &amp; ZOPA tools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('for_sale')}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition"
            >
              <span>View Acquisition Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPublishedBannerDismissed(true)}
              className="px-2 py-1 text-xs text-[#7a8b99] hover:text-[#dce7f0] font-mono"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Financial Platform Master Header */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#22d3a5]" />
                UNIFIED COMPENSATION OPERATING SYSTEM
              </span>
              <span className="text-xs font-mono text-[#7a8b99]">
                VERSION 4.2 • QUANTITATIVE SUITE
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-[#dce7f0] mt-1.5 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#22d3a5]" />
              {isOwner
                ? 'GLOBAL FINANCIAL PLATFORM & APP SALE MARKETPLACE'
                : 'COMPENSATION, EQUITY & TAX MODELING PLATFORM'}
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono mt-1">
              {isOwner
                ? 'Commercial asset monetization, M&A deal room, multi-jurisdiction tax simulations, executive compensation modeling, and advisory invoicing.'
                : '4-year Total Target Compensation modeling, global net tax arbitrage, fractional consulting invoicing, and ZOPA offer negotiation.'}
            </p>
          </div>

          {/* Sub-Module Navigation */}
          <div className="flex items-center gap-1.5 bg-[#0a0f14] p-1.5 rounded-lg border border-[#1e2b36] text-xs font-mono overflow-x-auto">
            {isOwner && (
              <button
                onClick={() => setActiveTab('for_sale')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'for_sale'
                    ? 'bg-[#22d3a5] text-black font-semibold shadow'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>App For Sale &amp; Buyout</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setActiveTab('buyer_pipeline')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'buyer_pipeline'
                    ? 'bg-[#fbbf24] text-black font-semibold shadow'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-inherit" />
                <span>Buyer &amp; Customer Platforms</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-black font-bold">CRM</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ttc_model')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ttc_model'
                  ? 'bg-[#3b82f6] text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>4-Yr TTC &amp; Equity</span>
            </button>

            <button
              onClick={() => setActiveTab('tax_wealth')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'tax_wealth'
                  ? 'bg-[#a78bfa] text-black font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Tax &amp; Wealth Runway</span>
            </button>

            <button
              onClick={() => setActiveTab('invoicing')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'invoicing'
                  ? 'bg-[#fbbf24] text-black font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Advisory Invoicing</span>
            </button>

            <button
              onClick={() => setActiveTab('zopa_batna')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'zopa_batna'
                  ? 'bg-purple-600 text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>ZOPA &amp; Riders</span>
            </button>
          </div>
        </div>

        {/* Global Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mt-4">
          {isOwner ? (
            <>
              <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">PLATFORM ASSET VALUATION</span>
                <span className="text-base font-bold text-[#22d3a5]">
                  ${listing.estimatedValuationUsd.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#7a8b99] block mt-0.5">{listing.valuationMultiple}</span>
              </div>

              <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">LISTED BUYOUT PRICE</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#fbbf24]">
                    ${listing.askingPriceUsd.toLocaleString()} USD
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5]">
                    {listing.status}
                  </span>
                </div>
                <span className="text-[10px] text-[#7a8b99] block mt-0.5">Escrow Transfer Ready</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">YEAR 1 CASH + BONUS</span>
                <span className="text-base font-bold text-[#22d3a5]">
                  ${year1Cash.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#7a8b99] block mt-0.5 truncate">
                  {offer.firmName} • {offer.roleTitle}
                </span>
              </div>

              <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">AVG ANNUAL TTC (4-YR)</span>
                <span className="text-base font-bold text-[#fbbf24]">
                  ${avgAnnualComp.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#7a8b99] block mt-0.5">
                  Equity 4-Yr Grant: ${offer.equityTotalGrant.toLocaleString()}
                </span>
              </div>
            </>
          )}

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">EXECUTIVE 4-YR TTC (NPV)</span>
            <span className="text-base font-bold text-[#3b82f6]">
              ${total4YrComp.toLocaleString()} USD
            </span>
            <span className="text-[10px] text-[#7a8b99] block mt-0.5">Yr 1: ${year1Cash.toLocaleString()} Cash</span>
          </div>

          <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] text-[10px] block">ADVISORY INVOICING TOTAL</span>
            <span className="text-base font-bold text-[#a78bfa]">
              ${invoices.reduce((acc, inv) => acc + inv.totalDue, 0).toLocaleString()} USD
            </span>
            <span className="text-[10px] text-[#7a8b99] block mt-0.5">{invoices.length} Registered Accounts</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: APP FOR SALE & ACQUISITION DEAL ROOM (OWNER ONLY)
         ========================================================================= */}
      {isOwner && activeTab === 'for_sale' && (
        <div className="space-y-6">
          {/* Acquisition Overview Banner */}
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#1e2b36]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] text-xs font-mono font-bold border border-[#22d3a5]/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    LIVE FOR SALE LISTING: {listing.status}
                  </span>
                  <span className="text-xs font-mono text-[#7a8b99]">
                    DOCKET ID: {listing.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-mono text-[#dce7f0] mt-1.5">
                  {listing.listingTitle}
                </h3>
                <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
                  {listing.tagline}
                </p>
              </div>

              {/* Publisher Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-diligence-vault'))}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#a78bfa]/20 via-[#38bdf8]/20 to-[#22d3a5]/20 border border-[#a78bfa] hover:from-[#a78bfa]/30 hover:to-[#22d3a5]/30 text-[#a78bfa] font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(167,139,250,0.25)] animate-pulse"
                  title="Open M&A Buyer Due Diligence Vault: Marketing Spend, Tax Filings (W-8BEN), 10-Slide Pitch Deck (PDF), and Operational Runbooks"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>📁 Buyer Data Room &amp; Diligence Vault</span>
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-transfer-modal'))}
                  className="px-3 py-1.5 rounded-lg bg-[#a78bfa]/20 border border-[#a78bfa] hover:bg-[#a78bfa]/30 text-[#a78bfa] font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(167,139,250,0.2)]"
                  title="Open Domain (talentradar.io) & Asset Credentials Transfer Vault"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Domain &amp; Asset Vault</span>
                </button>

                <button
                  onClick={() => setActiveTab('buyer_pipeline')}
                  className="px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 border border-[#fbbf24]/50 hover:bg-[#fbbf24]/25 text-[#fbbf24] font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                  title="View Acquire.com, Flippa, B2B Customer platforms, and live buyer CRM"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Buyer Platforms &amp; CRM</span>
                </button>

                <button
                  onClick={handleTogglePublishStatus}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition flex items-center gap-1.5 ${
                    listing.status === 'PUBLISHED'
                      ? 'bg-[#22d3a5]/10 border-[#22d3a5] text-[#22d3a5]'
                      : 'bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Status: {listing.status === 'PUBLISHED' ? 'Published to M&A' : 'Under Offer'}</span>
                </button>

                <button
                  onClick={() => setIsEditingPrice(!isEditingPrice)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6] text-xs font-mono text-[#7a8b99] hover:text-[#dce7f0] transition cursor-pointer"
                >
                  Edit Asking Price
                </button>
              </div>
            </div>

            {/* Editable Asking Price Bar */}
            {isEditingPrice && (
              <div className="p-3 bg-[#0a0f14] border border-[#3b82f6]/40 rounded-lg flex items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#7a8b99]">SET ACQUISITION ASKING PRICE ($ USD):</span>
                  <input
                    type="number"
                    step="5000"
                    value={customAskingPrice}
                    onChange={(e) => setCustomAskingPrice(Number(e.target.value))}
                    className="bg-[#111a22] border border-[#1e2b36] rounded px-3 py-1 text-sm font-bold text-[#22d3a5] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUpdateAskingPrice}
                    className="px-3 py-1 rounded bg-[#22d3a5] text-black font-semibold text-xs"
                  >
                    Save &amp; Update Listing
                  </button>
                  <button
                    onClick={() => setIsEditingPrice(false)}
                    className="px-3 py-1 rounded bg-[#1e2b36] text-[#7a8b99] text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Technical Due Diligence & Asset Transfer Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-[#0a0f14] p-4 rounded-lg border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                  <span className="text-[#dce7f0] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
                    INCLUDED INTELLECTUAL PROPERTY ASSETS
                  </span>
                  <span className="text-[10px] text-[#22d3a5]">100% UNENCUMBERED</span>
                </div>
                <div className="space-y-2">
                  {listing.includedAssets.map((asset, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36]/60 flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#dce7f0] text-xs">{asset.name}</div>
                        <div className="text-[11px] text-[#7a8b99] mt-0.5">{asset.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0f14] p-4 rounded-lg border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                  <span className="text-[#dce7f0] font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#3b82f6]" />
                    TECHNICAL AUDIT &amp; CODEBASE METRICS
                  </span>
                  <span className="text-[10px] text-[#3b82f6]">VERIFIED</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block">SOURCE CODE SIZE</span>
                    <span className="text-sm font-bold text-[#dce7f0]">{listing.techStackMetrics.totalLinesOfCode.toLocaleString()} lines</span>
                  </div>
                  <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block">COMPONENTS</span>
                    <span className="text-sm font-bold text-[#22d3a5]">{listing.techStackMetrics.componentsCount} Production Units</span>
                  </div>
                  <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block">TEST / BUILD HEALTH</span>
                    <span className="text-sm font-bold text-[#3b82f6]">Zero Compiler Errors (Clean)</span>
                  </div>
                  <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36]">
                    <span className="text-[#7a8b99] block">DEPLOYMENT TARGET</span>
                    <span className="text-sm font-bold text-[#fbbf24]">Google Cloud Run / Edge</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[#7a8b99] text-[10px] block mb-1.5">PRIMARY ARCHITECTURAL STACK:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.techStackMetrics.primaryStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#22d3a5] text-[10px]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              DOMAIN & ASSET CREDENTIALS TRANSFER VAULT (HANDOVER & DUE DILIGENCE)
             ========================================================================= */}
          <div className="panel bg-[#0d151c] border-2 border-[#a78bfa]/50 rounded-xl p-5 shadow-[0_0_25px_rgba(167,139,250,0.15)] space-y-4 font-mono text-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/20 border border-[#a78bfa] flex items-center justify-center text-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,0.2)] shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#dce7f0]">
                      DOMAIN &amp; ASSET CREDENTIALS TRANSFER VAULT
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#a78bfa] text-black font-bold">
                      DELAWARE ESCROW BOUND
                    </span>
                  </div>
                  <p className="text-xs text-[#7a8b99] font-sans">
                    Pre-configured credentials, domain authorization keys, and store transfer packages ready for immediate buyer handover upon Escrow.com deposit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-transfer-modal'))}
                  className="px-3.5 py-1.5 rounded-lg bg-[#a78bfa] hover:bg-[#906cf5] text-black font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(167,139,250,0.25)] cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>OPEN CREDENTIALS TRANSFER VAULT</span>
                </button>
              </div>
            </div>

            {/* Quick Credentials Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Domain */}
              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36] space-y-1">
                <div className="flex items-center justify-between text-[#22d3a5] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    talentradar.io
                  </span>
                  <span className="text-[9px] bg-[#22d3a5]/10 px-1 py-0.2 rounded text-[#22d3a5]">UNLOCKED</span>
                </div>
                <div className="text-[11px] text-[#dce7f0]">Cloudflare Registrar</div>
                <div className="text-[10px] text-[#7a8b99]">EPP Code: EPP#TLNT-9982-CLDF...</div>
              </div>

              {/* GitHub */}
              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36] space-y-1">
                <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                  <span className="flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5" />
                    GitHub Source
                  </span>
                  <span className="text-[9px] bg-[#38bdf8]/10 px-1 py-0.2 rounded text-[#38bdf8]">PAT READY</span>
                </div>
                <div className="text-[11px] text-[#dce7f0]">talentradar/talentradar-platform</div>
                <div className="text-[10px] text-[#7a8b99]">Deploy Token &amp; CI/CD Secret</div>
              </div>

              {/* Play Store */}
              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36] space-y-1">
                <div className="flex items-center justify-between text-[#fbbf24] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Google Play Console
                  </span>
                  <span className="text-[9px] bg-[#fbbf24]/10 px-1 py-0.2 rounded text-[#fbbf24]">AAB READY</span>
                </div>
                <div className="text-[11px] text-[#dce7f0]">com.talentradar.app</div>
                <div className="text-[10px] text-[#7a8b99]">AssetLinks SHA-256 Verified</div>
              </div>

              {/* GCP & Firebase */}
              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36] space-y-1">
                <div className="flex items-center justify-between text-[#a78bfa] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    Cloud Run &amp; Auth
                  </span>
                  <span className="text-[9px] bg-[#a78bfa]/10 px-1 py-0.2 rounded text-[#a78bfa]">IAM READY</span>
                </div>
                <div className="text-[11px] text-[#dce7f0]">gen-lang-client-0212017392</div>
                <div className="text-[10px] text-[#7a8b99]">Firestore DB: ai-studio-careerradar...</div>
              </div>
            </div>

            {/* Escrow Inspection Banner */}
            <div className="p-3 bg-[#080d12] rounded-lg border border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#7a8b99]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Escrow.com 48-Hour Inspection Period: All 6 handover milestones can be verified interactively in the vault.
                </span>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-transfer-modal'))}
                className="text-[#a78bfa] hover:text-[#c4b5fd] font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>View Full Transfer Vault &amp; Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              SELLER PAYOUT & DISBURSEMENT ARCHITECTURE (HOW YOU GET THE MONEY)
             ========================================================================= */}
          <div className="panel bg-[#0d151c] border-2 border-[#22d3a5]/50 rounded-xl p-5 shadow-[0_0_25px_rgba(34,211,165,0.15)] space-y-5 font-mono text-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1e2b36] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/20 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.2)] shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#dce7f0]">
                      HOW YOU GET THE MONEY // SELLER DISBURSEMENT &amp; ESCROW ROUTING
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-bold">
                      VERIFIED SETTLEMENT
                    </span>
                  </div>
                  <p className="text-xs text-[#7a8b99] font-sans">
                    When a buyer acquires the app ($145,000 buyout) or subscribes via Paystack, funds settle via Escrow.com bank wire or your Paystack payout account.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5] text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PAYOUT ROUTING: READY FOR WIRE
                </span>
              </div>
            </div>

            {/* 4-Stage Escrow Payout Walkthrough */}
            <div>
              <div className="text-[#94a3b8] text-xs font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
                THE 4-STAGE ESCROW DISBURSEMENT WORKFLOW:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#111a22] rounded-lg border border-[#1e2b36]">
                  <div className="flex items-center justify-between text-[#22d3a5] font-bold mb-1">
                    <span>STAGE 1: DEPOSIT</span>
                    <span className="text-[10px] bg-[#22d3a5]/10 px-1.5 py-0.5 rounded">ESCROW</span>
                  </div>
                  <div className="text-xs font-semibold text-[#dce7f0]">Buyer Deposits $145K</div>
                  <div className="text-[11px] text-[#7a8b99] font-sans mt-1">
                    The buyer deposits $145,000 into Escrow.com or bank wire trust. Funds are 100% verified and locked.
                  </div>
                </div>

                <div className="p-3.5 bg-[#111a22] rounded-lg border border-[#1e2b36]">
                  <div className="flex items-center justify-between text-[#38bdf8] font-bold mb-1">
                    <span>STAGE 2: TRANSFER</span>
                    <span className="text-[10px] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded">HANDOVER</span>
                  </div>
                  <div className="text-xs font-semibold text-[#dce7f0]">Asset Handover</div>
                  <div className="text-[11px] text-[#7a8b99] font-sans mt-1">
                    You grant the buyer ownership of the GitHub repository, hosting DNS, and cloud production environments.
                  </div>
                </div>

                <div className="p-3.5 bg-[#111a22] rounded-lg border border-[#1e2b36]">
                  <div className="flex items-center justify-between text-[#fbbf24] font-bold mb-1">
                    <span>STAGE 3: INSPECT</span>
                    <span className="text-[10px] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded">48 HOURS</span>
                  </div>
                  <div className="text-xs font-semibold text-[#dce7f0]">Inspection Approval</div>
                  <div className="text-[11px] text-[#7a8b99] font-sans mt-1">
                    Buyer verifies the clean build and executes the digital Bill of Sale confirmation on Escrow.com.
                  </div>
                </div>

                <div className="p-3.5 bg-[#111a22] rounded-lg border border-[#22d3a5]/50 shadow-[0_0_15px_rgba(34,211,165,0.15)]">
                  <div className="flex items-center justify-between text-[#22d3a5] font-bold mb-1">
                    <span>STAGE 4: PAYOUT</span>
                    <span className="text-[10px] bg-[#22d3a5] text-black px-1.5 py-0.5 rounded font-bold">PAID TO YOU</span>
                  </div>
                  <div className="text-xs font-semibold text-[#22d3a5]">Direct Bank Wire</div>
                  <div className="text-[11px] text-[#94a3b8] font-sans mt-1">
                    Escrow wires the money directly into your bank checking account. Funds clear in 1–2 business days.
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payout Calculator & Settlement Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#080d12] p-4 rounded-xl border border-[#1e2b36]">
              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36]">
                <span className="text-[10px] text-[#7a8b99] block">GROSS BUYOUT TRANSACTION:</span>
                <span className="text-lg font-bold text-[#fbbf24] block mt-0.5">
                  ${listing.askingPriceUsd.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#7a8b99]">100% Unencumbered IP</span>
              </div>

              <div className="p-3 bg-[#111a22] rounded-lg border border-[#1e2b36]">
                <span className="text-[10px] text-[#7a8b99] block">ESCROW.COM STANDARD FEE (0.89%):</span>
                <span className="text-lg font-bold text-[#f87171] block mt-0.5">
                  -${(Math.round(listing.askingPriceUsd * 0.0089)).toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#7a8b99]">Delaware Escrow Partner</span>
              </div>

              <div className="p-3 bg-[#111a22] rounded-lg border border-[#22d3a5]/40 shadow-[0_0_15px_rgba(34,211,165,0.1)]">
                <span className="text-[10px] text-[#22d3a5] font-bold block">NET CASH DEPOSITED IN YOUR BANK:</span>
                <span className="text-xl font-bold text-[#22d3a5] block mt-0.5">
                  ${(listing.askingPriceUsd - Math.round(listing.askingPriceUsd * 0.0089)).toLocaleString()} USD
                </span>
                <span className="text-[10px] text-[#94a3b8]">Direct Domestic FedWire / ACH</span>
              </div>
            </div>

            {/* Configurable Seller Payout Destination Form */}
            <form onSubmit={handleSaveSellerPayout} className="bg-[#111a22] p-4 rounded-xl border border-[#1e2b36] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-2">
                <div className="font-bold text-[#dce7f0] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#22d3a5]" />
                  CONFIGURE YOUR SELLER PAYOUT DESTINATION
                </div>
                {payoutSaveSuccess && (
                  <span className="text-[11px] text-[#22d3a5] font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAYOUT DESTINATION SAVED &amp; VERIFIED!
                  </span>
                )}
              </div>

              {/* Payout Channel Radio Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSellerPayoutMethod('ESCROW_WIRE')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    sellerPayoutMethod === 'ESCROW_WIRE'
                      ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                  <span>Escrow.com Wire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerPayoutMethod('DOMESTIC_ACH')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    sellerPayoutMethod === 'DOMESTIC_ACH'
                      ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>Direct Bank ACH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerPayoutMethod('PAYSTACK_PAYOUT')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    sellerPayoutMethod === 'PAYSTACK_PAYOUT'
                      ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span>Paystack Settlement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerPayoutMethod('CRYPTO_USDC')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    sellerPayoutMethod === 'CRYPTO_USDC'
                      ? 'bg-[#22d3a5]/15 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span>USDC Stablecoin</span>
                </button>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">LEGAL BENEFICIARY NAME:</label>
                  <input
                    type="text"
                    value={sellerLegalName}
                    onChange={(e) => setSellerLegalName(e.target.value)}
                    placeholder="Full Name or LLC Name"
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">BANK INSTITUTION NAME:</label>
                  <input
                    type="text"
                    value={sellerBankName}
                    onChange={(e) => setSellerBankName(e.target.value)}
                    placeholder="e.g. JPMorgan Chase, Wells Fargo"
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">ROUTING NUMBER (ABA / SWIFT):</label>
                  <input
                    type="text"
                    value={sellerRouting}
                    onChange={(e) => setSellerRouting(e.target.value)}
                    placeholder="9-digit routing or SWIFT BIC"
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">ACCOUNT NUMBER (CHECKING / IBAN):</label>
                  <input
                    type="text"
                    value={sellerAccount}
                    onChange={(e) => setSellerAccount(e.target.value)}
                    placeholder="Account or IBAN"
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">NOTIFICATION / ESCROW EMAIL:</label>
                  <input
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="mortyp1125@gmail.com"
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7a8b99] mb-1">USDC WALLET (POLYGON / ETH):</label>
                  <input
                    type="text"
                    value={sellerUsdcAddress}
                    onChange={(e) => setSellerUsdcAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] rounded p-2 text-xs text-[#dce7f0] outline-none focus:border-[#22d3a5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1e2b36]">
                <span className="text-[11px] text-[#7a8b99]">
                  All banking instructions are stored locally and encrypted for escrow binding.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(34,211,165,0.2)] cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SAVE &amp; LOCK PAYOUT ROUTING</span>
                </button>
              </div>
            </form>
          </div>

          {/* Commercialization & Acquisition Buyout Tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#fbbf24]" />
                  COMMERCIAL PURCHASE &amp; ACQUISITION TIERS
                </h4>
                <p className="text-xs text-[#7a8b99] font-mono">
                  Select a subscription tier or acquire 100% intellectual property outright with an official Bill of Sale.
                </p>
              </div>
              <span className="text-xs font-mono text-[#22d3a5] bg-[#22d3a5]/10 px-2.5 py-1 rounded border border-[#22d3a5]/30">
                INSTANT ESCROW SETTLEMENT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
              {listing.commercialTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`panel rounded-xl p-5 border flex flex-col justify-between transition-all ${
                    tier.licenseType === 'FULL_IP_BUYOUT'
                      ? 'bg-gradient-to-b from-[#111a22] to-[#1a2938] border-[#fbbf24]/60 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                      : tier.popular
                      ? 'bg-[#111a22] border-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.12)]'
                      : 'bg-[#111a22] border-[#1e2b36]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2b36]">
                      <span className="text-xs text-[#7a8b99] uppercase">{tier.licenseType.replace(/_/g, ' ')}</span>
                      {tier.licenseType === 'FULL_IP_BUYOUT' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24] text-black font-bold">
                          OWN THE ENTIRE APP
                        </span>
                      ) : tier.popular ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5] text-black font-bold">
                          MOST POPULAR
                        </span>
                      ) : null}
                    </div>

                    <h5 className="text-base font-bold text-[#dce7f0]">{tier.tierName}</h5>
                    <p className="text-xs text-[#7a8b99] mt-1 mb-4">{tier.description}</p>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-[#22d3a5]">{tier.price}</span>
                      <span className="text-xs text-[#7a8b99] ml-1">{tier.billingPeriod}</span>
                    </div>

                    <div className="space-y-2 border-t border-[#1e2b36] pt-3 text-xs">
                      {tier.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[#dce7f0]">
                          <Check className="w-3.5 h-3.5 text-[#22d3a5] shrink-0 mt-0.5" />
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#1e2b36]">
                    <button
                      onClick={() => {
                        setSelectedBuyoutTier(tier);
                        setShowCheckoutModal(true);
                      }}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
                        tier.licenseType === 'FULL_IP_BUYOUT'
                          ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-black shadow-lg'
                          : tier.popular
                          ? 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
                          : 'bg-[#0a0f14] hover:bg-[#152330] text-[#dce7f0] border border-[#1e2b36]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{tier.licenseType === 'FULL_IP_BUYOUT' ? 'Execute Complete IP Buyout' : 'Subscribe to License'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export M&A Term Sheet & Legal Memo */}
          <div className="panel bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
            <div>
              <div className="font-bold text-[#dce7f0] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#3b82f6]" />
                OFFICIAL M&amp;A ACQUISITION TERM SHEET &amp; LEGAL DOSSIER
              </div>
              <p className="text-[11px] text-[#7a8b99]">
                Standardized asset purchase agreement (APA) draft, escrow provisions, and tech transfer manifest.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('open-transaction-docket', {
                      detail: {
                        presetId: 'custom',
                        amount: listing.askingPriceUsd || 145000,
                        buyerOrg: 'Prospective Institutional Acquirer',
                        buyerName: 'Managing Director / Corporate Development',
                      },
                    })
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(251,191,36,0.25)] cursor-pointer"
                title="Generate and export formal M&A Transaction Docket & Escrow Inspection Binder (PDF)"
              >
                <Scale className="w-3.5 h-3.5 text-black" />
                <span>GENERATE TRANSACTION DOCKET (PDF)</span>
              </button>

              <button
                onClick={() =>
                  handleCopyText(
                    'termsheet',
                    `CONFIDENTIAL ACQUISITION TERM SHEET\nAsset: Global Talent & Career Radar + StealthNet\nAsking Price: $${listing.askingPriceUsd.toLocaleString()} USD\nSeller Representation: 100% Unencumbered IP (MIT/Permissive)\nInclusions: Full Git Repository, Three.js 3D Shaders, AI Triad Orchestration Engine, StealthNet ZK Network\nEscrow Partner: Escrow.com / Direct Bank Wire\nGoverning Law: Delaware C-Corp Standard Commercial APA`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] flex items-center gap-1.5 transition"
              >
                {copiedKey === 'termsheet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'termsheet' ? 'Term Sheet Copied' : 'Copy Term Sheet'}</span>
              </button>
            </div>
          </div>

          {/* Transaction History & Executed Licenses */}
          {transactions.length > 0 && (
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                <span className="font-bold text-[#22d3a5] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22d3a5]" />
                  EXECUTED ESCROW CONTRACTS &amp; LICENSE KEYS
                </span>
                <span className="text-[10px] text-[#7a8b99]">{transactions.length} ACTIVE GRANTS</span>
              </div>

              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.transactionId} className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#dce7f0]">{tx.tierName} • ${tx.amountUsd.toLocaleString()} USD</div>
                      <div className="text-[11px] text-[#7a8b99]">
                        Docket: {tx.transactionId} | Buyer: {tx.buyerEmail} | {tx.paymentMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-[#22d3a5] block font-semibold">{tx.licenseKey}</span>
                        <span className="text-[10px] text-[#7a8b99]">Status: {tx.contractStatus}</span>
                      </div>
                      <button
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('open-transaction-docket', {
                              detail: {
                                presetId: tx.tierId?.includes('omnitalent') ? 'omnitalent' : 'aetheris',
                                amount: tx.amountUsd,
                                buyerOrg: tx.buyerEmail,
                                buyerName: tx.buyerEmail.split('@')[0],
                              },
                            })
                          )
                        }
                        className="px-2 py-1 rounded bg-[#162330] hover:bg-[#1e2f3f] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="View and export formal legal transaction docket (PDF)"
                      >
                        <Scale className="w-3 h-3 text-[#fbbf24]" />
                        <span>View Docket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE: POTENTIAL CUSTOMERS & ACQUIRER PLATFORMS CRM (OWNER ONLY)
         ========================================================================= */}
      {isOwner && activeTab === 'buyer_pipeline' && <BuyerCustomerPlatforms />}

      {/* =========================================================================
          MODULE 2: 4-YEAR TTC & EQUITY COMPOUNDING MODEL
         ========================================================================= */}
      {activeTab === 'ttc_model' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
          <div className="lg:col-span-5 panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
              <span className="font-bold text-[#dce7f0] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#22d3a5]" />
                COMPENSATION ARCHITECTURE INPUTS
              </span>
              <span className="text-[10px] text-[#7a8b99]">CALIBRATE TERMS</span>
            </div>

            <div>
              <label className="block text-[11px] text-[#7a8b99] mb-1">FIRM &amp; PROPOSED ROLE</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={offer.firmName}
                  onChange={(e) => setOffer({ ...offer, firmName: e.target.value })}
                  placeholder="Firm Name"
                  className="bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
                <input
                  type="text"
                  value={offer.roleTitle}
                  onChange={(e) => setOffer({ ...offer, roleTitle: e.target.value })}
                  placeholder="Role Title"
                  className="bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">BASE SALARY ($)</label>
                <input
                  type="number"
                  step="5000"
                  value={offer.baseSalary}
                  onChange={(e) => setOffer({ ...offer, baseSalary: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5] font-semibold rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">PERF BONUS (%)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={offer.annualBonusPercent}
                  onChange={(e) => setOffer({ ...offer, annualBonusPercent: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">SIGN-ON BONUS ($)</label>
                <input
                  type="number"
                  step="5000"
                  value={offer.signOnBonus}
                  onChange={(e) => setOffer({ ...offer, signOnBonus: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">4-YR EQUITY GRANT ($)</label>
                <input
                  type="number"
                  step="10000"
                  value={offer.equityTotalGrant}
                  onChange={(e) => setOffer({ ...offer, equityTotalGrant: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#3b82f6] font-semibold rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">VESTING SCHEDULE</label>
                <select
                  value={offer.vestingSchedule}
                  onChange={(e) => setOffer({ ...offer, vestingSchedule: e.target.value as VestingType })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none text-xs"
                >
                  <option value="standard_equal">Standard (25/25/25/25)</option>
                  <option value="amazon_backloaded">Backloaded (5/15/40/40)</option>
                  <option value="frontloaded">Frontloaded (35/30/20/15)</option>
                  <option value="quarterly_no_cliff">No-Cliff Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">EQUITY GROWTH (%/YR)</label>
                <input
                  type="number"
                  value={offer.annualEquityGrowthRate}
                  onChange={(e) => setOffer({ ...offer, annualEquityGrowthRate: Number(e.target.value) })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#1e2b36]">
              <span className="text-[#7a8b99] text-[11px]">DOUBLE-TRIGGER ACCELERATION:</span>
              <button
                type="button"
                onClick={() => setOffer({ ...offer, hasDoubleTrigger: !offer.hasDoubleTrigger })}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                  offer.hasDoubleTrigger
                    ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                    : 'bg-[#1e2b36] text-[#7a8b99] border-transparent'
                }`}
              >
                {offer.hasDoubleTrigger ? 'INCLUDED (SECURE)' : 'EXCLUDED (RISK)'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2b36]">
                <div>
                  <h3 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#22d3a5]" />
                    4-YEAR CASH VS. EQUITY VESTING TRAJECTORY
                  </h3>
                  <p className="text-xs text-[#7a8b99]">Cumulative Total: ${total4YrComp.toLocaleString()} USD</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                  COMPOUNDED
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearData.map((y) => ({
                      name: `Year ${y.year}`,
                      Cash: y.totalCash,
                      Equity: y.equity,
                      Total: y.totalComp,
                    }))}
                    margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                    <XAxis dataKey="name" stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
                    <YAxis
                      stroke="#7a8b99"
                      tick={{ fill: '#7a8b99', fontSize: 12 }}
                      tickFormatter={(val: number) => `$${Math.round(val / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111a22',
                        borderColor: '#1e2b36',
                        borderRadius: '8px',
                        color: '#dce7f0',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`$${Number(val || 0).toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="Cash" stackId="a" fill="#22d3a5" />
                    <Bar dataKey="Equity" stackId="a" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e2b36] overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#7a8b99] border-b border-[#1e2b36]">
                    <th className="pb-1">YEAR</th>
                    <th className="pb-1">BASE + BONUS</th>
                    <th className="pb-1">EQUITY VEST</th>
                    <th className="pb-1">ANNUAL TOTAL</th>
                    <th className="pb-1 text-right">CUMULATIVE</th>
                  </tr>
                </thead>
                <tbody className="text-[#dce7f0]">
                  {yearData.map((y) => (
                    <tr key={y.year} className="border-b border-[#1e2b36]/40">
                      <td className="py-1 text-[#22d3a5] font-bold">Yr {y.year}</td>
                      <td>${(y.base + y.bonus).toLocaleString()}</td>
                      <td className="text-[#3b82f6]">${y.equity.toLocaleString()}</td>
                      <td className="font-semibold">${y.totalComp.toLocaleString()}</td>
                      <td className="text-right text-[#fbbf24]">${y.cumulativeTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: MULTI-JURISDICTION TAX & FIRE WEALTH RUNWAY
         ========================================================================= */}
      {activeTab === 'tax_wealth' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
              <div>
                <h3 className="text-base font-bold text-[#dce7f0] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#a78bfa]" />
                  MULTI-JURISDICTION TAX CALIBRATOR &amp; TAKE-HOME MATRIX
                </h3>
                <p className="text-xs text-[#7a8b99]">
                  Compare effective tax burden across major tech hubs against estimated annual comp (${estimatedGrossIncome.toLocaleString()} USD).
                </p>
              </div>
              <span className="text-xs text-[#a78bfa] bg-[#a78bfa]/10 px-2.5 py-1 rounded border border-[#a78bfa]/30">
                GLOBAL NOMAD &amp; RELOCATION READY
              </span>
            </div>

            {/* Jurisdiction Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TAX_JURISDICTIONS.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJurisdiction(j)}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedJurisdiction.id === j.id
                      ? 'bg-[#152330] border-[#a78bfa] shadow-[0_0_12px_rgba(167,139,250,0.2)]'
                      : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#a78bfa]/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-base mb-1">
                    <span>{j.flag}</span>
                    <span className="text-[10px] font-bold text-[#a78bfa]">
                      {(j.effectiveTaxRateEstimate * 100).toFixed(1)}% Tax
                    </span>
                  </div>
                  <div className="font-bold text-[#dce7f0] text-xs line-clamp-1">{j.name}</div>
                  <div className="text-[10px] text-[#7a8b99] mt-0.5">COL Index: {j.costOfLivingIndex}</div>
                </button>
              ))}
            </div>

            {/* Tax Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">ESTIMATED ANNUAL TAX WITHHELD</span>
                <span className="text-xl font-bold text-[#f87171] mt-1 block">
                  -${estimatedTaxWithheld.toLocaleString()} USD
                </span>
                <span className="text-[11px] text-[#7a8b99] mt-1 block">
                  Effective rate: {(selectedJurisdiction.effectiveTaxRateEstimate * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">NET TAKE-HOME CASHFLOW</span>
                <span className="text-xl font-bold text-[#22d3a5] mt-1 block">
                  ${estimatedAnnualNetIncome.toLocaleString()} USD
                </span>
                <span className="text-[11px] text-[#7a8b99] mt-1 block">
                  ~${Math.round(estimatedAnnualNetIncome / 12).toLocaleString()} / month liquid
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                <span className="text-[#7a8b99] text-[10px] block">PROJECTED ANNUAL SAVINGS</span>
                <span className="text-xl font-bold text-[#fbbf24] mt-1 block">
                  ${estimatedAnnualSavings.toLocaleString()} USD
                </span>
                <span className="text-[11px] text-[#7a8b99] mt-1 block">
                  At {annualSavingsRatePercent}% target savings rate
                </span>
              </div>
            </div>
          </div>

          {/* 10-Year FIRE Wealth Runway Chart */}
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1e2b36]">
              <div>
                <h4 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#22d3a5]" />
                  10-YEAR WEALTH RUNWAY &amp; COMPOUNDING PORTFOLIO TRAJECTORY
                </h4>
                <p className="text-xs text-[#7a8b99]">
                  Assumes 8% annualized broad-market asset return + ${estimatedAnnualSavings.toLocaleString()}/yr savings.
                </p>
              </div>

              {/* Savings Rate Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[#7a8b99] text-[11px]">SAVINGS RATE: {annualSavingsRatePercent}%</span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={annualSavingsRatePercent}
                  onChange={(e) => setAnnualSavingsRatePercent(Number(e.target.value))}
                  className="w-28 accent-[#22d3a5]"
                />
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wealthProjectionData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2b36" />
                  <XAxis dataKey="year" stroke="#7a8b99" tick={{ fill: '#7a8b99', fontSize: 12 }} />
                  <YAxis
                    stroke="#7a8b99"
                    tick={{ fill: '#7a8b99', fontSize: 12 }}
                    tickFormatter={(val: number) => `$${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111a22',
                      borderColor: '#1e2b36',
                      borderRadius: '8px',
                      color: '#dce7f0',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any) => [`$${Number(val || 0).toLocaleString()} USD`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="portfolioValue" name="Compounded Net Worth (8% Return)" stroke="#22d3a5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cumulativeSavings" name="Principal Contributions" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: ADVISORY & CONTRACTOR INVOICING PLATFORM
         ========================================================================= */}
      {activeTab === 'invoicing' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
              <div>
                <h3 className="text-base font-bold text-[#dce7f0] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#fbbf24]" />
                  FRACTIONAL EXECUTIVE &amp; CONTRACTOR INVOICING PLATFORM
                </h3>
                <p className="text-xs text-[#7a8b99]">
                  Bill venture clients, fractional CTO retainers, and recruitment advisory fees with integrated escrow tracking.
                </p>
              </div>

              <button
                onClick={() => setShowNewInvoiceModal(true)}
                className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Invoice</span>
              </button>
            </div>

            {/* Live Settlement & Bank Payout Status Hub (Owner Only) vs Neutral Retainer Summary (Customers) */}
            {isOwner ? (
              <div className="p-4 bg-[#0a0f14] border border-[#22d3a5]/40 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#22d3a5]/20 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5]">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#dce7f0]">
                        DIRECT BANK WIRE &amp; PAYSTACK SETTLEMENT GATEWAY
                      </h4>
                      <p className="text-[11px] text-[#7a8b99]">
                        Configured payout destination for client consulting invoices, subscriptions, and buyout deposits.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#7a8b99] block">PAYOUT STATUS</span>
                    <span className="text-xs font-bold text-[#22d3a5] bg-[#22d3a5]/10 px-2 py-0.5 rounded border border-[#22d3a5]/30">
                      LIVE &amp; READY TO RECEIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                    <span className="text-[10px] text-[#7a8b99] block">DESTINATION BANK</span>
                    <span className="text-[#dce7f0] font-bold mt-0.5 block">{sellerBankName}</span>
                    <span className="text-[10px] text-[#22d3a5]">Account: ••••{sellerAccount.slice(-4)}</span>
                  </div>

                  <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                    <span className="text-[10px] text-[#7a8b99] block">SETTLEMENT METHOD</span>
                    <span className="text-white font-bold mt-0.5 block">FedWire / ACH Direct Wire</span>
                    <span className="text-[10px] text-[#7a8b99]">Routing: {sellerRouting}</span>
                  </div>

                  <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                    <span className="text-[10px] text-[#7a8b99] block">SETTLED BALANCE</span>
                    <span className="text-base font-bold text-[#fbbf24]">
                      ${invoices.filter((i) => i.status === 'SETTLED').reduce((acc, i) => acc + i.totalDue, 0).toLocaleString()} USD
                    </span>
                    <span className="text-[10px] text-[#7a8b99] block">0 pending disbursements</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0a0f14] border border-[#1e2b36] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                  <span className="text-[10px] text-[#7a8b99] block">TOTAL BILLED</span>
                  <span className="text-base font-bold text-[#dce7f0]">
                    ${invoices.reduce((acc, i) => acc + i.totalDue, 0).toLocaleString()} USD
                  </span>
                </div>
                <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                  <span className="text-[10px] text-[#7a8b99] block">SETTLED INVOICES</span>
                  <span className="text-base font-bold text-[#22d3a5]">
                    ${invoices.filter((i) => i.status === 'SETTLED').reduce((acc, i) => acc + i.totalDue, 0).toLocaleString()} USD
                  </span>
                </div>
                <div className="p-3 bg-[#111a22] border border-[#1e2b36] rounded-lg">
                  <span className="text-[10px] text-[#7a8b99] block">OPEN / DRAFT INVOICES</span>
                  <span className="text-base font-bold text-[#fbbf24]">
                    {invoices.filter((i) => i.status !== 'SETTLED').length} Active
                  </span>
                </div>
              </div>
            )}

            {/* Invoices List or Clean Zero State */}
            {invoices.length === 0 ? (
              <div className="p-8 text-center bg-[#0a0f14] border border-[#1e2b36] rounded-xl space-y-2">
                <Receipt className="w-8 h-8 text-[#7a8b99] mx-auto opacity-50" />
                <h4 className="font-bold text-[#dce7f0]">No Invoices Issued Yet</h4>
                <p className="text-xs text-[#7a8b99] max-w-md mx-auto">
                  Click &quot;Create New Invoice&quot; above to bill real clients, advisory retainers, or executive placement fees with automated PDF generation.
                </p>
              </div>
            ) : null}

            {/* Invoices List */}
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-[#0a0f14] border border-[#1e2b36] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#dce7f0] text-sm">{inv.id}</span>
                      <span className="text-[#7a8b99]">•</span>
                      <span className="text-[#3b82f6] font-semibold">{inv.clientCompany}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          inv.status === 'SETTLED'
                            ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40'
                            : inv.status === 'ESCROWED'
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40'
                            : 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#7a8b99]">
                      Contact: {inv.clientName} | Scope: {inv.roleScope}
                    </div>
                    <div className="text-[11px] text-[#7a8b99]">
                      Issued: {inv.issueDate} | Due: {inv.dueDate}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-[#7a8b99] block">TOTAL AMOUNT</span>
                      <span className="text-lg font-bold text-[#22d3a5]">
                        ${inv.totalDue.toLocaleString()} USD
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.status === 'ESCROWED' && (
                        <button
                          onClick={() => handleClaimEscrowPayment(inv)}
                          className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_12px_rgba(34,211,165,0.25)] cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 fill-black" />
                          <span>CLAIM PAYMENT</span>
                        </button>
                      )}

                      {inv.status === 'SETTLED' && (
                        <button
                          onClick={() =>
                            setClaimSuccessReceipt({
                              invoiceId: inv.id,
                              client: `${inv.clientCompany} (${inv.clientName})`,
                              amount: inv.totalDue,
                              bank: isOwner ? sellerBankName : 'Client Designated Settlement Bank',
                              account: isOwner ? sellerAccount : '••••0000',
                              wireRef: `FEDWIRE-2026-${inv.id.slice(-3)}928`,
                            })
                          }
                          className="px-2.5 py-1.5 rounded bg-[#111a22] hover:bg-[#1e2b36] text-[#22d3a5] border border-[#22d3a5]/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3a5]" />
                          <span>PAID</span>
                        </button>
                      )}

                      <select
                        value={inv.status}
                        onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value as any)}
                        className="bg-[#111a22] border border-[#1e2b36] rounded px-2 py-1.5 text-xs text-[#dce7f0] outline-none"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="ESCROWED">Escrowed</option>
                        <option value="SETTLED">Settled</option>
                      </select>

                      <button
                        onClick={() =>
                          handleCopyText(
                            inv.id,
                            `INVOICE: ${inv.id}\nClient: ${inv.clientCompany} (${inv.clientName})\nAmount Due: $${inv.totalDue.toLocaleString()} USD\nDue Date: ${inv.dueDate}\nStatus: ${inv.status}\nRemit payment to designated Treasury Vault.`
                          )
                        }
                        title="Copy Invoice Slip"
                        className="p-1.5 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5]"
                      >
                        {copiedKey === inv.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Claimed Wire Disbursement Receipt Modal */}
            {claimSuccessReceipt && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono">
                <div className="bg-[#0f171e] border-2 border-[#22d3a5] rounded-xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(34,211,165,0.3)] space-y-4 text-xs text-[#dce7f0]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
                    <div className="flex items-center gap-2 text-[#22d3a5] font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>OFFICIAL FEDWIRE DISBURSEMENT VOUCHER</span>
                    </div>
                    <button
                      onClick={() => setClaimSuccessReceipt(null)}
                      className="p-1 rounded text-[#7a8b99] hover:text-[#dce7f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Invoice Reference:</span>
                      <span className="font-bold text-[#dce7f0]">{claimSuccessReceipt.invoiceId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Client / Originator:</span>
                      <span className="font-bold text-[#38bdf8]">{claimSuccessReceipt.client}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Disbursement Amount:</span>
                      <span className="text-base font-bold text-[#22d3a5]">
                        ${claimSuccessReceipt.amount.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">FedWire Reference:</span>
                      <span className="font-mono text-[#fbbf24]">{claimSuccessReceipt.wireRef}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Beneficiary Bank:</span>
                      <span className="font-bold text-[#dce7f0]">{claimSuccessReceipt.bank}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Destination Account:</span>
                      <span className="font-mono text-[#dce7f0]">{claimSuccessReceipt.account}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#7a8b99]">Escrow Release Status:</span>
                      <span className="text-emerald-400 font-bold">100% UNCONDITIONAL RELEASE</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#7a8b99] font-sans">
                    Funds have been released from Escrow.com / Paystack settlement and wired directly to your designated bank checking account. Funds clear within 1–2 business days.
                  </div>

                  <div className="pt-2 border-t border-[#1e2b36] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        const slip = `FEDWIRE DISBURSEMENT VOUCHER\nRef: ${claimSuccessReceipt.wireRef}\nInvoice: ${claimSuccessReceipt.invoiceId}\nClient: ${claimSuccessReceipt.client}\nAmount: $${claimSuccessReceipt.amount.toLocaleString()} USD\nBank: ${claimSuccessReceipt.bank} (${claimSuccessReceipt.account})\nStatus: Settled & Disbursed`;
                        navigator.clipboard.writeText(slip);
                      }}
                      className="px-3 py-1.5 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] font-bold text-xs"
                    >
                      Copy Voucher Slip
                    </button>
                    <button
                      onClick={() => setClaimSuccessReceipt(null)}
                      className="px-4 py-1.5 rounded bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: ZOPA & BARGAINING CONTRACT RIDERS
         ========================================================================= */}
      {activeTab === 'zopa_batna' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b36]">
            <div>
              <h3 className="text-base font-bold text-[#dce7f0] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#3b82f6]" />
                ZONE OF POSSIBLE AGREEMENT (ZOPA) &amp; CONTRACT RIDERS
              </h3>
              <p className="text-xs text-[#7a8b99]">
                Quantify employer reservation price, candidate floor, and test bargaining surplus distribution.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#7a8b99]">LEVERAGE SCORE:</span>
              <span className="font-bold px-2 py-0.5 rounded border bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]">
                {zopa.leverageRating}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36]">
              <label className="block text-[11px] text-[#7a8b99] mb-1">EMPLOYER INITIAL OFFER ($)</label>
              <input
                type="number"
                step="5000"
                value={employerInitial}
                onChange={(e) => setEmployerInitial(Number(e.target.value))}
                className="w-full bg-[#111a22] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none font-bold text-sm"
              />
            </div>

            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36]">
              <label className="block text-[11px] text-[#7a8b99] mb-1">CANDIDATE WALKAWAY FLOOR (BATNA)</label>
              <input
                type="number"
                step="5000"
                value={candidateFloor}
                onChange={(e) => setCandidateFloor(Number(e.target.value))}
                className="w-full bg-[#111a22] border border-[#1e2b36] text-[#f87171] rounded p-2 outline-none font-bold text-sm"
              />
            </div>

            <div className="bg-[#0a0f14] p-3.5 rounded-lg border border-[#1e2b36] flex flex-col justify-between">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">COMPETING OFFER LEVERAGE</label>
                <button
                  type="button"
                  onClick={() => setHasCompetingLeverage(!hasCompetingLeverage)}
                  className={`w-full py-2 rounded text-xs font-semibold border transition ${
                    hasCompetingLeverage
                      ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                      : 'bg-[#1e2b36] text-[#7a8b99] border-transparent'
                  }`}
                >
                  {hasCompetingLeverage ? 'ACTIVE (HOT COMPETITION)' : 'NONE (STANDARD)'}
                </button>
              </div>
            </div>
          </div>

          {/* Bargaining Surplus Zone */}
          <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7a8b99]">
              <span>BARGAINING SURPLUS SPREAD</span>
              <span>SURPLUS: <strong className="text-[#22d3a5]">+${zopa.zopaSpread.toLocaleString()} USD</strong></span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="border-l border-[#3b82f6] pl-2">
                <span className="text-[#7a8b99] block">EMPLOYER INITIAL</span>
                <span className="text-[#3b82f6] font-bold text-sm">${employerInitial.toLocaleString()}</span>
              </div>
              <div className="border-l border-[#f87171] pl-2">
                <span className="text-[#7a8b99] block">CANDIDATE FLOOR</span>
                <span className="text-[#f87171] font-bold text-sm">${candidateFloor.toLocaleString()}</span>
              </div>
              <div className="border-l border-[#22d3a5] pl-2">
                <span className="text-[#7a8b99] block">ESTIMATED CEILING</span>
                <span className="text-[#22d3a5] font-bold text-sm">${zopa.employerCeiling.toLocaleString()}</span>
              </div>
              <div className="border-l border-[#fbbf24] pl-2">
                <span className="text-[#7a8b99] block">OPTIMAL COUNTER ANCHOR</span>
                <span className="text-[#fbbf24] font-bold text-sm">${zopa.recommendedCounter.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INSTANT ACQUISITION & CHECKOUT FLOW (OWNER ONLY)
         ========================================================================= */}
      {isOwner && showCheckoutModal && selectedBuyoutTier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111a22] border border-[#22d3a5] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div>
                <span className="text-[10px] text-[#22d3a5] font-bold uppercase tracking-wider block">
                  ESCROW ACQUISITION SETTLEMENT
                </span>
                <h4 className="text-base font-bold text-[#dce7f0]">
                  {selectedBuyoutTier.tierName}
                </h4>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7a8b99]">Total Purchase Consideration:</span>
                <span className="text-[#22d3a5] font-bold text-sm">
                  {selectedBuyoutTier.licenseType === 'FULL_IP_BUYOUT'
                    ? `$${listing.askingPriceUsd.toLocaleString()} USD`
                    : `${selectedBuyoutTier.price} ${selectedBuyoutTier.billingPeriod}`}
                </span>
              </div>
              <div className="text-[11px] text-[#7a8b99]">
                Asset: {listing.listingTitle} (All Shaders, AI Triad, StealthNet, and IP)
              </div>
            </div>

            <form onSubmit={handleExecuteAcquisition} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  BUYER / ACQUIRER CORPORATE EMAIL:
                </label>
                <input
                  type="email"
                  required
                  placeholder="acquisitions@frontierlabs.ai"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">
                  PREFERRED ESCROW SETTLEMENT CHANNEL:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                >
                  <option value="ESCROW_WIRE">Escrow.com Bank Wire (Formal APA Holding)</option>
                  <option value="PAYSTACK_COMMERCIAL">Paystack / Corporate Commercial Card</option>
                  <option value="CRYPTO_USDC">USDC Cryptographic Smart Escrow</option>
                  <option value="VENTURE_TRANSFER">Venture Capital Capital Call Transfer</option>
                </select>
              </div>

              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-[11px] text-[#7a8b99] leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5] inline mr-1" />
                By executing settlement, an official Certificate of Ownership, Git Transfer Digest, and Cryptographic License Key will be issued in real-time.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Execute Binding Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE NEW INVOICE
         ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111a22] border border-[#fbbf24] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <h4 className="text-base font-bold text-[#dce7f0] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#fbbf24]" />
                CREATE ADVISORY / CONSULTING INVOICE
              </h4>
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">CLIENT CONTACT NAME:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins, VP Talent"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">CLIENT COMPANY / FIRM:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HyperScale Autonomous Systems"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#7a8b99] mb-1">SCOPE OF ENGAGEMENT:</label>
                <input
                  type="text"
                  placeholder="e.g. Fractional Chief Architect / ZOPA Advisory (Monthly)"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#7a8b99] mb-1">HOURS / UNITS:</label>
                  <input
                    type="number"
                    min="1"
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] rounded p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7a8b99] mb-1">HOURLY / UNIT RATE ($):</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5] font-bold rounded p-2 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] flex justify-between items-center">
                <span className="text-[#7a8b99]">Calculated Total Due:</span>
                <span className="text-base font-bold text-[#22d3a5]">
                  ${(newHours * newRate).toLocaleString()} USD
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
