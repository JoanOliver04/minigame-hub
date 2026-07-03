import { BasketRoomGame } from "./basket-shot/BasketRoomGame";
import { createInitialBasketRoomGame, seedBasketRoomGame } from "./basket-shot/room";
import { GuessRoomGame } from "./guess/GuessRoomGame";
import { createInitialGuessRoomGame, seedGuessRoomGame } from "./guess/room";
import { HolRoomGame } from "./higher-or-lower/HolRoomGame";
import { createInitialHolRoomGame, seedHolRoomGame } from "./higher-or-lower/room";
import { PenaltyRoomGame } from "./penalty-kick/PenaltyRoomGame";
import { createInitialPenaltyRoomGame, seedPenaltyRoomGame } from "./penalty-kick/room";
import { RpsRoomGame } from "./rps/RpsRoomGame";
import { createInitialRpsRoomGame, seedRpsRoomGame } from "./rps/room";
import { TttRoomGame } from "./ttt/TttRoomGame";
import { createInitialTttRoomGame, seedTttRoomGame } from "./ttt/room";
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
};

export function getRoomGame(gameId: string): RoomGameModule | undefined {
  return ROOM_GAMES[gameId];
}
