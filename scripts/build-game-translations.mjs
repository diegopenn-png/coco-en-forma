import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {games,origin} from '../seo/catalog.mjs';
import {gameCopy,gamePath,alternates,languageLinks,localeNames,tags,localizedLandingPath,landingLocales} from '../seo/game-pages.mjs';

const site = new URL('../',import.meta.url);
const ui = JSON.parse(readFileSync(new URL('seo/locales/game-labels.json',site),'utf8'));
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const logo = '/assets/brand/coco-premium-v160127/icon-192.png';

function render(game,tag) {
  const {name,intro,tip,challenge,answer} = gameCopy(game,tag);
  if (![name,intro,tip,challenge,answer].every(text => typeof text === 'string' && text.trim())) throw Error('Missing game copy: '+tag+'/'+game.id);
  const hub = landingLocales[tag], labels = hub.labels;
  const [online,tool,tipTitle,copyLink,copied,openTool] = ui[tag];
  const toolPage = game.kind === 'tool';
  const title = name+' · '+(toolPage ? tool : online)+' | Coco en Forma';
  const path = gamePath(game,tag), url = origin + path, hubPath = localizedLandingPath(tag);
  const play = new URL(game.play,origin);
  play.searchParams.set('lang',tag);
  play.searchParams.set('source','seo_game_'+game.id+'_'+tag);
  const image = '/share/premium-v160126/art/'+game.id+'.webp';
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':url+'#page',url,name:title,description:intro,inLanguage:tag,mainEntity:{'@id':url+'#game'}},
    {'@type':toolPage ? 'WebApplication' : 'VideoGame','@id':url+'#game',name,description:intro,url:origin+game.play,image:origin+image,inLanguage:tag,...(toolPage ? {applicationCategory:'SportsApplication',operatingSystem:'Web'} : {gamePlatform:'Web browser'}),publisher:{'@type':'Organization',name:'Coco en Forma',url:origin+'/'}},
    {'@type':'BreadcrumbList',itemListElement:[{name:hub.eyebrow,item:origin+hubPath},{name,item:url}].map((item,i)=>({'@type':'ListItem',position:i+1,...item}))}
  ]};
  const options = tags.map(code => `<option lang="${code}" value="${gamePath(game,code)}"${code === tag ? ' selected' : ''}>${localeNames[code]}</option>`).join('');
  const related = game.related.map(id => games.find(item => item.id === id)).filter(Boolean);
  return `<!doctype html>
<html lang="${tag}" dir="${tag === 'ar' ? 'rtl':'ltr'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#142843">
<title>${escape(title)}</title><meta name="description" content="${escape(intro)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">${alternates(game)}
<link rel="icon" href="${logo}"><link rel="stylesheet" href="/seo/landing.css?v=1"><link rel="stylesheet" href="/seo/artwork.css?v=20261122-1"><link rel="stylesheet" href="/seo/game-page.css?v=1">
<meta property="og:type" content="website"><meta property="og:site_name" content="Coco en Forma"><meta property="og:url" content="${url}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(intro)}"><meta property="og:image" content="${origin+image}"><meta property="og:image:type" content="image/webp"><meta property="og:image:alt" content="${escape(name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(intro)}"><meta name="twitter:image" content="${origin+image}"><meta name="twitter:image:alt" content="${escape(name)}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script defer src="/seo/localized.js?v=20261127"></script>
</head><body data-coco-landing-locale="${tag}" style="--accent:${game.color}">
<a class="skip" href="#game">${escape(labels.skip)}</a>
<header class="top"><div class="wrap header-row"><a class="brand" href="${hubPath}"><img src="${logo}" width="54" height="54" alt="">Coco en Forma</a><label class="game-language">${escape(labels.language)} <select id="landing-language">${options}</select></label></div></header>
<main class="wrap" id="game"><nav class="breadcrumbs" aria-label="${escape(labels.home)}"><a href="${hubPath}">${escape(hub.eyebrow)}</a> / <span aria-current="page">${escape(name)}</span></nav>
<section class="hero"><div><h1>${escape(name)}</h1><p class="tagline">${escape(intro)}</p><div class="actions"><a class="button" data-play href="${escape(play.pathname+play.search)}">${escape(toolPage ? openTool : online)}</a><button class="button light" type="button" hidden data-copy-game data-copied="${escape(copied)}">${escape(copyLink)}</button><span role="status" data-copy-status></span></div></div>
<div class="hero-art"><span class="coco-landing-art"><img src="${image}" alt="${escape(name)}" width="1200" height="630" fetchpriority="high"><span class="coco-landing-art-label" aria-hidden="true">${escape(name)}</span></span></div></section>
<div class="game-notes"><section><h2>${escape(tipTitle)}</h2><p>${escape(tip)}</p></section><section><h2>${escape(labels.example)}</h2><p>${escape(challenge)}</p><details><summary>${escape(labels.reveal)}</summary><p>${escape(answer)}</p></details></section></div>
<section class="section"><h2>${escape(labels.related)}</h2><nav class="game-links">${related.map(other=>`<a href="${gamePath(other,tag)}">${escape(gameCopy(other,tag).name)}</a>`).join(' ')} <a href="${hubPath}">${escape(labels.explore)}</a></nav></section></main>
<footer class="footer"><div class="wrap"><details class="all-languages"><summary>${escape(labels.language)}</summary><nav>${languageLinks(game,tag)}</nav></details><p>${escape(labels.footer)}</p></div></footer></body></html>\n`;
}

export function buildGameTranslations() {
  for (const tag of tags.filter(code => code !== 'es')) {
    for (const game of games) {
      const directory = new URL('.'+gamePath(game,tag),site);
      mkdirSync(directory,{recursive:true});
      writeFileSync(new URL('index.html',directory),render(game,tag));
    }
  }
}
