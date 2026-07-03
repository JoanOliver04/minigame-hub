/**
 * Reaction Time — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * ReactionMatchState (simulated AI reflex). PvP is simultaneous-move like RPS
 * (no `turn` field): both players wait out the SAME shared `delayMs`, and each
 * measures its OWN reaction latency locally — clock skew between the two
 * clients is irrelevant because a reaction time is a device-local delta
 * (tap − that client's own GO), not a wall-clock comparison. Each client
 * writes its blind result; whichever listener sees both resolves the round.
 *
 * A false start (tapping before GO) is an automatic loss for that side,
 * matching the solo game's fairness rule.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { randomSignalDelay } from "./logic";

export const REACTION_ROOM_TARGET = 3;

export interface ReactionResult {
  reactionMs: number | null;
  falseStart: boolean;
}

export interface ReactionRoomGame {
  target: number;
  scores: Record<string, number>;
  ties: number;
  rounds: number;
  finished: boolean;
  /** Increments each round; clients re-arm their local timers when it changes. */
  roundId: number;
  /** Shared wait before GO for the current round. */
  delayMs: number;
  /** Cleared back to `null` for both uids once a round resolves. */
  pending: Record<string, ReactionResult | null>;
  lastResult: { winnerUid: string | null; entries: Record<string, ReactionResult> } | null;
}

/** Host-only placeholder while the room is still "waiting" — see seedReactionRoomGame. */
export function createInitialReactionRoomGame(): ReactionRoomGame {
  return {
    target: REACTION_ROOM_TARGET,
    scores: {},
    ties: 0,
    rounds: 0,
    finished: false,
    roundId: 1,
    delayMs: randomSignalDelay(),
    pending: {},
    lastResult: null,
  };
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedReactionRoomGame(
  _hostGame: ReactionRoomGame,
  hostUid: string,
  guestUid: string,
): ReactionRoomGame {
  return {
    target: REACTION_ROOM_TARGET,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    ties: 0,
    rounds: 0,
    finished: false,
    roundId: 1,
    delayMs: randomSignalDelay(),
    pending: { [hostUid]: null, [guestUid]: null },
    lastResult: null,
  };
}

/** Always conflict-free: a client only ever writes its own pending result. */
export async function submitReaction(
  code: string,
  uid: string,
  result: ReactionResult,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pending.${uid}`]: result,
    updatedAt: serverTimestamp(),
  });
}

function decideWinner(uidA: string, a: ReactionResult, uidB: string, b: ReactionResult): string | null {
  if (a.falseStart && b.falseStart) return null;
  if (a.falseStart) return uidB;
  if (b.falseStart) return uidA;
  if (a.reactionMs === null) return uidB;
  if (b.reactionMs === null) return uidA;
  if (a.reactionMs === b.reactionMs) return null;
  return a.reactionMs < b.reactionMs ? uidA : uidB;
}

/** Called by both clients' listeners once both results are in; resolves once. */
export async function resolveReactionRoundIfReady(code: string): Promise<void> {
  await runRoomUpdate<ReactionRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.pending);
    if (uids.length !== 2) return null;
    const [uidA, uidB] = uids;
    const a = g.pending[uidA];
    const b = g.pending[uidB];
    if (!a || !b) return null;

    const winnerUid = decideWinner(uidA, a, uidB, b);
    const scores = { ...g.scores };
    if (winnerUid) scores[winnerUid] = (scores[winnerUid] ?? 0) + 1;
    const ties = g.ties + (winnerUid ? 0 : 1);
    const rounds = g.rounds + 1;
    const finished = Object.values(scores).some((score) => score >= g.target);

    return {
      game: {
        ...g,
        scores,
        ties,
        rounds,
        finished,
        roundId: g.roundId + 1,
        delayMs: randomSignalDelay(),
        pending: { [uidA]: null, [uidB]: null },
        lastResult: { winnerUid, entries: { [uidA]: a, [uidB]: b } },
      },
      status: finished ? "finished" : room.status,
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetReactionRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ReactionRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const [uidA, uidB] = uids;

    return {
      game: {
        target: REACTION_ROOM_TARGET,
        scores: { [uidA]: 0, [uidB]: 0 },
        ties: 0,
        rounds: 0,
        finished: false,
        roundId: 1,
        delayMs: randomSignalDelay(),
        pending: { [uidA]: null, [uidB]: null },
        lastResult: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
