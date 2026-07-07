"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { playTileRummyAiTurn } from "./ai";
import { createTileRummyGame, drawTileRummyTile, playTileRummyMeld } from "./logic";
import type { TileRummyConfig, TileRummyGameState } from "./types";

const PLAYER = "player";
const AI = "ai";
export type TileRummyPhase = "setup" | "playing" | "end";

export function useTileRummy() {
  const [phase, setPhase] = useState<TileRummyPhase>("setup");
  const [game, setGame] = useState<TileRummyGameState | null>(null);
  const [config, setConfig] = useState<TileRummyConfig | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const recordedRef = useRef(false);
  const { record } = useScores();

  useEffect(() => {
    if (!game || phase !== "playing" || game.finished || game.turn !== AI || !config) return;
    const timer = setTimeout(
      () => {
        setGame((current) => {
          if (!current || current.finished || current.turn !== AI) return current;
          const next = playTileRummyAiTurn(current, AI, config.difficulty);
          playSound(next.lastAction?.kind === "win" ? "win" : "blip");
          return next;
        });
      },
      getUseDelay() ? 760 : 120,
    );
    return () => clearTimeout(timer);
  }, [config, game, phase]);

  useEffect(() => {
    if (!game?.finished || recordedRef.current) return;
    recordedRef.current = true;
    const won = game.winner === PLAYER;
    record("tile-rummy", won ? "win" : "loss");
    playSound(won ? "win" : "lose");
    setPhase("end");
  }, [game, record]);

  function start(nextConfig: TileRummyConfig) {
    recordedRef.current = false;
    setSelected([]);
    setConfig(nextConfig);
    setGame(createTileRummyGame([PLAYER, AI], PLAYER));
    setPhase("playing");
  }

  function toggle(tileId: string) {
    if (!game || game.turn !== PLAYER) return;
    setSelected((current) =>
      current.includes(tileId) ? current.filter((id) => id !== tileId) : [...current, tileId],
    );
  }

  function playSelected() {
    if (!game) return;
    const next = playTileRummyMeld(game, PLAYER, selected);
    if (next !== game) {
      setGame(next);
      setSelected([]);
      playSound(next.lastAction?.kind === "win" ? "win" : "blip");
    }
  }

  function draw() {
    if (!game) return;
    const next = drawTileRummyTile(game, PLAYER);
    if (next !== game) {
      setGame(next);
      setSelected([]);
      playSound("blip");
    }
  }

  function playAgain() {
    if (config) start(config);
  }

  function toSetup() {
    setSelected([]);
    setGame(null);
    setPhase("setup");
  }

  return { phase, game, selected, start, toggle, playSelected, draw, playAgain, toSetup };
}
