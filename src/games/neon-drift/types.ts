/**
 * Neon Drift — shared types (blueprint §5).
 * Top-down time-trial racing with fixed-step deterministic physics.
 */

export type DriftDifficulty = "easy" | "medium" | "hard";

export interface Vec2 {
  x: number;
  y: number;
}

export interface CarState {
  position: Vec2;
  velocity: Vec2;
  heading: number; // radians
  angularVelocity: number;
  boost: number; // 0..100
  lap: number;
  checkpoint: number; // next checkpoint index to cross
  finished: boolean;
  finishTime: number | null; // seconds
  offTrackTime: number; // accumulated seconds off track
  bestLap: number | null;
  lastLapStart: number;
}

export interface RacingNode {
  position: Vec2;
  targetSpeed: number;
  curvature: number;
}

/** Player control input sampled each fixed tick. */
export interface ControlInput {
  steer: number; // -1 (left) .. 1 (right)
  throttle: number; // 0..1
  brake: number; // 0..1
  boost: boolean;
}

export const FIXED_DT = 1 / 120;
export const MAX_FRAME_DELTA = 0.1;
export const TOTAL_LAPS = 3;
export const CHECKPOINTS_PER_LAP = 6;

export const BOOST_MAX = 100;
export const BOOST_DRAIN_PER_S = 28;
export const BOOST_REGEN_PER_S = 8;

export function vec(x: number, y: number): Vec2 {
  return { x, y };
}

export function vlen(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}
