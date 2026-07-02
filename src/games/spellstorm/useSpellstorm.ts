"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { useLocale } from "@/context/LocaleContext";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import { chooseAiSpell, planAiWord } from "./ai";
import { castSpell, completeWord, createMage, matchOutcome, registerTypo } from "./logic";
import { createWordDeck, normalizeWord } from "./words";
import type { AiWordPlan, Mage, Spell, SpellDifficulty, StormWord } from "./types";
import { MATCH_SECONDS } from "./types";

export function useSpellstorm() {
  const { locale } = useLocale();
  const { record } = useScores();
  const [phase, setPhase] = useState<"setup" | "playing" | "end">("setup");
  const [difficulty, setDifficulty] = useState<SpellDifficulty>("medium");
  const [player, setPlayer] = useState<Mage>(createMage);
  const [ai, setAi] = useState<Mage>(createMage);
  const [playerWord, setPlayerWord] = useState<StormWord | null>(null);
  const [aiWord, setAiWord] = useState<StormWord | null>(null);
  const [input, setInput] = useState("");
  const [aiTyped, setAiTyped] = useState("");
  const [remaining, setRemaining] = useState(MATCH_SECONDS);
  const [outcome, setOutcome] = useState<"player" | "ai" | "tie" | null>(null);
  const [lastSpell, setLastSpell] = useState<{ actor: "player" | "ai"; spell: Spell } | null>(null);
  const [playerPaused, setPlayerPaused] = useState(false);
  const [aiCorrectedTypo, setAiCorrectedTypo] = useState(false);

  const rngRef = useRef<Rng>(createRng(randomSeed()));
  const playerRef = useRef<Mage>(createMage());
  const aiRef = useRef<Mage>(createMage());
  const playerDeckRef = useRef<StormWord[]>([]);
  const aiDeckRef = useRef<StormWord[]>([]);
  const playerIndexRef = useRef(0);
  const aiIndexRef = useRef(0);
  const phaseRef = useRef(phase);
  const endAtRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const aiStartRef = useRef(0);
  const aiDueRef = useRef(0);
  const aiPlanRef = useRef<AiWordPlan>({ durationMs: 1000, correctedTypo: false });
  const aiNextCastRef = useRef(0);
  const typoActiveRef = useRef(false);
  const recordedRef = useRef(false);
  const tickRef = useRef<() => void>(() => {});

  const finish = useCallback((forced?: "player" | "ai" | "tie") => {
    if (phaseRef.current !== "playing") return;
    const result = forced ?? matchOutcome(playerRef.current, aiRef.current);
    phaseRef.current = "end";
    setOutcome(result);
    setPhase("end");
    setPlayerPaused(false);
    if (!recordedRef.current) {
      recordedRef.current = true;
      record("spellstorm", result === "player" ? "win" : result === "ai" ? "loss" : "tie");
      playSound(result === "player" ? "win" : result === "ai" ? "lose" : "blip");
    }
  }, [record]);

  const scheduleAiWord = useCallback((startAt: number) => {
    const word = aiDeckRef.current[aiIndexRef.current % aiDeckRef.current.length];
    const wasSlowed = aiRef.current.slowed;
    if (wasSlowed) {
      aiRef.current = { ...aiRef.current, slowed: false };
      setAi(aiRef.current);
    }
    const plan = planAiWord(word.normalized.length, difficulty, wasSlowed, rngRef.current);
    aiPlanRef.current = plan;
    aiStartRef.current = startAt;
    aiDueRef.current = startAt + plan.durationMs;
    setAiWord(word);
    setAiTyped("");
    setAiCorrectedTypo(plan.correctedTypo);
  }, [difficulty]);

  const resolveAiWord = useCallback((completedAt: number) => {
    const word = aiDeckRef.current[aiIndexRef.current % aiDeckRef.current.length];
    let nextAi = completeWord(aiRef.current, word.normalized.length);
    let nextPlayer = playerRef.current;
    if (nextAi.energy >= 20 && completedAt >= aiNextCastRef.current) {
      const seconds = Math.max(0, (endAtRef.current - completedAt) / 1000);
      const spell = chooseAiSpell(nextAi, nextPlayer, difficulty, seconds, rngRef.current);
      const cast = castSpell(nextAi, nextPlayer, spell);
      if (cast) {
        nextAi = cast.caster;
        nextPlayer = cast.target;
        aiNextCastRef.current = completedAt + 4000;
        setLastSpell({ actor: "ai", spell });
      }
    }
    aiRef.current = nextAi;
    playerRef.current = nextPlayer;
    setAi(nextAi);
    setPlayer(nextPlayer);
    if (nextPlayer.health <= 0) {
      finish("ai");
      return;
    }
    aiIndexRef.current++;
    scheduleAiWord(completedAt);
  }, [difficulty, finish, scheduleAiWord]);

  const tick = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const now = Date.now();
    const seconds = Math.max(0, Math.ceil((endAtRef.current - now) / 1000));
    setRemaining(seconds);
    const paused = pauseUntilRef.current > now;
    setPlayerPaused(paused);
    const word = aiDeckRef.current[aiIndexRef.current % aiDeckRef.current.length];
    if (word) {
      const visualChars = Math.min(
        word.display.length,
        Math.floor((now - aiStartRef.current) / 75),
        Math.floor(((now - aiStartRef.current) / aiPlanRef.current.durationMs) * word.display.length),
      );
      setAiTyped(word.display.slice(0, Math.max(0, visualChars)));
    }
    let guard = 0;
    while (phaseRef.current === "playing" && now >= aiDueRef.current && guard++ < 4) {
      resolveAiWord(aiDueRef.current);
    }
    if (phaseRef.current === "playing" && (now >= endAtRef.current || seconds === 0)) finish();
  }, [resolveAiWord, finish]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    const interval = setInterval(() => tickRef.current(), 80);
    return () => clearInterval(interval);
  }, []);

  const startMatch = useCallback(() => {
    rngRef.current = createRng(randomSeed());
    const p = createMage();
    const a = createMage();
    playerRef.current = p;
    aiRef.current = a;
    playerDeckRef.current = createWordDeck(locale, rngRef.current);
    aiDeckRef.current = createWordDeck(locale, rngRef.current);
    playerIndexRef.current = 0;
    aiIndexRef.current = 0;
    typoActiveRef.current = false;
    pauseUntilRef.current = 0;
    aiNextCastRef.current = Date.now();
    recordedRef.current = false;
    endAtRef.current = Date.now() + MATCH_SECONDS * 1000;
    phaseRef.current = "playing";
    setPlayer(p);
    setAi(a);
    setPlayerWord(playerDeckRef.current[0]);
    setInput("");
    setRemaining(MATCH_SECONDS);
    setOutcome(null);
    setLastSpell(null);
    setPlayerPaused(false);
    setPhase("playing");
    scheduleAiWord(Date.now());
  }, [locale, scheduleAiWord]);

  const typeWord = useCallback((value: string) => {
    if (phaseRef.current !== "playing" || Date.now() < pauseUntilRef.current) return;
    const word = playerDeckRef.current[playerIndexRef.current % playerDeckRef.current.length];
    const normalized = normalizeWord(value);
    const validPrefix = word.normalized.startsWith(normalized);
    if (!validPrefix && !typoActiveRef.current && value.length > input.length) {
      const next = registerTypo(playerRef.current);
      playerRef.current = next;
      setPlayer(next);
      typoActiveRef.current = true;
      playSound("error");
    }
    if (validPrefix) typoActiveRef.current = false;
    setInput(value);
    if (normalized !== word.normalized) return;
    let next = completeWord(playerRef.current, word.normalized.length);
    const slowed = next.slowed;
    if (slowed) next = { ...next, slowed: false };
    playerRef.current = next;
    setPlayer(next);
    playerIndexRef.current++;
    setPlayerWord(playerDeckRef.current[playerIndexRef.current % playerDeckRef.current.length]);
    setInput("");
    typoActiveRef.current = false;
    if (slowed) {
      pauseUntilRef.current = Date.now() + 900;
      setPlayerPaused(true);
    }
    playSound("blip");
  }, [input.length]);

  const playerCast = useCallback((spell: Spell) => {
    if (phaseRef.current !== "playing") return;
    const cast = castSpell(playerRef.current, aiRef.current, spell);
    if (!cast) return;
    playerRef.current = cast.caster;
    aiRef.current = cast.target;
    setPlayer(cast.caster);
    setAi(cast.target);
    setLastSpell({ actor: "player", spell });
    playSound("blip");
    if (cast.target.health <= 0) finish("player");
  }, [finish]);

  const toSetup = useCallback(() => {
    phaseRef.current = "setup";
    setPhase("setup");
  }, []);

  return {
    phase, difficulty, setDifficulty, player, ai, playerWord, aiWord, input, typeWord,
    aiTyped, remaining, outcome, lastSpell, playerPaused, aiCorrectedTypo,
    playerCast, startMatch, playAgain: startMatch, toSetup,
  };
}
