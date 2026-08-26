/* Coco en Forma · v160.83 PREMIUM FAMILY REPORTING · Modelos compartidos + catálogo definitivo + V/F equilibrado */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,eternaPromise=null,replaying=false;
  var familyLifecycle={active:false,settled:false,marks:Object.create(null)};
  var longTaskObserver=null,longTasks=[];
  var trueFalseMixInstalled=false,gameOrderRuns=0,familyPolishRuns=0,suggestionPlacementRuns=0,gameReportRenderRuns=0;
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


  /* v160.83 · REPORT KIT ÚNICO
     DATOS -> MODELO -> COMPONENTES VISUALES.
     El mismo report model se usa en Zona Familiar, exportación e intercambio.
     No se añade ningún observer, polling, timer o listener persistente. */
  function escapeReportHtml(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function reportValue(n){n=Number(n);return isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0}
  function reportDate(){try{return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"long",year:"numeric"}).format(new Date())}catch(e){return new Date().toLocaleDateString("es-ES")}}
  function modelSignature(model){try{return JSON.stringify(model)}catch(e){return String(Date.now())}}

  function reportCoreHtml(model){
    model=model||{};var theme=model.theme==="games"?"games":"learning",hero=model.hero||{},metrics=Array.isArray(model.metrics)?model.metrics:[],bars=Array.isArray(model.bars)?model.bars:[],panels=Array.isArray(model.panels)?model.panels:[],groups=Array.isArray(model.groups)?model.groups:[],next=model.nextStep||null;
    var heroPercent=hero.percent==null?null:reportValue(hero.percent);
    var metricsHtml=metrics.length?'<div class="cocoV16083Metrics">'+metrics.map(function(x){return'<article><strong>'+escapeReportHtml(x.value)+'</strong><span>'+escapeReportHtml(x.label)+'</span>'+(x.detail?'<small>'+escapeReportHtml(x.detail)+'</small>':"")+'</article>'}).join("")+'</div>':"";
    var barsHtml=bars.length?'<section class="cocoV16083Section cocoV16083Bars"><div class="cocoV16083SectionHead"><div><span>'+escapeReportHtml(model.barEyebrow||"MAPA VISUAL")+'</span><h3>'+escapeReportHtml(model.barTitle||"Progreso observado")+'</h3></div><small>'+escapeReportHtml(model.barScale||"0–100")+'</small></div><div class="cocoV16083BarList">'+bars.map(function(x){var value=reportValue(x.value);return'<article><div class="cocoV16083BarLabel"><b>'+escapeReportHtml(x.label)+'</b>'+(x.sublabel?'<span>'+escapeReportHtml(x.sublabel)+'</span>':"")+'</div><div class="cocoV16083Track"><i style="width:'+value+'%"></i></div><strong>'+value+'</strong>'+(x.detail?'<small>'+escapeReportHtml(x.detail)+'</small>':"")+'</article>'}).join("")+'</div></section>':"";
    var panelsHtml=panels.length?'<div class="cocoV16083PanelGrid">'+panels.map(function(p){var items=Array.isArray(p.items)?p.items:[];return'<section class="cocoV16083Panel '+escapeReportHtml(p.tone||"")+'"><div class="cocoV16083PanelTitle"><span aria-hidden="true">'+escapeReportHtml(p.icon||"✦")+'</span><div><small>'+escapeReportHtml(p.eyebrow||"")+'</small><h3>'+escapeReportHtml(p.title||"")+'</h3></div></div>'+(p.text?'<p>'+escapeReportHtml(p.text)+'</p>':"")+(items.length?'<div class="cocoV16083ItemList">'+items.map(function(i){var hasPct=i.percent!=null;return'<div class="cocoV16083Item"><div><b>'+escapeReportHtml(i.label||"")+'</b>'+(i.detail?'<span>'+escapeReportHtml(i.detail)+'</span>':"")+'</div>'+(hasPct?'<div class="cocoV16083Mini"><i style="width:'+reportValue(i.percent)+'%"></i></div><strong>'+reportValue(i.percent)+'%</strong>':i.value!=null?'<strong>'+escapeReportHtml(i.value)+'</strong>':"")+'</div>'}).join("")+'</div>':"")+'</section>'}).join("")+'</div>':"";
    var groupsHtml=groups.length?'<section class="cocoV16083Section"><div class="cocoV16083SectionHead"><div><span>'+escapeReportHtml(model.groupEyebrow||"VINCULACIÓN")+'</span><h3>'+escapeReportHtml(model.groupTitle||"Qué contribuye a cada área")+'</h3></div></div><div class="cocoV16083GroupGrid">'+groups.map(function(g){return'<article><b>'+escapeReportHtml(g.title)+'</b><div>'+((g.items||[]).map(function(item){return'<span>'+escapeReportHtml(item)+'</span>'}).join(""))+'</div></article>'}).join("")+'</div></section>':"";
    var nextHtml=next?'<section class="cocoV16083Next"><span>'+escapeReportHtml(next.eyebrow||"PRÓXIMO PASO")+'</span><div><h3>'+escapeReportHtml(next.title||"")+'</h3><p>'+escapeReportHtml(next.text||"")+'</p></div></section>':"";
    return '<div class="cocoV16083ReportCore '+theme+'">'+
      '<header class="cocoV16083ReportHeader"><div><span>'+escapeReportHtml(model.eyebrow||"")+'</span><h2>'+escapeReportHtml(model.title||"")+'</h2><p>'+escapeReportHtml(model.subtitle||"")+'</p></div><div class="cocoV16083Person"><b>'+escapeReportHtml(model.personName||"Alumno Coco")+'</b><span>'+escapeReportHtml(model.personMeta||"")+'</span></div></header>'+
      '<section class="cocoV16083Hero"><div class="cocoV16083HeroOrb"><span>'+escapeReportHtml(theme==="games"?"🧠":"✦")+'</span>'+(heroPercent!=null?'<b>'+heroPercent+'%</b>':"")+'</div><div><span>'+escapeReportHtml(hero.eyebrow||"FORTALEZA DESTACADA")+'</span><h3>'+escapeReportHtml(hero.title||"El mapa crecerá con la actividad")+'</h3><p>'+escapeReportHtml(hero.text||"")+'</p></div>'+(heroPercent!=null?'<div class="cocoV16083HeroGauge"><i style="width:'+heroPercent+'%"></i><small>Señal observada · '+heroPercent+'/100</small></div>':"")+'</section>'+
      metricsHtml+barsHtml+panelsHtml+groupsHtml+nextHtml+
      '<p class="cocoV16083ReportNote">'+escapeReportHtml(model.note||"Este mapa resume señales observadas en la actividad y puede cambiar con nuevas experiencias. No clasifica al alumno ni sustituye el criterio educativo de la familia o del profesorado.")+'</p>'+
    '</div>'
  }

  function reportDocumentHtml(model){
    var core=reportCoreHtml(model);
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeReportHtml(model.title||"Informe Coco en Forma")+'</title><style>body{margin:0;background:#edf6fa;color:#173f59}'+reportKitCss(true)+'.cocoV16083Document>footer{margin-top:18px;padding-top:13px;border-top:1px solid #dceaf0;color:#718692;font-size:10px;line-height:1.45}</style></head><body><main class="cocoV16083Document"><div class="cocoV16083DocTop"><div><b>COCO EN FORMA · ZONA FAMILIAR</b><span>Informe visual para la familia · '+escapeReportHtml(reportDate())+'</span></div><button onclick="window.print()">Imprimir o guardar como PDF</button></div>'+core+'<footer>Informe orientativo. Las fortalezas y áreas para reforzar describen señales de la actividad realizada hasta ahora y no etiquetas permanentes del alumno.</footer></main></body></html>'
  }

  function reportKitCss(documentMode){return [
    '.cocoV16083Document,.cocoV16083ReportCore{font-family:Fredoka,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#173f59}.cocoV16083Document *,.cocoV16083ReportCore *{box-sizing:border-box}',
    '.cocoV16083Document{max-width:980px;margin:26px auto;padding:24px;background:#fff;border-radius:28px;box-shadow:0 18px 50px rgba(23,63,89,.12)}.cocoV16083DocTop{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px;padding:0 2px 15px;border-bottom:1px solid #dceaf0}.cocoV16083DocTop b{display:block;color:#0f5677;font-size:12px;letter-spacing:.08em}.cocoV16083DocTop span{display:block;margin-top:4px;color:#718590;font-size:11px}.cocoV16083DocTop button{border:0;border-radius:12px;background:#173f59;color:#fff;padding:10px 14px;font-weight:900;cursor:pointer}',
    '.cocoV16083ReportCore{--accent:#1784b1;--accent2:#2fa9dc;--soft:#edf9fd;display:grid;gap:15px;color:#173f59}.cocoV16083ReportCore.games{--accent:#ef6c05;--accent2:#2fa9dc;--soft:#fff7ed}.cocoV16083ReportHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:19px;border:1px solid #d7e8ef;border-radius:22px;background:linear-gradient(145deg,#fbfdff,#f4fbfe 58%,var(--soft));box-shadow:0 8px 22px rgba(23,63,89,.07)}.cocoV16083ReportHeader>div>span{display:inline-flex;padding:6px 10px;border-radius:999px;background:var(--accent);color:#fff;font-size:9px;font-weight:950;letter-spacing:.07em}.cocoV16083ReportHeader h2{margin:9px 0 5px;font-size:27px;line-height:1.05}.cocoV16083ReportHeader p{margin:0;max-width:650px;color:#607985;font-size:12px;font-weight:700;line-height:1.45}.cocoV16083Person{text-align:right;min-width:145px}.cocoV16083Person b{display:block;font-size:16px}.cocoV16083Person span{display:block;margin-top:4px;color:#748995;font-size:10px}',
    '.cocoV16083Hero{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(150px,.38fr);align-items:center;gap:16px;padding:18px;border:1px solid #d9e9f0;border-radius:22px;background:#fff}.cocoV16083HeroOrb{width:92px;height:92px;border-radius:28px;display:grid;place-items:center;align-content:center;background:radial-gradient(circle at 35% 28%,#fff,var(--soft));border:1px solid #d8eaf1;box-shadow:0 5px 14px rgba(23,63,89,.08)}.cocoV16083HeroOrb span{font-size:29px}.cocoV16083HeroOrb b{margin-top:2px;color:var(--accent);font-size:19px}.cocoV16083Hero>div:nth-child(2)>span,.cocoV16083Next>span,.cocoV16083SectionHead span,.cocoV16083PanelTitle small{color:var(--accent);font-size:9px;font-weight:950;letter-spacing:.07em}.cocoV16083Hero h3{margin:4px 0;font-size:20px}.cocoV16083Hero p{margin:0;color:#657c88;font-size:11px;font-weight:700;line-height:1.45}.cocoV16083HeroGauge{display:grid;gap:7px}.cocoV16083HeroGauge:before{content:"";height:10px;border-radius:999px;background:#e4eff4}.cocoV16083HeroGauge i{height:10px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));margin-top:-17px}.cocoV16083HeroGauge small{color:#718793;font-size:9px;font-weight:800}',
    '.cocoV16083Metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cocoV16083Metrics article{padding:14px;border:1px solid #dceaf0;border-radius:17px;background:#fff;text-align:center}.cocoV16083Metrics strong{display:block;color:var(--accent);font-size:24px}.cocoV16083Metrics span{display:block;margin-top:3px;font-size:10px;font-weight:900}.cocoV16083Metrics small{display:block;margin-top:3px;color:#7a8d96;font-size:9px}',
    '.cocoV16083Section{padding:17px;border:1px solid #d9e9f0;border-radius:22px;background:#fff}.cocoV16083SectionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:13px}.cocoV16083SectionHead h3{margin:3px 0 0;font-size:18px}.cocoV16083SectionHead small{color:#788c96;font-size:9px;font-weight:800}.cocoV16083BarList{display:grid;gap:10px}.cocoV16083BarList article{display:grid;grid-template-columns:minmax(145px,.7fr) minmax(140px,1fr) 40px;align-items:center;gap:10px}.cocoV16083BarLabel b{display:block;font-size:11px}.cocoV16083BarLabel span,.cocoV16083BarList article>small{display:block;color:#788b95;font-size:9px}.cocoV16083Track{height:11px;border-radius:999px;background:#e8f0f4;overflow:hidden}.cocoV16083Track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent))}.cocoV16083BarList article>strong{color:var(--accent);font-size:14px;text-align:right}',
    '.cocoV16083PanelGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cocoV16083Panel{padding:16px;border:1px solid #dceaf0;border-radius:20px;background:#fff}.cocoV16083Panel.reinforce{background:#fff9f1;border-color:#f4ddbd}.cocoV16083Panel.strategy{background:#f2fbf7;border-color:#cfeadd}.cocoV16083PanelTitle{display:flex;align-items:center;gap:9px;margin-bottom:10px}.cocoV16083PanelTitle>span{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:var(--soft)}.cocoV16083PanelTitle h3{margin:2px 0 0;font-size:15px}.cocoV16083Panel p{margin:0;color:#657c88;font-size:10px;line-height:1.45}.cocoV16083ItemList{display:grid;gap:8px}.cocoV16083Item{display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,.5fr) auto;align-items:center;gap:8px;padding-top:8px;border-top:1px solid #edf2f5}.cocoV16083Item:first-child{padding-top:0;border-top:0}.cocoV16083Item b{display:block;font-size:10px}.cocoV16083Item span{display:block;color:#7a8d96;font-size:8.5px}.cocoV16083Item>strong{color:var(--accent);font-size:11px}.cocoV16083Mini{height:7px;border-radius:999px;background:#e7f0f4;overflow:hidden}.cocoV16083Mini i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent))}',
    '.cocoV16083GroupGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cocoV16083GroupGrid article{padding:12px;border:1px solid #e0ebef;border-radius:15px;background:#f9fcfd}.cocoV16083GroupGrid b{display:block;margin-bottom:7px;font-size:10px}.cocoV16083GroupGrid article div{display:flex;gap:5px;flex-wrap:wrap}.cocoV16083GroupGrid span{display:inline-flex;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid #dce9ef;color:#56717f;font-size:8.5px;font-weight:800}',
    '.cocoV16083Next{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:16px;border:1px solid #f1d4aa;border-radius:20px;background:linear-gradient(145deg,#fffaf2,#fff5e6)}.cocoV16083Next>span{padding:6px 9px;border-radius:999px;background:#ef6c05;color:#fff}.cocoV16083Next h3{margin:0 0 3px;font-size:15px}.cocoV16083Next p{margin:0;color:#765f4f;font-size:10px;line-height:1.45}.cocoV16083ReportNote{margin:0;padding:0 4px;color:#718692;font-size:9px;line-height:1.45}',
    '.cocoV16083InlineActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cocoV16083InlineActions button{min-height:40px;padding:9px 13px;border-radius:12px;border:1px solid #cfe3ec;background:#fff;color:#245b77;font:900 10px inherit;cursor:pointer;box-shadow:0 2px 0 rgba(190,217,229,.42)}.cocoV16083InlineActions button[data-report-share]{background:#effaf4;border-color:#bfe4cf;color:#1f7149}',
    '.cocoParticipationV16083{grid-column:1/-1!important;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:16px!important;padding:18px!important;border:2px dashed #9fd8e9!important;background:linear-gradient(135deg,#f2fbff,#fff8ee)!important;box-shadow:none!important}.cocoParticipationV16083 .cocoParticipationEyebrow{display:inline-flex!important;width:max-content!important;padding:6px 10px!important;border-radius:999px!important;background:#173f59!important;color:#fff!important;font-size:9px!important;font-weight:950!important;letter-spacing:.07em!important}.cocoParticipationV16083 h3{margin:4px 0!important}.cocoParticipationV16083 .cocoDescripcion{margin:0!important}.cocoParticipationV16083 .cocoSuggestionPromise{display:none!important}.cocoParticipationV16083 .cocoBotonJuego{min-width:150px!important}',
    '@media(max-width:700px){.cocoV16083Document{margin:0;border-radius:0;padding:16px}.cocoV16083DocTop{align-items:flex-start}.cocoV16083DocTop button{display:none}.cocoV16083ReportHeader{display:grid}.cocoV16083Person{text-align:left}.cocoV16083Hero{grid-template-columns:auto 1fr}.cocoV16083HeroGauge{grid-column:1/-1}.cocoV16083Metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.cocoV16083PanelGrid,.cocoV16083GroupGrid{grid-template-columns:1fr}.cocoV16083BarList article{grid-template-columns:1fr 45px}.cocoV16083Track{grid-column:1/-1;grid-row:2}.cocoV16083BarList article>strong{grid-column:2;grid-row:1}.cocoParticipationV16083{grid-template-columns:1fr!important}.cocoParticipationV16083 .cocoBotonJuego{width:100%!important}}',
    '@media print{body{background:#fff}.cocoV16083Document{box-shadow:none;margin:0;max-width:none;padding:0}.cocoV16083DocTop button,.cocoV16083InlineActions{display:none!important}.cocoV16083ReportCore{break-inside:auto}.cocoV16083Section,.cocoV16083Panel,.cocoV16083Hero{break-inside:avoid}}'
  ].join("")}

  function injectV16083Styles(){
    if(document.getElementById("coco-v16083-report-kit-css"))return;
    var style=document.createElement("style");style.id="coco-v16083-report-kit-css";style.textContent=reportKitCss(false)+"#cocoApp .eternaV159FamilyCard>.eternaV159Buttons{display:none!important}#cocoApp .cocoV16083CanonicalGameSource{display:none!important}#cocoApp .eternaV160ProgressPanel[data-et-premium-report=\"16083\"]{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important}#cocoApp .cocoV16083GamesReport{margin-top:18px}";document.head.appendChild(style)
  }

  function reportFile(model){var html=reportDocumentHtml(model),name=(model.theme==="games"?"informe-juegos-coco-":"informe-aprendizaje-eterna-")+new Date().toISOString().slice(0,10)+".html",blob=new Blob([html],{type:"text/html;charset=utf-8"}),file=null;try{file=new File([blob],name,{type:"text/html"})}catch(e){}return{html:html,name:name,blob:blob,file:file}}
  function triggerReportDownload(bundle){var url=URL.createObjectURL(bundle.blob),a=document.createElement("a");a.href=url;a.download=bundle.name;document.body.appendChild(a);a.click();a.remove();queueMicrotask(function(){try{URL.revokeObjectURL(url)}catch(e){}})}
  async function exportReportModel(model,button){var original=button&&button.textContent||"Exportar informe",bundle=reportFile(model),touch=/iPad|iPhone|Android/i.test(navigator.userAgent||"")||Number(navigator.maxTouchPoints||0)>1;if(button){button.disabled=true;button.textContent="Preparando…"}try{if(touch&&bundle.file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[bundle.file]}))){await navigator.share({title:model.title,text:"Te comparto el informe de progreso de Coco en Forma.",files:[bundle.file]})}else{var preview=null;try{preview=window.open("","_blank")}catch(e){}if(preview&&!preview.closed){preview.document.open();preview.document.write(bundle.html);preview.document.close()}else triggerReportDownload(bundle)}}catch(e){if(!e||e.name!=="AbortError")alert("No se pudo preparar el informe visual.")}finally{if(button){button.disabled=false;button.textContent=original}}}
  async function shareReportModel(model,button){var original=button&&button.textContent||"Compartir por WhatsApp",bundle=reportFile(model),message="Te comparto el informe de progreso de Coco en Forma: "+model.title+".";if(button){button.disabled=true;button.textContent="Preparando…"}try{if(bundle.file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[bundle.file]}))){await navigator.share({title:model.title,text:message,files:[bundle.file]})}else{triggerReportDownload(bundle);var url="https://wa.me/?text="+encodeURIComponent(message+" El informe visual se ha descargado para que puedas adjuntarlo en este chat.");try{window.open(url,"_blank","noopener,noreferrer")}catch(e){location.href=url}}}catch(e){if(!e||e.name!=="AbortError")alert("No se pudo compartir el informe.")}finally{if(button){button.disabled=false;button.textContent=original}}}

  root.CocoFamilyReportKitV16083=Object.freeze({version:"160.83",coreHtml:reportCoreHtml,documentHtml:reportDocumentHtml,signature:modelSignature,export:exportReportModel,share:shareReportModel});

  function numberFromText(v){var m=String(v||"").replace(/\./g,"").replace(",",".").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0}
  function buildGamesReportModel(modal,card){
    if(!modal)return null;var hero=modal.querySelector(".cocoFamilyHero"),stats=modal.querySelector(".cocoFamilyStats"),barRoot=modal.querySelector(".cocoFamilyBars"),coverage=modal.querySelector(".cocoFamilyCoverageGrid"),insight=modal.querySelector(".cocoFamilyInsight"),evidence=modal.querySelector(".cocoFamilyEvidence");if(!hero||!barRoot)return null;
    var profileText=hero.querySelector("span")?String(hero.querySelector("span").textContent||""):"",profileMatch=profileText.match(/PERFIL DE\s+(.+?)(?:\s+·\s+(\d+)\s+AÑOS)?$/i),name=profileMatch?profileMatch[1].trim():"Jugador Coco",age=profileMatch&&profileMatch[2]?profileMatch[2]+" años":"";
    var metrics=stats?Array.prototype.slice.call(stats.children).map(function(x){var b=x.querySelector("b,strong"),sp=x.querySelector("span,small");return{value:b?String(b.textContent||"").trim():"0",label:sp?String(sp.textContent||"").trim():"Actividad"}}):[];
    var bars=Array.prototype.slice.call(barRoot.querySelectorAll(":scope > article,article")).map(function(x){var b=x.querySelector("b"),sp=x.querySelector("span"),strong=x.querySelector("strong");return{label:b?String(b.textContent||"").trim():"Capacidad",sublabel:sp?String(sp.textContent||"").trim():"",value:strong?numberFromText(strong.textContent):0}}).filter(function(x){return x.label});
    var groups=coverage?Array.prototype.slice.call(coverage.querySelectorAll(":scope > article,article")).map(function(x){var b=x.querySelector("b"),items=Array.prototype.slice.call(x.querySelectorAll("span")).map(function(s){return String(s.textContent||"").trim()}).filter(Boolean);return{title:b?String(b.textContent||"").trim():"Área",items:items}}):[];
    var best=bars.slice().sort(function(a,b){return b.value-a.value})[0]||null,lowest=bars.slice().filter(function(x){return x.value>0}).sort(function(a,b){return a.value-b.value})[0]||bars.slice().sort(function(a,b){return a.value-b.value})[0]||null;
    var heroTitle=hero.querySelector("h3")?String(hero.querySelector("h3").textContent||"").trim():(best?"Fortaleza destacada: "+best.label:"El mapa crecerá con las primeras partidas"),heroText=hero.querySelector("p")?String(hero.querySelector("p").textContent||"").trim():"El mapa compara de forma orientativa las capacidades entrenadas en los juegos.";
    var nextTitle=insight&&insight.querySelector("h3")?String(insight.querySelector("h3").textContent||"").trim():"Equilibrio antes que comparación",nextText=insight&&insight.querySelector("p")?String(insight.querySelector("p").textContent||"").trim():(lowest?"La siguiente capacidad a explorar es "+lowest.label.toLowerCase()+".":"Completa actividades variadas para equilibrar el mapa.");
    return{theme:"games",eyebrow:"JUEGOS PARA LA MENTE · COCO",title:"Mapa de fortalezas de juegos para la mente",subtitle:"Memoria, atención, cálculo, lógica, lenguaje, velocidad y otras capacidades a partir del entrenamiento cognitivo de Coco.",personName:name,personMeta:age,hero:{eyebrow:"FORTALEZA DESTACADA",title:heroTitle,text:heroText,percent:best?best.value:null},metrics:metrics,bars:bars,barEyebrow:"MAPA DE CAPACIDADES",barTitle:"Capacidades entrenadas",barScale:"Rendimiento normalizado · 0–100",panels:[{tone:"strength",icon:"★",eyebrow:"LECTURA ACTUAL",title:"Fortaleza destacada",items:best?[{label:best.label,detail:best.sublabel,percent:best.value}]:[],text:best?"Es la señal relativa más alta observada hasta ahora en las partidas registradas.":"Todavía faltan partidas para destacar una capacidad."},{tone:"reinforce",icon:"↗",eyebrow:"EQUILIBRIO",title:"Área para explorar",items:lowest?[{label:lowest.label,detail:lowest.sublabel,percent:lowest.value}]:[],text:"El objetivo no es comparar al alumno con otras personas, sino equilibrar la variedad de entrenamiento."}],groups:groups,groupEyebrow:"JUEGOS Y CAPACIDADES",groupTitle:"Qué juegos contribuyen a cada capacidad",nextStep:{eyebrow:"LECTURA ÚTIL",title:nextTitle,text:nextText.replace(/<[^>]+>/g,"")},note:"Este mapa resume el rendimiento observado en los juegos de Coco. Es orientativo: no mide inteligencia general, no es una prueba clínica y puede cambiar con nuevas partidas."}
  }

  function gameSourceNodes(modal){return Array.prototype.slice.call(modal.querySelectorAll(".cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight,.cocoFamilyEvidence"))}
  function renderGamesPremium(modal,card){
    if(!modal)return false;var model=buildGamesReportModel(modal,card);if(!model)return false;var body=modal.querySelector(".cocoFamilyV129Body,.cocoFamilyBody,[class*='Family'][class*='Body']")||modal,source=gameSourceNodes(modal),signature=modelSignature(model),existing=body.querySelector(".cocoV16083GamesReport");if(existing&&existing.dataset.signature===signature){source.forEach(function(n){n.classList.add("cocoV16083CanonicalGameSource")});return true}if(existing)existing.remove();var block=document.createElement("section");block.className="cocoV16083GamesReport";block.dataset.signature=signature;block.innerHTML=reportCoreHtml(model)+'<div class="cocoV16083InlineActions"><button type="button" data-report-export>Exportar informe</button><button type="button" data-report-share>Compartir por WhatsApp</button><button type="button" data-report-refresh>Actualizar</button></div>';var first=source[0]||null;if(first)body.insertBefore(block,first);else body.appendChild(block);source.forEach(function(n){n.classList.add("cocoV16083CanonicalGameSource")});var exp=block.querySelector("[data-report-export]"),share=block.querySelector("[data-report-share]"),refresh=block.querySelector("[data-report-refresh]"),nativeRefresh=modal.querySelector(".cocoFamilyInsight [data-family-refresh]");exp.onclick=function(){exportReportModel(model,exp)};share.onclick=function(){shareReportModel(model,share)};if(refresh){if(nativeRefresh)refresh.onclick=function(){nativeRefresh.click()};else refresh.remove()}gameReportRenderRuns++;return true
  }

  function polishLearningFallback(card){
    if(!card)return;var panel=card.querySelector(".eternaV160ProgressPanel");if(!panel||panel.dataset.etPremiumReport==="16083")return;var head=panel.querySelector(".eternaV160ProgressHead"),title=head&&head.querySelector("b,h2,h3,h4");if(title)title.textContent="Mapa de fortalezas del aprendizaje"
  }

  function polishFamilyRuntime(node){
    var card=null;if(node&&node.matches&&node.matches(".eternaV159FamilyCard"))card=node;else if(node&&node.closest)card=node.closest(".eternaV159FamilyCard");if(!card&&node&&node.querySelector)card=node.querySelector(".eternaV159FamilyCard");if(!card)card=document.querySelector("#cocoApp .eternaV159FamilyCard");var modal=(card&&card.closest(".cocoFamilyV129"))||document.querySelector("#cocoApp .cocoFamilyV129");if(!card&&!modal)return;familyPolishRuns++;injectV16083Styles();if(card){Array.prototype.slice.call(card.children||[]).forEach(function(child){if(child.classList&&child.classList.contains("eternaV159Buttons"))child.remove()});var status=card.querySelector(".eternaV159FamilyStatus");if(status&&/^beta\s+de\s+prueba$/i.test(String(status.textContent||"").trim()))status.textContent="Versión beta";polishLearningFallback(card)}if(modal){var header=modal.querySelector(":scope > header p,:scope > header small,.cocoFamilyV129>header p,.cocoFamilyV129>header small");if(header)header.textContent="Dos miradas complementarias al progreso: aprendizaje escolar con Eterna y entrenamiento cognitivo con Coco.";renderGamesPremium(modal,card)}
  }

  function finalizeSuggestionPlacement(app){
    app=app||document.getElementById("cocoApp");if(!app)return false;
    var card=app.querySelector(".cocoSuggestionCard");
    if(card){
      var parent=card.parentElement,games=parent?Array.prototype.slice.call(parent.children).filter(function(n){return n.matches&&n.matches(".cocoGameCard[data-coco-juego]")}):[];
      if(!games.length){games=Array.prototype.slice.call(app.querySelectorAll(".cocoGameCard[data-coco-juego]"));parent=games.length?games[games.length-1].parentElement:null}
      if(parent&&parent.lastElementChild!==card)parent.appendChild(card);
      card.classList.add("cocoParticipationV16083");
      if(!card.querySelector(".cocoParticipationEyebrow")){var eyebrow=document.createElement("span");eyebrow.className="cocoParticipationEyebrow";eyebrow.textContent="PARTICIPA EN COCO";var h=card.querySelector("h3");card.insertBefore(eyebrow,h||card.firstChild)}
      var h3=card.querySelector("h3"),p=card.querySelector(".cocoDescripcion,p"),btn=card.querySelector(".cocoBotonJuego,.btn,button");if(h3)h3.textContent="¿Tienes una idea para un nuevo juego?";if(p)p.textContent="Cuéntanosla y ayúdanos a seguir mejorando Coco en Forma.";if(btn)btn.textContent="Danos una idea";suggestionPlacementRuns++
    }
    var mini=app.querySelector(".cocoMiniSuggestion");if(mini){var miniParent=mini.parentElement;if(miniParent&&miniParent.lastElementChild!==mini)miniParent.appendChild(mini)}return !!card
  }

  function truthItemValue(item){
    return Array.isArray(item)&&typeof item[1]==="boolean"?item[1]:null
  }

  function mixedTruthFalseOrder(items,key){
    items=Array.isArray(items)?items.slice():[];
    var typed=items.filter(function(item){return truthItemValue(item)!==null}),other=items.filter(function(item){return truthItemValue(item)===null});
    var hasTrue=typed.some(function(x){return truthItemValue(x)===true}),hasFalse=typed.some(function(x){return truthItemValue(x)===false});
    if(!hasTrue||!hasFalse)return items;
    var seed="v16083|"+String(key||"")+"|"+typed.map(function(x){return Array.isArray(x)?String(x.cocoId||x[0]||""):String(x)}).join("|");
    var rng=root.CocoV134&&typeof root.CocoV134.rngFrom==="function"?root.CocoV134.rngFrom(seed):Math.random;
    function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),tmp=a[i];a[i]=a[j];a[j]=tmp}return a}
    function valid(a){var last=null,run=0,strict=true;for(var i=0;i<a.length;i++){var v=truthItemValue(a[i]);if(i&&v===truthItemValue(a[i-1]))strict=false;if(v===last)run++;else{last=v;run=1}if(run>2)return false}return !strict}
    for(var attempt=0;attempt<48;attempt++){var candidate=shuffle(typed);if(valid(candidate))return candidate.concat(other)}
    var yes=shuffle(typed.filter(function(x){return truthItemValue(x)===true})),no=shuffle(typed.filter(function(x){return truthItemValue(x)===false})),out=[],last=null,run=0;
    while(yes.length||no.length){var choose;if(run>=2&&last!==null&&((last&&no.length)||(!last&&yes.length)))choose=!last;else if(yes.length&&no.length)choose=rng()<yes.length/(yes.length+no.length);else choose=!!yes.length;var q=choose?yes:no;if(!q.length){choose=!choose;q=choose?yes:no}out.push(q.shift());if(last===choose)run++;else{last=choose;run=1}}
    return out.concat(other)
  }

  function installTrueFalseMixGuard(){
    var api=root.CocoV134;
    if(trueFalseMixInstalled||!api||typeof api.selectStatic!=="function")return false;
    if(api.selectStatic.__cocoV16083TruthMix){trueFalseMixInstalled=true;return true}
    var nativeSelect=api.selectStatic.__cocoNative||api.selectStatic;
    function wrappedSelect(game,mode,difficulty,items,count,options){
      var result=nativeSelect.apply(api,arguments);
      if(normalizeText(game)==="verdadero"&&Array.isArray(result)&&result.some(function(x){return truthItemValue(x)!==null})){
        return mixedTruthFalseOrder(result,String(mode||"")+"|"+String(difficulty||""))
      }
      return result
    }
    wrappedSelect.__cocoV16083TruthMix=true;
    wrappedSelect.__cocoNative=nativeSelect;
    try{api.selectStatic=wrappedSelect}catch(e){return false}
    trueFalseMixInstalled=api.selectStatic===wrappedSelect;
    return trueFalseMixInstalled
  }

  function directGameCards(parent){
    return Array.prototype.filter.call(parent&&parent.children||[],function(node){
      return node&&node.matches&&node.matches(".cocoGameCard[data-coco-juego]")
    })
  }

  function sortGameParent(parent){
    var cards=directGameCards(parent);if(cards.length<2)return false;
    var seenNon=false,mixed=false;
    cards.forEach(function(card){
      var scoring=GENERAL.has(idOf(card));
      if(!scoring)seenNon=true;else if(seenNon)mixed=true
    });
    if(!mixed)return false;
    cards.filter(function(card){return GENERAL.has(idOf(card))}).concat(
      cards.filter(function(card){return !GENERAL.has(idOf(card))})
    ).forEach(function(card){parent.appendChild(card)});
    gameOrderRuns++;
    return true
  }

  function sortAllGameCards(rootNode){
    var scope=rootNode&&rootNode.querySelectorAll?rootNode:document;
    var parents=new Set();
    Array.prototype.slice.call(scope.querySelectorAll(".cocoGameCard[data-coco-juego]")).forEach(function(card){
      if(card.parentElement)parents.add(card.parentElement)
    });
    parents.forEach(sortGameParent)
  }

  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id),html='<span aria-hidden="true">'+(general?"🏆":"•")+'</span><b>'+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+'</b>';stabilizeRankingBadge(badge);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";if(badge.innerHTML!==html)badge.innerHTML=html}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}card.dataset.cocoScoringV16083=GENERAL.has(id)?"yes":"no";cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}if((node.matches&&node.matches(".cocoFamilyV129,.eternaV159FamilyCard,.eternaV159FamilyStatus,.eternaV159Buttons,.eternaV160ProgressPanel"))||(node.closest&&node.closest(".cocoFamilyV129"))||(node.querySelector&&node.querySelector(".eternaV159FamilyCard")))polishFamilyRuntime(node)}
  function relevantNode(node){if(!node||node.nodeType!==1)return false;var selector="[data-coco-juego],.cocoGameCard,.cocoSuggestionCard,.cocoMiniSuggestion,#retosCard,.retosCard,.cocoFamilyV129,.eternaV159FamilyCard,.eternaV159FamilyStatus,.eternaV159Buttons,.eternaV160ProgressPanel";if(node.matches&&node.matches(selector))return true;if(node.closest&&node.closest(".cocoFamilyV129"))return true;return !!(node.querySelector&&node.querySelector(selector))}

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
      s.src="./eterna-experience-v160.js?v=16083";
      s.async=true;
      s.dataset.cocoModule="eterna-experience-v16083";
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
    installTrueFalseMixGuard();
    sortAllGameCards(document.getElementById("cocoApp"));
    finalizeSuggestionPlacement(document.getElementById("cocoApp"));
    if(familyLifecycle.active)polishFamilyRuntime(document.querySelector("#cocoApp .cocoFamilyV129"));
    root.COCO_VERSION="2026-08-26-v160.83-premium-family-reporting"
  }

  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}

  function initial(){
    var app=document.getElementById("cocoApp");
    try{performance.mark("coco_home_visible");performance.measure("coco_boot_to_home","coco_boot_start","coco_home_visible")}catch(e){}
    injectV16083Styles();
    installTrueFalseMixGuard();
    installDailyCanPlayGuard();
    if(app){
      if(DESKTOP_SAFARI){
        var polish=function(){processNode(app)};
        if("requestIdleCallback" in root)root.requestIdleCallback(polish,{timeout:500});
        else setTimeout(polish,120)
      }else processNode(app)
    }
    sortAllGameCards(app);
    finalizeSuggestionPlacement(app);
    scheduleEternaIdle();
    root.COCO_VERSION="2026-08-26-v160.83-premium-family-reporting"
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
        dailyInflight:dailyCanPlayInFlight.size,
        trueFalseMixInstalled:trueFalseMixInstalled,
        gameOrderRuns:gameOrderRuns,
        familyPolishRuns:familyPolishRuns,
        suggestionPlacementRuns:suggestionPlacementRuns,
        gameReportRenderRuns:gameReportRenderRuns,
        reportKit:!!root.CocoFamilyReportKitV16083
      }
    }
  });
  root.CocoRuntimeStabilityV16076=root.CocoRuntimeStabilityV16076||root.CocoRuntimeStabilityV16077;

  installEternaDemandLoader();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){installDailyCanPlayGuard();initial();observe()},{once:true});
  else{installDailyCanPlayGuard();initial();observe()}
})(window);
