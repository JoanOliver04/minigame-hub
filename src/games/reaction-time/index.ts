import type { GameDefinition } from "../types";
import { ReactionTimeGame } from "./ReactionTimeGame";

export const reactionTimeGame: GameDefinition = {
  id: "reaction-time",
  icon: "⚡",
  hasTies: true,
  Component: ReactionTimeGame,
};
