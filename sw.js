/* Coco en Forma · Service Worker v160.90.4 FINAL REGRESSION · HF1 preservado */
const CACHE_VERSION="coco-en-forma-v160.90.4-final-regression-v1";
const CACHE_PREFIX="coco-en-forma-";
const SCOPE_URL=new URL("./",self.registration.scope);
const INDEX_URL=new URL("index.html",SCOPE_URL).href;
const ETERNA_CORE_PATH="./eterna-v159.js";
const ETERNA_HOTFIX_PATH="./eterna-hotfix-v160902.js";
const PRODUCT_UX_PATH="./coco-release-v160903.js";
const COCO_BOOTSTRAP_PATH="./coco-v153-fixes.js";
const SW_UA=String((self.navigator&&self.navigator.userAgent)||"");
const DESKTOP_SAFARI=/Safari\//.test(SW_UA)&&!/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR)\//.test(SW_UA)&&/Macintosh/.test(SW_UA)&&!/Mobile\//.test(SW_UA);

const CORE=[
  "./index.html","./manifest.webmanifest","./manifest.json","./supabase-js-2.112.3.min.js",
  "./coco-v142-content-extension.js","./coco-v142-runtime.js","./coco-v142-unified.js","./coco-v144-content.js","./coco-v144-core.js",
  "./coco-v152-pwa.js",COCO_BOOTSTRAP_PATH,"./coco-v155-identity.js",PRODUCT_UX_PATH,
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

/* Cached shell for Chrome/iOS/PWA. Cache refresh is performed at SW install. */
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

/* Navigation network-first. */
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

/* Stale-while-revalidate for same-origin static assets. */
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

  e.waitUntil(networkPromise.then(()=>undefined).catch(()=>undefined));

  return cachedPromise.then(async cached=>{
    if(cached)return cached;
    const r=await networkPromise;
    if(r)return r;
    return offlineFallback(e.request);
  });
}

async function cachedPatch(path){
  const url=absolute(path);
  const c=await caches.open(CACHE_VERSION);
  let r=await c.match(url);
  if(r)return r;
  try{
    r=await fetch(new Request(url,{cache:"reload"}));
    if(r&&r.ok)await c.put(url,r.clone());
    return r
  }catch(_e){return null}
}

/* HF1 ya validado: se mantiene exactamente su función de aislamiento pedagógico. */
async function eternaCoreWithHotfix(e){
  const basePromise=stale(e);
  const patchPromise=cachedPatch(ETERNA_HOTFIX_PATH);
  const [base,patch]=await Promise.all([basePromise,patchPromise]);
  if(!base||!patch||!patch.ok)return base||offlineFallback(e.request);
  const [coreText,patchText]=await Promise.all([base.text(),patch.text()]);
  const headers=new Headers(base.headers);
  headers.set("Content-Type","application/javascript; charset=utf-8");
  headers.set("Cache-Control","no-cache");
  ["Content-Length","Content-Encoding","ETag","Last-Modified"].forEach(h=>headers.delete(h));
  return new Response(
    coreText+"\n\n/* --- ETERNA HF1 injected by SW --- */\n"+patchText+"\n",
    {status:base.status,statusText:base.statusText,headers}
  );
}

/* v160.90.3
   Adjunta una única capa de producto después de coco-v153-fixes.js.
   Evita reescribir index.html o cuatro módulos grandes y hace rollback sencillo:
   restaurar el SW anterior elimina toda esta capa. */
async function cocoBootstrapWithProductUx(e){
  const basePromise=stale(e);
  const patchPromise=cachedPatch(PRODUCT_UX_PATH);
  const [base,patch]=await Promise.all([basePromise,patchPromise]);
  if(!base||!patch||!patch.ok)return base||offlineFallback(e.request);
  const [baseText,patchText]=await Promise.all([base.text(),patch.text()]);
  const headers=new Headers(base.headers);
  headers.set("Content-Type","application/javascript; charset=utf-8");
  headers.set("Cache-Control","no-cache");
  ["Content-Length","Content-Encoding","ETag","Last-Modified"].forEach(h=>headers.delete(h));
  return new Response(
    baseText+"\n\n/* --- COCO PRODUCT UX v160.90.3 injected by SW --- */\n"+patchText+"\n",
    {status:base.status,statusText:base.statusText,headers}
  );
}

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  const doc=e.request.mode==="navigate"||e.request.destination==="document";
  const shellDoc=doc&&(u.pathname===SCOPE_URL.pathname||u.pathname===new URL("index.html",SCOPE_URL).pathname);
  const eternaCore=u.pathname===new URL(ETERNA_CORE_PATH,SCOPE_URL).pathname;
  const cocoBootstrap=u.pathname===new URL(COCO_BOOTSTRAP_PATH,SCOPE_URL).pathname;
  const identity=u.pathname===new URL("./coco-v155-identity.js",SCOPE_URL).pathname;

  if(shellDoc){e.respondWith(DESKTOP_SAFARI?networkFirst(e):shellFast(e));return}
  if(doc){e.respondWith(networkFirst(e));return}
  if(eternaCore){e.respondWith(eternaCoreWithHotfix(e));return}
  if(cocoBootstrap){e.respondWith(cocoBootstrapWithProductUx(e));return}
  if(identity){e.respondWith(stale(e));return}
  e.respondWith(stale(e));
});
