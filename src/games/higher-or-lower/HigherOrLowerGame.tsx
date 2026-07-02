"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/context/LocaleContext";
import { CardFace, cardLabel } from "./CardFace";
import type {
  HigherOrLowerConfig,
  HigherOrLowerDifficulty,
  MatchWinner,
  Prediction,
} from "./types";
import { useHigherOrLower } from "./useHigherOrLower";

export function HigherOrLowerGame() {
  const { t } = useLocale();
  const { phase, stage, match, reveal, startMatch, predict, playAgain, toSetup } =
    useHigherOrLower();
  const [difficulty, setDifficulty] = useState<HigherOrLowerDifficulty>("medium");
  const [rounds, setRounds] = useState<"10" | "20">("10");
  const [aceHigh, setAceHigh] = useState(false);
  const [allowSame, setAllowSame] = useState(false);

  const difficultyOptions = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const roundOptions = [
    { value: "10", label: t.higherOrLower.tenRounds },
    { value: "20", label: t.higherOrLower.twentyRounds },
  ];

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["higher-or-lower"].name}>
          {t.higherOrLower.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.higherOrLower.difficultyTipLabel}>
            {t.higherOrLower.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={difficultyOptions}
          value={difficulty}
          onChange={(value) => setDifficulty(value as HigherOrLowerDifficulty)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker options={roundOptions} value={rounds} onChange={(value) => setRounds(value as "10" | "20")} />

        <span className="field-label">{t.higherOrLower.aceRule}</span>
        <SegPicker
          options={[
            { value: "low", label: t.higherOrLower.aceLow },
            { value: "high", label: t.higherOrLower.aceHigh },
          ]}
          value={aceHigh ? "high" : "low"}
          onChange={(value) => setAceHigh(value === "high")}
        />

        <Toggle
          label={t.higherOrLower.allowSame}
          checked={allowSame}
          onChange={setAllowSame}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() =>
              startMatch({
                difficulty,
                rounds: Number(rounds) as HigherOrLowerConfig["rounds"],
                aceHigh,
                allowSame,
              })
            }
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!match) return null;

  if (phase === "end") {
    const winner = match.winner as MatchWinner;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">
          {winner === "player" ? "🏆" : winner === "ai" ? "🤖" : "🤝"}
        </div>
        <div
          className={`end-title ${winner === "player" ? "player-win" : winner === "ai" ? "ai-win" : ""}`}
        >
          {t.higherOrLower.endTitle(winner)}
        </div>
        <div className="end-number">
          {t.common.finalScore(match.player.score, match.ai.score)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.higherOrLower.yourScore}</div>
            <div className="value">{match.player.score}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.higherOrLower.aiScore}</div>
            <div className="value">{match.ai.score}</div>
          </div>
          <div className="stat-box player">
            <div className="label">{t.higherOrLower.yourBestStreak}</div>
            <div className="value">{match.player.bestStreak}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.higherOrLower.aiBestStreak}</div>
            <div className="value">{match.ai.bestStreak}</div>
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

  const predictions: Prediction[] = match.config.allowSame
    ? ["lower", "same", "higher"]
    : ["lower", "higher"];
  const busy = stage === "revealing";
  const feedbackClass = reveal
    ? reveal.playerCorrect
      ? " correct pop"
      : " high pop"
    : "";
  const feedback = reveal
    ? t.higherOrLower.revealFeedback(
        reveal.playerCorrect,
        t.higherOrLower.predictions[reveal.aiPrediction],
        reveal.aiCorrect,
      )
    : t.higherOrLower.choosePrediction;

  return (
    <section className="card screen">
      <BackLink />

      <div className="hol-status">
        <div className="hol-competitor player">
          <strong>{t.common.you}</strong>
          <span>{t.higherOrLower.score(match.player.score)}</span>
          <span>{t.higherOrLower.streak(match.player.streak)}</span>
          <small>{t.higherOrLower.best(match.player.bestStreak)}</small>
        </div>
        <div className="hol-progress">
          <strong>
            {t.higherOrLower.roundProgress(
              // Clamp: after the last reveal commits, roundsPlayed === rounds
              // for a beat before the end screen — avoid "Card 11 of 10".
              Math.min(match.roundsPlayed, match.config.rounds - 1),
              match.config.rounds,
            )}
          </strong>
          <span>{t.higherOrLower.cardsRemaining(match.deck.length)}</span>
          <span className="hol-deck-stack" aria-hidden="true" />
        </div>
        <div className="hol-competitor ai">
          <strong>{t.common.ai}</strong>
          <span>{t.higherOrLower.score(match.ai.score)}</span>
          <span>{t.higherOrLower.streak(match.ai.streak)}</span>
          <small>{t.higherOrLower.best(match.ai.bestStreak)}</small>
        </div>
      </div>

      <div className="hol-table">
        <CardFace card={match.currentCard} label={t.higherOrLower.currentCard} />
        {reveal && (
          <>
            <span className="hol-arrow" aria-hidden="true">→</span>
            <CardFace
              card={reveal.nextCard}
              flipping
              label={t.higherOrLower.nextCard}
            />
          </>
        )}
      </div>

      <div key={`${match.roundsPlayed}-${stage}`} className={`feedback${feedbackClass}`}>
        {feedback}
      </div>

      <div className="hol-choices">
        {predictions.map((prediction) => (
          <button
            key={prediction}
            className={`btn hol-choice ${prediction}`}
            disabled={busy}
            onClick={() => predict(prediction)}
          >
            <span aria-hidden="true">
              {prediction === "higher" ? "↑" : prediction === "lower" ? "↓" : "="}
            </span>
            {t.higherOrLower.predictions[prediction]}
          </button>
        ))}
      </div>

      <div className="log-title">{t.higherOrLower.historyTitle}</div>
      <ul className="log hol-log">
        {match.history.map((entry) => (
          <li key={entry.id}>
            <span className="mv">
              {cardLabel(entry.currentCard)} → {cardLabel(entry.nextCard)}
            </span>
            <span className={`verdict ${entry.playerCorrect ? "win" : "high"}`}>
              {t.higherOrLower.historyPlayer(
                t.higherOrLower.predictions[entry.playerPrediction],
                entry.playerCorrect,
              )}
            </span>
            <span className={`verdict ${entry.aiCorrect ? "lose" : "high"}`}>
              {t.higherOrLower.historyAi(
                t.higherOrLower.predictions[entry.aiPrediction],
                entry.aiCorrect,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

