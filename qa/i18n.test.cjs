const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');

const root = path.resolve(__dirname, '..');
const locales = ['es','en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
const code = fs.readFileSync(path.join(root,'i18n/coco.js'),'utf8');
const readPack = id => JSON.parse(fs.readFileSync(path.join(root,'i18n/packs',id+'.json'),'utf8'));

function page(url='https://coco.test/?source=pwa-v159',customFetch,remembered,extraHtml='') {
  const body = '<div data-coco-language-menu></div><div class="loginCard"><label for="pw">Contraseña</label><input id="pw" type="password"><button>Entrar</button></div><div data-coco-juego="cocomed"><b>Coco Med</b></div><table><tbody><tr><td>Memoria</td><td>23</td></tr></tbody></table>';
  const dom = new JSDOM('<html lang="es"><head><link rel="manifest" href="/manifest.webmanifest"></head><body>'+body+'</body></html>',{url,runScripts:'outside-only'});
  const w=dom.window;
  if(extraHtml)w.document.body.insertAdjacentHTML('beforeend',extraHtml);
  const script=w.document.createElement('script');script.src='/i18n/coco.js';
  Object.defineProperty(w.document,'currentScript',{get:()=>script});
  w.fetch=customFetch || (async url => ({ok:true,json:async()=>readPack(path.basename(url.pathname,'.json'))}));
  if(remembered)w.localStorage.setItem('coco.language.v1',remembered);
  w.eval(code);
  return {w,dom,doc:w.document,api:w.CocoLocale};
}

test('all QH locales keep the original account fields, scores and PWA identity',async()=>{
  const {doc,w,api,dom}=page();
  try {
    await api.ready;
    const notice=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<div class="cocoFreeGamesNotice"[^>]*>[\s\S]*?<\/div>/)[0];
    doc.querySelector('.loginCard').insertAdjacentHTML('afterbegin',notice);
    const commercial=doc.createElement('section');commercial.className='cocoFreemiumV16084';
    commercial.innerHTML=fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8').match(/block\.innerHTML='([^']+)';/)[1];
    const evaluation=doc.createElement('p');evaluation.className='cocoDescripcion';
    evaluation.textContent=fs.readFileSync(path.join(root,'coco-v155-identity.js'),'utf8').match(/eneagrama:\{name:"Coco Eneagrama",description:"([^"]+)"/)[1];
    doc.body.append(commercial,evaluation);
    const commerce=[...doc.querySelectorAll('.cocoFreeGamesNotice b,.cocoFreeGamesNotice p,.cocoFreemiumV16084 b,.cocoFreemiumV16084 strong,.cocoFreemiumV16084 small'),evaluation].map(el=>[el,el.textContent]);
    const experience=fs.readFileSync(path.join(root,'eterna-experience-v160.js'),'utf8');
    const start=experience.indexOf('  function ensureSignupLegalNotice()');
    const end=experience.indexOf('  function installCapture()',start);
    w.Function(experience.slice(start,end)+';ensureSignupLegalNotice()')();
    const adultNotice=doc.querySelector('.cocoLegalSignupNoticeV16058');
    const noticeText=adultNotice.firstChild.textContent.trim();
    doc.querySelector('input').value='synthetic-value';
    for(const locale of locales) {
      assert.equal(await api.setLanguage(locale),true);
      assert.equal(doc.documentElement.lang,locale);
      assert.equal(doc.documentElement.dir,locale==='ar'?'rtl':'ltr');
      const text=locale==='es'?'Contraseña':readPack(locale).strings['Contraseña'];
      assert.equal(doc.querySelector('label').textContent,text);
      assert.equal(adultNotice.firstChild.textContent.trim(),api.t(noticeText));
      if(locale!=='es')assert.notEqual(api.t(noticeText),noticeText);
      assert.equal(adultNotice.querySelectorAll('a').length,2);
      assert.equal(doc.querySelector('input').value,'synthetic-value');
      for(const [el,source] of commerce){
        if(locale!=='es')assert.ok(readPack(locale).strings[source],locale+' / '+source);
        assert.equal(el.textContent,api.t(source),locale+' / '+source);
      }
      assert.deepEqual([...doc.querySelectorAll('td')].map(td=>td.textContent),['Memoria','23']);
      assert.equal(w.localStorage.getItem('coco.language.v1'),locale);
      const badge=doc.querySelector('[data-game-language]');
      assert.equal(badge,null);
      const manifestPath=new URL(doc.querySelector('link').href).pathname;
      const manifest=JSON.parse(fs.readFileSync(path.join(root,manifestPath),'utf8'));
      assert.equal(new URL(manifest.id,'https://coco.test'+manifestPath).pathname,'/');
      for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root,new URL(icon.src,'https://coco.test'+manifestPath).pathname)));
    }
    await api.setLanguage('es');
    assert.equal(doc.querySelector('.loginCard button').textContent,'Entrar');
  } finally {dom.window.close();}
});

test('the real Eterna launcher patch keeps translated trial copy and opens the translated signup control',async()=>{
  const {api,w,doc,dom}=page('https://coco.test/?lang=zh-Hans',undefined,undefined,
    '<main id="cocoApp"><section class="loginCard"><button type="button" data-signup>Crear cuenta</button></section></main>');
  const source=fs.readFileSync(path.join(root,'eterna-v159.js'),'utf8');
  const experience=fs.readFileSync(path.join(root,'eterna-experience-v160.js'),'utf8');
  const start=source.indexOf('  function findCreateAccountControl(){');
  const end=source.indexOf('  function createBrainPanel(',start);
  const patchStart=experience.indexOf('/* ETERNA v160.70 · STATE MACHINE DE LANZAMIENTO');
  const patchEnd=experience.indexOf('/* ETERNA Spoken Dialogue',patchStart);
  assert.ok(start>=0&&end>start&&patchStart>=0&&patchEnd>patchStart);
  try {
    await api.ready;
    const app=doc.getElementById('cocoApp'),login=app.querySelector('.loginCard');
    const signup=app.querySelector('[data-signup]');
    let signupClicks=0,closed=0,remembered=0;
    signup.onclick=()=>{signupClicks++;};
    const fail=()=>{throw Error('the launcher must open signup instead of the tutor while logged out');};
    const launcher=w.Function('visible','rememberEternaAfterAuth','open',
      source.slice(start,end)+';return createLauncher();')(()=>true,()=>{remembered++;},fail);
    app.append(launcher);
    api.refresh(launcher);
    const cta=launcher.querySelector('.eternaLauncherCtaFinal3');
    // The base launcher can be clicked before the experience module arrives.
    for(const locale of locales){
      await api.setLanguage(locale);
      const trial=launcher.querySelector('.eternaLauncherTrialFinal3');
      assert.equal(cta.textContent,api.t('Probar Eterna gratis 7 días'),locale+' initial CTA');
      assert.equal(trial.querySelector('strong').textContent,'⭐ '+api.t('7 días gratis'),locale+' initial trial');
      assert.equal(trial.querySelector('span').textContent,api.t('Sin tarjeta ni datos bancarios para empezar.'),locale+' initial no card');
      const before=signupClicks;
      cta.click();
      assert.equal(signupClicks,before+1,locale+' base signup click');
    }
    assert.equal(remembered,locales.length);
    const baseClicks=signupClicks;
    await api.setLanguage('zh-Hans');
    const authChanges=[],frames=[];
    w.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:null}}),
      onAuthStateChange:handler=>{authChanges.push(handler);}}};
    w.CocoEternaV160={close:()=>{closed++;}};
    w.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
    // Execute the actual lazy-loaded state-machine patch after the Chinese shell.
    w.eval(experience.slice(patchStart,patchEnd));
    assert.equal(authChanges.length,1);
    const trial=launcher.querySelector('.eternaLauncherTrialFinal3');
    const assertCopy=()=>{
      assert.equal(cta.textContent,api.t('Probar Eterna gratis 7 días'),api.tag+' CTA');
      assert.equal(trial.querySelector('strong').textContent,'⭐ '+api.t('7 días gratis'),api.tag+' trial');
      assert.equal(trial.querySelector('span').textContent,api.t('Sin tarjeta ni datos bancarios para empezar.'),api.tag+' no card');
    };
    for(const locale of ['zh-Hans',...locales.filter(l=>l!=='zh-Hans'),'es']) {
      await api.setLanguage(locale);
      if(locale!=='es')for(const phrase of ['7 días gratis','Sin tarjeta ni datos bancarios para empezar.','Probar Eterna gratis 7 días']) {
        assert.ok(readPack(locale).strings[phrase],locale+' / '+phrase);
        assert.notEqual(api.t(phrase),phrase,locale+' must not fall back to Spanish');
      }
      // Auth callbacks and the scheduled normalizer must render in the active
      // language synchronously, without first flashing the Spanish patch text.
      authChanges[0]('SIGNED_OUT',null);
      frames.forEach(callback=>callback());
      assertCopy();
      assert.equal(api.sourceText(cta),'Probar Eterna gratis 7 días');
      assert.equal(api.sourceText(signup),'Crear cuenta');
      const before=signupClicks;
      cta.click();
      assert.equal(signupClicks,before+1,locale+' translated signup click');
      assert.equal(launcher.querySelector('[data-eterna-language-note]'),null);
      login.style.display='none';
      authChanges[0]('SIGNED_IN',null);
      assert.equal(cta.textContent,api.t('Abrir Eterna'),locale+' signed-in CTA');
      login.style.display='';
    }
    assert.equal(closed,signupClicks-baseClicks);
    assert.equal(doc.querySelectorAll('[data-signup]').length,1);
  } finally {await new Promise(resolve=>setTimeout(resolve,0));dom.window.close();}
});

