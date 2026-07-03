import type { GameDefinition } from "../types";
import { NeonDriftGame } from "./NeonDriftGame";

export const neonDriftGame: GameDefinition = {
  id: "neon-drift",
  icon: "🏎️",
  hasTies: true,
  Component: NeonDriftGame,
  supportsMultiplayer: true,
};
