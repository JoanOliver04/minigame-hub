"use client";

/**
 * Blackjack — stateful match engine as a React hook.
 * Owns the phase machine (setup -> playing -> end), the per-round deal and
 * turn sequencing, sounds and score recording. Hand-value/round rules live
 * in ./logic, the Easy-mode hint in ./hints.
 *
 * Global scoreboard granularity: every finished ROUND is recorded
 * (win/loss/tie), tie meaning a push — mirrors tic-tac-toe's per-board
 * recording, since Blackjack rounds (like TTT boards) can end in a draw.
 */

import { useEffect, useRef, useState } from "react";
import { createStandardDeck, shuffleDeck, type Card, type Deck } from "@/lib/cards";
import { useScores } from "@/context/ScoresContext";
import { playSound } from "@/lib/sound";
import { getUseDelay } from "@/lib/settings";
import {
  applyBlackjackRoundOutcome,
  calculateHandValue,
  createBlackjackMatch,
  dealerShouldHit,
  resolveRound,
} from "./logic";
import type {
  BlackjackConfig,
  BlackjackHistoryEntry,
  BlackjackMatchState,
  RoundOutcome,
} from "./types";

export type BlackjackPhase = "setup" | "playing" | "end";
/** "dealing" = initial 4-card deal animation; "over" = brief round-end pause. */
export type BlackjackStage = "dealing" | "player" | "dealer" | "over";

const DEAL_STEP_MS = 380;
const NATURAL_HOLD_MS = 550;
const DEALER_STEP_MS = 700;
const ROUND_END_HOLD_MS = 2200;

