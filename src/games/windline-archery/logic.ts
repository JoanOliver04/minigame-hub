/**
 * Windline Archery — pure rules (blueprint §9.3).
 * Rings score 10/8/6/4/2/0; centre hits break ties, then total radial error.
 */

import type { Rng } from "@/lib/rng";
import { computeImpact } from "./physics";
import type { ArrowInput, ArrowResult, EndState, Impact, Wind } from "./types";

const RING_STEP = 0.2;

export function ringScore(impact: Impact): number {
  const r = Math.hypot(impact.x, impact.y);
  if (r <= RING_STEP) return 10;
  if (r <= RING_STEP * 2) return 8;
  if (r <= RING_STEP * 3) return 6;
  if (r <= RING_STEP * 4) return 4;
  if (r <= RING_STEP * 5) return 2;
  return 0;
}

export function resolveArrow(input: ArrowInput, wind: Wind): ArrowResult {
  const impact = computeImpact(input, wind);
  return { input, impact, score: ringScore(impact), radial: Math.hypot(impact.x, impact.y) };
}

/** Fresh crosswind for each arrow pair. */
export function rollWind(rng: Rng): Wind {
  return {
    horizontal: (rng.next() * 2 - 1) * 3,
    vertical: (rng.next() * 2 - 1) * 1.2,
  };
}

export interface MatchTotals {
  playerScore: number;
  aiScore: number;
  playerCenters: number;
  aiCenters: number;
  playerRadial: number;
  aiRadial: number;
}

export function matchTotals(ends: EndState[]): MatchTotals {
  const totals: MatchTotals = {
    playerScore: 0,
    aiScore: 0,
    playerCenters: 0,
    aiCenters: 0,
    playerRadial: 0,
    aiRadial: 0,
  };
  for (const end of ends) {
    if (end.player) {
      totals.playerScore += end.player.score;
      totals.playerRadial += end.player.radial;
      if (end.player.score === 10) totals.playerCenters++;
    }
    if (end.ai) {
      totals.aiScore += end.ai.score;
      totals.aiRadial += end.ai.radial;
      if (end.ai.score === 10) totals.aiCenters++;
    }
  }
  return totals;
}

/** Winner with blueprint tie-breaks: score, then centres, then radial error. */
export function matchWinner(totals: MatchTotals): "player" | "ai" | "tie" {
  if (totals.playerScore !== totals.aiScore) {
    return totals.playerScore > totals.aiScore ? "player" : "ai";
  }
  if (totals.playerCenters !== totals.aiCenters) {
    return totals.playerCenters > totals.aiCenters ? "player" : "ai";
  }
  if (Math.abs(totals.playerRadial - totals.aiRadial) > 1e-9) {
    return totals.playerRadial < totals.aiRadial ? "player" : "ai";
  }
  return "tie";
}
