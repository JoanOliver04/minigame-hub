"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { FifteenBoard } from "./Board";
import { fifteen } from "./logic";

export function Game() { return <SoloDuel rules={fifteen} Board={FifteenBoard} />; }
