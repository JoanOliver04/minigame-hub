import type {
  KeeperPlan,
  PenaltyResult,
  Point,
  ShotEstimate,
  ShotStyle,
} from "./types";

interface StyleProfile {
  idealPower: number;
  baseSpread: number;
  deviationCost: number;
  baseSpeed: number;
}

const STYLE_PROFILES: Record<ShotStyle, StyleProfile> = {
  placed: {
    idealPower: 68,
    baseSpread: 1.7,
    deviationCost: 0.1,
    baseSpeed: 62,
  },
  power: {
    idealPower: 86,
    baseSpread: 5.8,
    deviationCost: 0.2,
    baseSpeed: 78,
  },
  chip: {
    idealPower: 56,
    baseSpread: 2.3,
    deviationCost: 0.13,
    baseSpeed: 48,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function concentratedRandom(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

function edgeRisk(aim: Point): number {
  const horizontal = Math.max(0, 14 - Math.min(aim.x, 100 - aim.x)) / 14;
  const vertical = Math.max(0, 14 - aim.y) / 14;
  return Math.max(horizontal, vertical) * 1.7;
}

export function estimateShot(
  aim: Point,
  power: number,
  style: ShotStyle,
): ShotEstimate {
  const profile = STYLE_PROFILES[style];
  const powerError = Math.abs(power - profile.idealPower);
  const spread =
    profile.baseSpread +
    powerError * profile.deviationCost +
    edgeRisk(aim);
  const speed =
    profile.baseSpeed +
    power * (style === "power" ? 0.28 : style === "placed" ? 0.18 : 0.12);
  const accuracy = clamp(Math.round(101 - spread * 7.2), 25, 99);

  return {
    accuracy,
    spread,
    speed: Math.round(speed),
    idealPower: profile.idealPower,
  };
}

function effectiveKeeperReach(
  plan: KeeperPlan,
  ball: Point,
  style: ShotStyle,
  power: number,
): number {
  if (
    style === "chip" &&
    Math.abs(plan.target.x - 50) > 22 &&
    ball.x >= 34 &&
    ball.x <= 66
  ) {
    return 4;
  }

  const powerReduction =
    style === "power"
      ? 3.4 + Math.max(0, power - 74) * 0.1
      : style === "placed"
        ? Math.max(0, power - 65) * 0.045
        : -2.2;

  return Math.max(3, plan.reach - powerReduction);
}

/** Resolve ball physics against a keeper plan chosen before the kick. */
export function resolvePenalty(
  aim: Point,
  power: number,
  style: ShotStyle,
  keeperPlan: KeeperPlan,
): PenaltyResult {
  const estimate = estimateShot(aim, power, style);
  const verticalSpread = estimate.spread * (style === "chip" ? 1.18 : 0.9);
  const ball = {
    x: aim.x + concentratedRandom() * estimate.spread,
    y:
      aim.y +
      concentratedRandom() * verticalSpread -
      (style === "chip" ? 1.5 : 0),
  };
  const keeper = keeperPlan.target;
  const saveDistance = Math.hypot(ball.x - keeper.x, ball.y - keeper.y);
  const reach = effectiveKeeperReach(keeperPlan, ball, style, power);

  const farOutside =
    ball.x < 0 || ball.x > 100 || ball.y < 0 || ball.y > 100;
  const hitsFrame =
    !farOutside &&
    (ball.x < 4 || ball.x > 96 || ball.y < 5);
  const saved = !farOutside && !hitsFrame && saveDistance <= reach;

  return {
    aim,
    ball,
    keeper,
    kind: farOutside ? "miss" : hitsFrame ? "post" : saved ? "saved" : "goal",
    style,
    power,
    quality: estimate.accuracy,
    speed: estimate.speed,
    saveDistance: Math.round(saveDistance * 10) / 10,
    keeperStrategy: keeperPlan.strategy,
  };
}

export function aimSector(point: Point): {
  horizontal: "left" | "center" | "right";
  vertical: "high" | "middle" | "low";
} {
  return {
    horizontal: point.x < 34 ? "left" : point.x > 66 ? "right" : "center",
    vertical: point.y < 34 ? "high" : point.y > 66 ? "low" : "middle",
  };
}
