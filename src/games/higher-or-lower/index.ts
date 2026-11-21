import type { GameDefinition } from "../types";

export const higherOrLowerGame = {
  id: "higher-or-lower",
  icon: "🃏",
  category: "cards",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
