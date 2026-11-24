"use client";

/**
 * Neon Drift — UI component. SVG track + transformed car groups, an HTML
 * HUD, and touch steering/brake/boost pads (blueprint §5.3/5.6).
 */

import Link from "next/link";
import { DriftControls } from "./DriftControls";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { boostEfficiency, formatTime } from "./logic";
import { TRACKS, centerlinePath } from "./tracks";
import type { CarState, DriftDifficulty } from "./types";
import { useNeonDrift } from "./useNeonDrift";
import { ghostAt, type Pose } from "./ghost";

function Car({ car, className }: { car: Pose; className: string }) {
  const deg = (car.heading * 180) / Math.PI;
  return (
    <g transform={`translate(${car.position.x} ${car.position.y}) rotate(${deg})`} className={className}>
      <rect x={-16} y={-9} width={32} height={18} rx={4} />
      <rect x={6} y={-9} width={8} height={18} rx={2} className="drift-car-nose" />
    </g>
  );
}

export function NeonDriftGame() {
  const game = useNeonDrift();
  const { t } = useLocale();

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const TRACK_OPTIONS = TRACKS.map((track) => ({
    value: track.id,
    label: t.neonDrift.trackNames[track.id] ?? track.id,
  }));

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    return (
      <section className="card screen drift-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["neon-drift"].name}>
          {t.neonDrift.rules}
        </HowToPlay>

        <span className="field-label">{t.play.mode}</span>
        <SegPicker
          options={[{ value: "duel", label: t.play.duel }, { value: "trial", label: t.play.trial }]}
          value={game.trial ? "trial" : "duel"}
          onChange={value => game.setTrial(value === "trial")}
        />
        {game.trial ? <p className="arcade-caption">{t.play.trialHint}</p> : (
          <>
            <span className="field-label">
              {t.common.aiDifficulty}{" "}
              <InfoTip label={t.neonDrift.difficultyTipLabel}>{t.neonDrift.difficultyTip}</InfoTip>
            </span>
            <SegPicker
              options={DIFFICULTY_OPTIONS}
              value={game.difficulty}
              onChange={value => game.setDifficulty(value as DriftDifficulty)}
            />
          </>
        )}

        <span className="field-label">{t.neonDrift.trackLabel}</span>
        <SegPicker options={TRACK_OPTIONS} value={game.trackId} onChange={game.setTrackId} />
        {game.trial && game.bestTrial && <p className="arcade-readout">{t.neonDrift.personalBest} · {formatTime(game.bestTrial.time)}</p>}

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startRace}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  /* ================= END ================= */
  if (game.phase === "end" && game.player) {
    const won = game.trial || game.outcome === "player";
    const savedTime = game.bestTrial?.time;
    const finishTime = game.player.finishTime;
    const bestTime = savedTime !== undefined && finishTime !== null ? Math.min(savedTime, finishTime) : finishTime ?? savedTime ?? null;
    return (
      <section className="card end-card screen drift-screen">
        <div className="end-emoji">{won ? "🏁" : game.outcome === "tie" ? "🤝" : "🤖"}</div>
        <div className={`end-title ${won ? "player-win" : game.outcome === "ai" ? "ai-win" : ""}`}>
          {game.trial ? t.play.finishTrial : t.neonDrift.endTitle(game.outcome ?? "tie")}
        </div>
        <div className="end-number">
          {game.trial ? formatTime(game.player.finishTime) : t.neonDrift.finishTimes(
            formatTime(game.player.finishTime),
            formatTime(game.ai?.finishTime ?? null),
          )}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{game.trial ? t.neonDrift.personalBest : t.neonDrift.bestLap}</div>
            <div className="value">{formatTime(game.trial ? bestTime : game.player.bestLap)}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.neonDrift.offTrack}</div>
            <div className="value">{game.player.offTrackTime.toFixed(1)}s</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.neonDrift.boostEff}</div>
            <div className="value">{boostEfficiency(game.player, game.raceTime)}%</div>
          </div>
          {game.personalBest !== null && (
            <div className="stat-box neutral">
              <div className="label">{t.neonDrift.personalBest}</div>
              <div className="value">{formatTime(game.personalBest)}</div>
            </div>
          )}
          {game.trial && game.opponentGhost && <div className="stat-box neutral">
            <div className="label">{t.play.previousBest}</div>
            <div className="value">{formatTime(game.opponentGhost.time)}</div>
          </div>}
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={game.playAgain}>
            {t.common.playAgain}
          </button>
          <button className="btn" onClick={game.toSetup}>
            {t.common.changeSettings}
          </button>
          <Link href="/" className="btn">
            {t.common.returnToHub}
          </Link>
        </div>
      </section>
    );
  }

  /* ================= RACING ================= */
  if (!game.player) return null;
  const track = game.track;
  // Checkpoint zero is the finish line, after every other checkpoint.
  const progress = (car: CarState) => car.lap * track.checkpoints.length +
    (car.checkpoint || track.checkpoints.length);
  const distanceToNext = (car: CarState) => {
    const next = track.checkpoints[car.checkpoint];
    return Math.hypot(car.position.x - next.x, car.position.y - next.y);
  };
  const leading = game.ai && (progress(game.player) === progress(game.ai)
    ? distanceToNext(game.player) <= distanceToNext(game.ai)
    : progress(game.player) > progress(game.ai));
  const ghost = game.opponentGhost ? ghostAt(game.opponentGhost, game.raceTime) : null;

  return (
    <section className="card screen drift-screen">
      <BackLink />

      <div className="drift-hud">
        <span className="drift-hud-item">
          {game.trial ? t.play.trial : t.neonDrift.lapLabel(Math.min(game.player.lap + 1, game.totalLaps), game.totalLaps)}
        </span>
        <span className="drift-hud-item">{formatTime(game.raceTime)}</span>
        <span className={`drift-hud-item${game.trial ? "" : leading ? " lead" : " behind"}`}>
          {game.trial ? t.play.checkpoint(game.player.checkpoint || track.checkpoints.length, track.checkpoints.length)
            : leading ? t.neonDrift.leading : t.neonDrift.chasing}
        </span>
      </div>

      <div className="drift-stage">
        <svg
          className="drift-track"
          viewBox="0 0 1000 1000"
          role="img"
          aria-label={t.neonDrift.trackAria}
        >
          <path d={centerlinePath(track)} className="drift-road" style={{ strokeWidth: track.halfWidth * 2 }} />
          <path d={centerlinePath(track)} className="drift-road-edge" style={{ strokeWidth: track.halfWidth * 2 }} />
          <path d={centerlinePath(track)} className="drift-centerline" />
          {track.checkpoints.map((cp, i) => (
            <circle
              key={i}
              cx={cp.x}
              cy={cp.y}
              r={10}
              className={`drift-checkpoint${i === game.player!.checkpoint ? " next" : ""}${i === 0 ? " start" : ""}`}
            />
          ))}
          {game.ai && <Car car={game.ai} className="drift-car ai" />}
          {ghost && <Car car={ghost} className="drift-car ghost" />}
          <Car car={game.player} className="drift-car player" />
        </svg>

        {game.phase === "paused"
          ? <div className="drift-countdown paused" aria-hidden="true">Ⅱ</div>
          : game.countdown > 0 && <div className="drift-countdown">{game.countdown}</div>}
      </div>

      <div className="drift-boost-bar" aria-label={t.neonDrift.boostLabel}>
        <div className="drift-boost-fill" style={{ width: `${game.player.boost}%` }} />
      </div>

      {game.player.lastLap !== undefined && <p className="arcade-readout">
        {t.play.raceSplit} · {formatTime(game.player.lastLap)}　{t.neonDrift.bestLap} · {formatTime(game.player.bestLap)}
      </p>}
      <DriftControls bindControl={game.bindControl} />
      {game.opponentGhost && <p className="arcade-caption"><span className="ghost-key" aria-hidden="true" /> {t.play.ghost} · {formatTime(game.opponentGhost.time)}</p>}
      <div className="btn-row drift-actions">
        <button className="btn" onClick={game.phase === "paused" ? game.resume : game.pause}>
          {game.phase === "paused" ? t.play.resumeRace : t.play.pauseRace}
        </button>
        {game.trial && <button className="btn" onClick={game.startRace}>{t.play.restartTrial}</button>}
      </div>
    </section>
  );
}
