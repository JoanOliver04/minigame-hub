"use client";

import { useLocale } from "@/context/LocaleContext";
import { EMPTY_SCORES, useScores } from "@/context/ScoresContext";
import { GAMES } from "@/games/registry";
import Link from "next/link";
import { useState } from "react";

/** Per-game win/loss/tie rows plus the combined overall total. */
export function StatsTable() {
  const { scores } = useScores();
  const { t, locale } = useLocale();
  const [showAll, setShowAll] = useState(false);

  const rows = GAMES.map((game) => ({
    game,
    meta: t.gamesMeta[game.id],
    tally: scores[game.id] ?? EMPTY_SCORES,
  }));

  const overall = rows.reduce(
    (acc, row) => ({
      win: acc.win + row.tally.win,
      loss: acc.loss + row.tally.loss,
      tie: acc.tie + row.tally.tie,
    }),
    { win: 0, loss: 0, tie: 0 },
  );

  const played = rows.filter(({ tally }) => tally.win + tally.tie + tally.loss > 0);
  const matches = overall.win + overall.loss + overall.tie;
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  return (<>
    <p className="score-description">{t.stats.history}</p>
    <dl className="score-totals">
      <div><dt>{t.stats.matches}</dt><dd>{matches.toLocaleString(locale)}</dd></div>
      <div><dt>{t.stats.played}</dt><dd>{played.length} <small>/ {GAMES.length}</small></dd></div>
      <div><dt>{t.stats.winRate}</dt><dd>{matches ? percent.format(overall.win / matches) : t.stats.tieDash}</dd></div>
    </dl>
    <label className="hub-online"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />{t.stats.showAll}</label>
    {!showAll && !played.length ? <div className="hub-empty"><p>{t.stats.empty}</p><Link href="/" className="btn">{t.hub.browse}</Link></div> :
    <table className="stats-table" aria-label={t.hub.scoreboard}>
      <thead>
        <tr>
          <th scope="col">{t.stats.game}</th>
          <th scope="col">{t.stats.wins}</th>
          <th scope="col">{t.stats.losses}</th>
          <th scope="col">{t.stats.ties}</th>
        </tr>
      </thead>
      <tbody>
        {(showAll ? rows : played).map(({ game, meta, tally }) => (
          <tr key={game.id}>
            <th scope="row"><Link href={`/games/${game.id}`} prefetch={false}><span aria-hidden="true">{game.icon}</span> {meta.name}</Link></th>
            <td className="w">{tally.win}</td>
            <td className="l">{tally.loss}</td>
            <td className="t">{game.hasTies ? tally.tie : t.stats.tieDash}</td>
          </tr>
        ))}
        <tr className="overall">
          <th scope="row">{t.stats.overall}</th>
          <td className="w">{overall.win}</td>
          <td className="l">{overall.loss}</td>
          <td className="t">{overall.tie}</td>
        </tr>
      </tbody>
    </table>}
  </>);
}
