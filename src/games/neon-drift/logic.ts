/**
 * Neon Drift — race result rules (blueprint §5.7).
 * Win/loss by finish time; tie when rounded finish times are within 10 ms.
 */

import type { CarState } from "./types";

export type RaceOutcome = "player" | "ai" | "tie";

export function raceResult(player: CarState, ai: CarState): RaceOutcome | null {
  if (!player.finished || !ai.finished) return null;
  const pt = player.finishTime ?? Infinity;
  const at = ai.finishTime ?? Infinity;
  if (Math.abs(pt - at) <= 0.01) return "tie";
  return pt < at ? "player" : "ai";
}

export function formatTime(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

/** Boost efficiency: fraction of race spent NOT wasting boost off the line. */
export function boostEfficiency(car: CarState, raceTime: number): number {
  if (raceTime <= 0) return 0;
  const cleanTime = Math.max(0, raceTime - car.offTrackTime);
  return Math.round((cleanTime / raceTime) * 100);
}
