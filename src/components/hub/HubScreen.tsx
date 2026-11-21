"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { filterGames } from "@/games/filter";
import { GAMES } from "@/games/registry";
import { GAME_CATEGORIES, type GameCategory } from "@/games/types";
import { GameCard } from "./GameCard";
import { StatsTable } from "./StatsTable";

const categories = ["all", ...GAME_CATEGORIES] as const;

export function HubScreen() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [multiplayerOnly, setMultiplayerOnly] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const games = filterGames(GAMES, t.gamesMeta, { query, category, multiplayerOnly });
  const filtered = Boolean(query || category !== "all" || multiplayerOnly);

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setMultiplayerOnly(false);
  }

  return (
    <section className="hub-screen screen" aria-labelledby="hub-title">
      <div className="hub-lead">
        <h1 id="hub-title">{t.hub.title}</h1>
        <p>{t.hub.intro}</p>
      </div>

      <div className="hub-controls">
        <label className="hub-search">
          <span>{t.hub.search}</span>
          <input
            type="search"
            className="text-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.hub.searchPlaceholder}
            autoComplete="off"
          />
        </label>
        <label className="hub-online">
          <input
            type="checkbox"
            checked={multiplayerOnly}
            onChange={(event) => setMultiplayerOnly(event.target.checked)}
          />
          {t.hub.multiplayer}
        </label>
        <div className="seg hub-categories" role="group" aria-label={t.hub.filters}>
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              className={category === value ? "selected" : ""}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value === "all" ? t.hub.all : t.hub.categories[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="hub-results">
        <p role="status">{t.hub.results(games.length)}</p>
        {filtered && <button type="button" className="hub-clear" onClick={clearFilters}>{t.hub.clear}</button>}
      </div>

      {games.length > 0 ? (
        <ul className="hub-games" role="list">
          {games.map((game) => (
            <li key={game.id}><GameCard game={game} /></li>
          ))}
        </ul>
      ) : (
        <p className="hub-empty">{t.hub.empty}</p>
      )}

      <details className="card hub-scoreboard" onToggle={(event) => setScoreboardOpen(event.currentTarget.open)}>
        <summary>{t.hub.scoreboard}</summary>
        {scoreboardOpen && <StatsTable />}
      </details>
    </section>
  );
}
