import type { GameDefinition } from "../types";
import { PenaltyKickGame } from "./PenaltyKickGame";

export const penaltyKickGame: GameDefinition = {
  id: "penalty-kick",
  icon: "⚽",
  hasTies: false,
  Component: PenaltyKickGame,
};

