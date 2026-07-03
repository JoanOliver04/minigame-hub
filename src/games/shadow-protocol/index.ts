import type { GameDefinition } from "../types";
import { ShadowProtocolGame } from "./ShadowProtocolGame";

export const shadowProtocolGame: GameDefinition = {
  id: "shadow-protocol",
  icon: "🕶️",
  hasTies: false,
  Component: ShadowProtocolGame,
  supportsMultiplayer: true,
};
