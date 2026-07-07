"use client";

import type { RoomGameSettings } from "@/games/roomTypes";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { buyProperty, createBaronGame, passDecision, rollBaronTurn, upgradeProperty } from "./logic";
import type { BaronGameState } from "./types";

export type PropertyBaronRoomGame = BaronGameState;

function roundsFromSettings(settings?: RoomGameSettings): number {
  return settings?.maxRounds === "12" ? 12 : 20;
}

export function createInitialPropertyBaronRoomGame(settings?: RoomGameSettings): PropertyBaronRoomGame {
  const game = createBaronGame(["waiting-host", "waiting-guest"], roundsFromSettings(settings));
  return { ...game, players: {}, order: [], turn: null };
}

export function seedPropertyBaronRoomGame(
  _hostGame: PropertyBaronRoomGame,
  hostUid: string,
  guestUid: string,
  settings?: RoomGameSettings,
): PropertyBaronRoomGame {
  return createBaronGame([hostUid, guestUid], roundsFromSettings(settings));
}

export async function rollPropertyBaronRoom(code: string, uid: string): Promise<void> {
  await runRoomUpdate<PropertyBaronRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished || game.turn !== uid || game.phase !== "roll") return null;
    const next = rollBaronTurn(game, uid);
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function buyPropertyBaronRoom(code: string, uid: string): Promise<void> {
  await runRoomUpdate<PropertyBaronRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished || game.turn !== uid || game.phase !== "decision") return null;
    const next = buyProperty(game, uid);
    return next === game ? null : { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function upgradePropertyBaronRoom(code: string, uid: string): Promise<void> {
  await runRoomUpdate<PropertyBaronRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished || game.turn !== uid || game.phase !== "decision") return null;
    const next = upgradeProperty(game, uid);
    return next === game ? null : { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function passPropertyBaronRoom(code: string, uid: string): Promise<void> {
  await runRoomUpdate<PropertyBaronRoomGame>(code, (room) => {
    const game = room.game;
    if (room.status !== "playing" || game.finished || game.turn !== uid || game.phase !== "decision") return null;
    const next = passDecision(game, uid);
    return { game: next, status: next.finished ? "finished" : "playing" };
  });
}

export async function resetPropertyBaronRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<PropertyBaronRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return {
      game: createBaronGame(uids, room.game.maxRounds),
      status: "playing",
      rematchVotes: {},
    };
  });
}
