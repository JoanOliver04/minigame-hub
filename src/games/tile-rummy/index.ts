import type { GameDefinition } from "../types";
import { TileRummyGame } from "./TileRummyGame";

export const tileRummyGame: GameDefinition = {
  id: "tile-rummy",
  icon: "🧩",
  hasTies: false,
  Component: TileRummyGame,
  supportsMultiplayer: true,
};
