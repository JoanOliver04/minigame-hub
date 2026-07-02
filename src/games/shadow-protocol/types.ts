/**
 * Shadow Protocol — shared types (blueprint §4).
 * Pure data only: no React, no DOM, no timers.
 */

export type Tile =
  | "floor"
  | "wall"
  | "cover"
  | "door-open"
  | "door-closed"
  | "terminal"
  | "core"
  | "exit";

export interface Position {
  x: number;
  y: number;
}

export type Dir = "n" | "e" | "s" | "w";

export type ShadowDifficulty = "easy" | "medium" | "hard";

export type GuardMode = "patrol" | "investigate" | "search" | "chase" | "return";

export interface GuardState {
  id: number;
  pos: Position;
  facing: Dir;
  /** Patrol waypoints walked in a loop. */
  route: Position[];
  routeIndex: number;
  mode: GuardMode;
  /** Where this guard believes the intruder is (never the live position). */
  evidence: Position | null;
  /** Turns left in SEARCH mode. */
  searchTimer: number;
  /** Turns since the guard last saw the player while chasing. */
  unseenTurns: number;
}

export interface CameraState {
  id: number;
  pos: Position;
  /** Index into the clockwise rotation cycle. */
  dirIndex: number;
  /** Turns this camera stays hacked (0 = active). */
  disabledFor: number;
}

/** A door temporarily toggled by a hack; reverts when turns hits 0. */
export interface DoorHack {
  index: number;
  turns: number;
  original: Tile;
}

export interface Facility {
  width: number;
  height: number;
  tiles: Tile[];
  playerStart: Position;
  core: Position;
  exit: Position;
  guards: GuardState[];
  cameras: CameraState[];
}

export type PlayerAction =
  | { kind: "move"; dir: Dir }
  | { kind: "sprint"; dir: Dir }
  | { kind: "wait" }
  | { kind: "hack" }
  | { kind: "beacon"; target: Position };

export type ShadowStatus = "playing" | "won" | "lost";

export interface NoiseEvent {
  source: Position;
  radius: number;
}

export interface ShadowState {
  width: number;
  height: number;
  tiles: Tile[];
  player: Position;
  core: Position;
  exit: Position;
  hasCore: boolean;
  beaconUsed: boolean;
  guards: GuardState[];
  cameras: CameraState[];
  doorHacks: DoorHack[];
  /** Alarm turns remaining once ever detected; loss at 0. */
  alarmRemaining: number;
  detectedEver: boolean;
  /** True while any observer currently sees the player. */
  spotted: boolean;
  turn: number;
  /** Par turn count used by the score formula. */
  par: number;
  status: ShadowStatus;
  difficulty: ShadowDifficulty;
  /** Noise made this turn (for rendering rings), cleared next turn. */
  lastNoise: NoiseEvent | null;
}

/** Things that happened during one resolved turn, for UI feedback. */
export type TurnEvent =
  | "core-collected"
  | "spotted"
  | "alarm-tick"
  | "caught"
  | "escaped"
  | "alarm-zero"
  | "hacked"
  | "beacon-thrown"
  | "guard-heard";

export interface ScoreBreakdown {
  base: number;
  alarmBonus: number;
  stealthBonus: number;
  beaconBonus: number;
  turnDelta: number;
  total: number;
}

export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

export function samePos(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function tileAt(tiles: Tile[], width: number, pos: Position): Tile {
  return tiles[pos.y * width + pos.x];
}

/** Tiles an actor can stand on. */
export function isWalkable(tile: Tile): boolean {
  return tile !== "wall" && tile !== "door-closed";
}
