import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { opening, captures, countDiscs, legalMoves, place, reversi } = load("games/mini-reversi/logic");
const { diceRace } = load("games/dice-race/logic");
const { boxes, boxScores } = load("games/dots-boxes/logic");
const { mancala } = load("games/mancala/logic");
const { ice, iceOpening, jumps } = load("games/ice-floe/logic");
const { curling, slide, endScore } = load("games/pocket-curling/logic");
const { fifteen, NUMBERS, winningTrio } = load("games/exact-fifteen/logic");

test("a fifteen belongs to a single seat and hard defends against human opening lines", () => {
  let state = fifteen.start();
  for (const n of [8, 2, 1, 4, 6]) state = fifteen.play(state, n);
  assert.equal(state.winner, 0);
  assert.deepEqual(winningTrio(state.owners, 0), [1, 6, 8]);
  assert.equal(fifteen.play(state, 9), state);
  const initial = fifteen.play(fifteen.start(), 5);
  for (const n of [0, 1.5, 5, 10]) assert.equal(fifteen.play(initial, n), initial);
  function allHumanReplies(position) {
    if (position.winner !== null) { assert.notEqual(position.winner, 0); return; }
    const moves = position.active === 1 ? [fifteen.choose(position, "hard")] : NUMBERS.filter(n => !position.owners[n - 1]);
    for (const n of moves) allHumanReplies(fifteen.play(position, n));
  }
  allHumanReplies(fifteen.start());
});

test("curling resolves collisions, curl direction, touching the house, blanks and multi-point ends", () => {
  const shot = { angle: 0, power: 86, spin: 0 };
  const initial = [{ x: 100, y: 50, seat: 1, id: 1 }];
  const hit = slide(initial, 0, shot, 2);
  assert.ok(hit[0].x > 108);
  assert.ok(hit[1].x < hit[0].x);
  assert.equal(initial[0].x, 100);
  assert.deepEqual(hit, slide(initial, 0, shot, 2));
  assert.ok(slide([], 0, { ...shot, spin: -1 }, 1)[0].y < 50);
  assert.ok(slide([], 0, { ...shot, spin: 1 }, 1)[0].y > 50);
  const stone = (x, seat) => ({ x, y: 50, seat, id: 0 });
  assert.equal(endScore([stone(130, 1)]), -1);
  assert.equal(endScore([stone(130.1, 1)]), 0);
  assert.equal(endScore([stone(100, 0), stone(110, 1)]), 0);
  assert.equal(endScore([stone(106, 0), stone(102, 0), stone(120, 1)]), 2);
});

test("curling alternates the opening seat and settles exactly three ends at every difficulty", () => {
  for (const level of ["easy", "medium", "hard"]) {
    let state = curling.start();
    const first = [];
    for (let i = 0; i < 12; i++) {
      if (i % 4 === 0) { first.push(state.active); assert.deepEqual(state.stones, []); }
      const shot = curling.choose(state, level);
      assert.equal(curling.play(state, { ...shot, power: 101 }), state);
      state = curling.play(state, shot);
      assert.equal(state.moves, i + 1);
      assert.equal(state.ends.length, Math.floor((i + 1) / 4));
    }
    assert.deepEqual(first, [0, 1, 0]);
    const margin = state.ends.reduce((sum, n) => sum + n, 0);
    assert.equal(state.winner, margin === 0 ? "tie" : margin > 0 ? 0 : 1);
    assert.equal(curling.play(state, { angle: 0, power: 65, spin: 0 }), state);
  }
});
const { loot, lootOpening } = load("games/pirate-loot/logic");

test("all eight saved duels reproduce every original board, extra turn and roll", () => {
  const { restoreDuel } = load("games/duels/savedDuel");
  for (const rules of [ice, loot, curling, fifteen, mancala, boxes, reversi, diceRace]) {
    const save = { id: "test-run", seed: 1742, level: "medium", actions: [], finished: false, updatedAt: 1000 };
    const frames = [rules.start(save.seed)];
    while (frames.at(-1).winner === null) {
      const before = frames.at(-1);
      const action = rules === diceRace ? (before.pot >= 12 ? { kind: "bank" } : { kind: "roll", face: 6 }) : rules.choose(before, "medium");
      frames.push(rules.play(before, action));
      save.actions.push(action);
      assert.ok(save.actions.length < 300, rules.id);
      if (save.actions.length === 3) assert.deepEqual(restoreDuel(rules, JSON.stringify(save)).frames, frames, rules.id);
    }
    save.finished = true;
    assert.deepEqual(restoreDuel(rules, JSON.stringify(save)).frames, frames, rules.id);
    assert.equal(restoreDuel(rules, JSON.stringify({ ...save, finished: false })), null);
    assert.equal(restoreDuel(rules, JSON.stringify({ ...save, actions: [...save.actions, save.actions[0]] })), null);
  }
});

