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
import { allCodes, codeEqual, feedbackEqual, scoreGuess } from "./logic";
import type { Code, GuessRow, SignalDifficulty } from "./types";

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
function worstCasePartition(guess: Code, remaining: Code[]): number {
  const buckets = new Map<string, number>();
  for (const code of remaining) {
    const fb = scoreGuess(code, guess);
    const key = `${fb.exact},${fb.partial}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  let worst = 0;
  for (const size of buckets.values()) if (size > worst) worst = size;
  return worst;
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

  // Medium samples candidate guesses to stay cheap; Hard evaluates all.
  const guessPool =
    difficulty === "medium" && remaining.length > 60
      ? sample(remaining, 60, rng)
      : remaining;

  let best: Code = guessPool[0];
  let bestWorst = Infinity;
  for (const guess of guessPool) {
    const worst = worstCasePartition(guess, remaining);
    if (worst < bestWorst) {
      bestWorst = worst;
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
  // Score a sampled set of secrets to keep this affordable.
  const secretPool = sample(universe, 120, rng);
  let best: Code = secretPool[0];
  let bestScore = -Infinity;
  for (const secret of secretPool) {
    let score = 0;
    for (const opener of playerOpeningGuesses) {
      const fb = scoreGuess(secret, opener);
      // Candidates left after applying this opener's feedback to the secret.
      const left = universe.filter((code) => feedbackEqual(scoreGuess(code, opener), fb)).length;
      score += left;
    }
    // Prefer secrets the player's openers don't immediately narrow, but not
    // one the opener already solves (that would be an instant loss).
    const solvedByOpener = playerOpeningGuesses.some((o) => codeEqual(o, secret));
    if (!solvedByOpener && score > bestScore) {
      bestScore = score;
      best = secret;
    }
  }
  return best;
}
