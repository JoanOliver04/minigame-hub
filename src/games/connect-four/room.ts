/**
 * Connect Four — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * ConnectMatchState (playerScore/aiScore, minimax AI). This module reuses the
 * pure `dropPiece`/`checkBoardOutcome`/`availableColumns` rules and adds its
 * own uid-keyed bookkeeping, mirroring TTT's room module.
 *
 * Firestore note: the board is a 6×7 NESTED array, which Firestore can't
 * store. It's flattened to a length-42 `cells` array here (index =
 * row*COLUMNS + column) and rebuilt into the nested board the pure functions
 * expect. Everything else follows TTT's strictly turn-based pattern: the
 * moving player's own transaction fully applies the result, re-validated
 * against the same rules and backed by firestore.rules' `turn` guard.
 */

"use client";

import type { RoomGameSettings } from "@/games/roomTypes";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import {
  COLUMNS,
  ROWS,
  checkBoardOutcome,
  createBoard,
  dropPiece,
  getDropRow,
} from "./logic";
import type { ConnectBoard, ConnectCell, ConnectPiece, ConnectRoundOutcome } from "./types";

export const CONNECT_ROOM_TARGET = 3;

/** Serialised board: flat length-42 array, index = row*COLUMNS + column. */
export type FlatCells = ConnectCell[];

export function toBoard(cells: FlatCells): ConnectBoard {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => cells[row * COLUMNS + column] ?? null),
  );
}

export function fromBoard(board: ConnectBoard): FlatCells {
  const cells: FlatCells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) cells.push(board[row][column]);
  }
  return cells;
}

function emptyCells(): FlatCells {
  return fromBoard(createBoard());
}

export interface ConnectRoomGame {
  cells: FlatCells;
  /** uid whose move it is; `null` once the match is finished. */
  turn: string | null;
  /** uid -> piece colour. Host is always "R" (mirrors solo PLAYER_PIECE). */
  pieces: Record<string, ConnectPiece>;
  scores: Record<string, number>;
  draws: number;
  rounds: number;
  finished: boolean;
  target: number;
  /** Result of the most recently finished board, kept for the UI. */
  lastOutcome: ConnectRoundOutcome | null;
}

const HOST_PIECE: ConnectPiece = "R"; // mirrors solo PLAYER_PIECE
const GUEST_PIECE: ConnectPiece = "Y";

function targetFromSettings(settings?: RoomGameSettings): number {
  if (settings?.target === "1") return 1;
  if (settings?.target === "5") return 5;
  return CONNECT_ROOM_TARGET;
}

/** Host-only placeholder while the room is still "waiting" — see seedConnectRoomGame. */
export function createInitialConnectRoomGame(settings?: RoomGameSettings): ConnectRoomGame {
  return {
    cells: emptyCells(),
    turn: null,
    pieces: {},
    scores: {},
    draws: 0,
    rounds: 0,
    finished: false,
    target: targetFromSettings(settings),
    lastOutcome: null,
  };
}

/** Real seed, once both uids are known. Host is "R" and starts, mirroring solo mode. */
export function seedConnectRoomGame(
  _hostGame: ConnectRoomGame,
  hostUid: string,
  guestUid: string,
  settings?: RoomGameSettings,
): ConnectRoomGame {
  return {
    cells: emptyCells(),
    turn: hostUid,
    pieces: { [hostUid]: HOST_PIECE, [guestUid]: GUEST_PIECE },
    scores: { [hostUid]: 0, [guestUid]: 0 },
    draws: 0,
    rounds: 0,
    finished: false,
    target: targetFromSettings(settings),
    lastOutcome: null,
  };
}

export async function submitConnectMove(code: string, uid: string, column: number): Promise<void> {
  await runRoomUpdate<ConnectRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;

    const myPiece = g.pieces[uid];
    if (!myPiece) return null;

    const board = toBoard(g.cells);
    const drop = dropPiece(board, column, myPiece);
    if (!drop) return null;

    const outcome = checkBoardOutcome(drop.board);
    const uids = Object.keys(g.pieces);
    const opponentUid = uids.find((id) => id !== uid);
    const nextCells = fromBoard(drop.board);

    if (!outcome) {
      return { game: { ...g, cells: nextCells, turn: opponentUid ?? null } };
    }

    const winnerUid = outcome.winner ? uids.find((id) => g.pieces[id] === outcome.winner) : undefined;
    const scores = { ...g.scores };
    if (winnerUid) scores[winnerUid] = (scores[winnerUid] ?? 0) + 1;
    const rounds = g.rounds + 1;
    const draws = g.draws + (outcome.draw ? 1 : 0);
    const matchFinished = Object.values(scores).some((score) => score >= g.target);

    if (matchFinished) {
      return {
        game: {
          ...g,
          cells: nextCells,
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

    // Next board: fresh cells, alternate who starts (pieces stay fixed).
    const nextStarter = uids[rounds % uids.length];
    return {
      game: {
        ...g,
        cells: emptyCells(),
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

export async function resetConnectRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<ConnectRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    const g = room.game;
    const pieces = g.pieces;
    const startingUid = Object.keys(pieces).find((id) => pieces[id] === HOST_PIECE) ?? uids[0];

    return {
      game: {
        cells: emptyCells(),
        turn: startingUid,
        pieces,
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

/** Convenience for the view: is a column full? */
export function columnFull(cells: FlatCells, column: number): boolean {
  return getDropRow(toBoard(cells), column) === null;
}
