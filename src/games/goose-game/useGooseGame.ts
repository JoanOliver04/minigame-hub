"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { shouldGooseAiReroll } from "./ai";
import {
  createGooseGame,
  moveGooseToken,
  rerollGooseDie,
  rollGooseDie,
} from "./logic";
import type { GooseConfig, GooseGameState } from "./types";

const PLAYER = "player";
const AI = "ai";
export type GoosePhase = "setup" | "playing" | "end";

export function useGooseGame() {
  const [phase, setPhase] = useState<GoosePhase>("setup");
  const [game, setGame] = useState<GooseGameState | null>(null);
  const [config, setConfig] = useState<GooseConfig | null>(null);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (!game || phase !== "playing" || game.finished || game.turn !== AI || !config) return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== AI) return current;
          if (current.die === null) {
            playSound("blip");
            return rollGooseDie(current, AI);
          }
          if (shouldGooseAiReroll(current, AI, config.difficulty)) {
            playSound("blip");
            return rerollGooseDie(current, AI);
          }
          const next = moveGooseToken(current, AI);
          playSound(next.lastAction?.special === "death" ? "lose" : "blip");
          return next;
        });
      },
      getUseDelay() ? 650 : 100,
    );
    return () => clearTimeout(timer);
  }, [config, game, phase]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const won = game.winner === PLAYER;
    record("goose-game", won ? "win" : "loss");
    playSound(won ? "win" : "lose");
    setPhase("end");
  }, [game, record]);

  function start(nextConfig: GooseConfig) {
    recordedRef.current = false;
    setConfig(nextConfig);
    setGame(createGooseGame([PLAYER, AI], PLAYER));
    setPhase("playing");
  }

  function roll() {
    if (!game) return;
    const next = rollGooseDie(game, PLAYER);
    if (next !== game) {
      setGame(next);
      playSound("blip");
    }
  }

  function reroll() {
    if (!game) return;
    const next = rerollGooseDie(game, PLAYER);
    if (next !== game) {
      setGame(next);
      playSound("blip");
    }
  }

  function move() {
    if (!game) return;
    const next = moveGooseToken(game, PLAYER);
    if (next !== game) {
      setGame(next);
      playSound(next.lastAction?.special === "death" ? "lose" : "blip");
    }
  }

  function playAgain() {
    if (config) start(config);
  }

  function toSetup() {
    setGame(null);
    setPhase("setup");
  }

  return { phase, game, start, roll, reroll, move, playAgain, toSetup };
}
