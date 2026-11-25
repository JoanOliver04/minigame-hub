"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { IceBoard } from "./Board";
import { ice } from "./logic";

export function Game() { return <SoloDuel rules={ice} Board={IceBoard} />; }
