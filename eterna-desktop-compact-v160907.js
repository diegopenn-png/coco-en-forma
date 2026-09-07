/* ETERNA desktop compact header · 160.93.18
 * Scope: desktop-only compact mode/action bar. Keeps mobile/tablet unchanged.
 */
(function(){
  'use strict';
  if(window.__ETERNA_DESKTOP_COMPACT_1609318__)return;
  window.__ETERNA_DESKTOP_COMPACT_1609318__=true;
  var style=document.createElement('style');
  style.id='eterna-desktop-compact-v1609318';
  style.textContent='@media (min-width:761px){'+
    '#eternaOverlayV159 .eternaV160ModeBar{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:0!important;min-height:0!important;padding:8px 10px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeBar>:not(.eternaV160ModeActions){display:none!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions{display:grid!important;grid-template-columns:240px minmax(300px,1fr)!important;grid-template-rows:40px 40px!important;gap:6px 10px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 690px!important;width:min(690px,100%)!important;max-width:690px!important;min-width:540px!important;margin:0!important;}'+
    '#eternaOverlayV159 .eternaV160DesktopModeSelector{height:40px!important;padding:0 9px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeDropdownButton{height:38px!important;font-size:11.5px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{height:40px!important;min-height:40px!important;border-radius:11px!important;}'+
    '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{min-height:86px!important;border-radius:13px!important;}'+
  '}';
  document.head.appendChild(style);
})();
