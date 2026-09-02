/* COCO EN FORMA / ETERNA · v160.90.4.1 HOTFIX · UI CONSOLIDADA
 * Base auditada: main@6572d3c9c79d3a5d5ded777194def171578f5731
 *
 * Alcance:
 * 1) Trial ETERNA finalizado -> pantalla directa de planes sin volver al PIN.
 * 2) Verdadero/Falso -> conserva la bolsa antirrepetición y solo reordena la muestra.
 * 3) Safe areas -> Volver/Salir/Cerrar siempre pulsables en vertical.
 * 4) Micrófono -> presentación moderna, circular y consistente.
 * 5) Zona Familiar -> respeta implementación activa; no carga ni reactiva scripts históricos.
 * 6) Escuchar -> observador idempotente, sin bucle al mostrar la respuesta.
 * 7) Inicio vertical -> safe area inmediata y cabecera compacta sin giro previo.
 *
 * NO toca Worker ETERNA, Supabase schema, Stripe backend, Safety, School Scope,
 * atribución, puntuaciones, rankings, límites diarios ni memoria pedagógica.
 */
(function(root){
  "use strict";
  if(root.__COCO_PRODUCT_UX_160903__)return;
  root.__COCO_PRODUCT_UX_160903__=true;

  var VERSION="160.90.4.1-hotfix-observer-layout";
  var subscriptionCache={at:0,value:null,session:null,promise:null};
  var FAMILY_RETRY=[80,260,700,1400];
  var ETERNA_RETRY=[0,60,220,650,1200,2200];
  var tts1609033={seq:0,state:"idle",button:null,audio:null,url:"",abort:null,utterance:null};

  function cfg(){return root.COCO_CONFIG||{}}
  function endpoint(path){
    var base=String(cfg().eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");
    return base?base+(p.charAt(0)==="/"?p:"/"+p):""
  }
  function clean(v){return String(v==null?"":v).trim()}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}

  function client(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var c=cfg();
    if(!root.supabase||!root.supabase.createClient||!c.url||!c.clave)return null;
    try{
      root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(
        String(c.url).replace(/\/+$/,""),
        String(c.clave).trim(),
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
      );
      return root.__COCO_SUPABASE_CLIENT
    }catch(e){return null}
  }

  async function currentSession(){
    var cli=client();if(!cli||!cli.auth||typeof cli.auth.getSession!=="function")return null;
    try{var r=await cli.auth.getSession();return r&&r.data?r.data.session:null}catch(e){return null}
  }

  function tester(session){
    if(!session||!session.user)return false;
    var email=String(session.user.email||"").toLowerCase();
    var list=Array.isArray(cfg().cuentasPruebaIlimitadas)?cfg().cuentasPruebaIlimitadas:[];
    return list.some(function(x){return String(x||"").toLowerCase()===email})
  }

  function trialExpired(sub,session){
    if(tester(session))return false;
    var s=sub||{},status=String(s.status||"").toLowerCase(),plan=String(s.plan||"").toLowerCase();
    var end=s.trial_end?new Date(s.trial_end).getTime():NaN;
    if(status==="active")return false;
    if(status==="expired"&&(plan==="trial"||isFinite(end)))return true;
    if((status==="trialing"||plan==="trial")&&isFinite(end)&&end<=Date.now())return true;
    return false
  }

  async function readSubscription(force){
    var now=Date.now();
    if(!force&&subscriptionCache.value&&now-subscriptionCache.at<10000)return subscriptionCache;
    if(subscriptionCache.promise&&!force)return subscriptionCache.promise;
    subscriptionCache.promise=(async function(){
      var session=await currentSession();
      if(!session||!session.user){
        subscriptionCache={at:Date.now(),value:null,session:null,promise:null};
        return subscriptionCache
      }
      var cli=client(),sub=null;
      try{
        var r=await cli.from("eterna_subscriptions").select("*").eq("user_id",session.user.id).maybeSingle();
        if(!r.error)sub=r.data||null
      }catch(e){}
      subscriptionCache={at:Date.now(),value:sub,session:session,promise:null};
      return subscriptionCache
    })();
    return subscriptionCache.promise
  }

  async function checkout(plan,button){
    var original=button&&button.textContent||"Continuar";
    if(button){button.disabled=true;button.textContent="Abriendo pago…"}
    try{
      var session=await currentSession(),url=endpoint("/v1/checkout");
      if(!session||!session.access_token||!url)throw new Error("checkout_unavailable");
      var r=await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},
        body:JSON.stringify({plan:plan})
      });
      if(r.status===401){
        session=await currentSession();
        if(!session||!session.access_token)throw new Error("session");
        r=await fetch(url,{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},
          body:JSON.stringify({plan:plan})
        })
      }
      var data={};try{data=await r.json()}catch(e){}
      if(!r.ok||!data.url)throw new Error(data.error||"checkout");
      root.location.href=data.url
    }catch(e){
      alert("No se pudo abrir la pasarela de pago. Inténtalo de nuevo.");
      if(button){button.disabled=false;button.textContent=original}
    }
  }

  function closeEterna(){
    try{
      if(root.CocoEternaV160&&typeof root.CocoEternaV160.close==="function"){root.CocoEternaV160.close();return}
      var b=document.querySelector("#eternaOverlayV159 .eternaV159Close");if(b)b.click()
    }catch(e){}
  }

  function expiredGateHtml(){
    return '<section class="coco160903TrialEnded" data-coco-trial-ended="1" aria-labelledby="coco160903TrialTitle">'+
      '<span class="coco160903TrialEyebrow">ETERNA · PRUEBA FINALIZADA</span>'+
      '<h3 id="coco160903TrialTitle">Tus 7 días de prueba de ETERNA han terminado.</h3>'+
      '<p class="coco160903TrialLead"><b>No se te ha cobrado nada.</b> La prueba empezó sin tarjeta y no se ha activado ninguna suscripción automáticamente. Si quieres continuar con ETERNA, elige un plan.</p>'+
      '<div class="coco160903TrialGrid">'+
        '<article class="coco160903TrialPlan"><b>Plan mensual</b><strong>7,99 € <small>/mes</small></strong><span>Continúa mes a mes.</span><button type="button" data-coco-expired-month>Continuar con mensual</button></article>'+
        '<article class="coco160903TrialPlan annual"><small>MEJOR PRECIO</small><b>Plan anual</b><strong>79,99 € <small>/año</small></strong><span>12 meses de acceso a ETERNA.</span><button type="button" data-coco-expired-year>Continuar con anual</button></article>'+
      '</div>'+
      '<p class="coco160903TrialFree">Coco en Forma sigue siendo gratis y sin publicidad.</p>'+
      '<div class="coco160903TrialActions"><button type="button" data-coco-expired-close>Seguir usando Coco en Forma</button></div>'+
    '</section>'
  }

  async function enforceExpiredEterna(force){
    var overlay=document.getElementById("eternaOverlayV159");
    if(!overlay)return false;
    var info=await readSubscription(Boolean(force));
    if(!trialExpired(info.value,info.session))return false;
    var chat=overlay.querySelector("[data-et-chat]"),composer=overlay.querySelector("[data-et-composer]");
    if(!chat)return false;
    if(composer)composer.style.display="none";
    if(!chat.querySelector("[data-coco-trial-ended]"))chat.innerHTML=expiredGateHtml();
    var month=chat.querySelector("[data-coco-expired-month]"),year=chat.querySelector("[data-coco-expired-year]"),close=chat.querySelector("[data-coco-expired-close]");
    if(month&&!month.dataset.bound160903){month.dataset.bound160903="1";month.onclick=function(){checkout("monthly",month)}}
    if(year&&!year.dataset.bound160903){year.dataset.bound160903="1";year.onclick=function(){checkout("annual",year)}}
    if(close&&!close.dataset.bound160903){close.dataset.bound160903="1";close.onclick=closeEterna}
    var status=overlay.querySelector("[data-et-status]");
    if(status){status.textContent="Prueba gratuita finalizada";status.classList.remove("ok");status.classList.add("warn")}
    return true
  }

  function patchExpiredFamilyCard(){
    var card=document.querySelector("#cocoApp .eternaV159FamilyCard,.eternaV159FamilyCard");
    if(!card)return false;
    var trial=card.querySelector("[data-et-trial]");
    if(trial)trial.remove();
    var status=card.querySelector(".eternaV159FamilyStatus");
    if(status){status.textContent="prueba finalizada";status.classList.remove("active")}
    var block=card.querySelector(".eternaV160TrialActive");
    if(block)block.innerHTML="<b>✓ Tus 7 días de prueba han terminado</b><span>No se te ha cobrado nada automáticamente. Elige un plan para continuar con ETERNA.</span>";
    var head=card.querySelector(".eternaV160UpgradeHead");
    if(head){
      var b=head.querySelector("b"),s=head.querySelector("span");
      if(b)b.textContent="Continúa con ETERNA";
      if(s)s.textContent="Tu prueba gratuita ha terminado. Elige mensual o anual para recuperar el acceso."
    }
    card.dataset.cocoExpiredTrial160903="1";
    return true
  }

  async function enforceExpiredFamily(force){
    var info=await readSubscription(Boolean(force));
    if(!trialExpired(info.value,info.session))return false;
    return patchExpiredFamilyCard()
  }

  function scheduleFamilyCheck(){
    FAMILY_RETRY.forEach(function(ms){setTimeout(function(){enforceExpiredFamily(ms>600)},ms)})
  }

  function micIconMarkup1609032(extraClass){
    return '<svg class="eternaV160MicSvg '+String(extraClass||'')+'" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'+
      '<path d="M12 14.75a3.75 3.75 0 0 0 3.75-3.75V7a3.75 3.75 0 1 0-7.5 0v4A3.75 3.75 0 0 0 12 14.75Z"/>'+
      '<path d="M6.5 11a5.5 5.5 0 0 0 11 0"/>'+
      '<path d="M12 16.5V20"/>'+
      '<path d="M9.5 20h5"/>'+
    '</svg>'
  }

  function normalizePrimaryMic1609032(){
    var o=document.getElementById("eternaOverlayV159");
    if(!o)return false;
    var mic=o.querySelector("[data-et-mic]");
    if(!mic)return false;
    /* Durante grabación manda la propia capa de voz; no interferimos. */
    if(mic.classList.contains("recording"))return true;
    if(!mic.querySelector(".eternaV160MicSvg"))mic.innerHTML=micIconMarkup1609032("coco1609032PrimaryMicSvg");
    mic.setAttribute("aria-label","Usar micrófono");
    mic.setAttribute("title","Hablar con Eterna");
    mic.dataset.cocoMicUi="1609032";
    return true
  }

  function normalizeVoiceActionCards1609032(){
    var o=document.getElementById("eternaOverlayV159");
    if(!o)return false;
    var found=false;
    o.querySelectorAll('[data-et-startaction="voice"] strong').forEach(function(strong){
      found=true;
      var label=String(strong.textContent||"")
        .replace(/[\uD83C\uDF99\uFE0F\uD83C\uDFA4]/g,"")
        .replace(/\s+/g," ")
        .trim();
      if(!label)return;
      var current=strong.querySelector(".coco1609032VoiceActionLabel");
      if(current&&current.textContent===label&&strong.querySelector(".coco1609032VoiceActionIcon"))return;

      while(strong.firstChild)strong.removeChild(strong.firstChild);
      var icon=document.createElement("span");
      icon.className="coco1609032VoiceActionIcon";
      icon.setAttribute("aria-hidden","true");
      icon.innerHTML=micIconMarkup1609032("coco1609032VoiceActionSvg");

      var text=document.createElement("span");
      text.className="coco1609032VoiceActionLabel";
      text.textContent=label;

      strong.appendChild(icon);
      strong.appendChild(text);
      strong.dataset.cocoVoiceActionUi="1609032"
    });
    return found
  }

  function normalizeVoiceUi1609032(){
    normalizePrimaryMic1609032();
    normalizeVoiceActionCards1609032()
  }

  function scheduleVoiceUi1609032(){
    [0,40,120,300,700].forEach(function(ms){
      setTimeout(normalizeVoiceUi1609032,ms)
    })
  }

  function scheduleEternaCheck(){
    ETERNA_RETRY.forEach(function(ms){
      setTimeout(function(){
        normalizeVoiceUi1609032();
        enforceExpiredEterna(ms>500)
      },ms)
    })
  }

  /* ---------------- TTS: Escuchar como toggle real ---------------- */

  function listenIcon1609033(kind){
    if(kind==="loading")return '<span class="coco1609033TtsSpinner" aria-hidden="true"></span>';
    if(kind==="playing")return '<svg class="coco1609033TtsIcon" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.5"></rect></svg>';
    return '<svg class="coco1609033TtsIcon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4.8 15 10 7 15.2Z"></path></svg>'
  }

  function renderListenState1609033(button,state){
    if(!button)return;
    button.classList.remove("coco1609033TtsLoading","coco1609033TtsPlaying");
    if(state==="loading"){
      button.classList.add("coco1609033TtsLoading");
      button.innerHTML=listenIcon1609033("loading")+'<span>Preparando…</span>';
      button.setAttribute("aria-label","Preparando audio. Toca para cancelar");
      button.setAttribute("title","Toca para cancelar")
    }else if(state==="playing"){
      button.classList.add("coco1609033TtsPlaying");
      button.innerHTML=listenIcon1609033("playing")+'<span>Detener</span>';
      button.setAttribute("aria-label","Detener audio");
      button.setAttribute("title","Detener")
    }else{
      button.innerHTML=listenIcon1609033("idle")+'<span>Escuchar</span>';
      button.setAttribute("aria-label","Escuchar respuesta");
      button.setAttribute("title","Escuchar")
    }
    button.dataset.cocoTtsState=state||"idle"
  }

  function cleanListenButtons1609033(){
    var o=document.getElementById("eternaOverlayV159");
    if(!o)return;
    o.querySelectorAll("[data-et-listen]").forEach(function(button){
      if(button===tts1609033.button&&tts1609033.state!=="idle")return;
      if(button.dataset.cocoTtsState!=="idle")renderListenState1609033(button,"idle")
    })
  }

  function releaseTtsUrl1609033(){
    if(tts1609033.url){
      try{URL.revokeObjectURL(tts1609033.url)}catch(e){}
      tts1609033.url=""
    }
  }

  function stopTts1609033(reason){
    tts1609033.seq++;
    var button=tts1609033.button;
    if(tts1609033.abort){
      try{tts1609033.abort.abort()}catch(e){}
      tts1609033.abort=null
    }
    if(tts1609033.audio){
      try{
        tts1609033.audio.onended=null;
        tts1609033.audio.onerror=null;
        tts1609033.audio.onplaying=null;
        tts1609033.audio.pause();
        tts1609033.audio.currentTime=0
      }catch(e){}
      tts1609033.audio=null
    }
    try{if(root.speechSynthesis)root.speechSynthesis.cancel()}catch(e){}
    tts1609033.utterance=null;
    releaseTtsUrl1609033();
    tts1609033.state="idle";
    tts1609033.button=null;
    if(button)renderListenState1609033(button,"idle");
    return reason||"stopped"
  }

  function textForListenButton1609033(button){
    var node=button&&button.closest?button.closest(".eternaV159Quick"):null;
    while(node){
      node=node.previousElementSibling;
      if(!node)break;
      if(node.classList&&node.classList.contains("eternaV159Msg")&&node.classList.contains("assistant")){
        var bubble=node.querySelector(".eternaV159Bubble");
        if(!bubble)return "";
        var clone=bubble.cloneNode(true);
        clone.querySelectorAll(".eternaV159Meta").forEach(function(x){x.remove()});
        return String(clone.textContent||"").replace(/\s+/g," ").trim()
      }
    }
    return ""
  }

  async function fetchTtsBlob1609033(text,signal){
    var url=endpoint("/v1/speak");
    if(!url)throw new Error("tts_endpoint");
    var session=await currentSession();
    if(signal&&signal.aborted)throw new DOMException("Aborted","AbortError");
    var headers={"Content-Type":"application/json"};
    if(session&&session.access_token)headers.Authorization="Bearer "+session.access_token;
    var options={
      method:"POST",
      headers:headers,
      body:JSON.stringify({text:String(text||"").slice(0,1800)})
    };
    if(signal)options.signal=signal;
    var r=await fetch(url,options);
    if(r.status===401){
      var cli=client();
      try{if(cli&&cli.auth&&typeof cli.auth.refreshSession==="function")await cli.auth.refreshSession()}catch(e){}
      session=await currentSession();
      if(signal&&signal.aborted)throw new DOMException("Aborted","AbortError");
      headers={"Content-Type":"application/json"};
      if(session&&session.access_token)headers.Authorization="Bearer "+session.access_token;
      options.headers=headers;
      r=await fetch(url,options)
    }
    if(!r.ok)throw new Error("tts_http_"+r.status);
    return r.blob()
  }

  function finishTts1609033(seq){
    if(seq!==tts1609033.seq)return;
    var button=tts1609033.button;
    tts1609033.audio=null;
    tts1609033.utterance=null;
    releaseTtsUrl1609033();
    tts1609033.state="idle";
    tts1609033.button=null;
    if(button)renderListenState1609033(button,"idle")
  }

  function fallbackSpeech1609033(text,button,seq){
    if(seq!==tts1609033.seq||tts1609033.state!=="loading")return;
    if(!root.speechSynthesis||typeof root.SpeechSynthesisUtterance==="undefined"){
      finishTts1609033(seq);return
    }
    try{
      var u=new SpeechSynthesisUtterance(String(text||""));
      u.lang="es-ES";
      u.rate=1;
      tts1609033.utterance=u;
      u.onstart=function(){
        if(seq!==tts1609033.seq)return;
        tts1609033.state="playing";
        renderListenState1609033(button,"playing")
      };
      u.onend=function(){finishTts1609033(seq)};
      u.onerror=function(){finishTts1609033(seq)};
      root.speechSynthesis.speak(u)
    }catch(e){finishTts1609033(seq)}
  }

  async function startTts1609033(button,text){
    if(!button||!text)return;
    stopTts1609033("switch");
    var seq=++tts1609033.seq;
    tts1609033.button=button;
    tts1609033.state="loading";
    tts1609033.abort=typeof AbortController!=="undefined"?new AbortController():null;
    renderListenState1609033(button,"loading");
    try{
      var blob=await fetchTtsBlob1609033(text,tts1609033.abort&&tts1609033.abort.signal);
      if(seq!==tts1609033.seq||tts1609033.state!=="loading")return;
      releaseTtsUrl1609033();
      tts1609033.url=URL.createObjectURL(blob);
      var audio=new Audio(tts1609033.url);
      audio.playbackRate=1;
      tts1609033.audio=audio;
      audio.onplaying=function(){
        if(seq!==tts1609033.seq)return;
        tts1609033.state="playing";
        renderListenState1609033(button,"playing")
      };
      audio.onended=function(){finishTts1609033(seq)};
      audio.onerror=function(){
        if(seq!==tts1609033.seq)return;
        tts1609033.audio=null;
        releaseTtsUrl1609033();
        fallbackSpeech1609033(text,button,seq)
      };
      await audio.play()
    }catch(e){
      if(seq!==tts1609033.seq)return;
      if(e&&e.name==="AbortError")return;
      tts1609033.abort=null;
      fallbackSpeech1609033(text,button,seq)
    }
  }

  function toggleTts1609033(button){
    if(!button)return;
    if(tts1609033.button===button&&(tts1609033.state==="loading"||tts1609033.state==="playing")){
      stopTts1609033("manual");
      return
    }
    var text=textForListenButton1609033(button);
    if(text)startTts1609033(button,text)
  }

  function installListenToggle1609033(){
    if(document.documentElement.dataset.cocoListenToggle1609033==="1")return;
    document.documentElement.dataset.cocoListenToggle1609033="1";

    document.addEventListener("click",function(event){
      var listen=event.target&&event.target.closest?event.target.closest("#eternaOverlayV159 [data-et-listen]"):null;
      if(listen){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toggleTts1609033(listen);
        return
      }

      var stopOn=event.target&&event.target.closest?event.target.closest(
        "#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 .eternaV159Close,#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice],#eternaOverlayV159 [data-et-hint],#eternaOverlayV159 [data-et-understood]"
      ):null;
      if(stopOn&&(tts1609033.state==="loading"||tts1609033.state==="playing"))stopTts1609033("navigation")
    },true)
  }

  /* ---------------- V/F: no repetir por re-muestreo ---------------- */

  function truthValue(item){
    if(Array.isArray(item)&&typeof item[1]==="boolean")return item[1];
    if(item&&typeof item.correct==="boolean")return item.correct;
    if(item&&typeof item.answer==="boolean")return item.answer;
    if(item&&typeof item.value==="boolean")return item.value;
    return null
  }

  function reorderTruth(list){
    if(!Array.isArray(list)||list.length<2)return list;
    var yes=[],no=[],other=[];
    list.forEach(function(x){var v=truthValue(x);if(v===true)yes.push(x);else if(v===false)no.push(x);else other.push(x)});
    var out=[],takeYes=yes.length>=no.length;
    while(yes.length||no.length){
      if(takeYes&&yes.length)out.push(yes.shift());
      else if(!takeYes&&no.length)out.push(no.shift());
      else if(yes.length)out.push(yes.shift());
      else if(no.length)out.push(no.shift());
      takeYes=!takeYes
    }
    return out.concat(other)
  }

  function installTruthAntiRepeat(){
    var rotation=root.CocoRotationV134,staticApi=root.CocoV134;
    if(rotation&&typeof rotation.choose==="function"&&!rotation.choose.__coco160903AntiRepeat){
      var currentChoose=rotation.choose,nativeChoose=currentChoose.__cocoNative||currentChoose;
      function choose160903(config){
        var c=config||{};
        if(String(c.game||"").toLowerCase()!=="verdadero")return currentChoose.apply(rotation,arguments);
        var next=Object.assign({},c),oldAnswer=c.getAnswer;
        next.getAnswer=function(item,index){
          var v=truthValue(item);
          return v===null?(typeof oldAnswer==="function"?oldAnswer(item,index):""):(v?"V":"F")
        };
        return reorderTruth(nativeChoose.call(rotation,next))
      }
      choose160903.__coco160903AntiRepeat=true;
      choose160903.__cocoNative=nativeChoose;
      try{rotation.choose=choose160903}catch(e){}
    }

    if(staticApi&&typeof staticApi.selectStatic==="function"&&!staticApi.selectStatic.__coco160903AntiRepeat){
      var currentSelect=staticApi.selectStatic,nativeSelect=currentSelect.__cocoNative||currentSelect;
      function select160903(game,mode,difficulty,items,count,options){
        if(String(game||"").toLowerCase()!=="verdadero")return currentSelect.apply(staticApi,arguments);
        return reorderTruth(nativeSelect.apply(staticApi,arguments))
      }
      select160903.__coco160903AntiRepeat=true;
      select160903.__cocoNative=nativeSelect;
      try{staticApi.selectStatic=select160903}catch(e){}
    }
  }

  /* ---------------- UI: safe areas + mic moderno ---------------- */

  function injectStyles(){
    if(document.getElementById("coco-product-ux-160903-css"))return;
    var style=document.createElement("style");style.id="coco-product-ux-160903-css";
    style.textContent=[
      "html,body{--coco-safe-top:env(safe-area-inset-top,0px);--coco-safe-right:env(safe-area-inset-right,0px);--coco-safe-bottom:env(safe-area-inset-bottom,0px);--coco-safe-left:env(safe-area-inset-left,0px)}",
      ".cocoV144Modal{box-sizing:border-box!important;padding-top:max(12px,var(--coco-safe-top))!important;padding-right:max(12px,var(--coco-safe-right))!important;padding-bottom:max(12px,var(--coco-safe-bottom))!important;padding-left:max(12px,var(--coco-safe-left))!important}",
      ".cocoV144Modal .cocoV144Shell{max-width:100%!important;max-height:100%!important;min-height:0!important}",
      ".cocoV144Modal .cocoV144HeaderActions button{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}",
      "#cocoApp .barraVolver{box-sizing:border-box!important;max-width:100%!important;min-width:0!important;flex-wrap:wrap!important;padding-left:max(12px,var(--coco-safe-left))!important;padding-right:max(12px,var(--coco-safe-right))!important}",
      "#cocoApp .barraVolver button,#cocoApp .barraVolver a,#cocoApp .barraVolver [role='button']{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}",
      "#cocoApp .cocoFamilyV129>header{box-sizing:border-box!important;padding-top:max(12px,var(--coco-safe-top))!important;padding-left:max(12px,var(--coco-safe-left))!important;padding-right:max(12px,var(--coco-safe-right))!important}",
      "#cocoApp .cocoFamilyV129 [data-family-close],#cocoApp .cocoFamilyV129 button[aria-label='Cerrar']{min-width:44px!important;min-height:44px!important;flex:0 0 44px!important;touch-action:manipulation!important}",
      "#cocoApp .cocoFamilyV129 .cocoFamilyV129Body,#cocoApp .cocoFamilyV129 .cocoFamilyBody{box-sizing:border-box!important;padding-bottom:max(18px,calc(var(--coco-safe-bottom) + 10px))!important}",
      "#eternaOverlayV159 .eternaV159Top{box-sizing:border-box!important;padding-left:max(16px,calc(var(--coco-safe-left) + 8px))!important;padding-right:max(16px,calc(var(--coco-safe-right) + 8px))!important}",
      "#eternaOverlayV159 .eternaV159Close{min-width:44px!important;min-height:44px!important;flex:0 0 44px!important;touch-action:manipulation!important}",
      "#eternaOverlayV159 .eternaV159Composer{box-sizing:border-box!important;padding-left:max(12px,calc(var(--coco-safe-left) + 8px))!important;padding-right:max(12px,calc(var(--coco-safe-right) + 8px))!important;padding-bottom:max(10px,calc(var(--coco-safe-bottom) + 8px))!important}",
      "#eternaOverlayV159 .eternaV160ModePanel{box-sizing:border-box!important;padding-left:max(14px,calc(var(--coco-safe-left) + 8px))!important;padding-right:max(14px,calc(var(--coco-safe-right) + 8px))!important;padding-bottom:max(14px,calc(var(--coco-safe-bottom) + 10px))!important}",

      "html body #eternaOverlayV159 [data-et-mic]{position:relative!important;display:grid!important;place-items:center!important;min-width:48px!important;width:48px!important;height:48px!important;flex:0 0 48px!important;padding:0!important;border:1px solid #d8e1e6!important;border-radius:50%!important;background:#fff!important;color:#253746!important;box-shadow:0 1px 2px rgba(22,54,72,.10),0 3px 10px rgba(22,54,72,.06)!important;transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease,color .16s ease!important;touch-action:manipulation!important}",
      "html body #eternaOverlayV159 [data-et-mic]:hover{transform:translateY(-1px)!important;background:#f4f7f8!important;border-color:#c7d3d9!important;color:#162833!important;box-shadow:0 2px 4px rgba(22,54,72,.10),0 5px 14px rgba(22,54,72,.07)!important}",
      "html body #eternaOverlayV159 [data-et-mic]:focus-visible{outline:3px solid rgba(42,167,216,.24)!important;outline-offset:3px!important}",
      "html body #eternaOverlayV159 [data-et-mic].recording{background:#fff8f2!important;border-color:#ef9d5d!important;color:#df6410!important;box-shadow:0 0 0 5px rgba(239,108,5,.09),0 2px 8px rgba(139,72,24,.10)!important}",
      "html body #eternaOverlayV159 [data-et-mic].recording::after{content:''!important;position:absolute!important;inset:-4px!important;border-radius:50%!important;border:1.8px solid rgba(232,111,24,.30)!important;animation:eternaMicPulse16057 1.3s infinite ease-out!important;pointer-events:none!important}",
      "#eternaOverlayV159 .eternaV160StartAction[data-et-startaction='voice'] strong{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;line-height:1.2!important}",
      "#eternaOverlayV159 .coco1609032VoiceActionIcon{display:inline-grid!important;place-items:center!important;width:24px!important;height:24px!important;flex:0 0 24px!important;color:#253746!important}",
      "#eternaOverlayV159 .coco1609032VoiceActionIcon .eternaV160MicSvg{display:block!important;width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important;overflow:visible!important}",
      "#eternaOverlayV159 .coco1609032VoiceActionIcon .eternaV160MicSvg *{fill:none!important;stroke:currentColor!important;vector-effect:non-scaling-stroke!important}",
      "#eternaOverlayV159 .coco1609032VoiceActionLabel{display:inline!important}",
      "#eternaOverlayV159 [data-et-listen]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-width:112px!important;min-height:42px!important;transition:background .16s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease!important;touch-action:manipulation!important}",
      "#eternaOverlayV159 [data-et-listen] .coco1609033TtsIcon{width:16px!important;height:16px!important;fill:currentColor!important;flex:0 0 16px!important}",
      "#eternaOverlayV159 [data-et-listen].coco1609033TtsPlaying{background:#173f59!important;border-color:#173f59!important;color:#fff!important;box-shadow:0 2px 0 rgba(9,38,55,.18)!important}",
      "#eternaOverlayV159 [data-et-listen].coco1609033TtsLoading{background:#f2f8fb!important;border-color:#b9dce9!important;color:#315d73!important}",
      "#eternaOverlayV159 .coco1609033TtsSpinner{display:inline-block!important;width:15px!important;height:15px!important;flex:0 0 15px!important;border:2px solid rgba(49,93,115,.22)!important;border-top-color:#315d73!important;border-radius:50%!important;animation:cocoTtsSpin1609033 .75s linear infinite!important}",
      "@keyframes cocoTtsSpin1609033{to{transform:rotate(360deg)}}",
      "@media(max-width:760px){html body #eternaOverlayV159 [data-et-mic]{min-width:52px!important;width:52px!important;height:52px!important;flex-basis:52px!important;border-radius:50%!important}#eternaOverlayV159 .coco1609032VoiceActionIcon{width:26px!important;height:26px!important;flex-basis:26px!important}#eternaOverlayV159 .coco1609032VoiceActionIcon .eternaV160MicSvg{width:24px!important;height:24px!important}#eternaOverlayV159 [data-et-listen]{min-width:118px!important;min-height:44px!important}}",

      "#eternaOverlayV159 .coco160903TrialEnded{max-width:760px;margin:22px auto;padding:22px;border:1px solid #cfe4ee;border-radius:22px;background:linear-gradient(145deg,#fbfdff,#f2f9fd 64%,#fff8ef);box-shadow:0 8px 26px rgba(23,63,89,.09);color:#173f59}",
      "#eternaOverlayV159 .coco160903TrialEyebrow{display:inline-flex;margin-bottom:9px;padding:5px 9px;border-radius:999px;background:#173f59;color:#fff;font-size:9px;font-weight:950;letter-spacing:.07em}",
      "#eternaOverlayV159 .coco160903TrialEnded h3{margin:0;color:#173f59;font-size:clamp(24px,4vw,34px);line-height:1.05}",
      "#eternaOverlayV159 .coco160903TrialLead{margin:10px 0 0;color:#607987;font-size:12px;font-weight:750;line-height:1.5}",
      "#eternaOverlayV159 .coco160903TrialGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:17px 0 12px}",
      "#eternaOverlayV159 .coco160903TrialPlan{padding:15px;border:1px solid #cfe3ec;border-radius:16px;background:#fff;box-shadow:0 2px 0 #e0edf3}",
      "#eternaOverlayV159 .coco160903TrialPlan.annual{border:2px solid #64cdb7;background:linear-gradient(180deg,#fff,#f4fffb)}",
      "#eternaOverlayV159 .coco160903TrialPlan>b{display:block;margin-top:5px;color:#173f59;font-size:14px}",
      "#eternaOverlayV159 .coco160903TrialPlan>strong{display:block;margin:5px 0;color:#173f59;font-size:24px}",
      "#eternaOverlayV159 .coco160903TrialPlan>span{display:block;min-height:28px;color:#6c818d;font-size:9.5px;font-weight:750;line-height:1.4}",
      "#eternaOverlayV159 .coco160903TrialPlan button{width:100%;min-height:48px;margin-top:11px;padding:9px 12px;border:0;border-radius:12px;background:#ef6c05;color:#fff;font:950 11px inherit;cursor:pointer;box-shadow:0 3px 0 #bd5205;touch-action:manipulation}",
      "#eternaOverlayV159 .coco160903TrialFree{margin:11px 0 0;padding:10px 12px;border-radius:13px;background:#eef9fd;color:#315f74;font-size:10px;font-weight:850;line-height:1.4}",
      "#eternaOverlayV159 .coco160903TrialActions{display:flex;justify-content:center;margin-top:13px}",
      "#eternaOverlayV159 .coco160903TrialActions button{min-height:44px;padding:8px 13px;border:1px solid #c7e2ed;border-radius:12px;background:#fff;color:#315f74;font:900 10.5px inherit;cursor:pointer;touch-action:manipulation}",
      ".coco160904FamilyLoading{position:fixed;inset:0;z-index:2147483200;display:grid;place-items:start center;padding:max(96px,calc(var(--coco-safe-top) + 58px)) 18px max(26px,calc(var(--coco-safe-bottom) + 18px));background:linear-gradient(180deg,#f8fcfe,#fff);color:#315d73;text-align:center;box-sizing:border-box;pointer-events:none}",
      ".coco160904FamilyLoadingCard{width:min(520px,calc(100vw - 32px));margin-top:18px;padding:22px 18px;border:1px solid #cfe4ed;border-radius:20px;background:#fff;box-shadow:0 10px 28px rgba(23,63,89,.10)}",
      ".coco160904FamilyLoadingCard b{display:block;color:#173f59;font-size:18px;line-height:1.15}.coco160904FamilyLoadingCard span{display:block;margin-top:7px;color:#6b818e;font-size:11px;font-weight:750}",
      ".coco160904FamilySpinner{display:block;width:26px;height:26px;margin:0 auto 13px;border:3px solid #d9edf5;border-top-color:#2fa9dc;border-radius:50%;animation:cocoFamilySpin160904 .8s linear infinite}",
      "@keyframes cocoFamilySpin160904{to{transform:rotate(360deg)}}",
      ".coco160904ExitSafe{min-width:48px!important;min-height:48px!important;touch-action:manipulation!important}",
      "@media(max-width:820px){html body #cocoApp.cocoVistaJugador{padding-top:max(7px,env(safe-area-inset-top))!important}html body #cocoApp.cocoVistaJugador>#cocoInstallEntryV158{margin:0 auto 12px!important}html body #cocoApp.cocoVistaJugador>.cabecera{height:auto!important;min-height:0!important;margin:0 0 14px!important;padding:0!important;align-items:center!important}html body #cocoApp.cocoVistaJugador>.cabecera>.fin{min-height:0!important;margin-left:auto!important;padding:0!important;align-items:center!important}html body #cocoApp.cocoVistaJugador>.cabecera>.fin>.btn{position:static!important;inset:auto!important;margin:0!important;min-width:48px!important;min-height:48px!important}}",
      "#eternaOverlayV159[data-coco-exam-mode='1'] [data-et-understood]{display:none!important}",
      "#eternaOverlayV159[data-coco-exam-mode='1'] [data-et-listen]{min-width:118px!important}",
      "@media(prefers-reduced-motion:reduce){.coco160904FamilySpinner{animation:none!important}}",
      "@media(max-width:640px){#eternaOverlayV159 .coco160903TrialEnded{margin:12px 10px;padding:16px}#eternaOverlayV159 .coco160903TrialGrid{grid-template-columns:1fr}#eternaOverlayV159 .coco160903TrialPlan>span{min-height:0}}"
    ].join("");
    document.head.appendChild(style)
  }

  /* ---------------- v160.90.4 · pulido final multidispositivo ---------------- */

  var familyMask160904=null,familyMaskTimer160904=0,familyMaskObserver160904=null;
  var finalChatObserver160904=null,finalObservedChat160904=null;

  function normalizedUiText160904(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}

  function findInteractiveByText160904(pattern){
    var all=document.querySelectorAll("#cocoApp button,#cocoApp a,#cocoApp [role='button']");
    for(var i=0;i<all.length;i++){
      var text=normalizedUiText160904(all[i].textContent);
      if(pattern.test(text))return all[i]
    }
    return null
  }

  function protectTopExit160904(){
    var exit=findInteractiveByText160904(/^salir$/i);
    if(!exit)return false;
    exit.classList.add("coco160904ExitSafe");
    exit.style.setProperty("min-width","48px","important");
    exit.style.setProperty("min-height","48px","important");
    exit.style.setProperty("position","static","important");
    exit.style.setProperty("inset","auto","important");
    exit.style.setProperty("margin","0","important");
    var header=exit.closest&&exit.closest(".cabecera"),row=exit.closest&&exit.closest(".fin");
    if(header&&header.parentElement&&header.parentElement.id==="cocoApp"){
      header.style.setProperty("height","auto","important");
      header.style.setProperty("min-height","0","important");
      header.style.setProperty("margin-top","0","important");
      header.style.setProperty("padding","0","important");
      header.dataset.cocoTopSafe160904="1"
    }
    if(row)row.style.setProperty("padding","0","important");
    return true
  }

  function scheduleTopExit160904(){[0,80,240,700,1500,3000,6000].forEach(function(ms){setTimeout(protectTopExit160904,ms)})}

  function familyModernReady160904(modal){
    if(!modal)return false;
    if(modal.querySelector(".cocoV16083ReportCore,[data-family-integral-report],.cocoV16083InlineActions"))return true;
    var t=normalizedUiText160904(modal.textContent);
    return /Acceso y planes/i.test(t)&&/Informe integral de progreso/i.test(t)
  }

  function familyPinScreen160904(modal){
    if(!modal)return false;
    var t=normalizedUiText160904(modal.textContent);
    return /(?:introduce|crea|nuevo)\s+(?:tu\s+)?PIN|PIN familiar de cuatro cifras|Guardar nuevo PIN/i.test(t)
  }

  function removeFamilyMask160904(){
    if(familyMaskTimer160904){clearTimeout(familyMaskTimer160904);familyMaskTimer160904=0}
    if(familyMaskObserver160904){try{familyMaskObserver160904.disconnect()}catch(e){}familyMaskObserver160904=null}
    if(familyMask160904&&familyMask160904.parentNode)familyMask160904.parentNode.removeChild(familyMask160904);
    familyMask160904=null
  }

  function ensureFamilyMask160904(){
    var modal=document.querySelector("#cocoApp .cocoFamilyV129,.cocoFamilyV129");
    if(!modal){removeFamilyMask160904();return false}
    if(familyPinScreen160904(modal)){removeFamilyMask160904();return false}
    if(familyModernReady160904(modal)){removeFamilyMask160904();return true}
    var t=normalizedUiText160904(modal.textContent);
    if(!/Mapa de fortalezas|Perfil cognitivo|puntos de clasificación|Fortalezas cognitivas/i.test(t))return false;

    if(!familyMask160904){
      var mask=document.createElement("div");
      mask.className="coco160904FamilyLoading";
      mask.innerHTML='<div class="coco160904FamilyLoadingCard"><i class="coco160904FamilySpinner" aria-hidden="true"></i><b>Preparando Zona Familiar…</b><span>Cargando acceso, planes y el informe actualizado.</span></div>';
      document.body.appendChild(mask);
      familyMask160904=mask;
      familyMaskTimer160904=setTimeout(removeFamilyMask160904,6500)
    }

    if(!familyMaskObserver160904&&typeof MutationObserver==="function"){
      familyMaskObserver160904=new MutationObserver(function(){
        var current=document.querySelector("#cocoApp .cocoFamilyV129,.cocoFamilyV129");
        if(!current||familyPinScreen160904(current)||familyModernReady160904(current))removeFamilyMask160904()
      });
      try{familyMaskObserver160904.observe(modal,{childList:true,subtree:true,attributes:true})}catch(e){}
    }
    return true
  }

  function scheduleFamilyMask160904(){[0,30,80,160,320,700,1300,2200].forEach(function(ms){setTimeout(ensureFamilyMask160904,ms)})}

  function configuredStudentName160904(){
    var el=document.querySelector("#eternaOverlayV159 [data-et-name],#cocoApp .carnet .quien strong");
    var raw=normalizedUiText160904(el&&el.textContent).split(/\s+/)[0]||"";
    if(!raw||/alumno|coco/i.test(raw))return "";
    return raw.charAt(0).toLocaleUpperCase("es-ES")+raw.slice(1).toLocaleLowerCase("es-ES")
  }

  function escapeRegex160904(v){return String(v||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}

  function normalizeStudentName160904(){
    var o=document.getElementById("eternaOverlayV159"),name=configuredStudentName160904();
    if(!o||!name)return false;
    var re=new RegExp("\\b"+escapeRegex160904(name)+"\\b","gi"),changed=false;
    o.querySelectorAll(".eternaV159Msg.assistant .eternaV159Bubble").forEach(function(bubble){
      var walker=document.createTreeWalker(bubble,NodeFilter.SHOW_TEXT),node;
      while((node=walker.nextNode())){
        var next=String(node.nodeValue||"").replace(re,name);
        if(next!==node.nodeValue){node.nodeValue=next;changed=true}
      }
    });
    return changed
  }

  function normalizeExamUi160904(){
    var o=document.getElementById("eternaOverlayV159");if(!o)return false;
    var bar=o.querySelector("[data-et-modebar]"),isExam=/Prepárame para un examen/i.test(normalizedUiText160904(bar&&bar.textContent));
    o.dataset.cocoExamMode=isExam?"1":"0";
    if(isExam)o.querySelectorAll("[data-et-hint]").forEach(function(b){if(!b.dataset.cocoExamLabel160904){b.dataset.cocoExamLabel160904="1";b.textContent="💡 Pista"}});
    return isExam
  }

  function ensureFinalChatObserver160904(){
    var o=document.getElementById("eternaOverlayV159"),chat=o&&o.querySelector("[data-et-chat]");
    if(!chat)return false;
    if(finalObservedChat160904===chat&&finalChatObserver160904)return true;
    if(finalChatObserver160904){try{finalChatObserver160904.disconnect()}catch(e){}}
    finalObservedChat160904=chat;
    finalChatObserver160904=new MutationObserver(function(){
      normalizeStudentName160904();
      normalizeExamUi160904();
      cleanListenButtons1609033()
    });
    try{finalChatObserver160904.observe(chat,{childList:true,subtree:true})}catch(e){}
    normalizeStudentName160904();normalizeExamUi160904();
    return true
  }

  function stopFinalChatObserver160904(){
    if(finalChatObserver160904){try{finalChatObserver160904.disconnect()}catch(e){}finalChatObserver160904=null}
    finalObservedChat160904=null
  }

  function scheduleFinalEternaPolish160904(){
    [0,60,180,500,1200].forEach(function(ms){setTimeout(function(){
      normalizeStudentName160904();normalizeExamUi160904();ensureFinalChatObserver160904()
    },ms)})
  }

  function installFinalUiHooks160904(){
    if(document.documentElement.dataset.cocoFinalUi160904==="1")return;
    document.documentElement.dataset.cocoFinalUi160904="1";

    document.addEventListener("click",function(event){
      var family=event.target&&event.target.closest?event.target.closest(".cocoFamiliaBtn"):null;
      if(family){scheduleFamilyMask160904();return}

      var eterna=event.target&&event.target.closest?event.target.closest(
        "#eternaLauncherV159 .eternaLauncherCtaFinal3,#eternaLauncherV159 .eternaLauncherCardV159,[data-et-open],#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice],#eternaOverlayV159 [data-et-changemode],#eternaOverlayV159 [data-et-send]"
      ):null;
      if(eterna)scheduleFinalEternaPolish160904();

      var close=event.target&&event.target.closest?event.target.closest(
        "#eternaOverlayV159 .eternaV159Close,.cocoFamilyV129 [data-family-close],.cocoFamilyV129 button[aria-label='Cerrar']"
      ):null;
      if(close){setTimeout(scheduleTopExit160904,80);setTimeout(removeFamilyMask160904,0);setTimeout(stopFinalChatObserver160904,0)}
    },true);

    root.addEventListener("resize",scheduleTopExit160904,{passive:true});
    root.addEventListener("orientationchange",scheduleTopExit160904,{passive:true});
    root.addEventListener("coco:family-base-ready",scheduleFamilyMask160904,{passive:true});
    root.addEventListener("coco:family-legal-ready",scheduleFamilyMask160904,{passive:true});
    scheduleTopExit160904();scheduleFinalEternaPolish160904()
  }

  function installNavigationHooks(){
    document.addEventListener("click",function(event){
      var target=event.target&&event.target.closest?event.target.closest(
        "#eternaLauncherV159 .eternaLauncherCtaFinal3,#eternaLauncherV159 .eternaLauncherCardV159,[data-et-open],.cocoFamiliaBtn,[data-et-trial]"
      ):null;
      if(!target)return;

      if(target.matches&&target.matches("[data-et-trial]")&&subscriptionCache.value&&trialExpired(subscriptionCache.value,subscriptionCache.session)){
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        scheduleFamilyCheck();return
      }

      if(target.matches&&target.matches(".cocoFamiliaBtn")){scheduleFamilyCheck();scheduleFamilyMask160904()}
      else scheduleEternaCheck()
    },true);

    root.addEventListener("coco:family-base-ready",scheduleFamilyCheck,{passive:true});
    root.addEventListener("coco:family-legal-ready",scheduleFamilyCheck,{passive:true});

    document.addEventListener("click",function(event){
      var target=event.target&&event.target.closest?event.target.closest(
        "#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice],#eternaOverlayV159 [data-et-changemode]"
      ):null;
      if(target)scheduleVoiceUi1609032()
    },true);
  }

  function boot(){
    injectStyles();
    installTruthAntiRepeat();
    installNavigationHooks();
    installListenToggle1609033();
    installFinalUiHooks160904();
    normalizeVoiceUi1609032();
    setTimeout(cleanListenButtons1609033,120);
    setTimeout(cleanListenButtons1609033,650);

    /* Reintentos ligeros para módulos que se cargan bajo demanda. */
    setTimeout(installTruthAntiRepeat,900);
    setTimeout(installTruthAntiRepeat,2200);

    var q=new URLSearchParams(root.location.search||"");
    if(q.get("eterna")==="1"||q.get("open")==="eterna")scheduleEternaCheck();

    /* Precarga únicamente el estado de suscripción; no expone datos fuera de Supabase/ETERNA. */
    setTimeout(function(){readSubscription(false)},1200)
  }

  root.CocoProductUxV160903=Object.freeze({
    version:VERSION,
    audit:function(){
      var oldFamily=Array.prototype.slice.call(document.scripts||[]).filter(function(s){return /eterna-family-v160(?:61|63|65|66)\.js/i.test(s.src||"")}).map(function(s){return s.src});
      return{
        version:VERSION,
        expiredTrialDirectGate:true,
        checkoutUsesExistingEndpoint:true,
        truthFalsePreservesSelectedIds:true,
        safeAreas:true,
        verticalNavigation:true,
        modernMicCss:true,
        listenToggle:true,
        listenStates:["idle","loading","playing"],
        listenManualStopDoesNotRestart:true,
        topExitSafeArea:true,
        familyLegacyFlashMasked:true,
        studentNameCaseNormalized:true,
        examQuickActionsNormalized:true,
        legacyFamilyScriptsLoaded:oldFamily,
        noExternalAnalytics:true
      }
    },
    trialExpired:trialExpired,
    enforceExpiredEterna:enforceExpiredEterna,
    enforceExpiredFamily:enforceExpiredFamily
  });

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot()
})(window);
