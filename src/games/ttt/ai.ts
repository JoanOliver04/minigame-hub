/**
 * Tic-Tac-Toe AI for the three-mark movement variant.
 *
 * A move includes both the selected mark and its destination once a player
 * has three marks. Hard searches full origin/destination actions.
 */

import { randomInt } from "@/lib/random";
import {
  AI_MARK,
  PLAYER_MARK,
  WIN_LINES,
  applyMove,
  checkOutcome,
  legalMoves,
  type Board,
  type Mark,
  type TttDifficulty,
  type TttMove,
} from "./logic";

function randomMove(board: Board): TttMove {
  const moves = legalMoves(board, AI_MARK);
  return moves[randomInt(0, moves.length - 1)];
}

function winningMove(board: Board, mark: Mark): TttMove | null {
  for (const move of legalMoves(board, mark)) {
    if (checkOutcome(applyMove(board, move, mark))?.winner === mark) return move;
  }
  return null;
}

function heuristic(board: Board): number {
  let score = 0;
  for (const line of WIN_LINES) {
    const ai = line.filter((cell) => board[cell] === AI_MARK).length;
    const player = line.filter((cell) => board[cell] === PLAYER_MARK).length;
    if (ai === 0 || player === 0) {
      if (player === 0) score += [0, 2, 14, 100][ai];
      if (ai === 0) score -= [0, 2, 16, 100][player];
    }
  }
  if (board[4] === AI_MARK) score += 4;
  if (board[4] === PLAYER_MARK) score -= 4;
  return score;
}

function stateKey(board: Board, turn: Mark, depth: number): string {
  return `${board.map((cell) => cell ?? "-").join("")}|${turn}|${depth}`;
}

function minimax(
  board: Board,
  depth: number,
  turn: Mark,
  alpha: number,
  beta: number,
  cache: Map<string, number>,
): number {
  const outcome = checkOutcome(board);
  if (outcome) {
    return outcome.winner === AI_MARK ? 10_000 + depth : -10_000 - depth;
  }
  if (depth === 0) return heuristic(board);

  const key = stateKey(board, turn, depth);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const maximizing = turn === AI_MARK;
  let best = maximizing ? -Infinity : Infinity;
  let pruned = false;

  for (const move of legalMoves(board, turn)) {
    const nextBoard = applyMove(board, move, turn);
    const score = minimax(
      nextBoard,
      depth - 1,
      maximizing ? PLAYER_MARK : AI_MARK,
      alpha,
      beta,
      cache,
    );
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

function bestMove(board: Board, depth: number): TttMove {
  const moves = legalMoves(board, AI_MARK);
  let selected = moves[0];
  let bestScore = -Infinity;
  const cache = new Map<string, number>();

  for (const move of moves) {
    const nextBoard = applyMove(board, move, AI_MARK);
    const score = minimax(
      nextBoard,
      depth - 1,
      PLAYER_MARK,
      -Infinity,
      Infinity,
      cache,
    );
    if (score > bestScore) {
      bestScore = score;
      selected = move;
    }
  }
  return selected;
}

export function aiPickMove(board: Board, difficulty: TttDifficulty): TttMove {
  if (difficulty === "easy") return randomMove(board);

  const winNow = winningMove(board, AI_MARK);
  if (winNow) return winNow;

  if (difficulty === "medium") return bestMove(board, 3);
  return bestMove(board, 8);
}
