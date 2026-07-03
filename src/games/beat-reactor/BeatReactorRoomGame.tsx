"use client";

/**
 * Beat Reactor room (PvP) screen — sibling to BeatReactorGame.tsx, reusing its
 * reactor-lanes/reactor-note/reactor-pad CSS, but driven by useReactorRoom's
 * local performance of the shared chart. Both players play the same notes;
 * higher score wins.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { LANE_KEYS } from "./types";
import type { Lane } from "./types";
import { useReactorRoom } from "./useReactorRoom";

const LANE_LABELS = ["D", "F", "J", "K"];

export function BeatReactorRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const {
    uid,
    room,
    stage,
    localPlay,
    events,
    nowTime,
    score,
    combo,
    comboMult,
    flash,
    muted,
    setMuted,
    start,
    hitLane,
    playAgain,
    leave,
  } = useReactorRoom(code);

  const upcoming = useMemo(
    () =>
      events.filter((event) => event.hitTime - nowTime >= -0.15 && event.hitTime - nowTime <= 2.2),
    [events, nowTime],
  );

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
  const myFinal = game.results[uid]?.score ?? score;
  const opponentFinal = opponentUid ? game.results[opponentUid]?.score : undefined;

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen reactor-screen">
        <div className="end-emoji">{iWon ? "⚡" : tie ? "🤝" : "🎧"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myFinal, opponentFinal ?? 0)}</div>
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
  if (localPlay === "ready") {
    return (
      <section className="card screen reactor-screen">
        <div className="feedback">{t.beatReactor.rules}</div>
        <div className="toggle-row" style={{ marginTop: 8, justifyContent: "center" }}>
          <label>
            <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
            {t.beatReactor.silentMode}
          </label>
        </div>
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

  /* ================= LOCAL: SUBMITTED (waiting for opponent) ================= */
  if (localPlay === "submitted") {
    return (
      <section className="card screen reactor-screen">
        <div className="end-number">{t.beatReactor.tallyYou(myFinal)}</div>
        <div className="feedback">{t.rooms.submittedWaiting}</div>
        <div className="btn-row">
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= LOCAL: PLAYING ================= */
  return (
    <section className="card screen reactor-screen">
      <div className="reactor-hud">
        <span className="reactor-hud-item you">{t.beatReactor.tallyYou(score)}</span>
        <span className="reactor-hud-item combo">×{comboMult(combo).toFixed(1)}</span>
        <span className="reactor-hud-item them">{opponentName}</span>
      </div>

      <div className="reactor-lanes" role="group" aria-label={t.beatReactor.lanesLabel}>
        {[0, 1, 2, 3].map((lane) => (
          <div key={lane} className="reactor-lane">
            <div className="reactor-lane-track">
              {upcoming
                .filter((event) => event.lane === lane)
                .map((event) => {
                  const progress = 1 - (event.hitTime - nowTime) / 2.2;
                  return (
                    <div
                      key={event.id}
                      className={`reactor-note${event.accent ? " accent" : ""}`}
                      style={{ top: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                    />
                  );
                })}
              {flash && flash.lane === lane && (
                <div key={flash.key} className={`reactor-flash j-${flash.judgement}`}>
                  {t.beatReactor.judgementLabel[flash.judgement]}
                </div>
              )}
            </div>
            <button
              className="btn reactor-pad"
              onClick={() => hitLane(lane as Lane)}
              aria-label={t.beatReactor.laneButtonLabel(lane + 1)}
            >
              {LANE_LABELS[lane]}
              <i>{LANE_KEYS[lane].toUpperCase()}</i>
            </button>
          </div>
        ))}
      </div>

      <div className="reactor-combo-row">
        <span className="you">{t.beatReactor.comboYou(combo)}</span>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
