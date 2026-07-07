import { BasketRoomGame } from "./basket-shot/BasketRoomGame";
import { createInitialBasketRoomGame, seedBasketRoomGame } from "./basket-shot/room";
import { BeatReactorRoomGame } from "./beat-reactor/BeatReactorRoomGame";
import { createInitialReactorRoomGame, seedReactorRoomGame } from "./beat-reactor/room";
import { BlackjackRoomGame } from "./blackjack/BlackjackRoomGame";
import { createInitialBlackjackRoomGame, seedBlackjackRoomGame } from "./blackjack/room";
import { CircuitBreakerRoomGame } from "./circuit-breaker/CircuitBreakerRoomGame";
import { createInitialBreakerRoomGame, seedBreakerRoomGame } from "./circuit-breaker/room";
import { NeonDriftRoomGame } from "./neon-drift/NeonDriftRoomGame";
import { createInitialDriftRoomGame, seedDriftRoomGame } from "./neon-drift/room";
import { ArcheryRoomGame } from "./windline-archery/ArcheryRoomGame";
import { createInitialArcheryRoomGame, seedArcheryRoomGame } from "./windline-archery/room";
import { ConnectRoomGame } from "./connect-four/ConnectRoomGame";
import { createInitialConnectRoomGame, seedConnectRoomGame } from "./connect-four/room";
import { DiceforgeRoomGame } from "./diceforge-arena/DiceforgeRoomGame";
import { createInitialForgeRoomGame, seedForgeRoomGame } from "./diceforge-arena/room";
import { HexRoomGame } from "./hex-dominion/HexRoomGame";
import { createInitialHexRoomGame, seedHexRoomGame } from "./hex-dominion/room";
import { SpellstormRoomGame } from "./spellstorm/SpellstormRoomGame";
import { createInitialStormRoomGame, seedStormRoomGame } from "./spellstorm/room";
import { SignalRoomGame } from "./signal-breaker/SignalRoomGame";
import { createInitialSignalRoomGame, seedSignalRoomGame } from "./signal-breaker/room";
import { FleetRoomGame } from "./fleet-command/FleetRoomGame";
import { createInitialFleetRoomGame, seedFleetRoomGame } from "./fleet-command/room";
import { GuessRoomGame } from "./guess/GuessRoomGame";
import { createInitialGuessRoomGame, seedGuessRoomGame } from "./guess/room";
import { GooseRoomGame } from "./goose-game/GooseRoomGame";
import { createInitialGooseRoomGame, seedGooseRoomGame } from "./goose-game/room";
import { HolRoomGame } from "./higher-or-lower/HolRoomGame";
import { createInitialHolRoomGame, seedHolRoomGame } from "./higher-or-lower/room";
import { MemoryRoomGame } from "./memory-match/MemoryRoomGame";
import { createInitialMemoryRoomGame, seedMemoryRoomGame } from "./memory-match/room";
import { ParchisRoomGame } from "./parchis/ParchisRoomGame";
import { createInitialParchisRoomGame, seedParchisRoomGame } from "./parchis/room";
import { NimRoomGame } from "./nim/NimRoomGame";
import { createInitialNimRoomGame, seedNimRoomGame } from "./nim/room";
import { ReactionRoomGame } from "./reaction-time/ReactionRoomGame";
import { createInitialReactionRoomGame, seedReactionRoomGame } from "./reaction-time/room";
import { ShadowRoomGame } from "./shadow-protocol/ShadowRoomGame";
import { createInitialShadowRoomGame, seedShadowRoomGame } from "./shadow-protocol/room";
import { PenaltyRoomGame } from "./penalty-kick/PenaltyRoomGame";
import { createInitialPenaltyRoomGame, seedPenaltyRoomGame } from "./penalty-kick/room";
import { PrismRoomGame } from "./prism-clash/PrismRoomGame";
import { createInitialPrismRoomGame, seedPrismRoomGame } from "./prism-clash/room";
import { RpsRoomGame } from "./rps/RpsRoomGame";
import { createInitialRpsRoomGame, seedRpsRoomGame } from "./rps/room";
import { TttRoomGame } from "./ttt/TttRoomGame";
import { createInitialTttRoomGame, seedTttRoomGame } from "./ttt/room";
import { TileRummyRoomGame } from "./tile-rummy/TileRummyRoomGame";
import { createInitialTileRummyRoomGame, seedTileRummyRoomGame } from "./tile-rummy/room";
import { WordRoomGame } from "./word-guess/WordRoomGame";
import { createInitialWordRoomGame, seedWordRoomGame } from "./word-guess/room";
import type { RoomGameModule } from "./roomTypes";

/**
 * Games with a room-based PvP mode, keyed by GameDefinition.id.
 * `/rooms/[code]` dispatches through this map by the room document's
 * `gameId`; a gameId with no entry here means that game has no multiplayer
 * mode yet.
 */
