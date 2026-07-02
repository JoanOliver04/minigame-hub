import type { GameDefinition } from "../types";
import { ConnectFourGame } from "./ConnectFourGame";

export const connectFourGame: GameDefinition = {
  id: "connect-four",
  icon: "🔴",
  hasTies: true,
  Component: ConnectFourGame,
};

