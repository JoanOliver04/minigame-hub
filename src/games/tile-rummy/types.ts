export type TileRummyColor = "ruby" | "sun" | "leaf" | "sky";
export type TileRummyDifficulty = "easy" | "medium" | "hard";

export interface TileRummyTile {
  id: string;
  color: TileRummyColor | "joker";
  value: number | null;
  joker: boolean;
}

export interface TileRummyMeld {
  id: string;
  owner: string;
  kind: "group" | "run";
  tiles: TileRummyTile[];
  score: number;
}

export interface TileRummyAction {
  actor: string;
  kind: "draw" | "meld" | "blocked" | "win";
  meldKind?: "group" | "run";
  score?: number;
  count?: number;
}

export interface TileRummyGameState {
  order: string[];
  hands: Record<string, TileRummyTile[]>;
  deck: TileRummyTile[];
  table: TileRummyMeld[];
  opened: Record<string, boolean>;
  turn: string | null;
  finished: boolean;
  winner: string | null;
  lastAction: TileRummyAction | null;
  log: TileRummyAction[];
}

export interface TileRummyConfig {
  difficulty: TileRummyDifficulty;
}

export interface TileRummyValidation {
  valid: boolean;
  kind?: "group" | "run";
  score: number;
  reason?: "tooFew" | "mixed" | "duplicateColor" | "gap" | "opening";
}
