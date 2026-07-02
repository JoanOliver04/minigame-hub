"use client";

import { useLocale } from "@/context/LocaleContext";
import { EMPTY_SCORES, useScores } from "@/context/ScoresContext";
import { GAMES } from "@/games/registry";

/** Per-game win/loss/tie rows plus the combined overall total. */
export function StatsTable() {
  const { scores } = useScores();
  const { t } = useLocale();

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

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t.stats.game}</th>
          <th>{t.stats.wins}</th>
          <th>{t.stats.losses}</th>
          <th>{t.stats.ties}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ game, meta, tally }) => (
          <tr key={game.id}>
            <td>
              {game.icon} {meta.name}
            </td>
            <td className="w">{tally.win}</td>
            <td className="l">{tally.loss}</td>
            <td className="t">{game.hasTies ? tally.tie : t.stats.tieDash}</td>
          </tr>
        ))}
        <tr className="overall">
          <td>{t.stats.overall}</td>
          <td className="w">{overall.win}</td>
          <td className="l">{overall.loss}</td>
          <td className="t">{overall.tie}</td>
        </tr>
      </tbody>
    </table>
  );
}
