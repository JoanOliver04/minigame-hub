"use client";

/**
 * Reaction Time — stateful match engine as a React hook.
 * Owns the round state machine (waiting -> ready -> go -> resolved) and the
 * two timers that race each round: the real "Go!" signal, and the AI's
 * single precomputed event (a false start before the signal, or a genuine
 * reaction after it). AI behavior lives in ./ai, pure round/match math in
 * ./logic.
 *
 * Why `matchRef` instead of just reading the `match` state variable: most
 * rounds here can resolve purely from a timer firing (the AI reacts before
 * the player manages to click at all), with no click event in between to
 * force a fresh render closure. A long-lived chain of setTimeout callbacks
 * can span many renders, and a callback captured by an old render would
 * otherwise read a stale `match` — silently losing previously-recorded
 * round wins. `matchRef` is a plain mutable ref updated in lockstep with
 * `match`, so every closure — however old — reads the true current value.
 */

import { useEffect, useRef, useState } from "react";
import { randomInt } from "@/lib/random";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { simulateAiReaction, type AiReactionRoll } from "./ai";
import {
  GET_READY_MS,
  applyReactionRoundOutcome,
  createReactionMatch,
  decideRoundWinner,
  preciseNow,
  randomSignalDelay,
} from "./logic";
import type {
  ReactionConfig,
  ReactionHistoryEntry,
  ReactionMatchState,
  RoundResult,
  RoundStage,
} from "./types";

export type ReactionPhase = "setup" | "playing" | "end";

const ROUND_END_HOLD_MS = 2200;

export function useReactionTime() {
  const [phase, setPhase] = useState<ReactionPhase>("setup");
  const [stage, setStage] = useState<RoundStage>("waiting");
  const [match, setMatch] = useState<ReactionMatchState | null>(null);
  const [lastOutcome, setLastOutcome] = useState<RoundResult | null>(null);
  const [history, setHistory] = useState<ReactionHistoryEntry[]>([]);
  const { record } = useScores();

  const matchRef = useRef<ReactionMatchState | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const goTimestampRef = useRef<number | null>(null);
  const aiRollRef = useRef<AiReactionRoll | null>(null);
  const resolvedRef = useRef(false);
  const logIdRef = useRef(0);

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

  /** Keep the ref and the state copy of the match in lockstep. */
  function commitMatch(next: ReactionMatchState | null) {
    matchRef.current = next;
    setMatch(next);
  }

  function startMatch(config: ReactionConfig) {
    clearTimers();
    logIdRef.current = 0;
    commitMatch(createReactionMatch(config));
    setHistory([]);
    setPhase("playing");
    startRound();
  }

  /** Begin one round: a short neutral beat, then arm the real timers. */
  function startRound() {
    clearTimers();
    resolvedRef.current = false;
    goTimestampRef.current = null;
    aiRollRef.current = null;
    setLastOutcome(null);
    setStage("waiting");
    schedule(armRound, GET_READY_MS);
  }

  /** Arm the round: schedule the real signal and the AI's single event. */
  function armRound() {
    const config = matchRef.current?.config;
    if (!config) return;

    setStage("ready");
    const signalDelayMs = randomSignalDelay();
    const aiRoll = simulateAiReaction(config.difficulty);
    aiRollRef.current = aiRoll;

    // The AI's whole round is one precomputed event: it either jumps the
    // gun at a random instant before the signal, or reacts a fixed delay
    // after it — either way, exactly one timer.
    const aiEventDelayMs = aiRoll.falseStart
      ? randomInt(0, Math.max(1, signalDelayMs - 50))
      : signalDelayMs + aiRoll.reactionMs;

    schedule(() => {
      if (resolvedRef.current) return;
      setStage("go");
      goTimestampRef.current = preciseNow();
      playSound("blip");
    }, signalDelayMs);

    schedule(() => {
      if (resolvedRef.current) return;
      // The AI's event fires before the player has acted at all — it alone
      // decides the round (a false start if this landed before the signal,
      // otherwise a plain "the AI was faster").
      resolveRound(null, false);
    }, aiEventDelayMs);
  }

  /** The player's one input per round: a click/tap during "ready" or "go". */
  function handlePlayerAction() {
    if (phase !== "playing" || resolvedRef.current) return;
    if (stage === "ready") {
      resolveRound(null, true); // clicked before the signal appeared
    } else if (stage === "go") {
      const elapsed =
        goTimestampRef.current === null ? 0 : preciseNow() - goTimestampRef.current;
      resolveRound(Math.max(0, Math.round(elapsed)), false);
    }
    // "waiting" (grace beat) or "resolved": ignored — this also guards
    // against a rapid double-click registering twice.
  }

  function resolveRound(playerTimeMs: number | null, playerFalseStart: boolean) {
    if (resolvedRef.current) return;
    const currentMatch = matchRef.current;
    const aiRoll = aiRollRef.current;
    if (!currentMatch || !aiRoll) return;

    resolvedRef.current = true;
    clearTimers(); // cancels whichever of {signal, AI event} hasn't fired yet

    const winner = decideRoundWinner(
      playerFalseStart,
      aiRoll.falseStart,
      playerTimeMs,
      aiRoll.reactionMs,
    );
    const outcome: RoundResult = {
      playerTimeMs,
      aiTimeMs: aiRoll.reactionMs,
      playerFalseStart,
      aiFalseStart: aiRoll.falseStart,
      winner,
    };

    setStage("resolved");
    setLastOutcome(outcome);
    playSound(winner === "player" ? "win" : winner === "ai" ? "lose" : "blip");
    record("reaction-time", winner === "tie" ? "tie" : winner === "player" ? "win" : "loss");

    const nextMatch = applyReactionRoundOutcome(currentMatch, outcome);
    commitMatch(nextMatch);

    logIdRef.current += 1;
    const entry: ReactionHistoryEntry = {
      id: logIdRef.current,
      round: nextMatch.rounds,
      playerTimeMs: outcome.playerTimeMs,
      aiTimeMs: outcome.aiTimeMs,
      playerFalseStart: outcome.playerFalseStart,
      aiFalseStart: outcome.aiFalseStart,
      winner: outcome.winner,
    };
    setHistory((prev) => [entry, ...prev]);

    schedule(() => {
      if (nextMatch.finished) {
        setPhase("end");
      } else {
        startRound();
      }
    }, ROUND_END_HOLD_MS);
  }

  function playAgain() {
    if (match) startMatch(match.config);
  }

  function toSetup() {
    clearTimers();
    resolvedRef.current = true; // stop any in-flight round from resolving late
    setPhase("setup");
    setStage("waiting");
    setLastOutcome(null);
    setHistory([]);
    commitMatch(null);
  }

  return {
    phase,
    stage,
    match,
    lastOutcome,
    history,
    startMatch,
    handlePlayerAction,
    playAgain,
    toSetup,
  };
}
