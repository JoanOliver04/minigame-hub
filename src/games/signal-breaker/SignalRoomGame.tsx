"use client";

/**
 * Signal Breaker room (PvP) screen — sibling to SignalBreakerGame.tsx, reusing
 * its Peg/Row markup and sig-* CSS, but driven by useSignalRoom's Firestore
 * state. You crack your opponent's code on the left; their attempts on your
 * code show on the right with hidden pegs.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { GuessRow } from "./types";
import { useSignalRoom } from "./useSignalRoom";

const SYMBOLS = [
  { glyph: "●", letter: "A", cls: "s0" },
  { glyph: "■", letter: "B", cls: "s1" },
  { glyph: "▲", letter: "C", cls: "s2" },
  { glyph: "◆", letter: "D", cls: "s3" },
  { glyph: "★", letter: "E", cls: "s4" },
  { glyph: "⬢", letter: "F", cls: "s5" },
];

function Peg({ symbol }: { symbol: number | null }) {
  if (symbol === null) return <span className="sig-peg empty" aria-hidden="true" />;
  const s = SYMBOLS[symbol];
  return (
    <span className={`sig-peg ${s.cls}`} aria-label={s.letter}>
      {s.glyph}
    </span>
  );
}

function Row({ row, hidden }: { row: GuessRow; hidden?: boolean }) {
  return (
    <div className="sig-row">
      <div className="sig-pegs">
        {row.guess.map((sym, i) => (
          <Peg key={i} symbol={hidden ? null : sym} />
        ))}
      </div>
      <div className="sig-feedback">
        {Array.from({ length: row.feedback.exact }).map((_, i) => (
          <span key={`e${i}`} className="sig-clue exact" />
        ))}
        {Array.from({ length: row.feedback.partial }).map((_, i) => (
          <span key={`p${i}`} className="sig-clue partial" />
        ))}
      </div>
    </div>
  );
}

export function SignalRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, draft, setDraftSlot, cycleSlot, clearDraft, submit, playAgain, leave } =
    useSignalRoom(code);

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
  const myRows = game.guesses[uid] ?? [];
  const opponentRows = opponentUid ? game.guesses[opponentUid] ?? [] : [];

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen signal-screen">
        <div className="end-emoji">{iWon ? "🔓" : tie ? "🤝" : "🔒"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.signalBreaker.yourGuesses}</div>
            <div className="value">{game.solvedAtGuess[uid] ?? "—"}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{opponentName}</div>
            <div className="value">{opponentUid ? game.solvedAtGuess[opponentUid] ?? "—" : "—"}</div>
          </div>
        </div>
        <div className="sig-reveal">
          {t.signalBreaker.codeWas}
          <span className="sig-pegs inline">
            {game.secrets[uid].map((sym, i) => (
              <Peg key={i} symbol={sym} />
            ))}
          </span>
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
  const draftComplete = draft.every((d) => d !== null);
  const locked = game.done[uid];

  return (
    <section className="card screen signal-screen">
      <div className="sig-boards">
        <div className="sig-board">
          <h3 className="sig-board-title you">{t.signalBreaker.yourAttack}</h3>
          <p className="sig-progress">{t.signalBreaker.guessCount(myRows.length, game.maxGuesses)}</p>
          <div className="sig-rows">
            {myRows.map((row, i) => (
              <Row key={i} row={row} />
            ))}
          </div>
        </div>

        <div className="sig-board">
          <h3 className="sig-board-title them">{opponentName}</h3>
          <p className="sig-progress">{t.signalBreaker.guessCount(opponentRows.length, game.maxGuesses)}</p>
          <div className="sig-rows">
            {opponentRows.map((row, i) => (
              <Row key={i} row={row} hidden />
            ))}
          </div>
        </div>
      </div>

      {!locked ? (
        <div className="sig-input">
          <div className="sig-draft">
            {draft.map((sym, i) => (
              <button
                key={i}
                className="sig-slot"
                onClick={() => cycleSlot(i)}
                aria-label={t.signalBreaker.slotLabel(i + 1)}
              >
                <Peg symbol={sym} />
              </button>
            ))}
          </div>
          <div className="sig-palette">
            {SYMBOLS.map((s, i) => (
              <button
                key={i}
                className={`sig-peg ${s.cls} pick`}
                onClick={() => {
                  const empty = draft.findIndex((d) => d === null);
                  setDraftSlot(empty === -1 ? draft.length - 1 : empty, i);
                }}
                aria-label={s.letter}
              >
                {s.glyph}
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn primary" disabled={!draftComplete} onClick={submit}>
              {t.signalBreaker.submit}
            </button>
            <button className="btn" onClick={clearDraft}>
              {t.signalBreaker.clear}
            </button>
          </div>
        </div>
      ) : (
        <p className="sig-waiting">{t.rooms.submittedWaiting}</p>
      )}

      <p className="sig-legend">{t.signalBreaker.legend}</p>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
