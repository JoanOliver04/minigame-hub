import { BARON_TILES, LOW_CASH_RESERVE, buyProperty, canBuy, canUpgrade, passDecision, upgradeProperty } from "./logic";
import type { BaronGameState, PropertyDifficulty } from "./types";

export function chooseBaronAiDecision(game: BaronGameState, difficulty: PropertyDifficulty): "buy" | "upgrade" | "pass" {
  if (difficulty === "easy") {
    if (canBuy(game, "ai") && Math.random() < 0.55) return "buy";
    if (canUpgrade(game, "ai") && Math.random() < 0.35) return "upgrade";
    return "pass";
  }
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  const cash = game.players.ai?.money ?? 0;
  const reserve = difficulty === "hard" ? LOW_CASH_RESERVE + 120 : LOW_CASH_RESERVE;
  if (tile?.kind !== "property") return "pass";
  if (canUpgrade(game, "ai")) {
    const roi = ((tile.rent ?? 0) * 0.75) / Math.max(1, tile.upgradeCost ?? 1);
    if (cash - (tile.upgradeCost ?? 0) >= reserve && (difficulty === "hard" ? roi > 0.28 : roi > 0.38)) return "upgrade";
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
