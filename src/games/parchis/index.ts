import type { GameDefinition } from "../types";

export const parchisGame = {
  id: "parchis",
  icon: "🎲",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
