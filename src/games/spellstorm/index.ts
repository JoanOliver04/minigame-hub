import type { GameDefinition } from "../types";

export const spellstormGame = {
  id: "spellstorm",
  icon: "⚡",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
