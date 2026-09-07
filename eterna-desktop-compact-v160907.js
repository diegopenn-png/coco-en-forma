/* ETERNA desktop compact header · 160.93.24
 * Scope: desktop-only compact mode/action bar + exact clone of the Coco image used in the player profile card.
 * Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609324__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609324__=true;

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

  function animationSource(source){
    var n=source;
    for(var i=0;n&&i<5;i++,n=n.parentElement){
      var cs=getComputedStyle(n);
      if(cs.animationName&&cs.animationName!=='none')return n;
    }
    return source;
  }

  function copyExactPresentation(source,target){
    if(!source||!target)return;
    var cs=getComputedStyle(source);
    var r=source.getBoundingClientRect();
    target.className=source.className||'';
    target.alt='';
    target.removeAttribute('id');
    target.style.width=(r.width||parseFloat(cs.width)||78)+'px';
    target.style.height=(r.height||parseFloat(cs.height)||78)+'px';
    target.style.maxWidth=cs.maxWidth;
    target.style.maxHeight=cs.maxHeight;
    target.style.minWidth=cs.minWidth;
    target.style.minHeight=cs.minHeight;
    target.style.objectFit=cs.objectFit;
    target.style.objectPosition=cs.objectPosition;
    target.style.borderRadius=cs.borderRadius;
    target.style.border=cs.border;
    target.style.padding=cs.padding;
    target.style.background=cs.background;
    target.style.boxShadow=cs.boxShadow;
    target.style.filter=cs.filter;
    target.style.opacity=cs.opacity;
    target.style.display='block';

    var motionNode=animationSource(source);
    var ms=getComputedStyle(motionNode);
    target.style.animationName=ms.animationName;
    target.style.animationDuration=ms.animationDuration;
    target.style.animationTimingFunction=ms.animationTimingFunction;
    target.style.animationDelay=ms.animationDelay;
    target.style.animationIterationCount=ms.animationIterationCount;
    target.style.animationDirection=ms.animationDirection;
    target.style.animationFillMode=ms.animationFillMode;
    target.style.animationPlayState=ms.animationPlayState;
    target.style.transformOrigin=ms.transformOrigin;
    target.style.transition=ms.transition;

    if(!ms.animationName||ms.animationName==='none'){
      target.style.transform=ms.transform;
    }else{
      target.style.removeProperty('transform');
    }
  }

  function ensureMascot(){
    if(window.innerWidth<=760)return;
    var o=document.getElementById('eternaOverlayV159');
    if(!o)return;
    var bar=o.querySelector('.eternaV160ModeBar');
    if(!bar)return;
    var source=findProfileCoco();
    if(!source)return;
    var mascot=bar.querySelector('.eternaV160CocoFlex');
    if(!mascot){
      mascot=document.createElement('div');
      mascot.className='eternaV160CocoFlex';
      mascot.setAttribute('aria-hidden','true');
      var img=source.cloneNode(true);
      img.removeAttribute('id');
      img.alt='';
      mascot.appendChild(img);
      bar.insertBefore(mascot,bar.firstChild);
    }
    var current=mascot.querySelector('img');
    var src=source.currentSrc||source.src;
    if(current&&src&&current.src!==src)current.src=src;
    copyExactPresentation(source,current);
  }

  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609324';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:grid!important;grid-template-columns:110px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:0!important;padding:8px 10px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions):not(.eternaV160CocoFlex){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160CocoFlex{grid-column:1!important;display:grid!important;place-items:center!important;width:104px!important;height:86px!important;overflow:visible!important;pointer-events:none!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{grid-column:2!important;display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,100%)!important;max-width:690px!important;min-width:540px!important;margin-left:auto!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}';
  document.head.appendChild(style);

  var observer=new MutationObserver(ensureMascot);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','src']});
  addEventListener('resize',ensureMascot,{passive:true});
  ensureMascot();
})();
