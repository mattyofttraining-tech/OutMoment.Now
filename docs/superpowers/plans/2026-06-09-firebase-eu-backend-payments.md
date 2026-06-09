# Firebase EU Backend + Stripe (EUR) Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip OurMoment from in-memory demo mode to a live, EU-hosted Firebase backend with Stripe (EUR) booking payments, verified by a real two-phone event and a test booking.

**Architecture:** No new architecture — the app already selects `FirebaseDataService` automatically when `.env` Firebase vars exist. Work is: (a) two small region edits, (b) EUR currency edits, (c) stand up a new EU Firebase project, (d) set secrets, (e) deploy rules + functions, (f) verify end-to-end.

**Tech Stack:** Expo / React Native, Firebase (Auth anonymous, Firestore `eur3`, Storage + Functions `europe-west1`), Cloud Functions v2 (Node 20), Stripe Checkout (test → live), firebase-tools CLI.

**Roles:** Claude does all code + CLI. Matty does Firebase/Stripe **console clicks**, the interactive `firebase login`, and pastes config/keys. Console steps are marked **[MATTY]**.

---

### Task 1: Set Cloud Functions to the EU region

**Files:**
- Modify: `functions/src/index.ts` (add global options near the top)
- Modify: `src/lib/firebase/app.ts:getFirebaseFunctions` (client region)

- [ ] **Step 1: Add `setGlobalOptions` to functions**

In `functions/src/index.ts`, add the import alongside the other `firebase-functions/v2` imports, then call it once before the first function export:

```ts
import { setGlobalOptions } from 'firebase-functions/v2';

// All functions deploy to the EU to match Firestore (eur3) / Storage residency.
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });
```

- [ ] **Step 2: Point the client at the EU functions region**

In `src/lib/firebase/app.ts`, change the `getFirebaseFunctions` body:

```ts
export function getFirebaseFunctions(): Functions {
  if (_functions) return _functions;
  _functions = getFunctions(ensureApp(), 'europe-west1');
  if (useEmulator) connectFunctionsEmulator(_functions, '127.0.0.1', 5001);
  return _functions;
}
```

- [ ] **Step 3: Verify both compile**

Run: `npx tsc --noEmit` (root) — expected: no NEW errors (the pre-existing `/host` and `/onboarding` route-type warnings are unrelated).
Run: `npm --prefix functions install && npm --prefix functions run build` — expected: build succeeds, emits `functions/lib`.

- [ ] **Step 4: Commit**

```bash
git add functions/src/index.ts src/lib/firebase/app.ts
git commit -m "Deploy and call Cloud Functions in europe-west1 (EU residency)"
```

---

### Task 2: Switch pricing + Stripe to EUR

**Files:**
- Modify: `src/data/pricing.ts:formatPrice`
- Modify: `functions/src/index.ts:createCheckoutSession` (currency)

No numeric changes — client base prices (79/49/49/39/59) already match `functions/src/pricing.ts`; we keep those values as euro amounts.

- [ ] **Step 1: Format client prices as EUR**

In `src/data/pricing.ts`, replace `formatPrice`:

```ts
export function formatPrice(amount: number, currency = '€'): string {
  return `${currency}${amount.toLocaleString('en-IE')}`;
}
```

(`fromLabel` and `perGuestLabel` call `formatPrice` with the default, so they pick up € automatically.)

- [ ] **Step 2: Charge in EUR via Stripe**

In `functions/src/index.ts`, inside `createCheckoutSession`'s `price_data`, change the currency:

