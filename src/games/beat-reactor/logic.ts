/**
 * Beat Reactor — pure judgement + scoring rules (blueprint §6.4).
 * No AudioContext, no DOM — callers pass in the audio-clock timestamp.
 */

import type { BeatEvent, Judgement } from "./types";
import { JUDGEMENT_SCORE, JUDGEMENT_WINDOWS_MS } from "./types";

export function judge(errorMs: number): Judgement {
  const abs = Math.abs(errorMs);
  if (abs <= JUDGEMENT_WINDOWS_MS.perfect) return "perfect";
  if (abs <= JUDGEMENT_WINDOWS_MS.great) return "great";
  if (abs <= JUDGEMENT_WINDOWS_MS.good) return "good";
  return "miss";
}

export function comboMultiplier(combo: number): number {
  if (combo >= 50) return 1.3;
  if (combo >= 25) return 1.2;
  if (combo >= 10) return 1.1;
  return 1.0;
}

/** Score for one judged hit, combo multiplier applied AFTER the base score. */
export function hitScore(judgement: Judgement, comboBeforeThisHit: number): number {
  return Math.round(JUDGEMENT_SCORE[judgement] * comboMultiplier(comboBeforeThisHit));
}

/** The nearest not-yet-resolved event in `lane` to `atTime`, if within the miss window. */
export function findTarget(
  events: BeatEvent[],
  resolved: Set<number>,
  lane: number,
  atTime: number,
): BeatEvent | null {
  let best: BeatEvent | null = null;
  let bestDist = Infinity;
  for (const event of events) {
    if (event.lane !== lane || resolved.has(event.id)) continue;
    const dist = Math.abs(event.hitTime - atTime);
    if (dist < bestDist) {
      bestDist = dist;
      best = event;
    }
  }
  if (best && bestDist * 1000 <= JUDGEMENT_WINDOWS_MS.good) return best;
  return null;
}

/** Events whose hit window has fully passed without a player press → miss. */
export function collectAutoMisses(
  events: BeatEvent[],
  resolved: Set<number>,
  atTime: number,
): BeatEvent[] {
  return events.filter(
    (event) => !resolved.has(event.id) && atTime - event.hitTime > JUDGEMENT_WINDOWS_MS.good / 1000,
  );
}
