import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { ghostAt, fasterGhost, readGhost, recordLap } = load("games/neon-drift/ghost");
const pose = (x) => ({ position: { x, y: x / 2 }, heading: x / 10 });

test("long laps keep both ends of the recording and interpolate using simulation time", () => {
  const recording = recordLap(pose(0));
  for (let i = 1; i < 30000; i++) recording.observe(i / 10, pose(i / 10));
  const lap = recording.finish(3000, pose(3000));
  assert.ok(lap.samples.length <= 1201);
  assert.deepEqual(readGhost(JSON.stringify(lap)), lap);
  assert.deepEqual(ghostAt(lap, -1), pose(0));
  assert.deepEqual(ghostAt(lap, 5000), pose(3000));
  assert.ok(Math.abs(ghostAt(lap, 625.35).position.x - 625.35) < 0.11);
});

test("a slower or tied lap preserves the previous ghost and a broken record can be replaced", () => {
  const first = recordLap(pose(0)).finish(20, pose(10));
  const fast = recordLap(pose(0)).finish(18, pose(12));
  const saved = fasterGhost("invalid", first);
  assert.equal(fasterGhost(saved, first), saved);
  assert.equal(readGhost(fasterGhost(saved, fast)).time, 18);
  assert.equal(fasterGhost(JSON.stringify(fast), first), JSON.stringify(fast));
  for (const samples of [[], [[0, 0, 0, 0]], [[0, 0, 0, 0], [0, 4, 3, 2]], [[0, 0, 0, 0], [2, 3, 4, null]]]) {
    assert.equal(readGhost(JSON.stringify({ time: 2, samples })), null);
  }
});

test("one-lap time trials finish at the sixth ordered checkpoint on each track", () => {
  const { initialCar, stepCar } = load("games/neon-drift/physics");
  const { TRACKS } = load("games/neon-drift/tracks");
  const coast = { throttle: 0, steer: 0, brake: 0, boost: false };
  for (const track of TRACKS) {
    let car = initialCar(track);
    car = stepCar(car, coast, track, 1, 1);
    assert.equal(car.lap, 0);
    for (let i = 1; i <= 6; i++) {
      car = stepCar({ ...car, position: track.checkpoints[i % 6] }, coast, track, i + 1, 1);
      assert.equal(car.finished, i === 6);
    }
    assert.equal(car.finishTime, 7);
  }
});

test("memory reserves independent records for each board and rejects impossible attempts", () => {
  const { bestAttempts, memoryRecordKey } = load("games/memory-match/logic");
  assert.equal(new Set([6, 8, 18].map(memoryRecordKey)).size, 3);
  for (const raw of [null, "", "broken", "5", "6.5", "-3"]) assert.equal(bestAttempts(raw, 6), null);
  assert.equal(bestAttempts("6", 6), 6);
  assert.equal(bestAttempts("7", 8), null);
});

test("a driver reaching any arena edge stays in view and can drive back to the road", () => {
  const { initialCar, stepCar } = load("games/neon-drift/physics");
  const { TRACKS, distanceToTrack } = load("games/neon-drift/tracks");
  const throttle = { throttle: 1, steer: 0, brake: 0, boost: false };
  for (const track of TRACKS) {
    for (const [x, y] of [[19, 500], [981, 500], [500, 19], [500, 981], [981, 981]]) {
      const entering = { ...initialCar(track), position: { x, y }, checkpoint: 3 };
      let car = stepCar(entering, throttle, track, 1);
      assert.equal(car.checkpoint, 3);
      assert.equal(car.lap, 0);
      assert.deepEqual(car.velocity, { x: 0, y: 0 });
      const startDistance = distanceToTrack(track, car.position);
      for (let tick = 1; tick <= 90; tick++) {
        car = stepCar(car, throttle, track, 1 + tick / 120);
        assert.ok(car.position.x >= 20 && car.position.x <= 980 && car.position.y >= 20 && car.position.y <= 980);
      }
      assert.ok(distanceToTrack(track, car.position) < startDistance);
    }
  }
});
