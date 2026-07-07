import type {
  PrismAction,
  PrismCard,
  PrismColor,
  PrismGameState,
  PrismKind,
} from "./types";

export const PRISM_COLORS: PrismColor[] = ["ember", "tide", "bloom", "volt"];
export const HAND_SIZE = 7;

function card(id: string, color: PrismColor | null, kind: PrismKind, value?: number): PrismCard {
  return { id, color, kind, ...(value === undefined ? {} : { value }) };
}

export function createPrismDeck(): PrismCard[] {
  const deck: PrismCard[] = [];
  for (const color of PRISM_COLORS) {
    deck.push(card(`${color}-0`, color, "number", 0));
    for (let value = 1; value <= 9; value += 1) {
      deck.push(card(`${color}-${value}-a`, color, "number", value));
      deck.push(card(`${color}-${value}-b`, color, "number", value));
    }
    for (let copy = 0; copy < 2; copy += 1) {
      deck.push(card(`${color}-freeze-${copy}`, color, "freeze"));
      deck.push(card(`${color}-draw2-${copy}`, color, "draw2"));
    }
  }
  for (let copy = 0; copy < 4; copy += 1) {
    deck.push(card(`prism-${copy}`, null, "prism"));
  }
  return deck;
}

export function shufflePrismCards(cards: PrismCard[]): PrismCard[] {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function isPlayable(
  candidate: PrismCard,
  top: PrismCard,
  activeColor: PrismColor,
): boolean {
  if (candidate.kind === "prism") return true;
  if (candidate.color === activeColor) return true;
  if (candidate.kind !== top.kind) return false;
  return candidate.kind !== "number" || candidate.value === top.value;
}

export function legalCardIndexes(state: PrismGameState, actor: string): number[] {
  const top = state.discardPile[state.discardPile.length - 1];
  return (state.hands[actor] ?? [])
    .map((candidate, index) => (isPlayable(candidate, top, state.activeColor) ? index : -1))
    .filter((index) => index >= 0);
}

export function isNumberCombo(candidate: PrismCard, top: PrismCard): boolean {
  return (
    candidate.kind === "number" &&
    top.kind === "number" &&
    candidate.value === top.value &&
    candidate.color !== top.color
  );
}

function refillIfNeeded(
  drawPile: PrismCard[],
  discardPile: PrismCard[],
): { drawPile: PrismCard[]; discardPile: PrismCard[] } {
  if (drawPile.length > 0 || discardPile.length <= 1) return { drawPile, discardPile };
  const top = discardPile[discardPile.length - 1];
  return { drawPile: shufflePrismCards(discardPile.slice(0, -1)), discardPile: [top] };
}

function takeCards(
  drawPile: PrismCard[],
  discardPile: PrismCard[],
  count: number,
): { cards: PrismCard[]; drawPile: PrismCard[]; discardPile: PrismCard[] } {
  let draw = [...drawPile];
  let discard = [...discardPile];
  const cards: PrismCard[] = [];
  for (let index = 0; index < count; index += 1) {
    ({ drawPile: draw, discardPile: discard } = refillIfNeeded(draw, discard));
    const next = draw.pop();
    if (!next) break;
    cards.push(next);
  }
  return { cards, drawPile: draw, discardPile: discard };
}

function dealRound(
  order: string[],
  starter: string,
  scores: Record<string, number>,
  target: number,
  rounds: number,
  lastRoundWinner: string | null,
  lastAction: PrismAction | null,
): PrismGameState {
  const deck = shufflePrismCards(createPrismDeck());
  const hands: Record<string, PrismCard[]> = Object.fromEntries(order.map((seat) => [seat, []]));
  for (let count = 0; count < HAND_SIZE; count += 1) {
    for (const seat of order) hands[seat].push(deck.pop()!);
  }

  const startIndex = deck.findIndex((candidate) => candidate.kind === "number");
  const [opening] = deck.splice(startIndex, 1);
  return {
    hands,
    drawPile: deck,
    discardPile: [opening],
    activeColor: opening.color!,
    order,
    turn: starter,
    starter,
    comboUsed: false,
    scores,
    target,
    rounds,
    finished: false,
    winner: null,
    lastRoundWinner,
    lastAction,
  };
}

export function createPrismGame(
  order: string[],
  target = 2,
  starter = order[0],
): PrismGameState {
  return dealRound(
    order,
    starter,
    Object.fromEntries(order.map((seat) => [seat, 0])),
    target,
    0,
    null,
    null,
  );
}

function opponentOf(state: PrismGameState, actor: string): string | null {
  return state.order.find((seat) => seat !== actor) ?? null;
}

function completeRound(state: PrismGameState, winner: string): PrismGameState {
  const scores = { ...state.scores, [winner]: (state.scores[winner] ?? 0) + 1 };
  const rounds = state.rounds + 1;
  const lastAction: PrismAction = { actor: winner, kind: "roundWin" };
  if (scores[winner] >= state.target) {
    return {
      ...state,
      scores,
      rounds,
      turn: null,
      finished: true,
      winner,
      lastRoundWinner: winner,
      lastAction,
    };
  }

  const nextStarter = opponentOf(state, state.starter) ?? winner;
  return dealRound(
    state.order,
    nextStarter,
    scores,
    state.target,
    rounds,
    winner,
    lastAction,
  );
}

export function playPrismCard(
  state: PrismGameState,
  actor: string,
  cardIndex: number,
  chosenColor?: PrismColor,
): PrismGameState {
  if (state.finished || state.turn !== actor) return state;
  const hand = state.hands[actor] ?? [];
  const played = hand[cardIndex];
  const top = state.discardPile[state.discardPile.length - 1];
  if (!played || !isPlayable(played, top, state.activeColor)) return state;
  if (played.kind === "prism" && !chosenColor) return state;

  const opponent = opponentOf(state, actor);
  if (!opponent) return state;

  const hands = { ...state.hands, [actor]: hand.filter((_, index) => index !== cardIndex) };
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile, played];
  const activeColor = played.kind === "prism" ? chosenColor! : played.color!;
  const combo = !state.comboUsed && isNumberCombo(played, top);

  let action: PrismAction = { actor, kind: "play", card: played, color: activeColor };
  if (played.kind === "draw2") {
    const drawn = takeCards(drawPile, discardPile, 2);
    hands[opponent] = [...hands[opponent], ...drawn.cards];
    drawPile = drawn.drawPile;
    discardPile = drawn.discardPile;
    action = { actor, kind: "draw2", card: played, count: drawn.cards.length };
  } else if (played.kind === "freeze") {
    action = { actor, kind: "freeze", card: played };
  } else if (played.kind === "prism") {
    action = { actor, kind: "prism", card: played, color: activeColor };
  } else if (combo) {
    action = { actor, kind: "combo", card: played };
  }

  const next: PrismGameState = {
    ...state,
    hands,
    drawPile,
    discardPile,
    activeColor,
    turn: played.kind === "freeze" || combo ? actor : opponent,
    comboUsed: combo ? true : played.kind === "freeze" ? state.comboUsed : false,
    lastAction: action,
  };
  return hands[actor].length === 0 ? completeRound(next, actor) : next;
}

export function drawPrismCard(state: PrismGameState, actor: string): PrismGameState {
  if (state.finished || state.turn !== actor || legalCardIndexes(state, actor).length > 0) {
    return state;
  }
  const opponent = opponentOf(state, actor);
  if (!opponent) return state;
  const drawn = takeCards(state.drawPile, state.discardPile, 1);
  return {
    ...state,
    hands: { ...state.hands, [actor]: [...state.hands[actor], ...drawn.cards] },
    drawPile: drawn.drawPile,
    discardPile: drawn.discardPile,
    turn: opponent,
    comboUsed: false,
    lastAction: { actor, kind: "draw", count: drawn.cards.length },
  };
}
