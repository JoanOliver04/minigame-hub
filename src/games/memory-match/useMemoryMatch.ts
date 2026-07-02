"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import {
  chooseAIFirstTile,
  chooseAISecondTile,
  createAIMemoryStore,
  observeTile,
  removeSolvedFromMemory,
} from "./ai";
import {
  createMemoryMatch,
  decideMemoryWinner,
  flipTile,
  hideTiles,
  otherActor,
  solveTiles,
} from "./logic";
import type {
  AIMemoryStore,
  MemoryActor,
  MemoryConfig,
  MemoryMatchState,
} from "./types";

export type MemoryPhase = "setup" | "playing" | "end";
export type MemoryStage = "choosing" | "ai-thinking" | "ai-flipping" | "resolving";

const SECOND_FLIP_MS = 480;
const PAIR_REVEAL_MS = 800;
const EXTRA_TURN_MS = 550;
const END_HOLD_MS = 650;

export function useMemoryMatch() {
  const [phase, setPhase] = useState<MemoryPhase>("setup");
  const [stage, setStage] = useState<MemoryStage>("choosing");
  const [match, setMatch] = useState<MemoryMatchState | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const memoryRef = useRef<AIMemoryStore>(createAIMemoryStore());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { record } = useScores();

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.length = 0;
  };

  const schedule = (fn: () => void, delay: number) => {
    timersRef.current.push(setTimeout(fn, delay));
  };

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function observe(current: MemoryMatchState, index: number) {
    memoryRef.current = observeTile(
      memoryRef.current,
      index,
      current.tiles[index].value,
      current.config.difficulty,
    );
  }

  function finish(next: MemoryMatchState) {
    const winner = decideMemoryWinner(next.playerPairs, next.aiPairs);
    const finished = { ...next, finished: true, winner };
    setMatch(finished);
    record("memory-match", winner === "player" ? "win" : winner === "ai" ? "loss" : "tie");
    schedule(() => setPhase("end"), END_HOLD_MS);
  }

  function scheduleAITurn(current: MemoryMatchState, delay = EXTRA_TURN_MS) {
    setStage("ai-thinking");
    const thinkingDelay = getUseDelay() ? Math.max(delay, 750) : 220;

    schedule(() => {
      const firstIndex = chooseAIFirstTile(
        memoryRef.current,
        current.tiles,
        current.config.difficulty,
      );
      const firstTiles = flipTile(current.tiles, firstIndex);
      const afterFirst = { ...current, tiles: firstTiles, feedback: null };
      observe(afterFirst, firstIndex);
      setMatch(afterFirst);
      setOpenIndexes([firstIndex]);
      setStage("ai-flipping");
      playSound("blip");

      schedule(() => {
        const secondIndex = chooseAISecondTile(
          memoryRef.current,
          firstTiles,
          firstIndex,
          current.config.difficulty,
        );
        const secondTiles = flipTile(firstTiles, secondIndex);
        const afterSecond = {
          ...afterFirst,
          tiles: secondTiles,
          aiMoves: afterFirst.aiMoves + 1,
        };
        observe(afterSecond, secondIndex);
        setMatch(afterSecond);
        setOpenIndexes([firstIndex, secondIndex]);
        setStage("resolving");
        playSound("blip");
        resolvePair(afterSecond, [firstIndex, secondIndex], "ai");
      }, SECOND_FLIP_MS);
    }, thinkingDelay);
  }

  function resolvePair(
    current: MemoryMatchState,
    indexes: [number, number],
    actor: MemoryActor,
  ) {
    const [first, second] = indexes;
    const isMatch = current.tiles[first].value === current.tiles[second].value;
    const withFeedback = {
      ...current,
      feedback: { kind: isMatch ? "match" : "miss", actor } as const,
    };
    setMatch(withFeedback);
    playSound(isMatch ? "win" : "error");

    schedule(() => {
      setOpenIndexes([]);

      if (isMatch) {
        const tiles = solveTiles(withFeedback.tiles, indexes);
        memoryRef.current = removeSolvedFromMemory(memoryRef.current, indexes);
        const next: MemoryMatchState = {
          ...withFeedback,
          tiles,
          playerPairs:
            withFeedback.playerPairs + (actor === "player" ? 1 : 0),
          aiPairs: withFeedback.aiPairs + (actor === "ai" ? 1 : 0),
        };
        if (tiles.every((tile) => tile.isSolved)) {
          finish(next);
        } else if (actor === "ai") {
          setMatch(next);
          scheduleAITurn(next);
        } else {
          setMatch(next);
          setStage("choosing");
        }
        return;
      }

      const next: MemoryMatchState = {
        ...withFeedback,
        tiles: hideTiles(withFeedback.tiles, indexes),
        turn: otherActor(actor),
      };
      setMatch(next);
      if (next.turn === "ai") scheduleAITurn(next);
      else setStage("choosing");
    }, PAIR_REVEAL_MS);
  }

  function startMatch(config: MemoryConfig) {
    clearTimers();
    memoryRef.current = createAIMemoryStore();
    setMatch(createMemoryMatch(config));
    setOpenIndexes([]);
    setStage("choosing");
    setPhase("playing");
  }

  function flipPlayerTile(index: number) {
    if (
      phase !== "playing" ||
      stage !== "choosing" ||
      !match ||
      match.finished ||
      match.turn !== "player"
    ) {
      return;
    }
    const tile = match.tiles[index];
    if (!tile || tile.isFlipped || tile.isSolved || openIndexes.length >= 2) return;

    const tiles = flipTile(match.tiles, index);
    const afterFlip = { ...match, tiles, feedback: null };
    observe(afterFlip, index);
    setMatch(afterFlip);
    playSound("blip");

    if (openIndexes.length === 0) {
      setOpenIndexes([index]);
      return;
    }

    const indexes: [number, number] = [openIndexes[0], index];
    const afterSecond = {
      ...afterFlip,
      playerMoves: afterFlip.playerMoves + 1,
    };
    setMatch(afterSecond);
    setOpenIndexes(indexes);
    setStage("resolving");
    resolvePair(afterSecond, indexes, "player");
  }

  function playAgain() {
    if (match) startMatch(match.config);
  }

  function toSetup() {
    clearTimers();
    memoryRef.current = createAIMemoryStore();
    setMatch(null);
    setOpenIndexes([]);
    setStage("choosing");
    setPhase("setup");
  }

  return {
    phase,
    stage,
    match,
    startMatch,
    flipPlayerTile,
    playAgain,
    toSetup,
  };
}

