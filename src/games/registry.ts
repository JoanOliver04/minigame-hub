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
import { beatReactorGame } from "./beat-reactor";
import { blackjackGame } from "./blackjack";
import { circuitBreakerGame } from "./circuit-breaker";
import { connectFourGame } from "./connect-four";
import { diceforgeArenaGame } from "./diceforge-arena";
import { fleetCommandGame } from "./fleet-command";
import { guessGame } from "./guess";
import { higherOrLowerGame } from "./higher-or-lower";
import { hexDominionGame } from "./hex-dominion";
import { memoryMatchGame } from "./memory-match";
import { neonDriftGame } from "./neon-drift";
import { nimGame } from "./nim";
import { penaltyKickGame } from "./penalty-kick";
import { reactionTimeGame } from "./reaction-time";
import { rpsGame } from "./rps";
import { shadowProtocolGame } from "./shadow-protocol";
import { signalBreakerGame } from "./signal-breaker";
import { spellstormGame } from "./spellstorm";
import { tttGame } from "./ttt";
import { windlineArcheryGame } from "./windline-archery";
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
  shadowProtocolGame,
  fleetCommandGame,
  windlineArcheryGame,
  beatReactorGame,
  circuitBreakerGame,
  neonDriftGame,
  signalBreakerGame,
  diceforgeArenaGame,
  hexDominionGame,
  spellstormGame,
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}
