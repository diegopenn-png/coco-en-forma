/* Coco en Forma · v160.82 FAMILY REPORTS + GAME ORDER · Runtime estable + informes + V/F equilibrado */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,eternaPromise=null,replaying=false;
  var familyLifecycle={active:false,settled:false,marks:Object.create(null)};
  var longTaskObserver=null,longTasks=[];
  var trueFalseMixInstalled=false,gameOrderRuns=0,familyPolishRuns=0;
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


  /* v160.82: no new observer or polling. These helpers run inside the existing
     Coco bootstrap lifecycle so Family re-renders cannot restore obsolete UI. */
  function injectV16082Styles(){
    if(document.getElementById("coco-v16082-family-report-css"))return;
    var style=document.createElement("style");
    style.id="coco-v16082-family-report-css";
    style.textContent=[
      "#cocoApp .eternaV159FamilyCard>.eternaV159Buttons{display:none!important}",
      "#cocoApp .cocoV16082ReportActions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin-left:auto}",
      "#cocoApp .cocoV16082ReportActions button{min-height:38px;padding:8px 12px;border-radius:11px;border:1px solid #cfe3ec;background:#fff;color:#245b77;font:900 10px inherit;cursor:pointer;box-shadow:0 2px 0 rgba(190,217,229,.42)}",
      "#cocoApp .cocoV16082ReportActions button.cocoV16082WhatsApp{border-color:#bfe4cf;background:#effaf4;color:#1f7149}",
      "#cocoApp .cocoV16082MapIdentity{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 13px;padding:0 0 11px;border-bottom:1px solid rgba(23,63,89,.10)}",
      "#cocoApp .cocoV16082MapIdentity span{display:inline-flex;padding:6px 10px;border-radius:999px;background:#0f5677;color:#fff!important;font-size:9px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}",
      "#cocoApp .cocoV16082MapIdentity.is-games span{background:#1784b1}",
      "#cocoApp .cocoV16082MapIdentity small{flex:1 1 250px;color:#627b89!important;font-size:10px;font-weight:800;line-height:1.42}",
      "#cocoApp .cocoV16082GameReportBar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid rgba(23,63,89,.10)}",
      "#cocoApp .cocoV16082GameReportBar button{min-height:40px;padding:9px 13px;border-radius:12px;border:1px solid #cfe3ec;background:#fff;color:#245b77;font:900 10px inherit;cursor:pointer;box-shadow:0 2px 0 rgba(190,217,229,.42)}",
      "#cocoApp .cocoV16082GameReportBar button:last-child{background:#effaf4;border-color:#bfe4cf;color:#1f7149}",
      "@media(max-width:640px){#cocoApp .cocoV16082ReportActions{width:100%;justify-content:flex-start;margin-left:0}#cocoApp .cocoV16082ReportActions button,#cocoApp .cocoV16082GameReportBar button{flex:1 1 155px}}"
    ].join("");
    document.head.appendChild(style)
  }

  function cleanReportText(value){
    return String(value||"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\n[ \t]+/g,"\n").replace(/\n{3,}/g,"\n\n").trim()
  }

  function reportTextFromNode(node,title){
    var raw="";
    try{raw=cleanReportText(node&&node.innerText||node&&node.textContent||"")}catch(e){raw=""}
    [
      "Exportar informe","Exportar para padres","Compartir por WhatsApp","Actualizar",
      "Abrir Eterna","Gestionar suscripción","Cambiar a plan anual","Ver planes disponibles"
    ].forEach(function(label){raw=raw.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),"")});
    raw=cleanReportText(raw);
    return "Coco en Forma · "+title+"\n\n"+raw+"\n\nInforme orientativo basado en la actividad registrada hasta ahora."
  }

  function reportHtml(title,text){
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+title.replace(/[<>&]/g,"")+'</title><style>'+
      'body{margin:0;background:#eef7fb;color:#173f59;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.page{max-width:850px;margin:28px auto;background:#fff;border-radius:24px;padding:34px;box-shadow:0 18px 50px rgba(23,63,89,.12)}'+
      '.brand{color:#1682ad;font-weight:900;font-size:12px;letter-spacing:.08em}.title{font-size:34px;line-height:1.05;margin:8px 0 18px}.report{white-space:pre-wrap;line-height:1.55;font-size:15px;background:#f8fcfe;border:1px solid #d9ebf3;border-radius:18px;padding:20px}.note{margin-top:18px;color:#607986;font-size:12px}.actions{margin-top:20px}.actions button{border:0;border-radius:12px;background:#173f59;color:#fff;padding:11px 16px;font-weight:800;cursor:pointer}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none}.actions{display:none}}'+
      '</style></head><body><main class="page"><div class="brand">COCO EN FORMA · ZONA FAMILIAR</div><h1 class="title">'+title.replace(/</g,"&lt;").replace(/>/g,"&gt;")+'</h1><div class="report">'+
      text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+
      '</div><div class="note">Este informe resume tendencias observadas. No constituye una evaluación psicológica, médica ni diagnóstica.</div><div class="actions"><button onclick="window.print()">Imprimir o guardar como PDF</button></div></main></body></html>'
  }

  async function exportFamilyReport(node,title,button){
    if(!node)return;
    var original=button&&button.textContent||"Exportar para padres",text=reportTextFromNode(node,title),html=reportHtml(title,text);
    var name=("coco-"+title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+new Date().toISOString().slice(0,10)+".html");
    if(button){button.disabled=true;button.textContent="Preparando…"}
    try{
      var touch=/iPad|iPhone|Android/i.test(navigator.userAgent||"")||Number(navigator.maxTouchPoints||0)>1;
      var blob=new Blob([html],{type:"text/html;charset=utf-8"}),file=null;
      try{file=new File([blob],name,{type:"text/html"})}catch(e){}
      if(touch&&file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        try{await navigator.share({title:title,text:"Informe de Coco en Forma para la familia.",files:[file]})}
        catch(e){if(e&&e.name==="AbortError")return}
      }else{
        var preview=null;try{preview=window.open("","_blank")}catch(e){}
        if(preview&&!preview.closed){preview.document.open();preview.document.write(html);preview.document.close()}
        else{
          var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();queueMicrotask(function(){try{URL.revokeObjectURL(url)}catch(_e){}})
        }
      }
      if(button)button.textContent="Informe listo ✓"
    }catch(e){
      if(button)button.textContent=original;
      alert("No se pudo preparar el informe.")
    }finally{
      if(button){button.disabled=false;button.textContent=original}
    }
  }

  function shareFamilyReportWhatsApp(node,title){
    if(!node)return;
    var text=reportTextFromNode(node,title);
    if(text.length>3400)text=text.slice(0,3370)+"…";
    var url="https://wa.me/?text="+encodeURIComponent(text);
    try{window.open(url,"_blank","noopener,noreferrer")}catch(e){location.href=url}
  }

  function ensureMapIdentity(block,type,label,description){
    if(!block)return;
    var identity=block.querySelector(".cocoV16082MapIdentity");
    if(!identity){
      identity=document.createElement("div");
      identity.className="cocoV16082MapIdentity "+(type==="games"?"is-games":"is-learning");
      var anchor=block.querySelector(".eternaV160ProgressHead,h2,h3,h4");
      if(anchor)block.insertBefore(identity,anchor);else block.insertBefore(identity,block.firstChild)
    }
    identity.innerHTML="<span>"+label+"</span><small>"+description+"</small>"
  }

  function findGamesMapHeading(modal,card){
    if(!modal)return null;
    var nodes=Array.prototype.slice.call(modal.querySelectorAll("h2,h3,h4,h5"));
    return nodes.find(function(node){
      if(card&&card.contains(node))return false;
      var t=normalizeText(node.textContent);
      return t==="mapa de fortalezas"||t==="mapa de fortalezas de juegos para la mente"||t.indexOf("mapa de fortalezas de juegos")===0
    })||null
  }

  function gamesReportNode(modal,card,heading){
    if(!modal)return null;
    var body=modal.querySelector(".cocoFamilyV129Body,.cocoFamilyBody,[class*='Family'][class*='Body']")||modal;
    return body
  }

  function polishLearningReport(card){
    if(!card)return;
    var panel=card.querySelector(".eternaV160StrengthMap,.eternaV160ProgressPanel");
    if(!panel)return;
    var head=panel.querySelector(".eternaV160ProgressHead");
    if(head){
      var title=head.querySelector("b,h2,h3,h4");
      if(title)title.textContent="Mapa de fortalezas del aprendizaje";
      ensureMapIdentity(panel,"learning","APRENDIZAJE · ETERNA","Tareas, explicaciones, práctica y exámenes: progreso escolar independiente de los juegos.");
      var actions=head.querySelector(".cocoV16082ReportActions");
      if(!actions){
        actions=document.createElement("div");actions.className="cocoV16082ReportActions";
        var exportButton=head.querySelector("[data-et-export]");
        if(exportButton)actions.appendChild(exportButton);
        var wa=document.createElement("button");wa.type="button";wa.className="cocoV16082WhatsApp";wa.textContent="WhatsApp";
        wa.setAttribute("aria-label","Compartir el mapa de fortalezas del aprendizaje por WhatsApp");
        wa.onclick=function(){shareFamilyReportWhatsApp(panel,"Mapa de fortalezas del aprendizaje")};
        actions.appendChild(wa);
        head.appendChild(actions)
      }
      var exportBtn=actions.querySelector("[data-et-export]");
      if(exportBtn)exportBtn.textContent="Exportar para padres"
    }
  }

  function polishGamesReport(modal,card){
    var heading=findGamesMapHeading(modal,card);if(!heading)return;
    heading.textContent="Mapa de fortalezas de juegos para la mente";
    var intro=heading.closest("section,article,.caja")||heading.parentElement;
    if(intro)ensureMapIdentity(intro,"games","JUEGOS PARA LA MENTE · COCO","Memoria, atención, cálculo, lógica, lenguaje, velocidad y coordinación según las partidas de Coco.");
    var source=gamesReportNode(modal,card,heading);
    if(!intro||!source)return;
    var bar=intro.querySelector(".cocoV16082GameReportBar");
    if(!bar){
      bar=document.createElement("div");bar.className="cocoV16082GameReportBar";
      var exp=document.createElement("button");exp.type="button";exp.textContent="Exportar para padres";
      exp.onclick=function(){exportFamilyReport(source,"Mapa de fortalezas de juegos para la mente",exp)};
      var wa=document.createElement("button");wa.type="button";wa.textContent="Compartir por WhatsApp";
      wa.onclick=function(){shareFamilyReportWhatsApp(source,"Mapa de fortalezas de juegos para la mente")};
      bar.appendChild(exp);bar.appendChild(wa);intro.appendChild(bar)
    }
  }

  function polishFamilyRuntime(node){
    var card=null;
    if(node&&node.matches&&node.matches(".eternaV159FamilyCard"))card=node;
    else if(node&&node.closest)card=node.closest(".eternaV159FamilyCard");
    if(!card&&node&&node.querySelector)card=node.querySelector(".eternaV159FamilyCard");
    if(!card)card=document.querySelector("#cocoApp .eternaV159FamilyCard");
    if(!card)return;
    familyPolishRuns++;
    injectV16082Styles();
    Array.prototype.slice.call(card.children||[]).forEach(function(child){
      if(child.classList&&child.classList.contains("eternaV159Buttons"))child.remove()
    });
    var status=card.querySelector(".eternaV159FamilyStatus");
    if(status&&/^beta\s+de\s+prueba$/i.test(String(status.textContent||"").trim()))status.textContent="Versión beta";
    polishLearningReport(card);
    var modal=card.closest(".cocoFamilyV129")||document.querySelector("#cocoApp .cocoFamilyV129");
    polishGamesReport(modal,card)
  }

  function truthItemValue(item){
    return Array.isArray(item)&&typeof item[1]==="boolean"?item[1]:null
  }

  function mixedTruthFalseOrder(items,key){
    items=Array.isArray(items)?items.slice():[];
    var yes=[],no=[],other=[];
    items.forEach(function(item){var v=truthItemValue(item);if(v===true)yes.push(item);else if(v===false)no.push(item);else other.push(item)});
    if(!yes.length||!no.length)return items;
    var seed="v16082|"+String(key||"")+"|"+items.map(function(x){return Array.isArray(x)?String(x.cocoId||x[0]||""):String(x)}).join("|");
    var rng=root.CocoV134&&typeof root.CocoV134.rngFrom==="function"?root.CocoV134.rngFrom(seed):Math.random;
    function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
    shuffle(yes);shuffle(no);
    var out=[],last=null,run=0;
    while(yes.length||no.length){
      var choose;
      if(run>=2&&last!==null&&((last&&no.length)||(!last&&yes.length)))choose=!last;
      else if(yes.length&&no.length){
        var p=yes.length/(yes.length+no.length);
        choose=rng()<p;
        if(run===1&&choose===last&&rng()<.62)choose=!last
      }else choose=!!yes.length;
      var queue=choose?yes:no;
      if(!queue.length){choose=!choose;queue=choose?yes:no}
      var item=queue.shift();out.push(item);
      if(last===choose)run++;else{last=choose;run=1}
    }
    return out.concat(other)
  }

  function installTrueFalseMixGuard(){
    var api=root.CocoV134;
    if(trueFalseMixInstalled||!api||typeof api.selectStatic!=="function")return false;
    if(api.selectStatic.__cocoV16082TruthMix){trueFalseMixInstalled=true;return true}
    var nativeSelect=api.selectStatic;
    function wrappedSelect(game,mode,difficulty,items,count,options){
      var result=nativeSelect.apply(api,arguments);
      if(normalizeText(game)==="verdadero"&&Array.isArray(result)&&result.some(function(x){return truthItemValue(x)!==null})){
        return mixedTruthFalseOrder(result,String(mode||"")+"|"+String(difficulty||""))
      }
      return result
    }
    wrappedSelect.__cocoV16082TruthMix=true;
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
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}card.dataset.cocoScoringV16082=GENERAL.has(id)?"yes":"no";cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}if((node.matches&&node.matches(".cocoFamilyV129,.eternaV159FamilyCard,.eternaV159FamilyStatus,.eternaV159Buttons,.eternaV160ProgressPanel"))||(node.closest&&node.closest(".cocoFamilyV129"))||(node.querySelector&&node.querySelector(".eternaV159FamilyCard")))polishFamilyRuntime(node)}
  function relevantNode(node){if(!node||node.nodeType!==1)return false;var selector="[data-coco-juego],.cocoGameCard,#retosCard,.retosCard,.cocoFamilyV129,.eternaV159FamilyCard,.eternaV159FamilyStatus,.eternaV159Buttons,.eternaV160ProgressPanel";if(node.matches&&node.matches(selector))return true;if(node.closest&&node.closest(".cocoFamilyV129"))return true;return !!(node.querySelector&&node.querySelector(selector))}

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
      s.src="./eterna-experience-v160.js?v=16081";
      s.async=true;
      s.dataset.cocoModule="eterna-experience-v16081";
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
    if(familyLifecycle.active)polishFamilyRuntime(document.querySelector("#cocoApp .cocoFamilyV129"));
    root.COCO_VERSION="2026-08-26-v160.82-family-reports-game-order"
  }

  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}

  function initial(){
    var app=document.getElementById("cocoApp");
    try{performance.mark("coco_home_visible");performance.measure("coco_boot_to_home","coco_boot_start","coco_home_visible")}catch(e){}
    injectV16082Styles();
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
    scheduleEternaIdle();
    root.COCO_VERSION="2026-08-26-v160.82-family-reports-game-order"
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
        familyPolishRuns:familyPolishRuns
      }
    }
  });
  root.CocoRuntimeStabilityV16076=root.CocoRuntimeStabilityV16076||root.CocoRuntimeStabilityV16077;

  installEternaDemandLoader();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){installDailyCanPlayGuard();initial();observe()},{once:true});
  else{installDailyCanPlayGuard();initial();observe()}
})(window);
