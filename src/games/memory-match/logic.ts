/** Memory Match — pure board creation and scoring rules. */

import { shuffleItems } from "@/lib/cards";
import type {
  MatchTile,
  MemoryActor,
  MemoryConfig,
  MemoryMatchState,
  MemoryWinner,
} from "./types";

const SYMBOLS = [
  "🐶",
  "🐱",
  "🦊",
  "🐼",
  "🐸",
  "🦁",
  "🐵",
  "🐙",
  "🦋",
  "🌵",
  "🍉",
  "🍕",
  "🚀",
  "⚽",
  "🎸",
  "💎",
  "🌈",
  "⭐",
] as const;

export function createTiles(size: MemoryConfig["size"]): MatchTile[] {
  const pairCount = (size * size) / 2;
  const values = SYMBOLS.slice(0, pairCount).flatMap((value) => [value, value]);
  return shuffleItems(values).map((value, id) => ({
    id,
    value,
    isFlipped: false,
    isSolved: false,
  }));
}

export function createMemoryMatch(config: MemoryConfig): MemoryMatchState {
  return {
    config,
    tiles: createTiles(config.size),
    turn: "player",
    playerPairs: 0,
    aiPairs: 0,
    playerMoves: 0,
    aiMoves: 0,
    feedback: null,
    finished: false,
    winner: null,
  };
}

export function flipTile(tiles: MatchTile[], index: number): MatchTile[] {
  return tiles.map((tile, tileIndex) =>
    tileIndex === index ? { ...tile, isFlipped: true } : tile,
  );
}

export function hideTiles(tiles: MatchTile[], indexes: number[]): MatchTile[] {
  const hidden = new Set(indexes);
  return tiles.map((tile, index) =>
    hidden.has(index) ? { ...tile, isFlipped: false } : tile,
  );
}

export function solveTiles(tiles: MatchTile[], indexes: number[]): MatchTile[] {
  const solved = new Set(indexes);
  return tiles.map((tile, index) =>
    solved.has(index) ? { ...tile, isFlipped: true, isSolved: true } : tile,
  );
}

export function decideMemoryWinner(
  playerPairs: number,
  aiPairs: number,
): MemoryWinner {
  if (playerPairs === aiPairs) return "tie";
  return playerPairs > aiPairs ? "player" : "ai";
}

export function otherActor(actor: MemoryActor): MemoryActor {
  return actor === "player" ? "ai" : "player";
}

