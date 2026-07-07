"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { choosePrismAiMove } from "./ai";
import { createPrismGame, drawPrismCard, legalCardIndexes, playPrismCard } from "./logic";
import type { PrismColor, PrismConfig, PrismGameState } from "./types";

export type PrismPhase = "setup" | "playing" | "end";
const PLAYER = "player";
const AI = "ai";

export function usePrismClash() {
  const [phase, setPhase] = useState<PrismPhase>("setup");
  const [game, setGame] = useState<PrismGameState | null>(null);
  const [config, setConfig] = useState<PrismConfig | null>(null);
  const [pendingPrism, setPendingPrism] = useState<number | null>(null);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (!game || phase !== "playing" || game.finished || game.turn !== AI || !config) return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== AI) return current;
          const move = choosePrismAiMove(current, AI, config.difficulty);
          const next = move
            ? playPrismCard(current, AI, move.cardIndex, move.color)
            : drawPrismCard(current, AI);
          playSound(next.lastAction?.kind === "roundWin" ? "win" : "blip");
          return next;
        });
      },
      getUseDelay() ? 720 : 120,
    );
    return () => clearTimeout(timer);
  }, [game, phase, config]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const won = game.winner === PLAYER;
    record("prism-clash", won ? "win" : "loss");
    playSound(won ? "win" : "lose");
    setPhase("end");
  }, [game, record]);

  function startMatch(nextConfig: PrismConfig) {
    recordedRef.current = false;
    setConfig(nextConfig);
    setPendingPrism(null);
    setGame(createPrismGame([PLAYER, AI], nextConfig.target, PLAYER));
    setPhase("playing");
  }

  function selectCard(index: number) {
    if (!game || game.turn !== PLAYER || game.finished) return;
    const selected = game.hands[PLAYER][index];
    if (!selected || !legalCardIndexes(game, PLAYER).includes(index)) return;
    if (selected.kind === "prism") {
      setPendingPrism(index);
      return;
    }
    setGame(playPrismCard(game, PLAYER, index));
    playSound("blip");
  }

  function chooseColor(color: PrismColor) {
    if (!game || pendingPrism === null) return;
    setGame(playPrismCard(game, PLAYER, pendingPrism, color));
    setPendingPrism(null);
    playSound("blip");
  }

  function draw() {
    if (!game) return;
    const next = drawPrismCard(game, PLAYER);
    if (next !== game) {
      setGame(next);
      playSound("blip");
    }
  }

  function playAgain() {
    if (config) startMatch(config);
  }

  function toSetup() {
    setPendingPrism(null);
    setGame(null);
    setPhase("setup");
  }

  return {
    phase,
    game,
    config,
    pendingPrism,
    startMatch,
    selectCard,
    chooseColor,
    draw,
    playAgain,
    toSetup,
  };
}
