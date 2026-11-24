import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mini-Game Hub",
    short_name: "Mini-Game Hub",
    description: "Mini-games, daily puzzles and personal scores.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f1220",
    theme_color: "#0f1220",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
