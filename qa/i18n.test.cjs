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
  const body = '<div data-coco-language-menu></div><div class="loginCard"><label for="pw">Contraseña</label><input id="pw" type="password"><button>Entrar</button></div><div data-coco-juego="crucigrama"><b>Crucigrama</b></div><table><tbody><tr><td>Memoria</td><td>23</td></tr></tbody></table>';
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
    doc.querySelector('input').value='synthetic-value';
    for(const locale of locales) {
      assert.equal(await api.setLanguage(locale),true);
      assert.equal(doc.documentElement.lang,locale);
      assert.equal(doc.documentElement.dir,locale==='ar'?'rtl':'ltr');
      const text=locale==='es'?'Contraseña':readPack(locale).strings['Contraseña'];
      assert.equal(doc.querySelector('label').textContent,text);
      assert.equal(doc.querySelector('input').value,'synthetic-value');
      assert.deepEqual([...doc.querySelectorAll('td')].map(td=>td.textContent),['Memoria','23']);
      assert.equal(w.localStorage.getItem('coco.language.v1'),locale);
      const badge=doc.querySelector('[data-game-language]');
      assert.equal(badge?.textContent,locale==='es'?undefined:readPack(locale).strings['Juego en español']);
      const manifestPath=new URL(doc.querySelector('link').href).pathname;
      const manifest=JSON.parse(fs.readFileSync(path.join(root,manifestPath),'utf8'));
      assert.equal(new URL(manifest.id,'https://coco.test'+manifestPath).pathname,'/');
      for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root,new URL(icon.src,'https://coco.test'+manifestPath).pathname)));
    }
    await api.setLanguage('es');
    assert.equal(doc.querySelector('.loginCard button').textContent,'Entrar');
  } finally {dom.window.close();}
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
      assert.equal(api.spanishGame('crucigrama'),true);
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

test('language arrows wrap around and the native menu stays in sync',async()=>{
  const {api,doc,w,dom}=page();
  try {
    await api.ready;
    const changed=()=>new Promise(resolve=>w.addEventListener('coco:language',resolve,{once:true}));
    const prev=doc.querySelector('[data-coco-language-menu] button');
    const next=doc.querySelector('[data-coco-language-menu] button:last-child');
    let update=changed();prev.click();await update;
    assert.equal(api.tag,'da');assert.equal(next.getAttribute('aria-label'),readPack('da').strings['Idioma siguiente']);
    update=changed();next.click();await update;assert.equal(doc.querySelector('select').value,'es');
  }finally{dom.window.close();}
});

test('all catalogue descriptions, guides and standalone game menu text have entries in each language',()=>{
  const guides=fs.readdirSync(root,{withFileTypes:true})
    .filter(f=>f.isDirectory() && /^(?:apoyo|aprender|ayuda|preparar|juegos-)/.test(f.name))
    .map(f=>f.name+'/index.html');
  const directories=folder=>fs.readdirSync(path.join(root,folder)).map(id=>folder+'/'+id+'/index.html');
  const paths=['juegos/index.html','explora/index.html',...directories('juego'),...directories('games'),...guides];
  const strings=new Set();
  for(const file of paths){
    const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));
    try {
      const doc=dom.window.document;
      assert.ok(doc.querySelector('[data-coco-language-menu]'),file);
      for(const el of doc.body.querySelectorAll('p,button,a,label,h1,h2,h3,h4,li,span,b,strong,small,summary,figcaption')){
        if(el.closest('[data-coco-verbatim],code'))continue;
        for(const node of el.childNodes){
          if(node.nodeType!==3)continue;
          const key=node.data.trim().replace(/\s+/g,' ');
          if(/[A-Za-zÀ-ɏ]{2}/.test(key))strings.add(key);
        }
      }
    } finally {dom.window.close();}
  }
  for(const language of locales.filter(l=>l!=='es')){
    const pack=readPack(language);
    for(const key of strings)assert.ok(pack.strings[key],language+' / '+key);
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
  const {w,doc,api,dom}=page('https://coco.test/aviso-legal.html?document_original=es',undefined,'pl','<a data-coco-original-document href="?document_original=es">Ver original en español</a>');
  try {
    await api.ready;
    assert.equal(api.tag,'es');
    assert.equal(w.localStorage.getItem('coco.language.v1'),'pl');
    assert.equal(doc.querySelector('[data-coco-original-document]').hidden,true);
    await api.setLanguage('it');
    assert.equal(w.location.search,'?lang=it');
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
      assert.ok(person.includes(tag==='es'?'10 años':new Intl.NumberFormat(tag,{style:'unit',unit:'year',unitDisplay:'long'}).format(10)));
      assert.equal(doc.querySelector('.cocoV16083Metrics article strong').textContent,'12');
      assert.equal(doc.querySelector('.cocoV16083Metrics article span').textContent,api.t('partidas que puntúan'));
      assert.equal(doc.querySelector('.cocoV16086DocumentTitle').textContent,api.t('Así está avanzando'));
      assert.equal(doc.querySelector('[onclick="window.print()"]').textContent,api.t('Imprimir o guardar como PDF'));
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
      assert.ok(button.includes(strings[game]),tag+' / '+game);
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
