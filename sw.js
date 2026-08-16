const CACHE_VERSION = "coco-en-forma-v151.0.0-r1";
const CACHE_PREFIX = "coco-en-forma-";
const SCOPE_URL = new URL("./", self.registration.scope);
const INDEX_URL = new URL("index.html", SCOPE_URL).href;

const CORE_ASSET_PATHS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./manifest.json",
  "./supabase-js-2.112.3.min.js",
  "./coco-v142-content-extension.js",
  "./coco-v142-runtime.js",
  "./coco-v142-unified.js",
  "./coco-v144-content.js",
  "./coco-v144-core.js",
  "./coco-v151-padel.js",
  "./coco-v151-runner.js",
  "./coco-v151-differences.js",
  "./coco-v144-professional.css",
  "./coco-v147-refinements.css",
  "./coco-v149-refinements.css",
  "./coco-v151-refinements.css",
  "./coco-v2-official-icon-source.png",
  "./coco-v2-runner-v144.png",
  "./icon-192.png",
  "./icon-512.png",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./shortcut-icon.png",
  "./favicon.png",
  "./share/coco-en-forma-v149.png"
];

const SCENE_ASSET_PATHS = [
  "./scenes/scene-workshop-v151-left.webp",
  "./scenes/scene-workshop-v151-right-1.webp",
  "./scenes/scene-workshop-v151-right-2.webp",
  "./scenes/scene-workshop-v151-right-3.webp",
  "./scenes/scene-invention-lab-v151-left.webp",
  "./scenes/scene-invention-lab-v151-right-1.webp",
  "./scenes/scene-invention-lab-v151-right-2.webp",
  "./scenes/scene-invention-lab-v151-right-3.webp",
  "./scenes/scene-observatory-v151-left.webp",
  "./scenes/scene-observatory-v151-right-1.webp",
  "./scenes/scene-observatory-v151-right-2.webp",
  "./scenes/scene-observatory-v151-right-3.webp",
  "./scenes/scene-tech-library-v151-left.webp",
  "./scenes/scene-tech-library-v151-right-1.webp",
  "./scenes/scene-tech-library-v151-right-2.webp",
  "./scenes/scene-tech-library-v151-right-3.webp",
  "./scenes/scene-electric-garage-v151-left.webp",
  "./scenes/scene-electric-garage-v151-right-1.webp",
  "./scenes/scene-electric-garage-v151-right-2.webp",
  "./scenes/scene-electric-garage-v151-right-3.webp",
  "./scenes/scene-robotics-studio-v151-left.webp",
  "./scenes/scene-robotics-studio-v151-right-1.webp",
  "./scenes/scene-robotics-studio-v151-right-2.webp",
  "./scenes/scene-robotics-studio-v151-right-3.webp",
  "./scenes/scene-ocean-lab-v151-left.webp",
  "./scenes/scene-ocean-lab-v151-right-1.webp",
  "./scenes/scene-ocean-lab-v151-right-2.webp",
  "./scenes/scene-ocean-lab-v151-right-3.webp",
  "./scenes/scene-botanical-greenhouse-v151-left.webp",
  "./scenes/scene-botanical-greenhouse-v151-right-1.webp",
  "./scenes/scene-botanical-greenhouse-v151-right-2.webp",
  "./scenes/scene-botanical-greenhouse-v151-right-3.webp",
  "./scenes/scene-music-studio-v151-left.webp",
  "./scenes/scene-music-studio-v151-right-1.webp",
  "./scenes/scene-music-studio-v151-right-2.webp",
  "./scenes/scene-music-studio-v151-right-3.webp",
  "./scenes/scene-space-station-v151-left.webp",
  "./scenes/scene-space-station-v151-right-1.webp",
  "./scenes/scene-space-station-v151-right-2.webp",
  "./scenes/scene-space-station-v151-right-3.webp"
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
