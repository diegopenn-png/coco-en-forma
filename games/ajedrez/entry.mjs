// Standard chess is always available. It deliberately bypasses the daily mission gate.
const URL_PATH='/games/ajedrez/';
function attach(){
 const app=document.getElementById('cocoApp');if(!app)return;
 app.querySelectorAll('.cocoMiniJuego[data-coco-juego="conecta"],.cocoGameCard[data-coco-juego="conecta"]').forEach(anchor=>{
  if(anchor.parentElement.querySelector('[data-coco-chess-entry]'))return;
  const mini=anchor.classList.contains('cocoMiniJuego'),card=document.createElement('article');card.className=anchor.className;card.classList.remove('cocoDailyComplete','cocoSharedTarget');card.dataset.cocoChessEntry='true';card.dataset.cocoExcellence='1';card.dataset.cocoKind='tool';
  const img='<img class="cocoOfficialThumb" src="/games/ajedrez/cover.png" alt="Ajedrez futurista con piezas metálicas" loading="lazy" decoding="async">';
  card.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox" data-coco-icon-version="132">'+img+'</span><b>Coco Ajedrez</b><span class="cocoChessStatus" style="grid-column:2;grid-row:2;align-self:start;color:#177655;font-size:9.5px;font-weight:900;text-align:left">Partida estándar · Sin límite</span><div class="cocoExcellenceMeta"><span>⏱ A tu ritmo</span><span>♟ Juega, aprende y descubre</span></div>':'<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Coco Ajedrez</h3><p class="cocoDescripcion">Partida estándar sin desafíos, contra Coco o entre dos personas. También puedes aprender y resolver retos.</p><button type="button" class="btn cocoBotonJuego">Jugar al ajedrez</button>';
  card.setAttribute('aria-label','Coco Ajedrez: partida estándar, aprender y desafíos');if(mini){card.tabIndex=0;card.setAttribute('role','link');card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();location.assign(URL_PATH)}}}
  const share=document.createElement('button');share.type='button';share.className='cocoCardShare';share.setAttribute('aria-label','Copiar enlace de Coco Ajedrez');share.innerHTML='↗ <span>Compartir</span>';card.append(share);anchor.after(card);
 });
}
window.addEventListener('click',async e=>{const card=e.target.closest?.('[data-coco-chess-entry]');if(!card)return;e.preventDefault();e.stopImmediatePropagation();const button=e.target.closest('.cocoCardShare');if(!button){location.assign(URL_PATH);return}
 const url=new URL(URL_PATH,location.origin).href;try{await navigator.clipboard.writeText(url);button.innerHTML='✓ <span>Copiado</span>';setTimeout(()=>{if(button.isConnected)button.innerHTML='↗ <span>Compartir</span>'},2500)}catch{const field=document.createElement('textarea');field.value=url;field.style.cssText='position:fixed;left:12px;bottom:12px;width:calc(100% - 24px);z-index:2147483647';field.setAttribute('aria-label','Enlace de Coco Ajedrez para copiar');document.body.append(field);field.select();if(document.execCommand('copy')){button.innerHTML='✓ <span>Copiado</span>';field.remove()}else field.addEventListener('blur',()=>field.remove(),{once:true})}
},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}).observe(document.documentElement,{subtree:true,childList:true});attach();
