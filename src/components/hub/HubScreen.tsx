"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { filterGames } from "@/games/filter";
import { GAMES } from "@/games/registry";
import { GAME_CATEGORIES } from "@/games/types";
import { readValue, subscribeStorage, writeValue } from "@/lib/browserStorage";
import { GameCard } from "./GameCard";
import { StatsTable } from "./StatsTable";
import { DailyFeature } from "./DailyFeature";
import { useFavorites } from "./useFavorites";

const categories = ["all", ...GAME_CATEGORIES] as const;

type View = "library" | "favorites" | "scores";
export function HubScreen({ view = "library" }: { view?: View }) {
  const { t } = useLocale();
  const favorites = useFavorites();
  const nav = [
    { view: "library", href: "/", label: t.hub.library },
    { view: "favorites", href: "/favorites", label: t.hub.favorites },
    { view: "scores", href: "/scores", label: t.hub.scoreboard },
  ] as const;

  return (
    <section className="hub-screen screen" aria-labelledby="hub-title">
      <nav className="hub-nav" aria-label={t.app.title}>
        {nav.map((item) => <Link key={item.view} href={item.href} prefetch={false} aria-current={view === item.view ? "page" : undefined}>
          {item.label}{item.view === "favorites" && favorites.size > 0 && <span>{favorites.size}</span>}
        </Link>)}
      </nav>
      {view === "library" && <>
        <DailyFeature />
        <section className="friends-entry" aria-labelledby="friends-entry-title">
          <div><h2 id="friends-entry-title">{t.rooms.navLink}</h2><p>{t.rooms.homeHint}</p></div>
          <div className="friends-entry-actions">
            <Link className="btn primary" href="/rooms" prefetch={false}>{t.rooms.inviteFriend}</Link>
            <Link className="btn" href="/rooms?mode=join" prefetch={false}>{t.rooms.haveCode}</Link>
          </div>
        </section>
      </>}
      <h1 id="hub-title" tabIndex={-1} className="library-title">{nav.find((entry) => entry.view === view)?.label}</h1>
      {view === "scores" ? <StatsTable /> : <Catalogue favorites={favorites} onlyFavorites={view === "favorites"} />}
    </section>
  );
}

function Catalogue({ favorites, onlyFavorites }: { favorites: Set<string>; onlyFavorites: boolean }) {
  const { t } = useLocale();
  const storageKey = onlyFavorites ? "miniHubFavoriteFilters" : "miniHubLibraryFilters";
  const stored = useSyncExternalStore(subscribeStorage, () => readValue(storageKey, "session"), () => null);
  const filters = new URLSearchParams(stored ?? "");
  const query = filters.get("q") ?? "";
  const category = categories.find(value => value === filters.get("category")) ?? "all";
  const multiplayerOnly = filters.get("multiplayer") === "1";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const source = onlyFavorites ? GAMES.filter((game) => favorites.has(game.id)) : GAMES;
  const games = filterGames(source, t.gamesMeta, { query, category, multiplayerOnly, categoryNames: t.hub.categories });
  const filtered = Boolean(query || category !== "all" || multiplayerOnly);
  const activeOptions = Number(category !== "all") + Number(multiplayerOnly);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(readValue(storageKey, "session") ?? "");
    if (value) next.set(key, value);
    else next.delete(key);
    writeValue(storageKey, next.toString() || null, "session");
  }

  function clearFilters() {
    writeValue(storageKey, null, "session");
    searchRef.current?.focus();
  }

  if (onlyFavorites && !favorites.size) {
    return <div className="hub-empty"><p>{t.hub.emptyFavorites}</p><Link className="btn" href="/">{t.hub.browse}</Link></div>;
  }
  return (
    <>
      <div className="hub-controls">
        <label className="hub-search">
          <span>{t.hub.search}</span>
          <input
            ref={searchRef}
            type="search"
            className="text-input"
            value={query}
            onChange={(event) => setFilter("q", event.target.value)}
            placeholder={t.hub.searchPlaceholder}
            autoComplete="off"
          />
        </label>
        <button type="button" className="btn mobile-filters" aria-expanded={filtersOpen}
          aria-controls="catalogue-filters" onClick={() => setFiltersOpen(!filtersOpen)}>
          {t.hub.filterButton}{activeOptions > 0 && ` · ${activeOptions}`}
        </button>
        <div id="catalogue-filters" className="catalogue-filters" data-open={filtersOpen}>
          <label className="hub-online">
            <input
              type="checkbox"
              checked={multiplayerOnly}
              onChange={(event) => setFilter("multiplayer", event.target.checked ? "1" : "")}
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
                onClick={() => setFilter("category", value === "all" ? "" : value)}
              >
                {value === "all" ? t.hub.all : t.hub.categories[value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hub-results">
        <p role="status">{t.hub.results(games.length)}</p>
        {filtered && <button type="button" className="hub-clear" onClick={clearFilters}>{t.hub.clear}</button>}
      </div>

      {games.length > 0 ? (
        <ul className="hub-games" role="list">
          {games.map((game) => (
            <li key={game.id}><GameCard game={game} favorite={favorites.has(game.id)} onlyFavorites={onlyFavorites} /></li>
          ))}
        </ul>
      ) : (
        <p className="hub-empty">{t.hub.empty}</p>
      )}

    </>
  );
}
