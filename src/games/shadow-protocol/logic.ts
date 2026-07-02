/**
 * Shadow Protocol — pure match rules (blueprint §4).
 *
 * `applyAction` resolves one full turn deterministically:
 *   1. player acts (move / sprint / wait / hack / beacon);
 *   2. noise propagates and updates guard knowledge;
 *   3. hacked devices tick, cameras rotate;
 *   4. each guard runs its state machine and moves;
 *   5. sight checks at the end of each actor's move drive the alarm.
 *
 * No React, DOM, timers, or Math.random anywhere in this module.
 */

import type { Rng } from "@/lib/rng";
import {
  interceptionTarget,
  memoryTurns,
  stepToward,
} from "./ai";
import { generateFacility, pathDistance } from "./generation";
import { heardAt, propagateSound } from "./sound";
import {
  CAMERA_VISION_RANGE,
  DIR_CYCLE,
  DIR_VECTORS,
  GUARD_VISION_RANGE,
  canSee,
} from "./visibility";
import type {
  Dir,
  GuardState,
  PlayerAction,
  Position,
  ScoreBreakdown,
  ShadowDifficulty,
  ShadowState,
  TurnEvent,
} from "./types";
import { isWalkable, samePos, tileAt } from "./types";

export const ALARM_TURNS = 3;
export const SPRINT_NOISE_RADIUS = 3;
export const BEACON_NOISE_RADIUS = 4;
export const BEACON_THROW_RANGE = 4;
export const HACK_DURATION = 3;

export interface TurnResult {
  state: ShadowState;
  events: TurnEvent[];
}

export function createShadowMatch(difficulty: ShadowDifficulty, rng: Rng): ShadowState {
  const facility = generateFacility(rng);
  const par =
    pathDistance(facility.tiles, facility.width, facility.playerStart, facility.core) +
    pathDistance(facility.tiles, facility.width, facility.core, facility.exit) +
    4;
  return {
    width: facility.width,
    height: facility.height,
    tiles: facility.tiles,
    player: { ...facility.playerStart },
    core: facility.core,
    exit: facility.exit,
    hasCore: false,
    beaconUsed: false,
    guards: facility.guards,
    cameras: facility.cameras,
    doorHacks: [],
    alarmRemaining: ALARM_TURNS,
    detectedEver: false,
    spotted: false,
    turn: 0,
    par,
    status: "playing",
    difficulty,
    lastNoise: null,
  };
}

function cloneState(state: ShadowState): ShadowState {
  return JSON.parse(JSON.stringify(state)) as ShadowState;
}

function guardAt(state: ShadowState, pos: Position): GuardState | undefined {
  return state.guards.find((guard) => samePos(guard.pos, pos));
}

export function canMoveTo(state: ShadowState, pos: Position): boolean {
  if (pos.x < 0 || pos.y < 0 || pos.x >= state.width || pos.y >= state.height) return false;
  if (!isWalkable(tileAt(state.tiles, state.width, pos))) return false;
  return !guardAt(state, pos);
}

export function legalMoveDirs(state: ShadowState): Dir[] {
  return DIR_CYCLE.filter((dir) => {
    const v = DIR_VECTORS[dir];
    return canMoveTo(state, { x: state.player.x + v.x, y: state.player.y + v.y });
  });
}

/** Devices (doors or cameras) adjacent to the player that a hack can reach. */
export function hackTargets(state: ShadowState): Position[] {
  const out: Position[] = [];
  for (const dir of DIR_CYCLE) {
    const v = DIR_VECTORS[dir];
    const pos = { x: state.player.x + v.x, y: state.player.y + v.y };
    if (pos.x < 0 || pos.y < 0 || pos.x >= state.width || pos.y >= state.height) continue;
    const tile = tileAt(state.tiles, state.width, pos);
    if (tile === "door-open" || tile === "door-closed") out.push(pos);
    if (state.cameras.some((camera) => samePos(camera.pos, pos))) out.push(pos);
  }
  return out;
}

