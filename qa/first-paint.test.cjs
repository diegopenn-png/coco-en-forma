const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=html.match(/<script id="coco-first-paint">([\s\S]*?)<\/script>/)[1];
const css=html.match(/<style id="coco-first-paint-css">([\s\S]*?)<\/style>/)[1];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const publicMenu='<section id="cocoHomeFinal3"><div class="loginCard"><button>Entrar</button></div><div class="cocoFreemiumV16084"></div><div class="retosCard" data-coco-v124="1"><div class="cocoMiniJuego" data-coco-juego="memoria"><img class="cocoOfficialThumb" src="memoria.webp"></div></div></section>';
function harness({deadline=2500}={}){
 const dom=new JSDOM('<!doctype html><html><head><style>'+css+'</style></head><body><div id="coco-startup-status" role="status">Preparando Coco…</div><div id="cocoApp"></div></body></html>',{url:'https://coco.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,app=w.document.getElementById('cocoApp'),paints=[];
 let ready='loading';Object.defineProperty(w.document,'readyState',{get:()=>ready});
 const timeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>timeout(fn,ms===12000?deadline:ms,...args);
 w.addEventListener('coco:first-paint',e=>paints.push({reason:e.detail.reason,content:app.innerHTML}));
 w.eval(code);
 return{w,app,paints,parse(){ready='interactive';w.document.dispatchEvent(new w.Event('DOMContentLoaded'))},hidden(){return w.getComputedStyle(app).opacity==='0'},close(){w.close()}};
}
test('parsing and successive old layouts stay hidden until the completed menu is stable',async()=>{
 const h=harness();try{
  h.app.innerHTML=publicMenu;h.w.CocoFirstPaint.dataReady();await wait(190);assert.ok(h.hidden());assert.equal(h.paints.length,0);
  h.app.innerHTML='<div class="loginCard"><h2>Entrar</h2></div><div class="retosCard"><h2>Los retos</h2></div>';h.parse();await wait(190);assert.ok(h.hidden());assert.equal(h.app.inert,true);
  h.app.innerHTML=publicMenu.replace('<img class="cocoOfficialThumb" src="memoria.webp">','<span>Icono antiguo</span>');await wait(190);assert.ok(h.hidden());
  h.app.innerHTML=publicMenu;await wait(210);assert.equal(h.hidden(),false);assert.equal(h.paints.length,1);assert.equal(h.paints[0].reason,'ready');assert.match(h.paints[0].content,/memoria.webp/);assert.equal(h.app.inert,false);assert.equal(h.app.hasAttribute('aria-hidden'),false);
 }finally{h.close()}
});
test('a returning account never exposes the temporary login before session selection',async()=>{
 const h=harness();try{h.parse();h.app.innerHTML=publicMenu;await wait(190);assert.ok(h.hidden());
  h.app.innerHTML='<div class="carnet">Jugador de prueba</div><nav class="navegacionJugador"></nav><section class="cocoGruposJuegos"><div class="cocoGameCard"><img class="cocoOfficialThumb" src="memoria.webp"></div></section>';
  h.w.CocoFirstPaint.dataReady();await wait(210);assert.equal(h.paints.length,1);assert.match(h.paints[0].content,/Jugador de prueba/);assert.doesNotMatch(h.paints[0].content,/Entrar/);
 }finally{h.close()}
});
test('late entry modules and fonts finish before the first interactive menu',async()=>{
 const h=harness();try{h.w.CocoFirstPaint.hold('catalog');h.w.CocoFirstPaint.hold('fonts-fixture');h.parse();h.app.innerHTML=publicMenu;h.w.CocoFirstPaint.dataReady();await wait(190);assert.ok(h.hidden());
  h.app.querySelector('.retosCard').insertAdjacentHTML('beforeend','<div class="cocoMiniJuego" data-coco-juego="naval"><img class="cocoOfficialThumb" src="naval.webp"></div>');
  h.w.CocoFirstPaint.settled('catalog');await wait(190);assert.ok(h.hidden());h.w.CocoFirstPaint.settled('fonts-fixture');await wait(210);assert.equal(h.paints.length,1);assert.match(h.paints[0].content,/naval.webp/);
 }finally{h.close()}
});
test('a delayed installation banner restarts the stability check instead of shifting the revealed page',async()=>{
 const h=harness();try{h.parse();h.app.innerHTML=publicMenu;h.w.CocoFirstPaint.dataReady();await wait(90);h.app.insertAdjacentHTML('afterbegin','<div id="cocoInstallEntryV158">Instalar Coco</div>');await wait(90);assert.ok(h.hidden());await wait(120);assert.equal(h.paints.length,1);assert.match(h.paints[0].content,/Instalar Coco/)}finally{h.close()}
});
test('recovery errors remain actionable and later navigation is never masked again',async()=>{
 const h=harness();try{h.parse();h.app.innerHTML='<h2>Conexión interrumpida</h2><button>Volver a intentar</button>';h.w.CocoFirstPaint.dataReady();await wait(210);assert.equal(h.hidden(),false);assert.equal(h.paints[0].reason,'ready');
  let clicked=false;h.app.querySelector('button').onclick=()=>{clicked=true;h.app.innerHTML=publicMenu};h.app.querySelector('button').click();h.w.CocoFirstPaint.hold('late');await wait(190);assert.equal(clicked,true);assert.equal(h.hidden(),false);assert.equal(h.paints.length,1);assert.equal(h.w.document.getElementById('coco-startup-status'),null);
 }finally{h.close()}
});
test('a permanently blocked module releases the page and keyboard controls at the safety deadline',async()=>{
 const h=harness({deadline:160});try{h.parse();h.app.innerHTML='<h2>Recarga la página</h2><button>Reintentar</button>';h.w.CocoFirstPaint.hold('missing');await wait(210);assert.equal(h.paints[0].reason,'fallback');assert.equal(h.hidden(),false);assert.equal(h.app.inert,false);assert.equal(h.app.hasAttribute('aria-hidden'),false)}finally{h.close()}
});
test('without JavaScript the coordinator CSS does not hide the app',()=>{
 const dom=new JSDOM('<style>'+css+'</style><div id="cocoApp"><button>Entrar</button></div>');try{assert.notEqual(dom.window.getComputedStyle(dom.window.document.getElementById('cocoApp')).opacity,'0')}finally{dom.window.close()}
});
