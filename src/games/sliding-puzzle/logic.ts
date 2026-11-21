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

export function createSlidingPuzzle(size: PuzzleSize): SlidingPuzzleState {
  let tiles = solvedTiles(size);
  let emptyIndex = tiles.length - 1;
  let previous = -1;
  const shuffleMoves = size === 3 ? 70 : size === 4 ? 140 : 230;

  for (let i = 0; i < shuffleMoves; i += 1) {
    const options = neighbors(emptyIndex, size).filter((index) => index !== previous);
    const picked = options[Math.floor(Math.random() * options.length)];
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

/** Recommend the first move of a bounded search without changing the board. */
export function suggestSlidingTile(state: SlidingPuzzleState): number | null {
  if (state.solved) return null;
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
