export type WordDifficulty = "easy" | "medium" | "hard";
export type WordCategory = "animals" | "countries" | "food" | "technology";
/** Language the secret word is drawn from — chosen at setup, independent of
 *  the UI locale so you can play Spanish words with the English interface. */
export type WordLang = "en" | "es";
export type WordActor = "player" | "ai";
export type WordWinner = WordActor | "tie";
export type GuessKind = "letter" | "word";

export interface WordGuessConfig {
  difficulty: WordDifficulty;
  category: WordCategory;
  lang: WordLang;
}

export interface WordGuessEntry {
  actor: WordActor;
  kind: GuessKind;
  value: string;
  correct: boolean;
  cost: number;
}

export interface WordFeedback {
  actor: WordActor;
  kind: GuessKind;
  value: string;
  correct: boolean;
}

export interface WordGuessState {
  word: string;
  category: WordCategory;
  difficulty: WordDifficulty;
  lang: WordLang;
  revealedLetters: Set<string>;
  guessedLetters: Set<string>;
  playerMistakes: number;
  aiMistakes: number;
  currentTurn: WordActor;
  history: WordGuessEntry[];
  feedback: WordFeedback | null;
  finished: boolean;
  winner: WordWinner | null;
}

export type AIGuess =
  | { kind: "letter"; value: string }
  | { kind: "word"; value: string };
