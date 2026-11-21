import type { GameDefinition } from "../types";

export const circuitBreakerGame = {
  id: "circuit-breaker",
  icon: "🏍️",
  category: "action",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
