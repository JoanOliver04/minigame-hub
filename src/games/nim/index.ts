import type { GameDefinition } from "../types";
import { NimGame } from "./NimGame";

export const nimGame: GameDefinition = {
  id: "nim",
  icon: "🪵",
  hasTies: false,
  Component: NimGame,
};
