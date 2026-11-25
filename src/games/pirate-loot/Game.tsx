"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { LootBoard } from "./Board";
import { loot } from "./logic";

export function Game() { return <SoloDuel rules={loot} Board={LootBoard} />; }
