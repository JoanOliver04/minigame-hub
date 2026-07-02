"use client";

/**
 * Beat Reactor — stateful match engine as a React hook.
 *
 * Judgement uses the Web Audio clock exclusively (blueprint §6.2/6.7): every
 * timing comparison reads `audio.currentTime`, never `Date.now()` or a
 * visual position. A single requestAnimationFrame loop drives note
 * rendering, auto-miss sweeping, and AI hit resolution; it is cancelled on
 * unmount along with the AudioContext.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed } from "@/lib/rng";
import { loadPref, savePref } from "@/lib/prefs";
import { ReactorAudio } from "./audio";
import { precomputeAiHits } from "./ai";
import { generateChart } from "./generation";
import { collectAutoMisses, comboMultiplier, findTarget, hitScore, judge } from "./logic";
import type {
  AiHit,
  Bars,
  BeatEvent,
  Bpm,
  ChartDensity,
  HitRecord,
  Judgement,
  Lane,
  ReactorDifficulty,
} from "./types";
import { LANE_KEYS } from "./types";

export type ReactorPhase = "setup" | "playing" | "end";

const CALIBRATION_PREF_KEY = "beatReactor.calibration";
const CALIBRATION_VERSION = 1;
const LEAD_IN_S = 1.5;
const END_HOLD_MS = 1600;

interface LaneFlashState {
  lane: Lane;
  judgement: Judgement;
  key: number;
}

export function useBeatReactor() {
  const [phase, setPhase] = useState<ReactorPhase>("setup");
  const [bpm, setBpm] = useState<Bpm>(110);
  const [bars, setBars] = useState<Bars>(12);
  const [density, setDensity] = useState<ChartDensity>("normal");
  const [difficulty, setDifficulty] = useState<ReactorDifficulty>("medium");
  const [calibrationMs, setCalibrationMs] = useState(0);
  const [muted, setMuted] = useState(false);

  const [events, setEvents] = useState<BeatEvent[]>([]);
  const [nowTime, setNowTime] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerCombo, setPlayerCombo] = useState(0);
  const [aiCombo, setAiCombo] = useState(0);
  const [playerBestCombo, setPlayerBestCombo] = useState(0);
  const [aiBestCombo, setAiBestCombo] = useState(0);
  const [playerHistory, setPlayerHistory] = useState<HitRecord[]>([]);
  const [aiHistory, setAiHistory] = useState<HitRecord[]>([]);
  const [flash, setFlash] = useState<LaneFlashState | null>(null);
  const [reactorShake, setReactorShake] = useState(0);
  const [songDone, setSongDone] = useState(false);

  const { record } = useScores();
  const audioRef = useRef<ReactorAudio | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resolvedPlayerRef = useRef<Set<number>>(new Set());
  const resolvedAiRef = useRef<Set<number>>(new Set());
  const aiHitsRef = useRef<AiHit[]>([]);
  const eventsRef = useRef<BeatEvent[]>([]);
  const scoreRecordedRef = useRef(false);
  const flashKeyRef = useRef(0);
  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const playerComboRef = useRef(0);
  const aiComboRef = useRef(0);
  const loopRef = useRef<() => void>(() => {});

  useEffect(() => {
    // One-shot post-hydration load, same pattern as ScoresContext.
    const stored = loadPref<number>(CALIBRATION_PREF_KEY, CALIBRATION_VERSION);
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalibrationMs(stored);
    }
  }, []);

  useEffect(() => {
    audioRef.current = new ReactorAudio();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timerRef.current.forEach(clearTimeout);
      audioRef.current?.dispose();
    };
  }, []);

  const setCalibration = useCallback((value: number) => {
    setCalibrationMs(value);
    savePref(CALIBRATION_PREF_KEY, CALIBRATION_VERSION, value);
  }, []);

  const finish = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (!scoreRecordedRef.current) {
      scoreRecordedRef.current = true;
      const outcome =
        playerScoreRef.current > aiScoreRef.current
          ? "win"
          : playerScoreRef.current < aiScoreRef.current
            ? "loss"
            : "tie";
      record("beat-reactor", outcome);
    }
    setSongDone(true);
    timerRef.current.push(setTimeout(() => setPhase("end"), END_HOLD_MS));
  }, [record]);

  const loop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setNowTime(t);

    // --- AI resolution: precomputed, cannot see player judgements ---
    for (const hit of aiHitsRef.current) {
      if (resolvedAiRef.current.has(hit.eventId)) continue;
      const event = eventsRef.current.find((e) => e.id === hit.eventId);
      if (!event) continue;
      const pressTime =
        hit.timingErrorMs === null ? event.hitTime + 0.2 : event.hitTime + hit.timingErrorMs / 1000;
      if (t < pressTime) continue;
      resolvedAiRef.current.add(hit.eventId);
      const j: Judgement = hit.timingErrorMs === null ? "miss" : judge(hit.timingErrorMs);
      const gained = hitScore(j, aiComboRef.current);
      const nextCombo = j === "miss" ? 0 : aiComboRef.current + 1;
      aiComboRef.current = nextCombo;
      aiScoreRef.current += gained;
      setAiScore(aiScoreRef.current);
      setAiCombo(nextCombo);
      setAiBestCombo((best) => Math.max(best, nextCombo));
      setAiHistory((h) => [
        ...h,
        { eventId: hit.eventId, lane: event.lane, judgement: j, timingErrorMs: hit.timingErrorMs, actor: "ai" },
      ]);
    }

    // --- player auto-miss sweep ---
    const misses = collectAutoMisses(eventsRef.current, resolvedPlayerRef.current, t);
    if (misses.length > 0) {
      for (const event of misses) resolvedPlayerRef.current.add(event.id);
      playerComboRef.current = 0;
      setPlayerCombo(0);
      setPlayerHistory((h) => [
        ...h,
        ...misses.map((event) => ({
          eventId: event.id,
          lane: event.lane,
          judgement: "miss" as Judgement,
          timingErrorMs: null,
          actor: "player" as const,
        })),
      ]);
    }

    const lastEvent = eventsRef.current[eventsRef.current.length - 1];
    const songEndTime = lastEvent ? lastEvent.hitTime + 0.6 : LEAD_IN_S;
    if (t >= songEndTime && eventsRef.current.length > 0) {
      finish();
      return;
    }
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [finish]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const startMatch = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    scoreRecordedRef.current = false;

    const audio = audioRef.current ?? new ReactorAudio();
    audioRef.current = audio;
    audio.ensureStarted();

    const rng = createRng(randomSeed());
    const chart = generateChart({ seed: randomSeed(), bpm, bars, density }, rng);
    const aiHits = precomputeAiHits(chart, difficulty, rng);

    eventsRef.current = chart;
    aiHitsRef.current = aiHits;
    resolvedPlayerRef.current = new Set();
    resolvedAiRef.current = new Set();
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    playerComboRef.current = 0;
    aiComboRef.current = 0;

    setEvents(chart);
    setPlayerScore(0);
    setAiScore(0);
    setPlayerCombo(0);
    setAiCombo(0);
    setPlayerBestCombo(0);
    setAiBestCombo(0);
    setPlayerHistory([]);
    setAiHistory([]);
    setFlash(null);
    setSongDone(false);
    setNowTime(0);
    setPhase("playing");

    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [bpm, bars, density, difficulty]);

  const hitLane = useCallback(
    (lane: Lane) => {
      const audio = audioRef.current;
      if (!audio || phase !== "playing" || songDone) return;
      const t = audio.currentTime + calibrationMs / 1000;
      const target = findTarget(eventsRef.current, resolvedPlayerRef.current, lane, t);
      audio.playLaneTone(lane, false, muted);

      if (!target) return; // off-lane tap: no penalty, just no hit
      resolvedPlayerRef.current.add(target.id);
      const errorMs = (t - target.hitTime) * 1000;
      const j = judge(errorMs);
      audio.playFeedback(j);

      const gained = hitScore(j, playerComboRef.current);
      const nextCombo = j === "miss" ? 0 : playerComboRef.current + 1;
      playerComboRef.current = nextCombo;
      playerScoreRef.current += gained;
      setPlayerScore(playerScoreRef.current);
      setPlayerCombo(nextCombo);
      setPlayerBestCombo((best) => Math.max(best, nextCombo));
      setPlayerHistory((h) => [
        ...h,
        { eventId: target.id, lane, judgement: j, timingErrorMs: errorMs, actor: "player" },
      ]);
      flashKeyRef.current += 1;
      setFlash({ lane, judgement: j, key: flashKeyRef.current });
      if (j === "miss") setReactorShake((s) => s + 1);
    },
    [phase, songDone, calibrationMs, muted],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase() as (typeof LANE_KEYS)[number]);
      if (idx !== -1) {
        e.preventDefault();
        hitLane(idx as Lane);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, hitLane]);

  const playAgain = useCallback(() => startMatch(), [startMatch]);

  const toSetup = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase("setup");
    setSongDone(false);
  }, []);

  return {
    phase,
    bpm,
    setBpm,
    bars,
    setBars,
    density,
    setDensity,
    difficulty,
    setDifficulty,
    calibrationMs,
    setCalibration,
    muted,
    setMuted,
    events,
    nowTime,
    playerScore,
    aiScore,
    playerCombo,
    aiCombo,
    playerBestCombo,
    aiBestCombo,
    comboMultiplier,
    playerHistory,
    aiHistory,
    flash,
    reactorShake,
    songDone,
    startMatch,
    hitLane,
    playAgain,
    toSetup,
    leadInSeconds: LEAD_IN_S,
  };
}
