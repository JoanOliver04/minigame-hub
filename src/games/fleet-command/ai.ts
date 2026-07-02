/**
 * Fleet Command — targeting AI (blueprint §7.3).
 *
 * Honest-information contract: the AI works exclusively from `FleetIntel`,
 * which is rebuilt from its own shot history (miss/hit/sunk reveals) and its
 * single sonar count. There is no import path from the real player board
 * into target selection.
 *
 *   Easy   — random unknown cell; adjacent follow-up after a hit.
 *   Medium — checkerboard hunt plus orientation targeting on hit lines.
 *   Hard   — posterior placement heatmap: enumerate every legal placement of
 *            every remaining ship consistent with the intel, weight the ones
 *            explaining unresolved hits, and fire at the modal cell. Sonar is
 *            spent on the region with the highest expected information.
 */

import type { Rng } from "@/lib/rng";
import type {
  FleetDifficulty,
  FleetIntel,
  IntelCell,
  ShotRecord,
  SonarReading,
} from "./types";
import { BOARD_SIZE, FLEET_LENGTHS, SONAR_RADIUS, inBounds, neighborhood, toIndex, toXY } from "./types";
import { shipCells } from "./logic";

/** Rebuild the knowledge model from public shot history + sonar reading. */
export function buildIntel(history: ShotRecord[], sonar: SonarReading | null): FleetIntel {
  const cells: IntelCell[] = new Array(BOARD_SIZE * BOARD_SIZE).fill("unknown");
  const remaining = [...FLEET_LENGTHS] as number[];
  for (const record of history) {
    if (record.result === "miss") cells[record.index] = "miss";
    else cells[record.index] = "hit";
    if (record.result === "sunk" && record.sunkCells && record.sunkLength) {
      const at = remaining.indexOf(record.sunkLength);
      if (at !== -1) remaining.splice(at, 1);
      for (const cell of record.sunkCells) {
        cells[cell] = "sunk-buffer";
        for (const n of neighborhood(cell)) {
          if (cells[n] === "unknown" || cells[n] === "miss") cells[n] = "sunk-buffer";
        }
      }
    }
  }
  // A zero-count sonar region is a hard "no ship here" deduction.
  if (sonar && sonar.count === 0) {
    const { x, y } = toXY(sonar.center);
    for (let dy = -SONAR_RADIUS; dy <= SONAR_RADIUS; dy++) {
      for (let dx = -SONAR_RADIUS; dx <= SONAR_RADIUS; dx++) {
        if (!inBounds(x + dx, y + dy)) continue;
        const i = toIndex(x + dx, y + dy);
        if (cells[i] === "unknown") cells[i] = "miss";
      }
    }
  }
  return { cells, remainingShipLengths: remaining, sonar };
}

/** Hits that are not part of an already-sunk ship. */
function unresolvedHits(intel: FleetIntel): number[] {
  const out: number[] = [];
  intel.cells.forEach((cell, i) => {
    if (cell === "hit") out.push(i);
  });
  return out;
}

function unknowns(intel: FleetIntel): number[] {
  const out: number[] = [];
  intel.cells.forEach((cell, i) => {
    if (cell === "unknown") out.push(i);
  });
  return out;
}

function adjacentUnknowns(intel: FleetIntel, index: number): number[] {
  const { x, y } = toXY(index);
  const out: number[] = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    if (!inBounds(x + dx, y + dy)) continue;
    const n = toIndex(x + dx, y + dy);
    if (intel.cells[n] === "unknown") out.push(n);
  }
  return out;
}

/** Cells extending a collinear hit run in both directions. */
function lineExtensions(intel: FleetIntel, hits: number[]): number[] {
  if (hits.length < 2) return [];
  const coords = hits.map(toXY);
  const sameRow = coords.every((c) => c.y === coords[0].y);
  const sameCol = coords.every((c) => c.x === coords[0].x);
  if (!sameRow && !sameCol) return [];
  const sorted = [...hits].sort((a, b) => a - b);
  const out: number[] = [];
  const first = toXY(sorted[0]);
  const last = toXY(sorted[sorted.length - 1]);
  if (sameRow) {
    if (inBounds(first.x - 1, first.y)) out.push(toIndex(first.x - 1, first.y));
    if (inBounds(last.x + 1, last.y)) out.push(toIndex(last.x + 1, last.y));
  } else {
    if (inBounds(first.x, first.y - 1)) out.push(toIndex(first.x, first.y - 1));
    if (inBounds(last.x, last.y + 1)) out.push(toIndex(last.x, last.y + 1));
  }
  return out.filter((i) => intel.cells[i] === "unknown");
}

/**
 * Posterior placement heatmap over unknown cells. Placements must avoid
 * miss/sunk-buffer cells; placements covering unresolved hits get a large
 * weight (they explain the evidence); a positive sonar count boosts its
 * region proportionally.
 */
