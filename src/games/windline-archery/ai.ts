/**
 * Windline Archery — AI archer (blueprint §9.3).
 *
 * Honest-information contract: the AI never aims with the true wind. It
 * receives a NOISY wind reading (Easy ±35%, Medium ±15%, Hard exact) and
 * searches angle/power against that perception; its release hand then
 * shakes by a difficulty-dependent variance. Its input is generated before
 * the player's arrow lands — it cannot react to your result.
 */

import type { Rng } from "@/lib/rng";
import { computeImpact, flightTime } from "./physics";
import type { ArcheryDifficulty, ArrowInput, Wind } from "./types";

interface AiProfile {
  windError: number; // proportional misreading of each wind component
  releaseSigma: number; // release shake, std-dev of releaseError
  aimSigma: number; // aim jitter, std-dev in normalized target units
}

const PROFILES: Record<ArcheryDifficulty, AiProfile> = {
  easy: { windError: 0.35, releaseSigma: 0.28, aimSigma: 0.5 },
  medium: { windError: 0.15, releaseSigma: 0.14, aimSigma: 0.29 },
  hard: { windError: 0, releaseSigma: 0.07, aimSigma: 0.16 },
};

/** Degrees of windage per normalized lateral unit (2.4 m over 50 m). */
const WINDAGE_DEG_PER_UNIT = (Math.atan(2.4 / 50) * 180) / Math.PI;
/** Approximate degrees of elevation per normalized vertical unit. */
const ELEVATION_DEG_PER_UNIT = 2.7;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Approximate unit-variance normal sample via central-limit sum. */
function gaussian(rng: Rng): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rng.next();
  return (sum - 3) * 1.414;
}

export function aiAim(wind: Wind, difficulty: ArcheryDifficulty, rng: Rng): ArrowInput {
  const profile = PROFILES[difficulty];
  const perceived: Wind = {
    horizontal: wind.horizontal * (1 + (rng.next() * 2 - 1) * profile.windError),
    vertical: wind.vertical * (1 + (rng.next() * 2 - 1) * profile.windError),
  };

  // Grid-search angle/power against the PERCEIVED wind only; windage is
  // solved analytically per candidate to cancel perceived lateral drift.
  let best: ArrowInput = { angleDeg: 8, windageDeg: 0, power: 60, releaseError: 0 };
  let bestError = Infinity;
  const windUncertainty = Math.hypot(perceived.horizontal, perceived.vertical) * profile.windError;
  for (let angle = 2; angle <= 20; angle += 0.5) {
    for (let power = 30; power <= 100; power += 2) {
      const zero = computeImpact({ angleDeg: angle, windageDeg: 0, power, releaseError: 0 }, perceived);
      // 2.4 m per normalized unit over a 50 m range (see physics.ts).
      const windageDeg = clamp((-Math.atan((zero.x * 2.4) / 50) * 180) / Math.PI, -4, 4);
      const candidate: ArrowInput = { angleDeg: angle, windageDeg, power, releaseError: 0 };
      const impact = computeImpact(candidate, perceived);
      const duration = flightTime(candidate);
      // Wind drift grows with flight time squared. Prefer trajectories that
      // remain close when the estimate is wrong, not just a nominal bullseye.
      const error = Math.hypot(impact.x, impact.y, windUncertainty * duration ** 2 / 4.8);
      if (error < bestError) {
        bestError = error;
        best = candidate;
      }
    }
  }

  // Human hands shake: jitter the aim itself, not just the release.
  return {
    angleDeg: clamp(best.angleDeg + gaussian(rng) * profile.aimSigma * ELEVATION_DEG_PER_UNIT, 2, 20),
    windageDeg: clamp(best.windageDeg + gaussian(rng) * profile.aimSigma * WINDAGE_DEG_PER_UNIT, -4, 4),
    power: best.power,
    releaseError: clamp(gaussian(rng) * profile.releaseSigma, -1, 1),
  };
}
