import { BARON_TILES, LOW_CASH_RESERVE, START_BONUS, buyProperty, canBuy, canUpgrade, passDecision, upgradeProperty } from "./logic";
import type { BaronGameState, PropertyDifficulty } from "./types";

const MIN_STEPS = 2;
const MAX_STEPS = 12;

function worstRentNextTurn(game: BaronGameState): number {
  const player = game.players.ai;
  let cost = 0;
  for (let steps = MIN_STEPS; steps <= MAX_STEPS; steps++) {
    const spaces = player.position + steps;
    const index = spaces % BARON_TILES.length;
    const property = game.properties[index];
    if (!property?.owner || property.owner === "ai") continue;
    const rent = (BARON_TILES[index].rent ?? 0) * (1 + property.level);
    cost = Math.max(cost, rent - (spaces >= BARON_TILES.length ? START_BONUS : 0));
  }
  return cost;
}

function remainingRentValue(game: BaronGameState, tileId: number, rent: number): number {
  const opponent = game.order.find((actor) => actor !== "ai");
  if (opponent === undefined || !game.players[opponent] || game.players[opponent].bankrupt) return 0;
  const turns = game.maxRounds - game.round + Number(game.order.indexOf("ai") < game.order.indexOf(opponent));
  if (turns <= 0) return 0;

  const { position, inJail } = game.players[opponent];
  const distance = (tileId - position + BARON_TILES.length) % BARON_TILES.length;
  const first = inJail === 0 && distance >= MIN_STEPS && distance <= MAX_STEPS
    ? (6 - Math.abs(distance - 7)) / 36
    : 0;
  return rent * (first + Math.max(0, turns - 1) / BARON_TILES.length);
}

export function chooseBaronAiDecision(game: BaronGameState, difficulty: PropertyDifficulty): "buy" | "upgrade" | "pass" {
  if (difficulty === "easy") {
    if (canBuy(game, "ai") && Math.random() < 0.55) return "buy";
    if (canUpgrade(game, "ai") && Math.random() < 0.35) return "upgrade";
    return "pass";
  }
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  const cash = game.players.ai?.money ?? 0;
  if (tile?.kind !== "property") return "pass";
  if (difficulty === "hard") {
    const reserve = Math.max(LOW_CASH_RESERVE, worstRentNextTurn(game) + 1);
    const revenue = remainingRentValue(game, tile.id, tile.rent ?? 0);
    if (canBuy(game, "ai") && revenue > 0 && cash - (tile.price ?? 0) >= reserve) return "buy";
    if (canUpgrade(game, "ai") && revenue > 0 && cash - (tile.upgradeCost ?? 0) >= reserve) return "upgrade";
    return "pass";
  }
  const reserve = LOW_CASH_RESERVE;
  if (canUpgrade(game, "ai")) {
    const roi = ((tile.rent ?? 0) * 0.75) / Math.max(1, tile.upgradeCost ?? 1);
    if (cash - (tile.upgradeCost ?? 0) >= reserve && roi > 0.38) return "upgrade";
  }
  if (canBuy(game, "ai")) {
    const ownedInGroup = BARON_TILES.filter((item) => item.group === tile.group && game.properties[item.id]?.owner === "ai").length;
    const pressure = ownedInGroup * 45 + (tile.rent ?? 0) * 2;
    if (cash - (tile.price ?? 0) >= reserve - pressure) return "buy";
  }
  return "pass";
}

export function applyBaronAiDecision(game: BaronGameState, difficulty: PropertyDifficulty): BaronGameState {
  const decision = chooseBaronAiDecision(game, difficulty);
  if (decision === "buy") return buyProperty(game, "ai");
  if (decision === "upgrade") return upgradeProperty(game, "ai");
  return passDecision(game, "ai");
}
