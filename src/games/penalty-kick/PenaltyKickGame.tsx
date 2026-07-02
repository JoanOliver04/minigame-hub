"use client";

import {
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { PenaltyDifficulty, Point } from "./types";
import { TOTAL_KICKS, usePenaltyKick } from "./usePenaltyKick";

function pointStyle(point: Point): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` };
}

export function PenaltyKickGame() {
  const { t } = useLocale();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<PenaltyDifficulty>("medium");
  const {
    phase,
    stage,
    aim,
    setAim,
    power,
    setPower,
    result,
    kicks,
    goals,
    startMatch,
    shoot,
    toSetup,
  } = usePenaltyKick();
  const attempts = kicks.length;

  function chooseAim(event: MouseEvent<HTMLButtonElement>) {
    if (stage !== "aiming") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setAim({
      x: Math.min(94, Math.max(6, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(92, Math.max(8, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["penalty-kick"].name}>
          {t.penaltyKick.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.penaltyKick.difficultyTipLabel}>
            {t.penaltyKick.difficultyTip}
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
            setSelectedDifficulty(value as PenaltyDifficulty)
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
    const won = goals >= 3;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{won ? "🏆" : "🧤"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.penaltyKick.endWin : t.penaltyKick.endLoss}
        </div>
        <div className="end-number">
          {t.penaltyKick.finalScore(goals, TOTAL_KICKS - goals)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.penaltyKick.goals}</div>
            <div className="value">{goals}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.penaltyKick.stops}</div>
            <div className="value">{TOTAL_KICKS - goals}</div>
          </div>
        </div>
        <div className="penalty-dots" aria-label={t.penaltyKick.kickHistory}>
          {kicks.map((kick, index) => (
            <span key={index} className={kick.kind}>
              {kick.kind === "goal" ? "✓" : "×"}
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

  const displayedBall = result?.ball ?? aim;
  const feedback =
    stage === "aiming"
      ? t.penaltyKick.aimPrompt
      : stage === "flying"
        ? t.penaltyKick.shooting
        : result?.kind === "goal"
          ? t.penaltyKick.goal
          : result?.kind === "saved"
            ? t.penaltyKick.saved
            : t.penaltyKick.missed;

  return (
    <section className="card screen penalty-screen">
      <BackLink />
      <div className="penalty-score">
        <strong>{t.penaltyKick.goalsCount(goals)}</strong>
        <span>{t.penaltyKick.kickCount(attempts + 1, TOTAL_KICKS)}</span>
        <strong>{t.penaltyKick.stopsCount(attempts - goals)}</strong>
      </div>

      <div
        className={`feedback ${
          stage === "result"
            ? result?.kind === "goal"
              ? "win pop"
              : "lose pop"
            : ""
        }`}
      >
        {feedback}
      </div>

      <button
        type="button"
        className="penalty-goal"
        onClick={chooseAim}
        disabled={stage !== "aiming"}
        aria-label={t.penaltyKick.goalLabel}
      >
        <span className="penalty-net" aria-hidden="true" />
        {result && (
          <span
            className={`penalty-keeper ${stage !== "aiming" ? "diving" : ""}`}
            style={pointStyle(result.keeper)}
            aria-hidden="true"
          >
            🧤
          </span>
        )}
        <span
          className={`penalty-ball ${stage !== "aiming" ? "shot" : ""} ${
            result?.kind ?? ""
          }`}
          style={pointStyle(displayedBall)}
          aria-hidden="true"
        >
          ⚽
        </span>
        {stage === "aiming" && (
          <span
            className="penalty-target"
            style={pointStyle(aim)}
            aria-hidden="true"
          />
        )}
      </button>

      <label className="penalty-power">
        <span>
          {t.penaltyKick.power} <strong>{power}%</strong>
        </span>
        <input
          type="range"
          min="35"
          max="100"
          value={power}
          disabled={stage !== "aiming"}
          onChange={(event) => setPower(Number(event.target.value))}
        />
      </label>

      <div className="btn-row">
        <button
          className="btn primary penalty-shoot"
          onClick={shoot}
          disabled={stage !== "aiming"}
        >
          {t.penaltyKick.shoot}
        </button>
      </div>

      <div className="penalty-dots" aria-label={t.penaltyKick.kickHistory}>
        {Array.from({ length: TOTAL_KICKS }, (_, index) => {
          const kick = kicks[index];
          return (
            <span
              key={index}
              className={kick?.kind ?? (index === attempts ? "current" : "")}
            >
              {kick ? (kick.kind === "goal" ? "✓" : "×") : index + 1}
            </span>
          );
        })}
      </div>
    </section>
  );
}
