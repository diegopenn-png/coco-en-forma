const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {JSDOM}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(root+'/index.html','utf8');
const med=html.match(/<script id="coco-med-pro-v3-js">([\s\S]*?)<\/script>/)[1];
const bankPath=med.match(/fetch\("\.\/(assets\/data\/coco-med-[a-f0-9]+\.json)"/)[1];
const bank=JSON.parse(fs.readFileSync(path.join(root,bankPath),'utf8'));

test('initial document is under 900 KB and preserves all 4,500 medical questions',()=>{
  assert.ok(Buffer.byteLength(html)<900000);
  assert.doesNotMatch(html,/data:image\/png;base64,/);
  assert.equal(bank.length,4500);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,bankPath),'utf8').trimEnd()).digest('hex').slice(0,12),'cda16aea8bb4');
  for(const [,attrs,body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(!/type="(?:module|application\/ld\+json)"/.test(attrs))new vm.Script(body);
  }
});

function medHarness(fetchImpl){
  const dom=new JSDOM('<div id="cocoApp"></div>',{url:'https://coco.test/',runScripts:'outside-only'});
  const w=dom.window;
  const records={perfiles:{apodo:'Prueba'},coco_med_profiles:{username:'prueba',display_name:'Prueba'},coco_med_progress:{correct_answers:0,answered_questions:0,exams_completed:0,best_score:0,stage_progress:{},current_streak:0}};
  const cli={auth:{getSession:async()=>({data:{session:{user:{id:'fixture',email:'fixture@example.test'}}}})},from(table){return new Proxy({},{get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve({data:records[table],error:null}).then(resolve,reject):()=>cli.from(table)})}};
  w.__COCO_SUPABASE_CLIENT=cli;w.supabase={createClient:()=>cli};w.COCO_CONFIG={};
  w.fetch=fetchImpl;w.AbortController=AbortController;w.scrollTo=()=>{};
  w.eval(med);
  return {w,close:()=>w.close()};
}

test('medical questions load on demand, show every stage, and are reused on reopen',async()=>{
  let calls=0;
  const h=medHarness(async()=>{calls++;return{ok:true,json:async()=>bank}});
  try{
    assert.equal(calls,0);
    await h.w.CocoMedV148.open();
    assert.equal(calls,1);
    assert.ok(h.w.document.querySelectorAll('[data-etapa-index]').length>=8);
    h.w.CocoMedV148.close();
    await h.w.CocoMedV148.open();
    assert.equal(calls,1);
  }finally{h.close()}
});

test('a failed question download gives a retry and leaves navigation available',async()=>{
  let fail=true,calls=0;
  const h=medHarness(async()=>{calls++;if(fail)throw Error('offline');return{ok:true,json:async()=>bank}});
  try{
    await h.w.CocoMedV148.open();
    assert.ok(h.w.document.querySelector('#medReintentarError'));
    assert.equal(h.w.document.querySelector('#cocoMedVolverSuperior').disabled,false);
    fail=false;
    await h.w.CocoMedV148.open();
    assert.equal(calls,2);
    assert.ok(h.w.document.querySelectorAll('[data-etapa-index]').length>=8);
  }finally{h.close()}
});

test('closing Coco Med while questions load does not reopen the overlay',async()=>{
  let finish;
  const h=medHarness(()=>new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>bank})}));
  try{
    const opening=h.w.CocoMedV148.open();
    h.w.CocoMedV148.close();finish();await opening;
    assert.equal(h.w.document.querySelector('#cocoMedOverlay').classList.contains('abierto'),false);
  }finally{h.close()}
});

test('offline installation limits concurrency and still caches every core URL',async()=>{
  let active=0,peak=0;const requested=[],stored=[];
  const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,caches:{open:async()=>({put:async(u)=>stored.push(u)})},fetch:async req=>{requested.push(req.url);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;return new Response('ok')},self:{registration:{scope:'https://coco.test/'},navigator:{userAgent:'test'},addEventListener(){}}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/sw.js','utf8'),ctx);
  await vm.runInContext('cacheCore()',ctx);
  assert.equal(peak,4);assert.ok(requested.length>100);assert.equal(stored.length,requested.length);
  assert.ok(requested[0].includes('/index.html?'));
  assert.ok(!requested.some(x=>x.includes(bankPath)));
});

test('collection metadata retains 23 items and gift Product keeps its honest offer',()=>{
  const schema=p=>JSON.parse(fs.readFileSync(root+'/'+p,'utf8').match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const collection=schema('galeria/impresiones-3d/index.html');
  assert.equal(collection['@type'],'CollectionPage');
  assert.equal(collection.mainEntity.itemListElement.length,23);
  assert.ok(collection.mainEntity.itemListElement.every(x=>x.name&&x.image&&x.description));
  assert.ok(!JSON.stringify(collection).includes('"@type":"Product"'));
  const product=schema('regalos/index.html')['@graph'].find(x=>x['@type']==='Product');
  assert.equal(product.brand.name,'Flores y tarta');
  assert.equal(product.offers.price,'120.00');
  assert.equal(product.offers.shippingDetails,undefined);
  assert.equal(product.offers.hasMerchantReturnPolicy,undefined);
});
