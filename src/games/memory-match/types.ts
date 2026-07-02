export type MemoryDifficulty = "easy" | "medium" | "hard";
export type MemoryActor = "player" | "ai";
export type MemoryWinner = MemoryActor | "tie";
export type MemoryGridSize = 4 | 6;

export interface MatchTile {
  id: number;
  value: string;
  isFlipped: boolean;
  isSolved: boolean;
}

export interface MemoryConfig {
  difficulty: MemoryDifficulty;
  size: MemoryGridSize;
}

export interface AIMemoryStore {
  /** Board index -> symbol observed and retained by the AI. */
  knownTiles: Record<number, string>;
}

export type MemoryFeedback =
  | { kind: "match"; actor: MemoryActor }
  | { kind: "miss"; actor: MemoryActor }
  | null;

export interface MemoryMatchState {
  config: MemoryConfig;
  tiles: MatchTile[];
  turn: MemoryActor;
  playerPairs: number;
  aiPairs: number;
  playerMoves: number;
  aiMoves: number;
  feedback: MemoryFeedback;
  finished: boolean;
  winner: MemoryWinner | null;
}

