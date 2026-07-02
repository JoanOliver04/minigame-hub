"use client";

/**
 * Circuit Breaker — stateful match engine as a React hook.
 *
 * A real-time tick loop resolves both cycles' moves simultaneously
 * (blueprint §8.2): the player's pending key press (or "straight" by
 * default) and the AI's independently-computed action are collected BEFORE
 * either is applied, so neither side has a first-mover advantage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import { aiPickAction } from "./ai";
import { createRound, resolveTick } from "./logic";
import type { BreakerDifficulty, BreakerState, TurnAction } from "./types";
import { ROUND_TARGET } from "./types";

export type BreakerPhase = "setup" | "playing" | "end";

const TICK_MS = 160;
const ROUND_TRANSITION_MS = 1400;

export function useCircuitBreaker() {
  const [phase, setPhase] = useState<BreakerPhase>("setup");
  const [difficulty, setDifficulty] = useState<BreakerDifficulty>("medium");
  const [round, setRound] = useState<BreakerState>(() => createRound());
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [ties, setTies] = useState(0);
  const [running, setRunning] = useState(false);
  const { record } = useScores();

  const pendingActionRef = useRef<TurnAction>("straight");
  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchRecordedRef = useRef(false);
  const roundRef = useRef<BreakerState>(round);
  const runningRef = useRef(false);
  const winsRef = useRef({ player: 0, ai: 0 });
  const scheduleTickRef = useRef<() => void>(() => {});

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const clearTimers = useCallback(() => {
    if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    tickTimerRef.current = null;
    advanceTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const scheduleTick = useCallback(() => {
    tickTimerRef.current = setTimeout(() => {
      if (!runningRef.current) return;
      const current = roundRef.current;
      const playerAction = pendingActionRef.current;
      pendingActionRef.current = "straight";
      const aiAction = aiPickAction(current, difficulty, rngRef.current);
      const next = resolveTick(current, playerAction, aiAction);
      roundRef.current = next;
      setRound(next);

      if (next.status === "round-over") {
        runningRef.current = false;
        setRunning(false);
        if (next.roundResult === "player") {
          winsRef.current.player += 1;
          setPlayerWins(winsRef.current.player);
          playSound("win");
        } else if (next.roundResult === "ai") {
          winsRef.current.ai += 1;
          setAiWins(winsRef.current.ai);
          playSound("lose");
        } else {
          setTies((t) => t + 1);
          playSound("blip");
        }

        const matchDone = winsRef.current.player >= ROUND_TARGET || winsRef.current.ai >= ROUND_TARGET;
        advanceTimerRef.current = setTimeout(() => {
          if (matchDone) {
            if (!matchRecordedRef.current) {
              matchRecordedRef.current = true;
              record(
                "circuit-breaker",
                winsRef.current.player > winsRef.current.ai ? "win" : "loss",
              );
            }
            setPhase("end");
          } else {
            const fresh = createRound();
            roundRef.current = fresh;
            setRound(fresh);
            runningRef.current = true;
            setRunning(true);
            scheduleTickRef.current();
          }
        }, ROUND_TRANSITION_MS);
        return;
      }
      scheduleTickRef.current();
    }, TICK_MS);
  }, [difficulty, record]);

  useEffect(() => {
    scheduleTickRef.current = scheduleTick;
  }, [scheduleTick]);

  const startMatch = useCallback(() => {
    clearTimers();
    rngRef.current = createRng(randomSeed());
    matchRecordedRef.current = false;
    winsRef.current = { player: 0, ai: 0 };
    pendingActionRef.current = "straight";
    setPlayerWins(0);
    setAiWins(0);
    setTies(0);
    const fresh = createRound();
    roundRef.current = fresh;
    setRound(fresh);
    runningRef.current = true;
    setRunning(true);
    setPhase("playing");
    scheduleTick();
  }, [clearTimers, scheduleTick]);

  const setPendingAction = useCallback((action: TurnAction) => {
    pendingActionRef.current = action;
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        e.preventDefault();
        setPendingAction("left");
      } else if (key === "arrowright" || key === "d") {
        e.preventDefault();
        setPendingAction("right");
      } else if (key === "arrowup" || key === "w" || key === " ") {
        e.preventDefault();
        setPendingAction("straight");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, setPendingAction]);

  const playAgain = useCallback(() => startMatch(), [startMatch]);

  const toSetup = useCallback(() => {
    clearTimers();
    runningRef.current = false;
    setRunning(false);
    setPhase("setup");
  }, [clearTimers]);

  return {
    phase,
    difficulty,
    setDifficulty,
    round,
    playerWins,
    aiWins,
    ties,
    running,
    startMatch,
    setPendingAction,
    playAgain,
    toSetup,
  };
}
