const CACHE_VERSION = "coco-en-forma-v143.0.0";
const CACHE_PREFIX = "coco-en-forma-";
const SCOPE_URL = new URL("./", self.registration.scope);
const INDEX_URL = new URL("index.html", SCOPE_URL).href;

const CORE_ASSET_PATHS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./manifest.json",
  "./coco-v142-content-extension.js",
  "./coco-v142-runtime.js",
  "./coco-v142-unified.js",
  "./coco-v2-official-icon-source.png",
  "./icon-192.png",
  "./icon-512.png",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./shortcut-icon.png",
  "./favicon.png",
  "./share/diferencias.png",
  "./juego/diferencias/index.html"
];

const SCENE_ASSET_PATHS = [
  "./scenes/scene-workshop-v141.webp",
  "./scenes/scene-invention-lab-v141.webp",
  "./scenes/scene-observatory-v141.webp",
  "./scenes/scene-tech-library-v141.webp",
  "./scenes/scene-electric-garage-v141.webp",
  "./scenes/scene-robotics-studio-v141.webp",
  "./scenes/scene-ocean-lab-v141.webp",
  "./scenes/scene-botanical-greenhouse-v141.webp",
  "./scenes/scene-music-studio-v141.webp",
  "./scenes/scene-space-station-v141.webp"
];

function absolute(assetPath) {
  return new URL(assetPath, SCOPE_URL).href;
}

async function fetchAndCache(cache, assetPath) {
  const assetUrl = absolute(assetPath);
  const response = await fetch(new Request(assetUrl, { cache: "reload" }));
  if (!response.ok) throw new Error(`Precache ${response.status}: ${assetPath}`);
  await cache.put(assetUrl, response.clone());
  return assetUrl;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(CORE_ASSET_PATHS.map((assetPath) => fetchAndCache(cache, assetPath)));
    /* Una escena opcional no debe impedir que se instale la actualización completa. */
    await Promise.allSettled(SCENE_ASSET_PATHS.map((assetPath) => fetchAndCache(cache, assetPath)));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
      .map((key) => caches.delete(key))))
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
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response.clone())));
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || caches.match(INDEX_URL))));
    return;
  }

  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((cached) => {
    const network = fetch(event.request).then((response) => {
      if (response.ok) event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response.clone())));
      return response;
    }).catch(() => cached || new Response("Recurso no disponible sin conexión", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    }));
    return cached || network;
  }));
});
