"use client";

/**
 * Reaction Time room (PvP) screen — sibling to ReactionTimeGame.tsx, reusing
 * its rt-box CSS, but driven by useReactionRoom's Firestore-backed state.
 * Both players wait out the same delay; the faster valid tap wins the round,
 * a false start loses it.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useReactionRoom } from "./useReactionRoom";

export function ReactionRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, localStage, bothIn, tap, playAgain, leave } = useReactionRoom(code);

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
  const submitted = localStage === "submitted";
  const boxClass =
    localStage === "go" ? "go" : localStage === "ready" ? "ready" : "waiting";
  const boxText =
    localStage === "go"
      ? t.reactionRoom.tapNow
      : localStage === "ready"
        ? t.reactionRoom.waitGreen
        : submitted
          ? t.rooms.submittedWaiting
          : t.reactionRoom.getReady;

  const last = game.lastResult;
  let resultMsg: string | null = null;
  let resultClass = "";
  if (last && !bothIn) {
    const mine = last.entries[uid];
    const theirs = opponentUid ? last.entries[opponentUid] : undefined;
    const outcome =
      last.winnerUid === null ? "tie" : last.winnerUid === uid ? "win" : "lose";
    resultClass = outcome === "win" ? " win" : outcome === "lose" ? " lose" : "";
    const mineTxt = mine?.falseStart
      ? t.reactionRoom.falseStart
      : mine?.reactionMs != null
        ? t.reactionRoom.ms(mine.reactionMs)
        : "—";
    const theirsTxt = theirs?.falseStart
      ? t.reactionRoom.falseStart
      : theirs?.reactionMs != null
        ? t.reactionRoom.ms(theirs.reactionMs)
        : "—";
    const head =
      outcome === "win"
        ? t.reactionRoom.roundWon
        : outcome === "lose"
          ? t.reactionRoom.roundLost
          : t.reactionRoom.roundTied;
    resultMsg = `${head} — ${t.reactionRoom.youWord} ${mineTxt} · ${opponentName} ${theirsTxt}`;
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.reactionRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.reactionRoom.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      {resultMsg && <div className={`feedback${resultClass}`}>{resultMsg}</div>}

      <button
        type="button"
        className={`rt-box ${boxClass}`}
        disabled={submitted}
        onClick={tap}
      >
        <span className="rt-box-text">{boxText}</span>
      </button>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
