# OurMoment — Sub-project 1: Firebase EU Backend + Stripe Payments

- **Date:** 2026-06-09
- **Status:** Approved design (pending spec review)
- **Owner:** Matty (sole author)

---

## Program context (the bigger picture)

The end goal is a production-ready, EU/GDPR-compliant launch of OurMoment. That
is too large for one spec, so it is decomposed into sub-projects, each with its
own spec → plan → build cycle:

1. **Firebase EU backend + Stripe payments** ← *this spec*
2. GDPR compliance mechanisms (consent gate, data export, account/data deletion)
3. Legal documents (Privacy Policy, Terms of Service) — drafted, lawyer-review caveat
4. Security hardening & rules audit
5. Production deployment (EAS build, App/Play data-safety forms, submission)

**Legal disclaimer:** Claude is not a lawyer. Sub-project 3 produces standard,
GDPR-aligned drafts and all technical compliance machinery, but the legal text
must be reviewed by a qualified professional before public EU launch.

---

## Goal

Flip the app from in-memory **demo mode** to a real, **EU-hosted Firebase
backend**, with **Stripe (EUR) booking payments**, and verify a live two-phone
event plus a test booking.

## Confirmed decisions

| Decision | Choice |
|---|---|
| Data residency | **EU** — Firestore `eur3` (multi-region Europe), Functions + Storage `europe-west1`. Global users allowed; cross-border access noted in privacy policy (sub-project 3). |
| Auth model | **Anonymous + display name** (no email/password). Minimal personal data. |
| Firebase project | A **new, dedicated project** separate from Matty's existing Firebase projects. Account already on **Blaze**. |
| Currency | **EUR (€)**. |
| Stripe | **Existing Stripe account**, but a **dedicated restricted API key + its own product/price**, kept separate from other projects. Build/test in **test mode** first, then swap to live keys. |
| Payments verification | Test phase: trust the browser redirect. **Production hardening: add a Stripe webhook** that verifies payment before the event is created (tracked below). |

## Current state (verified in repo)

- `src/services/index.ts` selects `FirebaseDataService` automatically when
  `.env` Firebase vars are present, else `DemoDataService`. **No app-screen
  changes needed to "turn on" the backend** — just configuration + deploy.
- `FirebaseDataService` (auth, Firestore, Storage, callable functions) is fully
  implemented.
- Cloud Functions exist: `createEvent`, `joinEvent`, `generateQuests`,
  `createCheckoutSession` (Stripe), `purgeExpiredEvents` (daily 30-day purge).
  **No region is set** → they would deploy to `us-central1` by default.
- `createCheckoutSession` hardcodes `currency: 'usd'`; there is **no webhook**.
- `firebase.json` is configured (firestore/storage/functions/emulators).
  **`.firebaserc` is missing** (no project linked yet).
- App scheme is `ourmoment` (checkout return URL `ourmoment://checkout-complete`
  already matches). Bundle/package id `fitness.fitsync.ourmoment`.
- Pricing is defined in **two** places that must stay in sync:
  `src/data/pricing.ts` (client) and `functions/src/pricing.ts` (server).

## Architecture

No new architecture. The app already isolates all data access behind the
`DataService` interface, so activating the live backend is a configuration +
deploy exercise plus a few small, surgical code edits.

```
Phone (Expo Go / build)
  └─ getDataService() ─ picks FirebaseDataService (because .env present)
       ├─ Auth: anonymous sign-in (EU)
       ├─ Firestore eur3: events / members / quests / photos / users
       ├─ Storage europe-west1: events/{id}/photos/*.jpg
       └─ Callable Functions europe-west1: createEvent, joinEvent,
          generateQuests, createCheckoutSession
Stripe (test → live): Checkout session in EUR, returns ourmoment://checkout-complete
```

## Code changes (small, targeted)

