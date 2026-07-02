"use client";

/**
 * Tic-Tac-Toe — stateful match engine as a React hook.
 * Owns the phase machine (setup -> playing -> end), the per-round board,
 * the AI "thinking" delay, sounds, and score recording. Pure rules live
 * in ./logic, the opponent in ./ai.
 *
 * Global scoreboard granularity: every finished BOARD is recorded
 * (win/loss/tie) — unlike RPS matches, tic-tac-toe draws are a real,
 * common outcome, so per-round recording keeps the tie column meaningful.
 */

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { randomInt } from "@/lib/random";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickMove } from "./ai";
import {
  AI_MARK,
  PLAYER_MARK,
  applyRoundOutcome,
  applyMove,
  checkOutcome,
  createTttMatch,
  emptyBoard,
  type Board,
  type RoundOutcome,
  type TttDifficulty,
  type TttMatchState,
} from "./logic";

export type TttPhase = "setup" | "playing" | "end";
/** Whose input the board is waiting on; "over" = end-of-round pause. */
export type TttStage = "player" | "ai" | "over";

const ROUND_END_HOLD_MS = 1600;

export function useTttGame() {
  const [phase, setPhase] = useState<TttPhase>("setup");
  const [match, setMatch] = useState<TttMatchState | null>(null);
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [stage, setStage] = useState<TttStage>("player");
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const { record } = useScores();

  // Pending timers (AI move, round transition) — cleared on unmount,
  // which is what aborts a match when the user goes back to the hub.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function startMatch(difficulty: TttDifficulty, target: number) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMatch(createTttMatch(difficulty, target));
    setBoard(emptyBoard());
    setSelectedCell(null);
    setStage("player");
    setLastOutcome(null);
    setPhase("playing");
  }

  /** Score a finished board, then either advance the match or end it. */
  function finishRound(current: TttMatchState, outcome: RoundOutcome) {
    setStage("over");
    setLastOutcome(outcome);
    playSound(outcome.winner === PLAYER_MARK ? "win" : outcome.winner === AI_MARK ? "lose" : "blip");
    record(
      "ttt",
      outcome.winner === PLAYER_MARK ? "win" : outcome.winner === AI_MARK ? "loss" : "tie",
    );

    const nextMatch = applyRoundOutcome(current, outcome);
    setMatch(nextMatch);

    // Hold so the final board (and winning line) stays visible.
    schedule(() => {
      if (nextMatch.finished) {
        setPhase("end");
      } else {
        setBoard(emptyBoard());
        setSelectedCell(null);
        setLastOutcome(null);
        setStage("player");
      }
    }, ROUND_END_HOLD_MS);
  }

  /**
   * Place the first three X marks. Once all three are present, the first
   * click selects any X and the second click moves it to an empty cell.
   */
  function handleCell(cell: number) {
    if (phase !== "playing" || !match || match.finished) return;
    if (stage !== "player") return;

    const playerCells = board.filter((value) => value === PLAYER_MARK).length;
    if (playerCells === 3 && selectedCell === null) {
      if (board[cell] === PLAYER_MARK) {
        setSelectedCell(cell);
        playSound("blip");
      }
      return;
    }
    if (playerCells === 3 && board[cell] === PLAYER_MARK) {
      setSelectedCell(cell);
      return;
    }
    if (board[cell] !== null) return;

    const afterPlayer = applyMove(
      board,
      { from: playerCells === 3 ? selectedCell : null, to: cell },
      PLAYER_MARK,
    );
    setBoard(afterPlayer);
    setSelectedCell(null);
    playSound("blip");

    const outcome = checkOutcome(afterPlayer);
    if (outcome) {
      finishRound(match, outcome);
      return;
    }

    // AI responds after a brief simulated "thinking" pause (same global
    // toggle as the guessing game's delay setting).
    setStage("ai");
    const delay = getUseDelay() ? randomInt(500, 1100) : 200;
    schedule(() => {
      const aiMove = aiPickMove(afterPlayer, match.difficulty);
      const afterAi = applyMove(afterPlayer, aiMove, AI_MARK);
      setBoard(afterAi);

      const aiOutcome = checkOutcome(afterAi);
      if (aiOutcome) {
        finishRound(match, aiOutcome);
      } else {
        playSound("blip");
        setStage("player");
      }
    }, delay);
  }

  function playAgain() {
    if (match) startMatch(match.difficulty, match.target);
  }

  function toSetup() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("setup");
    setMatch(null);
    setBoard(emptyBoard());
    setSelectedCell(null);
    setStage("player");
    setLastOutcome(null);
  }

  return {
    phase,
    match,
    board,
    selectedCell,
    stage,
    lastOutcome,
    startMatch,
    handleCell,
    playAgain,
    toSetup,
  };
}
