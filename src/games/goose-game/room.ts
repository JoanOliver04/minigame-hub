"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import {
  createGooseGame,
  moveGooseToken,
  rerollGooseDie,
  rollGooseDie,
} from "./logic";
import type { GooseGameState } from "./types";

export type GooseRoomGame = GooseGameState;

export function createInitialGooseRoomGame(): GooseRoomGame {
  const game = createGooseGame(["waiting-host", "waiting-guest"]);
  return { ...game, order: [], positions: {}, feathers: {}, skippedTurns: {}, turn: null };
}

export function seedGooseRoomGame(
  _hostGame: GooseRoomGame,
  hostUid: string,
  guestUid: string,
): GooseRoomGame {
  return createGooseGame([hostUid, guestUid], hostUid);
}

export async function rollGooseRoom(code: string, uid: string, roll: number): Promise<void> {
  await runRoomUpdate<GooseRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = rollGooseDie(room.game, uid, roll);
    return next === room.game ? null : { game: next };
  });
}

export async function rerollGooseRoom(code: string, uid: string, roll: number): Promise<void> {
  await runRoomUpdate<GooseRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = rerollGooseDie(room.game, uid, roll);
    return next === room.game ? null : { game: next };
  });
}

export async function moveGooseRoom(code: string, uid: string): Promise<void> {
  await runRoomUpdate<GooseRoomGame>(code, (room) => {
    if (room.status !== "playing" || room.game.finished || room.game.turn !== uid) return null;
    const next = moveGooseToken(room.game, uid);
    if (next === room.game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function resetGooseRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<GooseRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createGooseGame(uids, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
