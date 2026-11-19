import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

interface ContactInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

interface ContactReceipt {
  receiptId: string;
  destination: string;
  deliveryMode: 'email_api' | 'ats_handoff_fallback';
  emailProvider?: string;
  mailtoHref?: string;
  status?: string;
}

export default function ContactInquiryModal({
  isOpen,
  onClose,
  defaultSubject = 'Enterprise Agency Licensing & Platform Inquiry',
}: ContactInquiryModalProps) {
  const { user } = useAuth();
  const { isOwner } = useSubscription();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [organization, setOrganization] = useState('');
  const [inquiryType, setInquiryType] = useState<'agency' | 'comp_data' | 'buyout' | 'support'>('agency');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ContactReceipt | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setReceipt(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim() || !subject.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Operator',
          email: email.trim(),
          organization: organization.trim() || 'Individual Practice',
          inquiryType,
          subject: subject.trim(),
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to transmit inquiry to the executive desk.');
      }

      setReceipt({
        receiptId: data.receiptId || `INQ-${Date.now().toString(36).toUpperCase()}`,
        destination: data.destination || 'mortyp1125@gmail.com',
        deliveryMode: data.deliveryMode || 'ats_handoff_fallback',
        emailProvider: data.emailProvider,
        mailtoHref: data.mailtoHref,
        status: data.status,
      });
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network failure while contacting /api/contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono"
    >
      <div className="w-full max-w-lg bg-[#0f1720] border border-[#22d3a5]/40 rounded-2xl shadow-2xl text-[#dce7f0] p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2b36]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22d3a5]/15 border border-[#22d3a5]/30 text-[#22d3a5]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                CONTACT LEAD ARCHITECT &amp; FOUNDER
              </h3>
              <p className="text-[11px] text-[#7a8b99]">
                Direct enterprise desk: <span className="text-[#38bdf8]">mortyp1125@gmail.com</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#7a8b99] hover:text-white hover:bg-[#162330] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {receipt ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#22d3a5]/20 border border-[#22d3a5] text-[#22d3a5] flex items-center justify-center shadow-[0_0_20px_rgba(34,211,165,0.3)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {receipt.deliveryMode === 'email_api'
                  ? 'Live Email Dispatched to Founder Desk'
                  : 'Inquiry Logged — Direct Handoff Ready'}
              </h4>
              <p className="text-[11px] text-[#22d3a5] font-bold mt-1">
                RECEIPT ID: {receipt.receiptId}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0a0f14] border border-[#1e2b36] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7a8b99]">DESTINATION:</span>
                <span className="text-white font-semibold">{receipt.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a8b99]">DELIVERY MODE:</span>
                <span className={receipt.deliveryMode === 'email_api' ? 'text-[#22d3a5]' : 'text-[#fbbf24]'}>
                  {receipt.deliveryMode === 'email_api'
                    ? `Live Email API (${(receipt.emailProvider || 'resend').toUpperCase()})`
                    : 'Founder Desk Ledger + Mailto Fallback'}
                </span>
              </div>
            </div>

            {receipt.deliveryMode === 'ats_handoff_fallback' && receipt.mailtoHref && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#7a8b99] max-w-sm mx-auto">
                  Your inquiry is saved to the Founder Desk ledger. Because Resend/Brevo email API keys are not active on this server, you can also open your pre-filled email client below:
                </p>
                <a
                  href={receipt.mailtoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>SEND DIRECTLY VIA EMAIL CLIENT</span>
                </a>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-[#162330] hover:bg-[#1e2b36] border border-[#2e3e4e] text-white font-bold text-xs transition cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">YOUR NAME *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance, Partner"
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">CORPORATE WORK EMAIL *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@searchfirm.com"
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">ORGANIZATION / FIRM</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Apex Talent Partners"
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#7a8b99] mb-1">INQUIRY CATEGORY</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value as any)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2 text-white outline-none cursor-pointer"
                >
                  <option value="agency">Enterprise Agency Pilot &amp; Licensing</option>
                  <option value="comp_data">Custom Compensation Model Request</option>
                  {isOwner && <option value="buyout">Institutional Buyout / M&amp;A Diligence</option>}
                  <option value="support">Technical Support &amp; Integration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#7a8b99] mb-1">SUBJECT *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7a8b99] mb-1">MESSAGE BRIEF *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detail your mandate, custom data requirements, or licensing questions..."
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] rounded-lg p-2.5 text-white outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
                Persisted to Founder Desk &amp; Firestore
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(34,211,165,0.25)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT BRIEF'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
