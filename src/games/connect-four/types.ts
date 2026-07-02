export type ConnectPiece = "R" | "Y";
export type ConnectCell = ConnectPiece | null;
export type ConnectBoard = ConnectCell[][];
export type ConnectDifficulty = "easy" | "medium" | "hard";

export interface BoardPosition {
  row: number;
  column: number;
}

export interface ConnectRoundOutcome {
  winner: ConnectPiece | null;
  line: BoardPosition[] | null;
  draw: boolean;
}

export interface ConnectMatchState {
  difficulty: ConnectDifficulty;
  target: number;
  playerScore: number;
  aiScore: number;
  draws: number;
  rounds: number;
  finished: boolean;
}

