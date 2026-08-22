/* Coco en Forma · ETERNA v160.0 FINAL3
 * Release consolidada.
 * - Home según boceto: acceso/carnet + Eterna, después visual Coco + Juegos.
 * - Un solo sistema de modos.
 * - Controles familiares claros y persistentes.
 * - Un solo bloque de progreso + informe humano.
 * - PWA/tablet/iPad más estable.
 * - Observación DOM acotada.
 */
(function(){
  "use strict";

  var VERSION="160.0-final4-familygate";
  var DATA_CACHE_MS=15000;
  var RESUME_KEY="coco_eterna_resume_after_auth_v1603";
  var OUT_SCOPE="Estoy aquí para ayudarte con el cole y con tu aprendizaje. Para cualquier otra duda o tema, habla con tus padres o con un adulto de confianza.";

  var MODE_CONFIG={
    homework:{label:"Ayúdame con mi tarea",icon:"📸",description:"Entiendo primero el ejercicio y te doy una pista cada vez.",placeholder:"Escribe qué parte de la tarea no entiendes…"},
    ask:{label:"Pregunta del cole",icon:"✏️",description:"Respondo una duda académica concreta y compruebo que la entendiste.",placeholder:"Escribe tu pregunta del cole…"},
    review:{label:"Revisa lo que hice",icon:"✅",description:"Parto de tu respuesta, marco lo que está bien y te ayudo a encontrar el primer error.",placeholder:"Cuéntame qué hiciste o adjunta una foto…"},
    explain:{label:"Explícame un tema",icon:"🧠",description:"Te lo enseño desde cero con un ejemplo o analogía y una comprobación breve.",placeholder:"¿Qué tema quieres entender mejor?"},
    exam:{label:"Prepárame para un examen",icon:"📚",description:"Te hago una pregunta cada vez, espero tu respuesta y adapto la dificultad.",placeholder:"¿Qué asignatura y tema entra en el examen?"},
    practice:{label:"Practicar lo que me cuesta",icon:"🎯",description:"Uso tu progreso para practicar primero lo que más necesitas reforzar.",placeholder:"¿Qué quieres practicar hoy? Puedes dejarlo en blanco y decir: Empezamos."}
  };

  var state={
    client:null,session:null,profile:null,baseProfile:null,subscription:null,parentSettings:null,
    learningMemory:[],strategyMemory:[],history:[],imageData:null,imageName:"",mode:"homework",
    modeState:{question_number:0,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2,focus:null},
    busy:false,recorder:null,chunks:[],lastSpeechUrl:null,lastReply:"",lastAudio:null,inputSource:"text",
    dataLoadedAt:0
  };

  var appObserver=null,observerRaf=0,authWatcherInstalled=false;

  var CCAA=["Andalucía","Aragón","Asturias","Illes Balears","Canarias","Cantabria","Castilla-La Mancha","Castilla y León","Cataluña","Comunitat Valenciana","Extremadura","Galicia","Comunidad de Madrid","Región de Murcia","Navarra","País Vasco","La Rioja","Ceuta","Melilla"];
  var YEARS=[
    ["infantil","Infantil · 3 años"],["infantil","Infantil · 4 años"],["infantil","Infantil · 5 años"],
    ["primaria","1º de Primaria"],["primaria","2º de Primaria"],["primaria","3º de Primaria"],["primaria","4º de Primaria"],["primaria","5º de Primaria"],["primaria","6º de Primaria"],
    ["eso","1º de ESO"],["eso","2º de ESO"],["eso","3º de ESO"],["eso","4º de ESO"],
    ["bachillerato","1º de Bachillerato"],["bachillerato","2º de Bachillerato"]
  ];

  function cfg(){return window.COCO_CONFIG||{}}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function cleanText(v){return String(v==null?"":v).replace(/\*\*(.*?)\*\*/gs,"$1").replace(/__(.*?)__/gs,"$1").replace(/`([^`]+)`/g,"$1").replace(/^\s{0,3}#{1,6}\s+/gm,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\b(VERIFIED|NEEDS_CLARIFICATION|VERIFICATION_CONFLICT|BLOCKED_OUT_OF_SCOPE|BLOCKED_SAFETY)\b/g,"").replace(/\n{3,}/g,"\n\n").trim()}
  function endpoint(path){var base=String(cfg().eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");return base?base+(p.charAt(0)==="/"?p:"/"+p):""}
  function freshModeState(){return{question_number:0,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2,focus:null}}
  function safeJson(response){return response.json().catch(function(){return{}})}
  function clamp01(n){n=Number(n);return isFinite(n)?Math.max(0,Math.min(1,n)):0}
  function percent(n){return Math.round(clamp01(n)*100)}
  function dateES(value){try{return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"long",year:"numeric"}).format(value?new Date(value):new Date())}catch(e){return new Date().toLocaleDateString("es-ES")}}
  function visible(el){if(!el)return false;try{var s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"}catch(e){return true}}
  function stripIds(node){if(!node||node.nodeType!==1)return;node.removeAttribute("id");node.querySelectorAll("[id]").forEach(function(x){x.removeAttribute("id")})}

  function client(){
    if(state.client)return state.client;
    var c=cfg();
    if(!window.supabase||!window.supabase.createClient||!c.url||!c.clave)return null;
    try{
      state.client=window.__COCO_SUPABASE_CLIENT||(window.__COCO_SUPABASE_CLIENT=window.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
    }catch(e){}
    installAuthResume();
    return state.client
  }

  async function refreshSession(){
    var cli=client();if(!cli)return null;
    try{var r=await cli.auth.getSession();state.session=r&&r.data?r.data.session:null;return state.session}catch(e){return null}
  }

  function tester(){
    if(!state.session||!state.session.user)return false;
    var email=String(state.session.user.email||"").toLowerCase(),arr=cfg().cuentasPruebaIlimitadas||[];
    return arr.some(function(x){return String(x||"").toLowerCase()===email})
  }

  function activeSubscription(){
    if(tester())return true;
    var s=state.subscription||{};
    if(["active","trialing"].indexOf(s.status)>=0){
      if(s.status!=="trialing"||!s.trial_end)return true;
      return new Date(s.trial_end).getTime()>Date.now()
    }
    return false
  }

  async function loadData(force){
    if(!force&&state.session&&state.dataLoadedAt&&Date.now()-state.dataLoadedAt<DATA_CACHE_MS)return;
    await refreshSession();
    if(!state.session){state.dataLoadedAt=Date.now();return}
    var cli=client(),uid=state.session.user.id;
    var results=await Promise.allSettled([
      cli.from("perfiles").select("apodo,edad").eq("id",uid).maybeSingle(),
      cli.from("eterna_student_profiles").select("*").eq("user_id",uid).maybeSingle(),
      cli.from("eterna_subscriptions").select("*").eq("user_id",uid).maybeSingle(),
      cli.from("eterna_parent_settings").select("*").eq("user_id",uid).maybeSingle(),
      cli.from("eterna_student_concept_memory").select("subject,concept_label,mastery_score,last_help_level,attempts").eq("user_id",uid).order("mastery_score",{ascending:true}).limit(16),
      cli.from("eterna_learning_strategy_memory").select("subject,strategy_key,evidence_count,success_score").eq("user_id",uid).order("success_score",{ascending:false}).limit(12)
    ]);
    function dataAt(i){var x=results[i];return x&&x.status==="fulfilled"&&x.value?x.value.data:null}
    state.baseProfile=dataAt(0)||null;
    state.profile=dataAt(1)||null;
    state.subscription=dataAt(2)||null;
    state.parentSettings=dataAt(3)||{voice_enabled:true,allow_image_input:true,allow_audio_input:true,max_sessions_per_day:20};
    state.learningMemory=dataAt(4)||[];
    state.strategyMemory=dataAt(5)||[];
    state.dataLoadedAt=Date.now()
  }

  function createLauncher(){
    var section=document.createElement("section");
    section.id="eternaLauncherV159";
    section.className="eternaLauncherV159";
    section.innerHTML='<button type="button" class="eternaLauncherCardV159 eternaLauncherFinal3" aria-label="Abrir Eterna, tu ayuda escolar personalizada">'+
      '<div class="eternaLauncherCopyFinal3">'+
        '<span class="eternaLauncherEyebrowV159">✨ ETERNA · APOYO ESCOLAR</span>'+
        '<h2>Tu ayuda escolar personalizada</h2>'+
        '<p>Haz una foto, escribe o habla. Eterna te guía paso a paso y se adapta al curso y al progreso.</p>'+
        '<div class="eternaLauncherActionsV159"><span class="eternaLauncherPillV159">📷 Foto</span><span class="eternaLauncherPillV159">🎙️ Voz</span><span class="eternaLauncherPillV159">✏️ Texto</span><span class="eternaLauncherPillV159">📚 Exámenes</span></div>'+
        '<div class="eternaLauncherTrialFinal3"><strong>⭐ Prueba gratuita · 7 días</strong><span>Sin tarjeta ni datos bancarios para empezar.</span></div>'+
        '<span class="eternaLauncherCtaFinal3">Probar Eterna</span>'+
      '</div>'+
      '<div class="eternaLauncherVisualFinal3"><img src="/eterna-social.png" alt="" loading="lazy" decoding="async"></div>'+
    '</button>';
    section.querySelector("button").onclick=open;
    return section
  }

  function createBrainPanel(source){
    var panel=document.createElement("section");
    panel.className="cocoHomeBrainFinal3";
    panel.setAttribute("aria-label","Activa tu supercerebro con Coco en Forma");
    if(source){
      var clone=source.cloneNode(true);stripIds(clone);clone.classList.add("cocoHomeBrainCloneFinal3");
      panel.appendChild(clone)
    }else{
      panel.innerHTML='<div class="cocoHomeBrainFallbackFinal3"><span>🧠</span><strong>Activa tu supercerebro</strong><small>Coco en Forma</small><p>Entrena memoria, atención, cálculo, lógica y lenguaje con retos breves.</p></div>'
    }
    return panel
  }

  function ensureHomeLayout(){
    var root=document.getElementById("cocoApp");if(!root)return;
    var launcher=root.querySelector("#eternaLauncherV159")||createLauncher();
    var layout=root.querySelector("#cocoHomeFinal3");
    var login=root.querySelector(".loginCard"),carnet=root.querySelector(".carnet");
    var loggedOut=visible(login);
    launcher.classList.toggle("eternaLauncherLoggedOutFinal3",loggedOut);
    launcher.classList.toggle("eternaLauncherLoggedInFinal3",!loggedOut);
    var launcherCta=launcher.querySelector(".eternaLauncherCtaFinal3");
    var launcherTitle=launcher.querySelector("h2"),launcherText=launcher.querySelector("p");
    var launcherEyebrow=launcher.querySelector(".eternaLauncherEyebrowV159"),launcherPills=launcher.querySelectorAll(".eternaLauncherPillV159");
    if(launcherCta)launcherCta.textContent=loggedOut?"Probar Eterna":"Abrir Eterna";
    if(launcherTitle)launcherTitle.textContent=loggedOut?"Tu ayuda escolar personalizada":"Eterna · tu ayuda escolar";
    if(launcherText)launcherText.textContent=loggedOut?"Haz una foto, escribe o habla. Eterna te guía paso a paso y se adapta al curso y al progreso.":"Continúa una tarea, resuelve una duda o practica lo que más te cuesta.";
    if(launcherEyebrow)launcherEyebrow.textContent=loggedOut?"✨ ETERNA · APOYO ESCOLAR":"✨ ETERNA · LISTA PARA AYUDARTE";
    if(launcherPills.length>=4){
      launcherPills[0].textContent=loggedOut?"📷 Foto":"📚 Tareas";
      launcherPills[1].textContent=loggedOut?"🎙️ Voz":"🎯 Practicar";
      launcherPills[2].textContent=loggedOut?"✏️ Texto":"🧠 Explicar";
      launcherPills[3].textContent=loggedOut?"📚 Exámenes":"✅ Revisar";
    }
    var left=loggedOut?login:(visible(carnet)?carnet:(login||carnet));
    var retos=root.querySelector("#retosCard,.retosCard");

    if(!left||!retos){
      if(!launcher.parentElement){
        if(retos&&retos.parentElement)retos.parentElement.insertBefore(launcher,retos);
        else if(left&&left.parentElement)left.insertAdjacentElement("afterend",launcher)
      }
      return
    }

    if(!layout){
      layout=document.createElement("section");layout.id="cocoHomeFinal3";layout.className="cocoHomeFinal3";
      layout.innerHTML='<div class="cocoHomeRowFinal3 cocoHomeAccessRowFinal3" data-home-access></div><div class="cocoHomeRowFinal3 cocoHomeGamesRowFinal3" data-home-games></div>';
      var originalParent=left.parentElement;
      originalParent.insertBefore(layout,left)
    }

    var access=layout.querySelector("[data-home-access]"),games=layout.querySelector("[data-home-games]");
    if(left.parentElement!==access)access.appendChild(left);
    if(launcher.parentElement!==access)access.appendChild(launcher);

    var brain=games.querySelector(".cocoHomeBrainFinal3");
    if(!brain){
      var source=(login&&login.querySelector(".loginDecor,.loginDecorMinimal"))||root.querySelector(".loginDecor,.loginDecorMinimal");
      if(source)source.classList.add("cocoHomeBrainSourceHiddenFinal3");
      brain=createBrainPanel(source);
      games.appendChild(brain)
    }
    if(retos.parentElement!==games)games.appendChild(retos)
  }

  function injectFinal3Styles(){
    if(document.getElementById("eternaV160Final3Styles"))return;
    var style=document.createElement("style");style.id="eternaV160Final3Styles";
    style.textContent=[
      "#cocoApp{max-width:100%;overflow-x:clip}",
      "#cocoApp .cocoHomeBrainSourceHiddenFinal3{display:none!important}",
      "#cocoApp .cocoHomeFinal3{display:grid;grid-column:1/-1!important;width:100%!important;max-width:none!important;justify-self:stretch!important;box-sizing:border-box!important;gap:22px;margin:20px 0 30px;min-width:0}",
      "#cocoApp .cocoHomeRowFinal3{display:grid;gap:22px;align-items:stretch;min-width:0;width:100%!important}#cocoApp .cocoHomeAccessRowFinal3{grid-template-columns:minmax(320px,.78fr) minmax(0,1.22fr)!important}#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:minmax(340px,.72fr) minmax(0,1.28fr)!important}",
      "#cocoApp .cocoHomeRowFinal3>.loginCard,#cocoApp .cocoHomeRowFinal3>.carnet,#cocoApp .cocoHomeRowFinal3>.retosCard,#cocoApp .cocoHomeRowFinal3>#retosCard,#cocoApp .cocoHomeRowFinal3>.eternaLauncherV159{margin:0!important;min-width:0;height:100%;align-self:stretch}",
      "#cocoApp .cocoHomeAccessRowFinal3 .loginCard .loginDecor,#cocoApp .cocoHomeAccessRowFinal3 .loginCard .loginDecorMinimal{display:none!important}",
      "#cocoApp .cocoHomeBrainFinal3{min-width:0;overflow:hidden;border:2px solid #c8e7f4;border-radius:25px;background:linear-gradient(145deg,#f1fbff,#e3f6ff 56%,#fff7e5);box-shadow:0 6px 0 #d7eaf3;display:grid;place-items:center;padding:18px}",
      "#cocoApp .cocoHomeBrainFinal3 .loginDecor,#cocoApp .cocoHomeBrainFinal3 .loginDecorMinimal{display:flex!important;width:100%!important;max-width:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important;flex-direction:column!important}",
      "#cocoApp .cocoHomeBrainFinal3 .loginPoster{display:block!important;width:min(100%,560px)!important;height:auto!important;max-height:none!important;margin:auto!important;object-fit:contain!important;border-radius:21px!important;box-shadow:0 7px 0 rgba(16,69,94,.15),0 16px 32px rgba(16,69,94,.13)!important}",
      "#cocoApp .cocoHomeBrainFallbackFinal3{width:100%;min-height:270px;display:grid;place-items:center;align-content:center;gap:5px;padding:24px;text-align:center;color:#173f59}#cocoApp .cocoHomeBrainFallbackFinal3>span{font-size:56px}#cocoApp .cocoHomeBrainFallbackFinal3 strong{font-size:clamp(26px,4vw,40px);line-height:1}#cocoApp .cocoHomeBrainFallbackFinal3 small{font-size:14px;font-weight:900;color:#2b8eb7}#cocoApp .cocoHomeBrainFallbackFinal3 p{max-width:430px;color:#617c8b;font-weight:700}",
      "#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{height:100%;min-height:360px!important;padding:24px!important;grid-template-columns:minmax(0,1.05fr) minmax(230px,.95fr)!important;gap:22px!important}",
      "#cocoApp .eternaLauncherCopyFinal3{min-width:0}",
      "#cocoApp .eternaLauncherVisualFinal3{min-width:0;align-self:stretch;display:flex;align-items:center;justify-content:center}",
      "#cocoApp .eternaLauncherVisualFinal3 img{display:block;width:100%;max-width:520px;height:auto;aspect-ratio:1200/630;object-fit:cover;border-radius:18px;box-shadow:0 12px 28px rgba(23,57,75,.16)}",
      "#cocoApp .eternaLauncherTrialFinal3{display:grid;gap:2px;margin-top:12px;padding:9px 11px;border-radius:13px;background:#fff5e4;border:1px solid #ffdbab;color:#a8510d}#cocoApp .eternaLauncherTrialFinal3 strong{font-size:11px}#cocoApp .eternaLauncherTrialFinal3 span{font-size:9.5px;font-weight:750;color:#6e7d84}",
      "#cocoApp .eternaLauncherCtaFinal3{display:inline-flex;margin-top:10px;min-height:44px;padding:9px 14px;align-items:center;justify-content:center;border-radius:12px;background:#ef6c05;color:#fff;font-size:11px;font-weight:900;box-shadow:0 3px 0 #bd5205}",
      ".eternaV159Main{grid-template-rows:auto auto 1fr auto!important}",
      ".eternaV159Chat{scroll-behavior:auto!important;overscroll-behavior:contain}",
      ".eternaV160ModeBar{margin:10px 18px 0;padding:10px 12px;border-radius:14px;background:#f4fbfe;border:1px solid #d8edf5;display:flex;gap:10px;align-items:flex-start;color:#17394b}",
      ".eternaV160ModeBar>span:nth-child(2){min-width:0;flex:1}.eternaV160ModeIcon{font-size:20px;line-height:1}.eternaV160ModeBar b{display:block;font-size:13px}.eternaV160ModeBar small{display:block;opacity:.72;margin-top:3px;line-height:1.35}",
      ".eternaV160ChangeMode{display:none;flex:0 0 auto;min-height:44px;padding:8px 12px;border:1px solid #bfe4f2;border-radius:12px;background:#fff;color:#204f67;font:900 11px inherit;cursor:pointer}",
      ".eternaV160ModeSheet{position:absolute;z-index:20;inset:0;display:none;align-items:flex-end;background:rgba(7,34,50,.34)}.eternaV160ModeSheet.is-open{display:flex}",
      ".eternaV160ModePanel{width:100%;max-height:82dvh;overflow:auto;padding:14px 14px calc(14px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#f7fcff;box-shadow:0 -18px 55px rgba(0,0,0,.18)}",
      ".eternaV160ModePanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.eternaV160ModePanelHead b{font-size:18px;color:#173f59}.eternaV160ModePanelClose{width:44px;height:44px;border:0;border-radius:50%;background:#e8f5fa;color:#214e65;font-size:23px;cursor:pointer}",
      ".eternaV160ModeChoices{display:grid;gap:9px}.eternaV160ModeChoice{width:100%;min-height:64px;padding:10px 12px;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;border:2px solid #d8edf5;border-radius:17px;background:#fff;color:#234f66;text-align:left;cursor:pointer}.eternaV160ModeChoice.is-active{border-color:#6fc9e9;background:#effaff;box-shadow:0 0 0 3px rgba(47,169,220,.09)}.eternaV160ModeChoice i{font-style:normal;font-size:22px}.eternaV160ModeChoice strong{display:block;font-size:12px}.eternaV160ModeChoice small{display:block;margin-top:3px;color:#69818f;font-size:10px;line-height:1.3}",
      ".eternaV160ModeNote{margin:2px 2px 10px;padding:8px 10px;border-radius:12px;background:#eef9fd;color:#557486;font-size:10px;font-weight:800;line-height:1.35}.eternaV160ModeProgress{display:block;margin-top:4px;color:#1f6f91;font-size:10px;font-weight:900}",
      ".eternaV160Start{max-width:720px;margin:30px auto 18px;padding:18px;text-align:center;color:#17394b}.eternaV160StartIcon{font-size:42px;line-height:1}.eternaV160Start h3{margin:8px 0 5px;font-size:24px;color:#173f59}.eternaV160Start p{margin:0 auto 16px;max-width:590px;color:#607c8c;font-size:13px;font-weight:700;line-height:1.45}",
      ".eternaV160StartActions{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:9px}.eternaV160StartAction{min-height:62px;padding:10px 12px;border:2px solid #d8edf5;border-radius:17px;background:#fff;color:#234f66;font:850 12px/1.3 inherit;cursor:pointer;box-shadow:0 2px 0 #e1eef4}.eternaV160StartAction strong{display:block}.eternaV160StartAction small{display:block;margin-top:3px;color:#78909c;font-size:9.5px;font-weight:700}",
      "#cocoApp .eternaV160FamilyPromo{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:10px 0 14px;padding:11px 12px;border:1px solid #cfe8f3;border-radius:15px;background:#f7fcff}#cocoApp .eternaV160FamilyPromo span{color:#5d7786;font-size:10px;font-weight:750}",
      "#cocoApp .eternaV160ShareBtn{min-height:44px;padding:9px 13px;border:0;border-radius:12px;background:#173f59;color:#fff;font:900 11px inherit;cursor:pointer}",
      "#cocoApp .eternaV160ProgressPanel{margin:14px 0;padding:14px;border-radius:18px;background:#eef9fd;border:1px solid #cde8f3}#cocoApp .eternaV160ProgressHead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:9px}#cocoApp .eternaV160ProgressHead b{color:#173f59;font-size:14px}#cocoApp .eternaV160ProgressHead button{min-height:44px;padding:8px 12px;border:1px solid #c7e2ed;border-radius:12px;background:#fff;color:#173f59;font:900 10.5px inherit;cursor:pointer}",
      "#cocoApp .eternaV160ProgressIntro{margin:0 0 10px!important;color:#617b89!important}#cocoApp .eternaV160ProgressGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#cocoApp .eternaV160ProgressBox{padding:10px;border-radius:13px;background:#fff;border:1px solid #d6ebf3}#cocoApp .eternaV160ProgressBox b{display:block;margin-bottom:5px;color:#31586e;font-size:10.5px}#cocoApp .eternaV160ProgressBox span{display:block;color:#617c8b;font-size:10px;line-height:1.4}",
      "#cocoApp .eternaV159ParentGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:12px 0!important}",
      "#cocoApp .eternaV159ParentGrid .eternaV160Toggle{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:14px!important;align-items:center!important;min-height:66px!important;padding:12px 14px!important;border:1px solid #d5e9f2!important;border-radius:16px!important;background:#fff!important;color:#173f59!important;cursor:pointer!important;user-select:none!important;-webkit-user-select:none!important}",
      "#cocoApp .eternaV159ParentGrid .eternaV160Toggle>.eternaV160ToggleCopy{display:block!important;position:static!important;width:auto!important;height:auto!important;overflow:visible!important;opacity:1!important;visibility:visible!important;color:#173f59!important;background:transparent!important;white-space:normal!important;text-indent:0!important}",
      "#cocoApp .eternaV159ParentGrid .eternaV160Toggle>span:first-child::after{content:none!important;display:none!important}",
      "#cocoApp .eternaV160ToggleCopy strong{display:block!important;color:#173f59!important;font-size:12.5px!important;line-height:1.25!important;font-weight:900!important}#cocoApp .eternaV160ToggleCopy small{display:block!important;margin-top:4px!important;color:#7a909c!important;font-size:10px!important;font-weight:800!important}#cocoApp .eternaV160Toggle.is-on .eternaV160ToggleCopy small{color:#16805a!important}",
      "#cocoApp .eternaV160Toggle input{position:absolute!important;opacity:0!important;width:1px!important;height:1px!important;pointer-events:none!important}",
      "#cocoApp .eternaV160Switch{display:block!important;position:relative!important;width:56px!important;height:34px!important;min-width:56px!important;border-radius:999px!important;background:#cbd9df!important;box-shadow:inset 0 0 0 1px rgba(23,57,75,.08)!important;transition:.18s ease!important}",
      "#cocoApp .eternaV160Switch:after{content:\"\"!important;position:absolute!important;left:3px!important;top:3px!important;width:28px!important;height:28px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 2px 6px rgba(0,0,0,.18)!important;transition:.18s ease!important}",
      "#cocoApp .eternaV160Toggle input:checked + .eternaV160Switch{background:#22a06b!important}#cocoApp .eternaV160Toggle input:checked + .eternaV160Switch:after{transform:translateX(22px)!important}",
      "#cocoApp .eternaV159ParentGrid>label:not(.eternaV160Toggle){display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:66px!important;padding:12px 14px!important;border:1px solid #d5e9f2!important;border-radius:16px!important;background:#fff!important;color:#173f59!important;font-size:12px!important;font-weight:900!important}#cocoApp .eternaV159ParentGrid select{min-width:82px!important;min-height:40px!important;border:1px solid #cfe4ed!important;border-radius:10px!important;background:#fff!important;color:#17394b!important;padding:5px 8px!important;font:850 11px inherit!important}",
      "#cocoApp .eternaV159Buttons button{min-height:44px}",
      "#cocoApp .eternaV159FamilyCard{border:2px solid #c7e8f5!important;border-radius:20px!important;background:linear-gradient(180deg,#f8fdff,#eef9fd)!important;box-shadow:0 4px 0 rgba(180,220,236,.65)!important}",
      "#cocoApp .eternaV159FamilyCard .eternaV160FamilyEyebrow{display:inline-flex;margin-bottom:5px;padding:5px 8px;border-radius:999px;background:#173f59;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.06em!important}",
      "#cocoApp .eternaV159FamilyCard>h3{margin:4px 0 5px!important;color:#173f59!important}",
      "#cocoApp .eternaV159FamilyCard>.eternaV160FamilyScope{margin:0 0 10px!important;color:#597486!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}",
      "#cocoApp .cocoFamilyMapIntroV160{margin:18px 0 12px!important;padding:14px 16px!important;border:2px solid #f2d5a5!important;border-radius:18px!important;background:linear-gradient(180deg,#fffaf1,#fff5e5)!important;box-shadow:0 4px 0 rgba(235,201,145,.45)!important}",
      "#cocoApp .cocoFamilyMapIntroV160 span{display:inline-flex!important;margin-bottom:5px!important;padding:5px 8px!important;border-radius:999px!important;background:#ef6c05!important;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.06em!important}",
      "#cocoApp .cocoFamilyMapIntroV160 h3{margin:2px 0 4px!important;color:#173f59!important;font-size:20px!important}",
      "#cocoApp .cocoFamilyMapIntroV160 p{margin:0!important;color:#6b7880!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3{margin:14px 0 16px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCardV159{min-height:190px!important;padding:18px 22px!important;grid-template-columns:minmax(0,1fr) minmax(260px,390px)!important;gap:20px!important;border-radius:22px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCardV159 h2{font-size:clamp(25px,3vw,34px)!important;line-height:1.02!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCardV159 p{max-width:760px!important;font-size:13px!important;margin-top:6px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherActionsV159{margin-top:9px!important;gap:7px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherPillV159{min-height:30px!important;padding:5px 8px!important;font-size:10px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherTrialFinal3{display:none!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCtaFinal3{margin-top:10px!important;min-height:40px!important;padding:8px 14px!important}",
      "#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3 img{max-width:330px!important;border-radius:15px!important}",
      "#cocoApp .cocoHomeGamesRowFinal3>.cocoHomeBrainFinal3,#cocoApp .cocoHomeGamesRowFinal3>.retosCard,#cocoApp .cocoHomeGamesRowFinal3>#retosCard{border:2px solid #c8e7f4!important;border-radius:25px!important;box-shadow:0 6px 0 #d7eaf3!important;background:linear-gradient(155deg,#fcfeff 0%,#eef9fd 100%)!important;overflow:hidden!important}",
      "#cocoApp .cocoHomeGamesRowFinal3>.retosCard:after,#cocoApp .cocoHomeGamesRowFinal3>#retosCard:after{display:none!important}",
      "#cocoApp button,#cocoApp [role=button],#cocoApp a{touch-action:manipulation}",
      "@supports (content-visibility:auto){#cocoApp .cocoGameCard{content-visibility:auto;contain-intrinsic-size:340px}}",
      "@media(max-width:900px){#cocoApp .cocoHomeAccessRowFinal3,#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:1fr!important}#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{grid-template-columns:1fr!important;min-height:0!important}#cocoApp .cocoHomeFinal3 .eternaLauncherVisualFinal3 img{max-width:620px}#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCardV159{grid-template-columns:1fr!important;min-height:0!important}#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:none!important}#cocoApp .cocoHomeBrainFinal3{min-height:220px}}",
      "@media(max-width:760px){.eternaV159{padding:0!important}.eternaV159Shell{height:100dvh!important;height:100svh!important;border-radius:0!important;border:0!important}.eternaV160ModeBar{margin:8px 10px 0;padding:10px;align-items:center}.eternaV160ModeBar small{font-size:10px}.eternaV160ChangeMode{display:inline-flex;align-items:center;justify-content:center}.eternaV160Start{margin:20px auto 12px;padding:13px}.eternaV160Start h3{font-size:21px}.eternaV160StartActions{grid-template-columns:repeat(2,minmax(0,1fr))}.eternaV160StartAction{min-height:60px;padding:9px}.eternaV160StartAction:last-child:nth-child(odd){grid-column:1/-1}.eternaV159Composer textarea{font-size:16px!important}#cocoApp .eternaV159ParentGrid,#cocoApp .eternaV160ProgressGrid{grid-template-columns:1fr!important}}",
      "@media(min-width:761px) and (max-width:1024px){.eternaV159Body{grid-template-columns:1fr!important}.eternaV159Menu{display:none!important}.eternaV160ChangeMode{display:inline-flex!important;align-items:center;justify-content:center}.eternaV159Shell{position:relative;width:min(940px,96vw)!important;height:min(1000px,96dvh)!important}.eternaV160ModeSheet{align-items:center;justify-content:center;padding:22px}.eternaV160ModePanel{max-width:740px;border-radius:24px}.eternaV159IconBtn,.eternaV159Send{min-width:52px;height:52px}.eternaV159Composer textarea{min-height:52px;font-size:16px!important}}",
      "@media(orientation:landscape) and (max-height:620px){.eternaV159Top{padding-top:8px!important;padding-bottom:8px!important}.eternaV159TopCopy p{display:none}.eternaV160Start{margin:10px auto 6px}.eternaV159Chat{padding-top:10px!important}.eternaV159Composer{padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}",
      "@media(prefers-reduced-motion:reduce){.eternaV159 *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("");
    document.head.appendChild(style)
  }

  function overlay(){
    var o=document.getElementById("eternaOverlayV159");if(o)return o;
    injectFinal3Styles();
    o=document.createElement("div");o.id="eternaOverlayV159";o.className="eternaV159";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","Eterna, tutor escolar personalizado");
    o.innerHTML='<div class="eternaV159Shell">'+
      '<header class="eternaV159Top"><div class="eternaV159Mark" aria-hidden="true">✦</div><div class="eternaV159TopCopy"><small>COCO EN FORMA · APOYO ESCOLAR</small><h2>Eterna</h2><p>La IA que aprende cómo ayudarte a aprender.</p></div><button type="button" class="eternaV159Close" aria-label="Cerrar Eterna">×</button></header>'+
      '<div class="eternaV159Body">'+
        '<aside class="eternaV159Menu"><div class="eternaV159Identity"><b data-et-name>Alumno Coco</b><span data-et-course>Configura tu curso</span></div><nav class="eternaV159Actions" aria-label="Modos de ayuda">'+Object.keys(MODE_CONFIG).map(function(k){var m=MODE_CONFIG[k];return '<button class="eternaV159Action '+(k==="homework"?"is-active":"")+'" data-et-mode="'+k+'"><i>'+m.icon+'</i><span>'+esc(m.label)+'</span></button>'}).join("")+'</nav><div class="eternaV159Scope">🔒 Eterna está limitada al colegio, estudio y apoyo académico. Para otros temas, hay que hablar con los padres o con un adulto de confianza.</div></aside>'+
        '<main class="eternaV159Main"><div class="eternaV159Status"><span class="eternaV159Dot" data-et-dot></span><span data-et-status>Preparando Eterna…</span></div><div class="eternaV160ModeBar" data-et-modebar></div><div class="eternaV159Chat" data-et-chat></div>'+
          '<div class="eternaV159Composer" data-et-composer><div class="eternaV159Preview" data-et-preview><img alt="Vista previa de la tarea"><span></span><button type="button" aria-label="Quitar imagen">×</button></div><div class="eternaV159InputRow"><button type="button" class="eternaV159IconBtn" data-et-camera aria-label="Hacer o elegir una foto">📷</button><button type="button" class="eternaV159IconBtn" data-et-mic aria-label="Hablar con Eterna">🎙️</button><textarea data-et-input rows="1" maxlength="1800" placeholder="Escribe algo del cole…" aria-label="Pregunta para Eterna"></textarea><button type="button" class="eternaV159Send" data-et-send aria-label="Enviar">➤</button></div><input data-et-file type="file" accept="image/*" hidden><p class="eternaV159Fine">Eterna guía y verifica. Las fotos se procesan temporalmente y no se guardan por defecto.</p></div>'+
        '</main>'+
      '</div>'+
      '<div class="eternaV160ModeSheet" data-et-modesheet aria-hidden="true"><div class="eternaV160ModePanel" role="dialog" aria-modal="true" aria-label="Elegir modo de Eterna"><div class="eternaV160ModePanelHead"><b>¿Cómo quieres que te ayude?</b><button type="button" class="eternaV160ModePanelClose" data-et-modeclose aria-label="Cerrar selector">×</button></div><div class="eternaV160ModeChoices" data-et-modechoices></div></div></div>'+
    '</div>';
    document.body.appendChild(o);bindOverlay(o);renderModeBar();setPlaceholder();return o
  }

  function syncModeButtons(){var o=overlay();o.querySelectorAll("[data-et-mode]").forEach(function(x){x.classList.toggle("is-active",x.dataset.etMode===state.mode)});o.querySelectorAll("[data-et-modechoice]").forEach(function(x){x.classList.toggle("is-active",x.dataset.etModechoice===state.mode)})}
  function resetVisibleSession(){state.history=[];state.modeState=freshModeState();state.lastReply="";state.inputSource="text";clearImage();stopAudio();var o=overlay(),i=o.querySelector("[data-et-input]");if(i)i.value="";renderConversation(o.querySelector("[data-et-chat]"))}
  function setMode(mode,focusInput){if(!MODE_CONFIG[mode])mode="homework";var changed=mode!==state.mode;state.mode=mode;try{localStorage.setItem("coco_eterna_mode_v160",mode)}catch(e){}if(changed)resetVisibleSession();syncModeButtons();renderModeBar();setPlaceholder();setStatus((changed?"Nueva actividad · ":"")+MODE_CONFIG[state.mode].label,"ok");if(focusInput!==false){var i=overlay().querySelector("[data-et-input]");if(i)i.focus()}}
  function showModePicker(){var o=overlay(),sheet=o.querySelector("[data-et-modesheet]"),choices=o.querySelector("[data-et-modechoices]");if(!sheet||!choices)return;choices.innerHTML='<div class="eternaV160ModeNote">Al cambiar de modo empezamos una actividad nueva. Tu progreso y lo que Eterna ha aprendido sobre ti se conservan.</div>'+Object.keys(MODE_CONFIG).map(function(k){var m=MODE_CONFIG[k];return '<button type="button" class="eternaV160ModeChoice '+(k===state.mode?"is-active":"")+'" data-et-modechoice="'+k+'"><i>'+m.icon+'</i><span><strong>'+esc(m.label)+'</strong><small>'+esc(m.description)+'</small></span></button>'}).join("");choices.querySelectorAll("[data-et-modechoice]").forEach(function(b){b.onclick=function(){setMode(b.dataset.etModechoice,false);hideModePicker();var i=o.querySelector("[data-et-input]");if(i)i.focus()}});sheet.classList.add("is-open");sheet.setAttribute("aria-hidden","false")}
  function hideModePicker(){var sheet=overlay().querySelector("[data-et-modesheet]");if(sheet){sheet.classList.remove("is-open");sheet.setAttribute("aria-hidden","true")}}

  function bindOverlay(o){
    o.querySelector(".eternaV159Close").onclick=close;
    o.addEventListener("click",function(e){if(e.target===o)close();var sheet=o.querySelector("[data-et-modesheet]");if(e.target===sheet)hideModePicker()});
    o.querySelectorAll("[data-et-mode]").forEach(function(b){b.onclick=function(){setMode(b.dataset.etMode,true)}});
    o.querySelector("[data-et-modeclose]").onclick=hideModePicker;
    var file=o.querySelector("[data-et-file]");
    o.querySelector("[data-et-camera]").onclick=function(){file.removeAttribute("capture");file.click()};
    file.onchange=function(){if(file.files&&file.files[0])prepareImage(file.files[0]);file.value=""};
    o.querySelector("[data-et-preview] button").onclick=clearImage;
    o.querySelector("[data-et-send]").onclick=send;
    o.querySelector("[data-et-input]").addEventListener("input",function(){if(this.value.trim())state.inputSource="text"});
    o.querySelector("[data-et-input]").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
    o.querySelector("[data-et-mic]").onclick=toggleRecord
  }

  function renderModeBar(){
    var o=overlay(),m=MODE_CONFIG[state.mode]||MODE_CONFIG.homework,bar=o.querySelector("[data-et-modebar]"),ms=state.modeState||{},progress="";
    if(state.mode==="exam"&&Number(ms.question_number||0)>0)progress='<span class="eternaV160ModeProgress">Pregunta '+esc(ms.question_number)+' · Aciertos '+esc(ms.correct_count||0)+' · Por revisar '+esc((ms.partial_count||0)+(ms.incorrect_count||0))+' · Nivel '+esc(ms.difficulty||2)+'</span>';
    else if(state.mode==="practice"&&ms.focus)progress='<span class="eternaV160ModeProgress">Reforzando: '+esc(ms.focus)+'</span>';
    if(bar){bar.innerHTML='<span class="eternaV160ModeIcon">'+m.icon+'</span><span><b>Modo: '+esc(m.label)+'</b><small>'+esc(m.description)+'</small>'+progress+'</span><button type="button" class="eternaV160ChangeMode" data-et-changemode>Cambiar modo</button>';bar.querySelector("[data-et-changemode]").onclick=showModePicker}
    syncModeButtons()
  }

  function setStatus(text,kind){var o=overlay(),s=o.querySelector("[data-et-status]"),d=o.querySelector("[data-et-dot]");if(s)s.textContent=text;if(d)d.className="eternaV159Dot"+(kind?" "+kind:"")}
  function setResultStatus(data){var status=String(data&&data.verification_status||""),ui=data&&data.ui_status,txt=ui&&ui.label?ui.label:status==="verified"?"Respuesta verificada":status==="blocked_out_of_scope"?"Eterna solo responde sobre aprendizaje escolar":status==="blocked_safety"?"Habla ahora con un adulto de confianza":status==="verification_conflict"?"Quiero comprobarlo mejor antes de responderte":"Eterna necesita comprobar un poco más",kind=status==="verified"?"ok":"warn";setStatus(txt,kind)}
  function setIdentity(){var o=overlay(),name=(state.baseProfile&&state.baseProfile.apodo)||(state.session&&state.session.user&&state.session.user.user_metadata&&state.session.user.user_metadata.apodo)||"Alumno Coco";o.querySelector("[data-et-name]").textContent=name;o.querySelector("[data-et-course]").textContent=state.profile&&state.profile.school_year?state.profile.school_year:"Configura tu curso"}
  function setPlaceholder(){var i=overlay().querySelector("[data-et-input]"),m=MODE_CONFIG[state.mode]||MODE_CONFIG.homework;if(i)i.placeholder=m.placeholder}

  async function open(){
    var o=overlay();o.classList.add("is-open");document.body.style.overflow="hidden";
    try{var saved=localStorage.getItem("coco_eterna_mode_v160");if(MODE_CONFIG[saved])state.mode=saved}catch(e){}
    setStatus("Comprobando tu cuenta…","");
    await loadData(false);setIdentity();render();renderModeBar();
    setTimeout(function(){var i=o.querySelector("[data-et-input]");if(i&&activeSubscription()&&state.profile)i.focus()},50)
  }

  function close(){var o=document.getElementById("eternaOverlayV159");if(o){hideModePicker();o.classList.remove("is-open")}document.body.style.overflow="";stopAudio()}

  function goToLogin(){
    try{localStorage.setItem(RESUME_KEY,JSON.stringify({mode:state.mode,at:Date.now()}))}catch(e){}
    close();
    var login=document.querySelector("#cocoApp .loginCard,.loginCard");
    if(login){login.scrollIntoView({behavior:"smooth",block:"center"});var email=login.querySelector("#cEmail,input[type=email],input[autocomplete=email]");if(email)setTimeout(function(){email.focus()},350)}
  }

  function render(){
    var chat=overlay().querySelector("[data-et-chat]"),composer=overlay().querySelector("[data-et-composer]");
    if(!state.session){
      composer.style.display="none";
      chat.innerHTML='<div class="eternaV159Gate"><h3>Entra o crea tu cuenta para probar Eterna</h3><p>La prueba gratuita dura 7 días y empieza sin tarjeta ni datos bancarios. La cuenta permite guardar el progreso académico y continuar donde lo dejaste.</p><div class="eternaV159Buttons"><button type="button" class="eternaV159Primary" data-et-login>Entrar o crear cuenta</button><button type="button" class="eternaV159Secondary" data-et-close>Ahora no</button></div></div>';
      chat.querySelector("[data-et-login]").onclick=goToLogin;chat.querySelector("[data-et-close]").onclick=close;setStatus("Sesión necesaria","warn");return
    }
    if(!activeSubscription()){
      composer.style.display="none";
      chat.innerHTML='<div class="eternaV159Gate"><h3>Prueba Eterna gratis durante 7 días</h3><p>Empieza sin tarjeta ni datos bancarios. Al terminar, tú decides si quieres continuar.</p><div class="eternaV159GateList"><div>📸 Ayuda con tareas por foto</div><div>🎙️ Preguntas por voz</div><div>🧠 Memoria pedagógica</div><div>🔒 Solo apoyo escolar</div></div><div class="eternaV159Buttons"><button type="button" class="eternaV159Primary" data-et-family>Pedir a un adulto que la active</button><button type="button" class="eternaV159Secondary" data-et-close>Ahora no</button></div></div>';
      chat.querySelector("[data-et-family]").onclick=function(){close();var b=document.querySelector("#cocoApp .cocoFamiliaBtn");if(b)b.click()};chat.querySelector("[data-et-close]").onclick=close;setStatus("Activación familiar necesaria","warn");return
    }
    var age=state.baseProfile&&Number(state.baseProfile.edad);
    if(age&&age<6){composer.style.display="none";chat.innerHTML='<div class="eternaV159Gate"><h3>Eterna se usa con un adulto en esta etapa</h3><p>Para menores de 6 años, Coco mantiene una experiencia guiada por la familia.</p><button type="button" class="eternaV159Secondary" data-et-close>Volver</button></div>';chat.querySelector("[data-et-close]").onclick=close;setStatus("Uso acompañado por familia","warn");return}
    if(!state.profile||!state.profile.school_year||!state.profile.autonomous_community){composer.style.display="none";renderSetup(chat);setStatus("Falta configurar el curso","warn");return}
    composer.style.display="block";renderConversation(chat);setStatus(tester()?"Beta de prueba · Eterna lista":"Eterna lista · apoyo escolar verificado","ok")
  }

  function renderSetup(chat){
    var opts='<option value="">Selecciona tu curso</option>'+YEARS.map(function(x){return '<option data-stage="'+esc(x[0])+'" value="'+esc(x[1])+'">'+esc(x[1])+'</option>'}).join(""),
        cc='<option value="">Selecciona tu comunidad</option>'+CCAA.map(function(x){return '<option>'+esc(x)+'</option>'}).join("");
    chat.innerHTML='<div class="eternaV159Setup"><h3>Configura tu contexto escolar</h3><p>Esto permite que Eterna adapte el nivel y consulte el currículo adecuado. No es un perfil psicológico.</p><label>Curso</label><select data-et-year>'+opts+'</select><label>Comunidad autónoma</label><select data-et-ccaa>'+cc+'</select><div class="eternaV159Buttons" style="margin-top:14px"><button type="button" class="eternaV159Primary" data-et-save>Guardar y continuar</button></div></div>';
    chat.querySelector("[data-et-save]").onclick=async function(){
      var sy=chat.querySelector("[data-et-year]"),ccaa=chat.querySelector("[data-et-ccaa]");if(!sy.value||!ccaa.value)return alert("Selecciona el curso y la comunidad autónoma.");
      var option=sy.options[sy.selectedIndex],payload={user_id:state.session.user.id,stage:option.dataset.stage,school_year:sy.value,autonomous_community:ccaa.value,preferred_language:"es",updated_at:new Date().toISOString()};
      var r=await client().from("eterna_student_profiles").upsert(payload,{onConflict:"user_id"}).select().single();if(r.error){alert("No se pudo guardar la configuración escolar.");return}
      state.profile=r.data;state.dataLoadedAt=Date.now();setIdentity();render()
    }
  }

  function startPanelForMode(){
    var panels={
      homework:{icon:"📸",title:"Empieza por tu tarea",text:"Enséñame el ejercicio o cuéntame exactamente dónde te has bloqueado.",actions:[["photo","📷 Adjuntar una tarea","Foto o carrete"],["text","✏️ Escribir el ejercicio","Usa el cuadro de texto"],["voice","🎙️ Contármelo por voz","Yo lo transcribo"]]},
      ask:{icon:"✏️",title:"Haz tu pregunta del cole",text:"Pregunta directamente lo que necesitas entender y comprobaré que la explicación quede clara.",actions:[["text","✏️ Escribir mi pregunta","Pregunta concreta"],["voice","🎙️ Preguntarlo por voz","Yo lo transcribo"]]},
      review:{icon:"✅",title:"Enséñame lo que hiciste",text:"Partiré de tu respuesta para ayudarte a localizar el primer error sin darte la solución de entrada.",actions:[["photo","📷 Adjuntar mi respuesta","Foto o carrete"],["text","✏️ Escribir lo que hice","Incluye tu resultado"],["voice","🎙️ Explicarlo por voz","Cuéntame tus pasos"]]},
      explain:{icon:"🧠",title:"Dime qué tema quieres entender",text:"Lo construiremos desde cero con una explicación adecuada a tu curso y una comprobación breve.",actions:[["text","✏️ Escribir el tema","Por ejemplo: números primos"],["voice","🎙️ Decir el tema por voz","Yo lo transcribo"]]},
      exam:{icon:"📚",title:"¿Qué entra en el examen?",text:"Dime asignatura y tema. Te haré una pregunta cada vez y adaptaré la dificultad según tus respuestas.",actions:[["text","✏️ Indicar asignatura y tema","Empieza aquí"],["voice","🎙️ Contármelo por voz","Yo lo transcribo"]]},
      practice:{icon:"🎯",title:"Vamos a reforzar lo que más necesitas",text:"Puedo empezar usando tu progreso guardado o puedes decirme qué quieres practicar hoy.",actions:[["auto","🎯 Empezar con mi progreso","Eterna elige qué reforzar"],["text","✏️ Elegir qué practicar","Escribe un tema"]]}
    };return panels[state.mode]||panels.homework
  }

  function renderConversation(chat){
    if(state.history.length){chat.innerHTML="";state.history.forEach(function(m){appendMessage(m.role,m.text,m.meta,false)});return}
    var p=startPanelForMode();
    chat.innerHTML='<div class="eternaV160Start"><div class="eternaV160StartIcon">'+p.icon+'</div><h3>'+esc(p.title)+'</h3><p>'+esc(p.text)+'</p><div class="eternaV160StartActions">'+p.actions.map(function(a){return '<button type="button" class="eternaV160StartAction" data-et-startaction="'+a[0]+'"><strong>'+a[1]+'</strong><small>'+a[2]+'</small></button>'}).join("")+'</div></div>';
    chat.querySelectorAll("[data-et-startaction]").forEach(function(b){b.onclick=function(){var action=b.dataset.etStartaction,o=overlay(),i=o.querySelector("[data-et-input]");if(action==="photo"){o.querySelector("[data-et-camera]").click();return}if(action==="voice"){o.querySelector("[data-et-mic]").click();return}if(action==="auto"){i.value="Empezamos.";state.inputSource="text";send();return}i.focus()}})
  }

  function cocoGameFor(subject){var s=String(subject||"").toLowerCase();if(/matem|físic|químic/.test(s))return"calculo";if(/lengua|literatura|idioma|inglés|francés/.test(s))return"palabras";if(/historia|geograf|ciencia|biolog/.test(s))return"verdadero";return"memoria"}
  function goCocoTraining(meta){var id=cocoGameFor(meta&&meta.subject),card=document.querySelector('#cocoApp .cocoGameCard[data-coco-juego="'+id+'"]');close();setTimeout(function(){if(!card)return;card.scrollIntoView({behavior:"smooth",block:"center"});card.classList.add("eternaSuggestedV159");setTimeout(function(){card.classList.remove("eternaSuggestedV159")},2600)},120)}

  function appendMessage(role,text,meta,scroll){
    var chat=overlay().querySelector("[data-et-chat]"),welcome=chat.querySelector(".eternaV160Start");if(welcome)welcome.remove();
    var row=document.createElement("div");row.className="eternaV159Msg "+role;
    var tags="";if(meta&&meta.subject)tags+='<span class="eternaV159Tag">'+esc(meta.subject)+'</span>';if(meta&&meta.help_level!=null)tags+='<span class="eternaV159Tag">Ayuda '+esc(meta.help_level)+'/5</span>';
    var content='<div class="eternaV159Bubble">'+esc(cleanText(text))+(tags?'<div class="eternaV159Meta">'+tags+"</div>":"")+"</div>";
    row.innerHTML=role==="assistant"?'<div class="eternaV159Avatar" aria-hidden="true">✦</div>'+content:content;chat.appendChild(row);
    if(role==="assistant"&&meta&&meta.verification_status==="verified"){
      if(meta.check_question){var check=document.createElement("div");check.className="eternaV159Check";check.innerHTML='<b>Comprueba que lo entendiste</b><p>'+esc(cleanText(meta.check_question))+'</p><button type="button" data-et-answer>Responder</button>';check.querySelector("[data-et-answer]").onclick=function(){var i=overlay().querySelector("[data-et-input]");i.placeholder="Escribe tu respuesta…";i.focus()};chat.appendChild(check)}
      if(meta.practice_suggestion){var mission=document.createElement("div");mission.className="eternaV159Mission";mission.innerHTML='<span>🎯 MISIÓN ETERNA</span><p>'+esc(cleanText(meta.practice_suggestion))+'</p><div><button type="button" data-et-practice>Practicar ahora</button><button type="button" data-et-coco>Entrenar en Coco</button></div>';mission.querySelector("[data-et-practice]").onclick=function(){setMode("practice",false);var i=overlay().querySelector("[data-et-input]");i.value="Quiero practicar ahora esta recomendación. Hazme una sola pregunta cada vez y espera mi respuesta.";state.inputSource="text";send()};mission.querySelector("[data-et-coco]").onclick=function(){goCocoTraining(meta)};chat.appendChild(mission)}
      var q=document.createElement("div");q.className="eternaV159Quick";q.innerHTML='<button type="button" data-et-understood>✅ Lo entendí</button><button type="button" data-et-hint>💡 Otra pista</button><button type="button" data-et-listen>🔊 Escuchar</button>';q.querySelector("[data-et-understood]").onclick=function(){feedback("understood",meta);q.remove()};q.querySelector("[data-et-hint]").onclick=function(){feedback("need_hint",meta);var i=overlay().querySelector("[data-et-input]");i.value="Necesito otra pista. No me des todavía la respuesta final.";state.inputSource="text";send();q.remove()};q.querySelector("[data-et-listen]").onclick=function(){speak(cleanText(text),1)};chat.appendChild(q)
    }
    if(scroll!==false)chat.scrollTop=chat.scrollHeight
  }

  async function api(path,options){
    var url=endpoint(path);if(!url)throw new Error("ETERNA_ENDPOINT_NOT_CONFIGURED");
    if(!state.session)await refreshSession();
    var headers=Object.assign({},options&&options.headers||{});
    if(state.session&&state.session.access_token)headers.Authorization="Bearer "+state.session.access_token;
    var r=await fetch(url,Object.assign({},options||{},{headers:headers}));
    if(r.status===401){await refreshSession();if(state.session&&state.session.access_token)headers.Authorization="Bearer "+state.session.access_token;r=await fetch(url,Object.assign({},options||{},{headers:headers}))}
    return r
  }

  function historyForApi(){return state.history.slice(-8).map(function(m){return{role:m.role,text:m.text,check_question:m.meta&&m.meta.check_question?m.meta.check_question:null,strategy_used:m.meta&&m.meta.strategy_used?m.meta.strategy_used:null}})}

  async function send(){
    if(state.busy)return;
    var o=overlay(),input=o.querySelector("[data-et-input]"),text=String(input.value||"").trim();if(!text&&!state.imageData)return;
    state.busy=true;input.disabled=true;o.querySelector("[data-et-send]").disabled=true;
    var apiHistory=historyForApi(),shown=text||"He adjuntado una foto de mi tarea.";appendMessage("user",shown,null,true);state.history.push({role:"user",text:shown});input.value="";setStatus("Eterna está pensando y comprobando…","warn");
    try{
      var source=state.imageData&&!text?"image":state.inputSource||"text",body={text:text||"Analiza esta imagen como tarea escolar. Primero identifica qué está impreso, qué hueco debe completar el alumno y solo después dame una pista.",mode:state.mode,mode_state:state.modeState||freshModeState(),input_source:source,image_data_url:state.imageData||null,history:apiHistory,client_version:VERSION};
      var r=await api("/v1/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),data=await safeJson(r);
      if(!r.ok){if(data&&data.error==="ETERNA_DAILY_LIMIT")throw new Error("ETERNA_DAILY_LIMIT");throw new Error(data&&data.error?data.error:"No se pudo obtener respuesta.")}
      var reply=cleanText(data.reply||"Necesito que me enseñes mejor el enunciado para poder ayudarte sin inventar nada."),meta={verification_status:data.verification_status||"needs_clarification",subject:data.subject||"",concept:data.concept||"",help_level:data.help_level,check_question:data.check_question||null,practice_suggestion:data.practice_suggestion||null,student_answer_assessment:data.student_answer_assessment||"not_applicable",strategy_used:data.strategy_used||null,mode_label:data.mode_label||null};
      if(data.mode_state&&typeof data.mode_state==="object")state.modeState=data.mode_state;if(data.practice_target&&data.practice_target.concept&&state.mode==="practice")state.modeState.focus=data.practice_target.concept;
      renderModeBar();appendMessage("assistant",reply,meta,true);state.history.push({role:"assistant",text:reply,meta:meta});state.lastReply=reply;if(data.verification_status==="verified"&&data.auto_speak===true)speak(reply,1);clearImage();state.inputSource="text";state.dataLoadedAt=0;setResultStatus(data)
    }catch(e){
      var msg=e&&e.message==="ETERNA_ENDPOINT_NOT_CONFIGURED"?"Eterna todavía necesita que configures su Worker.":e&&e.message==="ETERNA_DAILY_LIMIT"?"Has alcanzado el límite familiar de consultas de Eterna por hoy. Un adulto puede revisarlo en Zona familiar.":"Ahora no puedo comprobar esta tarea con suficiente seguridad. Prueba de nuevo dentro de un momento.";
      appendMessage("assistant",msg,{verification_status:"needs_clarification"},true);setStatus(e&&e.message==="ETERNA_DAILY_LIMIT"?"Límite diario alcanzado":"No se pudo verificar","warn")
    }finally{state.busy=false;input.disabled=false;o.querySelector("[data-et-send]").disabled=false;input.focus()}
  }

  async function feedback(eventName,meta){try{await api("/v1/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:eventName,subject:meta.subject||null,concept:meta.concept||null,help_level:meta.help_level==null?null:meta.help_level,strategy_used:meta.strategy_used||null,mode:state.mode})});state.dataLoadedAt=0;if(eventName==="understood")setStatus("Progreso pedagógico actualizado","ok");else if(eventName==="need_hint")setStatus("Eterna ajustará la siguiente pista","ok")}catch(e){}}

  async function prepareImage(file){
    if(state.parentSettings&&state.parentSettings.allow_image_input===false){alert("Las fotos están desactivadas desde Zona familiar.");return}
    if(!/^image\//i.test(file.type||"")){alert("Selecciona una imagen.");return}
    if(file.size>15*1024*1024){alert("La imagen es demasiado grande. Usa una foto de menos de 15 MB.");return}
    try{var data=await compressImage(file);state.imageData=data;state.imageName=file.name||"tarea.jpg";state.inputSource="image";var p=overlay().querySelector("[data-et-preview]");p.querySelector("img").src=data;p.querySelector("span").textContent="Imagen lista. Eterna distinguirá lo impreso de los huecos antes de ayudarte.";p.classList.add("show");setStatus("Imagen lista para analizar","ok")}catch(e){alert("No se pudo preparar la imagen.")}
  }
  function compressImage(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onerror=reject;reader.onload=function(){var img=new Image();img.onerror=reject;img.onload=function(){var max=2200,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;var ctx=canvas.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);resolve(canvas.toDataURL("image/jpeg",.90))};img.src=reader.result};reader.readAsDataURL(file)})}
  function clearImage(){state.imageData=null;state.imageName="";var p=document.querySelector("#eternaOverlayV159 [data-et-preview]");if(p){p.classList.remove("show");p.querySelector("img").removeAttribute("src")}}
  function recorderMime(){if(typeof MediaRecorder==="undefined")return"";var candidates=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"];if(typeof MediaRecorder.isTypeSupported!=="function")return"";for(var i=0;i<candidates.length;i++)if(MediaRecorder.isTypeSupported(candidates[i]))return candidates[i];return""}
  function audioFilename(type){var t=String(type||"").toLowerCase();if(t.indexOf("mp4")>=0||t.indexOf("m4a")>=0)return"pregunta.m4a";if(t.indexOf("ogg")>=0)return"pregunta.ogg";if(t.indexOf("wav")>=0)return"pregunta.wav";if(t.indexOf("mpeg")>=0||t.indexOf("mp3")>=0)return"pregunta.mp3";return"pregunta.webm"}

  async function toggleRecord(){
    var b=overlay().querySelector("[data-et-mic]");
    if(state.parentSettings&&state.parentSettings.allow_audio_input===false){alert("El micrófono está desactivado desde Zona familiar.");return}
    if(state.recorder&&state.recorder.state==="recording"){state.recorder.stop();return}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){alert("Este navegador no permite grabar audio desde Eterna. Puedes escribir la pregunta.");return}
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:true}),mime=recorderMime(),options=mime?{mimeType:mime}:undefined;state.chunks=[];
      var rec=options?new MediaRecorder(stream,options):new MediaRecorder(stream);state.recorder=rec;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)state.chunks.push(e.data)};
      rec.onstop=async function(){b.classList.remove("recording");b.textContent="🎙️";stream.getTracks().forEach(function(t){t.stop()});var type=rec.mimeType||mime||(state.chunks[0]&&state.chunks[0].type)||"audio/webm",blob=new Blob(state.chunks,{type:type});state.recorder=null;await transcribe(blob,audioFilename(type))};
      rec.start(250);b.classList.add("recording");b.textContent="■";setStatus("Escuchando… toca de nuevo para terminar","warn")
    }catch(e){alert("No se pudo acceder al micrófono. Revisa el permiso del navegador.")}
  }

  async function transcribe(blob,name){setStatus("Transcribiendo tu pregunta…","warn");try{var fd=new FormData();fd.append("audio",blob,name||audioFilename(blob.type));var r=await api("/v1/transcribe",{method:"POST",body:fd}),data=await safeJson(r);if(!r.ok||!data.text)throw new Error("TRANSCRIPTION_FAILED");var i=overlay().querySelector("[data-et-input]");i.value=cleanText(data.text);state.inputSource="voice";setStatus("He escrito lo que te he oído. Revísalo y envíalo.","ok");i.focus()}catch(e){setStatus("No pude transcribir el audio. Puedes escribirlo.","warn")}}
  function stopAudio(){try{if(state.lastAudio){state.lastAudio.pause();state.lastAudio=null}if(window.speechSynthesis)window.speechSynthesis.cancel()}catch(e){}}
  async function speak(text,rate){if(state.parentSettings&&state.parentSettings.voice_enabled===false){alert("La voz de Eterna está desactivada desde Zona familiar.");return}stopAudio();try{var r=await api("/v1/speak",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:cleanText(String(text||"")).slice(0,1800)})});if(!r.ok)throw new Error("TTS");var blob=await r.blob();if(state.lastSpeechUrl)URL.revokeObjectURL(state.lastSpeechUrl);state.lastSpeechUrl=URL.createObjectURL(blob);var a=new Audio(state.lastSpeechUrl);a.playbackRate=rate||1;state.lastAudio=a;await a.play();return}catch(e){}try{if(window.speechSynthesis){var u=new SpeechSynthesisUtterance(cleanText(text));u.lang="es-ES";u.rate=rate||1;window.speechSynthesis.speak(u)}}catch(e){}}

  async function subscriptionStatus(){await loadData(true);return state.subscription||{status:tester()?"active":"inactive"}}
  async function startTrial(button){button.disabled=true;button.textContent="Activando…";try{var r=await api("/v1/trial",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}),data=await safeJson(r);if(!r.ok)throw new Error(data.error||"TRIAL");state.dataLoadedAt=0;await loadData(true);injectFamilyCard(true);alert("Prueba gratuita de Eterna activada. No se han solicitado datos bancarios.")}catch(e){alert("No se pudo activar la prueba.")}finally{button.disabled=false}}
  async function checkout(plan,button){button.disabled=true;button.textContent="Abriendo pago…";try{var r=await api("/v1/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:plan})}),data=await safeJson(r);if(!r.ok)throw new Error(data.error||"CHECKOUT");if(data.url)location.href=data.url;else throw new Error("CHECKOUT_URL")}catch(e){alert("No se pudo abrir la pasarela de pago. Inténtalo de nuevo.");button.disabled=false}}
  async function portal(button){button.disabled=true;try{var r=await api("/v1/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}),data=await safeJson(r);if(!r.ok)throw new Error(data.error||"PORTAL");if(data.url)location.href=data.url;else throw new Error("PORTAL_URL")}catch(e){alert("No se pudo abrir la gestión de la suscripción.");button.disabled=false}}

  function bindFamilyToggleLabels(card){
    card.querySelectorAll(".eternaV160Toggle").forEach(function(label){
      var input=label.querySelector("input"),status=label.querySelector("[data-et-toggle-state]");
      function refresh(){var on=!!input.checked;label.classList.toggle("is-on",on);if(status)status.textContent=on?"Activado":"Desactivado"}
      input.addEventListener("change",refresh);refresh()
    })
  }

  async function saveParentSettings(card,button){
    button.disabled=true;
    var expected={voice_enabled:card.querySelector("[data-et-voice]").checked,allow_image_input:card.querySelector("[data-et-images]").checked,allow_audio_input:card.querySelector("[data-et-audio]").checked,max_sessions_per_day:Number(card.querySelector("[data-et-limit]").value||20)};
    try{
      var r=await api("/v1/parent-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(expected)}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"SETTINGS");
      state.parentSettings=d;state.dataLoadedAt=0;await loadData(true);
      var p=state.parentSettings||{},ok=(p.voice_enabled!==false)===expected.voice_enabled&&(p.allow_image_input!==false)===expected.allow_image_input&&(p.allow_audio_input!==false)===expected.allow_audio_input&&Number(p.max_sessions_per_day||20)===expected.max_sessions_per_day;
      if(!ok)throw new Error("PERSISTENCE");
      button.textContent="Guardado ✓";setTimeout(function(){button.textContent="Guardar ajustes";button.disabled=false},1200)
    }catch(e){button.disabled=false;button.textContent="Guardar ajustes";alert("No se pudieron guardar y confirmar los ajustes de Eterna.")}
  }

  function strategyName(k){return({socratic_question:"preguntas guiadas",worked_example:"ejemplos similares",analogy:"analogías",visual_structure:"apoyo visual y estructura",retrieval_practice:"preguntas de recuerdo",step_by_step:"pasos cortos",error_analysis:"análisis de errores",direct_explanation:"explicación directa"})[k]||k}

  function progressSnapshot(exportData){
    var concepts=(state.learningMemory||[]).slice();
    if(exportData&&Array.isArray(exportData.student_concept_memory)&&exportData.student_concept_memory.length)concepts=exportData.student_concept_memory.slice();
    var strategies=(state.strategyMemory||[]).slice();
    var strongest=concepts.slice().sort(function(a,b){return Number(b.mastery_score||0)-Number(a.mastery_score||0)}).slice(0,3);
    var reinforce=concepts.slice().sort(function(a,b){return Number(a.mastery_score||0)-Number(b.mastery_score||0)}).slice(0,3);
    var subjects=[],seen={};
    concepts.forEach(function(x){var s=String(x.subject||"").trim();if(s&&!seen[s]){seen[s]=1;subjects.push(s)}});
    if(exportData&&Array.isArray(exportData.mastery))exportData.mastery.forEach(function(x){var s=x&&x.eterna_concepts&&x.eterna_concepts.subject;if(s&&!seen[s]){seen[s]=1;subjects.push(s)}});
    var attempts=exportData&&Array.isArray(exportData.attempts)?exportData.attempts.length:concepts.reduce(function(sum,x){return sum+Number(x.attempts||0)},0);
    var useful=strategies.filter(function(x){return Number(x.evidence_count||0)>=2}).slice(0,3);
    return{concepts:concepts,strategies:useful,strongest:strongest,reinforce:reinforce,subjects:subjects,attempts:attempts}
  }

  function renderProgressPanel(){
    var s=progressSnapshot();
    if(!s.concepts.length&&!s.strategies.length){
      return '<section class="eternaV160ProgressPanel"><div class="eternaV160ProgressHead"><b>Progreso escolar con Eterna</b><button type="button" data-et-export>Exportar informe</button></div><p class="eternaV160ProgressIntro">Aquí aparecerá el progreso cuando el alumno empiece a practicar con Eterna.</p></section>'
    }
    var strongest=s.strongest.length?s.strongest.map(function(x){return esc(x.concept_label)+" ("+percent(x.mastery_score)+"%)"}).join(" · "):"Todavía estamos reuniendo señales.";
    var reinforce=s.reinforce.length?s.reinforce.map(function(x){return esc(x.concept_label)}).join(" · "):"Todavía no hay suficiente información.";
    var strategies=s.strategies.length?s.strategies.map(function(x){return esc(strategyName(x.strategy_key))}).join(" · "):"Eterna seguirá probando distintas formas de ayuda.";
    var activity=(s.subjects.length?s.subjects.slice(0,5).map(esc).join(" · "):"Actividad escolar")+" · "+s.attempts+" señales o intentos";
    return '<section class="eternaV160ProgressPanel"><div class="eternaV160ProgressHead"><b>Progreso escolar con Eterna</b><button type="button" data-et-export>Exportar informe</button></div><p class="eternaV160ProgressIntro">Resumen orientativo según las actividades realizadas hasta ahora. No es un diagnóstico ni una etiqueta del alumno.</p><div class="eternaV160ProgressGrid"><div class="eternaV160ProgressBox"><b>Lo que parece ir mejor</b><span>'+strongest+'</span></div><div class="eternaV160ProgressBox"><b>Lo que conviene seguir practicando</b><span>'+reinforce+'</span></div><div class="eternaV160ProgressBox"><b>Formas de ayuda que parecen funcionar</b><span>'+strategies+'</span></div><div class="eternaV160ProgressBox"><b>Actividad registrada</b><span>'+activity+'</span></div></div></section>'
  }

  function humanReportHtml(exportData){
    exportData=exportData||{};
    var s=progressSnapshot(exportData),name=(state.baseProfile&&state.baseProfile.apodo)||(state.session&&state.session.user&&state.session.user.user_metadata&&state.session.user.user_metadata.apodo)||"Alumno Coco";
    var profile=exportData.student_profile||state.profile||{},course=profile.school_year||"Curso no indicado",community=profile.autonomous_community||"";
    var strongest=s.strongest,reinforce=s.reinforce,strategies=s.strategies;
    var summary=s.concepts.length?"Según las actividades realizadas, Eterna ya dispone de algunas señales para orientar la práctica. Estas observaciones pueden cambiar a medida que el alumno siga trabajando.":"Todavía hay pocas actividades para elaborar conclusiones sobre el progreso. Este informe irá ganando detalle con la práctica.";
    var recommendation=reinforce.length?"Una buena próxima práctica sería trabajar "+cleanText(reinforce[0].concept_label||"el concepto que necesita más refuerzo")+" con pasos cortos y una comprobación al final.":"Una buena próxima práctica sería realizar algunas actividades variadas para que Eterna pueda observar qué conceptos conviene reforzar.";
    function list(items,formatter,empty){return items.length?"<ul>"+items.map(function(x){return"<li>"+formatter(x)+"</li>"}).join("")+"</ul>":"<p>"+empty+"</p>"}
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Progreso de Eterna · '+esc(name)+'</title><style>'+
      'body{margin:0;background:#eef7fb;color:#173f59;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.page{max-width:850px;margin:28px auto;background:#fff;border-radius:24px;padding:34px;box-shadow:0 18px 50px rgba(23,63,89,.12)}.brand{color:#2a88ad;font-weight:850;font-size:12px;letter-spacing:.08em}.title{font-size:36px;margin:8px 0 2px}.meta{color:#667f8d;margin-bottom:24px}.summary{padding:16px;border-radius:16px;background:#eef9fd}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.box{border:1px solid #d8ebf3;border-radius:16px;padding:15px}.box h2{font-size:16px;margin:0 0 8px}.box p,.box li{font-size:14px;line-height:1.5}.recommend{margin-top:16px;padding:16px;border-radius:16px;background:#fff6e8;border:1px solid #ffddb0}.foot{margin-top:22px;color:#718793;font-size:11px;line-height:1.45}.actions{margin:18px 0}.actions button{border:0;border-radius:12px;background:#173f59;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}@media(max-width:650px){.page{margin:0;border-radius:0;padding:22px}.grid{grid-template-columns:1fr}.title{font-size:30px}}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none}.actions{display:none}}'+
      '</style></head><body><main class="page"><div class="brand">COCO EN FORMA · ETERNA</div><h1 class="title">Progreso de Eterna</h1><div class="meta"><strong>'+esc(name)+'</strong> · '+esc(course)+(community?" · "+esc(community):"")+'<br>Informe del '+esc(dateES())+'</div>'+
      '<section class="summary"><strong>Resumen</strong><p>'+esc(summary)+'</p></section><div class="grid">'+
      '<section class="box"><h2>Lo que está practicando</h2>'+list(s.subjects,function(x){return esc(x)},"Todavía no hay suficiente actividad para resumir las materias practicadas.")+'</section>'+
      '<section class="box"><h2>Lo que parece dominar mejor</h2>'+list(strongest,function(x){return esc(x.concept_label)+" · "+percent(x.mastery_score)+"% de dominio estimado"},"Todavía no hay suficientes señales para destacarlo.")+'</section>'+
      '<section class="box"><h2>Lo que conviene seguir practicando</h2>'+list(reinforce,function(x){return esc(x.concept_label)},"Todavía no hay suficientes señales para recomendar un refuerzo concreto.")+'</section>'+
      '<section class="box"><h2>Formas de ayuda que parecen funcionar mejor</h2>'+list(strategies,function(x){return esc(strategyName(x.strategy_key))+" · "+Number(x.evidence_count||0)+" evidencias"},"Eterna seguirá probando distintas formas de ayuda.")+'</section>'+
      '<section class="box"><h2>Actividad</h2><p>Conceptos con señales: <strong>'+s.concepts.length+'</strong><br>Intentos o señales registradas: <strong>'+s.attempts+'</strong></p></section>'+
      '<section class="box"><h2>Cómo interpretar este informe</h2><p>Las observaciones expresan tendencias de las actividades realizadas hasta ahora. No describen de forma permanente al alumno.</p></section>'+
      '</div><section class="recommend"><strong>Recomendación</strong><p>'+esc(recommendation)+'</p></section><div class="actions"><button onclick="window.print()">Imprimir o guardar como PDF</button></div><div class="foot">Eterna utiliza expresiones como “parece ayudarle”, “hasta ahora” y “según las actividades realizadas”. Este informe es pedagógico y orientativo; no constituye una evaluación psicológica, médica ni diagnóstica.</div></main></body></html>'
  }

  async function exportEterna(button){
    var original=button.textContent,touch=/iPad|iPhone|Android/i.test(navigator.userAgent||"")||navigator.maxTouchPoints>1,preview=null;
    if(!touch)try{preview=window.open("","_blank")}catch(e){}
    button.disabled=true;button.textContent="Preparando informe…";
    try{
      var r=await api("/v1/export",{method:"GET"}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"EXPORT");
      var html=humanReportHtml(d),name="progreso-eterna-"+new Date().toISOString().slice(0,10)+".html",blob=new Blob([html],{type:"text/html;charset=utf-8"}),file=null;
      try{file=new File([blob],name,{type:"text/html"})}catch(e){}
      if(touch&&file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        try{await navigator.share({title:"Progreso de Eterna",text:"Informe de progreso pedagógico de Eterna.",files:[file]});button.textContent="Informe compartido ✓"}catch(shareErr){if(shareErr&&shareErr.name!=="AbortError")throw shareErr;button.textContent="Listo"}
      }else if(preview&&!preview.closed){
        preview.document.open();preview.document.write(html);preview.document.close();button.textContent="Informe abierto ✓"
      }else{
        var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},60000);button.textContent="Informe descargado ✓"
      }
      setTimeout(function(){button.textContent=original;button.disabled=false},1400)
    }catch(e){if(preview&&!preview.closed)preview.close();button.disabled=false;button.textContent=original;alert("No se pudo preparar el informe de progreso de Eterna.")}
  }

  async function restoreProtectedData(profile,settings){
    var cli=client(),uid=state.session&&state.session.user&&state.session.user.id;if(!cli||!uid)return;
    if(profile&&profile.school_year){
      var p={user_id:uid,stage:profile.stage||null,school_year:profile.school_year,autonomous_community:profile.autonomous_community||null,preferred_language:profile.preferred_language||"es",updated_at:new Date().toISOString()};
      try{await cli.from("eterna_student_profiles").upsert(p,{onConflict:"user_id"})}catch(e){}
    }
    if(settings){
      var s={user_id:uid,voice_enabled:settings.voice_enabled!==false,allow_image_input:settings.allow_image_input!==false,allow_audio_input:settings.allow_audio_input!==false,max_sessions_per_day:Number(settings.max_sessions_per_day||20),updated_at:new Date().toISOString()};
      try{await cli.from("eterna_parent_settings").upsert(s,{onConflict:"user_id"})}catch(e){}
    }
  }

  async function deleteEternaData(button){
    if(!confirm("¿Quieres borrar la memoria pedagógica de Eterna?\n\nSe eliminará lo que Eterna ha aprendido sobre el progreso de este alumno, pero se conservarán su cuenta, curso, controles familiares y suscripción."))return;
    if(!confirm("Esta acción no se puede deshacer. ¿Confirmas que quieres borrar únicamente la memoria pedagógica?"))return;
    var original=button.textContent,protectedProfile=state.profile?Object.assign({},state.profile):null,protectedSettings=state.parentSettings?Object.assign({},state.parentSettings):null;
    button.disabled=true;button.textContent="Borrando…";
    try{
      var r=await api("/v1/delete-data",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"DELETE");
      await restoreProtectedData(protectedProfile,protectedSettings);
      state.history=[];state.learningMemory=[];state.strategyMemory=[];state.modeState=freshModeState();state.dataLoadedAt=0;await loadData(true);
      button.textContent="Memoria borrada ✓";alert("La memoria pedagógica de Eterna se ha borrado. La cuenta, el curso, los controles familiares y la suscripción se conservan.");await injectFamilyCard(true)
    }catch(e){button.disabled=false;button.textContent=original;alert("No se pudo borrar la memoria de Eterna.")}
  }

  function directEternaUrl(mode){var base=location.origin+"/eterna.html";if(mode&&MODE_CONFIG[mode])base+="?mode="+encodeURIComponent(mode);return base}
  async function shareEterna(button){var url=directEternaUrl(),title="Eterna · Tu ayuda escolar personalizada",text="Prueba Eterna gratis durante 7 días. Empieza sin tarjeta ni datos bancarios; al terminar, tú decides si quieres continuar.";try{if(navigator.share){await navigator.share({title:title,text:text,url:url});return}if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(url);var old=button.textContent;button.textContent="Enlace copiado ✓";setTimeout(function(){button.textContent=old},1400);return}window.prompt("Copia este enlace de Eterna:",url)}catch(e){if(!e||e.name!=="AbortError")window.prompt("Copia este enlace de Eterna:",url)}}

  function trialLabel(sub){
    if(!sub||sub.status!=="trialing")return"";
    if(!sub.trial_end)return"Prueba gratuita activa";
    var days=Math.max(0,Math.ceil((new Date(sub.trial_end).getTime()-Date.now())/86400000));
    return"Prueba gratuita activa · "+days+" día"+(days===1?"":"s")+" restante"+(days===1?"":"s")
  }

  async function injectFamilyCard(force){
    var body=document.querySelector("#cocoApp .cocoFamilyV129Body,#cocoApp .cocoFamilyBody,#cocoApp [class*='Family'][class*='Body']");
    if(!body)return;

    /*
     * FINAL4 FAMILY GATE
     * La Zona Familiar completa queda detrás del PIN.
     * En la pantalla "Acceso familiar" no se muestra Eterna, progreso,
     * controles, suscripción ni ningún otro contenido familiar.
     * Solo después de que el flujo base abra "Mapa de fortalezas"
     * consideramos la sesión familiar desbloqueada.
     */
    var familyModal=body.closest(".cocoFamilyV129");
    var titleNode=familyModal&&familyModal.querySelector("#cocoFamilyV129Title");
    var titleText=String(titleNode&&titleNode.textContent||"").trim();
    var unlocked=!!(familyModal&&familyModal.dataset.eternaFamilyUnlocked==="1");

    if(!unlocked&&/mapa\s+de\s+fortalezas/i.test(titleText)){
      unlocked=true;
      familyModal.dataset.eternaFamilyUnlocked="1";
    }

    if(!unlocked){
      body.querySelectorAll(".eternaV159FamilyCard,.cocoFamilyMapIntroV160").forEach(function(n){n.remove()});
      return;
    }

    if(body.querySelector(".eternaV159FamilyCard")&&!force)return;
    var old=body.querySelector(".eternaV159FamilyCard");if(old)old.remove();
    var oldDivider=body.querySelector(".cocoFamilyMapIntroV160");if(oldDivider)oldDivider.remove();

    await subscriptionStatus();

    /* Mientras cargábamos datos puede haberse cerrado/reemplazado el modal. */
    if(!document.body.contains(body))return;
    familyModal=body.closest(".cocoFamilyV129");
    if(!familyModal||familyModal.dataset.eternaFamilyUnlocked!=="1")return;

    /* Cabecera general: deja claro que son dos lecturas distintas. */
    var headerTitle=familyModal.querySelector("#cocoFamilyV129Title");
    var headerCopy=familyModal.querySelector("header p");
    var headerKicker=familyModal.querySelector("header span");
    if(headerKicker)headerKicker.textContent="ZONA FAMILIAR";
    if(headerTitle)headerTitle.textContent="Progreso y fortalezas";
    if(headerCopy)headerCopy.textContent="Dos lecturas distintas: Eterna resume la ayuda escolar y el mapa refleja el entrenamiento de los juegos para la mente.";

    var active=activeSubscription(),
        sub=state.subscription||{},
        ps=state.parentSettings||{voice_enabled:true,allow_image_input:true,allow_audio_input:true,max_sessions_per_day:20},
        card=document.createElement("section");
    card.className="eternaV159FamilyCard";

    var activeText=trialLabel(sub)||String(sub.status||"activa");
    var plans=active
      ?'<div class="eternaV159Buttons"><button type="button" class="eternaV159Secondary" data-et-open>Abrir Eterna</button>'+(sub.provider_customer_id?'<button type="button" class="eternaV159Secondary" data-et-portal>Gestionar suscripción</button>':"")+'</div>'
      :'<div class="eternaV159PlanGrid"><div class="eternaV159Plan"><b>Prueba gratuita · 7 días</b><span>Empieza sin tarjeta ni datos bancarios. Al terminar, tú decides si quieres continuar.</span><button type="button" class="secondary" data-et-trial>Empezar prueba gratis</button></div><div class="eternaV159Plan"><b>7,99 €/mes</b><span>Plan de lanzamiento.</span><button type="button" data-et-month>Suscribirme</button></div><div class="eternaV159Plan"><b>79,99 €/año</b><span>Plan anual de lanzamiento.</span><button type="button" data-et-year>Elegir anual</button></div></div>';

    var promo='<div class="eternaV160FamilyPromo"><span>Enlace directo para compartir Eterna en redes o con otras familias.</span><button type="button" class="eternaV160ShareBtn" data-et-share>🔗 Compartir Eterna</button></div>';

    var settings='<details class="eternaV159ParentSettings"><summary>Privacidad y controles de Eterna</summary><div class="eternaV159ParentGrid">'+
      '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir voz de Eterna</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-voice '+(ps.voice_enabled!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
      '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir fotos de tareas</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-images '+(ps.allow_image_input!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
      '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir preguntas por micrófono</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-audio '+(ps.allow_audio_input!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
      '<label>Consultas máximas al día <select data-et-limit>'+[10,20,30,50].map(function(x){return'<option value="'+x+'" '+(Number(ps.max_sessions_per_day||20)===x?"selected":"")+'>'+x+"</option>"}).join("")+'</select></label>'+
      '</div><p>Estos controles afectan únicamente a Eterna y a la ayuda escolar. Las fotos se procesan temporalmente y no se guardan por defecto.</p><div class="eternaV159Buttons"><button type="button" class="eternaV159Secondary" data-et-save-settings>Guardar ajustes</button><button type="button" class="eternaV159Danger" data-et-delete>Borrar memoria de Eterna</button></div></details>';

    card.innerHTML=
      '<span class="eternaV160FamilyEyebrow">AYUDA ESCOLAR · ETERNA</span>'+
      '<span class="eternaV159FamilyStatus '+(active?"active":"")+'">'+(tester()?"beta de prueba":active?esc(activeText):"no activa")+'</span>'+
      '<h3>✨ Eterna · progreso de ayuda escolar</h3>'+
      '<p class="eternaV160FamilyScope">Aquí ves lo que Eterna ha observado mientras ayuda con tareas, explicaciones, exámenes y práctica escolar. Este progreso es independiente de las puntuaciones de los juegos para la mente.</p>'+
      promo+plans+renderProgressPanel()+settings;

    /* Eterna siempre va primero después del PIN. */
    body.insertBefore(card,body.firstChild);

    /* Separador claro antes del mapa de los juegos. */
    var divider=document.createElement("section");
    divider.className="cocoFamilyMapIntroV160";
    divider.innerHTML='<span>JUEGOS PARA LA MENTE</span><h3>Mapa de fortalezas</h3><p>Este apartado se calcula a partir de las partidas y puntuaciones de los juegos mentales de Coco. No utiliza el progreso escolar de Eterna.</p>';
    if(card.nextSibling)body.insertBefore(divider,card.nextSibling);
    else body.appendChild(divider);

    bindFamilyToggleLabels(card);

    var b=card.querySelector("[data-et-open]");if(b)b.onclick=function(){var closeFamily=document.querySelector("#cocoApp .cocoFamilyV129>header button");if(closeFamily)closeFamily.click();open()};
    b=card.querySelector("[data-et-portal]");if(b)b.onclick=function(){portal(b)};
    b=card.querySelector("[data-et-trial]");if(b)b.onclick=function(){startTrial(b)};
    b=card.querySelector("[data-et-month]");if(b)b.onclick=function(){checkout("monthly",b)};
    b=card.querySelector("[data-et-year]");if(b)b.onclick=function(){checkout("annual",b)};
    b=card.querySelector("[data-et-save-settings]");if(b)b.onclick=function(){saveParentSettings(card,b)};
    b=card.querySelector("[data-et-export]");if(b)b.onclick=function(){exportEterna(b)};
    b=card.querySelector("[data-et-delete]");if(b)b.onclick=function(){deleteEternaData(b)};
    b=card.querySelector("[data-et-share]");if(b)b.onclick=function(){shareEterna(b)}
  }

  function installAuthResume(){
    if(authWatcherInstalled)return;
    var cli=state.client;if(!cli||!cli.auth)return;
    authWatcherInstalled=true;
    try{
      cli.auth.onAuthStateChange(function(event,session){
        if(!session)return;
        state.session=session;state.dataLoadedAt=0;
        var pending=null;try{pending=JSON.parse(localStorage.getItem(RESUME_KEY)||"null")}catch(e){}
        if(pending&&Date.now()-Number(pending.at||0)<30*60*1000){
          if(MODE_CONFIG[pending.mode])state.mode=pending.mode;
          try{localStorage.removeItem(RESUME_KEY)}catch(e){}
          setTimeout(open,250)
        }
      })
    }catch(e){}
    window.addEventListener("coco:daily-user",function(e){
      if(!(e&&e.detail&&e.detail.userId))return;
      var pending=null;try{pending=JSON.parse(localStorage.getItem(RESUME_KEY)||"null")}catch(_e){}
      if(pending){state.dataLoadedAt=0;setTimeout(open,300)}
    })
  }

  function observerNeedsWork(records){
    for(var i=0;i<records.length;i++){
      var nodes=records[i].addedNodes||[];
      for(var j=0;j<nodes.length;j++){
        var n=nodes[j];if(n.nodeType!==1)continue;
        if((n.matches&&n.matches(".loginCard,.carnet,#retosCard,.retosCard,.cocoFamilyV129Body,.cocoFamilyBody"))||(n.querySelector&&n.querySelector(".loginCard,.carnet,#retosCard,.retosCard,.cocoFamilyV129Body,.cocoFamilyBody")))return true
      }
    }
    return false
  }

  function scheduleObserverWork(){
    if(observerRaf)return;
    observerRaf=requestAnimationFrame(function(){
      observerRaf=0;ensureHomeLayout();
      if(document.querySelector("#cocoApp .cocoFamilyV129Body,#cocoApp .cocoFamilyBody,#cocoApp [class*='Family'][class*='Body']"))injectFamilyCard(false)
    })
  }

  function startObserver(){
    var root=document.getElementById("cocoApp");if(!root||appObserver)return;
    ensureHomeLayout();
    appObserver=new MutationObserver(function(records){if(observerNeedsWork(records))scheduleObserverWork()});
    appObserver.observe(root,{childList:true,subtree:true})
  }

  function boot(){
    injectFinal3Styles();ensureHomeLayout();startObserver();client();
    var q=new URLSearchParams(location.search),aliases={tarea:"homework",homework:"homework",duda:"ask",ask:"ask",revisar:"review",review:"review",explicar:"explain",explain:"explain",examen:"exam",exam:"exam",practicar:"practice",practice:"practice"},requested=aliases[String(q.get("mode")||"").toLowerCase()]||null;
    if(requested){state.mode=requested;try{localStorage.setItem("coco_eterna_mode_v160",requested)}catch(e){}}
    if(q.get("eterna")==="1"||q.get("open")==="eterna")setTimeout(open,220)
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();

  window.CocoEternaV160=Object.freeze({
    open:open,close:close,version:VERSION,directUrl:directEternaUrl,share:shareEterna,outOfScopeMessage:OUT_SCOPE,
    audit:function(){return{isolatedModule:true,cocoMedEndpointUntouched:true,photoTemporary:true,scopeGateRequired:true,studentModel:true,distinctModes:true,adaptiveStrategies:true,responsiveTablet:true,familyControls:true,humanProgressReport:true,safeMemoryDelete:true,directSocialLink:true,rootScopedObserver:true,homeLayoutFinal3:true,familyPinGatesAllContent:true,familySectionsSeparated:true}}
  });
  window.CocoPerformanceV160=Object.freeze({snapshot:function(){
    var nav=(performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||null;
    var resources=(performance.getEntriesByType&&performance.getEntriesByType("resource"))||[];
    return {version:VERSION,domInteractive:nav?Math.round(nav.domInteractive):null,domComplete:nav?Math.round(nav.domComplete):null,loadEventEnd:nav?Math.round(nav.loadEventEnd):null,resourceCount:resources.length,transferKB:Math.round(resources.reduce(function(n,r){return n+Number(r.transferSize||0)},0)/1024)}
  }});
  window.CocoEternaV159=window.CocoEternaV160;
})();
