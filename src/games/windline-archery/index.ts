import type { GameDefinition } from "../types";
import { WindlineArcheryGame } from "./WindlineArcheryGame";

export const windlineArcheryGame: GameDefinition = {
  id: "windline-archery",
  icon: "🏹",
  hasTies: true,
  Component: WindlineArcheryGame,
};
