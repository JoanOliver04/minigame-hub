import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { opening, captures, countDiscs, legalMoves, place, reversi } = load("games/mini-reversi/logic");
const { diceRace } = load("games/dice-race/logic");

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
