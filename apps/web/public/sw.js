const CACHE_NAME = "filo-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Instalar: cachear assets estáticos
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip waiting para activar inmediatamente
  (self as any).skipWaiting();
});

// Activar: limpiar caches viejas
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  (self as any).clients.claim();
});

// Fetch: cache-first para estáticos, network-first para API
self.addEventListener("fetch", (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear API calls
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Cache-first para estáticos
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          // Cachear imágenes, CSS, JS
          if (
            request.destination === "image" ||
            request.destination === "style" ||
            request.destination === "script" ||
            request.destination === "font"
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
  }
});
