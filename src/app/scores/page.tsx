import type { Metadata } from "next";
import { HubScreen } from "@/components/hub/HubScreen";

export const metadata: Metadata = { title: "My scoreboard | Mini-Game Hub" };

export default function ScoresPage() {
  return <HubScreen view="scores" />;
}
