import type { GameDefinition } from "../types";
import { GuessGame } from "./GuessGame";

export const guessGame: GameDefinition = {
  id: "guess",
  icon: "🔢",
  hasTies: false,
  Component: GuessGame,
  supportsMultiplayer: true,
};
