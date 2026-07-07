"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { BasketRound } from "./types";

export interface BasketRoomResult {
  score: number;
  history: BasketRound[];
}

export interface BasketRoomGame {
  results: Record<string, BasketRoomResult | null>;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): BasketRoomGame {
  return {
    results: Object.fromEntries(uids.map((uid) => [uid, null])),
    finished: false,
    winnerUid: null,
  };
}

export function createInitialBasketRoomGame(): BasketRoomGame {
  return freshGame([]);
}

export function seedBasketRoomGame(
  _hostGame: BasketRoomGame,
  hostUid: string,
  guestUid: string,
): BasketRoomGame {
  return freshGame([hostUid, guestUid]);
}

export async function submitBasketRoomResult(
  code: string,
  uid: string,
  result: BasketRoomResult,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.results.${uid}`]: result,
    updatedAt: serverTimestamp(),
  });
}

export async function resolveBasketRoomIfReady(code: string): Promise<void> {
  await runRoomUpdate<BasketRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished) return null;
    const uids = Object.keys(game.results);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = game.results[uidA];
    const b = game.results[uidB];
    if (!a || !b) return null;
    const winnerUid = a.score === b.score ? null : a.score > b.score ? uidA : uidB;
    return {
      game: { ...game, finished: true, winnerUid },
      status: "finished",
    };
  });
}

export async function resetBasketRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<BasketRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
