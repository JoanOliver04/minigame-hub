import type { GameDefinition } from "../types";

export const memoryMatchGame = {
  id: "memory-match",
  icon: "🧠",
  category: "logic",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
