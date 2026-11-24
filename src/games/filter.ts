import type { GameCategory, GameDefinition } from "./types";

interface Filters {
  query: string;
  category: GameCategory | "all";
  multiplayerOnly: boolean;
  categoryNames?: Record<GameCategory, string>;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function filterGames<TGame extends GameDefinition>(
  games: readonly TGame[],
  metadata: Record<string, { name: string; description: string }>,
  { query, category, multiplayerOnly, categoryNames }: Filters,
): TGame[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return games.filter((game) => {
    if (category !== "all" && game.category !== category) return false;
    if (multiplayerOnly && !game.supportsMultiplayer) return false;
    if (terms.length === 0) return true;
    const meta = metadata[game.id];
    const text = normalize([game.id, meta?.name, meta?.description, categoryNames?.[game.category]].join(" "));
    return terms.every((term) => text.includes(term));
  });
}
