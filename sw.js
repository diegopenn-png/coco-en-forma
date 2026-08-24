/* Coco en Forma · Service Worker v160 FINAL4.23 · PIN directo + rendimiento */
const CACHE_VERSION="coco-en-forma-v160.0.0-final4.23";
const CACHE_PREFIX="coco-en-forma-";
const SCOPE_URL=new URL("./",self.registration.scope);
const INDEX_URL=new URL("index.html",SCOPE_URL).href;
const ESSENTIAL=[
  "./","./index.html","./manifest.webmanifest","./manifest.json","./supabase-js-2.112.3.min.js",
  "./coco-v142-content-extension.js","./coco-v142-runtime.js","./coco-v142-unified.js","./coco-v144-content.js","./coco-v144-core.js",
  "./coco-v152-padel.js","./coco-v152-pwa.js","./coco-v153-fixes.js","./coco-v155-identity.js",
  "./eterna-v159.js","./eterna-v159.css","./eterna-experience-v160.js","./eterna-family-v16063.js","./eterna-onboarding-v16063.js","./eterna.html","./eterna-social.png","./og-coco.jpg","./share/eterna.png",
  "./coco-v144-professional.css","./coco-v147-refinements.css","./coco-v149-refinements.css","./coco-v152-refinements.css","./coco-v153-release.css",
  "./icon-192.png","./icon-512.png","./icon-maskable-192.png","./icon-maskable-512.png","./apple-touch-icon.png","./shortcut-icon.png","./favicon.png"
];
const OPTIONAL=[
  "./aviso-legal.html","./politica-de-privacidad.html","./privacidad-menores.html","./politica-de-cookies.html","./proteccion-de-datos.html",
  "./informacion-ia-eterna.html","./suscripciones-y-desistimiento.html","./terminos-y-condiciones.html","./centro-de-confianza.html",
  "./juego/numeros/index.html","./share/numeros.jpg","./juego/calculo/index.html","./share/calculo.jpg",
  "./juego/palabras/index.html","./share/palabras.jpg","./juego/series/index.html","./share/series.jpg","./juego/memoria/index.html","./share/memoria.jpg",
  "./juego/sudoku/index.html","./share/sudoku.jpg","./juego/sopa/index.html","./share/sopa.jpg","./juego/crucigrama/index.html","./share/crucigrama.jpg",
  "./juego/tiempo/index.html","./share/tiempo.jpg","./juego/verdadero/index.html","./share/verdadero.jpg","./juego/futbol/index.html","./share/futbol.jpg",
  "./juego/cocomed/index.html","./share/cocomed.jpg","./juego/padel/index.html","./share/padel.jpg"
];
function absolute(path){return new URL(path,SCOPE_URL).href}
async function fetchAndCache(cache,path){const url=absolute(path);const response=await fetch(new Request(url,{cache:"reload"}));if(response&&response.ok)await cache.put(url,response.clone());return response}
async function bestEffort(cache,paths){await Promise.allSettled(paths.map(path=>fetchAndCache(cache,path)))}
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE_VERSION);await bestEffort(cache,ESSENTIAL);event.waitUntil(bestEffort(cache,OPTIONAL));self.skipWaiting()})())});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION).map(key=>caches.delete(key)));if(self.registration.navigationPreload)try{await self.registration.navigationPreload.enable()}catch(_e){}await self.clients.claim()})())});
self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting()});
async function networkFirst(event){try{const preload=event.request.mode==="navigate"&&event.preloadResponse?await event.preloadResponse:null;const response=preload||await fetch(event.request);if(response&&response.ok)event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.put(event.request,response.clone())));return response}catch(_e){return (await caches.match(event.request,{ignoreSearch:false}))||(await caches.match(event.request,{ignoreSearch:true}))||(await caches.match(INDEX_URL))}}
function staleWhileRevalidate(event){return caches.match(event.request,{ignoreSearch:false}).then(cached=>{const network=fetch(event.request).then(response=>{if(response&&response.ok)event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.put(event.request,response.clone())));return response});return cached||network.catch(async()=>await caches.match(event.request,{ignoreSearch:true})||await caches.match(INDEX_URL))})}
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  const critical=/\/(eterna-v159\.(js|css)|eterna-experience-v160\.js|eterna-family-v16063\.js|eterna-onboarding-v16063\.js|eterna\.html|coco-v152-pwa\.js|coco-v153-fixes\.js|coco-v155-identity\.js)$/.test(url.pathname);
  const documentRequest=event.request.mode==="navigate"||event.request.destination==="document";
  if(documentRequest||critical){event.respondWith(networkFirst(event));return}
  event.respondWith(staleWhileRevalidate(event))
});
