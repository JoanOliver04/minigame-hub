"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { PenaltyResult } from "./types";

export interface PenaltyRoomResult {
  goals: number;
  kicks: PenaltyResult[];
}

export interface PenaltyRoomGame {
  results: Record<string, PenaltyRoomResult | null>;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): PenaltyRoomGame {
  return {
    results: Object.fromEntries(uids.map((uid) => [uid, null])),
    finished: false,
    winnerUid: null,
  };
}

export function createInitialPenaltyRoomGame(): PenaltyRoomGame {
  return freshGame([]);
}

export function seedPenaltyRoomGame(
  _hostGame: PenaltyRoomGame,
  hostUid: string,
  guestUid: string,
): PenaltyRoomGame {
  return freshGame([hostUid, guestUid]);
}

export async function submitPenaltyRoomResult(
  code: string,
  uid: string,
  result: PenaltyRoomResult,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.results.${uid}`]: result,
    updatedAt: serverTimestamp(),
  });
}

export async function resolvePenaltyRoomIfReady(code: string): Promise<void> {
  await runRoomUpdate<PenaltyRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished) return null;
    const uids = Object.keys(game.results);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = game.results[uidA];
    const b = game.results[uidB];
    if (!a || !b) return null;
    const winnerUid = a.goals === b.goals ? null : a.goals > b.goals ? uidA : uidB;
    return {
      game: { ...game, finished: true, winnerUid },
      status: "finished",
    };
  });
}

export async function resetPenaltyRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<PenaltyRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
