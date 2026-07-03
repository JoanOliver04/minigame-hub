"use client";

/**
 * Blackjack room (PvP) screen — sibling to BlackjackGame.tsx, reusing its
 * bj-hand-row/bj-hand-cards/bj-actions CSS and the shared CardFace, but driven
 * by useBlackjackRoom's Firestore-backed state. A 21 duel: closest to 21
 * without busting wins the round.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { CardFace } from "../higher-or-lower/CardFace";
import { calculateHandValue } from "./logic";
import { useBlackjackRoom } from "./useBlackjackRoom";

export function BlackjackRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, hit, stand, playAgain, leave } = useBlackjackRoom(code);

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
        <div className="end-stats">
          <div className="stat-box neutral">
            <div className="label">{t.blackjack.pushes}</div>
            <div className="value">{game.pushes}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.common.roundsPlayed}</div>
            <div className="value">{game.rounds}</div>
          </div>
        </div>
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
  const myHand = game.hands[uid] ?? [];
  const opponentHand = game.hands[opponentUid] ?? [];
  const myValue = calculateHandValue(myHand);
  const opponentValue = calculateHandValue(opponentHand);
  const busy = !isMyTurn || game.stood[uid];

  const totalText = (value: ReturnType<typeof calculateHandValue>) =>
    value.isBlackjack ? t.blackjack.blackjackLabel : t.blackjack.totalLabel(value.total, value.isSoft, value.isBust);

  let feedback = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");
  let feedbackClass = "";
  const last = game.lastOutcome;
  if (last) {
    const outcome = last.winnerUid === null ? "push" : last.winnerUid === uid ? "win" : "lose";
    feedback =
      outcome === "win"
        ? t.rooms.roundResultWin
        : outcome === "lose"
          ? t.rooms.roundResultLose
          : t.blackjack.pushRound;
    feedbackClass = outcome === "win" ? " win" : outcome === "lose" ? " lose" : " tie";
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.blackjack.tallyYou(myScore)}</span>
        <span className="goal">{t.blackjack.tallyGoal(game.target, game.pushes)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading ai">
          <span className="who">{opponentName}</span>
          {opponentHand.length > 0 && (
            <span className={`bj-hand-total${opponentValue.isBust ? " bust" : ""}${opponentValue.isBlackjack ? " blackjack" : ""}`}>
              {totalText(opponentValue)}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {opponentHand.map((card) => (
            <CardFace key={card.id} card={card} flipping label={opponentName ?? "?"} />
          ))}
        </div>
      </div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading player">
          <span className="who">{t.common.you}</span>
          {myHand.length > 0 && (
            <span className={`bj-hand-total${myValue.isBust ? " bust" : ""}${myValue.isBlackjack ? " blackjack" : ""}`}>
              {totalText(myValue)}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {myHand.map((card) => (
            <CardFace key={card.id} card={card} flipping label={t.common.you} />
          ))}
        </div>
      </div>

      <div className="btn-row bj-actions">
        <button className="btn primary" disabled={busy} onClick={hit}>
          {t.blackjack.hitButton}
        </button>
        <button className="btn" disabled={busy} onClick={stand}>
          {t.blackjack.standButton}
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
