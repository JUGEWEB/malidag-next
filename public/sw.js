
const CACHE_NAME = "malidag-offline-v3";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll([
        OFFLINE_URL,
        "/malidag.png",
      ]);

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("malidag-offline-") &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache API responses or Next.js data requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree")
  ) {
    return;
  }

  // Cache only static Next.js assets required by the offline page.
  // Prefer the network for Next.js static assets.
  // Use previously cached assets only when offline.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          const cached = await cache.match(request);

          if (cached) return cached;

          return Response.error();
        }
      })()
    );

    return;
  }


  // If navigation fails, show the cached offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match(OFFLINE_URL);

          return (
            offlinePage ||
            new Response("You're offline.", {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            })
          );
        }
      })()
    );
  }
});
