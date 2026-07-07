export type PropertyDifficulty = "easy" | "medium" | "hard";
export type BaronActor = "player" | "ai" | string;
export type BaronTileKind = "start" | "property" | "tax" | "bonus" | "market";
export type BaronPhase = "roll" | "decision" | "finished";

export interface BaronTile {
  id: number;
  kind: BaronTileKind;
  name: string;
  group?: "dock" | "market" | "park" | "tower" | "transit";
  price?: number;
  rent?: number;
  upgradeCost?: number;
}

export interface BaronPlayer {
  uid: BaronActor;
  money: number;
  position: number;
  inJail: number;
  bankrupt: boolean;
}

export interface BaronProperty {
  owner: BaronActor | null;
  level: number;
}

export interface BaronLogEntry {
  id: number;
  text: string;
}

export interface BaronGameState {
  players: Record<BaronActor, BaronPlayer>;
  properties: Record<number, BaronProperty>;
  order: BaronActor[];
  turn: BaronActor | null;
  phase: BaronPhase;
  dice: [number, number] | null;
  pendingTile: number | null;
  round: number;
  maxRounds: number;
  finished: boolean;
  winner: BaronActor | null;
  log: BaronLogEntry[];
}

export interface PropertyBaronConfig {
  difficulty: PropertyDifficulty;
  maxRounds: number;
}
