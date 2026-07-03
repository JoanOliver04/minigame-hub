"use client";

/**
 * Diceforge Arena room (PvP) screen — sibling to DiceforgeArenaGame.tsx,
 * reusing its FV face glyphs and forge-* CSS, but driven by useForgeRoom's
 * Firestore state. Both players lock+reroll, combat resolves, both shop.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { Face } from "./types";
import { useForgeRoom } from "./useForgeRoom";

const FACES_PER_DIE = 6;

function FV({ face }: { face: Face }) {
  const g = { damage: "⚔", shield: "◆", energy: "✦", wild: "★" }[face.kind];
  return (
    <span className={`forge-face ${face.kind}`} aria-label={`${face.kind} ${face.value}`}>
      {g}
      {face.value}
    </span>
  );
}

/** Rebuild a fighter's Die[] (3×6) from its stored flat faces. */
function toDice(diceFlat: Face[]): Face[][] {
  return [0, 1, 2].map((d) => diceFlat.slice(d * FACES_PER_DIE, d * FACES_PER_DIE + FACES_PER_DIE));
}

export function DiceforgeRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const c = t.diceforgeArena;
  const { uid, room, stage, lock, buy, skip, playAgain, leave } = useForgeRoom(code);

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
  const me = game.fighters[uid];
  const foe = game.fighters[opponentUid];

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen forge-screen">
        <div className="end-emoji">🎲</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{c.healthResult(me.health, foe.health)}</div>
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
  const myDice = toDice(me.diceFlat);
  const foeDice = toDice(foe.diceFlat);
  const myFaces =
    game.results[uid]?.faces ?? game.rolls[uid].map((f, d) => myDice[d][f]);
  const foeFaces =
    game.results[opponentUid]?.faces ?? game.rolls[opponentUid].map((f, d) => foeDice[d][f]);
  const iLocked = game.locked[uid] !== null;
  const iShopped = game.shopDone[uid];

  return (
    <section className="card screen forge-screen">
      <div className="forge-hud">
        <div>
          <b>{c.youLabel}</b>
          <span>♥ {me.health} · ◆ {me.shield} · ◉ {me.coins}</span>
        </div>
        <strong>{c.roundLabel(game.round, 10)}</strong>
        <div>
          <b>{opponentName}</b>
          <span>♥ {foe.health} · ◆ {foe.shield} · ◉ {foe.coins}</span>
        </div>
      </div>

      <div className="forge-arena" aria-live="polite">
        <div className="forge-roll">
          <span>{c.yourRoll}</span>
          <div>{myFaces.map((f, i) => <FV key={i} face={f} />)}</div>
        </div>
        <div className="forge-versus">VS</div>
        <div className="forge-roll">
          <span>{c.aiRoll}</span>
          <div>{foeFaces.map((f, i) => <FV key={i} face={f} />)}</div>
        </div>
      </div>

      {game.stage === "lock" ? (
        iLocked ? (
          <p className="feedback">{t.rooms.submittedWaiting}</p>
        ) : (
          <>
            <p className="feedback">{c.lockPrompt}</p>
            <div className="forge-locks">
              {[0, 1, 2].map((i) => (
                <button key={i} className="btn" onClick={() => lock(i)}>
                  {c.lockDie(i + 1)}
                </button>
              ))}
            </div>
          </>
        )
      ) : iShopped ? (
        <p className="feedback">{t.rooms.submittedWaiting}</p>
      ) : (
        <>
          <p className="feedback">
            {game.results[uid] && game.results[opponentUid]
              ? c.resultLine(game.results[uid]!.damage, game.results[opponentUid]!.damage)
              : ""}{" "}
            {c.shopPrompt}
          </p>
          <div className="forge-shop">
            {game.shop.map((o) => (
              <div className="forge-offer" key={o.id}>
                <FV face={o.face} />
                <b>{c.costLabel(Math.max(0, o.cost - me.discount))}</b>
                <div className="forge-dice-grid">
                  {myDice.flatMap((die, d) =>
                    die.map((face, f) => (
                      <button key={`${d}-${f}`} aria-label={c.replaceLabel(d + 1, f + 1)} onClick={() => buy(o, d, f)}>
                        <FV face={face} />
                      </button>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn" onClick={skip}>
            {c.skipShop}
          </button>
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
