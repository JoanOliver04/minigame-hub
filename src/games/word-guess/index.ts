import type { GameDefinition } from "../types";

export const wordGuessGame = {
  id: "word-guess",
  icon: "🔤",
  category: "logic",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
