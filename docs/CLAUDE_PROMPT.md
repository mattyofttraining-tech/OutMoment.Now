# The Master Build Prompt

This is the single, self-contained prompt that specifies OurMoment. Hand it to
Claude Code (or any capable agent) to regenerate or extend the app. It encodes the
vision, the decisions, and the anti-slop guardrails.

---

## Prompt

> Build **OurMoment**, a closed, ephemeral, event-based photo app in **React
> Native (Expo, TypeScript, expo-router)** with a **Firebase** backend.
>
> **The core bet — protect it above all:** the product is *scarcity*, not "a
> shared album." Every event's photos are permanently deleted 30 days after
> creation. If a guest hasn't saved a photo by then, it's gone forever. This
> tension is the retention loop and the marketing line. **Never** build undelete/
> recovery, never extend the timer silently, never soften the ending.
>
> **Roles (one app for both):**
> - *Organizer*: books an event in the in-app store, pays (Stripe/external
>   checkout — verify App Store policy), names it, picks a type (or describes a
>   custom one), receives a shareable code, can manage it.
> - *Guest*: enters a code, joins one closed event, captures photos, completes
>   quests, and at the end swipes to save their keepers.
>
> **Lifecycle (the spine):** Book → Join (code) → Live (capture + quests, photos
> appear near-real-time) → Save (swipe deck against a visible "expires in N days")
> → Death (server hard-deletes the whole pool at day 30).
>
> **Five event types**, each with a curated 8–12 prompt quest pack:
> Marriage, Confirmation, Baptism, Birthday, and **Special Moments** (general +
> **AI-generated quests** from the organizer's description). AI quests are
> available to *all* types as a boost; they're the hero feature of Special Moments.
>
> **Core features:**
> - *In-app store*: five elegant event-type cards → pick → pay → name → date →
>   generate code.
> - *Join by code*: single field, instant, minimal friction. Code = capability to
>   enter exactly one closed event.
> - *In-app capture*: camera is primary; optional, default-on, per-event camera-
>   roll upload.
> - *Quests*: curated pack per type; a quest = title + one-line prompt; completing
>   = attaching a photo. **Light** progress only (soft ring, haptic + confetti on
>   complete). No leaderboard by default.
> - *Shared gallery*: all members see all photos. No likes, comments, or profiles.
>   Photo-forward grid.
> - *The Save swipe (personal)*: full-bleed photo, right = save, left = skip.
>   Reanimated spring physics + haptic on every save. Running "X saved" + prominent
>   "expires in N days." Saving writes to an in-app **Saved** album *and* optionally
>   exports to the camera roll. One person's choices never affect another's view.
> - *Expiry*: server-side scheduled **hard delete** at 30 days. No recovery.
>
> **AI quest generation:** a backend endpoint calls an LLM with a guard-railed
> system prompt enforcing warmth, appropriateness (nothing invasive/creepy/
> embarrassing/unsafe), and variety across shot types (wide, candids, details,
> guest of honour). Output is structured JSON of 8–12 `{title, prompt}` items;
> validate hard and reject malformed responses, falling back to the curated pack.
>
> **Design — "what Apple would have made":** generous whitespace, one accent
> colour (per event world), content-forward, depth via soft shadow/blur not hard
> borders, San Francisco on iOS / **Inter** as cross-platform proxy, spring-based
> purposeful motion, haptics only on moments that matter (join, quest complete,
> save), **light + dark from day one**. Decor uses tasteful royalty-free stock
> placeholders only on store cards and empty states — never cheesy or branded.
>
> **Technical:** Reanimated for swipe + transitions; Firebase Auth (anonymous —
> the code is the join capability), Firestore, Storage (per-event isolation),
> Cloud Functions for events/codes/upload/quest-packs/AI/checkout and the
> scheduled deletion. Closed groups only — no public discovery, no global feed.
> Server-only secrets for the LLM and Stripe keys.
>
> **Build sequence:** foundation (events/codes/join/roles) → capture + shared
> gallery → quests → AI quests → save swipe + expiry → store + payments → polish
> (motion, haptics, dark mode, empty states).
>
> **Explicit non-goals (anti-slop):** no social graph/following, public profiles,
> likes/comments, global feed, chat/DMs, Stories, AR filters, notification spam,
> or any undelete/recover mechanism.
>
> Make it production-grade and safe: TypeScript throughout, a clean service seam
> so the app runs in a fully-interactive demo mode without a backend, real
> security rules that enforce the closed-group model, and tests for the deletion
> job. Ship the setup docs needed to connect a real Firebase project.

---

## Confirmed product decisions

| Decision | Choice |
|---|---|
| Backend | **Firebase** (Auth + Firestore + Storage + Functions) |
| Storefront | **In-app store section** (Store tab) |
| Save semantics | **Personal** — each guest saves to their own collection; the pool still dies at 30 days |
| Save target | In-app **Saved** album **+ optional camera-roll export** |
| Quest competition | **Light progress only** (no leaderboard) |
| Camera-roll upload during event | **Allowed by default** (per-event toggle planned) |
| AI quests scope | **Available to all types**, hero feature of Special Moments |
| Payments | **Stripe / external checkout** (verify App Store policy) |

## Where each piece lives

See `docs/ARCHITECTURE.md` for the full map. Quick index:

- Vision/quests content → `src/data/eventWorlds.ts`
- Service contract → `src/services/dataService.ts` (+ `firebaseService`, `demoService`)
- Swipe deck → `src/features/swipe/`
- The hard delete → `functions/src/index.ts` (`purgeExpiredEvents`)
- AI generation + guardrails → `functions/src/quests.ts`
- Security model → `firestore.rules`, `storage.rules`, `docs/SECURITY.md`
