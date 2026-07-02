"use client";

/**
 * Windline Archery — stateful match engine as a React hook.
 * Owns the 5-end flow, the oscillating release meter, aim inputs, sounds
 * and one-shot score recording. Physics/rules live in ./physics + ./logic,
 * the opponent in ./ai. The AI's arrow is generated when an end BEGINS, so
 * it can never react to the player's result (blueprint §9.3).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiAim } from "./ai";
import { matchTotals, matchWinner, resolveArrow, rollWind } from "./logic";
import type { ArcheryDifficulty, ArrowInput, EndState } from "./types";
import { TOTAL_ENDS } from "./types";

export type ArcheryPhase = "setup" | "playing" | "end";
export type ArcheryStage = "aim" | "meter" | "resolving";

const METER_TICK_MS = 30;
const METER_SPEED = 0.11;
const RELEASE_ERROR_SCALE = 0.6;

export function useWindlineArchery() {
  const [phase, setPhase] = useState<ArcheryPhase>("setup");
  const [difficulty, setDifficulty] = useState<ArcheryDifficulty>("medium");
  const [ends, setEnds] = useState<EndState[]>([]);
  const [currentEnd, setCurrentEnd] = useState(0);
  const [stage, setStage] = useState<ArcheryStage>("aim");
  const [angle, setAngle] = useState(10);
  const [windage, setWindage] = useState(0);
  const [power, setPower] = useState(60);
  const [meterValue, setMeterValue] = useState(0);
  const { record } = useScores();

  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const aiInputRef = useRef<ArrowInput | null>(null);
  const meterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterPhaseRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const stopMeter = useCallback(() => {
    if (meterTimerRef.current) {
      clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      stopMeter();
    };
  }, [stopMeter]);

  const startMatch = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopMeter();
    rngRef.current = createRng(randomSeed());
    recordedRef.current = false;
    const wind = rollWind(rngRef.current);
    aiInputRef.current = aiAim(wind, difficulty, rngRef.current);
    setEnds([{ wind, player: null, ai: null }]);
    setCurrentEnd(0);
    setStage("aim");
    setAngle(10);
    setWindage(0);
    setPower(60);
    setPhase("playing");
  }, [difficulty, stopMeter]);

  const startMeter = useCallback(() => {
    if (phase !== "playing" || stage !== "aim") return;
    setStage("meter");
    meterPhaseRef.current = 0;
    setMeterValue(0);
    stopMeter();
    meterTimerRef.current = setInterval(() => {
      meterPhaseRef.current += METER_SPEED;
      setMeterValue(Math.sin(meterPhaseRef.current));
    }, METER_TICK_MS);
  }, [phase, stage, stopMeter]);

  const release = useCallback(() => {
    if (phase !== "playing" || stage !== "meter") return;
    stopMeter();
    const releaseError = Math.sin(meterPhaseRef.current) * RELEASE_ERROR_SCALE;
    setStage("resolving");

    const endIndex = ends.length - 1;
    const end = ends[endIndex];
    const playerResult = resolveArrow(
      { angleDeg: angle, windageDeg: windage, power, releaseError },
      end.wind,
    );
    playSound(playerResult.score >= 8 ? "win" : playerResult.score >= 4 ? "blip" : "error");
    const withPlayer = ends.map((e, i) => (i === endIndex ? { ...e, player: playerResult } : e));
    setEnds(withPlayer);

    // The AI's arrow was committed when the end began.
    const aiInput = aiInputRef.current!;
    const aiDelay = getUseDelay() ? 1100 : 250;
    schedule(() => {
      const aiResult = resolveArrow(aiInput, end.wind);
      const withAi = withPlayer.map((e, i) => (i === endIndex ? { ...e, ai: aiResult } : e));
      setEnds(withAi);
      playSound(aiResult.score >= 8 ? "lose" : "blip");

      if (endIndex + 1 >= TOTAL_ENDS) {
        schedule(() => {
          if (!recordedRef.current) {
            recordedRef.current = true;
            const winner = matchWinner(matchTotals(withAi));
            record(
              "windline-archery",
              winner === "player" ? "win" : winner === "ai" ? "loss" : "tie",
            );
            playSound(winner === "player" ? "win" : winner === "ai" ? "lose" : "blip");
          }
          setPhase("end");
        }, 1400);
      } else {
        schedule(() => {
          const wind = rollWind(rngRef.current);
          aiInputRef.current = aiAim(wind, difficulty, rngRef.current);
          setEnds([...withAi, { wind, player: null, ai: null }]);
          setCurrentEnd(endIndex + 1);
          setStage("aim");
        }, 1500);
      }
    }, aiDelay);
  }, [phase, stage, ends, angle, windage, power, difficulty, stopMeter, schedule, record]);

  const playAgain = useCallback(() => startMatch(), [startMatch]);

  const toSetup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopMeter();
    setPhase("setup");
    setEnds([]);
    setCurrentEnd(0);
    setStage("aim");
  }, [stopMeter]);

  return {
    phase,
    difficulty,
    setDifficulty,
    ends,
    currentEnd,
    stage,
    angle,
    setAngle,
    windage,
    setWindage,
    power,
    setPower,
    meterValue,
    startMatch,
    startMeter,
    release,
    playAgain,
    toSetup,
  };
}
