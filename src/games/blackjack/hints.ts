/**
 * Blackjack — Easy-mode basic-strategy hint.
 *
 * This is deliberately separate from ./logic's `dealerShouldHit`: the
 * dealer's play is a fixed rule of the game, while this is a *suggestion*
 * for the player, only ever shown on Easy difficulty.
 *
 * Real casino basic-strategy charts also cover doubling down and splitting
 * pairs. This simplified Blackjack variant only offers Hit/Stand, so every
 * "would double" cell collapses to whichever of Hit/Stand is closer to the
 * standard advice for that hand.
 */

import type { Card } from "@/lib/cards";
import type { Action, HandValue } from "./types";

/** Dealer up-card strength for the chart: Ace counts as 11, faces as 10. */
function dealerUpCardValue(dealerUpCard: Card): number {
  if (dealerUpCard.rank === 1) return 11;
  return Math.min(dealerUpCard.rank, 10);
}

/**
 * Suggested action for the player's current hand against the dealer's
 * visible up-card, per standard basic strategy (Hit/Stand only).
 */
export function suggestAction(playerValue: HandValue, dealerUpCard: Card): Action {
  if (playerValue.isBust || playerValue.isBlackjack) return "stand";

  const dealerValue = dealerUpCardValue(dealerUpCard);

  if (playerValue.isSoft) {
    // Soft hands (an Ace counted as 11) can never bust on the next card, so
    // basic strategy is much more hit-happy here than for hard hands.
    if (playerValue.total <= 17) return "hit"; // soft 13–17
    if (playerValue.total === 18) return dealerValue >= 9 ? "hit" : "stand";
    return "stand"; // soft 19+
  }

  // Hard totals.
  if (playerValue.total <= 11) return "hit"; // can never bust
  if (playerValue.total === 12) return dealerValue >= 4 && dealerValue <= 6 ? "stand" : "hit";
  if (playerValue.total <= 16) return dealerValue >= 2 && dealerValue <= 6 ? "stand" : "hit";
  return "stand"; // hard 17+
}
