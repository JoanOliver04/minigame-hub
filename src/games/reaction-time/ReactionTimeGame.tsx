"use client";

/**
 * Reaction Time — UI component. Three phases: setup, playing, end.
 * You and the AI both wait for the same "Go!" signal; round timing and the
 * AI's simulated reflex live in ./logic and ./ai, the timeline in
 * ./useReactionTime.
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { averageMs } from "./logic";
import type { ReactionConfig, ReactionDifficulty } from "./types";
import { useReactionTime } from "./useReactionTime";

export function ReactionTimeGame() {
  const { t } = useLocale();
  const {
    phase,
    stage,
    match,
    lastOutcome,
    history,
    startMatch,
    handlePlayerAction,
    playAgain,
    toSetup,
  } = useReactionTime();

  // --- setup screen state ---
  const [difficulty, setDifficulty] = useState<ReactionDifficulty>("medium");
  const [length, setLength] = useState("5");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const LENGTH_OPTIONS = [
    { value: "3", label: t.reactionTime.firstTo(3) },
    { value: "5", label: t.reactionTime.firstTo(5) },
    { value: "10", label: t.reactionTime.firstTo(10) },
  ];

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["reaction-time"].name}>
          {t.reactionTime.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.reactionTime.difficultyTipLabel}>
            {t.reactionTime.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(value) => setDifficulty(value as ReactionDifficulty)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker options={LENGTH_OPTIONS} value={length} onChange={setLength} />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() =>
              startMatch({ difficulty, target: parseInt(length, 10) } satisfies ReactionConfig)
            }
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!match) return null;

  /* ================= END ================= */
  if (phase === "end") {
    const playerWon = match.youScore > match.aiScore;
    const yourAvg = averageMs(match.playerTimes);
    const aiAvg = averageMs(match.aiTimes);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{playerWon ? "🏆" : "🤖"}</div>
        <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
          {playerWon ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.common.finalScore(match.youScore, match.aiScore)}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.reactionTime.yourWins}</div>
            <div className="value">{match.youScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.reactionTime.aiWins}</div>
            <div className="value">{match.aiScore}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.reactionTime.avgYourLabel}</div>
            <div className="value">
              {yourAvg === null ? t.reactionTime.noDataLabel : t.reactionTime.msSuffix(yourAvg)}
            </div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.reactionTime.avgAiLabel}</div>
            <div className="value">
              {aiAvg === null ? t.reactionTime.noDataLabel : t.reactionTime.msSuffix(aiAvg)}
            </div>
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

  /* ================= PLAYING ================= */
  let boxClass = "rt-box";
  let boxText: React.ReactNode = t.reactionTime.waitingLabel;

  if (stage === "waiting") {
    boxClass += " waiting";
    boxText = t.reactionTime.waitingLabel;
  } else if (stage === "ready") {
    boxClass += " ready";
    boxText = t.reactionTime.readyLabel;
  } else if (stage === "go") {
    boxClass += " go";
    boxText = t.reactionTime.goLabel;
  } else if (stage === "resolved" && lastOutcome) {
    boxClass += ` resolved ${lastOutcome.winner}`;
    if (lastOutcome.playerFalseStart) {
      boxText = t.reactionTime.playerFalseStartResult;
    } else if (lastOutcome.aiFalseStart) {
      boxText = t.reactionTime.aiFalseStartResult;
    } else {
      boxText =
        lastOutcome.winner === "player"
          ? t.reactionTime.winRound
          : lastOutcome.winner === "ai"
            ? t.reactionTime.loseRound
            : t.reactionTime.pushRound;
    }
  }

  return (
    <section className="card screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.reactionTime.tallyYou(match.youScore)}</span>
        <span className="goal">{t.reactionTime.tallyGoal(match.config.target)}</span>
        <span className="them">{t.reactionTime.tallyAi(match.aiScore)}</span>
      </div>

      <button
        type="button"
        className={boxClass}
        onClick={handlePlayerAction}
        disabled={stage === "resolved"}
      >
        <span className="rt-box-text">{boxText}</span>
        {stage === "resolved" && lastOutcome && (
          <span className="rt-box-times">
            {t.reactionTime.yourTimeLabel(
              lastOutcome.playerFalseStart ? null : lastOutcome.playerTimeMs,
            )}
            {" · "}
            {t.reactionTime.aiTimeLabel(lastOutcome.aiFalseStart ? null : lastOutcome.aiTimeMs)}
          </span>
        )}
        {stage === "ready" && <span className="rt-box-hint">{t.reactionTime.tapHint}</span>}
      </button>

      <div className="log-title">{t.reactionTime.logTitle}</div>
      <ul className="log">
        {history.map((entry) => (
          <li
            key={entry.id}
            className={entry.winner === "player" ? "player" : entry.winner === "ai" ? "ai" : ""}
          >
            <span className="verdict" style={{ color: "var(--text)" }}>
              {t.reactionTime.logEntry(
                entry.round,
                entry.playerTimeMs,
                entry.playerFalseStart,
                entry.aiTimeMs,
                entry.aiFalseStart,
                entry.winner,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
