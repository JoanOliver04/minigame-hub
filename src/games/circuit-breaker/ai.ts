/**
 * Circuit Breaker — light-cycle AI (blueprint §8.3).
 *
 * Honest-information contract: the AI never reads the player's PENDING
 * action for this tick — it only sees the committed grid and both cycles'
 * current positions/headings, exactly what a human opponent would see
 * before the simultaneous reveal.
 *
 *   Easy   — random legal turn, filtering out immediately fatal ones.
 *   Medium — compare space and collision risk across legal simultaneous moves.
 *   Hard   — simultaneous-move minimax over the 3×3 joint-action matrix,
 *            time-boxed iterative deepening (the blueprint's target of 7
 *            plies is attempted, but the §3.5 performance budget of
 *            <250ms wins if the arena is still mostly open and 7 plies
 *            would blow it — depth degrades gracefully, never blocking
 *            input, same pattern as Hex Dominion's MCTS budget).
 */

import type { Rng } from "@/lib/rng";
import { legalActions, reachableSpace, resolveTick } from "./logic";
import type { BreakerDifficulty, BreakerState, TurnAction } from "./types";

const HARD_TIME_BUDGET_MS = 28;
const HARD_NODE_LIMIT = 1200;
const HARD_MAX_DEPTH = 7;
const FLOODFILL_CAP = 260;

export function aiPickAction(state: BreakerState, difficulty: BreakerDifficulty, rng: Rng): TurnAction {
  if (difficulty === "easy") return easyAction(state, rng);
  if (difficulty === "medium") return mediumAction(state, rng);
  return hardAction(state);
}

/**
 * Turning every tick with no bias makes a cycle zigzag and cross its own
 * trail within a dozen ticks regardless of skill — real light-cycle play
 * (and the blueprint's "erratic but not suicidal" framing of Easy) holds a
 * heading and only turns when there's a reason to. Straight-preference
 * applies to every tier; only the REASON to deviate from it changes.
 */
const STRAIGHT_BIAS = 0.7;

function easyAction(state: BreakerState, rng: Rng): TurnAction {
  const legal = legalActions(state, "ai");
  if (legal.includes("straight") && rng.next() < STRAIGHT_BIAS) return "straight";
  return rng.pick(legal);
}

function mediumAction(state: BreakerState, rng: Rng): TurnAction {
  const legal = legalActions(state, "ai");
  const replies = legalActions(state, "player");
  let best: TurnAction[] = [];
  let bestScore = -Infinity;
  for (const action of legal) {
    const values = replies.map((reply) => evaluate(resolveTick(state, reply, action)));
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const score = Math.min(...values) * 0.7 + average * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = [action];
    } else if (score === bestScore) {
      best.push(action);
    }
  }
  return best.includes("straight") ? "straight" : rng.pick(best);
}

function evaluate(state: BreakerState): number {
  if (!state.ai.alive && !state.player.alive) return 0;
  if (!state.ai.alive) return -1000;
  if (!state.player.alive) return 1000;
  const aiSpace = reachableSpace(state.grid, state.ai.pos, FLOODFILL_CAP);
  const playerSpace = reachableSpace(state.grid, state.player.pos, FLOODFILL_CAP);
  const spaceDiff = aiSpace - playerSpace;
  const dist =
    Math.abs(state.ai.pos.x - state.player.pos.x) + Math.abs(state.ai.pos.y - state.player.pos.y);
  // When ahead on space, closing distance applies containment pressure;
  // when behind, distance doesn't help, so only reward it when ahead.
  const pressure = spaceDiff > 0 ? -dist * 0.4 : 0;
  return spaceDiff * 3 + pressure;
}

interface SearchBudget {
  deadline: number;
  nodes: number;
  exhausted: boolean;
}

function searchNode(state: BreakerState, depth: number, budget: SearchBudget): number {
  budget.nodes++;
  if (budget.nodes >= HARD_NODE_LIMIT || (budget.nodes % 8 === 0 && performance.now() > budget.deadline)) {
    budget.exhausted = true;
  }
  if (state.status === "round-over" || depth === 0 || budget.exhausted) {
    return evaluate(state);
  }
  const aiActions = legalActions(state, "ai");
  const playerActions = legalActions(state, "player");
  let best = -Infinity;
  for (const a of aiActions) {
    let worst = Infinity;
    for (const p of playerActions) {
      const next = resolveTick(state, p, a);
      worst = Math.min(worst, searchNode(next, depth - 1, budget));
      // Further replies can only make this row worse.
      if (budget.exhausted || worst <= best) break;
    }
    best = Math.max(best, worst);
    if (budget.exhausted) break;
  }
  return best;
}

function hardAction(state: BreakerState): TurnAction {
  const aiActions = legalActions(state, "ai");
  // Evaluate straight first to preserve heading on equal choices.
  if (aiActions.includes("straight")) aiActions.sort((a, b) => Number(b === "straight") - Number(a === "straight"));
  const playerActions = legalActions(state, "player");
  const budget: SearchBudget = { deadline: performance.now() + HARD_TIME_BUDGET_MS, nodes: 0, exhausted: false };

  let bestDepthResult: TurnAction = aiActions[0];

  for (let depth = 1; depth <= HARD_MAX_DEPTH; depth++) {
    if (budget.exhausted || performance.now() > budget.deadline) break;
    let depthBest: TurnAction | null = null;
    let depthBestValue = -Infinity;
    for (const a of aiActions) {
      let worst = Infinity;
      for (const p of playerActions) {
        const next = resolveTick(state, p, a);
        const value = searchNode(next, depth - 1, budget);
        if (value < worst) worst = value;
        if (budget.exhausted || worst <= depthBestValue) break;
      }
      if (worst > depthBestValue) {
        depthBestValue = worst;
        depthBest = a;
      }
      if (budget.exhausted) break;
    }
    if (depthBest && !budget.exhausted) bestDepthResult = depthBest;
    if (budget.exhausted) break;
  }
  return bestDepthResult;
}
