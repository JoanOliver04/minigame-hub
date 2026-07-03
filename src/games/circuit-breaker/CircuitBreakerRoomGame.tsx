"use client";

/**
 * Circuit Breaker room (PvP) screen — sibling to CircuitBreakerGame.tsx,
 * reusing its breaker-grid/breaker-cell/breaker-controls CSS, but driven by
 * useBreakerRoom's Firestore-backed lockstep state. Each tick you and your
 * opponent commit a turn; both cycles advance together.
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { GRID_HEIGHT, GRID_WIDTH } from "./types";
import type { TurnAction } from "./types";
import { useBreakerRoom } from "./useBreakerRoom";

export function CircuitBreakerRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, committed, turn, playAgain, leave } = useBreakerRoom(code);

  const opponentUid = room ? Object.keys(room.players).find((id) => id !== uid) : undefined;

  const cellClasses = useMemo(() => {
    const classes: string[] = new Array(GRID_WIDTH * GRID_HEIGHT).fill("");
    if (!room || !uid) return classes;
    const g = room.game;
    for (let i = 0; i < g.grid.length; i++) if (g.grid[i] === 1) classes[i] = "wall";
    const mine = g.cycles[uid];
    const theirs = opponentUid ? g.cycles[opponentUid] : undefined;
    if (mine?.alive) classes[mine.pos.y * GRID_WIDTH + mine.pos.x] = "head player";
    if (theirs?.alive) classes[theirs.pos.y * GRID_WIDTH + theirs.pos.x] = "head ai";
    return classes;
  }, [room, uid, opponentUid]);

  // Arrow keys: left/right turn, up = straight.
  useEffect(() => {
    if (stage !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const action: TurnAction | null =
        k === "arrowleft" || k === "a" ? "left" : k === "arrowright" || k === "d" ? "right" : k === "arrowup" || k === "w" ? "straight" : null;
      if (action) {
        e.preventDefault();
        turn(action);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, turn]);

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
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen breaker-screen">
        <div className="end-emoji">{iWon ? "🏍️" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : "ai-win"}`}>
          {iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
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
  const alive = game.cycles[uid]?.alive;
  let feedback: string;
  if (game.roundJustEnded) {
    feedback =
      game.lastRoundResultUid === uid
        ? t.circuitBreaker.winRound
        : game.lastRoundResultUid === null
          ? t.circuitBreaker.tieRound
          : t.circuitBreaker.loseRound;
  } else if (committed) {
    feedback = t.rooms.submittedWaiting;
  } else {
    feedback = t.circuitBreaker.steer;
  }

  return (
    <section className="card screen breaker-screen">
      <div className="rps-tally">
        <span className="you">{t.circuitBreaker.tallyYou(myScore)}</span>
        <span className="goal">{t.circuitBreaker.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className={`feedback${game.roundJustEnded ? " pop" : ""}`}>{feedback}</div>

      <div
        className="breaker-grid"
        style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)` }}
        role="img"
        aria-label={t.circuitBreaker.arenaLabel}
      >
        {cellClasses.map((cls, i) => (
          <div key={i} className={`breaker-cell ${cls}`} />
        ))}
      </div>

      <div className="breaker-controls">
        <button className="btn breaker-pad" disabled={committed || !alive} onClick={() => turn("left")}>
          ↺ {t.circuitBreaker.turnLeft}
        </button>
        <button className="btn breaker-pad" disabled={committed || !alive} onClick={() => turn("straight")}>
          ↑ {t.circuitBreaker.straight}
        </button>
        <button className="btn breaker-pad" disabled={committed || !alive} onClick={() => turn("right")}>
          ↻ {t.circuitBreaker.turnRight}
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
