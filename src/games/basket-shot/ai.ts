import { resolvePlayerShot } from "./logic";
import type { BasketDifficulty, BasketShot } from "./types";

const RELEASE_SPREAD: Record<BasketDifficulty, number> = {
  easy: 32,
  medium: 23,
  hard: 16,
};

export function resolveAiShot(
  difficulty: BasketDifficulty,
  round: number,
  points: 2 | 3,
  random = Math.random,
): BasketShot {
  const spread = RELEASE_SPREAD[difficulty] + (points === 3 ? 6 : 0);
  // Two samples put more releases near the ideal timing than at either extreme.
  const marker = 50 + spread * (random() + random() - 1);
  return { ...resolvePlayerShot(marker, round, points), actor: "ai" };
}
