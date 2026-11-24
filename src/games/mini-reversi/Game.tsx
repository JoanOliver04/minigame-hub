"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { ReversiBoard } from "./Board";
import { reversi } from "./logic";

export function Game() { return <SoloDuel rules={reversi} Board={ReversiBoard} />; }
