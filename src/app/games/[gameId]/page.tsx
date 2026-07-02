import { notFound } from "next/navigation";
import { GAMES, getGame } from "@/games/registry";

/** Pre-render one static page per registered mini-game. */
export function generateStaticParams() {
  return GAMES.map((game) => ({ gameId: game.id }));
}

export const dynamicParams = false;

export default async function GamePage({ params }: PageProps<"/games/[gameId]">) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  const Game = game.Component;
  return <Game />;
}
