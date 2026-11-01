import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {games,catalogue,origin} from '../seo/catalog.mjs';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p.replace(/^\//,''),root),'utf8');
const doc=p=>new JSDOM(read(p),{url:origin+p}).window.document;

test('all 17 active game routes are substantial, unique and crawlable without JS',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const g of games){const html=read(g.path+'index.html'),d=doc(g.path+'index.html');
  assert.equal(d.querySelectorAll('h1').length,1,g.id);
  assert.equal(d.querySelector('link[rel=canonical]').href,origin+g.path,g.id);
  assert.equal(d.querySelector('meta[property="og:url"]').content,origin+g.path);
  assert.match(d.querySelector('meta[name=robots]').content,/index,follow/);
  assert.ok(!/location\.(replace|assign)|http-equiv="refresh"/.test(html),g.id+' redirects readers');
  assert.ok(d.querySelector('main').textContent.split(/\s+/).length>300,g.id+' thin page');
  titles.add(d.title);descriptions.add(d.querySelector('meta[name=description]').content);
  assert.equal(d.querySelector('[data-play]').getAttribute('href'),g.play);
  const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  const faq=graph.find(n=>n['@type']==='FAQPage');
  assert.ok(faq.mainEntity.length>=4);
  for(const q of faq.mainEntity){assert.ok(d.body.textContent.includes(q.name));assert.ok(d.body.textContent.includes(q.acceptedAnswer.text));}
  assert.ok(!/aggregateRating|reviewCount|priceCurrency/.test(JSON.stringify(graph)),'No invented reviews/pricing');
  for(const a of d.querySelectorAll('a[href]')){const u=new URL(a.href);if(u.origin!==origin)continue;const p=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;assert.ok(existsSync(new URL('.'+p,root)),g.id+' broken '+p);if(u.hash&&u.pathname===g.path)assert.ok(d.getElementById(u.hash.slice(1)),g.id+' missing anchor');}
  for(const img of d.images){assert.ok(existsSync(new URL('.'+new URL(img.src).pathname,root)));assert.ok(img.alt);assert.ok(Number(img.getAttribute('width'))>0);}
 }
 assert.equal(titles.size,17);assert.equal(descriptions.size,17);
});
test('catalogue and sitemap include every active landing, with no login/room URLs',()=>{
 const d=doc('juegos/index.html'),xml=read('sitemap.xml');assert.equal(d.querySelectorAll('[data-game-card]').length,18);
 for(const g of catalogue){assert.ok(d.querySelector(`a[href="${g.path}"]`),g.id);assert.ok(xml.includes(origin+g.path),g.id);}
 const dom=new JSDOM(xml,{contentType:'application/xml'});assert.equal(dom.window.document.querySelector('parsererror'),null);
 for(const loc of dom.window.document.querySelectorAll('loc'))assert.ok(!/[?]|#sala|jugar.html|\/qa\//.test(loc.textContent));
 const robots=read('robots.txt');assert.match(robots,/User-agent: \*\nAllow: \//);assert.ok(!/Disallow: \/\s*\n/.test(robots));
 assert.ok(read('index.html').includes('href="/juegos/"'));
});
test('filter handles accents, empty state and one-result grammar; content stays visible without scripts',()=>{
 const dom=new JSDOM(read('juegos/index.html'),{url:origin+'/juegos/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('[data-game-card]:not([hidden])').length,18);
 w.eval(read('seo/landing.js'));const input=d.querySelector('#game-search');
 for(const [query,total] of [['ajedrez',1],['PADEL',1],['no-game-here',0],['',18]]){input.value=query;input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('[data-game-card]:not([hidden])').length,total);assert.equal(d.querySelector('#empty-results').hidden,total>0);if(total===1)assert.equal(d.querySelector('#result-count').textContent,'1 propuesta disponible');}
 const select=d.querySelector('#game-category');select.value='En grupo';select.dispatchEvent(new w.Event('change'));assert.equal(d.querySelectorAll('[data-game-card]:not([hidden])').length,2);
});
test('copy uses canonical public URL and provides a selectable fallback if clipboard is blocked',async()=>{
 const dom=new JSDOM(read('juego/ajedrez/index.html'),{url:'https://preview.example/juego/ajedrez/?test=1',runScripts:'outside-only'}),w=dom.window,d=w.document;let copied;
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{copied=t}},configurable:true});w.eval(read('seo/landing.js'));d.querySelector('[data-copy]').click();await new Promise(setImmediate);assert.equal(copied,origin+'/juego/ajedrez/');
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked')}}});d.querySelector('[data-copy]').click();await new Promise(setImmediate);assert.equal(d.querySelector('.copy-fallback').value,copied);assert.equal(d.querySelectorAll('.copy-fallback').length,1);
});
test('18 premium artworks, fixed aspect ratio, mobile renditions and PWA cache coverage',()=>{
 const sw=read('sw.js');
 for(const g of catalogue){for(const suffix of ['.jpg','-720.webp']){const path=`share/premium-v160126/${g.id}${suffix}`,buf=readFileSync(new URL(path,root));assert.ok(buf.length>15000);assert.ok(statSync(new URL(path,root)).size<(suffix==='.jpg'?220000:100000),path);assert.ok(sw.includes('./'+path),path+' missing PWA cache');}
  assert.match(g.image,/premium-v160126/);
 }
 assert.ok(read('coco-v155-identity.js').includes('premium-v160126'));
 assert.ok(read('games/ajedrez/entry.mjs').includes("new URL('/juego/ajedrez/'"));
 assert.ok(read('games/ciudad/entry.mjs').includes("new URL('/juego/ciudad/'"));
});
test('special product promises remain accurate',()=>{
 assert.match(read('juego/ajedrez/index.html'),/100 puntos por victoria, 50 por tablas y 0 por derrota/);
 assert.match(read('juego/ciudad/index.html'),/no añade puntos a la clasificación general/);
 assert.match(read('juego/bank/index.html'),/No se compran productos financieros reales/);
 assert.match(read('juego/padel/index.html'),/herramienta para organizar partidos y encuentros reales/);
 assert.match(read('explora/index.html'),/Cuestionario original no validado/);
});
