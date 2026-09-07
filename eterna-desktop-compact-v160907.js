/* ETERNA desktop compact header · 160.93.20
 * Scope: desktop-only compact mode/action bar + Safari-safe Coco JPEG mascot.
 * Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609320__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609320__=true;

  function ensureMascot(){
    if(window.innerWidth<=760)return;
    var o=document.getElementById('eternaOverlayV159');
    if(!o)return;
    var bar=o.querySelector('.eternaV160ModeBar');
    if(!bar)return;
    var mascot=bar.querySelector('.eternaV160CocoFlex');
    if(!mascot){
      mascot=document.createElement('div');
      mascot.className='eternaV160CocoFlex';
      mascot.setAttribute('aria-hidden','true');
      mascot.innerHTML='<img src="./coco-flex-eterna.jpg?v=1609423" alt="">';
      bar.insertBefore(mascot,bar.firstChild);
    }
  }

  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609320';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:grid!important;grid-template-columns:110px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:0!important;padding:8px 10px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions):not(.eternaV160CocoFlex){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex{grid-column:1!important;display:grid!important;place-items:center!important;width:104px!important;height:86px!important;overflow:hidden!important;pointer-events:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex img{display:block!important;width:112px!important;height:112px!important;object-fit:cover!important;object-position:center 32%!important;border-radius:28px!important;filter:drop-shadow(0 4px 7px rgba(23,63,89,.10));-webkit-mask-image:radial-gradient(ellipse at center,#000 58%,rgba(0,0,0,.78) 70%,transparent 92%);mask-image:radial-gradient(ellipse at center,#000 58%,rgba(0,0,0,.78) 70%,transparent 92%);animation:eternaCocoFlex1609320 1.8s ease-in-out infinite!important;transform-origin:50% 82%!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{grid-column:2!important;display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,100%)!important;max-width:690px!important;min-width:540px!important;margin-left:auto!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}'+
  '@keyframes eternaCocoFlex1609320{0%,100%{transform:translateY(2px) rotate(-1deg) scale(1)}35%{transform:translateY(-3px) rotate(1deg) scale(1.035)}70%{transform:translateY(0) rotate(-.5deg) scale(1.015)}}'+
  '@media (prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160CocoFlex img{animation:none!important;}}';
  document.head.appendChild(style);

  var observer=new MutationObserver(ensureMascot);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',ensureMascot,{passive:true});
  ensureMascot();
})();
