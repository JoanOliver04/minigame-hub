"use client";

/**
 * Neon Drift — stateful match engine as a React hook.
 *
 * The render loop (rAF) accumulates real elapsed time and steps the fixed
 * physics sim a whole number of FIXED_DT ticks (blueprint §5.2), so the
 * simulation is display-refresh-independent and deterministic. Player
 * input is read from a ref updated by keyboard/touch handlers; the AI runs
 * the same physics with its own control input each tick. rAF + the
 * AudioContext-free sound calls are all cancelled on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { isMotionReduced } from "@/lib/motion";
import { loadPref, savePref } from "@/lib/prefs";
import { playSound } from "@/lib/sound";
import { aiControl, createAiMemory, type AiMemory } from "./ai";
import { boostEfficiency, raceResult, type RaceOutcome } from "./logic";
import { initialCar, stepCar } from "./physics";
import { getTrack, type TrackDef } from "./tracks";
import type { CarState, ControlInput, DriftDifficulty } from "./types";
import { FIXED_DT, MAX_FRAME_DELTA, TOTAL_LAPS } from "./types";

export type DriftPhase = "setup" | "racing" | "end";

const BEST_LAP_PREF_KEY = "neonDrift.bestLap";
const BEST_LAP_VERSION = 1;
const COUNTDOWN_S = 3;

const NEUTRAL_INPUT: ControlInput = { steer: 0, throttle: 0, brake: 0, boost: false };

export function useNeonDrift() {
  const [phase, setPhase] = useState<DriftPhase>("setup");
  const [difficulty, setDifficulty] = useState<DriftDifficulty>("medium");
  const [trackId, setTrackId] = useState("circuit");
  const [player, setPlayer] = useState<CarState | null>(null);
  const [ai, setAi] = useState<CarState | null>(null);
  const [raceTime, setRaceTime] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_S);
  const [outcome, setOutcome] = useState<RaceOutcome | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const { record } = useScores();

  const playerRef = useRef<CarState | null>(null);
  const aiRef = useRef<CarState | null>(null);
  const inputRef = useRef<ControlInput>({ ...NEUTRAL_INPUT });
  const trackRef = useRef<TrackDef>(getTrack("circuit"));
  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const aiMemoryRef = useRef<AiMemory>(createAiMemory());
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const accumulatorRef = useRef(0);
  const raceTimeRef = useRef(0);
  const startAtRef = useRef(0);
  const recordedRef = useRef(false);
  const loopRef = useRef<(ts: number) => void>(() => {});

  const [activeTrack, setActiveTrack] = useState<TrackDef>(getTrack("circuit"));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot
    setReducedMotion(isMotionReduced());
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const finish = useCallback(
    (p: CarState, a: CarState) => {
      stopLoop();
      const result = raceResult(p, a);
      setOutcome(result);
      setPlayer(p);
      setAi(a);
      if (!recordedRef.current) {
        recordedRef.current = true;
        record("neon-drift", result === "player" ? "win" : result === "ai" ? "loss" : "tie");
        playSound(result === "player" ? "win" : result === "ai" ? "lose" : "blip");
        // Personal best lap is stored per track, separate from W/L/T.
        if (p.bestLap !== null) {
          const stored =
            loadPref<{ track: string; time: number }[]>(BEST_LAP_PREF_KEY, BEST_LAP_VERSION) ?? [];
          const existing = stored.find((e) => e.track === trackRef.current.id);
          if (!existing || p.bestLap < existing.time) {
            const next = stored.filter((e) => e.track !== trackRef.current.id);
            next.push({ track: trackRef.current.id, time: p.bestLap });
            savePref(BEST_LAP_PREF_KEY, BEST_LAP_VERSION, next);
            setPersonalBest(p.bestLap);
          } else {
            setPersonalBest(existing.time);
          }
        }
      }
      setPhase("end");
    },
    [record, stopLoop],
  );

  const loop = useCallback(
    (ts: number) => {
      const track = trackRef.current;
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      // Clamp so a backgrounded tab cannot advance a huge chunk at once.
      const frameDelta = Math.min(MAX_FRAME_DELTA, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      // Countdown phase: no physics, just tick down.
      if (raceTimeRef.current < 0) {
        raceTimeRef.current += frameDelta;
        setCountdown(Math.max(0, Math.ceil(-raceTimeRef.current)));
        if (raceTimeRef.current >= 0) {
          raceTimeRef.current = 0;
          setCountdown(0);
        }
        rafRef.current = requestAnimationFrame((next) => loopRef.current(next));
        return;
      }

      accumulatorRef.current += frameDelta;
      let p = playerRef.current!;
      let a = aiRef.current!;
      while (accumulatorRef.current >= FIXED_DT) {
        const elapsed = raceTimeRef.current;
        p = stepCar(p, inputRef.current, track, elapsed);
        const aInput = aiControl(a, track, difficulty, rngRef.current, aiMemoryRef.current);
        a = stepCar(a, aInput, track, elapsed);
        raceTimeRef.current += FIXED_DT;
        accumulatorRef.current -= FIXED_DT;
      }
      playerRef.current = p;
      aiRef.current = a;
      setPlayer(p);
      setAi(a);
      setRaceTime(raceTimeRef.current);

      if (p.finished && a.finished) {
        finish(p, a);
        return;
      }
      rafRef.current = requestAnimationFrame((next) => loopRef.current(next));
    },
    [difficulty, finish],
  );

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const startRace = useCallback(() => {
    stopLoop();
    const track = getTrack(trackId);
    trackRef.current = track;
    setActiveTrack(track);
    rngRef.current = createRng(randomSeed());
    aiMemoryRef.current = createAiMemory();
    recordedRef.current = false;

    const p = initialCar(track);
    const a = initialCar(track);
    playerRef.current = p;
    aiRef.current = a;
    // Throttle auto-held from the green light; physics is frozen during the
    // countdown anyway (raceTimeRef < 0), so this can't jump the start.
    inputRef.current = { ...NEUTRAL_INPUT, throttle: 1 };
    setPlayer(p);
    setAi(a);
    setOutcome(null);
    setPersonalBest(null);
    setRaceTime(0);
    setCountdown(COUNTDOWN_S);

    lastTsRef.current = 0;
    accumulatorRef.current = 0;
    raceTimeRef.current = -COUNTDOWN_S;
    startAtRef.current = 0;
    setPhase("racing");
    rafRef.current = requestAnimationFrame((ts) => loopRef.current(ts));
  }, [trackId, stopLoop]);

  const setInput = useCallback((partial: Partial<ControlInput>) => {
    inputRef.current = { ...inputRef.current, ...partial };
  }, []);

  // Keyboard controls. Throttle is auto-held (blueprint §5.3: held
  // automatically on mobile, and an always-on throttle keeps desktop and
  // touch identical); the player steers, brakes, and boosts.
  useEffect(() => {
    if (phase !== "racing") return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") setInput({ steer: -1 });
      else if (k === "arrowright" || k === "d") setInput({ steer: 1 });
      else if (k === "arrowdown" || k === "s") setInput({ brake: 1 });
      else if (k === " ") setInput({ boost: true });
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d") setInput({ steer: 0 });
      else if (k === "arrowdown" || k === "s") setInput({ brake: 0 });
      else if (k === " ") setInput({ boost: false });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, setInput]);

  const playAgain = useCallback(() => startRace(), [startRace]);

  const toSetup = useCallback(() => {
    stopLoop();
    setPhase("setup");
  }, [stopLoop]);

  return {
    phase,
    difficulty,
    setDifficulty,
    trackId,
    setTrackId,
    player,
    ai,
    raceTime,
    countdown,
    outcome,
    personalBest,
    track: activeTrack,
    reducedMotion,
    startRace,
    setInput,
    playAgain,
    toSetup,
    boostEfficiency,
    totalLaps: TOTAL_LAPS,
  };
}
