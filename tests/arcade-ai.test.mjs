import assert from "node:assert/strict";
import { test } from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { createRng } = load("lib/rng");

test("Basket Challenge uses the same full, partial and miss meter zones for the opponent", () => {
  const { resolveAiShot } = load("games/basket-shot/ai");
  const center = resolveAiShot("hard", 1, 3, () => 0.5);
  const edge = resolveAiShot("medium", 2, 3, () => 0.3);
  const missed = resolveAiShot("easy", 3, 2, () => 0);
  assert.deepEqual([center.actor, center.releaseZone, center.scoredPoints], ["ai", "green", 3]);
  assert.deepEqual([edge.made, edge.releaseZone, edge.scoredPoints], [true, "yellow", 1]);
  assert.deepEqual([missed.made, missed.releaseZone, missed.scoredPoints], [false, "miss", 0]);
});

test("Penalty Shootout learns a recurring target zone despite the latest outlier", () => {
  const { planKeeper } = load("games/penalty-kick/ai");
  const history = [80, 84, 87, 18].map((x) => ({ aim: { x, y: 27 } }));
  const learned = planKeeper({ x: 10, y: 75 }, "hard", history, "placed", 65, () => 0.5);
  assert.equal(learned.strategy, "learn");
  assert.ok(learned.target.x > 80 && learned.target.x < 87);
  assert.equal(learned.target.y, 27);
});

test("Reaction Time simulates anticipation while preserving difficulty separation", () => {
  const { simulateAiReaction } = load("games/reaction-time/ai");
  const { MIN_SIGNAL_DELAY_MS, MAX_SIGNAL_DELAY_MS } = load("games/reaction-time/logic");
  const early = simulateAiReaction("medium", MIN_SIGNAL_DELAY_MS, () => 0.05);
  const late = simulateAiReaction("medium", MAX_SIGNAL_DELAY_MS, () => 0.05);
  assert.equal(early.falseStart, false);
  assert.equal(late.falseStart, true);
  assert.ok(late.reactionMs < early.reactionMs);
  assert.ok(simulateAiReaction("hard", MIN_SIGNAL_DELAY_MS, () => 0.99).reactionMs
    < simulateAiReaction("medium", MAX_SIGNAL_DELAY_MS, () => 0).reactionMs);
});

test("Spellstorm recognizes a lethal fire spell and accounts for an opponent's shield", () => {
  const { chooseAiSpell } = load("games/spellstorm/ai");
  const { createMage } = load("games/spellstorm/logic");
  const ai = { ...createMage(), health: 25, energy: 100 };
  const foe = { ...createMage(), health: 15 };
  assert.equal(chooseAiSpell(ai, foe, "hard", 5, createRng(1)), "fire");
  assert.equal(chooseAiSpell(ai, { ...foe, shield: 40 }, "hard", 5, createRng(1)), "shield");
});

test("Beat Reactor adjusts the fixed opponent plan to fast successive notes", () => {
  const { precomputeAiHits } = load("games/beat-reactor/ai");
  const chart = [
    { id: 1, lane: 0, hitTime: 1, duration: 0.2, accent: false },
    { id: 2, lane: 0, hitTime: 1.05, duration: 0, accent: false },
    { id: 3, lane: 2, hitTime: 2, duration: 0, accent: false },
  ];
  assert.deepEqual(precomputeAiHits(chart, "hard", createRng(30)), precomputeAiHits(chart, "hard", createRng(30)));
  const hits = precomputeAiHits(chart, "medium", { next: () => 0.08 });
  assert.notEqual(hits[0].timingErrorMs, null);
  assert.equal(hits[1].timingErrorMs, null);
  assert.notEqual(hits[2].timingErrorMs, null);
  const chord = [{ ...chart[0], duration: 0 }, { ...chart[1], lane: 1, hitTime: 1 }];
  assert.deepEqual(precomputeAiHits(chord, "medium", { next: () => 0.072 }).map((hit) => hit.timingErrorMs), [null, null]);
});

test("Windline Archery stays within the player's controls and compensates for wind", () => {
  const { aiAim } = load("games/windline-archery/ai");
  const { computeImpact } = load("games/windline-archery/physics");
  for (const horizontal of [-2.3, 0, 2.3]) {
    const wind = { horizontal, vertical: -0.55 };
    const aim = aiAim(wind, "hard", { next: () => 0.5 });
    const impact = computeImpact(aim, wind);
    assert.ok(Math.hypot(impact.x, impact.y) < 0.08);
    if (horizontal) assert.equal(Math.sign(aim.windageDeg), -Math.sign(horizontal));
  }
  const limited = aiAim({ horizontal: 40, vertical: -40 }, "easy", createRng(3));
  assert.ok(limited.angleDeg >= 2 && limited.angleDeg <= 20);
  assert.ok(limited.windageDeg >= -4 && limited.windageDeg <= 4);
  assert.ok(limited.power >= 30 && limited.power <= 100);
});

