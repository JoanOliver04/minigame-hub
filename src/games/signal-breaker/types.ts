/**
 * Signal Breaker — shared types (blueprint §11).
 * Asymmetric Mastermind duel: both sides race to crack a 4-symbol code.
 */

export const CODE_LENGTH = 4;
export const SYMBOL_COUNT = 6;
export const MAX_GUESSES = 8;

export type SignalDifficulty = "easy" | "medium" | "hard";

/** A code / guess is an array of symbol indices 0..SYMBOL_COUNT-1. */
export type Code = number[];

export interface Feedback {
  /** Correct symbol in the correct position. */
  exact: number;
  /** Correct symbol in the wrong position. */
  partial: number;
}

export interface GuessRow {
  guess: Code;
  feedback: Feedback;
}

export type SolveState = "solving" | "solved" | "failed";

export interface SideState {
  /** The secret this side's OPPONENT must crack. */
  secret: Code;
  guesses: GuessRow[];
  state: SolveState;
  /** Guess count when solved (for tie-breaking). */
  solvedAtGuess: number | null;
  /** Cumulative "thinking" time in ms, for the sub-100ms tie rule. */
  solveTimeMs: number;
}
