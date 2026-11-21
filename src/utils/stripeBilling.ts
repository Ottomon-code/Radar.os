// Client-side Paystack checkout and payment verification utility
import { auth } from '../firebase';

export interface CheckoutOptions {
  tierId: 'pro_monthly' | 'pro_annual' | 'agency_monthly' | 'agency_annual' | 'buyout_deposit';
  customerEmail?: string;
  paymentMethod?: 'paystack' | 'mpesa' | 'card' | 'bank' | 'ussd';
  channels?: string[];
  currency?: string;
  referralCode?: string;
  pppCountryCode?: string;
}

export interface CheckoutResponse {
  success: boolean;
  provider?: 'paystack';
  checkoutUrl?: string;
  accessCode?: string;
  sessionId?: string;
  currency?: string;
  message?: string;
}

async function getOptionalAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Non-blocking fallback for unauthenticated checkout
  }
  return headers;
}

/**
 * Initiates a Paystack checkout session with the backend API.
 */
export async function initiateCheckout(options: CheckoutOptions): Promise<CheckoutResponse> {
  try {
    const origin = window.location.origin;
    const successUrl = `${origin}/billing?checkout_status=success&provider=paystack&tier=${options.tierId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?checkout_status=cancelled`;
    const headers = await getOptionalAuthHeaders();

    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tierId: options.tierId,
        customerEmail: options.customerEmail,
        paymentMethod: options.paymentMethod || 'paystack',
        channels: options.channels,
        currency: options.currency,
        referralCode: options.referralCode,
        pppCountryCode: options.pppCountryCode,
        provider: 'paystack',
        successUrl,
        cancelUrl,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        provider: 'paystack',
        message:
          'Payment backend (/api) is not connected on this domain yet. Deploy the server to Cloud Run and add the /api/** rewrite in firebase.json.',
      };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Payment request failed' }));
      return {
        success: false,
        provider: 'paystack',
        message: err.error || 'Server error creating Paystack checkout session',
      };
    }

    const data = await response.json();

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return {
        success: true,
        provider: 'paystack',
        checkoutUrl: data.checkoutUrl,
        sessionId: data.sessionId,
      };
    }

    return data;
  } catch (error: any) {
    console.error('Checkout error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to initiate Paystack checkout',
    };
  }
}

/**
 * Verifies a returned Paystack checkout reference/session.
 */
export async function verifyCheckoutSession(sessionId: string): Promise<{
  verified: boolean;
  provider?: string;
  tier?: string;
  customerEmail?: string;
  amountTotal?: number;
  firestoreDocId?: string;
  firestoreSynced?: boolean;
}> {
  try {
    const query = new URLSearchParams({ sessionId, provider: 'paystack' });
    const headers: Record<string, string> = {};
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Optional
    }
    const res = await fetch(`/api/checkout/verify-session?${query.toString()}`, { headers });
    if (!res.ok) {
      return { verified: false };
    }
    return await res.json();
  } catch (e) {
    console.error('Failed to verify Paystack session:', e);
    return { verified: false };
  }
}

/**
 * Retrieves Paystack checkout configuration from server.
 */
export async function getStripeConfig(): Promise<{
  activeProvider?: 'paystack';
  liveMode: boolean;
  publishableKey?: string;
  paymentLinksConfigured: boolean;
  paystack?: { configured: boolean; liveMode: boolean; currency: string };
}> {
  try {
    const res = await fetch('/api/checkout/config');
    if (!res.ok) return { liveMode: false, paymentLinksConfigured: false };
    return await res.json();
  } catch {
    return { liveMode: false, paymentLinksConfigured: false };
  }
}

