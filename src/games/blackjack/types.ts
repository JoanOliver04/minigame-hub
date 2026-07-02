/**
 * Blackjack — pure type definitions. No React, no DOM, no side effects.
 * The player always acts first; the dealer's play is fixed by the rules of
 * the game itself (see ./dealer), so "difficulty" here only controls how
 * much help the UI gives the player (see ./hints).
 */

import type { Card } from "@/lib/cards";

export type BlackjackDifficulty = "easy" | "medium" | "hard";
export type Action = "hit" | "stand";

export interface Hand {
  cards: Card[];
}

/** Resolved value of a hand, with Aces already settled to soft/hard. */
export interface HandValue {
  total: number;
  /** True while at least one Ace is still being counted as 11. */
  isSoft: boolean;
  /** Two-card 21 dealt at the start of the round. */
  isBlackjack: boolean;
  isBust: boolean;
}

export type RoundResult = "win" | "lose" | "push";

export interface RoundOutcome {
  /** From the player's point of view. */
  result: RoundResult;
  playerBlackjack: boolean;
  dealerBlackjack: boolean;
  playerValue: HandValue;
  dealerValue: HandValue;
}

export interface BlackjackConfig {
  /** Controls player-facing hints/visibility only — never the dealer. */
  difficulty: BlackjackDifficulty;
  /** Round wins needed to take the match. */
  target: number;
}

/** Match (best-of-N rounds) bookkeeping — mirrors the ttt/rps shape. */
export interface BlackjackMatchState {
  config: BlackjackConfig;
  youScore: number;
  aiScore: number;
  pushes: number;
  rounds: number;
  /** Simple secondary tally: +1 win, +1.5 blackjack win, -1 loss, 0 push. */
  chips: number;
  finished: boolean;
}

export interface BlackjackHistoryEntry {
  id: number;
  round: number;
  playerTotal: number;
  dealerTotal: number;
  result: RoundResult;
  playerBlackjack: boolean;
  dealerBlackjack: boolean;
}
