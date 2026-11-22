import {existsSync} from 'node:fs';
import {games,catalogue} from '../seo/catalog.mjs';
const cleanRoot='/share/premium-v160126/art/';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clean(source){
 const id=source.split('/').pop().split('.')[0].replace(/-720$/,'');
 const candidate=cleanRoot+id+'.webp';
 return existsSync(new URL('..'+candidate,import.meta.url))?candidate:cleanRoot+'conecta.webp';
}
// Keep lettering in the document so static locales and the language selector
// translate the same visible text. Social artwork contains no baked-in copy.
export function localizeLandingArtwork(html){
 html=html.replace(/<img\b[^>]*\bsrc="(\/share\/premium-v\d+\/[^"?]+(?:\?[^\"]*)?)"[^>]*>/g,(tag,source)=>{
  const id=source.split('/').pop().split('.')[0].replace(/-720$/,'');
  const game=catalogue.find(g=>g.id===id);
  const alt=tag.match(/\balt="([^"]*)"/)?.[1];
  const caption=html.includes('data-coco-language-page="public"')?escape(game?.name||'Juegos para la mente y apoyo escolar'):(alt||escape(game?.name||'Coco'));
  const image=tag.replace(/\balt="[^"]*"/,()=>`alt="${caption}"`).replace(source,clean(source)).replace(/\s(?:srcset|sizes)="[^"]*"/g,'');
  return `<span class="coco-landing-art">${image}<span class="coco-landing-art-label">${caption}</span></span>`;
 });
 html=html.replace(/(<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content=")https:\/\/cocoenforma\.com(\/share\/premium-v\d+\/[^" ]+)(")/g,(_,start,source,end)=>start+'https://cocoenforma.com'+clean(source)+end);
 if(/<meta property="og:image" content="[^"]*\/art\/[^"]+\.webp"/.test(html))html=html.replace(/(<meta property="og:image:type" content=")[^"]+("\s*\/?>)/g,'$1image/webp$2');
 html=html.replace(/alt="Logo (?:oficial )?de Coco en Forma"/g,'alt="Coco en Forma"');
 return html.replace('</head>','<link rel="stylesheet" href="/seo/artwork.css?v=20261122-1"></head>');
}
