const CACHE_VERSION = "coco-en-forma-v155.0.0-r1";
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
  "./coco-v152-padel.js",
  "./coco-v153-fixes.js",
  "./coco-v155-identity.js",
  "./coco-v144-professional.css",
  "./coco-v147-refinements.css",
  "./coco-v149-refinements.css",
  "./coco-v152-refinements.css",
  "./coco-v153-release.css",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./shortcut-icon.png",
  "./favicon.png",
  "./juego/numeros/index.html",
  "./share/numeros.jpg",
  "./juego/calculo/index.html",
  "./share/calculo.jpg",
  "./juego/palabras/index.html",
  "./share/palabras.jpg",
  "./juego/series/index.html",
  "./share/series.jpg",
  "./juego/memoria/index.html",
  "./share/memoria.jpg",
  "./juego/sudoku/index.html",
  "./share/sudoku.jpg",
  "./juego/sopa/index.html",
  "./share/sopa.jpg",
  "./juego/crucigrama/index.html",
  "./share/crucigrama.jpg",
  "./juego/tiempo/index.html",
  "./share/tiempo.jpg",
  "./juego/verdadero/index.html",
  "./share/verdadero.jpg",
  "./juego/futbol/index.html",
  "./share/futbol.jpg",
  "./juego/cocomed/index.html",
  "./share/cocomed.jpg",
  "./juego/padel/index.html",
  "./share/padel.jpg"
];
function absolute(assetPath){return new URL(assetPath,SCOPE_URL).href}
async function fetchAndCache(cache,assetPath){const assetUrl=absolute(assetPath);const response=await fetch(new Request(assetUrl,{cache:"reload"}));if(!response.ok)throw new Error(`Precache ${response.status}: ${assetPath}`);await cache.put(assetUrl,response.clone());return assetUrl}
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE_VERSION);await Promise.all(CORE_ASSET_PATHS.map(assetPath=>fetchAndCache(cache,assetPath)));self.skipWaiting()})())});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const requestUrl=new URL(event.request.url);if(requestUrl.origin!==self.location.origin)return;if(event.request.mode==="navigate"){event.respondWith(fetch(event.request).then(response=>{if(response.ok)event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.put(event.request,response.clone())));return response}).catch(()=>caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||caches.match(INDEX_URL))));return}event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>{const network=fetch(event.request).then(response=>{if(response.ok)event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.put(event.request,response.clone())));return response});return cached||network.catch(()=>caches.match(INDEX_URL))}))});
