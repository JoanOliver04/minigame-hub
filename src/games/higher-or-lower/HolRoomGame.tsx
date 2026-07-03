"use client";

/**
 * Higher or Lower room (PvP) screen — sibling to HigherOrLowerGame.tsx,
 * reusing CardFace and the shared hol/card/feedback/log CSS, but driven by
 * useHolRoom's Firestore-backed state. Players alternate calling higher or
 * lower on a shared deck; a correct call scores a point.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { CardFace, cardLabel } from "./CardFace";
import { useHolRoom } from "./useHolRoom";
import type { HolCall } from "./room";

const CALLS: HolCall[] = ["higher", "lower"];
const CALL_EMOJI: Record<HolCall, string> = { higher: "⬆️", lower: "⬇️" };

export function HolRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, call, playAgain, leave } = useHolRoom(code);

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
  const callLabel: Record<HolCall, string> = t.holRoom.calls;

  if (stage === "finished") {
    const tie = myScore === opponentScore;
    const iWon = myScore > opponentScore;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : tie ? "🤝" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie
            ? t.holRoom.tieTitle
            : iWon
              ? t.rooms.matchWinYou
              : t.rooms.matchWinOpponent(opponentName ?? "?")}
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
  const last = game.history[0];
  let lastMsg: string | null = null;
  if (last) {
    const who = last.uid === uid ? t.holRoom.youWord : opponentName ?? "?";
    lastMsg = t.holRoom.lastCall(who, callLabel[last.call], last.correct);
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.holRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.holRoom.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">
        {isMyTurn ? t.holRoom.yourTurn : t.holRoom.opponentTurn(opponentName ?? "?")}
      </div>

      <div className="hol-arena" style={{ justifyContent: "center", display: "flex", margin: "10px 0" }}>
        <CardFace card={game.currentCard} label={t.holRoom.currentLabel} />
      </div>

      <div className="feedback">{t.holRoom.callPrompt}</div>
      {lastMsg && <div className="feedback">{lastMsg}</div>}

      <div className="rps-choices">
        {CALLS.map((choice) => (
          <button
            key={choice}
            className="rps-choice"
            disabled={!isMyTurn}
            onClick={() => call(choice)}
          >
            <span className="emoji">{CALL_EMOJI[choice]}</span>
            <span className="label">{callLabel[choice]}</span>
          </button>
        ))}
      </div>

      <div className="log-title">{t.holRoom.logTitle}</div>
      <ul className="log">
        {game.history.map((entry) => {
          const who = entry.uid === uid ? t.holRoom.youWord : opponentName ?? "?";
          return (
            <li key={entry.id} className={entry.correct === (entry.uid === uid) ? "player" : "ai"}>
              <span className="mv">
                {CALL_EMOJI[entry.call]} {who}
              </span>
              <span className="verdict" style={{ flex: "none" }}>
                {cardLabel(entry.fromCard)} → {cardLabel(entry.nextCard)}
              </span>
              <span className={`verdict ${entry.correct ? "win" : "lose"}`}>
                {entry.correct ? t.holRoom.correctWord : t.holRoom.missWord}
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
