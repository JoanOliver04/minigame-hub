/** Blackjack — hand-value resolution, round outcome and match bookkeeping. */

import type { Card } from "@/lib/cards";
import type {
  BlackjackConfig,
  BlackjackMatchState,
  HandValue,
  RoundOutcome,
  RoundResult,
} from "./types";

/**
 * Resolve a hand's total, correctly handling Aces.
 *
 * Every Ace starts counted as 11 (its most generous value). If that pushes
 * the total over 21, Aces are downgraded to 1 one at a time — each
 * downgrade removes exactly 10 from the total — until the hand no longer
 * busts or every Ace has been downgraded. The hand is "soft" as long as at
 * least one Ace is still being counted as 11, because in that state the
 * next card drawn can never bust the hand outright (the soft Ace can always
 * drop to 1 first).
 */
export function calculateHandValue(cards: Card[]): HandValue {
  let total = 0;
  let acesAsEleven = 0;

  for (const card of cards) {
    if (card.rank === 1) {
      total += 11;
      acesAsEleven += 1;
    } else if (card.rank >= 11) {
      total += 10; // J, Q, K
    } else {
      total += card.rank;
    }
  }

  while (total > 21 && acesAsEleven > 0) {
    total -= 10;
    acesAsEleven -= 1;
  }

  return {
    total,
    isSoft: acesAsEleven > 0,
    isBlackjack: cards.length === 2 && total === 21,
    isBust: total > 21,
  };
}

/**
 * Fixed dealer rules (not a difficulty choice — every real Blackjack table
 * enforces this): hit on 16 or below, stand on 17 or above. This variant
 * stands on soft 17 (S17) rather than hitting it (H17) to keep the rules
 * simple, as called out in the spec.
 */
export function dealerShouldHit(dealerValue: HandValue): boolean {
  return dealerValue.total <= 16;
}

/**
 * Compare final hands and decide the round, including the natural-Blackjack
 * bonus: a two-card 21 beats a regular 21 reached via extra hits, and beats
 * any non-21 dealer total outright — unless the dealer also has a natural,
 * which is a push.
 */
export function resolveRound(playerCards: Card[], dealerCards: Card[]): RoundOutcome {
  const playerValue = calculateHandValue(playerCards);
  const dealerValue = calculateHandValue(dealerCards);
  const playerBlackjack = playerValue.isBlackjack;
  const dealerBlackjack = dealerValue.isBlackjack;

  let result: RoundResult;
  if (playerValue.isBust) {
    result = "lose";
  } else if (dealerValue.isBust) {
    result = "win";
  } else if (playerBlackjack && dealerBlackjack) {
    result = "push";
  } else if (playerBlackjack) {
    result = "win";
  } else if (dealerBlackjack) {
    result = "lose";
  } else if (playerValue.total > dealerValue.total) {
    result = "win";
  } else if (playerValue.total < dealerValue.total) {
    result = "lose";
  } else {
    result = "push";
  }

  return { result, playerBlackjack, dealerBlackjack, playerValue, dealerValue };
}

/** Simple secondary chip tally: a Blackjack win pays a little extra. */
export function chipsDelta(outcome: RoundOutcome): number {
  if (outcome.result === "push") return 0;
  if (outcome.result === "lose") return -1;
  return outcome.playerBlackjack ? 1.5 : 1;
}

export function createBlackjackMatch(config: BlackjackConfig): BlackjackMatchState {
  return {
    config,
    youScore: 0,
    aiScore: 0,
    pushes: 0,
    rounds: 0,
    chips: 0,
    finished: false,
  };
}

/** Fold one finished round into the match tally. Pushes count the round but help neither side. */
export function applyBlackjackRoundOutcome(
  match: BlackjackMatchState,
  outcome: RoundOutcome,
): BlackjackMatchState {
  const youScore = match.youScore + (outcome.result === "win" ? 1 : 0);
  const aiScore = match.aiScore + (outcome.result === "lose" ? 1 : 0);
  const pushes = match.pushes + (outcome.result === "push" ? 1 : 0);
  return {
    ...match,
    youScore,
    aiScore,
    pushes,
    rounds: match.rounds + 1,
    chips: match.chips + chipsDelta(outcome),
    finished: youScore >= match.config.target || aiScore >= match.config.target,
  };
}
