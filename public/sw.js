const offlineCache = "mini-game-hub-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(offlineCache).then((cache) => cache.add("/offline.html")));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("mini-game-hub-offline-") && name !== offlineCache)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html", { cacheName: offlineCache })) ?? Response.error()));
});
