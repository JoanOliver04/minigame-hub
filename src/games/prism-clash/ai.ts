import { legalCardIndexes } from "./logic";
import type {
  PrismCard,
  PrismColor,
  PrismDifficulty,
  PrismGameState,
} from "./types";

export interface PrismAiMove {
  cardIndex: number;
  color?: PrismColor;
}

function bestColor(hand: PrismCard[], excludingIndex: number): PrismColor {
  const counts: Partial<Record<PrismColor, number>> = {};
  hand.forEach((card, index) => {
    if (index !== excludingIndex && card.color) counts[card.color] = (counts[card.color] ?? 0) + 1;
  });
  return (["ember", "tide", "bloom", "volt"] as PrismColor[]).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0),
  )[0];
}

export function choosePrismAiMove(
  state: PrismGameState,
  actor: string,
  difficulty: PrismDifficulty,
): PrismAiMove | null {
  const legal = legalCardIndexes(state, actor);
  if (legal.length === 0) return null;
  const hand = state.hands[actor];
  const opponent = state.order.find((seat) => seat !== actor)!;
  const top = state.discardPile[state.discardPile.length - 1];

  if (difficulty === "easy") {
    const cardIndex = legal[Math.floor(Math.random() * legal.length)];
    return {
      cardIndex,
      ...(hand[cardIndex].kind === "prism" ? { color: bestColor(hand, cardIndex) } : {}),
    };
  }

  const ranked = legal.map((cardIndex) => {
    const candidate = hand[cardIndex];
    const remainingColor = candidate.color
      ? hand.filter((card, index) => index !== cardIndex && card.color === candidate.color).length
      : 0;
    let score = remainingColor * (difficulty === "hard" ? 5 : 2);

    if (candidate.kind === "draw2") score += state.hands[opponent].length <= 3 ? 55 : 22;
    if (candidate.kind === "freeze") score += state.hands[opponent].length <= 3 ? 45 : 18;
    if (
      candidate.kind === "number" &&
      top.kind === "number" &&
      candidate.value === top.value &&
      candidate.color !== top.color &&
      !state.comboUsed
    ) {
      score += difficulty === "hard" ? 42 : 20;
    }
    if (candidate.kind === "prism") score += hand.length <= 3 ? 35 : difficulty === "hard" ? -18 : 8;
    if (difficulty === "hard") {
      score += candidate.kind === "number" ? (candidate.value ?? 0) * 0.4 : 0;
      const after = hand.filter((_, index) => index !== cardIndex);
      const chosen = candidate.kind === "prism" ? bestColor(hand, cardIndex) : candidate.color;
      score += after.filter((card) => card.color === chosen).length * 3;
    }
    return { cardIndex, score };
  });
  ranked.sort((a, b) => b.score - a.score);
  const cardIndex =
    difficulty === "medium" && ranked.length > 1 && Math.random() < 0.22
      ? ranked[1].cardIndex
      : ranked[0].cardIndex;
  return {
    cardIndex,
    ...(hand[cardIndex].kind === "prism" ? { color: bestColor(hand, cardIndex) } : {}),
  };
}
