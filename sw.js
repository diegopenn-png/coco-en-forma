const CACHE_VERSION = "coco-en-forma-v138.0.0";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/share/diferencias.png",
  "/juego/diferencias/index.html",
  "/scenes/scene-workshop.png",
  "/scenes/scene-invention-lab.png",
  "/scenes/scene-observatory.png",
  "/scenes/scene-tech-library.png",
  "/scenes/scene-electric-garage.png",
  "/scenes/scene-robotics-studio.png",
  "/scenes/scene-ocean-lab.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            const cacheKey = requestUrl.pathname === "/" ? "/index.html" : event.request;
            caches.open(CACHE_VERSION).then((cache) => cache.put(cacheKey, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
