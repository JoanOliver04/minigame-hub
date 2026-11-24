export type Seat = 0 | 1;
export type Level = "easy" | "medium" | "hard";
export type DuelId = "mini-reversi" | "dice-race";

export interface DuelState {
  active: Seat;
  winner: Seat | "tie" | null;
  moves: number;
}

export interface DuelRules<S extends DuelState, A> {
  id: DuelId;
  start(): S;
  play(state: S, action: A): S;
  choose(state: S, level: Level): A;
}

export interface BoardProps<S, A> {
  state: S;
  names: [string, string];
  onPlay?: (action: A) => void;
}

export const otherSeat = (seat: Seat): Seat => seat === 0 ? 1 : 0;
