import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { dailyBoard, localDay, readBest, betterResult, readDailyRun } = load("games/sliding-puzzle/daily");
const { arrowTarget, canMoveTile, createSlidingPuzzle, moveSlidingTile, shortestSmallPuzzle, suggestSlidingTile } = load("games/sliding-puzzle/logic");
const { isPlayableBoard, readFreeRun } = load("games/sliding-puzzle/savedPuzzle");

test("free saves validate reachable boards of every size and recover separately from invalid undo data", () => {
  for (const size of [3, 4, 5]) {
    const board = createSlidingPuzzle(size, () => 0.37);
    const index = board.tiles.findIndex((_, i) => canMoveTile(board, i) && !moveSlidingTile(board, i).solved);
    const game = moveSlidingTile(board, index);
    const run = { game, undoIndex: board.emptyIndex, elapsedMs: 1234 };
    assert.deepEqual(readFreeRun(JSON.stringify(run)), run);
    assert.equal(readFreeRun(JSON.stringify({ ...run, undoIndex: game.emptyIndex })).undoIndex, null);
    assert.equal(readFreeRun(JSON.stringify({ ...run, elapsedMs: -1 })), null);
    const tiles = [...game.tiles];
    const a = tiles.indexOf(1), b = tiles.indexOf(2);
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    assert.equal(isPlayableBoard({ ...game, tiles }), false);
  }
  for (const raw of [null, "bad", "{}", "null"]) assert.equal(readFreeRun(raw), null);
});

test("dates use local calendar boundaries and reproduce the same legal starting board", () => {
  assert.equal(localDay(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
  assert.equal(localDay(new Date(2027, 0, 1, 0, 0)), "2027-01-01");
  const boards = new Set();
  for (let i = 1; i <= 28; i++) {
    const day = localDay(new Date(2026, 1, i));
    const game = dailyBoard(day);
    assert.deepEqual(game, dailyBoard(day));
    assert.ok(readDailyRun(JSON.stringify({ day, game, startedAt: 1 }), day));
    boards.add(game.tiles.join(""));
  }
  assert.equal(boards.size, 28);
});

test("optimal hints solve a diameter-31 board in exactly 31 legal slides without mutating input", () => {
  const tiles = [8, 6, 7, 2, 5, 4, 3, 0, 1];
  let game = { size: 3, tiles, emptyIndex: 7, moves: 0, solved: false };
  for (let distance = 31; distance > 0; distance--) {
    assert.equal(shortestSmallPuzzle(game).moves, distance);
    const index = suggestSlidingTile(game);
    assert.ok(canMoveTile(game, index));
    game = moveSlidingTile(game, index);
  }
  assert.ok(game.solved);
  assert.deepEqual(tiles, [8, 6, 7, 2, 5, 4, 3, 0, 1]);
  assert.equal(suggestSlidingTile(game), null);
});

test("arrow controls cannot wrap across an edge", () => {
  const state = { size: 3, emptyIndex: 3 };
  assert.equal(arrowTarget(state, "ArrowLeft"), null);
  assert.equal(arrowTarget(state, "ArrowRight"), 4);
  assert.equal(arrowTarget(state, "ArrowUp"), 0);
  assert.equal(arrowTarget(state, "ArrowDown"), 6);
  assert.equal(arrowTarget(state, "Tab"), null);
});

test("a saved daily run must be unsolved, reachable, and belong to this date", () => {
  const day = "2026-11-24";
  const game = dailyBoard(day);
  const saved = { day, game, startedAt: 10 };
  assert.deepEqual(readDailyRun(JSON.stringify(saved), day), saved);
  assert.equal(readDailyRun(JSON.stringify(saved), "2026-11-25"), null);
  for (const tiles of [[1, 1], [2, 1, 3, 4, 5, 6, 7, 8, 0], [1, 2, 3, 4, 5, 6, 7, 8, 0]]) {
    assert.equal(readDailyRun(JSON.stringify({ ...saved, game: { ...game, tiles, emptyIndex: 8 } }), day), null);
  }
  assert.equal(readDailyRun("bad", day), null);
});

test("personal best ranks moves first and elapsed time second", () => {
  const best = { moves: 21, seconds: 35 };
  assert.deepEqual(readBest(JSON.stringify(best)), best);
  for (const raw of ["null", "bad", '{"moves":0,"seconds":5}', '{"moves":12,"seconds":-1}']) assert.equal(readBest(raw), null);
  assert.equal(betterResult(null, best), best);
  assert.equal(betterResult(best, { moves: 22, seconds: 1 }), best);
  assert.equal(betterResult(best, { moves: 21, seconds: 40 }), best);
  assert.deepEqual(betterResult(best, { moves: 20, seconds: 90 }), { moves: 20, seconds: 90 });
  assert.deepEqual(betterResult(best, { moves: 21, seconds: 34 }), { moves: 21, seconds: 34 });
});
