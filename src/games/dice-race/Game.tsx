"use client";
import { SoloDuel } from "../duels/SoloDuel";
import { DiceBoard } from "./Board";
import { diceRace } from "./logic";

export function Game() { return <SoloDuel rules={diceRace} Board={DiceBoard} />; }
