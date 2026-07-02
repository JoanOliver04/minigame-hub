/**
 * Shadow Protocol — line-of-sight model (blueprint §4.5).
 *
 * Vision is a 90° cone with integer-grid ray casting:
 *   - walls and closed doors block sight entirely;
 *   - cover blocks sight only BEYOND the cover tile (an actor standing on
 *     cover is visible; anything behind it is not);
 *   - guards see range 5, cameras range 7.
 */

import type { Dir, Position, Tile } from "./types";

export const DIR_VECTORS: Record<Dir, Position> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

/** Clockwise rotation cycle used by cameras and searching guards. */
export const DIR_CYCLE: Dir[] = ["n", "e", "s", "w"];

export const GUARD_VISION_RANGE = 5;
export const CAMERA_VISION_RANGE = 7;

function blocksSightBeyond(tile: Tile): boolean {
  return tile === "wall" || tile === "door-closed" || tile === "cover";
}

/**
 * True when every cell strictly between `from` and `to` lets sight pass.
 * Bresenham on the integer grid; the endpoints themselves never block.
 */
export function hasLineOfSight(
  tiles: Tile[],
  width: number,
  from: Position,
  to: Position,
): boolean {
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let err = dx - dy;

  for (;;) {
    if (x === to.x && y === to.y) return true;
    if (!(x === from.x && y === from.y)) {
      if (blocksSightBeyond(tiles[y * width + x])) return false;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/** 90° cone: target must sit within ±45° of the facing direction. */
export function inCone(origin: Position, facing: Dir, target: Position): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const f = DIR_VECTORS[facing];
  const forward = dx * f.x + dy * f.y;
  const perp = Math.abs(dx * f.y - dy * f.x);
  return forward >= 1 && perp <= forward;
}

export function canSee(
  tiles: Tile[],
  width: number,
  origin: Position,
  facing: Dir,
  range: number,
  target: Position,
): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  if (dx * dx + dy * dy > range * range) return false;
  if (!inCone(origin, facing, target)) return false;
  return hasLineOfSight(tiles, width, origin, target);
}

/** Every tile an observer currently sees — used for rendering the cones. */
export function visibleTiles(
  tiles: Tile[],
  width: number,
  height: number,
  origin: Position,
  facing: Dir,
  range: number,
): Position[] {
  const out: Position[] = [];
  for (let y = Math.max(0, origin.y - range); y <= Math.min(height - 1, origin.y + range); y++) {
    for (let x = Math.max(0, origin.x - range); x <= Math.min(width - 1, origin.x + range); x++) {
      const target = { x, y };
      if (canSee(tiles, width, origin, facing, range, target)) out.push(target);
    }
  }
  return out;
}
