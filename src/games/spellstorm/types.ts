export type SpellDifficulty = "easy" | "medium" | "hard";
export type Element = "fire" | "ice" | "shield";
export type Spell = Element;

export interface StormWord {
  display: string;
  normalized: string;
  element: Element;
}

export interface Mage {
  health: number;
  shield: number;
  energy: number;
  combo: number;
  words: number;
  slowed: boolean;
}

export interface AiWordPlan {
  durationMs: number;
  correctedTypo: boolean;
}

export const MATCH_SECONDS = 75;
export const SPELL_COST = 20;

