/**
 * Mini-game registry — adding a game touches exactly three places:
 *   1. Create src/games/<id>/ with logic.ts, ai.ts, use<Name>.ts, <Name>.tsx, index.ts
 *   2. Import its GameDefinition here and append it to GAMES.
 *   3. Add its display name/description under `gamesMeta.<id>` in
 *      src/lib/i18n/dictionaries.tsx (both locales) — the hub card and
 *      stats row read it and require it to exist.
 * The hub cards, the /games/[gameId] route, and the scoreboard all
 * derive from this list automatically.
 */

import type { GameDefinition } from "./types";
import { basketShotGame } from "./basket-shot";
import { blackjackGame } from "./blackjack";
import { connectFourGame } from "./connect-four";
import { guessGame } from "./guess";
import { higherOrLowerGame } from "./higher-or-lower";
import { memoryMatchGame } from "./memory-match";
import { nimGame } from "./nim";
import { penaltyKickGame } from "./penalty-kick";
import { reactionTimeGame } from "./reaction-time";
import { rpsGame } from "./rps";
import { tttGame } from "./ttt";
import { wordGuessGame } from "./word-guess";

export const GAMES: GameDefinition[] = [
  guessGame,
  rpsGame,
  tttGame,
  higherOrLowerGame,
  memoryMatchGame,
  connectFourGame,
  nimGame,
  wordGuessGame,
  blackjackGame,
  reactionTimeGame,
  penaltyKickGame,
  basketShotGame,
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}
