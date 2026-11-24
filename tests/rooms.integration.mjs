import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createSourceLoader } from "./load-typescript.mjs";

const requirePackage = createRequire(import.meta.url);
const { initializeApp, deleteApp } = requirePackage("firebase/app");
const { connectAuthEmulator, getAuth, signInAnonymously } = requirePackage("firebase/auth");
const { connectFirestoreEmulator, collection, deleteDoc, doc, getDocFromServer, getDocsFromServer,
  getFirestore, serverTimestamp, setDoc, Timestamp, updateDoc } = requirePackage("firebase/firestore");

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080", "Run with firebase emulators:exec");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099", "Run with Firebase Auth emulated");

async function client(name, cleanup, signedIn = true) {
  const app = initializeApp({ apiKey: "demo-key", projectId: "demo-minigame-hub" }, name);
  cleanup.after(() => deleteApp(app));
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const uid = signedIn ? (await signInAnonymously(auth)).user.uid : null;
  const load = createSourceLoader({
    "@/lib/firebase/client": { getDb: () => db },
    "next/dynamic": { default: () => () => null },
  });
  return { uid, db, api: load("lib/rooms/roomsApi"), ttt: load("games/ttt/room"), load };
}

test("room transactions enforce seats and turns through a match, rematch and close", { timeout: 45_000 }, async (t) => {
  const host = await client("host", t);
  const guest = await client("guest", t);
  const visitor = await client("visitor", t);
  const anonymous = await client("anonymous", t, false);
  const denied = { code: "permission-denied" };
  const code = await host.api.createRoom("connect-four", host.uid, "Host", () => ({ turn: null }));
  const hostRef = doc(host.db, "rooms", code);
  const guestRef = doc(guest.db, "rooms", code);
  const read = async () => (await getDocFromServer(hostRef)).data();

  await assert.rejects(getDocFromServer(doc(anonymous.db, "rooms", code)), denied);
  await assert.rejects(getDocsFromServer(collection(host.db, "rooms")), denied);
  await assert.rejects(deleteDoc(doc(visitor.db, "rooms", code)), denied);

  const room = await read();
  await assert.rejects(setDoc(doc(host.db, "rooms", "AB2345"), {
    ...room, code: "AB2345", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400_000),
  }), denied);
  await assert.rejects(updateDoc(guestRef, {
    status: "playing", updatedAt: serverTimestamp(),
    [`players.${guest.uid}`]: { uid: guest.uid, name: "Guest", role: "guest", joinedAt: Timestamp.now() },
    [`players.${host.uid}.name`]: "Changed host name",
  }), denied);

  await host.api.switchRoomGame(code, host.uid, "ttt", { target: "1" },
    host.ttt.createInitialTttRoomGame, host.ttt.seedTttRoomGame);
  const join = () => guest.api.joinRoom(code, guest.uid, "Guest", (gameId) => {
    assert.equal(gameId, "ttt");
    return guest.ttt.seedTttRoomGame;
  });
  await join();
  await join();

  const joined = await read();
  assert.equal(joined.gameRevision, 1);
  assert.equal(joined.game.target, 1);
  assert.deepEqual(Object.keys(joined.players).sort(), [host.uid, guest.uid].sort());
  await guest.api.runRoomUpdate(code, "connect-four", () => assert.fail("Stale game mutation reached the new board"));
  const oldReaction = host.load("games/reaction-time/room");
  await oldReaction.submitReaction(code, host.uid, { reactionMs: 180, falseStart: false });
  assert.equal((await read()).game.pending, undefined);

  await host.ttt.submitTttMove(code, host.uid, { from: null, to: 0 });
  assert.equal((await read()).game.turn, guest.uid);
  await assert.rejects(updateDoc(hostRef, { "game.board": Array(9).fill(null), updatedAt: serverTimestamp() }), denied);

  await guest.ttt.submitTttMove(code, guest.uid, { from: null, to: 3 });
  await host.ttt.submitTttMove(code, host.uid, { from: null, to: 1 });
  await guest.ttt.submitTttMove(code, guest.uid, { from: null, to: 4 });
  await host.ttt.submitTttMove(code, host.uid, { from: null, to: 2 });
  const finished = await read();
  assert.equal(finished.status, "finished");
  assert.equal(finished.game.lastOutcome.winner, "X");

  await guest.api.voteRematch(code, guest.uid);
  await guest.ttt.resetTttRoomForRematch(code);
  assert.equal((await read()).status, "finished");
  await host.api.voteRematch(code, host.uid);
  await host.ttt.resetTttRoomForRematch(code);
  const restarted = await read();
  assert.equal(restarted.status, "playing");
  assert.deepEqual(restarted.game.board, Array(9).fill(null));
  assert.deepEqual(restarted.rematchVotes, {});
  await guest.api.leaveRoom(code);
  assert.equal((await getDocFromServer(hostRef)).exists(), false);
});

test("every multiplayer game's configured state can be created and joined", { timeout: 120_000 }, async (t) => {
  const host = await client("catalogue-host", t);
  const guest = await client("catalogue-guest", t);
  const { ROOM_GAMES } = host.load("games/roomRegistry");
  const { GAMES } = host.load("games/registry");
  assert.deepEqual(Object.keys(ROOM_GAMES).sort(), GAMES.filter((game) => game.supportsMultiplayer).map((game) => game.id).sort());

  for (const [id, config] of Object.entries(ROOM_GAMES)) {
    await t.test(id, async () => {
      const settings = config.defaultSettings ?? {};
      const logic = await config.loadLogic();
      const code = await host.api.createRoom(id, host.uid, "Host", () => logic.createInitialGame(settings), settings);
      const read = async () => (await getDocFromServer(doc(host.db, "rooms", code))).data();
      try {
        assert.equal((await read()).status, "waiting");
        await guest.api.joinRoom(code, guest.uid, "Guest", (gameId) => {
          assert.equal(gameId, id);
          return logic.seedGame;
        });
        const room = await read();
        assert.equal(room.status, "playing");
        assert.equal(room.gameId, id);
        assert.deepEqual(Object.keys(room.players).sort(), [host.uid, guest.uid].sort());
        assert.equal(typeof room.game, "object");
        if (id === "word-guess") {
          const words = host.load("games/word-guess/room");
          await words.submitWordGuess(code, host.uid, "word", "A");
          assert.deepEqual((await read()).game, room.game);
          await words.submitWordGuess(code, host.uid, "word", room.game.word);
          const finished = await read();
          assert.equal(finished.status, "finished");
          assert.equal(finished.game.winner, "player");
        }
        if (id === "reaction-time") {
          const reaction = host.load("games/reaction-time/room");
          await reaction.submitReaction(code, host.uid, { reactionMs: 180, falseStart: false });
          assert.equal((await read()).game.pending[host.uid].reactionMs, 180);
        }
        if (id === "diceforge-arena") {
          const hostForge = host.load("games/diceforge-arena/room");
          const guestForge = guest.load("games/diceforge-arena/room");
          await hostForge.lockAndReroll(code, host.uid, 3);
          assert.equal((await read()).game.locked[host.uid], null);
          await hostForge.lockAndReroll(code, host.uid, 0);
          await guestForge.lockAndReroll(code, guest.uid, 0);
          assert.equal((await read()).game.stage, "shop");
          await hostForge.skipForgeShop(code, host.uid);
          await guestForge.skipForgeShop(code, guest.uid);
          assert.equal((await read()).game.round, 2);
        }
      } finally {
        await host.api.leaveRoom(code);
      }
    });
  }
});
