// The daily match has its own scoring rule, independent of the generic club badge.
const style=document.createElement('style');
style.textContent=`
 #cocoApp [data-coco-truco-entry]:has(.trucoDailyRule) .cocoLigaBadge,
 #cocoApp [data-coco-truco-entry]:has(.trucoDailyRule) .cocoTrucoStatus{display:none!important}
 #cocoApp .trucoDailyRule{display:grid;gap:.2rem;padding:.55rem;color:#164b3c;text-align:center;background:#eef7f2;border-radius:.6rem}
 #cocoApp .cocoMiniJuego .trucoDailyRule{grid-column:2;font-size:.78rem}
`;
document.head.append(style);
function addDailyRule(card){
 if(card.querySelector('.trucoDailyRule'))return;
 const rule=document.createElement('div');
 rule.className='trucoDailyRule';rule.setAttribute('role','status');
 rule.innerHTML='<strong>Puntúa para la clasificación general</strong><small><span>Solo la partida del día</span> · <span>Contra Coco</span></small>';
 for(const old of card.querySelectorAll('p'))if(old.textContent.trim()==='Solo la partida del día')old.remove();
 card.insertBefore(rule,card.querySelector('.cocoBotonJuego'));
}
// The public menu and the signed-in PWA both render a Naval card.
function attach() {
  document.querySelectorAll('#cocoApp [data-coco-naval-entry]').forEach(anchor=>{
    const existing=Array.from(anchor.parentElement.children).find(el=>el.hasAttribute('data-coco-truco-entry'));
    if(existing){
      addDailyRule(existing);
      if(anchor.nextElementSibling!==existing)anchor.after(existing);
      return;
    }
    const mini=anchor.classList.contains('cocoMiniJuego'),card=document.createElement('article');
    card.className=anchor.className;card.classList.remove('cocoDailyComplete','cocoSharedTarget');
    card.dataset.cocoTrucoEntry='true';card.dataset.cocoExcellence='1';card.dataset.cocoKind='tool';
    const img='<img class="cocoOfficialThumb" src="./share/premium-v160126/truco.jpg" srcset="./share/premium-v160126/truco-720.webp 720w, ./share/premium-v160126/truco.jpg 1200w" sizes="(max-width:600px) 90vw, 480px" alt="Truco argentino" loading="lazy" decoding="async">';
    const ranking='Solo la partida del día';
    card.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox">'+img+'</span><b>Truco argentino</b><span class="cocoTrucoStatus" style="grid-column:2;color:#14614c;font-weight:700">'+ranking+'</span>':
      '<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Truco argentino</h3><p class="cocoDescripcion">Juega contra Coco o con amigos en mesas de 2, 4 o 6.</p><div class="cocoLigaBadge" role="status" data-general="yes"><span aria-hidden="true">🏆</span><b>Puntúa para la clasificación general</b><small class="cocoScoringScope">'+ranking+'</small></div><button type="button" class="btn cocoBotonJuego">Repartir cartas</button>';
    if(mini){card.tabIndex=0;card.setAttribute('role','link');card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();openGame();}};}
    addDailyRule(card);anchor.after(card);
  });
}
function openGame(){const target=new URL('/games/truco/',location.origin);location.assign(window.CocoLocale?.shareUrl(target.href)||target.href);}
window.addEventListener('click',e=>{if(!e.target.closest?.('[data-coco-truco-entry]')||e.target.closest('[data-coco-copy-link],.cocoCopyManual'))return;e.preventDefault();e.stopImmediatePropagation();openGame();},true);
let pending=false;new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;attach();});}}).observe(document.documentElement,{subtree:true,childList:true});attach();
