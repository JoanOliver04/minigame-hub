"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Face, Fighter, ForgeDifficulty, Offer } from "./types";
import { useDiceforgeArena } from "./useDiceforgeArena";

const glyph = { damage: "⚔", shield: "◆", energy: "✦", wild: "★" };

function FaceValue({ face }: { face: Face }) {
  const { t } = useLocale();
  const name = `${t.play.faceNames[face.kind]} ${face.value}`;
  return <span className={`forge-face ${face.kind}`} role="img" aria-label={name} title={name}>{glyph[face.kind]}{face.value}</span>;
}

function ForgeShop({ player, offers, buy }: {
  player: Fighter;
  offers: Offer[];
  buy: (offer: Offer, die: number, face: number) => void;
}) {
  const { t } = useLocale();
  const c = t.diceforgeArena;
  const [selected, setSelected] = useState<Offer | null>(null);
  return <>
    <p>{c.shopPrompt}</p>
    <div className="forge-shop">
      {offers.map(offer => {
        const price = Math.max(0, offer.cost - player.discount);
        return <button type="button" className="forge-offer" key={offer.id}
          disabled={price > player.coins} aria-pressed={selected?.id === offer.id}
          onClick={() => setSelected(offer)}>
          <FaceValue face={offer.face} /><strong>{c.costLabel(price)}</strong>
        </button>;
      })}
    </div>
    {selected && <div className="forge-workbench">
      <p className="arcade-caption">{t.play.balanceAfter} · {c.costLabel(player.coins - Math.max(0, selected.cost - player.discount))}</p>
      {player.dice.map((die, d) => <div key={d} className="forge-die-row">
        <b>{t.play.forgeDie(d + 1)}</b>
        <div>{die.map((face, f) => <button type="button" className="btn" key={f}
          aria-label={`${c.replaceLabel(d + 1, f + 1)} · ${t.play.faceNames[face.kind]} ${face.value} → ${t.play.faceNames[selected.face.kind]} ${selected.face.value}`}
          onClick={() => buy(selected, d, f)}><FaceValue face={face} /></button>)}</div>
      </div>)}
    </div>}
  </>;
}

export function DiceforgeArenaGame() {
  const g = useDiceforgeArena();
  const { t } = useLocale();
  const c = t.diceforgeArena;
  if (g.phase === "setup") {
    const options = (["easy", "medium", "hard"] as const).map(value => ({ value, label: t.common[value] }));
    return <section className="card screen forge-screen">
      <BackLink /><HowToPlay title={t.gamesMeta["diceforge-arena"].name}>{c.rules}</HowToPlay>
      <span className="field-label">{t.common.aiDifficulty} <InfoTip label={c.difficultyTipLabel}>{c.difficultyTip}</InfoTip></span>
      <SegPicker options={options} value={g.difficulty} onChange={v => g.setDifficulty(v as ForgeDifficulty)} />
      <div className="btn-row"><button className="btn primary" onClick={g.startMatch}>{t.common.startMatch}</button></div>
    </section>;
  }
  if (g.phase === "end" && g.result) return <section className="card end-card screen forge-screen">
    <div className="end-emoji">🎲</div>
    <div className={`end-title ${g.result === "player" ? "player-win" : g.result === "ai" ? "ai-win" : ""}`}>{c.endTitle(g.result)}</div>
    <div className="end-number">{c.healthResult(g.player.health, g.ai.health)}</div>
    <div className="btn-row">
      <button className="btn primary" onClick={g.playAgain}>{t.common.playAgain}</button>
      <button className="btn" onClick={g.toSetup}>{t.common.changeSettings}</button>
      <Link href="/" className="btn">{t.common.returnToHub}</Link>
    </div>
  </section>;
  const r = g.round;
  if (!r) return null;
  const playerFaces = r.playerResult?.faces ?? r.playerRoll.map((f, d) => g.player.dice[d][f]);
  const aiFaces = r.aiResult?.faces ?? r.aiRoll.map((f, d) => g.ai.dice[d][f]);
  return <section className="card screen forge-screen">
    <BackLink />
    <div className="forge-hud"><div><b>{c.youLabel}</b><span>♥ {g.player.health} · ◆ {g.player.shield} · ◉ {g.player.coins}</span></div>
      <strong>{c.roundLabel(r.number, 10)}</strong><div><b>{c.aiLabel}</b><span>♥ {g.ai.health} · ◆ {g.ai.shield} · ◉ {g.ai.coins}</span></div>
    </div>
    <div className="forge-arena" aria-live="polite">
      <div className="forge-roll"><span>{c.yourRoll}</span><div>{playerFaces.map((f, i) => <FaceValue key={i} face={f} />)}</div></div>
      <div className="forge-versus">VS</div>
      <div className="forge-roll"><span>{c.aiRoll}</span><div>{aiFaces.map((f, i) => <FaceValue key={i} face={f} />)}</div></div>
    </div>
    {g.stage === "lock" ? <>
      <p className="feedback">{c.lockPrompt}</p>
      <div className="forge-locks">{playerFaces.map((face, i) => <button key={i} className="btn" onClick={() => g.lockAndReroll(i)}>
        <FaceValue face={face} /> {c.lockDie(i + 1)}
      </button>)}</div>
    </> : <>
      <p className="feedback">{c.resultLine(r.playerResult!.damage, r.aiResult!.damage)}</p>
      <ForgeShop player={g.player} offers={r.shop} buy={g.buy} />
      <button className="btn" onClick={g.skipShop}>{c.skipShop}</button>
    </>}
  </section>;
}
