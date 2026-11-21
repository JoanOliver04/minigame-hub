import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { createRng } = load("lib/rng");

test("Tic-Tac-Toe spots a three-mark sliding win in either orientation", () => {
  const { aiPickMove } = load("games/ttt/ai");
  const board = ["O", "O", null, "X", "X", null, null, "X", "O"];
  assert.deepEqual(aiPickMove(board, "hard"), { from: 8, to: 2 });
  const mirrored = [2, 1, 0, 5, 4, 3, 8, 7, 6].map((index) => board[index]);
  assert.deepEqual(aiPickMove(mirrored, "hard"), { from: 6, to: 0 });
});

test("Connect Four wins before blocking and otherwise stops a one-move loss", () => {
  const game = load("games/connect-four/logic");
  const { aiPickColumn } = load("games/connect-four/ai");
  let board = game.createBoard();
  for (const column of [0, 1, 2]) board = game.dropPiece(board, column, game.PLAYER_PIECE).board;
  assert.equal(aiPickColumn(board, "hard"), 3);
  for (const column of [4, 5, 6]) board = game.dropPiece(board, column, game.AI_PIECE).board;
  const move = aiPickColumn(board, "hard");
  assert.equal(game.checkBoardOutcome(game.dropPiece(board, move, game.AI_PIECE).board).winner, game.AI_PIECE);
});

test("Nim keeps the exact winning play and reduces winning replies when behind", () => {
  const { aiPickMove, nimSum } = load("games/nim/ai");
  const winning = aiPickMove([3, 4, 5], "normal", "hard");
  assert.equal(nimSum([3, 4, 5].map((count, index) => index === winning.pileIndex ? winning.newSize : count)), 0);
  assert.deepEqual(aiPickMove([2, 3, 1], "normal", "hard"), { pileIndex: 0, newSize: 1 });
  assert.deepEqual(aiPickMove([0, 2, 0], "misere", "hard"), { pileIndex: 1, newSize: 1 });
});

test("Hex prioritizes connecting both edges over clustering locally", () => {
  const { createHexState } = load("games/hex-dominion/logic");
  const { chooseHexMove, connectionCost } = load("games/hex-dominion/ai");
  const { board } = createHexState();
  for (const index of [3, 10, 17, 31, 38]) board[index] = "ai";
  board[45] = "player";
  assert.equal(connectionCost(board, "ai"), 2);
  const move = chooseHexMove(board, "medium", createRng(18));
  assert.equal(board[move], null);
  board[move] = "ai";
  assert.equal(connectionCost(board, "ai"), 1);
});

test("Domino takes the side that leaves a playable follow-up", () => {
  const { createDominoGame } = load("games/domino/logic");
  const { playDominoAiTurn } = load("games/domino/ai");
  const tile = (a, b) => ({ id: `${a}-${b}`, a, b });
  const state = {
    ...createDominoGame(["ai", "player"]),
    leftValue: 4,
    rightValue: 6,
    board: [{ ...tile(1, 4), left: 4, right: 1 }, { ...tile(1, 6), left: 1, right: 6 }],
    hands: { ai: [tile(4, 6), tile(0, 4)], player: [tile(4, 4), tile(2, 5), tile(0, 0)] },
  };
  const next = playDominoAiTurn(state, "ai", "hard");
  assert.equal(next.lastAction.tile.id, "4-6");
  assert.equal(next.lastAction.side, "right");
  assert.deepEqual([next.leftValue, next.rightValue], [4, 4]);
});

test("Tile Rummy preserves a legal combination for the following turn", () => {
  const { canPlayAnyMeld, createTileRummyGame } = load("games/tile-rummy/logic");
  const { playTileRummyAiTurn } = load("games/tile-rummy/ai");
  const tile = (color, value) => ({ id: `${color}-${value}-1`, color, value, joker: false });
  const state = createTileRummyGame(["ai", "player"]);
  state.hands.ai = [10, 11, 12, 13].map((n) => tile("ruby", n))
    .concat(tile("leaf", 10), tile("sky", 10), tile("leaf", 13), tile("sky", 13));
  state.opened.ai = true;
  const next = playTileRummyAiTurn(state, "ai", "hard");
  assert.equal(next.table[0].tiles.length, 3);
  assert.ok(canPlayAnyMeld(next, "ai"));
});

test("Prism Clash uses a freeze to close a round on its extra turn", () => {
  const { choosePrismAiMove } = load("games/prism-clash/ai");
  const { createPrismGame, playPrismCard } = load("games/prism-clash/logic");
  const state = createPrismGame(["ai", "player"], 1);
  state.hands.ai = [{ id: "freeze", kind: "freeze", color: "ember" }, { id: "draw", kind: "draw2", color: "ember" }];
  state.hands.player = state.hands.player.slice(0, 3);
  state.discardPile = [{ id: "top", kind: "number", value: 7, color: "ember" }];
  state.activeColor = "ember";
  const move = choosePrismAiMove(state, "ai", "hard");
  assert.equal(move.cardIndex, 0);
  const next = playPrismCard(state, "ai", move.cardIndex, move.color);
  assert.equal(next.turn, "ai");
  const finish = choosePrismAiMove(next, "ai", "hard");
  assert.equal(playPrismCard(next, "ai", finish.cardIndex, finish.color).winner, "ai");
});

test("Parchís accounts for the rival entering the private home lane", () => {
  const { createParchisGame, legalParchisMoves, rollParchisDie } = load("games/parchis/logic");
  const { chooseParchisMove } = load("games/parchis/ai");
  const state = createParchisGame(["ai", "player"]);
  state.pieces.ai[0].progress = 34;
  state.pieces.ai[1].progress = 27;
  state.pieces.player[0].progress = 66;
  const rolled = rollParchisDie(state, "ai", 3);
  assert.deepEqual(legalParchisMoves(rolled, "ai"), [0, 1]);
  assert.equal(chooseParchisMove(rolled, "ai", "hard"), 0);
});

test("Game of the Goose keeps a goose jump that reaches the finish", (context) => {
  const { createGooseGame, previewGooseLanding } = load("games/goose-game/logic");
  const { shouldGooseAiReroll } = load("games/goose-game/ai");
  const state = createGooseGame(["ai", "player"]);
  state.positions.ai = 57;
  state.die = 2;
  assert.equal(previewGooseLanding(state, "ai", state.die).destination, 63);
  context.mock.method(Math, "random", () => 0);
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(shouldGooseAiReroll(state, "ai", difficulty), false);
  }
});

test("Property Baron will not spend the reserve needed for a reachable rival property", () => {
  const { createBaronGame } = load("games/property-baron/logic");
  const { chooseBaronAiDecision } = load("games/property-baron/ai");
  const state = createBaronGame(["ai", "player"]);
  state.players.ai = { ...state.players.ai, money: 420, position: 1 };
  state.pendingTile = 1;
  state.phase = "decision";
  assert.equal(chooseBaronAiDecision(state, "hard"), "buy");
  state.properties[11] = { owner: "player", level: 2 };
  assert.equal(chooseBaronAiDecision(state, "hard"), "pass");
});
