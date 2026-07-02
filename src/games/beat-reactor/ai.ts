/**
 * Beat Reactor — AI opponent (blueprint §6.5).
 *
 * Every AI hit error is precomputed for the whole chart BEFORE the song
 * starts and never changes afterward, so the AI cannot react to the
 * player's judgements mid-song (honest-information contract). Errors are
 * clamped to a plausible human range.
 */

import type { Rng } from "@/lib/rng";
import type { AiHit, BeatEvent, ReactorDifficulty } from "./types";
import { JUDGEMENT_WINDOWS_MS } from "./types";

interface AiProfile {
  meanMs: number;
  stdDevMs: number;
  missChance: number;
}

const PROFILES: Record<ReactorDifficulty, AiProfile> = {
  easy: { meanMs: 48, stdDevMs: 55, missChance: 0.12 },
  medium: { meanMs: 20, stdDevMs: 32, missChance: 0.05 },
  hard: { meanMs: 4, stdDevMs: 18, missChance: 0.015 },
};

function gaussian(rng: Rng): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rng.next();
  return (sum - 3) * 1.414;
}

const MAX_PLAUSIBLE_MS = JUDGEMENT_WINDOWS_MS.good * 1.4;

export function precomputeAiHits(
  events: BeatEvent[],
  difficulty: ReactorDifficulty,
  rng: Rng,
): AiHit[] {
  const profile = PROFILES[difficulty];
  return events.map((event) => {
    if (rng.next() < profile.missChance) {
      return { eventId: event.id, timingErrorMs: null };
    }
    const sign = rng.next() < 0.5 ? -1 : 1;
    const raw = profile.meanMs + gaussian(rng) * profile.stdDevMs;
    const magnitude = Math.max(0, Math.min(MAX_PLAUSIBLE_MS, raw));
    return { eventId: event.id, timingErrorMs: sign * magnitude };
  });
}
