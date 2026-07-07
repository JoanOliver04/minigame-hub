import type { BaronActor, BaronGameState, BaronLogEntry, BaronStructuredLogEntry, BaronTile } from "./types";

export const START_MONEY = 1500;
export const START_BONUS = 200;
export const JAIL_FINE = 80;
export const LOW_CASH_RESERVE = 180;
type BaronLogInput = BaronStructuredLogEntry extends infer Entry
  ? Entry extends unknown
    ? Omit<Entry, "id">
    : never
  : never;

export const BARON_TILES: BaronTile[] = [
  { id: 0, kind: "start", name: "Start" },
  { id: 1, kind: "property", name: "Canal Row", group: "dock", price: 120, rent: 35, upgradeCost: 80 },
  { id: 2, kind: "bonus", name: "Dividend" },
  { id: 3, kind: "property", name: "Lantern Lane", group: "dock", price: 140, rent: 42, upgradeCost: 90 },
  { id: 4, kind: "tax", name: "City Tax" },
  { id: 5, kind: "property", name: "Copper Market", group: "market", price: 170, rent: 55, upgradeCost: 110 },
  { id: 6, kind: "market", name: "Market Shift" },
  { id: 7, kind: "property", name: "Orchid Park", group: "park", price: 210, rent: 70, upgradeCost: 130 },
  { id: 8, kind: "bonus", name: "Consulting Fee" },
  { id: 9, kind: "property", name: "Harbor Station", group: "transit", price: 240, rent: 82, upgradeCost: 150 },
  { id: 10, kind: "tax", name: "Repairs" },
  { id: 11, kind: "property", name: "Glass Tower", group: "tower", price: 300, rent: 110, upgradeCost: 190 },
  { id: 12, kind: "market", name: "Auction Day" },
  { id: 13, kind: "property", name: "Sunset Plaza", group: "market", price: 260, rent: 92, upgradeCost: 160 },
  { id: 14, kind: "bonus", name: "Rent Rebate" },
  { id: 15, kind: "property", name: "Crown Avenue", group: "tower", price: 360, rent: 135, upgradeCost: 220 },
];

