/**
 * Reaction Time — pure type definitions. No React, no DOM, no side effects.
 * The player always acts first (there's no dealing order to speak of — both
 * sides just wait for the same signal), and either side can false-start.
 */

export type ReactionDifficulty = "easy" | "medium" | "hard";

/**
 * "waiting"  — brief neutral grace beat right as the round begins (no
 *              penalty for clicking here; just gives the player a moment
 *              to focus before the test actually arms).
 * "ready"    — armed and counting down to the signal; clicking now is a
 *              false start.
 * "go"       — the signal is showing; react now.
 * "resolved" — the round is over and its result is on screen.
 */
export type RoundStage = "waiting" | "ready" | "go" | "resolved";

export interface RoundResult {
  playerTimeMs: number | null;
  aiTimeMs: number;
  playerFalseStart: boolean;
  aiFalseStart: boolean;
  winner: "player" | "ai" | "tie";
}

export interface ReactionConfig {
  difficulty: ReactionDifficulty;
  /** Round wins needed to take the match. */
  target: number;
}

/** Match (best-of-N rounds) bookkeeping — mirrors the ttt/rps shape. */
export interface ReactionMatchState {
  config: ReactionConfig;
  youScore: number;
  aiScore: number;
  ties: number;
  rounds: number;
  /** Valid (non-false-start) reaction times only, for the end-of-match average. */
  playerTimes: number[];
  aiTimes: number[];
  finished: boolean;
}

export interface ReactionHistoryEntry {
  id: number;
  round: number;
  playerTimeMs: number | null;
  aiTimeMs: number;
  playerFalseStart: boolean;
  aiFalseStart: boolean;
  winner: "player" | "ai" | "tie";
}
