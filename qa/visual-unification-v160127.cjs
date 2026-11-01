const {chromium}=require(process.env.COCO_PLAYWRIGHT_PATH||'playwright');const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..');const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'};
(async()=>{const server=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');r.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');r.end(fs.readFileSync(p))}catch(e){r.writeHead(404).end()}});await new Promise(ok=>server.listen(4188,'127.0.0.1',ok));const b=await chromium.launch({headless:true,...(process.env.COCO_CHROMIUM_PATH?{executablePath:process.env.COCO_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-gpu','--no-zygote']});const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const external=[];await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();external.push(u.origin+u.pathname);if(u.hostname.endsWith('.supabase.co'))return r.fulfill({status:200,contentType:'application/json',body:u.pathname.includes('/rest/v1/')?'[]':'{"user":null,"session":null}'});if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('supabase'))return r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(root+'/supabase-js-2.112.3.min.js','utf8')});return r.abort()});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const results=[];
for(const width of [320,390,768,1440]){
 await p.setViewportSize({width,height:900});
 await p.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});
 await p.locator('.cocoPremiumSuggestion').waitFor();await p.waitForTimeout(400);
 const layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('.cocoFreemiumV16084 b')).fontFamily}));assert.ok(layout.scroll<=width+1,JSON.stringify(layout));assert.match(layout.font,/CocoMontserrat/);
 await p.locator('.cocoPremiumSuggestion').scrollIntoViewIfNeeded();await p.locator('.cocoPremiumSuggestion img').evaluate(i=>i.decode());
 if(width===390){await p.locator('.cocoPremiumSuggestion').screenshot({path:'/tmp/coco-suggestion-390.png'});await p.locator('#eternaLauncherV159').screenshot({path:'/tmp/coco-banner-390.png'});await p.locator('.cocoFreemiumV16084').screenshot({path:'/tmp/coco-freemium-390.png'});}
 await p.locator('.cocoPremiumSuggestion').click();assert.ok(await p.locator('.cocoSuggestionModal').isVisible());await p.locator('[data-suggestion-close]').click();
 results.push({page:'public home',width,overflow:false,suggestion_opens:true});
}
const profile=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
await profile.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
await profile.addInitScript(()=>{
 const user={id:'00000000-0000-4000-8000-000000000001',email:'visual-test@example.invalid'};let session={access_token:'synthetic-ui-only',user};
 const rows={ajustes:{id:1,partidas_por_dia:1},perfiles:{id:user.id,apodo:'Perfil de prueba',rol:'jugador',edad:10},partidas:[],bonos:[]};
 function query(table){let single=false;const chain=new Proxy({},{get(_,key){if(key==='then')return resolve=>resolve({data:single?(Array.isArray(rows[table])?null:rows[table]||null):(Array.isArray(rows[table])?rows[table]:rows[table]?[rows[table]]:[]),error:null,count:0});if(key==='single'||key==='maybeSingle')return ()=>{single=true;return chain};return ()=>chain}});return chain;}
 window.__COCO_SUPABASE_CLIENT={from:query,rpc:()=>Promise.resolve({data:[],error:null}),auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{session=null;return {error:null}}},channel:()=>({on(){return this},subscribe(){return this},unsubscribe(){}}),removeChannel(){}};
});
await profile.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});await profile.locator('.carnet').waitFor();
for(const width of [320,390,768,1440]){
 await profile.setViewportSize({width,height:900});await profile.waitForTimeout(250);
 const layout=await profile.locator('.carnet').evaluate(el=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(el.querySelector('.quien strong')).fontFamily,bg:getComputedStyle(el).backgroundImage}));assert.ok(layout.scroll<=width+1,JSON.stringify(layout));assert.match(layout.font,/CocoMontserrat/);
 if(width===390)await profile.locator('.carnet').screenshot({path:'/tmp/coco-profile-390.png'});
 results.push({page:'synthetic profile',width,overflow:false});
}
const suggestion=profile.locator('.cocoSuggestionCard');await suggestion.scrollIntoViewIfNeeded();await suggestion.locator('img').evaluate(i=>i.decode());await suggestion.screenshot({path:'/tmp/coco-suggestion-full.png'});await suggestion.locator('button').click();assert.ok(await profile.locator('.cocoSuggestionModal').isVisible());await profile.locator('[data-suggestion-close]').click();

