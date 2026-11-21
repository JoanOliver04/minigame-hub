import type { GameDefinition } from "../types";

export const rpsGame = {
  id: "rps",
  icon: "✊",
  category: "strategy",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
