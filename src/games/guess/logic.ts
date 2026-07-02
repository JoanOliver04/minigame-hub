/**
 * Number Duel — pure game rules. No React, no DOM, no side effects,
 * so every function here is trivially unit-testable.
 */

import { randomInt } from "@/lib/random";

export type Difficulty = "easy" | "medium" | "hard";
export type Verdict = "high" | "low" | "correct";
export type Actor = "player" | "ai";

export interface GuessConfig {
  min: number;
  max: number;
  difficulty: Difficulty;
}

export interface LogEntry {
  id: number;
  who: Actor;
  guess: number;
  verdict: Verdict;
}

export interface RoundState {
  config: GuessConfig;
  secret: number;
  turn: Actor;
  playing: boolean;
  winner: Actor | null;
  playerGuesses: number;
  aiGuesses: number;
  /** Public knowledge interval (all feedback combined) — drives the range bar. */
  knownLow: number;
  knownHigh: number;
  aiGuessed: number[];
  /** Newest first. */
  log: LogEntry[];
  feedback: { who: Actor; guess: number; verdict: Verdict } | null;
}

export function createRound(config: GuessConfig): RoundState {
  return {
    config,
    secret: randomInt(config.min, config.max),
    turn: "player",
    playing: true,
    winner: null,
    playerGuesses: 0,
    aiGuesses: 0,
    knownLow: config.min,
    knownHigh: config.max,
    aiGuessed: [],
    log: [],
    feedback: null,
  };
}

/** Compare a guess against the secret. */
export function judge(state: RoundState, guess: number): Verdict {
  if (guess > state.secret) return "high";
  if (guess < state.secret) return "low";
  return "correct";
}

/**
 * Apply one guess (player or AI) and return the next immutable state:
 * narrows public knowledge, updates the AI's private model on its own
 * guesses, logs the move, and either crowns a winner or passes the turn.
 */
export function applyGuess(state: RoundState, who: Actor, guess: number): RoundState {
  const verdict = judge(state, guess);

  const next: RoundState = {
    ...state,
    knownHigh: verdict === "high" ? Math.min(state.knownHigh, guess - 1) : state.knownHigh,
    knownLow: verdict === "low" ? Math.max(state.knownLow, guess + 1) : state.knownLow,
    playerGuesses: state.playerGuesses + (who === "player" ? 1 : 0),
    aiGuesses: state.aiGuesses + (who === "ai" ? 1 : 0),
    log: [{ id: state.log.length + 1, who, guess, verdict }, ...state.log],
    feedback: { who, guess, verdict },
  };

  if (who === "ai") {
    next.aiGuessed = [...state.aiGuessed, guess];
  }

  if (verdict === "correct") {
    next.playing = false;
    next.winner = who;
  } else {
    next.turn = who === "player" ? "ai" : "player";
  }
  return next;
}