```ts
price_data: {
  currency: 'eur',
  unit_amount: amount,
  product_data: { name: `OurMoment — ${title || 'Event'} (${tier})` },
},
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit` and `npm --prefix functions run build` — expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add src/data/pricing.ts functions/src/index.ts
git commit -m "Price bookings in EUR (display + Stripe Checkout)"
```

---

### Task 3: [MATTY] Create the new EU Firebase project

No code/commit — this produces the web config values used in Task 4.

- [ ] **Step 1:** Go to https://console.firebase.google.com → **Add project** → name it (e.g. `ourmoment-prod`). Keep it separate from existing projects.
- [ ] **Step 2: Firestore** → Build → Firestore Database → **Create database** → location **`eur3` (Europe)** → **Production mode**. *(Region is permanent.)*
- [ ] **Step 3: Storage** → Build → Storage → **Get started** → location **`europe-west1`**.
- [ ] **Step 4: Authentication** → Build → Authentication → Sign-in method → enable **Anonymous**.
- [ ] **Step 5: Billing** → confirm the project is on the **Blaze** plan (Functions require it).
- [ ] **Step 6: Web app** → Project settings (gear) → Your apps → **add a Web app** (`</>`), register it, and copy the `firebaseConfig` object.
- [ ] **Step 7:** Paste the `firebaseConfig` values to Claude. (These are public client keys — safe to share/ship.)

**Verification:** Firestore shows region `eur3`; Anonymous auth is enabled; you have 6 config values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

---

### Task 4: Wire `.env` + link the project, verify live boot

**Files:**
- Create: `.env` (NOT committed — already in `.gitignore`)
- Create: `.firebaserc` (committed)

- [ ] **Step 1:** [MATTY] In the OurMoment terminal, log in (interactive — Claude can't):

```
! npx firebase-tools login
```

- [ ] **Step 2:** Claude creates `.env` from the pasted config:

```
EXPO_PUBLIC_FIREBASE_API_KEY=<apiKey>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<authDomain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<storageBucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
EXPO_PUBLIC_FIREBASE_APP_ID=<appId>
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false
```

- [ ] **Step 3: Confirm `.env` is gitignored**

Run: `git check-ignore .env` — expected: prints `.env` (ignored). If it prints nothing, add `.env` to `.gitignore` before continuing.

- [ ] **Step 4: Link the project (writes `.firebaserc`)**

Run: `npx firebase-tools use <projectId>` — expected: "Now using project <projectId>"; a `.firebaserc` file appears.

- [ ] **Step 5: Restart Metro with the new env + verify live boot**

Restart the dev server (env vars are inlined at bundle time): stop the running Expo, then `npx expo start -c`. On the phone, the app should sign in anonymously. Add a one-line temporary log in `app/_layout.tsx` bootstrap or check via `getDataService().isDemo` — expected: `false`. Remove any temp log after.

- [ ] **Step 6: Commit `.firebaserc`**

```bash
git add .firebaserc
git commit -m "Link app to EU Firebase project"
```

---

### Task 5: [MATTY] Create a separate Stripe restricted test key

No code/commit — produces the Stripe test secret for Task 6.

- [ ] **Step 1:** In the Stripe Dashboard, toggle to **Test mode** (top-right).
- [ ] **Step 2:** Developers → API keys → **Create restricted key** → name `ourmoment-test` → grant **Write** on **Checkout Sessions** and **PaymentIntents** (read on Products/Prices) → create.
- [ ] **Step 3:** Reveal and copy the `rk_test_...` key → paste to Claude.

**Verification:** You have a `rk_test_...` restricted key scoped to this app only (no other project's resources touched). The function builds price/product inline, so no pre-created product is needed.

---

### Task 6: Set Cloud Functions secrets

v2 functions fail to deploy if a referenced secret doesn't exist. `createEvent`/`generateQuests` reference `ANTHROPIC_API_KEY`; `createCheckoutSession` references `STRIPE_SECRET_KEY`. The code falls back gracefully if Anthropic is unset, but the secret must still **exist** to deploy.

- [ ] **Step 1: Set the Stripe test key** (Claude, non-interactive)

```bash
printf '%s' '<rk_test_... from Task 5>' | npx firebase-tools functions:secrets:set STRIPE_SECRET_KEY --data-file=-
```

- [ ] **Step 2: Set the Anthropic key (real if provided, else placeholder)**

If Matty provides a real key:
```bash
printf '%s' '<sk-ant-...>' | npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY --data-file=-
```
If not, set a placeholder so deploy succeeds and the offline quest generator is used:
```bash
printf '%s' 'disabled' | npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY --data-file=-
```

- [ ] **Step 3: Verify secrets exist**

Run: `npx firebase-tools functions:secrets:list` — expected: both `STRIPE_SECRET_KEY` and `ANTHROPIC_API_KEY` listed.

(No commit — secrets live in Google Secret Manager, not the repo.)

---

### Task 7: Deploy Firestore + Storage rules

- [ ] **Step 1: Deploy rules**

Run: `npx firebase-tools deploy --only firestore:rules,storage:rules` — expected: "Deploy complete!" and both rulesets show as released in the console.

- [ ] **Step 2: Sanity check** the console (Firestore → Rules, Storage → Rules) shows the just-deployed rules timestamp.

(No commit — rules files are already in the repo; this only releases them.)

---

### Task 8: Deploy Cloud Functions to the EU

- [ ] **Step 1: Deploy**

Run: `npx firebase-tools deploy --only functions` — expected: `createEvent`, `joinEvent`, `generateQuests`, `createCheckoutSession`, `purgeExpiredEvents` all deploy successfully.

- [ ] **Step 2: Verify region**

In the console (Functions tab), confirm every function's region is **`europe-west1`**. If any show `us-central1`, the `setGlobalOptions` from Task 1 didn't take — re-check and redeploy.

(No commit.)

---

### Task 9: End-to-end verification (live event + test booking)

- [ ] **Step 1: Two-phone live event**

On phone A (host): create an event in the store/booking flow → note the join **code**.
On phone B (or the same phone, second event): enter the code to join.
Each captures a photo. **Expected:** both phones see each other's photos appear in the gallery in near-real-time (Firestore `onSnapshot`). Confirm in the console that `events/{id}/photos` documents and Storage objects exist under `europe-west1`.

- [ ] **Step 2: Test booking (Stripe test mode)**

Start a booking → Stripe Checkout opens → pay with test card `4242 4242 4242 4242`, any future expiry, any CVC/postcode. **Expected:** redirect back to `ourmoment://checkout-complete?status=success`, then the event is created. Confirm a test PaymentIntent appears in the Stripe **test** dashboard.

- [ ] **Step 3: Prices in EUR**

Confirm store cards and the booking screen show **€** amounts.

- [ ] **Step 4: Send the QR** (per standing rule) so Matty can run the live build.

**Done when:** all three verifications pass. Sub-project 1 complete.

---

## Notes / known follow-ups (out of scope here)

- **Stripe webhook** (production-safe payment verification before `createEvent`) — replaces redirect-trust. Pull forward only if time allows; otherwise sub-project 4/5.
- GDPR consent UI + data export/delete (sp2), legal docs (sp3), rules audit (sp4), EAS build + store data-safety forms (sp5).
- Swap Stripe **live** keys (and toggle off test mode) only after legal + store readiness.
