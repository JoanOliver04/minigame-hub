/**
 * Number Duel — AI opponent.
 *
 * Picks the next guess from the public interval [knownLow, knownHigh].
 * This interval includes every revealed clue, including the player's guesses:
 *  - hard:   exact midpoint  -> perfect binary search, ~log2(range) guesses
 *  - medium: midpoint +/- up to 10% of the interval width (clamped)
 *  - easy:   uniform random inside the interval, avoiding repeats
 */

import { randomInt } from "@/lib/random";
import type { RoundState } from "./logic";

function randomUntried(low: number, high: number, guessed: number[]): number {
  const used = new Set(guessed);
  for (let attempt = 0; attempt < 24; attempt++) {
    const candidate = randomInt(low, high);
    if (!used.has(candidate)) return candidate;
  }

  // A bounded random probe normally succeeds. If the interval is unusually
  // dense, scan once from a random point without allocating the whole range.
  const start = randomInt(low, high);
  for (let offset = 0; offset <= high - low; offset++) {
    const candidate = low + ((start - low + offset) % (high - low + 1));
    if (!used.has(candidate)) return candidate;
  }
  return Math.floor((low + high) / 2);
}

export function aiPickGuess(state: RoundState): number {
  const { knownLow, knownHigh, aiGuessed, config } = state;
  const mid = Math.floor((knownLow + knownHigh) / 2);

  if (config.difficulty === "hard") return mid;

  if (config.difficulty === "medium") {
    const jitter = Math.max(1, Math.floor((knownHigh - knownLow) * 0.1));
    const preferred = Math.min(
      knownHigh,
      Math.max(knownLow, mid + randomInt(-jitter, jitter)),
    );
    if (!aiGuessed.includes(preferred)) return preferred;
  }

  // Never waste a turn repeating a guess, even across very large ranges.
  return randomUntried(knownLow, knownHigh, aiGuessed);
}
