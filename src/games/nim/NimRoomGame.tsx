"use client";

/**
 * Nim room (PvP) screen — sibling to NimGame.tsx, reusing its
 * nim-board/nim-pile-row/nim-token/nim-selection-bar CSS, but driven by
 * useNimRoom's Firestore-backed state instead of the local nim-sum AI.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useNimRoom } from "./useNimRoom";

function pileLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function NimRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const {
    uid,
    room,
    stage,
    isMyTurn,
    selection,
    selectToken,
    clearSelection,
    confirmMove,
    playAgain,
    leave,
  } = useNimRoom(code);

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
  let feedback = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");
  if (isMyTurn && selection) feedback = t.nim.chooseTokens;

  let lastRoundMsg: string | null = null;
  if (game.lastRoundWinnerUid) {
    lastRoundMsg =
      game.lastRoundWinnerUid === uid ? t.rooms.roundResultWin : t.rooms.roundResultLose;
  }

  return (
    <section className="card screen">
      <div className={`nim-rule-badge ${game.rule}`}>
        {game.rule === "normal" ? t.nim.ruleNormal : t.nim.ruleMisere}
      </div>

      <div className="rps-tally">
        <span className="you">{t.nim.tallyYou(myScore)}</span>
        <span className="goal">{t.nim.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">{feedback}</div>
      {lastRoundMsg && <div className="feedback">{lastRoundMsg}</div>}

      <div className="nim-board" role="group" aria-label={t.nim.boardLabel}>
        {game.piles.map((pileSize, pileIndex) => {
          const selectedFrom =
            selection?.pileIndex === pileIndex ? pileSize - selection.tokensRemoved : -1;
          return (
            <div
              key={pileIndex}
              className={`nim-pile-row${selection?.pileIndex === pileIndex ? " active-pile" : ""}`}
            >
              <span className="nim-pile-name">{pileLabel(pileIndex)}</span>
              <div className="nim-tokens">
                {Array.from({ length: pileSize }, (_, tokenIndex) => {
                  const isSelected = selectedFrom >= 0 && tokenIndex >= selectedFrom;
                  return (
                    <button
                      key={tokenIndex}
                      type="button"
                      className={`nim-token${isSelected ? " selected" : ""}`}
                      disabled={!isMyTurn || pileSize === 0}
                      onClick={() => selectToken(pileIndex, tokenIndex)}
                      aria-label={t.nim.tokenLabel(pileLabel(pileIndex), tokenIndex + 1, pileSize)}
                    />
                  );
                })}
                {pileSize === 0 && <span className="nim-empty">{t.nim.emptyPile}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {isMyTurn && selection && (
        <div className="nim-selection-bar">
          <span>
            {t.nim.selectionSummary(
              pileLabel(selection.pileIndex),
              selection.tokensRemoved,
              game.piles[selection.pileIndex],
              game.piles[selection.pileIndex] - selection.tokensRemoved,
            )}
          </span>
          <div className="btn-row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={clearSelection}>
              {t.nim.clearSelection}
            </button>
            <button className="btn primary" onClick={confirmMove}>
              {t.nim.confirmMove}
            </button>
          </div>
        </div>
      )}

      <div className="log-title">{t.nim.logTitle}</div>
      <ul className="log">
        {game.log.map((entry) => (
          <li key={entry.id} className={entry.uid === uid ? "player" : "ai"}>
            <span className="who">{entry.uid === uid ? t.common.you : opponentName}</span>
            <span className="verdict" style={{ color: "var(--text)" }}>
              {t.nim.logEntry(
                pileLabel(entry.pileIndex),
                entry.tokensRemoved,
                entry.pileBefore,
                entry.pileAfter,
              )}
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
