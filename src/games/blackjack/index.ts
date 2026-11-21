import type { GameDefinition } from "../types";

export const blackjackGame = {
  id: "blackjack",
  icon: "🃏",
  category: "cards",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
