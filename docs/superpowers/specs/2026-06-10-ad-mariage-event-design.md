# Ad Mariage — Always-On Marketing Event

**Date:** 2026-06-10
**Status:** Approved, implemented (pending production deploy + seed run)

## Goal

Give the live site `https://ourmoment-prod.web.app` a permanent, never-expiring
**marriage** event ("Ad Mariage") that the owner can log into from any browser to
upload/screenshot photos and screen-record the app for marketing/ad content.

This deliberately runs counter to the app's core 30-day hard-delete rule, so it is
scoped to a single flagged event and never changes behaviour for real user events.

## Decisions (from brainstorming)

- **Use case:** content source — populate + screenshot + record footage.
- **Access:** a fixed, memorable join code (`MARIAGE-AD`). No new auth system.
- **Always-on look:** a daily job keeps expiry ~26 days out so the countdown badge
  always reads a believable number; the event is never purged.
- **Seed content:** the 7 renamed `Mariage_01–07.jpg` photos.
- **Host view:** yes — the owner's recording browser is promoted to host so the
  Host dashboard (stats/leaderboard/invite-code) is filmable.

## Architecture

Three pieces; the event is seeded directly via the Admin SDK because `createEvent`
now requires a paid Stripe session.

1. **Seed script** `functions/scripts/seedAdEvent.js`
   - Fixed doc ID `ad-mariage` (idempotent). Deterministic quest/photo IDs.
   - Writes the event (`neverPurge: true`, `code: MARIAGE-AD`), the curated
     marriage quest pack, demo members, and uploads the photos to
     `events/ad-mariage/photos/*` with download-token URLs.
   - Cover image = first uploaded wedding photo.

2. **Keep-alive function** `refreshAdEvents` (`functions/src/index.ts`)
   - `onSchedule every 24 hours`; sets `expiresAt = now + 26 days` for every event
     with `neverPurge: true`. Keeps the badge realistic and out of the purge window.

3. **Purge safety belt** (`purgeExpiredEvents`)
   - Skips any doc with `neverPurge === true`, so even if the keep-alive job fails
     during an outage the ad event is never hard-deleted.

4. **Host promotion** `functions/scripts/promoteHost.js`
   - After the owner joins as `AdHost`, sets the event `hostUid`/`hostName` to that
     uid and flips their member role to `host`.

## Data shape (event doc)

Matches `OurEvent` plus one new optional field `neverPurge: boolean`. No type or
client changes required — the countdown and all screens read existing fields.

## Run order

1. `cd functions && npm run build`
2. `firebase deploy --only functions` (deploys `refreshAdEvents` + updated purge)
3. Auth for scripts: place `functions/scripts/serviceAccount.json` **or**
   `gcloud auth application-default login`.
4. `node scripts/seedAdEvent.js`
5. Open site → Join → `MARIAGE-AD` as display name `AdHost`.
6. `node scripts/promoteHost.js AdHost`

## Out of scope / non-goals

- No new auth system (email/password).
- No undelete/recovery changes to real events.
- No client UI changes — purely backend + data.

## Risks

- `serviceAccount.json` is a secret — gitignored. Do not commit.
- Re-running the seed overwrites the event in place (intended); it does not delete
  guest-uploaded photos that use other IDs.
