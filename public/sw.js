/* World Cup 2026 Match Center — service worker
 *
 * Strategy:
 *  - precache the core shell routes on install
 *  - network-first for pages and the schedule API (fresh data when online,
 *    cached schedule offline)
 *  - cache-first for static assets, fonts and flag images
 *
 * Push notification handlers are wired and ready: point a push service at
 * this worker and send { title, body, url } payloads for match reminders,
 * result updates, favorite-team alerts and knockout qualification news.
 */

const VERSION = "wc26-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;

const PRECACHE_URLS = [
  "/",
  "/matches",
  "/groups",
  "/rounds",
  "/calendar",
  "/ar",
  "/ar/matches",
  "/api/matches",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Flag images and map tiles: cache-first with background refresh
  if (
    url.hostname === "flagcdn.com" ||
    url.hostname.endsWith("basemaps.cartocdn.com")
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Next static assets: immutable, cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // ICS downloads: network only
  if (url.pathname.startsWith("/api/calendar/")) return;

  // Pages and APIs: network-first with cache fallback
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.open(SHELL_CACHE);
    const shellMatch = await shell.match(request);
    if (shellMatch) return shellMatch;
    // last resort: the cached home page
    return (await shell.match("/")) ?? Response.error();
  }
}

/* ── Push notifications (structure ready) ──────────────────────────────── */

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "World Cup 2026", body: event.data.text() };
  }
  const { title = "World Cup 2026", body = "", url = "/" } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
