/* Coco en Forma · v160.79 SUBSCRIPTION UI · Runtime loop guard + plan actual + Family/Safari preservados */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,eternaPromise=null,replaying=false;
  var familyLifecycle={active:false,settled:false,marks:Object.create(null)};
  var longTaskObserver=null,longTasks=[];
  var DESKTOP_SAFARI=/Safari\//.test(navigator.userAgent||"")&&!/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR)\//.test(navigator.userAgent||"")&&/Macintosh/.test(navigator.userAgent||"")&&Number(navigator.maxTouchPoints||0)===0;
  try{performance.mark("coco_boot_start")}catch(e){}

  /* v160.77: intercept only the legacy scheduleUpgrade MutationObserver.
     The legacy observer watched every childList mutation in #cocoApp, including
     mutations created by upgradeAll() itself. That formed an endless feedback
     loop. Keep legitimate structural upgrades, ignore self-generated polish. */
  var legacyObserverGuardInstalled=false,legacyObserverInstances=0,legacyObserverDeliveries=0,legacyObserverIgnored=0;
  var LEGACY_STRUCTURAL_SELECTOR=".cocoGameCard,[data-coco-juego],.cocoMiniJuego,.cocoMiniLista,#nPas,#nPas2,[data-password-recovery],.barraVolver,#cocoMedContenido,#medSiguiente,#medExplicarMejor,.cocoMedAutoNext,.caja,.juego-contenedor,.cocoFamiliaBtn,.cocoFamilyV129,#eternaLauncherV159,#retosCard,.retosCard,.cocoRetosNota,.carnet,.avatarCarnet,.cocoRanking,[data-coco-ranking]";
  function legacyStructuralNode(node){
    if(!node||node.nodeType!==1)return false;
    try{
      if(node.matches&&node.matches(LEGACY_STRUCTURAL_SELECTOR))return true;
      return !!(node.querySelector&&node.querySelector(LEGACY_STRUCTURAL_SELECTOR))
    }catch(e){return false}
  }
  function installLegacyObserverGuard(){
    var Native=root.MutationObserver;
    if(legacyObserverGuardInstalled||typeof Native!=="function"||Native.__cocoRuntime16077)return legacyObserverGuardInstalled;
    function CocoMutationObserver(callback){
      var name=String(callback&&callback.name||""),source="";
      try{source=Function.prototype.toString.call(callback)}catch(e){}
      var isLegacy=name==="scheduleUpgrade"||/^function\s+scheduleUpgrade\b/.test(source);
      if(!isLegacy)return new Native(callback);
      legacyObserverInstances++;
      return new Native(function(records,observer){
        for(var i=0;i<records.length;i++){
          var added=records[i]&&records[i].addedNodes;
          if(!added)continue;
          for(var j=0;j<added.length;j++){
            if(legacyStructuralNode(added[j])){
              legacyObserverDeliveries++;
              callback(records,observer);
              return
            }
          }
        }
        legacyObserverIgnored++
      })
    }
    CocoMutationObserver.prototype=Native.prototype;
    try{Object.setPrototypeOf(CocoMutationObserver,Native)}catch(e){}
    try{Object.defineProperty(CocoMutationObserver,"__cocoRuntime16077",{value:true})}catch(e){CocoMutationObserver.__cocoRuntime16077=true}
    root.MutationObserver=CocoMutationObserver;
    legacyObserverGuardInstalled=true;
    return true
  }
  installLegacyObserverGuard();

  /* v160.77: fail-safe for daily availability. Distinct cards may ask at once;
     identical game/user/day reads are coalesced and cached briefly. The cache is
     invalidated on coco:daily-updated so the one-play-per-day rule stays fresh. */
  var dailyCanPlayCache=new Map(),dailyCanPlayInFlight=new Map(),dailyGuardInstalled=false,dailyGuardCalls=0,dailyGuardNativeCalls=0;
  function localDayKey(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function clearDailyGuardCache(){dailyCanPlayCache.clear();dailyCanPlayInFlight.clear()}
  function installDailyCanPlayGuard(){
    var daily=root.CocoDailyV134;
    if(!daily||typeof daily.canPlay!=="function")return false;
    if(daily.canPlay.__cocoRuntime16077){dailyGuardInstalled=true;return true}
    var nativeCanPlay=daily.canPlay;
    function guardedCanPlay(gameId,userId){
      dailyGuardCalls++;
      var key=String(userId||"visitante")+"|"+String(gameId||"")+"|"+localDayKey(),now=Date.now(),hit=dailyCanPlayCache.get(key);
      if(hit&&now-hit.at<5000)return Promise.resolve(hit.value);
      if(dailyCanPlayInFlight.has(key))return dailyCanPlayInFlight.get(key);
      dailyGuardNativeCalls++;
      var p=Promise.resolve().then(function(){return nativeCanPlay.call(daily,gameId,userId)}).then(function(value){
        dailyCanPlayCache.set(key,{value:value,at:Date.now()});return value
      }).finally(function(){dailyCanPlayInFlight.delete(key)});
      dailyCanPlayInFlight.set(key,p);return p
    }
    guardedCanPlay.__cocoRuntime16077=true;
    guardedCanPlay.__cocoNative=nativeCanPlay;
    try{daily.canPlay=guardedCanPlay}catch(e){return false}
    dailyGuardInstalled=daily.canPlay===guardedCanPlay;
    return dailyGuardInstalled
  }
  installDailyCanPlayGuard();
  root.addEventListener("coco:daily-updated",function(){clearDailyGuardCache();installDailyCanPlayGuard()},{passive:true});

  /* v160.76: compatibility bridge for the inline arcade runtime.
     The current index calls arcadeSession() from refreshCardScore(), but that
     helper was removed while arcadeUserId() remained. Keep one coalesced
     Supabase session read for all cards instead of creating per-card auth work. */
  var arcadeSessionCache=null,arcadeSessionCacheAt=0,arcadeSessionInFlight=null,arcadeAuthBound=false;
  function arcadeClient(){
    var cli=root.__COCO_SUPABASE_CLIENT||null;if(cli)return cli;
    var cfg=root.COCO_CONFIG||{};
    if(!root.supabase||!root.supabase.createClient||!cfg.url||!cfg.clave)return null;
    try{
      cli=root.supabase.createClient(String(cfg.url).replace(/\/+$/, ""),String(cfg.clave).trim(),{auth:{detectSessionInUrl:false,persistSession:true,autoRefreshToken:true}});
      root.__COCO_SUPABASE_CLIENT=cli;return cli
    }catch(e){return null}
  }
  function bindArcadeAuth(cli){
    if(arcadeAuthBound||!cli||!cli.auth||typeof cli.auth.onAuthStateChange!=="function")return;
    arcadeAuthBound=true;
    try{cli.auth.onAuthStateChange(function(_event,session){arcadeSessionCache=session||null;arcadeSessionCacheAt=Date.now();clearDailyGuardCache()})}catch(e){}
  }
  if(typeof root.arcadeSession!=="function")root.arcadeSession=async function(){
    var now=Date.now();
    if(arcadeSessionCacheAt&&now-arcadeSessionCacheAt<5000)return arcadeSessionCache;
    if(arcadeSessionInFlight)return arcadeSessionInFlight;
    var cli=arcadeClient();
    if(!cli||!cli.auth||typeof cli.auth.getSession!=="function"){arcadeSessionCache=null;arcadeSessionCacheAt=now;return null}
    bindArcadeAuth(cli);
    arcadeSessionInFlight=Promise.resolve().then(function(){return cli.auth.getSession()}).then(function(read){
      arcadeSessionCache=read&&read.data?read.data.session:null;arcadeSessionCacheAt=Date.now();return arcadeSessionCache
    }).catch(function(){arcadeSessionCache=null;arcadeSessionCacheAt=Date.now();return null}).finally(function(){arcadeSessionInFlight=null});
    return arcadeSessionInFlight
  };

  /* v160.76: idempotent ranking badge writes remain as a second guard. */
  var nativeInnerHTML=(typeof Element!=="undefined"&&Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"))||null;
  function stabilizeRankingBadge(badge){
    if(!badge||badge.dataset.cocoStableInnerHtml==="16076")return badge;
    if(nativeInnerHTML&&nativeInnerHTML.get&&nativeInnerHTML.set){
      try{Object.defineProperty(badge,"innerHTML",{configurable:true,get:function(){return nativeInnerHTML.get.call(this)},set:function(value){var next=String(value);if(nativeInnerHTML.get.call(this)===next)return;nativeInnerHTML.set.call(this,next)}})}catch(e){}
    }
    badge.dataset.cocoStableInnerHtml="16076";return badge
  }

  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id),html='<span aria-hidden="true">'+(general?"🏆":"•")+'</span><b>'+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+'</b>';stabilizeRankingBadge(badge);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";if(badge.innerHTML!==html)badge.innerHTML=html}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}}
  function relevantNode(node){if(!node||node.nodeType!==1)return false;if(node.matches&&node.matches("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))return true;return !!(node.querySelector&&node.querySelector("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))}

  function activateEternaModule(intent){
    root.__COCO_ETERNA_LOAD_INTENT__=intent||"eterna";
    try{
      if(root.ETERNA_EXPERIENCE_V16049&&typeof root.ETERNA_EXPERIENCE_V16049.activate==="function")root.ETERNA_EXPERIENCE_V16049.activate()
    }catch(e){}
    return true
  }

  function loadEternaExperience(intent){
    intent=intent||"eterna";
    if(root.ETERNA_EXPERIENCE_V16049||root.ETERNA_LAUNCH_STATE_V16070||root.ETERNA_LAUNCH_STATE_V16069){
      activateEternaModule(intent);
      return Promise.resolve(true)
    }
    if(eternaPromise)return eternaPromise.then(function(){activateEternaModule(intent);return true});
    root.__COCO_ETERNA_LOAD_INTENT__=intent;
    eternaPromise=new Promise(function(resolve,reject){
      var s=document.createElement("script");
      s.src="./eterna-experience-v160.js?v=16079";
      s.async=true;
      s.dataset.cocoModule="eterna-experience-v16079";
      s.onload=function(){
        try{performance.mark("eterna_core_ready")}catch(e){}
        activateEternaModule(intent);
        resolve(true)
      };
      s.onerror=function(){eternaPromise=null;reject(new Error("ETERNA_LOAD_FAILED"))};
      document.head.appendChild(s)
    });
    return eternaPromise
  }

  function scheduleEternaIdle(){
    if(DESKTOP_SAFARI)return;
    var run=function(){loadEternaExperience("idle").catch(function(){})};
    if("requestIdleCallback" in root)root.requestIdleCallback(run,{timeout:1200});
    else setTimeout(run,700)
  }

  function perfMarkOnce(name){
    if(familyLifecycle.marks[name])return false;
    familyLifecycle.marks[name]=true;
    try{performance.mark(name)}catch(e){}
    return true
  }

  function emitFamily(name,detail){
    try{root.dispatchEvent(new CustomEvent(name,{detail:detail||{}}))}catch(e){}
  }

  function familyCardNode(){return document.querySelector("#cocoApp .eternaV159FamilyCard")}
  function familyModalNode(){return document.querySelector("#cocoApp .cocoFamilyV129")}
  function canonicalLegalNode(card){return card&&card.querySelector(".eternaLegalV16058[data-et-legal-canonical='1']")}

  function finishFamilyUi(card,legal){
    if(!familyLifecycle.active||familyLifecycle.settled)return;
    var subscription=card&&card.querySelector(".eternaV16061SubscriptionTop");
    if(!card||!legal||!subscription)return;
    perfMarkOnce("family_ui_ready");
    familyLifecycle.settled=true;
    try{performance.measure("family_click_to_ui","family_open_click","family_ui_ready")}catch(e){}
  }

  function syncFamilyLifecycle(){
    if(!familyLifecycle.active||familyLifecycle.settled)return;
    var modal=familyModalNode(),body=modal&&modal.querySelector(".cocoFamilyV129Body,.cocoFamilyBody,[class*='Family'][class*='Body']");
    var baseReady=body&&body.querySelector(".cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight");
    if(baseReady&&perfMarkOnce("family_base_ready"))emitFamily("coco:family-base-ready",{modal:modal,body:body});

    var card=familyCardNode();
    if(!card)return;
    if(perfMarkOnce("family_data_ready"))emitFamily("coco:family-card-ready",{card:card,body:body,modal:modal});

    var legal=canonicalLegalNode(card);
    if(legal)perfMarkOnce("family_legal_ready");
    finishFamilyUi(card,legal)
  }

  function beginFamilyLifecycle(){
    familyLifecycle.active=true;
    familyLifecycle.settled=false;
    familyLifecycle.marks=Object.create(null);
    try{performance.mark("family_open_click")}catch(e){}
    queueMicrotask(syncFamilyLifecycle)
  }

  function endFamilyLifecycle(){
    familyLifecycle.active=false;
    familyLifecycle.settled=false
  }

  function installEternaDemandLoader(){
    root.addEventListener("coco:family-legal-ready",function(){if(familyLifecycle.active){perfMarkOnce("family_legal_ready");syncFamilyLifecycle()}},{passive:true});
    root.addEventListener("coco:family-ui-ready",function(event){
      if(!familyLifecycle.active)return;
      var card=event&&event.detail&&event.detail.card||familyCardNode(),legal=canonicalLegalNode(card);
      finishFamilyUi(card,legal)
    },{passive:true});

    document.addEventListener("click",function(event){
      var closeTarget=event.target&&event.target.closest?event.target.closest("#cocoApp .cocoFamilyV129 [data-family-close],#cocoApp .cocoFamilyV129>header button"):null;
      if(closeTarget&&familyLifecycle.active)queueMicrotask(endFamilyLifecycle);

      var target=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159 .eternaLauncherCtaFinal3,#eternaLauncherV159 .eternaLauncherCardV159,#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn"):null;
      if(!target)return;

      var family=!!(target.matches&&target.matches("#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn"));
      if(family)beginFamilyLifecycle();
      else try{performance.mark("eterna_open_click")}catch(e){}

      if(replaying||root.ETERNA_EXPERIENCE_V16049||root.ETERNA_LAUNCH_STATE_V16070||root.ETERNA_LAUNCH_STATE_V16069){
        activateEternaModule(family?"family":"eterna");
        if(family){perfMarkOnce("family_module_ready");queueMicrotask(syncFamilyLifecycle)}
        return
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      loadEternaExperience(family?"family":"eterna").then(function(){
        if(family){
          perfMarkOnce("family_module_ready");
          try{performance.measure("family_click_to_module","family_open_click","family_module_ready")}catch(e){}
        }
        replaying=true;
        try{target.click()}
        finally{
          queueMicrotask(function(){
            replaying=false;
            if(family)syncFamilyLifecycle()
          })
        }
      }).catch(function(){
        replaying=false;
        if(family)endFamilyLifecycle()
      })
    },true)
  }

  function flush(){
    raf=0;
    var nodes=Array.from(queued);queued.clear();
    nodes.forEach(processNode);
    root.COCO_VERSION="2026-08-25-v160.79-subscription-ui"
  }

  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}

  function initial(){
    var app=document.getElementById("cocoApp");
    try{performance.mark("coco_home_visible");performance.measure("coco_boot_to_home","coco_boot_start","coco_home_visible")}catch(e){}
    installDailyCanPlayGuard();
    if(app){
      if(DESKTOP_SAFARI){
        var polish=function(){processNode(app)};
        if("requestIdleCallback" in root)root.requestIdleCallback(polish,{timeout:500});
        else setTimeout(polish,120)
      }else processNode(app)
    }
    scheduleEternaIdle();
    root.COCO_VERSION="2026-08-25-v160.79-subscription-ui"
  }

  function observe(){
    var app=document.getElementById("cocoApp");if(!app)return;
    new MutationObserver(function(records){
      records.forEach(function(r){r.addedNodes.forEach(function(n){if(relevantNode(n))queue(n)})});
      if(familyLifecycle.active&&!familyLifecycle.settled)syncFamilyLifecycle()
    }).observe(app,{childList:true,subtree:true})
  }

  function startLongTaskDiagnostics(){
    if(longTaskObserver||typeof PerformanceObserver!=="function")return false;
    try{
      longTasks=[];
      longTaskObserver=new PerformanceObserver(function(list){
        list.getEntries().forEach(function(e){
          longTasks.push({startTime:Math.round(e.startTime),duration:Math.round(e.duration),name:e.name||"longtask"});
          if(longTasks.length>100)longTasks.shift()
        })
      });
      longTaskObserver.observe({entryTypes:["longtask"]});
      return true
    }catch(e){longTaskObserver=null;return false}
  }

  function stopLongTaskDiagnostics(){
    if(longTaskObserver){try{longTaskObserver.disconnect()}catch(e){}longTaskObserver=null}
  }

  function diagnostics(){
    var nav=(performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||null;
    var resources=(performance.getEntriesByType&&performance.getEntriesByType("resource")||[]).map(function(r){
      return{name:r.name.split("/").pop()||r.name,duration:Math.round(r.duration),transferKB:Math.round(Number(r.transferSize||0)/1024)}
    }).sort(function(a,b){return b.duration-a.duration});
    var marks=(performance.getEntriesByType&&performance.getEntriesByType("mark")||[]).filter(function(e){return /^(coco_|eterna_|family_)/.test(e.name)}).map(function(e){return{name:e.name,startTime:Math.round(e.startTime)}});
    var measures=(performance.getEntriesByType&&performance.getEntriesByType("measure")||[]).filter(function(e){return /^(coco_|eterna_|family_)/.test(e.name)}).map(function(e){return{name:e.name,duration:Math.round(e.duration)}});
    var card=familyCardNode(),legalCount=card?card.querySelectorAll(".eternaLegalV16058").length:0;
    return{
      version:"160.77-runtime-loop-guard",
      desktopSafari:DESKTOP_SAFARI,
      navigation:nav?{domInteractive:Math.round(nav.domInteractive),domComplete:Math.round(nav.domComplete),loadEventEnd:Math.round(nav.loadEventEnd),type:nav.type}:null,
      resources:{count:resources.length,slowest:resources.slice(0,12)},
      family:{active:familyLifecycle.active,settled:familyLifecycle.settled,legalNodes:legalCount,canonicalLegal:!!canonicalLegalNode(card)},
      knownRuntime:{bootstrapMutationObservers:1,legacyObserverGuard:legacyObserverGuardInstalled,eternaChatObserver:root.ETERNA_EXPERIENCE_V16049?1:0,familyLegalPolling:0,familyLayoutPolling:0,nameRetryChain:0,progressRetryChain:0,externalTelemetry:false},
      marks:marks,
      measures:measures,
      longTasks:longTasks.slice()
    }
  }

  var perfApi=Object.freeze({startDiagnostics:startLongTaskDiagnostics,stopDiagnostics:stopLongTaskDiagnostics,diagnostics:diagnostics});
  root.CocoPerformanceV16077=perfApi;
  root.CocoPerformanceV16076=perfApi;
  root.CocoPerformanceV16074=perfApi;
  root.CocoPerformanceV16072=perfApi;
  root.CocoRuntimeStabilityV16077=Object.freeze({
    version:"160.77-runtime-loop-guard",
    arcadeSessionBridge:typeof root.arcadeSession==="function",
    rankingBadgeGuard:true,
    legacyObserverGuard:true,
    dailyCanPlayGuard:true,
    audit:function(){
      installDailyCanPlayGuard();
      return{
        arcadeSessionBridge:typeof root.arcadeSession==="function",
        stabilizedBadges:document.querySelectorAll("#cocoApp .cocoLigaBadge[data-coco-stable-inner-html='16076']").length,
        legacyObserverGuardInstalled:legacyObserverGuardInstalled,
        legacyObserverInstances:legacyObserverInstances,
        legacyObserverDeliveries:legacyObserverDeliveries,
        legacyObserverIgnored:legacyObserverIgnored,
        dailyGuardInstalled:dailyGuardInstalled,
        dailyGuardCalls:dailyGuardCalls,
        dailyGuardNativeCalls:dailyGuardNativeCalls,
        dailyCacheEntries:dailyCanPlayCache.size,
        dailyInflight:dailyCanPlayInFlight.size
      }
    }
  });
  root.CocoRuntimeStabilityV16076=root.CocoRuntimeStabilityV16076||root.CocoRuntimeStabilityV16077;

  installEternaDemandLoader();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){installDailyCanPlayGuard();initial();observe()},{once:true});
  else{installDailyCanPlayGuard();initial();observe()}
})(window);
