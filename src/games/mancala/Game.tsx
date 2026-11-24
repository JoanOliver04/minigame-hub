"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { MancalaBoard } from "./Board";
import { mancala } from "./logic";

export function Game() { return <SoloDuel rules={mancala} Board={MancalaBoard} />; }