test('signup renders the adult and guardian consent, links and data notice in every language',async()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ageLogic=html.match(/function actualizarRegistroEdad\(\)\{[\s\S]*?\}edadInput\.addEventListener/)[0].split('}edadInput.addEventListener')[0]+'}';
  const intro=html.match(/<p class="pequeno apagado" id="rIntro">[\s\S]*?<\/p>/)[0];
  const nameField=html.match(/<input id="rNom"[^>]+>/)[0];
  const legal=html.slice(html.indexOf('  function informarRegistro(){'),html.indexOf('  function preparar(){',html.indexOf('  function informarRegistro(){')));
  const markup='<main id="cocoApp"><div class="caja">'+intro+nameField+'<input id="rEdad"><label id="rMailLabel"></label><p id="rMailAyuda"></p><span id="rConsentText"></span><input id="rPas2"></div></main>';
  const {api,w,doc,dom}=page('https://coco.test/',undefined,undefined,markup);
  try {
    await api.ready;
    w.Function(legal+';informarRegistro()')();
    const consent=doc.querySelector('#rConsentText'), age=doc.querySelector('#rEdad');
    const update=w.Function('edadInput','mailLabel','mailAyuda','consentText','o',ageLogic+';return actualizarRegistroEdad')(age,doc.querySelector('#rMailLabel'),doc.querySelector('#rMailAyuda'),consent,'/politica-de-privacidad.html');
    for(const tag of locales){
      await api.setLanguage(tag);
      for(const years of [35,12]){
        age.value=String(years); update();
        const canonical=consent.firstChild.data.trim();
        await new Promise(resolve=>setTimeout(resolve,0));
        assert.equal(consent.firstChild.data.trim(),api.t(canonical));
        assert.equal(consent.querySelector('a').textContent,api.t('política de privacidad'));
        assert.equal(consent.querySelectorAll('a').length,2);
        if(tag!=='es'){
          assert.notEqual(consent.firstChild.data.trim(),canonical,tag+' consent');
          assert.doesNotMatch(doc.querySelector('#rIntro').textContent,/Los menores deben hacerlo/);
          assert.doesNotMatch(doc.querySelector('.cocoLegalResumenRegistro').textContent,/Puede ejercer sus derechos/);
          assert.doesNotMatch(doc.querySelector('#rNom').placeholder,/Sin espacios ni acentos/);
        }
      }
    }
  } finally {dom.window.close();}
});

test('home game hints, suggestion cards and the guide translate their actual rendered copy',async()=>{
  const {api,w,doc,dom}=page(undefined,undefined,undefined,'<main id="cocoApp"><article class="cocoGameCard" data-coco-juego="memoria"><h3>Memoria</h3></article><div class="cocoMiniJuego" data-coco-city-entry><b>Coco Ciudad</b></div></main>');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  let suggestions=0;
  try {
    await api.ready;
    for(const game of ['generala','naval']) {
      const entry=fs.readFileSync(path.join(root,'games',game,'entry.mjs'),'utf8');
      w.Function(entry.slice(0,entry.indexOf('window.addEventListener'))+';attach();')();
    }
    const iconStart=html.indexOf('  function questionIconSvg(){'),iconEnd=html.indexOf('  function nodeGameTitle(',iconStart);
    const cardsStart=html.indexOf('  function ensureSuggestionCards(){'),cardsEnd=html.indexOf('  function discoverGames(){',cardsStart);
    w.Function('ALL_IDS','idFromCard','openSuggestionForm',html.slice(iconStart,iconEnd)+html.slice(cardsStart,cardsEnd)+';ensureSuggestionCards();')(['memoria'],card=>card.dataset.cocoJuego,()=>{suggestions++;});
    const guidesStart=html.indexOf('  function crearFooter(){'),guidesEnd=html.indexOf('  function informarRegistro(){',guidesStart);
    w.Function(html.slice(guidesStart,guidesEnd)+';crearFooter();')();
    const selectors=['.cocoMiniSuggestion b','.cocoMiniSuggestion .cocoMiniEstado','.cocoSuggestionCard h3','.cocoSuggestionCard .cocoDescripcion','.cocoSuggestionPromise b','.cocoSuggestionPromise span','.cocoSuggestionCard button','#coco-game-guides .cocoGuidesEyebrow','#coco-game-guides strong','#coco-game-guides .cocoGuidesDescription'];
    const copy=selectors.map(selector=>{const el=doc.querySelector(selector);assert.ok(el,selector);return[el,el.textContent];});
    for(const locale of locales) {
      await api.setLanguage(locale);
      for(const [el,source] of copy) {
        if(locale!=='es')assert.ok(readPack(locale).strings[source],locale+' / '+source);
        assert.equal(el.textContent,api.t(source),locale+' / '+source);
      }
      for(const [game,source] of [['generala','Tira, guarda y anota'],['naval','Busca y descubre']]) {
        assert.equal(doc.querySelector('[data-coco-'+game+'-entry] .cocoExcellenceMeta span:last-child').textContent,'✦ '+api.t(source));
      }
      const guide=doc.querySelector('#coco-game-guides');
      assert.equal(guide.getAttribute('aria-label'),api.t('Guías de los juegos'));
      assert.equal(guide.querySelector('.cocoGuidesButton').firstChild.data.trim(),api.t('Explorar los juegos'));
      assert.equal(guide.querySelector('[aria-hidden]').textContent,'→');
      doc.querySelector('.cocoMiniSuggestion').click();
      doc.querySelector('.cocoSuggestionCard button').click();
    }
    assert.equal(suggestions,locales.length*2);
    await api.setLanguage('zh-Hans');
    assert.equal(doc.querySelector('.cocoGuidesEyebrow').textContent,'Coco 的世界');
    assert.equal(doc.querySelector('.cocoSuggestionPromise b').textContent,'你的创意很重要');
  } finally {await new Promise(resolve=>setTimeout(resolve,0));dom.window.close();}
});

test('the two home banners use clean artwork and localized captions, including cloned decoration and return to Spanish',async()=>{
  const {api,w,doc,dom}=page(undefined,undefined,undefined,'<main id="cocoApp"><section class="loginCard"></section><section id="cocoHomeFinal3"></section><section class="galeriaTarjetasLogro"><img class="tarjetaImagenOptimizada" src="/assets/tarjetas/premium-v160127/coco-en-racha-mini.webp"></section></main>');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const source=fs.readFileSync(path.join(root,'eterna-v159.js'),'utf8');
  const identity=fs.readFileSync(path.join(root,'coco-v155-identity.js'),'utf8');
  try {
    await api.ready;
    const style=doc.createElement('style');style.textContent=fs.readFileSync(path.join(root,'i18n/coco.css'),'utf8');doc.head.append(style);
    const app=doc.getElementById('cocoApp'),decor=doc.createElement('div');decor.className='loginDecor loginDecorMinimal';
    decor.innerHTML=html.match(/q\.innerHTML='([^']*class="loginDecorTitle"[^']+)'/)[1];
    const original=decor.querySelector('.loginPoster');
    original.src='/assets/tarjetas/premium-v160127/coco-mini.webp';
    const fallback=()=>{original.src='/assets/tarjetas/premium-v160127/coco.jpg';};original.onerror=fallback;
    app.querySelector('.loginCard').append(decor);
    const launcherStart=source.indexOf('  function createLauncher(){'),launcherEnd=source.indexOf('  function createBrainPanel(',launcherStart);
    const launcher=w.Function(source.slice(launcherStart,launcherEnd)+';return createLauncher();')();
    app.querySelector('#cocoHomeFinal3').append(launcher);
    // Load the real late identity CSS too: its !important Spanish background
    // must not override the localized image even when that script arrives last.
    w.requestAnimationFrame=callback=>w.setTimeout(callback,0);
    w.eval(identity);
    const achievement=app.querySelector('.tarjetaImagenOptimizada');
    const achievementSrc=achievement.getAttribute('src');
    let clone;
    for(const locale of ['zh-Hans',...locales.filter(l=>l!=='zh-Hans'),'es']) {
      await api.setLanguage(locale);
      if(!clone) {
        const strip=source.match(/^  function stripIds\(node\).*$/m)[0];
        const brainStart=source.indexOf('  function createBrainPanel(source){'),brainEnd=source.indexOf('  function ensureHomeLayout(){',brainStart);
        clone=w.Function(strip+source.slice(brainStart,brainEnd)+';return createBrainPanel;')()(decor);
        app.querySelector('#cocoHomeFinal3').append(clone);api.refresh(clone);
      }
      const visual=launcher.querySelector('.eternaLauncherVisualFinal3');
      assert.equal(original.onerror,fallback,'the original image fallback is retained');
      assert.equal(original.getAttribute('src'),'/assets/tarjetas/premium-v160127/coco-mini.webp');
      assert.equal(achievement.getAttribute('src'),achievementSrc,'achievement collection is untouched');
      if(locale==='es') {
        assert.equal(app.querySelectorAll('[data-coco-localized-banner],[data-coco-banner-caption]').length,0);
        assert.notEqual(w.getComputedStyle(original).display,'none');
        assert.match(w.getComputedStyle(visual).backgroundImage,/hero-explorer-v160129/);
        assert.equal(original.alt,'Tarjeta Coco: Tu primer gran paso');
      } else {
        assert.equal(w.getComputedStyle(visual).backgroundImage,'none',locale+' clean hero background');
        assert.equal(w.getComputedStyle(original).display,'none',locale+' Spanish poster hidden');
        assert.equal(visual.querySelectorAll('.cocoLocalizedHero').length,1);
        assert.match(visual.querySelector('.cocoLocalizedHeroArt').src,/\/hero-explorer-clean\.webp$/);
        assert.equal(visual.querySelector('[data-coco-banner-caption] b').textContent,api.t('Juegos para la mente y apoyo escolar'));
        assert.equal(visual.querySelector('[data-coco-banner-caption] span').textContent,api.t('Con Coco y Eterna.'));
        for(const stage of app.querySelectorAll('.loginDecorStage')) {
          assert.equal(stage.querySelectorAll('.cocoLocalizedPoster').length,1);
          const img=stage.querySelector('.cocoLocalizedPosterArt');
          assert.match(img.src,/\/premium-v160127\/coco-clean\.webp$/);
          assert.equal(img.alt,api.t('Tarjeta Coco: Tu primer gran paso'));
          assert.equal(stage.querySelector('[data-coco-banner-caption] span').textContent,api.t('Tu primer gran paso'));
        }
      }
    }
    await api.setLanguage('zh-Hans');
    assert.equal(app.querySelector('.cocoLocalizedPosterArt').alt,'Coco 卡片：迈出第一大步');
  } finally {await new Promise(resolve=>setTimeout(resolve,0));dom.window.close();}
});

