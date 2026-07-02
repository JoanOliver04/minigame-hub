"use client";

/**
 * Nim — UI component. Three phases: setup, playing, end.
 * You always move first. Rules (game rules, not React "state rules") live
 * in ./logic, the opponent's nim-sum strategy in ./ai, the timeline in
 * ./useNim.
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/context/LocaleContext";
import { PLAYER } from "./logic";
import type { NimConfig, NimDifficulty, NimRule } from "./types";
import { useNim } from "./useNim";

/** Pile A, B, C, D… — short, stable labels for the log and aria text. */
function pileLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function NimGame() {
  const { t } = useLocale();
  const {
    phase,
    stage,
    match,
    piles,
    pendingSelection,
    animating,
    moveLog,
    lastOutcome,
    startMatch,
    selectToken,
    clearSelection,
    confirmMove,
    playAgain,
    toSetup,
  } = useNim();

  // --- setup screen state ---
  const [difficulty, setDifficulty] = useState<NimDifficulty>("medium");
  const [rule, setRule] = useState<NimRule>("normal");
  const [randomizePiles, setRandomizePiles] = useState(false);
  const [length, setLength] = useState("3");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const RULE_OPTIONS = [
    { value: "normal", label: t.nim.ruleNormal },
    { value: "misere", label: t.nim.ruleMisere },
  ];
  const LENGTH_OPTIONS = [
    { value: "1", label: t.nim.lengthOptions.single },
    { value: "3", label: t.nim.lengthOptions.three },
    { value: "5", label: t.nim.lengthOptions.five },
  ];

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.nim.name}>{t.nim.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.nim.difficultyTipLabel}>{t.nim.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(value) => setDifficulty(value as NimDifficulty)}
        />

        <span className="field-label">
          {t.nim.ruleLabel}{" "}
          <InfoTip label={t.nim.ruleTipLabel}>{t.nim.ruleTip}</InfoTip>
        </span>
        <SegPicker
          options={RULE_OPTIONS}
          value={rule}
          onChange={(value) => setRule(value as NimRule)}
        />

        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker options={LENGTH_OPTIONS} value={length} onChange={setLength} />

        <Toggle
          label={t.nim.randomizeLabel}
          checked={randomizePiles}
          onChange={setRandomizePiles}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() =>
              startMatch({
                difficulty,
                rule,
                randomizePiles,
                target: parseInt(length, 10),
              } satisfies NimConfig)
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
    const finalMove = lastOutcome?.finalMove;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{playerWon ? "🏆" : "🤖"}</div>
        <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
          {playerWon ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.common.finalScore(match.youScore, match.aiScore)}</div>
        {finalMove && (
          <div className="nim-final-move">
            {t.nim.finalMoveSummary(
              finalMove.by === PLAYER ? t.common.you : t.common.ai,
              pileLabel(finalMove.pileIndex),
              finalMove.tokensRemoved,
              finalMove.pileBefore,
              finalMove.pileAfter,
            )}
          </div>
        )}
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.nim.yourWins}</div>
            <div className="value">{match.youScore}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.nim.aiWins}</div>
            <div className="value">{match.aiScore}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.nim.totalMovesLabel}</div>
            <div className="value">{match.totalMoves}</div>
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
  const interactionsLocked = stage !== "player" || Boolean(animating) || match.finished;

  let feedback: React.ReactNode = t.nim.yourTurn;
  let feedbackClass = "";
  if (stage === "ai") {
    feedback = (
      <>
        {t.nim.aiThinking}
        <span className="think-dots">
          <span />
          <span />
          <span />
        </span>
      </>
    );
  } else if (stage === "over" && lastOutcome) {
    if (lastOutcome.winner === PLAYER) {
      feedback = t.nim.winRound;
      feedbackClass = " win pop";
    } else {
      feedback = t.nim.loseRound;
      feedbackClass = " lose pop";
    }
  } else if (pendingSelection) {
    feedback = t.nim.chooseTokens;
  }

  return (
    <section className="card screen">
      <BackLink />

      <div className={`nim-rule-badge ${match.config.rule}`}>
        {match.config.rule === "normal" ? t.nim.ruleNormal : t.nim.ruleMisere}
      </div>

      <div className="rps-tally">
        <span className="you">{t.nim.tallyYou(match.youScore)}</span>
        <span className="goal">{t.nim.tallyGoal(match.config.target)}</span>
        <span className="them">{t.nim.tallyAi(match.aiScore)}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="nim-board" role="group" aria-label={t.nim.boardLabel}>
        {piles.map((pileSize, pileIndex) => {
          const isAnimatingThisPile = animating?.pileIndex === pileIndex;
          const displaySize = isAnimatingThisPile ? animating!.from : pileSize;
          const fadingFrom = isAnimatingThisPile ? animating!.to : -1;
          const selectedFrom =
            pendingSelection?.pileIndex === pileIndex
              ? displaySize - pendingSelection.tokensRemoved
              : -1;

          return (
            <div
              key={pileIndex}
              className={`nim-pile-row${pendingSelection?.pileIndex === pileIndex ? " active-pile" : ""}`}
            >
              <span className="nim-pile-name">{pileLabel(pileIndex)}</span>
              <div className="nim-tokens">
                {Array.from({ length: displaySize }, (_, tokenIndex) => {
                  const isFading = fadingFrom >= 0 && tokenIndex >= fadingFrom;
                  const isSelected = selectedFrom >= 0 && tokenIndex >= selectedFrom;
                  return (
                    <button
                      key={tokenIndex}
                      type="button"
                      className={`nim-token${isSelected ? " selected" : ""}${isFading ? " removing" : ""}`}
                      disabled={interactionsLocked || pileSize === 0}
                      onClick={() => selectToken(pileIndex, tokenIndex)}
                      aria-label={t.nim.tokenLabel(pileLabel(pileIndex), tokenIndex + 1, pileSize)}
                    />
                  );
                })}
                {displaySize === 0 && <span className="nim-empty">{t.nim.emptyPile}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {pendingSelection && stage === "player" && !animating && (
        <div className="nim-selection-bar">
          <span>
            {t.nim.selectionSummary(
              pileLabel(pendingSelection.pileIndex),
              pendingSelection.tokensRemoved,
              piles[pendingSelection.pileIndex],
              piles[pendingSelection.pileIndex] - pendingSelection.tokensRemoved,
            )}
          </span>
          <div className="btn-row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={clearSelection}>
              {t.nim.clearSelection}
            </button>
            <button className="btn primary" onClick={confirmMove}>
              {t.nim.confirmMove}
            </button>
          </div>
        </div>
      )}

      <div className="log-title">{t.nim.logTitle}</div>
      <ul className="log">
        {moveLog.map((entry) => (
          <li key={entry.id} className={entry.by === PLAYER ? "player" : "ai"}>
            <span className="who">{entry.by === PLAYER ? t.common.you : t.common.ai}</span>
            <span className="verdict" style={{ color: "var(--text)" }}>
              {t.nim.logEntry(
                pileLabel(entry.pileIndex),
                entry.tokensRemoved,
                entry.pileBefore,
                entry.pileAfter,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
