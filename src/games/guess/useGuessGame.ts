"use client";

/**
 * Number Duel — stateful game engine as a React hook.
 * Owns the phase machine (setup -> playing -> end), schedules the AI's
 * turn, plays sounds, and records match outcomes in the global store.
 * All rule computations live in ./logic (pure) and ./ai.
 */

import { useEffect, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { randomInt } from "@/lib/random";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickGuess } from "./ai";
import {
  applyGuess,
  createRound,
  judge,
  type Actor,
  type GuessConfig,
  type RoundState,
} from "./logic";

export type GuessPhase = "setup" | "playing" | "end";

export function useGuessGame() {
  const [phase, setPhase] = useState<GuessPhase>("setup");
  const [round, setRound] = useState<RoundState | null>(null);
  const { record } = useScores();

  function resolveGuess(current: RoundState, who: Actor, guess: number) {
    const verdict = judge(current, guess);
    const next = applyGuess(current, who, guess);
    playSound(verdict === "correct" ? "win" : "blip");
    if (next.winner) record("guess", next.winner === "player" ? "win" : "loss");
    setRound(next);
  }

  function start(config: GuessConfig) {
    setRound(createRound(config));
    setPhase("playing");
  }

  /** The player's one action: submit a validated guess. */
  function submitPlayerGuess(guess: number) {
    if (!round || !round.playing || round.turn !== "player") return;
    resolveGuess(round, "player", guess);
  }

  function playAgain() {
    if (round) start(round.config);
  }

  function toSetup() {
    setPhase("setup");
    setRound(null);
  }

  // AI turn: fires whenever the round hands the turn to the AI.
  // Cleanup cancels the pending guess if the round ends or unmounts
  // (leaving the page back to the hub = the old reset()).
  useEffect(() => {
    if (!round || !round.playing || round.turn !== "ai") return;
    const delay = getUseDelay() ? randomInt(900, 1600) : 250;
    const timer = setTimeout(() => resolveGuess(round, "ai", aiPickGuess(round)), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Short pause after the winning guess so it is visible in the log
  // before switching to the end screen (same 1100ms as the original).
  useEffect(() => {
    if (!round?.winner) return;
    const timer = setTimeout(() => setPhase("end"), 1100);
    return () => clearTimeout(timer);
  }, [round?.winner]);

  return { phase, round, start, submitPlayerGuess, playAgain, toSetup };
}