test('the latest selection wins and failed downloads preserve the active language',async()=>{
  let reply; const {api,dom,doc}=page(undefined,async url=>{
    const id=path.basename(url.pathname,'.json');
    if(id==='fr')return {ok:false};
    if(id==='en')await new Promise(resolve=>{reply=resolve;});
    return {ok:true,json:async()=>readPack(id)};
  });
  try {
    await api.ready;
    const english=api.setLanguage('en');
    assert.equal(await api.setLanguage('ar'),true);
    reply(); assert.equal(await english,false);
    assert.equal(await api.setLanguage('fr'),false);
    assert.equal(doc.documentElement.lang,'ar');
    assert.equal(doc.querySelector('select').value,'ar');
    assert.equal(await api.setLanguage('../x'),false);
  } finally {dom.window.close();}
});

test('shared links, rerendered forms and report exports preserve the language and personal text',async()=>{
  const {api,doc,dom,w}=page('https://coco.test/?lang=uk&juego=memoria#tab');
  try{
    await api.ready;
    const label=doc.createElement('label');label.textContent='Correo';
    doc.querySelector('.loginCard').append(label);
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(label.textContent,readPack('uk').strings.Correo);
    assert.equal(api.sourceText(label),'Correo');
    assert.equal(api.accountReturn(true),'https://coco.test/?coco_recuperar=1&lang=uk');
    assert.equal(api.accountReturn(false),'https://coco.test/?lang=uk');
    assert.equal(api.shareUrl('https://coco.test/juego/memoria/'),'https://coco.test/juego/memoria/?lang=uk');
    const html=api.reportDocument('<html><body><h2>Mapa de fortalezas</h2><div class="cocoV16086ExportIdentity"><b>Memoria</b></div><strong>23</strong></body></html>');
    const out=new w.DOMParser().parseFromString(html,'text/html');
    assert.equal(out.documentElement.lang,'uk');
    assert.equal(out.querySelector('h2').textContent,readPack('uk').strings['Mapa de fortalezas']);
    assert.equal(out.querySelector('b').textContent,'Memoria');
    assert.equal(out.querySelector('strong').textContent,'23');
    await api.setLanguage('nb');
    assert.equal(w.location.search,'?lang=nb&juego=memoria');
    assert.equal(w.location.hash,'#tab');
  }finally{dom.window.close();}
});

test('a language change from another tab updates the URL and survives reload without rewriting storage',async()=>{
  const {api,w,dom}=page('https://coco.test/?lang=es&source=pwa-shortcut&juego=memoria#tab');
  try {
    await api.ready;
    // The other tab has already written the shared preference before this event arrives.
    w.localStorage.setItem('coco.language.v1','fr');
    const setItem=w.Storage.prototype.setItem;
    const writes=[];
    w.Storage.prototype.setItem=function(key,value){writes.push([key,value]);return setItem.call(this,key,value);};
    const changed=new Promise(resolve=>w.addEventListener('coco:language',resolve,{once:true}));
    w.dispatchEvent(new w.StorageEvent('storage',{key:'coco.language.v1',newValue:'fr',oldValue:'es'}));
    await changed;
    assert.equal(api.tag,'fr');
    assert.equal(w.location.search,'?lang=fr&source=pwa-shortcut&juego=memoria');
    assert.equal(w.location.hash,'#tab');
    assert.deepEqual(writes,[]);
    const reloaded=page(w.location.href,undefined,w.localStorage.getItem('coco.language.v1'));
    try {
      await reloaded.api.ready;
      assert.equal(reloaded.api.tag,'fr');
      assert.equal(reloaded.w.localStorage.getItem('coco.language.v1'),'fr');
    } finally {reloaded.dom.window.close();}
  } finally {dom.window.close();}
});

test('offline reopening uses the previously downloaded pack before the first service worker takes control',async()=>{
  let offline=false;
  const items=new Map();
  const {api,w,dom,doc}=page(undefined,async url=>{
    if(offline)throw new Error('offline');
    return new Response(JSON.stringify(readPack(path.basename(url.pathname,'.json'))),{headers:{'Content-Type':'application/json'}});
  });
  try {
    Object.defineProperty(w,'caches',{value:{open:async()=>({
      put:async(url,r)=>items.set(url.href,await r.text()),
      match:async(url)=>items.has(url.href)?new Response(items.get(url.href)):undefined
    })}});
    await api.ready;
    assert.equal(await api.setLanguage('fr'),true);
    assert.equal(items.size,1);
    offline=true;
    await api.setLanguage('es');
    const script=w.document.createElement('script');script.src='/i18n/coco.js';
    // A new document has an empty memory cache, but retains the downloaded language.
    const fresh=page('https://coco.test/',async()=>{throw new Error('offline');});
    try {
      Object.defineProperty(fresh.w,'caches',{value:w.caches});
      await fresh.api.ready;
      assert.equal(await fresh.api.setLanguage('fr'),true);
      assert.equal(fresh.doc.querySelector('label').textContent,'Mot de passe');
    } finally {fresh.dom.window.close();}
    assert.equal(doc.documentElement.lang,'es');
  } finally {dom.window.close();}
});

test('localized game and account labels retain the numeric and navigation state',async()=>{
  const {api,doc,dom}=page();
  try {
    await api.ready;
    const stat=doc.createElement('b');stat.dataset.cocoNumber='12003';stat.textContent='12.003';
    doc.body.append(stat);
    for(const lang of ['ar','zh-Hans','de','es']){
      await api.setLanguage(lang);
      assert.equal(stat.textContent,(12003).toLocaleString(lang));
      assert.equal(api.spanishGame('crucigrama'),false);
      assert.equal(api.spanishGame('conecta'),false);
    }
  } finally {dom.window.close();}
});

test('dynamic game rounds and report scores update in place without translating personal text',async()=>{
  const {api,dom,doc}=page();
  try {
    doc.body.dataset.cocoLanguagePage='game';
    const round=doc.createElement('strong');round.textContent='RONDA 2 DE 11';doc.body.append(round);
    const report=doc.createElement('section');report.dataset.familyIntegralReport='1';
    report.innerHTML='<small>Señal observada · 89/100</small><p>Ha trabajado Matemáticas, Ciencias Naturales. Solo valoramos los conceptos con al menos dos interacciones; el resto se muestra como actividad, sin inventar conclusiones.</p><b data-coco-verbatim>Memoria</b>';
    doc.body.append(report);await api.ready;
    for(const tag of locales.filter(l=>l!=='es')){
      await api.setLanguage(tag);
      assert.equal(round.textContent,api.t('Ronda {n} de {total}',{n:(2).toLocaleString(tag),total:(11).toLocaleString(tag)}));
      assert.ok(report.querySelector('p').textContent.includes(api.t('Matemáticas')));
      assert.equal(report.querySelector('small').textContent,api.t('Señal observada · {score}/100',{score:(89).toLocaleString(tag)}));
      assert.equal(report.querySelector('b').textContent,'Memoria');
    }
    await api.setLanguage('es');assert.equal(round.textContent,'RONDA 2 DE 11');
  }finally{dom.window.close();}
});

test('the native dropdown changes language and keeps the saved preference and URL in sync',async()=>{
  const {api,doc,w,dom}=page('https://coco.test/?lang=es&source=pwa-v159#menu');
  try {
    await api.ready;
    const bar=doc.querySelector('.coco-language-bar'),select=bar.querySelector('select');
    assert.deepEqual([...bar.querySelectorAll('button,a,select')].map(el=>el.tagName),['SELECT']);
    assert.equal(select.options.length,15);
    const changed=()=>new Promise(resolve=>w.addEventListener('coco:language',resolve,{once:true}));
    for(const tag of ['da','es']){
      const update=changed();select.value=tag;select.dispatchEvent(new w.Event('change',{bubbles:true}));await update;
      assert.equal(api.tag,tag);assert.equal(select.value,tag);
      assert.equal(w.localStorage.getItem('coco.language.v1'),tag);
      assert.equal(w.location.search,'?lang='+tag+'&source=pwa-v159');
      assert.equal(w.location.hash,'#menu');
    }
  }finally{dom.window.close();}
});

