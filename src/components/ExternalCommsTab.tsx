import React, { useState, useEffect } from 'react';
import {
  Radio,
  Lock,
  Mail,
  Send,
  Flag,
  Archive,
  UserCheck,
  MessageSquare,
  CheckCircle2,
  Building2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Inbox,
  Plus,
} from 'lucide-react';
import { CommsMessage } from '../utils/radarEngine';
import BuyerCommunicationPanel from './BuyerCommunicationPanel';
import { useSubscription } from '../context/SubscriptionContext';
import SovereignEmailSequencePreview from './SovereignEmailSequencePreview';
import { auth } from '../firebase';

interface LiveCommsMessage extends CommsMessage {
  lastReplyText?: string;
  lastReplyAt?: string;
  lastDeliveryMode?: 'email_api' | 'ats_handoff_fallback';
  recipientEmail?: string;
}

interface ReplyDispatchResult {
  deliveryMode: 'email_api' | 'ats_handoff_fallback';
  provider: string;
  externalEmailId?: string;
  handoffUrl?: string;
  mailtoHref?: string;
  fallbackReason?: string;
}

export default function ExternalCommsTab() {
  const { isOwner } = useSubscription();
  const [activeChannel, setActiveChannel] = useState<'recruiters' | 'buyers' | 'inquiries'>('recruiters');
  const [messages, setMessages] = useState<LiveCommsMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<LiveCommsMessage | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Negotiating' | 'Flagged'>('All');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyDispatchResult, setReplyDispatchResult] = useState<ReplyDispatchResult | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [commsError, setCommsError] = useState<string | null>(null);
  const [buyerThreadsCount, setBuyerThreadsCount] = useState(0);
  const [emailDispatcher, setEmailDispatcher] = useState<{ activeProvider: string; isLive: boolean } | null>(null);
  const [inquiriesData, setInquiriesData] = useState<{
    inquiries: any[];
    agencyPilots: any[];
    outboundCommsReplies: any[];
    firestoreSynced?: boolean;
  } | null>(null);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);
  const [atsMeta, setAtsMeta] = useState<{
    isLive: boolean;
    scrapedAt: string;
    boardCount: number;
    boardsSucceeded: number;
    totalOpeningsAcrossBoards: number;
  } | null>(null);
  const [isRefreshingAts, setIsRefreshingAts] = useState(true);
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    sender: '',
    email: '',
    company: '',
    targetRole: 'US IT Recruiters / Talent Desk',
    location: '',
    notes: '',
  });

  const DIRECT_LEADS_STORAGE_KEY = 'talent_radar_direct_agency_leads_v1';

  const getDirectLeads = (): LiveCommsMessage[] => {
    const defaultEsolLead: LiveCommsMessage = {
      id: 'DIRECT-ESOL-GLOBAL',
      sender: 'Varun N.',
      senderTitle: 'IT Recruitment Hiring Lead',
      company: 'Esol Global',
      avatarSeed: 'esol-global',
      channel: 'Talent Partner',
      urgency: 'Immediate',
      timestamp: 'Direct Lead',
      subject: 'Agency Sovereign Fit // US IT Recruiters & Domestic IT Recruiters (Esol Global)',
      preview:
        'Hiring US IT Recruiters & Domestic IT Recruiters (Freshers & Experienced) in Jaipur, Rajasthan • Direct email: varun.n@esolglobal.com',
      fullMessage:
        'DIRECT AGENCY LEAD CAPTURED FROM RECRUITMENT POST:\n\n• Organization: Esol Global (esolglobal.com)\n• Hiring Contact: varun.n@esolglobal.com\n• Open Positions: US IT Recruiters, Domestic IT Recruiters\n• Location: Jaipur, Rajasthan\n• Ideal Sovereign Pitch: Equip Esol Global US IT Recruiters with live 14-board US ATS requisitions (Greenhouse, Ashby, Lever), real US total compensation benchmarks, and branded client PDF compensation dossiers.',
      proposedComp: 'Agency Sovereign ($199 / KES 25,000)',
      targetRole: 'US IT Recruiters & Domestic IT Recruiters',
      status: 'Unread',
      location: 'Jaipur, Rajasthan',
      department: 'IT Staffing & US Recruitment',
      recipientEmail: 'varun.n@esolglobal.com',
    };

    const simonLead: LiveCommsMessage = {
      id: 'DIRECT-SIMON-BUILDKITE',
      sender: 'Simon McSorley',
      senderTitle: 'Hiring Engineers at Buildkite',
      company: 'Buildkite',
      avatarSeed: 'buildkite-simon',
      channel: 'Talent Partner',
      urgency: 'Immediate',
      timestamp: 'LinkedIn Lead',
      subject: 'Contract Technical Recruiter Opportunity // Buildkite (Australia / New Zealand)',
      preview:
        '4-5 month contract available Dec 1 through April • 100% remote, Australia or New Zealand • simon.mcsorley@buildkite.com',
      fullMessage:
        'DIRECT RECRUITING LEAD CAPTURED FROM LINKEDIN:\n\n• Organization: Buildkite (buildkite.com)\n• Hiring Contact: simon.mcsorley@buildkite.com\n• Role: Technical Recruiter / Engineering Recruiter (4-5 month contract, Dec 1 through April)\n• Location: 100% remote, based in Australia or New Zealand\n• Context: Buildkite is on a huge hiring spree with a high volume of engineering roles to be delivered over the next couple of quarters.\n• Ideal Sovereign Pitch: Equip Buildkite engineering recruiting with live 14-board ATS intelligence (Greenhouse, Ashby, Lever), real-time compensation benchmarking, and client/stakeholder PDF comp dossiers.',
      proposedComp: 'Contract TA / Agency Sovereign ($199 / KES 25,000)',
      targetRole: 'Technical Recruiter / Engineering Recruiter',
      status: 'Unread',
      location: 'Australia or New Zealand (100% Remote)',
      department: 'Engineering Talent Acquisition',
      recipientEmail: 'simon.mcsorley@buildkite.com',
    };

    const veronicaLead: LiveCommsMessage = {
      id: 'DIRECT-VERONICA-OKOTH',
      sender: 'Veronica Okoth',
      senderTitle: 'Customer Experience Specialist | B2B Payments & Merchants',
      company: 'Global Remote / B2B Payments',
      avatarSeed: 'veronica-okoth',
      channel: 'Talent Partner',
      urgency: 'Active',
      timestamp: 'LinkedIn Profile',
      subject: 'Global Remote CX & B2B Payments Compensation Benchmarking // Veronica Okoth',
      preview:
        '8+ Years Supporting Global Customers • B2B Payments, Fraud & Risk, Zendesk, Intercom • Nairobi County, Kenya • Remote',
      fullMessage:
        'DIRECT PROFESSIONAL PROFILE CAPTURED FROM LINKEDIN:\n\n• Name: Veronica Okoth\n• Expertise: Customer Experience Specialist, B2B Payments & Merchants, Zendesk, Intercom, CRM Systems, Fraud & Risk\n• Experience: 8+ Years Supporting Global Customers (Remote)\n• Location: Nairobi County, Kenya\n• Strategic Fit on TalentRadar.OS: Ideal candidate for Pro Operator subscription or remote contractor compensation benchmarking (comparing local KES/PPP purchasing power against global B2B remote pay bands).',
      proposedComp: 'Pro Operator ($29 / KES 3,800)',
      targetRole: 'Customer Experience Specialist / B2B Payments Lead',
      status: 'Unread',
      location: 'Nairobi County, Kenya (Remote)',
      department: 'Customer Experience & B2B Payments',
      recipientEmail: '',
    };

    try {
      const raw = localStorage.getItem(DIRECT_LEADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasEsol = parsed.some((l) => l.id === defaultEsolLead.id);
          const hasSimon = parsed.some((l) => l.id === simonLead.id);
          const hasVeronica = parsed.some((l) => l.id === veronicaLead.id);
          let res = parsed;
          if (!hasEsol) res = [defaultEsolLead, ...res];
          if (!hasSimon) res = [simonLead, ...res];
          if (!hasVeronica) res = [veronicaLead, ...res];
          return res;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [veronicaLead, simonLead, defaultEsolLead];
  };

  const handleAddDirectLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.email.trim() || !newLeadForm.company.trim()) return;

    const leadMsg: LiveCommsMessage = {
      id: `DIRECT-${Date.now().toString(36).toUpperCase()}`,
      sender: newLeadForm.sender.trim() || newLeadForm.company.trim(),
      senderTitle: 'Agency / Talent Lead',
      company: newLeadForm.company.trim(),
      avatarSeed: newLeadForm.company.trim().toLowerCase(),
      channel: 'Talent Partner',
      urgency: 'Immediate',
      timestamp: 'Just Added',
      subject: `Agency Outreach // ${newLeadForm.targetRole.trim()} (${newLeadForm.company.trim()})`,
      preview: `${newLeadForm.targetRole.trim()} • ${newLeadForm.location.trim() || 'Remote/Global'} • ${newLeadForm.email.trim()}`,
      fullMessage:
        newLeadForm.notes.trim() ||
        `Direct B2B agency lead added for ${newLeadForm.company.trim()} (${newLeadForm.email.trim()}). Target desk: ${newLeadForm.targetRole.trim()}.`,
      proposedComp: 'Agency Sovereign ($199 / KES 25,000)',
      targetRole: newLeadForm.targetRole.trim() || 'Technical Recruiting Desk',
      status: 'Unread',
      location: newLeadForm.location.trim() || 'Global',
      recipientEmail: newLeadForm.email.trim(),
    };

    try {
      const existing = getDirectLeads();
      const updated = [leadMsg, ...existing.filter((x) => x.id !== leadMsg.id)];
      localStorage.setItem(DIRECT_LEADS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setMessages((prev) => [leadMsg, ...prev]);
    setSelectedMessage(leadMsg);
    setRecipientEmail(leadMsg.recipientEmail || '');
    setNewLeadForm({
      sender: '',
      email: '',
      company: '',
      targetRole: 'US IT Recruiters / Talent Desk',
      location: '',
      notes: '',
    });
    setShowAddLeadForm(false);
  };

  const fetchLiveComms = async (forceRefresh = false) => {
    setIsRefreshingAts(true);
    setCommsError(null);
    const directLeads = getDirectLeads();
    try {
      const url = forceRefresh ? '/api/comms?refresh=1' : '/api/comms';
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load live external ATS recruiter comms.');
      }
      const incomingMessages: LiveCommsMessage[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
        ? data.messages
        : [];
      const merged = [...directLeads, ...incomingMessages];
      if (data?.meta) setAtsMeta(data.meta);
      if (data?.emailDispatcher) setEmailDispatcher(data.emailDispatcher);
      setMessages(merged);
      setSelectedMessage((prev) => {
        if (!prev) return merged[0] || null;
        return merged.find((m) => m.id === prev.id) || merged[0] || null;
      });
    } catch (err: any) {
      setCommsError(err?.message || 'Unable to connect to live ATS comms feed.');
      setMessages(directLeads);
      setSelectedMessage((prev) => prev || directLeads[0] || null);
    } finally {
      setIsRefreshingAts(false);
    }
  };

  const fetchOwnerInquiriesAndBuyerCount = async () => {
    setIsLoadingInquiries(true);
    setInquiriesError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const [inqRes, buyerRes] = await Promise.all([
        fetch('/api/owner/inquiries', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/buyer/comms', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (inqRes.ok) {
        const inqJson = await inqRes.json().catch(() => null);
        if (inqJson) {
          setInquiriesData(inqJson);
          if (inqJson.emailDispatcher) setEmailDispatcher(inqJson.emailDispatcher);
        }
      } else {
        const errJson = await inqRes.json().catch(() => ({}));
        setInquiriesError(errJson?.error || 'Failed to load owner inquiries ledger.');
      }
      if (buyerRes.ok) {
        const buyerJson = await buyerRes.json().catch(() => []);
        if (Array.isArray(buyerJson)) {
          setBuyerThreadsCount(buyerJson.length);
        }
      }
    } catch (err: any) {
      setInquiriesError(err?.message || 'Unable to sync owner inquiries.');
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchLiveComms(false);
    if (isOwner) {
      fetchOwnerInquiriesAndBuyerCount();
    }
  }, [isOwner]);

  useEffect(() => {
    setReplyDispatchResult(null);
    setReplyError(null);
    setRecipientEmail(selectedMessage?.recipientEmail || '');
  }, [selectedMessage?.id]);

  if (!isOwner) {
    return null;
  }

  const filteredMessages = messages.filter((m) => {
    if (activeFilter === 'All') return true;
    return m.status === activeFilter;
  });

  const handleUpdateStatus = async (id: string, newStatus: CommsMessage['status']) => {
    const updated = messages.map((m) => (m.id === id ? { ...m, status: newStatus } : m));
    setMessages(updated);
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage({ ...selectedMessage, status: newStatus });
    }

    const msgObj = messages.find((m) => m.id === id);
    if (msgObj && (newStatus === 'Negotiating' || newStatus === 'Archived')) {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        await fetch('/api/comms/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageId: id,
            company: msgObj.company,
            targetRole: msgObj.targetRole,
            externalUrl: msgObj.externalUrl,
            replyText: `[Status updated to ${newStatus}]`,
            status: newStatus === 'Archived' ? 'Declined' : 'Negotiating',
          }),
        });
      } catch {
        // Non-blocking status sync
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage || isSendingReply) return;

    setIsSendingReply(true);
    setReplyError(null);
    setReplyDispatchResult(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Owner Firebase authentication token is required to dispatch replies.');
      }

      const res = await fetch('/api/comms/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          recipientEmail: recipientEmail.trim() || undefined,
          subject: `Re: ${selectedMessage.subject}`,
          replyText: replyText.trim(),
          company: selectedMessage.company,
          targetRole: selectedMessage.targetRole,
          externalUrl: selectedMessage.externalUrl,
          status: 'Replied',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to dispatch outbound reply.');
      }

      setReplyDispatchResult({
        deliveryMode: data.deliveryMode,
        provider: data.provider,
        externalEmailId: data.externalEmailId,
        handoffUrl: data.handoffUrl,
        mailtoHref: data.mailtoHref,
        fallbackReason: data.fallbackReason,
      });

      const updatedMsg: LiveCommsMessage = {
        ...selectedMessage,
        status: 'Negotiating',
        lastReplyText: replyText.trim(),
        lastReplyAt: new Date().toISOString(),
        lastDeliveryMode: data.deliveryMode,
      };
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setSelectedMessage(updatedMsg);
      setReplyText('');
      fetchOwnerInquiriesAndBuyerCount();
    } catch (err: any) {
      setReplyError(err?.message || 'Outbound reply dispatch failed.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const totalInquiriesBadge =
    (inquiriesData?.inquiries?.length || 0) + (inquiriesData?.agencyPilots?.length || 0);

  return (
    <div className="space-y-6">
      {/* Primary Channel Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-[#0a0f14] border border-[#1e2b36] rounded-xl text-xs font-mono shadow-md">
        <button
          onClick={() => setActiveChannel('recruiters')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition cursor-pointer ${
            activeChannel === 'recruiters'
              ? 'bg-gradient-to-r from-[#38bdf8]/25 to-[#a78bfa]/25 border border-[#38bdf8] text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]'
              : 'text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#111a22]'
          }`}
        >
          <Radio className="w-4 h-4 text-[#38bdf8]" />
          <span>LIVE ATS INTERCEPTS &amp; OUTREACH</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
            {messages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveChannel('buyers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition cursor-pointer ${
            activeChannel === 'buyers'
              ? 'bg-gradient-to-r from-[#22d3a5]/25 to-[#38bdf8]/25 border border-[#22d3a5] text-[#22d3a5] shadow-[0_0_15px_rgba(34,211,165,0.2)]'
              : 'text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#111a22]'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#22d3a5]" />
          <span>APP BUYER &amp; ACQUIRER COMMS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold">
            {buyerThreadsCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveChannel('inquiries');
            fetchOwnerInquiriesAndBuyerCount();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition cursor-pointer ${
            activeChannel === 'inquiries'
              ? 'bg-gradient-to-r from-[#fbbf24]/25 to-[#f59e0b]/25 border border-[#fbbf24] text-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.2)]'
              : 'text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#111a22]'
          }`}
        >
          <Inbox className="w-4 h-4 text-[#fbbf24]" />
          <span>INBOUND INQUIRIES &amp; PILOTS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold">
            {totalInquiriesBadge}
          </span>
        </button>
      </div>

      {activeChannel === 'buyers' ? (
        <BuyerCommunicationPanel />
      ) : activeChannel === 'inquiries' ? (
        <div className="space-y-4 font-mono">
          <div className="panel bg-[#111a22] border border-[#fbbf24]/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#dce7f0] flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#fbbf24]" />
                OWNER INBOUND INQUIRIES, AGENCY PILOTS &amp; EMAIL LEDGER
              </h2>
              <p className="text-xs text-[#7a8b99] mt-0.5">
                Live records persisted to disk &amp; Firestore alongside transactional Resend/Brevo dispatch telemetry.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-1 rounded border font-bold ${
                  emailDispatcher?.isLive
                    ? 'bg-[#22d3a5]/15 text-[#22d3a5] border-[#22d3a5]/40'
                    : 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/40'
                }`}
              >
                EMAIL API: {emailDispatcher?.isLive ? emailDispatcher.activeProvider.toUpperCase() : 'ATS / MAILTO HANDOFF'}
              </span>
              <button
                type="button"
                onClick={fetchOwnerInquiriesAndBuyerCount}
                disabled={isLoadingInquiries}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#fbbf24] text-[#fbbf24] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInquiries ? 'animate-spin' : ''}`} />
                <span>Sync Ledger</span>
              </button>
            </div>
          </div>

          {inquiriesError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inquiriesError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Inquiries */}
            <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                <h3 className="text-xs font-bold text-[#22d3a5]">
                  CONTACT BRIEF SUBMISSIONS ({inquiriesData?.inquiries?.length || 0})
                </h3>
              </div>
              {!inquiriesData?.inquiries?.length ? (
                <p className="text-xs text-[#7a8b99] py-6 text-center">No inbound contact briefs logged yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {inquiriesData.inquiries.map((inq) => (
                    <div key={inq.id} className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{inq.subject}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5]">
                          {inq.deliveryMode || inq.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#38bdf8]">
                        {inq.name} &lt;{inq.email}&gt; {inq.organization ? `• ${inq.organization}` : ''}
                      </div>
                      <p className="text-[11px] text-[#94a3b8]">{inq.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agency Pilots */}
            <div className="bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
                <h3 className="text-xs font-bold text-[#38bdf8]">
                  AGENCY PILOT REGISTRATIONS ({inquiriesData?.agencyPilots?.length || 0})
                </h3>
              </div>
              {!inquiriesData?.agencyPilots?.length ? (
                <p className="text-xs text-[#7a8b99] py-6 text-center">No agency pilot registrations logged yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {inquiriesData.agencyPilots.map((pilot) => (
                    <div key={pilot.id} className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{pilot.agencyName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8]">
                          {pilot.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#22d3a5]">
                        {pilot.contactName} &lt;{pilot.workEmail}&gt; • {pilot.seats}
                      </div>
                      {pilot.notes && <p className="text-[11px] text-[#94a3b8]">{pilot.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Comms Channel Header */}
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#dce7f0] font-mono flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#22d3a5]" />
                  ENCRYPTED COMMS &amp; RECRUITER INTERCEPTS
                </h2>
                <p className="text-xs text-[#7a8b99] font-mono">
                  Live ATS outreach channels backed by transactional Resend/Brevo dispatch + direct ATS portal handoff.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7a8b99]">
                <span
                  className={`px-2 py-1 rounded border text-[10px] font-bold ${
                    emailDispatcher?.isLive
                      ? 'bg-[#22d3a5]/10 border-[#22d3a5]/40 text-[#22d3a5]'
                      : 'bg-[#fbbf24]/10 border-[#fbbf24]/40 text-[#fbbf24]'
                  }`}
                >
                  {emailDispatcher?.isLive
                    ? `EMAIL API: ${emailDispatcher.activeProvider.toUpperCase()}`
                    : 'MODE: ATS PORTAL / MAILTO HANDOFF'}
                </span>
                <span className="text-[#22d3a5] font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  {atsMeta?.isLive
                    ? `LIVE ATS (${atsMeta.boardsSucceeded}/${atsMeta.boardCount} BOARDS)`
                    : 'LIVE ATS BUS'}
                </span>
                <button
                  type="button"
                  onClick={() => fetchLiveComms(true)}
                  disabled={isRefreshingAts}
                  className="px-2.5 py-1 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAts ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingAts ? 'Scraping ATS...' : 'Refresh Live ATS'}</span>
                </button>
              </div>
            </div>

            {commsError && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{commsError}</span>
              </div>
            )}

            {/* Filter Navigation & Quick Add Direct Lead */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#1e2b36] text-xs font-mono">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(['All', 'Unread', 'Negotiating', 'Flagged'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-semibold'
                        : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                    }`}
                  >
                    {filter} ({filter === 'All' ? messages.length : messages.filter((m) => m.status === filter).length})
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddLeadForm(!showAddLeadForm)}
                className="px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-[#38bdf8] font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddLeadForm ? 'Close Lead Form' : 'Add Agency / LinkedIn Lead'}</span>
              </button>
            </div>

            {showAddLeadForm && (
              <form
                onSubmit={handleAddDirectLead}
                className="mt-4 p-4 rounded-xl bg-[#0a0f14] border border-[#38bdf8]/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono"
              >
                <input
                  type="text"
                  required
                  placeholder="Contact Name (e.g. Varun N.)"
                  value={newLeadForm.sender}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, sender: e.target.value })}
                  className="bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-[#dce7f0] outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email (e.g. varun.n@esolglobal.com)"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-[#22d3a5] outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Agency / Company (e.g. Esol Global)"
                  value={newLeadForm.company}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                  className="bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-[#dce7f0] outline-none"
                />
                <input
                  type="text"
                  placeholder="Open Positions / Role"
                  value={newLeadForm.targetRole}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, targetRole: e.target.value })}
                  className="bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-[#dce7f0] outline-none"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Jaipur, Rajasthan)"
                  value={newLeadForm.location}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                  className="bg-[#111a22] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-[#dce7f0] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold cursor-pointer"
                >
                  Save &amp; Open Pitch Composer
                </button>
              </form>
            )}
          </div>

          <SovereignEmailSequencePreview />

          {isRefreshingAts && messages.length === 0 ? (
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-2xl p-12 text-center font-mono text-[#22d3a5] space-y-2">
              <RefreshCw className="w-7 h-7 mx-auto animate-spin" />
              <div className="text-xs font-bold">LOADING LIVE EXTERNAL ATS RECRUITER INTERCEPTS...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-2xl p-12 text-center font-mono shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0a0f14] border border-[#22d3a5]/40 flex items-center justify-center text-[#22d3a5]">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-[#dce7f0] mb-2 tracking-wide uppercase">
                Encrypted Recruiter Channel Active
              </h3>
              <p className="text-xs text-[#7a8b99] max-w-lg mx-auto leading-relaxed mb-4">
                No live recruiter signals loaded yet. Click Refresh Live ATS above to query the 14-board external ATS aggregator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Messages List (Left column) */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
                {filteredMessages.length === 0 ? (
                  <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 text-center text-xs font-mono text-[#7a8b99]">
                    No intercepted comms match the selected filter.
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          if (msg.status === 'Unread') {
                            handleUpdateStatus(msg.id, 'Negotiating');
                          }
                        }}
                        className={`panel p-4 rounded-xl border transition-all cursor-pointer font-mono ${
                          isSelected
                            ? 'bg-[#152330] border-[#22d3a5] shadow-[0_0_12px_rgba(34,211,165,0.15)]'
                            : 'bg-[#111a22] border-[#1e2b36] hover:border-[#3b82f6]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#7a8b99] mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#3b82f6] font-semibold uppercase">{msg.channel}</span>
                            {msg.sourceAts && (
                              <span className="px-1.5 py-0.2 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 uppercase font-bold">
                                {msg.sourceAts}
                              </span>
                            )}
                          </div>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="font-bold text-sm text-[#dce7f0]">{msg.sender}</div>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-semibold border ${
                              msg.urgency === 'Immediate'
                                ? 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/40'
                                : 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]/40'
                            }`}
                          >
                            {msg.urgency}
                          </span>
                        </div>

                        <div className="text-xs text-[#7a8b99]">
                          {msg.senderTitle} • {msg.company}
                        </div>

                        <div className="text-xs text-[#dce7f0] font-medium mt-2 line-clamp-1">
                          {msg.subject}
                        </div>

                        <div className="text-[11px] text-[#7a8b99] line-clamp-2 mt-1">
                          {msg.preview}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e2b36] text-[11px]">
                          <span className="text-[#22d3a5] font-semibold">{msg.proposedComp}</span>
                          <span className="text-[#7a8b99]">{msg.status}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Detail & Response Console (Right column) */}
              <div className="lg:col-span-7">
                {selectedMessage ? (
                  <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4 font-mono">
                    {/* Header Telemetry */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2b36]">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#7a8b99]">
                          <span className="px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5]">
                            {selectedMessage.id}
                          </span>
                          <span>CHANNEL: {selectedMessage.channel}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#dce7f0] mt-1.5">
                          {selectedMessage.subject}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        {selectedMessage.externalUrl && (
                          <a
                            href={selectedMessage.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-[#22d3a5]/15 border border-[#22d3a5]/50 hover:bg-[#22d3a5]/25 text-[#22d3a5] font-bold text-xs flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open ATS Posting</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(selectedMessage.id, 'Flagged')}
                          title="Flag as Priority Target"
                          className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#fbbf24] text-[#fbbf24] transition text-xs cursor-pointer"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedMessage.id, 'Archived')}
                          title="Archive Signal"
                          className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#f87171] text-[#7a8b99] hover:text-[#f87171] transition text-xs cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sender Metadata Box */}
                    <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[#22d3a5]" />
                          <span className="text-[#dce7f0] font-bold">{selectedMessage.sender}</span>
                          <span className="text-[#7a8b99]">({selectedMessage.senderTitle})</span>
                        </div>
                        <div className="text-[11px] text-[#7a8b99] mt-0.5">
                          FIRM: {selectedMessage.company} • TARGET: {selectedMessage.targetRole}
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] text-[#7a8b99] block">PROPOSED COMP RANGE:</span>
                        <span className="text-[#22d3a5] font-bold text-xs">
                          {selectedMessage.proposedComp}
                        </span>
                      </div>
                    </div>

                    {/* Transmission Body */}
                    <div className="p-4 bg-[#0a0f14] border border-[#1e2b36] rounded-lg text-xs leading-relaxed text-[#dce7f0] space-y-3">
                      <div className="text-[10px] text-[#7a8b99] pb-1 border-b border-[#1e2b36]/60">
                        --- LIVE EXTERNAL ATS BRIEFING ---
                      </div>
                      <p className="whitespace-pre-line">{selectedMessage.fullMessage}</p>
                    </div>

                    {selectedMessage.lastReplyText && (
                      <div className="p-3 bg-[#122620] border border-[#22d3a5]/40 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#22d3a5] font-bold">
                          <span>LAST LOGGED DISPATCH</span>
                          <span>{selectedMessage.lastDeliveryMode || 'persisted'}</span>
                        </div>
                        <p className="text-[#dce7f0] whitespace-pre-wrap">{selectedMessage.lastReplyText}</p>
                      </div>
                    )}

                    {/* Outbound Real Reply Form (Email API + ATS Handoff Fallback) */}
                    <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7a8b99]">
                        <span className="flex items-center gap-1.5 font-semibold text-[#dce7f0]">
                          <MessageSquare className="w-3.5 h-3.5 text-[#22d3a5]" />
                          OUTBOUND DISPATCH (RESEND/BREVO EMAIL + ATS HANDOFF)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const appOrigin =
                                typeof window !== 'undefined' && window.location?.origin
                                  ? window.location.origin
                                  : 'https://ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app';
                              setReplyText(
                                `Hi ${selectedMessage.sender},\n\nSaw ${selectedMessage.company} is hiring for ${selectedMessage.targetRole}. We built TalentRadar.OS to give US & Global IT recruiting desks live Greenhouse/Ashby/Lever requisitions plus client-ready PDF compensation dossiers.\n\nPreview the live platform here: ${appOrigin}\n\nHappy to enable an Agency Sovereign seat preview for your team today!`
                              );
                            }}
                            className="px-2 py-0.5 rounded bg-[#fbbf24]/15 border border-[#fbbf24]/40 hover:border-[#fbbf24] text-[10px] text-[#fbbf24] font-bold cursor-pointer"
                          >
                            Preset: Agency Sovereign Pitch
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyText(
                                'Thank you for reaching out. Given the scope and scale of this role, I would welcome an introductory NDA sync with the engineering leadership team this Thursday or Friday.'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-[10px] text-[#22d3a5] cursor-pointer"
                          >
                            Preset: Accept Intro
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyText(
                                'Thank you for the brief. I am currently reviewing opportunities in the $340k+ total compensation tier. If parameters can be aligned to that band, I would be glad to review technical next steps.'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] hover:border-[#3b82f6] text-[10px] text-[#3b82f6] cursor-pointer"
                          >
                            Preset: Anchor Comp
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#7a8b99] mb-1">
                          RECRUITER / HIRING MANAGER EMAIL (OPTIONAL — LEAVE BLANK FOR DIRECT ATS PORTAL HANDOFF)
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="recruiter@company.com (optional if applying via public ATS URL)"
                          className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
                        />
                      </div>

                      <textarea
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Draft counter-inquiry, cover note, or schedule request..."
                        className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg p-3 outline-none resize-none"
                      />

                      {replyError && (
                        <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{replyError}</span>
                        </div>
                      )}

                      {replyDispatchResult && (
                        <div
                          className={`p-3 rounded-lg border text-xs space-y-2 ${
                            replyDispatchResult.deliveryMode === 'email_api'
                              ? 'bg-[#22d3a5]/10 border-[#22d3a5]/50 text-[#22d3a5]'
                              : 'bg-[#fbbf24]/10 border-[#fbbf24]/50 text-[#fbbf24]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              {replyDispatchResult.deliveryMode === 'email_api'
                                ? `Sent Live via ${replyDispatchResult.provider.toUpperCase()}`
                                : 'ATS Portal / Mailto Handoff Prepared'}
                            </span>
                            {replyDispatchResult.externalEmailId && (
                              <span className="text-[10px]">ID: {replyDispatchResult.externalEmailId}</span>
                            )}
                          </div>
                          {replyDispatchResult.fallbackReason && (
                            <p className="text-[11px] text-[#dce7f0]">{replyDispatchResult.fallbackReason}</p>
                          )}
                          {(replyDispatchResult.handoffUrl || replyDispatchResult.mailtoHref) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {replyDispatchResult.handoffUrl && (
                                <a
                                  href={replyDispatchResult.handoffUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5] text-black font-bold text-[11px]"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Live ATS Application Portal</span>
                                </a>
                              )}
                              {replyDispatchResult.mailtoHref && (
                                <a
                                  href={replyDispatchResult.mailtoHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8] text-black font-bold text-[11px]"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Open Mailto Client</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#7a8b99]">
                          Persisted to owner ledger • Combines Resend/Brevo email + ATS portal handoff
                        </span>

                        <button
                          type="submit"
                          disabled={isSendingReply || !replyText.trim()}
                          className="px-4 py-2 bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs font-mono rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingReply ? 'DISPATCHING...' : 'TRANSMIT DISPATCH'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-8 text-center text-xs font-mono text-[#7a8b99]">
                    Select an intercepted ATS signal from the left panel to inspect or reply.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
