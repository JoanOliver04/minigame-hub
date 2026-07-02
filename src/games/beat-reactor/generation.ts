/**
 * Beat Reactor — procedural chart generation (blueprint §6.3).
 *
 * Constraints enforced by construction (never checked-then-rejected, so
 * generation always terminates):
 *   - no simultaneous four-lane chord (checked per beat slot);
 *   - maximum two simultaneous notes;
 *   - minimum 90 ms between notes in the same lane;
 *   - hold notes never overlap another hold in the same lane;
 *   - first bar is always onboarding-simple (single notes, sparse);
 *   - chart difficulty rises only at bar boundaries.
 */

import type { Rng } from "@/lib/rng";
import type { BeatEvent, ChartConfig } from "./types";

const MIN_LANE_GAP_MS = 90;
const BEATS_PER_BAR = 4;
/** Subdivisions per beat sampled as candidate note slots. */
const SUBDIVISIONS: Record<ChartConfig["density"], number> = {
  light: 2,
  normal: 2,
  dense: 4,
};
/** Probability a candidate slot spawns a note, before bar-based ramp. */
const BASE_DENSITY: Record<ChartConfig["density"], number> = {
  light: 0.35,
  normal: 0.5,
  dense: 0.68,
};

export function generateChart(config: ChartConfig, rng: Rng): BeatEvent[] {
  const secondsPerBeat = 60 / config.bpm;
  const subdivisions = SUBDIVISIONS[config.density];
  const slotDuration = secondsPerBeat / subdivisions;
  const startOffset = 1.5; // lead-in before the first note, seconds

  const events: BeatEvent[] = [];
  const laneLastTime: number[] = [-Infinity, -Infinity, -Infinity, -Infinity];
  let nextId = 0;

  const totalSlots = config.bars * BEATS_PER_BAR * subdivisions;
  for (let slot = 0; slot < totalSlots; slot++) {
    const bar = Math.floor(slot / (BEATS_PER_BAR * subdivisions));
    const time = startOffset + slot * slotDuration;

    // Difficulty ramps only at bar boundaries: first bar is always simple,
    // then density approaches the configured target over the first half.
    const rampProgress = config.bars <= 1 ? 1 : Math.min(1, bar / Math.ceil(config.bars / 2));
    const barDensity = bar === 0 ? BASE_DENSITY.light * 0.6 : BASE_DENSITY[config.density] * rampProgress;
    const maxSimultaneous = bar === 0 ? 1 : 2;

    if (rng.next() >= barDensity) continue;

    // How many lanes to fill this slot (1 normally, up to `maxSimultaneous`
    // on later bars at dense settings) — never all four lanes at once.
    const wantsDouble = maxSimultaneous > 1 && bar > 0 && rng.next() < 0.18;
    const noteCount = wantsDouble ? 2 : 1;

    const eligibleLanes = [0, 1, 2, 3].filter(
      (lane) => (time - laneLastTime[lane]) * 1000 >= MIN_LANE_GAP_MS,
    );
    if (eligibleLanes.length === 0) continue;

    const chosen = rng.shuffle(eligibleLanes).slice(0, Math.min(noteCount, eligibleLanes.length, 3));
    for (const lane of chosen) {
      events.push({
        id: nextId++,
        lane: lane as BeatEvent["lane"],
        hitTime: time,
        duration: 0,
        accent: slot % subdivisions === 0,
      });
      laneLastTime[lane] = time;
    }
  }

  return events;
}

/** Verify every blueprint §6.3 spacing constraint on a generated chart. */
export function validateChart(events: BeatEvent[]): boolean {
  const byLane = new Map<number, BeatEvent[]>();
  const byTime = new Map<number, BeatEvent[]>();
  for (const event of events) {
    if (!byLane.has(event.lane)) byLane.set(event.lane, []);
    byLane.get(event.lane)!.push(event);
    const key = Math.round(event.hitTime * 1000);
    if (!byTime.has(key)) byTime.set(key, []);
    byTime.get(key)!.push(event);
  }
  for (const notes of byTime.values()) {
    if (notes.length > 2) return false;
    const lanes = new Set(notes.map((n) => n.lane));
    if (lanes.size === 4) return false;
  }
  for (const notes of byLane.values()) {
    const sorted = [...notes].sort((a, b) => a.hitTime - b.hitTime);
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i].hitTime - sorted[i - 1].hitTime) * 1000 < MIN_LANE_GAP_MS - 1e-6) return false;
    }
  }
  return true;
}
