/**
 * Circuit Breaker — pure simultaneous-turn resolution (blueprint §8.2).
 *
 * Exact resolution order every tick (this order is what prevents first-
 * player advantage — do not reorder):
 *   1. both decisions are already collected by the caller;
 *   2. rotate headings;
 *   3. compute both destination cells;
 *   4. mark crash if a destination is outside the grid or already a wall;
 *   5. mark BOTH crashed if destinations are equal or the cycles swap cells;
 *   6. otherwise move both and mark their previous cells as walls.
 */

import type { BreakerState, CycleState, Heading, Position, TurnAction } from "./types";
import { GRID_HEIGHT, GRID_WIDTH, HEADING_VECTORS, applyTurn, inBounds, indexOf } from "./types";

export function createArena(): Uint8Array {
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  for (let x = 0; x < GRID_WIDTH; x++) {
    grid[indexOf(x, 0)] = 1;
    grid[indexOf(x, GRID_HEIGHT - 1)] = 1;
  }
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[indexOf(0, y)] = 1;
    grid[indexOf(GRID_WIDTH - 1, y)] = 1;
  }
  return grid;
}

/**
 * Mirror-symmetric parallel start: both cycles begin on opposite thirds of
 * the arena heading the same direction (north), well separated
 * horizontally. Neither heading points toward the other cycle, so the
 * round opens with a long runway for genuine strategy instead of an
 * early, near-random head-on collision (a face-each-other start was
 * tested and made outcomes dominated by the first handful of ticks).
 */
export function createRound(): BreakerState {
  const grid = createArena();
  const y = GRID_HEIGHT - 3;
  const player: CycleState = { pos: { x: 4, y }, heading: 0, alive: true };
  const ai: CycleState = { pos: { x: GRID_WIDTH - 5, y }, heading: 0, alive: true };
  grid[indexOf(player.pos.x, player.pos.y)] = 1;
  grid[indexOf(ai.pos.x, ai.pos.y)] = 1;
  return { grid, player, ai, status: "playing", roundResult: null, tick: 0 };
}

function destination(cycle: CycleState, action: TurnAction): { pos: Position; heading: Heading } {
  const heading = applyTurn(cycle.heading, action);
  const v = HEADING_VECTORS[heading];
  return { pos: { x: cycle.pos.x + v.x, y: cycle.pos.y + v.y }, heading };
}

export function isWall(grid: Uint8Array, pos: Position): boolean {
  if (!inBounds(pos.x, pos.y)) return true;
  return grid[indexOf(pos.x, pos.y)] === 1;
}

export function legalActions(state: BreakerState, actor: "player" | "ai"): TurnAction[] {
  const cycle = state[actor];
  const actions: TurnAction[] = ["left", "straight", "right"];
  const legal = actions.filter((action) => !isWall(state.grid, destination(cycle, action).pos));
  return legal.length > 0 ? legal : actions; // forced move: every option is fatal
}

export function resolveTick(
  prev: BreakerState,
  playerAction: TurnAction,
  aiAction: TurnAction,
): BreakerState {
  if (prev.status !== "playing") return prev;
  const grid = new Uint8Array(prev.grid);

  const playerDest = destination(prev.player, playerAction);
  const aiDest = destination(prev.ai, aiAction);

  let playerCrash = isWall(grid, playerDest.pos);
  let aiCrash = isWall(grid, aiDest.pos);

  const sameDestination = playerDest.pos.x === aiDest.pos.x && playerDest.pos.y === aiDest.pos.y;
  const swapped =
    playerDest.pos.x === prev.ai.pos.x &&
    playerDest.pos.y === prev.ai.pos.y &&
    aiDest.pos.x === prev.player.pos.x &&
    aiDest.pos.y === prev.player.pos.y;
  if (sameDestination || swapped) {
    playerCrash = true;
    aiCrash = true;
  }

  const player: CycleState = playerCrash
    ? { ...prev.player, heading: playerDest.heading, alive: false }
    : { pos: playerDest.pos, heading: playerDest.heading, alive: true };
  const ai: CycleState = aiCrash
    ? { ...prev.ai, heading: aiDest.heading, alive: false }
    : { pos: aiDest.pos, heading: aiDest.heading, alive: true };

  if (!playerCrash) grid[indexOf(player.pos.x, player.pos.y)] = 1;
  if (!aiCrash) grid[indexOf(ai.pos.x, ai.pos.y)] = 1;

  const bothAlive = player.alive && ai.alive;
  const roundResult = bothAlive
    ? null
    : player.alive
      ? "player"
      : ai.alive
        ? "ai"
        : "tie";

  return {
    grid,
    player,
    ai,
    status: bothAlive ? "playing" : "round-over",
    roundResult,
    tick: prev.tick + 1,
  };
}

/**
 * BFS reachable free-space size from `from`, capped to bound search cost.
 * Index-based queue (not `Array.shift()`, which is O(n) per call) keeps
 * this O(cap) so Hard-mode search can afford many calls per decision.
 */
export function reachableSpace(grid: Uint8Array, from: Position, cap: number): number {
  const startIdx = indexOf(from.x, from.y);
  if (grid[startIdx] === 1) return 0;
  const visited = new Uint8Array(grid.length);
  visited[startIdx] = 1;
  // Bounded by grid.length: `visited` guarantees each cell is enqueued at
  // most once, so this can never overflow regardless of `cap`.
  const queue = new Int32Array(grid.length);
  queue[0] = startIdx;
  let head = 0;
  let tail = 1;
  let count = 0;
  while (head < tail && count < cap) {
    const cur = queue[head++];
    count++;
    const cx = cur % GRID_WIDTH;
    const cy = (cur / GRID_WIDTH) | 0;
    if (cx + 1 < GRID_WIDTH) {
      const n = cur + 1;
      if (!visited[n] && grid[n] === 0) {
        visited[n] = 1;
        if (tail < queue.length) queue[tail++] = n;
      }
    }
    if (cx - 1 >= 0) {
      const n = cur - 1;
      if (!visited[n] && grid[n] === 0) {
        visited[n] = 1;
        if (tail < queue.length) queue[tail++] = n;
      }
    }
    if (cy + 1 < GRID_HEIGHT) {
      const n = cur + GRID_WIDTH;
      if (!visited[n] && grid[n] === 0) {
        visited[n] = 1;
        if (tail < queue.length) queue[tail++] = n;
      }
    }
    if (cy - 1 >= 0) {
      const n = cur - GRID_WIDTH;
      if (!visited[n] && grid[n] === 0) {
        visited[n] = 1;
        if (tail < queue.length) queue[tail++] = n;
      }
    }
  }
  return count;
}
