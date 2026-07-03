/**
 * Penalty Kick — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using the
 * continuous physics model (aim/power/keeper reach in logic.ts). PvP can't
 * reuse that engine — a blind, simultaneous duel needs a small discrete
 * ruleset instead, so this module defines its own zone-based `judgeKick`
 * and uid-keyed bookkeeping.
 *
 * Sync pattern: simultaneous-move, exactly like RPS (no `turn` field, so the
 * turn guard in firestore.rules is skipped). Each round one seated player is
 * the shooter and the other the keeper; both write their own pending zone
 * blind, and whichever client's listener first sees both present resolves
 * the round in a transaction (idempotent — see resolvePenaltyRoundIfReady).
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";

/** First to this many goals wins the match. */
export const PENALTY_ROOM_TARGET = 3;

/** Six-zone goal grid: high/low × left/center/right. */
export const PENALTY_ZONES = ["HL", "HC", "HR", "LL", "LC", "LR"] as const;
export type PenaltyZone = (typeof PENALTY_ZONES)[number];

/** Pure rule: a goal unless the keeper dived to the exact shot zone. */
export function judgeKick(shot: PenaltyZone, dive: PenaltyZone): "goal" | "saved" {
  return shot === dive ? "saved" : "goal";
}

export interface PenaltyRoomHistoryEntry {
  id: number;
  shooterUid: string;
  shot: PenaltyZone;
  dive: PenaltyZone;
  goal: boolean;
}

export interface PenaltyRoomGame {
  target: number;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  /** uid taking the kick this round; alternates every round. `null` once finished. */
  shooterUid: string | null;
  /** Cleared back to `null` for both uids once a round resolves. */
  pendingMoves: Record<string, PenaltyZone | null>;
  /** Newest first, capped so the document can't grow unbounded. */
  history: PenaltyRoomHistoryEntry[];
}

const HISTORY_CAP = 10;

/** Host-only placeholder while the room is still "waiting" — see seedPenaltyRoomGame. */
export function createInitialPenaltyRoomGame(): PenaltyRoomGame {
  return {
    target: PENALTY_ROOM_TARGET,
    scores: {},
    rounds: 0,
    finished: false,
    shooterUid: null,
    pendingMoves: {},
    history: [],
  };
}

/** Real seed, once both uids are known (called by joinRoom). Host shoots first. */
export function seedPenaltyRoomGame(
  _hostGame: PenaltyRoomGame,
  hostUid: string,
  guestUid: string,
): PenaltyRoomGame {
  return {
    target: PENALTY_ROOM_TARGET,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    shooterUid: hostUid,
    pendingMoves: { [hostUid]: null, [guestUid]: null },
    history: [],
  };
}

/** Always conflict-free: a client only ever writes its own pending zone. */
export async function submitPenaltyMove(
  code: string,
  uid: string,
  zone: PenaltyZone,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pendingMoves.${uid}`]: zone,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Called by both clients' listeners whenever pendingMoves changes; only
 * actually resolves once (runRoomUpdate is idempotent by construction).
 */
export async function resolvePenaltyRoundIfReady(code: string): Promise<void> {
  await runRoomUpdate<PenaltyRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || !g.shooterUid) return null;

    const uids = Object.keys(g.pendingMoves);
    if (uids.length !== 2) return null;
    const shooterUid = g.shooterUid;
    const keeperUid = uids.find((id) => id !== shooterUid);
    if (!keeperUid) return null;

    const shot = g.pendingMoves[shooterUid];
    const dive = g.pendingMoves[keeperUid];
    if (!shot || !dive) return null;

    const goal = judgeKick(shot, dive) === "goal";
    const scores = { ...g.scores };
    if (goal) scores[shooterUid] = (scores[shooterUid] ?? 0) + 1;

    const rounds = g.rounds + 1;
    const finished = Object.values(scores).some((score) => score >= g.target);
    const entry: PenaltyRoomHistoryEntry = { id: rounds, shooterUid, shot, dive, goal };

    return {
      game: {
        ...g,
        scores,
        rounds,
        finished,
        // Swap roles so both players shoot and keep in turn.
        shooterUid: finished ? null : keeperUid,
        pendingMoves: { [shooterUid]: null, [keeperUid]: null },
        history: [entry, ...g.history].slice(0, HISTORY_CAP),
      },
      status: finished ? "finished" : room.status,
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetPenaltyRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<PenaltyRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    return {
      game: {
        target: PENALTY_ROOM_TARGET,
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
