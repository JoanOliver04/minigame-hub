"use client";

/**
 * Rock-Paper-Scissors — UI component. Three phases: setup, playing, end.
 * Rules live in ./logic, prediction in ./ai, timeline in ./useRpsGame.
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { MOVE_EMOJI, MOVES, type Move, type RpsDifficulty } from "./logic";
import { useRpsGame } from "./useRpsGame";

export function RpsGame() {
  const { phase, match, hand, startMatch, playMove, playAgain, toSetup } = useRpsGame();
  const { t } = useLocale();

  // --- setup screen state ---
  const [difficulty, setDifficulty] = useState<RpsDifficulty>("medium");
  const [length, setLength] = useState("3");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  const LENGTH_OPTIONS = [
    { value: "3", label: t.rps.firstTo(3) },
    { value: "5", label: t.rps.firstTo(5) },
    { value: "10", label: t.rps.firstTo(10) },
  ];

  const MOVE_LABEL: Record<Move, string> = t.rps.moveLabels;

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.rps.name}>{t.rps.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.rps.difficultyTipLabel}>{t.rps.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => setDifficulty(v as RpsDifficulty)}
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
            <div className="label">{t.rps.yourRoundWins}</div>
            <div className="value">{match.youScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.rps.aiRoundWins}</div>
            <div className="value">{match.aiScore}</div>
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
  const busy = hand.stage !== "idle";

  const playerEmoji = hand.stage === "reveal" ? MOVE_EMOJI[hand.playerMove] : "✊";
  const aiEmoji = hand.stage === "reveal" ? MOVE_EMOJI[hand.aiMove] : "✊";

  const playerHandClass =
    "rps-hand player-side" +
    (hand.stage === "shaking" ? " shaking" : "") +
    (hand.stage === "reveal" ? " reveal" + (hand.result === "win" ? " winner" : "") : "");
  const aiHandClass =
    "rps-hand ai-side" +
    (hand.stage === "shaking" ? " shaking" : "") +
    (hand.stage === "reveal" ? " reveal" + (hand.result === "lose" ? " winner" : "") : "");

  let feedbackMsg = t.rps.pickMove;
  let feedbackCls = "";
  if (hand.stage === "shaking") {
    feedbackMsg = t.rps.shaking;
  } else if (hand.stage === "reveal") {
    const { playerMove, aiMove, result } = hand;
    feedbackMsg =
      result === "win"
        ? t.rps.resultWin(MOVE_EMOJI[playerMove], MOVE_EMOJI[aiMove])
        : result === "lose"
          ? t.rps.resultLose(MOVE_EMOJI[aiMove], MOVE_EMOJI[playerMove])
          : t.rps.resultTie(MOVE_EMOJI[playerMove]);
    feedbackCls = ` ${result} pop`;
  }

  return (
    <section className="card screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.rps.tallyYou(match.youScore)}</span>
        <span className="goal">{t.rps.tallyGoal(match.target)}</span>
        <span className="them">{t.rps.tallyAi(match.aiScore)}</span>
      </div>

      <div className="rps-arena">
        <div className={playerHandClass}>{playerEmoji}</div>
        <div className="rps-vs">VS</div>
        <div className={aiHandClass}>{aiEmoji}</div>
      </div>

      <div key={`${match.rounds}-${hand.stage}`} className={`feedback${feedbackCls}`}>
        {feedbackMsg}
      </div>

      <div className="rps-choices">
        {MOVES.map((move) => (
          <button
            key={move}
            className="rps-choice"
            disabled={busy}
            onClick={() => playMove(move)}
          >
            <span className="emoji">{MOVE_EMOJI[move]}</span>
            <span className="label">{MOVE_LABEL[move]}</span>
          </button>
        ))}
      </div>

      <div className="log-title">{t.rps.logTitle}</div>
      <ul className="log">
        {match.history.map((entry) => (
          <li
            key={entry.id}
            className={entry.result === "win" ? "player" : entry.result === "lose" ? "ai" : ""}
          >
            <span className="mv">
              {MOVE_EMOJI[entry.playerMove]} {MOVE_LABEL[entry.playerMove]}
            </span>
            <span className="verdict" style={{ flex: "none" }}>
              vs
            </span>
            <span className="mv">
              {MOVE_EMOJI[entry.aiMove]} {MOVE_LABEL[entry.aiMove]}
            </span>
            <span className={`verdict ${entry.result}`}>
              {entry.result === "win"
                ? t.rps.logYouWin
                : entry.result === "lose"
                  ? t.rps.logAiWins
                  : t.rps.logTie}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