export function beaconTargets(state: ShadowState): Position[] {
  if (state.beaconUsed) return [];
  const out: Position[] = [];
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const pos = { x, y };
      const dist = Math.abs(x - state.player.x) + Math.abs(y - state.player.y);
      if (dist === 0 || dist > BEACON_THROW_RANGE) continue;
      if (tileAt(state.tiles, state.width, pos) === "wall") continue;
      out.push(pos);
    }
  }
  return out;
}

/** Feed a confirmed sighting into every guard's knowledge model. */
function broadcastSighting(state: ShadowState, seen: Position, direct: GuardState | null) {
  for (const guard of state.guards) {
    guard.evidence = { ...seen };
    guard.unseenTurns = 0;
    if (guard === direct || state.difficulty !== "easy") {
      guard.mode = "chase";
    } else if (guard.mode === "patrol" || guard.mode === "return") {
      // Easy guards react to network alerts sluggishly: investigate only.
      guard.mode = "investigate";
    }
  }
}

function nearestWaypoint(guard: GuardState): Position {
  let best = guard.route[0];
  let bestDist = Infinity;
  for (const waypoint of guard.route) {
    const dist = Math.abs(waypoint.x - guard.pos.x) + Math.abs(waypoint.y - guard.pos.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = waypoint;
    }
  }
  return best;
}

function faceToward(guard: GuardState, next: Position) {
  const dx = next.x - guard.pos.x;
  const dy = next.y - guard.pos.y;
  if (dx === 1) guard.facing = "e";
  else if (dx === -1) guard.facing = "w";
  else if (dy === 1) guard.facing = "s";
  else if (dy === -1) guard.facing = "n";
}

/** Where this guard is trying to go this turn, given its mode. */
function guardTarget(state: ShadowState, guard: GuardState): Position | null {
  switch (guard.mode) {
    case "patrol":
      return guard.route[guard.routeIndex];
    case "investigate":
    case "search":
      return guard.evidence;
    case "chase": {
      if (!guard.evidence) return null;
      if (state.difficulty === "hard") {
        const objective = state.hasCore ? state.exit : state.core;
        return interceptionTarget(
          state.tiles,
          state.width,
          state.height,
          guard.pos,
          guard.evidence,
          guard.unseenTurns,
          objective,
        );
      }
      return guard.evidence;
    }
    case "return":
      return nearestWaypoint(guard);
  }
}

