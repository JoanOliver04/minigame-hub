import type { GameDefinition } from "../types";

export const gooseGame = {
  id: "goose-game",
  icon: "🪿",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
