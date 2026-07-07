"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { getPlayableDominoes, getPlayableSides, tilePips } from "./logic";
import { DominoTileFace } from "./DominoTileFace";
import type { DominoGameState, DominoTile } from "./types";
import { useDominoRoom } from "./useDominoRoom";

export function DominoRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, selected, isMyTurn, toggle, play, draw, pass, playAgain, leave } = useDominoRoom(code);

  if (stage === "connecting") return <section className="card screen"><p>{t.rooms.connecting}</p></section>;
  if (stage === "gone" || stage === "expired" || !room || !uid) {
    const message = stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <Link href="/rooms" className="btn primary">{t.rooms.backToRooms}</Link>
      </section>
    );
  }
  if (stage === "error") return <section className="card screen"><p>{t.rooms.errorGeneric}</p></section>;

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;
  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen domino-screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const game = room.game;
  if (stage === "finished") {
    const won = game.winner === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen domino-screen">
        <div className="end-emoji">{game.tie ? "🤝" : won ? "🏆" : "🁢"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {game.tie ? t.domino.blockedTie : won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.domino.endScore(handScore(game.hands[uid]), handScore(game.hands[opponentUid]))}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>{voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}</button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const selectedTile = selected ? game.hands[uid].find((tile) => tile.id === selected) : undefined;
  const legalSides = selectedTile ? getPlayableSides(game, selectedTile) : [];
  const playable = getPlayableDominoes(game, uid);
  const canDraw = isMyTurn && playable.length === 0 && game.boneyard.length > 0;
  const canPass = isMyTurn && playable.length === 0 && game.boneyard.length === 0;
  const actor = game.lastAction?.actor === uid ? t.common.you : opponentName ?? "?";
  let feedback = isMyTurn ? t.domino.yourTurn : t.rooms.turnOpponent(opponentName ?? "?");
  if (game.lastAction?.kind === "play" && game.lastAction.tile) feedback = t.domino.played(actor, `${game.lastAction.tile.a}-${game.lastAction.tile.b}`);
  if (game.lastAction?.kind === "draw") feedback = t.domino.drew(actor);
  if (game.lastAction?.kind === "pass") feedback = t.domino.passed(actor);
  if (game.lastAction?.kind === "win") feedback = t.domino.won(actor);
  if (game.lastAction?.kind === "block") feedback = t.domino.blockedTie;
  if (isMyTurn && selectedTile && legalSides.length === 0) feedback = t.domino.notPlayable;

  return (
    <section className="card screen domino-screen">
      <div className="domino-score">
        <div><strong>{t.common.you}</strong><span>{t.domino.tilesLeft(game.hands[uid].length)}</span><small>{handScore(game.hands[uid])} pts</small></div>
        <div><strong>{opponentName}</strong><span>{t.domino.tilesLeft(game.hands[opponentUid].length)}</span><small>{handScore(game.hands[opponentUid])} pts</small></div>
        <div><strong>{t.domino.pool}</strong><span>{game.boneyard.length}</span><small>{game.leftValue ?? "-"} / {game.rightValue ?? "-"}</small></div>
      </div>
      <div className="feedback domino-feedback">{feedback}</div>
      <DominoBoard game={game} empty={t.domino.emptyBoard} label={t.domino.boardLabel} tileLabel={t.domino.tileLabel} />
      <div className="domino-actions">
        <button className="btn primary" disabled={!isMyTurn || !selectedTile || !legalSides.includes("left")} onClick={() => play("left")}>{t.domino.playLeft}</button>
        <button className="btn primary" disabled={!isMyTurn || !selectedTile || !legalSides.includes("right")} onClick={() => play("right")}>{t.domino.playRight}</button>
        <button className="btn" disabled={!canDraw} onClick={draw}>{t.domino.drawTile}</button>
        <button className="btn" disabled={!canPass} onClick={pass}>{t.domino.pass}</button>
      </div>
      <div className="domino-rack" aria-label={t.domino.yourHand}>
        {game.hands[uid].map((tile) => (
          <DominoTileFace
            key={tile.id}
            tile={tile}
            label={t.domino.tileLabel(tile.a, tile.b)}
            selected={selected === tile.id}
            disabled={!isMyTurn}
            onClick={() => toggle(tile.id)}
          />
        ))}
      </div>
      <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
    </section>
  );
}

function handScore(hand: DominoTile[]) {
  return hand.reduce((total, tile) => total + tilePips(tile), 0);
}

function DominoBoard({
  game,
  empty,
  label,
  tileLabel,
}: {
  game: DominoGameState;
  empty: string;
  label: string;
  tileLabel: (a: number, b: number) => string;
}) {
  return (
    <div className="domino-board" aria-label={label}>
      {game.board.length === 0 ? (
        <p>{empty}</p>
      ) : (
        game.board.map((tile) => (
          <DominoTileFace key={`${tile.id}-${tile.left}-${tile.right}`} tile={tile} label={tileLabel(tile.left, tile.right)} disabled />
        ))
      )}
    </div>
  );
}
