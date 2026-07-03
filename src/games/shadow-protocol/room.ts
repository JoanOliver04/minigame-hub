/**
 * Shadow Protocol — room (PvP) state and mutations.
 *
 * Sibling to logic.ts, not a replacement: the solo stealth game is inherently
 * one-intruder-vs-AI, so there is no symmetric board to share. PvP is instead
 * a SCORE-ATTACK duel: both players infiltrate the SAME facility (identical
 * `seed` + difficulty, so `createShadowMatch` regenerates the exact same map,
 * guards and cameras on each client), play their own run independently, and
 * the better infiltration wins. This reuses the entire pure engine
 * (`createShadowMatch`/`applyAction`/`computeScore`) unchanged — the room only
 * syncs the shared seed at the start and each player's final result at the end.
 *
 * Simultaneous-move like RPS (no `turn` field): each client writes its own
 * blind result; whichever listener sees both resolves the match.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { ShadowDifficulty } from "./types";

export const SHADOW_ROOM_DIFFICULTY: ShadowDifficulty = "medium";

export interface ShadowResult {
  escaped: boolean;
  score: number;
  turns: number;
}

export interface ShadowRoomGame {
  seed: number;
  difficulty: ShadowDifficulty;
  /** Cleared to `null` per run until each player finishes their infiltration. */
  results: Record<string, ShadowResult | null>;
  finished: boolean;
  winnerUid: string | null;
}

/** Host-only placeholder while the room is still "waiting" — see seedShadowRoomGame. */
export function createInitialShadowRoomGame(): ShadowRoomGame {
  return {
    seed: randomSeed(),
    difficulty: SHADOW_ROOM_DIFFICULTY,
    results: {},
    finished: false,
    winnerUid: null,
  };
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedShadowRoomGame(
  _hostGame: ShadowRoomGame,
  hostUid: string,
  guestUid: string,
): ShadowRoomGame {
  return {
    seed: randomSeed(),
    difficulty: SHADOW_ROOM_DIFFICULTY,
    results: { [hostUid]: null, [guestUid]: null },
    finished: false,
    winnerUid: null,
  };
}

/** Always conflict-free: a client only ever writes its own result. */
export async function submitShadowResult(
  code: string,
  uid: string,
  result: ShadowResult,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.results.${uid}`]: result,
    updatedAt: serverTimestamp(),
  });
}

function decideWinner(uidA: string, a: ShadowResult, uidB: string, b: ShadowResult): string | null {
  // Escaping always beats getting caught; otherwise the higher score wins.
  if (a.escaped !== b.escaped) return a.escaped ? uidA : uidB;
  if (a.score === b.score) return null; // tie
  return a.score > b.score ? uidA : uidB;
}

/** Called by both clients' listeners once both results are in; resolves once. */
export async function resolveShadowIfReady(code: string): Promise<void> {
  await runRoomUpdate<ShadowRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.results);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = g.results[uidA];
    const b = g.results[uidB];
    if (!a || !b) return null;

    return {
      game: { ...g, finished: true, winnerUid: decideWinner(uidA, a, uidB, b) },
      status: "finished",
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetShadowRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ShadowRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    return {
      game: {
        seed: randomSeed(),
        difficulty: SHADOW_ROOM_DIFFICULTY,
        results: Object.fromEntries(uids.map((uid) => [uid, null])),
        finished: false,
        winnerUid: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
