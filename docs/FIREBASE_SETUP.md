# Firebase Setup

OurMoment runs in **Demo Mode** with no setup. To go live, connect it to a
Firebase project (you already have one on FitSync.fitness — you can reuse it or
create a dedicated `ourmoment` project; a dedicated project is cleaner).

## 1. Client config

1. Firebase Console → **Project settings** → **Your apps** → add/select a Web app.
2. Copy the config values into `.env` (copy from `.env.example` first):

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> These web keys are **meant** to be public. Your data is protected by the
> security rules, not by hiding the key. Restart `npm start` after editing `.env`.

As soon as these are set, the app leaves Demo Mode and uses the live backend.

## 2. Enable Anonymous Auth

Authentication → **Sign-in method** → enable **Anonymous**.
OurMoment intentionally has no passwords — the *event code* is the join capability.

## 3. Install the CLI & log in

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project, alias it "default"
```

## 4. Deploy security rules + indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

This publishes `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## 5. Backend secrets

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY   # for AI quest generation
firebase functions:secrets:set STRIPE_SECRET_KEY   # for booking checkout
```

- **Anthropic key** → https://console.anthropic.com (used by `generateQuests` / `createEvent`).
- **Stripe key** → https://dashboard.stripe.com/apikeys (used by `createCheckoutSession`).

If you skip a secret, that feature degrades gracefully: AI quests fall back to the
curated pack; checkout returns an "unimplemented" error you can catch.

## 6. Deploy functions

```bash
cd functions && npm install
cd .. && firebase deploy --only functions
```

Functions deployed:

| Function | Type | Purpose |
|---|---|---|
| `createEvent` | callable | Create an event, allocate a unique code, build the quest pack |
| `joinEvent` | callable | Validate a code, add the caller to that one event |
| `generateQuests` | callable | AI quest pack from a free-text brief (Claude) |
| `createCheckoutSession` | callable | Stripe Checkout session for booking |
| `purgeExpiredEvents` | scheduled (daily) | **Hard-delete** every event past 30 days |

## 7. Verify the purge (the most important test)

The product *is* the deletion. Test it before launch:

1. Create an event, add a couple of photos.
2. In Firestore, temporarily set that event's `expiresAt` to a past timestamp.
3. Trigger the scheduled function:
   ```bash
   # Local emulator:
   cd functions && npm run serve
   # …or force-run in production from the console (Functions → purgeExpiredEvents → test),
   # or wait for the daily run.
   ```
4. Confirm the event doc, its subcollections, **and** the Storage folder
   `events/{eventId}/` are all gone — with no recovery path.

## Local emulators (optional)

```bash
# .env
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
```

```bash
cd functions && npm run build
firebase emulators:start
```

The app will connect to Auth/Firestore/Storage/Functions emulators on localhost.
