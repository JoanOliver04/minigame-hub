/**
 * Versioned per-game preference storage (blueprint §16.3).
 *
 * Used for calibration offsets, control schemes, and personal bests —
 * data that must never be mixed into the global win/loss/tie score schema.
 * Each preference lives under its own localStorage key wrapped in a
 * versioned envelope; a version mismatch or corrupt value reads as absent.
 */

interface GamePreferenceEnvelope<T> {
  version: number;
  value: T;
}

export function loadPref<T>(key: string, version: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GamePreferenceEnvelope<T>;
    if (!parsed || typeof parsed !== "object" || parsed.version !== version) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

export function savePref<T>(key: string, version: number, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ version, value }));
  } catch {
    /* storage blocked — preference simply won't persist */
  }
}
