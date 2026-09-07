/* ETERNA desktop compact header · 160.93.19
 * Scope: desktop-only compact mode/action bar + embedded animated Coco. Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609319__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609319__=true;

  function ensureCoco(){
    if(window.innerWidth<=760)return;
    var o=document.getElementById('eternaOverlayV159');
    if(!o)return;
    var bar=o.querySelector('.eternaV160ModeBar');
    if(!bar)return;
    var coco=bar.querySelector('.eternaV160CocoFlex');
    if(!coco){
      coco=document.createElement('div');
      coco.className='eternaV160CocoFlex';
      coco.setAttribute('aria-hidden','true');
      coco.innerHTML='<img src="./coco-flex-eterna.webp?v=1609319" alt="">';
      bar.insertBefore(coco,bar.firstChild);
    }
  }

  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609319';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:0!important;padding:6px 10px 5px!important;overflow:visible!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions):not(.eternaV160CocoFlex){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex{display:grid!important;place-items:end center!important;flex:1 1 auto!important;min-width:82px!important;max-width:150px!important;height:82px!important;overflow:visible!important;pointer-events:none!important;opacity:.94!important;filter:drop-shadow(0 5px 8px rgba(23,63,89,.12))!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex img{display:block!important;width:92px!important;height:92px!important;object-fit:cover!important;object-position:center 24%!important;mix-blend-mode:multiply!important;-webkit-mask-image:radial-gradient(ellipse 64% 64% at 50% 48%,#000 64%,transparent 100%)!important;mask-image:radial-gradient(ellipse 64% 64% at 50% 48%,#000 64%,transparent 100%)!important;transform-origin:50% 82%!important;animation:eternaCocoFlexDesktop 1.65s ease-in-out infinite!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,calc(100% - 94px))!important;max-width:690px!important;min-width:540px!important;margin:0!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}'+
  '@keyframes eternaCocoFlexDesktop{0%,100%{transform:translateY(1px) rotate(-1.5deg) scale(1)}28%{transform:translateY(-2px) rotate(1.5deg) scale(1.045,1.02)}55%{transform:translateY(0) rotate(-.6deg) scale(1.02,1.045)}78%{transform:translateY(-1px) rotate(1deg) scale(1.04,1.01)}}'+
  '@media(prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160CocoFlex img{animation:none!important}}'+
  '@media(max-width:760px){#eternaOverlayV159 .eternaV160CocoFlex{display:none!important;}}';
  document.head.appendChild(style);

  var mo=new MutationObserver(ensureCoco);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',ensureCoco,{passive:true});
  ensureCoco();
})();
