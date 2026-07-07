"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { createSlidingPuzzle, moveSlidingTile } from "./logic";
import type { SlidingPuzzleConfig, SlidingPuzzleState } from "./types";

export type SlidingPuzzlePhase = "setup" | "playing" | "end";

export function useSlidingPuzzle() {
  const [phase, setPhase] = useState<SlidingPuzzlePhase>("setup");
  const [game, setGame] = useState<SlidingPuzzleState | null>(null);
  const [config, setConfig] = useState<SlidingPuzzleConfig | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (phase !== "playing" || game?.solved) return;
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [game?.solved, phase]);

  useEffect(() => {
    if (!game?.solved || recordedRef.current) return;
    recordedRef.current = true;
    record("sliding-puzzle", "win");
    playSound("win");
    setPhase("end");
  }, [game, record]);

  function start(nextConfig: SlidingPuzzleConfig) {
    recordedRef.current = false;
    setSeconds(0);
    setConfig(nextConfig);
    setGame(createSlidingPuzzle(nextConfig.size));
    setPhase("playing");
  }

  function move(index: number) {
    if (!game || phase !== "playing") return;
    const next = moveSlidingTile(game, index);
    if (next !== game) {
      setGame(next);
      playSound(next.solved ? "win" : "blip");
    }
  }

  function playAgain() {
    if (config) start(config);
  }

  function toSetup() {
    setGame(null);
    setSeconds(0);
    setPhase("setup");
  }

  return { phase, game, seconds, start, move, playAgain, toSetup };
}
