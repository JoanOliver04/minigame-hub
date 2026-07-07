export type GooseDifficulty = "easy" | "medium" | "hard";
export type GooseSpecial =
  | "goose"
  | "bridge"
  | "inn"
  | "dice"
  | "well"
  | "maze"
  | "prison"
  | "death"
  | "goal";

export interface GooseAction {
  actor: string;
  kind: "roll" | "reroll" | "move";
  roll: number;
  from?: number;
  landed?: number;
  to?: number;
  special?: GooseSpecial;
  swappedWith?: string;
  skipped?: string[];
}

export interface GooseGameState {
  order: string[];
  positions: Record<string, number>;
  turn: string | null;
  die: number | null;
  rerolled: boolean;
  feathers: Record<string, number>;
  skippedTurns: Record<string, number>;
  finished: boolean;
  winner: string | null;
  lastAction: GooseAction | null;
  log: GooseAction[];
}

export interface GooseConfig {
  difficulty: GooseDifficulty;
}

export interface GooseLanding {
  landed: number;
  destination: number;
  special?: GooseSpecial;
  extraTurn: boolean;
  skipTurns: number;
}
