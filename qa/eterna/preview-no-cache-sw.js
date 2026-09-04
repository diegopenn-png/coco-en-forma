/* Isolated Eterna preview only: remove stale preview caches and unregister. */
self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (key) { return caches.delete(key); }));
    await self.registration.unregister();
    var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map(function (client) {
      return client.navigate(client.url).catch(function () {});
    }));
  })());
});

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
