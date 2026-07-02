"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { resolvePenalty } from "./logic";
import type {
  PenaltyDifficulty,
  PenaltyResult,
  Point,
} from "./types";

export type PenaltyPhase = "setup" | "playing" | "end";
export type PenaltyStage = "aiming" | "flying" | "result";

export const TOTAL_KICKS = 5;
const RESULT_HOLD_MS = 1450;

export function usePenaltyKick() {
  const { record } = useScores();
  const [phase, setPhase] = useState<PenaltyPhase>("setup");
  const [stage, setStage] = useState<PenaltyStage>("aiming");
  const [difficulty, setDifficulty] =
    useState<PenaltyDifficulty>("medium");
  const [aim, setAim] = useState<Point>({ x: 50, y: 42 });
  const [power, setPower] = useState(70);
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [kicks, setKicks] = useState<PenaltyResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const goals = kicks.filter((kick) => kick.kind === "goal").length;

  function startMatch(nextDifficulty: PenaltyDifficulty) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDifficulty(nextDifficulty);
    setKicks([]);
    setAim({ x: 50, y: 42 });
    setPower(70);
    setResult(null);
    setStage("aiming");
    setPhase("playing");
  }

  function shoot() {
    if (stage !== "aiming") return;
    const kick = resolvePenalty(aim, power, difficulty);
    const nextKicks = [...kicks, kick];
    setResult(kick);
    setKicks(nextKicks);
    setStage("flying");
    playSound("blip");

    timerRef.current = setTimeout(() => {
      setStage("result");
      playSound(kick.kind === "goal" ? "win" : "lose");

      timerRef.current = setTimeout(() => {
        if (nextKicks.length === TOTAL_KICKS) {
          const finalGoals = nextKicks.filter(
            (item) => item.kind === "goal",
          ).length;
          record("penalty-kick", finalGoals >= 3 ? "win" : "loss");
          setPhase("end");
        } else {
          setResult(null);
          setStage("aiming");
        }
      }, RESULT_HOLD_MS);
    }, 620);
  }

  function toSetup() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("setup");
    setStage("aiming");
    setResult(null);
    setKicks([]);
  }

  return {
    phase,
    stage,
    aim,
    setAim,
    power,
    setPower,
    result,
    kicks,
    goals,
    startMatch,
    shoot,
    toSetup,
  };
}

