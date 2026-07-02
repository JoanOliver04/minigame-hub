/**
 * Nim — pure type definitions. No React, no DOM, no side effects.
 * The player always moves first and is never allowed to tie: exactly one
 * side takes the very last token, so every finished round has a winner.
 */

export type Pile = number;
export type NimTurn = "player" | "ai";
/** Normal: last token taken wins. Misère: last token taken loses. */
export type NimRule = "normal" | "misere";
export type NimDifficulty = "easy" | "medium" | "hard";

/** Minimal snapshot of one in-progress round, as described by the spec. */
export interface GameState {
  piles: Pile[];
  currentTurn: NimTurn;
  rule: NimRule;
}

/** One legal action: take `tokensRemoved` tokens from `pileIndex`. */
export interface Move {
  pileIndex: number;
  tokensRemoved: number;
}

/** A move already committed to the board, kept for the on-screen log. */
export interface NimLogEntry extends Move {
  id: number;
  by: NimTurn;
  pileBefore: number;
  pileAfter: number;
}

/** Setup-screen choices, fixed for the whole match once it starts. */
export interface NimConfig {
  difficulty: NimDifficulty;
  rule: NimRule;
  randomizePiles: boolean;
  /** Round wins needed to take the match. */
  target: number;
}

/** Match (best-of-N rounds) bookkeeping — mirrors the ttt/connect-four shape. */
export interface NimMatchState {
  config: NimConfig;
  youScore: number;
  aiScore: number;
  rounds: number;
  totalMoves: number;
  finished: boolean;
}

/** How (and whether) a round ended. */
export interface NimRoundOutcome {
  winner: NimTurn;
  finalMove: NimLogEntry;
}
