/**
 * Signal Breaker — solver + setter AI (blueprint §11.3).
 *
 * Honest-information contract: the solver receives ONLY the feedback from
 * its own past guesses (a history), never the secret. It maintains the set
 * of codes still consistent with that history and chooses its next guess
 * from it.
 *
 *   Easy   — random code consistent with all prior feedback.
 *   Medium — minimax elimination over a sampled candidate subset.
 *   Hard   — exact expected-information (Knuth-style worst-case minimax)
 *            over all remaining candidates.
 *
 * The setter AI (Hard) picks a secret that resists the player's observed
 * opening habits by maximizing the expected candidate-set size their
 * historical first guesses would leave.
 */

import type { Rng } from "@/lib/rng";
import { allCodes, feedbackEqual, scoreGuess } from "./logic";
import { CODE_LENGTH, type Code, type GuessRow, type SignalDifficulty } from "./types";

/** Codes still consistent with every (guess, feedback) pair seen so far. */
export function consistentCodes(
  candidates: Code[],
  history: GuessRow[],
): Code[] {
  return candidates.filter((code) =>
    history.every((row) => feedbackEqual(scoreGuess(code, row.guess), row.feedback)),
  );
}

/**
 * Worst-case partition size for `guess` over the remaining candidates: the
 * largest number of candidates that would survive any single feedback
 * response. Lower is better (Knuth minimax).
 */
const BUCKET_WIDTH = CODE_LENGTH + 1;
const codeKey = (code: Code) => code.join(",");
const outcome = (secret: Code, guess: Code) => {
  const feedback = scoreGuess(secret, guess);
  return feedback.exact * BUCKET_WIDTH + feedback.partial;
};

function partition(guess: Code, remaining: Code[]): { worst: number; expected: number } {
  const buckets = Array<number>(BUCKET_WIDTH ** 2).fill(0);
  for (const code of remaining) {
    buckets[outcome(code, guess)]++;
  }
  return {
    worst: Math.max(...buckets),
    expected: buckets.reduce((sum, size) => sum + size * size, 0),
  };
}

export function aiPickGuess(
  history: GuessRow[],
  difficulty: SignalDifficulty,
  allowRepeats: boolean,
  rng: Rng,
): Code {
  const universe = allCodes(allowRepeats);
  const remaining = consistentCodes(universe, history);
  if (remaining.length <= 1) return remaining[0] ?? universe[0];
  if (history.length === 0) {
    // A fixed, information-rich opener; random on easy.
    if (difficulty === "easy") return rng.pick(remaining);
    return allowRepeats ? [0, 0, 1, 1] : [0, 1, 2, 3];
  }

  if (difficulty === "easy") {
    return rng.pick(remaining);
  }

  const possible = new Set(remaining.map(codeKey));
  const budget = 70_000;
  const extra = Math.max(0, Math.floor(budget / remaining.length) - remaining.length);
  const guessPool = difficulty === "medium" ? sample(remaining, 60, rng)
    : [...remaining, ...sample(universe.filter((guess) => !possible.has(codeKey(guess))), extra, rng)];

  let best: Code = guessPool[0];
  let bestWorst = Infinity;
  let bestExpected = Infinity;
  for (const guess of guessPool) {
    const { worst, expected } = partition(guess, remaining);
    if (worst < bestWorst || (worst === bestWorst && expected < bestExpected)) {
      bestWorst = worst;
      bestExpected = expected;
      best = guess;
    }
  }
  return best;
}

function sample(codes: Code[], n: number, rng: Rng): Code[] {
  if (codes.length <= n) return codes;
  return rng.shuffle(codes).slice(0, n);
}

/**
 * Setter AI (Hard): choose a secret that resists the player's historical
 * opening guesses. For each candidate secret, sum the size of the
 * candidate set the player's past first-guesses would leave; larger means
 * harder to crack. With no history, pick uniformly (blueprint §11.3).
 */
export function aiPickSecret(
  playerOpeningGuesses: Code[],
  difficulty: SignalDifficulty,
  allowRepeats: boolean,
  rng: Rng,
): Code {
  const universe = allCodes(allowRepeats);
  if (difficulty !== "hard" || playerOpeningGuesses.length === 0) {
    return rng.pick(universe);
  }
  // Build each feedback histogram once and reuse it for every candidate.
  const openers = playerOpeningGuesses.slice(-12);
  const openerKeys = new Set(openers.map(codeKey));
  const scores = Array<number>(universe.length).fill(0);
  for (const opener of openers) {
    const feedback = universe.map((secret) => outcome(secret, opener));
    const buckets = Array<number>(BUCKET_WIDTH ** 2).fill(0);
    for (const key of feedback) buckets[key]++;
    feedback.forEach((key, index) => { scores[index] += buckets[key]; });
  }
  let best: Code[] = [];
  let bestScore = -Infinity;
  universe.forEach((secret, index) => {
    if (openerKeys.has(codeKey(secret))) return;
    if (scores[index] > bestScore) {
      bestScore = scores[index];
      best = [];
    }
    if (scores[index] === bestScore) best.push(secret);
  });
  return rng.pick(best.length ? best : universe);
}
