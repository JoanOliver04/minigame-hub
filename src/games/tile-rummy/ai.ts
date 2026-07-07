import { drawTileRummyTile, findTileRummyMelds, playTileRummyMeld } from "./logic";
import type { TileRummyDifficulty, TileRummyGameState, TileRummyMeld } from "./types";

function meldValue(meld: TileRummyMeld, state: TileRummyGameState, actor: string): number {
  let value = meld.score + meld.tiles.length * 3;
  if (!state.opened[actor] && meld.score >= 30) value += 50;
  if (meld.tiles.some((tile) => tile.joker)) value -= 8;
  if (state.hands[actor].length - meld.tiles.length <= 2) value += 30;
  if (meld.kind === "run") value += 4;
  return value;
}

export function playTileRummyAiTurn(
  state: TileRummyGameState,
  actor: string,
  difficulty: TileRummyDifficulty,
): TileRummyGameState {
  const melds = findTileRummyMelds(state, actor);
  if (melds.length === 0) return drawTileRummyTile(state, actor);
  if (difficulty === "easy") {
    const chosen = melds[Math.floor(Math.random() * melds.length)];
    return playTileRummyMeld(state, actor, chosen.tiles.map((tile) => tile.id));
  }
  const scored = melds
    .map((meld) => ({ meld, value: meldValue(meld, state, actor) }))
    .sort((a, b) => b.value - a.value);
  const chosen =
    difficulty === "medium" && scored.length > 1 && Math.random() < 0.22
      ? scored[1].meld
      : scored[0].meld;
  return playTileRummyMeld(state, actor, chosen.tiles.map((tile) => tile.id));
}
