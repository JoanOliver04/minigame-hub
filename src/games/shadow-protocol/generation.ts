/**
 * Shadow Protocol — facility generation (blueprint §4.3).
 *
 * Ten authored templates, varied with seeded rotation, mirroring, and door
 * states, then validated:
 *   - outer border closed;
 *   - exactly one core, one exit, one start;
 *   - core and exit reachable (closed doors count as hackable, so passable);
 *   - start→core ≤ 28 moves and start→core→exit ≥ 12 moves;
 *   - the starting tile is outside every initial vision cone.
 * Invalid variants are discarded and another transform is tried, so an
 * unsolvable map can never reach the player.
 *
 * Template legend: # wall · . floor · c cover · d open door · D closed door
 * · T terminal · C core · E exit · P player start.
 */

import type { Rng } from "@/lib/rng";
import type { CameraState, Dir, Facility, GuardState, Position, Tile } from "./types";
import { isWalkable, samePos } from "./types";
import { CAMERA_VISION_RANGE, DIR_CYCLE, GUARD_VISION_RANGE, canSee } from "./visibility";

export const FACILITY_SIZE = 11;

interface TemplateSpec {
  rows: string[];
  /** Patrol waypoint loops, one per guard. */
  guards: Position[][];
  cameras: { pos: Position; dirIndex: number }[];
}

const B1_ROWS = [
  "###########",
  "#P...c...E#",
  "#.###.###.#",
  "#.#T....#.#",
  "#.#.###.#.#",
  "#..D.C.D..#",
  "#.#.###.#.#",
  "#.#....T#.#",
  "#.###.###.#",
  "#....c....#",
  "###########",
];

const B2_ROWS = [
  "###########",
  "#E...#...T#",
  "#.cc.D.cc.#",
  "#....#....#",
  "##d#####D##",
  "#....#....#",
  "#.cc.d.cc.#",
  "#....#....#",
  "##D#####d##",
  "#P...d...C#",
  "###########",
];

const B3_ROWS = [
  "###########",
  "#P........#",
  "#.#####D#.#",
  "#.#C....#.#",
  "#.#.###.#.#",
  "#.#.#T#.#.#",
  "#.#.#d#.#.#",
  "#.#.....#.#",
  "#.###D###.#",
  "#........E#",
  "###########",
];

const B4_ROWS = [
  "###########",
  "#T.#.C.#.E#",
  "#..D...D..#",
  "#..#...#..#",
  "##D###.##D#",
  "#....c....#",
  "##.#####.##",
  "#..#...#..#",
  "#..d.P.d..#",
  "#..#...#..#",
  "###########",
];

const B5_ROWS = [
  "###########",
  "#E..#.#..T#",
  "#...#d#...#",
  "#...#.#...#",
  "###D...D###",
  "#.c..C..c.#",
  "###D...D###",
  "#...#.#...#",
  "#...#d#...#",
  "#P..#.#...#",
  "###########",
];

const B6_ROWS = [
  "###########",
  "#P...#...E#",
  "#.cc.#.cc.#",
  "#....D....#",
  "##d#####d##",
  "#....#....#",
  "#.cc.#.cc.#",
  "#....D....#",
  "#.T#...#C.#",
  "#..#...#..#",
  "###########",
];

