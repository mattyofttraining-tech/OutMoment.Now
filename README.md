# OurMoment 📸

> Capture the moment. Together. Then choose what survives.

OurMoment is a closed, **ephemeral** event-photo app. Guests join a single event
with a code, capture the moment together through playful **quests**, and — before
everything is permanently deleted at **30 days** — swipe through every photo to
save the ones that matter.

**If you don't save your moment, it dies.** That scarcity is the whole product.

---

## The core bet

This is *not* "a shared album." It's **scarcity**. Everything is engineered around
one emotional truth: these photos are temporary, and at the end you have to choose
what survives. That tension is the retention loop, the marketing line, and the
reason people open the app on day 29.

We protect it ruthlessly:
- ❌ No "recover deleted photos."
- ❌ No quietly extending the timer.
- ❌ No softening the ending.

The 30-day hard delete is also the GDPR right-to-erasure story — privacy as a feature.

---

## What's in the box

A complete, runnable React Native (Expo) app **plus** its Firebase backend:

| Layer | Built |
|---|---|
| **Mobile app** | Expo + expo-router, TypeScript, Reanimated, full design system, light/dark |
| **Join flow** | Single-code entry → one closed event |
| **Capture** | In-app camera + optional camera-roll upload, quest attachment |
| **Quests** | Curated packs for 5 event types + **AI-generated** packs from a description |
| **Shared gallery** | Real-time photo pool, photo-forward grid, lightweight viewer |
| **The Save swipe** | Full-bleed Tinder-style deck, spring physics, haptics, "X saved" + countdown |
| **In-app store** | Browse 5 event worlds → book → receive a shareable code (Stripe checkout) |
| **Saved album** | Personal keepers + optional camera-roll export |
| **Backend** | Cloud Functions: `createEvent`, `joinEvent`, `generateQuests` (Claude), `createCheckoutSession` (Stripe), and the scheduled **`purgeExpiredEvents`** hard delete |
| **Security** | Firestore + Storage rules enforcing true closed groups |

### The five event worlds
💍 Marriage · ✝️ Confirmation · 🕊️ Baptism · 🎂 Birthday · ✨ Special Moments (AI)

---

## Quickstart (Demo Mode — zero config)

The app boots into a fully populated showcase wedding when no Firebase config is
present, so you can explore **every** screen instantly.

```bash
npm install
npm start          # then press i (iOS), a (Android), or scan the QR in Expo Go
```

In demo mode: any join code works, capture/save/booking all function against
in-memory seed data, and AI quests use the offline generator.

> First run after cloning also generates app icons: `node scripts/make-assets.js`
> (already committed, but re-run any time to regenerate).

---

## Going live (your Firebase project)

You already own a Firebase app on **FitSync.fitness** — wiring OurMoment to it
takes a few minutes. Full walkthrough in **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)**.

Short version:

```bash
cp .env.example .env          # paste your Firebase web config
cd functions && npm install   # backend deps
firebase deploy --only firestore:rules,storage,functions
```

Set server secrets (never shipped to the client):

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY   # AI quests (Claude)
firebase functions:secrets:set STRIPE_SECRET_KEY   # booking checkout
```

Enable **Anonymous Auth** in the Firebase console (Authentication → Sign-in method).

---

## Project structure

```
.
├── app/                      # expo-router routes (screens)
│   ├── _layout.tsx           # providers, fonts, splash, bootstrap
│   ├── index.tsx             # welcome
│   ├── join.tsx              # join by code
│   ├── capture.tsx           # in-app camera (quest-aware)
│   ├── swipe.tsx             # the Save swipe deck
│   ├── book/[type].tsx       # booking flow → code reveal
│   ├── events.tsx            # event switcher
│   ├── settings.tsx          # profile / appearance / how it works
│   └── (tabs)/               # Moment · Gallery · Store · Saved
├── src/
│   ├── theme/                # design system (colors, type, tokens, provider)
│   ├── components/ui/        # Text, Button, Card, ProgressRing, …
│   ├── features/             # swipe, gallery, quests, store, event
│   ├── services/             # DataService abstraction (Firebase ⇄ Demo), media, payments
│   ├── store/                # Zustand app store
│   ├── lib/firebase/         # config + lazy SDK init
│   ├── data/                 # event worlds + seed data
│   ├── types/                # domain model
│   └── utils/                # time/countdown, haptics, fonts, images, codes
├── functions/                # Firebase Cloud Functions (backend)
├── firestore.rules           # closed-group security
├── storage.rules
└── docs/                     # architecture, firebase setup, security, the master prompt
```

---

## Scripts

| Command | What |
|---|---|
| `npm start` | Expo dev server |
| `npm run ios` / `android` / `web` | Launch a platform |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run functions:deploy` | Build + deploy Cloud Functions |
| `npm run deploy:rules` | Deploy Firestore + Storage rules |

---

## Explicit non-goals (anti-slop)

No social graph, public profiles, likes/comments, global feed, chat/DMs, Stories,
AR filters, notification spam — and **never** an undelete/recover mechanism. Every
one of those dilutes the core bet.

---

## Docs

- **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** — connect your Firebase project
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how it all fits together
- **[docs/SECURITY.md](docs/SECURITY.md)** — the closed-group + deletion model
- **[docs/CLAUDE_PROMPT.md](docs/CLAUDE_PROMPT.md)** — the master build prompt
