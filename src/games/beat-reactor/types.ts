/**
 * Beat Reactor — shared types (blueprint §6).
 */

export type Lane = 0 | 1 | 2 | 3;
export type Bpm = 90 | 110 | 130;
export type Bars = 8 | 12 | 16;
export type ChartDensity = "light" | "normal" | "dense";
export type ReactorDifficulty = "easy" | "medium" | "hard";

export interface ChartConfig {
  seed: number;
  bpm: Bpm;
  bars: Bars;
  density: ChartDensity;
}

export interface BeatEvent {
  id: number;
  lane: Lane;
  /** AudioContext time (seconds) the note should be hit. */
  hitTime: number;
  /** 0 for tap notes. */
  duration: number;
  accent: boolean;
}

export type Judgement = "perfect" | "great" | "good" | "miss";

export interface HitRecord {
  eventId: number;
  lane: Lane;
  judgement: Judgement;
  timingErrorMs: number | null;
  actor: "player" | "ai";
}

export interface AiHit {
  eventId: number;
  /** null = miss. */
  timingErrorMs: number | null;
}

export const JUDGEMENT_WINDOWS_MS: Record<Exclude<Judgement, "miss">, number> = {
  perfect: 35,
  great: 75,
  good: 120,
};

export const JUDGEMENT_SCORE: Record<Judgement, number> = {
  perfect: 1000,
  great: 700,
  good: 350,
  miss: 0,
};

export const LANE_KEYS = ["d", "f", "j", "k"] as const;
