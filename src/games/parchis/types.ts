export type ParchisColor = "red" | "blue";
export type ParchisDifficulty = "easy" | "medium" | "hard";
export type ParchisMoveSource = "die" | "capture" | "goal";

export interface ParchisPiece {
  id: number;
  /** -1 = home, 0..67 = shared track, 68..74 = home lane, 75 = goal. */
  progress: number;
}

export interface ParchisAction {
  actor: string;
  kind: "roll" | "move" | "exit" | "capture" | "goal" | "blocked" | "tripleSix";
  roll?: number;
  piece?: number;
  steps?: number;
  capturedActor?: string;
  capturedPiece?: number;
}

export interface ParchisGameState {
  order: string[];
  colors: Record<string, ParchisColor>;
  pieces: Record<string, ParchisPiece[]>;
  turn: string | null;
  dice: number | null;
  pendingSteps: number | null;
  pendingSource: ParchisMoveSource | null;
  resumeExtraRoll: boolean;
  consecutiveSixes: Record<string, number>;
  lastMovedPiece: Record<string, number | null>;
  pieceCount: 2 | 4;
  finished: boolean;
  winner: string | null;
  lastAction: ParchisAction | null;
  log: ParchisAction[];
}

export interface ParchisConfig {
  difficulty: ParchisDifficulty;
  pieceCount: 2 | 4;
}
