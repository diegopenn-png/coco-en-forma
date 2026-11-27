// Standard city is always available. It deliberately bypasses the daily mission gate.
const URL_PATH='/games/ciudad/';
function attach(){
 const app=document.getElementById('cocoApp');if(!app)return;
 app.querySelectorAll('[data-coco-bank-entry]').forEach(anchor=>{
  const existing=Array.from(anchor.parentElement.children).find(x=>x.hasAttribute('data-coco-city-entry'));if(existing){if(anchor.nextElementSibling!==existing)anchor.after(existing);return;}
  const mini=anchor.classList.contains('cocoMiniJuego'),card=document.createElement('article');card.className=anchor.className;card.classList.remove('cocoDailyComplete','cocoSharedTarget');card.dataset.cocoCityEntry='true';card.dataset.cocoExcellence='1';card.dataset.cocoKind='tool';
  const img='<img class="cocoOfficialThumb" src="/share/premium-v160126/ciudad.jpg" srcset="/share/premium-v160126/ciudad-720.webp 720w, /share/premium-v160126/ciudad.jpg 1200w" sizes="(max-width:600px) 90vw, 480px" alt="Coco Ciudad: una ciudad, seis historias" loading="lazy" decoding="async">';
  card.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox" data-coco-icon-version="132">'+img+'</span><b>Coco Ciudad</b><div class="cocoExcellenceMeta"><span>🎲 40 casillas</span><span>🏡 Compra, aprende y decide</span></div>':'<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Coco Ciudad</h3><p class="cocoDescripcion">Construye tu ciudad con el dado y 120 tarjetas.</p><button type="button" class="btn cocoBotonJuego">Jugar a Coco Ciudad</button>';
  card.setAttribute('aria-label','Coco Ciudad: 40 casillas, 120 tarjetas y hasta seis jugadores en línea');if(mini){card.tabIndex=0;card.setAttribute('role','link');card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();location.assign(URL_PATH)}}}
  const share=document.createElement('button');share.type='button';share.className='cocoCardShare';share.setAttribute('aria-label','Copiar enlace de Coco Ciudad');share.innerHTML='↗ <span>Compartir</span>';card.append(share);anchor.after(card);
 });
}
window.addEventListener('click',async e=>{const card=e.target.closest?.('[data-coco-city-entry]');if(!card||e.target.closest('[data-coco-copy-link]'))return;e.preventDefault();e.stopImmediatePropagation();const button=e.target.closest('.cocoCardShare');if(!button){location.assign(URL_PATH);return}
 const landing=new URL('/juego/ciudad/',location.origin).href,url=window.CocoLocale?.shareUrl(landing) ?? landing;try{await navigator.clipboard.writeText(url);button.innerHTML='✓ <span>Copiado</span>';setTimeout(()=>{if(button.isConnected)button.innerHTML='↗ <span>Compartir</span>'},2500)}catch{const field=document.createElement('textarea');field.value=url;field.style.cssText='position:fixed;left:12px;bottom:12px;width:calc(100% - 24px);z-index:2147483647';field.setAttribute('aria-label','Enlace de Coco Ciudad para copiar');document.body.append(field);field.select();if(document.execCommand('copy')){button.innerHTML='✓ <span>Copiado</span>';field.remove()}else field.addEventListener('blur',()=>field.remove(),{once:true})}
},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}).observe(document.documentElement,{subtree:true,childList:true});attach();
