import type { GameDefinition } from "../types";

export const windlineArcheryGame = {
  id: "windline-archery",
  icon: "🏹",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