// Exercise submission states with intercepted responses: never contacts the mailbox.
await p.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});
let submitOk=false,submissions=0;await p.route('https://formsubmit.co/**',r=>{submissions++;return r.fulfill({status:submitOk?200:503,contentType:'application/json',body:JSON.stringify({success:submitOk})})});
await p.locator('.cocoPremiumSuggestion').click();
await p.locator('[name=nombre]').fill('Prueba local');await p.locator('[name=edad]').fill('12');await p.locator('[name=sugerencia]').fill('Una idea sintética de prueba sin envío real.');
await p.locator('.cocoSuggestionForm button[type=submit]').click();await p.locator('.cocoSuggestionStatus.error').waitFor();assert.ok(await p.locator('.cocoSuggestionForm button[type=submit]').isEnabled());submitOk=true;
await p.locator('.cocoSuggestionForm button[type=submit]').click();await p.locator('.cocoSuggestionStatus.success').waitFor();assert.equal(submissions,2);await p.locator('[data-suggestion-close]').click();results.push({page:'suggestion form',mocked_failure_retry_success:true,real_messages_sent:0});
// Existing unlocked base reward downloads the new full artwork.
const dlButton=profile.locator('.descargarTarjetaCoco').first();assert.ok(await dlButton.count());assert.match(await dlButton.getAttribute('data-url'),/premium-v160127\/coco.jpg/);
const pendingDownload=profile.waitForEvent('download');await dlButton.evaluate(el=>el.click());const downloaded=await pendingDownload;assert.match(downloaded.suggestedFilename(),/coco.*\.jpg/);results.push({page:'reward card',download:downloaded.suggestedFilename()});
// Isolated Bank bundle: same theme with embedded fonts and no server contact.
const {renderApp}=await import(root+'/.github/coco-bank/src/ui.mjs');const bank=await b.newPage({viewport:{width:390,height:844}});await bank.route('**/*',r=>r.abort());
const theme=fs.readFileSync(root+'/assets/styles/coco-bank-premium-v160127.css','utf8');
await bank.evaluate(()=>{window.postMessage=msg=>queueMicrotask(()=>window.dispatchEvent(new MessageEvent('message',{source:window,data:{reply:true,channel:msg.channel,id:msg.id,data:{state:null,summary:null,market:{prices:{},events:[]},catalog:[],serverTime:Date.now(),parent:{configured:false}}}})))});
await bank.setContent(renderApp().replace("style-src 'unsafe-inline';","style-src 'unsafe-inline'; font-src data:;").replace('</head>','<style>'+theme+'</style></head>'));await bank.locator('#account').waitFor();await bank.evaluate(()=>document.fonts.ready);
assert.match(await bank.evaluate(()=>getComputedStyle(document.body).fontFamily),/CocoMontserrat/);assert.ok(await bank.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await bank.screenshot({path:'/tmp/coco-bank-390.png'});results.push({page:'isolated Bank',width:390,overflow:false,font:'CocoMontserrat'});await bank.close();

for(const route of ['/juegos/','/juego/ajedrez/','/games/ajedrez/','/games/ciudad/','/games/conecta/','/explora/','/explora/jugar.html','/eterna.html','/politica-de-privacidad.html']){
 await p.setViewportSize({width:390,height:844});await p.goto('http://127.0.0.1:4188'+route,{waitUntil:'domcontentloaded'});await p.waitForTimeout(200);
 const size=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.body).fontFamily}));assert.ok(size.scroll<=size.width+1,route+JSON.stringify(size));assert.match(size.font,/CocoMontserrat/);results.push({page:route,width:390,overflow:false});
}
console.log(JSON.stringify({results,errors,network:'API responses mocked, no live writes'}));fs.writeFileSync('/tmp/coco-final-visual-report.json',JSON.stringify({results,errors,network:'API responses mocked, no live writes'},null,2));await b.close();server.close()})().catch(e=>{console.error(e.stack.slice(-2200));process.exit(1)})
