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
    assert.equal(doc.querySelector('button').textContent,'Entrar');
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
