import type { GameDefinition } from "../types";

export const signalBreakerGame = {
  id: "signal-breaker",
  icon: "🔓",
  category: "logic",
  hasTies: true,
  supportsMultiplayer: true,
} as const satisfies GameDefinition;
