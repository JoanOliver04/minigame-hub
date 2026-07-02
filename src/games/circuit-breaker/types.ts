/**
 * Circuit Breaker — shared types (blueprint §8).
 * Simultaneous-turn light-cycle duel on a 21×15 grid.
 */

export const GRID_WIDTH = 21;
export const GRID_HEIGHT = 15;
export const ROUND_TARGET = 3;

/** Clockwise: 0 = north, 1 = east, 2 = south, 3 = west. */
export type Heading = 0 | 1 | 2 | 3;
export type TurnAction = "left" | "straight" | "right";
export type BreakerDifficulty = "easy" | "medium" | "hard";

export interface Position {
  x: number;
  y: number;
}

export interface CycleState {
  pos: Position;
  heading: Heading;
  alive: boolean;
}

export interface BreakerState {
  /** 0 = free, 1 = wall (trail or border). */
  grid: Uint8Array;
  player: CycleState;
  ai: CycleState;
  status: "playing" | "round-over";
  /** Set only once the round resolves. */
  roundResult: "player" | "ai" | "tie" | null;
  tick: number;
}

export interface MatchState {
  playerWins: number;
  aiWins: number;
  ties: number;
  target: number;
  round: BreakerState;
  finished: boolean;
}

export const HEADING_VECTORS: Record<Heading, Position> = {
  0: { x: 0, y: -1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: 1 },
  3: { x: -1, y: 0 },
};

export function applyTurn(heading: Heading, action: TurnAction): Heading {
  if (action === "left") return ((heading + 3) % 4) as Heading;
  if (action === "right") return ((heading + 1) % 4) as Heading;
  return heading;
}

export function indexOf(x: number, y: number): number {
  return y * GRID_WIDTH + x;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT;
}
