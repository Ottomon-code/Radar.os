import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Lock,
  Send,
  DollarSign,
  ShieldCheck,
  FileText,
  Landmark,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Scale,
  KeyRound,
} from 'lucide-react';
import { BuyerThread } from '../utils/buyerCommsEngine';
import { auth } from '../firebase';

interface BuyerCommunicationPanelProps {
  initialThreadId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function BuyerCommunicationPanel({
  initialThreadId,
  onClose,
  isModal = false,
}: BuyerCommunicationPanelProps) {
  const [threads, setThreads] = useState<BuyerThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(initialThreadId || '');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [commsError, setCommsError] = useState<string | null>(null);

  const [filterStage, setFilterStage] = useState<string>('All');
  const [replyText, setReplyText] = useState('');
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [includeDocketAttachment, setIncludeDocketAttachment] = useState(false);
  const [includeDossierAttachment, setIncludeDossierAttachment] = useState(false);
  const [includePlayStoreAttachment, setIncludePlayStoreAttachment] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const loadBuyerThreads = async () => {
    setIsLoadingThreads(true);
    setCommsError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setCommsError('Sign in with your verified owner account to load M&A buyer deal channels.');
        return;
      }
      const res = await fetch('/api/buyer/comms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch buyer communication threads.');
      }
      const list = Array.isArray(data) ? data : [];
      setThreads(list);
      if (list.length > 0) {
        setSelectedThreadId((prev) =>
          initialThreadId && list.some((t) => t.id === initialThreadId)
            ? initialThreadId
            : prev && list.some((t) => t.id === prev)
            ? prev
            : list[0].id
        );
      }
    } catch (err: any) {
      setCommsError(err?.message || 'Unable to connect to /api/buyer/comms.');
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadBuyerThreads();
  }, []);

  useEffect(() => {
    if (initialThreadId && threads.some((t) => t.id === initialThreadId)) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isSending]);

  const filteredThreads = threads.filter((t) => {
    if (filterStage === 'All') return true;
    return t.dealStage === filterStage;
  });

  const handleUpdateDealStage = async (stage: BuyerThread['dealStage']) => {
    if (!activeThread) return;
    setCommsError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setCommsError('Owner authentication token required to update deal stage.');
        return;
      }
      const res = await fetch('/api/buyer/comms/stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ threadId: activeThread.id, stage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update deal stage.');
      }
      if (data.thread) {
        setThreads((prev) => prev.map((t) => (t.id === data.thread.id ? data.thread : t)));
      }
    } catch (err: any) {
      setCommsError(err?.message || 'Unable to update deal stage.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeThread || isSending) return;

    const messageText = replyText.trim();
    const parsedPrice = counterPrice ? Number(counterPrice.replace(/[^0-9]/g, '')) : undefined;

    setIsSending(true);
    setCommsError(null);

    const attachmentsList = [];
    if (includeDocketAttachment) {
      attachmentsList.push({ name: 'talent-radar-technical-docket.pdf', type: 'pdf', size: '2.8 MB' });
    }
    if (includeDossierAttachment) {
      attachmentsList.push({ name: 'OmniTalent_Executive_Client_Dossier.pdf', type: 'pdf', size: '1.4 MB' });
    }
    if (includePlayStoreAttachment) {
      attachmentsList.push({ name: 'talentradar-android-playstore-package.zip', type: 'zip', size: '318 KB' });
    }
    const attachments = attachmentsList.length > 0 ? attachmentsList : undefined;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Owner authentication required to dispatch M&A buyer messages.');
      }
      const res = await fetch('/api/buyer/comms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: activeThread.id,
          text: messageText,
          proposedPrice: parsedPrice,
          attachments,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Buyer comms AI dispatch failed. Ensure GEMINI_API_KEY is configured in Settings > Secrets.'
        );
      }

      if (data.thread) {
        setThreads((prev) => prev.map((t) => (t.id === data.thread.id ? data.thread : t)));
      }
      setReplyText('');
      setCounterPrice('');
      setIncludeDocketAttachment(false);
      setIncludeDossierAttachment(false);
      setIncludePlayStoreAttachment(false);
    } catch (err: any) {
      setCommsError(
        err?.message ||
          'Failed to dispatch message via /api/buyer/comms/send. Configure GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (
    template: 'counter' | 'escrow' | 'docket' | 'nda' | 'omnitalent' | 'branded_dossier' | 'playstore_confirm'
  ) => {
    if (!activeThread) return;
    if (template === 'playstore_confirm') {
      setCounterPrice('145000');
      setIncludePlayStoreAttachment(true);
      setReplyText(
        `Confirmation: The Google Play Store bundle and Digital Asset Links (https://talentradar.io/.well-known/assetlinks.json) are verified and actively serving HTTP 200 with CORS enabled. The Android TWA package is com.talentradar.app with SHA-256 fingerprints active for full-screen standalone execution. The complete build bundle is downloadable at /api/playstore/bundle. We agree to the standard 48-hour escrow inspection window and are ready to execute the $145,000 USD transaction via Escrow.com.`
      );
    } else if (template === 'omnitalent') {
      setIncludeDossierAttachment(true);
      setReplyText(
        `Hi ${activeThread.buyerName || 'there'}, custom agency presentation branding and vector PDF dossier export are operational. We've activated the executive search presentation preset with confidential client watermarks, client sign-off covenants, and authorized signature blocks. You can review the live branded dossier or export print-ready vector PDFs anytime.`
      );
    } else if (template === 'branded_dossier') {
      setIncludeDossierAttachment(true);
      setReplyText(
        `Custom agency presentation branding and vector PDF dossier export are operational. We support custom branding presets (OmniTalent AI, Vanguard M&A, TalentRadar Standard, and custom agencies) with custom theme color palettes, client reference watermarks, and client presentation sign-off lines.`
      );
    } else if (template === 'counter') {
      setCounterPrice('145000');
      setReplyText(
        `Thank you for your review. We are willing to execute a definitive Asset Purchase Agreement anchored at our firm valuation of $145,000 USD. This covers 100% intellectual property, full commercial source code, the verified Android Play Store TWA bundle, and the canonical domain talentradar.io.`
      );
    } else if (template === 'escrow') {
      setReplyText(
        `We are ready to initiate the Escrow.com closing sequence. Please authorize the 10% earnest money deposit ($14,500 USD) through the Escrow.com portal to lock in the 48-hour technical inspection window.`
      );
    } else if (template === 'docket') {
      setIncludeDocketAttachment(true);
      setReplyText(
        `Enclosed is our technical architecture diligence packet. It confirms zero fatal vulnerabilities, modular Three.js WebGL rendering, offline Service Worker runtime caching, and complete Google Cloud Run deployment parity.`
      );
    } else if (template === 'nda') {
      setReplyText(
        `Our standard mutual technology acquisition NDA is executed and counter-signed. We have granted your diligence squad access to the encrypted repository files.`
      );
    }
  };

  const handleCopyDealSummary = () => {
    if (!activeThread) return;
    const text = `TalentRadar Acquisition Thread - ${activeThread.organization}\nContact: ${activeThread.buyerName} (${activeThread.email})\nTarget: ${activeThread.targetDeal}\nStage: ${activeThread.dealStage}\nStatus: ${activeThread.status}`;
    navigator.clipboard.writeText(text);
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2000);
  };

  return (
    <div className={`space-y-4 ${isModal ? 'p-1' : ''}`}>
      {/* Top Banner / Channel Descriptor */}
      <div className="panel bg-[#111a22] border border-[#22d3a5]/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#22d3a5]/20 to-[#38bdf8]/20 border border-[#22d3a5]/40 text-[#22d3a5]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#dce7f0] font-mono flex items-center gap-2">
                APP BUYER &amp; ACQUIRER COMMUNICATIONS DISPATCH
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30 font-bold font-mono">
                M&amp;A DOCKET
              </span>
            </div>
            <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
              Server-persisted deal channels powered by Gemini 4 Hydrogen counterparty synthesis &amp; Escrow.com closing workflows.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={loadBuyerThreads}
            disabled={isLoadingThreads}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0f14] hover:bg-[#162330] border border-[#1e2b36] text-[#dce7f0] font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingThreads ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-transfer-modal'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa] text-[#a78bfa] font-bold text-xs font-mono transition cursor-pointer shadow-[0_0_12px_rgba(167,139,250,0.15)] active:scale-95"
            title="Open Domain & Asset Credentials Transfer Vault for Buyer Inspection"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>🔐 ASSET TRANSFER VAULT</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5]">
            <Lock className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>ESCROW-PROTECTED CHANNELS</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#2a3c4b] text-gray-300 hover:text-white transition cursor-pointer"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {commsError && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{commsError}</span>
        </div>
      )}

      {/* Main 2-Column Interface: Left Threads List + Right Message Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Active Buyer Pipeline & Threads (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Stage Filter */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono bg-[#0a0f14] p-1 rounded-lg border border-[#1e2b36]">
            {['All', 'LOI Negotiation', 'Technical Due Diligence', 'NDA Signed'].map((stage) => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                  filterStage === stage
                    ? 'bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/30'
                    : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                {stage === 'Technical Due Diligence' ? 'Due Diligence' : stage}
              </button>
            ))}
          </div>

          {/* Threads List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {isLoadingThreads && filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#38bdf8] bg-[#0a0f14] rounded-xl border border-[#1e2b36] space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                <div>LOADING SERVER DEAL CHANNELS...</div>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#7a8b99] bg-[#0a0f14] rounded-xl border border-[#1e2b36] space-y-2">
                <Building2 className="w-8 h-8 text-[#7a8b99] mx-auto opacity-40" />
                <div className="font-bold text-[#dce7f0]">No Active Buyer Threads</div>
                <p className="text-[11px] max-w-[220px] mx-auto">
                  When buyers message you or submit inquiries on Acquire.com or Flippa, their live threads will appear here.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThread?.id;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#152330] border-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.15)]'
                        : 'bg-[#111a22] border-[#1e2b36] hover:border-[#2a3d4f] hover:bg-[#131d27]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#dce7f0] text-xs font-mono">
                            {thread.buyerName}
                          </span>
                          {thread.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#22d3a5] animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#7a8b99] font-sans truncate max-w-[190px]">
                          {thread.organization}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#7a8b99] whitespace-nowrap">
                        {thread.lastActivity}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2b36] text-[#38bdf8] font-mono border border-[#2b3d4f]">
                        {thread.buyerType}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                          thread.dealStage === 'LOI Negotiation'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : thread.dealStage === 'Escrow Funded'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {thread.dealStage}
                      </span>
                    </div>

                    <div className="mt-2.5 text-xs font-bold text-[#fbbf24] font-mono flex items-center justify-between">
                      <span>{thread.targetDeal}</span>
                      <span className="text-[10px] font-normal text-[#7a8b99]">{thread.escrowStatus}</span>
                    </div>

                    {lastMsg && (
                      <p className="mt-1.5 text-[11px] text-[#8e9fae] line-clamp-2 font-sans italic">
                        "{lastMsg.content}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Communication Thread & Composer (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#111a22] border border-[#1e2b36] rounded-xl overflow-hidden shadow-xl min-h-[580px]">
          {activeThread ? (
            <>
              {/* Buyer Dossier Header */}
              <div className="bg-[#0e161d] border-b border-[#1e2b36] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#dce7f0] font-mono">
                      {activeThread.buyerName}
                    </h3>
                    <span className="text-xs text-[#7a8b99] font-sans">
                      ({activeThread.buyerTitle})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-mono font-semibold">
                      {activeThread.escrowStatus}
                    </span>
                  </div>
                  <div className="text-xs text-[#38bdf8] font-mono mt-0.5 flex items-center gap-2">
                    <span>{activeThread.organization}</span>
                    <span className="text-gray-500">•</span>
                    <span>{activeThread.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7a8b99]">STAGE:</span>
                    <select
                      value={activeThread.dealStage}
                      onChange={(e) => handleUpdateDealStage(e.target.value as any)}
                      className="bg-[#162330] border border-[#2a3d4f] text-[#dce7f0] text-xs font-mono rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-[#22d3a5]"
                    >
                      <option value="Initial Inbound">Initial Inbound</option>
                      <option value="NDA Signed">NDA Signed</option>
                      <option value="Technical Due Diligence">Technical Due Diligence</option>
                      <option value="LOI Negotiation">LOI Negotiation</option>
                      <option value="Escrow Funded">Escrow Funded</option>
                      <option value="Asset Transfer & Closing">Asset Transfer &amp; Closing</option>
                    </select>
                  </div>

                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('open-transaction-docket', {
                          detail: {
                            presetId:
                              activeThread.id === 'buyer-thread-1'
                                ? 'aetheris'
                                : activeThread.id === 'buyer-thread-2'
                                ? 'vanguard'
                                : activeThread.id === 'buyer-thread-3'
                                ? 'omnitalent'
                                : 'custom',
                            buyerOrg: activeThread.organization,
                            buyerName: activeThread.buyerName,
                            amount: activeThread.proposedPriceUsd || 145000,
                          },
                        })
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] flex items-center gap-1.5 transition font-bold cursor-pointer"
                    title="Generate legal M&A transaction docket and escrow inspection binder (PDF)"
                  >
                    <Scale className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>GENERATE DOCKET</span>
                  </button>

                  <button
                    onClick={handleCopyDealSummary}
                    className="p-1.5 rounded-lg bg-[#162330] hover:bg-[#1e2f3f] text-[#7a8b99] hover:text-[#dce7f0] transition cursor-pointer"
                    title="Copy Buyer Thread Details"
                  >
                    {copiedInfo ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Deal Parameters Quick Bar */}
              <div className="bg-[#0a0f14] px-4 py-2 border-b border-[#1e2b36] text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-[#7a8b99]">
                <div className="flex items-center gap-3">
                  <span>
                    TARGET DEAL: <strong className="text-[#fbbf24]">{activeThread.targetDeal}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    BUYER BUDGET CAP: <strong className="text-[#dce7f0]">{activeThread.budgetCap}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#22d3a5]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>TRANSACTION ESCROW READY</span>
                </div>
              </div>

              {/* Quick Template Prompts */}
              <div className="bg-[#111a22] px-4 py-2 border-b border-[#1e2b36] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
                <span className="text-[#7a8b99] shrink-0">QUICK DISPATCH:</span>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('open-transaction-docket', {
                        detail: {
                          presetId: 'aetheris',
                          buyerOrg: activeThread.organization || 'Institutional Acquirer',
                          buyerName: activeThread.buyerName || 'Authorized Signatory',
                          amount: activeThread.proposedPriceUsd || 145000,
                        },
                      })
                    );
                  }}
                  className="px-2.5 py-0.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold shrink-0 transition shadow-sm"
                >
                  ⚖️ Generate Escrow Docket (PDF)
                </button>
                <button
                  onClick={() => applyTemplate('playstore_confirm')}
                  className="px-2.5 py-0.5 rounded bg-emerald-600/25 hover:bg-emerald-600/35 text-[#22d3a5] border border-[#22d3a5]/50 shrink-0 transition font-bold"
                >
                  📱 Confirm Play Store &amp; AssetLinks Active
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-playstore-modal'));
                  }}
                  className="px-2.5 py-0.5 rounded bg-gradient-to-r from-[#22d3a5] to-[#38bdf8] text-black shrink-0 transition font-bold shadow-sm"
                >
                  🚀 Open Play Store Publisher
                </button>
                <button
                  onClick={() => applyTemplate('omnitalent')}
                  className="px-2.5 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 shrink-0 transition font-bold"
                >
                  📄 Agency Presentation Dossier
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('open-branded-dossier', {
                        detail: { roleKey: 'ai_infra', presetId: 'omnitalent' },
                      })
                    );
                  }}
                  className="px-2.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shrink-0 transition font-bold shadow-sm"
                >
                  ✨ Open Presentation Dossier
                </button>
                <button
                  onClick={() => applyTemplate('counter')}
                  className="px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#253748] text-[#38bdf8] border border-[#2b3e50] shrink-0 transition"
                >
                  💰 Counter $145k
                </button>
                <button
                  onClick={() => applyTemplate('escrow')}
                  className="px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#253748] text-[#22d3a5] border border-[#2b3e50] shrink-0 transition"
                >
                  🛡️ Request Escrow Deposit
                </button>
                <button
                  onClick={() => applyTemplate('docket')}
                  className="px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#253748] text-[#fbbf24] border border-[#2b3e50] shrink-0 transition"
                >
                  📦 Attach Tech Docket
                </button>
                <button
                  onClick={() => applyTemplate('nda')}
                  className="px-2 py-0.5 rounded bg-[#1e2b36] hover:bg-[#253748] text-[#dce7f0] border border-[#2b3e50] shrink-0 transition"
                >
                  📝 Send NDA Covenant
                </button>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] bg-[#0c1218]">
                {activeThread.messages.map((msg) => {
                  const isSeller = msg.sender === 'seller';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-[#7a8b99]">
                        <span className="font-bold text-[#dce7f0]">
                          {isSeller ? 'You (App Founder)' : msg.senderName}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed shadow-md ${
                          isSeller
                            ? 'bg-gradient-to-r from-[#173027] to-[#122820] border border-[#22d3a5]/50 text-[#dce7f0] rounded-tr-none'
                            : 'bg-[#152330] border border-[#233547] text-[#dce7f0] rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                            {msg.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-[11px] font-mono text-[#38bdf8]"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                                <span className="font-semibold">{att.name}</span>
                                <span className="text-gray-400">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.offerTerms && (
                          <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-[#fbbf24]/40 flex items-center justify-between gap-3 text-xs font-mono">
                            <div>
                              <div className="text-[10px] text-[#7a8b99]">FORMAL COMMERCIAL OFFER:</div>
                              <div className="font-bold text-[#fbbf24] text-sm">
                                ${msg.offerTerms.amountUsd.toLocaleString()} USD
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40">
                                {msg.offerTerms.status.toUpperCase()}
                              </span>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                via {msg.offerTerms.escrowProvider}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#38bdf8] animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                    <span>Synchronizing counterparty response via Gemini 4 Hydrogen...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#0e161d] border-t border-[#1e2b36] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a0f14] border border-[#1e2b36]">
                      <DollarSign className="w-3.5 h-3.5 text-[#fbbf24]" />
                      <input
                        type="text"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="Counter Price (e.g. 145000)"
                        className="bg-transparent text-xs text-[#fbbf24] font-bold font-mono outline-none w-36"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 text-[11px] text-[#7a8b99] cursor-pointer hover:text-[#dce7f0]">
                      <input
                        type="checkbox"
                        checked={includeDocketAttachment}
                        onChange={(e) => setIncludeDocketAttachment(e.target.checked)}
                        className="rounded border-[#1e2b36] bg-[#0a0f14] text-[#22d3a5] focus:ring-0"
                      />
                      <span>Attach Tech Docket</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-blue-400 cursor-pointer hover:text-blue-300">
                      <input
                        type="checkbox"
                        checked={includeDossierAttachment}
                        onChange={(e) => setIncludeDossierAttachment(e.target.checked)}
                        className="rounded border-[#1e2b36] bg-[#0a0f14] text-blue-500 focus:ring-0"
                      />
                      <span>Attach Branded Dossier (PDF)</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-[#22d3a5] cursor-pointer hover:text-[#5eead4]">
                      <input
                        type="checkbox"
                        checked={includePlayStoreAttachment}
                        onChange={(e) => setIncludePlayStoreAttachment(e.target.checked)}
                        className="rounded border-[#1e2b36] bg-[#0a0f14] text-[#22d3a5] focus:ring-0"
                      />
                      <span>Attach Play Store TWA Bundle (.zip)</span>
                    </label>
                  </div>

                  <span className="text-[10px] text-[#7a8b99]">
                    Live Gemini 4 Hydrogen counterparty channel
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Transmit encrypted external message to ${activeThread.buyerName} (${activeThread.organization})...`}
                    rows={2}
                    className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-xl p-3 outline-none resize-none"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-3 rounded-xl bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold font-mono text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 shadow-[0_0_15px_rgba(34,211,165,0.25)]"
                  >
                    <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
                    <span>{isSending ? 'DISPATCHING...' : 'DISPATCH'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-gray-400 flex flex-col items-center justify-center h-full space-y-3">
              <Building2 className="w-10 h-10 text-[#22d3a5] opacity-50 mb-1" />
              <h4 className="font-bold text-base text-[#dce7f0]">External Deal Communications Gateway</h4>
              <p className="text-xs text-[#7a8b99] max-w-md">
                {isLoadingThreads
                  ? 'Connecting to M&A deal ledger...'
                  : 'Inbound buyer messages from Acquire.com, Flippa, or corporate search agency partners will route directly to this console for M&A term negotiation and escrow settlement.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
