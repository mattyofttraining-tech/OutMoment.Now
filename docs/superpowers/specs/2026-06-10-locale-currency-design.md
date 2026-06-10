# Locale-aware storefront currency — design

**Date:** 2026-06-10
**Goal:** the storefront shows prices in the currency that matches the user's device, formats them
in the user's language, and Stripe charges exactly the displayed amount — on web, iOS and Android.
EU consumer rules (final tax-inclusive price shown before ordering; charged = advertised) are
respected by construction.

## Problem

- `createCheckoutSession` hardcodes `currency: 'eur'`.
- Client `formatPrice()` hardcodes `€` and `en-IE` digit grouping for every locale.
- 3 of the 10 UI locales (da, sv, pl) belong to non-euro countries.
- No "incl. VAT" price indication (Directive 98/6/EC requires the final price including taxes).
- `verifyAndConsumePayment` checks uid/type/tier but never the paid **amount** or **currency**.
- The Stripe Checkout page is left at `locale: auto` instead of the app's language.

## Approaches considered

1. **Display-only localization** — keep EUR, format per locale. Simple, but a Danish user still
   pays in a foreign currency; doesn't meet the brief.
2. **Fixed per-currency price lists (chosen)** — EUR base price × pegged marketing rate, charm
   rounded, identical tables client + server. Deterministic: what the UI renders is exactly what
   the server charges and later re-verifies. No FX surprises, no extra infrastructure.
3. **Stripe dashboard Price objects / adaptive pricing** — 5 worlds × 4 tiers × 8 currencies of
   dashboard upkeep, and the client still needs local tables for display. Rejected.

## Design

### Currency model (mirrored client `src/data/currency.ts` ↔ server `functions/src/pricing.ts`)

- `CurrencyCode`: `EUR | DKK | SEK | NOK | GBP | USD | PLN | CHF` (all 2-decimal Stripe currencies).
- `CURRENCY_RATES` (pegged, reviewed manually — *not* live FX, so client and server can never
  disagree): EUR 1 · DKK 7.45 · SEK 11.0 · NOK 11.5 · GBP 0.85 · USD 1.10 · PLN 4.30 · CHF 0.95.
- Price = `charm(basePrice × tierMultiplier × rate)` with the existing charm function
  (`round to nearest 10, minus 1, min 9`). EUR prices are unchanged from today.
- `unit_amount` = price × 100 (integer by construction).

### Currency detection (client only, on-device — no data leaves the device)

`deviceCurrency()` walks `expo-localization` locales in preference order:
device `currencyCode` if supported → `regionCode` map (DK/FO/GL→DKK, SE→SEK, NO/SJ→NOK,
PL→PLN, GB/IM/JE/GG→GBP, US→USD, CH/LI→CHF) → `languageCode` map (da→DKK, sv→SEK, nb/nn/no→NOK,
pl→PLN) → fallback **EUR**. Currency follows the device's country, not the UI language toggle —
a Dane using the English UI still pays DKK.

### Formatting

`formatPrice(amount, currency, locale)` uses `Intl.NumberFormat(locale, { style: 'currency',
maximumFractionDigits: 0 })` (Hermes ships full Intl on Expo SDK 54), with a plain
`"AMOUNT CUR"` fallback if Intl throws.

### Checkout flow changes

- `startCheckout(...)` gains `currency`; the booking screen computes the currency **once** and
  uses the same value for display and checkout, so displayed = charged by construction.
- `payments.ts` also sends `language` (the active UI locale).
- `createCheckoutSession` validates `currency` against the allowlist (default EUR for old
  clients), prices server-side from its own table, sets `price_data.currency`, stores `currency`
  in session metadata, and sets Checkout `locale` to the validated UI language (all 10 app
  locales are supported Stripe Checkout locales).
- `verifyAndConsumePayment` additionally requires `session.currency` to be a supported currency
  and `session.amount_total === priceCents(type, tier, currency)` — the charged amount must equal
  the canonical advertised price or event creation is refused.
- Webhook already records `amountTotal` + `currency` per payment (audit trail unchanged).

### EU price indication

Booking footer caption becomes "one-time payment · incl. VAT" via a new `book.vatIncluded`
string in all 10 locales. (Actual VAT registration/Stripe Tax remains part of the B4 go-live
checklist; prices are consumer-final today.)

## Testing / rollout

1. `npm run typecheck`, `npm run lint`, `functions npm run build`.
2. `npx expo export --platform web` → new `dist`.
3. User deploys via `!` commands (functions + hosting — functions deploy also completes the
   pending Node 22 confirm, handoff §2A).
4. Smoke test: Danish browser → prices in `kr.`, checkout session in DKK, Danish Checkout page,
   4242 booking completes; English/German browser → EUR unchanged.
