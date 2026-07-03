import type { GameDefinition } from "../types";
import { SpellstormGame } from "./SpellstormGame";

export const spellstormGame: GameDefinition = {
  id: "spellstorm",
  icon: "⚡",
  hasTies: true,
  Component: SpellstormGame,
  supportsMultiplayer: true,
};
