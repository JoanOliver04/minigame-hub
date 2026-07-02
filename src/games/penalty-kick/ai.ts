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

function jitter(point: Point, amount: number): Point {
  return {
    x: clamp(point.x + (Math.random() * 2 - 1) * amount, 7, 93),
    y: clamp(point.y + (Math.random() * 2 - 1) * amount, 10, 90),
  };
}

function randomGridTarget(): Point {
  return {
    x: GRID_X[Math.floor(Math.random() * GRID_X.length)],
    y: GRID_Y[Math.floor(Math.random() * GRID_Y.length)],
  };
}

function learnedTarget(history: PenaltyResult[]): Point {
  if (history.length === 0) return randomGridTarget();
  const weighted = history.map((shot, index) => ({
    point: shot.aim,
    weight: index + 1,
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.point;
  }
  return weighted[weighted.length - 1].point;
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
): KeeperPlan {
  const tuning = TUNING[difficulty];
  const powerDisguise = Math.max(0, power - 72) * 0.0025;
  const chipDisguise = style === "chip" ? 0.05 : 0;
  const readChance = Math.max(
    0,
    tuning.readChance - powerDisguise - chipDisguise,
  );

  const roll = Math.random();
  let strategy: KeeperStrategy = "guess";
  let target: Point;

  if (roll < readChance) {
    strategy = "read";
    target = jitter(aim, tuning.readNoise);
  } else if (
    history.length >= 2 &&
    roll < readChance + tuning.learnChance
  ) {
    strategy = "learn";
    target = jitter(learnedTarget(history), 12);
  } else {
    target = jitter(randomGridTarget(), 12);
  }

  return {
    target,
    reach: tuning.reach,
    strategy,
  };
}
