export type DominoDifficulty = "easy" | "medium" | "hard";
export type DominoSide = "left" | "right";

export interface DominoTile {
  id: string;
  a: number;
  b: number;
}

export interface DominoBoardTile extends DominoTile {
  left: number;
  right: number;
}

export interface DominoAction {
  actor: string;
  kind: "play" | "draw" | "pass" | "win" | "block";
  tile?: DominoTile;
  side?: DominoSide;
  score?: number;
}

export interface DominoGameState {
  order: string[];
  hands: Record<string, DominoTile[]>;
  boneyard: DominoTile[];
  board: DominoBoardTile[];
  leftValue: number | null;
  rightValue: number | null;
  turn: string | null;
  finished: boolean;
  winner: string | null;
  tie: boolean;
  consecutivePasses: number;
  lastAction: DominoAction | null;
  log: DominoAction[];
}

export interface DominoConfig {
  difficulty: DominoDifficulty;
}
