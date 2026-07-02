/**
 * Reaction Time — AI reflex simulation.
 *
 * There's no strategy to compute here (unlike the other AI opponents in
 * this app): the "AI" is just a randomized human-plausible reflex, tuned
 * per difficulty. Isolated in its own file since these ranges are the
 * entire "feel" of the game and are the first thing worth tweaking.
 */

import { randomInt } from "@/lib/random";
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
export function simulateAiReaction(difficulty: ReactionDifficulty): AiReactionRoll {
  const profile = PROFILES[difficulty];
  return {
    falseStart: Math.random() < profile.falseStartChance,
    reactionMs: randomInt(profile.minMs, profile.maxMs),
  };
}
