import type { GameDefinition } from "../types";
import { BlackjackGame } from "./BlackjackGame";

export const blackjackGame: GameDefinition = {
  id: "blackjack",
  icon: "🃏",
  hasTies: true,
  Component: BlackjackGame,
};
