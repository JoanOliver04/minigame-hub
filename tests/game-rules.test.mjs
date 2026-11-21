import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const rummy = load("games/tile-rummy/logic");
const { createRng } = load("lib/rng");

const tile = (color, value, copy = 1) => ({ id: `${color}-${value}-${copy}`, color, value, joker: false });
const joker = (copy = 1) => ({ id: `joker-${copy}`, color: "joker", value: null, joker: true });

function rummyState(one, two = [], opened = true) {
  return { order: ["one", "two"], turn: "one", hands: { one, two }, opened: { one: opened, two: opened },
    deck: [], table: [], finished: false, winner: null, lastAction: null, log: [] };
}

test("Tile Rummy scores the highest legal joker placement and can play a run longer than five", () => {
  const hand = [2, 3, 4, 5, 6, 7].map((value) => tile("ruby", value)).concat(joker());
  const state = rummyState(hand, [], false);
  assert.deepEqual(rummy.validateTileRummyMeld(state, "one", hand), { valid: true, kind: "run", score: 35 });
  assert.ok(rummy.findTileRummyMelds(state, "one").some((meld) => meld.tiles.length === 7 && meld.score === 35));
  assert.ok(rummy.canPlayAnyMeld(state, "one"));
  assert.equal(rummy.playTileRummyMeld(state, "one", hand.map(({ id }) => id)).winner, "one");
  const edge = [tile("sun", 12), tile("sun", 13), joker(), joker(2)];
  assert.equal(rummy.validateTileRummyMeld(state, "one", edge).score, 46);
});

function meldKey(tiles, kind, score) {
  return `${kind}:${score}:${tiles.map(({ color, value }) => `${color}-${value}`).sort().join(",")}`;
}

test("Tile Rummy's indexed search agrees with exhaustive subsets on seeded racks", () => {
  const rng = createRng(124687);
  const pool = ["ruby", "sun", "leaf", "sky"].flatMap((color) =>
    [6, 7, 8, 9, 10, 11, 12, 13].flatMap((value) => [tile(color, value), tile(color, value, 2)]));
  for (let attempt = 0; attempt < 36; attempt++) {
    const naturals = rng.shuffle(pool).slice(0, 8);
    const hand = [...naturals, ...[joker(), joker(2)].slice(0, attempt % 3)];
    const state = rummyState(hand, [], attempt % 2 === 0);
    const expected = new Set();
    for (let mask = 1; mask < 1 << hand.length; mask++) {
      const tiles = hand.filter((_, index) => (mask & (1 << index)) !== 0);
      const decision = rummy.validateTileRummyMeld(state, "one", tiles);
      if (decision.valid) expected.add(meldKey(tiles, decision.kind, decision.score));
    }
    const actual = rummy.findTileRummyMelds(state, "one");
    assert.deepEqual(new Set(actual.map(({ tiles, kind, score }) => meldKey(tiles, kind, score))), expected);
    assert.equal(rummy.canPlayAnyMeld(state, "one"), expected.size > 0);
  }
});

test("Tile Rummy passes when the opponent can play and resolves a genuine blocked finish fairly", () => {
  const one = [tile("ruby", 6)];
  const two = [tile("sun", 5), tile("sun", 6), tile("sun", 7)];
  let next = rummy.drawTileRummyTile(rummyState(one, two), "one");
  assert.equal(next.finished, false);
  assert.equal(next.turn, "two");
  assert.equal(next.lastAction.kind, "blocked");
  next = rummy.drawTileRummyTile(rummyState(one, [tile("sun", 5)]), "one");
  assert.equal(next.finished, true);
  assert.equal(next.winner, "two");
  next = rummy.drawTileRummyTile(rummyState(one, [tile("sun", 6)]), "one");
  assert.equal(next.finished, true);
  assert.equal(next.winner, null);
});

test("Tic-Tac-Toe hard mode keeps the optimal reply after a first move on the edge", () => {
  const { aiPickMove } = load("games/ttt/ai");
  assert.deepEqual(aiPickMove([null, "X", null, null, null, null, null, null, null], "hard"), { from: null, to: 4 });
});

test("Hex Dominion AI wins, blocks, and stays deterministic without modifying the board", () => {
  const { createHexState, hexIndex, hasConnection } = load("games/hex-dominion/logic");
  const { chooseHexMove } = load("games/hex-dominion/ai");
  const win = createHexState().board;
  const threat = createHexState().board;
  for (let index = 0; index < 6; index++) {
    win[hexIndex(index, 0)] = "ai";
    threat[hexIndex(0, index)] = "player";
  }
  assert.equal(chooseHexMove(win, "hard", createRng(1)), hexIndex(6, 0));
  assert.equal(chooseHexMove(threat, "hard", createRng(1)), hexIndex(0, 6));
  win[hexIndex(6, 0)] = "ai";
  assert.equal(hasConnection(win, "ai"), true);
  assert.equal(hasConnection(win, "player"), false);

  const board = createHexState().board;
  board[hexIndex(3, 3)] = "player";
  const before = board.slice();
  const move = chooseHexMove(board, "hard", createRng(18));
  assert.equal(board[move], null);
  assert.equal(chooseHexMove(board, "hard", createRng(18)), move);
  assert.deepEqual(board, before);
});

test("Neon Drift counts the first lap and finishes after three laps", () => {
  const { initialCar, stepCar } = load("games/neon-drift/physics");
  const { getTrack } = load("games/neon-drift/tracks");
  const { formatTime } = load("games/neon-drift/logic");
  const track = getTrack("circuit");
  let car = initialCar(track);
  for (const [i, elapsed] of [4, 9, 15].entries()) {
    car = stepCar({ ...car, checkpoint: 0, position: { ...track.checkpoints[0] } },
      { steer: 0, throttle: 0, brake: 0, boost: false }, track, elapsed);
    assert.equal(car.lap, i + 1);
    assert.equal(car.bestLap, 4);
    assert.equal(car.finished, i === 2);
  }
  assert.equal(car.finishTime, 15);
  assert.equal(formatTime(59.999), "1:00.00");
  assert.equal(formatTime(63.14), "1:03.14");
});
