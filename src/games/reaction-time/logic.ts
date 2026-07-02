/** Reaction Time — round timing, winner resolution and match bookkeeping. */

import { randomInt } from "@/lib/random";
import type { ReactionConfig, ReactionMatchState, RoundResult } from "./types";

export const MIN_SIGNAL_DELAY_MS = 1500;
export const MAX_SIGNAL_DELAY_MS = 5000;
/** Neutral grace beat before the round arms, so a leftover click/tap from
 *  the previous round's UI can never be misread as this round's false start. */
export const GET_READY_MS = 700;

/** Unpredictable per spec: 1.5–5s so neither side can reliably anticipate it. */
export function randomSignalDelay(): number {
  return randomInt(MIN_SIGNAL_DELAY_MS, MAX_SIGNAL_DELAY_MS);
}

/**
 * Thin wrapper around the high-resolution timer, kept in its own plain
 * function (outside the hook) so reaction times stay accurate to the
 * millisecond — `Date.now()` is coarser and can drift under load.
 */
export function preciseNow(): number {
  return performance.now();
}

/**
 * Decide the round winner. A false start is an automatic loss for that side
 * regardless of the other side's timing — the standard fairness rule for
 * reaction games. If both sides somehow end up flagged as false-starting
 * (not reachable through the normal single-event AI simulation, but kept
 * for completeness) or both react in the exact same millisecond, it's a
 * push rather than picking an arbitrary "winner".
 */
export function decideRoundWinner(
  playerFalseStart: boolean,
  aiFalseStart: boolean,
  playerTimeMs: number | null,
  aiTimeMs: number,
): "player" | "ai" | "tie" {
  if (playerFalseStart && aiFalseStart) return "tie";
  if (playerFalseStart) return "ai";
  if (aiFalseStart) return "player";
  if (playerTimeMs === null) return "ai"; // AI reacted before the player ever did
  if (playerTimeMs === aiTimeMs) return "tie";
  return playerTimeMs < aiTimeMs ? "player" : "ai";
}

export function createReactionMatch(config: ReactionConfig): ReactionMatchState {
  return {
    config,
    youScore: 0,
    aiScore: 0,
    ties: 0,
    rounds: 0,
    playerTimes: [],
    aiTimes: [],
    finished: false,
  };
}

/** Fold one finished round into the match tally and the running time lists. */
export function applyReactionRoundOutcome(
  match: ReactionMatchState,
  outcome: RoundResult,
): ReactionMatchState {
  const youScore = match.youScore + (outcome.winner === "player" ? 1 : 0);
  const aiScore = match.aiScore + (outcome.winner === "ai" ? 1 : 0);
  const ties = match.ties + (outcome.winner === "tie" ? 1 : 0);

  const playerTimes =
    outcome.playerFalseStart || outcome.playerTimeMs === null
      ? match.playerTimes
      : [...match.playerTimes, outcome.playerTimeMs];
  const aiTimes = outcome.aiFalseStart ? match.aiTimes : [...match.aiTimes, outcome.aiTimeMs];

  return {
    ...match,
    youScore,
    aiScore,
    ties,
    rounds: match.rounds + 1,
    playerTimes,
    aiTimes,
    finished: youScore >= match.config.target || aiScore >= match.config.target,
  };
}

/** Rounded mean of a list of reaction times, or null if there's no data yet. */
export function averageMs(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
