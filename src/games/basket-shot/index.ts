import type { GameDefinition } from "../types";
import { BasketShotGame } from "./BasketShotGame";

export const basketShotGame: GameDefinition = {
  id: "basket-shot",
  icon: "🏀",
  hasTies: true,
  Component: BasketShotGame,
};

