import { foldLetter, foldWord } from "./letters";
import type {
  GuessKind,
  WordActor,
  WordGuessConfig,
  WordGuessState,
  WordWinner,
} from "./types";

export const SHARED_MISTAKE_LIMIT = 8;
export const WRONG_WORD_COST = 2;

export function normalizeWord(value: string): string {
  return value.trim().toUpperCase();
}

export function createWordGuessState(
  config: WordGuessConfig,
  word: string,
): WordGuessState {
  return {
    word,
    category: config.category,
    difficulty: config.difficulty,
    lang: config.lang,
    revealedLetters: new Set(),
    guessedLetters: new Set(),
    playerMistakes: 0,
    aiMistakes: 0,
    currentTurn: "player",
    history: [],
    feedback: null,
    finished: false,
    winner: null,
  };
}

export function wordPattern(state: WordGuessState): string {
  // Revealed slots show the word's real character (accent kept); matching is
  // by base letter, so a guessed E reveals É / e / é alike.
  return [...state.word]
    .map((letter) => (state.revealedLetters.has(foldLetter(letter)) ? letter : "_"))
    .join("");
}

export function totalMistakes(state: WordGuessState): number {
  return state.playerMistakes + state.aiMistakes;
}

function budgetWinner(playerMistakes: number, aiMistakes: number): WordWinner {
  if (playerMistakes === aiMistakes) return "tie";
  return playerMistakes < aiMistakes ? "player" : "ai";
}

export function applyGuess(
  state: WordGuessState,
  actor: WordActor,
  kind: GuessKind,
  rawValue: string,
): WordGuessState {
  if (state.finished || state.currentTurn !== actor) return state;

  const isLetter = kind === "letter";
  const raw = normalizeWord(rawValue);
  const foldedWord = foldWord(state.word);
  // Letters are matched (and stored) as their base form; whole-word guesses
  // are compared accent-insensitively too, but keep their display spelling.
  const value = isLetter ? foldLetter(raw) : raw;
  const correct = isLetter ? foldedWord.includes(value) : foldWord(raw) === foldedWord;
  const cost = correct ? 0 : isLetter ? 1 : WRONG_WORD_COST;
  const guessedLetters = new Set(state.guessedLetters);
  const revealedLetters = new Set(state.revealedLetters);

  if (isLetter) {
    guessedLetters.add(value);
    if (correct) revealedLetters.add(value);
  }

  let playerMistakes = state.playerMistakes + (actor === "player" ? cost : 0);
  let aiMistakes = state.aiMistakes + (actor === "ai" ? cost : 0);
  const allRevealed = [...state.word].every((letter) => revealedLetters.has(foldLetter(letter)));
  let winner: WordWinner | null = !isLetter && correct ? actor : null;
  let finished = winner !== null;

  // Revealing every tile without a full-word declaration is explicitly a draw.
  if (!finished && allRevealed) {
    winner = "tie";
    finished = true;
  } else if (!finished && playerMistakes + aiMistakes >= SHARED_MISTAKE_LIMIT) {
    winner = budgetWinner(playerMistakes, aiMistakes);
    finished = true;
  }

  // Preserve the real per-side cost even when a risky word guess crosses 8.
  playerMistakes = Math.max(0, playerMistakes);
  aiMistakes = Math.max(0, aiMistakes);

  return {
    ...state,
    revealedLetters,
    guessedLetters,
    playerMistakes,
    aiMistakes,
    currentTurn: finished || correct ? actor : actor === "player" ? "ai" : "player",
    history: [
      ...state.history,
      { actor, kind, value, correct, cost },
    ],
    feedback: { actor, kind, value, correct },
    finished,
    winner,
  };
}
