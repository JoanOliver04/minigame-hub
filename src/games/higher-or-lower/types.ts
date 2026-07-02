import type { Card, Deck } from "@/lib/cards";

export type HigherOrLowerDifficulty = "easy" | "medium" | "hard";
export type Prediction = "higher" | "lower" | "same";
export type MatchWinner = "player" | "ai" | "tie";

export interface HigherOrLowerConfig {
  difficulty: HigherOrLowerDifficulty;
  rounds: 10 | 20;
  aceHigh: boolean;
  allowSame: boolean;
}

export interface CompetitorStats {
  score: number;
  streak: number;
  bestStreak: number;
}

export interface HigherOrLowerHistoryEntry {
  id: number;
  currentCard: Card;
  nextCard: Card;
  playerPrediction: Prediction;
  aiPrediction: Prediction;
  playerCorrect: boolean;
  aiCorrect: boolean;
}

export interface HigherOrLowerMatch {
  config: HigherOrLowerConfig;
  deck: Deck;
  currentCard: Card;
  roundsPlayed: number;
  player: CompetitorStats;
  ai: CompetitorStats;
  history: HigherOrLowerHistoryEntry[];
  finished: boolean;
  winner: MatchWinner | null;
}

export interface RevealState {
  nextCard: Card;
  playerPrediction: Prediction;
  aiPrediction: Prediction;
  playerCorrect: boolean;
  aiCorrect: boolean;
}

