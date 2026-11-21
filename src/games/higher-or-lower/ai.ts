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
 * Nominal counts with the visible card removed. This gives Easy a legal
 * guess at either end of the rank range and Medium a starting prior.
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
  const nominal = nominalProbabilities(currentCard, config.aceHigh);
  if (config.difficulty === "easy") {
    const plausible = (["higher", "lower"] as const).filter((prediction) => nominal[prediction] > 0);
    return plausible[randomInt(0, plausible.length - 1)];
  }

  const counted = calculateRemainingProbabilities(currentCard, remainingDeck, config.aceHigh);

  if (config.difficulty === "medium") {
    // Learn from card counts as public draws accumulate. A retained prior
    // keeps Medium less exact than the complete count on Hard.
    const evidence = Math.min(0.7, Math.max(0, (nominal.total - counted.total) / 30));
    const prior = (counted.total / nominal.total) * (1 - evidence);
    return chooseMaximum({
      higher: counted.higher ? evidence * counted.higher + prior * nominal.higher : 0,
      lower: counted.lower ? evidence * counted.lower + prior * nominal.lower : 0,
      same: counted.same ? evidence * counted.same + prior * nominal.same : 0,
      total: counted.total,
    }, config.allowSame);
  }

  return chooseMaximum(counted, config.allowSame);
}

