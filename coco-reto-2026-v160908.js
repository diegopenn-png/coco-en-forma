/* Coco en Forma · Reto Coco 2026 · v160.95.0
 * Desktop: reto above the existing Coco brand card.
 * Mobile/PWA: reto before games; existing brand card after games.
 */
(function(){
  'use strict';
  if(window.__COCO_RETO_2026_V160950__) return;
  window.__COCO_RETO_2026_V160950__=true;

  var style=document.createElement('style');
  style.textContent=`
  #cocoReto2026{box-sizing:border-box;width:100%;max-width:390px;margin:0 auto 14px;padding:16px 14px 15px;border-radius:22px;background:linear-gradient(145deg,#fff8eb 0%,#fff 46%,#f3f1ff 100%);border:1px solid rgba(119,88,164,.18);box-shadow:0 10px 28px rgba(44,39,83,.12);text-align:center;color:#253047;font-family:inherit;overflow:hidden;position:relative}
  #cocoReto2026:before{content:"";position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,#f4b740,#8d68b7,#5a9fd5,#ef8b43)}
  #cocoReto2026 .cr26-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;color:#73539b;margin:1px 0 5px;text-transform:uppercase}
  #cocoReto2026 .cr26-title{font-size:21px;line-height:1.05;font-weight:950;margin:0 0 7px;color:#263d66}
  #cocoReto2026 .cr26-copy{font-size:13px;line-height:1.35;margin:0 auto 10px;max-width:310px;color:#4d5870;font-weight:700}
  #cocoReto2026 .cr26-prizes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 10px}
  #cocoReto2026 .cr26-prize{background:rgba(255,255,255,.86);border:1px solid rgba(88,83,145,.12);border-radius:14px;padding:9px 7px;font-size:11.5px;line-height:1.25;font-weight:850;color:#35435e}
  #cocoReto2026 .cr26-icon{display:block;font-size:23px;line-height:1;margin-bottom:5px}
  #cocoReto2026 .cr26-date{display:inline-block;padding:7px 10px;border-radius:999px;background:#273e66;color:#fff;font-size:11px;font-weight:900}
  #cocoReto2026 .cr26-note{font-size:10.5px;line-height:1.3;color:#6b7280;margin:8px 0 0;font-weight:700}
  @media(min-width:761px){#cocoReto2026{max-width:100%;margin:0 0 12px}.marcaHeroe{align-self:start!important;height:auto!important;min-height:0!important;justify-content:flex-start!important}}
  @media(max-width:760px){#cocoReto2026{width:calc(100% - 24px);max-width:430px;margin:12px auto 14px}.marcaHeroe.cocoRetoBrandAfterGames{width:100%!important;max-width:none!important;margin:14px auto 0!important}}
  `;
  document.head.appendChild(style);

  function card(){
    var el=document.createElement('section');
    el.id='cocoReto2026';
    el.setAttribute('aria-label','Reto Coco en Forma 2026');
    el.innerHTML='<div class="cr26-kicker">🏆 Competición Coco</div><h2 class="cr26-title">RETO COCO EN FORMA 2026</h2><p class="cr26-copy">Los <strong>3 jugadores con mayor puntuación acumulada</strong> al cierre del año ganarán un premio Coco.</p><div class="cr26-prizes"><div class="cr26-prize"><span class="cr26-icon">🔑</span><strong>Llavero 3D de Coco en Forma</strong><br>hecho con la impresora 3D de Coco en Forma</div><div class="cr26-prize"><span class="cr26-icon">📜</span><strong>Diploma personalizado</strong><br>1.º · 2.º · 3.º puesto</div></div><span class="cr26-date">Cierre · 31 de diciembre de 2026</span><p class="cr26-note">Juega normalmente y suma puntos. No necesitas inscribirte.</p>';
    return el;
  }

  function place(){
    var existing=document.getElementById('cocoReto2026');
    var brand=document.querySelector('.marcaHeroe');
    var grid=document.getElementById('cocoGridJuegos');
    if(!brand||!grid) return;
    var c=existing||card();
    if(window.innerWidth>760){
      brand.classList.remove('cocoRetoBrandAfterGames');
      if(c.parentNode!==brand || brand.firstElementChild!==c) brand.insertBefore(c,brand.firstChild);
    }else{
      var gridHost=grid.parentElement;
      if(gridHost && c.nextElementSibling!==gridHost){
        gridHost.parentNode.insertBefore(c,gridHost);
      }
      var anchor=gridHost||grid;
      var parent=anchor.parentNode;
      if(parent && (brand.parentNode!==parent || brand.previousElementSibling!==anchor)){
        parent.insertBefore(brand,anchor.nextSibling);
      }
      brand.classList.add('cocoRetoBrandAfterGames');
    }
  }

  var mo=new MutationObserver(place);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',place,{passive:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',place,{once:true}); else place();
})();
