/**
 * Catalogue for the hub, static routes and scoreboard. Keep each index
 * free of gameplay imports. GameScreen loads the selected game on its route.
 */

import type { GameDefinition } from "./types";
import { basketShotGame } from "./basket-shot";
import { beatReactorGame } from "./beat-reactor";
import { blackjackGame } from "./blackjack";
import { circuitBreakerGame } from "./circuit-breaker";
import { connectFourGame } from "./connect-four";
import { diceforgeArenaGame } from "./diceforge-arena";
import { dominoGame } from "./domino";
import { fleetCommandGame } from "./fleet-command";
import { gooseGame } from "./goose-game";
import { guessGame } from "./guess";
import { higherOrLowerGame } from "./higher-or-lower";
import { hexDominionGame } from "./hex-dominion";
import { memoryMatchGame } from "./memory-match";
import { neonDriftGame } from "./neon-drift";
import { nimGame } from "./nim";
import { parchisGame } from "./parchis";
import { penaltyKickGame } from "./penalty-kick";
import { prismClashGame } from "./prism-clash";
import { propertyBaronGame } from "./property-baron";
import { reactionTimeGame } from "./reaction-time";
import { rpsGame } from "./rps";
import { shadowProtocolGame } from "./shadow-protocol";
import { signalBreakerGame } from "./signal-breaker";
import { slidingPuzzleGame } from "./sliding-puzzle";
import { spellstormGame } from "./spellstorm";
import { tttGame } from "./ttt";
import { tileRummyGame } from "./tile-rummy";
import { windlineArcheryGame } from "./windline-archery";
import { wordGuessGame } from "./word-guess";

export const GAMES = [
  guessGame,
  rpsGame,
  tttGame,
  higherOrLowerGame,
  memoryMatchGame,
  connectFourGame,
  nimGame,
  wordGuessGame,
  blackjackGame,
  prismClashGame,
  propertyBaronGame,
  parchisGame,
  gooseGame,
  tileRummyGame,
  dominoGame,
  slidingPuzzleGame,
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
] as const satisfies readonly GameDefinition[];

export type ListedGame = (typeof GAMES)[number];
export type GameId = ListedGame["id"];

export function getGame(id: string): ListedGame | undefined {
  return GAMES.find((game) => game.id === id);
}
