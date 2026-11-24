import { otherSeat, type DuelRules, type DuelState } from "../duels/types";

// The first twelve edges run horizontally, the next twelve vertically.
export const BOX_MASKS = Array.from({ length: 9 }, (_, box) => {
  const row = Math.floor(box / 3), column = box % 3;
  const top = row * 3 + column, left = 12 + row * 4 + column;
  return (1 << top) | (1 << (top + 3)) | (1 << left) | (1 << (left + 1));
});

const ALL_EDGES = (1 << 24) - 1;
const edges = Array.from({ length: 24 }, (_, i) => i);
const adjacent = edges.map(edge => BOX_MASKS.filter(mask => mask & (1 << edge)));

export interface BoxesState extends DuelState {
  lines: number;
  owners: number[]; // 0 = open, 1 and 2 identify the seats
  last: number;
  gained: number;
}

function gain(lines: number, edge: number) {
  const after = lines | (1 << edge);
  return adjacent[edge].filter(mask => (after & mask) === mask).length;
}

export function boxScores(owners: number[]) {
  return [owners.filter(owner => owner === 1).length, owners.filter(owner => owner === 2).length];
}

// Future points from the current seat's perspective. Closing a box retains the turn.
function endgame(lines: number, memo: Map<number, number>): number {
  if (lines === ALL_EDGES) return 0;
  const cached = memo.get(lines);
  if (cached !== undefined) return cached;
  let best = -Infinity;
  for (const edge of edges) {
    if (lines & (1 << edge)) continue;
    const points = gain(lines, edge);
    const rest = endgame(lines | (1 << edge), memo);
    best = Math.max(best, points ? points + rest : -rest);
  }
  memo.set(lines, best);
  return best;
}

export const boxes: DuelRules<BoxesState, number> = {
  id: "dots-boxes",
  start: () => ({ active: 0, moves: 0, winner: null, lines: 0, owners: Array(9).fill(0), last: -1, gained: 0 }),
  play(state, edge) {
    if (state.winner !== null || !Number.isInteger(edge) || edge < 0 || edge >= 24 || (state.lines & (1 << edge))) return state;
    const lines = state.lines | (1 << edge);
    const gained = gain(state.lines, edge);
    const owners = BOX_MASKS.map((mask, i) => state.owners[i] || ((lines & mask) === mask ? state.active + 1 : 0));
    const [first, second] = boxScores(owners);
    return { lines, owners, gained, last: edge, moves: state.moves + 1,
      active: gained ? state.active : otherSeat(state.active),
      winner: lines === ALL_EDGES ? (first > second ? 0 : 1) : null };
  },
  choose(state, level) {
    const open = edges.filter(edge => !(state.lines & (1 << edge)));
    const random = (list: number[]) => list[Math.floor(Math.random() * list.length)];
    if (level === "easy") return random(open);
    const memo = new Map<number, number>();
    const values = open.map(edge => {
      const lines = state.lines | (1 << edge), points = gain(state.lines, edge);
      if (level === "hard" && open.length <= 12) {
        const rest = endgame(lines, memo);
        return points ? points + rest : -rest;
      }
      if (points) return 2 * points;
      // A third side gives the next player a capture.
      return -adjacent[edge].filter(mask => {
        const missing = mask & ~lines;
        return (missing & (missing - 1)) === 0;
      }).length;
    });
    const best = Math.max(...values);
    return random(open.filter((_, i) => values[i] === best));
  },
};
