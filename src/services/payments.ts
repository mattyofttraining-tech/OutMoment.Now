import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/app';
import { isDemoMode } from '@/lib/firebase/config';
import type { EventType } from '@/types';

/**
 * Booking checkout.
 *
 * Booking an event is a real-world service, which is generally exempt from
 * Apple's in-app-purchase requirement — but VERIFY against the current App
 * Store Review Guidelines before shipping. We therefore use Stripe via an
 * external browser checkout, not StoreKit IAP.
 *
 * Flow in production:
 *   1. Call the `createCheckoutSession` Cloud Function → returns a Stripe
 *      Checkout URL.
 *   2. Open it in an in-app browser session.
 *   3. On return, the function's webhook has marked the order paid; the app
 *      then calls createEvent.
 *
 * In demo mode this resolves instantly so the booking flow is fully explorable.
 */
export interface CheckoutResult {
  status: 'paid' | 'cancelled' | 'demo';
}

export async function startCheckout(eventType: EventType, title: string): Promise<CheckoutResult> {
  if (isDemoMode) {
    // Simulate a successful purchase.
    await new Promise((r) => setTimeout(r, 900));
    return { status: 'demo' };
  }

  const callable = httpsCallable<{ eventType: EventType; title: string }, { url: string }>(
    getFirebaseFunctions(),
    'createCheckoutSession',
  );
  const { data } = await callable({ eventType, title });

  const result = await WebBrowser.openAuthSessionAsync(data.url, 'ourmoment://checkout-complete');
  if (result.type === 'success') return { status: 'paid' };
  return { status: 'cancelled' };
}
