import { createRng } from "@/lib/rng";
import { createSlidingPuzzle } from "./logic";
import { isPlayableBoard } from "./savedPuzzle";
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
    return game?.size === 3 && isPlayableBoard(game) ? { day, game, startedAt: run.startedAt } : null;
  } catch {
    return null;
  }
}
