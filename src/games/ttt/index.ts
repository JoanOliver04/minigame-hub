import type { GameDefinition } from "../types";

export const tttGame = {
  id: "ttt",
  icon: "⭕",
  category: "strategy",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
