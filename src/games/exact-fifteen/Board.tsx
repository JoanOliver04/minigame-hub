import { useLocale } from "@/context/LocaleContext";
import type { BoardProps } from "../duels/types";
import { NUMBERS, winningTrio, type FifteenState } from "./logic";

export function FifteenBoard({ state, names, onPlay }: BoardProps<FifteenState, number>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const win = typeof state.winner === "number" ? winningTrio(state.owners, state.winner) : undefined;
  return <>
    <div className="duel-scores fifteen-hands">{names.map((name, seat) => <div key={seat}>
      <span>{seat === 0 ? "●" : "◆"} {name}</span>
      <strong>{NUMBERS.filter(n => state.owners[n - 1] === seat + 1).join(" · ") || "—"}</strong>
    </div>)}</div>
    <div className="fifteen-board" role="group" aria-label={es ? "Números del 1 al 9" : "Numbers one to nine"}>
      {NUMBERS.map(n => {
        const owner = state.owners[n - 1], mark = owner === 1 ? "●" : "◆";
        const label = owner ? names[owner - 1] : es ? "Disponible" : "Available";
        return <button type="button" key={n} className="fifteen-number" data-owner={owner} data-win={win?.includes(n)} data-last={state.last === n}
          aria-label={n + " · " + label} disabled={Boolean(owner) || !onPlay} onClick={() => onPlay?.(n)}>
          {n}{owner > 0 && <small aria-hidden="true">{mark}</small>}
        </button>;
      })}
    </div>
    <p className="duel-note" role="status">{win ? win.join(" + ") + " = 15" : state.last
      ? names[state.owners[state.last - 1] - 1] + " · " + state.last
      : es ? "Ganas con tres de tus números que sumen 15." : "Win with any three of your numbers that add up to 15."}</p>
  </>;
}