function placementHeatmap(intel: FleetIntel): number[] {
  const heat = new Array<number>(BOARD_SIZE * BOARD_SIZE).fill(0);
  const hits = new Set(unresolvedHits(intel));
  for (const length of intel.remainingShipLengths) {
    for (let origin = 0; origin < BOARD_SIZE * BOARD_SIZE; origin++) {
      for (const horizontal of [true, false]) {
        const cells = shipCells(origin, length, horizontal);
        if (!cells) continue;
        if (cells.some((c) => intel.cells[c] === "miss" || intel.cells[c] === "sunk-buffer")) {
          continue;
        }
        const coveredHits = cells.filter((c) => hits.has(c)).length;
        let weight = 1 + coveredHits * 60;
        if (intel.sonar && intel.sonar.count > 0) {
          const { x, y } = toXY(intel.sonar.center);
          const inRegion = cells.some((c) => {
            const p = toXY(c);
            return Math.abs(p.x - x) <= SONAR_RADIUS && Math.abs(p.y - y) <= SONAR_RADIUS;
          });
          if (inRegion) weight *= 1 + intel.sonar.count;
        }
        for (const c of cells) {
          if (intel.cells[c] === "unknown") heat[c] += weight;
        }
      }
    }
  }
  return heat;
}

export function aiPickShot(intel: FleetIntel, difficulty: FleetDifficulty, rng: Rng): number {
  const hits = unresolvedHits(intel);

  if (difficulty === "easy") {
    if (hits.length > 0) {
      const targets = adjacentUnknowns(intel, rng.pick(hits));
      if (targets.length > 0) return rng.pick(targets);
    }
    return rng.pick(unknowns(intel));
  }

  if (difficulty === "medium") {
    const extensions = lineExtensions(intel, hits);
    if (extensions.length > 0) return rng.pick(extensions);
    if (hits.length > 0) {
      const targets = hits.flatMap((h) => adjacentUnknowns(intel, h));
      if (targets.length > 0) return rng.pick(targets);
    }
    const parity = unknowns(intel).filter((i) => {
      const { x, y } = toXY(i);
      return (x + y) % 2 === 0;
    });
    return parity.length > 0 ? rng.pick(parity) : rng.pick(unknowns(intel));
  }

  // Hard: modal cell of the placement posterior.
  const heat = placementHeatmap(intel);
  let best: number[] = [];
  let bestHeat = -1;
  heat.forEach((value, i) => {
    if (intel.cells[i] !== "unknown") return;
    if (value > bestHeat) {
      bestHeat = value;
      best = [i];
    } else if (value === bestHeat) {
      best.push(i);
    }
  });
  return best.length > 0 ? rng.pick(best) : rng.pick(unknowns(intel));
}

/**
 * Whether/where to spend the one sonar pulse this turn (fired before the
 * shot). Returns a region center or null.
 */
export function aiPickSonar(
  intel: FleetIntel,
  difficulty: FleetDifficulty,
  shotsTaken: number,
  rng: Rng,
): number | null {
  if (unresolvedHits(intel).length > 0) return null; // targeting beats scanning
  if (difficulty === "easy") {
    // Fires it on a random mid-board region early on.
    if (shotsTaken !== 6) return null;
    return toIndex(rng.int(2, 5), rng.int(2, 5));
  }
  if (difficulty === "medium") {
    if (shotsTaken !== 10) return null;
    // Region with the most unknown cells.
    let best = null as number | null;
    let bestCount = -1;
    for (let y = 1; y < BOARD_SIZE - 1; y++) {
      for (let x = 1; x < BOARD_SIZE - 1; x++) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (intel.cells[toIndex(x + dx, y + dy)] === "unknown") count++;
          }
        }
        if (count > bestCount) {
          bestCount = count;
          best = toIndex(x, y);
        }
      }
    }
    return best;
  }
  // Hard: expected-information proxy — the region with the highest heatmap
  // variance-to-certainty ratio (most probability mass spread over unknowns),
  // fired once the checkerboard phase stops making fast progress.
  if (shotsTaken < 8) return null;
  const heat = placementHeatmap(intel);
  const total = heat.reduce((sum, value) => sum + value, 0);
  if (total === 0) return null;
  let best: number | null = null;
  let bestScore = -1;
  for (let y = 1; y < BOARD_SIZE - 1; y++) {
    for (let x = 1; x < BOARD_SIZE - 1; x++) {
      let mass = 0;
      let unknownCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = toIndex(x + dx, y + dy);
          mass += heat[i];
          if (intel.cells[i] === "unknown") unknownCount++;
        }
      }
      // Information is highest when the region is likely but not certain.
      const p = mass / total;
      const score = p * (1 - p) * unknownCount;
      if (score > bestScore) {
        bestScore = score;
        best = toIndex(x, y);
      }
    }
  }
  return best;
}