export function rollDice(): [number, number] {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

function log(game: BaronGameState, entry: BaronLogInput): BaronLogEntry[] {
  const nextEntry = { id: Date.now() + Math.floor(Math.random() * 1000), ...entry } as BaronLogEntry;
  return [nextEntry, ...game.log].slice(0, 8);
}

export function propertyTiles(): BaronTile[] {
  return BARON_TILES.filter((tile) => tile.kind === "property");
}

function initialProperties(): Record<number, { owner: BaronActor | null; level: number }> {
  return Object.fromEntries(propertyTiles().map((tile) => [tile.id, { owner: null, level: 0 }]));
}

export function createBaronGame(order: BaronActor[], maxRounds = 20): BaronGameState {
  return {
    players: Object.fromEntries(
      order.map((uid) => [uid, { uid, money: START_MONEY, position: 0, inJail: 0, bankrupt: false }]),
    ),
    properties: initialProperties(),
    order,
    turn: order[0] ?? null,
    phase: "roll",
    dice: null,
    pendingTile: null,
    round: 1,
    maxRounds,
    finished: false,
    winner: null,
    log: [],
  };
}

function nextActor(game: BaronGameState, actor: BaronActor): BaronActor | null {
  const alive = game.order.filter((uid) => !game.players[uid]?.bankrupt);
  if (alive.length <= 1) return alive[0] ?? null;
  const index = alive.indexOf(actor);
  return alive[(index + 1) % alive.length];
}

function netWorthOf(game: BaronGameState, actor: BaronActor): number {
  const player = game.players[actor];
  if (!player || player.bankrupt) return -Infinity;
  return propertyTiles().reduce((sum, tile) => {
    const prop = game.properties[tile.id];
    if (prop?.owner !== actor) return sum;
    return sum + (tile.price ?? 0) + prop.level * (tile.upgradeCost ?? 0);
  }, player.money);
}

export function netWorth(game: BaronGameState, actor: BaronActor): number {
  return netWorthOf(game, actor);
}

function winnerByWorth(game: BaronGameState): BaronActor | null {
  return [...game.order].sort((a, b) => netWorthOf(game, b) - netWorthOf(game, a))[0] ?? null;
}

function finishIfNeeded(game: BaronGameState): BaronGameState {
  const alive = game.order.filter((uid) => !game.players[uid]?.bankrupt);
  if (alive.length <= 1) return { ...game, finished: true, phase: "finished", turn: null, winner: alive[0] ?? null };
  if (game.round > game.maxRounds) {
    const winner = winnerByWorth(game);
    return { ...game, finished: true, phase: "finished", turn: null, winner, log: log(game, { kind: "finalAudit" }) };
  }
  return game;
}

function charge(game: BaronGameState, from: BaronActor, to: BaronActor | null, amount: number, reason: string): BaronGameState {
  const payer = game.players[from];
  if (!payer || payer.bankrupt) return game;
  const paid = Math.min(payer.money, amount);
  const players = {
    ...game.players,
    [from]: { ...payer, money: payer.money - paid, bankrupt: payer.money - paid <= 0 },
  };
  if (to && players[to]) players[to] = { ...players[to], money: players[to].money + paid };
  const next = { ...game, players, log: log(game, { kind: "charge", reason, from, to, amount: paid }) };
  return finishIfNeeded(next);
}

function endTurn(game: BaronGameState, actor: BaronActor): BaronGameState {
  if (game.finished) return game;
  const next = nextActor(game, actor);
  const wrappedRound = next === game.order[0] ? game.round + 1 : game.round;
  return finishIfNeeded({ ...game, turn: next, phase: "roll", dice: null, pendingTile: null, round: wrappedRound });
}

export function rollBaronTurn(game: BaronGameState, actor: BaronActor, dice = rollDice()): BaronGameState {
  if (game.finished || game.phase !== "roll" || game.turn !== actor) return game;
  const player = game.players[actor];
  if (!player || player.bankrupt) return endTurn(game, actor);
  if (player.inJail > 0) {
    const players = { ...game.players, [actor]: { ...player, inJail: 0 } };
    return endTurn(
      charge({ ...game, players, dice, log: log(game, { kind: "leaveHolding", actor }) }, actor, null, JAIL_FINE, "Holding fine"),
      actor,
    );
  }

  const steps = dice[0] + dice[1];
  const passedStart = player.position + steps >= BARON_TILES.length;
  const position = (player.position + steps) % BARON_TILES.length;
  let next: BaronGameState = {
    ...game,
    players: {
      ...game.players,
      [actor]: { ...player, position, money: player.money + (passedStart ? START_BONUS : 0) },
    },
    dice,
    log: log(game, { kind: "roll", actor, a: dice[0], b: dice[1], tile: BARON_TILES[position].name }),
  };
  const tile = BARON_TILES[position];
  if (passedStart) next = { ...next, log: log(next, { kind: "passStart", actor, amount: START_BONUS }) };
  if (tile.kind === "bonus") {
    next = { ...next, players: { ...next.players, [actor]: { ...next.players[actor], money: next.players[actor].money + 120 } }, log: log(next, { kind: "bonus", actor, amount: 120 }) };
    return endTurn(next, actor);
  }
  if (tile.kind === "tax") return endTurn(charge(next, actor, null, 140, tile.name), actor);
  if (tile.kind === "market") {
    const bonus = 60 + propertyTiles().filter((p) => next.properties[p.id].owner === actor).length * 25;
    next = { ...next, players: { ...next.players, [actor]: { ...next.players[actor], money: next.players[actor].money + bonus } }, log: log(next, { kind: "market", actor, amount: bonus }) };
    return endTurn(next, actor);
  }
  const prop = next.properties[position];
  if (!prop || prop.owner === null) return { ...next, phase: "decision", pendingTile: position };
  if (prop.owner === actor) return { ...next, phase: "decision", pendingTile: position };
  const rent = (tile.rent ?? 0) * (1 + prop.level);
  return endTurn(charge(next, actor, prop.owner, rent, `${tile.name} rent`), actor);
}

export function buyProperty(game: BaronGameState, actor: BaronActor): BaronGameState {
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  if (!tile || tile.kind !== "property" || game.phase !== "decision" || game.turn !== actor) return game;
  const prop = game.properties[tile.id];
  const player = game.players[actor];
  if (!prop || prop.owner !== null || !player || player.money < (tile.price ?? 0)) return game;
  const next = {
    ...game,
    properties: { ...game.properties, [tile.id]: { owner: actor, level: 0 } },
    players: { ...game.players, [actor]: { ...player, money: player.money - (tile.price ?? 0) } },
    log: log(game, { kind: "buy", actor, tile: tile.name, price: tile.price ?? 0 }),
  };
  return endTurn(next, actor);
}

export function upgradeProperty(game: BaronGameState, actor: BaronActor): BaronGameState {
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  if (!tile || tile.kind !== "property" || game.phase !== "decision" || game.turn !== actor) return game;
  const prop = game.properties[tile.id];
  const player = game.players[actor];
  if (!prop || prop.owner !== actor || prop.level >= 2 || !player || player.money < (tile.upgradeCost ?? 0)) return game;
  const next = {
    ...game,
    properties: { ...game.properties, [tile.id]: { ...prop, level: prop.level + 1 } },
    players: { ...game.players, [actor]: { ...player, money: player.money - (tile.upgradeCost ?? 0) } },
    log: log(game, { kind: "upgrade", actor, tile: tile.name, level: prop.level + 1 }),
  };
  return endTurn(next, actor);
}

export function passDecision(game: BaronGameState, actor: BaronActor): BaronGameState {
  if (game.phase !== "decision" || game.turn !== actor) return game;
  return endTurn({ ...game, log: log(game, { kind: "pass", actor }) }, actor);
}

export function canBuy(game: BaronGameState, actor: BaronActor): boolean {
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  return Boolean(tile?.kind === "property" && game.properties[tile.id]?.owner === null && (game.players[actor]?.money ?? 0) >= (tile.price ?? 0));
}

export function canUpgrade(game: BaronGameState, actor: BaronActor): boolean {
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];
  return Boolean(tile?.kind === "property" && game.properties[tile.id]?.owner === actor && game.properties[tile.id].level < 2 && (game.players[actor]?.money ?? 0) >= (tile.upgradeCost ?? 0));
}
