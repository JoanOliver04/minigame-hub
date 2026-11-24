import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();

test("no-repeat hands constrain both players across all AI levels, including after ties", () => {
  const { createMatch, applyRound, MOVES } = load("games/rps/logic");
  const { aiPickMove } = load("games/rps/ai");
  const { createRng } = load("lib/rng");
  for (const level of ["easy", "medium", "hard"]) {
    const rng = createRng(47);
    let match = applyRound(createMatch(level, 100, true), "rock", "rock");
    for (let i = 0; i < 50; i++) {
      const previous = match.history[0];
      const ai = aiPickMove(match, () => rng.next());
      assert.notEqual(ai, previous.aiMove);
      assert.equal(applyRound(match, previous.playerMove, ai), match);
      const legal = MOVES.filter(move => move !== previous.playerMove);
      match = applyRound(match, legal[rng.int(0, 1)], ai);
      assert.equal(match.rounds, i + 2);
    }
  }
});

test("the code duel settles as soon as the answering turn ends", () => {
  const { signalRoundOutcome } = load("games/signal-breaker/logic");
  assert.equal(signalRoundOutcome(1, true, false), "player");
  assert.equal(signalRoundOutcome(1, false, true), "ai");
  assert.equal(signalRoundOutcome(2, true, true), "tie");
  assert.equal(signalRoundOutcome(7, false, false), null);
  assert.equal(signalRoundOutcome(8, false, false), "tie");
});

test("the quick memory deal contains six distinct pairs and classic sizes keep every pair", () => {
  const { createMemoryMatch } = load("games/memory-match/logic");
  for (const [size, quick, count] of [[4, true, 6], [4, false, 8], [6, false, 18]]) {
    const { tiles } = createMemoryMatch({ size, quick, difficulty: "easy" });
    assert.equal(tiles.length, count * 2);
    const symbols = new Set(tiles.map(tile => tile.value));
    assert.equal(symbols.size, count);
    for (const symbol of symbols) assert.equal(tiles.filter(tile => tile.value === symbol).length, 2);
  }
});

test("Hex traces an adjacent chain between the actual scoring edges for each player", () => {
  const { winningPath, hexIndex, createHexState, neighbours } = load("games/hex-dominion/logic");
  for (const owner of ["player", "ai"]) {
    const board = createHexState().board;
    const cells = [[2,0],[2,1],[1,2],[2,2],[2,3],[3,3],[3,4],[2,5],[2,6]];
    for (const [r, c] of cells) board[owner === "player" ? hexIndex(r, c) : hexIndex(c, r)] = owner;
    const trace = winningPath(board, owner);
    assert.equal(trace[0], owner === "player" ? hexIndex(2, 0) : hexIndex(0, 2));
    assert.equal(trace.at(-1), owner === "player" ? hexIndex(2, 6) : hexIndex(6, 2));
    trace.forEach((cell, i) => {
      assert.equal(board[cell], owner);
      if (i) assert.ok(neighbours(trace[i - 1]).includes(cell));
    });
    board[trace.at(-1)] = null;
    assert.deepEqual(winningPath(board, owner), []);
  }
});

test("Blackjack coaching counts legal hidden cards and never busts a soft hand", () => {
  const { bustPercent } = load("games/blackjack/hints");
  const { createStandardDeck } = load("lib/cards");
  const deck = createStandardDeck();
  const [ace, two] = deck;
  assert.equal(bustPercent([ace, deck[7]], two), 0);
  assert.equal(bustPercent([deck[9], deck[10]], two), 92);
  // The exposed ace and the dealer's check exclude a ten-valued hole card.
  assert.equal(bustPercent([deck[9], deck[10]], ace), 94);
});

test("landing exactly on Start pays once and hands the dice to the other player", () => {
  const { createBaronGame, rollBaronTurn, START_BONUS } = load("games/property-baron/logic");
  const state = createBaronGame(["player", "ai"]);
  state.players.player.position = 12;
  const next = rollBaronTurn(state, "player", [2, 2]);
  assert.equal(next.players.player.position, 0);
  assert.equal(next.players.player.money, state.players.player.money + START_BONUS);
  assert.equal(next.phase, "roll");
  assert.equal(next.turn, "ai");
});

test("the sprint preview stops before a wall or an occupied second cell", () => {
  const { moveDestination } = load("games/shadow-protocol/logic");
  const state = { width: 4, height: 1, tiles: ["floor","floor","floor","floor"], player: { x: 0, y: 0 }, guards: [] };
  assert.deepEqual(moveDestination(state, "e", true), { x: 2, y: 0 });
  state.guards.push({ pos: { x: 2, y: 0 } });
  assert.deepEqual(moveDestination(state, "e", true), { x: 1, y: 0 });
  state.tiles[1] = "wall";
  assert.equal(moveDestination(state, "e", false), null);
});
