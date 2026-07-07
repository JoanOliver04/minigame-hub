import type {
  GooseAction,
  GooseGameState,
  GooseLanding,
  GooseSpecial,
} from "./types";

export const GOAL = 63;
export const STARTING_FEATHERS = 3;
export const GOOSE_SQUARES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
const LOG_CAP = 12;

export const SPECIAL_BY_SQUARE: Partial<Record<number, GooseSpecial>> = {
  5: "goose",
  6: "bridge",
  9: "goose",
  14: "goose",
  18: "goose",
  19: "inn",
  23: "goose",
  26: "dice",
  27: "goose",
  31: "well",
  32: "goose",
  36: "goose",
  41: "goose",
  42: "maze",
  45: "goose",
  50: "goose",
  52: "prison",
  53: "dice",
  54: "goose",
  58: "death",
  59: "goose",
  63: "goal",
};

export function createGooseGame(order: string[], starter = order[0]): GooseGameState {
  return {
    order,
    positions: Object.fromEntries(order.map((actor) => [actor, 0])),
    turn: starter,
    die: null,
    rerolled: false,
    feathers: Object.fromEntries(order.map((actor) => [actor, STARTING_FEATHERS])),
    skippedTurns: Object.fromEntries(order.map((actor) => [actor, 0])),
    finished: false,
    winner: null,
    lastAction: null,
    log: [],
  };
}

function opponentOf(state: GooseGameState, actor: string): string {
  return state.order.find((candidate) => candidate !== actor)!;
}

function bouncedDestination(position: number, roll: number): number {
  const raw = position + roll;
  return raw <= GOAL ? raw : GOAL - (raw - GOAL);
}

export function previewGooseLanding(
  state: GooseGameState,
  actor: string,
  roll: number,
): GooseLanding {
  const landed = bouncedDestination(state.positions[actor], roll);
  const special = SPECIAL_BY_SQUARE[landed];
  if (special === "goose") {
    const next = GOOSE_SQUARES.find((square) => square > landed) ?? GOAL;
    return { landed, destination: next, special, extraTurn: true, skipTurns: 0 };
  }
  if (special === "bridge") {
    return { landed, destination: 12, special, extraTurn: true, skipTurns: 0 };
  }
  if (special === "dice") {
    return {
      landed,
      destination: landed === 26 ? 53 : 26,
      special,
      extraTurn: true,
      skipTurns: 0,
    };
  }
  if (special === "inn") {
    return { landed, destination: landed, special, extraTurn: false, skipTurns: 1 };
  }
  if (special === "well") {
    return { landed, destination: landed, special, extraTurn: false, skipTurns: 2 };
  }
  if (special === "maze") {
    return { landed, destination: 30, special, extraTurn: false, skipTurns: 0 };
  }
  if (special === "prison") {
    return { landed, destination: landed, special, extraTurn: false, skipTurns: 3 };
  }
  if (special === "death") {
    return { landed, destination: 0, special, extraTurn: false, skipTurns: 0 };
  }
  if (special === "goal") {
    return { landed, destination: GOAL, special, extraTurn: false, skipTurns: 0 };
  }
  return { landed, destination: landed, extraTurn: false, skipTurns: 0 };
}

function addLog(state: GooseGameState, action: GooseAction): GooseAction[] {
  return [action, ...state.log].slice(0, LOG_CAP);
}

export function rollGooseDie(
  state: GooseGameState,
  actor: string,
  roll = Math.floor(Math.random() * 6) + 1,
): GooseGameState {
  if (
    state.finished ||
    state.turn !== actor ||
    state.die !== null ||
    roll < 1 ||
    roll > 6
  ) {
    return state;
  }
  const action: GooseAction = { actor, kind: "roll", roll };
  return { ...state, die: roll, rerolled: false, lastAction: action, log: addLog(state, action) };
}

export function rerollGooseDie(
  state: GooseGameState,
  actor: string,
  roll = Math.floor(Math.random() * 6) + 1,
): GooseGameState {
  if (
    state.finished ||
    state.turn !== actor ||
    state.die === null ||
    state.rerolled ||
    state.feathers[actor] <= 0 ||
    roll < 1 ||
    roll > 6
  ) {
    return state;
  }
  const action: GooseAction = { actor, kind: "reroll", roll };
  return {
    ...state,
    die: roll,
    rerolled: true,
    feathers: { ...state.feathers, [actor]: state.feathers[actor] - 1 },
    lastAction: action,
    log: addLog(state, action),
  };
}

function advancePastSkips(
  state: GooseGameState,
  candidate: string,
): { turn: string; skippedTurns: Record<string, number>; skipped: string[] } {
  const skippedTurns = { ...state.skippedTurns };
  const skipped: string[] = [];
  let turn = candidate;
  let guard = 0;
  while (skippedTurns[turn] > 0 && guard < 12) {
    skippedTurns[turn] -= 1;
    skipped.push(turn);
    turn = opponentOf(state, turn);
    guard += 1;
  }
  return { turn, skippedTurns, skipped };
}

export function moveGooseToken(state: GooseGameState, actor: string): GooseGameState {
  if (state.finished || state.turn !== actor || state.die === null) return state;
  const from = state.positions[actor];
  const landing = previewGooseLanding(state, actor, state.die);
  const opponent = opponentOf(state, actor);
  const positions = { ...state.positions, [actor]: landing.destination };
  let swappedWith: string | undefined;
  if (
    landing.destination > 0 &&
    landing.destination < GOAL &&
    positions[opponent] === landing.destination
  ) {
    positions[opponent] = from;
    swappedWith = opponent;
  }
  const skippedTurns = {
    ...state.skippedTurns,
    [actor]: state.skippedTurns[actor] + landing.skipTurns,
  };
  const baseAction: GooseAction = {
    actor,
    kind: "move",
    roll: state.die,
    from,
    landed: landing.landed,
    to: landing.destination,
    ...(landing.special ? { special: landing.special } : {}),
    ...(swappedWith ? { swappedWith } : {}),
  };
  if (landing.destination === GOAL) {
    return {
      ...state,
      positions,
      die: null,
      rerolled: false,
      skippedTurns,
      turn: null,
      finished: true,
      winner: actor,
      lastAction: baseAction,
      log: addLog(state, baseAction),
    };
  }
  if (landing.extraTurn && landing.skipTurns === 0) {
    return {
      ...state,
      positions,
      die: null,
      rerolled: false,
      skippedTurns,
      lastAction: baseAction,
      log: addLog(state, baseAction),
    };
  }
  const advanced = advancePastSkips({ ...state, skippedTurns }, opponent);
  const action = { ...baseAction, ...(advanced.skipped.length ? { skipped: advanced.skipped } : {}) };
  return {
    ...state,
    positions,
    die: null,
    rerolled: false,
    skippedTurns: advanced.skippedTurns,
    turn: advanced.turn,
    lastAction: action,
    log: addLog(state, action),
  };
}
