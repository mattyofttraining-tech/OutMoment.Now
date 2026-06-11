import { Redirect } from 'expo-router';

// Profile now lives inside the Event pulse screen (app/host.tsx).
// Keep this route as a redirect so old deep links and the cached PWA
// /settings URL still land somewhere sensible.
export default function SettingsRedirect() {
  return <Redirect href="/host" />;
}
