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
      const games=Array.from({length:279},(_,i)=>({juego:'memoria',puntos:i===0?58:51,creado:'2026-01-01',puntuacion_version:'balanced-v1'}));
      let session={user};
      const rows={eterna_subscriptions:{status:'active',provider:'stripe',plan:'monthly',provider_customer_id:'fixture',provider_subscription_id:'fixture'},eterna_student_profiles:{school_year:'4º de Primaria',autonomous_community:'Región de prueba'},ajustes:{id:1,partidas_por_dia:1},perfiles:{...user,apodo:'Memoria',rol:'jugador',edad:30}};
      function query(table) {
        let single=false;
        const chain=new Proxy({}, {get(_,key){
          if (key==='then') return resolve=>resolve({data:table==='partidas' ? games : single ? rows[table]||null : rows[table]?[rows[table]]:[],count:0,error:null});
          if (key==='single' || key==='maybeSingle') return ()=>{single=true;return chain;};
          return ()=>chain;
        }});
        return chain;
      }
      async function rpc(name) {
        if(name==='racha_de')return {data:0,error:null};
        if(name==='clasificacion_general_coco')return {data:[{jugador:user.id,es_mio:true,apodo:'Memoria',puntos:games.reduce((total,g)=>total+g.puntos,0)}],error:null};
        return {data:[],error:null};
      }
      const client={from:query,rpc,
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
      assert.equal(await page.locator('.carnet .quien strong').innerText(),'Memoria');
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
    async function verifyArtwork(grid,tag,expected) {
      const posterIds=await page.locator(grid).evaluate(async (container,{tag,expected})=>{
        const seen=[];
        for(const id of expected){
          const art=container.querySelector('[data-coco-thumbnail="'+id+'"]');
          const image=art?.querySelector('img');
          if(!image)throw Error(tag+' missing illustration for '+id);
          image.scrollIntoView({block:'center',behavior:'instant'});
          await image.decode();
          const box=image.getBoundingClientRect(),frame=art.parentElement.getBoundingClientRect();
          const width=Math.min(box.right,frame.right)-Math.max(box.left,frame.left);
          const height=Math.min(box.bottom,frame.bottom)-Math.max(box.top,frame.top);
          if(!(width>=36 && height>=18 && image.naturalWidth>0))
            {
              const sizes=[];
              for(let el=image;el&&el!==container.parentElement;el=el.parentElement){
                const b=el.getBoundingClientRect(),css=getComputedStyle(el);
                sizes.push([el.className,b.width,b.height,css.display,css.gridTemplateColumns]);
              }
              throw Error(tag+' clipped illustration for '+id+': '+JSON.stringify(sizes));
            }
          for(const caption of art.querySelectorAll('[data-coco-source-text]')){
            const translated=window.CocoLocale.t(caption.getAttribute('data-coco-source-text'));
            if(!translated || caption.textContent!==translated)throw Error(tag+' wrong caption for '+id);
          }
          seen.push(id);
        }
        return seen;
      },{tag,expected});
      assert.deepEqual(posterIds,expected);
    }
    const grid='.cocoGridUnificada';
    await picker.selectOption('es');await page.waitForFunction(()=>document.documentElement.lang==='es');
    const spanish=await catalog(grid);
    assert.equal(new Set(spanish).size,spanish.length);
    assert.ok(['conecta','sopa','ajedrez','crucigrama','ciudad','naval','bank','eneagrama'].every(id=>spanish.includes(id)));
    console.log('Spanish catalogue ('+spanish.length+'): '+spanish.join(', '));
    const profile=page.locator('.carnet');
    const launcher=page.locator('#eternaLauncherV159');
    const score=14236;
    assert.equal(await profile.locator('.quien .pequeno').textContent(),'279 partidas jugadas');
    const fields=[
      [profile.locator('.cocoFamiliaBtn span'),'Zona familiar'],
      [profile.locator('.tanteo .pequeno'),'puntos de clasificación'],
      [launcher.locator('.eternaLauncherEyebrowV159'),'✨ ETERNA · LISTA PARA AYUDARTE'],
      [launcher.locator('h2'),'Eterna · tu ayuda escolar'],
      [launcher.locator('.eternaLauncherCopyFinal3 p'),'Continúa una tarea, resuelve una duda o practica lo que más te cuesta.'],
      [launcher.locator('.eternaLauncherCtaFinal3'),'Abrir Eterna']
    ];
    for(const tag of await picker.locator('option').evaluateAll(opts=>opts.map(o=>o.value))){
      await picker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.deepEqual(await controls.evaluateAll(nodes=>nodes.map(x=>x.dataset.playerMenu)),['challenges','cards','ranking','prints']);
      assert.equal(await menu.locator(':scope > .pestanaJugador:visible').count(),4);
      assert.equal(new URL(await controls.last().getAttribute('href'),origin).searchParams.get('lang'),tag);
      assert.equal(await profile.locator('.quien strong').textContent(),'Memoria',tag+' nickname');
      assert.equal(await profile.locator('.tanteo b').textContent(),score.toLocaleString(tag),tag+' score');
      const expected=source=>page.evaluate(s=>CocoLocale.t(s),source);
      const number=new Intl.NumberFormat(tag).format(279);
      const games=tag==='es'?'279 partidas jugadas':(await expected('Partidas jugadas: {n}')).replace('{n}',number);
      assert.equal(await profile.locator('.quien .pequeno').textContent(),games,tag+' games played');
      for(const [el,source] of fields) {
        const translated=await expected(source);
        if(tag!=='es')assert.notEqual(translated,source,tag+' missing '+source);
        assert.equal(await el.textContent(),translated,tag+' '+source);
      }
      const pills=launcher.locator('.eternaLauncherPillV159');
      for(const [i,[icon,key]] of [['📚','Tareas'],['🎯','Practicar'],['🧠','Explicar'],['✅','Revisar']].entries()){
        const translated=await expected(key);
        assert.equal(await pills.nth(i).textContent(),icon+' '+translated,tag+' '+key);
      }
      if(tag==='de'){
        assert.equal(await profile.locator('.cocoFamiliaBtn span').textContent(),'Familienbereich');
        assert.equal(await profile.locator('.tanteo .pequeno').textContent(),'Ranglistenpunkte');
        assert.equal(games,'Gespielte Partien: 279');
      }
      assert.ok((await controls.locator('b').allTextContents()).every(t=>t.trim()));
      if(tag==='es')assert.deepEqual(await controls.locator('b').allTextContents(),['Mis retos','Mis tarjetas','Mi clasificación','Impresiones 3D']);
      await controls.nth(1).click();await page.locator('.panelJugador.activa:not([data-coco-panel="games"])').waitFor();
      await controls.first().click();await page.locator('[data-coco-panel="games"].activa').waitFor();
      assert.deepEqual(await catalog(grid),spanish,tag+' complete game list and order');
      if(tag!=='es')await verifyArtwork(grid,tag,spanish);
    }
    await picker.selectOption('de');await page.waitForFunction(()=>document.documentElement.lang==='de');
    await profile.locator('.cocoFamiliaBtn').click();
    await page.locator('.cocoFamilyPin input[placeholder="••••"]').fill('6382');
    await page.locator('[data-family-enter]').click();
    const plan=page.locator('[data-et-current-plan="monthly"]');
    await plan.waitFor({timeout:25000});
    const labels=[
      [plan.locator('h5'),'Plan mensual'],[plan.locator('.eternaV16079CurrentPlanLabel'),'TU PLAN ACTUAL'],
      [plan.locator('.eternaV16079CurrentPlanMeta'),'Suscripción activa'],[plan.locator('[data-et-v16079-manage]'),'Gestionar suscripción'],
      [plan.locator('.eternaV16079Alternative b'),'Ahorra con el plan anual'],[plan.locator('[data-et-v16080-switch]'),'Cambiar a plan anual'],
      [page.locator('.cocoFamilyProfileV160100Head p'),'La fecha mantiene la edad al día. Eterna sigue usando el curso actual como referencia académica.']
    ];
    // Exercise the actual open dialog and preserve its form values across locale changes.
    const familyPicker=page.locator('.cocoFamilyV129 [data-coco-family-picker] select');
    await familyPicker.waitFor();
    for(const tag of await familyPicker.locator('option').evaluateAll(opts=>opts.map(o=>o.value))){
      await familyPicker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      for(const [el,source] of labels){
        const expected=await page.evaluate(s=>CocoLocale.t(s),source);
        if(tag!=='es')assert.notEqual(expected,source,tag+' family '+source);
        assert.equal(await el.textContent(),expected,tag+' open family '+source);
      }
    }
    await page.locator('.cocoFamilyV129 [data-family-back]').click();
    console.log('Paid family area and school profile in 15 languages.');
    await picker.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
    const padelCard=page.locator(grid+' > [data-coco-juego="padel"]');
    await padelCard.locator('.cocoBotonJuego,button.btn').first().click();
    const padel=page.locator('.cocoV144Modal.visible[data-module="padel"]');
    await padel.locator('[data-padel144-view="players"]').click();
    const courtPicker=padel.locator('[data-coco-game-picker] select');
    for(const tag of await courtPicker.locator('option').evaluateAll(options=>options.map(item=>item.value))){
      await courtPicker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      const heading=await page.evaluate(()=>CocoLocale.t('Directorio del club'));
      assert.ok((await padel.innerText()).includes(heading),tag+' club directory');
    }
    await padel.locator('.cocoGameNavigation button').last().click();
    await picker.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
    console.log('Coco Pádel player directory in 15 languages.');
    // Capture the actual lettering drawn into the downloadable file.
    await page.evaluate(()=>{
      window.cocoDownloadLetters=[];
      const original=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,...args){
        if(this.canvas.width===1200&&this.canvas.height===630)window.cocoDownloadLetters.push(String(text));
        return original.call(this,text,...args);
      };
      window.CocoShareToolV1('bank');
    });
    const share=page.locator('.cocoShareModal');
    const download=share.locator('.cocoDownloadCard');
    for(const tag of await picker.locator('option').evaluateAll(options=>options.map(o=>o.value))){
      await page.evaluate(tag=>window.CocoLocale.setLanguage(tag),tag);
      const file=tag==='es'?'coco-bank.jpg':'coco-bank-'+tag+'.jpg';
      await page.waitForFunction(file=>document.querySelector('.cocoShareModal .cocoDownloadCard')?.download===file,file);
      if(tag!=='es'){
        const dimensions=await download.evaluate(async a=>{
          if(!a.href.startsWith('data:image/jpeg;base64,'))return [];
          const img=new Image();img.src=a.href;await img.decode();return [img.naturalWidth,img.naturalHeight];
        });
        assert.deepEqual(dimensions,[1200,630],tag+' localized downloadable JPEG');
        const lettering=await page.evaluate(()=>({
          observed:window.cocoDownloadLetters.slice(-2),
          expected:['Coco Bank','Gestiona tu dinero'].map(key=>window.CocoLocale.t(key))
        }));
        assert.deepEqual(lettering.observed,lettering.expected,tag+' lettering drawn into the JPEG');
      }
    }
    await share.locator('[data-share-close]').click();
    console.log('Downloadable catalogue thumbnail in 15 languages passed.');
    await picker.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
    const truthCard=page.locator(grid+' > [data-coco-juego="verdadero"]');
    await truthCard.locator('.cocoBotonJuego,button.btn').first().click();
    const quiz=page.locator('.cocoArcadeOverlay.visible[data-coco-playing="verdadero"]');
    const quizPicker=quiz.locator('[data-coco-game-picker] select');
    await quizPicker.waitFor();
    await quiz.locator('[data-arcade-start]').click();
    const question=quiz.locator('.cocoArcadePrompt');
    await question.waitFor();
    await quizPicker.selectOption('es');
    await page.waitForFunction(()=>document.documentElement.lang==='es');
    const original=await question.textContent();
    for(const tag of await quizPicker.locator('option').evaluateAll(options=>options.map(o=>o.value))){
      await quizPicker.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      const prompt=await question.textContent();
      if(tag==='es')assert.equal(prompt,original);
      else assert.notEqual(prompt,original,tag+' current question');
      assert.equal(await quiz.locator('[data-option]:enabled').count(),2,tag+' same active round');
    }
    await quizPicker.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
    const mainMenu=quiz.locator('.cocoGameNavigation button').last();
    const [confirmation]=await Promise.all([
      page.waitForEvent('dialog').then(async dialog=>{
        const message=dialog.message();await dialog.dismiss();return message;
      }),
      mainMenu.click()
    ]);
    assert.equal(confirmation,'Return to your challenges? This round will not be saved.');
    assert.ok(await question.isVisible(),'cancelling leaves the same round open');
    await Promise.all([page.waitForEvent('dialog').then(dialog=>dialog.accept()),mainMenu.click()]);
    await picker.waitFor();
    console.log('Active true-or-false round in 15 languages and native exit confirmation passed.');

    await page.evaluate(()=>window.CocoEternaV160.open());
    const tutor=page.locator('#eternaOverlayV159.is-open');
    const inside=tutor.locator('[data-eterna-picker] select');
    await inside.waitFor();
    for(const tag of await inside.locator('option').evaluateAll(opts=>opts.map(o=>o.value))){
      await inside.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      assert.ok(await inside.isVisible(),tag+' tutor picker visible');
      assert.equal(await tutor.locator('.eternaV159Close').getAttribute('aria-label'),await page.evaluate(()=>CocoLocale.t('Cerrar Eterna')));
      if(tag!=='es')assert.notEqual(await tutor.locator('.eternaV159Close').getAttribute('aria-label'),'Cerrar Eterna');
    }
    await inside.selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
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
      if(tag!=='es')await verifyArtwork('.cocoMiniJuegos',tag,spanish);
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