const TEMPLATES: TemplateSpec[] = [
  {
    rows: B1_ROWS,
    guards: [
      [
        { x: 1, y: 9 },
        { x: 9, y: 9 },
      ],
      [
        { x: 9, y: 2 },
        { x: 9, y: 5 },
      ],
    ],
    cameras: [
      { pos: { x: 5, y: 3 }, dirIndex: 0 },
      { pos: { x: 5, y: 7 }, dirIndex: 2 },
    ],
  },
  {
    rows: B2_ROWS,
    guards: [
      [
        { x: 1, y: 3 },
        { x: 4, y: 3 },
      ],
      [
        { x: 6, y: 5 },
        { x: 9, y: 5 },
      ],
    ],
    cameras: [
      { pos: { x: 2, y: 7 }, dirIndex: 1 },
      { pos: { x: 9, y: 3 }, dirIndex: 0 },
    ],
  },
  {
    rows: B3_ROWS,
    guards: [
      [
        { x: 9, y: 1 },
        { x: 9, y: 8 },
      ],
      [
        { x: 7, y: 3 },
        { x: 7, y: 7 },
        { x: 3, y: 7 },
      ],
    ],
    cameras: [
      { pos: { x: 5, y: 1 }, dirIndex: 2 },
      { pos: { x: 5, y: 9 }, dirIndex: 0 },
    ],
  },
  {
    rows: B4_ROWS,
    guards: [
      [
        { x: 1, y: 5 },
        { x: 9, y: 5 },
      ],
      [
        { x: 1, y: 7 },
        { x: 1, y: 9 },
      ],
    ],
    cameras: [
      { pos: { x: 6, y: 5 }, dirIndex: 0 },
      { pos: { x: 9, y: 7 }, dirIndex: 0 },
    ],
  },
  {
    rows: B5_ROWS,
    guards: [
      [
        { x: 1, y: 5 },
        { x: 9, y: 5 },
      ],
      [
        { x: 5, y: 1 },
        { x: 5, y: 3 },
      ],
    ],
    cameras: [
      { pos: { x: 5, y: 9 }, dirIndex: 1 },
      { pos: { x: 7, y: 1 }, dirIndex: 2 },
    ],
  },
  {
    rows: B6_ROWS,
    guards: [
      [
        { x: 1, y: 5 },
        { x: 4, y: 5 },
      ],
      [
        { x: 4, y: 9 },
        { x: 6, y: 9 },
      ],
    ],
    cameras: [
      { pos: { x: 4, y: 1 }, dirIndex: 2 },
      { pos: { x: 9, y: 5 }, dirIndex: 3 },
    ],
  },
  // Variants: same authored maps with different security layouts.
  {
    rows: B1_ROWS,
    guards: [
      [
        { x: 9, y: 9 },
        { x: 9, y: 5 },
      ],
      [
        { x: 5, y: 9 },
        { x: 1, y: 9 },
      ],
    ],
    cameras: [
      { pos: { x: 5, y: 3 }, dirIndex: 1 },
      { pos: { x: 1, y: 5 }, dirIndex: 2 },
    ],
  },
  {
    rows: B2_ROWS,
    guards: [
      [
        { x: 6, y: 3 },
        { x: 9, y: 3 },
      ],
      [
        { x: 1, y: 5 },
        { x: 4, y: 5 },
      ],
    ],
    cameras: [
      { pos: { x: 2, y: 1 }, dirIndex: 1 },
      { pos: { x: 7, y: 9 }, dirIndex: 3 },
    ],
  },
  {
    rows: B3_ROWS,
    guards: [
      [
        { x: 1, y: 3 },
        { x: 1, y: 8 },
      ],
      [
        { x: 3, y: 7 },
        { x: 7, y: 7 },
      ],
    ],
    cameras: [
      { pos: { x: 9, y: 5 }, dirIndex: 0 },
      { pos: { x: 5, y: 9 }, dirIndex: 1 },
    ],
  },
  {
    rows: B5_ROWS,
    guards: [
      [
        { x: 5, y: 7 },
        { x: 5, y: 9 },
      ],
      [
        { x: 1, y: 5 },
        { x: 9, y: 5 },
      ],
    ],
    cameras: [
      { pos: { x: 7, y: 9 }, dirIndex: 0 },
      { pos: { x: 1, y: 1 }, dirIndex: 1 },
    ],
  },
];

const CHAR_TILES: Record<string, Tile> = {
  "#": "wall",
  ".": "floor",
  c: "cover",
  d: "door-open",
  D: "door-closed",
  T: "terminal",
  C: "core",
  E: "exit",
  P: "floor",
};

interface RawFacility {
  tiles: Tile[];
  playerStart: Position;
  core: Position;
  exit: Position;
  guards: Position[][];
  cameras: { pos: Position; dirIndex: number }[];
}

function parseTemplate(spec: TemplateSpec): RawFacility {
  const size = FACILITY_SIZE;
  const tiles: Tile[] = [];
  let playerStart: Position = { x: 1, y: 1 };
  let core: Position = { x: 5, y: 5 };
  let exit: Position = { x: 9, y: 9 };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ch = spec.rows[y][x];
      tiles.push(CHAR_TILES[ch]);
      if (ch === "P") playerStart = { x, y };
      if (ch === "C") core = { x, y };
      if (ch === "E") exit = { x, y };
    }
  }
  return {
    tiles,
    playerStart,
    core,
    exit,
    guards: spec.guards.map((route) => route.map((p) => ({ ...p }))),
    cameras: spec.cameras.map((camera) => ({ pos: { ...camera.pos }, dirIndex: camera.dirIndex })),
  };
}

function rotatePos(p: Position, size: number): Position {
  return { x: size - 1 - p.y, y: p.x };
}

function mirrorPos(p: Position, size: number): Position {
  return { x: size - 1 - p.x, y: p.y };
}

/** Rotate the whole facility 90° clockwise `times` times, then mirror. */
function transformFacility(raw: RawFacility, rotations: number, mirror: boolean): RawFacility {
  const size = FACILITY_SIZE;
  let current = raw;
  for (let r = 0; r < rotations; r++) {
    const tiles = new Array<Tile>(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const to = rotatePos({ x, y }, size);
        tiles[to.y * size + to.x] = current.tiles[y * size + x];
      }
    }
    current = {
      tiles,
      playerStart: rotatePos(current.playerStart, size),
      core: rotatePos(current.core, size),
      exit: rotatePos(current.exit, size),
      guards: current.guards.map((route) => route.map((p) => rotatePos(p, size))),
      cameras: current.cameras.map((camera) => ({
        pos: rotatePos(camera.pos, size),
        dirIndex: (camera.dirIndex + 1) % 4,
      })),
    };
  }
  if (mirror) {
    const tiles = new Array<Tile>(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const to = mirrorPos({ x, y }, size);
        tiles[to.y * size + to.x] = current.tiles[y * size + x];
      }
    }
    current = {
      tiles,
      playerStart: mirrorPos(current.playerStart, size),
      core: mirrorPos(current.core, size),
      exit: mirrorPos(current.exit, size),
      guards: current.guards.map((route) => route.map((p) => mirrorPos(p, size))),
      cameras: current.cameras.map((camera) => ({
        pos: mirrorPos(camera.pos, size),
        // n(0) and s(2) survive a horizontal mirror; e(1) and w(3) swap.
        dirIndex: camera.dirIndex === 1 ? 3 : camera.dirIndex === 3 ? 1 : camera.dirIndex,
      })),
    };
  }
  return current;
}

