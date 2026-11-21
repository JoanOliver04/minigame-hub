import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { createRng } = load("lib/rng");
const card = (rank, suit = "hearts") => ({ id: `${suit}-${rank}`, rank, suit });

test("Number Duel chooses a split with the best alternating-play value", () => {
  const { aiPickGuess } = load("games/guess/ai");
  const wins = [0];
  for (let size = 1; size <= 31; size++) {
    const range = { knownLow: 101, knownHigh: 100 + size, aiGuessed: [], config: { difficulty: "hard" } };
    const choice = aiPickGuess(range) - range.knownLow;
    const values = Array.from({ length: size }, (_, left) => size - wins[left] - wins[size - left - 1]);
    wins[size] = Math.max(...values);
    assert.equal(values[choice], wins[size], `interval ${size}`);
  }
});

test("RPS adapts to repeated public moves and maintains valid openings", () => {
  const { aiPickMove } = load("games/rps/ai");
  const { createMatch, applyRound, MOVES } = load("games/rps/logic");
  let state = createMatch("hard", 20);
  const random = createRng(42).next;
  assert.ok(MOVES.includes(aiPickMove(state, random)));
  for (let round = 0; round < 6; round++) state = applyRound(state, "rock", "scissors");
  assert.equal(aiPickMove(state, () => 0.65), "paper");
});

test("Higher or Lower avoids impossible extreme-rank guesses and uses Same when supported", () => {
  const { aiPickPrediction } = load("games/higher-or-lower/ai");
  assert.equal(aiPickPrediction(card(1), [card(2)], { difficulty: "easy", aceHigh: false, allowSame: false }), "higher");
  assert.equal(aiPickPrediction(card(1), [card(13)], { difficulty: "easy", aceHigh: true, allowSame: false }), "lower");
  for (const difficulty of ["medium", "hard"]) {
    assert.equal(aiPickPrediction(card(7), [card(7, "clubs")], { difficulty, aceHigh: false, allowSame: true }), "same");
  }
});

test("Memory Match reinforces repeated reveals and drops solved positions", () => {
  const { createAIMemoryStore, observeTile, removeSolvedFromMemory } = load("games/memory-match/ai");
  const forgotten = observeTile(createAIMemoryStore(), 3, "moon", "medium", () => 0.7);
  assert.equal(forgotten.knownTiles[3], undefined);
  const retained = observeTile(forgotten, 3, "moon", "medium", () => 0.7);
  assert.equal(retained.knownTiles[3], "moon");
  const cleared = removeSolvedFromMemory(retained, [3]);
  assert.equal(cleared.knownTiles[3], undefined);
  assert.equal(cleared.exposures[3], undefined);
});

test("Word Guess ranks all revealed positions, even when letters have equal hit frequency", () => {
  const { pickInformationLetter } = load("games/word-guess/ai");
  assert.equal(pickInformationLetter(["ABED", "BAED", "BDEA"], ["E", "A"]), "A");
});

test("Blackjack coaching chooses a valid action using only the visible hand", () => {
  const { suggestAction } = load("games/blackjack/hints");
  assert.equal(suggestAction([card(10), card(10, "clubs")], card(1)), "stand");
  assert.equal(suggestAction([card(4), card(6)], card(6, "diamonds")), "hit");
  assert.equal(suggestAction([card(1), card(6)], card(9)), "hit");
});

test("Fleet Command extends a revealed ship without targeting an occupied or missed cell", () => {
  const { aiPickShot } = load("games/fleet-command/ai");
  const cells = Array(64).fill("unknown");
  cells[18] = "hit";
  cells[19] = "hit";
  cells[17] = "miss";
  const intel = { cells, remainingShipLengths: [3], sonar: null };
  assert.equal(aiPickShot(intel, "hard", createRng(71)), 20);
});

test("Diceforge makes productive upgrades and saves coins when there is no round left", () => {
  const { choosePurchase, chooseLock } = load("games/diceforge-arena/ai");
  const { createFighter } = load("games/diceforge-arena/logic");
  const fighter = { ...createFighter(), coins: 9 };
  const opponent = { health: 7, shield: 2 };
  const offers = [{ id: "strong", cost: 4, face: { kind: "damage", value: 3 } }];
  const upgraded = choosePurchase(fighter, offers, "hard", createRng(1), opponent, 5);
  assert.equal(upgraded.coins, 5);
  assert.ok(upgraded.dice.flat().some((face) => face.kind === "damage" && face.value === 3));
  assert.equal(choosePurchase(fighter, offers, "hard", createRng(1), opponent, 0), fighter);
  assert.ok([0, 1, 2].includes(chooseLock(fighter, [0, 1, 2], "hard", createRng(1), opponent)));
});

test("Signal Breaker setter maximizes the surviving partition from a historical opener", () => {
  const { aiPickSecret } = load("games/signal-breaker/ai");
  const { allCodes, feedbackEqual, scoreGuess, codeEqual } = load("games/signal-breaker/logic");
  const opener = [0, 1, 2, 3];
  const secret = aiPickSecret([opener], "hard", false, createRng(2));
  assert.equal(codeEqual(secret, opener), false);
  const possibilities = allCodes(false);
  const bucket = (code) => possibilities.filter((candidate) =>
    feedbackEqual(scoreGuess(code, opener), scoreGuess(candidate, opener))).length;
  assert.equal(bucket(secret), Math.max(...possibilities.map(bucket)));
});
