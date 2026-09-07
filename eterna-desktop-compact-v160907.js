/* ETERNA desktop compact header · 160.93.26
 * Scope: desktop-only compact mode/action bar + same Coco profile card shape as home screen.
 * Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609326__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609326__=true;

  function findProfileCoco(){
    var imgs=document.querySelectorAll('img');
    for(var i=0;i<imgs.length;i++){
      var img=imgs[i];
      if(img.closest&&img.closest('#eternaOverlayV159'))continue;
      var p=img.parentElement;
      for(var depth=0;p&&depth<6;depth++,p=p.parentElement){
        var txt=String(p.textContent||'').toLowerCase();
        if(txt.indexOf('partidas jugadas')!==-1)return img;
      }
    }
    return null;
  }

  function ensureMascot(){
    if(window.innerWidth<=760)return;
    var o=document.getElementById('eternaOverlayV159');
    if(!o)return;
    var bar=o.querySelector('.eternaV160ModeBar');
    if(!bar)return;
    var mascot=bar.querySelector('.eternaV160CocoFlex');
    var source=findProfileCoco();
    if(!mascot){
      mascot=document.createElement('div');
      mascot.className='eternaV160CocoFlex';
      mascot.setAttribute('aria-hidden','true');
      var frame=document.createElement('div');
      frame.className='eternaV160CocoProfileFrame';
      var img=document.createElement('img');
      img.alt='';
      img.src=source&&source.currentSrc?source.currentSrc:(source&&source.src?source.src:'./coco-flex-eterna.jpg?v=1609430');
      frame.appendChild(img);
      mascot.appendChild(frame);
      bar.insertBefore(mascot,bar.firstChild);
    }else if(source){
      var current=mascot.querySelector('img');
      var src=source.currentSrc||source.src;
      if(current&&src&&current.src!==src)current.src=src;
    }
  }

  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609326';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:grid!important;grid-template-columns:110px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:0!important;padding:8px 10px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions):not(.eternaV160CocoFlex){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex{grid-column:1!important;display:grid!important;place-items:center!important;width:104px!important;height:86px!important;overflow:visible!important;pointer-events:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoProfileFrame{display:grid!important;place-items:center!important;width:64px!important;height:80px!important;padding:3px!important;box-sizing:border-box!important;background:#fff!important;border:2px solid #fff!important;border-radius:15px!important;box-shadow:0 2px 5px rgba(17,52,73,.2)!important;animation:eternaCocoProfile1609326 5s ease-in-out infinite!important;transform-origin:50% 82%!important;}'+
    '#eternaOverlayV159 .eternaV160CocoProfileFrame img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{grid-column:2!important;display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,100%)!important;max-width:690px!important;min-width:540px!important;margin-left:auto!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}'+
  '@keyframes eternaCocoProfile1609326{0%,20%,100%{transform:translateY(0) rotate(0) scale(1)}5%{transform:translateY(-2px) rotate(-1deg) scale(1.02)}10%{transform:translateY(1px) rotate(1deg) scale(1.025)}15%{transform:translateY(-1px) rotate(-.5deg) scale(1.015)}}'+
  '@media (prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160CocoProfileFrame{animation:none!important;}}';
  document.head.appendChild(style);

  var observer=new MutationObserver(ensureMascot);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',ensureMascot,{passive:true});
  ensureMascot();
})();
