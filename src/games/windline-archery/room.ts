/**
 * Windline Archery — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo mode shoots against a
 * simulated AI archer. PvP is a head-to-head 5-end shootout — each end both
 * players aim against the SAME public crosswind and loose one arrow blind
 * (simultaneous-move like RPS, no `turn` field); the round resolves once both
 * arrows are in. Reuses the pure `resolveArrow`/`rollWind` physics and the
 * blueprint tie-breaks; only the uid-keyed tallies are new.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { createRng, randomSeed } from "@/lib/rng";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { resolveArrow, rollWind } from "./logic";
import { TOTAL_ENDS } from "./types";
import type { ArrowInput, ArrowResult, Wind } from "./types";

export interface ArcheryEndRecord {
  wind: Wind;
  arrows: Record<string, ArrowResult>;
}

export interface ArcheryRoomGame {
  wind: Wind;
  endIndex: number;
  totalEnds: number;
  /** This end's submitted aim, cleared back to null once both are in. */
  pending: Record<string, ArrowInput | null>;
  /** Completed ends, oldest first (drives the on-target dots). */
  results: ArcheryEndRecord[];
  scores: Record<string, number>;
  centers: Record<string, number>;
  radialSum: Record<string, number>;
  finished: boolean;
  winnerUid: string | null;
}

function freshWind(): Wind {
  return rollWind(createRng(randomSeed()));
}

/** Host-only placeholder while the room is still "waiting" — see seedArcheryRoomGame. */
export function createInitialArcheryRoomGame(): ArcheryRoomGame {
  return {
    wind: freshWind(),
    endIndex: 0,
    totalEnds: TOTAL_ENDS,
    pending: {},
    results: [],
    scores: {},
    centers: {},
    radialSum: {},
    finished: false,
    winnerUid: null,
  };
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedArcheryRoomGame(
  _hostGame: ArcheryRoomGame,
  hostUid: string,
  guestUid: string,
): ArcheryRoomGame {
  const zero = { [hostUid]: 0, [guestUid]: 0 };
  return {
    wind: freshWind(),
    endIndex: 0,
    totalEnds: TOTAL_ENDS,
    pending: { [hostUid]: null, [guestUid]: null },
    results: [],
    scores: { ...zero },
    centers: { ...zero },
    radialSum: { ...zero },
    finished: false,
    winnerUid: null,
  };
}

/** Always conflict-free: a client only ever writes its own pending shot. */
export async function submitArrow(code: string, uid: string, input: ArrowInput): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pending.${uid}`]: input,
    updatedAt: serverTimestamp(),
  });
}

/** Blueprint tie-break: total score, then centres, then lower radial error. */
function decideWinner(
  uidA: string,
  uidB: string,
  scores: Record<string, number>,
  centers: Record<string, number>,
  radial: Record<string, number>,
): string | null {
  if (scores[uidA] !== scores[uidB]) return scores[uidA] > scores[uidB] ? uidA : uidB;
  if (centers[uidA] !== centers[uidB]) return centers[uidA] > centers[uidB] ? uidA : uidB;
  if (Math.abs(radial[uidA] - radial[uidB]) > 1e-9) return radial[uidA] < radial[uidB] ? uidA : uidB;
  return null;
}

/** Called by both clients' listeners once both arrows are in; resolves once. */
export async function resolveArcheryEndIfReady(code: string): Promise<void> {
  await runRoomUpdate<ArcheryRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.pending);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const inA = g.pending[uidA];
    const inB = g.pending[uidB];
    if (!inA || !inB) return null;

    const resA = resolveArrow(inA, g.wind);
    const resB = resolveArrow(inB, g.wind);
    const scores = {
      [uidA]: g.scores[uidA] + resA.score,
      [uidB]: g.scores[uidB] + resB.score,
    };
    const centers = {
      [uidA]: g.centers[uidA] + (resA.score === 10 ? 1 : 0),
      [uidB]: g.centers[uidB] + (resB.score === 10 ? 1 : 0),
    };
    const radialSum = {
      [uidA]: g.radialSum[uidA] + resA.radial,
      [uidB]: g.radialSum[uidB] + resB.radial,
    };
    const results = [...g.results, { wind: g.wind, arrows: { [uidA]: resA, [uidB]: resB } }];
    const endIndex = g.endIndex + 1;
    const finished = endIndex >= g.totalEnds;

    return {
      game: {
        ...g,
        endIndex,
        results,
        scores,
        centers,
        radialSum,
        pending: { [uidA]: null, [uidB]: null },
        wind: finished ? g.wind : freshWind(),
        finished,
        winnerUid: finished ? decideWinner(uidA, uidB, scores, centers, radialSum) : null,
      },
      status: finished ? "finished" : room.status,
    };
  });
}

export async function resetArcheryRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ArcheryRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const zero = Object.fromEntries(uids.map((uid) => [uid, 0]));

    return {
      game: {
        wind: freshWind(),
        endIndex: 0,
        totalEnds: TOTAL_ENDS,
        pending: Object.fromEntries(uids.map((uid) => [uid, null])),
        results: [],
        scores: { ...zero },
        centers: { ...zero },
        radialSum: { ...zero },
        finished: false,
        winnerUid: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
