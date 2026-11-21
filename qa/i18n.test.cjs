const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');

const root = path.resolve(__dirname, '..');
const locales = ['es','en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
const code = fs.readFileSync(path.join(root,'i18n/coco.js'),'utf8');
const readPack = id => JSON.parse(fs.readFileSync(path.join(root,'i18n/packs',id+'.json'),'utf8'));

function page(url='https://coco.test/?source=pwa-v159',customFetch) {
  const body = '<div data-coco-language-menu></div><div class="loginCard"><label for="pw">Contraseña</label><input id="pw" type="password"><button>Entrar</button></div><div data-coco-juego="crucigrama"><b>Crucigrama</b></div><table><tbody><tr><td>Memoria</td><td>23</td></tr></tbody></table>';
  const dom = new JSDOM('<html lang="es"><head><link rel="manifest" href="/manifest.webmanifest"></head><body>'+body+'</body></html>',{url,runScripts:'outside-only'});
  const w=dom.window;
  const script=w.document.createElement('script');script.src='/i18n/coco.js';
  Object.defineProperty(w.document,'currentScript',{get:()=>script});
  w.fetch=customFetch || (async url => ({ok:true,json:async()=>readPack(path.basename(url.pathname,'.json'))}));
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

test('every published game landing and the catalogue have translated headings and actions in each pack',()=>{
  const paths=['juegos/index.html',...fs.readdirSync(path.join(root,'juego')).map(id=>'juego/'+id+'/index.html')];
  const headings=new Set();
  for(const file of paths){
    const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));
    try {
      const doc=dom.window.document;
      assert.ok(doc.querySelector('[data-coco-language-menu]'),file);
      for(const el of doc.querySelectorAll('h1,h2,.actions a,.actions button,nav a')){
        for(const node of el.childNodes){
          const key=node.textContent.trim().replace(/\s+/g,' ');
          if(node.nodeType===3 && /[a-z]/i.test(key))headings.add(key);
        }
      }
    } finally {dom.window.close();}
  }
  for(const language of locales.filter(l=>l!=='es')){
    const pack=readPack(language);
    for(const key of headings)assert.ok(pack.strings[key],language+' / '+key);
  }
});
