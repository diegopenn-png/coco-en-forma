/* Coco en Forma v152.0 — service worker sin caché de aplicación.
   Su única función es mantener la experiencia instalable y limpiar restos de versiones anteriores.
   Las páginas, JS y CSS siempre se solicitan a la red para impedir mezclas de versiones. */
const VERSION = "coco-en-forma-v152.0.0";
const CACHE_PREFIX = "coco-en-forma-";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* Fetch de red puro, sin Cache Storage ni fallback antiguo. Mantiene la PWA instalable
   y obliga a pedir al servidor el release actual; nunca mezcla index/JS/CSS de versiones distintas. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
