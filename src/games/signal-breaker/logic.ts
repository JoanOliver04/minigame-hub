/**
 * Signal Breaker — pure rules (blueprint §11.2).
 * Feedback handles duplicate symbols correctly: a symbol counted as an
 * exact match is not also counted as a partial (standard Mastermind).
 */

import type { Rng } from "@/lib/rng";
import type { Code, Feedback } from "./types";
import { CODE_LENGTH, SYMBOL_COUNT } from "./types";

export function scoreGuess(secret: Code, guess: Code): Feedback {
  let exact = 0;
  const secretCounts = new Array<number>(SYMBOL_COUNT).fill(0);
  const guessCounts = new Array<number>(SYMBOL_COUNT).fill(0);
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else {
      secretCounts[secret[i]]++;
      guessCounts[guess[i]]++;
    }
  }
  let partial = 0;
  for (let s = 0; s < SYMBOL_COUNT; s++) {
    partial += Math.min(secretCounts[s], guessCounts[s]);
  }
  return { exact, partial };
}

export function feedbackEqual(a: Feedback, b: Feedback): boolean {
  return a.exact === b.exact && a.partial === b.partial;
}

export function isSolved(feedback: Feedback): boolean {
  return feedback.exact === CODE_LENGTH;
}

export function randomCode(rng: Rng, allowRepeats: boolean): Code {
  if (allowRepeats) {
    return Array.from({ length: CODE_LENGTH }, () => rng.int(0, SYMBOL_COUNT - 1));
  }
  const pool = Array.from({ length: SYMBOL_COUNT }, (_, i) => i);
  return rng.shuffle(pool).slice(0, CODE_LENGTH);
}

/** All possible codes (1,296 when repeats allowed). Used by the solver. */
export function allCodes(allowRepeats: boolean): Code[] {
  const out: Code[] = [];
  const build = (prefix: Code) => {
    if (prefix.length === CODE_LENGTH) {
      out.push(prefix.slice());
      return;
    }
    for (let s = 0; s < SYMBOL_COUNT; s++) {
      if (!allowRepeats && prefix.includes(s)) continue;
      prefix.push(s);
      build(prefix);
      prefix.pop();
    }
  };
  build([]);
  return out;
}

export function codeEqual(a: Code, b: Code): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
