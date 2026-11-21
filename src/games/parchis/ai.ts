import {
  GOAL_PROGRESS,
  SAFE_CELLS,
  globalCell,
  legalParchisMoves,
  moveParchisPiece,
  pieceDestination,
  rollParchisDie,
} from "./logic";
import type { ParchisDifficulty, ParchisGameState } from "./types";

const DIE_FACES = [1, 2, 3, 4, 5, 6];

function captureRisk(state: ParchisGameState, actor: string, cell: number): number {
  if (state.turn !== actor) return 0;
  const dangerousRolls = DIE_FACES.filter((roll) => {
    const rolled = rollParchisDie(state, actor, roll);
    return legalParchisMoves(rolled, actor).some((id) => {
      const next = pieceDestination(rolled, actor, id);
      return next !== null && globalCell(rolled, actor, next) === cell;
    });
  });
  return dangerousRolls.length / DIE_FACES.length;
}

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
      const after = moveParchisPiece(state, actor, pieceId);
      // Reuse the rules, including compulsory exits, bridges and the home lane.
      score -= captureRisk(after, opponent, cell) * 100;
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
    if (difficulty === "hard" && destination === GOAL_PROGRESS) {
      const wins = state.pieces[actor].every((candidate) =>
        candidate.id === pieceId || candidate.progress === GOAL_PROGRESS);
      if (wins) score += 1_000;
    }
    return { pieceId, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (difficulty === "medium" && scored.length > 1 && Math.random() < 0.2) return scored[1].pieceId;
  return scored[0].pieceId;
}
