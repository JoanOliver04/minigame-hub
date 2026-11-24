import { createRng } from "@/lib/rng";
import { createSlidingPuzzle, isSlidingPuzzleSolved } from "./logic";
import type { SlidingPuzzleState } from "./types";

export function localDay(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function dailyBoard(day: string) {
  return createSlidingPuzzle(3, createRng(Number(day.replaceAll("-", ""))).next);
}

export type DailyBest = { moves: number; seconds: number };
export type DailyRun = { day: string; game: SlidingPuzzleState; startedAt: number };

export function readBest(raw: string | null): DailyBest | null {
  try {
    const best = JSON.parse(raw ?? "null");
    return best && Number.isSafeInteger(best.moves) && best.moves > 0 &&
      Number.isSafeInteger(best.seconds) && best.seconds >= 0 ? { moves: best.moves, seconds: best.seconds } : null;
  } catch {
    return null;
  }
}

export function betterResult(previous: DailyBest | null, next: DailyBest): DailyBest {
  if (!previous || next.moves < previous.moves || (next.moves === previous.moves && next.seconds < previous.seconds)) return next;
  return previous;
}

export function readDailyRun(raw: string | null, day: string): DailyRun | null {
  try {
    const run = JSON.parse(raw ?? "null");
    if (run?.day !== day || !Number.isSafeInteger(run.startedAt) || run.startedAt <= 0) return null;
    const game = run.game;
    if (game?.size !== 3 || game.solved !== false || !Number.isSafeInteger(game.moves) || game.moves < 0) return null;
    const tiles = game.tiles;
    if (!Array.isArray(tiles) || tiles.length !== 9 || new Set(tiles).size !== 9 ||
      !tiles.every((n) => Number.isInteger(n) && n >= 0 && n <= 8) ||
      tiles.indexOf(0) !== game.emptyIndex || isSlidingPuzzleSolved(tiles)) return null;
    const inversions = tiles.reduce((sum, tile, i) => sum + tiles.slice(i + 1).filter((other) => other && other < tile).length, 0);
    return inversions % 2 === 0 ? { day, game, startedAt: run.startedAt } : null;
  } catch {
    return null;
  }
}
