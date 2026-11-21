/**
 * Firebase client SDK singleton. HMR-safe: Next.js dev fast-refresh can
 * re-execute this module without a full page reload, so `initializeApp`
 * must not be called twice against the same config.
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const useEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  const name = useEmulators ? "minigame-hub-demo" : "[DEFAULT]";
  return getApps().find((app) => app.name === name) ?? initializeApp(
    useEmulators ? { apiKey: "demo-key", projectId: "demo-minigame-hub" } : firebaseConfig,
    name,
  );
}

let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

/** Firestore instance. Only call from client components/effects — the app has no server backend. */
export function getDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getFirebaseApp());
    if (useEmulators) connectFirestoreEmulator(cachedDb, "127.0.0.1", 8080);
  }
  return cachedDb;
}

/** Firebase Auth instance (Anonymous provider only — see anonAuth.ts). */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
    if (useEmulators && !cachedAuth.emulatorConfig) {
      connectAuthEmulator(cachedAuth, "http://127.0.0.1:9099", { disableWarnings: true });
    }
  }
  return cachedAuth;
}
