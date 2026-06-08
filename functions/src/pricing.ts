/**
 * Server-side pricing — mirrors src/data/pricing.ts on the client.
 * Price scales with the booked guest-capacity tier. Keep the two in sync.
 */

export type GuestTierId = 'intimate' | 'celebration' | 'grand' | 'unlimited';

const BASE_PRICE: Record<string, number> = {
  marriage: 79,
  confirmation: 49,
  baptism: 49,
  birthday: 39,
  special: 59,
};

const MULTIPLIER: Record<GuestTierId, number> = {
  intimate: 1,
  celebration: 1.8,
  grand: 3,
  unlimited: 4.5,
};

function charm(amount: number): number {
  return Math.max(9, Math.round(amount / 10) * 10 - 1);
}

export function priceDollars(eventType: string, tier: GuestTierId): number {
  const base = BASE_PRICE[eventType] ?? BASE_PRICE.special;
  const mult = MULTIPLIER[tier] ?? 1;
  return charm(base * mult);
}

export function priceCents(eventType: string, tier: GuestTierId): number {
  return priceDollars(eventType, tier) * 100;
}
