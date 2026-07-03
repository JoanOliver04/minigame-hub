/**
 * Rock-Paper-Scissors — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * MatchState (youScore/aiScore + AI learning fields). This module reuses
 * only the pure, AI-free `judge()` rule from logic.ts and defines its own
 * uid-keyed bookkeeping, since MatchState's shape has no meaning in PvP.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { judge, type Move, type RoundResult } from "./logic";

/** Fixed for the room MVP — no "first to N" picker yet, unlike solo mode. */
export const RPS_ROOM_TARGET = 3;

export interface RpsRoomHistoryEntry {
  id: number;
  moves: Record<string, Move>;
  /** Result per uid, from that uid's own point of view. */
  result: Record<string, RoundResult>;
}

export interface RpsRoomGame {
  target: number;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  /** Cleared back to `null` for both uids once a round resolves. */
  pendingMoves: Record<string, Move | null>;
  /** Newest first, capped so the document can't grow unbounded. */
  history: RpsRoomHistoryEntry[];
}

const HISTORY_CAP = 10;

/** Host-only placeholder while the room is still "waiting" — see seedRpsRoomGame. */
export function createInitialRpsRoomGame(): RpsRoomGame {
  return { target: RPS_ROOM_TARGET, scores: {}, rounds: 0, finished: false, pendingMoves: {}, history: [] };
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedRpsRoomGame(
  _hostGame: RpsRoomGame,
  hostUid: string,
  guestUid: string,
): RpsRoomGame {
  return {
    target: RPS_ROOM_TARGET,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    pendingMoves: { [hostUid]: null, [guestUid]: null },
    history: [],
  };
}

/** Always conflict-free: a client only ever writes its own pending move. */
export async function submitRpsMove(code: string, uid: string, move: Move): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pendingMoves.${uid}`]: move,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Called by both clients' listeners whenever pendingMoves changes; only
 * actually resolves once. See runRoomUpdate's doc comment for why this is
 * safe without designating either client as authoritative.
 */
export async function resolveRpsRoundIfReady(code: string): Promise<void> {
  await runRoomUpdate<RpsRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.pendingMoves);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const moveA = g.pendingMoves[uidA];
    const moveB = g.pendingMoves[uidB];
    if (!moveA || !moveB) return null;

    const resultA = judge(moveA, moveB);
    const resultB = judge(moveB, moveA);
    const scores = { ...g.scores };
    if (resultA === "win") scores[uidA] = (scores[uidA] ?? 0) + 1;
    if (resultB === "win") scores[uidB] = (scores[uidB] ?? 0) + 1;

    const rounds = g.rounds + 1;
    const finished = scores[uidA] >= g.target || scores[uidB] >= g.target;
    const entry: RpsRoomHistoryEntry = {
      id: rounds,
      moves: { [uidA]: moveA, [uidB]: moveB },
      result: { [uidA]: resultA, [uidB]: resultB },
    };

    return {
      game: {
        ...g,
        scores,
        rounds,
        finished,
        pendingMoves: { [uidA]: null, [uidB]: null },
        history: [entry, ...g.history].slice(0, HISTORY_CAP),
      },
      status: finished ? "finished" : room.status,
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetRpsRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<RpsRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const [uidA, uidB] = uids;

    return {
      game: {
        target: RPS_ROOM_TARGET,
        scores: { [uidA]: 0, [uidB]: 0 },
        rounds: 0,
        finished: false,
        pendingMoves: { [uidA]: null, [uidB]: null },
        history: [],
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
