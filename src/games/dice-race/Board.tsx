"use client";

import { useLocale } from "@/context/LocaleContext";
import { duelCopy } from "../duels/copy";
import { otherSeat, type BoardProps } from "../duels/types";
import { GOAL, roll, type DiceMove, type DiceState } from "./logic";

const pips = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

export function DiceBoard({ state, names, onPlay, reviewing }: BoardProps<DiceState, DiceMove>) {
  const { locale } = useLocale();
  const copy = duelCopy[locale];
  const name = names[state.lastFace === 1 || state.lastBank ? otherSeat(state.active) : state.active];
  const message = state.lastBank ? copy.banked(name, state.lastBank) : state.lastFace === 1
    ? copy.bust(name, state.lost) : copy.rolled(name, state.lastFace);
  return <>
    <p className="duel-note">{copy.target}</p>
    <div className="duel-scores">{names.map((label, i) => <div key={i}>
      <span>{label}</span><strong>{state.scores[i]} / {GOAL}</strong>
      <progress value={Math.min(state.scores[i], GOAL)} max={GOAL} aria-label={label} />
    </div>)}</div>
    <div className="race-table">
      <div className="race-die" aria-hidden="true">{Array.from({ length: 9 }, (_, i) =>
        <i key={i} data-pip={pips[state.lastFace || 5].includes(i)} />)}</div>
      <div><span>{copy.pot}</span><strong>{state.pot}</strong></div>
    </div>
    {state.moves > 0 && <p className="duel-note" role="status">{message}</p>}
    {state.winner === null && !reviewing && <div className="btn-row">
      <button type="button" className="btn primary race-roll" disabled={!onPlay} onClick={() => onPlay?.(roll())}>{copy.roll}</button>
      <button type="button" className="btn" disabled={!onPlay || !state.pot} onClick={() => onPlay?.({ kind: "bank" })}>
        {copy.bank}{state.pot > 0 && ` (+${state.pot})`}
      </button>
    </div>}
  </>;
}
