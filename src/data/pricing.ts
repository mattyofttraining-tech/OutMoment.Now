import type { EventType, GuestTierId } from '@/types';
import { EVENT_WORLDS } from './eventWorlds';

/**
 * Dynamic, size-based pricing.
 *
 * Philosophy (Hormozi value-equation): the bigger the event, the more moments
 * captured and the more value delivered — so price scales with guest capacity,
 * not with a flat fee. Anchored high on the top tier, with an obvious
 * "most-loved" middle tier. Charm pricing ($X9) throughout.
 *
 * The base price per event world is the *Intimate* price; every larger tier is
 * a multiple of it. This keeps the model affordable at the small end while
 * staying profitable as events scale.
 */

export type { GuestTierId };

export interface GuestTier {
  id: GuestTierId;
  label: string;
  /** Inclusive guest ceiling; null = unlimited. */
  maxGuests: number | null;
  /** Multiplier applied to the event world's base price. */
  multiplier: number;
  blurb: string;
  /** Highlighted as the recommended option. */
  popular?: boolean;
}

export const GUEST_TIERS: GuestTier[] = [
  { id: 'intimate', label: 'Intimate', maxGuests: 25, multiplier: 1, blurb: 'Up to 25 guests' },
  {
    id: 'celebration',
    label: 'Celebration',
    maxGuests: 75,
    multiplier: 1.8,
    blurb: 'Up to 75 guests',
    popular: true,
  },
  { id: 'grand', label: 'Grand', maxGuests: 200, multiplier: 3, blurb: 'Up to 200 guests' },
  { id: 'unlimited', label: 'Unlimited', maxGuests: null, multiplier: 4.5, blurb: 'Unlimited guests' },
];

export function getTier(id: GuestTierId): GuestTier {
  return GUEST_TIERS.find((t) => t.id === id) ?? GUEST_TIERS[0]!;
}

/** Round to a charming $X9 price point (e.g. 142 → 139, 70 → 69). */
function charm(amount: number): number {
  return Math.max(9, Math.round(amount / 10) * 10 - 1);
}

/** Whole-dollar price for an event world at a given guest tier. */
export function priceFor(type: EventType, tierId: GuestTierId): number {
  const base = EVENT_WORLDS[type].basePrice;
  return charm(base * getTier(tierId).multiplier);
}

/** Cents, for Stripe. */
export function priceCents(type: EventType, tierId: GuestTierId): number {
  return priceFor(type, tierId) * 100;
}

export function formatPrice(amount: number, currency = '$'): string {
  return `${currency}${amount.toLocaleString('en-US')}`;
}

/** The "from $X" label shown on store cards (smallest tier). */
export function fromLabel(type: EventType): string {
  return `from ${formatPrice(priceFor(type, 'intimate'))}`;
}

/** Per-guest value framing for copy, e.g. "just $1.99 a guest". */
export function perGuestLabel(type: EventType, tierId: GuestTierId): string {
  const tier = getTier(tierId);
  const guests = tier.maxGuests ?? 300;
  const per = priceFor(type, tierId) / guests;
  return `about ${formatPrice(Math.max(0.5, Math.round(per * 100) / 100))} a guest`;
}
