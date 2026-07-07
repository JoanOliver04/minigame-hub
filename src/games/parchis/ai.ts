import {
  GOAL_PROGRESS,
  SAFE_CELLS,
  globalCell,
  legalParchisMoves,
  pieceDestination,
} from "./logic";
import type { ParchisDifficulty, ParchisGameState } from "./types";

export function chooseParchisMove(
  state: ParchisGameState,
  actor: string,
  difficulty: ParchisDifficulty,
): number | null {
  const legal = legalParchisMoves(state, actor);
  if (legal.length === 0) return null;
  if (difficulty === "easy") return legal[Math.floor(Math.random() * legal.length)];

  const opponent = state.order.find((seat) => seat !== actor)!;
  const scored = legal.map((pieceId) => {
    const piece = state.pieces[actor].find((candidate) => candidate.id === pieceId)!;
    const destination = pieceDestination(state, actor, pieceId)!;
    const cell = globalCell(state, actor, destination);
    const captures =
      cell !== null &&
      !SAFE_CELLS.has(cell) &&
      state.pieces[opponent].some(
        (candidate) => globalCell(state, opponent, candidate.progress) === cell,
      );
    let score = destination * 0.35;
    if (piece.progress === -1) score += 25;
    if (captures) score += difficulty === "hard" ? 95 : 65;
    if (destination === GOAL_PROGRESS) score += 110;
    if (cell !== null && SAFE_CELLS.has(cell)) score += difficulty === "hard" ? 24 : 12;

    if (difficulty === "hard" && cell !== null && !SAFE_CELLS.has(cell)) {
      const threatened = state.pieces[opponent].some((enemy) => {
        const enemyCell = globalCell(state, opponent, enemy.progress);
        if (enemyCell === null) return false;
        const distance = (cell - enemyCell + 68) % 68;
        return distance >= 1 && distance <= 6;
      });
      if (threatened) score -= 32;
      const ownAtDestination = state.pieces[actor].some(
        (candidate) =>
          candidate.id !== pieceId &&
          globalCell(state, actor, candidate.progress) === cell,
      );
      if (ownAtDestination) score += 30;
      if (state.pendingSource === "capture" || state.pendingSource === "goal") {
        score += Math.max(0, destination - piece.progress) * 0.6;
      }
    }
    return { pieceId, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (difficulty === "medium" && scored.length > 1 && Math.random() < 0.2) return scored[1].pieceId;
  return scored[0].pieceId;
}
