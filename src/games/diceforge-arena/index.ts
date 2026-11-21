import type { GameDefinition } from "../types";

export const diceforgeArenaGame = {
  id: "diceforge-arena",
  icon: "🎲",
  category: "cards",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
