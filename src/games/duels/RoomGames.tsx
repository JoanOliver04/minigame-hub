"use client";

import { useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { leaveRoom } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { HowToPlay } from "@/components/ui/HowToPlay";
import type { RoomViewProps } from "../roomTypes";
import { ReversiBoard } from "../mini-reversi/Board";
import { DiceBoard } from "../dice-race/Board";
import type { ReversiState } from "../mini-reversi/logic";
import type { DiceMove, DiceState } from "../dice-race/logic";
import { BoxesBoard } from "../dots-boxes/Board";
import { MancalaBoard } from "../mancala/Board";
import type { BoxesState } from "../dots-boxes/logic";
import type { MancalaState } from "../mancala/logic";
import { IceBoard } from "../ice-floe/Board";
import { LootBoard } from "../pirate-loot/Board";
import type { IceState } from "../ice-floe/logic";
import type { LootState } from "../pirate-loot/logic";
import { CurlingBoard } from "../pocket-curling/Board";
import { FifteenBoard } from "../exact-fifteen/Board";
import type { CurlingState, Shot } from "../pocket-curling/logic";
import type { FifteenState } from "../exact-fifteen/logic";
import { boxesRoom, curlingRoom, diceRoom, fifteenRoom, iceRoom, lootRoom, mancalaRoom, reversiRoom, roomVersion, type RoomMatch } from "./room";
import { duelCopy } from "./copy";
import type { BoardProps, DuelId, DuelState } from "./types";

type RoomActions<A> = {
  move(code: string, uid: string, version: ReturnType<typeof roomVersion>, action: A): Promise<void>;
  rematch: typeof diceRoom.rematch;
};

function RoomDuel<S extends DuelState, A>({ code, uid, room: snapshot, id, actions, Board }: RoomViewProps & {
  id: DuelId; actions: RoomActions<A>; Board: ComponentType<BoardProps<S, A>>;
}) {
  const { t, locale } = useLocale();
  const copy = duelCopy[locale];
  const room = snapshot as RoomDoc<RoomMatch<S>>;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  async function send(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFailed(false);
    try { await task(); } catch { setFailed(true); }
    finally { lock.current = false; setBusy(false); }
  }
  if (room.status === "abandoned") return <section className="card screen">
    <p>{t.rooms.roomGone}</p><Link href="/rooms" className="btn">{t.rooms.backToRooms}</Link>
  </section>;
  const { state, seats, turn } = room.game;
  const name = (seat: number) => seats[seat] === uid ? t.common.you : room.players[seats[seat]]?.name ?? "";
  const version = roomVersion(room);
  const myTurn = turn === uid && !busy && room.status === "playing";
  const won = state.winner !== null && state.winner !== "tie" && seats[state.winner] === uid;
  const voted = Boolean(room.rematchVotes[uid]);
  const waitingForVote = voted && seats.some(id => !room.rematchVotes[id]);
  return <section className="card screen duel-screen">
    <HowToPlay title={t.gamesMeta[id].name}>{copy.rules[id]}</HowToPlay>
    {room.status === "waiting" ? <>
      <h2>{t.rooms.waitingTitle}</h2><p>{t.rooms.shareCode(code)}. {t.rooms.waitingHint}</p>
    </> : <>
      <h2 className="duel-status" role="status">{state.winner === null
        ? turn === uid ? t.rooms.turnYours : t.rooms.turnOpponent(name(state.active))
        : state.winner === "tie" ? copy.tie : won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(name(state.winner))}</h2>
      <Board state={state} names={[name(0), name(1)]} viewer={seats[1] === uid ? 1 : 0} onPlay={myTurn ? action =>
        void send(() => actions.move(code, uid, version, action)) : undefined} />
    </>}
    <div className="btn-row">
      {room.status === "finished" && <button type="button" className="btn primary" disabled={busy || waitingForVote}
        onClick={() => void send(() => actions.rematch(code, uid, version))}>{waitingForVote ? t.rooms.rematchWaiting : t.rooms.rematchButton}</button>}
      <button className="btn" type="button" disabled={busy} onClick={() => void send(() => leaveRoom(code))}>{t.rooms.leaveButton}</button>
    </div>
    {failed && <p role="alert">{t.rooms.errorGeneric}</p>}
  </section>;
}

export function ReversiRoomGame(props: RoomViewProps) {
  return <RoomDuel<ReversiState, number> {...props} id="mini-reversi" actions={reversiRoom} Board={ReversiBoard} />;
}
export function CurlingRoomGame(props: RoomViewProps) {
  return <RoomDuel<CurlingState, Shot> {...props} id="pocket-curling" actions={curlingRoom} Board={CurlingBoard} />;
}
export function FifteenRoomGame(props: RoomViewProps) {
  return <RoomDuel<FifteenState, number> {...props} id="exact-fifteen" actions={fifteenRoom} Board={FifteenBoard} />;
}
export function IceRoomGame(props: RoomViewProps) {
  return <RoomDuel<IceState, number> {...props} id="ice-floe" actions={iceRoom} Board={IceBoard} />;
}
export function LootRoomGame(props: RoomViewProps) {
  return <RoomDuel<LootState, number> {...props} id="pirate-loot" actions={lootRoom} Board={LootBoard} />;
}
export function BoxesRoomGame(props: RoomViewProps) {
  return <RoomDuel<BoxesState, number> {...props} id="dots-boxes" actions={boxesRoom} Board={BoxesBoard} />;
}
export function MancalaRoomGame(props: RoomViewProps) {
  return <RoomDuel<MancalaState, number> {...props} id="mancala" actions={mancalaRoom} Board={MancalaBoard} />;
}
export function DiceRoomGame(props: RoomViewProps) {
  return <RoomDuel<DiceState, DiceMove> {...props} id="dice-race" actions={diceRoom} Board={DiceBoard} />;
}
