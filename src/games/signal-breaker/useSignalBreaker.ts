"use client";

/**
 * Signal Breaker — stateful match engine as a React hook.
 *
 * Both sides solve independent codes (blueprint §11.2). The player guesses
 * the AI's secret manually; the AI's own solver runs one guess whenever the
 * player submits, so the two races stay in lock-step. Fewest guesses wins;
 * ties break on accumulated solve time (sub-100 ms = a true tie).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickGuess, aiPickSecret } from "./ai";
import { isSolved, randomCode, scoreGuess } from "./logic";
import type { Code, GuessRow, SignalDifficulty } from "./types";
import { CODE_LENGTH, MAX_GUESSES, SYMBOL_COUNT } from "./types";

export type SignalPhase = "setup" | "playing" | "end";
export type MatchOutcome = "player" | "ai" | "tie";

const AI_STEP_MS = 550;

export function useSignalBreaker() {
  const [phase, setPhase] = useState<SignalPhase>("setup");
  const [difficulty, setDifficulty] = useState<SignalDifficulty>("medium");
  const [allowRepeats, setAllowRepeats] = useState(true);

  const [aiSecret, setAiSecret] = useState<Code>([]);
  const [playerRows, setPlayerRows] = useState<GuessRow[]>([]);
  const [aiRows, setAiRows] = useState<GuessRow[]>([]);
  const [draft, setDraft] = useState<(number | null)[]>(Array(CODE_LENGTH).fill(null));
  const [playerSolved, setPlayerSolved] = useState<number | null>(null);
  const [aiSolved, setAiSolved] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const { record } = useScores();

  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const playerSecretRef = useRef<Code>([]);
  const aiRowsRef = useRef<GuessRow[]>([]);
  const aiSolvedRef = useRef<number | null>(null);
  const playerSolvedRef = useRef<number | null>(null);
  const playerSolveMsRef = useRef(0);
  const aiSolveMsRef = useRef(0);
  const openingHistoryRef = useRef<Code[]>([]);
  const playerRowCountRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const startMatch = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const rng = createRng(randomSeed());
    rngRef.current = rng;
    recordedRef.current = false;

    // AI's secret (what the player cracks): Hard resists the player's
    // observed openings, else uniform random.
    const secret = aiPickSecret(openingHistoryRef.current, difficulty, allowRepeats, rng);
    // Player's secret (what the AI cracks): always uniform random — the AI
    // solver must not get an easier code than the player faces.
    playerSecretRef.current = randomCode(rng, allowRepeats);

    setAiSecret(secret);
    setPlayerRows([]);
    setAiRows([]);
    aiRowsRef.current = [];
    setDraft(Array(CODE_LENGTH).fill(null));
    setPlayerSolved(null);
    setAiSolved(null);
    playerSolvedRef.current = null;
    aiSolvedRef.current = null;
    playerRowCountRef.current = 0;
    playerSolveMsRef.current = 0;
    aiSolveMsRef.current = 0;
    setOutcome(null);
    setPhase("playing");
  }, [difficulty, allowRepeats]);

  const settleIfDone = useCallback(() => {
    const p = playerSolvedRef.current;
    const a = aiSolvedRef.current;
    const playerDone = p !== null || playerRowCountRef.current >= MAX_GUESSES;
    const aiDone = a !== null || aiRowsRef.current.length >= MAX_GUESSES;
    if (!playerDone || !aiDone) return;

    let result: MatchOutcome;
    if (p !== null && a === null) result = "player";
    else if (a !== null && p === null) result = "ai";
    else if (p === null && a === null) result = "tie"; // both ran out of guesses
    else if (p! < a!) result = "player";
    else if (a! < p!) result = "ai";
    else {
      // Same guess count: accumulated solve time decides; <100ms = tie.
      const diff = playerSolveMsRef.current - aiSolveMsRef.current;
      result = Math.abs(diff) < 100 ? "tie" : diff < 0 ? "player" : "ai";
    }

    if (!recordedRef.current) {
      recordedRef.current = true;
      record("signal-breaker", result === "player" ? "win" : result === "ai" ? "loss" : "tie");
      playSound(result === "player" ? "win" : result === "ai" ? "lose" : "blip");
    }
    setOutcome(result);
    schedule(() => setPhase("end"), 1200);
  }, [record, schedule]);

  const runAiGuess = useCallback(() => {
    if (aiSolvedRef.current !== null || aiRowsRef.current.length >= MAX_GUESSES) return;
    const t0 = performance.now();
    const guess = aiPickGuess(aiRowsRef.current, difficulty, allowRepeats, rngRef.current);
    const elapsed = performance.now() - t0;
    aiSolveMsRef.current += elapsed;
    const feedback = scoreGuess(playerSecretRef.current, guess);
    const row: GuessRow = { guess, feedback };
    aiRowsRef.current = [...aiRowsRef.current, row];
    setAiRows(aiRowsRef.current);
    if (isSolved(feedback)) {
      aiSolvedRef.current = aiRowsRef.current.length;
      setAiSolved(aiRowsRef.current.length);
    }
    settleIfDone();
  }, [difficulty, allowRepeats, settleIfDone]);

  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    if (playerSolvedRef.current !== null) return;
    if (draft.some((d) => d === null)) return;
    const guess = draft as Code;

    // Record the player's opening guess so the Hard setter can adapt later.
    if (playerRows.length === 0) {
      openingHistoryRef.current = [...openingHistoryRef.current, guess.slice()].slice(-12);
    }

    const feedback = scoreGuess(aiSecret, guess);
    const nextRows = [...playerRows, { guess, feedback }];
    setPlayerRows(nextRows);
    playerRowCountRef.current = nextRows.length;
    setDraft(Array(CODE_LENGTH).fill(null));

    if (isSolved(feedback)) {
      playerSolvedRef.current = nextRows.length;
      setPlayerSolved(nextRows.length);
      playSound("win");
    } else {
      playSound("blip");
    }

    // The AI takes its matching turn (after a short "thinking" beat).
    const delay = getUseDelay() ? AI_STEP_MS : 120;
    schedule(runAiGuess, delay);
    settleIfDone();
  }, [phase, draft, playerRows, aiSecret, schedule, runAiGuess, settleIfDone]);

  const setDraftSlot = useCallback((index: number, value: number) => {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const cycleSlot = useCallback((index: number) => {
    setDraft((prev) => {
      const next = [...prev];
      const cur = next[index];
      next[index] = cur === null ? 0 : (cur + 1) % SYMBOL_COUNT;
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => setDraft(Array(CODE_LENGTH).fill(null)), []);

  const playAgain = useCallback(() => startMatch(), [startMatch]);
  const toSetup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("setup");
  }, []);

  return {
    phase,
    difficulty,
    setDifficulty,
    allowRepeats,
    setAllowRepeats,
    aiSecret,
    playerRows,
    aiRows,
    draft,
    playerSolved,
    aiSolved,
    outcome,
    setDraftSlot,
    cycleSlot,
    clearDraft,
    submitGuess,
    startMatch,
    playAgain,
    toSetup,
    maxGuesses: MAX_GUESSES,
    symbolCount: SYMBOL_COUNT,
    codeLength: CODE_LENGTH,
  };
}
