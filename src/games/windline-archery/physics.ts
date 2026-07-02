/**
 * Windline Archery — deterministic trajectory (blueprint §9.2).
 *
 * The impact is computed once per arrow from initial velocity (draw power),
 * gravity, lateral/vertical wind acceleration and release error — no
 * per-frame collision simulation. The animation merely samples the same
 * closed-form path.
 */

import type { ArrowInput, Impact, Wind } from "./types";

const GRAVITY = 9.81;
const DISTANCE_M = 50;
/** Normalized target radius 1.0 corresponds to this many metres. */
const TARGET_RADIUS_M = 2.4;
/** Lateral metres at full release error. */
const RELEASE_ERROR_M = 1.6;

function launchSpeed(power: number): number {
  return 18 + power * 0.35; // 18–53 m/s
}

/** Time of flight to the target plane (clamped so degenerate shots resolve). */
export function flightTime(input: ArrowInput): number {
  const v = launchSpeed(input.power);
  const vx = v * Math.cos((input.angleDeg * Math.PI) / 180);
  return DISTANCE_M / Math.max(vx, 5);
}

export function computeImpact(input: ArrowInput, wind: Wind): Impact {
  const v = launchSpeed(input.power);
  const rad = (input.angleDeg * Math.PI) / 180;
  const t = flightTime(input);
  const heightAtTarget = v * Math.sin(rad) * t - 0.5 * GRAVITY * t * t + 0.5 * wind.vertical * t * t;
  const windageM = Math.tan((input.windageDeg * Math.PI) / 180) * DISTANCE_M;
  const lateralAtTarget =
    windageM + 0.5 * wind.horizontal * t * t + input.releaseError * RELEASE_ERROR_M;
  return {
    x: lateralAtTarget / TARGET_RADIUS_M,
    y: heightAtTarget / TARGET_RADIUS_M,
  };
}

/** Points along the flight for the animation (normalized target coords + progress). */
export function sampleTrajectory(
  input: ArrowInput,
  wind: Wind,
  samples: number,
): { progress: number; x: number; y: number }[] {
  const v = launchSpeed(input.power);
  const rad = (input.angleDeg * Math.PI) / 180;
  const total = flightTime(input);
  const out: { progress: number; x: number; y: number }[] = [];
  const windageM = Math.tan((input.windageDeg * Math.PI) / 180) * DISTANCE_M;
  for (let i = 0; i <= samples; i++) {
    const t = (total * i) / samples;
    const y = v * Math.sin(rad) * t - 0.5 * GRAVITY * t * t + 0.5 * wind.vertical * t * t;
    const x =
      windageM * (i / samples) +
      0.5 * wind.horizontal * t * t +
      input.releaseError * RELEASE_ERROR_M * (i / samples);
    out.push({ progress: i / samples, x: x / TARGET_RADIUS_M, y: y / TARGET_RADIUS_M });
  }
  return out;
}
