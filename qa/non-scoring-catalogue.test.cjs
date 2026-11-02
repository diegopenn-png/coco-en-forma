const {chromium}=require(process.env.COCO_PLAYWRIGHT_PATH||'playwright');const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..');const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'};
(async()=>{const server=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');r.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');r.end(fs.readFileSync(p))}catch(e){r.writeHead(404).end()}});await new Promise(ok=>server.listen(4188,'127.0.0.1',ok));const b=await chromium.launch({headless:true,...(process.env.COCO_CHROMIUM_PATH?{executablePath:process.env.COCO_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-gpu','--no-zygote']});const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const external=[];await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();external.push(u.origin+u.pathname);if(u.hostname.endsWith('.supabase.co'))return r.fulfill({status:200,contentType:'application/json',body:u.pathname.includes('/rest/v1/')?'[]':'{"user":null,"session":null}'});if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('supabase'))return r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(root+'/supabase-js-2.112.3.min.js','utf8')});return r.abort()});const errors=[];p.on('pageerror',e=>errors.push(e.message));


async function standalone(page){await page.addInitScript(()=>{
 const match=window.matchMedia.bind(window);window.matchMedia=q=>q.includes('display-mode: standalone')?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:match(q);
 Object.defineProperty(navigator,'standalone',{value:true,configurable:true});window.__copied=[];window.__nativeShares=0;
 Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.__copied.push(text)},configurable:true});
 Object.defineProperty(navigator,'share',{value:async()=>{window.__nativeShares++},configurable:true});
});}
async function verifyCopy(page,label){
 assert.equal(await page.evaluate(()=>matchMedia('(display-mode: standalone)').matches),true);
 const buttons=page.locator('[data-coco-copy-link]');assert.equal(await buttons.count(),19,label+' copy on every card');
 const before=page.url();
 for(let i=0;i<19;i++){const button=buttons.nth(i),id=await button.getAttribute('data-coco-copy-link'),url=id==='eneagrama'?'https://cocoenforma.com/explora/':'https://cocoenforma.com/juego/'+id+'/';await button.scrollIntoViewIfNeeded();await button.click();assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>__copied.at(-1)),url);assert.match(await button.locator('..').locator('.cocoCopyStatus').innerText(),/Enlace copiado/);}
 // The copy menu remains clickable above active game overlays and does not invoke native sharing.
 for(const id of [...expected,'cocomed','padel']){await page.evaluate(id=>window.CocoV144.openModal({module:id,title:id,html:'<p>Prueba de compartir</p>'}),id);await page.locator('[data-v144-share]').click();await page.locator('.cocoShareModal [data-share-copy]').click();assert.equal(await page.evaluate(()=>__copied.at(-1)),'https://cocoenforma.com/juego/'+id+'/');await page.locator('.cocoShareModal [data-share-close]').click();await page.evaluate(()=>window.CocoV144.closeModal());}
 assert.equal(await page.evaluate(()=>__nativeShares),0);
 const first=buttons.first();await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('denied')};document.execCommand=command=>{if(command==='copy'){window.__fallbackCopy=document.activeElement.value;return true}return false}});await first.click();assert.match(await page.evaluate(()=>__fallbackCopy),/^https:\/\/cocoenforma.com\/juego\//);
 await page.evaluate(()=>{document.execCommand=()=>false});await first.click();const manual=first.locator('..').locator('.cocoCopyManual');assert.equal(await manual.isVisible(),true);assert.match(await manual.inputValue(),/^https:\/\/cocoenforma.com\/juego\//);assert.doesNotMatch(await first.locator('..').locator('.cocoCopyStatus').innerText(),/Enlace copiado/);
 console.log(JSON.stringify({sharing:label,catalogue:19,activeGameMenus:expected.length+2,standalone:true,nativeShares:0,clipboardFallback:true,manualFallback:true}));
}

let expected;
async function verify(page,label){
 await page.locator('[data-coco-city-entry] .cocoLigaBadge').waitFor();await page.waitForTimeout(500);
 const audit=await page.evaluate(()=>window.CocoArcadeV133.classification.audit());assert.deepEqual(audit.generalIds,expected,label);
 const cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#cocoApp .cocoGameCard,#cocoApp .cocoMiniJuego')).map(c=>({id:c.hasAttribute('data-coco-generala-entry')?'generala':c.hasAttribute('data-coco-city-entry')?'ciudad':c.hasAttribute('data-coco-chess-entry')?'ajedrez':c.dataset.cocoJuego,badges:c.querySelectorAll('.cocoLigaBadge').length,label:c.querySelector('.cocoLigaBadge>b')?.textContent,scope:c.querySelector('.cocoScoringScope')?.textContent,disabled:c.querySelector('.cocoBotonJuego')?.disabled})).filter(c=>c.id));
 assert.equal(cards.length,19,label+' full catalogue');
 for(const c of cards){assert.equal(c.badges,1,label+' '+c.id);assert.equal(c.label,expected.includes(c.id)?'Puntúa para la clasificación general':'No puntúa para la clasificación general',label+' '+c.id);if(c.id==='ajedrez')assert.equal(c.scope,'Solo la partida del día');if(['generala','ciudad','bank','eneagrama','padel'].includes(c.id))assert.notEqual(c.disabled,true,c.id);}
 const guard=await page.evaluate(async()=>{const api=window.CocoArcadeV133,cli=window.__COCO_SUPABASE_CLIENT;let calls=0;const from=cli?.from,rpc=cli?.rpc;if(cli){cli.from=()=>{calls++;throw Error('unexpected write')};cli.rpc=()=>{calls++;throw Error('unexpected RPC')}}try{const results=[];for(const id of ['generala','ciudad','bank','eneagrama','padel','ajedrez','inventado'])results.push(await api.saveScore(id,100,{},'synthetic'));const board=await api.loadLeaderboard('ciudad');return{results,calls,board}}finally{if(cli){cli.from=from;cli.rpc=rpc}}});assert.equal(guard.calls,0,label);assert.ok(guard.results.every(r=>!r.ok&&r.unranked));assert.ok(guard.board.unranked);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' '+width)}
 await page.setViewportSize({width:390,height:844});
 for(const selector of ['[data-coco-city-entry]','[data-coco-chess-entry]','[data-coco-bank-entry]']){const card=page.locator(selector).first();await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());await card.screenshot({path:'/tmp/coco-scoring-'+label+'-'+selector.slice(6,-7)+'.png'});}
 return{view:label,cards:cards.length,labels:cards.map(({id,label,scope})=>({id,label,scope})),blockedSaves:guard.results.length,remoteCalls:guard.calls};
}
await standalone(p);await p.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});await p.locator('[data-coco-city-entry]').waitFor();
expected=await p.evaluate(()=>Array.from(window.COCO_GENERAL_RANKING_IDS_V153));
const results=[await verify(p,'public')];await verifyCopy(p,'public');
const profile=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
await profile.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
await profile.addInitScript(()=>{
 const user={id:'00000000-0000-4000-8000-000000000001',email:'visual-test@example.invalid'};let session={access_token:'synthetic-ui-only',user};
 const rows={ajustes:{id:1,partidas_por_dia:1},perfiles:{id:user.id,apodo:'Perfil de prueba',rol:'jugador',edad:10},partidas:[],bonos:[]};
 function query(table){let single=false;const chain=new Proxy({},{get(_,key){if(key==='then')return resolve=>resolve({data:single?(Array.isArray(rows[table])?null:rows[table]||null):(Array.isArray(rows[table])?rows[table]:rows[table]?[rows[table]]:[]),error:null,count:0});if(key==='single'||key==='maybeSingle')return ()=>{single=true;return chain};return ()=>chain}});return chain;}
 window.__COCO_SUPABASE_CLIENT={from:query,rpc:()=>Promise.resolve({data:[],error:null}),auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{session=null;return {error:null}}},channel:()=>({on(){return this},subscribe(){return this},unsubscribe(){}}),removeChannel(){}};
});
await standalone(profile);await profile.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});await profile.locator('.carnet').waitFor();
results.push(await verify(profile,'profile'));await verifyCopy(profile,'profile');assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors,realWrites:0}));await b.close();server.close()})().catch(e=>{console.error(e.stack);process.exit(1)});