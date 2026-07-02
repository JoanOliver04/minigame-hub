"use client";

/**
 * Blackjack — UI component. Three phases: setup, playing, end.
 * You always act first. Hand-value/round rules live in ./logic, the
 * Easy-mode hint in ./hints, the timeline in ./useBlackjack.
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { CardFace } from "../higher-or-lower/CardFace";
import { calculateHandValue } from "./logic";
import { suggestAction } from "./hints";
import type { BlackjackConfig, BlackjackDifficulty } from "./types";
import { useBlackjack } from "./useBlackjack";

export function BlackjackGame() {
  const { t } = useLocale();
  const {
    phase,
    stage,
    match,
    playerCards,
    dealerCards,
    holeHidden,
    lastOutcome,
    history,
    startMatch,
    hit,
    stand,
    playAgain,
    toSetup,
  } = useBlackjack();

  // --- setup screen state ---
  const [difficulty, setDifficulty] = useState<BlackjackDifficulty>("medium");
  const [length, setLength] = useState("5");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const LENGTH_OPTIONS = [
    { value: "3", label: t.blackjack.lengthOptions.three },
    { value: "5", label: t.blackjack.lengthOptions.five },
    { value: "10", label: t.blackjack.lengthOptions.ten },
  ];

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.blackjack.name}>{t.blackjack.rules}</HowToPlay>

        <span className="field-label">
          {t.blackjack.difficultyLabel}{" "}
          <InfoTip label={t.blackjack.difficultyTipLabel}>{t.blackjack.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(value) => setDifficulty(value as BlackjackDifficulty)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker options={LENGTH_OPTIONS} value={length} onChange={setLength} />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() =>
              startMatch({ difficulty, target: parseInt(length, 10) } satisfies BlackjackConfig)
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
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{playerWon ? "🏆" : "🤖"}</div>
        <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
          {playerWon ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.common.finalScore(match.youScore, match.aiScore)}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.blackjack.yourWins}</div>
            <div className="value">{match.youScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.blackjack.aiWins}</div>
            <div className="value">{match.aiScore}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.blackjack.pushes}</div>
            <div className="value">{match.pushes}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.blackjack.chipsLabel}</div>
            <div className="value">{match.chips > 0 ? `+${match.chips}` : match.chips}</div>
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
  const difficultyLevel = match.config.difficulty;
  const showTotals = difficultyLevel !== "hard" || stage === "over";
  const showHint = difficultyLevel === "easy" && stage === "player";

  const playerValue = calculateHandValue(playerCards);
  const dealerValue = calculateHandValue(dealerCards);

  const playerTotalText = t.blackjack.totalLabel(
    playerValue.total,
    playerValue.isSoft,
    playerValue.isBust,
  );
  const dealerTotalText = t.blackjack.totalLabel(
    dealerValue.total,
    dealerValue.isSoft,
    dealerValue.isBust,
  );

  const hint =
    showHint && dealerCards.length > 0 ? suggestAction(playerValue, dealerCards[0]) : null;

  let feedback: React.ReactNode = t.blackjack.yourTurn;
  let feedbackClass = "";
  if (stage === "dealing") {
    feedback = t.blackjack.dealingStatus;
  } else if (stage === "dealer") {
    feedback = (
      <>
        {t.blackjack.dealerTurn}
        <span className="think-dots">
          <span />
          <span />
          <span />
        </span>
      </>
    );
  } else if (stage === "over" && lastOutcome) {
    if (lastOutcome.result === "win") {
      feedback = t.blackjack.winRound(lastOutcome.playerBlackjack);
      feedbackClass = " win pop";
    } else if (lastOutcome.result === "lose") {
      feedback = t.blackjack.loseRound;
      feedbackClass = " lose pop";
    } else {
      feedback = t.blackjack.pushRound;
      feedbackClass = " tie pop";
    }
  }

  // A bust keeps stage at "player" for a beat while its resolution timer
  // runs; treat it as busy so Hit/Stand can't fire again mid-resolution.
  const busy = stage !== "player" || playerValue.isBust;

  return (
    <section className="card screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.blackjack.tallyYou(match.youScore)}</span>
        <span className="goal">{t.blackjack.tallyGoal(match.config.target, match.pushes)}</span>
        <span className="them">{t.blackjack.tallyAi(match.aiScore)}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading ai">
          <span className="who">{t.blackjack.dealerLabel}</span>
          {!holeHidden && showTotals && (
            <span
              className={`bj-hand-total${dealerValue.isBust ? " bust" : ""}${dealerValue.isBlackjack ? " blackjack" : ""}`}
            >
              {dealerValue.isBlackjack ? t.blackjack.blackjackLabel : dealerTotalText}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {dealerCards.map((card, index) => (
            <CardFace
              key={card.id}
              card={card}
              flipping
              hidden={index === 1 && holeHidden}
              label={index === 1 && holeHidden ? t.blackjack.holeCardLabel : t.blackjack.dealerLabel}
            />
          ))}
        </div>
      </div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading player">
          <span className="who">{t.blackjack.playerLabel}</span>
          {showTotals && playerCards.length > 0 && (
            <span
              className={`bj-hand-total${playerValue.isBust ? " bust" : ""}${playerValue.isBlackjack ? " blackjack" : ""}`}
            >
              {playerValue.isBlackjack ? t.blackjack.blackjackLabel : playerTotalText}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {playerCards.map((card) => (
            <CardFace key={card.id} card={card} flipping label={t.blackjack.playerLabel} />
          ))}
        </div>
      </div>

      {hint && <div className="bj-hint">{t.blackjack.hintLabel(hint)}</div>}

      <div className="btn-row bj-actions">
        <button className="btn primary" disabled={busy} onClick={hit}>
          {t.blackjack.hitButton}
        </button>
        <button className="btn" disabled={busy} onClick={stand}>
          {t.blackjack.standButton}
        </button>
      </div>

      <div className="log-title">{t.blackjack.logTitle}</div>
      <ul className="log bj-log">
        {history.map((entry) => (
          <li
            key={entry.id}
            className={entry.result === "win" ? "player" : entry.result === "lose" ? "ai" : ""}
          >
            <span className="mv">
              {t.blackjack.logEntry(
                entry.round,
                entry.playerTotal,
                entry.dealerTotal,
                entry.result,
                entry.playerBlackjack,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