export function useBlackjack() {
  const [phase, setPhase] = useState<BlackjackPhase>("setup");
  const [stage, setStage] = useState<BlackjackStage>("dealing");
  const [match, setMatch] = useState<BlackjackMatchState | null>(null);
  const [deck, setDeck] = useState<Deck>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [holeHidden, setHoleHidden] = useState(true);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [history, setHistory] = useState<BlackjackHistoryEntry[]>([]);
  const { record } = useScores();

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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

  /**
   * Deal a fresh round: a brand-new shuffled deck, per the spec (no shoe).
   *
   * `forMatch` is threaded explicitly (here and through runDealerTurn /
   * finishRound) instead of reading the `match` state variable: these
   * scheduled callbacks capture the render they were created in, and a
   * natural Blackjack resolves from a timer with no player action in
   * between — a closure over `match` would read the previous round's value
   * (or null on the very first deal, deadlocking the round).
   */
  function dealRound(forMatch: BlackjackMatchState) {
    const freshDeck = shuffleDeck(createStandardDeck());
    const [p1, d1, p2, d2, ...rest] = freshDeck;

    setDeck(rest);
    setPlayerCards([]);
    setDealerCards([]);
    setHoleHidden(true);
    setLastOutcome(null);
    setStage("dealing");

    const step = getUseDelay() ? DEAL_STEP_MS : 120;
    schedule(() => {
      setPlayerCards([p1]);
      playSound("blip");
    }, step);
    schedule(() => {
      setDealerCards([d1]);
      playSound("blip");
    }, step * 2);
    schedule(() => {
      setPlayerCards([p1, p2]);
      playSound("blip");
    }, step * 3);
    schedule(() => {
      setDealerCards([d1, d2]);
      playSound("blip");

      const playerValue = calculateHandValue([p1, p2]);
      const dealerValue = calculateHandValue([d1, d2]);
      if (playerValue.isBlackjack || dealerValue.isBlackjack) {
        // A natural Blackjack ends the round immediately — the dealer never
        // gets to hit, even from a weak two-card total.
        schedule(() => finishRound([p1, p2], [d1, d2], forMatch), NATURAL_HOLD_MS);
      } else {
        setStage("player");
      }
    }, step * 4);
  }

  function startMatch(config: BlackjackConfig) {
    clearTimers();
    logIdRef.current = 0;
    const freshMatch = createBlackjackMatch(config);
    setMatch(freshMatch);
    setHistory([]);
    dealRound(freshMatch);
    setPhase("playing");
  }

  function hit() {
    if (phase !== "playing" || stage !== "player" || !match || deck.length === 0) return;
    // A bust leaves stage at "player" while its finishRound is pending;
    // ignore further input so the round can't resolve (and record) twice.
    if (calculateHandValue(playerCards).isBust) return;
    const [card, ...rest] = deck;
    const nextPlayerCards = [...playerCards, card];
    setDeck(rest);
    setPlayerCards(nextPlayerCards);
    playSound("blip");

    const value = calculateHandValue(nextPlayerCards);
    if (value.isBust) {
      // A player bust is an automatic loss; the dealer never needs to act.
      schedule(() => finishRound(nextPlayerCards, dealerCards, match), NATURAL_HOLD_MS);
    }
  }

  function stand() {
    if (phase !== "playing" || stage !== "player" || !match) return;
    if (calculateHandValue(playerCards).isBust) return;
    runDealerTurn(playerCards, dealerCards, deck, match);
  }

  /** Reveal the hole card, then play out the dealer's fixed-rule turn. */
  function runDealerTurn(
    finalPlayerCards: Card[],
    startingDealerCards: Card[],
    startingDeck: Card[],
    forMatch: BlackjackMatchState,
  ) {
    setStage("dealer");
    setHoleHidden(false);
    playSound("blip");

    const step = getUseDelay() ? DEALER_STEP_MS : 260;

    function drawStep(currentDealerCards: Card[], remainingDeck: Card[]) {
      const dealerValue = calculateHandValue(currentDealerCards);
      if (dealerShouldHit(dealerValue) && remainingDeck.length > 0) {
        schedule(() => {
          const [card, ...rest] = remainingDeck;
          const next = [...currentDealerCards, card];
          setDealerCards(next);
          playSound("blip");
          drawStep(next, rest);
        }, step);
      } else {
        schedule(() => finishRound(finalPlayerCards, currentDealerCards, forMatch), step);
      }
    }
    drawStep(startingDealerCards, startingDeck);
  }

  function finishRound(
    finalPlayerCards: Card[],
    finalDealerCards: Card[],
    forMatch: BlackjackMatchState,
  ) {
    setPlayerCards(finalPlayerCards);
    setDealerCards(finalDealerCards);
    setHoleHidden(false);
    setStage("over");

    const outcome = resolveRound(finalPlayerCards, finalDealerCards);
    setLastOutcome(outcome);
    playSound(outcome.result === "win" ? "win" : outcome.result === "lose" ? "lose" : "blip");
    record("blackjack", outcome.result === "push" ? "tie" : outcome.result === "win" ? "win" : "loss");

    // `forMatch` is the explicitly-threaded match (see dealRound). Not a
    // setMatch(updater) either: React Strict Mode double-invokes updater
    // functions in development, and an updater that schedules timers /
    // mutates refs as a side effect would fire those side effects twice.
    const nextMatch = applyBlackjackRoundOutcome(forMatch, outcome);
    setMatch(nextMatch);

    logIdRef.current += 1;
    const entry: BlackjackHistoryEntry = {
      id: logIdRef.current,
      round: nextMatch.rounds,
      playerTotal: outcome.playerValue.total,
      dealerTotal: outcome.dealerValue.total,
      result: outcome.result,
      playerBlackjack: outcome.playerBlackjack,
      dealerBlackjack: outcome.dealerBlackjack,
    };
    setHistory((prev) => [entry, ...prev]);

    schedule(() => {
      if (nextMatch.finished) {
        setPhase("end");
      } else {
        dealRound(nextMatch);
      }
    }, ROUND_END_HOLD_MS);
  }

  function playAgain() {
    if (match) startMatch(match.config);
  }

  function toSetup() {
    clearTimers();
    setPhase("setup");
    setStage("dealing");
    setMatch(null);
    setDeck([]);
    setPlayerCards([]);
    setDealerCards([]);
    setHoleHidden(true);
    setLastOutcome(null);
    setHistory([]);
  }

  return {
    phase,
    stage,
    match,
    playerCards,
    dealerCards,
    holeHidden,
    lastOutcome,
    history,
    startMatch,
    hit,
    stand,
    playAgain,
    toSetup,
  };
}