for(const standalone of [false,true])test('the '+(standalone?'PWA':'web')+' account menu keeps one language selector through login, play, navigation and logout',async()=>{
  const {api,w,doc,dom}=page('https://coco.test/?source='+(standalone?'pwa-v159':'web'),undefined,undefined,'<div id="cocoApp"></div>');
  const settle=()=>new Promise(resolve=>setTimeout(resolve,40));
  try {
    await api.ready;
    const app=doc.getElementById('cocoApp');
    const publicSlot=doc.querySelector('[data-coco-language-menu]');
    const select=publicSlot.querySelector('select');
    const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    let session=null,signIns=0,signOuts=0;
    const data=table=>({data:table==='perfiles'?{id:'fixture',apodo:'Memoria',rol:'jugador',edad:20}:table==='ajustes'?{id:1,partidas_por_dia:1,registro_abierto:true}:[],error:null});
    function query(table){const builder=new Proxy({}, {get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve(data(table)).then(resolve,reject):()=>builder});return builder;}
    const client={from:query,rpc:async name=>({data:name==='racha_de'?0:[]}),auth:{
      getSession:async()=>({data:{session}}),
      signInWithPassword:async credentials=>{assert.deepEqual({...credentials},{email:'fixture@example.invalid',password:'synthetic-password'});signIns++;session={user:{id:'fixture'}};return{data:{...session,session}};},
      signOut:async()=>{signOuts++;session=null;},onAuthStateChange(){}
    }};
    w.supabase={createClient:()=>client};w.__COCO_SUPABASE_CLIENT=client;
    w.CocoDailyV134={claim:async()=>({ok:true})};
    w.CocoFirstPaint={dataReady(){}};w.matchMedia=()=>({matches:standalone});
    Object.defineProperty(w.navigator,'standalone',{value:standalone});
    w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    w.eval(scripts.find(m=>m[2].startsWith('window.COCO_VERSION'))[2]);
    w.eval(scripts.find(m=>m[2].startsWith('!function(){var a=window.COCO_CONFIG'))[2]);
    await settle();
    assert.equal(publicSlot.querySelector('select'),select);
    const assertFreeAccount=()=>{
      assert.equal(app.querySelector('.cocoFreeGamesNotice b')?.textContent,'Todos los juegos son gratuitos');
      assert.equal(app.querySelector('.cocoFreeGamesNotice p')?.textContent,'La cuenta también es gratuita. No necesitas tarjeta ni suscripción para jugar.');
    };
    assertFreeAccount();
    app.querySelector('.loginCard .btn.plano').click();await settle();
    assert.ok(app.querySelector('#rNom'));assertFreeAccount();
    app.querySelector('#rNom').closest('.caja').querySelector('.btn.plano').click();await settle();
    assertFreeAccount();
    app.querySelector('#cMail').value='fixture@example.invalid';
    app.querySelector('#cPas').value='synthetic-password';
    await app.querySelector('.loginCard .btn.lima').onclick();
    await settle();
    const menu=app.querySelector('.navegacionJugador');
    const accountSelect=()=>app.querySelector(':scope > [data-coco-account-header] [data-coco-language-account] select');
    assert.equal(signIns,1);
    assert.equal(accountSelect(),select);
    assert.equal(publicSlot.hidden,true);
    const cardsPanel=app.querySelectorAll('.panelJugador')[1];
    [...menu.querySelectorAll('.pestanaJugador')].find(b=>api.sourceText(b).includes('Mis tarjetas')).click();
    const choose=async tag=>{const changed=new Promise(resolve=>w.addEventListener('coco:language',resolve,{once:true}));select.value=tag;select.dispatchEvent(new w.Event('change',{bubbles:true}));await changed;};
    await choose('fr');
    assert.equal(app.querySelector('[data-coco-account-header] .coco-language-caption').textContent,'Langue');
    assert.ok(cardsPanel.classList.contains('activa'));
    assert.equal(w.localStorage.getItem('coco_pestana_jugador'),'tarjetas');
    app.querySelector('.bRankCarnet').click();await settle();
    assert.equal(accountSelect(),select);
    app.querySelector('.rankingVolverV83').click();await settle();
    const rebuilt=app.querySelector('.navegacionJugador');
    assert.notEqual(rebuilt,menu);
    assert.equal(accountSelect(),select);
    assert.equal(select.value,'fr');
    assert.ok(app.querySelectorAll('.panelJugador')[1].classList.contains('activa'));
    [...rebuilt.querySelectorAll('.pestanaJugador')].find(b=>api.sourceText(b).includes('Mis retos')).click();
    const memory=[...app.querySelectorAll('.juego')].find(card=>api.sourceText(card.querySelector('h3'))==='Memoria');
    memory.querySelector('button').click();await settle();
    app.querySelector('.nivelesJuego button').click();
    const board=app.querySelector('.memoriaGrid'),card=board.querySelector('.memoriaCarta');
    card.click();await choose('ar');
    assert.equal(app.querySelector('.memoriaGrid'),board);
    assert.ok(card.classList.contains('volteada'));
    assert.equal(accountSelect(),select);
    app.querySelector('.barraVolver button').click();await settle();
    assert.equal(accountSelect(),select);
    assert.equal(select.value,'ar');
    await app.querySelector('.cabecera .fin > button').onclick();await settle();
    assert.equal(signOuts,1);
    assert.equal(publicSlot.hidden,false);
    assert.equal(publicSlot.querySelector('select'),select);
    assert.equal(doc.querySelectorAll('.coco-language-bar').length,1);
    assert.equal(select.value,'ar');
    assert.equal(w.localStorage.getItem('coco.language.v1'),'ar');
  } finally {dom.window.close();}
});

test('all catalogue pages provide translated menu text or complete static language navigation',async()=>{
  const guides=fs.readdirSync(root,{withFileTypes:true})
    .filter(f=>f.isDirectory() && /^(?:apoyo|aprender|ayuda|preparar|juegos-)/.test(f.name))
    .map(f=>f.name+'/index.html');
  const directories=folder=>fs.readdirSync(path.join(root,folder),{withFileTypes:true})
    .filter(entry=>entry.isDirectory()).map(entry=>folder+'/'+entry.name+'/index.html');
  const landingCopy=JSON.parse(fs.readFileSync(path.join(root,'seo/locales/free-games.json'),'utf8'));
  const landingRoutes=locales.map(tag=>[tag,tag==='es'?'/juegos-gratis/':`/${tag.toLowerCase()}/${landingCopy[tag].slug}/`]);
  const staticPages=new Map(landingRoutes.map(([tag,route])=>[route.slice(1)+'index.html',tag]));
  const paths=new Set(['juegos/index.html','explora/index.html',...directories('juego'),...directories('games'),...guides,...staticPages.keys()]);
  const strings=new Set(), trucoStrings=new Set(), mesaStrings=new Set();
  for(const file of paths){
    const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));
    try {
      const doc=dom.window.document;
      const staticTag=staticPages.get(file);
      if(staticTag){
        // These guides ship their own translated HTML and navigate between real language URLs.
        assert.equal(doc.body.dataset.cocoLandingLocale,staticTag,file);
        assert.equal(doc.documentElement.lang,staticTag,file);
        assert.equal(doc.querySelector('h1')?.textContent,landingCopy[staticTag].heading,file);
        assert.equal(doc.querySelector('.lead')?.textContent,landingCopy[staticTag].intro,file);
        const menu=doc.querySelector('#landing-language');
        assert.ok(menu,file+' needs its static language selector');
        assert.equal(menu.value,'/'+file.replace(/index\.html$/,''),file);
        assert.deepEqual([...menu.options].map(option=>[option.lang,option.value]),landingRoutes,file);
        assert.deepEqual([...doc.querySelectorAll('.all-languages a[hreflang]')].map(link=>[link.hreflang,link.getAttribute('href')]),landingRoutes,file);
        assert.deepEqual([...doc.querySelectorAll('script[src]')].map(script=>new URL(script.getAttribute('src'),'https://coco.test').pathname),['/seo/localized.js'],file);
        continue;
      }
      if(file==='games/truco/index.html'){
        assert.ok(doc.querySelector('select#lang'),file+' needs a language selector');
        const {messages}=await import('../games/truco/locale.mjs');
        for(const language of locales){
          for(const key of ['title','back','solo','local','online','rulesText'])assert.ok(messages[language][key],language+' / '+key);
        }
        continue;
      }
      assert.ok(doc.querySelector('[data-coco-language-menu]'),file);
      const tableGame=/^(?:juego|games)\/(?:ciudad|generala|naval)\//.test(file);
      const copy=tableGame?mesaStrings:['juego/truco/index.html','juegos/index.html'].includes(file)?trucoStrings:strings;
      for(const el of doc.body.querySelectorAll('p,button,a,label,h1,h2,h3,h4,li,span,b,strong,small,summary,figcaption')){
        if(el.closest('[data-coco-verbatim],code'))continue;
        for(const node of el.childNodes){
          if(node.nodeType!==3)continue;
          const key=node.data.trim().replace(/\s+/g,' ');
          if(/[A-Za-zÀ-ɏ]{2}/.test(key))copy.add(key);
        }
      }
    } finally {dom.window.close();}
  }
  for(const language of locales.filter(l=>l!=='es')){
    const pack=readPack(language);
    for(const key of strings)assert.ok(pack.strings[key],language+' / '+key);
    const mesa=JSON.parse(fs.readFileSync(path.join(root,'i18n/mesa',language+'.json'),'utf8')).strings;
    for(const key of mesaStrings)assert.ok(mesa[key]||pack.strings[key],language+' / '+key);
    const supplemental=JSON.parse(fs.readFileSync(path.join(root,'i18n/truco',language+'.json'),'utf8')).strings;
    for(const key of trucoStrings)assert.ok(supplemental[key]||pack.strings[key],language+' / '+key);
  }
});

