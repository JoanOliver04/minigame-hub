import type { GameDefinition } from "../types";
import { BeatReactorGame } from "./BeatReactorGame";

export const beatReactorGame: GameDefinition = {
  id: "beat-reactor",
  icon: "⚡",
  hasTies: true,
  Component: BeatReactorGame,
};
