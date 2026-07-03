"use client";

/**
 * Spellstorm room (PvP) screen — sibling to SpellstormGame.tsx, reusing its
 * storm-duel/storm-word-card/storm-spell CSS, but driven by useStormRoom's live
 * duel state. You type your own word stream; your opponent's health mirrors in
 * from their client.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { Element, Mage, Spell } from "./types";
import { SPELL_COST } from "./types";
import { useStormRoom } from "./useStormRoom";

const ELEMENT_GLYPH: Record<Element, string> = { fire: "▲", ice: "◆", shield: "⬡" };

function MagePanel({ title, mage, side }: { title: string; mage: Mage; side: "player" | "ai" }) {
  return (
    <div className={`storm-mage ${side}`}>
      <div className="storm-mage-title">{title}</div>
      <div className="storm-health">
        <span style={{ width: `${mage.health}%` }} />
        <b>♥ {mage.health}</b>
      </div>
      <div className="storm-resources">
        <span>⬡ {mage.shield}</span>
        <span>✦ {mage.energy}</span>
        <span>×{mage.combo}</span>
      </div>
    </div>
  );
}

export function SpellstormRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const copy = t.spellstorm;
  const { uid, room, stage, myMage, opponentMage, word, input, remaining, paused, lastSpell, type, cast, playAgain, leave } =
    useStormRoom(code);

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

  if (stage === "finished") {
    const myHealth = game.mages[uid]?.health ?? myMage.health;
    const oppHealth = opponentUid ? game.mages[opponentUid]?.health ?? 0 : 0;
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen storm-screen">
        <div className="end-emoji">⚡</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{copy.healthResult(myHealth, oppHealth)}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{copy.yourWords}</div>
            <div className="value">{game.mages[uid]?.words ?? 0}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{opponentName}</div>
            <div className="value">{opponentUid ? game.mages[opponentUid]?.words ?? 0 : 0}</div>
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
  const spellButtons: Spell[] = ["fire", "ice", "shield"];
  const element: Element = word?.element ?? "fire";
  const validPrefix = word
    ? word.normalized.startsWith(input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase())
    : true;

  return (
    <section className="card screen storm-screen">
      <div className="storm-time" aria-label={copy.timeLabel(remaining)}>
        <span style={{ width: `${(remaining / 75) * 100}%` }} />
        <b>{remaining}s</b>
      </div>
      <div className="storm-duel">
        <MagePanel title={copy.you} mage={myMage} side="player" />
        <div className="storm-orb" aria-hidden="true">✦</div>
        <MagePanel title={opponentName ?? copy.ai} mage={opponentMage} side="ai" />
      </div>

      <div className="storm-words">
        <div className={`storm-word-card ${element}`}>
          <span className="storm-element">
            {ELEMENT_GLYPH[element]} {copy.elementLabels[element]}
          </span>
          <strong>{word?.display}</strong>
          <input
            autoFocus
            className={validPrefix ? "" : "invalid"}
            value={input}
            maxLength={12}
            disabled={paused}
            onChange={(event) => type(event.target.value)}
            aria-label={copy.typeLabel}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <small>{paused ? copy.frozen : copy.typePrompt}</small>
        </div>
      </div>

      <div className="storm-spells">
        {spellButtons.map((spell) => (
          <button
            key={spell}
            className={`storm-spell ${spell}`}
            disabled={myMage.energy < SPELL_COST}
            onClick={() => cast(spell)}
          >
            <span>{ELEMENT_GLYPH[spell]}</span>
            <b>{copy.spellLabels[spell]}</b>
            <small>{copy.spellEffects[spell]}</small>
          </button>
        ))}
      </div>

      <div className="feedback storm-feedback" aria-live="polite">
        {lastSpell
          ? copy.castFeedback(lastSpell.actor === "you" ? "player" : "ai", lastSpell.spell)
          : copy.energyHint(SPELL_COST)}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
