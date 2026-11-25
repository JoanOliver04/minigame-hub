import { useLocale } from "@/context/LocaleContext";
import { otherSeat, type BoardProps } from "../duels/types";
import { price, type LootState, type Prize } from "./logic";

function prizeName(prize: Prize, es: boolean) {
  if (prize === "chest") return es ? "Cofre" : "Chest";
  if (prize === "key") return es ? "Llave" : "Key";
  return es ? "Monedas" : "Coins";
}

export function LootBoard({ state, names, onPlay }: BoardProps<LootState, number>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const [goldLabel, keysLabel] = es ? ["Oro", "Llaves"] : ["Gold", "Keys"];
  return <>
    <div className="duel-scores loot-scores">{names.map((name, i) => <div key={i}>
      <span>{name}</span><strong>{goldLabel} · {state.gold[i]}</strong>
      <small>{keysLabel} · {state.keys[i]}</small>
    </div>)}</div>
    <div className="loot-deck" role="group" aria-label={es ? "Fila de tesoros" : "Treasure row"}>
      {state.deck.map((prize, i) => {
        const taken = i < state.left || i > state.right;
        const end = !taken && (i === state.left || i === state.right);
        const gain = price(prize, state.keys[state.active]);
        const name = prizeName(prize, es);
        const label = taken ? (es ? "Retirado" : "Taken") : name + " · " + goldLabel + " " + gain;
        return <button key={i} type="button" className="loot-card" data-end={end} data-taken={taken}
          data-kind={typeof prize === "number" ? "coins" : prize}
          aria-label={`${i + 1} · ${label}`} disabled={!end || !onPlay} onClick={() => onPlay?.(i)}>
          {taken ? <span aria-hidden="true">·</span> : <>
            <span aria-hidden="true" className="loot-symbol">{prize === "key" ? "🗝️" : prize === "chest" ? <i className="loot-chest" /> : "🪙"}</span>
            <strong>{typeof prize === "number" ? "+" + prize : name}</strong>
            {end && <small>{onPlay ? (es ? "Elegir" : "Pick") : goldLabel} · +{gain}</small>}
          </>}
        </button>;
      })}
    </div>
    {onPlay && <p className="duel-note loot-tip">{es ? "Elige un extremo. Una llave abre el próximo cofre que tomes por 10 de oro. Cerrado vale 2."
      : "Pick either end. A key opens the next chest you take for 10 gold. A locked chest is worth 2."}</p>}
    {state.last >= 0 && <p className="loot-receipt" role="status">
      {names[otherSeat(state.active)]} · {prizeName(state.deck[state.last], es)} · +{state.gain} {es ? "de oro" : "gold"}
    </p>}
  </>;
}
