"use client";

/**
 * Word Guess room (PvP) screen — sibling to WordGuessGame.tsx, reusing its
 * word-tiles/word-keyboard/word-budget/word-form CSS, but driven by
 * useWordRoom's Firestore-backed state instead of the local AI. Both seats
 * share one mistake budget; fewest mistakes (or the full-word caller) wins.
 */

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { alphabetFor, foldLetter } from "./letters";
import { SHARED_MISTAKE_LIMIT } from "./logic";
import { useWordRoom } from "./useWordRoom";

export function WordRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, inputError, guess, playAgain, leave } = useWordRoom(code);
  const [wordInput, setWordInput] = useState("");

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
  const iAmHost = uid === game.hostUid;
  // Seats map onto applyGuess's fixed actors: host = "player", guest = "ai".
  const myMistakes = iAmHost ? game.playerMistakes : game.aiMistakes;
  const opponentMistakes = iAmHost ? game.aiMistakes : game.playerMistakes;
  const totalMistakes = game.playerMistakes + game.aiMistakes;

  if (stage === "finished") {
    const iWon = game.winner === (iAmHost ? "player" : "ai");
    const tie = game.winner === "tie";
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : tie ? "🤝" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie
            ? t.rooms.roundResultTie
            : iWon
              ? t.rooms.matchWinYou
              : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="word-end-answer">{game.word}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.wordGuess.yourMistakes}</div>
            <div className="value">{myMistakes}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{opponentName}</div>
            <div className="value">{opponentMistakes}</div>
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
  const revealed = new Set(game.revealedLetters);
  const guessed = new Set(game.guessedLetters);
  const pattern = [...game.word]
    .map((letter) => (revealed.has(foldLetter(letter)) ? letter : "_"))
    .join("");
  const locked = !isMyTurn;

  const fb = game.lastFeedback;
  let feedbackText: string;
  let feedbackClass = "";
  if (fb) {
    const fbUid = fb.actor === "player" ? game.hostUid : game.guestUid;
    const fbName = fbUid === uid ? t.common.you : opponentName ?? "?";
    feedbackText = t.wordGuess.feedback(fbName, fb.kind, fb.value, fb.correct);
    feedbackClass = fb.correct ? " correct pop" : " high pop";
  } else {
    feedbackText = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");
  }

  function submitWord(event: FormEvent) {
    event.preventDefault();
    if (guess("word", wordInput)) setWordInput("");
  }

  return (
    <section className="card screen word-screen">
      <div className="word-meta">
        {t.wordGuess.categories[game.category]} · {t.common[game.difficulty]} ·{" "}
        {game.lang === "es" ? t.wordGuess.langEs : t.wordGuess.langEn}
      </div>

      <div className="word-tiles" aria-label={t.wordGuess.patternLabel(pattern)}>
        {[...pattern].map((letter, index) => (
          <span key={index} className={letter === "_" ? "hidden" : "revealed"}>
            {letter === "_" ? " " : letter}
          </span>
        ))}
      </div>

      <div className="word-budget-head">
        <span>{t.wordGuess.sharedBudget}</span>
        <strong>{totalMistakes} / {SHARED_MISTAKE_LIMIT}</strong>
      </div>
      <div className="word-budget" aria-label={t.wordGuess.budgetLabel(totalMistakes)}>
        {Array.from({ length: SHARED_MISTAKE_LIMIT }, (_, index) => (
          <span
            key={index}
            className={
              index < myMistakes ? "spent player" : index < totalMistakes ? "spent ai" : ""
            }
          />
        ))}
      </div>
      <div className="word-mistake-stats">
        <span className="player">{t.wordGuess.yourMistakes}: {myMistakes}</span>
        <span className="ai">{opponentName}: {opponentMistakes}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedbackText}</div>

      <div className="word-keyboard" role="group" aria-label={t.wordGuess.keyboardLabel}>
        {alphabetFor(game.lang).map((letter) => (
          <button
            key={letter}
            type="button"
            className={guessed.has(letter) ? (revealed.has(letter) ? "hit" : "miss") : ""}
            disabled={locked || guessed.has(letter)}
            onClick={() => guess("letter", letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      <form className="word-form" onSubmit={submitWord}>
        <input
          type="text"
          value={wordInput}
          disabled={locked}
          maxLength={24}
          autoComplete="off"
          placeholder={t.wordGuess.wordPlaceholder}
          aria-label={t.wordGuess.wordPlaceholder}
          onChange={(event) => setWordInput(event.target.value)}
        />
        <button className="btn primary" disabled={locked || !wordInput.trim()}>
          {t.wordGuess.guessWord}
        </button>
      </form>
      <div className="error-msg">{inputError ? t.wordGuess.errors[inputError] : ""}</div>

      {game.history.length > 0 && (
        <>
          <div className="log-title">{t.wordGuess.historyTitle}</div>
          <ul className="log word-log">
            {[...game.history].reverse().map((entry, index) => {
              const entryUid = entry.actor === "player" ? game.hostUid : game.guestUid;
              return (
                <li key={`${entry.actor}-${entry.value}-${index}`} className={entryUid === uid ? "player" : "ai"}>
                  <span className="who">{entryUid === uid ? t.common.you : opponentName}</span>
                  <span className="mv">
                    {entry.kind === "letter" ? entry.value : `"${entry.value}"`}
                  </span>
                  <span className={`verdict ${entry.correct ? "correct" : "high"}`}>
                    {entry.correct ? t.wordGuess.correctGuess : t.wordGuess.missCost(entry.cost)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
