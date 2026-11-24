import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { opening, captures, countDiscs, legalMoves, place, reversi } = load("games/mini-reversi/logic");
const { diceRace } = load("games/dice-race/logic");
const { boxes, boxScores } = load("games/dots-boxes/logic");
const { mancala } = load("games/mancala/logic");

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
