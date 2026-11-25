"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { AI_PIECE, PLAYER_PIECE } from "./logic";
import { ConnectGrid, RoundReview } from "./ConnectGrid";
import type { ConnectDifficulty } from "./types";
import { useConnectFour } from "./useConnectFour";

export function ConnectFourGame() {
  const { t } = useLocale();
  const {
    phase,
    stage,
    match,
    board,
    lastMove,
    lastOutcome,
    previousRound,
    startMatch,
    playColumn,
    playAgain,
    toSetup,
  } = useConnectFour();
  const [difficulty, setDifficulty] = useState<ConnectDifficulty>("medium");
  const [length, setLength] = useState("3");

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["connect-four"].name}>
          {t.connectFour.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.connectFour.difficultyTipLabel}>
            {t.connectFour.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as ConnectDifficulty)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker
          options={[
            { value: "1", label: t.connectFour.singleRound },
            { value: "3", label: t.connectFour.firstTo(3) },
            { value: "5", label: t.connectFour.firstTo(5) },
          ]}
          value={length}
          onChange={setLength}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() => startMatch(difficulty, Number(length))}
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!match) return null;

  if (phase === "end") {
    const playerWon = match.playerScore > match.aiScore;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{playerWon ? "🏆" : "🤖"}</div>
        <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
          {playerWon ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">
          {t.common.finalScore(match.playerScore, match.aiScore)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.connectFour.yourWins}</div>
            <div className="value">{match.playerScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.connectFour.aiWins}</div>
            <div className="value">{match.aiScore}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.connectFour.draws}</div>
            <div className="value">{match.draws}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.common.roundsPlayed}</div>
            <div className="value">{match.rounds}</div>
          </div>
        </div>
        <RoundReview round={match.rounds} board={board} outcome={lastOutcome} myPiece={PLAYER_PIECE} opponent={t.common.ai} />
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

  let feedback: React.ReactNode = t.connectFour.yourTurn;
  let feedbackClass = "";
  if (stage === "ai") {
    feedback = (
      <>
        {t.connectFour.aiThinking}
        <span className="think-dots">
          <span />
          <span />
          <span />
        </span>
      </>
    );
  } else if (lastOutcome) {
    if (lastOutcome.winner === PLAYER_PIECE) {
      feedback = t.connectFour.winRound;
      feedbackClass = " win pop";
    } else if (lastOutcome.winner === AI_PIECE) {
      feedback = t.connectFour.loseRound;
      feedbackClass = " lose pop";
    } else {
      feedback = t.connectFour.drawRound;
      feedbackClass = " tie pop";
    }
  }

  return (
    <section className="card screen connect-screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.connectFour.tallyYou(match.playerScore)}</span>
        <span className="goal">
          {t.connectFour.tallyGoal(match.target, match.draws)}
        </span>
        <span className="them">{t.connectFour.tallyAi(match.aiScore)}</span>
      </div>

      <div className={`feedback${feedbackClass}`} role="status">{feedback}</div>
      <ConnectGrid board={board} myPiece={PLAYER_PIECE} opponent={t.common.ai} outcome={lastOutcome}
        lastMove={lastMove} canPlay={stage === "player"} onPlay={playColumn} />
      {previousRound && stage !== "over" && <RoundReview key={previousRound.round} {...previousRound} myPiece={PLAYER_PIECE} opponent={t.common.ai} />}
    </section>
  );
}

