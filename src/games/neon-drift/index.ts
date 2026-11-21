import type { GameDefinition } from "../types";

export const neonDriftGame = {
  id: "neon-drift",
  icon: "🏎️",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