test('a fresh PWA uses the installation language and later launches respect the player’s preference',async()=>{
  for(const tag of locales.filter(l=>l!=='es')){
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'i18n/manifests',tag+'.webmanifest'),'utf8'));
    for(const route of [manifest.start_url,...manifest.shortcuts.map(s=>s.url)]){
      assert.equal(new URL(route,'https://coco.test').searchParams.get('pwa_lang'),tag);
    }
    const first=page('https://coco.test'+manifest.start_url);
    try {await first.api.ready;assert.equal(first.api.tag,tag);assert.equal(first.w.localStorage.getItem('coco.language.v1'),tag);}
    finally{first.dom.window.close();}
  }
  const next=page('https://coco.test/?source=pwa-v159&pwa_lang=ar',undefined,'nl');
  try {await next.api.ready;assert.equal(next.api.tag,'nl');}
  finally{next.dom.window.close();}
});

test('Generala can switch between every language after a roll without losing the held die or player name',async()=>{
  const engine=await import('../games/generala/engine.mjs');
  const dom=new JSDOM(fs.readFileSync(path.join(root,'games/generala/index.html'),'utf8'),{url:'https://coco.test/games/generala/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,d=w.document,destroy=w.close.bind(w);
  try {
    Object.assign(w,engine,{structuredClone,matchMedia:()=>({matches:true}),OnlineGenerala:class{stop(){}}});
    w.scrollTo=()=>{};
    const script=d.querySelector('script[src*="/i18n/coco.js"]');
    Object.defineProperty(d,'currentScript',{get:()=>script});
    w.fetch=async url=>({ok:true,json:async()=>readPack(path.basename(url.pathname,'.json'))});
    w.eval(code);await w.CocoLocale.ready;
    w.client=()=>{throw new Error('Unexpected network access in local game');};
    const rankingSource=fs.readFileSync(path.join(root,'games/mesa-ranking.mjs'),'utf8').replace(/^export /gm,'');
    w.eval(rankingSource+'\nObject.assign(window,{newRankingMatch,tableRanking});');
    w.eval(fs.readFileSync(path.join(root,'games/generala/app.mjs'),'utf8').replace(/^import[^\n]+\n/gm,''));
    d.querySelector('[data-mode="solo"]').click();
    d.querySelector('[name=playerName]').value='Memoria';
    d.querySelector('#start').click();d.querySelector('#roll').click();
    await new Promise(resolve=>setTimeout(resolve,35));
    d.querySelector('[data-die="0"]').click();
    const saved=w.localStorage.getItem('coco-generala-local-v1');
    const pips=d.querySelectorAll('#dice .pip').length;
    assert.ok(pips>=5);
    for(const tag of locales) {
      await w.CocoLocale.setLanguage(tag);
      const die=d.querySelector('[data-die="0"]');
      assert.equal(die.getAttribute('aria-pressed'),'true',tag);
      assert.match(die.getAttribute('aria-label'),tag==='es'?/guardado/:new RegExp(readPack(tag).strings['Dado guardado']));
      assert.equal(d.querySelectorAll('#dice .pip').length,pips);
      assert.equal(w.localStorage.getItem('coco-generala-local-v1'),saved);
      assert.ok(d.querySelector('#players').textContent.includes('Memoria'));
    }
  }finally{destroy();}
});

test('opening the Spanish original of a policy keeps the reader’s chosen language for the app',async()=>{
  const {w,doc,api,dom}=page('https://coco.test/aviso-legal.html?document_original=es&source=policy#privacy',undefined,'pl','<a data-coco-original-document href="?document_original=es">Ver original en español</a>');
  try {
    await api.ready;
    assert.equal(api.tag,'es');
    assert.equal(w.localStorage.getItem('coco.language.v1'),'pl');
    assert.equal(doc.querySelector('[data-coco-original-document]').hidden,true);
    const externalChange = () => w.dispatchEvent(new w.StorageEvent('storage',{key:'coco.language.v1',newValue:'fr'}));
    externalChange();
    await new Promise(resolve => setTimeout(resolve,0));
    assert.equal(api.tag,'es');
    assert.equal(w.location.search,'?document_original=es&source=policy');
    assert.equal(w.location.hash,'#privacy');
    assert.equal(w.localStorage.getItem('coco.language.v1'),'pl');
    await api.setLanguage('it');
    assert.equal(w.location.search,'?source=policy&lang=it');
    externalChange();
    await new Promise(resolve => setTimeout(resolve,0));
    assert.equal(api.tag,'fr');
    assert.equal(w.location.search,'?source=policy&lang=fr');
    assert.equal(w.location.hash,'#privacy');
    assert.equal(doc.querySelector('[data-coco-original-document]').hidden,false);
  }finally{dom.window.close();}
});

test('the family report renderer exports the selected language and preserves names, marks and score values',async()=>{
  const {api,w,dom}=page('https://coco.test/?source=pwa&code=sample-only#access_token=example');
  try {
    await api.ready;
    w.eval(fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8'));
    const section={theme:'games',hero:{title:'Memoria',percent:82},metrics:[{value:12,label:'partidas que puntúan'}]};
    const family={student:{name:'Memoria',age:'10 años',schoolYear:'5º de Primaria',ccaa:'Andalucía'},games:section,learning:{theme:'learning',hero:{title:'Más avance en: Matemáticas',percent:89}}};
    for(const tag of locales) {
      await api.setLanguage(tag);
      const raw=w.CocoFamilyReportKitV16084.familyDocumentHtml(family);
      const doc=new w.DOMParser().parseFromString(raw,'text/html');
      assert.equal(doc.documentElement.lang,tag);
      const back=new URL(doc.body.dataset.cocoReturnUrl);
      assert.equal(back.hash,'');assert.equal(back.searchParams.has('code'),false);
      assert.equal(back.searchParams.get('lang'),tag==='es'?null:tag);
      const person=doc.querySelector('.cocoV16086ExportIdentity').textContent;
      assert.ok(person.includes('Memoria'));assert.ok(person.includes('Andalucía'));
      assert.ok(person.includes(api.t('5º de Primaria')));
      assert.ok(person.includes(tag==='es'?'10 años':new Intl.NumberFormat(tag,{style:'unit',unit:'year',unitDisplay:'long'}).format(10)));
      assert.equal(doc.querySelector('.cocoV16083Metrics article strong').textContent,'12');
      assert.equal(doc.querySelector('.cocoV16083Metrics article span').textContent,api.t('partidas que puntúan'));
      assert.equal(doc.querySelector('.cocoV16086DocumentTitle').textContent,api.t('Así está avanzando'));
      assert.equal(doc.querySelector('[onclick="window.print()"]').textContent,api.t('Imprimir o guardar como PDF'));
    }
  } finally {dom.window.close();}
});

test('school stages keep Spanish enrolment values and preserve custom years and regions',async()=>{
  const {api,w,doc,dom}=page();
  try {
    await api.ready;
    const years=['0–2','3','4','5'].map(n=>'Infantil · '+n+' años');
    for(const [stage,count] of [['Primaria',6],['ESO',4],['Bachillerato',2]]){
      for(let n=1;n<=count;n++)years.push(n+'º de '+stage);
    }
    const custom='Memoria';
    const select=doc.createElement('select');
    for(const year of years)select.add(new w.Option(year,year));
    doc.body.append(select);
    select.value=years[2];
    const stageSelect=doc.createElement('select');
    stageSelect.setAttribute('data-stage','');
    const stages=['Infantil','Primaria','ESO','Bachillerato'];
    for(const stage of stages)stageSelect.add(new w.Option(stage,stage.toLowerCase()));
    doc.body.append(stageSelect);
    const output=doc.createElement('output');
    output.setAttribute('data-coco-current-course','');
    output.dataset.region='Lenguaje';
    doc.body.append(output);
    const age=doc.createElement('output');
    age.setAttribute('data-coco-calculated-age','');
    age.textContent='1 año';
    doc.body.append(age);
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      assert.equal(select.value,years[2]);
      for(const [index,stage] of stages.entries()){
        const option=stageSelect.options[index];
        assert.equal(option.value,stage.toLowerCase());
        assert.equal(option.textContent,tag==='es'?stage:api.t('Etapa escolar: '+stage));
      }
      assert.equal(age.textContent,tag==='es'?'1 año':new Intl.NumberFormat(tag,{style:'unit',unit:'year',unitDisplay:'long'}).format(1));
      for(const option of select.options){
        const year=option.value;
        assert.equal(option.textContent,api.schoolYear(year));
        if(tag!=='es')assert.notEqual(option.textContent,year);
        output.dataset.schoolYear=year;
        api.refresh(output);
        assert.equal(output.textContent,api.t('Curso actual:')+' '+option.textContent+' · Lenguaje');
      }
      output.dataset.schoolYear=custom;
      api.refresh(output);
      assert.equal(output.textContent,api.t('Curso actual:')+' '+custom+' · Lenguaje');
      output.dataset.schoolYear='';
      api.refresh(output);
      assert.equal(output.textContent,api.t('Curso actual: pendiente de configurar en Eterna'));
    }
  } finally {dom.window.close();}
});

test('displayed prices and Generala scoring rules keep every figure in all locales',()=>{
  const keys=[
    'Evaluación + PDF · 15 €',
    'Prueba gratuita · 7 días',
    'Conoce Eterna: apoyo escolar con IA por escritura y voz, con modos para tareas, explicaciones y repaso. Prueba 7 días sin tarjeta. Después, 7,99 €/mes o 79,99 €/año si decides continuar.',
    'Escalera 20, full 30, póker 40, generala 50 y doble generala 100. Escalera, full y póker suman 5 extra en la primera tirada. La doble exige una generala previa de 50.'
  ];
  const numbers=text=>(text.match(/\d+(?:[.,]\d+)?/g)||[]).map(s=>Number(s.replace(',','.'))).sort((a,b)=>a-b);
  for(const tag of locales.filter(l=>l!=='es')){
    const d=readPack(tag).strings;
    for(const k of keys){
      assert.ok(d[k],tag+' / '+k);
      assert.deepEqual(numbers(d[k]),numbers(k),tag+' / '+k);
    }
  }
});

test('play buttons identify the same game in every locale and Generala keeps its name',()=>{
  for(const tag of locales.slice(1)){
    const strings=readPack(tag).strings;
    assert.equal(strings.Generala,'Generala',tag);
    for(const game of ['Ajedrez','Generala','Reto tiempo','Crucigrama','Sopa de letras']){
      const button=strings['Jugar a '+game];
      // A translated noun may be lower-case or inflected inside the action.
      // Dutch uses "schaken" for the activity and "schaak" in "Speel schaak".
      const noun = game==='Ajedrez' && tag==='nl' ? 'schaak' : strings[game];
      assert.ok(button.toLocaleLowerCase(tag).includes(noun.toLocaleLowerCase(tag)),tag+' / '+game);
      assert.equal(strings['Jugar a '+game+' →'],button+' →',tag+' / '+game);
    }
  }
  const english=readPack('en').strings;
  assert.equal(english['Tirar los cinco dados'],'Roll all five dice');
  assert.equal(english['Tira el dado'],'Roll the die');
});

test('report counts, percentages and weekly activity localize in the open report and in the export',async()=>{
  const {api,w,doc,dom}=page();
  try{
    await api.ready;
    w.eval(fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8'));
    const model={theme:'learning',hero:{title:'Memoria',percent:82},
      bars:[{label:'Matemáticas',value:82,detail:'2391 interacciones'}],
      metrics:[{value:'3/7',label:'días activos esta semana'}],
      panels:[{items:[{label:'Memoria',detail:'Matemáticas · 1 interacción'},{label:'Memoria',detail:'3 observaciones'}]}]};
    const family={student:{name:'Memoria'},learning:model,games:{theme:'games'}};
    const markup=()=>w.CocoFamilyReportKitV16084.familyDocumentHtml(family);
    doc.body.insertAdjacentHTML('beforeend',new w.DOMParser().parseFromString(markup(),'text/html').querySelector('[data-family-integral-report]').outerHTML);
    for(const tag of locales.slice(1)){
      await api.setLanguage(tag);
      const exported=new w.DOMParser().parseFromString(markup(),'text/html');
      for(const scope of [doc,exported]){
        const section=scope.querySelector('[data-family-integral-chapter="learning"]');
        assert.equal(section.querySelector('.cocoV16083BarList small').textContent,api.t('Interacciones')+': '+Number(2391).toLocaleString(tag));
        assert.equal(section.querySelector('.cocoV16083Metrics strong').textContent,Number(3).toLocaleString(tag)+'/'+Number(7).toLocaleString(tag));
        assert.equal(section.querySelector('.cocoV16083HeroOrb b').textContent,new Intl.NumberFormat(tag,{style:'percent'}).format(.82));
        const details=section.querySelectorAll('.cocoV16083Item span');
        assert.equal(details[0].textContent,api.t('Matemáticas')+' · '+api.t('Interacciones')+': '+Number(1).toLocaleString(tag));
        assert.equal(details[1].textContent,api.t('Observaciones')+': '+Number(3).toLocaleString(tag));
      }
    }
  }finally{dom.window.close();}
});

test('family summaries distinguish no practice, a first attempt and repeated practice in all languages',async()=>{
  const {api,w,doc,dom}=page();
  try {
    await api.ready;
    w.eval(fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8'));
    const kit=w.CocoFamilyReportKitV16084;
    const subjects=['Matemáticas','Taller, «A y B»'];
    const intro='Ha trabajado '+subjects.join(', ');
    const empty='Todavía no hay actividad escolar suficiente para preparar una valoración.';
    const states=[
      {summary:empty},
      {summary:intro+', pero todavía necesitamos más de una interacción sobre un mismo concepto antes de sacar conclusiones.',guidance:'Todavía hace falta repetir un mismo concepto para valorar el progreso.'},
      {summary:intro+'. Solo valoramos los conceptos con al menos dos interacciones; el resto se muestra como actividad, sin inventar conclusiones.',guidance:'Solo se valoran conceptos con al menos dos interacciones. El resto figura como actividad.'}
    ];
    for(const state of states){
      const learning={theme:'learning',summary:state.summary,groups:state.guidance?[{title:'Materias trabajadas',items:subjects}]:[]};
      const family={learning,games:{theme:'games'}};
      const view=doc.createElement('main');
      view.innerHTML=kit.familyHtml(family,true);
      doc.body.append(view);
      for(const tag of [...locales.slice(1),'es']){
        await api.setLanguage(tag);
        let expected=state.summary;
        if(tag!=='es'){
          const topics=new Intl.ListFormat(tag).format(subjects.map(subject=>api.t(subject)));
          expected=state.guidance?api.t('Se ha practicado: {topics}.',{topics})+' '+api.t(state.guidance):api.t(empty);
          assert.notEqual(api.t(state.guidance||empty),state.guidance||empty);
        }
        const print=new w.DOMParser().parseFromString(kit.familyDocumentHtml(family),'text/html');
        for(const output of [view,print]){
          assert.equal(output.querySelector('.cocoV160100PlainSummary').textContent,expected,tag);
        }
      }
      view.remove();
    }
  } finally { dom.window.close(); }
});

test('the game leaderboard keeps player names and updates the score and best game in place',async()=>{
  const {api,w,doc,dom}=page();
  try{
    await api.ready;
    const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
    const start=index.indexOf('  function rankingTableHtml(board){');
    const source=index.slice(start,index.indexOf('  function closeLeaderboard()',start));
    assert.ok(start>=0);
    const table=w.Function('money','esc',source+';return rankingTableHtml;')(String,s=>s);
    const board={myPosition:8,totalPlayers:1234,rows:[{position:8,apodo:'Memoria',plays:2375,best:1000,total:23456}]};
    doc.body.insertAdjacentHTML('beforeend','<p data-ranking-description>Tabla independiente dedicada exclusivamente a Coco Generala.</p>'+table(board));
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      const row=doc.querySelector('.cocoRankingRow');
      assert.equal(doc.querySelector('[data-ranking-description]').textContent,tag==='es'?'Tabla independiente dedicada exclusivamente a Coco Generala.':api.t('Clasificación')+' · '+api.t('Coco Generala'));
      assert.equal(row.querySelector('[data-coco-verbatim]').textContent,'Memoria');
      assert.equal(row.querySelector('[data-ranking-stat="best"]').textContent,api.t('Mejor puntuación'));
      assert.equal(row.querySelector('strong [data-coco-number]').textContent,(23456).toLocaleString(tag));
      assert.equal(row.querySelector('small [data-coco-number]').textContent,(2375).toLocaleString(tag));
    }
  }finally{dom.window.close();}
});

test('monthly and annual subscriptions, trial offers and the school profile translate after rendering',async()=>{
  const get=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url.pathname),'utf8'))});
  const {doc,w,api,dom}=page('https://coco.test/',get);
  try {
    doc.documentElement.setAttribute('data-coco-extra-languages','');await api.ready;
    const experience=fs.readFileSync(path.join(root,'eterna-experience-v160.js'),'utf8');
    const part=(start,end)=>experience.slice(experience.indexOf('  function '+start+'('),experience.indexOf('  function '+end+'('));
    const clean=value=>String(value||'').trim();
    const plan=w.Function('clean','esc',part('dateES','strategyName')+part('planMeta','activePaidSubscription')+part('currentPlanHtml','bindSubscriptionUi')+';return currentPlanHtml;')(clean,clean);
    const trial=w.Function(part('createTesterPlans','moveSubscriptionFirst')+';return createTesterPlans;')();
    const family=fs.readFileSync(path.join(root,'coco-family-friendly-v160100.js'),'utf8');
    const profile=w.Function('courseLabel',family.slice(family.indexOf('  function profileSection('),family.indexOf('  function installStyles('))+';return profileSection;')(()=> '');
    const container=doc.createElement('section');container.className='eternaV16061SubscriptionTop';doc.body.append(container);
    container.innerHTML=['monthly','annual'].map((planName,i)=>plan({plan:planName,provider_customer_id:'fixture',provider_subscription_id:'fixture',current_period_end:i?'2030-04-08T12:00:00Z':null,cancel_at_period_end:false})).join('');
    container.insertAdjacentHTML('beforeend',[null,'2030-04-08T12:00:00Z'].map(end=>plan({plan:'annual',current_period_end:end,cancel_at_period_end:true})).join(''));
    container.append(trial(),profile({school_year:'Custom grade',autonomous_community:'Región de prueba'}));
    const walker=doc.createTreeWalker(container,w.NodeFilter.SHOW_TEXT),copy=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(n.parentElement.closest('time,output')||!/[a-záéóñ]{2}/i.test(n.data))continue;
      copy.push([n,n.data.trim()]);
    }
    assert.ok(copy.length>=35);
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      for(const [n,text] of copy){
        assert.equal(n.data.trim(),api.t(text),tag+' '+text);
        if(tag!=='es' && text.split(' ').length>2)assert.notEqual(n.data.trim(),text,tag+' missing '+text);
      }
      const dt=new Date('2030-04-08T12:00:00Z').toLocaleDateString(tag,{day:'2-digit',month:'long',year:'numeric'});
      assert.equal(container.querySelector('time').textContent,dt,tag);
      assert.equal(container.querySelector('[data-coco-current-course]').textContent.includes('Custom grade'),true);
      assert.equal(container.querySelectorAll('[data-et-v16080-switch]').length,2);
    }
  }finally{dom.window.close();}
});

