/* Coco en Forma · Reto Coco 2026 · v160.99.5
 * Desktop: promo above existing Coco brand card, visually integrated.
 * Mobile/PWA: promo before games; existing brand card after games, with clear section spacing.
 */
(function(){
  'use strict';
  if(window.__COCO_RETO_2026_V160995__) return;
  window.__COCO_RETO_2026_V160995__=true;

  var style=document.createElement('style');
  style.id='coco-reto-2026-v160995-style';
  style.textContent=`
  #cocoReto2026{box-sizing:border-box;width:100%;margin:0;padding:7px;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(248,251,255,.98));border:1px solid rgba(111,178,210,.28);border-radius:26px;box-shadow:0 8px 22px rgba(22,56,78,.09);position:relative}
  #cocoReto2026 img{display:block;width:100%;height:auto;object-fit:contain;border-radius:20px;box-shadow:none;image-rendering:auto;background:transparent}
  @media(min-width:901px){
    #cocoReto2026{max-width:100%;margin:0 0 16px;padding:7px}
    #cocoApp .marcaHeroe,#cocoApp .cocoHomeBrainFinal3{align-self:stretch!important;height:100%!important;min-height:100%!important;justify-content:flex-start!important}
    #cocoApp .cocoHomeBrainFinal3 .loginPoster{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;image-rendering:auto!important}
  }
  @media(max-width:900px){
    #cocoReto2026{width:calc(100% - 28px);max-width:430px;margin:28px auto 22px;padding:7px;border-radius:24px;box-shadow:0 8px 22px rgba(22,56,78,.08)}
    #cocoReto2026:before{content:'';display:block;position:absolute;top:-16px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(89,157,193,.38),transparent)}
    #cocoReto2026 img{border-radius:18px}
    #cocoApp .marcaHeroe.cocoRetoBrandAfterGames,#cocoApp .cocoHomeBrainFinal3.cocoRetoBrandAfterGames{width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;margin:26px auto 0!important;padding-top:18px!important;border-top:1px solid rgba(89,157,193,.22)!important}
  }
  `;
  document.head.appendChild(style);

  function card(){
    var el=document.createElement('section');
    el.id='cocoReto2026';
    el.setAttribute('aria-label','Reto Coco en Forma 2026');
    var img=document.createElement('img');
    img.src='./reto-coco-2026-v160912.webp?v=160995';
    img.alt='Reto Coco en Forma 2026. Los 3 jugadores con mayor puntuación acumulada al 31 de diciembre de 2026 recibirán un llavero 3D exclusivo de Coco en Forma, impreso con nuestra impresora 3D, y un diploma personalizado de Campeón Coco en Forma 2026.';
    img.decoding='async';
    img.loading='eager';
    el.appendChild(img);
    return el;
  }

  function findGamesHost(){
    var app=document.getElementById('cocoApp')||document;
    var direct=app.querySelector('#cocoGridJuegos,.cocoGridJuegos,.gridJuegos,.juegosGrid,.listaJuegos,[data-juegos-grid]');
    if(direct) return direct;
    var cards=Array.prototype.slice.call(app.querySelectorAll('.juego'));
    if(!cards.length) return null;
    var node=cards[0].parentElement;
    while(node&&node!==app){
      var count=node.querySelectorAll('.juego').length;
      if(count>=Math.min(3,cards.length)) return node;
      node=node.parentElement;
    }
    return cards[0].parentElement;
  }

  function findBrand(app){return app.querySelector('.marcaHeroe,.cocoHomeBrainFinal3')}
  function findGamesPanel(app){
    var panel=app.querySelector('.cocoHomeGamesRowFinal3 .retosCard,.retosCard');
    if(panel) return panel;
    var games=findGamesHost();
    if(!games) return null;
    return games.closest('.retosCard,.panelJugador')||games;
  }

  function place(){
    var app=document.getElementById('cocoApp');
    var brand=app&&findBrand(app);
    if(!brand) return;
    var c=document.getElementById('cocoReto2026')||card();
    if(window.innerWidth>900){
      brand.classList.remove('cocoRetoBrandAfterGames');
      if(c.parentNode!==brand||brand.firstElementChild!==c) brand.insertBefore(c,brand.firstChild);
      return;
    }
    var games=findGamesPanel(app);
    if(!games||!games.parentNode) return;
    var parent=games.parentNode;
    if(c.parentNode!==parent||c.nextElementSibling!==games) parent.insertBefore(c,games);
    if(brand.parentNode!==parent||brand.previousElementSibling!==games) parent.insertBefore(brand,games.nextSibling);
    brand.classList.add('cocoRetoBrandAfterGames');
  }

  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;place()})}
  var mo=new MutationObserver(schedule);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  [0,80,250,700,1500,3000].forEach(function(ms){setTimeout(place,ms)});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule();
})();
