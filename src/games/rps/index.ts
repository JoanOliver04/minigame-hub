import type { GameDefinition } from "../types";
import { RpsGame } from "./RpsGame";

export const rpsGame: GameDefinition = {
  id: "rps",
  icon: "✊",
  hasTies: true,
  Component: RpsGame,
  supportsMultiplayer: true,
};
