/**
 * Tic-Tac-Toe — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * TttMatchState (youScore/aiScore, PLAYER_MARK always "X"). This module
 * reuses only the pure, AI-free `legalMoves`/`applyMove`/`checkOutcome`
 * rules from logic.ts and defines its own uid-keyed bookkeeping.
 *
 * Turn safety: `submitTttMove` re-reads the room inside a transaction,
 * checks `game.turn === uid` (backed up by the matching Security Rules
 * check on `game.turn`), re-validates the move against `legalMoves`, and
 * only then applies it — a client can't spoof a move on the other player's
 * turn even if it forges a local UI state.
 */

"use client";

import type { RoomGameSettings } from "@/games/roomTypes";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import {
  applyMove,
  checkOutcome,
  emptyBoard,
  legalMoves,
  type Board,
  type Mark,
  type RoundOutcome,
  type TttMove,
} from "./logic";

export const TTT_ROOM_TARGET = 3;

export interface TttRoomGame {
  board: Board;
  /** uid whose move it is; `null` once the match is finished. */
  turn: string | null;
  marks: Record<string, Mark>;
  scores: Record<string, number>;
  draws: number;
  rounds: number;
  finished: boolean;
  target: number;
  /** Result of the most recently finished board, kept for the UI. */
  lastOutcome: RoundOutcome | null;
}

function targetFromSettings(settings?: RoomGameSettings): number {
  if (settings?.target === "1") return 1;
  if (settings?.target === "5") return 5;
  return TTT_ROOM_TARGET;
}

/** Host-only placeholder while the room is still "waiting" — see seedTttRoomGame. */
export function createInitialTttRoomGame(settings?: RoomGameSettings): TttRoomGame {
  return {
    board: emptyBoard(),
    turn: null,
    marks: {},
    scores: {},
    draws: 0,
    rounds: 0,
    finished: false,
    target: targetFromSettings(settings),
    lastOutcome: null,
  };
}

/** Real seed, once both uids are known. Host is always "X" and starts, mirroring solo mode. */
export function seedTttRoomGame(
  _hostGame: TttRoomGame,
  hostUid: string,
  guestUid: string,
  settings?: RoomGameSettings,
): TttRoomGame {
  return {
    board: emptyBoard(),
    turn: hostUid,
    marks: { [hostUid]: "X", [guestUid]: "O" },
    scores: { [hostUid]: 0, [guestUid]: 0 },
    draws: 0,
    rounds: 0,
    finished: false,
    target: targetFromSettings(settings),
    lastOutcome: null,
  };
}

export async function submitTttMove(code: string, uid: string, move: TttMove): Promise<void> {
  await runRoomUpdate<TttRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;

    const myMark = g.marks[uid];
    if (!myMark) return null;

    const legal = legalMoves(g.board, myMark);
    const isLegal = legal.some((m) => m.from === move.from && m.to === move.to);
    if (!isLegal) return null;

    const nextBoard = applyMove(g.board, move, myMark);
    const outcome = checkOutcome(nextBoard);
    const uids = Object.keys(g.marks);
    const opponentUid = uids.find((id) => id !== uid);

    if (!outcome) {
      return { game: { ...g, board: nextBoard, turn: opponentUid ?? null } };
    }

    const winnerUid = outcome.winner ? uids.find((id) => g.marks[id] === outcome.winner) : undefined;
    const scores = { ...g.scores };
    if (winnerUid) scores[winnerUid] = (scores[winnerUid] ?? 0) + 1;
    const rounds = g.rounds + 1;
    const draws = g.draws + (outcome.winner === null ? 1 : 0);
    const matchFinished = Object.values(scores).some((score) => score >= g.target);

    if (matchFinished) {
      return {
        game: {
          ...g,
          board: nextBoard,
          scores,
          draws,
          rounds,
          finished: true,
          lastOutcome: outcome,
          turn: null,
        },
        status: "finished",
      };
    }

    // Next round: fresh board, alternate who starts so neither uid always
    // moves first — marks stay fixed for the whole match either way.
    const nextStarter = uids[rounds % uids.length];
    return {
      game: {
        ...g,
        board: emptyBoard(),
        scores,
        draws,
        rounds,
        finished: false,
        lastOutcome: outcome,
        turn: nextStarter,
      },
    };
  });
}

export async function resetTttRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<TttRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    const g = room.game;
    const marks = g.marks;
    const startingUid = Object.keys(marks).find((id) => marks[id] === "X") ?? uids[0];

    return {
      game: {
        board: emptyBoard(),
        turn: startingUid,
        marks,
        scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
        draws: 0,
        rounds: 0,
        finished: false,
        target: room.game.target,
        lastOutcome: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
