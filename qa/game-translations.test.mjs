import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {games,origin} from '../seo/catalog.mjs';
import {gamePath,gameCopy,localizedLandingPath,tags} from '../seo/game-pages.mjs';

const require = createRequire(import.meta.url);
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');
const root = new URL('../',import.meta.url);
const read = path => readFileSync(new URL('.'+path+'index.html',root),'utf8');

test('every game has an indexable native page, a reciprocal language menu and a working localized play destination', async () => {
  const uniquePaths = new Set();
  const sitemap = readFileSync(new URL('sitemap.xml',root),'utf8');
  for (const tag of tags) {
    const hub = new JSDOM(read(localizedLandingPath(tag)));
    try {
      for (const game of games) {
        const path = gamePath(game,tag), url = origin+path;
        assert.ok(!uniquePaths.has(path),path);
        uniquePaths.add(path);
        assert.ok(hub.window.document.querySelector(`a[href="${path}"]`),path);
        assert.ok(sitemap.includes(`<loc>${url}</loc>`),path);
        const dom = new JSDOM(read(path),{url});
        try {
          const d = dom.window.document;
          assert.equal(d.documentElement.lang,tag,path);
          assert.equal(d.querySelector('link[rel=canonical]').href,url,path);
          assert.equal(d.querySelectorAll('h1').length,1,path);
          assert.equal(d.querySelectorAll('link[hreflang]').length,16,path);
          assert.equal(d.querySelector('link[hreflang="x-default"]').href,origin+game.path,path);
          for (const other of tags) {
            const destination = origin+gamePath(game,other);
            assert.equal(d.querySelector(`link[hreflang="${other}"]`).href,destination,path);
            assert.equal(d.querySelector(`a[hreflang="${other}"]`).href,destination,path);
          }
          if (tag === 'es') continue;
          const copy = gameCopy(game,tag);
          for (const key of ['intro','tip','challenge','answer']) assert.ok(d.querySelector('main').textContent.includes(copy[key]),path);
          assert.equal(d.querySelector('h1').textContent,copy.name,path);
          assert.equal(d.querySelector('meta[name=description]').content,copy.intro,path);
          const play = new URL(d.querySelector('[data-play]').href);
          assert.equal(play.searchParams.get('lang'),tag,path);
          assert.equal(play.searchParams.get('source'),`seo_game_${game.id}_${tag}`,path);
          play.searchParams.delete('lang'); play.searchParams.delete('source');
          assert.equal(play.href,new URL(game.play,origin).href,path);
          for (const el of d.querySelectorAll('img[src],script[src],link[href],a[href]')) {
            const resource = new URL(el.getAttribute('src') || el.getAttribute('href'),url);
            assert.equal(resource.origin,origin,path);
            const file = resource.pathname.replace(/\/$/,'/index.html');
            assert.ok(existsSync(new URL('.'+file,root)),path+' links to '+file);
          }
        } finally {
          dom.window.close();
          await new Promise(setImmediate);
        }
      }
    } finally {hub.window.close();}
  }
  assert.equal(uniquePaths.size,tags.length*games.length);
});
