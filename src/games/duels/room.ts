import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { diceRace } from "../dice-race/logic";
import { reversi } from "../mini-reversi/logic";
import type { DuelRules, DuelState } from "./types";

export interface RoomMatch<S> { state: S; seats: string[]; match: number; turn: string | null; }
type Version = { revision: number; match: number; moves: number };

export function roomVersion<S extends DuelState>(room: RoomDoc<RoomMatch<S>>): Version {
  return { revision: room.gameRevision ?? 0, match: room.game.match, moves: room.game.state.moves };
}

function matches<S extends DuelState>(room: RoomDoc<RoomMatch<S>>, expected: Version) {
  const current = roomVersion(room);
  return current.revision === expected.revision && current.match === expected.match && current.moves === expected.moves;
}

function roomMode<S extends DuelState, A>(rules: DuelRules<S, A>) {
  function start(seats: string[], match: number): RoomMatch<S> {
    return { state: rules.start(), seats, match, turn: seats[0] ?? null };
  }
  return {
    createInitialGame: () => start([], 0),
    seedGame: (_initial: unknown, host: string, guest: string) => start([host, guest], 1),
    move(code: string, uid: string, expected: Version, action: A) {
      return runRoomUpdate<RoomMatch<S>>(code, rules.id, room => {
        if (room.status !== "playing" || room.game.turn !== uid || !matches(room, expected)) return null;
        const state = rules.play(room.game.state, action);
        if (state === room.game.state) return null;
        const finished = state.winner !== null;
        return { status: finished ? "finished" : "playing",
          game: { ...room.game, state, turn: finished ? null : room.game.seats[state.active] } };
      });
    },
    async rematch(code: string, uid: string, expected: Version) {
      await runRoomUpdate<RoomMatch<S>>(code, rules.id, room => {
        if (room.status !== "finished" || !matches(room, expected) || !room.players[uid] || room.rematchVotes[uid]) return null;
        return { rematchVotes: { ...room.rematchVotes, [uid]: true } };
      });
      await runRoomUpdate<RoomMatch<S>>(code, rules.id, room => {
        if (room.status !== "finished" || !matches(room, expected) || !room.game.seats.every(id => room.rematchVotes[id])) return null;
        return { status: "playing", game: start([...room.game.seats].reverse(), room.game.match + 1), rematchVotes: {} };
      });
    },
  };
}

export const reversiRoom = roomMode(reversi);
export const diceRoom = roomMode(diceRace);
