"use client";

/**
 * Spellstorm room hook — a live 75s typing duel. This client owns its own mage:
 * it applies the words it types (energy/combo) and the spells the opponent has
 * cast at it (damage/slow), mirroring the result into Firestore for the
 * opponent's HUD. Casting writes a spell event the opponent consumes once. Both
 * clients build the same word deck from the shared seed. Reuses the pure mage
 * rules (createMage/completeWord/registerTypo/dealDamage) and does NOT record
 * to ScoresContext — same as the other room hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { createRng } from "@/lib/rng";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { completeWord, createMage, dealDamage, registerTypo } from "./logic";
import { createWordDeck, normalizeWord } from "./words";
import type { Mage, Spell, StormWord } from "./types";
import { MATCH_SECONDS, SPELL_COST } from "./types";
import {
  finishStorm,
  pushCast,
  pushMage,
  resetStormRoomForRematch,
  resolveStormIfReady,
  type StormRoomGame,
} from "./room";

const SLOW_PAUSE_MS = 900;

export type StormRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseStormRoomResult {
  uid: string | null;
  room: RoomDoc<StormRoomGame> | null;
  stage: StormRoomStage;
  myMage: Mage;
  opponentMage: Mage;
  word: StormWord | null;
  input: string;
  remaining: number;
  paused: boolean;
  lastSpell: { actor: "you" | "them"; spell: Spell } | null;
  type: (value: string) => void;
  cast: (spell: Spell) => void;
  playAgain: () => void;
  leave: () => void;
}

const EMPTY_MAGE = createMage();

export function useStormRoom(code: string): UseStormRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<StormRoomGame> | null>(null);
  const [stage, setStage] = useState<StormRoomStage>("connecting");
  const [myMage, setMyMage] = useState<Mage>(EMPTY_MAGE);
  const [word, setWord] = useState<StormWord | null>(null);
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState(MATCH_SECONDS);
  const [paused, setPaused] = useState(false);
  const [lastSpell, setLastSpell] = useState<{ actor: "you" | "them"; spell: Spell } | null>(null);

  const uidRef = useRef<string | null>(null);
  const codeRef = useRef(code);
  const mageRef = useRef<Mage>(EMPTY_MAGE);
  const deckRef = useRef<StormWord[]>([]);
  const indexRef = useRef(0);
  const appliedRef = useRef<Set<number>>(new Set());
  const spellIdRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const typoActiveRef = useRef(false);
  const seededRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const endsAtRef = useRef(0);
  const resolvingRef = useRef(false);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        uidRef.current = user.uid;
        unsubscribe = subscribeRoom<StormRoomGame>(
          code,
          (d) => {
            setRoom(d);
            if (!d) return setStage("gone");
            if (isRoomExpired(d)) return setStage("expired");
            if (d.status === "abandoned") return setStage("gone");
            setStage(d.status);
          },
          () => setStage("error"),
        );
      })
      .catch(() => setStage("error"));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [code]);

  const applyMage = useCallback((next: Mage) => {
    mageRef.current = next;
    setMyMage(next);
  }, []);

  const finishMe = useCallback(() => {
    if (doneRef.current || !uidRef.current) return;
    doneRef.current = true;
    finishStorm(codeRef.current, uidRef.current, mageRef.current).catch((e) =>
      console.warn("finishStorm", e),
    );
  }, []);

  // Build the deck + reset local mage once per match (new seed = rematch).
  useEffect(() => {
    if (!room || room.status !== "playing" || !uid) return;
    const g = room.game;
    if (seededRef.current === g.seed) return;
    seededRef.current = g.seed;
    deckRef.current = createWordDeck(g.lang, createRng(g.seed));
    indexRef.current = 0;
    appliedRef.current = new Set();
    spellIdRef.current = 0;
    pauseUntilRef.current = 0;
    typoActiveRef.current = false;
    doneRef.current = false;
    endsAtRef.current = g.endsAt;
    applyMage(createMage());
    setInput("");
    setLastSpell(null);
    setWord(deckRef.current[0] ?? null);
  }, [room, uid, applyMage]);

  // Apply the opponent's not-yet-seen spell events to my own mage.
  useEffect(() => {
    if (!room || room.status !== "playing" || !uid || doneRef.current) return;
    const opponentUid = Object.keys(room.game.spells).find((id) => id !== uid);
    if (!opponentUid) return;
    const events = room.game.spells[opponentUid] ?? [];
    let changed = false;
    let next = mageRef.current;
    for (const ev of events) {
      if (appliedRef.current.has(ev.id)) continue;
      appliedRef.current.add(ev.id);
      changed = true;
      if (ev.spell === "fire") next = dealDamage(next, 18);
      else if (ev.spell === "ice") next = { ...next, slowed: true };
      setLastSpell({ actor: "them", spell: ev.spell });
    }
    if (changed) {
      applyMage(next);
      pushMage(codeRef.current, uid, next).catch((e) => console.warn("pushMage", e));
      if (next.health <= 0) finishMe();
    }
  }, [room, uid, applyMage, finishMe]);

  // Countdown clock: finish this bout when the shared timer expires.
  useEffect(() => {
    if (stage !== "playing") return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setRemaining(secs);
      setPaused(pauseUntilRef.current > Date.now());
      if (secs <= 0) finishMe();
    }, 100);
    return () => clearInterval(interval);
  }, [stage, finishMe]);

  // Resolve the match once both bouts are done.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const ids = Object.keys(room.game.done);
    if (ids.length !== 2 || !ids.every((id) => room.game.done[id])) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    resolveStormIfReady(code)
      .catch((e) => console.warn("resolveStormIfReady", e))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [room, code]);

  const type = useCallback(
    (value: string) => {
      if (!uid || doneRef.current || Date.now() < pauseUntilRef.current) return;
      const deck = deckRef.current;
      const current = deck[indexRef.current % deck.length];
      if (!current) return;
      const normalized = normalizeWord(value);
      const validPrefix = current.normalized.startsWith(normalized);

      if (!validPrefix && !typoActiveRef.current && value.length > input.length) {
        const next = registerTypo(mageRef.current);
        applyMage(next);
        pushMage(codeRef.current, uid, next).catch((e) => console.warn("pushMage", e));
        typoActiveRef.current = true;
      }
      if (validPrefix) typoActiveRef.current = false;
      setInput(value);
      if (normalized !== current.normalized) return;

      // Word complete.
      let next = completeWord(mageRef.current, current.normalized.length);
      const slowed = next.slowed;
      if (slowed) next = { ...next, slowed: false };
      applyMage(next);
      pushMage(codeRef.current, uid, next).catch((e) => console.warn("pushMage", e));
      indexRef.current++;
      setWord(deck[indexRef.current % deck.length]);
      setInput("");
      typoActiveRef.current = false;
      if (slowed) {
        pauseUntilRef.current = Date.now() + SLOW_PAUSE_MS;
        setPaused(true);
      }
    },
    [uid, input.length, applyMage],
  );

  const cast = useCallback(
    (spell: Spell) => {
      if (!uid || doneRef.current) return;
      const mage = mageRef.current;
      if (mage.energy < SPELL_COST) return;
      let next: Mage = { ...mage, energy: mage.energy - SPELL_COST };
      if (spell === "shield") next = { ...next, shield: next.shield + 15 };
      applyMage(next);
      setLastSpell({ actor: "you", spell });

      if (spell === "fire" || spell === "ice") {
        const event = { id: spellIdRef.current++, spell };
        pushCast(codeRef.current, uid, next, event).catch((e) => console.warn("pushCast", e));
      } else {
        pushMage(codeRef.current, uid, next).catch((e) => console.warn("pushMage", e));
      }
    },
    [uid, applyMage],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetStormRoomForRematch(code))
      .catch((e) => console.warn("storm playAgain", e));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((e) => console.warn("leaveRoom", e));
  }, [code]);

  const opponentUid = room ? Object.keys(room.players).find((id) => id !== uid) : undefined;
  const opponentMage = (opponentUid && room?.game.mages[opponentUid]) || EMPTY_MAGE;

  return {
    uid,
    room,
    stage,
    myMage,
    opponentMage,
    word,
    input,
    remaining,
    paused,
    lastSpell,
    type,
    cast,
    playAgain,
    leave,
  };
}
