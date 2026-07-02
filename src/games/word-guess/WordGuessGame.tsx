"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { alphabetFor } from "./letters";
import { SHARED_MISTAKE_LIMIT, totalMistakes, wordPattern } from "./logic";
import type { WordCategory, WordDifficulty, WordLang } from "./types";
import { useWordGuess } from "./useWordGuess";

export function WordGuessGame() {
  const { t, locale } = useLocale();
  const {
    phase,
    game,
    inputError,
    startGame,
    playerGuess,
    playAgain,
    toSetup,
  } = useWordGuess();
  const [difficulty, setDifficulty] = useState<WordDifficulty>("medium");
  const [category, setCategory] = useState<WordCategory>("animals");
  // Default the word language to the interface language, so a player who
  // switched the app to Spanish gets Spanish words unless they choose otherwise.
  const [lang, setLang] = useState<WordLang>(locale === "es" ? "es" : "en");
  const [wordInput, setWordInput] = useState("");

  const categoryOptions = [
    { value: "animals", label: t.wordGuess.categories.animals },
    { value: "countries", label: t.wordGuess.categories.countries },
    { value: "food", label: t.wordGuess.categories.food },
    { value: "technology", label: t.wordGuess.categories.technology },
  ];

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["word-guess"].name}>
          {t.wordGuess.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.wordGuess.difficultyTipLabel}>
            {t.wordGuess.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as WordDifficulty)}
        />

        <span className="field-label">{t.wordGuess.category}</span>
        <SegPicker
          options={categoryOptions}
          value={category}
          onChange={(value) => setCategory(value as WordCategory)}
        />

        <span className="field-label">{t.wordGuess.language}</span>
        <SegPicker
          options={[
            { value: "en", label: t.wordGuess.langEn },
            { value: "es", label: t.wordGuess.langEs },
          ]}
          value={lang}
          onChange={(value) => setLang(value as WordLang)}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() => startGame({ difficulty, category, lang })}
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!game) return null;

  if (phase === "end") {
    const winner = game.winner!;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">
          {winner === "player" ? "🏆" : winner === "ai" ? "🤖" : "🤝"}
        </div>
        <div
          className={`end-title ${
            winner === "player" ? "player-win" : winner === "ai" ? "ai-win" : ""
          }`}
        >
          {t.wordGuess.endTitle(winner)}
        </div>
        <div className="word-end-answer">{game.word}</div>
        <div className="word-end-meta">
          {t.wordGuess.categories[game.category]} · {t.common[game.difficulty]} ·{" "}
          {game.lang === "es" ? t.wordGuess.langEs : t.wordGuess.langEn}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.wordGuess.yourMistakes}</div>
            <div className="value">{game.playerMistakes}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.wordGuess.aiMistakes}</div>
            <div className="value">{game.aiMistakes}</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>
            {t.common.playAgain}
          </button>
          <button className="btn" onClick={toSetup}>
            {t.common.changeSettings}
          </button>
          <Link href="/" className="btn">
            {t.common.returnToHub}
          </Link>
        </div>
      </section>
    );
  }

  const pattern = wordPattern(game);
  const mistakes = totalMistakes(game);
  const locked = game.currentTurn !== "player" || game.finished;
  const feedback = game.feedback;

  function submitWord(event: FormEvent) {
    event.preventDefault();
    if (playerGuess("word", wordInput)) setWordInput("");
  }

  const feedbackText = feedback
    ? t.wordGuess.feedback(
        feedback.actor === "player" ? t.common.you : t.common.ai,
        feedback.kind,
        feedback.value,
        feedback.correct,
      )
    : game.currentTurn === "player"
      ? t.wordGuess.yourTurn
      : t.wordGuess.aiThinking;

  return (
    <section className="card screen word-screen">
      <BackLink />

      <div className="word-meta">
        {t.wordGuess.categories[game.category]} · {t.common[game.difficulty]} ·{" "}
        {game.lang === "es" ? t.wordGuess.langEs : t.wordGuess.langEn}
      </div>

      <div className={`turn-banner ${game.currentTurn}`}>
        {game.currentTurn === "player" ? (
          t.wordGuess.yourTurn
        ) : (
          <>
            {t.wordGuess.aiThinking}
            <span className="think-dots"><span /><span /><span /></span>
          </>
        )}
      </div>

      <div className="word-tiles" aria-label={t.wordGuess.patternLabel(pattern)}>
        {[...pattern].map((letter, index) => (
          <span key={index} className={letter === "_" ? "hidden" : "revealed"}>
            {letter === "_" ? "\u00a0" : letter}
          </span>
        ))}
      </div>

      <div className="word-budget-head">
        <span>{t.wordGuess.sharedBudget}</span>
        <strong>{mistakes} / {SHARED_MISTAKE_LIMIT}</strong>
      </div>
      <div className="word-budget" aria-label={t.wordGuess.budgetLabel(mistakes)}>
        {Array.from({ length: SHARED_MISTAKE_LIMIT }, (_, index) => (
          <span
            key={index}
            className={
              index < game.playerMistakes
                ? "spent player"
                : index < mistakes
                  ? "spent ai"
                  : ""
            }
          />
        ))}
      </div>
      <div className="word-mistake-stats">
        <span className="player">{t.wordGuess.yourMistakes}: {game.playerMistakes}</span>
        <span className="ai">{t.wordGuess.aiMistakes}: {game.aiMistakes}</span>
      </div>

      <div className={`feedback${feedback ? feedback.correct ? " correct pop" : " high pop" : ""}`}>
        {feedbackText}
      </div>

      <div className="word-keyboard" role="group" aria-label={t.wordGuess.keyboardLabel}>
        {alphabetFor(game.lang).map((letter) => (
          <button
            key={letter}
            type="button"
            className={
              game.guessedLetters.has(letter)
                ? game.revealedLetters.has(letter) ? "hit" : "miss"
                : ""
            }
            disabled={locked || game.guessedLetters.has(letter)}
            onClick={() => playerGuess("letter", letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      <form className="word-form" onSubmit={submitWord}>
        <input
          type="text"
          value={wordInput}
          disabled={locked}
          maxLength={24}
          autoComplete="off"
          placeholder={t.wordGuess.wordPlaceholder}
          aria-label={t.wordGuess.wordPlaceholder}
          onChange={(event) => setWordInput(event.target.value)}
        />
        <button className="btn primary" disabled={locked || !wordInput.trim()}>
          {t.wordGuess.guessWord}
        </button>
      </form>
      <div className="error-msg">{inputError ? t.wordGuess.errors[inputError] : ""}</div>

      {game.history.length > 0 && (
        <>
          <div className="log-title">{t.wordGuess.historyTitle}</div>
          <ul className="log word-log">
            {[...game.history].reverse().map((entry, index) => (
              <li key={`${entry.actor}-${entry.value}-${index}`} className={entry.actor}>
                <span className="who">
                  {entry.actor === "player" ? t.common.you : t.common.ai}
                </span>
                <span className="mv">
                  {entry.kind === "letter" ? entry.value : `"${entry.value}"`}
                </span>
                <span className={`verdict ${entry.correct ? "correct" : "high"}`}>
                  {entry.correct
                    ? t.wordGuess.correctGuess
                    : t.wordGuess.missCost(entry.cost)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
