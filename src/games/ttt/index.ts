import type { GameDefinition } from "../types";
import { TttGame } from "./TttGame";

export const tttGame: GameDefinition = {
  id: "ttt",
  icon: "⭕",
  hasTies: true,
  Component: TttGame,
};
