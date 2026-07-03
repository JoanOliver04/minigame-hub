/**
 * Beat Reactor — room (PvP) state and mutations.
 *
 * Sibling to useBeatReactor.ts, not a replacement: the solo game plays against
 * a precomputed AI chart-runner. PvP is a SCORE-ATTACK duel — both players
 * perform the SAME chart (identical `seed` + bpm/bars/density, so
 * `generateChart` produces byte-identical notes on each client), play their
 * own run locally, and the higher score wins. Reuses the whole pure chart/
 * judgement engine (generateChart / judge / findTarget / hitScore); the room
 * only syncs the shared seed at the start and each player's final score.
 *
 * Simultaneous-move like RPS (no `turn` field): each client writes its own
 * blind score; whichever listener sees both resolves the match.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { Bars, Bpm, ChartDensity } from "./types";

export const REACTOR_ROOM_BPM: Bpm = 110;
export const REACTOR_ROOM_BARS: Bars = 12;
export const REACTOR_ROOM_DENSITY: ChartDensity = "normal";

export interface ReactorRoomGame {
  seed: number;
  bpm: Bpm;
  bars: Bars;
  density: ChartDensity;
  /** Cleared to null per run until each player finishes the chart. */
  results: Record<string, { score: number } | null>;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): ReactorRoomGame {
  return {
    seed: randomSeed(),
    bpm: REACTOR_ROOM_BPM,
    bars: REACTOR_ROOM_BARS,
    density: REACTOR_ROOM_DENSITY,
    results: Object.fromEntries(uids.map((uid) => [uid, null])),
    finished: false,
    winnerUid: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedReactorRoomGame. */
export function createInitialReactorRoomGame(): ReactorRoomGame {
  return freshGame([]);
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedReactorRoomGame(
  _hostGame: ReactorRoomGame,
  hostUid: string,
  guestUid: string,
): ReactorRoomGame {
  return freshGame([hostUid, guestUid]);
}

/** Always conflict-free: a client only ever writes its own score. */
export async function submitReactorScore(code: string, uid: string, score: number): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.results.${uid}`]: { score },
    updatedAt: serverTimestamp(),
  });
}

/** Called by both clients' listeners once both scores are in; resolves once. */
export async function resolveReactorIfReady(code: string): Promise<void> {
  await runRoomUpdate<ReactorRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.results);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = g.results[uidA];
    const b = g.results[uidB];
    if (!a || !b) return null;

    const winnerUid = a.score === b.score ? null : a.score > b.score ? uidA : uidB;
    return {
      game: { ...g, finished: true, winnerUid },
      status: "finished",
    };
  });
}

export async function resetReactorRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ReactorRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
