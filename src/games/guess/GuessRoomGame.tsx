"use client";

/**
 * Number Duel room (PvP) screen — sibling to GuessGame.tsx, reusing shared
 * card/screen/feedback/log CSS, but driven by useGuessRoom's Firestore-backed
 * state. Players alternate guessing a shared hidden number; every hint
 * narrows the interval for both until someone names it.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useGuessRoom } from "./useGuessRoom";
import type { GuessVerdict } from "./room";

export function GuessRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, guess, playAgain, leave } = useGuessRoom(code);
  const [draft, setDraft] = useState("");
  const lastRangeRef = useRef<string>("");

  // Clear the input whenever the live interval changes (someone guessed) —
  // guarded by a ref so we only reset on an actual change, not every render.
  const rangeKey = `${room?.game.low}-${room?.game.high}`;
  useEffect(() => {
    if (rangeKey !== lastRangeRef.current) {
      lastRangeRef.current = rangeKey;
      setDraft("");
    }
  }, [rangeKey]);

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
  const verdictLabel: Record<"high" | "low", string> = t.guessRoom.verdicts;
  const nameFor = (id: string) => (id === uid ? t.guessRoom.youWord : opponentName ?? "?");
  const value = Number(draft);
  const canSubmit =
    isMyTurn && draft.trim() !== "" && Number.isInteger(value) && value >= game.low && value <= game.high;

  const verdictLine = (verdict: GuessVerdict) =>
    verdict === "correct" ? t.guessRoom.correctWord : verdictLabel[verdict];

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.guessRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.guessRoom.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">
        {isMyTurn ? t.guessRoom.yourTurn : t.guessRoom.opponentTurn(opponentName ?? "?")}
      </div>
      <div className="feedback">{t.guessRoom.rangePrompt(game.low, game.high)}</div>

      <div className="btn-row" style={{ marginTop: 6 }}>
        <input
          className="text-input"
          type="number"
          inputMode="numeric"
          min={game.low}
          max={game.high}
          value={draft}
          disabled={!isMyTurn}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSubmit) guess(value);
          }}
          placeholder={t.guessRoom.inputPlaceholder}
          style={{ maxWidth: 160 }}
        />
        <button className="btn primary" disabled={!canSubmit} onClick={() => guess(value)}>
          {t.guessRoom.guessButton}
        </button>
      </div>

      <div className="log-title">{t.guessRoom.logTitle}</div>
      <ul className="log">
        {game.log.map((entry) => (
          <li key={entry.id} className={entry.uid === uid ? "player" : "ai"}>
            <span className="mv">{nameFor(entry.uid)}</span>
            <span className="verdict" style={{ flex: "none", fontWeight: 700 }}>
              {entry.value}
            </span>
            <span className={`verdict ${entry.uid === uid ? "win" : "lose"}`}>
              {verdictLine(entry.verdict)}
            </span>
          </li>
        ))}
      </ul>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
