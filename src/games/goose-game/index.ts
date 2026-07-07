import type { GameDefinition } from "../types";
import { GooseGame } from "./GooseGame";

export const gooseGame: GameDefinition = {
  id: "goose-game",
  icon: "🪿",
  hasTies: false,
  Component: GooseGame,
  supportsMultiplayer: true,
};