test("invalid saved actions cannot credit results or produce a broken board", () => {
  const { restoreDuel } = load("games/duels/savedDuel");
  const save = { id: "run", seed: 0, level: "hard", updatedAt: 0, finished: false };
  for (const [rules, actions] of [[diceRace, [null]], [diceRace, [{ kind: "unknown", face: 5 }]], [fifteen, [2, 2]], [curling, [0]]]) {
    assert.equal(restoreDuel(rules, JSON.stringify({ ...save, actions })), null);
  }
  assert.equal(restoreDuel(ice, "broken"), null);
});

test("ice sinks after each jump, prevents wrapping, and ends when the other penguin is trapped", () => {
  const water = (2 ** 25 - 1) ^ ((1 << 0) | (1 << 1) | (1 << 2) | (1 << 5));
  const start = { ...iceOpening(4), pawns: [0, 2], water };
  assert.deepEqual(jumps(start, 0), [1, 5]);
  for (const pos of [0, 2, 4, -1, 1.3]) assert.equal(ice.play(start, pos), start);
  assert.equal(ice.choose(start, "hard"), 1);
  const next = ice.play(start, 1);
  assert.equal(next.winner, 0);
  assert.deepEqual(next.pawns, [1, 2]);
  assert.equal(next.water, water | 1);
  assert.equal(ice.play(next, 5), next);
});

test("treasure keys belong to the picker, are consumed by one chest, and either end may be taken", () => {
  const start = { ...lootOpening(4), deck: ["key", "chest", 2, "chest"], right: 3 };
  assert.equal(loot.play(start, 1), start);
  let next = loot.play(start, 0);
  assert.deepEqual(next.keys, [1, 0]);
  next = loot.play(next, 3);
  assert.deepEqual(next.gold, [1, 2]);
  next = loot.play(next, 1);
  assert.deepEqual(next.keys, [0, 0]);
  assert.deepEqual(next.gold, [11, 2]);
  next = loot.play(next, 2);
  assert.equal(next.winner, 0);
  assert.equal(next.moves, 4);
  assert.equal(loot.play(next, 2), next);
  const tied = loot.play({ ...lootOpening(1), deck: [3], right: 0, gold: [0, 3] }, 0);
  assert.equal(tied.winner, "tie");
  const bait = { ...lootOpening(1), deck: [5, 7, 2, 4], right: 3 };
  assert.equal(loot.choose(bait, "hard"), 3);
});

test("both seeded openings replay and all three AIs legally finish varied matches", () => {
  for (const [rules, opening, limit] of [[ice, iceOpening, 22], [loot, lootOpening, 12]]) {
    for (const seed of [1, 27, 99]) {
      assert.deepEqual(opening(seed), opening(seed));
      for (const level of ["easy", "medium", "hard"]) {
        let state = opening(seed);
        while (state.winner === null) {
          const next = rules.play(state, rules.choose(state, level));
          assert.equal(next.moves, state.moves + 1);
          assert.ok(next.moves <= limit);
          state = next;
        }
        if (rules === loot) assert.equal(state.moves, 12);
        else assert.deepEqual(jumps(state, state.active), []);
      }
    }
  }
});

test("one shared line closes two boxes and keeps the turn", () => {
  let state = boxes.start();
  for (const edge of [0, 1, 3, 4, 12, 14]) state = boxes.play(state, edge);
  const seat = state.active;
  assert.equal(boxes.choose(state, "medium"), 13);
  const next = boxes.play(state, 13);
  assert.equal(next.gained, 2);
  assert.equal(next.active, seat);
  assert.equal(boxScores(next.owners)[seat], 2);
  for (const edge of [13, 24, -1, 2.5]) assert.equal(boxes.play(next, edge), next);
});

