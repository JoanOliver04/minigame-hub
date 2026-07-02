"use client";

/**
 * Shadow Protocol — stateful match engine as a React hook.
 * Owns the phase machine, keyboard input, armed action modes (sprint /
 * beacon), sounds, and one-shot score recording. All rules live in ./logic.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { createRng, randomSeed } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import {
  applyAction,
  beaconTargets,
  computeScore,
  createShadowMatch,
  hackTargets,
} from "./logic";
import type {
  Dir,
  PlayerAction,
  Position,
  ScoreBreakdown,
  ShadowDifficulty,
  ShadowState,
  TurnEvent,
} from "./types";
import { samePos } from "./types";

export type ShadowPhase = "setup" | "playing" | "end";
export type ArmedMode = "none" | "sprint" | "beacon";

const END_HOLD_MS = 1400;

export function useShadowProtocol() {
  const [phase, setPhase] = useState<ShadowPhase>("setup");
  const [state, setState] = useState<ShadowState | null>(null);
  const [armed, setArmed] = useState<ArmedMode>("none");
  const [lastEvents, setLastEvents] = useState<TurnEvent[]>([]);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const { record } = useScores();

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const startMatch = useCallback((difficulty: ShadowDifficulty) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setState(createShadowMatch(difficulty, createRng(randomSeed())));
    setArmed("none");
    setLastEvents([]);
    setScore(null);
    setPhase("playing");
  }, []);

  const act = useCallback(
    (action: PlayerAction) => {
      if (!state || state.status !== "playing" || phase !== "playing") return;
      const { state: next, events } = applyAction(state, action);
      if (next === state) return; // illegal action — ignore silently
      setLastEvents(events);
      setArmed("none");
      setState(next);

      if (events.includes("escaped")) {
        playSound("win");
        record("shadow-protocol", "win");
        setScore(computeScore(next));
        schedule(() => setPhase("end"), END_HOLD_MS);
      } else if (events.includes("caught") || events.includes("alarm-zero")) {
        playSound("lose");
        record("shadow-protocol", "loss");
        setScore(null);
        schedule(() => setPhase("end"), END_HOLD_MS);
      } else if (events.includes("core-collected")) {
        playSound("win");
      } else if (events.includes("spotted")) {
        playSound("error");
      } else if (events.length > 0) {
        playSound("blip");
      }
    },
    [state, phase, record, schedule],
  );

  /** Board tap: beacon throw when armed, otherwise walk/sprint toward it. */
  const tapTile = useCallback(
    (pos: Position) => {
      if (!state || state.status !== "playing") return;
      if (armed === "beacon") {
        if (beaconTargets(state).some((p) => samePos(p, pos))) {
          act({ kind: "beacon", target: pos });
        }
        return;
      }
      const dx = pos.x - state.player.x;
      const dy = pos.y - state.player.y;
      const dir: Dir | null =
        dx === 0 && dy < 0
          ? "n"
          : dx === 0 && dy > 0
            ? "s"
            : dy === 0 && dx > 0
              ? "e"
              : dy === 0 && dx < 0
                ? "w"
                : null;
      if (!dir) return;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist === 1) act({ kind: armed === "sprint" ? "sprint" : "move", dir });
      else if (dist === 2 && armed === "sprint") act({ kind: "sprint", dir });
    },
    [act, armed, state],
  );

  const moveDir = useCallback(
    (dir: Dir) => act({ kind: armed === "sprint" ? "sprint" : "move", dir }),
    [act, armed],
  );

  // Keyboard: arrows/WASD move, Shift toggles sprint, B beacon, H hack, Space waits.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const dir: Dir | null =
        key === "arrowup" || key === "w"
          ? "n"
          : key === "arrowdown" || key === "s"
            ? "s"
            : key === "arrowleft" || key === "a"
              ? "w"
              : key === "arrowright" || key === "d"
                ? "e"
                : null;
      if (dir) {
        event.preventDefault();
        moveDir(dir);
      } else if (key === " ") {
        event.preventDefault();
        act({ kind: "wait" });
      } else if (key === "h") {
        act({ kind: "hack" });
      } else if (key === "shift") {
        setArmed((prev) => (prev === "sprint" ? "none" : "sprint"));
      } else if (key === "b") {
        setArmed((prev) => (prev === "beacon" ? "none" : "beacon"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, moveDir, act]);

  const playAgain = useCallback(() => {
    if (state) startMatch(state.difficulty);
  }, [state, startMatch]);

  const toSetup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("setup");
    setState(null);
    setArmed("none");
    setLastEvents([]);
    setScore(null);
  }, []);

  return {
    phase,
    state,
    armed,
    setArmed,
    lastEvents,
    score,
    startMatch,
    act,
    tapTile,
    moveDir,
    playAgain,
    toSetup,
    hackAvailable: state ? hackTargets(state).length > 0 : false,
    beaconSpots: state && armed === "beacon" ? beaconTargets(state) : [],
  };
}
