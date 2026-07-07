"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createParchisGame, moveParchisPiece, rollParchisDie } from "./logic";
import type { ParchisGameState } from "./types";

export type ParchisRoomGame = ParchisGameState;

export function createInitialParchisRoomGame(): ParchisRoomGame {
  const game = createParchisGame(["waiting-host", "waiting-guest"], 2);
  return { ...game, order: [], colors: {}, pieces: {}, turn: null };
}

export function seedParchisRoomGame(
  _hostGame: ParchisRoomGame,
  hostUid: string,
  guestUid: string,
): ParchisRoomGame {
  return createParchisGame([hostUid, guestUid], 2, hostUid);
}

export async function rollParchisRoom(code: string, uid: string, roll: number): Promise<void> {
  await runRoomUpdate<ParchisRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = rollParchisDie(room.game, uid, roll);
    return next === room.game ? null : { game: next };
  });
}

export async function moveParchisRoom(code: string, uid: string, pieceId: number): Promise<void> {
  await runRoomUpdate<ParchisRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = moveParchisPiece(room.game, uid, pieceId);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function resetParchisRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ParchisRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createParchisGame(uids, 2, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
