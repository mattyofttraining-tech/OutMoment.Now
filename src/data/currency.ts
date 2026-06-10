import * as Localization from 'expo-localization';

/**
 * Storefront currency model.
 *
 * Prices are defined in EUR and converted with *pegged* marketing rates
 * (reviewed by hand, never live FX) so the client and the Cloud Functions
 * backend always compute the identical amount — what the UI displays is
 * exactly what Stripe charges, as EU consumer law requires.
 *
 * MIRROR: functions/src/pricing.ts carries the same currency table. Keep the
 * two in sync.
 */

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

/** Countries whose currency we price in (everything else falls back to EUR). */
const REGION_CURRENCY: Record<string, CurrencyCode> = {
  DK: 'DKK',
  FO: 'DKK',
  GL: 'DKK',
  SE: 'SEK',
  NO: 'NOK',
  SJ: 'NOK',
  PL: 'PLN',
  GB: 'GBP',
  IM: 'GBP',
  JE: 'GBP',
  GG: 'GBP',
  US: 'USD',
  CH: 'CHF',
  LI: 'CHF',
};

/** Language-only fallback for web browsers that report no region (e.g. "da"). */
const LANGUAGE_CURRENCY: Record<string, CurrencyCode> = {
  da: 'DKK',
  sv: 'SEK',
  nb: 'NOK',
  nn: 'NOK',
  no: 'NOK',
  pl: 'PLN',
};

/**
 * Currency for this device, from its locale settings (most-preferred first):
 * the device's own currency code, then its country, then its language —
 * EUR otherwise. Purely on-device; nothing is sent anywhere.
 */
export function deviceCurrency(): CurrencyCode {
  for (const l of Localization.getLocales()) {
    const currency = (l.currencyCode ?? '').toUpperCase();
    if (isSupportedCurrency(currency)) return currency;
    const region = REGION_CURRENCY[(l.regionCode ?? '').toUpperCase()];
    if (region) return region;
    const language = LANGUAGE_CURRENCY[(l.languageCode ?? '').toLowerCase()];
    if (language) return language;
  }
  return 'EUR';
}

/** Whole-unit price rendered in the user's language ("589 kr.", "€79", "79 €"). */
export function formatPrice(amount: number, currency: CurrencyCode, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
