import type { GameDefinition } from "../types";
import { HigherOrLowerGame } from "./HigherOrLowerGame";

export const higherOrLowerGame: GameDefinition = {
  id: "higher-or-lower",
  icon: "🃏",
  hasTies: true,
  Component: HigherOrLowerGame,
  supportsMultiplayer: true,
};

