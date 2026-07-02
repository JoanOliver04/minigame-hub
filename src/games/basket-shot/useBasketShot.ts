"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { resolveAiShot } from "./ai";
import {
  BASKET_ROUNDS,
  ROUND_POINTS,
  meterSpeed,
  resolvePlayerShot,
} from "./logic";
import type {
  BasketDifficulty,
  BasketRound,
  BasketShot,
} from "./types";

export type BasketPhase = "setup" | "playing" | "end";
export type BasketStage =
  | "player"
  | "player-flight"
  | "player-result"
  | "ai-flight"
  | "ai-result";

export function useBasketShot() {
  const { record } = useScores();
  const [phase, setPhase] = useState<BasketPhase>("setup");
  const [stage, setStage] = useState<BasketStage>("player");
  const [difficulty, setDifficulty] =
    useState<BasketDifficulty>("medium");
  const [roundIndex, setRoundIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [meter, setMeter] = useState(8);
  const [lastShot, setLastShot] = useState<BasketShot | null>(null);
  const [history, setHistory] = useState<BasketRound[]>([]);

  const meterRef = useRef(8);
  const directionRef = useRef(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  useEffect(() => {
    if (phase !== "playing" || stage !== "player") return;

    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(40, now - previous) / 1000;
      previous = now;
      let next =
        meterRef.current +
        directionRef.current * meterSpeed(difficulty) * elapsed;
      if (next >= 100) {
        next = 100;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }
      meterRef.current = next;
      setMeter(next);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [difficulty, phase, stage]);

  function startMatch(nextDifficulty: BasketDifficulty) {
    clearTimers();
    setDifficulty(nextDifficulty);
    setRoundIndex(0);
    setPlayerScore(0);
    setAiScore(0);
    setHistory([]);
    setLastShot(null);
    meterRef.current = 8;
    directionRef.current = 1;
    setMeter(8);
    setStage("player");
    setPhase("playing");
  }

  function shoot() {
    if (phase !== "playing" || stage !== "player") return;
    const points = ROUND_POINTS[roundIndex];
    const playerShot = resolvePlayerShot(
      meterRef.current,
      roundIndex + 1,
      points,
    );
    setLastShot(playerShot);
    setStage("player-flight");
    playSound("blip");

    schedule(() => {
      setStage("player-result");
      playSound(playerShot.made ? "win" : "lose");
    }, 720);

    schedule(() => {
      const aiShot = resolveAiShot(
        difficulty,
        roundIndex + 1,
        points,
      );
      setLastShot(aiShot);
      setStage("ai-flight");
      playSound("blip");

      schedule(() => {
        const nextPlayerScore =
          playerScore + (playerShot.made ? points : 0);
        const nextAiScore = aiScore + (aiShot.made ? points : 0);
        setPlayerScore(nextPlayerScore);
        setAiScore(nextAiScore);
        setHistory((previous) => [
          ...previous,
          {
            round: roundIndex + 1,
            points,
            player: playerShot,
            ai: aiShot,
          },
        ]);
        setStage("ai-result");
        playSound(aiShot.made ? "lose" : "win");

        schedule(() => {
          if (roundIndex + 1 === BASKET_ROUNDS) {
            record(
              "basket-shot",
              nextPlayerScore === nextAiScore
                ? "tie"
                : nextPlayerScore > nextAiScore
                  ? "win"
                  : "loss",
            );
            setPhase("end");
          } else {
            setRoundIndex((current) => current + 1);
            setLastShot(null);
            meterRef.current = 8;
            directionRef.current = 1;
            setMeter(8);
            setStage("player");
          }
        }, 1300);
      }, 720);
    }, 1900);
  }

  function toSetup() {
    clearTimers();
    setPhase("setup");
    setStage("player");
    setLastShot(null);
    setHistory([]);
  }

  return {
    phase,
    stage,
    roundIndex,
    points: ROUND_POINTS[roundIndex] ?? 3,
    playerScore,
    aiScore,
    meter,
    lastShot,
    history,
    startMatch,
    shoot,
    toSetup,
  };
}

