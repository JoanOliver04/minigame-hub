import type { GameDefinition } from "../types";

export const penaltyKickGame = {
  id: "penalty-kick",
  icon: "⚽",
  category: "action",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
