"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { randomInt } from "@/lib/random";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickColumn } from "./ai";
import {
  AI_PIECE,
  PLAYER_PIECE,
  applyConnectOutcome,
  checkBoardOutcome,
  createBoard,
  createConnectMatch,
  dropPiece,
} from "./logic";
import type {
  BoardPosition,
  ConnectBoard,
  ConnectDifficulty,
  ConnectMatchState,
  ConnectRoundOutcome,
} from "./types";

export type ConnectPhase = "setup" | "playing" | "end";
export type ConnectStage = "player" | "ai" | "over";

const ROUND_END_HOLD_MS = 1700;

export function useConnectFour() {
  const [phase, setPhase] = useState<ConnectPhase>("setup");
  const [stage, setStage] = useState<ConnectStage>("player");
  const [match, setMatch] = useState<ConnectMatchState | null>(null);
  const [board, setBoard] = useState<ConnectBoard>(createBoard());
  const [lastMove, setLastMove] = useState<BoardPosition | null>(null);
  const [lastOutcome, setLastOutcome] = useState<ConnectRoundOutcome | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { record } = useScores();

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

  function startMatch(difficulty: ConnectDifficulty, target: number) {
    clearTimers();
    setMatch(createConnectMatch(difficulty, target));
    setBoard(createBoard());
    setLastMove(null);
    setLastOutcome(null);
    setStage("player");
    setPhase("playing");
  }

  function finishRound(current: ConnectMatchState, outcome: ConnectRoundOutcome) {
    setStage("over");
    setLastOutcome(outcome);
    playSound(
      outcome.winner === PLAYER_PIECE
        ? "win"
        : outcome.winner === AI_PIECE
          ? "lose"
          : "blip",
    );
    record(
      "connect-four",
      outcome.winner === PLAYER_PIECE
        ? "win"
        : outcome.winner === AI_PIECE
          ? "loss"
          : "tie",
    );

    const nextMatch = applyConnectOutcome(current, outcome);
    setMatch(nextMatch);
    schedule(() => {
      if (nextMatch.finished) {
        setPhase("end");
      } else {
        setBoard(createBoard());
        setLastMove(null);
        setLastOutcome(null);
        setStage("player");
      }
    }, ROUND_END_HOLD_MS);
  }

  function playColumn(column: number) {
    if (phase !== "playing" || stage !== "player" || !match || match.finished) return;

    const playerDrop = dropPiece(board, column, PLAYER_PIECE);
    if (!playerDrop) return;
    setBoard(playerDrop.board);
    setLastMove(playerDrop.position);
    playSound("blip");

    const playerOutcome = checkBoardOutcome(playerDrop.board);
    if (playerOutcome) {
      finishRound(match, playerOutcome);
      return;
    }

    setStage("ai");
    const delay = getUseDelay() ? randomInt(650, 1150) : 220;
    schedule(() => {
      const aiColumn = aiPickColumn(playerDrop.board, match.difficulty);
      const aiDrop = dropPiece(playerDrop.board, aiColumn, AI_PIECE);
      if (!aiDrop) return;
      setBoard(aiDrop.board);
      setLastMove(aiDrop.position);

      const aiOutcome = checkBoardOutcome(aiDrop.board);
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
    clearTimers();
    setPhase("setup");
    setStage("player");
    setMatch(null);
    setBoard(createBoard());
    setLastMove(null);
    setLastOutcome(null);
  }

  return {
    phase,
    stage,
    match,
    board,
    lastMove,
    lastOutcome,
    startMatch,
    playColumn,
    playAgain,
    toSetup,
  };
}

