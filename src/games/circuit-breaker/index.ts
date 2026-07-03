import type { GameDefinition } from "../types";
import { CircuitBreakerGame } from "./CircuitBreakerGame";

export const circuitBreakerGame: GameDefinition = {
  id: "circuit-breaker",
  icon: "🏍️",
  hasTies: true,
  Component: CircuitBreakerGame,
  supportsMultiplayer: true,
};
