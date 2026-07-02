import type { BasketDifficulty, BasketShot } from "./types";

export const BASKET_ROUNDS = 5;
export const ROUND_POINTS: readonly (2 | 3)[] = [2, 3, 2, 3, 3];

const METER_SPEED: Record<BasketDifficulty, number> = {
  easy: 52,
  medium: 74,
  hard: 96,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function releaseZone(marker: number): "green" | "yellow" | "miss" {
  if (marker >= 43 && marker <= 57) return "green";
  if ((marker >= 35 && marker < 43) || (marker > 57 && marker <= 65)) {
    return "yellow";
  }
  return "miss";
}

export function meterSpeed(difficulty: BasketDifficulty): number {
  return METER_SPEED[difficulty];
}

/**
 * Resolve a player shot directly from the visible meter zones:
 * green scores the full shot value, yellow scores one, all other zones miss.
 */
export function resolvePlayerShot(
  marker: number,
  round: number,
  points: 2 | 3,
): BasketShot {
  const accuracy = clamp(100 - Math.abs(marker - 50) * 2, 0, 100);
  const zone = releaseZone(marker);
  const scoredPoints = zone === "green" ? points : zone === "yellow" ? 1 : 0;

  return {
    actor: "player",
    round,
    points,
    made: scoredPoints > 0,
    scoredPoints,
    accuracy: Math.round(accuracy),
    releaseZone: zone,
  };
}
