import type { GameDefinition } from "../types";

export const slidingPuzzleGame = {
  id: "sliding-puzzle",
  icon: "🧩",
  category: "logic",
  hasTies: false,
  supportsMultiplayer: false,
} as const satisfies GameDefinition;
