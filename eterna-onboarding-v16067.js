/* ETERNA v160.67 · onboarding claro: correo de activación + primer PIN + trial
 * - Único CTA público: "Probar Eterna gratis 7 días".
 * - El resto de la tarjeta pública no abre Eterna.
 * - Sin sesión: va directo a Crear cuenta, sin pantalla intermedia.
 * - Tras crear la cuenta, sustituye el ambiguo “Muy bien” por un aviso visible de correo de activación.
 * - La intención de prueba se conserva 24 h para permitir confirmar el email y volver.
 * - En el primer acceso explica que el PIN no existe todavía: el adulto debe inventar 4 cifras y crearlo.
 * - En esa misma Zona Familiar muestra Acceso y planes + las 3 confirmaciones legales.
 * - No intenta activar el trial si el email o la autorización todavía no están confirmados.
 * - Tras autorizar, activa automáticamente el trial y abre Eterna.
 * - No hay segundo PIN ni paso por el chat.
 * - Sin tarjeta para iniciar la prueba. No modifica Worker, Stripe, Supabase ni añade MutationObserver.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_ONBOARDING_V16067__)return;
  root.__ETERNA_ONBOARDING_V16067__=true;

  var VERSION="160.67-clear-onboarding";
  var INTENT_KEY="coco_eterna_trial_intent_v16062";
  var ATTR_KEY="coco_eterna_attribution_v16062";
  var INTENT_TTL=24*60*60*1000;
  var PIN_PASS_KEY="coco_eterna_pin_pass_v16067";
  var SIGNUP_PENDING_KEY="coco_eterna_signup_pending_v16067";
  var SIGNUP_PENDING_TTL=30*60*1000;
  var firstPinProbe={uid:"",first:null,at:0,busy:false};
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
    if(document.getElementById("eterna-onboarding-v16067-css"))return;
    var s=document.createElement("style");s.id="eterna-onboarding-v16067-css";
    s.textContent=[
      "#cocoApp #eternaLauncherV159 .eternaLauncherCardV159{cursor:default!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherTrialFinal3{pointer-events:none!important;cursor:default!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherCtaFinal3{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;user-select:none!important}",
      "#cocoApp #eternaLauncherV159 .eternaLauncherCtaFinal3[role='button']:focus-visible{outline:3px solid rgba(42,167,216,.28)!important;outline-offset:3px!important}",
      "#cocoApp #eternaLauncherV159.eternaLauncherLoggedOutFinal3 .eternaLauncherCtaFinal3{min-height:46px!important;padding:11px 16px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}",
      "#cocoApp .eternaV16067Toast{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483000;transform:translateX(-50%);width:min(92vw,520px);padding:12px 15px;border:1px solid #cfe4ed;border-radius:14px;background:#fff;color:#173f59;box-shadow:0 12px 38px rgba(8,47,73,.22);font-size:11px;font-weight:800;line-height:1.45;text-align:center}",
      "#cocoApp [data-et-email-activation-v16067]{margin:14px 0!important;padding:15px 16px!important;border:1px solid #bfe2cf!important;border-radius:15px!important;background:#effaf3!important;color:#245d45!important;font-size:12px!important;font-weight:800!important;line-height:1.5!important;text-align:left!important}",
      "#cocoApp [data-et-email-activation-v16067] strong{display:block!important;margin-bottom:4px!important;color:#174f39!important;font-size:14px!important}",
      "#cocoApp .cocoFamilyV129 .eternaFirstPinV16067{margin:12px 0 4px;padding:13px 14px;border:1px solid #bfe1ef;border-radius:14px;background:#eff9fd;color:#315d73;font-size:11px;font-weight:800;line-height:1.5;text-align:left}",
      "#cocoApp .cocoFamilyV129 .eternaFirstPinV16067 strong{display:block;margin-bottom:3px;color:#173f59;font-size:12px}",

      "@media(max-width:640px){#cocoApp #eternaLauncherV159.eternaLauncherLoggedOutFinal3 .eternaLauncherCtaFinal3{width:100%!important;font-size:12px!important}}"
    ].join("");
    document.head.appendChild(s)
  }

  function toast(text,ms){
    var old=document.querySelector(".eternaV16067Toast");if(old)old.remove();
    var n=document.createElement("div");n.className="eternaV16067Toast";n.setAttribute("role","status");n.textContent=text;
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
  function ensureFamilyLayer(){
    try{
      if(typeof root.__loadEternaFamilyV16066==="function")root.__loadEternaFamilyV16066()
    }catch(e){}
  }
  function beginSignup(source){ensureFamilyLayer();setIntent(source||"home");goToCreateAccount()}

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


  function markSignupPending(){
    try{localStorage.setItem(SIGNUP_PENDING_KEY,JSON.stringify({at:Date.now()}))}catch(e){}
  }
  function signupPending(){
    try{
      var d=JSON.parse(localStorage.getItem(SIGNUP_PENDING_KEY)||"null");
      if(!d||!d.at||Date.now()-Number(d.at)>SIGNUP_PENDING_TTL){localStorage.removeItem(SIGNUP_PENDING_KEY);return false}
      return true
    }catch(e){return false}
  }
  function clearSignupPending(){try{localStorage.removeItem(SIGNUP_PENDING_KEY)}catch(e){}}



  function emailVerified(session){
    var u=session&&session.user;
    if(!u)return false;
    return !!(u.email_confirmed_at||u.confirmed_at||(u.user_metadata&&u.user_metadata.email_verified===true))
  }

  function emailActivationCopy(){
    return "Te hemos enviado un correo electrónico para activar tu cuenta. Abre ese correo y pulsa el enlace de confirmación. Después vuelve a Coco en Forma e inicia sesión con el email y la contraseña que acabas de crear."
  }

  function findSignupSuccessArea(){
    var rootArea=document.querySelector("#cocoApp .loginCard")||document.getElementById("cocoApp");
    if(!rootArea)return null;
    var heading=null,returnControl=null,walker=null,node=null;
    try{
      walker=document.createTreeWalker(rootArea,NodeFilter.SHOW_TEXT);
      while((node=walker.nextNode())){
        var t=clean(node.nodeValue);
        if(!t)continue;
        if(!heading&&t.length<=90&&/^muy\s+bien[!.]?$/i.test(t)){
          node.nodeValue="Revisa tu correo para activar la cuenta";
          heading=node.parentElement||null
        }else if(t.length<=240&&/volver.*pantalla.*principal.*activ/i.test(t)){
          node.nodeValue=emailActivationCopy()
        }
      }
    }catch(e){}
    var controls=rootArea.querySelectorAll("button,a,[role='button']");
    for(var j=0;j<controls.length;j++){
      var ct=clean(controls[j].textContent);
      if(/volver.*(pantalla|inicio)|pantalla.*principal/i.test(ct)){returnControl=controls[j];break}
    }
    return{root:rootArea,heading:heading,returnControl:returnControl}
  }

  function enhanceSignupSuccessNotice(){
    if(!getIntent()&&!signupPending())return false;
    var area=findSignupSuccessArea();if(!area||(!area.heading&&!area.returnControl))return false;

    if(area.heading)area.heading.textContent="Revisa tu correo para activar la cuenta";

    var parent=(area.heading&&area.heading.parentElement)||(area.returnControl&&area.returnControl.parentElement)||area.root;
    var existing=area.root.querySelector("[data-et-email-activation-v16067]");
    if(!existing){
      var n=document.createElement("div");
      n.setAttribute("data-et-email-activation-v16067","");
      n.setAttribute("role","status");
      n.setAttribute("aria-live","polite");
      n.innerHTML="<strong>📧 Falta confirmar el correo electrónico</strong>"+emailActivationCopy();
      if(area.heading)area.heading.insertAdjacentElement("afterend",n);
      else if(area.returnControl)area.returnControl.insertAdjacentElement("beforebegin",n);
      else parent.appendChild(n)
    }

    if(area.returnControl){
      var txt=clean(area.returnControl.textContent);
      if(/volver/i.test(txt))area.returnControl.textContent="Volver al inicio y revisar mi correo"
    }
    return true
  }

  function scheduleSignupSuccessNotice(){
    [0,120,300,600,1000,1700,2800,4400,6500].forEach(function(ms){setTimeout(enhanceSignupSuccessNotice,ms)})
  }

  function installSignupAlertUpgrade(){
    if(root.__ETERNA_SIGNUP_ALERT_V16067__)return;
    root.__ETERNA_SIGNUP_ALERT_V16067__=true;
    var original=typeof root.alert==="function"?root.alert.bind(root):null;
    if(!original)return;
    root.alert=function(message){
      if((getIntent()||signupPending())&&/^muy\s+bien[!.]?$/i.test(clean(message))){
        return original("Cuenta creada. "+emailActivationCopy())
      }
      return original(message)
    }
  }

  function hasPinPass(){try{return sessionStorage.getItem(PIN_PASS_KEY)==="1"}catch(e){return false}}
  function markPinPass(){try{sessionStorage.setItem(PIN_PASS_KEY,"1")}catch(e){}}

  async function detectFirstPin(){
    var session=await getSession(),uid=session&&session.user&&session.user.id?String(session.user.id):"";
    if(!uid)return null;
    if(firstPinProbe.uid===uid&&firstPinProbe.first!==null&&Date.now()-firstPinProbe.at<30000)return firstPinProbe.first;
    if(firstPinProbe.busy)return firstPinProbe.first;
    firstPinProbe.busy=true;
    try{
      var c=getClient(),r=await c.from("eterna_family_security").select("pin_hash").eq("user_id",uid).maybeSingle();
      if(r&&r.error)throw r.error;
      var first=!(r&&r.data&&r.data.pin_hash);
      firstPinProbe={uid:uid,first:first,at:Date.now(),busy:false};
      return first
    }catch(e){
      var fallback=signupPending();
      firstPinProbe={uid:uid,first:fallback?true:null,at:Date.now(),busy:false};
      return fallback?true:null
    }
  }

  function setTextNodeBeforeInput(label,text){
    if(!label)return;
    var input=label.querySelector("input");
    var nodes=Array.prototype.slice.call(label.childNodes);
    var done=false;
    nodes.forEach(function(n){
      if(n===input)return;
      if(n.nodeType===3&&clean(n.nodeValue)){
        if(!done){n.nodeValue=text;done=true}else n.nodeValue=""
      }
    });
    if(!done&&input)label.insertBefore(document.createTextNode(text),input)
  }

  async function enhanceFirstPinCopy(){
    var body=familyBody(),screen=body&&body.querySelector(".cocoFamilyPin");
    if(!screen)return false;
    var first=await detectFirstPin();
    if(first!==true)return false;

    screen.dataset.etFirstPinV16067="1";
    var modal=screen.closest(".cocoFamilyV129"),title=modal&&modal.querySelector("#cocoFamilyV129Title"),kicker=modal&&modal.querySelector("header span"),headCopy=modal&&modal.querySelector("header p");
    if(title)title.textContent="Crea tu PIN familiar";
    if(kicker)kicker.textContent="ZONA FAMILIAR · PRIMER ACCESO";
    if(headCopy)headCopy.textContent="Es la primera vez que entras. Elige ahora un PIN de cuatro cifras.";

    var paragraphs=screen.querySelectorAll("p");
    var mainCopy=null;
    for(var i=0;i<paragraphs.length;i++){
      if(/pin familiar|safari|app instalada/i.test(clean(paragraphs[i].textContent))){mainCopy=paragraphs[i];break}
    }
    if(mainCopy)mainCopy.textContent="Este PIN todavía no existe: lo creas tú ahora. Inventa 4 cifras que recuerdes; protegerán la Zona Familiar en Safari y en la app instalada.";

    if(!screen.querySelector(".eternaFirstPinV16067")){
      var note=document.createElement("div");
      note.className="eternaFirstPinV16067";
      note.innerHTML="<strong>🔐 Tu primer PIN</strong>No tienes que haber recibido ningún PIN. Elígelo tú ahora: son 4 cifras que usarás para entrar en Zona Familiar.";
      var label=screen.querySelector("label");
      if(label)screen.insertBefore(note,label);else screen.insertBefore(note,screen.firstChild)
    }

    var label=screen.querySelector("label"),input=screen.querySelector("input"),enter=screen.querySelector("[data-family-enter]");
    setTextNodeBeforeInput(label,"Crea tu PIN familiar · 4 cifras");
    if(input){input.placeholder="Elige 4 cifras";input.setAttribute("aria-label","Crea un PIN familiar de cuatro cifras")}
    if(enter)enter.textContent="Crear PIN y entrar en Zona Familiar";

    var recover=screen.querySelector(".cocoFamilyRecoverV160,[data-family-recover-open]");
    if(recover){
      var wrap=recover.closest(".cocoFamilyRecoverV160")||recover;
      wrap.style.display="none"
    }
    return true
  }

  function scheduleFirstPinCopy(){
    [80,180,360,700,1200].forEach(function(ms){setTimeout(function(){enhanceFirstPinCopy().catch(function(){})},ms)})
  }

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
    clearSignupPending();
    firstPinProbe={uid:"",first:null,at:0,busy:false};
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
          if(root.ETERNA_FAMILY_V16066&&typeof root.ETERNA_FAMILY_V16066.refresh==="function")root.ETERNA_FAMILY_V16066.refresh()
        }catch(e){}
        var target=card.querySelector(".eternaV16061SubscriptionTop")||card;
        try{target.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){}
      },ms)
    });
    return true
  }

  function afterFamilyPinSubmit(){
    ensureFamilyLayer();
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
    ensureFamilyLayer();
    scheduleFirstPinCopy();
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
      if(!emailVerified(session)){
        markSignupPending();
        toast("Te hemos enviado un correo electrónico para activar la cuenta. Ábrelo, pulsa el enlace de confirmación y después vuelve a iniciar sesión.",7600);
        scheduleSignupSuccessNotice();
        return
      }
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
      toast("Aún no podemos activar la prueba. Comprueba la autorización de Eterna en Zona Familiar y vuelve a intentarlo.",6200);openFamilyForAuthorization()
    }catch(e){
      toast("Aún no podemos activar la prueba. Comprueba la autorización de Eterna en Zona Familiar y vuelve a intentarlo.",6200);openFamilyForAuthorization()
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
    var clicked=event.target&&event.target.closest?event.target.closest("button,a,[role='button']"):null;
    if(clicked&&/^crear\s+cuenta\s+y\s+entrar$/i.test(clean(clicked.textContent))){
      markSignupPending();
      scheduleSignupSuccessNotice()
    }

    var familyOpen=event.target&&event.target.closest?event.target.closest(".cocoFamiliaBtn,[data-family-enter]"):null;
    if(familyOpen){ensureFamilyLayer();scheduleFirstPinCopy()}

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
    injectStyles();installSignupAlertUpgrade();
    document.addEventListener("click",onClick,true);
    document.addEventListener("keydown",onKey,true);
    document.addEventListener("submit",function(event){
      var form=event.target;
      if(form&&getIntent()&&/crear\s+cuenta/i.test(clean(form.textContent))){markSignupPending();scheduleSignupSuccessNotice()}
    },true);
    bindAuth();scheduleNormalize();setTimeout(handleInitialDeepLink,80);setTimeout(handleInitialDeepLink,360);
    if(getIntent())getSession().then(function(session){if(session)setTimeout(resumePendingTrial,220)}).catch(function(){});
    root.ETERNA_ONBOARDING_V16067=Object.freeze({version:VERSION,single_public_cta:true,direct_signup:true,signup_email_activation_notice:true,robust_signup_success_dom_notice:true,email_verification_before_trial:true,trial_intent_ttl_hours:24,first_pin_explained:true,first_pin_server_probe:true,pin_first:true,one_pin_trial_flow:true,plans_and_legal_same_screen:true,three_legal_confirmations_inline:true,legal_cta_starts_trial:true,automatic_trial_after_authorization:true,no_card_required_for_trial:true,prominent_trial_cta:true,lazy_family_layer:true,preserves_legal_gate:true,preserves_family_zone:true,desktop_boot_optimized:true,worker_unchanged:"160.4-legal1",extra_mutation_observer:false})
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install()
})(window);

;(function(root){
  "use strict";
  if(root.__ETERNA_MARKETING_ATTRIBUTION_V1__)return;
  root.__ETERNA_MARKETING_ATTRIBUTION_V1__=true;

  var CONSENT_KEY="cef_marketing_measurement_consent_v1";
  var ATTR_KEY="cef_marketing_trial_attribution_v1";
  var CONSENT_VERSION="2026-08-28-v1";
  var TTL=24*60*60*1000;
  var bound=false,persisting=false;

  function clean(v,max,fallback){
    v=String(v==null?"":v).trim();
    if(!v)return fallback||"";
    return v.slice(0,max||200)
  }
  function validUuid(v){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||""))
  }
  function consent(){
    try{return localStorage.getItem(CONSENT_KEY)==="accepted"}catch(e){return false}
  }
  function capture(){
    if(!consent())return null;
    try{
      var q=new URLSearchParams(location.search),sid=clean(q.get("mkt_session"),80,"");
      if(!validUuid(sid))return null;
      var d={
        at:Date.now(),
        anonymous_session_id:sid,
        source:clean(q.get("utm_source")||q.get("source"),120,"direct"),
        medium:clean(q.get("utm_medium"),120,"none"),
        campaign:clean(q.get("utm_campaign"),200,"none"),
        content:clean(q.get("utm_content"),200,"none"),
        term:clean(q.get("utm_term"),200,"none"),
        gclid:q.get("gclid")?clean(q.get("gclid"),500,""):null,
        fbclid:q.get("fbclid")?clean(q.get("fbclid"),500,""):null
      };
      localStorage.setItem(ATTR_KEY,JSON.stringify(d));
      return d
    }catch(e){return null}
  }
  function stored(){
    if(!consent())return null;
    try{
      var d=JSON.parse(localStorage.getItem(ATTR_KEY)||"null");
      if(!d||!d.at||Date.now()-Number(d.at)>TTL||!validUuid(d.anonymous_session_id)){
        localStorage.removeItem(ATTR_KEY);return null
      }
      return d
    }catch(e){return null}
  }
  function client(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var cfg=root.COCO_CONFIG||{};
    if(!root.supabase||!root.supabase.createClient||!cfg.url||!cfg.clave)return null;
    try{
      return root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(cfg.url,cfg.clave,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
      })
    }catch(e){return null}
  }
  async function getSession(){
    var c=client();if(!c||!c.auth)return null;
    try{var r=await c.auth.getSession();return r&&r.data?r.data.session:null}catch(e){return null}
  }
  async function persist(session){
    if(persisting||!consent())return false;
    var d=stored(),c=client(),u=session&&session.user;
    if(!d||!c||!u||!u.id)return false;
    persisting=true;
    try{
      var row={
        user_id:u.id,
        anonymous_session_id:d.anonymous_session_id,
        source:clean(d.source,120,"direct"),
        medium:clean(d.medium,120,"none"),
        campaign:clean(d.campaign,200,"none"),
        content:clean(d.content,200,"none"),
        term:clean(d.term,200,"none"),
        gclid:d.gclid?clean(d.gclid,500,""):null,
        fbclid:d.fbclid?clean(d.fbclid,500,""):null,
        consent_version:CONSENT_VERSION
      };
      var r=await c.from("eterna_marketing_attribution").insert(row);
      if(r&&r.error&&String(r.error.code||"")!=="23505")throw r.error;
      try{localStorage.removeItem(ATTR_KEY)}catch(e){}
      return true
    }catch(e){
      return false
    }finally{persisting=false}
  }
  async function probe(){
    if(!consent())return;
    capture();
    var s=await getSession();
    if(s)await persist(s)
  }
  function bind(){
    if(bound)return;
    var c=client();if(!c||!c.auth)return;
    bound=true;
    try{c.auth.onAuthStateChange(function(_event,session){if(session)persist(session)})}catch(e){}
    root.addEventListener("coco:daily-user",function(){probe()})
  }
  function install(){
    capture();bind();
    [200,700,1600,3500,7000].forEach(function(ms){
      setTimeout(function(){bind();probe()},ms)
    })
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install()
})(window);
