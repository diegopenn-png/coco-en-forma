/* Coco en Forma · Service Worker v160.74 FINAL STABILIZATION · PWA estable + Safari macOS navigation preload */
const CACHE_VERSION="coco-en-forma-v160.74-final-stabilization";
const CACHE_PREFIX="coco-en-forma-";
const SCOPE_URL=new URL("./",self.registration.scope);
const INDEX_URL=new URL("index.html",SCOPE_URL).href;
const SW_UA=String((self.navigator&&self.navigator.userAgent)||"");
const DESKTOP_SAFARI=/Safari\//.test(SW_UA)&&!/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR)\//.test(SW_UA)&&/Macintosh/.test(SW_UA)&&!/Mobile\//.test(SW_UA);
const CORE=[
  "./index.html","./manifest.webmanifest","./manifest.json","./supabase-js-2.112.3.min.js",
  "./coco-v142-content-extension.js","./coco-v142-runtime.js","./coco-v142-unified.js","./coco-v144-content.js","./coco-v144-core.js",
  "./coco-v152-pwa.js","./coco-v153-fixes.js","./coco-v155-identity.js",
  "./eterna-v159.js","./eterna-v159.css",
  "./coco-v144-professional.css","./coco-v147-refinements.css","./coco-v149-refinements.css","./coco-v152-refinements.css","./coco-v153-release.css",
  "./icon-192.png","./icon-512.png","./icon-maskable-192.png","./icon-maskable-512.png","./apple-touch-icon.png","./favicon.png"
];
function absolute(p){return new URL(p,SCOPE_URL).href}
async function cacheCore(){const c=await caches.open(CACHE_VERSION);await Promise.allSettled(CORE.map(async p=>{const u=absolute(p),r=await fetch(new Request(u,{cache:"reload"}));if(r&&r.ok)await c.put(u,r.clone())}))}
self.addEventListener("install",e=>{e.waitUntil((async()=>{await cacheCore();self.skipWaiting()})())});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_VERSION).map(k=>caches.delete(k)));if(self.registration.navigationPreload)try{if(DESKTOP_SAFARI)await self.registration.navigationPreload.enable();else await self.registration.navigationPreload.disable()}catch(_e){}await self.clients.claim()})())});
self.addEventListener("message",e=>{if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting()});
async function updateShell(){try{const r=await fetch(new Request(INDEX_URL,{cache:"reload"}));if(r&&r.ok){const c=await caches.open(CACHE_VERSION);await c.put(INDEX_URL,r.clone())}}catch(_e){}}
async function shellFast(e){const c=await caches.open(CACHE_VERSION),cached=await c.match(INDEX_URL);if(cached){e.waitUntil(updateShell());return cached}try{const r=await fetch(e.request);if(r&&r.ok)e.waitUntil(c.put(INDEX_URL,r.clone()));return r}catch(_e){return new Response("Sin conexión",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}}
async function networkFirst(e){try{const preload=await e.preloadResponse;if(preload){if(preload.ok)e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.put(e.request,preload.clone())));return preload}const r=await fetch(e.request);if(r&&r.ok)e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.put(e.request,r.clone())));return r}catch(_e){return(await caches.match(e.request,{ignoreSearch:false}))||(await caches.match(e.request,{ignoreSearch:true}))||(await caches.match(INDEX_URL))}}
function stale(e){return caches.match(e.request,{ignoreSearch:false}).then(cached=>{const net=fetch(e.request).then(r=>{if(r&&r.ok)e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.put(e.request,r.clone())));return r});return cached||net.catch(async()=>await caches.match(e.request,{ignoreSearch:true})||await caches.match(INDEX_URL))})}
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;const doc=e.request.mode==="navigate"||e.request.destination==="document",shellDoc=doc&&(u.pathname===SCOPE_URL.pathname||u.pathname===new URL("index.html",SCOPE_URL).pathname),bootstrap=/\/(coco-v153-fixes\.js|coco-v155-identity\.js)$/.test(u.pathname);if(shellDoc){e.respondWith(DESKTOP_SAFARI?networkFirst(e):shellFast(e));return}if(doc){e.respondWith(networkFirst(e));return}if(bootstrap){e.respondWith(stale(e));return}e.respondWith(stale(e))});
