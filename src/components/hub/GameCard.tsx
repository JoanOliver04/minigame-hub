"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { GameDefinition } from "@/games/types";

/** Hub tile linking to a mini-game's route. */
export function GameCard({ game }: { game: GameDefinition }) {
  const { t } = useLocale();
  const meta = t.gamesMeta[game.id];

  return (
    <Link href={`/games/${game.id}`} className="game-card">
      <span className="icon">{game.icon}</span>
      <span className="name">{meta.name}</span>
      <span className="desc">{meta.description}</span>
    </Link>
  );
}
