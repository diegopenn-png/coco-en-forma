const {JSDOM,VirtualConsole}=require(process.env.COCO_JSDOM_PATH||'/tmp/coco-naval-qa/node_modules/jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const E=await import('../games/naval/engine.mjs'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('games/naval/index.html','utf8'),{url:'https://cocoenforma.com/games/naval/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 Object.assign(w,E,{structuredClone});Object.defineProperty(w.crypto,'randomUUID',{value:undefined});w.scrollTo=()=>{};w.lockFleet=(s,u,f)=>E.lockFleet(s,u,f,()=>0);w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 let copied='';Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async s=>{copied=s}},configurable:true});
 class FakeOnline{stop(){}async init(){return null}}w.OnlineNaval=FakeOnline;
 w.eval(fs.readFileSync('games/naval/app.mjs','utf8').replace(/^import .*;\n/gm,''));
 const $=s=>d.querySelector(s),click=s=>{assert($(s)&&!$(s).disabled,s);$(s).click()},wait=ms=>new Promise(r=>setTimeout(r,ms)),visible=id=>{assert(!$('#'+id).hidden,id);assert.equal([...d.querySelectorAll('main>.screen')].filter(x=>!x.hidden).length,1)};
 visible('home');click('#playBot');visible('setup');click('[data-level="hard"]');click('#prepareBot');visible('placement');assert($('#ready').disabled);assert.equal(d.querySelectorAll('#placementBoard [data-cell]').length,100);
 click('#placementBoard [data-cell="9"]');assert.match($('#notice').textContent,/sale del tablero/);assert.equal(d.querySelectorAll('.fleet-choice.placed').length,0);
 click('#rotate');click('#placementBoard [data-cell="9"]');assert.equal(d.querySelectorAll('.fleet-choice.placed').length,1);
 click('#autoPlace');assert(!$('#ready').disabled);click('#ready');await wait(10);visible('battle');assert.equal(d.querySelectorAll('#battleBoard .vessels g').length,0,'rival ships hidden');assert($('#shoot').disabled);
 click('#battleBoard [data-cell="44"]');assert.match($('#shoot').textContent,/E5/);click('#shoot');await wait(20);assert($('#shoot').disabled);assert.match($('#turnTitle').textContent,/Coco/);await wait(900);assert.match($('#turnTitle').textContent,/Tu turno/);assert($('#battleBoard [data-cell="44"]').disabled);
 click('[data-board="fleet"]');assert.equal(d.querySelectorAll('#battleBoard .vessels g').length,5);assert($('#shoot').disabled);click('[data-board="attack"]');
 const saved=w.localStorage.getItem('coco-naval-local-v1');click('#back');visible('home');click('#resume');visible('battle');assert.equal(w.localStorage.getItem('coco-naval-local-v1'),saved);
 click('#share');await wait(5);assert.equal(copied,'https://cocoenforma.com/juego/naval/');Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked')}}});click('#share');await wait(5);assert.equal($('.copy-field').value,copied);click('#closeModal');
 click('#resign');assert($('#modal').open);click('#modalBody .primary');await wait(10);visible('finished');click('#viewFinal');visible('battle');assert.equal(d.querySelectorAll('#battleBoard .vessels g').length,5);click('#back');click('#playOnline');await wait(10);visible('online');assert(!$('#login').hidden);assert($('#onlineTools').hidden);
 assert.deepEqual(errors,[]);dom.window.close();console.log('PASS Naval UI: placement, rotation, hidden fleet, confirmed shots, bot turn, resume, copy/fallback, result/reveal, login.');
 // Both catalogue variants must have exactly one icon-only action and no footer copy.
 const catalog=new JSDOM('<div id="cocoApp"><section><article class="cocoMiniJuego" data-coco-city-entry></article></section><section><article class="cocoGameCard" data-coco-city-entry></article></section></div>',{url:'https://cocoenforma.com/',runScripts:'outside-only',pretendToBeVisual:true});
 const style=catalog.window.document.createElement('style');style.textContent=fs.readFileSync('assets/styles/coco-unified-v160127.css','utf8');catalog.window.document.head.append(style);
 catalog.window.eval(fs.readFileSync('games/generala/entry.mjs','utf8'));catalog.window.eval(fs.readFileSync('games/naval/entry.mjs','utf8'));catalog.window.eval(fs.readFileSync('coco-v155-identity.js','utf8'));await wait(80);
 for(const card of catalog.window.document.querySelectorAll('[data-coco-naval-entry],[data-coco-generala-entry]')){assert.equal(catalog.window.getComputedStyle(card).position,'relative','share icon must be anchored inside its own card');assert.equal(card.querySelectorAll('[data-coco-copy-link]').length,1);assert.equal(card.querySelectorAll('.cocoCardShare').length,0);assert.equal(card.querySelector('[data-coco-copy-link]').textContent,'');assert.equal(card.dataset.cocoJuego,undefined);}
 assert.equal(catalog.window.document.querySelectorAll('[data-coco-naval-entry]').length,2);catalog.window.close();console.log('PASS one corner share icon in both catalogues.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
