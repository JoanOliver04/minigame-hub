import { HEX_SIZE, type HexCell, type HexOwner, type HexState } from "./types";

const CELL_COUNT = HEX_SIZE * HEX_SIZE;
const LAST_EDGE = HEX_SIZE - 1;
const NEIGHBOUR_OFFSETS = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]] as const;

export const hexIndex = (row: number, column: number) => row * HEX_SIZE + column;
export const coordinates = (index: number): [number, number] => [Math.floor(index / HEX_SIZE), index % HEX_SIZE];

const topology = Array.from({ length: CELL_COUNT }, (_, index) => {
  const [row, column] = coordinates(index);
  return NEIGHBOUR_OFFSETS.flatMap(([dr, dc]) => {
    const r = row + dr;
    const c = column + dc;
    return r >= 0 && r < HEX_SIZE && c >= 0 && c < HEX_SIZE ? [hexIndex(r, c)] : [];
  });
});

const startingEdges = {
  player: Array.from({ length: HEX_SIZE }, (_, index) => hexIndex(index, 0)),
  ai: Array.from({ length: HEX_SIZE }, (_, index) => hexIndex(0, index)),
};

export function createHexState(): HexState {
  return { board: Array<HexCell>(CELL_COUNT).fill(null), turn: "player", winner: null, moves: 0 };
}

export function neighbours(index: number): readonly number[] {
  return topology[index];
}

export function legalMoves(board: readonly HexCell[]): number[] {
  const moves: number[] = [];
  board.forEach((owner, index) => {
    if (owner === null) moves.push(index);
  });
  return moves;
}

export function hasConnection(board: readonly HexCell[], owner: HexOwner): boolean {
  const queue: number[] = [];
  const seen = new Uint8Array(CELL_COUNT);
  for (const index of startingEdges[owner]) {
    if (board[index] !== owner) continue;
    seen[index] = 1;
    queue.push(index);
  }
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    if (owner === "player" ? index % HEX_SIZE === LAST_EDGE : index >= CELL_COUNT - HEX_SIZE) return true;
    for (const next of neighbours(index)) {
      if (seen[next] || board[next] !== owner) continue;
      seen[next] = 1;
      queue.push(next);
    }
  }
  return false;
}

export function placeStone(state: HexState, index: number): HexState {
  if (state.winner || state.board[index] !== null) return state;
  const board = state.board.slice();
  board[index] = state.turn;
  return {
    board,
    turn: state.turn === "player" ? "ai" : "player",
    winner: hasConnection(board, state.turn) ? state.turn : null,
    moves: state.moves + 1,
  };
}
