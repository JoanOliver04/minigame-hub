export type PenaltyDifficulty = "easy" | "medium" | "hard";
export type ShotStyle = "placed" | "power" | "chip";
export type PenaltyResultKind = "goal" | "saved" | "post" | "miss";
export type KeeperStrategy = "guess" | "learn" | "read";

export interface Point {
  x: number;
  y: number;
}

export interface KeeperPlan {
  target: Point;
  reach: number;
  strategy: KeeperStrategy;
}

export interface ShotEstimate {
  accuracy: number;
  spread: number;
  speed: number;
  idealPower: number;
}

export interface PenaltyResult {
  aim: Point;
  ball: Point;
  keeper: Point;
  kind: PenaltyResultKind;
  style: ShotStyle;
  power: number;
  quality: number;
  speed: number;
  saveDistance: number;
  keeperStrategy: KeeperStrategy;
}

