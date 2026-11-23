const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {JSDOM,VirtualConsole}=require(process.env.COCO_JSDOM_PATH||'jsdom');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const languages=fs.readdirSync(path.join(root,'i18n/packs')).map(file=>file.slice(0,-5));
async function open(route,modules,entry) {
  const dom=new JSDOM(read(route+'/index.html'),{url:'https://coco.test/'+route+'/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window,d=w.document;
  Object.assign(w,{scrollTo(){},matchMedia:()=>({matches:true}),structuredClone});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.fetch=async url=>{const file=new URL(url);assert.match(file.pathname,/^\/i18n\//);return {ok:true,json:async()=>JSON.parse(read(file.pathname))};};
  Object.defineProperty(d,'currentScript',{value:d.querySelector('script[src*="/i18n/coco.js"]')});
  w.eval(read('i18n/coco.js'));await w.CocoLocale.ready;
  for(const module of modules)Object.assign(w,await import(pathToFileURL(path.join(root,route,module+'.mjs'))));
  if(route==='games/naval'){
    const lock=w.lockFleet;w.lockFleet=(state,player,fleet)=>lock(state,player,fleet,()=>0);
  }
  class Offline {stop(){} async init(){return null;}}
  Object.assign(w,{OnlineNaval:Offline,OnlineCity:Offline,OnlineGenerala:Offline});
  w.eval('(()=>{'+read(route+'/'+entry+'.mjs').replace(/^import .*;\n/gm,'')+'\n})()');
  return {dom,w,one:s=>d.querySelector(s),click:s=>d.querySelector(s).click(),wait:()=>new Promise(r=>setTimeout(r,20))};
}
async function check(view,fields) {
  const {w,one}=view;
  const source=fields.map(s=>one(s).textContent.trim());
  for(const lang of [...languages,'es']) {
    await w.CocoLocale.setLanguage(lang);
    for(let i=0;i<fields.length;i++){
      const value=one(fields[i]).textContent.trim(),msg=lang+' '+source[i];
      if(lang==='es')assert.equal(value,source[i],msg);
      else assert.notEqual(value,source[i],msg);
    }
  }
}
test('Naval preserves fleet and target while translating instructions and shot commands in 15 languages',async()=>{
  const v=await open('games/naval',['engine'],'app');
  try{
    v.click('#playBot');v.click('#prepareBot');await check(v,['#placementHint']);
    v.click('#autoPlace');v.click('#ready');await v.wait();v.click('#battleBoard [data-cell="44"]');
    await check(v,['#turnTitle','#shoot']);assert.match(v.one('#shoot').textContent,/E5/);
  }finally{v.dom.window.close();}
});
test('Ciudad translates the active board controls during a local game in 15 languages',async()=>{
  const v=await open('games/ciudad',['content','engine'],'app');
  try{
    v.click('[data-nav="local"]');v.click('#startLocal');await check(v,['#phase','#roll','#status']);
    assert.equal(v.one('#roll').disabled,false);
  }finally{v.dom.window.close();}
});
test('Generala keeps the custom player and dice while translating the score sheet in 15 languages',async()=>{
  const v=await open('games/generala',['engine'],'app');
  try{
    v.click('[data-mode="local"]');
    v.one('#names [name="playerName"]').value='Memoria';
    v.click('#start');v.click('#roll');await v.wait();
    const original=v.one('#players .player b').textContent,die=v.one('[data-die="0"]');
    await check(v,['#turn','#scoreTitle','#filled','[data-score="1"] small']);
    assert.equal(original,'Memoria');assert.equal(v.one('#players .player b').textContent,original);
    assert.equal(die,v.one('[data-die="0"]'));
  }finally{v.dom.window.close();}
});
test('3D gallery translates product detail, cart and checkout in place in 15 languages',async()=>{
  const v=await open('galeria/impresiones-3d',['catalog','shared'],'shop');
  try{
    v.click('[data-detail]');await check(v,['#detail-add']);v.click('#detail-add');v.click('#open-cart');
    await check(v,['[data-remove]']);v.click('#go-delivery');
    const name=v.one('[name="name"]');name.value='Memoria';await check(v,['#submit-order']);
    assert.equal(name.value,'Memoria');assert.equal(v.one('#bag-count').textContent,'1');
  }finally{v.dom.window.close();}
});
test('3D purchase terms preserve the address and contact and offer the Spanish original in every language',async()=>{
  const file='galeria/impresiones-3d/condiciones.html';
  const dom=new JSDOM(read(file),{url:'https://coco.test/'+file,runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  try{
    Object.defineProperty(d,'currentScript',{value:d.querySelector('script[src*="/i18n/coco.js"]')});
    w.fetch=async url=>({ok:true,json:async()=>JSON.parse(read(new URL(url).pathname))});
    w.eval(read('i18n/coco.js'));await w.CocoLocale.ready;
    const nodes=[...d.querySelectorAll('main p,main h1,main h2')];
    const spanish=nodes.map(n=>n.textContent);
    for(const lang of [...languages,'es']){
      await w.CocoLocale.setLanguage(lang);
      nodes.forEach((node,i)=>{
        if(lang==='es')assert.equal(node.textContent,spanish[i]);
        else assert.notEqual(node.textContent,spanish[i],lang+' '+spanish[i]);
      });
      assert.ok(d.querySelector('main').textContent.includes('Calle El Lirio 16, escalera 1, 1.º B, 29640 Fuengirola (Málaga)'));
      assert.equal(d.querySelector('a[href^="mailto:"]').href,'mailto:info@cocoenforma.com');
      assert.equal(d.querySelector('[data-coco-original-document]').hidden,lang==='es');
    }
  }finally{w.close();}
});


test('every timed challenge retains its choices, answer and question when the language switches',async()=>{
  const source=read('index.html');
  const body=source.slice(source.indexOf('  function microQuestion('),source.indexOf('  function startTime('))+
    source.slice(source.indexOf('  function updateTimeLanguage('),source.indexOf('  function timeTick('));
  const {w,dom}=await openTimeHarness();
  try {
    const game=w.eval('('+function(build){
      let seed=12345;
      const active={level:3,rng(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}};
      const dailySerial=()=>0;
      const levelName=()=>'Avanzado';
      const body=document.createElement('section');
      body.innerHTML='<span data-time-mode></span><b class="cocoArcadeQuestionTag"></b><h3 class="cocoTimePrompt"></h3><button data-time-option></button><button data-time-option></button><button data-time-option></button><p data-time-explanation></p>';
      active.game={type:'time'};active.phase='playing';active.locked=true;
      function shuffle(items,rng){
        for(let i=items.length-1;i>0;i--){
          const j=Math.floor(rng()*(i+1));[items[i],items[j]]=[items[j],items[i]];
        }
        return items;
      }
      return eval(build+';({make:microQuestion,display:displayTimeQuestion,active,body})');
    }.toString()+')');
    const {make,display,active,body:screen}=game(body);
    const rounds=Array.from({length:15},(_,index)=>make(index));
    const spanish=rounds.map(q=>JSON.stringify([q.prompt,q.options,q.answer,q.explanation]));
    for(const tag of ['en','es',...languages,'es']){
      await w.CocoLocale.setLanguage(tag);
      for(const [i,q] of rounds.entries()){
        active.question=JSON.parse(JSON.stringify(q)); // Daily missions are loaded from JSON.
        w.dispatchEvent(new w.CustomEvent('coco:language',{detail:{locale:tag}}));
        const shown=display(active.question);
        assert.equal(screen.querySelector('.cocoTimePrompt').textContent,shown.prompt);
        assert.deepEqual([...screen.querySelectorAll('[data-time-option]')].map(b=>b.textContent),Array.from(shown.options));
        assert.equal(screen.querySelector('[data-time-explanation]').textContent,shown.explanation);
        assert.equal(shown.answer,q.answer,tag+' answer index '+i);
        assert.equal(new Set(shown.options).size,3,tag+' distinct choices '+i);
        assert.ok(shown.prompt && shown.explanation && shown.tag);
        assert.doesNotMatch(shown.prompt+' '+shown.options.join(' ')+' '+shown.explanation,/Reto tiempo ·|\{\w+\}/u);
        if(tag!=='es' && (i===5||i===10||i===14)){
          assert.notEqual(shown.prompt,q.prompt,tag+' localized word question '+i);
          assert.ok(shown.explanation.includes(shown.options[q.answer]));
        }
        assert.equal(JSON.stringify([q.prompt,q.options,q.answer,q.explanation]),spanish[i]);
      }
    }
  }finally{dom.window.close();}
});

async function openTimeHarness(){
  const dom=new JSDOM('<html data-coco-extra-languages><head><script src="/i18n/coco.js"></script></head><body><div data-coco-language-menu></div></body></html>',{url:'https://coco.test/',runScripts:'outside-only'});
  const w=dom.window;
  Object.defineProperty(w.document,'currentScript',{value:w.document.querySelector('script')});
  w.fetch=async url=>({ok:true,json:async()=>JSON.parse(read(new URL(url).pathname))});
  w.eval(read('i18n/coco.js'));await w.CocoLocale.ready;
  return {dom,w};
}

function liveBank() {
  const home=read('index.html');
  const dom=new JSDOM(home,{url:'https://coco.test/',runScripts:'outside-only'});
  try {
    const w=dom.window;
    for(const script of w.document.scripts){
      if(script.textContent.includes('window.CocoV134Content = Object.freeze('))w.eval(script.textContent);
      if(script.src && /\/coco-v\d+-content(?:-extension)?\.js$/.test(new URL(script.src).pathname))w.eval(read(new URL(script.src).pathname.slice(1)));
    }
    const start=home.indexOf('var TRUE_FALSE=')+'var TRUE_FALSE='.length;
    const end=home.indexOf(';\n',start);
    return JSON.parse(JSON.stringify(w.eval(home.slice(start,end))));
  } finally {dom.window.close();}
}
test('the runtime true-or-false bank and explanations are available in every language',async()=>{
  const entries=liveBank();
  assert.equal(entries.length,180);
  assert.equal(new Set(entries.map(([statement])=>statement)).size,179);
  for(const tag of languages){
    const copy=JSON.parse(read('i18n/extra/'+tag+'.json')).strings;
    const answers=new Map();
    for(const [statement,answer,explanation] of entries){
      for(const text of [statement,explanation])assert.ok(Object.hasOwn(copy,text)&&copy[text].trim(),tag+' '+text);
      const translated=copy[statement];
      assert.notEqual(translated,statement,tag+' '+statement);
      if(answers.has(translated))assert.equal(answers.get(translated),answer,tag+' '+translated);
      answers.set(translated,answer);
    }
  }
  const {dom,w}=await openTimeHarness();
  try{
    const section=w.document.createElement('section');
    section.dataset.cocoPlaying='verdadero';
    section.innerHTML='<h3>Comprueba esta operación: 17 + 6 = 24.</h3><p>El resultado correcto es 23.</p>';
    w.document.body.append(section);
    for(const tag of [...languages,'es']){
      await w.CocoLocale.setLanguage(tag);
      const formula=section.querySelector('h3').textContent,explanation=section.querySelector('p').textContent;
      assert.ok(formula.includes('17 + 6 = 24'),tag+' generated arithmetic');
      assert.ok(explanation.includes(new Intl.NumberFormat(tag).format(23)),tag+' correct value');
      assert.equal(formula.includes('Comprueba esta operación'),tag==='es');
      assert.equal(explanation.includes('El resultado correcto'),tag==='es');
    }
  }finally{dom.window.close();}
});
