import type {
  TileRummyAction,
  TileRummyColor,
  TileRummyGameState,
  TileRummyMeld,
  TileRummyTile,
  TileRummyValidation,
} from "./types";

export const TILE_COLORS: TileRummyColor[] = ["ruby", "sun", "leaf", "sky"];
export const OPENING_SCORE = 30;
const HAND_SIZE = 14;
const LOG_CAP = 14;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createTileRummyDeck(): TileRummyTile[] {
  const tiles: TileRummyTile[] = [];
  for (let copy = 1; copy <= 2; copy += 1) {
    for (const color of TILE_COLORS) {
      for (let value = 1; value <= 13; value += 1) {
        tiles.push({ id: `${color}-${value}-${copy}`, color, value, joker: false });
      }
    }
  }
  tiles.push({ id: "joker-1", color: "joker", value: null, joker: true });
  tiles.push({ id: "joker-2", color: "joker", value: null, joker: true });
  return shuffle(tiles);
}

export function sortTiles(tiles: TileRummyTile[]): TileRummyTile[] {
  const colorRank: Record<TileRummyTile["color"], number> = {
    ruby: 0,
    sun: 1,
    leaf: 2,
    sky: 3,
    joker: 4,
  };
  return [...tiles].sort((a, b) => {
    if (a.joker !== b.joker) return a.joker ? 1 : -1;
    if (colorRank[a.color] !== colorRank[b.color]) return colorRank[a.color] - colorRank[b.color];
    return (a.value ?? 99) - (b.value ?? 99);
  });
}

export function createTileRummyGame(order: string[], starter = order[0]): TileRummyGameState {
  const deck = createTileRummyDeck();
  const hands: Record<string, TileRummyTile[]> = {};
  for (const actor of order) hands[actor] = sortTiles(deck.splice(0, HAND_SIZE));
  return {
    order,
    hands,
    deck,
    table: [],
    opened: Object.fromEntries(order.map((actor) => [actor, false])),
    turn: starter,
    finished: false,
    winner: null,
    lastAction: null,
    log: [],
  };
}

function nextActor(state: TileRummyGameState, actor: string): string {
  return state.order.find((candidate) => candidate !== actor) ?? actor;
}

function addLog(state: TileRummyGameState, action: TileRummyAction): TileRummyAction[] {
  return [action, ...state.log].slice(0, LOG_CAP);
}

function validateGroup(tiles: TileRummyTile[]): TileRummyValidation {
  const natural = tiles.filter((tile) => !tile.joker);
  if (natural.length === 0) return { valid: false, score: 0, reason: "mixed" };
  const value = natural[0].value!;
  if (natural.some((tile) => tile.value !== value)) {
    return { valid: false, score: 0, reason: "mixed" };
  }
  const colors = new Set(natural.map((tile) => tile.color));
  if (colors.size !== natural.length) {
    return { valid: false, score: 0, reason: "duplicateColor" };
  }
  if (tiles.length > 4) return { valid: false, score: 0, reason: "mixed" };
  return { valid: true, kind: "group", score: value * tiles.length };
}

function validateRun(tiles: TileRummyTile[]): TileRummyValidation {
  const natural = sortTiles(tiles.filter((tile) => !tile.joker));
  if (natural.length === 0) return { valid: false, score: 0, reason: "mixed" };
  const color = natural[0].color;
  if (natural.some((tile) => tile.color !== color)) {
    return { valid: false, score: 0, reason: "mixed" };
  }
  const values = natural.map((tile) => tile.value!);
  if (new Set(values).size !== values.length) return { valid: false, score: 0, reason: "gap" };
  const jokerCount = tiles.length - natural.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const gaps = max - min + 1 - natural.length;
  if (gaps > jokerCount) return { valid: false, score: 0, reason: "gap" };
  const spareJokers = jokerCount - gaps;
  const start = Math.max(1, min - spareJokers);
  const end = start + tiles.length - 1;
  if (end > 13) return { valid: false, score: 0, reason: "gap" };
  const score = Array.from({ length: tiles.length }, (_, i) => start + i).reduce((a, b) => a + b, 0);
  return { valid: true, kind: "run", score };
}

