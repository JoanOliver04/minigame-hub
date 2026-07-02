"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import {
  AI_PIECE,
  COLUMNS,
  PLAYER_PIECE,
  ROWS,
  getDropRow,
} from "./logic";
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

  const isWinningCell = (row: number, column: number) =>
    lastOutcome?.line?.some(
      (position) => position.row === row && position.column === column,
    ) ?? false;

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

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="connect-board" role="group" aria-label={t.connectFour.boardLabel}>
        {Array.from({ length: COLUMNS }, (_, column) => {
          const full = getDropRow(board, column) === null;
          return (
            <button
              key={column}
              className="connect-column"
              disabled={stage !== "player" || full}
              onClick={() => playColumn(column)}
              aria-label={t.connectFour.columnLabel(column + 1)}
            >
              <span className="connect-preview" aria-hidden="true" />
              {Array.from({ length: ROWS }, (_, row) => {
                const piece = board[row][column];
                const latest =
                  lastMove?.row === row && lastMove.column === column;
                const winning = isWinningCell(row, column);
                return (
                  <span
                    key={`${row}-${column}`}
                    className={`connect-slot${winning ? " winning" : ""}`}
                  >
                    {piece && (
                      <span
                        className={`connect-piece ${piece === PLAYER_PIECE ? "red" : "yellow"}${latest ? " dropping" : ""}`}
                      />
                    )}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </section>
  );
}

