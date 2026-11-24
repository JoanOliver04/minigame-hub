import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

// Only public, prerendered solo pages belong in the offline edition.
const app = ".next/server/app";
const routes = new Map([["/", "index"], ["/daily", "daily"], ["/favorites", "favorites"], ["/scores", "scores"]]);
const games = (await readdir(app + "/games")).filter(name => name.endsWith(".html")).sort();
if (!games.length) throw new Error("Missing prerendered games");
for (const file of games) {
  const slug = "games/" + file.slice(0, -5);
  routes.set("/" + slug, slug);
}

const documents = {};
const manifest = JSON.parse(await readFile(app + "/manifest.webmanifest.body", "utf8"));
const assets = new Set(["/hub-mark.webp", "/offline.html", ...manifest.icons.map(icon => icon.src)]);
for (const [route, file] of routes) {
  const html = await readFile(app + "/" + file + ".html", "utf8");
  // A device can stay connected to Wi-Fi while its internet connection is down.
  documents[route] = html.replace("<html ", '<html data-offline-edition="" ');
  // Includes preload links to the selected game's lazy chunks.
  for (const tag of html.matchAll(/<(?:script|link)\s[^>]*>/g)) {
    const path = tag[0].match(/\s(?:src|href)="(\/[^"]*)"/)?.[1];
    if (path && !path.startsWith("//")) assets.add(path.replaceAll("&amp;", "&"));
  }
}
const files = [...assets].sort();
const hash = createHash("sha256").update(JSON.stringify([documents, files]));
for (const path of files.filter(path => !path.startsWith("/_next/static/"))) {
  const name = path.split("?")[0];
  const file = name === "/manifest.webmanifest" || name === "/favicon.ico" ? app + name + ".body" : "public" + name;
  hash.update(await readFile(file));
}
const version = hash.digest("hex").slice(0, 20);
await writeFile("public/offline-arcade.json", JSON.stringify({ version, documents, assets: files }));
await writeFile("public/offline-version.js", "self.arcadeVersion = " + JSON.stringify(version) + ";\n");
console.log(`Offline arcade: ${games.length} games, ${files.length} shared assets, version ${version}`);
