/**
 * Invisible identity for room players: Firebase Anonymous Auth, no signup UI.
 * The resulting uid is persisted by the SDK itself (IndexedDB) and survives
 * a page refresh on the same browser/device.
 */

"use client";

import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

let signedInPromise: Promise<User> | null = null;

/**
 * Resolves once an anonymous (or pre-existing) user is signed in. Safe to
 * call multiple times concurrently — the underlying sign-in only happens
 * once per page load.
 */
export function ensureSignedIn(): Promise<User> {
  if (signedInPromise) return signedInPromise;

  const auth = getFirebaseAuth();
  signedInPromise = new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
    signInAnonymously(auth).catch((error) => {
      unsubscribe();
      reject(error);
    });
  });
  return signedInPromise;
}
