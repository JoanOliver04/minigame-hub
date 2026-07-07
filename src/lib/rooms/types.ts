/**
 * Generic multiplayer room shapes. This layer knows nothing about any
 * specific mini-game — the per-game payload is an opaque `TGame` stored
 * under the single `game` field, so adding room support to a new game
 * never requires touching this file (see src/games/roomRegistry.ts).
 */

import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "waiting" | "playing" | "finished" | "abandoned";

export interface RoomPlayer {
  uid: string;
  name: string;
  role: "host" | "guest";
  joinedAt: Timestamp;
}

/**
 * `TGame` is intentionally opaque here. Games that want Security Rules to
 * enforce turn ownership (see firestore.rules) should include a `turn: uid
 * | null` field and a `finished: boolean` field in their own payload type —
 * that's a convention, not something this type enforces.
 */
export interface RoomDoc<TGame = unknown> {
  code: string;
  gameId: string;
  gameSettings?: Record<string, string>;
  status: RoomStatus;
  hostUid: string;
  players: Record<string, RoomPlayer>;
  rematchVotes: Record<string, boolean>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  game: TGame;
}
