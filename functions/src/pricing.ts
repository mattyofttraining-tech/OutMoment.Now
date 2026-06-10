/**
 * Server-side pricing — mirrors src/data/pricing.ts + src/data/currency.ts on
 * the client. Keep them in sync: the client renders these exact amounts and
 * verifyAndConsumePayment refuses any session whose paid total differs.
 *
 * Base prices are EUR; other currencies use *pegged* marketing rates (reviewed
 * by hand, never live FX) so displayed price === charged price, always.
 */

export type GuestTierId = 'intimate' | 'celebration' | 'grand' | 'unlimited';

export const CURRENCY_RATES = {
  EUR: 1,
  DKK: 7.45,
  SEK: 11.0,
  NOK: 11.5,
  GBP: 0.85,
  USD: 1.1,
  PLN: 4.3,
  CHF: 0.95,
} as const;

export type CurrencyCode = keyof typeof CURRENCY_RATES;

export function isSupportedCurrency(code: string | null | undefined): code is CurrencyCode {
  return !!code && code in CURRENCY_RATES;
}

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

/** Whole-unit price in the given currency. */
export function priceUnits(eventType: string, tier: GuestTierId, currency: CurrencyCode): number {
  const base = BASE_PRICE[eventType] ?? BASE_PRICE.special;
  const mult = MULTIPLIER[tier] ?? 1;
  return charm(base * mult * CURRENCY_RATES[currency]);
}

/** Smallest currency unit (cents/øre/pence), for Stripe. All supported
 *  currencies are two-decimal, so ×100 is always right. */
export function priceCents(eventType: string, tier: GuestTierId, currency: CurrencyCode): number {
  return priceUnits(eventType, tier, currency) * 100;
}
