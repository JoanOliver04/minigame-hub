export type PuzzleSize = 3 | 4 | 5;

export interface SlidingPuzzleConfig {
  size: PuzzleSize;
}

export interface SlidingPuzzleState {
  size: PuzzleSize;
  tiles: number[];
  emptyIndex: number;
  moves: number;
  solved: boolean;
}
