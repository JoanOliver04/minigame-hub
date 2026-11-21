import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES, getGame } from "@/games/registry";
import { GameScreen } from "@/games/GameScreen";
import { dictionaries } from "@/lib/i18n/dictionaries";

/** Pre-render one static page per registered mini-game. */
export function generateStaticParams() {
  return GAMES.map((game) => ({ gameId: game.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/games/[gameId]">): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();
  const { name, description } = dictionaries.en.gamesMeta[game.id];
  const title = `${name} | Mini-Game Hub`;
  return { title, description, openGraph: { title, description, url: `/games/${game.id}`, images: ["/logo.png"] } };
}

export default async function GamePage({ params }: PageProps<"/games/[gameId]">) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  return <GameScreen gameId={game.id} />;
}
