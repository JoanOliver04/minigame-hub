/**
 * Circuit Breaker — light-cycle AI (blueprint §8.3).
 *
 * Honest-information contract: the AI never reads the player's PENDING
 * action for this tick — it only sees the committed grid and both cycles'
 * current positions/headings, exactly what a human opponent would see
 * before the simultaneous reveal.
 *
 *   Easy   — random legal turn, filtering out immediately fatal ones.
 *   Medium — flood-fill: pick the turn that leaves the AI the most
 *            reachable free space (ignoring the opponent's next move).
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

const ACTIONS: TurnAction[] = ["left", "straight", "right"];
const HARD_TIME_BUDGET_MS = 200;
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

/** Simulate the AI's own move in isolation (opponent's move unknown yet). */
function simulateSelfMove(state: BreakerState, action: TurnAction): BreakerState {
  // Opponent "straight" is a neutral placeholder — medium only reads its
  // own resulting reachable space, so the opponent's chosen branch here
  // never leaks into the AI's decision. `action` is the AI's own move, so
  // it belongs in the aiAction slot, not the playerAction slot.
  return resolveTick(state, "straight", action);
}

function mediumAction(state: BreakerState, rng: Rng): TurnAction {
  const legal = legalActions(state, "ai");
  let best: TurnAction[] = [];
  let bestSpace = -1;
  for (const action of legal) {
    const next = simulateSelfMove(state, action);
    if (!next.ai.alive) continue;
    const space = reachableSpace(next.grid, next.ai.pos, FLOODFILL_CAP);
    if (space > bestSpace) {
      bestSpace = space;
      best = [action];
    } else if (space === bestSpace) {
      best.push(action);
    }
  }
  if (best.length === 0) return rng.pick(legal);
  // Tie-break toward continuing straight: it's an equally good option
  // that avoids unnecessary zigzagging into the cycle's own future trail.
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
  if (budget.nodes % 40 === 0 && performance.now() > budget.deadline) {
    budget.exhausted = true;
  }
  if (state.status === "round-over" || depth === 0 || budget.exhausted) {
    return evaluate(state);
  }
  const aiActions = legalActions(state, "ai");
  const playerActions = legalActions(state, "player");
  const matrix: number[][] = [];
  for (const a of aiActions) {
    const row: number[] = [];
    for (const p of playerActions) {
      const next = resolveTick(state, p, a);
      row.push(searchNode(next, depth - 1, budget));
      if (budget.exhausted) break;
    }
    matrix.push(row);
    if (budget.exhausted) break;
  }
  // Maximin: the AI picks the row whose worst column is least bad — a
  // safe strategy against an adversary who could reply with anything.
  let best = -Infinity;
  for (const row of matrix) {
    if (row.length === 0) continue;
    const worst = Math.min(...row);
    if (worst > best) best = worst;
  }
  return best === -Infinity ? evaluate(state) : best;
}

function hardAction(state: BreakerState): TurnAction {
  const aiActions = legalActions(state, "ai");
  const playerActions = legalActions(state, "player");
  const budget: SearchBudget = { deadline: performance.now() + HARD_TIME_BUDGET_MS, nodes: 0, exhausted: false };

  let bestAction: TurnAction = aiActions[0];
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
        if (budget.exhausted) break;
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
  bestAction = bestDepthResult;
  return ACTIONS.includes(bestAction) ? bestAction : aiActions[0];
}
