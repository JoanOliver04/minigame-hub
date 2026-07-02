"use client";

/**
 * Neon Drift — UI component. SVG track + transformed car groups, an HTML
 * HUD, and touch steering/brake/boost pads (blueprint §5.3/5.6).
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { boostEfficiency, formatTime } from "./logic";
import { TRACKS, centerlinePath } from "./tracks";
import type { CarState, DriftDifficulty } from "./types";
import { useNeonDrift } from "./useNeonDrift";

function Car({ car, className }: { car: CarState; className: string }) {
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
  const [difficulty, setDifficulty] = useState<DriftDifficulty>("medium");

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
        <HowToPlay title={t.gamesMeta["neon-drift"].name}>{t.neonDrift.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.neonDrift.difficultyTipLabel}>{t.neonDrift.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v as DriftDifficulty);
            game.setDifficulty(v as DriftDifficulty);
          }}
        />

        <span className="field-label">{t.neonDrift.trackLabel}</span>
        <SegPicker options={TRACK_OPTIONS} value={game.trackId} onChange={game.setTrackId} />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startRace}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  /* ================= END ================= */
  if (game.phase === "end" && game.player && game.ai) {
    const won = game.outcome === "player";
    return (
      <section className="card end-card screen drift-screen">
        <div className="end-emoji">{won ? "🏁" : game.outcome === "tie" ? "🤝" : "🤖"}</div>
        <div className={`end-title ${won ? "player-win" : game.outcome === "ai" ? "ai-win" : ""}`}>
          {t.neonDrift.endTitle(game.outcome ?? "tie")}
        </div>
        <div className="end-number">
          {t.neonDrift.finishTimes(
            formatTime(game.player.finishTime),
            formatTime(game.ai.finishTime),
          )}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.neonDrift.bestLap}</div>
            <div className="value">{formatTime(game.player.bestLap)}</div>
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
  if (!game.player || !game.ai) return null;
  const track = game.track;
  const leading =
    game.player.lap > game.ai.lap ||
    (game.player.lap === game.ai.lap && game.player.checkpoint >= game.ai.checkpoint);

  return (
    <section className="card screen drift-screen">
      <BackLink />

      <div className="drift-hud">
        <span className="drift-hud-item">
          {t.neonDrift.lapLabel(Math.min(game.player.lap || 1, game.totalLaps), game.totalLaps)}
        </span>
        <span className="drift-hud-item">{formatTime(game.raceTime)}</span>
        <span className={`drift-hud-item ${leading ? "lead" : "behind"}`}>
          {leading ? t.neonDrift.leading : t.neonDrift.chasing}
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
          <Car car={game.ai} className="drift-car ai" />
          <Car car={game.player} className="drift-car player" />
        </svg>

        {game.countdown > 0 && <div className="drift-countdown">{game.countdown}</div>}
      </div>

      <div className="drift-boost-bar" aria-label={t.neonDrift.boostLabel}>
        <div className="drift-boost-fill" style={{ width: `${game.player.boost}%` }} />
      </div>

      <div className="drift-controls">
        <button
          className="btn drift-pad"
          onPointerDown={() => game.setInput({ steer: -1 })}
          onPointerUp={() => game.setInput({ steer: 0 })}
          onPointerLeave={() => game.setInput({ steer: 0 })}
          aria-label={t.neonDrift.steerLeft}
        >
          ◀
        </button>
        <button
          className="btn drift-pad brake"
          onPointerDown={() => game.setInput({ brake: 1 })}
          onPointerUp={() => game.setInput({ brake: 0 })}
          onPointerLeave={() => game.setInput({ brake: 0 })}
          aria-label={t.neonDrift.brake}
        >
          {t.neonDrift.brakeShort}
        </button>
        <button
          className="btn drift-pad boost"
          onPointerDown={() => game.setInput({ boost: true })}
          onPointerUp={() => game.setInput({ boost: false })}
          onPointerLeave={() => game.setInput({ boost: false })}
          aria-label={t.neonDrift.boost}
        >
          {t.neonDrift.boostShort}
        </button>
        <button
          className="btn drift-pad"
          onPointerDown={() => game.setInput({ steer: 1 })}
          onPointerUp={() => game.setInput({ steer: 0 })}
          onPointerLeave={() => game.setInput({ steer: 0 })}
          aria-label={t.neonDrift.steerRight}
        >
          ▶
        </button>
      </div>
    </section>
  );
}
