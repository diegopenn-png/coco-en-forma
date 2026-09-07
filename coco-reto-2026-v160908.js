/* Coco en Forma · Reto Coco 2026 · v160.95.1
 * Desktop: promo image above existing Coco brand card.
 * Mobile/PWA: promo image before games; existing brand card after games.
 */
(function(){
  'use strict';
  if(window.__COCO_RETO_2026_V160951__) return;
  window.__COCO_RETO_2026_V160951__=true;

  var style=document.createElement('style');
  style.textContent=`
  #cocoReto2026{box-sizing:border-box;width:100%;margin:0;padding:0;background:transparent;border:0;box-shadow:none;position:relative}
  #cocoReto2026 img{display:block;width:100%;height:auto;border-radius:22px;box-shadow:0 8px 22px rgba(22,56,78,.12)}
  @media(min-width:761px){#cocoReto2026{max-width:100%;margin:0 0 14px}.marcaHeroe{align-self:start!important;height:auto!important;min-height:0!important;justify-content:flex-start!important}}
  @media(max-width:760px){#cocoReto2026{width:calc(100% - 24px);max-width:430px;margin:12px auto 16px}#cocoReto2026 img{border-radius:20px}.marcaHeroe.cocoRetoBrandAfterGames{width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;margin:16px auto 0!important}}
  `;
  document.head.appendChild(style);

  function card(){
    var el=document.createElement('section');
    el.id='cocoReto2026';
    el.setAttribute('aria-label','Reto Coco en Forma 2026');
    var img=document.createElement('img');
    img.src='./reto-coco-2026.jpg?v=1609501';
    img.alt='Reto Coco en Forma 2026. Los 3 jugadores con mayor puntuación acumulada al 31 de diciembre de 2026 recibirán un llavero 3D exclusivo de Coco en Forma, impreso con nuestra impresora 3D, y un diploma personalizado de Campeón Coco en Forma 2026.';
    img.decoding='async';
    img.loading='eager';
    el.appendChild(img);
    return el;
  }

  function findGrid(){return document.getElementById('cocoGridJuegos')||document.querySelector('#cocoApp .cocoGridJuegos')}

  function place(){
    var brand=document.querySelector('#cocoApp .marcaHeroe');
    var grid=findGrid();
    if(!brand||!grid) return;
    var c=document.getElementById('cocoReto2026')||card();
    if(window.innerWidth>760){
      brand.classList.remove('cocoRetoBrandAfterGames');
      if(c.parentNode!==brand || brand.firstElementChild!==c) brand.insertBefore(c,brand.firstChild);
      return;
    }
    var gamesHost=grid.closest('.cocoGruposJuegos')||grid.parentElement||grid;
    var parent=gamesHost.parentNode;
    if(!parent)return;
    if(c.parentNode!==parent || c.nextElementSibling!==gamesHost) parent.insertBefore(c,gamesHost);
    if(brand.parentNode!==parent || brand.previousElementSibling!==gamesHost) parent.insertBefore(brand,gamesHost.nextSibling);
    brand.classList.add('cocoRetoBrandAfterGames');
  }

  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;place()})}
  var mo=new MutationObserver(schedule);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule();
})();
