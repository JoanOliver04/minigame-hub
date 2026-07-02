"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { BASKET_ROUNDS } from "./logic";
import type { BasketDifficulty } from "./types";
import { useBasketShot } from "./useBasketShot";

export function BasketShotGame() {
  const { t } = useLocale();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<BasketDifficulty>("medium");
  const {
    phase,
    stage,
    roundIndex,
    points,
    playerScore,
    aiScore,
    meter,
    lastShot,
    history,
    startMatch,
    shoot,
    toSetup,
  } = useBasketShot();

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["basket-shot"].name}>
          {t.basketShot.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.basketShot.difficultyTipLabel}>
            {t.basketShot.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={selectedDifficulty}
          onChange={(value) =>
            setSelectedDifficulty(value as BasketDifficulty)
          }
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() => startMatch(selectedDifficulty)}
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (phase === "end") {
    const winner =
      playerScore === aiScore
        ? "tie"
        : playerScore > aiScore
          ? "player"
          : "ai";
    return (
      <section className="card end-card screen">
        <div className="end-emoji">
          {winner === "player" ? "🏆" : winner === "ai" ? "🤖" : "🤝"}
        </div>
        <div
          className={`end-title ${
            winner === "player"
              ? "player-win"
              : winner === "ai"
                ? "ai-win"
                : ""
          }`}
        >
          {t.basketShot.endTitle(winner)}
        </div>
        <div className="end-number">
          {t.basketShot.finalScore(playerScore, aiScore)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.basketShot.yourPoints}</div>
            <div className="value">{playerScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.basketShot.aiPoints}</div>
            <div className="value">{aiScore}</div>
          </div>
        </div>
        <div className="basket-history" aria-label={t.basketShot.historyLabel}>
          {history.map((entry) => (
            <span key={entry.round}>
              <small>{entry.points}PT</small>
              <b
                className={
                  entry.player.releaseZone === "yellow"
                    ? "made one"
                    : entry.player.made
                      ? "made"
                      : "miss"
                }
              >
                {entry.player.made ? entry.player.scoredPoints : "×"}
              </b>
              <b className={entry.ai.made ? "made ai" : "miss"}>
                {entry.ai.made ? entry.ai.scoredPoints : "×"}
              </b>
            </span>
          ))}
        </div>
        <div className="btn-row">
          <button
            className="btn primary"
            onClick={() => startMatch(selectedDifficulty)}
          >
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

  const isFlight =
    stage === "player-flight" || stage === "ai-flight";
  const isPlayerTurn = stage === "player";
  let feedback = t.basketShot.releasePrompt;
  let feedbackClass = "";

  if (stage === "player-flight") {
    feedback = t.basketShot.yourShot;
  } else if (stage === "player-result" && lastShot) {
    feedback =
      lastShot.releaseZone === "yellow"
        ? t.basketShot.yellowShot
        : lastShot.made
          ? t.basketShot.madeShot(lastShot.scoredPoints)
          : t.basketShot.missedShot;
    feedbackClass = lastShot.made ? " win pop" : " lose pop";
  } else if (stage === "ai-flight") {
    feedback = t.basketShot.aiShot;
  } else if (stage === "ai-result" && lastShot) {
    feedback = lastShot.made
      ? t.basketShot.aiMade(lastShot.points)
      : t.basketShot.aiMissed;
    feedbackClass = lastShot.made ? " lose pop" : " win pop";
  }

  return (
    <section className="card screen basket-screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">
          {t.basketShot.tallyYou(playerScore)}
        </span>
        <span className="goal">
          {t.basketShot.roundLabel(roundIndex + 1, BASKET_ROUNDS, points)}
        </span>
        <span className="them">{t.basketShot.tallyAi(aiScore)}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="basket-court" aria-label={t.basketShot.courtLabel}>
        <div className="basket-backboard" aria-hidden="true">
          <span />
        </div>
        <div className="basket-rim" aria-hidden="true" />
        <div className="basket-net" aria-hidden="true" />
        {lastShot && (
          <span
            key={`${lastShot.actor}-${lastShot.round}`}
            className={`basket-ball ${isFlight ? "flying" : "landed"} ${
              lastShot.made ? "made" : "miss"
            } ${lastShot.actor}`}
            aria-hidden="true"
          >
            🏀
          </span>
        )}
        {!lastShot && (
          <span className="basket-ball ready" aria-hidden="true">
            🏀
          </span>
        )}
        <span className="basket-value-badge">
          {t.basketShot.pointValue(points)}
        </span>
      </div>

      <div
        className={`basket-meter${isPlayerTurn ? " active" : ""}`}
        aria-label={t.basketShot.meterLabel}
      >
        <div className="basket-meter-zones" />
        <span
          className="basket-meter-marker"
          style={{ left: `${meter}%` }}
        />
      </div>
      <div className="basket-meter-caption">
        <span>{t.basketShot.early}</span>
        <strong>{t.basketShot.perfect}</strong>
        <span>{t.basketShot.late}</span>
      </div>

      <div className="btn-row">
        <button
          className="btn primary basket-shoot"
          disabled={!isPlayerTurn}
          onClick={shoot}
        >
          {t.basketShot.shoot}
        </button>
      </div>
    </section>
  );
}
