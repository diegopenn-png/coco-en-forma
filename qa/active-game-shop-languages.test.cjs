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
