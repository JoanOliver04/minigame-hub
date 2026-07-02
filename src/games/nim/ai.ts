/**
 * Nim AI — nim-sum (XOR) optimal strategy, for both normal and misère play.
 *
 * This file is a self-contained demonstration of the classic combinatorial
 * game theory result for Nim (Bouton, 1901). Everything below only ever
 * looks at pile sizes; there is no board, no UI, no randomness beyond the
 * "easy"/"medium" difficulty fallbacks.
 *
 *  - easy:   uniformly random legal move, no strategy at all.
 *  - medium: plays the optimal move ~65% of the time, otherwise random —
 *            strong but beatable.
 *  - hard:   always plays optimally when a winning move exists. If the
 *            position is already lost (nim-sum already zero against a
 *            perfect opponent), no move can save it, so it just plays
 *            any legal move.
 */

import { randomInt } from "@/lib/random";
import type { NimDifficulty, NimRule, Pile } from "./types";

/** The exact move to reduce a pile to. */
export interface OptimalMove {
  pileIndex: number;
  newSize: number;
}

const MEDIUM_OPTIMAL_CHANCE = 0.65;

/**
 * The nim-sum is the bitwise XOR of every pile size. It is THE number that
 * determines who wins normal-play Nim with perfect play from both sides:
 *
 *   - nim-sum === 0  -> the player about to move is in a LOSING position
 *                       (whatever they do, the opponent can restore nim-sum
 *                       to 0 again next turn).
 *   - nim-sum !== 0  -> the player about to move can force a WIN by making
 *                       a move that brings the nim-sum back to 0.
 */
export function nimSum(piles: Pile[]): number {
  return piles.reduce((sum, pile) => sum ^ pile, 0);
}

/**
 * Normal-play optimal move for a winning position (nim-sum !== 0).
 *
 * Why this works: XOR-ing a pile's size with the *total* nim-sum tells you
 * what that pile's size would need to become for the total to hit zero. If
 * that target is smaller than the pile's current size, reducing the pile to
 * it is a legal move (you can only remove tokens, never add). At least one
 * pile always satisfies this whenever nim-sum !== 0, because the highest set
 * bit of the nim-sum must come from some pile that has that bit set — XOR-ing
 * it out can only shrink that pile.
 *
 * Returns null when the position is already losing (nim-sum === 0): no move
 * can zero the nim-sum in that case, by definition.
 */
export function findNormalOptimalMove(piles: Pile[]): OptimalMove | null {
  const total = nimSum(piles);
  if (total === 0) return null;

  for (let pileIndex = 0; pileIndex < piles.length; pileIndex++) {
    const target = piles[pileIndex] ^ total;
    if (target < piles[pileIndex]) {
      return { pileIndex, newSize: target };
    }
  }
  // Unreachable when total !== 0, but keeps the function total.
  return null;
}

/**
 * Is the player about to move winning under misère rules?
 *
 * Misère Nim (Bouton's extension) is identical to normal Nim EXCEPT once
 * every pile is down to size 0 or 1. At that point the game degenerates
 * into "take one whole pile per turn, whoever takes the last one loses" —
 * a pure parity game on the count of remaining size-1 piles:
 *
 *   - If that count is EVEN, the player to move wins (they can always
 *     leave an ODD count behind for the opponent, eventually forcing the
 *     opponent to take the last token).
 *   - If that count is ODD, the player to move loses.
 *
 * While at least one pile still has 2+ tokens, misère winning/losing
 * exactly matches normal play (nim-sum !== 0 means winning).
 */
export function isMisereWinningPosition(piles: Pile[]): boolean {
  const pilesWithTwoOrMore = piles.filter((pile) => pile > 1).length;
  if (pilesWithTwoOrMore === 0) {
    const onesCount = piles.filter((pile) => pile === 1).length;
    return onesCount % 2 === 0;
  }
  return nimSum(piles) !== 0;
}

/**
 * Misère-play optimal move. Follows the normal-play nim-sum strategy right
 * up until the move that would leave every pile at size 0 or 1 — the point
 * where the correct strategy flips (this is the trickiest part of Nim
 * theory, so it's split into its three cases below).
 */
export function findMisereOptimalMove(piles: Pile[]): OptimalMove | null {
  const pilesWithTwoOrMore = piles.filter((pile) => pile > 1).length;

  if (pilesWithTwoOrMore >= 2) {
    // Endgame (all piles <= 1) is still at least two moves away no matter
    // what we do this turn, so the normal-play strategy is exactly correct
    // here — the misère/normal difference only matters at the very end.
    return findNormalOptimalMove(piles);
  }

  if (pilesWithTwoOrMore === 1) {
    // This move decides the endgame parity: it's the last pile with 2+
    // tokens, so after this move every pile will be size 0 or 1. We must
    // leave an ODD number of size-1 piles for the opponent (see
    // isMisereWinningPosition) rather than zeroing the nim-sum outright.
    const bigPileIndex = piles.findIndex((pile) => pile > 1);
    const onesCount = piles.filter((pile) => pile === 1).length;
    // If the current ones-count is even, leaving the big pile at size 1
    // makes the total odd. If it's already odd, clearing the big pile to 0
    // keeps the total odd (it wasn't counted as a "one" before).
    const newSize = onesCount % 2 === 0 ? 1 : 0;
    return { pileIndex: bigPileIndex, newSize };
  }

  // Already in the all-ones endgame with no pile >= 2 left to steer with.
  // The only legal move is to clear one whole pile of size 1.
  if (!isMisereWinningPosition(piles)) return null; // already lost, nothing helps

  const anyOnesPileIndex = piles.findIndex((pile) => pile === 1);
  if (anyOnesPileIndex === -1) return null; // no legal move at all (shouldn't happen pre-game-over)
  return { pileIndex: anyOnesPileIndex, newSize: 0 };
}

/** Optimal move for whichever rule is active, or null if already losing. */
export function findOptimalMove(piles: Pile[], rule: NimRule): OptimalMove | null {
  return rule === "misere" ? findMisereOptimalMove(piles) : findNormalOptimalMove(piles);
}

function randomMove(piles: Pile[]): OptimalMove {
  const nonEmptyPileIndexes = piles
    .map((pile, index) => index)
    .filter((index) => piles[index] > 0);
  const pileIndex = nonEmptyPileIndexes[randomInt(0, nonEmptyPileIndexes.length - 1)];
  const newSize = randomInt(0, piles[pileIndex] - 1); // always removes >= 1 token
  return { pileIndex, newSize };
}

/**
 * Pick the AI's move for the given difficulty.
 *  - easy: fully random, no awareness of nim-sum.
 *  - medium: optimal most of the time, random otherwise (beatable).
 *  - hard: always optimal when a winning move exists; any legal move
 *          otherwise, since a truly lost position cannot be saved.
 */
export function aiPickMove(
  piles: Pile[],
  rule: NimRule,
  difficulty: NimDifficulty,
): OptimalMove {
  if (difficulty === "easy") return randomMove(piles);

  const optimal = findOptimalMove(piles, rule);

  if (difficulty === "medium") {
    if (optimal && Math.random() < MEDIUM_OPTIMAL_CHANCE) return optimal;
    return randomMove(piles);
  }

  return optimal ?? randomMove(piles);
}
