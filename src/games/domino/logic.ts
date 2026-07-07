import type { DominoAction, DominoBoardTile, DominoGameState, DominoSide, DominoTile } from "./types";

const HAND_SIZE = 7;
const LOG_CAP = 12;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDominoSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let a = 0; a <= 6; a += 1) {
    for (let b = a; b <= 6; b += 1) tiles.push({ id: `${a}-${b}`, a, b });
  }
  return shuffle(tiles);
}

export function sortDominoTiles(tiles: DominoTile[]): DominoTile[] {
  return [...tiles].sort((x, y) => {
    const dx = x.a === x.b ? 0 : 1;
    const dy = y.a === y.b ? 0 : 1;
    if (dx !== dy) return dx - dy;
    const sx = x.a + x.b;
    const sy = y.a + y.b;
    if (sx !== sy) return sy - sx;
    if (x.a !== y.a) return y.a - x.a;
    return y.b - x.b;
  });
}

export function tilePips(tile: DominoTile): number {
  return tile.a + tile.b;
}

export function createDominoGame(order: string[], starter = order[0]): DominoGameState {
  const set = createDominoSet();
  const hands: Record<string, DominoTile[]> = {};
  for (const actor of order) hands[actor] = sortDominoTiles(set.splice(0, HAND_SIZE));
  return {
    order,
    hands,
    boneyard: set,
    board: [],
    leftValue: null,
    rightValue: null,
    turn: starter,
    finished: false,
    winner: null,
    tie: false,
    consecutivePasses: 0,
    lastAction: null,
    log: [],
  };
}

function nextActor(state: DominoGameState, actor: string): string {
  return state.order.find((candidate) => candidate !== actor) ?? actor;
}

function addLog(state: DominoGameState, action: DominoAction): DominoAction[] {
  return [action, ...state.log].slice(0, LOG_CAP);
}

export function getPlayableSides(state: DominoGameState, tile: DominoTile): DominoSide[] {
  if (state.board.length === 0) return ["right"];
  const sides: DominoSide[] = [];
  if (tile.a === state.leftValue || tile.b === state.leftValue) sides.push("left");
  if (tile.a === state.rightValue || tile.b === state.rightValue) sides.push("right");
  return sides;
}

export function canPlayDominoTile(state: DominoGameState, actor: string, tile: DominoTile): boolean {
  return state.turn === actor && getPlayableSides(state, tile).length > 0;
}

export function getPlayableDominoes(state: DominoGameState, actor: string): DominoTile[] {
  return (state.hands[actor] ?? []).filter((tile) => getPlayableSides(state, tile).length > 0);
}

function handScore(tiles: DominoTile[]): number {
  return tiles.reduce((total, tile) => total + tilePips(tile), 0);
}

function finishBlocked(state: DominoGameState, actor: string, action: DominoAction): DominoGameState {
  const scores = state.order.map((seat) => ({ seat, score: handScore(state.hands[seat] ?? []) }));
  scores.sort((a, b) => a.score - b.score);
  const tie = scores.length > 1 && scores[0].score === scores[1].score;
  return {
    ...state,
    turn: null,
    finished: true,
    winner: tie ? null : scores[0].seat,
    tie,
    consecutivePasses: 2,
    lastAction: { ...action, kind: tie ? "block" : "win", actor: tie ? actor : scores[0].seat, score: scores[0].score },
    log: addLog(state, { ...action, kind: tie ? "block" : "win", actor: tie ? actor : scores[0].seat, score: scores[0].score }),
  };
}

function orientTile(state: DominoGameState, tile: DominoTile, side: DominoSide): DominoBoardTile | null {
  if (state.board.length === 0) return { ...tile, left: tile.a, right: tile.b };
  if (side === "left") {
    if (tile.a === state.leftValue) return { ...tile, left: tile.b, right: tile.a };
    if (tile.b === state.leftValue) return { ...tile, left: tile.a, right: tile.b };
  }
  if (tile.a === state.rightValue) return { ...tile, left: tile.a, right: tile.b };
  if (tile.b === state.rightValue) return { ...tile, left: tile.b, right: tile.a };
  return null;
}

export function playDominoTile(
  state: DominoGameState,
  actor: string,
  tileId: string,
  side: DominoSide,
): DominoGameState {
  if (state.finished || state.turn !== actor) return state;
  const hand = state.hands[actor] ?? [];
  const tile = hand.find((candidate) => candidate.id === tileId);
  if (!tile) return state;
  const legalSides = getPlayableSides(state, tile);
  const legalSide = legalSides.includes(side) ? side : legalSides[0];
  if (!legalSide) return state;
  const boardTile = orientTile(state, tile, legalSide);
  if (!boardTile) return state;

  const nextHand = hand.filter((candidate) => candidate.id !== tileId);
  const board = legalSide === "left" ? [boardTile, ...state.board] : [...state.board, boardTile];
  const action: DominoAction = {
    actor,
    kind: nextHand.length === 0 ? "win" : "play",
    tile,
    side: legalSide,
  };
  return {
    ...state,
    hands: { ...state.hands, [actor]: sortDominoTiles(nextHand) },
    board,
    leftValue: board[0].left,
    rightValue: board[board.length - 1].right,
    turn: nextHand.length === 0 ? null : nextActor(state, actor),
    finished: nextHand.length === 0,
    winner: nextHand.length === 0 ? actor : null,
    tie: false,
    consecutivePasses: 0,
    lastAction: action,
    log: addLog(state, action),
  };
}

export function drawDominoTile(state: DominoGameState, actor: string): DominoGameState {
  if (state.finished || state.turn !== actor) return state;
  if (getPlayableDominoes(state, actor).length > 0 || state.boneyard.length === 0) return state;
  const [drawn, ...boneyard] = state.boneyard;
  if (!drawn) return state;
  const action: DominoAction = { actor, kind: "draw", tile: drawn };
  return {
    ...state,
    boneyard,
    hands: { ...state.hands, [actor]: sortDominoTiles([...state.hands[actor], drawn]) },
    consecutivePasses: 0,
    lastAction: action,
    log: addLog(state, action),
  };
}

export function passDominoTurn(state: DominoGameState, actor: string): DominoGameState {
  if (state.finished || state.turn !== actor) return state;
  if (getPlayableDominoes(state, actor).length > 0 || state.boneyard.length > 0) return state;
  const action: DominoAction = { actor, kind: "pass" };
  const passes = state.consecutivePasses + 1;
  if (passes >= 2) return finishBlocked(state, actor, action);
  return {
    ...state,
    turn: nextActor(state, actor),
    consecutivePasses: passes,
    lastAction: action,
    log: addLog(state, action),
  };
}
