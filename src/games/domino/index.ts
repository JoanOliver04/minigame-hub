import type { GameDefinition } from "../types";

export const dominoGame = {
  id: "domino",
  icon: "🁢",
  category: "cards",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
