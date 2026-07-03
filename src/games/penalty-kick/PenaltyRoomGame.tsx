"use client";

/**
 * Penalty Kick room (PvP) screen — sibling to PenaltyKickGame.tsx, reusing
 * shared card/screen/rps-tally/feedback/log CSS so the two modes look
 * consistent, but driven by usePenaltyRoom's Firestore-backed state instead
 * of the local physics AI. Each round one player shoots and one keeps; both
 * pick a goal zone blind and the round resolves once both are in.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { usePenaltyRoom } from "./usePenaltyRoom";
import { PENALTY_ZONES, type PenaltyZone } from "./room";

export function PenaltyRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, hasSubmitted, isShooter, playZone, playAgain, leave } =
    usePenaltyRoom(code);

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
    const iWon = myScore > opponentScore;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : "🤝"}</div>
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
  const zoneLabel: Record<PenaltyZone, string> = t.penaltyRoom.zones;
  const roleBanner = isShooter ? t.penaltyRoom.youShoot : t.penaltyRoom.youKeep;
  const prompt = hasSubmitted
    ? t.rooms.submittedWaiting
    : isShooter
      ? t.penaltyRoom.shootPrompt
      : t.penaltyRoom.keepPrompt;

  const last = game.history[0];
  let lastRoundMsg: string | null = null;
  if (last) {
    const iShotLast = last.shooterUid === uid;
    lastRoundMsg = last.goal
      ? iShotLast
        ? t.penaltyRoom.resultYouScored
        : t.penaltyRoom.resultConceded
      : iShotLast
        ? t.penaltyRoom.resultYouMissed
        : t.penaltyRoom.resultYouSaved;
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.penaltyRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.penaltyRoom.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">{roleBanner}</div>
      <div className="feedback">{prompt}</div>
      {lastRoundMsg && <div className="feedback">{lastRoundMsg}</div>}

      <div className={`pk-goal${hasSubmitted ? " locked" : ""}`}>
        {PENALTY_ZONES.map((zone) => {
          const picked = game.pendingMoves[uid] === zone;
          return (
            <button
              key={zone}
              className={`pk-zone${picked ? " picked" : ""}`}
              disabled={hasSubmitted}
              onClick={() => playZone(zone)}
              aria-label={zoneLabel[zone]}
              aria-pressed={picked}
            >
              {isShooter ? "⚽" : "🧤"}
            </button>
          );
        })}
      </div>

      <div className="log-title">{t.penaltyRoom.historyLabel}</div>
      <ul className="log">
        {game.history.map((entry) => {
          const iShot = entry.shooterUid === uid;
          const shooterName = iShot ? t.penaltyRoom.youWord : opponentName;
          return (
            <li key={entry.id} className={entry.goal === iShot ? "player" : "ai"}>
              <span className="mv">
                {entry.goal ? "⚽" : "🧤"} {shooterName}
              </span>
              <span className="verdict" style={{ flex: "none" }}>
                {zoneLabel[entry.shot]}
              </span>
              <span className={`verdict ${entry.goal ? "win" : "lose"}`}>
                {entry.goal ? t.penaltyRoom.goalWord : t.penaltyRoom.saveWord}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
