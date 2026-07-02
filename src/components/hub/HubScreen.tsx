"use client";

import { useLocale } from "@/context/LocaleContext";
import { GAMES } from "@/games/registry";
import { GameCard } from "./GameCard";
import { StatsTable } from "./StatsTable";

/** Main menu: one card per registered mini-game + the session scoreboard. */
export function HubScreen() {
  const { t } = useLocale();

  return (
    <section className="screen">
      <div className="hub-games">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <div className="card">
        <span className="field-label" style={{ marginTop: 0 }}>
          {t.hub.scoreboard}
        </span>
        <StatsTable />
      </div>
    </section>
  );
}
