"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { planKeeper } from "./ai";
import { estimateShot, resolvePenalty } from "./logic";
import type {
  PenaltyDifficulty,
  PenaltyResult,
  Point,
  ShotStyle,
} from "./types";

export type PenaltyPhase = "setup" | "playing" | "end";
export type PenaltyStage = "aiming" | "flying" | "result";

export const TOTAL_KICKS = 5;
const FLIGHT_MS = 720;
const RESULT_HOLD_MS = 2300;

export function usePenaltyKick() {
  const { record } = useScores();
  const [phase, setPhase] = useState<PenaltyPhase>("setup");
  const [stage, setStage] = useState<PenaltyStage>("aiming");
  const [difficulty, setDifficulty] =
    useState<PenaltyDifficulty>("medium");
  const [aim, setAim] = useState<Point>({ x: 50, y: 43 });
  const [power, setPower] = useState(68);
  const [style, setStyle] = useState<ShotStyle>("placed");
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [kicks, setKicks] = useState<PenaltyResult[]>([]);
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

  const goals = kicks.filter((kick) => kick.kind === "goal").length;
  const saves = kicks.filter((kick) => kick.kind === "saved").length;
  const misses = kicks.filter(
    (kick) => kick.kind === "miss" || kick.kind === "post",
  ).length;
  const onTarget = goals + saves;
  const bestQuality = kicks.reduce(
    (best, kick) => Math.max(best, kick.quality),
    0,
  );
  const estimate = estimateShot(aim, power, style);

  function startMatch(nextDifficulty: PenaltyDifficulty) {
    clearTimers();
    setDifficulty(nextDifficulty);
    setKicks([]);
    setAim({ x: 50, y: 43 });
    setPower(68);
    setStyle("placed");
    setResult(null);
    setStage("aiming");
    setPhase("playing");
  }

  function chooseStyle(nextStyle: ShotStyle) {
    if (stage !== "aiming") return;
    setStyle(nextStyle);
    setPower(
      nextStyle === "placed" ? 68 : nextStyle === "power" ? 86 : 56,
    );
  }

  function shoot() {
    if (phase !== "playing" || stage !== "aiming") return;
    const keeperPlan = planKeeper(
      aim,
      difficulty,
      kicks,
      style,
      power,
    );
    const kick = resolvePenalty(aim, power, style, keeperPlan);
    const nextKicks = [...kicks, kick];
    setResult(kick);
    setKicks(nextKicks);
    setStage("flying");
    playSound("blip");

    schedule(() => {
      setStage("result");
      playSound(
        kick.kind === "goal"
          ? "win"
          : kick.kind === "post"
            ? "error"
            : "lose",
      );

      schedule(() => {
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
    }, FLIGHT_MS);
  }

  function toSetup() {
    clearTimers();
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
    style,
    result,
    kicks,
    goals,
    saves,
    misses,
    onTarget,
    bestQuality,
    estimate,
    startMatch,
    chooseStyle,
    shoot,
    toSetup,
  };
}
