import type {
  ParchisAction,
  ParchisColor,
  ParchisGameState,
  ParchisMoveSource,
  ParchisPiece,
} from "./types";

export const TRACK_LENGTH = 68;
export const GOAL_PROGRESS = 75;
export const SAFE_CELLS = new Set([0, 8, 17, 25, 34, 42, 51, 59]);
export const START_BY_COLOR: Record<ParchisColor, number> = { red: 0, blue: 34 };
const LOG_CAP = 14;

export function createParchisGame(
  order: string[],
  pieceCount: 2 | 4 = 2,
  starter = order[0],
): ParchisGameState {
  const colors: Record<string, ParchisColor> = {
    [order[0]]: "red",
    [order[1]]: "blue",
  };
  const pieces = Object.fromEntries(
    order.map((actor) => [
      actor,
      Array.from({ length: pieceCount }, (_, id) => ({ id, progress: -1 })),
    ]),
  );
  return {
    order,
    colors,
    pieces,
    turn: starter,
    dice: null,
    pendingSteps: null,
    pendingSource: null,
    resumeExtraRoll: false,
    consecutiveSixes: Object.fromEntries(order.map((actor) => [actor, 0])),
    lastMovedPiece: Object.fromEntries(order.map((actor) => [actor, null])),
    pieceCount,
    finished: false,
    winner: null,
    lastAction: null,
    log: [],
  };
}

export function globalCell(state: ParchisGameState, actor: string, progress: number): number | null {
  if (progress < 0 || progress >= TRACK_LENGTH) return null;
  return (START_BY_COLOR[state.colors[actor]] + progress) % TRACK_LENGTH;
}

function opponentOf(state: ParchisGameState, actor: string): string | null {
  return state.order.find((candidate) => candidate !== actor) ?? null;
}

function occupantsAt(state: ParchisGameState, cell: number) {
  return state.order.flatMap((actor) =>
    state.pieces[actor]
      .filter((piece) => globalCell(state, actor, piece.progress) === cell)
      .map((piece) => ({ actor, piece })),
  );
}

