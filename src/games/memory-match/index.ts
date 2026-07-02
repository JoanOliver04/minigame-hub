import type { GameDefinition } from "../types";
import { MemoryMatchGame } from "./MemoryMatchGame";

export const memoryMatchGame: GameDefinition = {
  id: "memory-match",
  icon: "🧠",
  hasTies: true,
  Component: MemoryMatchGame,
};

