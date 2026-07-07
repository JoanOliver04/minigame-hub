"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createDominoGame, drawDominoTile, passDominoTurn, playDominoTile } from "./logic";
import type { DominoGameState, DominoSide } from "./types";

export type DominoRoomGame = DominoGameState;

export function createInitialDominoRoomGame(): DominoRoomGame {
  const game = createDominoGame(["waiting-host", "waiting-guest"]);
  return { ...game, order: [], hands: {}, turn: null };
}

export function seedDominoRoomGame(_hostGame: DominoRoomGame, hostUid: string, guestUid: string): DominoRoomGame {
  return createDominoGame([hostUid, guestUid], hostUid);
}

export async function playDominoRoomTile(
  code: string,
  uid: string,
  tileId: string,
  side: DominoSide,
): Promise<void> {
  await runRoomUpdate<DominoRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = playDominoTile(room.game, uid, tileId, side);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function drawDominoRoomTile(code: string, uid: string): Promise<void> {
  await runRoomUpdate<DominoRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = drawDominoTile(room.game, uid);
    if (next === room.game) return null;
    return { game: next };
  });
}

export async function passDominoRoomTurn(code: string, uid: string): Promise<void> {
  await runRoomUpdate<DominoRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = passDominoTurn(room.game, uid);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function resetDominoRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<DominoRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createDominoGame(uids, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
