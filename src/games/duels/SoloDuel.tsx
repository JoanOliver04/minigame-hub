"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { useScores } from "@/context/ScoresContext";
import { isTemporaryRecord, updateBrowserRecord, useBrowserRecord } from "@/lib/browserRecords";
import { randomSeed } from "@/lib/rng";
import { getUseDelay } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { duelCopy } from "./copy";
import { duelSaveKey, restoreDuel, type SavedDuel } from "./savedDuel";
import type { BoardProps, DuelRules, DuelState, Level } from "./types";

export function SoloDuel<S extends DuelState, A>({ rules, Board }: {
  rules: DuelRules<S, A>; Board: ComponentType<BoardProps<S, A>>;
}) {
  const { t, locale } = useLocale();
  const { record } = useScores();
  const key = duelSaveKey(rules.id);
  const raw = useBrowserRecord(key);
  const run = useMemo(() => restoreDuel(rules, raw), [rules, raw]);
  const [settingsFor, setSettingsFor] = useState<string | null>(null);
  const [chosenLevel, setLevel] = useState<Level | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const level = chosenLevel ?? run?.save.level ?? "medium";
  const setup = !run || settingsFor === run.save.id;
  const copy = duelCopy[locale];

  const update = useCallback(async (action: A) => {
    if (!run || run.save.finished) return;
    const next = rules.play(run.state, action);
    if (next === run.state) return;
    const save: SavedDuel<A> = { ...run.save, actions: [...run.save.actions, action],
      finished: next.winner !== null, updatedAt: Date.now() };
    // Two open tabs can both schedule the same AI turn. Only the first move on this position counts.
    setPending(raw);
    const accepted = await updateBrowserRecord(key, current => current === raw ? JSON.stringify(save) : undefined)
      .finally(() => setPending(current => current === raw ? null : current));
    if (!accepted) return;
    if (next.winner !== null) record(rules.id, next.winner === "tie" ? "tie" : next.winner === 0 ? "win" : "loss");
    playSound(next.winner === 0 ? "win" : next.winner === 1 ? "lose" : "blip");
  }, [run, raw, key, record, rules]);

  useEffect(() => {
    if (setup || !run || run.save.finished || run.state.active !== 1) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(() => void update(rules.choose(run.state, run.save.level)), getUseDelay() ? 650 : 180);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", schedule); };
  }, [run, rules, setup, update]);

  function start(nextLevel: Level) {
    const save: SavedDuel<A> = { id: crypto.getRandomValues(new Uint32Array(4)).join("-"), seed: randomSeed(),
      level: nextLevel, actions: [], finished: false, updatedAt: Date.now() };
    void updateBrowserRecord(key, current => current === raw ? JSON.stringify(save) : undefined);
  }

  return <section className="card screen duel-screen">
    <BackLink />
    <HowToPlay title={t.gamesMeta[rules.id].name}>{copy.rules[rules.id]}</HowToPlay>
    {setup ? <>
      <p className="duel-intro">{t.gamesMeta[rules.id].description}</p>
      {run && !run.save.finished && <div className="puzzle-resume">
        <p>{copy.progress(run.state.moves)} · {t.common[run.save.level]}</p>
        <button className="btn" onClick={() => setSettingsFor(null)}>{t.play.resumeGame}</button>
      </div>}
      <span className="field-label">{t.common.aiDifficulty}</span>
      <SegPicker options={(["easy", "medium", "hard"] as const).map(value => ({ value, label: t.common[value] }))}
        value={level} onChange={v => setLevel(v as Level)} />
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={() => start(level)}>{run && !run.save.finished ? copy.replace : copy.solo}</button>
        <Link className="btn" href={`/rooms?game=${rules.id}`} prefetch={false}>{t.rooms.navLink}</Link>
      </div>
    </> : <DuelBoard key={run.save.id} Board={Board} frames={run.frames} level={t.common[run.save.level]}
      saveNote={isTemporaryRecord(key) ? copy.temporary : copy.saved}
      onPlay={pending === raw ? undefined : action => void update(action)} onReplay={() => start(run.save.level)}
      onSettings={() => { setLevel(run.save.level); setSettingsFor(run.save.id); }} />}
  </section>;
}

function DuelBoard<S extends DuelState, A>({ Board, frames, level, saveNote, onPlay, onReplay, onSettings }: {
  Board: ComponentType<BoardProps<S, A>>; frames: S[]; level: string; saveNote: string;
  onPlay?: (action: A) => void; onReplay: () => void; onSettings: () => void;
}) {
  const { t, locale } = useLocale();
  const copy = duelCopy[locale];
  const [step, setStep] = useState<number | null>(null);
  const focusReview = useCallback((control: HTMLInputElement | null) => control?.focus(), []);
  const state = frames[frames.length - 1];
  const names: [string, string] = [t.common.you, t.common.ai];
  const reviewing = step !== null && state.winner !== null;
  const shown = reviewing ? frames[step] : state;
  return <>
    <h2 className="duel-status" role="status">{state.winner === null
      ? state.active === 0 ? t.rooms.turnYours : t.rooms.turnOpponent(t.common.ai)
      : state.winner === "tie" ? copy.tie : state.winner === 0 ? t.common.youWinMatch : t.common.aiWinsMatch}</h2>
    {reviewing && <div className="duel-film">
      <p role="status">{step === 0 ? copy.opening : copy.reviewMove(step, state.moves, names[frames[step - 1].active])}</p>
      <div>
        <button type="button" className="btn" disabled={step === 0} onClick={() => setStep(step - 1)} aria-label={copy.previous}>←</button>
        <input ref={focusReview} type="range" min={0} max={state.moves} value={step} aria-label={copy.review}
          aria-valuetext={step === 0 ? copy.opening : copy.reviewMove(step, state.moves, names[frames[step - 1].active])}
          onChange={e => setStep(Number(e.target.value))} />
        <button type="button" className="btn" disabled={step === state.moves} onClick={() => setStep(step + 1)} aria-label={copy.next}>→</button>
      </div>
    </div>}
    <Board state={shown} names={names} reviewing={reviewing} onPlay={state.winner === null && state.active === 0 ? onPlay : undefined} />
    <div className="btn-row">
      {state.winner !== null && <>
        <button type="button" className="btn primary" onClick={onReplay}>{t.common.playAgain}</button>
        <button type="button" className="btn" aria-expanded={reviewing} onClick={() => setStep(reviewing ? null : 0)}>
          {reviewing ? copy.closeReview : copy.review}
        </button>
      </>}
      <button type="button" className="btn" onClick={onSettings}>{t.common.changeSettings}</button>
    </div>
    {state.winner === null && <p className="duel-save-note">{saveNote} · {level}</p>}
  </>;
}
