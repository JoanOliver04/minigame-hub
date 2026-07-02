/**
 * Probabilistic memory used by the Memory Match AI.
 *
 * Hidden values are never inspected when choosing a tile. Values enter this
 * store only through observeTile(), which is called whenever either side
 * reveals a tile and succeeds according to the difficulty's retention rate.
 */

import { randomInt } from "@/lib/random";
import type {
  AIMemoryStore,
  MatchTile,
  MemoryDifficulty,
} from "./types";

const RETENTION: Record<MemoryDifficulty, number> = {
  easy: 0.3,
  medium: 0.6,
  hard: 0.93,
};

export function createAIMemoryStore(): AIMemoryStore {
  return { knownTiles: {} };
}

export function observeTile(
  store: AIMemoryStore,
  index: number,
  value: string,
  difficulty: MemoryDifficulty,
  random: () => number = Math.random,
): AIMemoryStore {
  if (random() >= RETENTION[difficulty]) return store;
  return {
    knownTiles: {
      ...store.knownTiles,
      [index]: value,
    },
  };
}

export function removeSolvedFromMemory(
  store: AIMemoryStore,
  indexes: number[],
): AIMemoryStore {
  const removed = new Set(indexes);
  return {
    knownTiles: Object.fromEntries(
      Object.entries(store.knownTiles).filter(([index]) => !removed.has(Number(index))),
    ),
  };
}

function activeIndexes(tiles: MatchTile[], excluded: number[] = []): number[] {
  const excludedSet = new Set(excluded);
  return tiles.flatMap((tile, index) =>
    !tile.isSolved && !tile.isFlipped && !excludedSet.has(index) ? [index] : [],
  );
}

function randomFrom(values: number[]): number {
  return values[randomInt(0, values.length - 1)];
}

/** Return a retained matching pair that is still available, if one exists. */
export function recallKnownPair(
  store: AIMemoryStore,
  tiles: MatchTile[],
): [number, number] | null {
  const byValue = new Map<string, number[]>();
  for (const [rawIndex, value] of Object.entries(store.knownTiles)) {
    const index = Number(rawIndex);
    const tile = tiles[index];
    if (!tile || tile.isSolved || tile.isFlipped) continue;
    byValue.set(value, [...(byValue.get(value) ?? []), index]);
  }
  for (const indexes of byValue.values()) {
    if (indexes.length >= 2) return [indexes[0], indexes[1]];
  }
  return null;
}

export function chooseAIFirstTile(
  store: AIMemoryStore,
  tiles: MatchTile[],
  difficulty: MemoryDifficulty,
): number {
  const knownPair = recallKnownPair(store, tiles);
  if (knownPair) return knownPair[0];

  const available = activeIndexes(tiles);
  if (difficulty === "easy") return randomFrom(available);

  // Medium/Hard prefer unseen positions to maximize new information.
  const unknown = available.filter((index) => store.knownTiles[index] === undefined);
  return randomFrom(unknown.length > 0 ? unknown : available);
}

export function chooseAISecondTile(
  store: AIMemoryStore,
  tiles: MatchTile[],
  firstIndex: number,
  difficulty: MemoryDifficulty,
): number {
  const firstValue = tiles[firstIndex].value;

  // The first tile is face-up. Only use values retained through observation;
  // the AI cannot inspect any other hidden tile directly.
  const rememberedMatch = Object.entries(store.knownTiles).find(([rawIndex, value]) => {
    const index = Number(rawIndex);
    const tile = tiles[index];
    return (
      index !== firstIndex &&
      value === firstValue &&
      tile !== undefined &&
      !tile.isSolved &&
      !tile.isFlipped
    );
  });
  if (rememberedMatch) return Number(rememberedMatch[0]);

  const available = activeIndexes(tiles, [firstIndex]);
  if (difficulty === "easy") return randomFrom(available);
  const unknown = available.filter((index) => store.knownTiles[index] === undefined);
  return randomFrom(unknown.length > 0 ? unknown : available);
}

