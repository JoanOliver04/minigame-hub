/**
 * Reaction Time — AI reflex simulation.
 *
 * There's no strategy to compute here (unlike the other AI opponents in
 * this app): the "AI" is just a randomized human-plausible reflex, tuned
 * per difficulty. Isolated in its own file since these ranges are the
 * entire "feel" of the game and are the first thing worth tweaking.
 */

import { MAX_SIGNAL_DELAY_MS, MIN_SIGNAL_DELAY_MS } from "./logic";
import type { ReactionDifficulty } from "./types";

export interface AiReactionRoll {
  /** True if the AI jumps the gun before the signal even appears. */
  falseStart: boolean;
  /** Simulated reaction time in ms after the signal (moot if falseStart). */
  reactionMs: number;
}

interface DifficultyProfile {
  minMs: number;
  maxMs: number;
  falseStartChance: number;
}

const PROFILES: Record<ReactionDifficulty, DifficultyProfile> = {
  // Slow, wide range and a real chance of jumping the gun — clearly beatable.
  easy: { minMs: 400, maxMs: 700, falseStartChance: 0.13 },
  // Solid, human-plausible average reflex.
  medium: { minMs: 250, maxMs: 400, falseStartChance: 0.05 },
  // Near the floor of realistic human reaction time — tough to beat.
  hard: { minMs: 150, maxMs: 220, falseStartChance: 0.015 },
};

/**
 * Roll the AI's entire round in one shot: a chance of a false start, and
 * otherwise a reaction time drawn from the difficulty-tuned range. Called
 * once when a round arms; the caller decides how to schedule the resulting
 * event (before or after the real signal) based on `falseStart`.
 */
export function simulateAiReaction(
  difficulty: ReactionDifficulty,
  signalDelayMs = (MIN_SIGNAL_DELAY_MS + MAX_SIGNAL_DELAY_MS) / 2,
  random = Math.random,
): AiReactionRoll {
  const profile = PROFILES[difficulty];
  const anticipation = Math.min(1, Math.max(0,
    (signalDelayMs - MIN_SIGNAL_DELAY_MS) / (MAX_SIGNAL_DELAY_MS - MIN_SIGNAL_DELAY_MS),
  ));
  // The longer it waits, the more ready the opponent is to react or jump early.
  const falseStart = random() < profile.falseStartChance * (0.65 + anticipation * 0.7);
  const reflex = (random() + random()) / 2;
  const timing = reflex * 0.82 + (1 - anticipation) * 0.18;
  return {
    falseStart,
    reactionMs: Math.round(profile.minMs + (profile.maxMs - profile.minMs) * timing),
  };
}
