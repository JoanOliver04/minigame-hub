/**
 * Circuit Breaker — room (PvP) state and mutations.
 *
 * Sibling to ai.ts, not a replacement: solo mode plays against a flood-fill /
 * minimax AI cycle. PvP is the game's native form — a simultaneous-turn
 * light-cycle duel — reusing the pure `resolveTick`/`createRound` rules
 * directly. Each tick both players commit a turn blind (simultaneous-move like
 * RPS, no `turn` field); the tick resolves once both are in (lockstep, which
 * is also what keeps it fair over network latency — neither side ever moves
 * on stale information).
 *
 * Firestore note: the arena is a `Uint8Array`, which Firestore can't store, so
 * it's persisted as a plain number[] and rebuilt into a Uint8Array inside each
 * transaction for `resolveTick`. Seats map onto the pure rules' player/ai:
 * host = player, guest = ai.
 */

"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createRound, resolveTick } from "./logic";
import { ROUND_TARGET } from "./types";
import type { CycleState, TurnAction } from "./types";

export interface BreakerRoomGame {
  grid: number[];
  cycles: Record<string, CycleState>;
  pending: Record<string, TurnAction | null>;
  order: string[];
  scores: Record<string, number>;
  ties: number;
  target: number;
  tick: number;
  /** True on the tick that just ended a round (drives the result flash). */
  roundJustEnded: boolean;
  lastRoundResultUid: string | null;
  finished: boolean;
  winnerUid: string | null;
}

function newRound(order: string[]) {
  const round = createRound();
  return {
    grid: Array.from(round.grid),
    cycles: { [order[0]]: round.player, [order[1]]: round.ai } as Record<string, CycleState>,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedBreakerRoomGame. */
export function createInitialBreakerRoomGame(): BreakerRoomGame {
  const round = createRound();
  return {
    grid: Array.from(round.grid),
    cycles: {},
    pending: {},
    order: [],
    scores: {},
    ties: 0,
    target: ROUND_TARGET,
    tick: 0,
    roundJustEnded: false,
    lastRoundResultUid: null,
    finished: false,
    winnerUid: null,
  };
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedBreakerRoomGame(
  _hostGame: BreakerRoomGame,
  hostUid: string,
  guestUid: string,
): BreakerRoomGame {
  const order = [hostUid, guestUid];
  const { grid, cycles } = newRound(order);
  return {
    grid,
    cycles,
    pending: { [hostUid]: null, [guestUid]: null },
    order,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    ties: 0,
    target: ROUND_TARGET,
    tick: 0,
    roundJustEnded: false,
    lastRoundResultUid: null,
    finished: false,
    winnerUid: null,
  };
}

/** Always conflict-free: a client only ever writes its own pending turn. */
export async function submitBreakerAction(
  code: string,
  uid: string,
  action: TurnAction,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.pending.${uid}`]: action,
    updatedAt: serverTimestamp(),
  });
}

/** Called by both clients' listeners once both turns are in; resolves the tick once. */
export async function resolveBreakerTickIfReady(code: string): Promise<void> {
  await runRoomUpdate<BreakerRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const [host, guest] = g.order;
    const pHost = g.pending[host];
    const pGuest = g.pending[guest];
    if (!pHost || !pGuest) return null;

    const next = resolveTick(
      {
        grid: Uint8Array.from(g.grid),
        player: g.cycles[host],
        ai: g.cycles[guest],
        status: "playing",
        roundResult: null,
        tick: g.tick,
      },
      pHost,
      pGuest,
    );

    const clearedPending = { [host]: null, [guest]: null };

    if (next.status === "playing") {
      return {
        game: {
          ...g,
          grid: Array.from(next.grid),
          cycles: { [host]: next.player, [guest]: next.ai },
          tick: next.tick,
          pending: clearedPending,
          roundJustEnded: false,
        },
      };
    }

    // Round over: award and either finish the match or deal a fresh round.
    const winnerUid = next.roundResult === "player" ? host : next.roundResult === "ai" ? guest : null;
    const scores = { ...g.scores };
    if (winnerUid) scores[winnerUid] = (scores[winnerUid] ?? 0) + 1;
    const ties = g.ties + (winnerUid ? 0 : 1);
    const matchFinished = Object.values(scores).some((score) => score >= g.target);

    if (matchFinished) {
      const matchWinner = scores[host] > scores[guest] ? host : guest;
      return {
        game: {
          ...g,
          grid: Array.from(next.grid),
          cycles: { [host]: next.player, [guest]: next.ai },
          tick: next.tick,
          pending: clearedPending,
          scores,
          ties,
          roundJustEnded: true,
          lastRoundResultUid: winnerUid,
          finished: true,
          winnerUid: matchWinner,
        },
        status: "finished",
      };
    }

    const fresh = newRound(g.order);
    return {
      game: {
        ...g,
        grid: fresh.grid,
        cycles: fresh.cycles,
        tick: 0,
        pending: clearedPending,
        scores,
        ties,
        roundJustEnded: true,
        lastRoundResultUid: winnerUid,
      },
    };
  });
}

export async function resetBreakerRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<BreakerRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const order = [room.hostUid, uids.find((id) => id !== room.hostUid)!];
    const { grid, cycles } = newRound(order);

    return {
      game: {
        grid,
        cycles,
        pending: { [order[0]]: null, [order[1]]: null },
        order,
        scores: { [order[0]]: 0, [order[1]]: 0 },
        ties: 0,
        target: ROUND_TARGET,
        tick: 0,
        roundJustEnded: false,
        lastRoundResultUid: null,
        finished: false,
        winnerUid: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
