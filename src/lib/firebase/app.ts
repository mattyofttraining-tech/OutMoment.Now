/**
 * Lazily initialises the Firebase SDK. Nothing here runs in demo mode, so the
 * app boots fine without any configuration.
 *
 * Auth uses React Native persistence backed by AsyncStorage so a guest stays
 * signed in (anonymously) across launches and keeps their saved moments.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
// @ts-expect-error — getReactNativePersistence is RN-only and untyped in some firebase versions.
import { getReactNativePersistence, initializeAuth, getAuth, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured, useEmulator } from './config';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _functions: Functions | null = null;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to .env, or run in demo mode.',
    );
  }
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = ensureApp();
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialised (e.g. Fast Refresh) — fall back to getAuth.
    _auth = getAuth(app);
  }
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(ensureApp());
  if (useEmulator) connectFirestoreEmulator(_db, '127.0.0.1', 8080);
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(ensureApp());
  if (useEmulator) connectStorageEmulator(_storage, '127.0.0.1', 9199);
  return _storage;
}

export function getFirebaseFunctions(): Functions {
  if (_functions) return _functions;
  _functions = getFunctions(ensureApp());
  if (useEmulator) connectFunctionsEmulator(_functions, '127.0.0.1', 5001);
  return _functions;
}
