export type PrismColor = "ember" | "tide" | "bloom" | "volt";
export type PrismKind = "number" | "freeze" | "draw2" | "prism";
export type PrismDifficulty = "easy" | "medium" | "hard";

export interface PrismCard {
  id: string;
  color: PrismColor | null;
  kind: PrismKind;
  value?: number;
}

export interface PrismAction {
  actor: string;
  kind: "play" | "draw" | "combo" | "freeze" | "draw2" | "prism" | "roundWin";
  card?: PrismCard;
  color?: PrismColor;
  count?: number;
}

export interface PrismGameState {
  hands: Record<string, PrismCard[]>;
  drawPile: PrismCard[];
  discardPile: PrismCard[];
  activeColor: PrismColor;
  order: string[];
  turn: string | null;
  starter: string;
  comboUsed: boolean;
  scores: Record<string, number>;
  target: number;
  rounds: number;
  finished: boolean;
  winner: string | null;
  lastRoundWinner: string | null;
  lastAction: PrismAction | null;
}

export interface PrismConfig {
  difficulty: PrismDifficulty;
  target: number;
}
