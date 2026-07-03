"use client";

/**
 * Neon Drift room (PvP) screen — sibling to NeonDriftGame.tsx, reusing its
 * drift-track/drift-car/drift-controls CSS, but driven by useDriftRoom's local
 * time-attack race on the shared track. Both race the same circuit; the faster
 * finish time wins.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { formatTime } from "./logic";
import { centerlinePath } from "./tracks";
import type { CarState } from "./types";
import { useDriftRoom } from "./useDriftRoom";

function Car({ car, className }: { car: CarState; className: string }) {
  const deg = (car.heading * 180) / Math.PI;
  return (
    <g transform={`translate(${car.position.x} ${car.position.y}) rotate(${deg})`} className={className}>
      <rect x={-16} y={-9} width={32} height={18} rx={4} />
      <rect x={6} y={-9} width={8} height={18} rx={2} className="drift-car-nose" />
    </g>
  );
}

export function NeonDriftRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, localRace, car, raceTime, countdown, track, start, setInput, playAgain, leave } =
    useDriftRoom(code);

  if (stage === "connecting") {
    return (
      <section className="card screen">
        <p>{t.rooms.connecting}</p>
      </section>
    );
  }

  if (stage === "gone" || stage === "expired" || !room || !uid) {
    const message =
      stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <div className="btn-row">
          <Link href="/rooms" className="btn primary">
            {t.rooms.backToRooms}
          </Link>
        </div>
      </section>
    );
  }

  if (stage === "error") {
    return (
      <section className="card screen">
        <p>{t.rooms.errorGeneric}</p>
      </section>
    );
  }

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;

  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row">
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  const game = room.game;
  const myTime = game.results[uid]?.finishTime ?? null;
  const opponentTime = opponentUid ? game.results[opponentUid]?.finishTime ?? null : null;

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen drift-screen">
        <div className="end-emoji">{iWon ? "🏁" : tie ? "🤝" : "🏎️"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.neonDrift.finishTimes(formatTime(myTime), formatTime(opponentTime))}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={iVoted}>
            {iVoted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= LOCAL: READY ================= */
  if (localRace === "ready" || !car) {
    return (
      <section className="card screen drift-screen">
        <div className="feedback">{t.neonDrift.trackNames[track.id] ?? track.id}</div>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={start}>
            {t.common.startMatch}
          </button>
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= LOCAL: SUBMITTED ================= */
  if (localRace === "submitted") {
    return (
      <section className="card screen drift-screen">
        <div className="end-number">{formatTime(myTime ?? raceTime)}</div>
        <div className="feedback">{t.rooms.submittedWaiting}</div>
        <div className="btn-row">
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= LOCAL: RACING ================= */
  return (
    <section className="card screen drift-screen">
      <div className="drift-hud">
        <span className="drift-hud-item">{t.neonDrift.lapLabel(Math.min(car.lap || 1, 3), 3)}</span>
        <span className="drift-hud-item">{formatTime(raceTime)}</span>
        <span className="drift-hud-item">{opponentName}</span>
      </div>

      <div className="drift-stage">
        <svg className="drift-track" viewBox="0 0 1000 1000" role="img" aria-label={t.neonDrift.trackAria}>
          <path d={centerlinePath(track)} className="drift-road" style={{ strokeWidth: track.halfWidth * 2 }} />
          <path d={centerlinePath(track)} className="drift-road-edge" style={{ strokeWidth: track.halfWidth * 2 }} />
          <path d={centerlinePath(track)} className="drift-centerline" />
          {track.checkpoints.map((cp, i) => (
            <circle
              key={i}
              cx={cp.x}
              cy={cp.y}
              r={10}
              className={`drift-checkpoint${i === car.checkpoint ? " next" : ""}${i === 0 ? " start" : ""}`}
            />
          ))}
          <Car car={car} className="drift-car player" />
        </svg>

        {countdown > 0 && <div className="drift-countdown">{countdown}</div>}
      </div>

      <div className="drift-boost-bar" aria-label={t.neonDrift.boostLabel}>
        <div className="drift-boost-fill" style={{ width: `${car.boost}%` }} />
      </div>

      <div className="drift-controls">
        <button
          className="btn drift-pad"
          onPointerDown={() => setInput({ steer: -1 })}
          onPointerUp={() => setInput({ steer: 0 })}
          onPointerLeave={() => setInput({ steer: 0 })}
          aria-label={t.neonDrift.steerLeft}
        >
          ◀
        </button>
        <button
          className="btn drift-pad brake"
          onPointerDown={() => setInput({ brake: 1 })}
          onPointerUp={() => setInput({ brake: 0 })}
          onPointerLeave={() => setInput({ brake: 0 })}
          aria-label={t.neonDrift.brake}
        >
          {t.neonDrift.brakeShort}
        </button>
        <button
          className="btn drift-pad boost"
          onPointerDown={() => setInput({ boost: true })}
          onPointerUp={() => setInput({ boost: false })}
          onPointerLeave={() => setInput({ boost: false })}
          aria-label={t.neonDrift.boost}
        >
          {t.neonDrift.boostShort}
        </button>
        <button
          className="btn drift-pad"
          onPointerDown={() => setInput({ steer: 1 })}
          onPointerUp={() => setInput({ steer: 0 })}
          onPointerLeave={() => setInput({ steer: 0 })}
          aria-label={t.neonDrift.steerRight}
        >
          ▶
        </button>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
