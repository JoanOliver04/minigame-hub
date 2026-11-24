"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { BoxesBoard } from "./Board";
import { boxes } from "./logic";

export function Game() { return <SoloDuel rules={boxes} Board={BoxesBoard} />; }