1. **`functions/src/index.ts`** — add `setGlobalOptions({ region: 'europe-west1', maxInstances: 10 })` so all functions deploy to the EU.
2. **`src/lib/firebase/app.ts`** — `getFunctions(ensureApp(), 'europe-west1')` so the client calls the EU region (must match the deployed region).
3. **`functions/src/index.ts` `createCheckoutSession`** — change `currency: 'usd'` → `'eur'`.
4. **`functions/src/pricing.ts`** + **`src/data/pricing.ts`** — switch currency formatting/symbol to **EUR (€)** (keep the existing tier numbers as euro amounts; e.g. €79 wedding/intimate). Keep client and server price tables numerically identical.
5. **`.env`** — created from the new Firebase project's web config (`EXPO_PUBLIC_FIREBASE_*`). Triggers the live backend.
6. **`.firebaserc`** — generated via `firebase use --add` pointing at the new project.
7. **Stripe secret** — `STRIPE_SECRET_KEY` (restricted, test mode) set via `firebase functions:secrets:set`.
8. *(Production hardening, may slip to a follow-up):* add a `stripeWebhook` HTTP function that verifies `checkout.session.completed` before `createEvent`, replacing redirect-trust.

## Ops runbook (Matty's console steps — guided click-by-click at execution)

1. **Create a new Firebase project** (separate name, e.g. `ourmoment-prod`).
2. **Firestore → Create database → location `eur3` (Europe) → Production mode.** *(Permanent.)*
3. **Storage → Get started → location `europe-west1`.**
4. **Authentication → Sign-in method → enable Anonymous.**
5. Confirm the project is on **Blaze** (it is, account-wide; verify on the new project).
6. **Project settings → Your apps → add a Web app** → copy the `firebaseConfig` → paste to Claude (these are safe-to-ship public keys).
7. In the OurMoment terminal: `! firebase login` (Claude cannot sign into Google).
8. **Stripe dashboard (test mode):** create a **restricted API key** (write access to Checkout/PaymentIntents) → paste to Claude for the functions secret.
9. *(Optional)* Provide an **Anthropic API key** for richer AI quests; otherwise the built-in offline generator runs.

Claude then runs: `firebase use --add`, `firebase deploy --only firestore:rules,storage:rules`, `firebase deploy --only functions`, and sets the Stripe secret.

## Data flow (live)

Guest opens app → anonymous EU sign-in → enters host's join code → `joinEvent`
adds them to the event (Firestore eur3) → Capture screen uploads photo to EU
Storage → Firestore photo doc created → every member's gallery updates live via
`onSnapshot`. Booking: host picks tier → `createCheckoutSession` (EUR) → in-app
browser Stripe Checkout → returns to `ourmoment://checkout-complete` → on
success, `createEvent`.

## Error handling

- Missing/invalid Firebase config → app already throws a clear "not configured"
  error; we verify `.env` loads and `isDemo === false` at boot.
- Function/region mismatch → calls fail; verified by an end-to-end join.
- Stripe not configured → function throws `unimplemented`; surfaced in the store
  flow. We confirm a test card (`4242 4242 4242 4242`) completes.
- Rules misconfig → reads/writes denied; checked against Firestore/Storage logs.

## Testing / "done when"

- `firebase deploy` (rules + functions) succeeds; functions show region
  `europe-west1` in the console.
- App boots with `isDemo === false` (live backend).
- **Two phones:** host creates an event, guest joins by code, both see each
  other's captured photos in real time.
- **Booking:** a test-mode Stripe Checkout completes with the test card and
  returns to the app; the event is created.
- Prices display in **EUR (€)** on store cards and the booking screen.

## Out of scope (later sub-projects)

GDPR consent UI & data export/delete (sp2), legal docs (sp3), full
security-rules audit & abuse limits (sp4), EAS build & store submission (sp5),
production Stripe webhook *may* be pulled forward if time allows.

## Risks & constraints

- **Firestore region is permanent** — `eur3` chosen deliberately at creation.
- **Redirect-trust payments are not production-safe** — the Stripe webhook is
  required before taking real money; flagged as hardening.
- **Pricing duplicated** client/server — both must be edited together and kept
  in sync, or the displayed price and charged price can diverge.
- Test in **Stripe test mode** before live keys to avoid real charges.
