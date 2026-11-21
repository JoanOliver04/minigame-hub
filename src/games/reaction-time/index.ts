import type { GameDefinition } from "../types";

export const reactionTimeGame = {
  id: "reaction-time",
  icon: "⚡",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
