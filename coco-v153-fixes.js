/* Coco en Forma · v160.72 RC · Family lifecycle determinista + Safari desktop por intención */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,eternaPromise=null,replaying=false;
  var familyLifecycle={active:false,refreshRequested:false,canonical:null,marks:Object.create(null)};
  var longTaskObserver=null,longTasks=[];
  var DESKTOP_SAFARI=/Safari\//.test(navigator.userAgent||"")&&!/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR)\//.test(navigator.userAgent||"")&&/Macintosh/.test(navigator.userAgent||"")&&Number(navigator.maxTouchPoints||0)===0;
  try{performance.mark("coco_boot_start")}catch(e){}

  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";badge.innerHTML="<span>"+(general?"🏆":"•")+"</span><b>"+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+"</b>"}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}}
  function relevantNode(node){if(!node||node.nodeType!==1)return false;if(node.matches&&node.matches("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))return true;return !!(node.querySelector&&node.querySelector("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))}

  function loadEternaExperience(){
    if(root.ETERNA_LAUNCH_STATE_V16070||root.ETERNA_LAUNCH_STATE_V16069||root.ETERNA_EXPERIENCE_V16049)return Promise.resolve(true);
    if(eternaPromise)return eternaPromise;
    eternaPromise=new Promise(function(resolve,reject){
      var s=document.createElement("script");s.src="./eterna-experience-v160.js?v=16072";s.async=true;s.dataset.cocoModule="eterna-experience-v16072";
      s.onload=function(){try{performance.mark("eterna_core_ready")}catch(e){}resolve(true)};
      s.onerror=function(){eternaPromise=null;reject(new Error("ETERNA_LOAD_FAILED"))};document.head.appendChild(s)
    });
    return eternaPromise
  }
  function scheduleEternaIdle(){if(DESKTOP_SAFARI)return;var run=function(){loadEternaExperience().catch(function(){})};if("requestIdleCallback" in root)root.requestIdleCallback(run,{timeout:1200});else setTimeout(run,700)}

  function perfMarkOnce(name){
    if(familyLifecycle.marks[name])return;familyLifecycle.marks[name]=true;
    try{performance.mark(name)}catch(e){}
  }
  function familyCardNode(){return document.querySelector("#cocoApp .eternaV159FamilyCard")}
  function familyModalNode(){return document.querySelector("#cocoApp .cocoFamilyV129")}
  function legalNodes(card){return card?Array.from(card.querySelectorAll(".eternaLegalV16058")):[]}
  function canonicalizeFamilyLegal(card){
    var nodes=legalNodes(card);if(!nodes.length)return null;
    var keep=nodes.find(function(n){return n.classList.contains("is-ok")})||nodes.find(function(n){return n.getAttribute("data-et-legal-canonical")==="1"})||nodes[nodes.length-1];
    nodes.forEach(function(n){if(n!==keep)n.remove()});
    keep.setAttribute("data-et-legal-canonical","1");familyLifecycle.canonical=keep;perfMarkOnce("family_legal_ready");return keep
  }
  function syncFamilyLifecycle(){
    if(!familyLifecycle.active)return;
    var modal=familyModalNode(),body=modal&&modal.querySelector(".cocoFamilyV129Body,.cocoFamilyBody,[class*='Family'][class*='Body']");
    var baseReady=body&&body.querySelector(".cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight");
    if(baseReady)perfMarkOnce("family_base_ready");
    var card=familyCardNode();
    if(!card)return;
    /* injectFamilyCard() appears only after its subscription/settings await resolved. */
    perfMarkOnce("family_data_ready");
    var legal=canonicalizeFamilyLegal(card);
    if(!legal&&!familyLifecycle.refreshRequested){
      var shield=root.ETERNA_LEGAL_SHIELD_V16058;
      if(shield&&typeof shield.refresh==="function"){familyLifecycle.refreshRequested=true;shield.refresh()}
    }
    legal=canonicalizeFamilyLegal(card)||legal;
    if(legal&&!familyLifecycle.marks.family_ui_ready){perfMarkOnce("family_ui_ready");try{performance.measure("family_click_to_ui","family_open_click","family_ui_ready")}catch(e){}}
  }
  function beginFamilyLifecycle(){
    familyLifecycle.active=true;familyLifecycle.refreshRequested=false;familyLifecycle.canonical=null;familyLifecycle.marks=Object.create(null);
    try{performance.mark("family_open_click")}catch(e){}
    queueMicrotask(syncFamilyLifecycle)
  }
  function endFamilyLifecycle(){familyLifecycle.active=false;familyLifecycle.refreshRequested=false;familyLifecycle.canonical=null}

  function installEternaDemandLoader(){
    document.addEventListener("click",function(event){
      var closeTarget=event.target&&event.target.closest?event.target.closest("#cocoApp .cocoFamilyV129 [data-family-close],#cocoApp .cocoFamilyV129>header button"):null;
      if(closeTarget&&familyLifecycle.active)queueMicrotask(endFamilyLifecycle);
      var target=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159 .eternaLauncherCtaFinal3,#eternaLauncherV159 .eternaLauncherCardV159,#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn"):null;if(!target)return;
      var family=!!(target.matches&&target.matches("#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn"));
      if(family)beginFamilyLifecycle();
      if(replaying||root.ETERNA_LAUNCH_STATE_V16070||root.ETERNA_LAUNCH_STATE_V16069||root.ETERNA_EXPERIENCE_V16049){if(family)queueMicrotask(syncFamilyLifecycle);return}
      event.preventDefault();event.stopImmediatePropagation();
      if(!family)try{performance.mark("eterna_open_click")}catch(e){}
      loadEternaExperience().then(function(){
        try{if(family){performance.mark("family_module_ready");performance.measure("family_click_to_module","family_open_click","family_module_ready")}}catch(e){}
        replaying=true;try{target.click()}finally{queueMicrotask(function(){replaying=false;if(family)syncFamilyLifecycle()})}
      }).catch(function(){replaying=false;if(family)endFamilyLifecycle()})
    },true)
  }

  function flush(){raf=0;var nodes=Array.from(queued);queued.clear();nodes.forEach(processNode);root.COCO_VERSION="2026-08-25-v160.72-rc"}
  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}
  function initial(){var app=document.getElementById("cocoApp");try{performance.mark("coco_home_visible");performance.measure("coco_boot_to_home","coco_boot_start","coco_home_visible")}catch(e){}if(app){if(DESKTOP_SAFARI){var polish=function(){processNode(app)};if("requestIdleCallback" in root)root.requestIdleCallback(polish,{timeout:500});else setTimeout(polish,120)}else processNode(app)}scheduleEternaIdle();root.COCO_VERSION="2026-08-25-v160.72-rc"}
  function observe(){var app=document.getElementById("cocoApp");if(!app)return;new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(function(n){if(relevantNode(n))queue(n)})});if(familyLifecycle.active)syncFamilyLifecycle()}).observe(app,{childList:true,subtree:true})}

  function startLongTaskDiagnostics(){
    if(longTaskObserver||typeof PerformanceObserver!=="function")return false;
    try{longTasks=[];longTaskObserver=new PerformanceObserver(function(list){list.getEntries().forEach(function(e){longTasks.push({startTime:Math.round(e.startTime),duration:Math.round(e.duration),name:e.name||"longtask"});if(longTasks.length>100)longTasks.shift()})});longTaskObserver.observe({entryTypes:["longtask"]});return true}catch(e){longTaskObserver=null;return false}
  }
  function stopLongTaskDiagnostics(){if(longTaskObserver){try{longTaskObserver.disconnect()}catch(e){}longTaskObserver=null}}
  root.CocoPerformanceV16072=Object.freeze({
    startDiagnostics:startLongTaskDiagnostics,
    stopDiagnostics:stopLongTaskDiagnostics,
    diagnostics:function(){
      var marks=(performance.getEntriesByType&&performance.getEntriesByType("mark")||[]).filter(function(e){return /^(coco_|eterna_|family_)/.test(e.name)}).map(function(e){return{name:e.name,startTime:Math.round(e.startTime)}});
      var measures=(performance.getEntriesByType&&performance.getEntriesByType("measure")||[]).filter(function(e){return /^(coco_|eterna_|family_)/.test(e.name)}).map(function(e){return{name:e.name,duration:Math.round(e.duration)}});
      return{version:"160.72-rc",desktopSafari:DESKTOP_SAFARI,family:{active:familyLifecycle.active,canonicalLegal:!!(familyLifecycle.canonical&&document.contains(familyLifecycle.canonical)),refreshRequested:familyLifecycle.refreshRequested},marks:marks,measures:measures,longTasks:longTasks.slice()}
    }
  });

  installEternaDemandLoader();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){initial();observe()},{once:true});else{initial();observe()}
})(window);
