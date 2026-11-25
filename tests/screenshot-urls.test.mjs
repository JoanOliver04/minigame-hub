import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const imageRoot = new URL("../docs/screenshots/", import.meta.url);

// Cached pages and shared links still request these names after a gallery refresh.
const originalPng = [
  "basket-challenge-play", "blackjack-play", "connect-four-play", "create-room",
  "higher-or-lower-play", "home-hub", "join-room", "memory-match-play", "number-duel-play",
  "number-duel-setup", "number-duel-win", "penalty-shootout-play", "rps-play",
  "session-scoreboard", "tic-tac-toe-setup", "windline-archery-play", "word-guess-play",
];
const publishedInBothFormats = [
  "01-library", "02-favorites", "03-pocket-curling", "04-mancala", "05-continue-playing",
  "06-match-review", "07-connect-four", "08-scoreboard", "09-ice-floe", "10-pirate-loot",
  "11-dots-boxes", "12-mini-reversi", "13-hex-dominion", "14-diceforge-arena",
  "15-windline-archery", "16-fleet-command", "17-tile-rummy", "18-invite-a-friend",
  "19-join-on-mobile", "20-daily-puzzle", "21-mobile-treasure", "22-friends-match",
];

test("previously published screenshot URLs still resolve to image files", async () => {
  const files = [
    ...originalPng.map((name) => name + ".png"),
    ...publishedInBothFormats.flatMap((name) => [name + ".png", name + ".webp"]),
  ];
  for (const file of files) {
    const data = await readFile(new URL(file, imageRoot));
    if (file.endsWith(".png")) {
      assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", file);
      assert.ok(data.readUInt32BE(16) > 0 && data.readUInt32BE(20) > 0, file);
    } else {
      assert.equal(data.toString("ascii", 0, 4), "RIFF", file);
      assert.equal(data.toString("ascii", 8, 12), "WEBP", file);
    }
  }
});
