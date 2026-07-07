/**
 * Generic room CRUD + realtime subscription over Firestore. This module has
 * zero knowledge of any specific mini-game: per-game state lives under the
 * opaque `game` field (see types.ts) and per-game mutation logic (resolving
 * a round, enforcing a turn, resetting for a rematch) lives in each game's
 * own src/games/<id>/room.ts, built on top of `runRoomUpdate` below.
 */

"use client";

import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { generateRoomCode } from "./code";
import { isRoomExpired } from "./expiry";
import type { RoomDoc, RoomStatus } from "./types";

const ROOMS_COLLECTION = "rooms";
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const CREATE_ATTEMPTS = 5;

function roomRef(code: string) {
  return doc(getDb(), ROOMS_COLLECTION, code);
}

export class RoomError extends Error {}

/**
 * Creates a room with a fresh, collision-checked code. `createInitialGame`
 * produces the per-game payload for the host-only "waiting" state (the
 * guest's side of the game is seeded once they join, by joinRoom's caller —
 * see each game's room.ts for how it re-seeds `game` on join).
 */
export async function createRoom<TGame>(
  gameId: string,
  hostUid: string,
  hostName: string,
  createInitialGame: () => TGame,
  gameSettings: Record<string, string> = {},
): Promise<string> {
  for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    const now = Date.now();
    const room: RoomDoc<TGame> = {
      code,
      gameId,
      gameSettings,
      status: "waiting",
      hostUid,
      players: {
        [hostUid]: {
          uid: hostUid,
          name: hostName,
          role: "host",
          joinedAt: Timestamp.now(),
        },
      },
      rematchVotes: {},
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
      expiresAt: Timestamp.fromMillis(now + ROOM_TTL_MS),
      game: createInitialGame(),
    };
    await setDoc(ref, room);
    return code;
  }
  throw new RoomError("Could not allocate a free room code, please try again.");
}

/**
 * Joins as the second (guest) player. `seedGame` receives the host-seeded
 * game payload and the joining uid, and returns the game payload both
 * players will actually play with (e.g. assigning marks/turn order once
 * both uids are known).
 */
export async function joinRoom<TGame>(
  code: string,
  guestUid: string,
  guestName: string,
  seedGame: (
    hostGame: TGame,
    hostUid: string,
    guestUid: string,
    settings?: Record<string, string>,
  ) => TGame,
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new RoomError("Room not found.");
    const room = snap.data() as RoomDoc<TGame>;

    if (isRoomExpired(room)) throw new RoomError("This room has expired.");
    if (room.status !== "waiting" || Object.keys(room.players).length !== 1) {
      throw new RoomError("This room is no longer joinable.");
    }
    if (room.players[guestUid]) return; // already seated (e.g. rejoined tab)

    tx.update(ref, {
      status: "playing" satisfies RoomStatus,
      [`players.${guestUid}`]: {
        uid: guestUid,
        name: guestName,
        role: "guest",
        joinedAt: Timestamp.now(),
      },
      game: seedGame(room.game, room.hostUid, guestUid, room.gameSettings ?? {}),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function switchRoomGame<TGame>(
  code: string,
  uid: string,
  nextGameId: string,
  gameSettings: Record<string, string>,
  createInitialGame: (settings?: Record<string, string>) => TGame,
  seedGame: (
    hostGame: TGame,
    hostUid: string,
    guestUid: string,
    settings?: Record<string, string>,
  ) => TGame,
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new RoomError("Room not found.");
    const room = snap.data() as RoomDoc<unknown>;
    if (isRoomExpired(room)) throw new RoomError("This room has expired.");
    if (room.hostUid !== uid || !room.players[uid]) throw new RoomError("Only the host can change games.");
    if (room.status === "abandoned") throw new RoomError("This room has ended.");

    const uids = Object.keys(room.players);
    const hostGame = createInitialGame(gameSettings);
    const nextGame =
      uids.length >= 2
        ? seedGame(hostGame, room.hostUid, uids.find((id) => id !== room.hostUid)!, gameSettings)
        : hostGame;

    tx.update(ref, {
      gameId: nextGameId,
      gameSettings,
      game: nextGame,
      status: uids.length >= 2 ? ("playing" satisfies RoomStatus) : ("waiting" satisfies RoomStatus),
      rematchVotes: {},
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeRoom<TGame>(
  code: string,
  onChange: (room: RoomDoc<TGame> | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    roomRef(code),
    (snap) => onChange(snap.exists() ? (snap.data() as RoomDoc<TGame>) : null),
    (error) => onError?.(error),
  );
}

export async function leaveRoom(code: string): Promise<void> {
  await updateDoc(roomRef(code), {
    status: "abandoned" satisfies RoomStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function voteRematch(code: string, uid: string): Promise<void> {
  await updateDoc(roomRef(code), {
    [`rematchVotes.${uid}`]: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Generic, idempotent-by-construction mutation primitive: re-reads the room
 * inside a transaction and lets the caller decide, from fresh server state,
 * whether there's anything left to do. Returning `null` means "someone else
 * already applied this" — a safe no-op, not an error. This is what backs
 * both "resolve the round once both moves are in" (simultaneous-move games)
 * and "reset for rematch once both players voted" without any client being
 * designated as the authoritative host.
 *
 * An expired room is treated the same way: silently skipped rather than
 * mutated. Firestore's Security Rules reject the write either way (see
 * `notExpired()` in firestore.rules) — this check just avoids computing a
 * patch that would be rejected anyway.
 */
export async function runRoomUpdate<TGame>(
  code: string,
  mutate: (room: RoomDoc<TGame>) => Partial<RoomDoc<TGame>> | null,
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as RoomDoc<TGame>;
    if (isRoomExpired(room)) return;
    const patch = mutate(room);
    if (!patch) return;
    tx.update(ref, { ...patch, updatedAt: serverTimestamp() });
  });
}
