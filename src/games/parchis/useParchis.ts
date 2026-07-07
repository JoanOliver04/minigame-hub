"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { chooseParchisMove } from "./ai";
import { createParchisGame, moveParchisPiece, rollParchisDie } from "./logic";
import type { ParchisConfig, ParchisGameState } from "./types";

const PLAYER = "player";
const AI = "ai";
export type ParchisPhase = "setup" | "playing" | "end";

export function useParchis() {
  const [phase, setPhase] = useState<ParchisPhase>("setup");
  const [game, setGame] = useState<ParchisGameState | null>(null);
  const [config, setConfig] = useState<ParchisConfig | null>(null);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (!game || phase !== "playing" || game.finished || game.turn !== AI || !config) return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== AI) return current;
          if (current.pendingSteps === null) {
            const next = rollParchisDie(current, AI);
            playSound("blip");
            return next;
          }
          const pieceId = chooseParchisMove(current, AI, config.difficulty);
          if (pieceId === null) return current;
          const next = moveParchisPiece(current, AI, pieceId);
          playSound(next.lastAction?.kind === "capture" ? "win" : "blip");
          return next;
        });
      },
      getUseDelay() ? (game.pendingSteps === null ? 620 : 760) : 100,
    );
    return () => clearTimeout(timer);
  }, [config, game, phase]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const won = game.winner === PLAYER;
    record("parchis", won ? "win" : "loss");
    playSound(won ? "win" : "lose");
    setPhase("end");
  }, [game, record]);

  function start(nextConfig: ParchisConfig) {
    recordedRef.current = false;
    setConfig(nextConfig);
    setGame(createParchisGame([PLAYER, AI], nextConfig.pieceCount, PLAYER));
    setPhase("playing");
  }

  function roll() {
    if (!game || game.turn !== PLAYER || game.pendingSteps !== null) return;
    const next = rollParchisDie(game, PLAYER);
    setGame(next);
    playSound("blip");
  }

  function move(pieceId: number) {
    if (!game || game.turn !== PLAYER) return;
    const next = moveParchisPiece(game, PLAYER, pieceId);
    if (next === game) return;
    setGame(next);
    playSound(next.lastAction?.kind === "capture" ? "win" : "blip");
  }

  function playAgain() {
    if (config) start(config);
  }

  function toSetup() {
    setGame(null);
    setPhase("setup");
  }

  return { phase, game, start, roll, move, playAgain, toSetup };
}
