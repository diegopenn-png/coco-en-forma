import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {games, origin} from '../seo/catalog.mjs';

const require = createRequire(import.meta.url);
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path.replace(/^\//, ''), root), 'utf8');
const locales = ['es','en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
const featuredGames = ['memoria','sudoku','conecta','ajedrez','generala','naval'];
const copy = JSON.parse(read('seo/locales/free-games.json'));
const route = tag => tag === 'es' ? '/juegos-gratis/' : `/${tag.toLowerCase()}/${copy[tag].slug}/`;
const pages = new Map();
const text = node => node.textContent.trim();

function page(tag) {
  assert.ok(copy[tag], `missing ${tag} landing copy`);
  if (!pages.has(tag)) {
    const path = route(tag);
    const dom = new JSDOM(read(path + 'index.html'), {url:origin + path});
    pages.set(tag, {dom, document:dom.window.document, path, url:origin + path});
  }
  return pages.get(tag);
}

function graph(document) {
  return JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
}

after(() => { for (const {dom} of pages.values()) dom.window.close(); });

test('all 15 languages render useful, distinct content before JavaScript runs', () => {
  assert.deepEqual(Object.keys(copy).sort(), [...locales].sort());
  const titles = new Set(), descriptions = new Set(), headings = new Set();
  for (const tag of locales) {
    const {document:d} = page(tag), expected = copy[tag];
    assert.equal(d.documentElement.lang, tag);
    assert.equal(d.documentElement.dir, tag === 'ar' ? 'rtl' : 'ltr');
    assert.equal(d.body.dataset.cocoLandingLocale, tag);
    assert.equal(d.querySelectorAll('h1').length, 1, tag);
    assert.equal(text(d.querySelector('h1')), expected.heading, tag);
    assert.equal(text(d.querySelector('.hero [data-free-games]')), expected.labels.free, tag);
    assert.equal(text(d.querySelector('.lead')), expected.intro, tag);
    assert.equal(d.title, expected.title, tag);
    assert.equal(d.querySelector('meta[name="description"]').content, expected.description, tag);
    assert.equal(text(d.querySelector('label[for="landing-language"]')), expected.labels.language, tag);
    assert.equal(d.querySelector('meta[http-equiv="refresh"]'), null, tag);
    for (const id of ['contenido','elige-juego','guia','ejemplo','preguntas']) {
      const section = d.getElementById(id);
      assert.ok(section, `${tag}: missing ${id}`);
      assert.equal(section.closest('[hidden],[aria-hidden="true"],template'), null, `${tag}: hidden ${id}`);
    }
    assert.ok(d.querySelectorAll('#guia article').length >= 2, tag);
    for (const section of expected.sections) {
      assert.ok(text(d.querySelector('#guia')).includes(section.title), tag);
      for (const paragraph of section.paragraphs) assert.ok(text(d.querySelector('#guia')).includes(paragraph), tag);
    }
    assert.equal(d.querySelectorAll('.steps > li').length, 3, tag);
    assert.equal(text(d.querySelector('#ejemplo details p')), expected.example.answer, tag);
    assert.equal(text(d.querySelector('.language-note')), expected.note.spanishContent, tag);
    assert.ok(text(d.querySelector('.related')).includes(expected.note.eterna), tag);
    assert.deepEqual([...d.querySelectorAll('script[src]')].map(el => el.getAttribute('src')), ['/seo/localized.js?v=20261122-4'], tag);
    if (tag !== 'es') {
      assert.notEqual(expected.heading, copy.es.heading, tag);
      assert.notEqual(expected.intro, copy.es.intro, tag);
    }
    titles.add(d.title); descriptions.add(expected.description); headings.add(expected.heading);
  }
  assert.equal(titles.size, 15);
  assert.equal(descriptions.size, 15);
  assert.equal(headings.size, 15);
});

test('canonicals and reciprocal hreflang resolve to 15 crawlable sitemap destinations', () => {
  const sitemap = new JSDOM(read('sitemap.xml'), {contentType:'application/xml'});
  const urls = [...sitemap.window.document.querySelectorAll('loc')].map(text);
  const expected = new Map(locales.map(tag => [tag, origin + route(tag)]));
  expected.set('x-default', origin + '/juegos-gratis/');
  const disallowed = read('robots.txt').split('\n').filter(line => line.startsWith('Disallow:')).map(line => line.slice(9).trim());
  try {
    for (const tag of locales) {
      const {document:d, path, url} = page(tag);
      assert.deepEqual([...d.querySelectorAll('link[rel="canonical"]')].map(el => el.href), [url], tag);
      assert.match(d.querySelector('meta[name="robots"]').content, /index,follow/);
      assert.ok(!disallowed.some(prefix => path.startsWith(prefix)), tag);
      assert.equal(urls.filter(value => value === url).length, 1, tag);
      const alternates = [...d.querySelectorAll('link[rel="alternate"][hreflang]')];
      assert.equal(alternates.length, 16, tag);
      assert.equal(new Set(alternates.map(el => el.hreflang)).size, 16, tag);
      assert.deepEqual(new Map(alternates.map(el => [el.hreflang, el.href])), expected, tag);
      for (const alternate of alternates) {
        const target = new URL(alternate.href);
        assert.equal(target.search + target.hash, '', tag);
        assert.ok(existsSync(new URL('.' + target.pathname + 'index.html', root)), alternate.href);
      }
    }
  } finally { sitemap.window.close(); }
});

test('social metadata and structured data describe the visible page without invented ratings', () => {
  for (const tag of locales) {
    const {document:d, url} = page(tag), data = graph(d);
    assert.equal(d.querySelector('meta[property="og:url"]').content, url, tag);
    for (const prefix of ['og','twitter']) {
      const attribute = prefix === 'og' ? 'property' : 'name';
      assert.equal(d.querySelector(`meta[${attribute}="${prefix}:title"]`).content, d.title, tag);
      assert.equal(d.querySelector(`meta[${attribute}="${prefix}:description"]`).content, copy[tag].description, tag);
      const image = new URL(d.querySelector(`meta[${attribute}="${prefix}:image"]`).content);
      assert.equal(image.origin, origin, tag);
      assert.ok(existsSync(new URL('.' + image.pathname, root)), image.href);
      assert.ok(d.querySelector(`meta[${attribute}="${prefix}:image:alt"]`).content.trim(), tag);
    }
    const collection = data.find(item => item['@type'] === 'CollectionPage');
    assert.equal(collection.url, url, tag);
    assert.equal(collection.inLanguage, tag, tag);
    assert.equal(collection.name, d.title, tag);
    assert.equal(collection.description, copy[tag].description, tag);
    assert.equal(collection.mainEntity.numberOfItems, 6, tag);
    assert.deepEqual(collection.mainEntity.itemListElement.map(item => ({name:item.name,url:item.url})),
      [...d.querySelectorAll('[data-discovery-game]')].map(card => ({name:text(card.querySelector('h3')),url:card.querySelector('.game-image').href})), tag);
    const faq = data.find(item => item['@type'] === 'FAQPage');
    assert.equal(faq.inLanguage, tag, tag);
    const visibleQuestions = [...d.querySelectorAll('#preguntas details')].map(item => ({question:text(item.querySelector('summary')),answer:text(item.querySelector('p'))}));
    assert.equal(visibleQuestions.length, 5, tag);
    assert.deepEqual(visibleQuestions, copy[tag].faq, tag);
    assert.deepEqual(faq.mainEntity.map(item => ({question:item.name,answer:item.acceptedAnswer.text})), visibleQuestions, tag);
    assert.doesNotMatch(JSON.stringify(data), /"(?:aggregateRating|ratingValue|ratingCount|reviewCount|review)"\s*:/, tag);
    assert.equal(d.querySelector('[itemprop="aggregateRating"],[itemprop="review"]'), null, tag);
  }
});

test('game and account CTAs retain language, source and real game routing', () => {
  for (const tag of locales) {
    const {document:d} = page(tag);
    const cards = [...d.querySelectorAll('[data-discovery-game]')];
    assert.deepEqual(cards.map(card => card.dataset.discoveryGame), featuredGames, tag);
    for (const card of cards) {
      const game = games.find(item => item.id === card.dataset.discoveryGame);
      const actual = new URL(card.querySelector('[data-play]').href);
      const original = new URL(game.play, origin);
      assert.equal(actual.searchParams.get('lang'), tag, `${tag}: ${game.id}`);
      assert.equal(actual.searchParams.get('source'), 'seo_free_games_' + tag, `${tag}: ${game.id}`);
      actual.searchParams.delete('lang'); actual.searchParams.delete('source');
      assert.equal(actual.href, original.href, `${tag}: ${game.id} route or game intent changed`);
      for (const link of card.querySelectorAll('a:not([data-play])')) {
        const target = new URL(link.href);
        assert.equal(target.searchParams.get('lang'), tag, `${tag}: ${game.id} guide`);
        target.searchParams.delete('lang');
        assert.equal(target.href, origin + game.path, `${tag}: ${game.id} guide`);
      }
    }
    assert.equal(d.querySelectorAll('[data-account]').length, 2, tag);
    for (const link of d.querySelectorAll('[data-account]')) {
      const target = new URL(link.href);
      assert.equal(target.pathname, '/', tag);
      assert.deepEqual([...target.searchParams], [['lang',tag],['source','seo_free_games_' + tag]], tag);
    }
    for (const link of d.querySelectorAll('.footer-links a,.related a[href*="apoyo-escolar"]')) {
      assert.equal(new URL(link.href).searchParams.get('lang'), tag, tag);
    }
  }
});

test('native language links and every local resource work without JavaScript', () => {
  for (const tag of locales) {
    const {document:d, path} = page(tag);
    const menu = d.querySelector('#landing-language');
    assert.equal(menu.value, route(tag), tag);
    assert.equal(menu.options.length, 15, tag);
    const languageLinks = [...d.querySelectorAll('.all-languages a')];
    assert.equal(languageLinks.length, 15, tag);
    for (const targetTag of locales) {
      const link = languageLinks.find(el => el.hreflang === targetTag);
      assert.ok(link, `${tag}: ${targetTag} native language link missing`);
      assert.equal(link.getAttribute('href'), route(targetTag), tag);
      assert.equal(link.lang, targetTag, tag);
      assert.equal(link.getAttribute('aria-current'), tag === targetTag ? 'page' : null, tag);
    }
    assert.deepEqual([...menu.closest('.locale-switch').querySelectorAll('a,button,select')].map(el => el.tagName), ['SELECT'], tag);
    for (const el of d.querySelectorAll('a[href],link[href],script[src],img[src]')) {
      const target = new URL(el.getAttribute('href') || el.getAttribute('src'), origin + path);
      assert.equal(target.origin, origin, `${tag}: unexpected external resource ${target.href}`);
      const destination = target.pathname + (target.pathname.endsWith('/') ? 'index.html' : '');
      assert.ok(existsSync(new URL('.' + destination, root)), `${tag} -> ${destination}`);
      if (target.hash) {
        assert.equal(target.pathname, path, `${tag}: unexpected cross-page fragment`);
        assert.ok(d.getElementById(decodeURIComponent(target.hash.slice(1))), `${tag}: missing ${target.hash}`);
      }
    }
  }
});

test('language selection navigates with blocked storage and ignores external destinations', () => {
  for (const storageBlocked of [false,true]) {
    const dom = new JSDOM(read(route('fr') + 'index.html'), {url:origin + route('fr')});
    const navigations = [], saved = [];
    const sandbox = {
      document:dom.window.document, URL,
      location:{origin,assign:value => navigations.push(value)}
    };
    Object.defineProperty(sandbox, 'localStorage', {get() {
      if (storageBlocked) throw new dom.window.DOMException('Storage is unavailable', 'SecurityError');
      return {setItem:(...args) => saved.push(args)};
    }});
    try {
      assert.doesNotThrow(() => runInNewContext(read('seo/localized.js'), sandbox));
      assert.deepEqual(saved, storageBlocked ? [] : [['coco.language.v1','fr']]);
      const menu = dom.window.document.querySelector('#landing-language');
      menu.value = route('ar');
      menu.dispatchEvent(new dom.window.Event('change'));
      assert.deepEqual(navigations, [origin + route('ar')]);
      const external = new dom.window.Option('External', 'https://other.example/');
      menu.append(external); menu.value = external.value;
      menu.dispatchEvent(new dom.window.Event('change'));
      assert.deepEqual(navigations, [origin + route('ar')]);
    } finally { dom.window.close(); }
  }
});
