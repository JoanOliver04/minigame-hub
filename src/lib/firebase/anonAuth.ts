/** Anonymous room identity, persisted by Firebase across browser sessions. */

"use client";

import { signInAnonymously, type User } from "firebase/auth";
import { getFirebaseAuth } from "./client";

let signedInPromise: Promise<User> | null = null;

/** Wait for a restored session before signing in and share concurrent attempts. */
export function ensureSignedIn(): Promise<User> {
  if (signedInPromise) return signedInPromise;

  signedInPromise = Promise.resolve()
    .then(async () => {
      const auth = getFirebaseAuth();
      await auth.authStateReady();
      return auth.currentUser ?? (await signInAnonymously(auth)).user;
    })
    .finally(() => {
      signedInPromise = null;
    });

  return signedInPromise;
}
