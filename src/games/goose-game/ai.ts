import { GOAL, previewGooseLanding } from "./logic";
import type { GooseDifficulty, GooseGameState, GooseLanding } from "./types";

const DIE_FACES = [1, 2, 3, 4, 5, 6];

function landingValue(landing: GooseLanding, pressure: number): number {
  if (landing.destination === GOAL) return GOAL + 200;
  let score = landing.destination;
  if (landing.special === "death") score -= 30 * pressure;
  score -= landing.skipTurns * (14 + pressure * 22);
  return score;
}

function estimateLanding(state: GooseGameState, actor: string, landing: GooseLanding, pressure: number): number {
  const value = landingValue(landing, pressure);
  if (!landing.extraTurn || landing.destination === GOAL) return value;
  const next = { ...state, positions: { ...state.positions, [actor]: landing.destination } };
  const continued = DIE_FACES.reduce((sum, face) => sum + landingValue(previewGooseLanding(next, actor, face), pressure), 0)
    / DIE_FACES.length;
  // Advantage of rolling before the opponent, with one step of continuation.
  return 6 + value * 0.2 + continued * 0.8;
}

export function shouldGooseAiReroll(
  state: GooseGameState,
  actor: string,
  difficulty: GooseDifficulty,
): boolean {
  if (state.die === null || state.rerolled || state.feathers[actor] <= 0) return false;
  const current = previewGooseLanding(state, actor, state.die);
  if (current.destination === GOAL) return false;
  if (difficulty === "easy") return Math.random() < 0.12;
  if (difficulty === "medium") {
    const special = current.special;
    return special === "death" || special === "prison" || (special === "well" && state.feathers[actor] > 1);
  }
  const opponent = state.order.find((seat) => seat !== actor);
  const pressure = opponent === undefined || state.skippedTurns[opponent] > 0
    ? 0
    : DIE_FACES.filter((roll) => previewGooseLanding(state, opponent, roll).destination === GOAL).length / DIE_FACES.length;
  const expected = DIE_FACES.reduce((total, roll) => {
    return total + estimateLanding(state, actor, previewGooseLanding(state, actor, roll), pressure);
  }, 0) / DIE_FACES.length;
  const reservePenalty = (state.feathers[actor] === 1 ? 12 : state.feathers[actor] === 2 ? 5 : 0) * (1 - pressure);
  return estimateLanding(state, actor, current, pressure) + reservePenalty < expected - 4;
}
