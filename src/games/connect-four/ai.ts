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
} from "./logic";
import type { ConnectBoard, ConnectDifficulty, ConnectPiece } from "./types";

const ORDERED_COLUMNS = [3, 2, 4, 1, 5, 0, 6];
const WIN_SCORE = 1_000_000;

function orderedAvailableColumns(board: ConnectBoard): number[] {
  const available = new Set(availableColumns(board));
  return ORDERED_COLUMNS.filter((column) => available.has(column));
}

function countImmediateWins(board: ConnectBoard, piece: ConnectPiece): number {
  let wins = 0;
  for (const column of orderedAvailableColumns(board)) {
    const dropped = dropPiece(board, column, piece);
    if (dropped && checkBoardOutcome(dropped.board)?.winner === piece) wins++;
  }
  return wins;
}

function scoreWindow(window: (ConnectPiece | null)[]): number {
  const ai = window.filter((cell) => cell === AI_PIECE).length;
  const player = window.filter((cell) => cell === PLAYER_PIECE).length;
  const empty = 4 - ai - player;

  if (ai > 0 && player > 0) return 0;
  if (ai === 4) return WIN_SCORE;
  if (player === 4) return -WIN_SCORE;
  if (ai === 3 && empty === 1) return 125;
  if (ai === 2 && empty === 2) return 16;
  if (ai === 1 && empty === 3) return 2;
  if (player === 3 && empty === 1) return -155;
  if (player === 2 && empty === 2) return -20;
  if (player === 1 && empty === 3) return -2;
  return 0;
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
  const centerWeights = [0, 1, 3, 6, 3, 1, 0];
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      if (board[row][column] === AI_PIECE) score += centerWeights[column];
      if (board[row][column] === PLAYER_PIECE) score -= centerWeights[column];
    }
  }

  const windows: (ConnectPiece | null)[][] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column <= COLUMNS - 4; column++) {
      windows.push(board[row].slice(column, column + 4));
    }
  }
  for (let column = 0; column < COLUMNS; column++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      windows.push(Array.from({ length: 4 }, (_, offset) => board[row + offset][column]));
    }
  }
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let column = 0; column <= COLUMNS - 4; column++) {
      windows.push(Array.from({ length: 4 }, (_, offset) => board[row + offset][column + offset]));
    }
  }
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let column = 3; column < COLUMNS; column++) {
      windows.push(Array.from({ length: 4 }, (_, offset) => board[row + offset][column - offset]));
    }
  }
  score += windows.reduce((total, window) => total + scoreWindow(window), 0);

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
  const outcome = checkBoardOutcome(board);
  if (outcome?.winner === AI_PIECE) return WIN_SCORE + depth;
  if (outcome?.winner === PLAYER_PIECE) return -WIN_SCORE - depth;
  if (outcome?.draw) return 0;
  if (depth === 0) return evaluateBoard(board);

  const key = boardKey(board, depth, maximizing);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let best = maximizing ? -Infinity : Infinity;
  let pruned = false;
  const piece = maximizing ? AI_PIECE : PLAYER_PIECE;
  for (const column of orderedAvailableColumns(board)) {
    const dropped = dropPiece(board, column, piece);
    if (!dropped) continue;
    const score = minimax(dropped.board, depth - 1, !maximizing, alpha, beta, cache);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) {
      pruned = true;
      break;
    }
  }
  if (!pruned) cache.set(key, best);
  return best;
}

function immediateWinningColumn(board: ConnectBoard, piece: ConnectPiece): number | null {
  for (const column of orderedAvailableColumns(board)) {
    const dropped = dropPiece(board, column, piece);
    if (dropped && checkBoardOutcome(dropped.board)?.winner === piece) return column;
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
      -Infinity,
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

