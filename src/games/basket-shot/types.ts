export type BasketDifficulty = "easy" | "medium" | "hard";
export type ShotActor = "player" | "ai";

export interface BasketShot {
  actor: ShotActor;
  round: number;
  points: 2 | 3;
  made: boolean;
  accuracy: number;
}

export interface BasketRound {
  round: number;
  points: 2 | 3;
  player: BasketShot;
  ai: BasketShot;
}

