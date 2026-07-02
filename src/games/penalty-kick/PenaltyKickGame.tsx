"use client";

import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { aimSector } from "./logic";
import type { PenaltyDifficulty, Point, ShotStyle } from "./types";
import { TOTAL_KICKS, usePenaltyKick } from "./usePenaltyKick";

const STYLE_ORDER: ShotStyle[] = ["placed", "power", "chip"];

function pointStyle(point: Point): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` };
}

function kickSymbol(kind: "goal" | "saved" | "post" | "miss") {
  if (kind === "goal") return "✓";
  if (kind === "saved") return "◆";
  if (kind === "post") return "!";
  return "×";
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
    style,
    result,
    kicks,
    goals,
    saves,
    misses,
    onTarget,
    bestQuality,
    estimate,
    startMatch,
    chooseStyle,
    shoot,
    toSetup,
  } = usePenaltyKick();
  const attempts = kicks.length;
  const sector = aimSector(aim);
  const targetName = t.penaltyKick.targetName(
    sector.horizontal,
    sector.vertical,
  );

  function chooseAim(event: MouseEvent<HTMLButtonElement>) {
    if (stage !== "aiming" || event.detail === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setAim({
      x: Math.min(
        95,
        Math.max(5, ((event.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.min(
        93,
        Math.max(7, ((event.clientY - rect.top) / rect.height) * 100),
      ),
    });
  }

  function handleGoalKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (stage !== "aiming") return;
    const amount = event.shiftKey ? 10 : 4;
    let next = aim;

    if (event.key === "ArrowLeft") {
      next = { ...aim, x: Math.max(5, aim.x - amount) };
    } else if (event.key === "ArrowRight") {
      next = { ...aim, x: Math.min(95, aim.x + amount) };
    } else if (event.key === "ArrowUp") {
      next = { ...aim, y: Math.max(7, aim.y - amount) };
    } else if (event.key === "ArrowDown") {
      next = { ...aim, y: Math.min(93, aim.y + amount) };
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      shoot();
      return;
    } else {
      return;
    }

    event.preventDefault();
    setAim(next);
  }

  if (phase === "setup") {
    return (
      <section className="card screen penalty-setup">
        <BackLink />
        <HowToPlay title={t.gamesMeta["penalty-kick"].name}>
          {t.penaltyKick.rules}
        </HowToPlay>

        <div className="penalty-setup-hero" aria-hidden="true">
          <span className="penalty-setup-ball">⚽</span>
          <span className="penalty-setup-goal" />
        </div>

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

        <div className="penalty-setup-note">
          <span>5</span>
          <p>{t.penaltyKick.setupSummary}</p>
        </div>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button
            className="btn primary penalty-start"
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
    const conversion = Math.round((goals / TOTAL_KICKS) * 100);
    return (
      <section className="card end-card screen penalty-end">
        <div className="end-emoji">{won ? "🏆" : "🧤"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.penaltyKick.endWin : t.penaltyKick.endLoss}
        </div>
        <div className="penalty-rating">{t.penaltyKick.endRating(goals)}</div>
        <div className="end-number">
          {t.penaltyKick.finalScore(goals, TOTAL_KICKS - goals)}
        </div>
        <div className="end-stats penalty-end-stats">
          <div className="stat-box player">
            <div className="label">{t.penaltyKick.goals}</div>
            <div className="value">{goals}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.penaltyKick.conversion}</div>
            <div className="value">{conversion}%</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.penaltyKick.saves}</div>
            <div className="value">{saves}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.penaltyKick.bestQuality}</div>
            <div className="value">{bestQuality}%</div>
          </div>
        </div>
        <div className="penalty-dots" aria-label={t.penaltyKick.kickHistory}>
          {kicks.map((kick, index) => (
            <span
              key={index}
              className={kick.kind}
              title={t.penaltyKick.resultName[kick.kind]}
            >
              {kickSymbol(kick.kind)}
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

  const feedback =
    stage === "aiming"
      ? t.penaltyKick.aimPrompt(targetName)
      : stage === "flying"
        ? t.penaltyKick.shooting
        : result
          ? t.penaltyKick.resultName[result.kind]
          : "";
  const keeperPoint = result?.keeper ?? { x: 50, y: 75 };
  const displayedBall = result?.ball ?? { x: 50, y: 128 };
  const powerDelta = power - estimate.idealPower;

  return (
    <section className="card screen penalty-screen">
      <BackLink />

      <div className="penalty-score">
        <strong>{t.penaltyKick.goalsCount(goals)}</strong>
        <span>
          {t.penaltyKick.kickCount(
            stage === "aiming" ? attempts + 1 : attempts,
            TOTAL_KICKS,
          )}
        </span>
        <strong>{t.penaltyKick.stopsCount(attempts - goals)}</strong>
      </div>

      <div
        className={`feedback penalty-feedback ${
          stage === "result"
            ? result?.kind === "goal"
              ? "win pop"
              : "lose pop"
            : ""
        }`}
        aria-live="polite"
      >
        {feedback}
      </div>

      <div className="penalty-stadium">
        <div className="penalty-crowd" aria-hidden="true" />
        <button
          type="button"
          className="penalty-goal"
          onClick={chooseAim}
          onKeyDown={handleGoalKey}
          disabled={stage !== "aiming"}
          aria-label={t.penaltyKick.goalLabel(targetName)}
        >
          <span className="penalty-net" aria-hidden="true" />
          <span className="penalty-goal-depth" aria-hidden="true" />

          <span
            className={`penalty-keeper ${
              result && stage !== "aiming" ? "diving" : "ready"
            }`}
            style={pointStyle(keeperPoint)}
            aria-hidden="true"
          >
            <span className="penalty-keeper-head" />
            <span className="penalty-keeper-body" />
            <span className="penalty-keeper-arm left" />
            <span className="penalty-keeper-arm right" />
            <span className="penalty-keeper-leg left" />
            <span className="penalty-keeper-leg right" />
          </span>

          {stage === "flying" && result && (
            <span
              className="penalty-trail"
              style={pointStyle(result.ball)}
              aria-hidden="true"
            />
          )}
          <span
            className={`penalty-ball ${
              result && stage !== "aiming" ? "shot" : "ready"
            } ${result?.kind ?? ""} ${result?.style ?? style}`}
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
            >
              <i />
            </span>
          )}
        </button>
        <div className="penalty-spot" aria-hidden="true" />
      </div>

      {stage === "result" && result ? (
        <div className="penalty-result-card">
          <div>
            <span>{t.penaltyKick.shotStyle}</span>
            <strong>{t.penaltyKick.styles[result.style]}</strong>
          </div>
          <div>
            <span>{t.penaltyKick.quality}</span>
            <strong>{result.quality}%</strong>
          </div>
          <div>
            <span>{t.penaltyKick.speed}</span>
            <strong>{result.speed} km/h</strong>
          </div>
          <div>
            <span>{t.penaltyKick.keeperDecision}</span>
            <strong>
              {t.penaltyKick.keeperStrategies[result.keeperStrategy]}
            </strong>
          </div>
        </div>
      ) : (
        <div className="penalty-controls">
          <span className="field-label penalty-control-label">
            {t.penaltyKick.shotStyle}
          </span>
          <div className="penalty-style-grid">
            {STYLE_ORDER.map((option) => (
              <button
                type="button"
                key={option}
                className={option === style ? "selected" : ""}
                aria-pressed={option === style}
                disabled={stage !== "aiming"}
                onClick={() => chooseStyle(option)}
              >
                <b>{t.penaltyKick.styles[option]}</b>
                <small>{t.penaltyKick.styleDescriptions[option]}</small>
              </button>
            ))}
          </div>

          <label className="penalty-power">
            <span>
              {t.penaltyKick.power}
              <strong>{power}%</strong>
            </span>
            <div className="penalty-range-wrap">
              <span
                className="penalty-ideal"
                style={{
                  left: `${((estimate.idealPower - 35) / 65) * 100}%`,
                }}
                aria-hidden="true"
              />
              <input
                type="range"
                min="35"
                max="100"
                value={power}
                disabled={stage !== "aiming"}
                aria-label={t.penaltyKick.power}
                onChange={(event) => setPower(Number(event.target.value))}
              />
            </div>
            <small className={Math.abs(powerDelta) <= 7 ? "ideal" : ""}>
              {t.penaltyKick.powerHint(power, estimate.idealPower)}
            </small>
          </label>

          <div className="penalty-preview">
            <span>
              {t.penaltyKick.target} <b>{targetName}</b>
            </span>
            <span>
              {t.penaltyKick.estimatedAccuracy}{" "}
              <b>{estimate.accuracy}%</b>
            </span>
            <span>
              {t.penaltyKick.estimatedSpeed} <b>{estimate.speed} km/h</b>
            </span>
          </div>

          <div className="btn-row">
            <button
              className="btn primary penalty-shoot"
              onClick={shoot}
              disabled={stage !== "aiming"}
            >
              <span aria-hidden="true">⚽</span> {t.penaltyKick.shoot}
            </button>
          </div>
          <p className="penalty-keyboard-hint">
            {t.penaltyKick.keyboardHint}
          </p>
        </div>
      )}

      <div className="penalty-dots" aria-label={t.penaltyKick.kickHistory}>
        {Array.from({ length: TOTAL_KICKS }, (_, index) => {
          const kick = kicks[index];
          return (
            <span
              key={index}
              className={
                kick?.kind ??
                (stage === "aiming" && index === attempts ? "current" : "")
              }
              title={
                kick
                  ? t.penaltyKick.resultName[kick.kind]
                  : t.penaltyKick.pendingKick(index + 1)
              }
            >
              {kick ? kickSymbol(kick.kind) : index + 1}
            </span>
          );
        })}
      </div>

      <div className="penalty-mini-stats">
        <span>{t.penaltyKick.onTargetCount(onTarget)}</span>
        <span>{t.penaltyKick.missCount(misses)}</span>
      </div>
    </section>
  );
}
