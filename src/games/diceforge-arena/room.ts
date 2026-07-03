/**
 * Diceforge Arena — room (PvP) state and mutations.
 *
 * Sibling to ai.ts, not a replacement: solo mode fights a scripted dice AI.
 * PvP is a simultaneous dice-battler duel reusing every pure rule
 * (rollDice / rerollExcept / scoreRoll / resolveCombat / buyUpgrade / winner /
 * newRound). Each round has two simultaneous phases: LOCK (both pick a die to
 * keep and reroll the rest → combat resolves once both have) and SHOP (both
 * buy one upgrade or skip → the round advances once both are done). Seats map
 * onto the pure rules' player/ai: host = player, guest = ai.
 *
 * Firestore note: a Fighter's `dice` is a Face[][] (array of arrays), which
 * Firestore can't store, so each fighter is persisted with a flat `diceFlat`
 * (3 dice × 6 faces = 18) and rebuilt into the nested Die[] inside each
 * transaction. No `turn` field — both players act each phase and it resolves
 * when both have.
 */

"use client";

import { createRng, randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { rerollExcept } from "./ai";
import {
  buyUpgrade,
  createFighter,
  newRound,
  resolveCombat,
  scoreRoll,
  shownFaces,
  winner,
} from "./logic";
import type { Face, Fighter, Offer, RollResult } from "./types";

const DICE_COUNT = 3;
const FACES_PER_DIE = 6;

/** Firestore-safe fighter: the Face[][] dice flattened to a single Face[]. */
export interface StoredFighter {
  health: number;
  shield: number;
  coins: number;
  discount: number;
  diceFlat: Face[];
}

function store(f: Fighter): StoredFighter {
  const { dice, ...rest } = f;
  return { ...rest, diceFlat: dice.flat() };
}

function load(sf: StoredFighter): Fighter {
  const { diceFlat, ...rest } = sf;
  const dice = Array.from({ length: DICE_COUNT }, (_, d) =>
    diceFlat.slice(d * FACES_PER_DIE, d * FACES_PER_DIE + FACES_PER_DIE),
  );
  return { ...rest, dice };
}

export interface ForgeRoomGame {
  round: number;
  stage: "lock" | "shop";
  fighters: Record<string, StoredFighter>;
  rolls: Record<string, number[]>;
  locked: Record<string, number | null>;
  results: Record<string, RollResult | null>;
  shop: Offer[];
  shopDone: Record<string, boolean>;
  order: string[];
  finished: boolean;
  winnerUid: string | null;
}

function dealGame(order: string[]): ForgeRoomGame {
  const rng = createRng(randomSeed());
  const [host, guest] = order;
  const p = createFighter();
  const a = createFighter();
  const round = newRound(1, p, a, rng);
  return {
    round: 1,
    stage: "lock",
    fighters: { [host]: store(p), [guest]: store(a) },
    rolls: { [host]: round.playerRoll, [guest]: round.aiRoll },
    locked: { [host]: null, [guest]: null },
    results: { [host]: null, [guest]: null },
    shop: round.shop,
    shopDone: { [host]: false, [guest]: false },
    order,
    finished: false,
    winnerUid: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedForgeRoomGame. */
export function createInitialForgeRoomGame(): ForgeRoomGame {
  return dealGame(["", ""]);
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedForgeRoomGame(
  _hostGame: ForgeRoomGame,
  hostUid: string,
  guestUid: string,
): ForgeRoomGame {
  return dealGame([hostUid, guestUid]);
}

/** Resolve the round once both players have finished shopping. */
function advanceRound(g: ForgeRoomGame): Partial<ForgeRoomGame> {
  const [host, guest] = g.order;
  const hostF = load(g.fighters[host]);
  const guestF = load(g.fighters[guest]);
  const out = winner(hostF, guestF, g.round + 1);

  if (out) {
    const winnerUid = out === "player" ? host : out === "ai" ? guest : null;
    return { finished: true, winnerUid, stage: "shop" };
  }

  const rng = createRng(randomSeed());
  const round = newRound(g.round + 1, hostF, guestF, rng);
  return {
    round: g.round + 1,
    stage: "lock",
    rolls: { [host]: round.playerRoll, [guest]: round.aiRoll },
    locked: { [host]: null, [guest]: null },
    results: { [host]: null, [guest]: null },
    shop: round.shop,
    shopDone: { [host]: false, [guest]: false },
  };
}

export async function lockAndReroll(code: string, uid: string, lock: number): Promise<void> {
  await runRoomUpdate<ForgeRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.stage !== "lock" || g.locked[uid] !== null) {
      return null;
    }
    const rng = createRng(randomSeed());
    const fighter = load(g.fighters[uid]);
    const newRoll = rerollExcept(fighter, g.rolls[uid], lock, rng);
    const result = scoreRoll(shownFaces(fighter.dice, newRoll));

    const rolls = { ...g.rolls, [uid]: newRoll };
    const locked = { ...g.locked, [uid]: lock };
    const results = { ...g.results, [uid]: result };

    const [host, guest] = g.order;
    const bothLocked = locked[host] !== null && locked[guest] !== null;
    if (!bothLocked) {
      return { game: { ...g, rolls, locked, results } };
    }

    // Both locked → resolve combat and open the shop.
    const [np, na] = resolveCombat(
      load(g.fighters[host]),
      load(g.fighters[guest]),
      results[host]!,
      results[guest]!,
    );
    return {
      game: {
        ...g,
        rolls,
        locked,
        results,
        fighters: { ...g.fighters, [host]: store(np), [guest]: store(na) },
        stage: "shop",
      },
    };
  });
}

async function finishShop(
  code: string,
  uid: string,
  purchase: ((f: Fighter) => Fighter | null) | null,
): Promise<void> {
  await runRoomUpdate<ForgeRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.stage !== "shop" || g.shopDone[uid]) return null;

    let fighters = g.fighters;
    if (purchase) {
      const bought = purchase(load(g.fighters[uid]));
      if (!bought) return null; // can't afford / invalid target
      fighters = { ...g.fighters, [uid]: store(bought) };
    }
    const shopDone = { ...g.shopDone, [uid]: true };

    const partial: ForgeRoomGame = { ...g, fighters, shopDone };
    const bothDone = g.order.every((id) => shopDone[id]);
    if (!bothDone) return { game: partial };

    const advance = advanceRound(partial);
    return {
      game: { ...partial, ...advance },
      status: advance.finished ? "finished" : room.status,
    };
  });
}

export async function buyForgeUpgrade(
  code: string,
  uid: string,
  offer: Offer,
  dieIndex: number,
  faceIndex: number,
): Promise<void> {
  await finishShop(code, uid, (f) => buyUpgrade(f, offer, dieIndex, faceIndex));
}

export async function skipForgeShop(code: string, uid: string): Promise<void> {
  await finishShop(code, uid, null);
}

export async function resetForgeRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ForgeRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const order = [room.hostUid, uids.find((id) => id !== room.hostUid)!];
    return { game: dealGame(order), status: "playing", rematchVotes: {} };
  });
}
