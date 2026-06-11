# Event Pulse + Profile merge

**Date:** 2026-06-11 · **Approved by:** Matty (via in-chat design questions)

## Goal

One shared screen instead of two: Event pulse (host dashboard) on top, Profile
below it as a compact expandable card. Single entry icon in the home header.

## Decisions (user-approved)

- **Entry point:** the home header's two icons (`stats-chart` → `/host`,
  `person-circle-outline` → `/settings`) collapse into one
  `person-circle-outline` icon → `/host`.
- **Layout:** pulse content first (invite code, stat tiles, quest ring,
  top contributors, who's here), then a Profile section. Profile renders as a
  **compact card** (avatar + name + appearance/language summary) that expands
  in place on tap to reveal: name field, appearance picker, language picker,
  how-it-works, about. Collapsed by default.
- **No active event:** pulse part collapses to the existing empty state;
  Profile card still shows, so the screen is never a dead end.
- **Delete event** stays at the very bottom (host only), below Profile.

## Implementation

- `app/host.tsx` — absorbs all Profile content. New `ProfileCard` component in
  the same file (collapsed/expanded state via `useState`; reuses `Avatar`,
  `Card`, `PressableScale`, and the pickers verbatim from `settings.tsx`).
- `app/(tabs)/index.tsx` — drop the `stats-chart` icon, keep
  `person-circle-outline`, point it at `/host`.
- `app/settings.tsx` — becomes `<Redirect href="/host" />` so old deep links
  and the cached PWA route keep working.
- i18n: reuse existing `settings.*` keys (present in all 10 locales);
  no new strings.

## Out of scope

Quest list, gallery, store, web export/deploy (separate step).
