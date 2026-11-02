// Batalla Naval has its own scores; it is always outside the daily mission gate.
const URL_PATH='/games/naval/';
function attach(){
 const app=document.getElementById('cocoApp');if(!app)return;
 app.querySelectorAll('[data-coco-generala-entry]').forEach(anchor=>{
  const existing=Array.from(anchor.parentElement.children).find(x=>x.hasAttribute('data-coco-naval-entry'));if(existing){if(anchor.nextElementSibling!==existing)anchor.after(existing);return;}
  const mini=anchor.classList.contains('cocoMiniJuego'),card=document.createElement('article');card.className=anchor.className;card.classList.remove('cocoDailyComplete','cocoSharedTarget');card.dataset.cocoNavalEntry='true';card.dataset.cocoExcellence='1';card.dataset.cocoKind='tool';
  const img='<img class="cocoOfficialThumb" src="/share/premium-v160126/naval.jpg" srcset="/share/premium-v160126/naval-720.webp 720w, /share/premium-v160126/naval.jpg 1200w" sizes="(max-width:600px) 90vw, 480px" alt="Coco Batalla Naval: cinco barcos, un océano por descubrir" loading="lazy" decoding="async">';
  card.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox" data-coco-icon-version="132">'+img+'</span><b>Coco Batalla Naval</b><span class="cocoNavalStatus" style="grid-column:2;grid-row:2;align-self:start;color:#177655;font-size:9.5px;font-weight:900;text-align:left">Solo o con amigos · No puntúa</span><div class="cocoExcellenceMeta"><span>⚓ 5 barcos</span><span>✦ Busca y descubre</span></div>':'<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Coco Batalla Naval</h3><p class="cocoDescripcion">Cinco barcos y un océano por descubrir. Juega contra Coco o invita a un amigo a una sala privada. No puntúa para la clasificación general.</p><button type="button" class="btn cocoBotonJuego">Jugar a Coco Batalla Naval</button>';
  card.setAttribute('aria-label','Coco Batalla Naval: cinco barcos, tres dificultades y salas privadas para dos');if(mini){card.tabIndex=0;card.setAttribute('role','link');card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();location.assign(URL_PATH)}}}
  anchor.after(card);
 });
}
window.addEventListener('click',e=>{const card=e.target.closest?.('[data-coco-naval-entry]');if(!card||e.target.closest('[data-coco-copy-link]'))return;e.preventDefault();e.stopImmediatePropagation();location.assign(URL_PATH)},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}).observe(document.documentElement,{subtree:true,childList:true});attach();
