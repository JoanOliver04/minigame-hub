/**
 * Fleet Command — pure rules (blueprint §7.2).
 *
 * Fleet: one length-4, one length-3, two length-2 ships on an 8×8 grid.
 * Ships cannot overlap or touch (including diagonally). One shot per turn;
 * one sonar pulse per match reveals the occupied-cell COUNT of a 3×3 region.
 */

import type { Rng } from "@/lib/rng";
import type { Ship, ShotRecord, ShotResult } from "./types";
import { BOARD_SIZE, FLEET_LENGTHS, SONAR_RADIUS, inBounds, neighborhood, toIndex, toXY } from "./types";

/** Cells a ship would occupy from an origin; null when it leaves the board. */
export function shipCells(origin: number, length: number, horizontal: boolean): number[] | null {
  const { x, y } = toXY(origin);
  const cells: number[] = [];
  for (let i = 0; i < length; i++) {
    const cx = horizontal ? x + i : x;
    const cy = horizontal ? y : y + i;
    if (!inBounds(cx, cy)) return null;
    cells.push(toIndex(cx, cy));
  }
  return cells;
}

/** Valid iff the cells neither overlap nor touch any existing ship. */
export function placementValid(cells: number[], ships: Ship[]): boolean {
  const blocked = new Set<number>();
  for (const ship of ships) {
    for (const cell of ship.cells) {
      blocked.add(cell);
      for (const n of neighborhood(cell)) blocked.add(n);
    }
  }
  return cells.every((cell) => !blocked.has(cell));
}

/** Random legal fleet (used for the AI and the player's shuffle button). */
export function randomFleet(rng: Rng): Ship[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = [];
    let failed = false;
    FLEET_LENGTHS.forEach((length, id) => {
      if (failed) return;
      for (let tries = 0; tries < 200; tries++) {
        const horizontal = rng.next() < 0.5;
        const origin = rng.int(0, BOARD_SIZE * BOARD_SIZE - 1);
        const cells = shipCells(origin, length, horizontal);
        if (cells && placementValid(cells, ships)) {
          ships.push({ id, length, cells, hits: 0 });
          return;
        }
      }
      failed = true;
    });
    if (!failed && ships.length === FLEET_LENGTHS.length) return ships;
  }
  throw new Error("randomFleet: could not place fleet"); // unreachable on 8×8
}

export interface ShotOutcome {
  result: ShotResult;
  record: ShotRecord;
  ships: Ship[];
}

/** Resolve one shot against a fleet; returns updated ships + public record. */
export function applyShot(ships: Ship[], index: number): ShotOutcome {
  for (const ship of ships) {
    if (ship.cells.includes(index)) {
      const updated = ships.map((s) =>
        s.id === ship.id ? { ...s, hits: s.hits + 1 } : s,
      );
      const hit = updated.find((s) => s.id === ship.id)!;
      if (hit.hits >= hit.length) {
        return {
          result: "sunk",
          record: { index, result: "sunk", sunkCells: [...hit.cells], sunkLength: hit.length },
          ships: updated,
        };
      }
      return { result: "hit", record: { index, result: "hit" }, ships: updated };
    }
  }
  return { result: "miss", record: { index, result: "miss" }, ships };
}

export function allSunk(ships: Ship[]): boolean {
  return ships.every((ship) => ship.hits >= ship.length);
}

/** Sonar pulse: occupied-cell count in the 3×3 region around `center`. */
export function sonarCount(ships: Ship[], center: number): number {
  const { x, y } = toXY(center);
  let count = 0;
  for (const ship of ships) {
    for (const cell of ship.cells) {
      const c = toXY(cell);
      if (Math.abs(c.x - x) <= SONAR_RADIUS && Math.abs(c.y - y) <= SONAR_RADIUS) count++;
    }
  }
  return count;
}
