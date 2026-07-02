"use client";

/**
 * Nim — stateful match engine as a React hook.
 * Owns the phase machine (setup -> playing -> end), the per-round piles,
 * the pending token selection, the AI "thinking" delay, sounds and score
 * recording. Pure rules live in ./logic, the opponent in ./ai.
 *
 * Global scoreboard granularity: every finished ROUND is recorded
 * (win/loss) — Nim has no ties, so unlike tic-tac-toe there is never a
 * "tie" outcome to fold in, but the per-round cadence otherwise mirrors it.
 */

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { randomInt } from "@/lib/random";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickMove } from "./ai";
import {
  AI,
  PLAYER,
  applyNimRoundOutcome,
  applyPileMove,
  createNimMatch,
  createPiles,
  isGameOver,
  isValidMove,
  winnerOfFinishingMove,
} from "./logic";
import type {
  NimConfig,
  NimLogEntry,
  NimMatchState,
  NimRoundOutcome,
  NimTurn,
  Pile,
} from "./types";

export type NimPhase = "setup" | "playing" | "end";
/** Whose input is expected; "over" = brief end-of-round pause. */
export type NimStage = "player" | "ai" | "over";

export interface PendingSelection {
  pileIndex: number;
  tokensRemoved: number;
}

/** A move mid-fade: still rendered at the old size, animating out. */
export interface AnimatingMove {
  pileIndex: number;
  from: number;
  to: number;
  by: NimTurn;
}

const FADE_MS = 320;
const ROUND_END_HOLD_MS = 1800;

export function useNim() {
  const [phase, setPhase] = useState<NimPhase>("setup");
  const [stage, setStage] = useState<NimStage>("player");
  const [match, setMatch] = useState<NimMatchState | null>(null);
  const [piles, setPiles] = useState<Pile[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [animating, setAnimating] = useState<AnimatingMove | null>(null);
  const [moveLog, setMoveLog] = useState<NimLogEntry[]>([]);
  const [lastOutcome, setLastOutcome] = useState<NimRoundOutcome | null>(null);
  const { record } = useScores();

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logIdRef = useRef(0);

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

  function startMatch(config: NimConfig) {
    clearTimers();
    logIdRef.current = 0;
    setMatch(createNimMatch(config));
    setPiles(createPiles(config.randomizePiles));
    setPendingSelection(null);
    setAnimating(null);
    setMoveLog([]);
    setLastOutcome(null);
    setStage("player");
    setPhase("playing");
  }

  /** Stage a pending removal: the clicked token and every token after it. */
  function selectToken(pileIndex: number, tokenIndex: number) {
    if (phase !== "playing" || stage !== "player" || animating || !match || match.finished) return;
    const pileSize = piles[pileIndex];
    if (pileSize <= 0) return;
    const tokensRemoved = pileSize - tokenIndex;
    if (!isValidMove(piles, pileIndex, tokensRemoved)) return;
    setPendingSelection({ pileIndex, tokensRemoved });
  }

  function clearSelection() {
    setPendingSelection(null);
  }

  /** Commit a move: fade the removed tokens out, then update piles/log/turn. */
  function commitMove(by: NimTurn, pileIndex: number, tokensRemoved: number, fromPiles: Pile[]) {
    const pileBefore = fromPiles[pileIndex];
    const pileAfter = pileBefore - tokensRemoved;
    setAnimating({ pileIndex, from: pileBefore, to: pileAfter, by });
    playSound("blip");

    schedule(() => {
      const nextPiles = applyPileMove(fromPiles, pileIndex, tokensRemoved);
      setPiles(nextPiles);
      setAnimating(null);

      logIdRef.current += 1;
      const entry: NimLogEntry = {
        id: logIdRef.current,
        by,
        pileIndex,
        tokensRemoved,
        pileBefore,
        pileAfter,
      };
      setMoveLog((prev) => [entry, ...prev]);

      setMatch((currentMatch) => {
        if (!currentMatch) return currentMatch;
        return { ...currentMatch, totalMoves: currentMatch.totalMoves + 1 };
      });

      if (isGameOver(nextPiles)) {
        const winner = winnerOfFinishingMove(match?.config.rule ?? "normal", by);
        finishRound(winner, entry);
      } else if (by === PLAYER) {
        setStage("ai");
        scheduleAiTurn(nextPiles);
      } else {
        setStage("player");
      }
    }, FADE_MS);
  }

  function scheduleAiTurn(currentPiles: Pile[]) {
    if (!match) return;
    const { rule, difficulty } = match.config;
    const delay = getUseDelay() ? randomInt(700, 1300) : 260;
    schedule(() => {
      const move = aiPickMove(currentPiles, rule, difficulty);
      const tokensRemoved = currentPiles[move.pileIndex] - move.newSize;
      commitMove(AI, move.pileIndex, tokensRemoved, currentPiles);
    }, delay);
  }

  function confirmMove() {
    if (phase !== "playing" || stage !== "player" || animating || !match || match.finished) return;
    if (!pendingSelection) return;
    if (!isValidMove(piles, pendingSelection.pileIndex, pendingSelection.tokensRemoved)) return;
    setPendingSelection(null);
    commitMove(PLAYER, pendingSelection.pileIndex, pendingSelection.tokensRemoved, piles);
  }

  function finishRound(winner: NimTurn, finalMove: NimLogEntry) {
    if (!match) return;
    setStage("over");
    setLastOutcome({ winner, finalMove });
    playSound(winner === PLAYER ? "win" : "lose");
    record("nim", winner === PLAYER ? "win" : "loss");

    setMatch((currentMatch) => {
      if (!currentMatch) return currentMatch;
      const nextMatch = applyNimRoundOutcome(currentMatch, winner);
      schedule(() => {
        if (nextMatch.finished) {
          setPhase("end");
        } else {
          setPiles(createPiles(nextMatch.config.randomizePiles));
          setPendingSelection(null);
          setMoveLog([]);
          setLastOutcome(null);
          setStage("player");
        }
      }, ROUND_END_HOLD_MS);
      return nextMatch;
    });
  }

  function playAgain() {
    if (match) startMatch(match.config);
  }

  function toSetup() {
    clearTimers();
    setPhase("setup");
    setStage("player");
    setMatch(null);
    setPiles([]);
    setPendingSelection(null);
    setAnimating(null);
    setMoveLog([]);
    setLastOutcome(null);
  }

  return {
    phase,
    stage,
    match,
    piles,
    pendingSelection,
    animating,
    moveLog,
    lastOutcome,
    startMatch,
    selectToken,
    clearSelection,
    confirmMove,
    playAgain,
    toSetup,
  };
}
