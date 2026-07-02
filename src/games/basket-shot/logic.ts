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

export function meterSpeed(difficulty: BasketDifficulty): number {
  return METER_SPEED[difficulty];
}

/** Resolve a player shot from the timing marker (50 is a perfect release). */
export function resolvePlayerShot(
  marker: number,
  round: number,
  points: 2 | 3,
): BasketShot {
  const accuracy = clamp(100 - Math.abs(marker - 50) * 2, 0, 100);
  const distancePenalty = points === 3 ? 0.12 : 0;
  const makeChance = clamp(0.08 + accuracy * 0.0092 - distancePenalty, 0.05, 0.98);

  return {
    actor: "player",
    round,
    points,
    made: Math.random() < makeChance,
    accuracy: Math.round(accuracy),
  };
}

