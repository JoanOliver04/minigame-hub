export type Seat = 0 | 1;
export type Level = "easy" | "medium" | "hard";
export const DUEL_IDS = ["mini-reversi", "dice-race", "dots-boxes", "mancala", "ice-floe", "pirate-loot", "exact-fifteen", "pocket-curling"] as const;
export type DuelId = typeof DUEL_IDS[number];

export interface DuelState {
  active: Seat;
  winner: Seat | "tie" | null;
  moves: number;
}

export interface DuelRules<S extends DuelState, A> {
  id: DuelId;
  start(seed?: number): S;
  play(state: S, action: A): S;
  choose(state: S, level: Level): A;
}

export interface BoardProps<S, A> {
  state: S;
  names: [string, string];
  viewer?: Seat;
  reviewing?: boolean;
  onPlay?: (action: A) => void;
}

export const otherSeat = (seat: Seat): Seat => seat === 0 ? 1 : 0;
