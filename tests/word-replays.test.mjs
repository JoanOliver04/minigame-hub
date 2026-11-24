import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { drawWord, WORD_CATEGORIES, wordsForDifficulty } = load("games/word-guess/words");
const { applyGuess, createWordGuessState, guessError } = load("games/word-guess/logic");

test("every word pool plays through once and starts the next cycle with a different word", () => {
  for (const lang of ["en", "es"]) {
    for (const category of WORD_CATEGORIES) {
      for (const difficulty of ["easy", "medium", "hard"]) {
        const pool = wordsForDifficulty(category, difficulty, lang);
        const draws = [];
        let history = "obsolete";
        for (let i = 0; i <= pool.length; i++) {
          const next = drawWord(pool, history, () => 0.99);
          history = next.history;
          draws.push(next.word);
        }
        assert.deepEqual(new Set(draws.slice(0, -1)), new Set(pool));
        assert.notEqual(draws.at(-1), draws.at(-2));
      }
    }
  }
});

test("only public clues restrict guesses, accent variants work, and a rejected guess costs nothing", () => {
  const board = createWordGuessState({ category: "countries", difficulty: "medium", lang: "es" }, "ESPAÑA");
  const seen = applyGuess(board, "player", "letter", "a");
  assert.equal(guessError(seen, "word", "pan"), "length");
  assert.equal(guessError(seen, "word", "ALPACÁ"), "clues");
  assert.equal(applyGuess(seen, "player", "word", "ALPACÁ"), seen);
  assert.equal(guessError(seen, "word", "ESTACA"), "");
  assert.equal(applyGuess(seen, "player", "word", "ESTACA").playerMistakes, 2);
  assert.equal(applyGuess(seen, "player", "word", "Espan\u0303a").winner, "player");
  const missed = applyGuess(board, "player", "letter", "z");
  assert.equal(guessError(missed, "word", "ZORROS"), "clues");
  assert.equal(guessError({ ...missed, guessedLetters: [...missed.guessedLetters], revealedLetters: [] }, "word", "ZORROS"), "clues");
});
