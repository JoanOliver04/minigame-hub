importScripts("/offline-version.js");

const prefix = "mini-game-hub-offline-";
const cacheName = prefix + self.arcadeEdition.version;

async function cachePage(cache, path, assets) {
  const response = await fetch(path, { credentials: "omit", cache: "reload", redirect: "error" });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("text/html")) throw new Error("Offline page unavailable: " + path);
  const html = await response.text();
  for (const tag of html.matchAll(/<(?:script|link)\s[^>]*>/g)) {
    const file = tag[0].match(/\s(?:src|href)="(\/[^"]*)"/)?.[1];
    if (file && !file.startsWith("//")) assets.add(file.replaceAll("&amp;", "&"));
  }
  // The browser has decoded the body. Keep document policies, without compressed transfer headers or RSC Vary.
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  for (const name of ["Content-Security-Policy", "Permissions-Policy", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  await cache.put(path, new Response(html.replace("<html ", '<html data-offline-edition="" '), { headers }));
}

async function installArcade() {
  const cache = await caches.open(cacheName);
  const assets = new Set(["/offline.html", "/hub-mark.webp", "/app-192.png", "/app-512.png", "/app-maskable.png"]);
  const routes = self.arcadeEdition.routes;
  for (let i = 0; i < routes.length; i += 4) {
    await Promise.all(routes.slice(i, i + 4).map(path => cachePage(cache, path, assets)));
  }
  await cache.addAll([...assets]);
}

self.addEventListener("install", event => {
  // The old worker keeps serving its complete edition until every new file is ready.
  event.waitUntil((async () => {
    const existing = await caches.has(cacheName);
    try {
      await installArcade();
      // The original worker only served a retry page. Upgrade it in place without reloading an open game.
      if (await caches.has(prefix + "v1")) await self.skipWaiting();
    } catch (error) {
      if (!existing) await caches.delete(cacheName);
      throw error;
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function navigate(request, pathname) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(cacheName);
    const path = pathname.replace(/\/$/, "") || "/";
    return await cache.match(path) ?? await cache.match("/offline.html") ?? Response.error();
  }
}

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" || request.headers.get("RSC") === "1") {
    // An HTML fallback also tells the Next router to perform a document navigation.
    event.respondWith(navigate(request, url.pathname));
  } else if (url.pathname.startsWith("/_next/static/") ||
      ["/hub-mark.webp", "/manifest.webmanifest", "/favicon.ico", "/app-180.png", "/app-192.png", "/app-512.png", "/app-maskable.png"].includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(request, { ignoreVary: true, ignoreSearch: url.pathname.startsWith("/_next/static/") }) ?? fetch(request);
    })());
  }
});