test('family PIN setup localizes its instructions and confirmation placeholder in every language',async()=>{
  const read=async url=>({ok:true,json:()=>JSON.parse(fs.readFileSync(path.join(root,url.pathname),'utf8'))});
  const {w,doc,api,dom}=page('https://coco.test/',read);
  try {
    await api.ready;
    doc.documentElement.setAttribute('data-coco-extra-languages','');
    const file=fs.readFileSync(path.join(root,'eterna-experience-v160.js'),'utf8');
    const modal=file.slice(file.indexOf('  function closeModal(){'),file.indexOf('  function msg(m,'));
    const setup=file.slice(file.indexOf('  function showCreatePin(s){'),file.indexOf('  function showExistingPin('));
    w.Function('inject','esc','let currentModal;'+modal+setup+';showCreatePin({});')(()=>{},s=>s);
    const dialog=doc.querySelector('.eternaLaunchV16068');
    const hint=dialog.querySelector('.eternaLaunchV16068Info').lastChild;
    const confirm=dialog.querySelector('[data-pin2]');
    const sourceHint=hint.data,sourcePlaceholder=confirm.placeholder;
    confirm.value='1234';
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      assert.equal(hint.data,api.t(sourceHint),tag);
      assert.equal(confirm.placeholder,api.t(sourcePlaceholder),tag);
      if(tag!=='es'){
        assert.notEqual(hint.data,sourceHint,tag);
        assert.notEqual(confirm.placeholder,sourcePlaceholder,tag);
      }
      assert.equal(confirm.value,'1234');
    }
  }finally{dom.window.close();}
});

