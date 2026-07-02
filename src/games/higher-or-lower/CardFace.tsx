import type { Card } from "@/lib/cards";

const SUIT_SYMBOL = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
} as const;

const RANK_LABEL: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
};

export function cardLabel(card: Card): string {
  return `${RANK_LABEL[card.rank] ?? card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function CardFace({
  card,
  flipping = false,
  hidden = false,
  label,
}: {
  card: Card;
  flipping?: boolean;
  /** Renders a face-down back instead of the card's rank/suit (e.g. a dealer's hole card). */
  hidden?: boolean;
  label: string;
}) {
  if (hidden) {
    return (
      <div className="hol-card-wrap">
        <span className="hol-card-label">{label}</span>
        <div className={`hol-card back${flipping ? " flipping" : ""}`} aria-label={label}>
          <span className="hol-card-back-pattern" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <div className="hol-card-wrap">
      <span className="hol-card-label">{label}</span>
      <div
        className={`hol-card${red ? " red" : ""}${flipping ? " flipping" : ""}`}
        aria-label={`${label}: ${cardLabel(card)}`}
      >
        <span className="corner">
          {RANK_LABEL[card.rank] ?? card.rank}
          <small>{SUIT_SYMBOL[card.suit]}</small>
        </span>
        <span className="suit">{SUIT_SYMBOL[card.suit]}</span>
        <span className="corner bottom">
          {RANK_LABEL[card.rank] ?? card.rank}
          <small>{SUIT_SYMBOL[card.suit]}</small>
        </span>
      </div>
    </div>
  );
}

