/* Shared game navigation. Uses each game's own lifecycle and never browser history. */
(function(root){
  'use strict';
  if(root.CocoNavigationV1)return;
  var style=document.createElement('style');style.textContent=`
.cocoGameNavigation{display:flex!important;gap:8px;padding:8px 12px;background:#fff;position:sticky;top:0;z-index:30;flex-shrink:0;box-sizing:border-box;width:100%;padding-top:max(8px,env(safe-area-inset-top))}
.cocoGameNavigation button{flex:1;min-width:0;min-height:48px;border:2px solid #cce5e9;border-radius:14px;background:#f3fbfc;color:#163646;font:700 14px/1.2 system-ui;cursor:pointer;padding:9px 6px}
.cocoGameNavigation button:focus-visible{outline:3px solid #1381bd;outline-offset:2px}
.cocoGameNavigation button:last-child{background:#173e51;color:white;border-color:#173e51}
.cocoArcadeShell,.cocoV144Shell,.cocoMedApp{max-height:100dvh!important;min-height:0!important}
.cocoArcadeTop,.cocoV144Header,.cocoMedTop{position:relative!important;top:auto!important}
.cocoArcadeClose,[data-v144-close],#cocoMedVolverSuperior{display:none!important}
#cocoApp .cocoArcadeOverlay:has(iframe[src*="games/conecta/"]){padding:0!important;overflow:hidden!important}
#cocoApp .cocoArcadeShell:has(iframe[src*="games/conecta/"]){display:flex!important;flex-direction:column;height:100dvh!important;min-height:0!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}
#cocoApp .cocoArcadeShell:has(iframe[src*="games/conecta/"])>.cocoArcadeTop{flex-shrink:0;min-height:54px!important;padding:6px 12px!important}
#cocoApp .cocoArcadeShell:has(iframe[src*="games/conecta/"]) .cocoArcadeTitle p{display:none}
#cocoApp .cocoArcadeShell:has(iframe[src*="games/conecta/"]) .cocoArcadeTopIcon{width:38px!important;height:38px!important}
#cocoApp .cocoArcadeBody:has(>iframe[src*="games/conecta/"]){flex:1;min-height:0;overflow:hidden;padding:0!important}
#cocoApp iframe[src*="games/conecta/"]{height:100%!important;min-height:0!important;border-radius:12px!important}
.barraVolver{position:sticky;top:0;z-index:35;background:white;flex-wrap:wrap}
`;
  document.head.appendChild(style);
  function add(shell,back,home){
    if(!shell||shell.querySelector(':scope > .cocoGameNavigation'))return;
    var nav=document.createElement('nav');nav.className='cocoGameNavigation';nav.setAttribute('aria-label','Navegación del juego');
    var b=document.createElement('button'),h=document.createElement('button');b.type=h.type='button';b.textContent='← Volver';h.textContent='Menú principal';b.onclick=back;h.onclick=home;nav.append(b,h);shell.prepend(nav);
  }
  function install(){
    add(document.querySelector('.cocoArcadeShell'),function(){root.CocoArcadeV133?.back()},function(){root.CocoArcadeV133?.close(true)});
    var modal=document.querySelector('.cocoV144Modal');
    add(modal?.querySelector('.cocoV144Shell'),function(){var api={padel:root.CocoPadelV152,runner:root.CocoRunnerV152,differences:root.CocoDifferencesProV152}[modal.dataset.module];if(api?.back)api.back();else root.CocoV144?.closeModal()},function(){root.CocoV144?.closeModal()});
    add(document.querySelector('.cocoMedApp'),function(){document.getElementById('cocoMedVolverSuperior')?.click()},function(){root.CocoMedV148?.close()});
    document.querySelectorAll('.barraVolver').forEach(function(bar){var native=bar.querySelector('.volver');if(!native)return;add(bar,function(){native.click()},function(){native.click()});native.style.display='none'});
  }
  var queued=false;new MutationObserver(function(){if(queued)return;queued=true;queueMicrotask(function(){queued=false;install()})}).observe(document.documentElement,{childList:true,subtree:true});
  root.CocoNavigationV1={install:install};install();
})(window);
