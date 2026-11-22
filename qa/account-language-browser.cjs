const assert = require('node:assert/strict');
const {chromium} = require('playwright');

async function run(browser, origin, standalone) {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try {
    // Load the shipped UI against an in-memory account. No sign-in or database requests leave the browser.
    await page.route('**/*',route=>{
      const req=route.request();
      return new URL(req.url()).origin===origin && req.method()==='GET' ? route.continue() : route.abort();
    });
    await page.addInitScript(standalone=>{
      Object.defineProperty(navigator,'standalone',{value:standalone,configurable:true});
      const user={id:'00000000-0000-4000-8000-000000000001',email:'coco-qa@example.invalid'};
      let session={user};
      const rows={ajustes:{id:1,partidas_por_dia:1},perfiles:{...user,apodo:'Coco QA',rol:'jugador',edad:30}};
      function query(table) {
        let single=false;
        const chain=new Proxy({}, {get(_,key){
          if (key==='then') return resolve=>resolve({data:single ? rows[table]||null : rows[table]?[rows[table]]:[],count:0,error:null});
          if (key==='single' || key==='maybeSingle') return ()=>{single=true;return chain;};
          return ()=>chain;
        }});
        return chain;
      }
      const client={from:query,rpc:async name=>({data:name==='racha_de'?0:[],error:null}),
        auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user:session?.user}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{session=null;return {error:null};}},
        channel:()=>({on(){return this;},subscribe(){return this;},unsubscribe(){}}),removeChannel(){}};
      window.__COCO_SUPABASE_CLIENT=client;window.supabase={createClient:()=>client};
    },standalone);
    await page.goto(origin+'/?source='+(standalone?'pwa-v159':'web')+'&verify='+Date.now(),{waitUntil:'domcontentloaded'});
    const picker=page.locator('#cocoApp > [data-coco-account-header] select');
    await page.locator('.carnet').waitFor();
    await picker.waitFor();
    assert.equal(await picker.locator('option').count(),15);
    for (const [width,height,tag] of [[390,844,'fi'],[844,390,'ar'],[320,568,'en']]) {
      await page.setViewportSize({width,height});
      await picker.scrollIntoViewIfNeeded();
      await picker.tap({trial:true});
      assert.equal(await page.locator('.coco-language-bar select:visible').count(),1);
      const box=await picker.boundingBox();
      assert.ok(box && box.x>=0 && box.x+box.width<=width+1 && box.height>=44,'account picker geometry: '+JSON.stringify(box));
      await picker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.equal(await picker.inputValue(),tag);
      assert.equal(await page.locator('.carnet .quien strong').innerText(),'Coco QA');
    }
    const menu = page.locator('.navegacionJugador');
    const controls = menu.locator(':scope > [data-player-menu]');
    await controls.nth(3).waitFor();
    async function catalog(selector) {
      const cards=page.locator(selector);
      await cards.locator('[data-coco-naval-entry]').waitFor();
      return cards.evaluate(grid=>Array.from(grid.children).flatMap(card=>{
        const extensions=[['cocoChessEntry','ajedrez'],['cocoCityEntry','ciudad'],['cocoGeneralaEntry','generala'],['cocoNavalEntry','naval']];
        const id=extensions.find(([attr])=>card.dataset[attr])?.[1]||card.dataset.cocoJuego;
        return id && !card.hasAttribute('data-coco-suggestion') ? [id] : [];
      }));
    }
    const grid='.cocoGridUnificada';
    await picker.selectOption('es');await page.waitForFunction(()=>document.documentElement.lang==='es');
    const spanish=await catalog(grid);
    assert.equal(new Set(spanish).size,spanish.length);
    assert.ok(['conecta','sopa','ajedrez','crucigrama','ciudad','naval','bank','eneagrama'].every(id=>spanish.includes(id)));
    console.log('Spanish catalogue ('+spanish.length+'): '+spanish.join(', '));
    for(const tag of await picker.locator('option').evaluateAll(opts=>opts.map(o=>o.value))){
      await picker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.deepEqual(await controls.evaluateAll(nodes=>nodes.map(x=>x.dataset.playerMenu)),['challenges','cards','ranking','prints']);
      assert.equal(await menu.locator(':scope > .pestanaJugador:visible').count(),4);
      assert.equal(new URL(await controls.last().getAttribute('href'),origin).searchParams.get('lang'),tag);
      assert.ok((await controls.locator('b').allTextContents()).every(t=>t.trim()));
      if(tag==='es')assert.deepEqual(await controls.locator('b').allTextContents(),['Mis retos','Mis tarjetas','Mi clasificación','Impresiones 3D']);
      await controls.nth(1).click();await page.locator('.panelJugador.activa:not([data-coco-panel="games"])').waitFor();
      await controls.first().click();await page.locator('[data-coco-panel="games"].activa').waitFor();
      assert.deepEqual(await catalog(grid),spanish,tag+' complete game list and order');
    }
    await picker.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
    await page.evaluate(()=>window.CocoEternaV160.open());
    const tutor=page.locator('#eternaOverlayV159.is-open');
    const inside=tutor.locator('[data-eterna-picker] select');
    await inside.waitFor();
    for(const tag of ['de','ar','zh-Hans','en']){
      await inside.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.ok(await inside.isVisible(),tag+' tutor picker visible');
      assert.equal(await tutor.locator('.eternaV159Close').getAttribute('aria-label'),await page.evaluate(()=>CocoLocale.t('Cerrar Eterna')));
      assert.notEqual(await tutor.locator('.eternaV159Close').getAttribute('aria-label'),'Cerrar Eterna');
    }
    await tutor.locator('.eternaV159Close').click();
    await picker.waitFor();
    await page.reload({waitUntil:'domcontentloaded'});await picker.waitFor();
    await page.waitForFunction(()=>document.documentElement.lang==='en');
    assert.equal(await picker.inputValue(),'en');
    await page.locator('#cocoApp > [data-coco-account-header] .fin > button').tap();
    await page.locator('.loginCard').waitFor();
    const publicPicker=page.locator('body > [data-coco-language-menu] select');
    await publicPicker.waitFor();
    assert.equal(await publicPicker.inputValue(),'en');
    for(const tag of await publicPicker.locator('option').evaluateAll(opts=>opts.map(o=>o.value))){
      await publicPicker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.deepEqual(await catalog('.cocoMiniJuegos'),spanish,tag+' public and signed-in catalogue order');
    }
    assert.equal(await page.locator('.coco-language-bar select:visible').count(),1);
    console.log((standalone?'Standalone':'Web')+' account header, portrait/landscape, stored language and logout passed.');
  } finally {await page.close();}
}
(async()=>{
  const browser=await chromium.launch({channel:process.env.COCO_QA_BROWSER_CHANNEL||'chrome'});
  try {
    const origin=new URL(process.env.COCO_QA_URL||'http://127.0.0.1:8372').origin;
    for (const standalone of [false,true]) await run(browser,origin,standalone);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
