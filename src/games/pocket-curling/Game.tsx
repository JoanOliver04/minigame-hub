"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { CurlingBoard } from "./Board";
import { curling } from "./logic";

export function Game() { return <SoloDuel rules={curling} Board={CurlingBoard} />; }
