/**
 * Memory Match — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * MemoryMatchState (player/ai pairs, the fallible-memory AI). This module
 * reuses the pure `createTiles`/`flipTile`/`hideTiles`/`solveTiles` rules and
 * adds its own uid-keyed bookkeeping.
 *
 * Turn shape: strictly turn-based (carries a `turn` field → firestore.rules'
 * turn guard applies), but a turn is TWO flips. A matched pair keeps the same
 * player's turn (classic memory rules); a miss enters an `evaluating` phase
 * where both flipped tiles stay face-up so both players can memorise them,
 * then a short-delay `resolveMemoryMiss` (auto-fired by both clients, idempotent
 * like RPS's round resolution) hides them and passes the turn.
 *
 * Trust model: tile values live in the room doc (any transaction has to read
 * them to score a match — no server compute), so a determined peer could read
 * unsolved tiles early. Same accepted trade-off as the other room games.
 */

"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createTiles, flipTile, hideTiles, solveTiles } from "./logic";
import type { MatchTile, MemoryGridSize } from "./types";

export const MEMORY_ROOM_SIZE: MemoryGridSize = 4;

export type MemoryRoomPhase = "flipping" | "evaluating";

export interface MemoryRoomGame {
  size: MemoryGridSize;
  tiles: MatchTile[];
  /** uid whose turn it is; `null` once finished. */
  turn: string | null;
  scores: Record<string, number>;
  moves: Record<string, number>;
  /** Indices flipped this turn (0, 1, or 2). */
  flipped: number[];
  phase: MemoryRoomPhase;
  finished: boolean;
  /** Most recent pair result, for UI feedback. */
  lastResult: { uid: string; kind: "match" | "miss" } | null;
}

function freshGame(
  size: MemoryGridSize,
  uids: string[],
  starter: string,
): MemoryRoomGame {
  return {
    size,
    tiles: createTiles(size),
    turn: starter,
    scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
    moves: Object.fromEntries(uids.map((uid) => [uid, 0])),
    flipped: [],
    phase: "flipping",
    finished: false,
    lastResult: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedMemoryRoomGame. */
export function createInitialMemoryRoomGame(): MemoryRoomGame {
  return {
    size: MEMORY_ROOM_SIZE,
    tiles: createTiles(MEMORY_ROOM_SIZE),
    turn: null,
    scores: {},
    moves: {},
    flipped: [],
    phase: "flipping",
    finished: false,
    lastResult: null,
  };
}

/** Real seed, once both uids are known. Host starts. */
export function seedMemoryRoomGame(
  _hostGame: MemoryRoomGame,
  hostUid: string,
  guestUid: string,
): MemoryRoomGame {
  return freshGame(MEMORY_ROOM_SIZE, [hostUid, guestUid], hostUid);
}

export async function flipMemoryTile(code: string, uid: string, index: number): Promise<void> {
  await runRoomUpdate<MemoryRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid || g.phase !== "flipping") {
      return null;
    }
    if (g.flipped.length >= 2) return null;
    const tile = g.tiles[index];
    if (!tile || tile.isSolved || tile.isFlipped) return null;

    const tiles = flipTile(g.tiles, index);
    const flipped = [...g.flipped, index];

    // First tile of the turn — wait for the second.
    if (flipped.length < 2) {
      return { game: { ...g, tiles, flipped } };
    }

    // Second tile — resolve the pair.
    const [a, b] = flipped;
    const isMatch = tiles[a].value === tiles[b].value;
    const moves = { ...g.moves, [uid]: (g.moves[uid] ?? 0) + 1 };

    if (isMatch) {
      const solvedTiles = solveTiles(tiles, flipped);
      const scores = { ...g.scores, [uid]: (g.scores[uid] ?? 0) + 1 };
      const finished = solvedTiles.every((t) => t.isSolved);
      return {
        game: {
          ...g,
          tiles: solvedTiles,
          scores,
          moves,
          flipped: [],
          phase: "flipping",
          finished,
          turn: finished ? null : uid, // matcher plays again
          lastResult: { uid, kind: "match" },
        },
        status: finished ? "finished" : room.status,
      };
    }

    // Miss — leave both tiles face-up for memorising; resolveMemoryMiss hides
    // them and passes the turn after a short delay.
    return {
      game: {
        ...g,
        tiles,
        moves,
        flipped,
        phase: "evaluating",
        lastResult: { uid, kind: "miss" },
      },
    };
  });
}

/** Hides a missed pair and passes the turn. Idempotent — safe for both clients to call. */
export async function resolveMemoryMiss(code: string): Promise<void> {
  await runRoomUpdate<MemoryRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.phase !== "evaluating") return null;
    if (g.flipped.length !== 2 || !g.turn) return null;

    const uids = Object.keys(g.scores);
    const opponentUid = uids.find((id) => id !== g.turn);
    if (!opponentUid) return null;

    return {
      game: {
        ...g,
        tiles: hideTiles(g.tiles, g.flipped),
        flipped: [],
        phase: "flipping",
        turn: opponentUid,
      },
    };
  });
}

export async function resetMemoryRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<MemoryRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    return {
      game: freshGame(MEMORY_ROOM_SIZE, uids, room.hostUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
