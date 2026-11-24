import type { CarState } from "./types";

type Sample = [seconds: number, x: number, y: number, heading: number];
export type Pose = Pick<CarState, "position" | "heading">;
export interface GhostLap {
  time: number;
  samples: Sample[];
}

const MAX_SAMPLES = 1200;
export const trialKey = (trackId: string) => "miniHubDriftTrial_v1:" + trackId;

function sample(seconds: number, car: Pose): Sample {
  return [seconds, Math.round(car.position.x * 10) / 10, Math.round(car.position.y * 10) / 10,
    Math.round(car.heading * 1000) / 1000];
}

/** Keep the entire lap, including long first attempts, within a bounded local record. */
export function recordLap(start: Pose) {
  let samples: Sample[] = [sample(0, start)];
  let interval = 0.1;
  return {
    observe(seconds: number, car: Pose) {
      if (seconds - samples[samples.length - 1][0] + 1e-9 < interval) return;
      if (samples.length >= MAX_SAMPLES) {
        samples = samples.filter((_, i) => i % 2 === 0);
        interval *= 2;
      }
      samples.push(sample(seconds, car));
    },
    finish(time: number, car: Pose): GhostLap {
      const end = sample(time, car);
      const last = samples[samples.length - 1];
      return { time, samples: last[0] < time ? [...samples, end] : [...samples.slice(0, -1), end] };
    },
  };
}

export function readGhost(raw: string | null): GhostLap | null {
  if (!raw) return null;
  try {
    const lap: GhostLap = JSON.parse(raw);
    if (!lap || !Number.isFinite(lap.time) || lap.time <= 0 || !Array.isArray(lap.samples) ||
      lap.samples.length < 2 || lap.samples.length > MAX_SAMPLES + 1) return null;
    let previous = -1;
    for (const point of lap.samples) {
      if (!Array.isArray(point) || point.length !== 4 || !point.every(Number.isFinite) || point[0] <= previous) return null;
      previous = point[0];
    }
    return lap.samples[0][0] === 0 && previous === lap.time ? lap : null;
  } catch {
    return null;
  }
}

export function fasterGhost(raw: string | null, lap: GhostLap): string {
  const best = readGhost(raw);
  return raw && best && best.time <= lap.time ? raw : JSON.stringify(lap);
}

/** Interpolate by simulation time so the ghost follows the same line on any display. */
export function ghostAt(lap: GhostLap, seconds: number): Pose {
  const time = Math.min(lap.time, Math.max(0, seconds));
  let low = 0;
  let high = lap.samples.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (lap.samples[mid][0] <= time) low = mid;
    else high = mid;
  }
  const a = lap.samples[low];
  const b = lap.samples[high];
  const fraction = (time - a[0]) / (b[0] - a[0]);
  return {
    position: { x: a[1] + (b[1] - a[1]) * fraction, y: a[2] + (b[2] - a[2]) * fraction },
    heading: a[3] + (b[3] - a[3]) * fraction,
  };
}
