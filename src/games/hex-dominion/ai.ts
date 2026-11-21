import type { Rng } from "@/lib/rng";
import { coordinates, hasConnection, legalMoves, neighbours } from "./logic";
import { HEX_SIZE, type HexCell, type HexDifficulty, type HexOwner } from "./types";

const CENTER = (HEX_SIZE - 1) / 2;
const POSITIONS = Array.from({ length: HEX_SIZE * HEX_SIZE }, (_, index) => coordinates(index));
const NO_ROUTE = POSITIONS.length + 1;

function edgeAxis(position: number, owner: HexOwner): number {
  return POSITIONS[position][owner === "player" ? 1 : 0];
}

/** Count the empty cells on the cheapest path between both player's edges. */
export function connectionCost(board: readonly HexCell[], owner: HexOwner): number {
  const distance = new Int16Array(POSITIONS.length).fill(NO_ROUTE);
  const pending: number[] = [];
  let best = NO_ROUTE;
  const enemy = owner === "player" ? "ai" : "player";
  for (let index = 0; index < board.length; index++) {
    if (edgeAxis(index, owner) !== 0 || board[index] === enemy) continue;
    distance[index] = Number(board[index] === null);
    pending.push(index);
  }
  for (let head = 0; head < pending.length; head++) {
    const index = pending[head];
    const cost = distance[index];
    if (cost >= best) continue;
    if (edgeAxis(index, owner) === HEX_SIZE - 1) {
      best = cost;
      continue;
    }
    for (const next of neighbours(index)) {
      if (board[next] === enemy) continue;
      const nextCost = cost + Number(board[next] === null);
      if (nextCost >= distance[next] || nextCost >= best) continue;
      distance[next] = nextCost;
      pending.push(next);
    }
  }
  return best;
}

function winningMove(board: readonly HexCell[], moves: readonly number[], owner: HexOwner): number | undefined {
  const candidate = board.slice();
  for (const move of moves) {
    candidate[move] = owner;
    if (hasConnection(candidate, owner)) return move;
    candidate[move] = null;
  }
}

function scorePosition(board: readonly HexCell[], move: number, owner: HexOwner): number {
  const [row, column] = POSITIONS[move];
  const axis = owner === "player" ? column : row;
  let score = 10 - Math.abs(row - CENTER) - Math.abs(column - CENTER);
  if (axis === 0 || axis === HEX_SIZE - 1) score += 4;
  for (const near of neighbours(move)) {
    if (board[near] !== null) score += board[near] === owner ? 5 : 2;
  }
  return score;
}

function pickBestIndex(board: HexCell[], moves: number[], owner: HexOwner, rng?: Rng): number {
  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let index = 0; index < moves.length; index++) {
    const score = scorePosition(board, moves[index], owner) + (rng ? rng.next() * 8 : 0);
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }
  return bestIndex;
}

function simulate(board: HexCell[], moves: number[], opening: number, rng: Rng): number {
  const position = board.slice();
  const available = moves.filter((move) => move !== opening);
  position[opening] = "ai";
  let owner: HexOwner = "player";
  while (available.length > 0) {
    const index = pickBestIndex(position, available, owner, rng);
    const move = available[index];
    available[index] = available[available.length - 1];
    available.pop();
    position[move] = owner;
    if (hasConnection(position, owner)) return owner === "ai" ? 1 : 0;
    owner = owner === "ai" ? "player" : "ai";
  }
  return 0.5;
}

export function chooseHexMove(board: HexCell[], difficulty: HexDifficulty, rng: Rng, simulations = 350): number {
  const moves = legalMoves(board);
  if (moves.length === 0) return -1;
  const win = winningMove(board, moves, "ai");
  if (win !== undefined) return win;
  if (difficulty === "easy") {
    const edge = moves.filter((move) => POSITIONS[move][0] === 0 || POSITIONS[move][0] === HEX_SIZE - 1);
    return rng.pick(edge.length && rng.next() < 0.65 ? edge : moves);
  }

  const block = winningMove(board, moves, "player");
  if (block !== undefined) return block;

  const trial = board.slice();
  const nodes = moves.map((move) => {
    trial[move] = "ai";
    const routes = connectionCost(trial, "player") - connectionCost(trial, "ai");
    trial[move] = null;
    const score = routes * 12 + scorePosition(board, move, "ai");
    return { move, wins: 0, plays: 0, score, bias: score * 0.004 };
  });
  if (difficulty === "medium") {
    return nodes.reduce((best, node) => node.score > best.score ? node : best).move;
  }

  for (let i = 0; i < simulations; i++) {
    const exploration = 2 * Math.log(i + 1);
    let best = nodes[0];
    let bestScore = -Infinity;
    for (const node of nodes) {
      const value = node.plays ? node.wins / node.plays + Math.sqrt(exploration / node.plays) + node.bias : Infinity;
      if (value > bestScore) {
        best = node;
        bestScore = value;
      }
    }
    best.wins += simulate(board, moves, best.move, rng);
    best.plays++;
  }
  const resultValue = (node: typeof nodes[number]) => (node.wins + 1) / (node.plays + 2) + node.bias * 0.1;
  return nodes.reduce((best, node) => resultValue(node) > resultValue(best) ? node : best).move;
}
