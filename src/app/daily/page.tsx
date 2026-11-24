import type { Metadata } from "next";
import { DailyGame } from "@/games/sliding-puzzle/DailyGame";

export const metadata: Metadata = { title: "Daily puzzle | Mini-Game Hub" };

export default function DailyPage() {
  return <DailyGame />;
}
