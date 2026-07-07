"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { playDominoAiTurn } from "./ai";
import { createDominoGame, drawDominoTile, getPlayableSides, passDominoTurn, playDominoTile } from "./logic";
import type { DominoConfig, DominoGameState, DominoSide } from "./types";

const PLAYER = "player";
const AI = "ai";
export type DominoPhase = "setup" | "playing" | "end";

export function useDomino() {
  const [phase, setPhase] = useState<DominoPhase>("setup");
  const [game, setGame] = useState<DominoGameState | null>(null);
  const [config, setConfig] = useState<DominoConfig | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (!game || phase !== "playing" || game.finished || game.turn !== AI || !config) return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== AI) return current;
          const next = playDominoAiTurn(current, AI, config.difficulty);
          playSound(next.lastAction?.kind === "win" ? "win" : "blip");
          return next;
        });
      },
      getUseDelay() ? 680 : 120,
    );
    return () => clearTimeout(timer);
  }, [config, game, phase]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const outcome = game.tie ? "tie" : game.winner === PLAYER ? "win" : "loss";
    record("domino", outcome);
    playSound(outcome === "win" ? "win" : outcome === "loss" ? "lose" : "blip");
    setPhase("end");
  }, [game, record]);

  function start(nextConfig: DominoConfig) {
    recordedRef.current = false;
    setSelected(null);
    setConfig(nextConfig);
    setGame(createDominoGame([PLAYER, AI], PLAYER));
    setPhase("playing");
  }

  function toggle(tileId: string) {
    if (!game || game.turn !== PLAYER) return;
    setSelected((current) => (current === tileId ? null : tileId));
  }

  function play(side?: DominoSide) {
    if (!game || !selected) return;
    const tile = game.hands[PLAYER].find((candidate) => candidate.id === selected);
    if (!tile) return;
    const legalSide = side ?? getPlayableSides(game, tile)[0];
    if (!legalSide) return;
    const next = playDominoTile(game, PLAYER, selected, legalSide);
    if (next !== game) {
      setGame(next);
      setSelected(null);
      playSound(next.lastAction?.kind === "win" ? "win" : "blip");
    }
  }

  function draw() {
    if (!game) return;
    const next = drawDominoTile(game, PLAYER);
    if (next !== game) {
      setGame(next);
      setSelected(null);
      playSound("blip");
    }
  }

  function pass() {
    if (!game) return;
    const next = passDominoTurn(game, PLAYER);
    if (next !== game) {
      setGame(next);
      setSelected(null);
      playSound(next.finished ? "win" : "blip");
    }
  }

  function playAgain() {
    if (config) start(config);
  }

  function toSetup() {
    setSelected(null);
    setGame(null);
    setPhase("setup");
  }

  return { phase, game, selected, start, toggle, play, draw, pass, playAgain, toSetup };
}
