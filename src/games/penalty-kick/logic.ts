import type {
  PenaltyDifficulty,
  PenaltyResult,
  Point,
} from "./types";

const DIFFICULTY = {
  easy: { readChance: 0.2, saveRadius: 15 },
  medium: { readChance: 0.42, saveRadius: 18 },
  hard: { readChance: 0.68, saveRadius: 21 },
} satisfies Record<
  PenaltyDifficulty,
  { readChance: number; saveRadius: number }
>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function randomPoint(): Point {
  return {
    x: 15 + Math.random() * 70,
    y: 18 + Math.random() * 64,
  };
}

/**
 * Resolve one kick. Power around 70% is most accurate; harder shots are
 * harder to save but increasingly likely to leave the goal.
 */
export function resolvePenalty(
  aim: Point,
  power: number,
  difficulty: PenaltyDifficulty,
): PenaltyResult {
  const settings = DIFFICULTY[difficulty];
  const accuracyPenalty = Math.abs(power - 70) * 0.12;
  const spread = 2.5 + accuracyPenalty + (power > 88 ? (power - 88) * 0.35 : 0);
  const ball = {
    x: aim.x + (Math.random() * 2 - 1) * spread,
    y: aim.y + (Math.random() * 2 - 1) * spread,
  };

  const keeperReadsShot = Math.random() < settings.readChance;
  const keeperBase = keeperReadsShot ? ball : randomPoint();
  const keeper = {
    x: clamp(keeperBase.x + (Math.random() * 2 - 1) * 9, 8, 92),
    y: clamp(keeperBase.y + (Math.random() * 2 - 1) * 9, 10, 90),
  };

  const outside =
    ball.x < 4 || ball.x > 96 || ball.y < 5 || ball.y > 95;
  const distance = Math.hypot(ball.x - keeper.x, ball.y - keeper.y);
  const powerSaveReduction = Math.max(0, power - 55) * 0.11;
  const saved = distance <= settings.saveRadius - powerSaveReduction;

  return {
    aim,
    ball,
    keeper,
    kind: outside ? "miss" : saved ? "saved" : "goal",
  };
}

