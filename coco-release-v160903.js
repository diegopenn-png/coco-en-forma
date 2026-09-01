/* COCO EN FORMA / ETERNA · v160.90.3.2 PRODUCT UX RELEASE · MIC UNIFICADO
 * Base auditada: main@e1ec4091597fcd9583d8e474c86f8b5b6934dfe5
 *
 * Alcance:
 * 1) Trial ETERNA finalizado -> pantalla directa de planes sin volver al PIN.
 * 2) Verdadero/Falso -> conserva la bolsa antirrepetición y solo reordena la muestra.
 * 3) Safe areas -> Volver/Salir/Cerrar siempre pulsables en vertical.
 * 4) Micrófono -> presentación moderna, circular y consistente.
 * 5) Zona Familiar -> respeta implementación activa; no carga ni reactiva scripts históricos.
 *
 * NO toca Worker ETERNA, Supabase schema, Stripe backend, Safety, School Scope,
 * atribución, puntuaciones, rankings, límites diarios ni memoria pedagógica.
 */
(function(root){
  "use strict";
  if(root.__COCO_PRODUCT_UX_160903__)return;
  root.__COCO_PRODUCT_UX_160903__=true;

  var VERSION="160.90.3.2-product-ux-mic-unificado";
  var subscriptionCache={at:0,value:null,session:null,promise:null};
  var FAMILY_RETRY=[80,260,700,1400];
  var ETERNA_RETRY=[0,60,220,650,1200,2200];

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
      "@media(max-width:760px){html body #eternaOverlayV159 [data-et-mic]{min-width:52px!important;width:52px!important;height:52px!important;flex-basis:52px!important;border-radius:50%!important}#eternaOverlayV159 .coco1609032VoiceActionIcon{width:26px!important;height:26px!important;flex-basis:26px!important}#eternaOverlayV159 .coco1609032VoiceActionIcon .eternaV160MicSvg{width:24px!important;height:24px!important}}",

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
      "@media(max-width:640px){#eternaOverlayV159 .coco160903TrialEnded{margin:12px 10px;padding:16px}#eternaOverlayV159 .coco160903TrialGrid{grid-template-columns:1fr}#eternaOverlayV159 .coco160903TrialPlan>span{min-height:0}}"
    ].join("");
    document.head.appendChild(style)
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

      if(target.matches&&target.matches(".cocoFamiliaBtn"))scheduleFamilyCheck();
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
    normalizeVoiceUi1609032();

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
