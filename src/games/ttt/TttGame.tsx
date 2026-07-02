"use client";

/**
 * Tic-Tac-Toe — UI component. Three phases: setup, playing, end.
 * You are X (green) and move first; the AI is O (pink).
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { AI_MARK, PLAYER_MARK, type TttDifficulty } from "./logic";
import { useTttGame } from "./useTttGame";

export function TttGame() {
  const {
    phase,
    match,
    board,
    selectedCell,
    stage,
    lastOutcome,
    startMatch,
    handleCell,
    playAgain,
    toSetup,
  } = useTttGame();
  const { t } = useLocale();

  // --- setup screen state ---
  const [difficulty, setDifficulty] = useState<TttDifficulty>("medium");
  const [length, setLength] = useState("3");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  const LENGTH_OPTIONS = [
    { value: "1", label: t.ttt.lengthOptions.single },
    { value: "3", label: t.ttt.lengthOptions.three },
    { value: "5", label: t.ttt.lengthOptions.five },
  ];

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.ttt.name}>{t.ttt.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.ttt.difficultyTipLabel}>{t.ttt.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => setDifficulty(v as TttDifficulty)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker options={LENGTH_OPTIONS} value={length} onChange={setLength} />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() => startMatch(difficulty, parseInt(length, 10))}
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
            <div className="label">{t.ttt.yourWins}</div>
            <div className="value">{match.youScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.ttt.aiWins}</div>
            <div className="value">{match.aiScore}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.ttt.draws}</div>
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

  /* ================= PLAYING ================= */
  const playerHasThree = board.filter((cell) => cell === PLAYER_MARK).length === 3;
  let feedbackMsg: React.ReactNode =
    playerHasThree && selectedCell === null
      ? t.ttt.choosePiece
      : selectedCell !== null
        ? t.ttt.chooseDestination
        : t.ttt.yourTurn;
  let feedbackCls = "";
  if (stage === "ai") {
    feedbackMsg = (
      <>
        {t.ttt.aiThinking}
        <span className="think-dots">
          <span />
          <span />
          <span />
        </span>
      </>
    );
  } else if (stage === "over" && lastOutcome) {
    if (lastOutcome.winner === PLAYER_MARK) {
      feedbackMsg = t.ttt.winRound;
      feedbackCls = " win pop";
    } else if (lastOutcome.winner === AI_MARK) {
      feedbackMsg = t.ttt.loseRound;
      feedbackCls = " lose pop";
    } else {
      feedbackMsg = t.ttt.drawRound;
      feedbackCls = " tie pop";
    }
  }

  return (
    <section className="card screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.ttt.tallyYou(match.youScore)}</span>
        <span className="goal">{t.ttt.tallyGoal(match.target, match.draws)}</span>
        <span className="them">{t.ttt.tallyAi(match.aiScore)}</span>
      </div>

      <div className={`feedback${feedbackCls}`}>{feedbackMsg}</div>

      <div className="ttt-board">
        {board.map((cell, i) => {
          const isWinning = lastOutcome?.line?.includes(i) ?? false;
          const isSelected = selectedCell === i;
          const canInteract =
            stage === "player" &&
            (!playerHasThree
              ? cell === null
              : selectedCell === null
                ? cell === PLAYER_MARK
                : cell !== AI_MARK);
          const winnerCls = isWinning
            ? lastOutcome!.winner === PLAYER_MARK
              ? " winner x-win"
              : " winner o-win"
            : "";
          return (
            <button
              key={i}
              className={`ttt-cell${winnerCls}${isSelected ? " selected" : ""}${canInteract && cell === PLAYER_MARK ? " movable" : ""}`}
              disabled={!canInteract}
              onClick={() => handleCell(i)}
              aria-pressed={isSelected}
              aria-label={t.ttt.cellLabel(i + 1, cell)}
            >
              {cell && <span className={`mark ${cell === "X" ? "x" : "o"}`}>{cell}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
