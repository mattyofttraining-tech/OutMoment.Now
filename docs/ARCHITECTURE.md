# Architecture

## Principles

- **Apple-grade restraint.** Every feature serves *capture → play → save before it dies*.
- **The moment is shared; the saving is personal.** One pool during the event;
  each guest privately curates their own keepers afterwards.
- **Privacy is a feature.** Closed groups, hard deletion, no public discovery.

## Layers

```
 Screens (app/*)        expo-router routes — thin, presentational
        │
 Zustand store          src/store/useAppStore.ts — UI state + actions
        │
 DataService            src/services/* — ONE interface, two implementations
        │
   ┌────┴─────┐
 Firebase    Demo        chosen at runtime by whether EXPO_PUBLIC_FIREBASE_* exists
        │
 Cloud Functions        privileged server logic + the scheduled purge
```

### The DataService seam

`src/services/dataService.ts` defines the single contract the UI uses. Two
implementations sit behind it:

- **`FirebaseDataService`** — Firestore, Storage, callable Functions.
- **`DemoDataService`** — in-memory seed data, fully interactive, no backend.

`getDataService()` picks one based on `isDemoMode`. Screens never branch on
backend availability — this is what makes Demo Mode a first-class experience and
keeps the app testable offline.

## Data model (Firestore)

```
events/{eventId}
  type, title, subtitle, hostUid, hostName, code, coverImage,
  status, createdAt, startsAt, expiresAt (= createdAt + 30d),
  memberCount, photoCount, memberUids: [uid], aiBrief?

  members/{uid}      { uid, displayName, role, joinedAt }
  quests/{questId}   { icon, title, prompt, order, completedBy: [uid], aiGenerated }
  photos/{photoId}   { uploaderUid, uploaderName, storagePath, url, w, h, createdAt, questId }

users/{uid}
  saved/{photoId}    { photoId, eventId, url, savedAt, exportedToDevice }
```

- **Membership** is the `memberUids` array on the event — the single source of
  truth for access control, granted only by Cloud Functions.
- **Saving is personal**: a keeper is a doc under `users/{uid}/saved`, invisible to
  everyone else. One guest's choices never affect another's view.

## Storage

```
events/{eventId}/photos/{photoId}.jpg
```

Per-event isolation; access gated by Storage rules that check `memberUids` in
Firestore. The scheduled purge deletes the whole `events/{eventId}/` prefix.

## The lifecycle (the spine)

1. **Book** — `createEvent` allocates a unique code + quest pack.
2. **Join** — `joinEvent` validates the code, appends the uid to `memberUids`.
3. **Live** — guests `uploadPhoto`; the gallery streams via `onSnapshot`.
4. **Save** — the swipe deck writes keepers to `users/{uid}/saved` (+ camera roll).
5. **Death** — `purgeExpiredEvents` hard-deletes everything at 30 days.

## Design system

`src/theme` provides palette (light/dark), an SF/Inter type scale, spacing/radius/
motion tokens, soft shadows, and a **per-event accent** that re-tints the whole UI
when you open an event (`useThemeControls().setAccent`). The `Text` component
resolves the correct font family per platform (San Francisco on iOS, Inter
elsewhere) so weight rendering is consistent.

## Motion & haptics

Reanimated drives the swipe deck (pan → rotate/translate, spring return, fling),
pressable scale feedback, and screen entrances. Haptics fire only on moments that
matter: join, quest complete, save.

## Key dependencies

Expo SDK 54 · expo-router · react-native-reanimated 4 (+ react-native-worklets) · react-native-gesture-handler
· firebase (modular v11) · zustand · expo-camera · expo-media-library · expo-image
· @expo-google-fonts/inter · react-native-svg.
Backend: firebase-admin · firebase-functions (v2) · @anthropic-ai/sdk · stripe.