test("Neon Drift brakes ahead of a turn and uses boost on a safe straight", () => {
  const { aiControl, createAiMemory } = load("games/neon-drift/ai");
  const { initialCar } = load("games/neon-drift/physics");
  const { getTrack } = load("games/neon-drift/tracks");
  const base = getTrack("circuit");
  const car = { ...initialCar(base), velocity: { x: 320, y: 0 } };
  const nodes = Array.from({ length: 36 }, (_, i) => ({
    position: { x: car.position.x + i * 8, y: car.position.y },
    curvature: i === 4 ? 0.35 : 0,
    targetSpeed: i === 4 ? 150 : 340,
  }));
  const braking = aiControl(car, { ...base, racingNodes: nodes }, "hard", createRng(1), createAiMemory());
  assert.ok(braking.brake > 0);
  assert.equal(braking.boost, false);
  const straight = aiControl({ ...car, velocity: { x: 190, y: 0 } },
    { ...base, racingNodes: nodes.map((node) => ({ ...node, curvature: 0, targetSpeed: 340 })) },
    "hard", createRng(1), createAiMemory());
  assert.equal(straight.brake, 0);
  assert.equal(straight.boost, true);
});

test("Circuit Breaker counts space beyond a marked live cycle and avoids a head-on trap", () => {
  const { createRound, reachableSpace, resolveTick } = load("games/circuit-breaker/logic");
  const { aiPickAction } = load("games/circuit-breaker/ai");
  const { indexOf } = load("games/circuit-breaker/types");
  const round = createRound();
  assert.ok(reachableSpace(round.grid, round.ai.pos, 30) > 1);
  const ai = { pos: { x: 3, y: 2 }, heading: 3, alive: true };
  const player = { pos: { x: 1, y: 2 }, heading: 1, alive: true };
  round.grid[indexOf(3, 2)] = 1;
  round.grid[indexOf(1, 2)] = 1;
  for (const [x, y] of [[1, 1], [1, 3], [2, 1], [2, 3]]) round.grid[indexOf(x, y)] = 1;
  const trap = { ...round, ai, player };
  assert.equal(resolveTick(trap, "straight", "straight").roundResult, "tie");
  for (const difficulty of ["medium", "hard"]) {
    const action = aiPickAction(trap, difficulty, createRng(100));
    assert.notEqual(action, "straight");
    assert.equal(resolveTick(trap, "straight", action).ai.alive, true);
  }
});

test("Shadow Protocol only extrapolates a sighting after time passes and avoids occupied patrol tiles", () => {
  const { interceptionTarget, pathStep, reachableCandidates } = load("games/shadow-protocol/ai");
  const tiles = new Array(9).fill("floor");
  const evidence = { x: 1, y: 1 };
  assert.deepEqual(reachableCandidates(tiles, 3, 3, evidence, 0), [evidence]);
  assert.deepEqual(interceptionTarget(tiles, 3, 3, { x: 0, y: 0 }, evidence, 0, { x: 2, y: 2 }), evidence);
  assert.equal(pathStep(tiles, 3, 3, { x: 0, y: 1 }, evidence, new Set([4])), null);
});

test("Sliding Puzzle gives a legal repeatable recommendation without moving the board", () => {
  const { canMoveTile, moveSlidingTile, suggestSlidingTile } = load("games/sliding-puzzle/logic");
  const state = { size: 3, tiles: [1, 2, 3, 4, 5, 6, 0, 7, 8], emptyIndex: 6, moves: 0, solved: false };
  const hint = suggestSlidingTile(state);
  assert.equal(hint, 7);
  assert.equal(suggestSlidingTile(state), hint);
  assert.equal(canMoveTile(state, hint), true);
  assert.equal(state.moves, 0);
  assert.deepEqual(state.tiles, [1, 2, 3, 4, 5, 6, 0, 7, 8]);
  const almostSolved = moveSlidingTile(state, hint);
  const solved = moveSlidingTile(almostSolved, suggestSlidingTile(almostSolved));
  assert.equal(solved.solved, true);
  assert.equal(suggestSlidingTile(solved), null);
});