function advanceGuard(state: ShadowState, guard: GuardState, events: TurnEvent[]) {
  const blocked = new Set<number>(
    state.guards
      .filter((other) => other.id !== guard.id)
      .map((other) => other.pos.y * state.width + other.pos.x),
  );

  // --- state machine bookkeeping before moving ---
  if (guard.mode === "chase") {
    guard.unseenTurns += 1;
    if (guard.unseenTurns > memoryTurns(state.difficulty)) {
      guard.mode = "search";
      guard.searchTimer = 3;
    }
  }
  if (guard.mode === "investigate" && guard.evidence && samePos(guard.pos, guard.evidence)) {
    guard.mode = "search";
    guard.searchTimer = 3;
  }
  if (guard.mode === "search") {
    guard.searchTimer -= 1;
    // Searching guards sweep in place: rotate the cone a quarter turn.
    guard.facing = DIR_CYCLE[(DIR_CYCLE.indexOf(guard.facing) + 1) % 4];
    if (guard.searchTimer <= 0) {
      guard.mode = "return";
      guard.evidence = null;
    }
    return; // no movement while sweeping
  }

  // --- medium/hard coordination: one guard cuts off the exit ---
  let target = guardTarget(state, guard);
  if (
    state.difficulty !== "easy" &&
    state.detectedEver &&
    guard.mode === "chase" &&
    state.guards.some((other) => other.id !== guard.id && other.mode === "chase")
  ) {
    // The chasing guard nearest the exit peels off to contain it.
    const chasers = state.guards.filter((other) => other.mode === "chase");
    let cutoff: GuardState = chasers[0];
    let bestDist = Infinity;
    for (const chaser of chasers) {
      const dist = Math.abs(chaser.pos.x - state.exit.x) + Math.abs(chaser.pos.y - state.exit.y);
      if (dist < bestDist) {
        bestDist = dist;
        cutoff = chaser;
      }
    }
    if (cutoff.id === guard.id && chasers.length > 1) target = state.exit;
  }
  if (!target) return;

  if (guard.mode === "patrol" && samePos(guard.pos, target)) {
    guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
    target = guard.route[guard.routeIndex];
  }
  if (guard.mode === "return" && samePos(guard.pos, target)) {
    guard.mode = "patrol";
    let nearestIndex = 0;
    let nearestDist = Infinity;
    guard.route.forEach((waypoint, index) => {
      const dist = Math.abs(waypoint.x - guard.pos.x) + Math.abs(waypoint.y - guard.pos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = index;
      }
    });
    guard.routeIndex = nearestIndex;
    target = guard.route[guard.routeIndex];
  }

  const next = stepToward(
    state.tiles,
    state.width,
    state.height,
    guard.pos,
    target,
    blocked,
    state.difficulty,
  );
  if (next) {
    faceToward(guard, next);
    guard.pos = next;
    if (samePos(next, state.player)) {
      events.push("caught");
      state.status = "lost";
    }
  }
}

