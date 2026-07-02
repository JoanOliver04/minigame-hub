/**
 * Neon Drift — racing-line AI (blueprint §5.5).
 *
 * The AI produces the SAME ControlInput a player would: it never gets extra
 * grip, acceleration, boost, or off-track immunity (blueprint's "no rubber-
 * banding" rule). It steers toward a look-ahead node on the precomputed
 * racing line, brakes when overspeed for the upcoming target, and boosts
 * only on low-curvature segments.
 *
 *   Easy   — short look-ahead, ±8% input noise, 82% target speed, one
 *            delayed brake per lap.
 *   Medium — adaptive look-ahead, ±3% noise, 94% target speed.
 *   Hard   — adaptive + curvature look-ahead, no noise, 100% target speed.
 */

import type { Rng } from "@/lib/rng";
import type { TrackDef } from "./tracks";
import type { CarState, ControlInput, DriftDifficulty } from "./types";

interface AiProfile {
  lookAheadBase: number;
  curvatureLookAhead: boolean;
  inputNoise: number;
  speedFactor: number;
  scriptedMistakes: boolean;
}

const PROFILES: Record<DriftDifficulty, AiProfile> = {
  easy: { lookAheadBase: 6, curvatureLookAhead: false, inputNoise: 0.08, speedFactor: 0.82, scriptedMistakes: true },
  medium: { lookAheadBase: 9, curvatureLookAhead: false, inputNoise: 0.03, speedFactor: 0.94, scriptedMistakes: false },
  hard: { lookAheadBase: 10, curvatureLookAhead: true, inputNoise: 0.0, speedFactor: 1.0, scriptedMistakes: false },
};

function nearestNodeIndex(track: TrackDef, car: CarState): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < track.racingNodes.length; i++) {
    const p = track.racingNodes[i].position;
    const d = (p.x - car.position.x) ** 2 + (p.y - car.position.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export interface AiMemory {
  /** Whether this lap's scripted brake mistake has fired yet (Easy). */
  mistakeLap: number;
}

export function createAiMemory(): AiMemory {
  return { mistakeLap: -1 };
}

export function aiControl(
  car: CarState,
  track: TrackDef,
  difficulty: DriftDifficulty,
  rng: Rng,
  memory: AiMemory,
): ControlInput {
  const profile = PROFILES[difficulty];
  const nodes = track.racingNodes;
  const nearest = nearestNodeIndex(track, car);
  const speed = Math.hypot(car.velocity.x, car.velocity.y);

  // Look-ahead scales with speed; Hard extends it further into corners.
  let lookAhead = profile.lookAheadBase + Math.floor(speed / 40);
  if (profile.curvatureLookAhead) lookAhead += Math.floor(nodes[nearest].curvature * 10);
  const targetIdx = (nearest + lookAhead) % nodes.length;
  const target = nodes[targetIdx];

  // --- steering toward the look-ahead node ---
  const desired = Math.atan2(target.position.y - car.position.y, target.position.x - car.position.x);
  let err = desired - car.heading;
  while (err > Math.PI) err -= 2 * Math.PI;
  while (err < -Math.PI) err += 2 * Math.PI;
  let steer = Math.max(-1, Math.min(1, err * 1.6));

  // --- speed control: brake when overspeed for the upcoming target ---
  const upcoming = nodes[(nearest + Math.max(3, lookAhead - 2)) % nodes.length];
  const targetSpeed = upcoming.targetSpeed * profile.speedFactor;
  let throttle = 1;
  let brake = 0;
  if (speed > targetSpeed * 1.05) {
    brake = Math.min(1, (speed - targetSpeed) / 120);
    throttle = 0;
  } else if (speed > targetSpeed) {
    throttle = 0.4;
  }

  // Easy: one delayed brake per lap — skip braking into the first corner.
  if (profile.scriptedMistakes && car.lap !== memory.mistakeLap && upcoming.curvature > 0.18) {
    memory.mistakeLap = car.lap;
    brake = 0;
    throttle = 1;
  }

  // --- boost only on near-straight segments with meter to spare ---
  const boost = profile.curvatureLookAhead
    ? nodes[nearest].curvature < 0.05 && car.boost > 15
    : nodes[nearest].curvature < 0.03 && car.boost > 40 && difficulty === "medium";

  // --- difficulty input noise ---
  if (profile.inputNoise > 0) {
    steer += (rng.next() * 2 - 1) * profile.inputNoise;
    steer = Math.max(-1, Math.min(1, steer));
  }

  return { steer, throttle, brake, boost };
}
