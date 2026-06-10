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
        {/* Installed-PWA polish: keep the canvas dark (overscroll/home-indicator
            areas), and size the app with dvh — in iOS standalone mode `100%`
            resolves against a layout viewport that stops above the home
            indicator, leaving a dead strip at the bottom of every screen.
            Installed app: dvh settles a frame or two after launch (the footer
            visibly drops down) — there are no collapsing toolbars in standalone,
            so lock to the large viewport, which is full-screen from frame one. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
body{background-color:#0B0B0F}
@supports (height: 100dvh) { html, body, #root { height: 100dvh; } }
@media (display-mode: standalone) {
  @supports (height: 100lvh) { html, body, #root { height: 100lvh; } }
}
#splash {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  background-color: #0B0B0F;
  background-image: linear-gradient(135deg, #0B0B0F 0%, #101018 45%, rgba(113,125,173,0.18) 80%, #0B0B0F 100%);
  opacity: 1; transition: opacity 320ms ease;
}
#splash img { width: 76px; height: 76px; border-radius: 19px; }
#splash span {
  color: rgba(255,255,255,0.92); letter-spacing: 0.4px;
  font: 700 17px/1.3 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
`,
          }}
        />
      </head>
      <body>
        {children}
        {/* Static splash: painted with the first HTML frame, long before the JS
            bundle runs. RootLayout fades it out once fonts + store are ready. */}
        <div id="splash">
          <img src="/icons/icon-192.png" alt="" />
          <span>OurMoment</span>
        </div>
      </body>
    </html>
  );
}