export function validateTileRummyMeld(
  state: TileRummyGameState,
  actor: string,
  tiles: TileRummyTile[],
): TileRummyValidation {
  if (tiles.length < 3) return { valid: false, score: 0, reason: "tooFew" };
  const group = validateGroup(tiles);
  const run = validateRun(tiles);
  const best = group.valid && (!run.valid || group.score >= run.score) ? group : run;
  if (!best.valid) return group.reason === "mixed" ? run : group;
  if (!state.opened[actor] && best.score < OPENING_SCORE) {
    return { ...best, valid: false, reason: "opening" };
  }
  return best;
}

export function canPlayAnyMeld(state: TileRummyGameState, actor: string): boolean {
  return findTileRummyMelds(state, actor).length > 0;
}

function combinations<T>(items: T[], min: number, max: number): T[][] {
  const result: T[][] = [];
  function walk(start: number, picked: T[]) {
    if (picked.length >= min) result.push([...picked]);
    if (picked.length === max) return;
    for (let i = start; i < items.length; i += 1) walk(i + 1, [...picked, items[i]]);
  }
  walk(0, []);
  return result;
}

export function findTileRummyMelds(state: TileRummyGameState, actor: string): TileRummyMeld[] {
  return combinations(state.hands[actor] ?? [], 3, 5)
    .map((tiles, index) => {
      const validation = validateTileRummyMeld(state, actor, tiles);
      if (!validation.valid || !validation.kind) return null;
      return {
        id: `candidate-${index}`,
        owner: actor,
        kind: validation.kind,
        tiles,
        score: validation.score,
      } satisfies TileRummyMeld;
    })
    .filter((meld): meld is TileRummyMeld => Boolean(meld));
}

export function playTileRummyMeld(
  state: TileRummyGameState,
  actor: string,
  tileIds: string[],
): TileRummyGameState {
  if (state.finished || state.turn !== actor || tileIds.length < 3) return state;
  const hand = state.hands[actor];
  const idSet = new Set(tileIds);
  if (idSet.size !== tileIds.length || tileIds.some((id) => !hand.some((tile) => tile.id === id))) {
    return state;
  }
  const tiles = hand.filter((tile) => idSet.has(tile.id));
  const validation = validateTileRummyMeld(state, actor, tiles);
  if (!validation.valid || !validation.kind) return state;

  const nextHand = hand.filter((tile) => !idSet.has(tile.id));
  const action: TileRummyAction = {
    actor,
    kind: nextHand.length === 0 ? "win" : "meld",
    meldKind: validation.kind,
    score: validation.score,
    count: tiles.length,
  };
  return {
    ...state,
    hands: { ...state.hands, [actor]: sortTiles(nextHand) },
    table: [
      {
        id: `meld-${state.table.length + 1}-${Date.now()}`,
        owner: actor,
        kind: validation.kind,
        tiles,
        score: validation.score,
      },
      ...state.table,
    ],
    opened: { ...state.opened, [actor]: true },
    turn: nextHand.length === 0 ? null : nextActor(state, actor),
    finished: nextHand.length === 0,
    winner: nextHand.length === 0 ? actor : null,
    lastAction: action,
    log: addLog(state, action),
  };
}

export function drawTileRummyTile(state: TileRummyGameState, actor: string): TileRummyGameState {
  if (state.finished || state.turn !== actor) return state;
  if (canPlayAnyMeld(state, actor)) return state;
  const [drawn, ...deck] = state.deck;
  if (!drawn) {
    const handScores = state.order.map((seat) => ({
      seat,
      score: state.hands[seat].reduce((total, tile) => total + (tile.value ?? 30), 0),
    }));
    handScores.sort((a, b) => a.score - b.score);
    const winner = handScores[0].seat;
    const action: TileRummyAction = { actor: winner, kind: "win", score: handScores[0].score };
    return {
      ...state,
      turn: null,
      finished: true,
      winner,
      lastAction: action,
      log: addLog(state, action),
    };
  }
  const action: TileRummyAction = { actor, kind: "draw", count: 1 };
  return {
    ...state,
    deck,
    hands: { ...state.hands, [actor]: sortTiles([...state.hands[actor], drawn]) },
    turn: nextActor(state, actor),
    lastAction: action,
    log: addLog(state, action),
  };
}
