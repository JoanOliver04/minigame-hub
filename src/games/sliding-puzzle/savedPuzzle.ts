import { canMoveTile, isSlidingPuzzleSolved } from "./logic";
import type { SlidingPuzzleState } from "./types";

export function isPlayableBoard(value: unknown): value is SlidingPuzzleState {
  if (!value || typeof value !== "object") return false;
  const game = value as Partial<SlidingPuzzleState>;
  const { size, tiles } = game;
  if ((size !== 3 && size !== 4 && size !== 5) || game.solved !== false ||
      !Number.isSafeInteger(game.moves) || game.moves! < 0 || !Array.isArray(tiles)) return false;
  const count = size * size;
  if (tiles.length !== count || new Set(tiles).size !== count ||
      !tiles.every(tile => Number.isInteger(tile) && tile >= 0 && tile < count) ||
      tiles.indexOf(0) !== game.emptyIndex || isSlidingPuzzleSolved(tiles)) return false;
  const inversions = tiles.reduce((sum, tile, i) =>
    sum + tiles.slice(i + 1).filter(other => other !== 0 && other < tile).length, 0);
  const rowFromBottom = size - Math.floor(game.emptyIndex / size);
  return size % 2 === 1 ? inversions % 2 === 0 : (inversions + rowFromBottom) % 2 === 1;
}

export type FreeRun = { game: SlidingPuzzleState; undoIndex: number | null; elapsedMs: number };

export function readFreeRun(raw: string | null): FreeRun | null {
  if (!raw) return null;
  try {
    const run = JSON.parse(raw);
    if (!isPlayableBoard(run?.game) || !Number.isSafeInteger(run.elapsedMs) || run.elapsedMs < 0) return null;
    const undoIndex = run.game.moves > 0 && Number.isInteger(run.undoIndex) && canMoveTile(run.game, run.undoIndex)
      ? run.undoIndex : null;
    return { game: run.game, elapsedMs: run.elapsedMs, undoIndex };
  } catch {
    return null;
  }
}
