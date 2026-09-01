/* Coco en Forma · Service Worker v160.90.2 HF1 · Eterna mode isolation hotfix */
const CACHE_VERSION="coco-en-forma-v160.90.2-fraction-flow-v2";
const CACHE_PREFIX="coco-en-forma-";
const SCOPE_URL=new URL("./",self.registration.scope);
const INDEX_URL=new URL("index.html",SCOPE_URL).href;
const ETERNA_CORE_PATH="./eterna-v159.js";
const ETERNA_HOTFIX_PATH="./eterna-hotfix-v160902.js";
const SW_UA=String((self.navigator&&self.navigator.userAgent)||"");
const DESKTOP_SAFARI=/Safari\//.test(SW_UA)&&!/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR)\//.test(SW_UA)&&/Macintosh/.test(SW_UA)&&!/Mobile\//.test(SW_UA);
const CORE=[
  "./index.html","./manifest.webmanifest","./manifest.json","./supabase-js-2.112.3.min.js",
  "./coco-v142-content-extension.js","./coco-v142-runtime.js","./coco-v142-unified.js","./coco-v144-content.js","./coco-v144-core.js",
  "./coco-v152-pwa.js","./coco-v153-fixes.js","./coco-v155-identity.js",
  ETERNA_CORE_PATH,"./eterna-v159.css",ETERNA_HOTFIX_PATH,"./eterna-marketing-attribution-v1.js",
  "./coco-v144-professional.css","./coco-v147-refinements.css","./coco-v149-refinements.css","./coco-v152-refinements.css","./coco-v153-release.css",
  "./icon-192.png","./icon-512.png","./icon-maskable-192.png","./icon-maskable-512.png","./apple-touch-icon.png","./favicon.png"
];

function absolute(p){return new URL(p,SCOPE_URL).href}

async function cacheCore(){
  const c=await caches.open(CACHE_VERSION);
  await Promise.allSettled(CORE.map(async p=>{
    const u=absolute(p);
    const r=await fetch(new Request(u,{cache:"reload"}));
    if(r&&r.ok)await c.put(u,r.clone());
  }));
}

self.addEventListener("install",e=>{
  e.waitUntil((async()=>{await cacheCore();self.skipWaiting()})());
});

self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_VERSION).map(k=>caches.delete(k)));
    if(self.registration.navigationPreload){
      try{
        if(DESKTOP_SAFARI)await self.registration.navigationPreload.enable();
        else await self.registration.navigationPreload.disable();
      }catch(_e){}
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message",e=>{
  if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting();
});

async function offlineFallback(request){
  return (await caches.match(request,{ignoreSearch:false}))||
         (await caches.match(request,{ignoreSearch:true}))||
         (await caches.match(INDEX_URL))||
         new Response("Sin conexión",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
}

/* Cached shell for Chrome/iOS/PWA. Cache refresh is performed at SW install,
   so no late waitUntil() is needed after asynchronous cache reads. */
async function shellFast(e){
  const c=await caches.open(CACHE_VERSION);
  const cached=await c.match(INDEX_URL);
  if(cached)return cached;
  try{
    const r=await fetch(e.request);
    if(r&&r.ok){
      const copy=r.clone();
      await c.put(INDEX_URL,copy);
    }
    return r;
  }catch(_e){
    return offlineFallback(e.request);
  }
}

/* Navigation network-first. Response is cloned BEFORE any await that could
   allow respondWith() to consume the body. No late event.waitUntil() calls. */
async function networkFirst(e){
  try{
    const preload=await e.preloadResponse;
    if(preload){
      if(preload.ok){
        const copy=preload.clone();
        const c=await caches.open(CACHE_VERSION);
        await c.put(e.request,copy);
      }
      return preload;
    }
    const r=await fetch(e.request);
    if(r&&r.ok){
      const copy=r.clone();
      const c=await caches.open(CACHE_VERSION);
      await c.put(e.request,copy);
    }
    return r;
  }catch(_e){
    return offlineFallback(e.request);
  }
}

/* Stale-while-revalidate for same-origin static assets. The lifetime promise
   is registered synchronously, while the network response is cloned before
   caching. This avoids InvalidStateError and "Response body is already used". */
function stale(e){
  const cachePromise=caches.open(CACHE_VERSION);
  const cachedPromise=cachePromise.then(c=>c.match(e.request,{ignoreSearch:false}));
  const networkPromise=fetch(e.request).then(async r=>{
    if(r&&r.ok){
      const copy=r.clone();
      const c=await cachePromise;
      await c.put(e.request,copy);
    }
    return r;
  }).catch(()=>null);

  /* Must be called during the fetch event dispatch, not from a later .then(). */
  e.waitUntil(networkPromise.then(()=>undefined).catch(()=>undefined));

  return cachedPromise.then(async cached=>{
    if(cached)return cached;
    const r=await networkPromise;
    if(r)return r;
    return offlineFallback(e.request);
  });
}

/* v160.90.2 HF1
   Keep the deployed Eterna core untouched on disk and append the small audited
   client hotfix at response time. This lets the hotfix be rolled back by
   restoring this Service Worker, without touching auth, payments or Worker API. */
async function eternaCoreWithHotfix(e){
  const basePromise=stale(e); /* registers waitUntil synchronously */
  const cachePromise=caches.open(CACHE_VERSION);
  const patchPromise=cachePromise.then(c=>c.match(absolute(ETERNA_HOTFIX_PATH))).then(async cached=>{
    if(cached)return cached;
    try{
      const r=await fetch(new Request(absolute(ETERNA_HOTFIX_PATH),{cache:"reload"}));
      if(r&&r.ok){const c=await cachePromise;await c.put(absolute(ETERNA_HOTFIX_PATH),r.clone())}
      return r
    }catch(_e){return null}
  });
  const [base,patch]=await Promise.all([basePromise,patchPromise]);
  if(!base||!patch||!patch.ok)return base||offlineFallback(e.request);
  const [coreText,patchText]=await Promise.all([base.text(),patch.text()]);
  const headers=new Headers(base.headers);
  headers.set("Content-Type","application/javascript; charset=utf-8");
  headers.set("Cache-Control","no-cache");
  ["Content-Length","Content-Encoding","ETag","Last-Modified"].forEach(h=>headers.delete(h));
  return new Response(coreText+"\n\n/* --- ETERNA HF1 injected by SW --- */\n"+patchText+"\n",{status:base.status,statusText:base.statusText,headers});
}

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  const doc=e.request.mode==="navigate"||e.request.destination==="document";
  const shellDoc=doc&&(u.pathname===SCOPE_URL.pathname||u.pathname===new URL("index.html",SCOPE_URL).pathname);
  const bootstrap=/\/(coco-v153-fixes\.js|coco-v155-identity\.js)$/.test(u.pathname);
  const eternaCore=u.pathname===new URL(ETERNA_CORE_PATH,SCOPE_URL).pathname;

  if(shellDoc){e.respondWith(DESKTOP_SAFARI?networkFirst(e):shellFast(e));return;}
  if(doc){e.respondWith(networkFirst(e));return;}
  if(eternaCore){e.respondWith(eternaCoreWithHotfix(e));return;}
  if(bootstrap){e.respondWith(stale(e));return;}
  e.respondWith(stale(e));
});
