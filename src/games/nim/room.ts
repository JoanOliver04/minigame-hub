/**
 * Nim — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * NimMatchState (youScore/aiScore, nim-sum AI). This module reuses the pure
 * `createPiles`/`isValidMove`/`applyPileMove`/`isGameOver` rules and adds its
 * own uid-keyed bookkeeping.
 *
 * Turn-based (carries a `turn` field → firestore.rules' turn guard applies).
 * Piles are a flat number array (Firestore-safe). Room MVP fixes the ruleset
 * to normal play on the default piles — no setup picker yet, unlike solo.
 */

"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { applyPileMove, createPiles, isGameOver, isValidMove } from "./logic";
import type { RoomGameSettings } from "../roomTypes";
import type { NimRule } from "./types";

export const NIM_ROOM_TARGET = 3;
export const NIM_ROOM_RULE: NimRule = "normal";

export interface NimRoomLogEntry {
  id: number;
  uid: string;
  pileIndex: number;
  tokensRemoved: number;
  pileBefore: number;
  pileAfter: number;
}

export interface NimRoomGame {
  piles: number[];
  /** uid whose move it is; `null` once the match is finished. */
  turn: string | null;
  rule: NimRule;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  target: number;
  starterUid: string;
  lastRoundWinnerUid: string | null;
  /** Moves in the current round, newest first, capped. */
  log: NimRoomLogEntry[];
}

const LOG_CAP = 12;

function ruleFromSettings(settings?: RoomGameSettings): NimRule {
  return settings?.rule === "misere" ? "misere" : "normal";
}

/** Host-only placeholder while the room is still "waiting" — see seedNimRoomGame. */
export function createInitialNimRoomGame(settings?: RoomGameSettings): NimRoomGame {
  return {
    piles: createPiles(false),
    turn: null,
    rule: ruleFromSettings(settings),
    scores: {},
    rounds: 0,
    finished: false,
    target: NIM_ROOM_TARGET,
    starterUid: "",
    lastRoundWinnerUid: null,
    log: [],
  };
}

/** Real seed, once both uids are known. Host moves first. */
export function seedNimRoomGame(
  _hostGame: NimRoomGame,
  hostUid: string,
  guestUid: string,
  settings?: RoomGameSettings,
): NimRoomGame {
  return {
    piles: createPiles(false),
    turn: hostUid,
    rule: ruleFromSettings(settings),
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    target: NIM_ROOM_TARGET,
    starterUid: hostUid,
    lastRoundWinnerUid: null,
    log: [],
  };
}

export async function submitNimMove(
  code: string,
  uid: string,
  pileIndex: number,
  tokensRemoved: number,
): Promise<void> {
  await runRoomUpdate<NimRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;
    if (!isValidMove(g.piles, pileIndex, tokensRemoved)) return null;

    const uids = Object.keys(g.scores);
    const opponentUid = uids.find((id) => id !== uid);
    if (!opponentUid) return null;

    const pileBefore = g.piles[pileIndex];
    const nextPiles = applyPileMove(g.piles, pileIndex, tokensRemoved);
    const entry: NimRoomLogEntry = {
      id: g.log.length + 1,
      uid,
      pileIndex,
      tokensRemoved,
      pileBefore,
      pileAfter: pileBefore - tokensRemoved,
    };

    if (!isGameOver(nextPiles)) {
      return {
        game: {
          ...g,
          piles: nextPiles,
          turn: opponentUid,
          log: [entry, ...g.log].slice(0, LOG_CAP),
        },
      };
    }

    // Finishing move: normal play, mover who empties the last pile wins;
    // misère, the mover loses (see winnerOfFinishingMove in logic.ts).
    const winnerUid = g.rule === "normal" ? uid : opponentUid;
    const scores = { ...g.scores, [winnerUid]: (g.scores[winnerUid] ?? 0) + 1 };
    const rounds = g.rounds + 1;
    const finished = scores[winnerUid] >= g.target;

    if (finished) {
      return {
        game: {
          ...g,
          piles: nextPiles,
          scores,
          rounds,
          finished: true,
          turn: null,
          lastRoundWinnerUid: winnerUid,
          log: [entry, ...g.log].slice(0, LOG_CAP),
        },
        status: "finished",
      };
    }

    // Fresh round: new piles, alternate who starts.
    const nextStarter = g.starterUid === uid ? opponentUid : uid;
    return {
      game: {
        ...g,
        piles: createPiles(false),
        scores,
        rounds,
        starterUid: nextStarter,
        turn: nextStarter,
        lastRoundWinnerUid: winnerUid,
        log: [],
      },
    };
  });
}

export async function resetNimRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<NimRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const starter = room.hostUid;

    return {
      game: {
        piles: createPiles(false),
        turn: starter,
        rule: room.game.rule,
        scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
        rounds: 0,
        finished: false,
        target: NIM_ROOM_TARGET,
        starterUid: starter,
        lastRoundWinnerUid: null,
        log: [],
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
