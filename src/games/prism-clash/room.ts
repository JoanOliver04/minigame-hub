"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import {
  createPrismGame,
  drawPrismCard,
  legalCardIndexes,
  playPrismCard,
} from "./logic";
import type { PrismColor, PrismGameState } from "./types";

export type PrismRoomGame = PrismGameState;
export const PRISM_ROOM_TARGET = 2;

export function createInitialPrismRoomGame(): PrismRoomGame {
  const game = createPrismGame(["waiting-host", "waiting-guest"], PRISM_ROOM_TARGET);
  return { ...game, hands: {}, scores: {}, order: [], turn: null, starter: "" };
}

export function seedPrismRoomGame(
  _hostGame: PrismRoomGame,
  hostUid: string,
  guestUid: string,
): PrismRoomGame {
  return createPrismGame([hostUid, guestUid], PRISM_ROOM_TARGET, hostUid);
}

export async function playPrismRoomCard(
  code: string,
  uid: string,
  cardIndex: number,
  chosenColor?: PrismColor,
): Promise<void> {
  await runRoomUpdate<PrismRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished || game.turn !== uid) return null;
    const next = playPrismCard(game, uid, cardIndex, chosenColor);
    if (next === game) return null;
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function drawPrismRoomCard(code: string, uid: string): Promise<void> {
  await runRoomUpdate<PrismRoomGame>(code, (room) => {
    const game = room.game;
    if (
      room.status !== "playing" ||
      game.finished ||
      game.turn !== uid ||
      legalCardIndexes(game, uid).length > 0
    ) {
      return null;
    }
    const next = drawPrismCard(game, uid);
    return next === game ? null : { game: next };
  });
}

export async function resetPrismRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<PrismRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createPrismGame(uids, PRISM_ROOM_TARGET, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
