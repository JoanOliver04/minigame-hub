"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { dailyBoard } from "@/games/sliding-puzzle/daily";
import { useDailyStatus, useLocalDay } from "@/games/sliding-puzzle/useDailyChallenge";

export function DailyFeature() {
  const { t, locale } = useLocale();
  const day = useLocalDay();
  const { best, run } = useDailyStatus(day);
  const tiles = run?.game.tiles ?? (day ? dailyBoard(day).tiles : Array<number>(9).fill(0));
  return (
    <aside className="daily-feature" aria-labelledby="daily-feature-title">
      <div className="daily-copy">
        {day && <time dateTime={day}>{new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(new Date(day + "T12:00:00"))}</time>}
        <h2 id="daily-feature-title">{t.daily.title}</h2>
        <p>{best ? t.daily.best + " · " + t.slidingPuzzle.result(best.moves, best.seconds) : t.daily.goal}</p>
        <Link href="/daily" className="daily-action" prefetch={false}>
          {run ? t.daily.resume : best ? t.daily.retry : t.daily.play} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="daily-art" aria-hidden="true">
        <div className="daily-mini-board">
          {tiles.map((tile, index) => <span key={index} className={tile ? undefined : "gap"}>{tile || ""}</span>)}
        </div>
      </div>
    </aside>
  );
}