test("Mancala sows past the opposite store, captures only across occupied pits, and sweeps the last row", () => {
  const setup = cups => ({ ...mancala.start(), cups });
  const opening = mancala.start();
  assert.equal(mancala.play(opening, 2).again, true);
  for (const pit of [6, 7, -1, 1.2]) assert.equal(mancala.play(opening, pit), opening);
  const lap = mancala.play(setup([15,1,1,1,1,1,0,1,1,1,1,1,1,0]), 0);
  assert.equal(lap.cups[13], 0);
  assert.equal(lap.cups[6], 1);
  assert.equal(lap.landed, 2);
  const before = setup([1,0,0,0,0,1,0,1,0,0,0,4,0,0]);
  const capture = mancala.play(before, 0);
  assert.equal(capture.captured, 5);
  assert.equal(capture.cups[6], 5);
  assert.equal(before.cups[11], 4);
  const empty = mancala.play(setup([1,0,0,0,0,1,0,1,0,0,0,0,0,0]), 0);
  assert.equal(empty.captured, 0);
  assert.equal(empty.cups[1], 1);
  const end = mancala.play(setup([0,0,0,0,0,1,23,4,8,12,0,0,0,0]), 5);
  assert.equal(end.winner, "tie");
  assert.equal(end.again, false);
  assert.deepEqual([end.cups[6], end.cups[13]], [24, 24]);
});

test("all three opponents play both boards to completion and conserve boxes and seeds", () => {
  for (const game of [boxes, mancala]) {
    for (const level of ["easy", "medium", "hard"]) {
      let state = game.start();
      while (state.winner === null) {
        assert.ok(state.moves < 300);
        const next = game.play(state, game.choose(state, level));
        assert.equal(next.moves, state.moves + 1);
        if (game === mancala) assert.equal(next.cups.reduce((a, b) => a + b), 48);
        state = next;
      }
      if (game === boxes) {
        assert.equal(state.moves, 24);
        assert.equal(boxScores(state.owners).reduce((a, b) => a + b), 9);
      } else assert.equal(state.cups[6] + state.cups[13], 48);
      assert.equal(game.play(state, 0), state);
    }
  }
});

test("Reversi brackets in eight directions without wrapping at the edge", () => {
  const board = Array(36).fill(0);
  const center = 14;
  for (const step of [-7, -6, -5, -1, 1, 5, 6, 7]) {
    board[center + step] = 2;
    board[center + 2 * step] = 1;
  }
  assert.equal(captures(board, 0, center).length, 8);
  assert.equal(place({ ...opening(), board }, center).winner, 0);
  const edge = Array(36).fill(0);
  edge[6] = 2; edge[7] = 1;
  assert.deepEqual(captures(edge, 0, 5), []);
  assert.equal(legalMoves(opening().board, 0).length, 4);
});

test("Reversi skips blocked turns and counts the final board even with empty spaces", () => {
  const board = Array(36).fill(1);
  board[0] = board[30] = 0;
  board[1] = board[31] = 2;
  const after = place({ ...opening(), board }, 0);
  assert.equal(after.passed, true);
  assert.equal(after.active, 0);
  assert.equal(after.winner, null);
  assert.equal(place(after, 30).winner, 0);
  const sparse = Array(36).fill(0);
  sparse[0] = 1; sparse[1] = 2;
  assert.equal(place({ ...opening(), board: sparse }, 2).winner, 0);
});

test("each Reversi difficulty makes legal moves through a full match", () => {
  for (const level of ["easy", "medium", "hard"]) {
    let state = opening();
    while (state.winner === null) {
      const before = state;
      const at = reversi.choose(state, level);
      state = place(state, at);
      assert.equal(state.moves, before.moves + 1);
      assert.equal(countDiscs(state.board).reduce((a,b) => a+b), state.moves + 4);
    }
    assert.equal(place(state, 0), state);
  }
});

test("Dice banks only the active pot, a one loses the pot, and the AI secures a winning score", () => {
  const bank = { kind: "bank" };
  const face = value => ({ kind: "roll", face: value });
  let state = diceRace.start();
  assert.equal(diceRace.play(state, bank), state);
  assert.equal(diceRace.play(state, face(7)), state);
  state = diceRace.play(diceRace.play(state, face(5)), bank);
  assert.deepEqual(state.scores, [5,0]);
  state = diceRace.play(diceRace.play(state, face(6)), face(1));
  assert.deepEqual([state.active, state.lost, state.pot], [0,6,0]);
  assert.deepEqual(state.scores, [5,0]);
  state = { ...state, pot: 25 };
  for (const level of ["easy", "medium", "hard"]) assert.deepEqual(diceRace.choose(state, level), bank);
  state = diceRace.play(state, bank);
  assert.equal(state.winner, 0);
  assert.equal(diceRace.play(state, face(6)), state);
});
