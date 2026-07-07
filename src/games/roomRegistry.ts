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
import { PropertyBaronRoomGame } from "./property-baron/PropertyBaronRoomGame";
import { createInitialPropertyBaronRoomGame, seedPropertyBaronRoomGame } from "./property-baron/room";
import { RpsRoomGame } from "./rps/RpsRoomGame";
import { createInitialRpsRoomGame, seedRpsRoomGame } from "./rps/room";
import { TttRoomGame } from "./ttt/TttRoomGame";
import { createInitialTttRoomGame, seedTttRoomGame } from "./ttt/room";
import { TileRummyRoomGame } from "./tile-rummy/TileRummyRoomGame";
import { createInitialTileRummyRoomGame, seedTileRummyRoomGame } from "./tile-rummy/room";
import { WordRoomGame } from "./word-guess/WordRoomGame";
import { createInitialWordRoomGame, seedWordRoomGame } from "./word-guess/room";
import type { RoomGameModule, RoomSettingDefinition } from "./roomTypes";

const TARGET_SETTING: RoomSettingDefinition = {
  key: "target",
  label: "Match length",
  options: [
    { value: "3", label: "First to 3" },
    { value: "5", label: "First to 5" },
    { value: "10", label: "First to 10" },
  ],
};

const TARGET_SHORT_SETTING: RoomSettingDefinition = {
  key: "target",
  label: "Match length",
  options: [
    { value: "3", label: "First to 3" },
    { value: "5", label: "First to 5" },
  ],
};

const TARGET_BOARD_SETTING: RoomSettingDefinition = {
  key: "target",
  label: "Match length",
  options: [
    { value: "1", label: "Single round" },
    { value: "3", label: "First to 3" },
    { value: "5", label: "First to 5" },
  ],
};

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
    defaultSettings: { target: "3" },
    settings: [TARGET_SHORT_SETTING],
    RoomComponent: RpsRoomGame,
  },
  ttt: {
    createInitialGame: createInitialTttRoomGame,
    seedGame: seedTttRoomGame,
    defaultSettings: { target: "3" },
    settings: [TARGET_BOARD_SETTING],
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
    defaultSettings: { target: "5", aceHigh: "true" },
    settings: [
      TARGET_SETTING,
      {
        key: "aceHigh",
        label: "Ace rule",
        options: [
          { value: "true", label: "Ace high" },
          { value: "false", label: "Ace low" },
        ],
      },
    ],
    RoomComponent: HolRoomGame,
  },
  "connect-four": {
    createInitialGame: createInitialConnectRoomGame,
    seedGame: seedConnectRoomGame,
    defaultSettings: { target: "3" },
    settings: [TARGET_BOARD_SETTING],
    RoomComponent: ConnectRoomGame,
  },
  "memory-match": {
    createInitialGame: createInitialMemoryRoomGame,
    seedGame: seedMemoryRoomGame,
    defaultSettings: { size: "4" },
    settings: [
      {
        key: "size",
        label: "Board size",
        options: [
          { value: "4", label: "4 × 4" },
          { value: "6", label: "6 × 6" },
        ],
      },
    ],
    RoomComponent: MemoryRoomGame,
  },
  nim: {
    createInitialGame: createInitialNimRoomGame,
    seedGame: seedNimRoomGame,
    defaultSettings: { rule: "normal" },
    settings: [
      {
        key: "rule",
        label: "Rules",
        options: [
          { value: "normal", label: "Normal" },
          { value: "misere", label: "Misère" },
        ],
      },
    ],
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
    defaultSettings: { target: "5" },
    settings: [TARGET_SETTING],
    RoomComponent: BlackjackRoomGame,
  },
  "prism-clash": {
    createInitialGame: createInitialPrismRoomGame,
    seedGame: seedPrismRoomGame,
    defaultSettings: { target: "2" },
    settings: [
      {
        key: "target",
        label: "Match length",
        options: [
          { value: "1", label: "One win" },
          { value: "2", label: "Best of 3" },
        ],
      },
    ],
    RoomComponent: PrismRoomGame,
  },
  "property-baron": {
    createInitialGame: createInitialPropertyBaronRoomGame,
    seedGame: seedPropertyBaronRoomGame,
    defaultSettings: { maxRounds: "20" },
    settings: [
      {
        key: "maxRounds",
        label: "Game length",
        options: [
          { value: "12", label: "Short · 12 rounds" },
          { value: "20", label: "Standard · 20 rounds" },
        ],
      },
    ],
    RoomComponent: PropertyBaronRoomGame,
  },
  parchis: {
    createInitialGame: createInitialParchisRoomGame,
    seedGame: seedParchisRoomGame,
    defaultSettings: { pieceCount: "2" },
    settings: [
      {
        key: "pieceCount",
        label: "Pieces",
        options: [
          { value: "2", label: "Quick · 2 pieces" },
          { value: "4", label: "Classic · 4 pieces" },
        ],
      },
    ],
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
    defaultSettings: { target: "3" },
    settings: [TARGET_SHORT_SETTING],
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
    defaultSettings: { bpm: "110", bars: "12", density: "normal" },
    settings: [
      {
        key: "bpm",
        label: "BPM",
        options: [
          { value: "90", label: "90" },
          { value: "110", label: "110" },
          { value: "130", label: "130" },
        ],
      },
      {
        key: "bars",
        label: "Length",
        options: [
          { value: "8", label: "8 bars" },
          { value: "12", label: "12 bars" },
          { value: "16", label: "16 bars" },
        ],
      },
      {
        key: "density",
        label: "Density",
        options: [
          { value: "light", label: "Light" },
          { value: "normal", label: "Normal" },
          { value: "dense", label: "Dense" },
        ],
      },
    ],
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
