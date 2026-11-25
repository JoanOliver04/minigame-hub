"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useScores } from "@/context/ScoresContext";
import { readValue, subscribeValue, writeValue } from "@/lib/browserStorage";
import { playSound } from "@/lib/sound";
import { dailyBoard } from "./daily";
import { createSlidingPuzzle, moveSlidingTile } from "./logic";
import { freePuzzleKey as freeKey, readFreeRun, type FreeRun } from "./savedPuzzle";
import type { SlidingPuzzleConfig } from "./types";
import { loadDailyRun, saveDailyBest, saveDailyRun } from "./useDailyChallenge";

type Match = FreeRun & { startedAt: number | null };
const subscribeFree = (notify: () => void) => subscribeValue(freeKey, notify);
const getFree = () => readValue(freeKey);
const empty = () => null;

function elapsed(match: Match, end: number) {
  return match.elapsedMs + (match.startedAt === null ? 0 : Math.max(0, end - match.startedAt));
}

function serialize(match: Match, time: number) {
  return JSON.stringify({ game: match.game, undoIndex: match.undoIndex, elapsedMs: elapsed(match, time) });
}

export function useSlidingPuzzle(dailyDay?: string, resumeSaved = false) {
  const [match, setMatch] = useState<Match | null>(() => {
    if (!dailyDay) {
      const run = resumeSaved ? readFreeRun(getFree()) : null;
      return run ? { ...run, startedAt: run.game.moves ? Date.now() : null } : null;
    }
    const run = loadDailyRun(dailyDay);
    return { game: run?.game ?? dailyBoard(dailyDay), startedAt: run?.startedAt ?? null, elapsedMs: 0, undoIndex: null };
  });
  const [now, setNow] = useState(Date.now);
  const activeFree = useRef<Match | null>(dailyDay ? null : match);
  const lastSaved = useRef<string | null>(resumeSaved ? getFree() : null);
  const raw = useSyncExternalStore(subscribeFree, getFree, empty);
  const saved = useMemo(() => !match && !dailyDay ? readFreeRun(raw) : null, [match, dailyDay, raw]);
  const { record } = useScores();
  const game = match?.game;
  const startedAt = match?.startedAt ?? null;
  const phase = !game ? "setup" : game.solved ? "end" : "playing";

  function commit(next: Match, time: number) {
    setMatch(next);
    setNow(time);
    if (dailyDay) return;
    activeFree.current = next.game.solved ? null : next;
    lastSaved.current = next.game.solved ? null : serialize(next, time);
    writeValue(freeKey, lastSaved.current);
  }

  useEffect(() => {
    if (dailyDay) return;
    function suspend() {
      const current = activeFree.current;
      if (!current || current.startedAt === null) return;
      const time = Date.now();
      const paused = { ...current, elapsedMs: elapsed(current, time), startedAt: null };
      activeFree.current = paused;
      // Leaving an older tab must not replace a newer board from another tab.
      if (lastSaved.current === getFree()) {
        lastSaved.current = serialize(paused, time);
        writeValue(freeKey, lastSaved.current);
      }
      return paused;
    }
    function visibility() {
      const current = activeFree.current;
      if (!current) return;
      if (document.hidden) {
        const paused = suspend();
        if (paused) setMatch(paused);
      } else if (current.startedAt === null) {
        const time = Date.now();
        activeFree.current = { ...current, startedAt: time };
        setMatch(activeFree.current);
        setNow(time);
      }
    }
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", suspend);
    window.addEventListener("pageshow", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", suspend);
      window.removeEventListener("pageshow", visibility);
      suspend();
    };
  }, [dailyDay]);

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
    commit({ game: dailyDay ? dailyBoard(dailyDay) : createSlidingPuzzle(size),
      startedAt: dailyDay ? null : time, elapsedMs: 0, undoIndex: null }, time);
  }

  function move(index: number) {
    if (!match || match.game.solved) return;
    const next = moveSlidingTile(match.game, index);
    if (next === match.game) return;
    const time = Date.now();
    const startTime = match.startedAt ?? time;
    commit({ ...match, game: next, startedAt: startTime, undoIndex: dailyDay ? null : match.game.emptyIndex }, time);
    playSound(next.solved ? "win" : "blip");
    if (dailyDay) {
      saveDailyRun(next.solved ? null : { day: dailyDay, game: next, startedAt: startTime });
      if (next.solved) saveDailyBest(dailyDay, { moves: next.moves, seconds: Math.max(0, Math.floor((time - startTime) / 1000)) });
    }
    if (next.solved) record("sliding-puzzle", "win");
  }

  return {
    phase, game, seconds: match ? Math.floor(elapsed(match, now) / 1000) : 0, start, move, saved,
    resume: () => {
      const run = readFreeRun(getFree());
      if (!run || dailyDay) return;
      const time = Date.now();
      commit({ ...run, startedAt: time }, time);
    },
    canUndo: match?.undoIndex != null,
    undo: () => {
      if (dailyDay || !match || match.undoIndex === null || match.game.solved) return;
      const previous = moveSlidingTile(match.game, match.undoIndex);
      commit({ ...match, game: { ...previous, moves: match.game.moves - 1 }, undoIndex: null }, Date.now());
    },
    playAgain: () => { if (game) start({ size: game.size }); },
    toSetup: () => setMatch(null),
  };
}
