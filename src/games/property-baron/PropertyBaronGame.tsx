"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { BARON_TILES, canBuy, canUpgrade, netWorth } from "./logic";
import { formatBaronLogEntry } from "./logText";
import type { PropertyDifficulty } from "./types";
import { usePropertyBaron } from "./usePropertyBaron";

export function PropertyBaronGame() {
  const { t } = useLocale();
  const game = usePropertyBaron();
  const [difficulty, setDifficulty] = useState<PropertyDifficulty>("medium");
  const [maxRounds, setMaxRounds] = useState(20);

  if (game.phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["property-baron"].name}>{t.propertyBaron.rules}</HowToPlay>
        <div className="end-emoji">🏙️</div>
        <h1>{t.gamesMeta["property-baron"].name}</h1>
        <p>{t.propertyBaron.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as PropertyDifficulty)}
        />
        <p className="feedback">{t.propertyBaron.difficultyDescription[difficulty]}</p>
        <span className="field-label">{t.common.matchLength}</span>
        <SegPicker
          options={[
            { value: "12", label: t.propertyBaron.shortGame },
            { value: "20", label: t.propertyBaron.standardGame },
          ]}
          value={String(maxRounds)}
          onChange={(value) => setMaxRounds(Number(value))}
        />
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => game.startMatch({ difficulty, maxRounds })}>{t.common.startMatch}</button>
          <Link href="/rooms" className="btn">{t.propertyBaron.playFriend}</Link>
        </div>
      </section>
    );
  }

  if (!game.game) return null;
  const state = game.game;
  const you = state.players.player;
  const ai = state.players.ai;
  const tile = state.pendingTile === null ? null : BARON_TILES[state.pendingTile];
  const logNames = { player: t.common.you, ai: t.common.ai };

  if (game.phase === "end") {
    const won = state.winner === "player";
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{won ? "🏆" : "🏦"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>{won ? t.common.youWinMatch : t.common.aiWinsMatch}</div>
        <div className="end-number">{t.propertyBaron.netWorthLine(netWorth(state, "player"), netWorth(state, "ai"))}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={game.playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={game.toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card screen property-screen">
      <div className="rps-tally">
        <span className="you">{t.propertyBaron.cash(t.common.you, you.money)}</span>
        <span className="goal">{t.propertyBaron.round(state.round, state.maxRounds)}</span>
        <span className="them">{t.propertyBaron.cash(t.common.ai, ai.money)}</span>
      </div>
      <div className="property-board">
        {BARON_TILES.map((item) => {
          const prop = state.properties[item.id];
          return (
            <div key={item.id} className={`property-tile ${item.kind} ${prop?.owner === "player" ? "owned-you" : prop?.owner === "ai" ? "owned-ai" : ""}`}>
              <strong>{item.name}</strong>
              {item.kind === "property" && <small>${item.price} · ${item.rent}{prop ? ` · L${prop.level}` : ""}</small>}
              <span>{you.position === item.id ? "🙂" : ""}{ai.position === item.id ? " 🤖" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="feedback">
        {state.turn === "player"
          ? state.phase === "roll"
            ? t.propertyBaron.rollPrompt
            : t.propertyBaron.decisionPrompt(tile?.name ?? "")
          : t.propertyBaron.aiTurn}
      </p>
      <div className="btn-row">
        <button className="btn primary" disabled={state.turn !== "player" || state.phase !== "roll"} onClick={game.roll}>
          {state.dice ? t.propertyBaron.dice(state.dice[0], state.dice[1]) : t.propertyBaron.rollDice}
        </button>
        <button className="btn" disabled={!canBuy(state, "player")} onClick={game.buy}>{t.propertyBaron.buy}</button>
        <button className="btn" disabled={!canUpgrade(state, "player")} onClick={game.upgrade}>{t.propertyBaron.upgrade}</button>
        <button className="btn" disabled={state.turn !== "player" || state.phase !== "decision"} onClick={game.pass}>{t.propertyBaron.pass}</button>
      </div>
      <div className="log" aria-label={t.propertyBaron.logTitle}>
        {state.log.map((entry) => <p key={entry.id}>{formatBaronLogEntry(entry, t.propertyBaron, logNames)}</p>)}
      </div>
    </section>
  );
}
