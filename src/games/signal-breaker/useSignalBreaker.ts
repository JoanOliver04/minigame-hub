"use client";

/**
 * Signal Breaker — stateful match engine as a React hook.
 *
 * Both sides solve independent codes (blueprint §11.2). The player guesses
 * the AI's secret manually; the AI's own solver runs one guess whenever the
 * player submits. Both finish the same turn before the result is decided.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickGuess, aiPickSecret } from "./ai";
import { isSolved, randomCode, scoreGuess, signalRoundOutcome } from "./logic";
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
    timersRef.current.splice(0).forEach(clearTimeout);
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
    playerRowCountRef.current = 0;
    setOutcome(null);
    setPhase("playing");
  }, [difficulty, allowRepeats]);

  const runAiGuess = useCallback((turn: number, playerCracked: boolean) => {
    const guess = aiPickGuess(aiRowsRef.current, difficulty, allowRepeats, rngRef.current);
    const feedback = scoreGuess(playerSecretRef.current, guess);
    aiRowsRef.current = [...aiRowsRef.current, { guess, feedback }];
    setAiRows(aiRowsRef.current);
    const cracked = isSolved(feedback);
    if (cracked) setAiSolved(turn);
    const result = signalRoundOutcome(turn, playerCracked, cracked);
    if (!result || recordedRef.current) return;
    recordedRef.current = true;
    record("signal-breaker", result === "player" ? "win" : result === "ai" ? "loss" : "tie");
    playSound(result === "player" ? "win" : result === "ai" ? "lose" : "blip");
    setOutcome(result);
    schedule(() => setPhase("end"), 850);
  }, [difficulty, allowRepeats, record, schedule]);

  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    if (recordedRef.current || playerRowCountRef.current !== aiRowsRef.current.length) return;
    if (draft.some((d) => d === null)) return;
    const guess = draft as Code;
    if (playerRows.length >= MAX_GUESSES || playerRows.some((row) => row.guess.every((s, i) => s === guess[i]))) return;

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
      setPlayerSolved(nextRows.length);
      playSound("win");
    } else {
      playSound("blip");
    }

    // The AI takes its matching turn (after a short "thinking" beat).
    const delay = getUseDelay() ? AI_STEP_MS : 120;
    schedule(() => runAiGuess(nextRows.length, isSolved(feedback)), delay);
  }, [phase, draft, playerRows, aiSecret, schedule, runAiGuess]);

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
    timersRef.current.splice(0).forEach(clearTimeout);
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
    copyGuess: (guess: Code) => setDraft(guess.slice()),
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
