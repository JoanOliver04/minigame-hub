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
  const options = playable.flatMap((tile) =>
    getPlayableSides(state, tile).map((side) => ({ tile, side, value: sideValue(state, tile, side) })),
  );
  options.sort((a, b) => b.value - a.value);
  const picked = difficulty === "medium" && options.length > 1 && Math.random() < 0.2 ? options[1] : options[0];
  return playDominoTile(state, actor, picked.tile.id, picked.side);
}
