"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { GameDefinition } from "@/games/types";
import { writeValue } from "@/lib/browserStorage";
import { toggleFavorite } from "./useFavorites";

/** Hub tile linking to a mini-game's route. */
export function GameCard({ game, favorite, onlyFavorites }: { game: GameDefinition; favorite: boolean; onlyFavorites: boolean }) {
  const { t } = useLocale();
  const meta = t.gamesMeta[game.id];

  return (
    <article className="game-tile" data-category={game.category}>
      <Link href={`/games/${game.id}`} className="game-card" prefetch={false}
        onNavigate={() => writeValue("miniHubFavoriteOrigin", onlyFavorites ? `/games/${game.id}` : null, "session")}>
        <span className="game-card-top">
          <span className="icon" aria-hidden="true">{game.icon}</span>
          <span className="game-category">{t.hub.categories[game.category]}</span>
        </span>
        <span className="name">{meta.name}</span>
        <span className="desc">{meta.description}</span>
      </Link>
      {game.supportsMultiplayer && (
        <Link href={`/rooms?game=${game.id}`} className="game-friend-action" prefetch={false}
          aria-label={`${t.rooms.playWithFriend} · ${meta.name}`}>
          <span aria-hidden="true">👥</span> {t.rooms.playWithFriend}
          <span className="friend-arrow" aria-hidden="true">→</span>
        </Link>
      )}
      <button type="button" className="favorite-star" aria-label={t.hub.favoriteLabel(meta.name)}
        title={t.hub.favoriteLabel(meta.name)} aria-pressed={favorite} onClick={(event) => {
          if (onlyFavorites) {
            const item = event.currentTarget.closest("li");
            const sibling = item?.nextElementSibling ?? item?.previousElementSibling;
            (sibling?.querySelector<HTMLElement>(".favorite-star") ?? document.getElementById("hub-title"))?.focus();
          }
          toggleFavorite(game.id);
        }}>
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
      </button>
    </article>
  );
}
