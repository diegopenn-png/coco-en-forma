const CACHE_VERSION = "coco-en-forma-v140.0.0";
const SCOPE_URL = new URL("./", self.registration.scope);
const INDEX_URL = new URL("index.html", SCOPE_URL).href;
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./apple-touch-icon.png",
  "./favicon.svg",
  "./share/diferencias.png",
  "./juego/diferencias/index.html",
  "./scenes/scene-workshop-v139.png",
  "./scenes/scene-invention-lab-v139.png",
  "./scenes/scene-observatory-v139.png",
  "./scenes/scene-tech-library-v139.png",
  "./scenes/scene-electric-garage-v139.png",
  "./scenes/scene-robotics-studio-v139.png",
  "./scenes/scene-ocean-lab-v139.png"
].map((path) => new URL(path, SCOPE_URL).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(INDEX_URL))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => {
    const network = fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});
