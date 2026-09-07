/* ETERNA desktop Coco flex mascot · 160.93.18 */
(function(){
  'use strict';
  if(window.__ETERNA_COCO_FLEX_DESKTOP__)return;
  window.__ETERNA_COCO_FLEX_DESKTOP__=true;
  function install(){
    var o=document.getElementById('eternaOverlayV159');
    if(!o||innerWidth<=760)return;
    var bar=o.querySelector('.eternaV160ModeBar');
    if(!bar)return;
    var mascot=bar.querySelector('.eternaV160CocoFlex');
    if(!mascot){
      mascot=document.createElement('div');
      mascot.className='eternaV160CocoFlex';
      mascot.setAttribute('aria-hidden','true');
      mascot.innerHTML='<img src="./coco-flex-eterna.webp" alt="">';
      bar.insertBefore(mascot,bar.firstChild);
    }
  }
  var s=document.createElement('style');
  s.textContent='@media(min-width:761px){#eternaOverlayV159 .eternaV160ModeBar{position:relative!important;display:grid!important;grid-template-columns:86px minmax(0,1fr)!important;align-items:center!important;gap:10px!important;min-height:78px!important;padding:7px 10px!important;overflow:visible!important}#eternaOverlayV159 .eternaV160CocoFlex{grid-column:1!important;display:grid!important;place-items:end center!important;width:86px!important;height:72px!important;overflow:hidden!important;pointer-events:none!important;filter:drop-shadow(0 5px 8px rgba(23,63,89,.10))}#eternaOverlayV159 .eternaV160CocoFlex img{display:block!important;width:78px!important;height:78px!important;object-fit:cover!important;object-position:center 30%!important;border-radius:24px!important;mix-blend-mode:multiply!important;animation:eternaCocoFlex 1.7s ease-in-out infinite!important;transform-origin:50% 85%!important}#eternaOverlayV159 .eternaV160ModeActions{grid-column:2!important;min-width:0!important}#eternaOverlayV159 .eternaV160ModeCopy{display:none!important}}@keyframes eternaCocoFlex{0%,100%{transform:translateY(1px) scale(1) rotate(-1deg)}35%{transform:translateY(-2px) scale(1.035) rotate(1deg)}65%{transform:translateY(0) scale(1.015) rotate(-.5deg)}}@media(prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160CocoFlex img{animation:none!important}}';
  document.head.appendChild(s);
  var mo=new MutationObserver(install);mo.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',install,{passive:true});install();
})();