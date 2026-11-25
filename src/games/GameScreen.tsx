"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameId } from "./registry";
import { useLocale } from "@/context/LocaleContext";

// Keep the import paths literal so Next.js can split each game into its own chunks.
const gameScreens = {
  "ice-floe": dynamic(() => import("./ice-floe/Game").then(module => module.Game)),
  "pirate-loot": dynamic(() => import("./pirate-loot/Game").then(module => module.Game)),
  "dots-boxes": dynamic(() => import("./dots-boxes/Game").then(module => module.Game)),
  mancala: dynamic(() => import("./mancala/Game").then(module => module.Game)),
  "mini-reversi": dynamic(() => import("./mini-reversi/Game").then(module => module.Game)),
  "dice-race": dynamic(() => import("./dice-race/Game").then(module => module.Game)),
  "basket-shot": dynamic(() => import("./basket-shot/BasketShotGame").then((module) => module.BasketShotGame)),
  "beat-reactor": dynamic(() => import("./beat-reactor/BeatReactorGame").then((module) => module.BeatReactorGame)),
  "blackjack": dynamic(() => import("./blackjack/BlackjackGame").then((module) => module.BlackjackGame)),
  "circuit-breaker": dynamic(() => import("./circuit-breaker/CircuitBreakerGame").then((module) => module.CircuitBreakerGame)),
  "connect-four": dynamic(() => import("./connect-four/ConnectFourGame").then((module) => module.ConnectFourGame)),
  "diceforge-arena": dynamic(() => import("./diceforge-arena/DiceforgeArenaGame").then((module) => module.DiceforgeArenaGame)),
  "domino": dynamic(() => import("./domino/DominoGame").then((module) => module.DominoGame)),
  "fleet-command": dynamic(() => import("./fleet-command/FleetCommandGame").then((module) => module.FleetCommandGame)),
  "goose-game": dynamic(() => import("./goose-game/GooseGame").then((module) => module.GooseGame)),
  "guess": dynamic(() => import("./guess/GuessGame").then((module) => module.GuessGame)),
  "higher-or-lower": dynamic(() => import("./higher-or-lower/HigherOrLowerGame").then((module) => module.HigherOrLowerGame)),
  "hex-dominion": dynamic(() => import("./hex-dominion/HexDominionGame").then((module) => module.HexDominionGame)),
  "memory-match": dynamic(() => import("./memory-match/MemoryMatchGame").then((module) => module.MemoryMatchGame)),
  "neon-drift": dynamic(() => import("./neon-drift/NeonDriftGame").then((module) => module.NeonDriftGame)),
  "nim": dynamic(() => import("./nim/NimGame").then((module) => module.NimGame)),
  "parchis": dynamic(() => import("./parchis/ParchisGame").then((module) => module.ParchisGame)),
  "penalty-kick": dynamic(() => import("./penalty-kick/PenaltyKickGame").then((module) => module.PenaltyKickGame)),
  "prism-clash": dynamic(() => import("./prism-clash/PrismClashGame").then((module) => module.PrismClashGame)),
  "property-baron": dynamic(() => import("./property-baron/PropertyBaronGame").then((module) => module.PropertyBaronGame)),
  "reaction-time": dynamic(() => import("./reaction-time/ReactionTimeGame").then((module) => module.ReactionTimeGame)),
  "rps": dynamic(() => import("./rps/RpsGame").then((module) => module.RpsGame)),
  "shadow-protocol": dynamic(() => import("./shadow-protocol/ShadowProtocolGame").then((module) => module.ShadowProtocolGame)),
  "signal-breaker": dynamic(() => import("./signal-breaker/SignalBreakerGame").then((module) => module.SignalBreakerGame)),
  "sliding-puzzle": dynamic(() => import("./sliding-puzzle/SlidingPuzzleGame").then((module) => module.SlidingPuzzleGame)),
  "spellstorm": dynamic(() => import("./spellstorm/SpellstormGame").then((module) => module.SpellstormGame)),
  "ttt": dynamic(() => import("./ttt/TttGame").then((module) => module.TttGame)),
  "tile-rummy": dynamic(() => import("./tile-rummy/TileRummyGame").then((module) => module.TileRummyGame)),
  "windline-archery": dynamic(() => import("./windline-archery/WindlineArcheryGame").then((module) => module.WindlineArcheryGame)),
  "word-guess": dynamic(() => import("./word-guess/WordGuessGame").then((module) => module.WordGuessGame)),
} satisfies Record<GameId, ComponentType>;

export function GameScreen({ gameId }: { gameId: GameId }) {
  const { t } = useLocale();
  const Game = gameScreens[gameId];
  return <>
    <h1 className="solo-title">{t.gamesMeta[gameId].name}</h1>
    <Game key={gameId} />
  </>;
}
