# Security & Privacy

Privacy is a feature here, not fine print. The model is **closed groups + hard
deletion**.

## Closed groups

Access to an event — and everything inside it — is gated by the event's
`memberUids` array. The rules in `firestore.rules` enforce:

- **Read** an event/members/quests/photos only if `request.auth.uid` is in
  `memberUids`.
- **Membership is server-granted only.** Clients cannot create/delete events or
  add themselves to one. `createEvent` and `joinEvent` (Cloud Functions, running
  with admin privileges) are the *only* way in.
- **Clients get exactly two narrow writes:** append themselves to a quest's
  `completedBy`, and increment an event's `photoCount`. Enforced with
  `diff().affectedKeys().hasOnly([...])`.
- **Photos are immutable** client-side and attributable only to the uploader
  (`uploaderUid == request.auth.uid` on create). Deletion happens only via the
  scheduled purge.
- **Saved photos are private** to each user under `users/{uid}/saved`.

Storage rules (`storage.rules`) mirror this: only event members can read/upload to
`events/{eventId}/photos/*`, with size + content-type limits.

## Auth

Lightweight by design: **anonymous auth**. There are no passwords — the event code
is the join capability. A code grants entry to exactly one event and nothing else.
Codes are word+digit (e.g. `SUNSET-4827`); uniqueness is guaranteed by
`createEvent` retrying on collision.

## Hard deletion (the product)

`purgeExpiredEvents` runs daily and, for every event past `expiresAt`
(= `createdAt + 30 days`):

1. Deletes all Storage objects under `events/{eventId}/`.
2. Recursively deletes the Firestore document tree.

There is **no soft-delete flag and no recovery path** — intentionally. This is
also your GDPR/CCPA right-to-erasure story: user content is provably gone within
30 days.

> Test the purge ruthlessly before launch (see FIREBASE_SETUP.md §7). It is the product.

## Known tradeoff: download URLs

The client resolves photos with `getDownloadURL()`, which returns a long-lived
tokenized URL. If such a URL leaks, it bypasses Storage rules until the token is
revoked. For maximum confidentiality, harden by:

- Serving photos through **short-lived signed URLs** minted by a Cloud Function
  (members only), instead of `getDownloadURL()`, **or**
- Routing image reads through a function/CDN that checks membership per request.

The current approach is a reasonable v1 default; the seam to upgrade it is the
`url` field on photos + the `subscribePhotos` reader.

## Secrets

- `ANTHROPIC_API_KEY` and `STRIPE_SECRET_KEY` are **server-only** (Functions
  secrets) — never `EXPO_PUBLIC_`, never bundled into the app.
- `.env`, `google-services.json`, and `GoogleService-Info.plist` are gitignored.

## Payments & App Store

Booking an event is a real-world service, generally **exempt from Apple IAP**, so
checkout uses **Stripe** via an external browser session rather than StoreKit.
**Verify against the current App Store Review Guidelines before submitting** — if
Apple deems it digital content, you may need to revisit.
