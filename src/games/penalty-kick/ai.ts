import type {
  KeeperPlan,
  KeeperStrategy,
  PenaltyDifficulty,
  PenaltyResult,
  Point,
  ShotStyle,
} from "./types";

interface KeeperTuning {
  readChance: number;
  learnChance: number;
  reach: number;
  readNoise: number;
}

const TUNING: Record<PenaltyDifficulty, KeeperTuning> = {
  easy: { readChance: 0.08, learnChance: 0.15, reach: 14, readNoise: 18 },
  medium: { readChance: 0.28, learnChance: 0.35, reach: 17, readNoise: 11.5 },
  hard: { readChance: 0.46, learnChance: 0.5, reach: 20, readNoise: 8 },
};

const GRID_X = [18, 50, 82] as const;
const GRID_Y = [24, 52, 78] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function jitter(point: Point, amount: number, random: () => number): Point {
  return {
    x: clamp(point.x + (random() * 2 - 1) * amount, 7, 93),
    y: clamp(point.y + (random() * 2 - 1) * amount, 10, 90),
  };
}

function randomGridTarget(random: () => number): Point {
  return {
    x: GRID_X[Math.floor(random() * GRID_X.length)],
    y: GRID_Y[Math.floor(random() * GRID_Y.length)],
  };
}

function learnedTarget(history: PenaltyResult[]): Point {
  const zones = Array.from({ length: 9 }, () => ({ weight: 0, x: 0, y: 0 }));
  for (const [index, { aim }] of history.entries()) {
    const column = aim.x < 34 ? 0 : aim.x < 66 ? 1 : 2;
    const row = aim.y < 38 ? 0 : aim.y < 65 ? 1 : 2;
    const zone = zones[row * 3 + column];
    const weight = index + 1;
    zone.weight += weight;
    zone.x += aim.x * weight;
    zone.y += aim.y * weight;
  }
  const best = zones.reduce((a, b) => b.weight > a.weight ? b : a);
  return { x: best.x / best.weight, y: best.y / best.weight };
}

/**
 * The keeper commits before ball physics are resolved. Higher difficulties
 * read body shape more often and learn repeated targets, but never see the
 * final ball coordinates.
 */
export function planKeeper(
  aim: Point,
  difficulty: PenaltyDifficulty,
  history: PenaltyResult[],
  style: ShotStyle,
  power: number,
  random = Math.random,
): KeeperPlan {
  const tuning = TUNING[difficulty];
  const powerDisguise = Math.max(0, power - 72) * 0.0025;
  const chipDisguise = style === "chip" ? 0.05 : 0;
  const readChance = Math.max(
    0,
    tuning.readChance - powerDisguise - chipDisguise,
  );

  const roll = random();
  let strategy: KeeperStrategy = "guess";
  let target: Point;

  if (roll < readChance) {
    strategy = "read";
    target = jitter(aim, tuning.readNoise, random);
  } else if (
    history.length >= 2 &&
    roll < readChance + tuning.learnChance
  ) {
    strategy = "learn";
    target = jitter(learnedTarget(history), 12, random);
  } else {
    target = jitter(randomGridTarget(random), 12, random);
  }

  return {
    target,
    reach: tuning.reach,
    strategy,
  };
}
