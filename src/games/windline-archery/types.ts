/**
 * Windline Archery — shared types (blueprint §9).
 */

export type ArcheryDifficulty = "easy" | "medium" | "hard";

export interface ArrowInput {
  /** Elevation angle in degrees. */
  angleDeg: number;
  /** Horizontal aim-off in degrees (windage); positive aims right. */
  windageDeg: number;
  /** Draw power 0–100. */
  power: number;
  /** Release stability from the timing meter, −1…1 (0 = perfect). */
  releaseError: number;
}

export interface Wind {
  /** m/s equivalent; positive pushes the arrow right. */
  horizontal: number;
  /** m/s equivalent; positive pushes the arrow up. */
  vertical: number;
}

/** Impact point in normalized target coordinates: centre (0,0), outer ring radius 1. */
export interface Impact {
  x: number;
  y: number;
}

export interface ArrowResult {
  input: ArrowInput;
  impact: Impact;
  score: number;
  /** Radial distance from centre (tie-break data). */
  radial: number;
}

export interface EndState {
  wind: Wind;
  player: ArrowResult | null;
  ai: ArrowResult | null;
}

export const TOTAL_ENDS = 5;
