/**
 * Number Duel — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * RoundState (player/ai actors, binary-search AI). PvP is a turn-based race
 * on a SHARED hidden secret: players alternate guesses, every hi/lo hint
 * narrows the interval for both, and whoever names the exact number wins the
 * round. First to `target` round wins takes the match.
 *
 * Turn safety: this payload carries a `turn` field, so firestore.rules'
 * generic turn guard already rejects any write from the uid whose turn it
 * isn't — no per-game rule needed. `submitGuess` re-checks the same thing in
 * its transaction and re-validates the guess is inside the live interval.
 *
 * Trust model: the secret lives in the room doc (the client transaction has
 * to read it to judge a guess — there's no server compute). A determined
 * peer could read it early; that's the same accepted trade-off as RPS's
 * pending moves for a casual friends hub (see README §2).
 */

"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { randomInt } from "@/lib/random";

export const GUESS_ROOM_TARGET = 3;
export const GUESS_MIN = 1;
export const GUESS_MAX = 100;

export type GuessVerdict = "high" | "low" | "correct";

export interface GuessRoomLogEntry {
  id: number;
  uid: string;
  value: number;
  verdict: GuessVerdict;
}

export interface GuessRoomGame {
  target: number;
  min: number;
  max: number;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  /** uid to guess now; `null` once the match is finished. */
  turn: string | null;
  /** Public narrowing interval for the current round (inclusive). */
  low: number;
  high: number;
  /** Hidden target for the current round (see trust-model note above). */
  secret: number;
  /** uid that started the current round — the next round's starter alternates. */
  starterUid: string;
  /** Winner of the most recently finished round, for the UI. `null` mid-round. */
  roundWinnerUid: string | null;
  /** Guesses in the current round, newest first, capped. */
  log: GuessRoomLogEntry[];
}

const LOG_CAP = 12;

function judgeGuess(value: number, secret: number): GuessVerdict {
  if (value > secret) return "high";
  if (value < secret) return "low";
  return "correct";
}

/** Host-only placeholder while the room is still "waiting" — see seedGuessRoomGame. */
export function createInitialGuessRoomGame(): GuessRoomGame {
  return {
    target: GUESS_ROOM_TARGET,
    min: GUESS_MIN,
    max: GUESS_MAX,
    scores: {},
    rounds: 0,
    finished: false,
    turn: null,
    low: GUESS_MIN,
    high: GUESS_MAX,
    secret: 0,
    starterUid: "",
    roundWinnerUid: null,
    log: [],
  };
}

/** Real seed, once both uids are known (called by joinRoom). Host guesses first. */
export function seedGuessRoomGame(
  _hostGame: GuessRoomGame,
  hostUid: string,
  guestUid: string,
): GuessRoomGame {
  return {
    target: GUESS_ROOM_TARGET,
    min: GUESS_MIN,
    max: GUESS_MAX,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    turn: hostUid,
    low: GUESS_MIN,
    high: GUESS_MAX,
    secret: randomInt(GUESS_MIN, GUESS_MAX),
    starterUid: hostUid,
    roundWinnerUid: null,
    log: [],
  };
}

export async function submitGuess(code: string, uid: string, value: number): Promise<void> {
  await runRoomUpdate<GuessRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;
    if (!Number.isInteger(value) || value < g.low || value > g.high) return null;

    const uids = Object.keys(g.scores);
    const opponentUid = uids.find((id) => id !== uid);
    if (!opponentUid) return null;

    const verdict = judgeGuess(value, g.secret);
    const entry: GuessRoomLogEntry = { id: g.log.length + 1, uid, value, verdict };

    if (verdict !== "correct") {
      return {
        game: {
          ...g,
          low: verdict === "low" ? Math.max(g.low, value + 1) : g.low,
          high: verdict === "high" ? Math.min(g.high, value - 1) : g.high,
          turn: opponentUid,
          log: [entry, ...g.log].slice(0, LOG_CAP),
        },
      };
    }

    // Correct guess wins the round.
    const scores = { ...g.scores, [uid]: (g.scores[uid] ?? 0) + 1 };
    const rounds = g.rounds + 1;
    const finished = scores[uid] >= g.target;

    if (finished) {
      return {
        game: {
          ...g,
          scores,
          rounds,
          finished: true,
          turn: null,
          roundWinnerUid: uid,
          log: [entry, ...g.log].slice(0, LOG_CAP),
        },
        status: "finished",
      };
    }

    // Fresh round: new secret, reset interval, alternate who starts.
    const nextStarter = g.starterUid === uid ? opponentUid : uid;
    return {
      game: {
        ...g,
        scores,
        rounds,
        low: g.min,
        high: g.max,
        secret: randomInt(g.min, g.max),
        starterUid: nextStarter,
        turn: nextStarter,
        roundWinnerUid: uid,
        log: [],
      },
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetGuessRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<GuessRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const starter = room.hostUid;

    return {
      game: {
        target: GUESS_ROOM_TARGET,
        min: GUESS_MIN,
        max: GUESS_MAX,
        scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
        rounds: 0,
        finished: false,
        turn: starter,
        low: GUESS_MIN,
        high: GUESS_MAX,
        secret: randomInt(GUESS_MIN, GUESS_MAX),
        starterUid: starter,
        roundWinnerUid: null,
        log: [],
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
