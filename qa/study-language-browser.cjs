const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const locales=['es','en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
const origin=process.env.STUDY_ORIGIN||process.env.COCO_QA_URL||'https://cocoenforma.com';
const player='Mi dinero · 林';
async function setup(browser) {
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  const sent=[];
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===origin&&request.method()==='GET')return route.continue();
    if(url.pathname==='/v1/eneagrama/access')return route.fulfill({json:{master:true,credits:0}});
    if(url.pathname==='/v1/eneagrama/report'){
      sent.push(request.postDataJSON());return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4\n% synthetic authorized response'});
    }
    return route.abort();
  });
  await page.addInitScript(({player})=>{
    const user={id:'00000000-0000-4000-8000-000000000001',email:'coco-qa@example.invalid'};
    const session={user,access_token:'synthetic-local-session'};
    const rows={ajustes:{partidas_por_dia:1},perfiles:{...user,apodo:player,rol:'jugador'},coco_med_profiles:{username:player,display_name:player},coco_med_progress:{correct_answers:0,answered_questions:0,exams_completed:0}};
    function query(table){
      let single=false;
      const chain=new Proxy({}, {get(_,key){
        if(key==='then')return resolve=>resolve({data:single?rows[table]||null:[],count:0,error:null});
        if(['single','maybeSingle'].includes(key))return ()=>{single=true;return chain};
        return ()=>chain;
      }});return chain;
    }
    const cli={auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:query,rpc:()=>query('rpc')};
    window.__COCO_SUPABASE_CLIENT=cli;
    Object.defineProperty(window,'supabase',{configurable:true,get:()=>({createClient:()=>cli}),set(){}});
  },{player});
  return {page,sent};
}
async function assessment(browser,age,saveDir){
  const {page,sent}=await setup(browser);
  try{
    await page.goto(origin+'/explora/jugar.html?lang=en');
    await page.locator('#start').waitFor();
    await page.locator('[name=dob]').fill((new Date().getFullYear()-age)+'-01-01');
    await page.locator('[name=alias]').fill(player);
    for(const n of ['willing','adult'])await page.locator('[name='+n+']').check();
    await page.locator('#start button[type=submit],#start button:not([type])').first().click();
    const title=page.locator('[data-assessment-item]').first(),picker=page.locator('.coco-language-bar select');
    await title.waitFor();const first=new Set();
    await page.locator('[data-value="3"]').click();
    for(const tag of locales){
      await picker.selectOption(tag);
      await page.waitForFunction(t=>window.CocoLocale?.tag===t,tag);
      first.add(await title.textContent());
      assert.equal(await page.locator('[data-value="3"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('[data-value]').count(),5);
    }
    assert.equal(first.size,15,'one distinct first statement for each language');
    // The whole instrument can be answered in one language and reviewed in another.
    await picker.selectOption('ar');await page.waitForFunction(()=>window.CocoLocale.tag==='ar');
    for(let n=0;n<54;n++){await page.locator('[data-value="3"]').click();await page.locator('#next').click()}
    await page.locator('.report').waitFor();
    assert.equal(sent.length,1);assert.equal(Object.keys(sent[0].answers).length,54);
    assert.equal(sent[0].alias,player);
    for(const tag of ['ar','zh-Hans','en']){
      await picker.selectOption(tag);
      await page.waitForFunction(t=>document.documentElement.lang===t&&document.querySelector('#download')?.download==='Coco-Eneagrama-'+t+'.pdf'&&document.querySelector('#download')?.hasAttribute('href'),tag);
      const meta=await page.locator('#download').evaluate(async el=>{const bytes=new Uint8Array(await (await fetch(el.href)).arrayBuffer());return [String.fromCharCode(...bytes.slice(0,7)),bytes.length]});
      assert.equal(meta[0],'%PDF-1.');assert.ok(meta[1]>25000);
      if(saveDir){const download=page.waitForEvent('download');await page.locator('#download').click();await (await download).saveAs(saveDir+'/'+age+'-'+tag+'.pdf');}
    }
    assert.equal(sent.length,1,'language switches reuse the authorized report');
    await page.locator('[data-explora-back]').click();await page.locator('.answer-review').waitFor();
    assert.equal(await page.locator('.answer-review li').count(),54);
    await picker.selectOption('fi');await page.waitForFunction(()=>CocoLocale.tag==='fi');
    assert.equal(await page.locator('.answer-review [data-assessment-item]').first().textContent(),await page.evaluate(()=>CocoLocale.t(document.querySelector('.answer-review [data-assessment-item]').dataset.cocoSourceText||CocoLocale.sourceText(document.querySelector('.answer-review [data-assessment-item]')))));
    await page.locator('#return-report').click();await page.locator('.report').waitFor();assert.equal(sent.length,1);
  }finally{await page.close()}
}
async function med(browser){
  const {page}=await setup(browser);try{
    await page.goto(origin+'/?lang=fr',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CocoMedV148&&window.CocoLocale?.tag==='fr');
    await page.evaluate(()=>window.CocoMedV148.open());
    await page.locator('[data-etapa-index]').first().waitFor();
    const picker=page.locator('select[data-med-locale]');
    await page.locator('[data-etapa-index]').first().click();await page.locator('#medGeneral').click();
    await page.locator('.cocoMedPregunta').waitFor();
    const spanish=await page.locator('.cocoMedOriginal [lang=es] p').first().textContent();
    const originalOptions=await page.locator('.cocoMedOriginal li').allTextContents();
    for(const tag of locales){
      await picker.selectOption(tag);
      await page.waitForFunction(t=>window.CocoLocale.tag===t,tag);
      const options=await page.locator('[data-op] span').allTextContents();
      assert.equal(options.length,3);assert.equal(new Set(options).size,3);
      if(tag==='es'){assert.deepEqual(options,originalOptions);assert.equal(await page.locator('.cocoMedPregunta').textContent(),spanish)}
      else assert.notEqual(await page.locator('.cocoMedPregunta').textContent(),spanish,tag);
    }
    await picker.selectOption('ar');await page.waitForFunction(()=>CocoLocale.tag==='ar');
    await page.locator('[data-op="0"]').click();
    await page.locator('#medFeedback.visible').waitFor();assert.equal(await page.locator('[data-op].correcta').count(),1);
    const right=await page.locator('[data-op].correcta').getAttribute('data-op');
    await picker.selectOption('de');await page.waitForFunction(()=>CocoLocale.tag==='de');
    assert.equal(await page.locator('[data-op].correcta').getAttribute('data-op'),right);
  }finally{await page.close()}
}
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),channel:process.env.COCO_QA_BROWSER_CHANNEL||(!process.env.CHROME_BIN?'chrome':undefined),args:['--no-sandbox']});try{await med(browser);console.log('Medical round, score and original in 15 languages.');for(const a of [9,32]){await assessment(browser,a,process.env.STUDY_PDF_DIR);console.log('Assessment, review and PDF for age',a)}}finally{await browser.close()}})().catch(err=>{console.error(err);process.exitCode=1});
