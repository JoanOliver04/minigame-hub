"use client";

/**
 * Windline Archery room (PvP) screen — sibling to WindlineArcheryGame.tsx,
 * reusing its archery-target/archery-wind/archery-meter/archery-controls CSS,
 * but driven by useArcheryRoom's Firestore-backed state. Both archers shoot
 * the same wind each end; highest 5-end total wins (blueprint tie-breaks).
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useArcheryRoom } from "./useArcheryRoom";

const RING_COLORS = ["#f4f1de", "#111827", "#5bc8ff", "#e5533d", "#ffd166"];
const clampDot = (v: number) => Math.max(-1.25, Math.min(1.25, v));

export function ArcheryRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const {
    uid,
    room,
    stage,
    aimStage,
    angle,
    windage,
    power,
    meterValue,
    setAngle,
    setWindage,
    setPower,
    draw,
    release,
    playAgain,
    leave,
  } = useArcheryRoom(code);

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
  const myScore = game.scores[uid] ?? 0;
  const opponentScore = game.scores[opponentUid] ?? 0;

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen archery-screen">
        <div className="end-emoji">{iWon ? "🏹" : tie ? "🤝" : "🎯"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myScore, opponentScore)}</div>
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

  /* ================= PLAYING ================= */
  const wind = game.wind;
  const submitted = aimStage === "submitted";

  let feedback: string;
  if (submitted) feedback = t.rooms.submittedWaiting;
  else if (aimStage === "meter") feedback = t.windlineArchery.releasePrompt;
  else feedback = t.windlineArchery.aimPrompt;

  return (
    <section className="card screen archery-screen">
      <div className="archery-hud">
        <span className="archery-hud-item">{t.windlineArchery.endLabel(game.endIndex + 1, game.totalEnds)}</span>
        <span className="archery-hud-item">{t.windlineArchery.tallyYou(myScore)}</span>
        <span className="archery-hud-item">{opponentName}: {opponentScore}</span>
      </div>

      <div className="archery-wind" aria-live="polite">
        <span>{t.windlineArchery.windLabel}</span>
        <span
          className="archery-wind-arrow"
          style={{ transform: `rotate(${(Math.atan2(-wind.vertical, wind.horizontal) * 180) / Math.PI}deg)` }}
          aria-hidden="true"
        >
          ➜
        </span>
        <b>{Math.hypot(wind.horizontal, wind.vertical).toFixed(1)} m/s</b>
        <span className="archery-wind-detail">{t.windlineArchery.windDetail(wind.horizontal, wind.vertical)}</span>
      </div>

      <svg className="archery-target" viewBox="-1.3 -1.3 2.6 2.6" role="img" aria-label={t.windlineArchery.targetLabel}>
        {[1, 0.8, 0.6, 0.4, 0.2].map((r, i) => (
          <circle key={r} cx="0" cy="0" r={r} fill={RING_COLORS[i]} stroke="#0f1220" strokeWidth="0.015" />
        ))}
        {game.results.map((end, i) => {
          const mine = end.arrows[uid];
          const theirs = opponentUid ? end.arrows[opponentUid] : undefined;
          const fresh = i === game.results.length - 1;
          return (
            <g key={i}>
              {theirs && (
                <circle cx={clampDot(theirs.impact.x)} cy={clampDot(-theirs.impact.y)} r="0.055" className={`archery-dot ai${fresh ? " fresh" : ""}`} />
              )}
              {mine && (
                <circle cx={clampDot(mine.impact.x)} cy={clampDot(-mine.impact.y)} r="0.055" className={`archery-dot player${fresh ? " fresh" : ""}`} />
              )}
            </g>
          );
        })}
      </svg>

      <div className="feedback" aria-live="polite">{feedback}</div>

      {aimStage === "meter" ? (
        <div className="archery-meter-wrap">
          <div
            className="archery-meter"
            role="slider"
            aria-label={t.windlineArchery.meterLabel}
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round(meterValue * 100)}
          >
            <div className="zone" />
            <div className="needle" style={{ left: `${50 + meterValue * 48}%` }} />
          </div>
          <button className="btn primary archery-release" onClick={release}>
            {t.windlineArchery.releaseButton}
          </button>
        </div>
      ) : (
        <div className="archery-controls">
          <label className="archery-slider">
            {t.windlineArchery.angleLabel(angle)}
            <input type="range" min={2} max={20} step={0.5} value={angle} disabled={submitted} onChange={(e) => setAngle(Number(e.target.value))} />
          </label>
          <label className="archery-slider">
            {t.windlineArchery.windageLabel(windage)}
            <input type="range" min={-4} max={4} step={0.1} value={windage} disabled={submitted} onChange={(e) => setWindage(Number(e.target.value))} />
          </label>
          <label className="archery-slider">
            {t.windlineArchery.powerLabel(power)}
            <input type="range" min={30} max={100} step={1} value={power} disabled={submitted} onChange={(e) => setPower(Number(e.target.value))} />
          </label>
          <button className="btn primary" disabled={submitted} onClick={draw}>
            {t.windlineArchery.drawButton}
          </button>
        </div>
      )}

      <div className="archery-ends">
        {Array.from({ length: game.totalEnds }, (_, i) => {
          const end = game.results[i];
          return (
            <div key={i} className={`archery-end-chip${i === game.endIndex ? " current" : ""}`}>
              <span>{i + 1}</span>
              <b className="you">{end?.arrows[uid] ? end.arrows[uid].score : "–"}</b>
              <b className="them">{end && opponentUid && end.arrows[opponentUid] ? end.arrows[opponentUid].score : "–"}</b>
            </div>
          );
        })}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