export const ROOM_GAMES: Record<string, RoomGameModule> = {
  rps: {
    createInitialGame: createInitialRpsRoomGame,
    seedGame: seedRpsRoomGame,
    RoomComponent: RpsRoomGame,
  },
  ttt: {
    createInitialGame: createInitialTttRoomGame,
    seedGame: seedTttRoomGame,
    RoomComponent: TttRoomGame,
  },
  "penalty-kick": {
    createInitialGame: createInitialPenaltyRoomGame,
    seedGame: seedPenaltyRoomGame,
    RoomComponent: PenaltyRoomGame,
  },
  "basket-shot": {
    createInitialGame: createInitialBasketRoomGame,
    seedGame: seedBasketRoomGame,
    RoomComponent: BasketRoomGame,
  },
  guess: {
    createInitialGame: createInitialGuessRoomGame,
    seedGame: seedGuessRoomGame,
    RoomComponent: GuessRoomGame,
  },
  "higher-or-lower": {
    createInitialGame: createInitialHolRoomGame,
    seedGame: seedHolRoomGame,
    RoomComponent: HolRoomGame,
  },
  "connect-four": {
    createInitialGame: createInitialConnectRoomGame,
    seedGame: seedConnectRoomGame,
    RoomComponent: ConnectRoomGame,
  },
  "memory-match": {
    createInitialGame: createInitialMemoryRoomGame,
    seedGame: seedMemoryRoomGame,
    RoomComponent: MemoryRoomGame,
  },
  nim: {
    createInitialGame: createInitialNimRoomGame,
    seedGame: seedNimRoomGame,
    RoomComponent: NimRoomGame,
  },
  "word-guess": {
    createInitialGame: createInitialWordRoomGame,
    seedGame: seedWordRoomGame,
    RoomComponent: WordRoomGame,
  },
  blackjack: {
    createInitialGame: createInitialBlackjackRoomGame,
    seedGame: seedBlackjackRoomGame,
    RoomComponent: BlackjackRoomGame,
  },
  "prism-clash": {
    createInitialGame: createInitialPrismRoomGame,
    seedGame: seedPrismRoomGame,
    RoomComponent: PrismRoomGame,
  },
  parchis: {
    createInitialGame: createInitialParchisRoomGame,
    seedGame: seedParchisRoomGame,
    RoomComponent: ParchisRoomGame,
  },
  "goose-game": {
    createInitialGame: createInitialGooseRoomGame,
    seedGame: seedGooseRoomGame,
    RoomComponent: GooseRoomGame,
  },
  "tile-rummy": {
    createInitialGame: createInitialTileRummyRoomGame,
    seedGame: seedTileRummyRoomGame,
    RoomComponent: TileRummyRoomGame,
  },
  "reaction-time": {
    createInitialGame: createInitialReactionRoomGame,
    seedGame: seedReactionRoomGame,
    RoomComponent: ReactionRoomGame,
  },
  "fleet-command": {
    createInitialGame: createInitialFleetRoomGame,
    seedGame: seedFleetRoomGame,
    RoomComponent: FleetRoomGame,
  },
  "shadow-protocol": {
    createInitialGame: createInitialShadowRoomGame,
    seedGame: seedShadowRoomGame,
    RoomComponent: ShadowRoomGame,
  },
  "windline-archery": {
    createInitialGame: createInitialArcheryRoomGame,
    seedGame: seedArcheryRoomGame,
    RoomComponent: ArcheryRoomGame,
  },
  "beat-reactor": {
    createInitialGame: createInitialReactorRoomGame,
    seedGame: seedReactorRoomGame,
    RoomComponent: BeatReactorRoomGame,
  },
  "circuit-breaker": {
    createInitialGame: createInitialBreakerRoomGame,
    seedGame: seedBreakerRoomGame,
    RoomComponent: CircuitBreakerRoomGame,
  },
  "neon-drift": {
    createInitialGame: createInitialDriftRoomGame,
    seedGame: seedDriftRoomGame,
    RoomComponent: NeonDriftRoomGame,
  },
  "signal-breaker": {
    createInitialGame: createInitialSignalRoomGame,
    seedGame: seedSignalRoomGame,
    RoomComponent: SignalRoomGame,
  },
  "diceforge-arena": {
    createInitialGame: createInitialForgeRoomGame,
    seedGame: seedForgeRoomGame,
    RoomComponent: DiceforgeRoomGame,
  },
  "hex-dominion": {
    createInitialGame: createInitialHexRoomGame,
    seedGame: seedHexRoomGame,
    RoomComponent: HexRoomGame,
  },
  spellstorm: {
    createInitialGame: createInitialStormRoomGame,
    seedGame: seedStormRoomGame,
    RoomComponent: SpellstormRoomGame,
  },
};

export function getRoomGame(gameId: string): RoomGameModule | undefined {
  return ROOM_GAMES[gameId];
}
