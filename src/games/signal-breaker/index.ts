import type { GameDefinition } from "../types";
import { SignalBreakerGame } from "./SignalBreakerGame";

export const signalBreakerGame: GameDefinition = {
  id: "signal-breaker",
  icon: "🔓",
  hasTies: true,
  Component: SignalBreakerGame,
};
