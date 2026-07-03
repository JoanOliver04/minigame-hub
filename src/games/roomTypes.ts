import type { ComponentType } from "react";

/**
 * What a mini-game plugs in to get a room-based PvP mode. Parallel to
 * GameDefinition (types.ts) but kept separate: not every game will get a
 * multiplayer mode, and the two contracts evolve independently.
 */
export interface RoomGameModule<TGame = unknown> {
  /** Seeds the room's `game` payload while only the host is seated. */
  createInitialGame(): TGame;
  /**
   * Re-seeds `game` once the guest joins and both uids are known — e.g.
   * assigning marks/turn order. Called by `joinRoom` (see roomsApi.ts).
   */
  seedGame(hostGame: TGame, hostUid: string, guestUid: string): TGame;
  /** Renders the whole room experience (waiting/playing/finished) for `code`. */
  RoomComponent: ComponentType<{ code: string }>;
}
