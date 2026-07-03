/**
 * Hex Dominion — room (PvP) state and mutations.
 *
 * Sibling to ai.ts, not a replacement: solo mode plays against a UCT/heuristic
 * AI. Hex is a two-player connection game, so PvP is its native form — reusing
 * the pure `placeStone`/`hasConnection` rules directly. Strictly turn-based
 * (carries a `turn` field → firestore.rules' turn guard applies). Seats map
 * onto the pure rules' owners: host = "player" (connects left↔right and moves
 * first), guest = "ai" (connects top↔bottom).
 */

"use client";

import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createHexState, placeStone } from "./logic";
import type { HexCell, HexOwner } from "./types";

export interface HexRoomGame {
  board: HexCell[];
  /** uid whose move it is; `null` once someone connects. */
  turn: string | null;
  /** uid -> owner colour used by the pure rules. */
  owners: Record<string, HexOwner>;
  moves: number;
  finished: boolean;
  winnerUid: string | null;
}

/** Host-only placeholder while the room is still "waiting" — see seedHexRoomGame. */
export function createInitialHexRoomGame(): HexRoomGame {
  return {
    board: createHexState().board,
    turn: null,
    owners: {},
    moves: 0,
    finished: false,
    winnerUid: null,
  };
}

/** Real seed, once both uids are known. Host is "player" and moves first. */
export function seedHexRoomGame(
  _hostGame: HexRoomGame,
  hostUid: string,
  guestUid: string,
): HexRoomGame {
  return {
    board: createHexState().board,
    turn: hostUid,
    owners: { [hostUid]: "player", [guestUid]: "ai" },
    moves: 0,
    finished: false,
    winnerUid: null,
  };
}

export async function submitHexMove(code: string, uid: string, index: number): Promise<void> {
  await runRoomUpdate<HexRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;
    if (index < 0 || index >= g.board.length || g.board[index] !== null) return null;

    const myOwner = g.owners[uid];
    if (!myOwner) return null;

    const state = placeStone({ board: g.board, turn: myOwner, winner: null, moves: g.moves }, index);
    const uids = Object.keys(g.owners);
    const opponentUid = uids.find((id) => id !== uid);

    if (state.winner) {
      return {
        game: { ...g, board: state.board, moves: state.moves, turn: null, finished: true, winnerUid: uid },
        status: "finished",
      };
    }

    return {
      game: { ...g, board: state.board, moves: state.moves, turn: opponentUid ?? null },
    };
  });
}

export async function resetHexRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<HexRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    const g = room.game;
    // Keep colours fixed; the "player" seat starts again.
    const starter = Object.keys(g.owners).find((id) => g.owners[id] === "player") ?? uids[0];

    return {
      game: {
        board: createHexState().board,
        turn: starter,
        owners: g.owners,
        moves: 0,
        finished: false,
        winnerUid: null,
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
