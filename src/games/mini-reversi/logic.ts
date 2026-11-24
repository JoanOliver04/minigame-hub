import { otherSeat, type DuelRules, type DuelState, type Seat } from "../duels/types";

export const SIZE = 6;
const vectors = [-1, 0, 1].flatMap(row => [-1, 0, 1].filter(col => row || col).map(col => [row, col]));
const corners = [0, SIZE - 1, SIZE * (SIZE - 1), SIZE * SIZE - 1];
export interface ReversiState extends DuelState {
  board: number[]; // 0 is empty. Discs are 1 and 2.
  last: number;
  passed: boolean;
}

export function opening(): ReversiState {
  const board = Array<number>(SIZE * SIZE).fill(0);
  board[14] = board[21] = 2;
  board[15] = board[20] = 1;
  return { board, active: 0, winner: null, moves: 0, last: -1, passed: false };
}

export function captures(board: number[], seat: Seat, at: number): number[] {
  if (!Number.isInteger(at) || board[at] !== 0) return [];
  const mine = seat + 1;
  const flipped: number[] = [];
  for (const [dr, dc] of vectors) {
    let row = Math.floor(at / SIZE) + dr, col = at % SIZE + dc;
    const line: number[] = [];
    while (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      const pos = row * SIZE + col;
      if (board[pos] !== 3 - mine) {
        if (board[pos] === mine) flipped.push(...line);
        break;
      }
      line.push(pos);
      row += dr;
      col += dc;
    }
  }
  return flipped;
}

export function legalMoves(board: number[], seat: Seat): number[] {
  return board.flatMap((disc, i) => !disc && captures(board, seat, i).length ? [i] : []);
}

export function countDiscs(board: number[]): [number, number] {
  return [board.filter(v => v === 1).length, board.filter(v => v === 2).length];
}

export function place(state: ReversiState, at: number): ReversiState {
  if (state.winner !== null) return state;
  const flipped = captures(state.board, state.active, at);
  if (!flipped.length) return state;
  const board = state.board.slice();
  for (const pos of [at, ...flipped]) board[pos] = state.active + 1;
  const opponent = otherSeat(state.active);
  const opponentCanPlay = legalMoves(board, opponent).length > 0;
  const passed = !opponentCanPlay && legalMoves(board, state.active).length > 0;
  const [dark, light] = countDiscs(board);
  const winner = opponentCanPlay || passed ? null : dark === light ? "tie" : dark > light ? 0 : 1;
  return { board, active: opponentCanPlay ? opponent : state.active, moves: state.moves + 1, winner, passed, last: at };
}

function evaluate(state: ReversiState, seat: Seat) {
  const counts = countDiscs(state.board);
  const advantage = counts[seat] - counts[otherSeat(seat)];
  if (state.winner !== null) return 1000 * Math.sign(advantage) + advantage;
  const cornerScore = corners.reduce((sum, pos) => sum +
    (state.board[pos] === 0 ? 0 : state.board[pos] === seat + 1 ? 1 : -1), 0);
  const mobility = legalMoves(state.board, seat).length - legalMoves(state.board, otherSeat(seat)).length;
  return cornerScore * 30 + mobility * 4 + advantage;
}

function search(state: ReversiState, seat: Seat, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || state.winner !== null) return evaluate(state, seat);
  const maximize = state.active === seat;
  let best = maximize ? -Infinity : Infinity;
  for (const at of legalMoves(state.board, state.active)) {
    const score = search(place(state, at), seat, depth - 1, alpha, beta);
    best = maximize ? Math.max(best, score) : Math.min(best, score);
    if (maximize) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

export const reversi: DuelRules<ReversiState, number> = {
  id: "mini-reversi", start: opening, play: place,
  choose(state, level) {
    const moves = legalMoves(state.board, state.active);
    let best = moves[Math.floor(Math.random() * moves.length)];
    if (level === "easy") return best;
    let bestScore = -Infinity;
    for (const at of moves) {
      const score = search(place(state, at), state.active, level === "hard" ? 2 : 0, bestScore, Infinity);
      if (score > bestScore) { bestScore = score; best = at; }
    }
    return best;
  },
};
