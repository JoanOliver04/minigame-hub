import type { GameDefinition } from "../types";

export const basketShotGame = {
  id: "basket-shot",
  icon: "🏀",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
