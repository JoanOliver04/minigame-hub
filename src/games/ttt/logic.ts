/**
 * Tic-Tac-Toe — pure game rules. No React, no DOM, no side effects.
 * The player is always X and moves first; the AI is always O.
 */

export type Mark = "X" | "O";
export type Cell = Mark | null;
/** Flat 3x3 board, indexes 0..8 reading left-to-right, top-to-bottom. */
export type Board = Cell[];
export interface TttMove {
  /** null while placing the first three marks; otherwise the mark being moved. */
  from: number | null;
  to: number;
}
export type TttDifficulty = "easy" | "medium" | "hard";

export const PLAYER_MARK: Mark = "X";
export const AI_MARK: Mark = "O";

/** All 8 winning lines: rows, columns, diagonals. */
export const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** winner null = draw (board full, no line). */
export interface RoundOutcome {
  winner: Mark | null;
  line: number[] | null;
}

export function emptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function emptyCells(board: Board): number[] {
  const cells: number[] = [];
  board.forEach((cell, i) => {
    if (cell === null) cells.push(i);
  });
  return cells;
}

/**
 * Terminal check: a completed line, or null if the round is still active.
 */
export function checkOutcome(board: Board): RoundOutcome | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

/**
 * List every legal turn. Players place their first three marks. Afterwards
 * they choose any one of their marks and move it to any empty cell.
 */
export function legalMoves(board: Board, mark: Mark): TttMove[] {
  const ownCells = board.flatMap((cell, index) => (cell === mark ? [index] : []));
  const targets = emptyCells(board);
  if (ownCells.length < 3) return targets.map((to) => ({ from: null, to }));
  return ownCells.flatMap((from) => targets.map((to) => ({ from, to })));
}

export function applyMove(board: Board, move: TttMove, mark: Mark): Board {
  const nextBoard = board.slice();
  if (move.from !== null) nextBoard[move.from] = null;
  nextBoard[move.to] = mark;
  return nextBoard;
}

/* ---------- match (best-of-N) bookkeeping, mirrors the RPS shape ---------- */

export interface TttMatchState {
  difficulty: TttDifficulty;
  /** Round wins needed to take the match (draws don't count). */
  target: number;
  youScore: number;
  aiScore: number;
  draws: number;
  rounds: number;
  finished: boolean;
}

export function createTttMatch(difficulty: TttDifficulty, target: number): TttMatchState {
  return {
    difficulty,
    target,
    youScore: 0,
    aiScore: 0,
    draws: 0,
    rounds: 0,
    finished: false,
  };
}

/** Fold one finished board into the match tally. */
export function applyRoundOutcome(match: TttMatchState, outcome: RoundOutcome): TttMatchState {
  const youScore = match.youScore + (outcome.winner === PLAYER_MARK ? 1 : 0);
  const aiScore = match.aiScore + (outcome.winner === AI_MARK ? 1 : 0);
  return {
    ...match,
    youScore,
    aiScore,
    draws: match.draws + (outcome.winner === null ? 1 : 0),
    rounds: match.rounds + 1,
    finished: youScore >= match.target || aiScore >= match.target,
  };
}
