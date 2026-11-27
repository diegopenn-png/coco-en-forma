import test from 'node:test';
import {newGamePaths} from '../seo/game-pages.mjs';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');
const root = new URL('../', import.meta.url);
const origin = 'https://cocoenforma.com';
const read = path => readFileSync(new URL(path, root), 'utf8');
const doc = path => new JSDOM(read(path)).window.document;
const sitemap = new JSDOM(read('sitemap.xml'), {contentType:'application/xml'}).window.document;
const urls = [...sitemap.querySelectorAll('loc')].map(el => el.textContent);
const robotsGroups = new Map();
let group;
for (const line of read('robots.txt').split('\n')) {
  if (line.startsWith('User-agent:')) {
    group = line.slice(11).trim();
    robotsGroups.set(group, []);
  } else if (group && line.startsWith('Disallow:')) {
    robotsGroups.get(group).push(line.slice(9).trim());
  }
}
const exclusions = robotsGroups.get('*');
const canCrawl = url => !exclusions.some(path => new URL(url).pathname.startsWith(path));

test('every sitemap URL is crawlable, indexable and declares itself as canonical', async () => {
  assert.equal(urls.length, 53 + newGamePaths().length);
  assert.ok(urls.includes(origin + '/juego/truco/'));
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls) {
    const u = new URL(url);
    assert.equal(u.origin, origin, url);
    assert.equal(u.search + u.hash, '', url);
    assert.ok(canCrawl(url), url);
    const d = doc(u.pathname.slice(1) + (u.pathname.endsWith('/') ? 'index.html' : ''));
    assert.deepEqual([...d.querySelectorAll('link[rel=canonical]')].map(el => el.href), [url], url);
    assert.ok(![...d.querySelectorAll('meta[name=robots],meta[name=googlebot]')].some(el => /noindex|none/.test(el.content)), url);
    for (const el of d.querySelectorAll('meta[property="og:url"]')) assert.equal(el.content, url, url);
    d.defaultView.close();
    await new Promise(setImmediate);
  }
});

test('all indexable HTML has one absolute canonical; verification and noindex pages are exempt', async () => {
  function walk(dir = '') {
    return readdirSync(new URL(dir, root), {withFileTypes:true}).flatMap(entry => {
      if (entry.name.startsWith('.') || ['qa','node_modules','supabase'].includes(entry.name)) return [];
      const path = dir + entry.name;
      return entry.isDirectory() ? walk(path + '/') : path.endsWith('.html') ? [path] : [];
    });
  }
  for (const path of walk()) {
    if (path === 'googlee572e794d4f008ee.html') continue;
    const d = doc(path);
    if ([...d.querySelectorAll('meta[name=robots]')].some(el => /noindex/.test(el.content))) {
      d.defaultView.close();
      continue;
    }
    const links = [...d.querySelectorAll('head link[rel=canonical]')];
    assert.equal(links.length, 1, path);
    const u = new URL(links[0].href);
    assert.equal(u.origin, origin, path);
    assert.equal(u.search + u.hash, '', path);
    d.defaultView.close();
    await new Promise(setImmediate);
  }
});

test('duplicate entry URLs can expose canonical and internal pages can expose noindex', () => {
  assert.deepEqual(exclusions, ['/api/','/qa/','/supabase/']);
  assert.deepEqual(robotsGroups.get('Google-Extended'), exclusions);
  assert.equal(doc('index.html').querySelector('link[rel=canonical]').href, origin + '/');
  for (const path of ['/?juego=memoria','/?coco_bank=1','/index.html?juego=memoria','/explora/jugar.html']) {
    assert.ok(canCrawl(origin + path), path);
  }
  for (const path of ['explora/jugar.html','galeria/impresiones-3d/admin.html','galeria/impresiones-3d/pedido.html','regalos/admin.html','regalos/pedido.html']) {
    assert.match(doc(path).querySelector('meta[name=robots]').content, /noindex/, path);
    assert.ok(!urls.includes(origin + '/' + path), path);
  }
});

test('gallery aliases and structured data agree with the final apex destination', () => {
  const target = origin + '/galeria/impresiones-3d/';
  for (const path of ['galeria/impresiones-3d/index.html','galeria/impresiones3d/index.html','galeria/impresiones3D/index.html']) {
    const d = doc(path);
    assert.equal(d.querySelector('link[rel=canonical]').href, target);
    assert.equal(d.querySelector('meta[property="og:url"]').content, target);
  }
  const data = JSON.parse(doc('galeria/impresiones-3d/index.html').querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(data.url, target);
  assert.ok(!JSON.stringify(data).includes('https://www.cocoenforma.com'));
});
