/**
 * Shadow Protocol — sound propagation (blueprint §4.5).
 *
 * Breadth-first over walkable-for-sound tiles:
 *   - walls block completely;
 *   - open doors pass with no penalty;
 *   - entering a closed-door tile costs 2 extra radius;
 *   - a guard hears the source when its tile's cost is within the radius.
 */

import type { Position, Tile } from "./types";

const CLOSED_DOOR_PENALTY = 2;

/**
 * Dijkstra flood from `source`; returns per-tile cost (Infinity where the
 * sound cannot reach within `radius`).
 */
export function propagateSound(
  tiles: Tile[],
  width: number,
  height: number,
  source: Position,
  radius: number,
): number[] {
  const cost = new Array<number>(tiles.length).fill(Infinity);
  const start = source.y * width + source.x;
  cost[start] = 0;
  // Tiny grid: a simple scan-based priority queue is plenty.
  const frontier: number[] = [start];
  while (frontier.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (cost[frontier[i]] < cost[frontier[bestIdx]]) bestIdx = i;
    }
    const current = frontier.splice(bestIdx, 1)[0];
    const cx = current % width;
    const cy = Math.floor(current / width);
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const idx = ny * width + nx;
      const tile = tiles[idx];
      if (tile === "wall") continue;
      const step = tile === "door-closed" ? 1 + CLOSED_DOOR_PENALTY : 1;
      const next = cost[current] + step;
      if (next <= radius && next < cost[idx]) {
        cost[idx] = next;
        frontier.push(idx);
      }
    }
  }
  return cost;
}

export function heardAt(costs: number[], width: number, pos: Position): boolean {
  return costs[pos.y * width + pos.x] !== Infinity;
}
