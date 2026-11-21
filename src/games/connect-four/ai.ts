/**
 * Connect Four AI — depth-limited minimax with alpha-beta pruning.
 *
 * Move ordering checks center columns first, which improves both play quality
 * and pruning. Hard searches six plies: deeper searches grow exponentially
 * and would risk blocking the UI thread without a worker. At 7 columns,
 * alpha-beta + ordering + the transposition cache keep this depth comfortably
 * interactive on typical devices.
 */

import { randomInt } from "@/lib/random";
import {
  AI_PIECE,
  COLUMNS,
  PLAYER_PIECE,
  ROWS,
  availableColumns,
  checkBoardOutcome,
  dropPiece,
  getDropRow,
} from "./logic";
import type { ConnectBoard, ConnectDifficulty, ConnectPiece } from "./types";

const ORDERED_COLUMNS = [3, 2, 4, 1, 5, 0, 6];
const WIN_SCORE = 1_000_000;
const CENTER_WEIGHTS = [0, 1, 3, 6, 3, 1, 0];
const AI_WINDOW_WEIGHTS = [0, 2, 16, 125, WIN_SCORE];
const PLAYER_WINDOW_WEIGHTS = [0, 2, 20, 155, WIN_SCORE];
const SIGNS = [-1, 1];
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

function inBounds(row: number, column: number): boolean {
  return row >= 0 && row < ROWS && column >= 0 && column < COLUMNS;
}

const WINDOWS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLUMNS }, (_, column) =>
    DIRECTIONS.filter(([dy, dx]) => inBounds(row + 3 * dy, column + 3 * dx)).map(([dy, dx]) =>
      Array.from({ length: 4 }, (_, offset) => [row + offset * dy, column + offset * dx] as const),
    ),
  ),
).flat(2);

function orderedAvailableColumns(board: ConnectBoard): number[] {
  return ORDERED_COLUMNS.filter((column) => board[0][column] === null);
}

/** Test only lines crossing the new piece. No board copy is needed. */
function wouldWin(board: ConnectBoard, column: number, piece: ConnectPiece): boolean {
  const row = getDropRow(board, column);
  if (row === null) return false;
  for (const [dy, dx] of DIRECTIONS) {
    let count = 1;
    for (const sign of SIGNS) {
      for (let offset = 1; offset < 4; offset++) {
        const y = row + sign * offset * dy;
        const x = column + sign * offset * dx;
        if (!inBounds(y, x) || board[y][x] !== piece) break;
        count++;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

function countImmediateWins(board: ConnectBoard, piece: ConnectPiece): number {
  let wins = 0;
  for (const column of orderedAvailableColumns(board)) {
    if (wouldWin(board, column, piece)) wins++;
  }
  return wins;
}

function scoreWindow(ai: number, player: number): number {
  if (ai > 0 && player > 0) return 0;
  return AI_WINDOW_WEIGHTS[ai] - PLAYER_WINDOW_WEIGHTS[player];
}

/**
 * Heuristic from the AI's perspective:
 * - scores every open four-cell window in all directions;
 * - penalizes player threats slightly more than equivalent AI opportunities;
 * - rewards center and near-center control;
 * - strongly values immediate and double threats.
 */
export function evaluateBoard(board: ConnectBoard): number {
  const outcome = checkBoardOutcome(board);
  if (outcome?.winner === AI_PIECE) return WIN_SCORE;
  if (outcome?.winner === PLAYER_PIECE) return -WIN_SCORE;
  if (outcome?.draw) return 0;

  let score = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      if (board[row][column] === AI_PIECE) score += CENTER_WEIGHTS[column];
      if (board[row][column] === PLAYER_PIECE) score -= CENTER_WEIGHTS[column];
    }
  }

  for (const window of WINDOWS) {
    let ai = 0;
    let player = 0;
    for (const [row, column] of window) {
      const piece = board[row][column];
      if (piece === AI_PIECE) ai++;
      if (piece === PLAYER_PIECE) player++;
    }
    score += scoreWindow(ai, player);
  }

  const aiThreats = countImmediateWins(board, AI_PIECE);
  const playerThreats = countImmediateWins(board, PLAYER_PIECE);
  score += aiThreats * 850 - playerThreats * 1_050;
  if (aiThreats >= 2) score += 2_500;
  if (playerThreats >= 2) score -= 3_000;
  return score;
}

function boardKey(board: ConnectBoard, depth: number, maximizing: boolean): string {
  return `${board.flat().map((cell) => cell ?? "-").join("")}|${depth}|${maximizing ? 1 : 0}`;
}

function minimax(
  board: ConnectBoard,
  depth: number,
  maximizing: boolean,
  alpha: number,
  beta: number,
  cache: Map<string, number>,
): number {
  if (depth === 0) return evaluateBoard(board);
  const outcome = checkBoardOutcome(board);
  if (outcome?.winner === AI_PIECE) return WIN_SCORE + depth;
  if (outcome?.winner === PLAYER_PIECE) return -WIN_SCORE - depth;
  if (outcome?.draw) return 0;

  const key = boardKey(board, depth, maximizing);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let best = maximizing ? -Infinity : Infinity;
  const originalAlpha = alpha;
  const originalBeta = beta;
  const piece = maximizing ? AI_PIECE : PLAYER_PIECE;
  for (const column of orderedAvailableColumns(board)) {
    const dropped = dropPiece(board, column, piece);
    if (!dropped) continue;
    const score = minimax(dropped.board, depth - 1, !maximizing, alpha, beta, cache);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  if (best > originalAlpha && best < originalBeta) cache.set(key, best);
  return best;
}

function immediateWinningColumn(board: ConnectBoard, piece: ConnectPiece): number | null {
  for (const column of orderedAvailableColumns(board)) {
    if (wouldWin(board, column, piece)) return column;
  }
  return null;
}

function bestColumn(board: ConnectBoard, depth: number): number {
  const columns = orderedAvailableColumns(board);
  let selected = columns[0];
  let bestScore = -Infinity;
  const cache = new Map<string, number>();
  for (const column of columns) {
    const dropped = dropPiece(board, column, AI_PIECE);
    if (!dropped) continue;
    const score = minimax(
      dropped.board,
      depth - 1,
      false,
      bestScore,
      Infinity,
      cache,
    );
    if (score > bestScore) {
      bestScore = score;
      selected = column;
    }
  }
  return selected;
}

export function aiPickColumn(
  board: ConnectBoard,
  difficulty: ConnectDifficulty,
): number {
  const winNow = immediateWinningColumn(board, AI_PIECE);
  if (winNow !== null) return winNow;

  const blockNow = immediateWinningColumn(board, PLAYER_PIECE);
  if (difficulty === "easy") {
    if (blockNow !== null && Math.random() < 0.75) return blockNow;
    const columns = availableColumns(board);
    return columns[randomInt(0, columns.length - 1)];
  }

  if (blockNow !== null) return blockNow;
  return bestColumn(board, difficulty === "medium" ? 3 : 6);
}

