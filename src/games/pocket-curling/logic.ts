import { createRng, randomSeed } from "@/lib/rng";
import { otherSeat, type DuelRules, type DuelState, type Seat } from "../duels/types";

export const HOUSE = { x: 105, y: 50, radius: 21 };
export const START = { x: 12, y: 50 };
export interface Shot { angle: number; power: number; spin: number }
export interface Stone { seat: Seat; x: number; y: number; id: number }
interface MovingStone extends Stone { vx: number; vy: number }
export interface CurlingState extends DuelState {
  stones: Stone[];
  ends: number[]; // Positive for seat zero, negative for seat one.
  last: { before: Stone[]; shot: Shot; seat: Seat } | null;
}

const radius = 4;
function collide(a: MovingStone, b: MovingStone) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius * 2 || distance === 0) return;
  const nx = dx / distance, ny = dy / distance, overlap = (radius * 2 - distance) / 2;
  a.x -= nx * overlap; a.y -= ny * overlap;
  b.x += nx * overlap; b.y += ny * overlap;
  const speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (speed <= 0) return;
  const impulse = speed * .94;
  a.vx -= nx * impulse; a.vy -= ny * impulse;
  b.vx += nx * impulse; b.vy += ny * impulse;
}

export function slide(before: Stone[], seat: Seat, shot: Shot, id: number, frames?: Stone[][]): Stone[] {
  const angle = shot.angle * Math.PI / 180;
  const speed = (30 + .92 * shot.power) * .035;
  let stones: MovingStone[] = before.map(s => ({ ...s, vx: 0, vy: 0 }));
  stones.push({ ...START, seat, id, vx: speed * Math.cos(angle), vy: speed * Math.sin(angle) });
  const snapshot = () => stones.map(({ seat, x, y, id }) => ({ seat, x, y, id }));
  const turn = shot.spin * .0035, cos = Math.cos(turn), sin = Math.sin(turn);
  for (let tick = 0; tick < 170; tick++) {
    if (frames && tick % 3 === 0) frames.push(snapshot());
    for (const s of stones) {
      s.x += s.vx; s.y += s.vy;
      const { vx, vy } = s;
      s.vx = .965 * (s.id === id ? vx * cos - vy * sin : vx);
      s.vy = .965 * (s.id === id ? vx * sin + vy * cos : vy);
    }
    stones = stones.filter(s => s.x >= radius && s.x <= 150 - radius && s.y >= radius && s.y <= 100 - radius);
    for (let i = 0; i < stones.length; i++) {
      for (let j = i + 1; j < stones.length; j++) collide(stones[i], stones[j]);
    }
    if (stones.every(s => Math.hypot(s.vx, s.vy) < .012)) break;
  }
  const result = snapshot();
  frames?.push(result);
  return result;
}

function distance(s: Stone) { return Math.round(100 * Math.hypot(s.x - HOUSE.x, s.y - HOUSE.y)) / 100; }

export function endScore(stones: Stone[]): number {
  const inHouse = stones.filter(s => distance(s) <= HOUSE.radius + radius);
  const closest = [0, 1].map(seat => Math.min(Infinity, ...inHouse.filter(s => s.seat === seat).map(distance)));
  if (closest[0] === closest[1]) return 0;
  const seat = closest[0] < closest[1] ? 0 : 1;
  const points = inHouse.filter(s => s.seat === seat && distance(s) < closest[otherSeat(seat)]).length;
  return seat === 0 ? points : -points;
}

export const curling: DuelRules<CurlingState, Shot> = {
  id: "pocket-curling",
  start: () => ({ active: 0, winner: null, moves: 0, stones: [], ends: [], last: null }),
  play(state, shot) {
    if (state.winner !== null || !shot || !Number.isInteger(shot.angle) || Math.abs(shot.angle) > 25 ||
      !Number.isInteger(shot.power) || shot.power < 30 || shot.power > 100 || ![-1, 0, 1].includes(shot.spin)) return state;
    const moves = state.moves + 1;
    const stones = slide(state.stones, state.active, shot, moves);
    const endOver = moves % 4 === 0, finished = moves === 12;
    const ends = endOver ? [...state.ends, endScore(stones)] : state.ends;
    const total = ends.reduce((sum, n) => sum + n, 0);
    return { moves, stones: endOver && !finished ? [] : stones, ends,
      last: { before: state.stones, seat: state.active, shot },
      active: endOver ? state.active : otherSeat(state.active),
      winner: finished ? (total === 0 ? "tie" : total > 0 ? 0 : 1) : null };
  },
  choose(state, level) {
    const rng = createRng(randomSeed());
    if (level === "easy") return { angle: rng.int(-13, 13), power: rng.int(46, 97), spin: rng.int(-1, 1) };
    const candidates: Shot[] = [];
    for (const spin of level === "hard" ? [-1, 0, 1] : [0]) {
      for (let angle = -18; angle <= 18; angle += level === "hard" ? 3 : 6) {
        for (const power of [53, 62, 69, 76, 85, 98]) candidates.push({ angle, power, spin });
      }
    }
    const scores = candidates.map(shot => {
      const stones = slide(state.stones, state.active, shot, state.moves + 1);
      const score = endScore(stones) * (state.active === 0 ? 1 : -1);
      const position = stones.reduce((sum, s) => sum + (s.seat === state.active ? 1 : -1) * Math.max(0, 30 - distance(s)), 0);
      return score * 50 + position;
    });
    const best = Math.max(...scores);
    const margin = level === "hard" ? .5 : 12;
    return rng.pick(candidates.filter((_, i) => scores[i] >= best - margin));
  },
};
