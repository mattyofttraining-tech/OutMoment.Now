import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/app';
import { isDemoMode } from '@/lib/firebase/config';
import type { EventType, GuestTierId } from '@/types';

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
 *      Checkout URL + session id.
 *   2. Native: open it in an in-app browser session; Stripe redirects back to
 *      `ourmoment://checkout-complete?session_id=…`.
 *      Web: persist the booking draft, then navigate the page to Checkout;
 *      Stripe redirects back to `/checkout-complete`, which resumes creation.
 *   3. The app calls createEvent with the session id. The server retrieves the
 *      session from Stripe and only creates the event if it is genuinely paid,
 *      belongs to this user, and has never been consumed. The redirect itself
 *      is never trusted.
 *
 * In demo mode this resolves instantly so the booking flow is fully explorable.
 */
export type CheckoutResult =
  | { status: 'paid'; sessionId: string }
  | { status: 'demo' }
  | { status: 'cancelled' }
  /** Web only: the page is navigating to Stripe; nothing more happens here. */
  | { status: 'redirecting' };

export async function startCheckout(
  eventType: EventType,
  title: string,
  guestTier: GuestTierId,
): Promise<CheckoutResult> {
  if (isDemoMode) {
    // Simulate a successful purchase.
    await new Promise((r) => setTimeout(r, 900));
    return { status: 'demo' };
  }

  const callable = httpsCallable<
    {
      eventType: EventType;
      title: string;
      guestTier: GuestTierId;
      platform: 'web' | 'native';
      webOrigin?: string;
    },
    { url: string; sessionId: string }
  >(getFirebaseFunctions(), 'createCheckoutSession');

  if (Platform.OS === 'web') {
    const { data } = await callable({
      eventType,
      title,
      guestTier,
      platform: 'web',
      webOrigin: window.location.origin,
    });
    // Full-page navigation — an in-app browser session can't return to a PWA.
    window.location.assign(data.url);
    return { status: 'redirecting' };
  }

  const { data } = await callable({ eventType, title, guestTier, platform: 'native' });
  const result = await WebBrowser.openAuthSessionAsync(data.url, 'ourmoment://checkout-complete');
  if (result.type === 'success') {
    const sessionId = new URL(result.url).searchParams.get('session_id') ?? data.sessionId;
    return { status: 'paid', sessionId };
  }
  return { status: 'cancelled' };
}

// ── Web booking draft ────────────────────────────────────────────────────────
// The PWA leaves the page to pay, so the booking form is stashed here and
// picked back up by app/checkout-complete.tsx after Stripe redirects home.

export interface PendingBooking {
  type: EventType;
  title: string;
  subtitle?: string;
  brief?: string;
  guestTier: GuestTierId;
}

const PENDING_KEY = 'ourmoment.pendingBooking';

export async function savePendingBooking(booking: PendingBooking): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(booking));
}

export async function takePendingBooking(): Promise<PendingBooking | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}
