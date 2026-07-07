import type { GameDefinition } from "../types";
import { DominoGame } from "./DominoGame";

export const dominoGame: GameDefinition = {
  id: "domino",
  icon: "🁢",
  hasTies: true,
  Component: DominoGame,
  supportsMultiplayer: true,
};
