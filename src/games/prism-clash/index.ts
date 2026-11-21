import type { GameDefinition } from "../types";

export const prismClashGame = {
  id: "prism-clash",
  icon: "🔷",
  category: "cards",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