test('family PIN recovery localizes feedback and keeps the masked account and typed fields intact',async()=>{
  const {w,api,doc,dom}=page();
  try{
    await api.ready;
    const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
    const gate=index.slice(index.indexOf('  function openFamilyGate(){'),index.indexOf('  function madridDate('));
    const app=doc.createElement('main');app.id='cocoApp';doc.body.append(app);
    const shell=()=>{
      app.innerHTML='<section class="cocoFamilyV129"><div class="cocoFamilyV129Body"></div></section>';
      return app.querySelector('.cocoFamilyV129Body');
    };
    w.Function('familyShell','brainSvg',gate+';openFamilyGate();')(shell,()=>'');
    w.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:{user:{email:'memoria@example.invalid'}}}})}};
    w.requestAnimationFrame=callback=>w.setTimeout(callback,1);
    w.eval(fs.readFileSync(path.join(root,'coco-v155-identity.js'),'utf8'));
    assert.equal(api.pinDigits('٠١٢٣'),'0123');
    assert.equal(api.pinDigits('۰۱۲۳'),'0123');
    assert.equal(api.pinDigits('０１２３'),'0123');
    assert.equal(api.pinDigits('0123'),'0123');
    const pin=app.querySelector('.cocoFamilyPin input');
    pin.value='12';app.querySelector('[data-family-enter]').click();
    await app.querySelector('[data-family-recover-open]').onclick();
    const newPin=app.querySelector('[data-family-recover-pin]');
    newPin.value='4321';await app.querySelector('[data-family-recover-save]').onclick();
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      assert.equal(app.querySelector('.cocoFamilyError').textContent,api.t('Escribe exactamente cuatro cifras.'),tag);
      assert.equal(app.querySelector('[data-family-recover-msg]').textContent,api.t('Escribe la contraseña de la cuenta.'),tag);
      const identity=app.querySelector('[data-family-recover-email]');
      assert.equal(identity.querySelector('bdi').textContent,'me***a@example.invalid');
      assert.equal(identity.textContent,api.t('Cuenta:')+' me***a@example.invalid · '+api.t('Confirma la contraseña de la cuenta y crea un PIN nuevo.'),tag);
      assert.equal(pin.value,'12');assert.equal(newPin.value,'4321');
    }
  }finally{dom.window.close();}
});

test('learning strategies, pending chapters, print titles and the shared report use the selected language',async()=>{
  const {w,api,doc,dom}=page();
  try{
    await api.ready;w.eval(fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8'));
    const kit=w.CocoFamilyReportKitV16084;
    const strategies=['preguntas guiadas','ejemplos similares','analogías','apoyo visual y estructura','preguntas de recuerdo','pasos cortos','análisis de errores','explicación directa'];
    const model={theme:'learning',title:'Aprendizaje con Eterna',panels:[{items:strategies.map(label=>({label}))}]};
    const family={kind:'family',student:{name:'Memoria'},learning:model,games:{theme:'games'}};
    const view=doc.createElement('section');view.innerHTML=kit.familyHtml({learning:model},true);doc.body.append(view);
    let shared;
    w.navigator.share=async data=>{shared=data};
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);
      const file=new w.DOMParser().parseFromString(kit.familyDocumentHtml(family),'text/html');
      assert.equal(file.title,api.t('Así está avanzando')+' · Coco en Forma',tag);
      for(const surface of [view,file]){
        assert.deepEqual(Array.from(surface.querySelectorAll('.cocoV16083Item b'),n=>n.textContent),strategies.map(s=>api.t(s)),tag);
      }
      if(tag!=='es')for(const s of strategies)assert.ok(readPack(tag).strings[s],tag+' / '+s);
      assert.equal(view.querySelector('.cocoV16086Pending').textContent,api.t('Preparando las señales de los juegos de Coco…'));
      await kit.share(model);
      assert.equal(shared.title,api.t(model.title));
      assert.equal(shared.text,api.t('Te comparto el informe de progreso de Coco en Forma: {title}.',{title:api.t(model.title)}));
      assert.equal(shared.files.length,1);
    }
  }finally{dom.window.close();}
});

test('child privacy guide keeps its complete text, contact and policy links across languages', async () => {
  const file = fs.readFileSync(path.join(root, 'privacidad-menores.html'), 'utf8');
  const dom = new JSDOM(file, {url:'https://coco.test/privacidad-menores.html',runScripts:'outside-only'});
  const w = dom.window;
  const doc = w.document;
  Object.defineProperty(doc, 'currentScript', {get:() => doc.querySelector('script[src*="/i18n/"]')});
  w.fetch = async url => ({ok:true,json:async () => readPack(path.basename(url.pathname,'.json'))});
  const main = doc.querySelector('main');
  const walker = doc.createTreeWalker(main, w.NodeFilter.SHOW_TEXT);
  const copy = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.data.trim();
    if (/\p{L}/u.test(text) && !node.parentElement.closest('a[href^="mailto:"]')) copy.push({node,text});
  }
  const title = doc.title;
  const description = doc.querySelector('meta[name=description]');
  const sourceDescription = description.content;
  try {
    w.eval(code);
    await w.CocoLocale.ready;
    for (const tag of [...locales.slice(1),'es']) {
      assert.equal(await w.CocoLocale.setLanguage(tag),true);
      const pack = tag === 'es' ? null : readPack(tag).strings;
      for (const {node,text} of copy) {
        assert.equal(node.data.trim(),pack ? pack[text] : text,tag+' '+text);
      }
      assert.equal(doc.title,pack ? pack[title] : title);
      assert.equal(description.content,pack ? pack[sourceDescription] : sourceDescription);
      assert.equal(doc.documentElement.dir,tag === 'ar' ? 'rtl' : 'ltr');
      assert.match(main.textContent,/DNI\/NIE/);
      assert.match(main.textContent,/👋/u);
      const contact = main.querySelector('a[href^="mailto:"]');
      assert.equal(contact.href,'mailto:info@cocoenforma.com');
      assert.equal(contact.textContent,'info@cocoenforma.com');
      for (const link of main.querySelectorAll('a[href^="/"]')) {
        assert.equal(new URL(link.href).searchParams.get('lang'),tag);
      }
      const original = doc.querySelector('[data-coco-original-document]');
      assert.equal(original.getAttribute('href'),'?document_original=es');
      assert.equal(original.hidden,tag === 'es');
    }
  } finally { dom.window.close(); }
});

