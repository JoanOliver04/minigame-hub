/** Blackjack coaching based on visible cards and the fixed dealer rules. */
import { createStandardDeck, type Card } from "@/lib/cards";
import { calculateHandValue, dealerShouldHit } from "./logic";
import type { Action } from "./types";

interface Total {
  total: number;
  isSoft: boolean;
}

/** Conditional on the player's hand and the single visible dealer card. */
export function bustPercent(playerCards: Card[], dealerUpCard: Card): number {
  const seen = new Set([...playerCards, dealerUpCard].map((card) => card.id));
  const unseen = createStandardDeck().filter((card) => !seen.has(card.id));
  // The dealer already checked for a natural before offering the player a hit.
  const holeCandidates = unseen.filter(card => !calculateHandValue([dealerUpCard, card]).isBlackjack);
  const busts = new Set(unseen.filter(card => calculateHandValue([...playerCards, card]).isBust));
  const combinations = holeCandidates.length * (unseen.length - 1);
  const losingDraws = holeCandidates.reduce((n, hole) => n + busts.size - Number(busts.has(hole)), 0);
  return combinations ? Math.round(100 * losingDraws / combinations) : 0;
}

const BUST = 22;
const NATURAL = 23;

function draw(hand: Total, rank: number): Total {
  let total = hand.total + rank;
  let isSoft = hand.isSoft;
  if (rank === 1 && total + 10 <= 21) {
    total += 10;
    isSoft = true;
  }
  if (total > 21 && isSoft) {
    total -= 10;
    isSoft = false;
  }
  return { total, isSoft };
}

/** Estimate win/loss value with rank probabilities from visible cards.
 * The probability mix is held fixed through hypothetical future draws.
 */
export function suggestAction(playerCards: Card[], dealerUpCard: Card): Action {
  const player = calculateHandValue(playerCards);
  if (player.isBust || player.total === 21) return "stand";

  const counts = [4, 4, 4, 4, 4, 4, 4, 4, 4, 16];
  for (const card of [...playerCards, dealerUpCard]) counts[Math.min(card.rank, 10) - 1]--;
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total <= 0) return "stand";
  const odds = counts.map((count) => count / total);

  const dealerMemo = new Map<string, number[]>();
  function dealerDistribution(hand: Total): number[] {
    const key = `${hand.total}:${Number(hand.isSoft)}`;
    const previous = dealerMemo.get(key);
    if (previous) return previous;
    const outcomes = Array<number>(NATURAL + 1).fill(0);
    if (!dealerShouldHit({ ...hand, isBust: hand.total > 21, isBlackjack: false })) {
      outcomes[Math.min(hand.total, BUST)] = 1;
    } else {
      for (const [index, probability] of odds.entries()) {
        if (probability <= 0) continue;
        const result = dealerDistribution(draw(hand, index + 1));
        result.forEach((weight, value) => { outcomes[value] += weight * probability; });
      }
    }
    dealerMemo.set(key, outcomes);
    return outcomes;
  }

  const up = draw({ total: 0, isSoft: false }, Math.min(dealerUpCard.rank, 10));
  const outcomes = Array<number>(NATURAL + 1).fill(0);
  for (const [index, probability] of odds.entries()) {
    if (probability <= 0) continue;
    const opening = draw(up, index + 1);
    if (opening.total === 21) {
      outcomes[NATURAL] += probability;
    } else {
      dealerDistribution(opening).forEach((weight, value) => { outcomes[value] += weight * probability; });
    }
  }

  const stand = (value: number) => outcomes.reduce((sum, weight, dealer) => {
    if (dealer === BUST) return sum + weight;
    return sum + weight * Math.sign(value - dealer);
  }, 0);

  const playerMemo = new Map<string, number>();
  function hit(hand: Total): number {
    return odds.reduce((value, probability, index) =>
      probability > 0 ? value + probability * best(draw(hand, index + 1)) : value, 0);
  }
  function best(hand: Total): number {
    if (hand.total > 21) return -1;
    if (hand.total === 21) return stand(21);
    const key = `${hand.total}:${Number(hand.isSoft)}`;
    const previous = playerMemo.get(key);
    if (previous !== undefined) return previous;
    const value = Math.max(stand(hand.total), hit(hand));
    playerMemo.set(key, value);
    return value;
  }
  return hit(player) > stand(player.total) + 1e-9 ? "hit" : "stand";
}
