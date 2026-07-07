"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { BARON_TILES, canBuy, canUpgrade, netWorth } from "./logic";
import { usePropertyBaronRoom } from "./usePropertyBaronRoom";

export function PropertyBaronRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, roll, buy, upgrade, pass, playAgain, leave } = usePropertyBaronRoom(code);

  if (stage === "connecting") return <section className="card screen"><p>{t.rooms.connecting}</p></section>;
  if (!room || stage === "gone" || stage === "expired") {
    const message = stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return <section className="card screen"><p>{message}</p><Link href="/rooms" className="btn primary">{t.rooms.backToRooms}</Link></section>;
  }
  if (stage === "error") return <section className="card screen"><p>{t.rooms.errorGeneric}</p></section>;
  if (!uid) return null;

  const game = room.game;
  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const me = game.players[uid];
  const them = opponentUid ? game.players[opponentUid] : null;
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;
  const tile = game.pendingTile === null ? null : BARON_TILES[game.pendingTile];

  if (stage === "waiting" || !me || !them) {
    return (
      <section className="card screen">
        <div className="end-emoji">🏙️</div>
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
      </section>
    );
  }

  if (stage === "finished") {
    const won = game.winner === uid;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{won ? "🏆" : "🏦"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>{won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}</div>
        <div className="end-number">{t.propertyBaron.netWorthLine(netWorth(game, uid), opponentUid ? netWorth(game, opponentUid) : 0)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{room.rematchVotes[uid] ? t.rooms.rematchWaiting : t.rooms.rematchButton}</button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const isMyTurn = game.turn === uid;
  return (
    <section className="card screen property-screen">
      <div className="rps-tally">
        <span className="you">{t.propertyBaron.cash(t.common.you, me.money)}</span>
        <span className="goal">{t.propertyBaron.round(game.round, game.maxRounds)}</span>
        <span className="them">{t.propertyBaron.cash(opponentName ?? "?", them.money)}</span>
      </div>
      <div className="property-board">
        {BARON_TILES.map((item) => {
          const prop = game.properties[item.id];
          return (
            <div key={item.id} className={`property-tile ${item.kind} ${prop?.owner === uid ? "owned-you" : prop?.owner ? "owned-ai" : ""}`}>
              <strong>{item.name}</strong>
              {item.kind === "property" && <small>${item.price} · ${item.rent}{prop ? ` · L${prop.level}` : ""}</small>}
              <span>{me.position === item.id ? "🙂" : ""}{them.position === item.id ? " 🧑" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="feedback">
        {isMyTurn
          ? game.phase === "roll"
            ? t.propertyBaron.rollPrompt
            : t.propertyBaron.decisionPrompt(tile?.name ?? "")
          : t.rooms.turnOpponent(opponentName ?? "?")}
      </p>
      <div className="btn-row">
        <button className="btn primary" disabled={!isMyTurn || game.phase !== "roll"} onClick={roll}>
          {game.dice ? t.propertyBaron.dice(game.dice[0], game.dice[1]) : t.propertyBaron.rollDice}
        </button>
        <button className="btn" disabled={!canBuy(game, uid)} onClick={buy}>{t.propertyBaron.buy}</button>
        <button className="btn" disabled={!canUpgrade(game, uid)} onClick={upgrade}>{t.propertyBaron.upgrade}</button>
        <button className="btn" disabled={!isMyTurn || game.phase !== "decision"} onClick={pass}>{t.propertyBaron.pass}</button>
        <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
      </div>
      <div className="log">{game.log.map((entry) => <p key={entry.id}>{entry.text}</p>)}</div>
    </section>
  );
}
