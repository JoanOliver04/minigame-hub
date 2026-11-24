"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { SlidingPuzzleGame } from "./SlidingPuzzleGame";
import { useLocalDay } from "./useDailyChallenge";

export function DailyGame() {
  const day = useLocalDay();
  const { t } = useLocale();
  return day ? <DailyMatch day={day} /> : <h1>{t.daily.title}</h1>;
}

function DailyMatch({ day }: { day: string }) {
  // A puzzle already open at midnight keeps its board and record date.
  const [matchDay] = useState(day);
  return <SlidingPuzzleGame dailyDay={matchDay} />;
}
