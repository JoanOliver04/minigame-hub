import type { GameDefinition } from "../types";

export const beatReactorGame = {
  id: "beat-reactor",
  icon: "⚡",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
