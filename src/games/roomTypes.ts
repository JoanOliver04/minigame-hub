import type { ComponentType } from "react";

export type RoomGameSettings = Record<string, string>;

export interface RoomSettingOption {
  value: string;
  label: string;
}

export interface RoomSettingDefinition {
  key: string;
  label: string;
  options: RoomSettingOption[];
}

/**
 * What a mini-game plugs in to get a room-based PvP mode. Parallel to
 * GameDefinition (types.ts) but kept separate: not every game will get a
 * multiplayer mode, and the two contracts evolve independently.
 */
export interface RoomGameModule<TGame = unknown> {
  /** Seeds the room's `game` payload while only the host is seated. */
  createInitialGame(settings?: RoomGameSettings): TGame;
  /**
   * Re-seeds `game` once the guest joins and both uids are known — e.g.
   * assigning marks/turn order. Called by `joinRoom` (see roomsApi.ts).
   */
  seedGame(hostGame: TGame, hostUid: string, guestUid: string, settings?: RoomGameSettings): TGame;
  /** Optional room setup controls shown to the host inside an existing room. */
  settings?: RoomSettingDefinition[];
  defaultSettings?: RoomGameSettings;
  /** Renders the whole room experience (waiting/playing/finished) for `code`. */
  RoomComponent: ComponentType<{ code: string }>;
}
