import type { GameDefinition } from "../types";

export const propertyBaronGame = {
  id: "property-baron",
  icon: "🏙️",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
