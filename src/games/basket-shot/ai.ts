import type { BasketDifficulty, BasketShot } from "./types";

const AI_ACCURACY: Record<BasketDifficulty, number> = {
  easy: 0.42,
  medium: 0.58,
  hard: 0.74,
};

export function resolveAiShot(
  difficulty: BasketDifficulty,
  round: number,
  points: 2 | 3,
): BasketShot {
  const makeChance = AI_ACCURACY[difficulty] - (points === 3 ? 0.11 : 0);
  const made = Math.random() < makeChance;

  return {
    actor: "ai",
    round,
    points,
    made,
    scoredPoints: made ? points : 0,
    accuracy: made
      ? Math.round(68 + Math.random() * 30)
      : Math.round(18 + Math.random() * 55),
    releaseZone: made ? "green" : "miss",
  };
}
