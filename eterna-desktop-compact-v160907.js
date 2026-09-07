/* ETERNA desktop compact header · 160.93.22
 * Scope: desktop-only compact mode/action bar + same Coco image already used in the player profile card.
 * Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609322__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609322__=true;

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
      var img=document.createElement('img');
      img.alt='';
      img.src=source&&source.currentSrc?source.currentSrc:(source&&source.src?source.src:'./coco-flex-eterna.jpg?v=1609425');
      mascot.appendChild(img);
      bar.insertBefore(mascot,bar.firstChild);
    }else if(source){
      var current=mascot.querySelector('img');
      var src=source.currentSrc||source.src;
      if(current&&src&&current.src!==src)current.src=src;
    }
  }

  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609322';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:grid!important;grid-template-columns:110px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:0!important;padding:8px 10px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions):not(.eternaV160CocoFlex){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex{grid-column:1!important;display:grid!important;place-items:center!important;width:104px!important;height:86px!important;overflow:hidden!important;pointer-events:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex img{display:block!important;width:78px!important;height:78px!important;object-fit:cover!important;object-position:center!important;border-radius:18px!important;filter:drop-shadow(0 4px 7px rgba(23,63,89,.12));animation:eternaCocoFlex1609322 1.8s ease-in-out infinite!important;transform-origin:50% 82%!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{grid-column:2!important;display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,100%)!important;max-width:690px!important;min-width:540px!important;margin-left:auto!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}'+
  '@keyframes eternaCocoFlex1609322{0%,100%{transform:translateY(2px) rotate(-1deg) scale(1)}35%{transform:translateY(-3px) rotate(1deg) scale(1.035)}70%{transform:translateY(0) rotate(-.5deg) scale(1.015)}}'+
  '@media (prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160CocoFlex img{animation:none!important;}}';
  document.head.appendChild(style);

  var observer=new MutationObserver(ensureMascot);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',ensureMascot,{passive:true});
  ensureMascot();
})();
