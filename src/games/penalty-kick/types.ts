export type PenaltyDifficulty = "easy" | "medium" | "hard";
export type PenaltyResultKind = "goal" | "saved" | "miss";

export interface Point {
  x: number;
  y: number;
}

export interface PenaltyResult {
  aim: Point;
  ball: Point;
  keeper: Point;
  kind: PenaltyResultKind;
}

