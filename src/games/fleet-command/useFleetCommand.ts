"use client";

/**
 * Fleet Command — stateful match engine as a React hook.
 * Owns placement editing, the alternating fire loop, the AI "thinking"
 * delay, sonar bookkeeping, and one-shot score recording. Pure rules live
 * in ./logic, the opponent in ./ai.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { aiPickShot, aiPickSonar, buildIntel } from "./ai";
import { allSunk, applyShot, placementValid, randomFleet, shipCells, sonarCount } from "./logic";
import type { FleetDifficulty, Ship, ShotRecord, SonarReading } from "./types";
import { FLEET_LENGTHS } from "./types";

export type FleetPhase = "setup" | "playing" | "end";
export type FleetStage = "player" | "ai" | "over";

const END_HOLD_MS = 1400;

export function useFleetCommand() {
  const [phase, setPhase] = useState<FleetPhase>("setup");
  const [difficulty, setDifficulty] = useState<FleetDifficulty>("medium");

  // --- placement editor state (setup phase) ---
  const [placedShips, setPlacedShips] = useState<Ship[]>([]);
  const [horizontal, setHorizontal] = useState(true);

  // --- match state ---
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [aiShips, setAiShips] = useState<Ship[]>([]);
  const [playerHistory, setPlayerHistory] = useState<ShotRecord[]>([]);
  const [aiHistory, setAiHistory] = useState<ShotRecord[]>([]);
  const [playerSonar, setPlayerSonar] = useState<SonarReading | null>(null);
  const [aiSonar, setAiSonar] = useState<SonarReading | null>(null);
  const [sonarArmed, setSonarArmed] = useState(false);
  const [stage, setStage] = useState<FleetStage>("player");
  const [won, setWon] = useState(false);
  const [lastAiShot, setLastAiShot] = useState<number | null>(null);
  const { record } = useScores();

  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ---------------- placement editor ---------------- */

  const nextLengthToPlace =
    placedShips.length < FLEET_LENGTHS.length ? FLEET_LENGTHS[placedShips.length] : null;

  const placeAt = useCallback(
    (origin: number) => {
      // Tapping an existing ship removes it (and every ship placed after it,
      // so the fixed 4-3-2-2 placement order stays consistent).
      const tapped = placedShips.find((ship) => ship.cells.includes(origin));
      if (tapped) {
        setPlacedShips((prev) => prev.filter((ship) => ship.id < tapped.id));
        playSound("blip");
        return;
      }
      if (nextLengthToPlace === null) return;
      const cells = shipCells(origin, nextLengthToPlace, horizontal);
      if (!cells || !placementValid(cells, placedShips)) {
        playSound("error");
        return;
      }
      setPlacedShips((prev) => [
        ...prev,
        { id: prev.length, length: nextLengthToPlace, cells, hits: 0 },
      ]);
      playSound("blip");
    },
    [placedShips, nextLengthToPlace, horizontal],
  );

  const shufflePlacement = useCallback(() => {
    setPlacedShips(randomFleet(rngRef.current));
    playSound("blip");
  }, []);

  const clearPlacement = useCallback(() => setPlacedShips([]), []);

  /* ---------------- match flow ---------------- */

  const startMatch = useCallback(() => {
    if (placedShips.length !== FLEET_LENGTHS.length) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    rngRef.current = createRng(randomSeed());
    setPlayerShips(placedShips.map((ship) => ({ ...ship, hits: 0 })));
    setAiShips(randomFleet(rngRef.current));
    setPlayerHistory([]);
    setAiHistory([]);
    setPlayerSonar(null);
    setAiSonar(null);
    setSonarArmed(false);
    setStage("player");
    setWon(false);
    setLastAiShot(null);
    setPhase("playing");
  }, [placedShips]);

  const finishMatch = useCallback(
    (playerWon: boolean) => {
      setStage("over");
      setWon(playerWon);
      playSound(playerWon ? "win" : "lose");
      record("fleet-command", playerWon ? "win" : "loss");
      schedule(() => setPhase("end"), END_HOLD_MS);
    },
    [record, schedule],
  );

  /** AI turn: optional sonar first, then one shot from its intel. */
  const runAiTurn = useCallback(
    (
      currentAiHistory: ShotRecord[],
      currentPlayerShips: Ship[],
      currentAiSonar: SonarReading | null,
    ) => {
      const rng = rngRef.current;
      let sonar = currentAiSonar;
      if (!sonar) {
        const intel = buildIntel(currentAiHistory, null);
        const center = aiPickSonar(intel, difficulty, currentAiHistory.length, rng);
        if (center !== null) {
          sonar = { center, count: sonarCount(currentPlayerShips, center) };
          setAiSonar(sonar);
        }
      }
      const intel = buildIntel(currentAiHistory, sonar);
      const target = aiPickShot(intel, difficulty, rng);
      const outcome = applyShot(currentPlayerShips, target);
      setPlayerShips(outcome.ships);
      setAiHistory([...currentAiHistory, outcome.record]);
      setLastAiShot(target);
      if (allSunk(outcome.ships)) {
        finishMatch(false);
      } else {
        playSound(outcome.result === "miss" ? "blip" : "error");
        setStage("player");
      }
    },
    [difficulty, finishMatch],
  );

  const fireAt = useCallback(
    (index: number) => {
      if (phase !== "playing" || stage !== "player") return;

      if (sonarArmed) {
        if (playerSonar) return;
        setPlayerSonar({ center: index, count: sonarCount(aiShips, index) });
        setSonarArmed(false);
        playSound("blip");
        return; // sonar is a free intel pulse, the shot is still yours
      }

      if (playerHistory.some((shot) => shot.index === index)) return;

      const outcome = applyShot(aiShips, index);
      setAiShips(outcome.ships);
      const nextHistory = [...playerHistory, outcome.record];
      setPlayerHistory(nextHistory);
      if (allSunk(outcome.ships)) {
        finishMatch(true);
        return;
      }
      playSound(outcome.result === "miss" ? "blip" : "win");
      setStage("ai");
      const delay = getUseDelay() ? 600 + Math.floor(Math.random() * 500) : 150;
      // Snapshot the inputs so the timer never reads stale state.
      const shipsSnapshot = playerShips;
      const historySnapshot = aiHistory;
      const sonarSnapshot = aiSonar;
      schedule(() => runAiTurn(historySnapshot, shipsSnapshot, sonarSnapshot), delay);
    },
    [
      phase,
      stage,
      playerHistory,
      sonarArmed,
      playerSonar,
      aiShips,
      playerShips,
      aiHistory,
      aiSonar,
      finishMatch,
      schedule,
      runAiTurn,
    ],
  );

  const playAgain = useCallback(() => {
    startMatch();
  }, [startMatch]);

  const toSetup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("setup");
    setStage("player");
    setSonarArmed(false);
  }, []);

  return {
    phase,
    difficulty,
    setDifficulty,
    placedShips,
    horizontal,
    setHorizontal,
    nextLengthToPlace,
    placeAt,
    shufflePlacement,
    clearPlacement,
    startMatch,
    playerShips,
    aiShips,
    playerHistory,
    aiHistory,
    playerSonar,
    aiSonar,
    sonarArmed,
    setSonarArmed,
    stage,
    won,
    lastAiShot,
    fireAt,
    playAgain,
    toSetup,
  };
}