export function bridgeCells(state: ParchisGameState): Set<number> {
  const bridges = new Set<number>();
  for (const actor of state.order) {
    const counts = new Map<number, number>();
    for (const piece of state.pieces[actor]) {
      const cell = globalCell(state, actor, piece.progress);
      if (cell !== null) counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
    for (const [cell, count] of counts) if (count >= 2) bridges.add(cell);
  }
  return bridges;
}

function actorBridgePieceIds(state: ParchisGameState, actor: string): Set<number> {
  const byCell = new Map<number, number[]>();
  for (const piece of state.pieces[actor]) {
    const cell = globalCell(state, actor, piece.progress);
    if (cell === null) continue;
    byCell.set(cell, [...(byCell.get(cell) ?? []), piece.id]);
  }
  return new Set(
    [...byCell.values()].filter((ids) => ids.length >= 2).flat(),
  );
}

function canMovePiece(
  state: ParchisGameState,
  actor: string,
  piece: ParchisPiece,
  steps: number,
  source: ParchisMoveSource,
): boolean {
  if (piece.progress === GOAL_PROGRESS) return false;
  if (piece.progress === -1) {
    if (source !== "die" || steps !== 5) return false;
    const start = START_BY_COLOR[state.colors[actor]];
    return occupantsAt(state, start).length < 2;
  }

  const destination = piece.progress + steps;
  if (destination > GOAL_PROGRESS) return false;
  const bridges = bridgeCells(state);
  for (let progress = piece.progress + 1; progress <= Math.min(destination, 67); progress += 1) {
    const cell = globalCell(state, actor, progress)!;
    if (bridges.has(cell)) return false;
  }
  for (
    let progress = Math.max(piece.progress + 1, 68);
    progress <= Math.min(destination, GOAL_PROGRESS - 1);
    progress += 1
  ) {
    const laneOccupants = state.pieces[actor].filter(
      (candidate) => candidate.id !== piece.id && candidate.progress === progress,
    );
    if (laneOccupants.length >= 2) return false;
  }
  if (destination < TRACK_LENGTH) {
    const cell = globalCell(state, actor, destination)!;
    if (occupantsAt(state, cell).length >= 2) return false;
  } else {
    const occupied = state.pieces[actor].filter((candidate) => candidate.progress === destination);
    if (occupied.length >= 2 && destination < GOAL_PROGRESS) return false;
  }
  return true;
}

export function legalParchisMoves(state: ParchisGameState, actor: string): number[] {
  if (
    state.finished ||
    state.turn !== actor ||
    state.pendingSteps === null ||
    state.pendingSource === null
  ) {
    return [];
  }
  let legal = state.pieces[actor]
    .filter((piece) =>
      canMovePiece(state, actor, piece, state.pendingSteps!, state.pendingSource!),
    )
    .map((piece) => piece.id);

  // With a natural five, leaving home is compulsory whenever the start is open.
  if (state.pendingSource === "die" && state.pendingSteps === 5) {
    const exits = legal.filter(
      (id) => state.pieces[actor].find((piece) => piece.id === id)?.progress === -1,
    );
    if (exits.length > 0) legal = exits;
  }

  // A six must open one of your bridges whenever doing so is possible.
  if (state.pendingSource === "die" && state.dice === 6) {
    const bridgePieces = actorBridgePieceIds(state, actor);
    const openingMoves = legal.filter((id) => bridgePieces.has(id));
    if (openingMoves.length > 0) legal = openingMoves;
  }
  return legal;
}

function addLog(state: ParchisGameState, action: ParchisAction): ParchisAction[] {
  return [action, ...state.log].slice(0, LOG_CAP);
}

function passTurn(state: ParchisGameState, actor: string, action: ParchisAction): ParchisGameState {
  const opponent = opponentOf(state, actor);
  return {
    ...state,
    turn: opponent,
    dice: null,
    pendingSteps: null,
    pendingSource: null,
    resumeExtraRoll: false,
    consecutiveSixes: { ...state.consecutiveSixes, [actor]: 0 },
    lastAction: action,
    log: addLog(state, action),
  };
}

export function rollParchisDie(
  state: ParchisGameState,
  actor: string,
  roll = Math.floor(Math.random() * 6) + 1,
): ParchisGameState {
  if (
    state.finished ||
    state.turn !== actor ||
    state.pendingSteps !== null ||
    state.dice !== null ||
    roll < 1 ||
    roll > 6
  ) {
    return state;
  }

  const streak = roll === 6 ? (state.consecutiveSixes[actor] ?? 0) + 1 : 0;
  const rollAction: ParchisAction = { actor, kind: "roll", roll };
  if (streak >= 3) {
    const lastId = state.lastMovedPiece[actor];
    const pieces = { ...state.pieces, [actor]: state.pieces[actor].map((piece) => ({ ...piece })) };
    if (lastId !== null) {
      const punished = pieces[actor].find((piece) => piece.id === lastId);
      if (punished && punished.progress >= 0 && punished.progress < GOAL_PROGRESS) punished.progress = -1;
    }
    const action: ParchisAction = { actor, kind: "tripleSix", roll, piece: lastId ?? undefined };
    return passTurn({ ...state, pieces }, actor, action);
  }

  const allOutside = state.pieces[actor].every((piece) => piece.progress !== -1);
  const steps = roll === 6 && allOutside ? 7 : roll;
  const rolled: ParchisGameState = {
    ...state,
    dice: roll,
    pendingSteps: steps,
    pendingSource: "die",
    resumeExtraRoll: roll === 6,
    consecutiveSixes: { ...state.consecutiveSixes, [actor]: streak },
    lastAction: rollAction,
    log: addLog(state, rollAction),
  };

  if (legalParchisMoves(rolled, actor).length > 0) return rolled;
  const blocked: ParchisAction = { actor, kind: "blocked", roll };
  if (roll === 6) {
    return {
      ...rolled,
      dice: null,
      pendingSteps: null,
      pendingSource: null,
      lastAction: blocked,
      log: addLog(rolled, blocked),
    };
  }
  return passTurn(rolled, actor, blocked);
}

function finishMove(
  state: ParchisGameState,
  actor: string,
  action: ParchisAction,
): ParchisGameState {
  if (state.pieces[actor].every((piece) => piece.progress === GOAL_PROGRESS)) {
    return {
      ...state,
      turn: null,
      dice: null,
      pendingSteps: null,
      pendingSource: null,
      finished: true,
      winner: actor,
      lastAction: action,
      log: addLog(state, action),
    };
  }
  if (state.resumeExtraRoll) {
    return {
      ...state,
      dice: null,
      pendingSteps: null,
      pendingSource: null,
      resumeExtraRoll: false,
      lastAction: action,
      log: addLog(state, action),
    };
  }
  return passTurn(state, actor, action);
}

export function moveParchisPiece(
  state: ParchisGameState,
  actor: string,
  pieceId: number,
): ParchisGameState {
  if (!legalParchisMoves(state, actor).includes(pieceId)) return state;
  const steps = state.pendingSteps!;
  const pieces = Object.fromEntries(
    state.order.map((seat) => [seat, state.pieces[seat].map((piece) => ({ ...piece }))]),
  );
  const piece = pieces[actor].find((candidate) => candidate.id === pieceId)!;
  const wasHome = piece.progress === -1;
  piece.progress = wasHome ? 0 : piece.progress + steps;

  const opponent = opponentOf(state, actor)!;
  let capturedPiece: ParchisPiece | undefined;
  const destinationCell = globalCell({ ...state, pieces }, actor, piece.progress);
  if (destinationCell !== null && !SAFE_CELLS.has(destinationCell)) {
    capturedPiece = pieces[opponent].find(
      (candidate) => globalCell({ ...state, pieces }, opponent, candidate.progress) === destinationCell,
    );
    if (capturedPiece) capturedPiece.progress = -1;
  }

  const reachedGoal = piece.progress === GOAL_PROGRESS;
  const kind = capturedPiece ? "capture" : reachedGoal ? "goal" : wasHome ? "exit" : "move";
  const action: ParchisAction = {
    actor,
    kind,
    piece: pieceId,
    steps,
    ...(capturedPiece ? { capturedActor: opponent, capturedPiece: capturedPiece.id } : {}),
  };
  const moved: ParchisGameState = {
    ...state,
    pieces,
    lastMovedPiece: { ...state.lastMovedPiece, [actor]: pieceId },
    lastAction: action,
  };

  if (capturedPiece || reachedGoal) {
    const bonus = capturedPiece ? 20 : 10;
    const bonusSource: ParchisMoveSource = capturedPiece ? "capture" : "goal";
    const withBonus: ParchisGameState = {
      ...moved,
      dice: null,
      pendingSteps: bonus,
      pendingSource: bonusSource,
      log: addLog(state, action),
    };
    if (legalParchisMoves(withBonus, actor).length > 0) return withBonus;
  }
  return finishMove(moved, actor, action);
}

export function pieceDestination(
  state: ParchisGameState,
  actor: string,
  pieceId: number,
): number | null {
  const piece = state.pieces[actor]?.find((candidate) => candidate.id === pieceId);
  if (!piece || state.pendingSteps === null) return null;
  return piece.progress === -1 ? 0 : piece.progress + state.pendingSteps;
}
