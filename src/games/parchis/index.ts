import type { GameDefinition } from "../types";
import { ParchisGame } from "./ParchisGame";

export const parchisGame: GameDefinition = {
  id: "parchis",
  icon: "🎲",
  hasTies: false,
  Component: ParchisGame,
  supportsMultiplayer: true,
};
