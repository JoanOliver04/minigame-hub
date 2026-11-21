import type { GameDefinition } from "../types";

export const fleetCommandGame = {
  id: "fleet-command",
  icon: "⚓",
  category: "strategy",
  hasTies: false,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
