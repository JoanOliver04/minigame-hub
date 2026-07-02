/**
 * Fleet Command — shared types (blueprint §7).
 * Pure data only: no React, no DOM.
 */

export const BOARD_SIZE = 8;
export const FLEET_LENGTHS = [4, 3, 2, 2] as const;
export const SONAR_RADIUS = 1; // 3×3 region

export type FleetDifficulty = "easy" | "medium" | "hard";

export interface Ship {
  id: number;
  length: number;
  /** Board indices (y * 8 + x), in line order. */
  cells: number[];
  hits: number;
}

/** Result of one shot on a board. */
export type ShotResult = "miss" | "hit" | "sunk";

/** What a shooter has learned about one fired cell. */
export type CellMark = "none" | "miss" | "hit";

/**
 * One entry of a shooter's public history — exactly the information a human
 * opponent would have: where they fired, what came back, and (only when a
 * ship sinks) which cells it occupied.
 */
export interface ShotRecord {
  index: number;
  result: ShotResult;
  /** Revealed only on "sunk". */
  sunkCells?: number[];
  sunkLength?: number;
}

export interface SonarReading {
  center: number;
  count: number;
}

/** The AI's explicit knowledge model (blueprint §7.3) — never real cells. */
export type IntelCell = "unknown" | "miss" | "hit" | "sunk-buffer";

export interface FleetIntel {
  cells: IntelCell[];
  remainingShipLengths: number[];
  sonar: SonarReading | null;
}

export function toXY(index: number): { x: number; y: number } {
  return { x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) };
}

export function toIndex(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

/** All neighbours including diagonals (ships may not touch at all). */
export function neighborhood(index: number): number[] {
  const { x, y } = toXY(index);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (inBounds(x + dx, y + dy)) out.push(toIndex(x + dx, y + dy));
    }
  }
  return out;
}
