import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web-only HTML shell (expo-router renders this around every page).
// Carries the PWA wiring: manifest, theme color, iOS install metadata.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta
          name="description"
          content="Capture every moment of your event together. Guests join with a code, share photos and complete quests — everything disappears after 30 days."
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B0B0F" />

        {/* iOS "Add to Home Screen" */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OurMoment" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
