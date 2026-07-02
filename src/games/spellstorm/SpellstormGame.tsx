"use client";

import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Element, Spell, SpellDifficulty } from "./types";
import { SPELL_COST } from "./types";
import { useSpellstorm } from "./useSpellstorm";

const ELEMENT_GLYPH: Record<Element, string> = { fire: "▲", ice: "◆", shield: "⬡" };

function MagePanel({
  title,
  mage,
  side,
}: {
  title: string;
  mage: ReturnType<typeof useSpellstorm>["player"];
  side: "player" | "ai";
}) {
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

export function SpellstormGame() {
  const game = useSpellstorm();
  const { t } = useLocale();
  const copy = t.spellstorm;
  const difficultyOptions = (["easy", "medium", "hard"] as SpellDifficulty[]).map((value) => ({
    value,
    label: t.common[value],
  }));

  if (game.phase === "setup") {
    return (
      <section className="card screen storm-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.spellstorm.name}>{copy.rules}</HowToPlay>
        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={copy.difficultyTipLabel}>{copy.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={difficultyOptions}
          value={game.difficulty}
          onChange={(value) => game.setDifficulty(value as SpellDifficulty)}
        />
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={game.startMatch}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (game.phase === "end") {
    return (
      <section className="card end-card screen storm-screen">
        <div className="end-emoji">⚡</div>
        <div className={`end-title ${game.outcome === "player" ? "player-win" : game.outcome === "ai" ? "ai-win" : ""}`}>
          {copy.endTitle(game.outcome ?? "tie")}
        </div>
        <div className="end-number">{copy.healthResult(game.player.health, game.ai.health)}</div>
        <div className="end-stats">
          <div className="stat-box player"><div className="label">{copy.yourWords}</div><div className="value">{game.player.words}</div></div>
          <div className="stat-box ai"><div className="label">{copy.aiWords}</div><div className="value">{game.ai.words}</div></div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={game.playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={game.toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const spellButtons: Spell[] = ["fire", "ice", "shield"];
  return (
    <section className="card screen storm-screen">
      <BackLink />
      <div className="storm-time" aria-label={copy.timeLabel(game.remaining)}>
        <span style={{ width: `${(game.remaining / 75) * 100}%` }} />
        <b>{game.remaining}s</b>
      </div>
      <div className="storm-duel">
        <MagePanel title={copy.you} mage={game.player} side="player" />
        <div className="storm-orb" aria-hidden="true">✦</div>
        <MagePanel title={copy.ai} mage={game.ai} side="ai" />
      </div>

      <div className="storm-words">
        <div className={`storm-word-card ${game.playerWord?.element ?? "fire"}`}>
          <span className="storm-element">
            {ELEMENT_GLYPH[game.playerWord?.element ?? "fire"]} {copy.elementLabels[game.playerWord?.element ?? "fire"]}
          </span>
          <strong>{game.playerWord?.display}</strong>
          <input
            autoFocus
            className={game.playerWord?.normalized.startsWith(game.input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()) ? "" : "invalid"}
            value={game.input}
            maxLength={8}
            disabled={game.playerPaused}
            onChange={(event) => game.typeWord(event.target.value)}
            aria-label={copy.typeLabel}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <small>{game.playerPaused ? copy.frozen : copy.typePrompt}</small>
        </div>
        <div className={`storm-word-card ai ${game.aiWord?.element ?? "ice"}`}>
          <span className="storm-element">
            {ELEMENT_GLYPH[game.aiWord?.element ?? "ice"]} {copy.elementLabels[game.aiWord?.element ?? "ice"]}
          </span>
          <strong>{game.aiWord?.display}</strong>
          <div className="storm-ai-type" aria-label={copy.aiTyping}>{game.aiTyped}<i /></div>
          <small>{game.aiCorrectedTypo ? copy.aiCorrecting : copy.aiTyping}</small>
        </div>
      </div>

      <div className="storm-spells">
        {spellButtons.map((spell) => (
          <button
            key={spell}
            className={`storm-spell ${spell}`}
            disabled={game.player.energy < SPELL_COST}
            onClick={() => game.playerCast(spell)}
          >
            <span>{ELEMENT_GLYPH[spell]}</span>
            <b>{copy.spellLabels[spell]}</b>
            <small>{copy.spellEffects[spell]}</small>
          </button>
        ))}
      </div>
      <div className="feedback storm-feedback" aria-live="polite">
        {game.lastSpell
          ? copy.castFeedback(game.lastSpell.actor, game.lastSpell.spell)
          : copy.energyHint(SPELL_COST)}
      </div>
    </section>
  );
}
