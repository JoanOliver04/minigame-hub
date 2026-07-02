/**
 * Neon Drift — track definitions and racing-line precompute (blueprint §5.5).
 *
 * A track is a closed centreline sampled into points; the drivable area is
 * everything within `halfWidth` of that line. The racing line for v1 is the
 * centreline itself, annotated with a per-node curvature and the target
 * speed a clean lap would carry through it — this is what the AI tracks.
 *
 * All coordinates are in the SVG viewBox space (0..1000 on each axis).
 */

import type { RacingNode, Vec2 } from "./types";
import { CHECKPOINTS_PER_LAP, vec } from "./types";

export interface TrackDef {
  id: string;
  /** Closed centreline control points (Catmull-Rom interpolated). */
  controls: Vec2[];
  halfWidth: number;
  /** Densely sampled centreline (filled by buildTrack). */
  centerline: Vec2[];
  racingNodes: RacingNode[];
  /** Checkpoint positions in crossing order; index 0 is start/finish. */
  checkpoints: Vec2[];
  startHeading: number;
}

const RAW_TRACKS: { id: string; controls: Vec2[]; halfWidth: number }[] = [
  {
    id: "circuit",
    halfWidth: 62,
    controls: [
      vec(500, 160),
      vec(760, 210),
      vec(850, 420),
      vec(800, 680),
      vec(560, 820),
      vec(300, 780),
      vec(180, 560),
      vec(220, 320),
    ],
  },
  {
    // A curvy, non-self-intersecting "serpent" loop. A true figure-8 was
    // tested but its self-crossing breaks the nearest-centreline off-track
    // model (the two branches sit within a car width of each other), so the
    // circuit uses distinct switchbacks that never overlap instead.
    id: "serpent",
    halfWidth: 58,
    controls: [
      vec(500, 150),
      vec(780, 210),
      vec(840, 420),
      vec(640, 520),
      vec(760, 640),
      vec(700, 840),
      vec(440, 860),
      vec(300, 700),
      vec(420, 560),
      vec(260, 460),
      vec(200, 260),
      vec(320, 160),
    ],
  },
  {
    id: "speedway",
    halfWidth: 72,
    controls: [
      vec(500, 150),
      vec(820, 260),
      vec(840, 720),
      vec(500, 850),
      vec(160, 720),
      vec(180, 260),
    ],
  },
];

/** Catmull-Rom spline point for the segment p1->p2 at parameter t. */
function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

const SAMPLES_PER_SEGMENT = 24;

function sampleCenterline(controls: Vec2[]): Vec2[] {
  const n = controls.length;
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = controls[(i - 1 + n) % n];
    const p1 = controls[i];
    const p2 = controls[(i + 1) % n];
    const p3 = controls[(i + 2) % n];
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      out.push(catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SEGMENT));
    }
  }
  return out;
}

function curvatureAt(points: Vec2[], i: number): number {
  const n = points.length;
  const prev = points[(i - 3 + n) % n];
  const cur = points[i];
  const next = points[(i + 3) % n];
  const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
  const v2 = { x: next.x - cur.x, y: next.y - cur.y };
  const a1 = Math.atan2(v1.y, v1.x);
  const a2 = Math.atan2(v2.y, v2.x);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

const MAX_SPEED = 340; // units/s on straights
const MIN_SPEED = 150; // slowest a tight corner is taken

function buildRacingNodes(centerline: Vec2[]): RacingNode[] {
  return centerline.map((position, i) => {
    const curvature = curvatureAt(centerline, i);
    // Higher curvature → lower target speed.
    const targetSpeed = Math.max(MIN_SPEED, MAX_SPEED - curvature * 900);
    return { position, targetSpeed, curvature };
  });
}

function buildTrack(raw: { id: string; controls: Vec2[]; halfWidth: number }): TrackDef {
  const centerline = sampleCenterline(raw.controls);
  const racingNodes = buildRacingNodes(centerline);
  const checkpoints: Vec2[] = [];
  for (let c = 0; c < CHECKPOINTS_PER_LAP; c++) {
    checkpoints.push(centerline[Math.floor((c / CHECKPOINTS_PER_LAP) * centerline.length)]);
  }
  const p0 = centerline[0];
  const p1 = centerline[3];
  const startHeading = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  return {
    id: raw.id,
    controls: raw.controls,
    halfWidth: raw.halfWidth,
    centerline,
    racingNodes,
    checkpoints,
    startHeading,
  };
}

export const TRACKS: TrackDef[] = RAW_TRACKS.map(buildTrack);

export function getTrack(id: string): TrackDef {
  return TRACKS.find((track) => track.id === id) ?? TRACKS[0];
}

/** Signed distance from the nearest centreline point (for off-track test). */
export function distanceToTrack(track: TrackDef, p: Vec2): number {
  let best = Infinity;
  for (const c of track.centerline) {
    const d = (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** Build an SVG path string for the closed centreline. */
export function centerlinePath(track: TrackDef): string {
  return (
    track.centerline
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ") + " Z"
  );
}
