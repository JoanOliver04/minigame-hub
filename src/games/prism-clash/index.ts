import type { GameDefinition } from "../types";
import { PrismClashGame } from "./PrismClashGame";

export const prismClashGame: GameDefinition = {
  id: "prism-clash",
  icon: "🔷",
  hasTies: false,
  Component: PrismClashGame,
  supportsMultiplayer: true,
};
