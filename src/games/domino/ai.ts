import { drawDominoTile, getPlayableDominoes, getPlayableSides, passDominoTurn, playDominoTile, tilePips } from "./logic";
import type { DominoDifficulty, DominoGameState, DominoSide, DominoTile } from "./types";

function sideValue(state: DominoGameState, tile: DominoTile, side: DominoSide): number {
  let value = tilePips(tile) * 2;
  if (tile.a === tile.b) value += 7;
  const openValue = side === "left" ? state.rightValue : state.leftValue;
  if (openValue !== null && (tile.a === openValue || tile.b === openValue)) value += 5;
  if (state.hands[state.order.find((seat) => seat !== state.turn) ?? ""]?.length <= 2) value += tilePips(tile);
  return value;
}

function tileKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

function unseenTiles(state: DominoGameState, actor: string): Array<[number, number]> {
  const known = new Set([...state.hands[actor], ...state.board].map(({ a, b }) => tileKey(a, b)));
  const unseen: Array<[number, number]> = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      if (!known.has(tileKey(a, b))) unseen.push([a, b]);
    }
  }
  return unseen;
}

function strategyValue(
  state: DominoGameState,
  actor: string,
  tile: DominoTile,
  side: DominoSide,
  unseen: Array<[number, number]>,
): number {
  const playedEnd = side === "left" ? state.leftValue : state.rightValue;
  const otherEnd = side === "left" ? state.rightValue : state.leftValue;
  const left = otherEnd ?? tile.a;
  const right = playedEnd === null ? tile.b : tile.a === playedEnd ? tile.b : tile.a;
  const matches = (a: number, b: number) => a === left || b === left || a === right || b === right;
  const handFit = state.hands[actor].filter((next) => next.id !== tile.id && matches(next.a, next.b)).length;
  const rival = state.order.find((seat) => seat !== actor);
  const cardsHeld = Math.min(unseen.length, rival === undefined ? 0 : state.hands[rival].length);
  const blanks = unseen.filter(([a, b]) => !matches(a, b)).length;
  let blocked = 1;
  for (let index = 0; index < cardsHeld; index++) {
    blocked *= Math.max(0, blanks - index) / (unseen.length - index);
  }
  return handFit * 9 + blocked * (cardsHeld <= 2 ? 26 : 14) - (handFit === 0 ? 14 : 0);
}

export function playDominoAiTurn(
  state: DominoGameState,
  actor: string,
  difficulty: DominoDifficulty,
): DominoGameState {
  const playable = getPlayableDominoes(state, actor);
  if (playable.length === 0) {
    return state.boneyard.length > 0 ? drawDominoTile(state, actor) : passDominoTurn(state, actor);
  }
  if (difficulty === "easy") {
    const tile = playable[Math.floor(Math.random() * playable.length)];
    const sides = getPlayableSides(state, tile);
    return playDominoTile(state, actor, tile.id, sides[Math.floor(Math.random() * sides.length)]);
  }
  const unseen = difficulty === "hard" ? unseenTiles(state, actor) : [];
  const options = playable.flatMap((tile) =>
    getPlayableSides(state, tile).map((side) => ({
      tile,
      side,
      value: sideValue(state, tile, side) + (difficulty === "hard" ? strategyValue(state, actor, tile, side, unseen) : 0),
    })),
  );
  options.sort((a, b) => b.value - a.value);
  const picked = difficulty === "medium" && options.length > 1 && Math.random() < 0.2 ? options[1] : options[0];
  return playDominoTile(state, actor, picked.tile.id, picked.side);
}
