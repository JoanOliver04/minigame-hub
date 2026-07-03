/**
 * Fleet Command — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo mode is player-vs-a
 * placement-heatmap AI. PvP is straight two-player Battleship, reusing the
 * pure `randomFleet`/`applyShot`/`allSunk` rules and only adding uid-keyed
 * turn/shot bookkeeping.
 *
 * Two internal phases under the room's single "playing" status:
 *   - "placing": both players arrange (shuffle) a legal fleet and ready up.
 *     `turn` is null here so firestore.rules' turn guard lets EITHER player
 *     write their own fleet/ready flag.
 *   - "firing": strictly turn-based (turn = uid) — one shot per turn.
 *
 * Trust model: each fleet's real cells live in the room doc (the shot-
 * resolving transaction has to read them — no server compute), so a
 * determined peer could read the enemy layout. Same accepted trade-off as the
 * other room games (see README §2); the honest boundary would need Cloud
 * Functions, which this free-tier project deliberately avoids.
 */

"use client";

import { createRng, randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { allSunk, applyShot, randomFleet } from "./logic";
import type { ShotRecord, ShotResult, Ship } from "./types";

export type FleetPhase = "placing" | "firing";

export interface FleetRoomGame {
  phase: FleetPhase;
  /** Each seat's own ships (with hit counts). */
  fleets: Record<string, Ship[]>;
  ready: Record<string, boolean>;
  /** Shots fired BY each uid (against the opponent). */
  shots: Record<string, ShotRecord[]>;
  /** uid to fire now; `null` during placement and once finished. */
  turn: string | null;
  order: string[];
  finished: boolean;
  winnerUid: string | null;
  lastShot: { uid: string; index: number; result: ShotResult } | null;
}

function freshFleet(): Ship[] {
  return randomFleet(createRng(randomSeed()));
}

/** Host-only placeholder while the room is still "waiting" — see seedFleetRoomGame. */
export function createInitialFleetRoomGame(): FleetRoomGame {
  return {
    phase: "placing",
    fleets: {},
    ready: {},
    shots: {},
    turn: null,
    order: [],
    finished: false,
    winnerUid: null,
    lastShot: null,
  };
}

/** Real seed, once both uids are known. Both get a random starting fleet. */
export function seedFleetRoomGame(
  _hostGame: FleetRoomGame,
  hostUid: string,
  guestUid: string,
): FleetRoomGame {
  return {
    phase: "placing",
    fleets: { [hostUid]: freshFleet(), [guestUid]: freshFleet() },
    ready: { [hostUid]: false, [guestUid]: false },
    shots: { [hostUid]: [], [guestUid]: [] },
    turn: null,
    order: [hostUid, guestUid],
    finished: false,
    winnerUid: null,
    lastShot: null,
  };
}

/** Reshuffle this seat's fleet during placement (client passes a fresh legal fleet). */
export async function placeFleet(code: string, uid: string, ships: Ship[]): Promise<void> {
  await runRoomUpdate<FleetRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.phase !== "placing" || g.ready[uid]) return null;
    return { game: { ...g, fleets: { ...g.fleets, [uid]: ships } } };
  });
}

/** Lock in this seat's fleet; when both are ready the firing phase begins. */
export async function readyFleet(code: string, uid: string): Promise<void> {
  await runRoomUpdate<FleetRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.phase !== "placing") return null;
    const ready = { ...g.ready, [uid]: true };
    const bothReady = g.order.every((id) => ready[id]);
    return {
      game: {
        ...g,
        ready,
        phase: bothReady ? "firing" : "placing",
        turn: bothReady ? g.order[0] : null,
      },
    };
  });
}

export async function fireShot(code: string, uid: string, index: number): Promise<void> {
  await runRoomUpdate<FleetRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.phase !== "firing" || g.finished || g.turn !== uid) {
      return null;
    }
    const opponentUid = g.order.find((id) => id !== uid);
    if (!opponentUid) return null;
    if (g.shots[uid]?.some((shot) => shot.index === index)) return null; // already fired there

    const outcome = applyShot(g.fleets[opponentUid], index);
    const fleets = { ...g.fleets, [opponentUid]: outcome.ships };
    const shots = { ...g.shots, [uid]: [...(g.shots[uid] ?? []), outcome.record] };
    const won = allSunk(outcome.ships);

    return {
      game: {
        ...g,
        fleets,
        shots,
        finished: won,
        winnerUid: won ? uid : null,
        turn: won ? null : opponentUid,
        lastShot: { uid, index, result: outcome.result },
      },
      status: won ? "finished" : room.status,
    };
  });
}

export async function resetFleetRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<FleetRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const order = [room.hostUid, uids.find((id) => id !== room.hostUid)!];

    return {
      game: {
        phase: "placing",
        fleets: { [order[0]]: freshFleet(), [order[1]]: freshFleet() },
        ready: { [order[0]]: false, [order[1]]: false },
        shots: { [order[0]]: [], [order[1]]: [] },
        turn: null,
        order,
        finished: false,
        winnerUid: null,
        lastShot: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
