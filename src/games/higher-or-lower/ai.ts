/** Higher or Lower — probability-based parallel AI competitor. */

import { cardValue, type Card, type Deck } from "@/lib/cards";
import { randomInt } from "@/lib/random";
import type { HigherOrLowerConfig, Prediction } from "./types";

export interface RankProbabilities {
  higher: number;
  lower: number;
  same: number;
  total: number;
}

/**
 * Exact card-counting utility for Hard AI.
 *
 * It makes one O(n) pass over the remaining deck, compares every card with
 * the visible card using the active Ace rule, and returns exact counts.
 * Counts are sufficient for argmax, so no floating-point division is needed.
 */
export function calculateRemainingProbabilities(
  currentCard: Card,
  remainingDeck: readonly Card[],
  aceHigh: boolean,
): RankProbabilities {
  const currentValue = cardValue(currentCard, aceHigh);
  const counts: RankProbabilities = {
    higher: 0,
    lower: 0,
    same: 0,
    total: remainingDeck.length,
  };

  for (const card of remainingDeck) {
    const value = cardValue(card, aceHigh);
    if (value > currentValue) counts.higher++;
    else if (value < currentValue) counts.lower++;
    else counts.same++;
  }
  return counts;
}

function randomHigherOrLower(): Prediction {
  return randomInt(0, 1) === 0 ? "higher" : "lower";
}

function chooseMaximum(
  counts: RankProbabilities,
  allowSame: boolean,
): Prediction {
  const candidates: Prediction[] = allowSame
    ? ["higher", "lower", "same"]
    : ["higher", "lower"];
  const maximum = Math.max(...candidates.map((prediction) => counts[prediction]));
  const best = candidates.filter((prediction) => counts[prediction] === maximum);
  return best[randomInt(0, best.length - 1)];
}

/**
 * Medium knows the standard rank distribution but does not remember dealt
 * cards. Only the visible card is removed from its nominal 52-card deck.
 */
function nominalProbabilities(currentCard: Card, aceHigh: boolean): RankProbabilities {
  const currentValue = cardValue(currentCard, aceHigh);
  const counts: RankProbabilities = { higher: 0, lower: 0, same: 3, total: 51 };
  for (let rank = 1; rank <= 13; rank++) {
    const value = aceHigh && rank === 1 ? 14 : rank;
    if (value > currentValue) counts.higher += 4;
    else if (value < currentValue) counts.lower += 4;
  }
  return counts;
}

export function aiPickPrediction(
  currentCard: Card,
  remainingDeck: Deck,
  config: HigherOrLowerConfig,
): Prediction {
  if (config.difficulty === "easy") return randomHigherOrLower();

  if (config.difficulty === "medium") {
    // Medium deliberately chooses only Higher/Lower, as specified.
    return chooseMaximum(nominalProbabilities(currentCard, config.aceHigh), false);
  }

  return chooseMaximum(
    calculateRemainingProbabilities(currentCard, remainingDeck, config.aceHigh),
    config.allowSame,
  );
}

