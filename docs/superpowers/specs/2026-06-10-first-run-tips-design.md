# First-run coach-mark tips — design

**Date:** 2026-06-10
**Goal:** Guide a brand-new user through what OurMoment does with small, dismissible popup texts on first arrival — crisp on both the app and the installed PWA, in all 10 locales.

## Why (copy strategy)

The onboarding carousel (`app/onboarding.tsx`) sells the big idea before the user enters the app. These tips extend that into the app itself, one screen at a time, using Russell Brunson's **Hook–Story–Offer** structure scaled down to coach-mark size:

- **Hook** — a short curiosity/promise title ("Your day, every angle", "What you keep is yours forever").
- **Story** — one sentence of mini-narrative that explains the screen in terms of the user's day, not UI chrome.
- **Offer** — the next action is implicit (the screen is right there) and the only button is a frictionless "Got it".
- **Urgency** — the product's native 30-day self-destruct is referenced where relevant (Saved tip), not invented.

## What

`src/components/FirstRunTip.tsx` — one component, four placements:

| Tip key | Screen | Message theme |
|---|---|---|
| `moment` | `(tabs)/index` (only when an event is active) | Home base: capture, quests, countdown |
| `gallery` | `(tabs)/gallery` (only when an event is active) | Live shared gallery; heart = keep forever |
| `saved` | `(tabs)/saved` | Permanence: the 30-day clock never touches this |
| `store` | `(tabs)/store` | Host your own: one code, every guest a photographer |

## Behavior

- **First arrival only.** Each tip persists `ourmoment.tip.<key>.v1 = 'seen'` in AsyncStorage. Versioned key so a future copy rewrite can re-show by bumping to `.v2`. No new data collection — a local boolean only.
- **One at a time.** A module-level lock ensures only one tip is ever on screen; an unseen tip whose turn was blocked appears on its screen's next focus (tabs are lazy-mounted, so the sequence follows the user's own path).
- **Show on focus, hide on blur.** Appears ~650 ms after the screen settles (entering spring + fade). Switching tabs hides it *without* marking it seen — only an explicit "Got it" counts.
- **Non-blocking.** It floats above the tab bar (`pointerEvents="box-none"` on the wrapper); the whole screen stays usable behind it. No modal, no overlay.
- **Gated** on `ready && hasOnboarded` so it never races the splash or the intro carousel.
- **Accessible:** `accessibilityLiveRegion="polite"` on the card, `accessibilityRole="button"` on the dismiss control, logo carries an `accessibilityLabel`.

## Brand alignment

- The card opens with the 18 px logo tile (same radius treatment as `BrandMark` whisper) so the popup is unmistakably OurMoment.
- Colors, type, radius, and shadow all come from the theme tokens (`surfaceElevated`, `border`, `accent`, `shadows.lg`) — identical in light/dark and app/PWA.
- The brand name renders as "OurMoment" in prose everywhere (existing convention, verified across locales).

## i18n

9 new keys under `tips.*` added to **all 10 locales** (en, de, fr, es, it, nl, pt, pl, da, sv) — key parity verified programmatically (225 keys per locale). English and Danish are hand-polished; the rest follow the file's existing "machine-assisted, native review before launch" convention.

## PWA

Service-worker cache bumped to `ourmoment-v4`; `dist` rebuilt via `expo export --platform web`. Deploy remains a user-run command (`! npx firebase-tools deploy --only hosting --project ourmoment-prod`).
