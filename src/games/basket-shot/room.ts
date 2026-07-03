/**
 * Basket Shot — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo mode keeps the release
 * -timing meter (logic.ts). PvP can't use a timing meter fairly across two
 * clients, so this module models a blind shot/defend duel instead: each
 * round one player shoots (picks a spot worth 1/2/3) and the other defends
 * (picks a spot to contest); the shot scores its value unless contested.
 *
 * Sync pattern: simultaneous-move like RPS (no `turn` field, so the turn
 * guard in firestore.rules is skipped). Both write their own blind pick, and
 * whichever client's listener first sees both present resolves the round.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";

/** First to this many points wins the match. */
export const BASKET_ROOM_TARGET = 7;

/** Shot spots and their point value; higher value = a juicier target to defend. */
export const BASKET_SPOTS = ["layup", "mid", "three"] as const;
export type BasketSpot = (typeof BASKET_SPOTS)[number];
export const SPOT_POINTS: Record<BasketSpot, 1 | 2 | 3> = { layup: 1, mid: 2, three: 3 };

/** Pure rule: score the spot's value unless the defender contested that spot. */
export function judgeShot(shot: BasketSpot, guard: BasketSpot): number {
  return shot === guard ? 0 : SPOT_POINTS[shot];
}

export interface BasketRoomHistoryEntry {
  id: number;
  shooterUid: string;
  shot: BasketSpot;
  guard: BasketSpot;
  points: number;
}

export interface BasketRoomGame {
  target: number;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  /** uid taking the shot this round; alternates every round. `null` once finished. */
  shooterUid: string | null;
  /** Cleared back to `null` for both uids once a round resolves. */
  pendingMoves: Record<string, BasketSpot | null>;
  /** Newest first, capped so the document can't grow unbounded. */
  history: BasketRoomHistoryEntry[];
}

const HISTORY_CAP = 10;

/** Host-only placeholder while the room is still "waiting" — see seedBasketRoomGame. */
export function createInitialBasketRoomGame(): BasketRoomGame {
  return {
    target: BASKET_ROOM_TARGET,
    scores: {},
    rounds: 0,
    finished: false,
    shooterUid: null,
    pendingMoves: {},
    history: [],
  };
}

/** Real seed, once both uids are known (called by joinRoom). Host shoots first. */
export function seedBasketRoomGame(
  _hostGame: BasketRoomGame,
  hostUid: string,
  guestUid: string,
): BasketRoomGame {
  return {
    target: BASKET_ROOM_TARGET,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    shooterUid: hostUid,
    pendingMoves: { [hostUid]: null, [guestUid]: null },
    history: [],
  };
}

/** Always conflict-free: a client only ever writes its own pending spot. */
export async function submitBasketMove(
  code: string,
  uid: string,
  spot: BasketSpot,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pendingMoves.${uid}`]: spot,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Called by both clients' listeners whenever pendingMoves changes; only
 * actually resolves once (runRoomUpdate is idempotent by construction).
 */
export async function resolveBasketRoundIfReady(code: string): Promise<void> {
  await runRoomUpdate<BasketRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || !g.shooterUid) return null;

    const uids = Object.keys(g.pendingMoves);
    if (uids.length !== 2) return null;
    const shooterUid = g.shooterUid;
    const defenderUid = uids.find((id) => id !== shooterUid);
    if (!defenderUid) return null;

    const shot = g.pendingMoves[shooterUid];
    const guard = g.pendingMoves[defenderUid];
    if (!shot || !guard) return null;

    const points = judgeShot(shot, guard);
    const scores = { ...g.scores };
    if (points > 0) scores[shooterUid] = (scores[shooterUid] ?? 0) + points;

    const rounds = g.rounds + 1;
    const finished = Object.values(scores).some((score) => score >= g.target);
    const entry: BasketRoomHistoryEntry = { id: rounds, shooterUid, shot, guard, points };

    return {
      game: {
        ...g,
        scores,
        rounds,
        finished,
        // Swap roles so both players shoot and defend in turn.
        shooterUid: finished ? null : defenderUid,
        pendingMoves: { [shooterUid]: null, [defenderUid]: null },
        history: [entry, ...g.history].slice(0, HISTORY_CAP),
      },
      status: finished ? "finished" : room.status,
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetBasketRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<BasketRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    return {
      game: {
        target: BASKET_ROOM_TARGET,
        scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
        rounds: 0,
        finished: false,
        shooterUid: room.hostUid,
        pendingMoves: Object.fromEntries(uids.map((uid) => [uid, null])),
        history: [],
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
