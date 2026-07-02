/** Generic playing-card primitives, reusable by future card mini-games. */
export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  /** Stable identity; rank alone is not unique in a deck. */
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Deck = Card[];

export function createStandardDeck(): Deck {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
    })),
  );
}

/** Unbiased generic Fisher–Yates shuffle. Never mutates its input. */
export function shuffleItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleDeck(cards: readonly Card[]): Deck {
  return shuffleItems(cards);
}

export function cardValue(card: Card, aceHigh: boolean): number {
  return aceHigh && card.rank === 1 ? 14 : card.rank;
}
