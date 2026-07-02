/**
 * Seeded random utility (blueprint §16.1).
 *
 * Every new game accepts an injectable random source so a match can be
 * reproduced from `{ seed, config, actions }`. Production code creates one
 * with `createRng(randomSeed())`; tests can pass a fixed seed and replay
 * identical generation, AI mistakes, and shuffles.
 *
 * Older games keep using Math.random until they are touched — do not
 * migrate them in bulk (see blueprint §16.1).
 */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Inclusive integer in [min, max]. */
  int(min: number, max: number): number;
  /** Uniformly chosen element (items must be non-empty). */
  pick<T>(items: readonly T[]): T;
  /** New shuffled copy (Fisher–Yates); the input is not mutated. */
  shuffle<T>(items: readonly T[]): T[];
}

/** mulberry32 — tiny, fast, good-enough statistical quality for games. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    shuffle(items) {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

/** Fresh unpredictable 32-bit seed for a production match. */
export function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}