/** Seeded door-state variation: each door may flip open/closed. */
function varyDoors(raw: RawFacility, rng: Rng): void {
  for (let i = 0; i < raw.tiles.length; i++) {
    const tile = raw.tiles[i];
    if ((tile === "door-open" || tile === "door-closed") && rng.next() < 0.35) {
      raw.tiles[i] = tile === "door-open" ? "door-closed" : "door-open";
    }
  }
}

/** BFS treating closed doors as passable (the player can hack them). */
export function pathDistance(tiles: Tile[], size: number, from: Position, to: Position): number {
  const dist = new Array<number>(tiles.length).fill(-1);
  const queue: number[] = [from.y * size + from.x];
  dist[queue[0]] = 0;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === to.y * size + to.x) return dist[current];
    const cx = current % size;
    const cy = Math.floor(current / size);
    for (const [nx, ny] of [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const idx = ny * size + nx;
      if (dist[idx] !== -1 || tiles[idx] === "wall") continue;
      dist[idx] = dist[current] + 1;
      queue.push(idx);
    }
  }
  return -1;
}

function guardFacing(route: Position[], pos: Position): Dir {
  const target = route.length > 1 ? route[1] : route[0];
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}

export function validateFacility(raw: RawFacility): boolean {
  const size = FACILITY_SIZE;
  // Border closed.
  for (let i = 0; i < size; i++) {
    if (
      raw.tiles[i] !== "wall" ||
      raw.tiles[(size - 1) * size + i] !== "wall" ||
      raw.tiles[i * size] !== "wall" ||
      raw.tiles[i * size + size - 1] !== "wall"
    ) {
      return false;
    }
  }
  // Reachability and path-length window.
  const toCore = pathDistance(raw.tiles, size, raw.playerStart, raw.core);
  const toExit = pathDistance(raw.tiles, size, raw.core, raw.exit);
  if (toCore === -1 || toExit === -1) return false;
  if (toCore > 28) return false;
  if (toCore + toExit < 12) return false;
  // Guard and camera anchors must be walkable.
  for (const route of raw.guards) {
    for (const p of route) if (!isWalkable(raw.tiles[p.y * size + p.x])) return false;
  }
  for (const camera of raw.cameras) {
    if (raw.tiles[camera.pos.y * size + camera.pos.x] === "wall") return false;
  }
  // Starting tile outside every initial vision cone.
  for (const route of raw.guards) {
    const facing = guardFacing(route, route[0]);
    if (canSee(raw.tiles, size, route[0], facing, GUARD_VISION_RANGE, raw.playerStart)) {
      return false;
    }
  }
  for (const camera of raw.cameras) {
    const facing = DIR_CYCLE[camera.dirIndex];
    if (canSee(raw.tiles, size, camera.pos, facing, CAMERA_VISION_RANGE, raw.playerStart)) {
      return false;
    }
  }
  // Guards must not start on the player, the core, or the exit.
  for (const route of raw.guards) {
    if (
      samePos(route[0], raw.playerStart) ||
      samePos(route[0], raw.core) ||
      samePos(route[0], raw.exit)
    ) {
      return false;
    }
  }
  return true;
}

function buildFacility(raw: RawFacility): Facility {
  const guards: GuardState[] = raw.guards.map((route, id) => ({
    id,
    pos: { ...route[0] },
    facing: guardFacing(route, route[0]),
    route,
    routeIndex: route.length > 1 ? 1 : 0,
    mode: "patrol",
    evidence: null,
    searchTimer: 0,
    unseenTurns: 0,
  }));
  const cameras: CameraState[] = raw.cameras.map((camera, id) => ({
    id,
    pos: camera.pos,
    dirIndex: camera.dirIndex,
    disabledFor: 0,
  }));
  return {
    width: FACILITY_SIZE,
    height: FACILITY_SIZE,
    tiles: raw.tiles,
    playerStart: raw.playerStart,
    core: raw.core,
    exit: raw.exit,
    guards,
    cameras,
  };
}

export function generateFacility(rng: Rng): Facility {
  for (let attempt = 0; attempt < 60; attempt++) {
    const spec = TEMPLATES[rng.int(0, TEMPLATES.length - 1)];
    const rotations = rng.int(0, 3);
    const mirror = rng.next() < 0.5;
    const raw = transformFacility(parseTemplate(spec), rotations, mirror);
    varyDoors(raw, rng);
    if (validateFacility(raw)) return buildFacility(raw);
  }
  // Authored fallback — template 0 untransformed is always valid.
  return buildFacility(parseTemplate(TEMPLATES[0]));
}
