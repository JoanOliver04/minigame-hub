"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { aiPickPrediction } from "./ai";
import { applyReveal, createHigherOrLowerMatch, previewReveal } from "./logic";
import type {
  HigherOrLowerConfig,
  HigherOrLowerMatch,
  Prediction,
  RevealState,
} from "./types";

export type HigherOrLowerPhase = "setup" | "playing" | "end";
export type HigherOrLowerStage = "choosing" | "revealing";

const REVEAL_MS = 850;
const FINAL_HOLD_MS = 650;

export function useHigherOrLower() {
  const [phase, setPhase] = useState<HigherOrLowerPhase>("setup");
  const [stage, setStage] = useState<HigherOrLowerStage>("choosing");
  const [match, setMatch] = useState<HigherOrLowerMatch | null>(null);
  const [reveal, setReveal] = useState<RevealState | null>(null);
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

  function startMatch(config: HigherOrLowerConfig) {
    clearTimers();
    setMatch(createHigherOrLowerMatch(config));
    setReveal(null);
    setStage("choosing");
    setPhase("playing");
  }

  function predict(playerPrediction: Prediction) {
    if (phase !== "playing" || stage !== "choosing" || !match || match.finished) return;
    if (playerPrediction === "same" && !match.config.allowSame) return;

    const aiPrediction = aiPickPrediction(match.currentCard, match.deck, match.config);
    const nextReveal = previewReveal(match, playerPrediction, aiPrediction);
    setReveal(nextReveal);
    setStage("revealing");
    playSound("blip");

    schedule(() => {
      const nextMatch = applyReveal(match, nextReveal);
      setMatch(nextMatch);
      playSound(
        nextReveal.playerCorrect ? "win" : nextReveal.aiCorrect ? "lose" : "error",
      );

      if (nextMatch.finished) {
        const outcome =
          nextMatch.winner === "player"
            ? "win"
            : nextMatch.winner === "ai"
              ? "loss"
              : "tie";
        record("higher-or-lower", outcome);
        schedule(() => setPhase("end"), FINAL_HOLD_MS);
      } else {
        setReveal(null);
        setStage("choosing");
      }
    }, REVEAL_MS);
  }

  function playAgain() {
    if (match) startMatch(match.config);
  }

  function toSetup() {
    clearTimers();
    setPhase("setup");
    setStage("choosing");
    setMatch(null);
    setReveal(null);
  }

  return { phase, stage, match, reveal, startMatch, predict, playAgain, toSetup };
}
