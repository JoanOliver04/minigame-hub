import type { GameDefinition } from "../types";

export const nimGame = {
  id: "nim",
  icon: "🪵",
  category: "logic",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
