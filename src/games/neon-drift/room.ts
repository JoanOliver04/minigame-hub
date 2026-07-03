/**
 * Neon Drift — room (PvP) state and mutations.
 *
 * Sibling to ai.ts, not a replacement: solo mode races a precomputed-line AI
 * car. PvP is a TIME-ATTACK duel — both players race the SAME fixed track,
 * run their own deterministic physics locally (reusing initialCar/stepCar),
 * and the faster finish time wins. The tracks are hand-authored (not seeded),
 * so "same track" just means the shared `trackId`; the room only syncs that
 * plus each player's final time.
 *
 * Simultaneous-move like RPS (no `turn` field): each client writes its own
 * finish time blind; whichever listener sees both resolves the match.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";

export const DRIFT_ROOM_TRACK = "circuit";

export interface DriftRoomGame {
  trackId: string;
  /** Cleared to null per race until each player crosses the line. */
  results: Record<string, { finishTime: number } | null>;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): DriftRoomGame {
  return {
    trackId: DRIFT_ROOM_TRACK,
    results: Object.fromEntries(uids.map((uid) => [uid, null])),
    finished: false,
    winnerUid: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedDriftRoomGame. */
export function createInitialDriftRoomGame(): DriftRoomGame {
  return freshGame([]);
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedDriftRoomGame(
  _hostGame: DriftRoomGame,
  hostUid: string,
  guestUid: string,
): DriftRoomGame {
  return freshGame([hostUid, guestUid]);
}

/** Always conflict-free: a client only ever writes its own finish time. */
export async function submitDriftTime(code: string, uid: string, finishTime: number): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.results.${uid}`]: { finishTime },
    updatedAt: serverTimestamp(),
  });
}

/** Called by both clients' listeners once both times are in; resolves once. */
export async function resolveDriftIfReady(code: string): Promise<void> {
  await runRoomUpdate<DriftRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.results);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = g.results[uidA];
    const b = g.results[uidB];
    if (!a || !b) return null;

    // Tie when finish times are within 10 ms (matches solo raceResult).
    const winnerUid =
      Math.abs(a.finishTime - b.finishTime) <= 0.01 ? null : a.finishTime < b.finishTime ? uidA : uidB;
    return {
      game: { ...g, finished: true, winnerUid },
      status: "finished",
    };
  });
}

export async function resetDriftRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<DriftRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
