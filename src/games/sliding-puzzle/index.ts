import type { GameDefinition } from "../types";
import { SlidingPuzzleGame } from "./SlidingPuzzleGame";

export const slidingPuzzleGame: GameDefinition = {
  id: "sliding-puzzle",
  icon: "🧩",
  hasTies: false,
  Component: SlidingPuzzleGame,
};
