"use client";

/**
 * Basket Shot room (PvP) screen — sibling to BasketShotGame.tsx, reusing the
 * shared card/screen/rps-tally/rps-choices/feedback/log CSS so the two modes
 * look consistent, but driven by useBasketRoom's Firestore-backed state. Each
 * round one player shoots and one defends; both pick a spot blind and the
 * round resolves once both are in.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useBasketRoom } from "./useBasketRoom";
import { BASKET_SPOTS, SPOT_POINTS, type BasketSpot } from "./room";

const SPOT_EMOJI: Record<BasketSpot, string> = { layup: "🏀", mid: "🎯", three: "🌟" };

export function BasketRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, hasSubmitted, isShooter, playSpot, playAgain, leave } =
    useBasketRoom(code);

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
  const spotLabel: Record<BasketSpot, string> = t.basketRoom.spots;
  const roleBanner = isShooter ? t.basketRoom.youShoot : t.basketRoom.youDefend;
  const prompt = hasSubmitted
    ? t.rooms.submittedWaiting
    : isShooter
      ? t.basketRoom.shootPrompt
      : t.basketRoom.defendPrompt;

  const last = game.history[0];
  let lastRoundMsg: string | null = null;
  if (last) {
    const iShotLast = last.shooterUid === uid;
    const scored = last.points > 0;
    lastRoundMsg = scored
      ? iShotLast
        ? t.basketRoom.resultYouScored(last.points)
        : t.basketRoom.resultConceded(last.points)
      : iShotLast
        ? t.basketRoom.resultYouBlocked
        : t.basketRoom.resultYouStopped;
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.basketRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.basketRoom.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">{roleBanner}</div>
      <div className="feedback">{prompt}</div>
      {lastRoundMsg && <div className="feedback">{lastRoundMsg}</div>}

      <div className="rps-choices">
        {BASKET_SPOTS.map((spot) => {
          const picked = game.pendingMoves[uid] === spot;
          return (
            <button
              key={spot}
              className={`rps-choice${picked ? " picked" : ""}`}
              disabled={hasSubmitted}
              onClick={() => playSpot(spot)}
              aria-pressed={picked}
            >
              <span className="emoji">{SPOT_EMOJI[spot]}</span>
              <span className="label">{spotLabel[spot]}</span>
              <span className="label" style={{ color: "var(--text-dim)", fontWeight: 600 }}>
                {t.basketRoom.pts(SPOT_POINTS[spot])}
              </span>
            </button>
          );
        })}
      </div>

      <div className="log-title">{t.basketRoom.historyLabel}</div>
      <ul className="log">
        {game.history.map((entry) => {
          const iShot = entry.shooterUid === uid;
          const scored = entry.points > 0;
          const shooterName = iShot ? t.basketRoom.youWord : opponentName;
          return (
            <li key={entry.id} className={scored === iShot ? "player" : "ai"}>
              <span className="mv">
                {SPOT_EMOJI[entry.shot]} {shooterName}
              </span>
              <span className="verdict" style={{ flex: "none" }}>
                {spotLabel[entry.shot]}
              </span>
              <span className={`verdict ${scored ? "win" : "lose"}`}>
                {scored ? t.basketRoom.plusPts(entry.points) : t.basketRoom.blockedWord}
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
