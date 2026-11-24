import type { Metadata } from "next";
import { HubScreen } from "@/components/hub/HubScreen";

export const metadata: Metadata = { title: "Favorites | Mini-Game Hub" };

export default function FavoritesPage() {
  return <HubScreen view="favorites" />;
}
