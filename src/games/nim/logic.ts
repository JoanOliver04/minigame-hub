/** Nim — pile setup, move validation and match bookkeeping. */

import { randomInt } from "@/lib/random";
import type {
  NimConfig,
  NimMatchState,
  NimRule,
  NimTurn,
  Pile,
} from "./types";

export const PLAYER: NimTurn = "player";
export const AI: NimTurn = "ai";

/** Default starting layout when "randomize starting piles" is off. */
const DEFAULT_PILES: Pile[] = [3, 5, 7, 9];

const RANDOM_PILE_COUNT_MIN = 3;
const RANDOM_PILE_COUNT_MAX = 4;
const RANDOM_PILE_SIZE_MIN = 2;
const RANDOM_PILE_SIZE_MAX = 9;

/** Fresh piles for a round: the fixed default, or a lightly randomized set. */
export function createPiles(randomize: boolean): Pile[] {
  if (!randomize) return [...DEFAULT_PILES];
  const pileCount = randomInt(RANDOM_PILE_COUNT_MIN, RANDOM_PILE_COUNT_MAX);
  return Array.from({ length: pileCount }, () =>
    randomInt(RANDOM_PILE_SIZE_MIN, RANDOM_PILE_SIZE_MAX),
  );
}

export function isGameOver(piles: Pile[]): boolean {
  return piles.every((pile) => pile === 0);
}

/** Remove `tokensRemoved` tokens from `pileIndex`, returning a new array. */
export function applyPileMove(
  piles: Pile[],
  pileIndex: number,
  tokensRemoved: number,
): Pile[] {
  const next = [...piles];
  next[pileIndex] = next[pileIndex] - tokensRemoved;
  return next;
}

/** Must remove at least 1 token, at most the whole pile, from a real pile. */
export function isValidMove(
  piles: Pile[],
  pileIndex: number,
  tokensRemoved: number,
): boolean {
  if (pileIndex < 0 || pileIndex >= piles.length) return false;
  if (!Number.isInteger(tokensRemoved) || tokensRemoved < 1) return false;
  if (tokensRemoved > piles[pileIndex]) return false;
  return true;
}

/**
 * Whoever empties the last pile wins in normal play, but loses in misère
 * play — this single line is the entire rules difference between the two
 * variants; everything else about legal moves is identical.
 */
export function winnerOfFinishingMove(rule: NimRule, mover: NimTurn): NimTurn {
  if (rule === "normal") return mover;
  return mover === PLAYER ? AI : PLAYER;
}

export function createNimMatch(config: NimConfig): NimMatchState {
  return {
    config,
    youScore: 0,
    aiScore: 0,
    rounds: 0,
    totalMoves: 0,
    finished: false,
  };
}

/** Fold one finished round into the match tally (no ties possible in Nim). */
export function applyNimRoundOutcome(
  match: NimMatchState,
  winner: NimTurn,
): NimMatchState {
  const youScore = match.youScore + (winner === PLAYER ? 1 : 0);
  const aiScore = match.aiScore + (winner === AI ? 1 : 0);
  return {
    ...match,
    youScore,
    aiScore,
    rounds: match.rounds + 1,
    finished: youScore >= match.config.target || aiScore >= match.config.target,
  };
}
