"use client";

import { createStandardDeck, shuffleDeck, type Card } from "@/lib/cards";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import {
  applyBlackjackRoundOutcome,
  calculateHandValue,
  createBlackjackMatch,
  dealerShouldHit,
  resolveRound,
} from "./logic";
import type { BlackjackConfig, BlackjackMatchState, RoundOutcome } from "./types";

export const BLACKJACK_ROOM_TARGET = 5;
const ROOM_CONFIG: BlackjackConfig = { difficulty: "medium", target: BLACKJACK_ROOM_TARGET };

export interface BlackjackSeatRound {
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  holeHidden: boolean;
  outcome: RoundOutcome | null;
  ready: boolean;
}

export interface BlackjackRoomGame {
  config: BlackjackConfig;
  seats: Record<string, BlackjackSeatRound>;
  matches: Record<string, BlackjackMatchState>;
  finished: boolean;
  winnerUid: string | null;
}

function dealSeat(): BlackjackSeatRound {
  const [p1, d1, p2, d2, ...deck] = shuffleDeck(createStandardDeck());
  return {
    deck,
    playerCards: [p1, p2],
    dealerCards: [d1, d2],
    holeHidden: true,
    outcome: null,
    ready: false,
  };
}

function freshGame(uids: string[]): BlackjackRoomGame {
  return {
    config: ROOM_CONFIG,
    seats: Object.fromEntries(uids.map((uid) => [uid, dealSeat()])),
    matches: Object.fromEntries(uids.map((uid) => [uid, createBlackjackMatch(ROOM_CONFIG)])),
    finished: false,
    winnerUid: null,
  };
}

export function createInitialBlackjackRoomGame(): BlackjackRoomGame {
  return freshGame([]);
}

export function seedBlackjackRoomGame(
  _hostGame: BlackjackRoomGame,
  hostUid: string,
  guestUid: string,
): BlackjackRoomGame {
  return freshGame([hostUid, guestUid]);
}

function playDealer(playerCards: Card[], dealerCards: Card[], deck: Card[]): {
  dealerCards: Card[];
  deck: Card[];
} {
  let currentDealer = [...dealerCards];
  let currentDeck = [...deck];
  while (dealerShouldHit(calculateHandValue(currentDealer)) && currentDeck.length > 0) {
    const [card, ...rest] = currentDeck;
    currentDealer = [...currentDealer, card];
    currentDeck = rest;
  }
  return { dealerCards: currentDealer, deck: currentDeck };
}

function finishSeatRound(game: BlackjackRoomGame, uid: string, seat: BlackjackSeatRound): BlackjackRoomGame {
  const outcome = resolveRound(seat.playerCards, seat.dealerCards);
  const match = applyBlackjackRoundOutcome(game.matches[uid], outcome);
  const seats = {
    ...game.seats,
    [uid]: { ...seat, outcome, holeHidden: false, ready: true },
  };
  const matches = { ...game.matches, [uid]: match };
  const allReady = Object.values(seats).length === 2 && Object.values(seats).every((item) => item.ready);
  if (!allReady) return { ...game, seats, matches };

  const uids = Object.keys(matches);
  const finished = Object.values(matches).some((item) => item.finished);
  if (finished) {
    const [a, b] = uids;
    const scoreA = matches[a].youScore;
    const scoreB = matches[b].youScore;
    const winnerUid = scoreA === scoreB ? null : scoreA > scoreB ? a : b;
    return { ...game, seats, matches, finished: true, winnerUid };
  }
  return {
    ...game,
    seats: Object.fromEntries(uids.map((seatUid) => [seatUid, dealSeat()])),
    matches,
  };
}

export async function hitBlackjack(code: string, uid: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    const game = room.game;
    const seat = game.seats[uid];
    if (room.status !== "playing" || game.finished || !seat || seat.ready || seat.outcome || seat.deck.length === 0) {
      return null;
    }
    const [card, ...deck] = seat.deck;
    const nextSeat = { ...seat, deck, playerCards: [...seat.playerCards, card] };
    const value = calculateHandValue(nextSeat.playerCards);
    const nextGame = value.isBust ? finishSeatRound(game, uid, { ...nextSeat, holeHidden: false }) : { ...game, seats: { ...game.seats, [uid]: nextSeat } };
    return { game: nextGame, status: nextGame.finished ? "finished" : room.status };
  });
}

export async function standBlackjack(code: string, uid: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    const game = room.game;
    const seat = game.seats[uid];
    if (room.status !== "playing" || game.finished || !seat || seat.ready || seat.outcome) return null;
    const dealer = playDealer(seat.playerCards, seat.dealerCards, seat.deck);
    const nextGame = finishSeatRound(game, uid, { ...seat, ...dealer, holeHidden: false });
    return { game: nextGame, status: nextGame.finished ? "finished" : room.status };
  });
}

export async function resetBlackjackRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
