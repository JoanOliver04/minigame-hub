import { randomUUID } from "node:crypto";
import { GAMES } from "@/games/registry";

export const dynamic = "force-static";

/** An imported worker script must change when a new edition of the games is built. */
export function GET() {
  const edition = {
    version: randomUUID(),
    routes: ["/", "/daily", "/favorites", "/scores", ...GAMES.map(game => "/games/" + game.id)],
  };
  return new Response("self.arcadeEdition = " + JSON.stringify(edition) + ";", {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
}
