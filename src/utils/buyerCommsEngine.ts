export interface BuyerMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  senderTitle: string;
  timestamp: string;
  content: string;
  attachments?: { name: string; type: string; size: string }[];
  offerTerms?: {
    amountUsd: number;
    escrowProvider: string;
    status: 'Proposed' | 'Accepted' | 'Countered' | 'Under Review';
  };
}

export interface BuyerThread {
  id: string;
  buyerName: string;
  buyerTitle: string;
  organization: string;
  buyerType: 'Strategic Acquirer' | 'Private Equity / Syndicate' | 'Enterprise Customer';
  avatarSeed: string;
  email: string;
  targetDeal: string;
  budgetCap: string;
  escrowStatus: string;
  dealStage:
    | 'Initial Inbound'
    | 'LOI Negotiation'
    | 'Technical Due Diligence'
    | 'Enterprise Licensing Agreement'
    | 'API Diligence'
    | 'Escrow Funded'
    | 'Asset Transfer & Closing';
  status: 'Action Required' | 'Negotiating' | 'Due Diligence' | 'Escrow Funded' | 'Under Offer';
  proposedPriceUsd: number;
  askingPriceUsd: number;
  lastActivity: string;
  unreadCount: number;
  messages: BuyerMessage[];
}

export const DEFAULT_BUYER_THREADS: BuyerThread[] = [];

const STORAGE_KEY = 'talentradar_buyer_threads_v1';

export function getStoredBuyerThreads(): BuyerThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(
          (t) =>
            !t.id.startsWith('buyer-thread-') &&
            !t.buyerName?.includes('Vance') &&
            !t.buyerName?.includes('Elena') &&
            !t.buyerName?.includes('Marcus') &&
            !t.buyerName?.includes('Sanjay')
        );
        if (clean.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored buyer threads:', err);
  }
  return [];
}

export function saveBuyerThreads(threads: BuyerThread[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (err) {
    console.warn('Failed to save buyer threads to localStorage:', err);
  }
}

export function addMessageToBuyerThread(
  threadId: string,
  message: Omit<BuyerMessage, 'id' | 'timestamp'>
): BuyerThread[] {
  const threads = getStoredBuyerThreads();
  const updated = threads.map((th) => {
    if (th.id === threadId) {
      const newMsg: BuyerMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: 'Just now',
      };
      return {
        ...th,
        messages: [...th.messages, newMsg],
        lastActivity: 'Just now',
        status: message.sender === 'seller' ? ('Negotiating' as const) : th.status,
      };
    }
    return th;
  });
  saveBuyerThreads(updated);
  return updated;
}

export function updateBuyerDealStage(
  threadId: string,
  newStage: BuyerThread['dealStage'],
  newStatus?: BuyerThread['status']
): BuyerThread[] {
  const threads = getStoredBuyerThreads();
  const updated = threads.map((th) => {
    if (th.id === threadId) {
      return {
        ...th,
        dealStage: newStage,
        status: newStatus || th.status,
        lastActivity: 'Just now',
      };
    }
    return th;
  });
  saveBuyerThreads(updated);
  return updated;
}

/**
 * Generate a realistic, authoritative external buyer response based on seller's message
 */
export function generateBuyerReply(
  thread: BuyerThread,
  sellerText: string,
  proposedPrice?: number
): BuyerMessage {
  const lower = sellerText.toLowerCase();
  const buyerName = thread.buyerName;
  const buyerTitle = thread.buyerTitle;
  const org = thread.organization;

  let replyContent = '';
  let offerDetails: BuyerMessage['offerTerms'] = undefined;

  if (lower.includes('escrow') || lower.includes('deposit') || lower.includes('earnest')) {
    replyContent = `Thank you for confirming the escrow protocol. Our legal team at ${org} is prepared to authorize the 10% earnest deposit ($${Math.round((proposedPrice || thread.proposedPriceUsd) * 0.1).toLocaleString()} USD) into Escrow.com immediately. Please generate the transaction docket from your dashboard so our legal counsel can bind the inspection window.`;
    offerDetails = {
      amountUsd: proposedPrice || thread.proposedPriceUsd,
      escrowProvider: 'Escrow.com',
      status: 'Under Review',
    };
  } else if (lower.includes('counter') || (proposedPrice && proposedPrice > thread.proposedPriceUsd)) {
    const agreedAmount = Math.min(thread.askingPriceUsd, (proposedPrice || thread.askingPriceUsd));
    replyContent = `We have reviewed your counter-proposal for $${agreedAmount.toLocaleString()} USD. After syncing with our investment committee at ${org}, we accept these revised commercial parameters subject to satisfactory verification of git commit history, domain DNS transfer (talentradar.io), and complete server clean-pass deployment.`;
    offerDetails = {
      amountUsd: agreedAmount,
      escrowProvider: 'Escrow.com',
      status: 'Accepted',
    };
  } else if (lower.includes('code') || lower.includes('architecture') || lower.includes('audit') || lower.includes('tech')) {
    replyContent = `We acknowledge receipt of the technical architecture brief. Our principal engineers are reviewing the Three.js canvas shaders, Service Worker offline caching strategy, and express server endpoints. We will return with our sign-off within 24 hours.`;
  } else if (lower.includes('nda') || lower.includes('agreement') || lower.includes('contract')) {
    replyContent = `Our legal counsel has signed and logged the mutual non-disclosure and intellectual property assignment covenants. We are ready to proceed to formal purchase agreement execution.`;
  } else {
    replyContent = `Thank you for the update. The acquisition team at ${org} is aligned on the proposed steps. We remain committed to closing this transaction expediently. Let us know your preferred milestone timeline for asset handover and escrow funding.`;
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender: 'buyer',
    senderName: buyerName,
    senderTitle: buyerTitle,
    timestamp: 'Just now',
    content: replyContent,
    offerTerms: offerDetails,
  };
}
