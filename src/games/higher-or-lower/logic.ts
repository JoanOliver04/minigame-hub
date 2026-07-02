/** Higher or Lower — pure rules and immutable state transitions. */

import { cardValue, createStandardDeck, shuffleDeck, type Card } from "@/lib/cards";
import type {
  CompetitorStats,
  HigherOrLowerConfig,
  HigherOrLowerMatch,
  MatchWinner,
  Prediction,
  RevealState,
} from "./types";

const EMPTY_STATS: CompetitorStats = { score: 0, streak: 0, bestStreak: 0 };

export function createHigherOrLowerMatch(config: HigherOrLowerConfig): HigherOrLowerMatch {
  const deck = shuffleDeck(createStandardDeck());
  const currentCard = deck[deck.length - 1];

  return {
    config,
    deck: deck.slice(0, -1),
    currentCard,
    roundsPlayed: 0,
    player: { ...EMPTY_STATS },
    ai: { ...EMPTY_STATS },
    history: [],
    finished: false,
    winner: null,
  };
}

export function compareCards(
  current: Card,
  next: Card,
  aceHigh: boolean,
): Prediction {
  const currentValue = cardValue(current, aceHigh);
  const nextValue = cardValue(next, aceHigh);
  if (nextValue > currentValue) return "higher";
  if (nextValue < currentValue) return "lower";
  return "same";
}

export function isPredictionCorrect(
  prediction: Prediction,
  current: Card,
  next: Card,
  aceHigh: boolean,
): boolean {
  return prediction === compareCards(current, next, aceHigh);
}

function updateStats(stats: CompetitorStats, correct: boolean): CompetitorStats {
  const streak = correct ? stats.streak + 1 : 0;
  return {
    score: stats.score + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

export function decideWinner(
  player: CompetitorStats,
  ai: CompetitorStats,
): MatchWinner {
  if (player.score !== ai.score) return player.score > ai.score ? "player" : "ai";
  if (player.bestStreak !== ai.bestStreak) {
    return player.bestStreak > ai.bestStreak ? "player" : "ai";
  }
  return "tie";
}

export function previewReveal(
  match: HigherOrLowerMatch,
  playerPrediction: Prediction,
  aiPrediction: Prediction,
): RevealState {
  const nextCard = match.deck[match.deck.length - 1];
  return {
    nextCard,
    playerPrediction,
    aiPrediction,
    playerCorrect: isPredictionCorrect(
      playerPrediction,
      match.currentCard,
      nextCard,
      match.config.aceHigh,
    ),
    aiCorrect: isPredictionCorrect(
      aiPrediction,
      match.currentCard,
      nextCard,
      match.config.aceHigh,
    ),
  };
}

/**
 * Commit one reveal. The normal 10/20-round formats cannot exhaust a
 * 52-card deck. If longer formats are added later, deck exhaustion ends the
 * match cleanly rather than reshuffling and invalidating card-counting odds.
 */
export function applyReveal(
  match: HigherOrLowerMatch,
  reveal: RevealState,
): HigherOrLowerMatch {
  const player = updateStats(match.player, reveal.playerCorrect);
  const ai = updateStats(match.ai, reveal.aiCorrect);
  const roundsPlayed = match.roundsPlayed + 1;
  const deck = match.deck.slice(0, -1);
  const finished = roundsPlayed >= match.config.rounds || deck.length === 0;

  return {
    ...match,
    deck,
    currentCard: reveal.nextCard,
    roundsPlayed,
    player,
    ai,
    history: [
      {
        id: roundsPlayed,
        currentCard: match.currentCard,
        nextCard: reveal.nextCard,
        playerPrediction: reveal.playerPrediction,
        aiPrediction: reveal.aiPrediction,
        playerCorrect: reveal.playerCorrect,
        aiCorrect: reveal.aiCorrect,
      },
      ...match.history,
    ],
    finished,
    winner: finished ? decideWinner(player, ai) : null,
  };
}

