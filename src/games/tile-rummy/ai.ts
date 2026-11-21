import { canPlayAnyMeld, drawTileRummyTile, findTileRummyMelds, playTileRummyMeld } from "./logic";
import type { TileRummyDifficulty, TileRummyGameState, TileRummyMeld } from "./types";

const HARD_SHORTLIST = 8;

function meldValue(meld: TileRummyMeld, state: TileRummyGameState, actor: string): number {
  let value = meld.score + meld.tiles.length * 3;
  if (!state.opened[actor] && meld.score >= 30) value += 50;
  if (meld.tiles.some((tile) => tile.joker)) value -= 8;
  if (state.hands[actor].length - meld.tiles.length <= 2) value += 30;
  if (meld.kind === "run") value += 4;
  return value;
}

function scoreNextRack(state: TileRummyGameState, actor: string, meld: TileRummyMeld): number {
  const selected = new Set(meld.tiles.map((tile) => tile.id));
  const remaining = state.hands[actor].filter((tile) => !selected.has(tile.id));
  if (remaining.length < 3) return 0;
  const next = { ...state, hands: { ...state.hands, [actor]: remaining }, opened: { ...state.opened, [actor]: true } };
  return canPlayAnyMeld(next, actor) ? 45 : 0;
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
  if (difficulty === "hard") {
    const winning = melds.find((meld) => meld.tiles.length === state.hands[actor].length);
    if (winning) return playTileRummyMeld(state, actor, winning.tiles.map((tile) => tile.id));
  }
  const scored = melds
    .map((meld) => ({ meld, value: meldValue(meld, state, actor) }))
    .sort((a, b) => b.value - a.value);
  const ranked = difficulty === "hard"
    ? scored.slice(0, HARD_SHORTLIST).map(({ meld, value }) => ({
        meld, value: value + scoreNextRack(state, actor, meld),
      })).sort((a, b) => b.value - a.value)
    : scored;
  const chosen =
    difficulty === "medium" && ranked.length > 1 && Math.random() < 0.22
      ? ranked[1].meld
      : ranked[0].meld;
  return playTileRummyMeld(state, actor, chosen.tiles.map((tile) => tile.id));
}
