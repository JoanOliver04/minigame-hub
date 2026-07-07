import type { GameDefinition } from "../types";
import { PropertyBaronGame } from "./PropertyBaronGame";

export const propertyBaronGame: GameDefinition = {
  id: "property-baron",
  icon: "🏙️",
  hasTies: false,
  Component: PropertyBaronGame,
  supportsMultiplayer: true,
};