test('menu thumbnails translate every title and caption across all 15 languages, clones and late rendering',async()=>{
 const {api,w,doc,dom}=page(undefined,undefined,undefined,'<main id="cocoApp"></main>');
 try{
  await api.ready;
  const ids=['conecta','numeros','calculo','palabras','sopa','sudoku','memoria','series','crucigrama','tiempo','verdadero','cocomed','futbol','padel','ajedrez','bank','ciudad','generala','naval','eneagrama','ideas','hero-explorer-v160129'];
  const app=doc.querySelector('#cocoApp');
  for(const id of ids){const card=doc.createElement('div');card.className='cocoMiniJuego';card.dataset.cocoJuego=id;card.innerHTML=`<span class="cocoMiniIcono"><img class="cocoOfficialThumb" src="/share/premium-v160126/${id}.jpg" srcset="/share/premium-v160126/${id}-720.webp 720w"></span>`;app.append(card)}
  for(const locale of [...locales,'fi','en','es']){
   await api.setLanguage(locale);await new Promise(r=>w.setTimeout(r,20));
   const originals=app.querySelectorAll('img.cocoOfficialThumb');
   assert.equal(originals.length,22);
   assert.equal(app.querySelectorAll('.cocoLocalizedThumbnail').length,locale==='es'?0:22);
   for(const img of originals){
    assert.match(img.getAttribute('src'),/\.jpg$/);assert.ok(img.hasAttribute('srcset'));
    if(locale==='es'){assert.notEqual(img.style.display,'none');continue}
    assert.equal(img.style.display,'none');assert.equal(img.style.getPropertyPriority('display'),'important');
    const art=img.nextElementSibling;assert.match(art.querySelector('img').src,/\/art\/[^/]+\.webp$/);
    for(const el of art.querySelectorAll('[data-coco-copy]')){
     const source=el.getAttribute('data-coco-source-text');
     assert.ok(Object.hasOwn(readPack(locale).strings,source),`${locale}: missing ${source}`);
     assert.equal(el.textContent,api.t(source),`${locale}: ${source}`);
    }
   }
  }
  await api.setLanguage('fi');
  const clone=app.firstElementChild.cloneNode(true);app.append(clone);
  await new Promise(r=>w.setTimeout(r,25));
  assert.equal(clone.querySelectorAll('.cocoLocalizedThumbnail').length,1);
  await api.setLanguage('de');
  assert.equal(clone.querySelector('[data-coco-copy]').textContent,api.t('Conecta colores'));
  clone.querySelector('.cocoMiniIcono').innerHTML='<img class="cocoOfficialThumb" src="/share/premium-v160126/memoria.jpg">';
  await new Promise(r=>w.setTimeout(r,25));
  assert.equal(clone.querySelector('.cocoLocalizedThumbnail strong').textContent,api.t('Memoria'));
 }finally{dom.window.close()}
});

test('thumbnail lettering cannot become the title targeted by the real tool-card decorator',async()=>{
 const {api,w,doc,dom}=page(undefined,undefined,undefined,'<main id="cocoApp"><div class="cocoMiniJuego" data-coco-juego="padel"><span class="cocoMiniIcono"><img src="/share/premium-v160126/padel.jpg"></span><b id="real-card-title">Pádel</b><div class="cocoExcellenceMeta"></div></div></main>');
 try{
  await api.ready;await api.setLanguage('fi');
  const source=fs.readFileSync(path.join(root,'coco-excellence-v160934.js'),'utf8');
  const fn=source.slice(source.indexOf('  function decorateCards(scope){'),source.indexOf('  function decorateArcade(){'));
  const decorate=w.Function('GAME','gameIdFromCard',fn+';return decorateCards;')({padel:{tool:true}},()=> 'padel');
  decorate(doc);
  assert.equal(doc.querySelector('.cocoExToolLabel').parentElement,doc.querySelector('.cocoMiniJuego'));
  assert.equal(doc.querySelector('.cocoLocalizedThumbnail .cocoExToolLabel'),null);
  assert.equal(doc.querySelector('.cocoMiniJuego').querySelector('h3,b').id,'real-card-title');
 }finally{dom.window.close()}
});

test('Coco Pádel keeps the language selector and club directory available in all fifteen languages',async()=>{
  const fetchPack=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url.pathname),'utf8'))});
  const {w,doc,dom,api}=page('https://coco.test/',fetchPack);
  try{
    doc.documentElement.setAttribute('data-coco-extra-languages','');await api.ready;
    w.CocoArcadeDemo=true;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};
    w.requestAnimationFrame=fn=>w.setTimeout(fn,1);
    for(const file of ['coco-v144-core.js','coco-v152-padel.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
    const original=doc.querySelector('[data-coco-language-menu] select');
    await w.CocoPadelV152.open();
    const dialog=doc.querySelector('.cocoV144Modal.visible');
    const picker=dialog.querySelector('[data-coco-game-picker] select');assert.equal(picker,original);
    dialog.querySelector('[data-padel144-view="players"]').click();
    for(const tag of [...locales.slice(1),'es']){
      await api.setLanguage(tag);assert.equal(picker.value,tag);
      const source='Directorio del club';
      assert.ok(dialog.textContent.includes(api.t(source)),tag);
      if(tag!=='es')assert.ok(!dialog.textContent.includes(source),tag);
    }
    w.CocoV144.closeModal();assert.equal(doc.querySelector('[data-coco-language-menu] select'),original);
  }finally{dom.window.close();}
});

test('family learning reports translate stored concepts, subjects and signal guidance on screen and in saved HTML',async()=>{
  const {api,w,doc,dom}=page();
  try {
    await api.ready;
    w.eval(fs.readFileSync(path.join(root,'coco-v153-fixes.js'),'utf8'));
    w.eval(fs.readFileSync(path.join(root,'eterna-worker/src/library/compass-data-v1.js'),'utf8'));
    const subjects=[...new Set(Object.values(w.ETERNA_COMPASS_DATA.subjects).flat())];
    const guidance=fs.readFileSync(path.join(root,'eterna-v159.js'),'utf8').match(/var FAMILY_SIGNAL_DEFINITION="([^"]+)"/)[1];
    const inputs=['Fracciones equivalentes','suma de fracciones con distinto denominador','DIVISIÓN','capitales de Europa','tabla del 7','multiplicaciones','tabla de multiplicar del 12','Taller, «A y B»'];
    const scores=[64,89,55,79,52,54,70,45],custom=inputs.at(-1);
    const model={theme:'learning',signalDefinition:guidance,hero:{title:'Más avance en: '+inputs[1]},
      bars:inputs.map((label,i)=>({label,sublabel:i===3?'Ciencias Sociales':'Matemáticas',value:scores[i],detail:'21 interacciones'})),
      panels:[{items:[{label:inputs[3],detail:'Ciencias Sociales · 9 interacciones'}]}],
      nextStep:{title:'Practicar: '+inputs[2]},groups:[{title:'Materias trabajadas',items:subjects.concat(['Matemáticas I',custom])}]};
    const kit=w.CocoFamilyReportKitV16084;
    doc.body.insertAdjacentHTML('beforeend',kit.coreHtml(model));
    for(const tag of ['es',...locales.slice(1),'es']){
      await api.setLanguage(tag);
      const exported=new w.DOMParser().parseFromString(kit.documentHtml(model),'text/html');
      const terms=tag==='es'?{}:readPack(tag).reportTerms;
      const normalize=s=>s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
      const expected=tag==='es'?inputs:inputs.map((v,i)=>i===7?custom:i===4||i===6?
        terms['tabla del {n}'].replace('{n}',(i===4?7:12).toLocaleString(tag)):terms[normalize(v)]);
      for(const scope of [doc,exported]){
        const body=scope.querySelector('.cocoV16083ReportBody');
        assert.equal(body.querySelector('.cocoV16083SignalNote p').textContent,api.t(guidance));
        if(tag!=='es')assert.notEqual(api.t(guidance),guidance,tag+' guidance');
        assert.deepEqual([...body.querySelectorAll('.cocoV16083BarLabel b')].map(el=>el.textContent),expected);
        assert.deepEqual([...body.querySelectorAll('.cocoV16083BarList article>strong')].map(el=>el.textContent),scores.map(n=>n.toLocaleString(tag)));
        assert.equal(body.querySelector('.cocoV16083Item b').textContent,expected[3]);
        assert.ok(body.querySelector('.cocoV16083Next h3').textContent.includes(expected[2]));
        const social=tag==='es'?'Ciencias Sociales':terms['ciencias sociales'];
        assert.ok(body.querySelector('.cocoV16083Item span').textContent.includes(social));
        assert.deepEqual([...body.querySelectorAll('.cocoV16083GroupGrid article>div>span')].map(el=>el.textContent),[
          ...subjects.map(subject=>tag==='es'?subject:terms[subject==='Volumen'?'volumen (asignatura)':normalize(subject)]),
          tag==='es'?'Matemáticas I':terms.matematicas+' I',custom
        ]);
      }
    }
  }finally{dom.window.close();}
});
