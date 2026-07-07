"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { applyBaronAiDecision } from "./ai";
import { buyProperty, createBaronGame, passDecision, rollBaronTurn, upgradeProperty } from "./logic";
import type { BaronGameState, PropertyBaronConfig } from "./types";

export type PropertyBaronPhase = "setup" | "playing" | "end";

export function usePropertyBaron() {
  const [phase, setPhase] = useState<PropertyBaronPhase>("setup");
  const [game, setGame] = useState<BaronGameState | null>(null);
  const [config, setConfig] = useState<PropertyBaronConfig | null>(null);
  const recordedRef = useRef(false);
  const { record } = useScores();

  function startMatch(nextConfig: PropertyBaronConfig) {
    recordedRef.current = false;
    setConfig(nextConfig);
    setGame(createBaronGame(["player", "ai"], nextConfig.maxRounds));
    setPhase("playing");
  }

  useEffect(() => {
    if (!game || !config || phase !== "playing" || game.finished || game.turn !== "ai") return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== "ai") return current;
          const rolled = current.phase === "roll" ? rollBaronTurn(current, "ai") : current;
          return rolled.phase === "decision" && rolled.turn === "ai" ? applyBaronAiDecision(rolled, config.difficulty) : rolled;
        });
      },
      getUseDelay() ? 760 : 120,
    );
    return () => clearTimeout(timer);
  }, [game, config, phase]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const won = game.winner === "player";
    record("property-baron", won ? "win" : "loss");
    playSound(won ? "win" : "lose");
    setPhase("end");
  }, [game, record]);

  function roll() {
    setGame((current) => (current ? rollBaronTurn(current, "player") : current));
    playSound("blip");
  }

  function buy() {
    setGame((current) => (current ? buyProperty(current, "player") : current));
    playSound("blip");
  }

  function upgrade() {
    setGame((current) => (current ? upgradeProperty(current, "player") : current));
    playSound("blip");
  }

  function pass() {
    setGame((current) => (current ? passDecision(current, "player") : current));
  }

  function playAgain() {
    if (config) startMatch(config);
  }

  function toSetup() {
    setGame(null);
    setPhase("setup");
  }

  return { phase, game, config, startMatch, roll, buy, upgrade, pass, playAgain, toSetup };
}
