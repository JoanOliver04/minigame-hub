/**
 * Neon Drift — fixed-step deterministic simulation (blueprint §5.2/5.4).
 *
 * Physics advances in FIXED_DT increments independent of display refresh:
 * the render loop accumulates real elapsed time and steps the sim a whole
 * number of fixed ticks, so identical inputs produce identical checkpoint
 * times at 60 Hz and 144 Hz. Nothing here reads the wall clock or rAF
 * delta directly (the hook feeds it accumulated time, clamped to
 * MAX_FRAME_DELTA so a backgrounded tab cannot teleport a car).
 */

import { distanceToTrack, type TrackDef } from "./tracks";
import type { CarState, ControlInput, Vec2 } from "./types";
import {
  BOOST_DRAIN_PER_S,
  BOOST_MAX,
  BOOST_REGEN_PER_S,
  CHECKPOINTS_PER_LAP,
  FIXED_DT,
  TOTAL_LAPS,
} from "./types";

const ENGINE_FORCE = 520;
const BOOST_FORCE = 340;
const BRAKE_FORCE = 620;
const DRAG = 0.9;
const OFF_TRACK_DRAG = 2.6;
const LATERAL_GRIP = 7.5;
const OFF_TRACK_GRIP = 3.2;
const STEER_RATE = 3.1;
const ANGULAR_DAMP = 8.5;
const CHECKPOINT_RADIUS = 90;

export function initialCar(track: TrackDef): CarState {
  const start = track.centerline[0];
  return {
    position: { x: start.x, y: start.y },
    velocity: { x: 0, y: 0 },
    heading: track.startHeading,
    angularVelocity: 0,
    boost: BOOST_MAX,
    lap: 0,
    checkpoint: 1 % CHECKPOINTS_PER_LAP,
    finished: false,
    finishTime: null,
    offTrackTime: 0,
    bestLap: null,
    lastLapStart: 0,
  };
}

function forward(heading: number): Vec2 {
  return { x: Math.cos(heading), y: Math.sin(heading) };
}

/**
 * One fixed physics tick for a single car. `elapsed` is the total race
 * time at the START of this tick (used to stamp lap/finish times). Returns
 * the next state; never mutates the input.
 */
export function stepCar(
  prev: CarState,
  input: ControlInput,
  track: TrackDef,
  elapsed: number,
): CarState {
  if (prev.finished) return prev;

  const car: CarState = {
    ...prev,
    position: { ...prev.position },
    velocity: { ...prev.velocity },
  };

  const onTrack = distanceToTrack(track, car.position) <= track.halfWidth;

  // --- steering: angular velocity scaled by current speed ---
  const speed = Math.hypot(car.velocity.x, car.velocity.y);
  const steerAuthority = Math.min(1, speed / 120);
  car.angularVelocity += input.steer * STEER_RATE * steerAuthority * FIXED_DT * 60;
  car.angularVelocity -= car.angularVelocity * ANGULAR_DAMP * FIXED_DT;
  car.heading += car.angularVelocity * FIXED_DT;

  const fwd = forward(car.heading);

  // --- longitudinal forces ---
  let accel = input.throttle * ENGINE_FORCE;
  const canBoost = input.boost && car.boost > 0;
  if (canBoost) {
    accel += BOOST_FORCE;
    car.boost = Math.max(0, car.boost - BOOST_DRAIN_PER_S * FIXED_DT);
  } else {
    car.boost = Math.min(BOOST_MAX, car.boost + BOOST_REGEN_PER_S * FIXED_DT);
  }
  const gripFactor = onTrack ? 1 : 0.55; // off-track cuts acceleration
  car.velocity.x += fwd.x * accel * gripFactor * FIXED_DT;
  car.velocity.y += fwd.y * accel * gripFactor * FIXED_DT;

  // braking opposes current velocity
  if (input.brake > 0 && speed > 1) {
    const b = (input.brake * BRAKE_FORCE * FIXED_DT) / speed;
    car.velocity.x -= car.velocity.x * Math.min(1, b);
    car.velocity.y -= car.velocity.y * Math.min(1, b);
  }

  // --- lateral grip: kill sideways velocity component ---
  const lateral = { x: -fwd.y, y: fwd.x };
  const lateralSpeed = car.velocity.x * lateral.x + car.velocity.y * lateral.y;
  const grip = onTrack ? LATERAL_GRIP : OFF_TRACK_GRIP;
  const gripStep = Math.min(1, grip * FIXED_DT);
  car.velocity.x -= lateral.x * lateralSpeed * gripStep;
  car.velocity.y -= lateral.y * lateralSpeed * gripStep;

  // --- drag ---
  const drag = onTrack ? DRAG : OFF_TRACK_DRAG;
  car.velocity.x -= car.velocity.x * drag * FIXED_DT;
  car.velocity.y -= car.velocity.y * drag * FIXED_DT;

  // --- integrate position ---
  car.position.x += car.velocity.x * FIXED_DT;
  car.position.y += car.velocity.y * FIXED_DT;

  if (!onTrack) car.offTrackTime += FIXED_DT;

  // --- checkpoint / lap progression (ordered crossing only) ---
  const nextCp = track.checkpoints[car.checkpoint];
  const dx = car.position.x - nextCp.x;
  const dy = car.position.y - nextCp.y;
  if (dx * dx + dy * dy <= CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
    const crossingStart = car.checkpoint === 0;
    car.checkpoint = (car.checkpoint + 1) % CHECKPOINTS_PER_LAP;
    if (crossingStart) {
      const lapTime = elapsed - car.lastLapStart;
      if (car.lap > 0 && (car.bestLap === null || lapTime < car.bestLap)) {
        car.bestLap = lapTime;
      }
      car.lastLapStart = elapsed;
      car.lap += 1;
      if (car.lap > TOTAL_LAPS) {
        car.finished = true;
        car.finishTime = elapsed;
      }
    }
  }

  return car;
}
