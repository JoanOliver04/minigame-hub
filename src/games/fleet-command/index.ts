import type { GameDefinition } from "../types";
import { FleetCommandGame } from "./FleetCommandGame";

export const fleetCommandGame: GameDefinition = {
  id: "fleet-command",
  icon: "⚓",
  hasTies: false,
  Component: FleetCommandGame,
};
