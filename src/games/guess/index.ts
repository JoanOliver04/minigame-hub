import type { GameDefinition } from "../types";

export const guessGame = {
  id: "guess",
  icon: "🔢",
  category: "logic",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
