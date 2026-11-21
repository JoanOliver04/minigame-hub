import type { GameDefinition } from "../types";

export const connectFourGame = {
  id: "connect-four",
  icon: "🔴",
  category: "strategy",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
