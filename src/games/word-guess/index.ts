import type { GameDefinition } from "../types";
import { WordGuessGame } from "./WordGuessGame";

export const wordGuessGame: GameDefinition = {
  id: "word-guess",
  icon: "🔤",
  hasTies: true,
  Component: WordGuessGame,
};
