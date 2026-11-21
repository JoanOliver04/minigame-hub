import type { GameDefinition } from "../types";

export const hexDominionGame = {
  id: "hex-dominion",
  icon: "⬡",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
