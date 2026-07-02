/** Connect Four — pure board rules, gravity and match bookkeeping. */

import type {
  BoardPosition,
  ConnectBoard,
  ConnectDifficulty,
  ConnectMatchState,
  ConnectPiece,
  ConnectRoundOutcome,
} from "./types";

export const ROWS = 6;
export const COLUMNS = 7;
export const PLAYER_PIECE: ConnectPiece = "R";
export const AI_PIECE: ConnectPiece = "Y";

export function createBoard(): ConnectBoard {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLUMNS }, () => null),
  );
}

export function availableColumns(board: ConnectBoard): number[] {
  return Array.from({ length: COLUMNS }, (_, column) => column).filter(
    (column) => board[0][column] === null,
  );
}

export function getDropRow(board: ConnectBoard, column: number): number | null {
  if (column < 0 || column >= COLUMNS) return null;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) return row;
  }
  return null;
}

export function dropPiece(
  board: ConnectBoard,
  column: number,
  piece: ConnectPiece,
): { board: ConnectBoard; position: BoardPosition } | null {
  const row = getDropRow(board, column);
  if (row === null) return null;
  const next = board.map((cells) => [...cells]);
  next[row][column] = piece;
  return { board: next, position: { row, column } };
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** Find a winning four in every horizontal, vertical and diagonal direction. */
export function checkBoardOutcome(board: ConnectBoard): ConnectRoundOutcome | null {
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const piece = board[row][column];
      if (!piece) continue;
      for (const [rowStep, columnStep] of DIRECTIONS) {
        const line: BoardPosition[] = [];
        for (let offset = 0; offset < 4; offset++) {
          const nextRow = row + rowStep * offset;
          const nextColumn = column + columnStep * offset;
          if (
            nextRow < 0 ||
            nextRow >= ROWS ||
            nextColumn < 0 ||
            nextColumn >= COLUMNS ||
            board[nextRow][nextColumn] !== piece
          ) {
            break;
          }
          line.push({ row: nextRow, column: nextColumn });
        }
        if (line.length === 4) return { winner: piece, line, draw: false };
      }
    }
  }

  if (availableColumns(board).length === 0) {
    return { winner: null, line: null, draw: true };
  }
  return null;
}

export function createConnectMatch(
  difficulty: ConnectDifficulty,
  target: number,
): ConnectMatchState {
  return {
    difficulty,
    target,
    playerScore: 0,
    aiScore: 0,
    draws: 0,
    rounds: 0,
    finished: false,
  };
}

export function applyConnectOutcome(
  match: ConnectMatchState,
  outcome: ConnectRoundOutcome,
): ConnectMatchState {
  const playerScore = match.playerScore + (outcome.winner === PLAYER_PIECE ? 1 : 0);
  const aiScore = match.aiScore + (outcome.winner === AI_PIECE ? 1 : 0);
  return {
    ...match,
    playerScore,
    aiScore,
    draws: match.draws + (outcome.draw ? 1 : 0),
    rounds: match.rounds + 1,
    finished: playerScore >= match.target || aiScore >= match.target,
  };
}

