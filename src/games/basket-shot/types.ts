export type BasketDifficulty = "easy" | "medium" | "hard";
export type ShotActor = "player" | "ai";
export type ReleaseZone = "green" | "yellow" | "miss";

export interface BasketShot {
  actor: ShotActor;
  round: number;
  points: 2 | 3;
  made: boolean;
  scoredPoints: 0 | 1 | 2 | 3;
  accuracy: number;
  releaseZone: ReleaseZone;
}

export interface BasketRound {
  round: number;
  points: 2 | 3;
  player: BasketShot;
  ai: BasketShot;
}
