import type { GameDefinition } from "../types";

export const tileRummyGame = {
  id: "tile-rummy",
  icon: "🧩",
  category: "cards",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
