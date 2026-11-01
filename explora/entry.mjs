// Use the same catalogue components and thumbnail sizing in both Coco menus.
function attach(){
 const app=document.getElementById('cocoApp');if(!app)return;
 app.querySelectorAll('[data-coco-bank-entry]').forEach(bank=>{
  if(bank.parentElement.querySelector('[data-coco-explora-entry]'))return;
  const mini=bank.classList.contains('cocoMiniJuego'),card=document.createElement(bank.tagName);
  card.className=bank.className;card.dataset.cocoExploraEntry='true';card.dataset.cocoJuego='eneagrama';card.dataset.cocoExcellence='1';card.dataset.cocoKind='tool';
  card.setAttribute('aria-label','Coco Eneagrama: evaluación e informe PDF');
  const img='<img class="cocoOfficialThumb" src="/share/premium-v160126/eneagrama.jpg" srcset="/share/premium-v160126/eneagrama-720.webp 720w, /share/premium-v160126/eneagrama.jpg 1200w" sizes="(max-width:600px) 90vw, 480px" alt="Coco Eneagrama" loading="lazy" decoding="async">';
  card.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox" data-coco-icon-version="132">'+img+'</span><span class="cocoExToolLabel">Conócete mejor</span><b>Coco Eneagrama</b><span class="cocoEneagramaStatus" style="grid-column:2;grid-row:3;align-self:start;width:max-content;max-width:100%;padding:2px 7px;border-radius:999px;background:#e4f8ee;color:#177655;font-size:9.5px;font-weight:900;line-height:1.35">Evaluación + PDF · 15 €</span><div class="cocoExcellenceMeta" aria-label="Tu exploración"><span>⏱ A tu ritmo</span><span>✦ Explora tus 9 tendencias</span></div>':'<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Coco Eneagrama</h3><p class="cocoDescripcion">Explora nueve tendencias con 54 frases y un informe personal en PDF. Clientes: 15 €. Acceso máster gratis.</p><button type="button" class="btn cocoBotonJuego" data-eneagrama-open>Explorar mi eneagrama</button>';
  if(mini){card.setAttribute('role','link');card.tabIndex=0;card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click()}})}
  else{const share=document.createElement('button');share.type='button';share.className='cocoCardShare';share.setAttribute('aria-label','Compartir Coco Eneagrama');share.innerHTML='↗ <span>Compartir</span>';card.appendChild(share)}
  bank.after(card);
 });
}
// Own navigation avoids legacy daily-game handlers and leaves Coco's sizing intact.
window.addEventListener('click',e=>{if(!e.target.closest?.('[data-coco-explora-entry]'))return;e.preventDefault();e.stopImmediatePropagation();if(e.target.closest('.cocoCardShare')){window.CocoShareToolV1?.('eneagrama');return}location.assign(e.target.closest('[data-coco-explora-entry]').classList.contains('cocoMiniJuego')?'/explora/':'/explora/jugar.html')},true);
let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;attach()})}}).observe(document.documentElement,{subtree:true,childList:true});attach();
