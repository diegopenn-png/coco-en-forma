import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {discoveryPages} from '../seo/discovery.mjs';
import {games,origin} from '../seo/catalog.mjs';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p.replace(/^\//,''),root),'utf8');
const page=p=>new JSDOM(read(p),{url:origin+p}).window.document;

test('ten useful static pages have unique metadata and complete local navigation',()=>{
 assert.equal(discoveryPages.length,10);const titles=new Set(),descriptions=new Set();
 for(const p of discoveryPages){
  const path=`/${p.slug}/`,d=page(path+'index.html');
  assert.equal(d.querySelectorAll('h1').length,1,p.slug);
  assert.equal(d.querySelector('link[rel=canonical]').href,origin+path);
  assert.equal(d.querySelector('meta[property="og:url"]').content,origin+path);
  assert.equal(d.documentElement.lang,'es');
  assert.match(d.querySelector('meta[name=robots]').content,/index,follow/);
  assert.ok(d.querySelector('main').textContent.split(/\s+/).length>450,p.slug+' lacks useful content');
  assert.ok(!d.querySelector('meta[http-equiv=refresh]'));
  assert.ok(!/location\.(replace|assign)/.test(read(path+'index.html')));
  titles.add(d.title);descriptions.add(d.querySelector('meta[name=description]').content);
  for(const el of d.querySelectorAll('a[href],link[href],script[src],img[src]')){
   const u=new URL(el.getAttribute('href')||el.getAttribute('src'),origin+path);
   if(u.origin!==origin)continue;
   const dest=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
   assert.ok(existsSync(new URL('.'+dest,root)),`${path} -> ${dest}`);
   if(u.hash){const target=u.pathname===path?d:page(dest);assert.ok(target.getElementById(decodeURIComponent(u.hash.slice(1))),`${path} missing ${u.hash}`);}
  }
  for(const img of d.images){assert.ok(img.alt);assert.ok(img.width>0&&img.height>0);}
  const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  for(const q of graph.find(x=>x['@type']==='FAQPage').mainEntity){assert.ok(d.body.textContent.includes(q.name));assert.ok(d.body.textContent.includes(q.acceptedAnswer.text));}
  assert.ok(!/aggregateRating|reviewCount/.test(JSON.stringify(graph)));
  assert.ok(d.querySelector('#ejemplo details summary'));
 }
 assert.equal(titles.size,10);assert.equal(descriptions.size,10);
});

test('free-game CTAs use existing game routes and Eterna modes survive the login intent',()=>{
 const onboarding=read('eterna-onboarding-v16067.js');
 for(const p of discoveryPages){const d=page(`/${p.slug}/index.html`);
  if(p.type==='games'){
   assert.equal(d.querySelectorAll('[data-play]').length,p.games.length);
   for(const a of d.querySelectorAll('[data-play]'))assert.ok(p.games.some(id=>games.find(g=>g.id===id).play===a.getAttribute('href')));
  }else{
   for(const a of d.querySelectorAll('[data-eterna]')){const q=new URL(a.href).searchParams;assert.equal(q.get('open'),'eterna');assert.equal(q.get('mode'),p.mode);assert.ok(onboarding.includes('"'+p.mode+'"'));assert.match(q.get('source'),/^seo_/);}
   assert.match(d.querySelector('#planes').textContent,/7,99 €/);assert.match(d.querySelector('#planes').textContent,/79,99 €/);
   assert.ok(d.querySelector('a[href="/suscripciones-y-desistimiento.html"]'));
  }
 }
});

test('sitemap preserves existing public content and new pages are linked from the catalogue',()=>{
 const xml=new JSDOM(read('sitemap.xml'),{contentType:'application/xml'}).window.document;
 const urls=[...xml.querySelectorAll('loc')].map(n=>n.textContent);assert.equal(new Set(urls).size,urls.length);
 assert.ok(urls.includes('https://www.cocoenforma.com/galeria/impresiones-3d/'));assert.ok(urls.includes(origin+'/eterna-captacion.html'));
 const hub=page('/juegos/index.html');
 for(const p of discoveryPages){assert.ok(urls.includes(origin+`/${p.slug}/`));assert.ok(hub.querySelector(`a[href="/${p.slug}/"]`));}
 for(const g of games){const d=page(g.path+'index.html');assert.ok(d.querySelector('a[href="/apoyo-escolar-con-ia/"]'));}
 for(const url of urls){assert.ok(!/[?#]/.test(url));const pathname=new URL(url).pathname;assert.ok(existsSync(new URL('.'+pathname+(pathname.endsWith('/')?'index.html':''),root)),url);}
});

test('share copies canonical URL and static examples do not contact services',async()=>{
 const dom=new JSDOM(read('apoyo-escolar-con-ia/index.html'),{url:'https://preview.example/apoyo-escolar-con-ia/',runScripts:'outside-only'});
 const w=dom.window;let copied;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});
 w.eval(read('seo/landing.js'));w.document.querySelector('[data-copy]').click();await new Promise(setImmediate);
 assert.equal(copied,origin+'/apoyo-escolar-con-ia/');
 for(const p of discoveryPages){const d=page(`/${p.slug}/index.html`);assert.deepEqual([...d.querySelectorAll('script[src]')].map(x=>x.getAttribute('src')),['/seo/landing.js?v=1']);}
});
