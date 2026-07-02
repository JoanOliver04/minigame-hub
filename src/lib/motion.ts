/**
 * Application-level motion preference (blueprint §16.4).
 *
 * "system" follows the OS `prefers-reduced-motion` media query; "reduced"
 * and "full" override it explicitly. Games read `isMotionReduced()` at
 * effect/animation time and must provide a meaningful reduced fallback
 * (skip particles, shake, and camera effects — never hide information).
 *
 * Module-level state matches src/lib/settings.ts: client-only, read at
 * action time, session-scoped.
 */

export type MotionPreference = "system" | "reduced" | "full";

let preference: MotionPreference = "system";

export function getMotionPreference(): MotionPreference {
  return preference;
}

export function setMotionPreference(value: MotionPreference) {
  preference = value;
}

/** Effective flag combining the app preference with the OS setting. */
export function isMotionReduced(): boolean {
  if (preference === "reduced") return true;
  if (preference === "full") return false;
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
