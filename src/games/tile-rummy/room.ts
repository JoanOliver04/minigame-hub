"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createTileRummyGame, drawTileRummyTile, playTileRummyMeld } from "./logic";
import type { TileRummyGameState } from "./types";

export type TileRummyRoomGame = TileRummyGameState;

export function createInitialTileRummyRoomGame(): TileRummyRoomGame {
  const game = createTileRummyGame(["waiting-host", "waiting-guest"]);
  return { ...game, order: [], hands: {}, opened: {}, turn: null };
}

export function seedTileRummyRoomGame(
  _hostGame: TileRummyRoomGame,
  hostUid: string,
  guestUid: string,
): TileRummyRoomGame {
  return createTileRummyGame([hostUid, guestUid], hostUid);
}

export async function playTileRummyRoomMeld(
  code: string,
  uid: string,
  tileIds: string[],
): Promise<void> {
  await runRoomUpdate<TileRummyRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = playTileRummyMeld(room.game, uid, tileIds);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function drawTileRummyRoomTile(code: string, uid: string): Promise<void> {
  await runRoomUpdate<TileRummyRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = drawTileRummyTile(room.game, uid);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function resetTileRummyRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<TileRummyRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createTileRummyGame(uids, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
