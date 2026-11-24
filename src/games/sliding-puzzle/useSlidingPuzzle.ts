"use client";

import { useEffect, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { dailyBoard } from "./daily";
import { createSlidingPuzzle, moveSlidingTile } from "./logic";
import type { SlidingPuzzleConfig, SlidingPuzzleState } from "./types";
import { loadDailyRun, saveDailyBest, saveDailyRun } from "./useDailyChallenge";

type Match = { game: SlidingPuzzleState; startedAt: number | null };

function elapsed(start: number | null, end: number) {
  return start === null ? 0 : Math.max(0, Math.floor((end - start) / 1000));
}

export function useSlidingPuzzle(dailyDay?: string) {
  const [match, setMatch] = useState<Match | null>(() => dailyDay
    ? loadDailyRun(dailyDay) ?? { game: dailyBoard(dailyDay), startedAt: null }
    : null);
  const [now, setNow] = useState(Date.now);
  const [previousBoard, setPreviousBoard] = useState<SlidingPuzzleState | null>(null);
  const { record } = useScores();
  const game = match?.game;
  const startedAt = match?.startedAt ?? null;
  const phase = !game ? "setup" : game.solved ? "end" : "playing";

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [startedAt, phase]);

  function start({ size }: SlidingPuzzleConfig) {
    const time = Date.now();
    setNow(time);
    setPreviousBoard(null);
    setMatch(dailyDay
      ? { game: dailyBoard(dailyDay), startedAt: null }
      : { game: createSlidingPuzzle(size), startedAt: time });
  }

  function move(index: number) {
    if (!match || match.game.solved) return;
    const next = moveSlidingTile(match.game, index);
    if (next === match.game) return;
    if (!dailyDay) setPreviousBoard(match.game);
    const time = Date.now();
    const startTime = match.startedAt ?? time;
    setMatch({ game: next, startedAt: startTime });
    setNow(time);
    playSound(next.solved ? "win" : "blip");
    if (dailyDay) {
      saveDailyRun(next.solved ? null : { day: dailyDay, game: next, startedAt: startTime });
      if (next.solved) saveDailyBest(dailyDay, { moves: next.moves, seconds: elapsed(startTime, time) });
    }
    if (next.solved) record("sliding-puzzle", "win");
  }

  return {
    phase, game, seconds: elapsed(startedAt, now), start, move, canUndo: previousBoard !== null,
    undo: () => {
      if (dailyDay || !match || !previousBoard || match.game.solved) return;
      setMatch({ ...match, game: previousBoard });
      setPreviousBoard(null);
    },
    playAgain: () => { if (game) start({ size: game.size }); },
    toSetup: () => setMatch(null),
  };
}