export function applyAction(prev: ShadowState, action: PlayerAction): TurnResult {
  if (prev.status !== "playing") return { state: prev, events: [] };
  const state = cloneState(prev);
  const events: TurnEvent[] = [];
  state.lastNoise = null;
  state.spotted = false;

  let noise: { source: Position; radius: number } | null = null;

  // ---------- 1. player action ----------
  if (action.kind === "move" || action.kind === "sprint") {
    const v = DIR_VECTORS[action.dir];
    const first = { x: state.player.x + v.x, y: state.player.y + v.y };
    if (!canMoveTo(state, first)) return { state: prev, events: [] };
    state.player = first;
    if (action.kind === "sprint") {
      const second = { x: first.x + v.x, y: first.y + v.y };
      if (canMoveTo(state, second)) state.player = second;
      noise = { source: { ...state.player }, radius: SPRINT_NOISE_RADIUS };
    }
  } else if (action.kind === "hack") {
    const targets = hackTargets(state);
    if (targets.length === 0) return { state: prev, events: [] };
    for (const pos of targets) {
      const index = pos.y * state.width + pos.x;
      const tile = state.tiles[index];
      if (tile === "door-open" || tile === "door-closed") {
        state.tiles[index] = tile === "door-open" ? "door-closed" : "door-open";
        state.doorHacks.push({ index, turns: HACK_DURATION, original: tile });
      }
      const camera = state.cameras.find((cam) => samePos(cam.pos, pos));
      if (camera) camera.disabledFor = HACK_DURATION;
    }
    events.push("hacked");
  } else if (action.kind === "beacon") {
    const valid = beaconTargets(state).some((pos) => samePos(pos, action.target));
    if (!valid) return { state: prev, events: [] };
    state.beaconUsed = true;
    noise = { source: { ...action.target }, radius: BEACON_NOISE_RADIUS };
    events.push("beacon-thrown");
  }
  // "wait" does nothing — the world still advances below.

  // ---------- 2. objectives ----------
  if (!state.hasCore && samePos(state.player, state.core)) {
    state.hasCore = true;
    state.tiles[state.core.y * state.width + state.core.x] = "floor";
    events.push("core-collected");
  }
  if (state.hasCore && samePos(state.player, state.exit)) {
    state.status = "won";
    state.turn += 1;
    events.push("escaped");
    return { state, events };
  }

  // ---------- 3. sound ----------
  if (noise) {
    state.lastNoise = noise;
    const costs = propagateSound(state.tiles, state.width, state.height, noise.source, noise.radius);
    for (const guard of state.guards) {
      if (!heardAt(costs, state.width, guard.pos)) continue;
      if (guard.mode === "chase") continue; // sight beats sound
      guard.evidence = { ...noise.source };
      guard.mode = "investigate";
      events.push("guard-heard");
    }
  }

  // ---------- 4. sight check after the player's move ----------
  // Runs BEFORE cameras rotate: detection must use the facings the player
  // could actually see when planning the move.
  let sighting = false;
  for (const guard of state.guards) {
    if (canSee(state.tiles, state.width, guard.pos, guard.facing, GUARD_VISION_RANGE, state.player)) {
      broadcastSighting(state, state.player, guard);
      sighting = true;
    }
  }
  for (const camera of state.cameras) {
    if (camera.disabledFor > 0) continue;
    if (
      canSee(
        state.tiles,
        state.width,
        camera.pos,
        DIR_CYCLE[camera.dirIndex],
        CAMERA_VISION_RANGE,
        state.player,
      )
    ) {
      broadcastSighting(state, state.player, null);
      sighting = true;
    }
  }

  // ---------- 5. devices ----------
  for (const hack of state.doorHacks) hack.turns -= 1;
  state.doorHacks = state.doorHacks.filter((hack) => {
    if (hack.turns > 0) return true;
    const occupied =
      samePos(state.player, { x: hack.index % state.width, y: Math.floor(hack.index / state.width) }) ||
      state.guards.some((guard) => guard.pos.y * state.width + guard.pos.x === hack.index);
    if (occupied) {
      hack.turns = 1; // stay toggled until the tile is free
      return true;
    }
    state.tiles[hack.index] = hack.original;
    return false;
  });
  for (const camera of state.cameras) {
    if (camera.disabledFor > 0) camera.disabledFor -= 1;
    else camera.dirIndex = (camera.dirIndex + 1) % 4;
  }

  // ---------- 6. guards act ----------
  // Easy guards react more slowly: while nothing is chasing them onward,
  // they move only every other turn (same rules, slower reactions).
  const easyIdle =
    state.difficulty === "easy" &&
    state.turn % 2 === 1 &&
    !state.guards.some((guard) => guard.mode === "chase");
  for (const guard of state.guards) {
    if (easyIdle) break;
    advanceGuard(state, guard, events);
    if (state.status === "lost") break;
    if (canSee(state.tiles, state.width, guard.pos, guard.facing, GUARD_VISION_RANGE, state.player)) {
      broadcastSighting(state, state.player, guard);
      sighting = true;
    }
  }

  // ---------- 7. alarm ----------
  if (state.status === "playing" && sighting) {
    state.spotted = true;
    state.detectedEver = true;
    state.alarmRemaining -= 1;
    events.push(state.alarmRemaining <= 0 ? "alarm-zero" : "alarm-tick");
    if (state.alarmRemaining <= 0) state.status = "lost";
    if (!events.includes("spotted")) events.unshift("spotted");
  }

  state.turn += 1;
  return { state, events };
}

/** Blueprint §4.8 score formula (win only; losses score 0). */
export function computeScore(state: ShadowState): ScoreBreakdown {
  const base = 1000;
  const alarmBonus = state.alarmRemaining * 75;
  const stealthBonus = state.detectedEver ? 0 : 500;
  const beaconBonus = state.beaconUsed ? 0 : 150;
  const turnDelta =
    state.turn <= state.par ? (state.par - state.turn) * 20 : (state.par - state.turn) * 10;
  const total = Math.max(0, Math.min(2500, base + alarmBonus + stealthBonus + beaconBonus + turnDelta));
  return { base, alarmBonus, stealthBonus, beaconBonus, turnDelta, total };
}
