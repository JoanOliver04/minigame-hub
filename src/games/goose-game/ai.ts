import { previewGooseLanding } from "./logic";
import type { GooseDifficulty, GooseGameState, GooseLanding } from "./types";

function landingValue(landing: GooseLanding): number {
  let score = landing.destination;
  if (landing.special === "goal") score += 200;
  if (landing.extraTurn) score += 28;
  if (landing.special === "death") score -= 150;
  if (landing.special === "prison") score -= 75;
  if (landing.special === "well") score -= 52;
  if (landing.special === "inn") score -= 24;
  if (landing.special === "maze") score -= 35;
  if (landing.special === "dice" && landing.destination === 26) score -= 30;
  return score;
}

export function shouldGooseAiReroll(
  state: GooseGameState,
  actor: string,
  difficulty: GooseDifficulty,
): boolean {
  if (state.die === null || state.rerolled || state.feathers[actor] <= 0) return false;
  if (difficulty === "easy") return Math.random() < 0.12;
  const current = landingValue(previewGooseLanding(state, actor, state.die));
  if (difficulty === "medium") {
    const special = previewGooseLanding(state, actor, state.die).special;
    return special === "death" || special === "prison" || (special === "well" && state.feathers[actor] > 1);
  }
  const expected =
    [1, 2, 3, 4, 5, 6]
      .map((roll) => landingValue(previewGooseLanding(state, actor, roll)))
      .reduce((sum, value) => sum + value, 0) / 6;
  const reservePenalty = state.feathers[actor] === 1 ? 12 : state.feathers[actor] === 2 ? 5 : 0;
  return current + reservePenalty < expected - 4;
}
