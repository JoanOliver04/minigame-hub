"use client";

import { useLocale } from "@/context/LocaleContext";
import { duelCopy } from "../duels/copy";
import type { BoardProps } from "../duels/types";
import { captures, countDiscs, SIZE, type ReversiState } from "./logic";

export function ReversiBoard({ state, names, onPlay }: BoardProps<ReversiState, number>) {
  const { locale } = useLocale();
  const copy = duelCopy[locale];
  const scores = countDiscs(state.board);
  return <>
    <div className="duel-scores">{names.map((name, i) => <div key={i}>
      <span>{name} · {i ? copy.light : copy.dark}</span><strong>{scores[i]}</strong>
    </div>)}</div>
    <div className="reversi-grid" role="group" aria-label={copy.board}>
      {state.board.map((disc, i) => {
        const flips = onPlay ? captures(state.board, state.active, i).length : 0;
        const coord = String.fromCharCode(65 + i % SIZE) + (1 + Math.floor(i / SIZE));
        const label = flips ? copy.flips(flips) : disc === 1 ? copy.dark : disc === 2 ? copy.light : copy.empty;
        return <button key={i} className="reversi-cell" data-disc={disc} data-last={state.last === i}
          type="button" disabled={!flips} aria-label={coord + " · " + label} onClick={() => onPlay?.(i)}>
          {disc ? <span className="reversi-disc" /> : flips ? <span className="reversi-option">{flips}</span> : null}
        </button>;
      })}
    </div>
    {onPlay && state.moves < 2 && <p className="duel-note">{copy.preview}</p>}
    {state.passed && <p className="duel-note">{copy.pass}</p>}
  </>;
}
