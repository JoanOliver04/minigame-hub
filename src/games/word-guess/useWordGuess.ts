"use client";

import { useEffect, useRef, useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { randomInt } from "@/lib/random";
import { readValue, writeValue } from "@/lib/browserStorage";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { chooseAIGuess } from "./ai";
import { applyGuess, createWordGuessState, guessError, wordPattern } from "./logic";
import type {
  GuessKind,
  WordGuessConfig,
  WordGuessState,
} from "./types";
import { drawWord, wordsForDifficulty } from "./words";

export function useWordGuess() {
  const [game, setGame] = useState<WordGuessState | null>(null);
  const [inputError, setInputError] = useState("");
  const recordedRef = useRef(false);
  const { record } = useScores();

  function startGame(config: WordGuessConfig) {
    const pool = wordsForDifficulty(config.category, config.difficulty, config.lang);
    const key = `miniHubWordDraw:${config.lang}:${config.category}:${config.difficulty}`;
    const { word, history } = drawWord(pool, readValue(key, "session"));
    writeValue(key, history, "session");
    recordedRef.current = false;
    setInputError("");
    setGame(createWordGuessState(config, word));
  }

  // Computed outside a setGame(updater): React Strict Mode double-invokes
  // updater functions in development, which would double-fire playSound.
  // Both callers (the click handler and the AI effect) hold the current game.
  function performGuess(current: WordGuessState, kind: GuessKind, value: string) {
    const next = applyGuess(current, current.currentTurn, kind, value);
    if (next !== current) {
      playSound(next.feedback?.correct ? "blip" : "lose");
      setGame(next);
    }
  }

  function playerGuess(kind: GuessKind, rawValue: string): boolean {
    if (!game || game.currentTurn !== "player" || game.finished) return false;
    const error = guessError(game, kind, rawValue);
    setInputError(error);
    if (error) return false;
    performGuess(game, kind, rawValue);
    return true;
  }

  useEffect(() => {
    if (!game || game.finished || game.currentTurn !== "ai") return;

    const delay = getUseDelay() ? randomInt(700, 1200) : 220;
    const timer = setTimeout(() => {
      const pool = wordsForDifficulty(game.category, game.difficulty, game.lang);
      const rejectedWords = new Set(
        game.history
          .filter((entry) => entry.kind === "word" && !entry.correct)
          .map((entry) => entry.value),
      );
      const guess = chooseAIGuess(game.difficulty, {
        pattern: wordPattern(game),
        guessedLetters: game.guessedLetters,
        revealedLetters: game.revealedLetters,
        candidatePool: pool,
        lang: game.lang,
        rejectedWords,
      });
      performGuess(game, guess.kind, guess.value);
    }, delay);

    return () => clearTimeout(timer);
  }, [game]);

  useEffect(() => {
    if (!game?.finished || !game.winner || recordedRef.current) return;
    recordedRef.current = true;
    record(
      "word-guess",
      game.winner === "player"
        ? "win"
        : game.winner === "ai"
          ? "loss"
          : "tie",
    );
    playSound(game.winner === "player" ? "win" : game.winner === "ai" ? "lose" : "blip");
  }, [game?.finished, game?.winner, record]);

  function playAgain() {
    if (game) {
      startGame({ category: game.category, difficulty: game.difficulty, lang: game.lang });
    }
  }

  function toSetup() {
    recordedRef.current = false;
    setInputError("");
    setGame(null);
  }

  return {
    phase: !game ? "setup" as const : game.finished ? "end" as const : "playing" as const,
    game,
    inputError,
    startGame,
    playerGuess,
    playAgain,
    toSetup,
  };
}
