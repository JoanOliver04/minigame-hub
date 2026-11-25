import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const load = createSourceLoader();
const { filterGames } = load("games/filter");
const { sanitizeScores, decodeScoreSnapshot, recordScore } = load("lib/scoreStore");
const { generateRoomCode, normalizeRoomCode, roomCodeFromInvite } = load("lib/rooms/code");

test("surprise draws exhaust the visible selection before repeating and respect a new filter", () => {
  const { drawCatalogueGame } = load("games/surprise");
  let history = null;
  function draw(ids) {
    const pick = drawCatalogueGame(ids, history, () => 0.99);
    history = pick.history;
    return pick.id;
  }
  assert.equal(drawCatalogueGame([], null), null);
  assert.deepEqual(["c", "b", "a"], Array.from({length: 3}, () => draw(["a", "b", "c"])));
  assert.notEqual(draw(["a", "b", "c"]), "a");
  assert.equal(draw(["a", "d"]), "d");
  assert.equal(draw(["a", "d"]), "a");
  assert.equal(draw(["b"]), "b");
});

test("search combines accent-insensitive words with category and multiplayer filters", () => {
  const games = [
    { id: "parchis", category: "strategy", supportsMultiplayer: true },
    { id: "sliding-puzzle", category: "logic", supportsMultiplayer: false },
    { id: "hex-dominion", category: "strategy", supportsMultiplayer: true },
  ];
  const metadata = {
    parchis: { name: "Parchís", description: "Compite en un tablero clásico" },
    "sliding-puzzle": { name: "Rompecabezas", description: "Resuelve el tablero" },
    "hex-dominion": { name: "Dominio hexadecimal", description: "Estrategia para dos" },
  };
  const filter = (query, category = "all", multiplayerOnly = false) =>
    filterGames(games, metadata, { query, category, multiplayerOnly }).map(({ id }) => id);

  assert.deepEqual(filter(" PARCHIS   CLASICO "), ["parchis"]);
  assert.deepEqual(filter("tablero"), ["parchis", "sliding-puzzle"]);
  assert.deepEqual(filter("tablero", "strategy", true), ["parchis"]);
  assert.deepEqual(filter("", "logic", true), []);
  assert.deepEqual(filter("no match"), []);
  assert.deepEqual(filterGames(games, metadata, {
    query: "logica", category: "all", multiplayerOnly: false, categoryNames: { logic: "Lógica" },
  }).map(({ id }) => id), ["sliding-puzzle"]);
});

test("stored scores keep valid tallies and discard damaged counters and unsafe keys", () => {
  const saved = sanitizeScores(JSON.parse(
    '{"guess":{"win":7,"loss":-3,"tie":1.5},"ttt":{"win":1e30,"loss":2,"tie":"4"},"__proto__":{"win":8},"broken":[]}',
  ));
  assert.deepEqual(saved, { guess: { win: 7, loss: 0, tie: 0 }, ttt: { win: 0, loss: 2, tie: 0 } });
  assert.equal(Object.getPrototypeOf(saved), Object.prototype);
  assert.deepEqual(sanitizeScores(null), {});
  assert.deepEqual(sanitizeScores([]), {});
});

test("recording starts from current storage or legacy results and preserves earlier scores", () => {
  const legacy = JSON.stringify({ player: 7, ai: 2 });
  const saved = decodeScoreSnapshot(null, legacy);
  const updated = recordScore(recordScore(saved, "guess", "win"), "ttt", "tie");
  assert.deepEqual(decodeScoreSnapshot(JSON.stringify(updated), legacy), {
    guess: { win: 8, loss: 2, tie: 0 },
    ttt: { win: 0, loss: 0, tie: 1 },
  });
  assert.deepEqual(saved.guess, { win: 7, loss: 2, tie: 0 });
  const largest = { ttt: { win: Number.MAX_SAFE_INTEGER, loss: 0, tie: 0 } };
  assert.equal(recordScore(largest, "ttt", "win").ttt.win, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(decodeScoreSnapshot(null, "damaged"), {});
  assert.deepEqual(decodeScoreSnapshot("{}", legacy), {});
});

test("room links accept canonical codes and reject malformed strings", () => {
  const origin = "https://mini.example";
  assert.equal(roomCodeFromInvite("  k7rxpq ", origin), "K7RXPQ");
  assert.equal(roomCodeFromInvite(origin + "/rooms/k7rxpq/?via=chat", origin), "K7RXPQ");
  for (const url of ["https://other.example/rooms/K7RXPQ", origin + "/games/K7RXPQ", origin + "/rooms/ABC",
    origin + "/rooms/K7RXPQ/another", "https://x@mini.example/rooms/K7RXPQ"]) {
    assert.equal(roomCodeFromInvite(url, origin), null);
  }
  assert.equal(normalizeRoomCode(" k7rxpq "), "K7RXPQ");
  for (const code of ["", "BO25AA", "IX25AA", "AB25A1", "AB25A0", "AB/25A", "AB25", "AB25ABC", "AB 25A"]) {
    assert.equal(normalizeRoomCode(code), null, code);
  }
  for (let i = 0; i < 32; i++) {
    const code = generateRoomCode();
    assert.equal(code.length, 6);
    assert.equal(normalizeRoomCode(code), code);
  }
});
