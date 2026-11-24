import type { PuzzleSize, SlidingPuzzleState } from "./types";

function solvedTiles(size: PuzzleSize): number[] {
  return [...Array(size * size - 1).keys()].map((index) => index + 1).concat(0);
}

function neighbors(index: number, size: PuzzleSize): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const out: number[] = [];
  if (row > 0) out.push(index - size);
  if (row < size - 1) out.push(index + size);
  if (col > 0) out.push(index - 1);
  if (col < size - 1) out.push(index + 1);
  return out;
}

function swap(tiles: number[], a: number, b: number): number[] {
  const next = [...tiles];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function isSlidingPuzzleSolved(tiles: number[]): boolean {
  return tiles.every((tile, index) => tile === (index === tiles.length - 1 ? 0 : index + 1));
}

export function createSlidingPuzzle(size: PuzzleSize, random = Math.random): SlidingPuzzleState {
  let tiles = solvedTiles(size);
  let emptyIndex = tiles.length - 1;
  let previous = -1;
  const shuffleMoves = size === 3 ? 70 : size === 4 ? 140 : 230;

  for (let i = 0; i < shuffleMoves; i += 1) {
    const options = neighbors(emptyIndex, size).filter((index) => index !== previous);
    const picked = options[Math.floor(random() * options.length)];
    tiles = swap(tiles, emptyIndex, picked);
    previous = emptyIndex;
    emptyIndex = picked;
  }

  if (isSlidingPuzzleSolved(tiles)) {
    const picked = neighbors(emptyIndex, size)[0];
    tiles = swap(tiles, emptyIndex, picked);
    emptyIndex = picked;
  }

  return { size, tiles, emptyIndex, moves: 0, solved: false };
}

export function canMoveTile(state: SlidingPuzzleState, index: number): boolean {
  return neighbors(state.emptyIndex, state.size).includes(index);
}

/** Arrow keys move the empty space in the indicated direction. */
export function arrowTarget(state: SlidingPuzzleState, key: string): number | null {
  const offsets: Record<string, number> = {
    ArrowUp: -state.size, ArrowDown: state.size, ArrowLeft: -1, ArrowRight: 1,
  };
  const index = state.emptyIndex + offsets[key];
  return canMoveTile(state, index) ? index : null;
}

function distanceFromGoal(tiles: number[], size: PuzzleSize): number {
  let distance = 0;
  for (const [index, tile] of tiles.entries()) {
    if (tile === 0) continue;
    const goal = tile - 1;
    distance += Math.abs(Math.floor(goal / size) - Math.floor(index / size))
      + Math.abs(goal % size - index % size);
  }
  return distance;
}

const smallBoardNeighbors = Array.from({ length: 9 }, (_, index) => neighbors(index, 3));
const distanceToPosition = Array.from({ length: 9 }, (_, goal) => Array.from({ length: 9 }, (_, pos) =>
  Math.abs(Math.floor(goal / 3) - Math.floor(pos / 3)) + Math.abs(goal % 3 - pos % 3)));

/** Iterative deepening with an admissible Manhattan bound on a solvable eight-puzzle. */
export function shortestSmallPuzzle(state: SlidingPuzzleState): { index: number; moves: number } | null {
  if (state.size !== 3 || state.solved) return null;
  const tiles = state.tiles.slice();
  const initial = distanceFromGoal(tiles, 3);
  let first = -1;
  function search(empty: number, previous: number, depth: number, distance: number, limit: number): boolean {
    if (depth + distance > limit) return false;
    if (distance === 0) return true;
    for (const pos of smallBoardNeighbors[empty]) {
      if (pos === previous) continue;
      const tile = tiles[pos];
      const distances = distanceToPosition[tile - 1];
      tiles[empty] = tile;
      tiles[pos] = 0;
      if (search(pos, empty, depth + 1, distance - distances[pos] + distances[empty], limit)) {
        if (depth === 0) first = pos;
        return true;
      }
      tiles[pos] = tile;
      tiles[empty] = 0;
    }
    return false;
  }
  // Every slide changes the parity of Manhattan distance. The eight-puzzle diameter is 31.
  for (let limit = initial; limit <= 31; limit += 2) {
    if (search(state.emptyIndex, -1, 0, initial, limit)) return { index: first, moves: limit };
  }
  return null;
}

/** Recommend the first move of a bounded search without changing the board. */
export function suggestSlidingTile(state: SlidingPuzzleState): number | null {
  if (state.solved) return null;
  if (state.size === 3) return shortestSmallPuzzle(state)?.index ?? null;
  type Candidate = { tiles: number[]; empty: number; firstMove: number; distance: number };
  let frontier: Candidate[] = [{
    tiles: state.tiles,
    empty: state.emptyIndex,
    firstMove: -1,
    distance: distanceFromGoal(state.tiles, state.size),
  }];
  const visited = new Set([state.tiles.join(",")]);
  let recommendation: Candidate | null = null;

  // The beam stays small at every depth, including the 5 × 5 board.
  for (let depth = 0; depth < 7; depth++) {
    const candidates: Candidate[] = [];
    for (const board of frontier) {
      for (const index of neighbors(board.empty, state.size)) {
        const tiles = swap(board.tiles, board.empty, index);
        const key = tiles.join(",");
        if (visited.has(key)) continue;
        visited.add(key);
        const firstMove = board.firstMove === -1 ? index : board.firstMove;
        const distance = distanceFromGoal(tiles, state.size);
        if (distance === 0) return firstMove;
        candidates.push({ tiles, empty: index, firstMove, distance });
      }
    }
    frontier = candidates.sort((a, b) => a.distance - b.distance).slice(0, 36);
    if (frontier.length === 0) break;
    if (!recommendation || frontier[0].distance < recommendation.distance) recommendation = frontier[0];
  }
  return recommendation?.firstMove ?? null;
}

export function moveSlidingTile(state: SlidingPuzzleState, index: number): SlidingPuzzleState {
  if (state.solved || !canMoveTile(state, index)) return state;
  const tiles = swap(state.tiles, state.emptyIndex, index);
  return {
    ...state,
    tiles,
    emptyIndex: index,
    moves: state.moves + 1,
    solved: isSlidingPuzzleSolved(tiles),
  };
}
