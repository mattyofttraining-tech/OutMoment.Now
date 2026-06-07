/**
 * Firebase configuration, read from EXPO_PUBLIC_* env vars.
 *
 * These web API keys are designed to be public — security is enforced by the
 * Firestore & Storage rules in /firestore.rules and /storage.rules, not by
 * keeping the key secret.
 *
 * If the required values are missing, the app runs in DEMO MODE against the
 * in-memory seed data so every screen is explorable with zero setup.
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.storageBucket,
);

/** When true, the app uses seed data instead of a live backend. */
export const isDemoMode = !isFirebaseConfigured;

export const useEmulator: boolean =
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
