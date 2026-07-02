/**
 * Shadow Protocol — security AI (blueprint §4.6–4.7).
 *
 * Honest-information contract: every function here receives only the map,
 * guard knowledge (evidence tile + turns since seen), and public objective
 * positions. The live player position is never passed in — detection and
 * hearing happen in logic.ts through the visibility/sound models, which is
 * exactly what a human opponent could observe.
 *
 * Difficulty:
 *   Easy   — greedy step toward evidence, 1-turn memory, independent guards.
 *   Medium — A* to evidence, 3-turn memory, one guard cuts off the exit.
 *   Hard   — A* plus interception scoring over a reachability "heatmap" of
 *            tiles the intruder could occupy since last seen.
 */

import type { Position, ShadowDifficulty, Tile } from "./types";
import { isWalkable } from "./types";

const CARDINALS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function idx(width: number, p: Position): number {
  return p.y * width + p.x;
}

/** BFS distances from `from` over walkable tiles (closed doors block guards). */
export function distanceField(
  tiles: Tile[],
  width: number,
  height: number,
  from: Position,
): number[] {
  const dist = new Array<number>(tiles.length).fill(-1);
  const queue: number[] = [idx(width, from)];
  dist[queue[0]] = 0;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const cx = current % width;
    const cy = Math.floor(current / width);
    for (const d of CARDINALS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (dist[n] !== -1 || !isWalkable(tiles[n])) continue;
      dist[n] = dist[current] + 1;
      queue.push(n);
    }
  }
  return dist;
}

/**
 * First step of a shortest path from → to (BFS parent walk; the grid is
 * tiny so full BFS beats maintaining an A* heap). Returns null when
 * unreachable or already there. `blocked` marks tiles other guards occupy.
 */
export function pathStep(
  tiles: Tile[],
  width: number,
  height: number,
  from: Position,
  to: Position,
  blocked: Set<number>,
): Position | null {
  if (from.x === to.x && from.y === to.y) return null;
  const parent = new Array<number>(tiles.length).fill(-2);
  const start = idx(width, from);
  const goal = idx(width, to);
  parent[start] = -1;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === goal) break;
    const cx = current % width;
    const cy = Math.floor(current / width);
    for (const d of CARDINALS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (parent[n] !== -2 || !isWalkable(tiles[n])) continue;
      // Other guards block movement, but never the goal evaluation itself.
      if (blocked.has(n) && n !== goal) continue;
      parent[n] = current;
      queue.push(n);
    }
  }
  if (parent[goal] === -2) return null;
  let node = goal;
  while (parent[node] !== start && parent[node] !== -1) node = parent[node];
  if (parent[node] === -1) return null;
  return { x: node % width, y: Math.floor(node / width) };
}

/** Easy-mode movement: one greedy step that reduces manhattan distance. */
export function greedyStep(
  tiles: Tile[],
  width: number,
  height: number,
  from: Position,
  to: Position,
  blocked: Set<number>,
): Position | null {
  let best: Position | null = null;
  let bestDist = manhattan(from, to);
  for (const d of CARDINALS) {
    const next = { x: from.x + d.x, y: from.y + d.y };
    if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
    const n = idx(width, next);
    if (!isWalkable(tiles[n]) || blocked.has(n)) continue;
    const dist = manhattan(next, to);
    if (dist < bestDist) {
      bestDist = dist;
      best = next;
    }
  }
  return best;
}

/**
 * Tiles the intruder could have reached since last seen — the Hard-mode
 * knowledge model. Derived ONLY from the last-known tile and elapsed turns.
 */
export function reachableCandidates(
  tiles: Tile[],
  width: number,
  height: number,
  lastKnown: Position,
  turnsSince: number,
): Position[] {
  const dist = distanceField(tiles, width, height, lastKnown);
  const out: Position[] = [];
  // Sprint moves two tiles, so the reachable ball grows at up to 2/turn.
  const radius = Math.max(1, turnsSince * 2);
  for (let i = 0; i < dist.length; i++) {
    if (dist[i] !== -1 && dist[i] <= radius) {
      out.push({ x: i % width, y: Math.floor(i / width) });
    }
  }
  return out;
}

/**
 * Hard-mode chase target: among tiles the intruder could occupy, weight the
 * ones closest to their presumed objective (core, then exit) and pick the
 * candidate this guard can intercept soonest.
 */
export function interceptionTarget(
  tiles: Tile[],
  width: number,
  height: number,
  guardPos: Position,
  lastKnown: Position,
  turnsSince: number,
  objective: Position,
): Position {
  const candidates = reachableCandidates(tiles, width, height, lastKnown, turnsSince);
  if (candidates.length === 0) return lastKnown;
  const objectiveField = distanceField(tiles, width, height, objective);
  const guardField = distanceField(tiles, width, height, guardPos);
  let best = lastKnown;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const i = idx(width, candidate);
    const toObjective = objectiveField[i] === -1 ? 99 : objectiveField[i];
    const toGuard = guardField[i] === -1 ? 99 : guardField[i];
    // Likely tiles are near the objective route; interceptable tiles are
    // ones the guard reaches no later than the intruder plausibly could.
    const score = toObjective * 2 + Math.max(0, toGuard - turnsSince);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

/** How many turns evidence stays actionable before a guard gives up. */
export function memoryTurns(difficulty: ShadowDifficulty): number {
  if (difficulty === "easy") return 1;
  if (difficulty === "medium") return 3;
  return 5;
}

/** Movement resolver used by every mode. */
export function stepToward(
  tiles: Tile[],
  width: number,
  height: number,
  from: Position,
  to: Position,
  blocked: Set<number>,
  difficulty: ShadowDifficulty,
): Position | null {
  if (difficulty === "easy") return greedyStep(tiles, width, height, from, to, blocked);
  return pathStep(tiles, width, height, from, to, blocked);
}
