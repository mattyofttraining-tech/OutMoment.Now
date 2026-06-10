import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/theme';
import { AppDialogHost } from '@/components/ui';
import { WebShell } from '@/components/WebShell';
import { useAppStore } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="events" options={{ presentation: 'modal' }} />
      <Stack.Screen name="host" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="book/[type]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="checkout-complete" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="capture"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="swipe"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const bootstrap = useAppStore((s) => s.bootstrap);
  const ready = useAppStore((s) => s.ready);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // Don't let a font failure (e.g. on web) strand the app on a blank splash —
  // fall back to system fonts once fonts either load or error out.
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    bootstrap().catch((err) => console.warn('Bootstrap failed:', err));
  }, [bootstrap]);

  // PWA: register the service worker (web only, production origins only —
  // localhost dev servers don't serve /sw.js and a stale worker breaks HMR).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }, []);

  useEffect(() => {
    if (!fontsReady || !ready) return;
    SplashScreen.hideAsync().catch(() => {});
    // Web: fade out the static splash from +html.tsx now that the app renders.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 350);
      }
    }
  }, [fontsReady, ready]);

  // Rendered even while loading so the static export bakes the page title in.
  const head = (
    <Head>
      <title>OurMoment — Capture the moment. Together.</title>
    </Head>
  );

  if (!fontsReady || !ready) return head;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {head}
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <WebShell>
            <RootStack />
          </WebShell>
          <AppDialogHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
