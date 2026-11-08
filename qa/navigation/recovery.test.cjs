const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {JSDOM}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(root+'/index.html','utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const classic=scripts.find(m=>m[2].startsWith('!function(){var a=window.COCO_CONFIG'))[2];
const premium=scripts.find(m=>m[1].includes('coco-v124-premium-js'))[2];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function boot({fail='',hung='',session=true}={}){
 const dom=new JSDOM('<div id="cocoApp"></div>',{url:'https://coco.test/?coco_home=1',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let signOuts=0,bad=fail,stuck=hung;
 const data=table=>({data:table==='perfiles'?{id:'fixture',apodo:'Prueba',rol:'jugador',edad:20}:table==='ajustes'?{id:1,partidas_por_dia:1,registro_abierto:true}:[],error:null});
 function query(table){const b=new Proxy({}, {get:(_,k)=>k==='then'?(resolve,reject)=>{if(stuck===table)return new Promise(()=>{});return Promise.resolve(bad===table?{data:null,error:{message:'temporarily unavailable'}}:data(table)).then(resolve,reject)}:()=>b});return b}
 const client={from:query,rpc:async()=>({data:0}),auth:{getSession:async()=>stuck==='session'?new Promise(()=>{}):{data:{session:session?{user:{id:'fixture'}}:null}},signOut:async()=>{signOuts++},onAuthStateChange(){}}};
 w.supabase={createClient:()=>client};w.__COCO_SUPABASE_CLIENT=client;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 const nativeTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===10000?30:ms,...args);
 w.eval(scripts.find(m=>m[2].startsWith("window.COCO_VERSION"))[2]);
 w.eval(classic);
 return{w,close:()=>w.close(),signOuts:()=>signOuts,recover:()=>{bad='';stuck=''}};
}
for(const failure of ['perfiles','partidas'])test('temporary '+failure+' failure preserves session and retry restores menu',async()=>{
 const h=boot({fail:failure});try{await wait(50);assert.match(h.w.document.body.textContent,/Volver a intentar/);assert.equal(h.signOuts(),0);h.recover();[...h.w.document.querySelectorAll('button')].find(b=>b.textContent==='Volver a intentar').click();await wait(50);assert.ok(h.w.document.querySelector('.navegacionJugador'));assert.equal(h.signOuts(),0)}finally{h.close()}
});
for(const failure of ['session','perfiles','partidas','bonos'])test('hung '+failure+' shows recovery instead of permanent loading',async()=>{
 const h=boot({hung:failure});try{await wait(120);assert.match(h.w.document.body.textContent,/Volver a intentar/);assert.equal(h.signOuts(),0)}finally{h.close()}
});
test('public entry loads without a session',async()=>{const h=boot({session:false});try{await wait(50);assert.match(h.w.document.body.textContent,/Entrar/);assert.doesNotMatch(h.w.document.body.textContent,/Volver a intentar/);}finally{h.close()}});
test('player menu contains one shop link after ranking and stays interactive after redraw',async()=>{const h=boot();try{await wait(50);h.w.eval(premium);await wait(100);const nav=h.w.document.querySelector('.navegacionJugador');assert.equal(nav.querySelectorAll('.cocoShopLink').length,1);assert.equal(nav.querySelector('.cocoShopLink').previousElementSibling.className,'pestanaJugador cocoRankingProxy');nav.appendChild(h.w.document.createElement('span'));await wait(60);assert.equal(nav.querySelectorAll('.cocoShopLink').length,1);[...nav.querySelectorAll('button')].find(b=>b.textContent.includes('Mis tarjetas')).click();assert.ok(h.w.document.querySelector('.panelJugador[aria-label="Mis tarjetas de logro"]').classList.contains('activa'));}finally{h.close()}});
test('all shop home links return in the same window with explicit home intent',()=>{for(const name of ['index','condiciones','pedido']){const dom=new JSDOM(fs.readFileSync(root+'/galeria/impresiones-3d/'+name+'.html','utf8'),{url:'https://coco.test/galeria/impresiones-3d/'});try{const links=[...dom.window.document.querySelectorAll('a')].filter(a=>a.textContent.includes('Volver a Coco')||a.textContent==='Menú principal'||a.getAttribute('aria-label')==='Menú principal de Coco');assert.ok(links.length);for(const link of links){assert.equal(link.pathname,'/');assert.equal(link.search,'?coco_home=1');assert.equal(link.target,'_self')}}finally{dom.window.close()}}});
function swHarness(fetchImpl){const handlers={},entries=new Map();const cache={match:async req=>entries.get(typeof req==='string'?req:req.url),put:async(req,r)=>entries.set(typeof req==='string'?req:req.url,r)};const context={URL,Request,Response,Headers,AbortController,Promise,setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,25)),clearTimeout,fetch:fetchImpl,caches:{open:async()=>cache,match:cache.match,keys:async()=>[],delete:async()=>true},self:{registration:{scope:'https://coco.test/'},location:{origin:'https://coco.test'},navigator:{userAgent:'test'},clients:{claim:async()=>{}},skipWaiting(){},addEventListener:(name,fn)=>handlers[name]=fn}};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/sw.js','utf8'),context);return{context,entries,handlers}}
test('unavailable scripts return 503, never the HTML shell',async()=>{const h=swHarness(async()=>{throw Error('offline')});h.entries.set('https://coco.test/index.html',new Response('<html>Coco</html>'));const r=await vm.runInContext('offlineFallback(new Request("https://coco.test/missing.js"))',h.context);assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/<html>/)});
test('return navigation falls back to cached Coco when the network stalls',async()=>{const h=swHarness(()=>new Promise(()=>{}));h.entries.set('https://coco.test/index.html',new Response('<html>Coco menu</html>'));h.context.event={request:{url:'https://coco.test/?coco_home=1',mode:'navigate',method:'GET',destination:'document'},preloadResponse:Promise.resolve(null)};const r=await vm.runInContext('networkFirst(event)',h.context);assert.match(await r.text(),/Coco menu/)});
test('PWA installation settles even if an optional download never responds',async()=>{const h=swHarness(()=>new Promise(()=>{}));await vm.runInContext('cacheCore()',h.context)});
