/* ETERNA v160.65 · onboarding final: PIN + autorización + trial en un solo flujo
 * - Único CTA público: "Probar Eterna gratis 7 días".
 * - El resto de la tarjeta pública no abre Eterna.
 * - Sin sesión: va directo a Crear cuenta, sin pantalla intermedia.
 * - Tras crear cuenta: pide primero el PIN familiar.
 * - En esa misma primera entrada muestra Acceso y planes + las 3 confirmaciones legales juntas.
 * - Mientras falta autorización, no muestra un botón separado de Empezar prueba gratis.
 * - El CTA legal pasa a ser “Autorizar y empezar prueba gratis”.
 * - Tras autorizar, activa automáticamente el trial y abre Eterna.
 * - No hay segundo PIN ni paso por el chat.
 * - Sin tarjeta para iniciar la prueba. No modifica Worker, Stripe, Supabase ni añade MutationObserver.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_ONBOARDING_V16065__)return;
  root.__ETERNA_ONBOARDING_V16065__=true;

  var VERSION="160.65-onboarding-final";
  var INTENT_KEY="coco_eterna_trial_intent_v16062";
  var ATTR_KEY="coco_eterna_attribution_v16062";
  var INTENT_TTL=60*60*1000;
  var PIN_PASS_KEY="coco_eterna_pin_pass_v16065";
  var resumeBusy=false,authBound=false,routeTimers=[];

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
  function visible(el){if(!el)return false;try{var s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&s.opacity!=="0"}catch(e){return true}}
  function endpoint(path){var c=root.COCO_CONFIG||{},base=String(c.eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");return base?base+(p.charAt(0)==="/"?p:"/"+p):""}
  function getClient(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var c=root.COCO_CONFIG||{};
    if(root.supabase&&root.supabase.createClient&&c.url&&c.clave){
      try{return root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}
    }
    return null
  }
  async function getSession(){var c=getClient();if(!c||!c.auth)return null;try{var r=await c.auth.getSession();return r&&r.data?r.data.session:null}catch(e){return null}}
  async function authFetch(path,options,session){
    var url=endpoint(path);if(!url)throw new Error("ETERNA_ENDPOINT_NOT_CONFIGURED");
    var s=session||await getSession(),headers=Object.assign({},options&&options.headers||{});
    if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
    return fetch(url,Object.assign({},options||{},{headers:headers}))
  }

  function injectStyles(){
    if(document.getElementById("eterna-onboarding-v16065-css"))return;
    var s=document.createElement("style");s.id="eterna-onboarding-v16065-css";
    s.textContent=[
      "#cocoApp #eternaLauncherV159 .eternaLauncherCardV159{cursor:default!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherTrialFinal3{pointer-events:none!important;cursor:default!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherCtaFinal3{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;user-select:none!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherCtaFinal3[role='button']:focus-visible{outline:3px solid rgba(42,167,216,.28)!important;outline-offset:3px!important}",
      "#cocoApp #eternaLauncherV159.eternaLauncherLoggedOutFinal3 .eternaLauncherCtaFinal3{min-height:46px!important;padding:11px 16px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}",
      "#cocoApp .eternaV16065Toast{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483000;transform:translateX(-50%);width:min(92vw,520px);padding:12px 15px;border:1px solid #cfe4ed;border-radius:14px;background:#fff;color:#173f59;box-shadow:0 12px 38px rgba(8,47,73,.22);font-size:11px;font-weight:800;line-height:1.45;text-align:center}",
      "@media(max-width:640px){#cocoApp #eternaLauncherV159.eternaLauncherLoggedOutFinal3 .eternaLauncherCtaFinal3{width:100%!important;font-size:12px!important}}"
    ].join("");
    document.head.appendChild(s)
  }

  function toast(text,ms){
    var old=document.querySelector(".eternaV16065Toast");if(old)old.remove();
    var n=document.createElement("div");n.className="eternaV16065Toast";n.setAttribute("role","status");n.textContent=text;
    document.body.appendChild(n);setTimeout(function(){if(n.parentNode)n.remove()},ms||4200)
  }
  function loginVisible(){return visible(document.querySelector("#cocoApp .loginCard"))}
  function currentSource(){try{var q=new URLSearchParams(location.search);return clean(q.get("source")||q.get("utm_source")||"web")}catch(e){return"web"}}

  function captureAttribution(){
    try{
      var q=new URLSearchParams(location.search),keys=["source","utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid"],data={at:Date.now()};
      keys.forEach(function(k){var v=q.get(k);if(v)data[k]=v});
      localStorage.setItem(ATTR_KEY,JSON.stringify(data))
    }catch(e){}
  }
  function setIntent(source){
    captureAttribution();
    var mode="homework";
    try{var q=new URLSearchParams(location.search),m=clean(q.get("mode")).toLowerCase();if(["homework","ask","review","explain","exam","practice"].indexOf(m)>=0)mode=m}catch(e){}
    try{localStorage.setItem(INTENT_KEY,JSON.stringify({at:Date.now(),source:source||currentSource(),mode:mode}))}catch(e){}
  }
  function getIntent(){
    try{
      var d=JSON.parse(localStorage.getItem(INTENT_KEY)||"null");
      if(!d||!d.at||Date.now()-Number(d.at)>INTENT_TTL){localStorage.removeItem(INTENT_KEY);return null}
      return d
    }catch(e){return null}
  }
  function clearIntent(){try{localStorage.removeItem(INTENT_KEY)}catch(e){}try{sessionStorage.removeItem(PIN_PASS_KEY)}catch(e){}}

  function clearOpenQuery(){
    try{
      var u=new URL(location.href);u.searchParams.delete("open");u.searchParams.delete("eterna");
      history.replaceState(history.state,"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")+u.hash)
    }catch(e){}
  }
  function closeEterna(){
    try{if(root.CocoEternaV160&&typeof root.CocoEternaV160.close==="function")root.CocoEternaV160.close()}catch(e){}
    var o=document.getElementById("eternaOverlayV159");if(o)o.classList.remove("is-open");
    try{document.body.style.overflow=""}catch(e){}
  }
  function findCreateAccount(){
    var area=document.querySelector("#cocoApp .loginCard")||document.getElementById("cocoApp");if(!area)return null;
    var nodes=area.querySelectorAll("button,a,[role='button']");
    for(var i=0;i<nodes.length;i++)if(/^crear\s+cuenta$/i.test(clean(nodes[i].textContent)))return nodes[i];
    return null
  }
  function goToCreateAccount(){
    closeEterna();clearOpenQuery();
    var b=findCreateAccount();if(b){try{b.click();return true}catch(e){}}
    var login=document.querySelector("#cocoApp .loginCard");if(login)try{login.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}
    return false
  }
  function beginSignup(source){setIntent(source||"home");goToCreateAccount()}

  function normalizeLauncher(){
    injectStyles();
    var launcher=document.getElementById("eternaLauncherV159");if(!launcher)return false;
    var card=launcher.querySelector(".eternaLauncherCardV159"),cta=launcher.querySelector(".eternaLauncherCtaFinal3"),trial=launcher.querySelector(".eternaLauncherTrialFinal3"),loggedOut=loginVisible();
    if(card){card.setAttribute("tabindex","-1");card.setAttribute("aria-label",loggedOut?"Eterna, ayuda escolar personalizada":"Eterna, tu ayuda escolar")}
    if(cta){
      cta.textContent=loggedOut?"Probar Eterna gratis 7 días":"Abrir Eterna";
      cta.setAttribute("role","button");cta.setAttribute("tabindex","0");
      cta.setAttribute("aria-label",loggedOut?"Probar Eterna gratis durante 7 días":"Abrir Eterna")
    }
    if(trial){var strong=trial.querySelector("strong"),span=trial.querySelector("span");if(strong)strong.textContent="⭐ 7 días gratis";if(span)span.textContent="Sin tarjeta ni datos bancarios para empezar."}
    return true
  }
  function scheduleNormalize(){
    routeTimers.forEach(function(id){clearTimeout(id)});routeTimers=[];
    [0,260].forEach(function(ms){routeTimers.push(setTimeout(normalizeLauncher,ms))})
  }


  function hasPinPass(){try{return sessionStorage.getItem(PIN_PASS_KEY)==="1"}catch(e){return false}}
  function markPinPass(){try{sessionStorage.setItem(PIN_PASS_KEY,"1")}catch(e){}}

  function familyBody(){
    return document.querySelector("#cocoApp .cocoFamilyV129Body,#cocoApp .cocoFamilyBody,#cocoApp [class*='Family'][class*='Body']")
  }

  function normalizeFamilyHeader(body){
    var modal=body&&body.closest(".cocoFamilyV129");if(!modal)return;
    var title=modal.querySelector("#cocoFamilyV129Title"),kicker=modal.querySelector("header span"),copy=modal.querySelector("header p");
    if(title&&/acceso\s+familiar/i.test(clean(title.textContent)))title.textContent="Progreso y fortalezas";
    if(kicker)kicker.textContent="ZONA FAMILIAR · PROGRESO";
    if(copy)copy.textContent="Dos lecturas distintas: Eterna resume la ayuda escolar y el mapa refleja el entrenamiento de los juegos para la mente."
  }

  function ensureFamilySignal(body){
    if(!body||body.querySelector(".eternaV159FamilyCard"))return null;
    var signal=body.querySelector("[data-et-v16064-family-signal]");
    if(!signal){
      signal=document.createElement("span");
      signal.className="cocoFamilyHero";
      signal.hidden=true;
      signal.setAttribute("data-et-v16064-family-signal","");
      body.insertBefore(signal,body.firstChild)
    }
    return signal
  }

  function finishFamilyFirstEntry(){
    var body=familyBody();
    if(!body||body.querySelector(".cocoFamilyPin"))return false;

    markPinPass();
    normalizeFamilyHeader(body);
    var signal=ensureFamilySignal(body);
    var card=body.querySelector(".eternaV159FamilyCard");

    if(!card)return false;

    if(signal&&signal.parentNode)signal.remove();

    try{
      if(root.ETERNA_LEGAL_SHIELD_V16058&&typeof root.ETERNA_LEGAL_SHIELD_V16058.refresh==="function")root.ETERNA_LEGAL_SHIELD_V16058.refresh()
    }catch(e){}
    [120,360,760,1300].forEach(function(ms){
      setTimeout(function(){
        try{
          if(root.ETERNA_FAMILY_V16065&&typeof root.ETERNA_FAMILY_V16065.refresh==="function")root.ETERNA_FAMILY_V16065.refresh()
        }catch(e){}
        var target=card.querySelector(".eternaV16061SubscriptionTop")||card;
        try{target.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){}
      },ms)
    });
    return true
  }

  function afterFamilyPinSubmit(){
    /* Solo durante el onboarding de Eterna. Comprobaciones acotadas tras el PIN. */
    [120,320,700,1400,2600].forEach(function(ms){
      setTimeout(function(){
        if(finishFamilyFirstEntry()&&hasPinPass()){
          setTimeout(resumePendingTrial,220)
        }
      },ms)
    })
  }

  async function legalState(session){
    try{
      var r=await authFetch("/v1/legal-consent",{method:"GET",headers:{"Cache-Control":"no-store"}},session);
      if(r.status===404)return{backend_available:false,required:false,accepted:true};
      var d=await r.json().catch(function(){return{}});
      if(!r.ok)throw new Error(d.error||("LEGAL_"+r.status));
      d.backend_available=true;return d
    }catch(e){return{backend_available:false,required:false,accepted:false,temporary_error:true}}
  }

  function openFamilyForAuthorization(){
    closeEterna();

    var body=familyBody();
    var modal=body&&body.closest(".cocoFamilyV129");
    if(!modal){
      var b=document.querySelector("#cocoApp .cocoFamiliaBtn");
      if(b)try{b.click()}catch(e){}
    }

    toast("Para comenzar la prueba, completa la autorización de Eterna en esta misma Zona Familiar.",5200);

    [260,650,1200,2000].forEach(function(ms){
      setTimeout(function(){
        finishFamilyFirstEntry();
        var legal=document.querySelector("#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058:not(.is-ok),#cocoApp .eternaLegalV16058:not(.is-ok)");
        if(legal)try{legal.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}
      },ms)
    })
  }

  function closeFamily(){
    var x=document.querySelector("#cocoApp .cocoFamilyV129 [data-family-close]")||document.querySelector("#cocoApp .cocoFamilyV129>header button");
    if(x)try{x.click()}catch(e){}
  }
  function openEterna(){
    closeFamily();
    setTimeout(function(){try{if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function")root.CocoEternaV160.open()}catch(e){}},220)
  }
  async function activateTrial(session){
    var r=await authFetch("/v1/trial",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"},session);
    var d=await r.json().catch(function(){return{}});
    return{ok:r.ok,status:r.status,data:d}
  }
  async function subscriptionHasAccess(session){
    var c=getClient();if(!c||!session||!session.user)return false;
    var testerEmails=(root.COCO_CONFIG&&root.COCO_CONFIG.cuentasPruebaIlimitadas)||[],email=String(session.user.email||"").toLowerCase();
    if(testerEmails.some(function(x){return String(x||"").toLowerCase()===email}))return true;
    try{
      var r=await c.from("eterna_subscriptions").select("status,trial_end").eq("user_id",session.user.id).maybeSingle(),s=r&&r.data||{};
      if(s.status==="active")return true;
      if(s.status==="trialing"&&(!s.trial_end||new Date(s.trial_end).getTime()>Date.now()))return true
    }catch(e){}
    return false
  }

  async function resumePendingTrial(){
    if(resumeBusy)return;
    var intent=getIntent();if(!intent)return;
    var session=await getSession();if(!session||!session.user)return;
    resumeBusy=true;
    try{
      if(await subscriptionHasAccess(session)){clearIntent();toast("Eterna está lista. Abriendo…",1800);openEterna();return}
      if(!hasPinPass()){openFamilyForAuthorization();return}
      var legal=await legalState(session);
      if(legal.backend_available&&legal.required&&!legal.accepted){openFamilyForAuthorization();return}
      var result=await activateTrial(session);
      if(result.ok){
        clearIntent();toast("✓ Prueba gratuita de Eterna activada. Tienes 7 días sin tarjeta.",2600);openEterna();return
      }
      var code=clean(result.data&&result.data.error).toUpperCase();
      if(result.status===403||/LEGAL|PARENT|AUTHORI|CONSENT/.test(code)){openFamilyForAuthorization();return}
      if(await subscriptionHasAccess(session)){clearIntent();openEterna();return}
      toast("Tu cuenta ya está creada. Entra en Zona Familiar para terminar la activación de Eterna.",5200);openFamilyForAuthorization()
    }catch(e){
      toast("Tu cuenta ya está creada. Entra en Zona Familiar para terminar la activación de Eterna.",5200);openFamilyForAuthorization()
    }finally{resumeBusy=false}
  }

  function bindAuth(){
    if(authBound)return;
    var c=getClient();if(!c||!c.auth)return;
    authBound=true;
    try{c.auth.onAuthStateChange(function(event,session){scheduleNormalize();if(session&&getIntent())setTimeout(resumePendingTrial,300)})}catch(e){}
    window.addEventListener("coco:daily-user",function(e){scheduleNormalize();if(e&&e.detail&&e.detail.userId&&getIntent())setTimeout(resumePendingTrial,350)})
  }

  function handleInitialDeepLink(){
    var q;try{q=new URLSearchParams(location.search)}catch(e){return}
    var wants=q.get("open")==="eterna"||q.get("eterna")==="1";
    if(wants&&loginVisible())beginSignup(clean(q.get("source")||q.get("utm_source")||"direct"))
  }

  function onClick(event){
    var pinEnter=event.target&&event.target.closest?event.target.closest("[data-family-enter]"):null;
    if(pinEnter&&getIntent())afterFamilyPinSubmit();
    var launcher=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159 .eternaLauncherCardV159"):null;
    if(launcher){
      var cta=event.target.closest(".eternaLauncherCtaFinal3");
      if(loginVisible()){
        event.preventDefault();event.stopImmediatePropagation();
        if(cta)beginSignup("home");
        return
      }
      if(!cta){event.preventDefault();event.stopImmediatePropagation();return}
    }
    var legalAccept=event.target&&event.target.closest?event.target.closest("[data-legal-accept]"):null;
    if(legalAccept&&getIntent())[700,1400,2600].forEach(function(ms){setTimeout(resumePendingTrial,ms)})
  }
  function onKey(event){
    var cta=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159 .eternaLauncherCtaFinal3"):null;
    if(!cta||(event.key!=="Enter"&&event.key!==" "))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(loginVisible())beginSignup("home_keyboard");
    else try{if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function")root.CocoEternaV160.open()}catch(e){}
  }

  function install(){
    injectStyles();document.addEventListener("click",onClick,true);document.addEventListener("keydown",onKey,true);
    bindAuth();scheduleNormalize();setTimeout(handleInitialDeepLink,80);setTimeout(handleInitialDeepLink,360);
    if(getIntent())getSession().then(function(session){if(session)setTimeout(resumePendingTrial,220)}).catch(function(){});
    root.ETERNA_ONBOARDING_V16065=Object.freeze({version:VERSION,single_public_cta:true,direct_signup:true,pin_first:true,one_pin_trial_flow:true,plans_and_legal_same_screen:true,three_legal_confirmations_inline:true,legal_cta_starts_trial:true,automatic_trial_after_authorization:true,no_card_required_for_trial:true,preserves_legal_gate:true,preserves_family_zone:true,desktop_boot_optimized:true,worker_unchanged:"160.4-legal1",extra_mutation_observer:false})
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install()
})(window);
