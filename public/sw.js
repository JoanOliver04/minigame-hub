importScripts("/offline-version.js");

const prefix = "mini-game-hub-offline-";
const cacheName = prefix + self.arcadeVersion;

async function installArcade() {
  const response = await fetch("/offline-arcade.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Offline edition unavailable");
  const { version, documents, assets } = await response.json();
  if (version !== self.arcadeVersion) throw new Error("Offline edition changed during installation");

  const cache = await caches.open(cacheName);
  await cache.addAll(assets);
  for (const [path, html] of Object.entries(documents)) {
    await cache.put(path, new Response(html, { headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    } }));
  }
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
