import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {games, origin} from '../seo/catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const landingLocales = JSON.parse(readFileSync(root + 'seo/locales/free-games.json', 'utf8'));
export const landingUpdated = '2026-11-22';
export const localeNames = {es:'Español',en:'English',de:'Deutsch',nl:'Nederlands',fr:'Français',it:'Italiano',pl:'Polski',uk:'Українська',ru:'Русский','zh-Hans':'简体中文',ar:'العربية',sv:'Svenska',fi:'Suomi',nb:'Norsk bokmål',da:'Dansk'};
const ogLocales = {es:'es_ES',en:'en_GB',de:'de_DE',nl:'nl_NL',fr:'fr_FR',it:'it_IT',pl:'pl_PL',uk:'uk_UA',ru:'ru_RU','zh-Hans':'zh_CN',ar:'ar_SA',sv:'sv_SE',fi:'fi_FI',nb:'nb_NO',da:'da_DK'};
const ids = ['memoria','sudoku','conecta','ajedrez','generala','naval'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const localizedLandingPath = tag => tag === 'es' ? '/juegos-gratis/' : `/${tag.toLowerCase()}/${landingLocales[tag].slug}/`;
export const localizedLandingPaths = () => Object.keys(localeNames).map(localizedLandingPath);
const localizedLink = (path, tag, source = false) => {
  const url = new URL(path, origin);
  url.searchParams.set('lang', tag);
  if (source) url.searchParams.set('source', 'seo_free_games_' + tag);
  return url.pathname + url.search + url.hash;
};

function render(tag, copy) {
  const path = localizedLandingPath(tag), url = origin + path, labels = copy.labels;
  const tags = Object.keys(localeNames), index = tags.indexOf(tag);
  const previous = tags[(index + tags.length - 1) % tags.length], next = tags[(index + 1) % tags.length];
  const alternates = tags.map(code => `<link rel="alternate" hreflang="${code}" href="${origin + localizedLandingPath(code)}">`).join('\n');
  const languageLinks = tags.map(code => `<a href="${localizedLandingPath(code)}" hreflang="${code}" lang="${code}"${code === tag ? ' aria-current="page"' : ''}>${localeNames[code]}</a>`).join('');
  const accountUrl = localizedLink('/', tag, true);
  const organization = {'@type':'Organization','@id':origin + '/#organization',name:'Coco en Forma',url:origin + '/',logo:origin + '/assets/brand/coco-premium-v160127/icon-512.png'};
  const graph = [organization, {
    '@type':'CollectionPage','@id':url + '#page',url,name:copy.title,description:copy.description,
    inLanguage:tag,dateModified:landingUpdated,keywords:copy.keywords.join(', '),publisher:{'@id':organization['@id']},
    mainEntity:{'@type':'ItemList',numberOfItems:ids.length,itemListElement:ids.map((id, position) => {
      const game = games.find(g => g.id === id);
      return {'@type':'ListItem',position:position + 1,name:copy.gameCards[id].title,url:origin + localizedLink(game.path,tag)};
    })}
  }, {
    '@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:labels.home,item:origin + '/'},
      {'@type':'ListItem',position:2,name:copy.eyebrow,item:url}
    ]
  }, {'@type':'FAQPage','@id':url + '#preguntas',inLanguage:tag,mainEntity:copy.faq.map(item => ({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))}];
  const cards = ids.map(id => {
    const game = games.find(g => g.id === id), text = copy.gameCards[id];
    return `<article class="game-card" data-discovery-game="${id}"><a class="game-image" href="${esc(localizedLink(game.path,tag))}"><img src="${game.image}" width="1200" height="630" alt="${esc(text.title)}" loading="lazy" decoding="async"></a><div class="game-copy"><h3>${esc(text.title)}</h3><p>${esc(text.text)}</p><div class="game-actions"><a class="button compact" data-play href="${esc(localizedLink(game.play,tag,true))}">${esc(labels.play)} <span aria-hidden="true">↗</span></a><a class="text-link" href="${esc(localizedLink(game.path,tag))}">${esc(labels.learnMore)}</a></div></div></article>`;
  }).join('\n');
  const spanishGuides = tag === 'es' ? '<nav class="related-guides" aria-label="Guías de juegos"><a href="/juegos-de-memoria/">Juegos de memoria</a><a href="/juegos-de-logica/">Juegos de lógica</a><a href="/juegos-de-matematicas/">Juegos de matemáticas</a><a href="/juegos-en-familia/">Juegos en familia</a></nav>' : '';
  return `<!doctype html>
<html lang="${tag}" dir="${tag === 'ar' ? 'rtl' : 'ltr'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0c2944">
<title>${esc(copy.title)}</title><meta name="description" content="${esc(copy.description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${origin}/juegos-gratis/">
<link rel="icon" href="/assets/brand/coco-premium-v160127/favicon.png"><link rel="stylesheet" href="/seo/localized.css?v=20261122-1">
<meta property="og:type" content="website"><meta property="og:site_name" content="Coco en Forma"><meta property="og:locale" content="${ogLocales[tag]}"><meta property="og:title" content="${esc(copy.title)}"><meta property="og:description" content="${esc(copy.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${origin}/assets/brand/coco-premium-v160127/icon-512.png"><meta property="og:image:width" content="512"><meta property="og:image:height" content="512"><meta property="og:image:alt" content="Coco en Forma">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(copy.title)}"><meta name="twitter:description" content="${esc(copy.description)}"><meta name="twitter:image" content="${origin}/assets/brand/coco-premium-v160127/icon-512.png"><meta name="twitter:image:alt" content="Coco en Forma">
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script><script defer src="/seo/localized.js?v=20261122-1"></script>
</head><body data-coco-landing-locale="${tag}">
<a class="skip" href="#contenido">${esc(labels.skip)}</a>
<header class="site-header"><div class="wrap header-inner"><a class="brand" href="${esc(accountUrl)}"><img src="/assets/brand/coco-premium-v160127/icon-192.png" width="48" height="48" alt=""><span>Coco en Forma</span></a><div class="locale-switch"><label for="landing-language">${esc(labels.language)}</label><a class="locale-arrow" href="${localizedLandingPath(previous)}" aria-label="${esc(labels.previous)}">‹</a><select id="landing-language" aria-label="${esc(labels.language)}">${tags.map(code => `<option value="${localizedLandingPath(code)}" lang="${code}"${code === tag ? ' selected' : ''}>${localeNames[code]}</option>`).join('')}</select><a class="locale-arrow" href="${localizedLandingPath(next)}" aria-label="${esc(labels.next)}">›</a></div></div></header>
<main id="contenido" class="wrap">
<nav class="breadcrumbs" aria-label="${esc(labels.home)}"><a href="${esc(accountUrl)}">${esc(labels.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(copy.eyebrow)}</span></nav>
<section class="hero"><div class="hero-copy"><p class="eyebrow">${esc(copy.eyebrow)}</p><h1>${esc(copy.heading)}</h1><p class="lead">${esc(copy.intro)}</p><div class="actions"><a class="button" href="#elige-juego">${esc(labels.explore)} <span aria-hidden="true">↓</span></a><a class="button secondary" data-account href="${esc(accountUrl)}">${esc(labels.account)}</a></div><ul class="hero-points">${copy.heroPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="number-tile">3 · 6 · 12 · ?</div><img class="mascot" src="/assets/brand/coco-premium-v160127/icon-512.png" width="512" height="512" alt="" fetchpriority="high"><div class="mini-grid"><span>1</span><span>2</span><span>4</span><span>?</span><span>♞</span><span>♜</span><span>♟</span><span>♚</span></div><div class="dot-tile"><i></i><i></i><i></i><i></i></div></div></section>
<nav class="page-nav" aria-label="${esc(labels.explore)}"><a href="#elige-juego">${esc(labels.explore)}</a><a href="#guia">${esc(labels.howItWorks)}</a><a href="#ejemplo">${esc(labels.example)}</a><a href="#preguntas">${esc(labels.faq)}</a></nav>
<section id="elige-juego" class="section"><div class="section-heading"><p class="eyebrow">Coco en Forma</p><h2>${esc(labels.explore)}</h2></div><div class="game-grid">${cards}</div><p class="language-note">${esc(copy.note.spanishContent)}</p></section>
<section id="guia" class="section editorial-grid">${copy.sections.map(s => `<article><h2>${esc(s.title)}</h2>${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</article>`).join('')}</section>
<section class="example" id="ejemplo"><div><p class="eyebrow">${esc(labels.example)}</p><h2>${esc(copy.example.title)}</h2><p>${esc(copy.example.prompt)}</p></div><details><summary>${esc(labels.reveal)}</summary><p>${esc(copy.example.answer)}</p></details></section>
<section class="section"><h2>${esc(labels.steps)}</h2><ol class="steps">${copy.steps.map((step,i) => `<li><span class="step-number" aria-hidden="true">0${i+1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div></li>`).join('')}</ol></section>
<section class="section faq" id="preguntas"><div class="section-heading"><p class="eyebrow">Coco en Forma</p><h2>${esc(labels.faq)}</h2></div>${copy.faq.map(item => `<details><summary>${esc(item.question)}</summary><p>${esc(item.answer)}</p></details>`).join('')}</section>
<section class="closing"><div><h2>${esc(copy.closing.title)}</h2><p>${esc(copy.closing.text)}</p></div><a class="button" data-account href="${esc(accountUrl)}">${esc(copy.closing.button)} <span aria-hidden="true">↗</span></a></section>
<section class="related"><h2>${esc(labels.related)}</h2>${spanishGuides}<p>${esc(copy.note.eterna)} <a href="${esc(localizedLink('/apoyo-escolar-con-ia/',tag))}">Eterna →</a></p><p class="updated">${esc(labels.updated)} <time datetime="${landingUpdated}">${esc(new Intl.DateTimeFormat(tag,{dateStyle:'long',timeZone:'UTC'}).format(new Date(landingUpdated+'T12:00:00Z')))}</time></p></section>
</main><footer class="site-footer"><div class="wrap"><a class="brand" href="${esc(accountUrl)}">Coco en Forma</a><p>${esc(labels.footer)}</p><nav class="footer-links" aria-label="${esc(labels.menu)}"><a href="${esc(localizedLink('/juegos/',tag))}">${esc(labels.menu)}</a><a href="${esc(localizedLink('/politica-de-privacidad.html',tag))}">${esc(labels.privacy)}</a><a href="${esc(localizedLink('/terminos-y-condiciones.html',tag))}">${esc(labels.terms)}</a></nav><details class="all-languages"><summary>${esc(labels.language)}</summary><nav aria-label="${esc(labels.language)}">${languageLinks}</nav></details></div></footer>
</body></html>\n`;
}

export function buildLocalizedLandings() {
  const missing = Object.keys(localeNames).filter(tag => !landingLocales[tag]);
  if (missing.length) throw new Error('Missing landing copy: ' + missing.join(', '));
  for (const tag of Object.keys(localeNames)) {
    const path = localizedLandingPath(tag);
    mkdirSync(root + path, {recursive:true});
    writeFileSync(root + path + 'index.html', render(tag,landingLocales[tag]));
  }
  console.log(`Built ${Object.keys(localeNames).length} static language landing pages.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) buildLocalizedLandings();
