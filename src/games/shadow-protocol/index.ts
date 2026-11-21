import type { GameDefinition } from "../types";

export const shadowProtocolGame = {
  id: "shadow-protocol",
  icon: "🕶️",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
