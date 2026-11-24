import dynamic from "next/dynamic";
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
  "dots-boxes": {
    loadLogic: () => import("./duels/room").then(module => module.boxesRoom),
    RoomComponent: dynamic(() => import("./duels/RoomGames").then(module => module.BoxesRoomGame)),
  },
  mancala: {
    loadLogic: () => import("./duels/room").then(module => module.mancalaRoom),
    RoomComponent: dynamic(() => import("./duels/RoomGames").then(module => module.MancalaRoomGame)),
  },
  "mini-reversi": {
    loadLogic: () => import("./duels/room").then(module => module.reversiRoom),
    RoomComponent: dynamic(() => import("./duels/RoomGames").then(module => module.ReversiRoomGame)),
  },
  "dice-race": {
    loadLogic: () => import("./duels/room").then(module => module.diceRoom),
    RoomComponent: dynamic(() => import("./duels/RoomGames").then(module => module.DiceRoomGame)),
  },
  rps: {
    loadLogic: () => import("./rps/room").then((logic) => ({
      createInitialGame: logic.createInitialRpsRoomGame,
      seedGame: logic.seedRpsRoomGame,
    })),
    defaultSettings: { target: "3" },
    settings: [TARGET_SHORT_SETTING],
    RoomComponent: dynamic(() => import("./rps/RpsRoomGame").then((module) => module.RpsRoomGame)),
  },
  ttt: {
    loadLogic: () => import("./ttt/room").then((logic) => ({
      createInitialGame: logic.createInitialTttRoomGame,
      seedGame: logic.seedTttRoomGame,
    })),
    defaultSettings: { target: "3" },
    settings: [TARGET_BOARD_SETTING],
    RoomComponent: dynamic(() => import("./ttt/TttRoomGame").then((module) => module.TttRoomGame)),
  },
  "penalty-kick": {
    loadLogic: () => import("./penalty-kick/room").then((logic) => ({
      createInitialGame: logic.createInitialPenaltyRoomGame,
      seedGame: logic.seedPenaltyRoomGame,
    })),
    RoomComponent: dynamic(() => import("./penalty-kick/PenaltyRoomGame").then((module) => module.PenaltyRoomGame)),
  },
  "basket-shot": {
    loadLogic: () => import("./basket-shot/room").then((logic) => ({
      createInitialGame: logic.createInitialBasketRoomGame,
      seedGame: logic.seedBasketRoomGame,
    })),
    RoomComponent: dynamic(() => import("./basket-shot/BasketRoomGame").then((module) => module.BasketRoomGame)),
  },
  guess: {
    loadLogic: () => import("./guess/room").then((logic) => ({
      createInitialGame: logic.createInitialGuessRoomGame,
      seedGame: logic.seedGuessRoomGame,
    })),
    RoomComponent: dynamic(() => import("./guess/GuessRoomGame").then((module) => module.GuessRoomGame)),
  },
  "higher-or-lower": {
    loadLogic: () => import("./higher-or-lower/room").then((logic) => ({
      createInitialGame: logic.createInitialHolRoomGame,
      seedGame: logic.seedHolRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./higher-or-lower/HolRoomGame").then((module) => module.HolRoomGame)),
  },
  "connect-four": {
    loadLogic: () => import("./connect-four/room").then((logic) => ({
      createInitialGame: logic.createInitialConnectRoomGame,
      seedGame: logic.seedConnectRoomGame,
    })),
    defaultSettings: { target: "3" },
    settings: [TARGET_BOARD_SETTING],
    RoomComponent: dynamic(() => import("./connect-four/ConnectRoomGame").then((module) => module.ConnectRoomGame)),
  },
  "memory-match": {
    loadLogic: () => import("./memory-match/room").then((logic) => ({
      createInitialGame: logic.createInitialMemoryRoomGame,
      seedGame: logic.seedMemoryRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./memory-match/MemoryRoomGame").then((module) => module.MemoryRoomGame)),
  },
  nim: {
    loadLogic: () => import("./nim/room").then((logic) => ({
      createInitialGame: logic.createInitialNimRoomGame,
      seedGame: logic.seedNimRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./nim/NimRoomGame").then((module) => module.NimRoomGame)),
  },
  "word-guess": {
    loadLogic: () => import("./word-guess/room").then((logic) => ({
      createInitialGame: logic.createInitialWordRoomGame,
      seedGame: logic.seedWordRoomGame,
    })),
    RoomComponent: dynamic(() => import("./word-guess/WordRoomGame").then((module) => module.WordRoomGame)),
  },
  blackjack: {
    loadLogic: () => import("./blackjack/room").then((logic) => ({
      createInitialGame: logic.createInitialBlackjackRoomGame,
      seedGame: logic.seedBlackjackRoomGame,
    })),
    defaultSettings: { target: "5" },
    settings: [TARGET_SETTING],
    RoomComponent: dynamic(() => import("./blackjack/BlackjackRoomGame").then((module) => module.BlackjackRoomGame)),
  },
  "prism-clash": {
    loadLogic: () => import("./prism-clash/room").then((logic) => ({
      createInitialGame: logic.createInitialPrismRoomGame,
      seedGame: logic.seedPrismRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./prism-clash/PrismRoomGame").then((module) => module.PrismRoomGame)),
  },
  "property-baron": {
    loadLogic: () => import("./property-baron/room").then((logic) => ({
      createInitialGame: logic.createInitialPropertyBaronRoomGame,
      seedGame: logic.seedPropertyBaronRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./property-baron/PropertyBaronRoomGame").then((module) => module.PropertyBaronRoomGame)),
  },
  parchis: {
    loadLogic: () => import("./parchis/room").then((logic) => ({
      createInitialGame: logic.createInitialParchisRoomGame,
      seedGame: logic.seedParchisRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./parchis/ParchisRoomGame").then((module) => module.ParchisRoomGame)),
  },
  "goose-game": {
    loadLogic: () => import("./goose-game/room").then((logic) => ({
      createInitialGame: logic.createInitialGooseRoomGame,
      seedGame: logic.seedGooseRoomGame,
    })),
    RoomComponent: dynamic(() => import("./goose-game/GooseRoomGame").then((module) => module.GooseRoomGame)),
  },
  "tile-rummy": {
    loadLogic: () => import("./tile-rummy/room").then((logic) => ({
      createInitialGame: logic.createInitialTileRummyRoomGame,
      seedGame: logic.seedTileRummyRoomGame,
    })),
    RoomComponent: dynamic(() => import("./tile-rummy/TileRummyRoomGame").then((module) => module.TileRummyRoomGame)),
  },
  domino: {
    loadLogic: () => import("./domino/room").then((logic) => ({
      createInitialGame: logic.createInitialDominoRoomGame,
      seedGame: logic.seedDominoRoomGame,
    })),
    RoomComponent: dynamic(() => import("./domino/DominoRoomGame").then((module) => module.DominoRoomGame)),
  },
  "reaction-time": {
    loadLogic: () => import("./reaction-time/room").then((logic) => ({
      createInitialGame: logic.createInitialReactionRoomGame,
      seedGame: logic.seedReactionRoomGame,
    })),
    defaultSettings: { target: "3" },
    settings: [TARGET_SHORT_SETTING],
    RoomComponent: dynamic(() => import("./reaction-time/ReactionRoomGame").then((module) => module.ReactionRoomGame)),
  },
  "fleet-command": {
    loadLogic: () => import("./fleet-command/room").then((logic) => ({
      createInitialGame: logic.createInitialFleetRoomGame,
      seedGame: logic.seedFleetRoomGame,
    })),
    RoomComponent: dynamic(() => import("./fleet-command/FleetRoomGame").then((module) => module.FleetRoomGame)),
  },
  "shadow-protocol": {
    loadLogic: () => import("./shadow-protocol/room").then((logic) => ({
      createInitialGame: logic.createInitialShadowRoomGame,
      seedGame: logic.seedShadowRoomGame,
    })),
    RoomComponent: dynamic(() => import("./shadow-protocol/ShadowRoomGame").then((module) => module.ShadowRoomGame)),
  },
  "windline-archery": {
    loadLogic: () => import("./windline-archery/room").then((logic) => ({
      createInitialGame: logic.createInitialArcheryRoomGame,
      seedGame: logic.seedArcheryRoomGame,
    })),
    RoomComponent: dynamic(() => import("./windline-archery/ArcheryRoomGame").then((module) => module.ArcheryRoomGame)),
  },
  "beat-reactor": {
    loadLogic: () => import("./beat-reactor/room").then((logic) => ({
      createInitialGame: logic.createInitialReactorRoomGame,
      seedGame: logic.seedReactorRoomGame,
    })),
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
    RoomComponent: dynamic(() => import("./beat-reactor/BeatReactorRoomGame").then((module) => module.BeatReactorRoomGame)),
  },
  "circuit-breaker": {
    loadLogic: () => import("./circuit-breaker/room").then((logic) => ({
      createInitialGame: logic.createInitialBreakerRoomGame,
      seedGame: logic.seedBreakerRoomGame,
    })),
    RoomComponent: dynamic(() => import("./circuit-breaker/CircuitBreakerRoomGame").then((module) => module.CircuitBreakerRoomGame)),
  },
  "neon-drift": {
    loadLogic: () => import("./neon-drift/room").then((logic) => ({
      createInitialGame: logic.createInitialDriftRoomGame,
      seedGame: logic.seedDriftRoomGame,
    })),
    RoomComponent: dynamic(() => import("./neon-drift/NeonDriftRoomGame").then((module) => module.NeonDriftRoomGame)),
  },
  "signal-breaker": {
    loadLogic: () => import("./signal-breaker/room").then((logic) => ({
      createInitialGame: logic.createInitialSignalRoomGame,
      seedGame: logic.seedSignalRoomGame,
    })),
    RoomComponent: dynamic(() => import("./signal-breaker/SignalRoomGame").then((module) => module.SignalRoomGame)),
  },
  "diceforge-arena": {
    loadLogic: () => import("./diceforge-arena/room").then((logic) => ({
      createInitialGame: logic.createInitialForgeRoomGame,
      seedGame: logic.seedForgeRoomGame,
    })),
    RoomComponent: dynamic(() => import("./diceforge-arena/DiceforgeRoomGame").then((module) => module.DiceforgeRoomGame)),
  },
  "hex-dominion": {
    loadLogic: () => import("./hex-dominion/room").then((logic) => ({
      createInitialGame: logic.createInitialHexRoomGame,
      seedGame: logic.seedHexRoomGame,
    })),
    RoomComponent: dynamic(() => import("./hex-dominion/HexRoomGame").then((module) => module.HexRoomGame)),
  },
  spellstorm: {
    loadLogic: () => import("./spellstorm/room").then((logic) => ({
      createInitialGame: logic.createInitialStormRoomGame,
      seedGame: logic.seedStormRoomGame,
    })),
    RoomComponent: dynamic(() => import("./spellstorm/SpellstormRoomGame").then((module) => module.SpellstormRoomGame)),
  },
};

export function getRoomGame(gameId: string): RoomGameModule | undefined {
  return Object.prototype.hasOwnProperty.call(ROOM_GAMES, gameId) ? ROOM_GAMES[gameId] : undefined;
}
