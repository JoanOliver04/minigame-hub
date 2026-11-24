"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { useScores } from "@/context/ScoresContext";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { duelCopy } from "./copy";
import type { BoardProps, DuelRules, DuelState, Level } from "./types";

export function SoloDuel<S extends DuelState, A>({ rules, Board }: {
  rules: DuelRules<S, A>; Board: ComponentType<BoardProps<S, A>>;
}) {
  const { t, locale } = useLocale();
  const { record } = useScores();
  const [level, setLevel] = useState<Level>("medium");
  const [state, setState] = useState<S | null>(null);
  const current = useRef<S | null>(null);
  const copy = duelCopy[locale];
  const update = useCallback((expected: S, action: A) => {
    if (current.current !== expected) return;
    const next = rules.play(expected, action);
    if (next === expected) return;
    current.current = next;
    setState(next);
    if (next.winner !== null) record(rules.id, next.winner === "tie" ? "tie" : next.winner === 0 ? "win" : "loss");
    playSound(next.winner === 0 ? "win" : "blip");
  }, [rules, record]);

  useEffect(() => {
    if (!state || state.winner !== null || state.active !== 1) return;
    const timer = setTimeout(() => update(state, rules.choose(state, level)), getUseDelay() ? 650 : 180);
    return () => clearTimeout(timer);
  }, [state, rules, level, update]);
  function start() { current.current = rules.start(); setState(current.current); }

  return <section className="card screen duel-screen">
    <BackLink />
    <HowToPlay title={t.gamesMeta[rules.id].name}>{copy.rules[rules.id]}</HowToPlay>
    {!state ? <>
      <p className="duel-intro">{t.gamesMeta[rules.id].description}</p>
      <span className="field-label">{t.common.aiDifficulty}</span>
      <SegPicker options={(["easy", "medium", "hard"] as const).map(value => ({ value, label: t.common[value] }))}
        value={level} onChange={v => setLevel(v as Level)} />
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={start}>{copy.solo}</button>
        <Link className="btn" href={`/rooms?game=${rules.id}`} prefetch={false}>{t.rooms.navLink}</Link>
      </div>
    </> : <>
      <h2 className="duel-status" role="status">{state.winner === null
        ? state.active === 0 ? t.rooms.turnYours : t.rooms.turnOpponent(t.common.ai)
        : state.winner === "tie" ? copy.tie : state.winner === 0 ? t.common.youWinMatch : t.common.aiWinsMatch}</h2>
      <Board state={state} names={[t.common.you, t.common.ai]}
        onPlay={state.winner === null && state.active === 0 ? action => update(state, action) : undefined} />
      {state.winner !== null && <div className="btn-row">
        <button className="btn primary" onClick={start}>{t.common.playAgain}</button>
        <button className="btn" onClick={() => { current.current = null; setState(null); }}>{t.common.changeSettings}</button>
      </div>}
    </>}
  </section>;
}
