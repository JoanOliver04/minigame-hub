"use client";

/**
 * Rock-Paper-Scissors — stateful match engine as a React hook.
 * Owns the phase machine (setup -> playing -> end) plus the reveal
 * animation timeline; pure rules live in ./logic, prediction in ./ai.
 */

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { aiPickMove } from "./ai";
import {
  applyRound,
  createMatch,
  judge,
  type MatchState,
  type Move,
  type RoundResult,
  type RpsDifficulty,
} from "./logic";

export type RpsPhase = "setup" | "playing" | "end";

/** Drives the VS arena: fists shake, then both moves reveal at once. */
export type HandState =
  | { stage: "idle" }
  | { stage: "shaking" }
  | { stage: "reveal"; playerMove: Move; aiMove: Move; result: RoundResult };

const SHAKE_MS = 900;
const REVEAL_HOLD_MS = 1200;

export function useRpsGame() {
  const [phase, setPhase] = useState<RpsPhase>("setup");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [hand, setHand] = useState<HandState>({ stage: "idle" });
  const { record } = useScores();

  // Pending animation timers — cleared on unmount (= the old reset()).
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function startMatch(difficulty: RpsDifficulty, target: number) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMatch(createMatch(difficulty, target));
    setHand({ stage: "idle" });
    setPhase("playing");
  }

  /**
   * The player's one action: throw a move. Guarded against double-clicks —
   * ignored unless the arena is idle. The AI picks BEFORE learning from
   * this round's player move (only past-round information).
   */
  function playMove(move: Move) {
    if (phase !== "playing" || !match || match.finished) return;
    if (hand.stage !== "idle") return;

    const aiMove = aiPickMove(match);
    const result = judge(move, aiMove);
    const next = applyRound(match, move, aiMove);

    // Phase 1 — both hands shake as fists
    setHand({ stage: "shaking" });
    playSound("blip");

    // Phase 2 — simultaneous reveal + verdict
    schedule(() => {
      setMatch(next);
      setHand({ stage: "reveal", playerMove: move, aiMove, result });
      playSound(result === "win" ? "win" : result === "lose" ? "lose" : "blip");

      if (next.finished) {
        schedule(() => {
          record("rps", next.youScore > next.aiScore ? "win" : "loss");
          setPhase("end");
        }, REVEAL_HOLD_MS);
      } else {
        schedule(() => setHand({ stage: "idle" }), REVEAL_HOLD_MS);
      }
    }, SHAKE_MS);
  }

  function playAgain() {
    if (match) startMatch(match.difficulty, match.target);
  }

  function toSetup() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("setup");
    setMatch(null);
    setHand({ stage: "idle" });
  }

  return { phase, match, hand, startMatch, playMove, playAgain, toSetup };
}
