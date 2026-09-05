/* Coco en Forma · ETERNA v160.94.1 MOBILE FIXED VIEWPORT
 * Family lifecycle determinista + Tutor Conversacional V3 + desktop/horizontal.
 * - Home según boceto: acceso/carnet + Eterna, después visual Coco + Juegos.
 * - Un solo sistema de modos.
 * - Controles familiares claros y persistentes.
 * - Un solo bloque de progreso + informe humano.
 * - PWA/tablet/iPad más estable.
 * - Observación DOM acotada.
 */
(function(){
  "use strict";

  var VERSION="160.94.1-mobile-fixed-viewport";
  var DATA_CACHE_MS=15000;
  var RESUME_KEY="coco_eterna_resume_after_auth_v1603";
  var LEARNING_SESSION_KEY="coco_eterna_learning_session_v16091";
  var OUT_SCOPE="Estoy aquí para ayudarte con el cole y con tu aprendizaje. Para cualquier otra duda o tema, habla con tus padres.";

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
    conversationState:null,pedagogicalState:null,learningSessionUser:null,activities:{},activityEpoch:0,
    activeRequest:null,appliedResponses:new Set(),submittedFeedback:new Set(),
    busy:false,recorder:null,chunks:[],lastSpeechUrl:null,lastReply:"",lastAudio:null,lastSpeechButton:null,lastUtterance:null,inputSource:"text",
    dataLoadedAt:0,secondaryLoadedAt:0
  };

  var appObserver=null,observerRaf=0,authWatcherInstalled=false,secondaryDataPromise=null,familyRenderPromise=null,familyRenderBody=null,familyLearningReportCache={at:0,model:null,promise:null};
  var eternaPageLock=null,eternaDesktopOverflow=null,eternaViewportRaf=0;

  var CCAA=["Andalucía","Aragón","Asturias","Illes Balears","Canarias","Cantabria","Castilla-La Mancha","Castilla y León","Cataluña","Comunitat Valenciana","Extremadura","Galicia","Comunidad de Madrid","Región de Murcia","Navarra","País Vasco","La Rioja","Ceuta","Melilla"];
  var YEARS=[
    ["infantil","Infantil · 0–2 años"],["infantil","Infantil · 3 años"],["infantil","Infantil · 4 años"],["infantil","Infantil · 5 años"],
    ["primaria","1º de Primaria"],["primaria","2º de Primaria"],["primaria","3º de Primaria"],["primaria","4º de Primaria"],["primaria","5º de Primaria"],["primaria","6º de Primaria"],
    ["eso","1º de ESO"],["eso","2º de ESO"],["eso","3º de ESO"],["eso","4º de ESO"],
    ["bachillerato","1º de Bachillerato"],["bachillerato","2º de Bachillerato"]
  ];

  function cfg(){return window.COCO_CONFIG||{}}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function cleanText(v){return String(v==null?"":v).replace(/\*\*(.*?)\*\*/gs,"$1").replace(/__(.*?)__/gs,"$1").replace(/`([^`]+)`/g,"$1").replace(/^\s{0,3}#{1,6}\s+/gm,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\b(VERIFIED|NEEDS_CLARIFICATION|VERIFICATION_CONFLICT|BLOCKED_OUT_OF_SCOPE|BLOCKED_SAFETY)\b/g,"").replace(/\n{3,}/g,"\n\n").trim()}
  function cleanMetaText(v){var s=cleanText(v);return /^(?:null|undefined|none|n\/?a|na)$/i.test(s)?"":s}
  function displayUserName(v){var s=cleanText(v).replace(/\s+/g," ").trim();if(!s)return"";return s.replace(/(^|[\s'’-])([a-záéíóúüñ])/g,function(_,sep,ch){return sep+ch.toLocaleUpperCase("es-ES")})}
  function endpoint(path){var base=String(cfg().eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");return base?base+(p.charAt(0)==="/"?p:"/"+p):""}
  function stateContract(){return window.EternaStateContractV3&&Number(window.EternaStateContractV3.CONTRACT_VERSION)===3?window.EternaStateContractV3:null}
  function opaqueId(prefix){var c=stateContract(),id="";try{if(window.crypto&&typeof window.crypto.randomUUID==="function")id=window.crypto.randomUUID()}catch(e){}if(!id)id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2);id=String(prefix||"id")+":"+id;return!c||c.validOpaqueId(id)?id:String(prefix||"id")+":"+Date.now().toString(36)+Math.random().toString(36).slice(2)}
  function freshModeState(){return{question_number:1,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2,focus:null}}
  function freshConversationState(){return{current_topic:null,subject:null,concept:null,student_intent:null,tutor_act:null,expected_student_act:null,explained_points:[],known_points:[],unresolved_question:null,confusion_level:0,help_level:1,last_question_type:null,strategy_used:null,next_teaching_goal:null,last_user_intent:null}}
  function freshPedagogicalState(mode){return{active_topic:null,active_subject:null,active_concept:null,current_mode:mode||state.mode||"homework",pending_question:null,pending_question_id:null,expected_answer_type:"none",expected_key_ideas:[],likely_misconceptions:[],current_help_level:1,last_strategy:null,student_answer_assessment:"not_applicable",conversation_stage:"starting",turn_index:0,last_tutor_act:"none",explained_points:[],known_points:[],unresolved_question:null,expected_student_act:"none",last_question_type:"none",next_teaching_goal:null,confusion_count:0,simplification_level:0,last_student_intent:"none"}}
  function sessionUserId(){return state.session&&state.session.user&&state.session.user.id?String(state.session.user.id):""}
  function currentActivity(){return state.activities[state.mode]||null}
  function activityModeState(activity){activity=activity||currentActivity()||{};return{question_number:Number(activity.question_number||1),correct_count:Number(activity.correct_count||0),partial_count:Number(activity.partial_count||0),incorrect_count:Number(activity.incorrect_count||0),difficulty:Number(activity.difficulty||2),focus:activity.practice_target&&activity.practice_target.label||null}}
  function ensureActivity(mode,replace){var c=stateContract();mode=MODE_CONFIG[mode]?mode:"homework";if(!c)return null;if(replace||!state.activities[mode]||state.activities[mode].mode!==mode||state.activities[mode].phase==="CLOSE")state.activities[mode]=c.createActivityState({mode:mode,session_id:opaqueId("session"),difficulty:2});else state.activities[mode]=c.sanitizeActivityState(state.activities[mode],{mode:mode});if(mode===state.mode)state.modeState=activityModeState(state.activities[mode]);return state.activities[mode]}
  function invalidateInFlight(reason){state.activityEpoch+=1;if(state.activeRequest&&state.activeRequest.controller){try{state.activeRequest.controller.abort(reason||"activity-invalidated")}catch(e){}}state.activeRequest=null;state.busy=false;var o=document.getElementById("eternaOverlayV159");if(o){var input=o.querySelector("[data-et-input]"),button=o.querySelector("[data-et-send]");if(input)input.disabled=false;if(button)button.disabled=false}try{window.dispatchEvent(new CustomEvent("coco:eterna-context-invalidated",{detail:{reason:reason||"activity-invalidated",mode:state.mode}}))}catch(e){}}
  function closeActivity(mode){var c=stateContract(),activity=state.activities[mode];if(!c||!activity)return;var ended=c.transitionActivityState(activity,c.EVENTS.SESSION_CLOSED,{action_id:opaqueId("close"),expected_mode:mode,expected_session_id:activity.session_id});if(ended&&ended.ok)state.activities[mode]=ended.state}
  function clearLearningSession(){try{sessionStorage.removeItem(LEARNING_SESSION_KEY)}catch(e){}state.learningSessionUser=null}
  function resetAccountLearningState(){invalidateInFlight("auth-boundary");clearLearningSession();state.history=[];state.activities={};state.appliedResponses.clear();state.submittedFeedback.clear();ensureActivity(state.mode,true);state.modeState=activityModeState();state.conversationState=freshConversationState();state.pedagogicalState=freshPedagogicalState(state.mode);state.lastReply="";clearImage();stopAudio()}
  function persistLearningSession(){var uid=sessionUserId(),c=stateContract();if(!uid||!c)return;var activities={};Object.keys(state.activities).forEach(function(mode){if(MODE_CONFIG[mode]&&state.activities[mode])activities[mode]=c.toPersistentActivityState(state.activities[mode])});var payload={version:3,user_id:uid,mode:state.mode,activities:activities,saved_at:Date.now()};try{sessionStorage.setItem(LEARNING_SESSION_KEY,JSON.stringify(payload));state.learningSessionUser=uid}catch(e){}}
  function restoreLearningSession(){var uid=sessionUserId(),c=stateContract();if(!uid||!c)return false;if(state.learningSessionUser===uid){ensureActivity(state.mode,false);return true}state.learningSessionUser=uid;var saved=null;try{saved=JSON.parse(sessionStorage.getItem(LEARNING_SESSION_KEY)||"null")}catch(e){}if(!saved||saved.version!==3||saved.user_id!==uid||!MODE_CONFIG[saved.mode]||Date.now()-Number(saved.saved_at||0)>12*60*60*1000){clearLearningSession();state.learningSessionUser=uid;state.activities={};ensureActivity(state.mode,true);return false}state.mode=saved.mode;state.activities={};var interrupted=false;Object.keys(saved.activities||{}).forEach(function(mode){if(!MODE_CONFIG[mode])return;var candidate=c.sanitizeActivityState(saved.activities[mode],{mode:mode});if(candidate.phase!=="ASK"&&candidate.phase!=="CLOSE"){interrupted=true;candidate=c.sanitizeActivityState(Object.assign({},candidate,{phase:"ASK",question_id:null,last_action_id:null}),{mode:mode})}var valid=c.validateActivityRequest(candidate,{expected_mode:mode});if(valid.ok)state.activities[mode]=valid.state});var restored=ensureActivity(state.mode,false);state.modeState=activityModeState(restored);state.conversationState=freshConversationState();state.pedagogicalState=freshPedagogicalState(state.mode);if(interrupted&&!state.history.length)state.history.push({role:"assistant",text:"He recuperado tus contadores y el nivel de la actividad. Para proteger tu privacidad no guardo el texto de la pregunta anterior; continuaremos con una pregunta nueva.",meta:{verification_status:"verified",recovered:true}});return true}
  function preferredStudentName(){return displayUserName((state.baseProfile&&state.baseProfile.apodo)||(state.profile&&state.profile.apodo)||"").split(/\s+/)[0].slice(0,32)}
  state.conversationState=freshConversationState();
  state.pedagogicalState=freshPedagogicalState(state.mode);
  function conversationNorm(v){return cleanText(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[¿?¡!.,;:]+/g," ").replace(/\s+/g," ").trim()}
  function pushUnique(list,value,max){value=cleanText(value);if(!value)return list||[];var out=(list||[]).filter(function(x){return conversationNorm(x)!==conversationNorm(value)});out.push(value);return out.slice(-Math.max(1,Number(max||8)))}
  function lastAssistantTurn(){for(var i=state.history.length-1;i>=0;i--)if(state.history[i].role==="assistant")return state.history[i];return null}
  function pendingTopicLabel(cs){cs=cs||state.conversationState||freshConversationState();return cleanText(cs.concept||cs.current_topic||cs.subject||"el tema que estamos viendo")}
  function resolveContextualTurn(raw){
    var cs=state.conversationState||freshConversationState(),n=conversationNorm(raw),last=lastAssistantTurn(),check=last&&last.meta&&last.meta.check_question?cleanText(last.meta.check_question):cleanText(cs.unresolved_question),topic=pendingTopicLabel(cs),isCheck=cs.expected_student_act==="answer_check"||Boolean(check&&last&&last.meta&&last.meta.check_question);
    var result={text:raw,intent:"question_or_new_topic",directive:null};
    var explicitSwitch=/^(?:(?:vale|ok)\s+)?(?:ahora|otra pregunta|cambiando de tema|cambio de tema)\b/.test(n);
    var explicitNewTopic=explicitSwitch||/^(?:y\s+)?(?:(?:quien|quienes|que|cual|cuales|cuanto|cuantos|donde|cuando)\s+.{3,}|(?:por que|como)\s+.{4,}|define\s+.{3,}|explicame\s+que\s+es\s+.{3,})$/.test(n)&&!/\b(?:eso|esto|aquello|esa|ese|lo anterior|lo de antes|cada cosa|los dos|ambos|el primero|el segundo|el otro)\b/.test(n);
    if(explicitNewTopic){
      state.conversationState=freshConversationState();cs=state.conversationState;result.intent="new_topic";result.directive="EXPLAIN"
    }else if(n==="si"){
      if(isCheck){result.text="Mi respuesta a tu última comprobación es sí. Evalúala usando exactamente la pregunta anterior: "+check;result.intent="answer_check"}
      else{result.text="Sí. Continúa con la explicación que acababas de ofrecer sobre "+topic+" y resuelve lo que quedó pendiente.";result.intent="continue_pending";result.directive="ADVANCE"}
    }else if(n==="no"){
      if(isCheck){result.text="Mi respuesta a tu última comprobación es no. Evalúala usando exactamente la pregunta anterior: "+check;result.intent="answer_check"}
      else{result.text="No. No continúes por la opción que acababas de ofrecer. Mantén el contexto de "+topic+" y espera una nueva pregunta.";result.intent="decline_continuation"}
    }else if(n==="dime"||n==="cuentame"||n==="continua"||n==="sigue"){
      result.text="Continúa ahora con lo que quedó pendiente sobre "+topic+". No repitas lo ya explicado; avanza al siguiente punto útil.";result.intent="continue_pending";result.directive="ADVANCE"
    }else if(n==="por que"||n==="y por que"){
      result.text="Explica por qué ocurre lo que acabamos de mencionar sobre "+topic+". Responde a la causa de la referencia anterior, sin cambiar de tema.";result.intent="ask_cause";result.directive="EXPLAIN_CAUSE"
    }else if(n==="como"||n==="y como"){
      result.text="Explica cómo funciona o cómo ocurre lo que acabamos de mencionar sobre "+topic+". Describe el mecanismo de la referencia anterior, sin cambiar de tema.";result.intent="ask_mechanism";result.directive="EXPLAIN_MECHANISM"
    }else if(n==="y despues"||n==="despues"){
      result.text="Continúa con la siguiente etapa causal o temporal de lo que estábamos explicando sobre "+topic+". No vuelvas al principio.";result.intent="advance_sequence";result.directive="ADVANCE"
    }else if(/^(no entendi|no lo entendi|no entiendo|no lo entiendo|sigo sin entender)$/.test(n)){
      result.text="No lo entendí. Explícame de nuevo "+topic+" con una estrategia realmente distinta: cambia la representación, analogía o ejemplo y divide la idea en menos pasos. No reformules simplemente la misma explicación.";result.intent="confused";result.directive="CHANGE_STRATEGY";cs.confusion_level=Math.min(5,Number(cs.confusion_level||0)+1)
    }else if(/^(otra vez|repitelo|repite|dimelo otra vez|dilo otra vez|explicamelo otra vez)$/.test(n)){
      result.text="Explícame de nuevo "+topic+" con una estrategia realmente distinta. No repitas la misma formulación: cambia de representación, ejemplo, analogía o pasos y parte de lo que ya estaba explicado.";result.intent="confused";result.directive="CHANGE_STRATEGY";cs.confusion_level=Math.min(5,Number(cs.confusion_level||0)+1)
    }else if(/^(mas facil|mas sencillo|simplifica)$/.test(n)){
      result.text="Explícame "+topic+" más fácil: menos palabras, menos abstracción y menos pasos, pero mantén la precisión. No repitas literalmente la respuesta anterior.";result.intent="simplify";result.directive="SIMPLIFY";cs.confusion_level=Math.min(5,Number(cs.confusion_level||0)+1)
    }else if(/^(mas dificil|mas tecnico|profundiza)$/.test(n)){
      result.text="Explícame "+topic+" con más profundidad técnica y abstracción, manteniendo el contexto anterior y sin repetir lo ya explicado.";result.intent="deepen";result.directive="ADVANCE"
    }else if(/\b(?:cada cosa|los dos|ambos|el primero|el segundo|el otro|lo anterior|lo de antes)\b/.test(n)&&last){
      result.text=raw;result.intent="contextual_reference";result.directive="RESOLVE_CONTEXT"
    }else if(isCheck){
      /* v160.88.1: cualquier respuesta académica normal a una comprobación
         pendiente se conserva literal y se etiqueta como answer_check. Los
         comandos contextuales y cambios de tema de arriba mantienen prioridad. */
      result.text=raw;result.intent="answer_check"
    }
    cs.last_user_intent=result.intent;cs.student_intent=result.intent;state.conversationState=cs;return result
  }
  function inferTutorAct(data,reply,turn){
    var cs=state.conversationState||freshConversationState(),assessment=String(data&&data.student_answer_assessment||"not_applicable"),text=conversationNorm(reply);
    if(turn&&turn.intent==="confused")return"CHANGE_STRATEGY";
    if(turn&&turn.intent==="simplify")return"SIMPLIFY";
    if(assessment==="incorrect"||assessment==="partial")return"CORRECT_ERROR";
    if(data&&data.check_question)return"ASK_CHECK";
    if(/quieres que|seguimos|te explico ahora|continuamos/.test(text)&&/\?$/.test(cleanText(reply)))return"OFFER_CONTINUATION";
    if(state.mode==="homework"&&/pista|intenta|primer paso/.test(text))return"GIVE_HINT";
    if(turn&&turn.intent==="advance_sequence")return"ADVANCE";
    return"EXPLAIN"
  }
  function updateConversationState(data,reply,turn,meta){
    var cs=state.conversationState||freshConversationState(),subject=cleanMetaText(data&&data.subject||meta&&meta.subject||""),concept=cleanMetaText(data&&data.concept||meta&&meta.concept||"");
    if(subject)cs.subject=subject;if(concept){cs.concept=concept;cs.current_topic=concept}else if(subject&&!cs.current_topic)cs.current_topic=subject;
    cs.student_intent=turn&&turn.intent||cs.student_intent;cs.last_user_intent=turn&&turn.intent||cs.last_user_intent;cs.help_level=data&&data.help_level!=null?data.help_level:cs.help_level;cs.strategy_used=cleanText(data&&data.strategy_used||meta&&meta.strategy_used||"")||cs.strategy_used;
    cs.tutor_act=inferTutorAct(data,reply,turn);cs.last_question_type=data&&data.check_question?"check":cs.tutor_act==="OFFER_CONTINUATION"?"continuation":null;
    cs.expected_student_act=data&&data.check_question?"answer_check":cs.tutor_act==="OFFER_CONTINUATION"?"yes_no_continuation":null;
    cs.unresolved_question=cleanText(data&&data.check_question||"")||((cs.tutor_act==="OFFER_CONTINUATION")?cleanText(reply):null);
    if(concept)cs.explained_points=pushUnique(cs.explained_points,concept,8);
    if(String(data&&data.student_answer_assessment||"")==="correct"&&concept)cs.known_points=pushUnique(cs.known_points,concept,8);
    if(turn&&["confused","simplify"].indexOf(turn.intent)<0&&String(data&&data.verification_status||"")==="verified")cs.confusion_level=Math.max(0,Number(cs.confusion_level||0)-1);
    cs.next_teaching_goal=cleanText(data&&data.next_teaching_goal||data&&data.practice_target&&data.practice_target.concept||"")||null;
    state.conversationState=cs;return cs
  }
  function responseSimilarity(a,b){
    var aa=new Set(conversationNorm(a).split(/\s+/).filter(function(x){return x.length>2})),bb=new Set(conversationNorm(b).split(/\s+/).filter(function(x){return x.length>2}));if(!aa.size||!bb.size)return 0;var inter=0;aa.forEach(function(x){if(bb.has(x))inter++});return inter/Math.max(aa.size,bb.size)
  }
  function repetitionDirective(turn){
    if(!turn||["confused","simplify","continue_pending","advance_sequence","ask_cause","ask_mechanism","deepen"].indexOf(turn.intent)<0)return null;
    var last=lastAssistantTurn(),previous=null;if(last){for(var i=state.history.length-2;i>=0;i--)if(state.history[i].role==="assistant"){previous=state.history[i];break}}
    var repeated=last&&previous?responseSimilarity(last.text,previous.text)>=.72:false;
    return repeated||turn.intent==="confused"?"Evita repetir la misma formulación. Cambia de representación (analogía, ejemplo, esquema mental o pasos) y avanza desde lo que ya se explicó.":"No repitas lo ya explicado; responde exactamente a la relación contextual pedida por el alumno."
  }
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
    try{var old=sessionUserId(),r=await cli.auth.getSession(),next=r&&r.data?r.data.session:null,nextId=next&&next.user&&next.user.id?String(next.user.id):"";if(old&&old!==nextId)resetAccountLearningState();state.session=next;return state.session}catch(e){return null}
  }

  function masterAccess(){return Boolean(state.baseProfile&&String(state.baseProfile.rol||"").toLowerCase()==="propietario")}

  function activeSubscription(){
    if(masterAccess())return true;
    var s=state.subscription||{};
    if(String(s.status||"").toLowerCase()==="active")return true;
    if(String(s.status||"").toLowerCase()!=="trialing")return false;
    var end=Date.parse(String(s.trial_end||""));
    return Number.isFinite(end)&&end>Date.now()
  }

  function trialExpired(){
    if(masterAccess())return false;
    var s=state.subscription||{},status=String(s.status||"").toLowerCase(),plan=String(s.plan||"").toLowerCase(),end=Date.parse(String(s.trial_end||""));
    return status==="expired"||(status==="trialing"&&(!Number.isFinite(end)||end<=Date.now()))||(plan==="trial"&&status!=="active"&&!activeSubscription())
  }

  function paidPlanCards(){
    return '<div class="eternaV160PaidGrid eternaV160ExpiredPlans">'+
      '<article class="eternaV160PaidPlan"><span class="eternaV160PlanLabel">PLAN MENSUAL</span><b>Mensual</b><strong>7,99 € <small>/mes</small></strong><span>Continúa con Eterna mes a mes.</span><button type="button" data-et-month>Contratar plan mensual</button></article>'+
      '<article class="eternaV160PaidPlan is-annual"><span class="badge">MEJOR PRECIO · AHORRA APROX. 17%</span><span class="eternaV160PlanLabel">PLAN ANUAL</span><b>Anual</b><strong>79,99 € <small>/año</small></strong><span>12 meses de Eterna con el mejor precio.</span><button type="button" data-et-year>Contratar plan anual</button></article>'+
    '</div>'
  }

  function expiredConversionMarkup(showClose){
    return '<section class="eternaV160ExpiredGate" role="region" aria-label="La prueba gratuita de Eterna ha terminado">'+
      '<div class="eternaV160ExpiredHero"><span class="eternaV160ExpiredIcon" aria-hidden="true">⏳</span><div><small>ETERNA · FIN DE LA PRUEBA GRATUITA</small><h3>TUS 7 DÍAS DE PRUEBA DE ETERNA HAN TERMINADO</h3><p>Para seguir utilizando la ayuda escolar personalizada, elige uno de los planes.</p></div></div>'+
      '<div class="eternaV160NoCharge"><b>✓ No se ha realizado ningún cobro automático</b><span>La prueba comenzó sin tarjeta. Solo pagarás si eliges contratar ahora.</span></div>'+
      paidPlanCards()+
      '<p class="eternaV160FreeCoco">🧠 <b>Coco en Forma sigue siendo gratis y sin publicidad.</b></p>'+
      (showClose?'<button type="button" class="eternaV159Secondary eternaV160ExpiredLater" data-et-close>Ahora no</button>':"")+
    '</section>'
  }

  function bindCheckoutPlans(root){
    if(!root)return;var b=root.querySelector("[data-et-month]");if(b)b.onclick=function(){checkout("monthly",b)};
    b=root.querySelector("[data-et-year]");if(b)b.onclick=function(){checkout("annual",b)}
  }

  function perfMark(name){try{performance.mark(name)}catch(e){}}
  function perfMeasure(name,start,end){try{performance.measure(name,start,end)}catch(e){}}

  async function loadSecondaryData(force){
    if(!state.session)return;
    if(!force&&state.secondaryLoadedAt&&Date.now()-state.secondaryLoadedAt<DATA_CACHE_MS)return;
    if(secondaryDataPromise&&!force)return secondaryDataPromise;
    var cli=client(),uid=state.session.user.id;
    var task=(async function(){
      var results=await Promise.allSettled([
        cli.from("eterna_student_concept_memory").select("subject,concept_label,mastery_score,last_help_level,attempts").eq("user_id",uid).order("mastery_score",{ascending:true}).limit(16),
        cli.from("eterna_learning_strategy_memory").select("subject,strategy_key,evidence_count,success_score").eq("user_id",uid).order("success_score",{ascending:false}).limit(12)
      ]);
      function dataAt(i){var x=results[i];return x&&x.status==="fulfilled"&&x.value?x.value.data:null}
      state.learningMemory=dataAt(0)||[];
      state.strategyMemory=dataAt(1)||[];
      state.secondaryLoadedAt=Date.now();
      perfMark("eterna_secondary_data_ready");
      perfMeasure("eterna_critical_to_secondary","eterna_critical_data_ready","eterna_secondary_data_ready")
    })();
    secondaryDataPromise=task.finally(function(){secondaryDataPromise=null});
    return secondaryDataPromise
  }

  function scheduleSecondaryData(){
    var run=function(){loadSecondaryData(false).catch(function(){})};
    if("requestIdleCallback" in window)window.requestIdleCallback(run,{timeout:900});
    else setTimeout(run,180)
  }

  async function loadData(force){
    if(!force&&state.session&&state.dataLoadedAt&&Date.now()-state.dataLoadedAt<DATA_CACHE_MS){scheduleSecondaryData();return}
    await refreshSession();
    if(!state.session){state.dataLoadedAt=Date.now();return}
    var cli=client(),uid=state.session.user.id;
    var results=await Promise.allSettled([
      cli.from("perfiles").select("apodo,edad,rol").eq("id",uid).maybeSingle(),
      cli.from("eterna_student_profiles").select("*").eq("user_id",uid).maybeSingle(),
      cli.from("eterna_subscriptions").select("*").eq("user_id",uid).maybeSingle(),
      cli.from("eterna_parent_settings").select("*").eq("user_id",uid).maybeSingle()
    ]);
    function dataAt(i){var x=results[i];return x&&x.status==="fulfilled"&&x.value?x.value.data:null}
    state.baseProfile=dataAt(0)||null;
    state.profile=dataAt(1)||null;
    state.subscription=dataAt(2)||null;
    state.parentSettings=dataAt(3)||{voice_enabled:true,allow_image_input:true,allow_audio_input:true,max_sessions_per_day:20};
    state.dataLoadedAt=Date.now();
    perfMark("eterna_critical_data_ready");
    perfMeasure("eterna_open_to_critical","eterna_open_click","eterna_critical_data_ready");
    if(force)await loadSecondaryData(true);else scheduleSecondaryData()
  }

  function rememberEternaAfterAuth(){
    try{localStorage.setItem(RESUME_KEY,JSON.stringify({mode:state.mode,at:Date.now()}))}catch(e){}
  }

  function findCreateAccountControl(){
    var root=document.querySelector("#cocoApp .loginCard")||document.getElementById("cocoApp");
    if(!root)return null;
    var nodes=root.querySelectorAll("button,a,[role='button']");
    for(var i=0;i<nodes.length;i++){
      if(/^\s*crear\s+cuenta\s*$/i.test(String(nodes[i].textContent||"")))return nodes[i]
    }
    return null
  }

  function goDirectlyToCreateAccount(){
    rememberEternaAfterAuth();
    var control=findCreateAccountControl();
    if(control){
      try{control.click();return true}catch(e){}
    }
    var login=document.querySelector("#cocoApp .loginCard");
    if(login)login.scrollIntoView({behavior:"smooth",block:"center"});
    return false
  }

  function announceEternaLogin(){
    var api=root.CocoV144||root.CocoV148;
    if(api&&typeof api.toast==="function")api.toast("Inicia sesión o crea una cuenta para abrir Eterna.","info")
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
        '<div class="eternaLauncherTrialFinal3"><strong>⭐ Prueba gratuita · 7 días</strong><span>Sin tarjeta para empezar · después, 7,99 €/mes si la familia decide continuar.</span><small>Foto, voz o texto → una pista cada vez → comprobación final.</small></div>'+
        '<span class="eternaLauncherCtaFinal3">Probar Eterna</span>'+
      '</div>'+
      '<div class="eternaLauncherVisualFinal3" aria-hidden="true">'+
        '<div class="eternaTabletV160">'+
          '<div class="eternaTabletCameraV160"></div>'+
          '<div class="eternaTabletScreenV160">'+
            '<div class="eternaTabletBrandV160"><span>✦</span><b>Eterna</b></div>'+
            '<strong>Tu ayuda escolar<br>personalizada</strong>'+
            '<small>¿Qué necesitas entender hoy?</small>'+
            '<div class="eternaTabletChoiceV160">📷 Resolver una tarea</div>'+
            '<div class="eternaTabletChoiceV160">🧠 Explícame un tema</div>'+
            '<div class="eternaTabletChoiceV160">📚 Preparar un examen</div>'+
            '<div class="eternaTabletInputV160">Escribe, habla o haz una foto <i>→</i></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</button>';
    var launcherButton=section.querySelector("button");
    launcherButton.onclick=function(event){
      var login=document.querySelector("#cocoApp .loginCard");
      var orangeCta=event&&event.target&&event.target.closest?event.target.closest(".eternaLauncherCtaFinal3"):null;
      if(login&&visible(login))announceEternaLogin();
      if(login&&visible(login)&&orangeCta){
        if(event){event.preventDefault();event.stopPropagation()}
        if(goDirectlyToCreateAccount())return
      }
      open()
    };
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
      "#cocoApp .cocoHomeFinal3{display:grid;grid-column:1/-1!important;width:min(100%,1480px)!important;max-width:1480px!important;justify-self:center!important;box-sizing:border-box!important;gap:20px;margin:18px auto 28px;min-width:0}",
      "#cocoApp .cocoHomeRowFinal3{display:grid;gap:18px;align-items:stretch;min-width:0;width:100%!important}#cocoApp .cocoHomeAccessRowFinal3{grid-template-columns:minmax(300px,.82fr) minmax(520px,1.18fr)!important;grid-auto-flow:row!important}#cocoApp .cocoHomeAccessRowFinal3>.cocoFreemiumV16084{grid-column:1/-1!important;grid-row:1!important;margin:0!important}#cocoApp .cocoHomeAccessRowFinal3>.loginCard,#cocoApp .cocoHomeAccessRowFinal3>.carnet{grid-column:1!important;grid-row:2!important}#cocoApp .cocoHomeAccessRowFinal3>.eternaLauncherV159{grid-column:2!important;grid-row:2!important}#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:minmax(280px,.55fr) minmax(620px,1.45fr)!important}",
      "#cocoApp .cocoHomeRowFinal3>.loginCard,#cocoApp .cocoHomeRowFinal3>.carnet,#cocoApp .cocoHomeRowFinal3>.retosCard,#cocoApp .cocoHomeRowFinal3>#retosCard,#cocoApp .cocoHomeRowFinal3>.eternaLauncherV159{margin:0!important;min-width:0;height:100%;align-self:stretch}",
      "#cocoApp .cocoHomeAccessRowFinal3 .loginCard .loginDecor,#cocoApp .cocoHomeAccessRowFinal3 .loginCard .loginDecorMinimal{display:none!important}",
      "#cocoApp .cocoHomeBrainFinal3{min-width:0;overflow:hidden;border:2px solid #c8e7f4;border-radius:25px;background:linear-gradient(145deg,#f1fbff,#e3f6ff 56%,#fff7e5);box-shadow:0 6px 0 #d7eaf3;display:grid;place-items:center;padding:18px}",
      "#cocoApp .cocoHomeBrainFinal3 .loginDecor,#cocoApp .cocoHomeBrainFinal3 .loginDecorMinimal{display:flex!important;width:100%!important;max-width:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important;flex-direction:column!important}",
      "#cocoApp .cocoHomeBrainFinal3 .loginPoster{display:block!important;width:min(100%,420px)!important;height:auto!important;max-height:360px!important;margin:auto!important;object-fit:contain!important;border-radius:21px!important;box-shadow:0 7px 0 rgba(16,69,94,.15),0 16px 32px rgba(16,69,94,.13)!important}",
      "#cocoApp .cocoHomeBrainFallbackFinal3{width:100%;min-height:270px;display:grid;place-items:center;align-content:center;gap:5px;padding:24px;text-align:center;color:#173f59}#cocoApp .cocoHomeBrainFallbackFinal3>span{font-size:56px}#cocoApp .cocoHomeBrainFallbackFinal3 strong{font-size:clamp(26px,4vw,40px);line-height:1}#cocoApp .cocoHomeBrainFallbackFinal3 small{font-size:14px;font-weight:900;color:#2b8eb7}#cocoApp .cocoHomeBrainFallbackFinal3 p{max-width:430px;color:#617c8b;font-weight:700}",
      "#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{height:100%;min-height:320px!important;padding:22px!important;grid-template-columns:minmax(0,1.08fr) minmax(220px,.92fr)!important;gap:18px!important}",
      "#cocoApp .eternaLauncherCopyFinal3{min-width:0}",
      "#cocoApp .eternaLauncherVisualFinal3{min-width:0;align-self:stretch;display:flex;align-items:center;justify-content:center;padding:4px 2px}",
      "#cocoApp .eternaTabletV160{position:relative;width:min(100%,500px);aspect-ratio:1.35/1;padding:13px;border:8px solid #142331;border-radius:30px;background:#111f2a;box-shadow:0 18px 38px rgba(15,52,72,.22),inset 0 0 0 1px rgba(255,255,255,.18);transform:perspective(900px) rotateY(-7deg) rotateX(1deg);transform-origin:center}",
      "#cocoApp .eternaTabletCameraV160{position:absolute;z-index:2;top:5px;left:50%;width:5px;height:5px;margin-left:-2px;border-radius:50%;background:#314b5c;box-shadow:0 0 0 2px #0c1821}",
      "#cocoApp .eternaTabletScreenV160{height:100%;box-sizing:border-box;padding:17px 18px 15px;border-radius:19px;background:linear-gradient(145deg,#fafdff 0%,#edf8fd 58%,#fff8ec 100%);overflow:hidden;color:#173f59;text-align:left}",
      "#cocoApp .eternaTabletBrandV160{display:flex;align-items:center;gap:7px;margin-bottom:10px}.eternaTabletBrandV160 span{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#ff7900;color:#fff!important;font-size:17px}.eternaTabletBrandV160 b{font-size:18px;color:#173f59}",
      "#cocoApp .eternaTabletScreenV160>strong{display:block;font-size:clamp(20px,2.35vw,31px);line-height:1;color:#173f59}.eternaTabletScreenV160>small{display:block;margin:7px 0 11px;color:#64808f;font-size:10px;font-weight:800}",
      "#cocoApp .eternaTabletChoiceV160{margin:6px 0;padding:8px 10px;border:1px solid #d2e8f2;border-radius:12px;background:#fff;color:#234f66;font-size:10px;font-weight:900;box-shadow:0 2px 0 #e1eef4}",
      "#cocoApp .eternaTabletInputV160{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;padding:8px 8px 8px 10px;border:1px solid #d2e8f2;border-radius:12px;background:rgba(255,255,255,.85);color:#7b919d;font-size:8.5px;font-weight:750}.eternaTabletInputV160 i{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:#ef6c05;color:#fff;font-style:normal;font-size:16px}",
      "#cocoApp .eternaLauncherTrialFinal3{display:grid;gap:2px;margin-top:12px;padding:9px 11px;border-radius:13px;background:#fff5e4;border:1px solid #ffdbab;color:#a8510d}#cocoApp .eternaLauncherTrialFinal3 strong{font-size:11px}#cocoApp .eternaLauncherTrialFinal3 span{font-size:9.5px;font-weight:750;color:#6e7d84}#cocoApp .eternaLauncherTrialFinal3 small{margin-top:3px;font-size:8.8px;font-weight:800;color:#315d73}",
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
      "#cocoApp .eternaV160FamilyEyebrow{display:inline-flex!important;margin:0 0 6px!important;padding:5px 9px!important;border-radius:999px!important;background:#173f59!important;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.07em!important}",
      "#cocoApp .eternaV159FamilyCard>h3{margin:5px 0 5px!important;color:#173f59!important;font-size:21px!important}",
      "#cocoApp .eternaV160FamilyScope{margin:0 0 11px!important;color:#597486!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}",
      "#cocoApp .cocoFamilyMapIntroV160{margin:18px 0 12px!important;padding:14px 16px!important;border:2px solid #f2d5a5!important;border-radius:18px!important;background:linear-gradient(180deg,#fffaf1,#fff5e5)!important;box-shadow:0 4px 0 rgba(235,201,145,.45)!important}",
      "#cocoApp .cocoFamilyMapIntroV160 span{display:inline-flex!important;margin-bottom:5px!important;padding:5px 8px!important;border-radius:999px!important;background:#ef6c05!important;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.07em!important}",
      "#cocoApp .cocoFamilyMapIntroV160 h3{margin:2px 0 4px!important;color:#173f59!important;font-size:20px!important}",
      "#cocoApp .cocoFamilyMapIntroV160 p{margin:0!important;color:#6b7880!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}",
      "#cocoApp .eternaV160TrialActive{margin:12px 0;padding:12px 14px;border:1px solid #ffd39d;border-radius:16px;background:linear-gradient(180deg,#fff8e9,#fff3dc);color:#173f59}",
      "#cocoApp .eternaV160TrialActive b{display:block;font-size:13px;color:#173f59}.eternaV160TrialActive span{display:block;margin-top:3px;color:#6f7f88;font-size:10px;font-weight:750}",
      "#cocoApp .eternaV160UpgradeWrap{margin:12px 0 4px;padding:13px;border:1px solid #d4e8f1;border-radius:18px;background:linear-gradient(180deg,#f8fcff,#f1f9fd)}",
      "#cocoApp .eternaV160UpgradeHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap}.eternaV160UpgradeHead b{color:#173f59;font-size:14px}.eternaV160UpgradeHead span{color:#667f8c;font-size:10px;font-weight:750;max-width:560px}",
      "#cocoApp .eternaV160PaidGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.eternaV160PaidPlan{position:relative;padding:14px;border:1px solid #cfe3ec;border-radius:16px;background:#fff;box-shadow:0 2px 0 #e0edf3}.eternaV160PaidPlan.is-annual{border:2px solid #64cdb7;background:linear-gradient(180deg,#fff,#f4fffb)}",
      "#cocoApp .eternaV160PaidPlan .badge{position:absolute;right:10px;top:10px;padding:4px 7px;border-radius:999px;background:#e8fbf4;color:#15775f;font-size:8.5px;font-weight:900}.eternaV160PaidPlan b{display:block;color:#173f59;font-size:14px}.eternaV160PaidPlan strong{display:block;margin:5px 0 4px;color:#173f59;font-size:22px}.eternaV160PaidPlan span{display:block;color:#6c818d;font-size:9.5px;font-weight:750;line-height:1.35}.eternaV160PaidPlan button{min-height:44px;margin-top:10px;padding:8px 12px;border:0;border-radius:12px;background:#ef6c05;color:#fff;font:900 10.5px inherit;cursor:pointer;box-shadow:0 3px 0 #bd5205}",
      "@media(max-width:640px){#cocoApp .eternaV160PaidGrid{grid-template-columns:1fr}.eternaTabletV160{transform:none!important;width:min(100%,410px)!important}}",
      "#cocoApp .cocoFamilyPin{max-width:560px!important;margin:26px auto!important;padding:4px 10px 16px!important}",
      "#cocoApp .cocoFamilyPin label{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:9px!important;margin:19px 0 14px!important;padding:0!important;position:static!important;background:transparent!important;border:0!important;color:#173f59!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important}",
      "#cocoApp .cocoFamilyPin label input{display:block!important;width:100%!important;box-sizing:border-box!important;margin:0!important;padding:13px 15px!important;min-height:54px!important;border:2px solid #234b61!important;border-radius:15px!important;background:#fff!important;color:#173f59!important;font-size:22px!important;letter-spacing:.28em!important;text-align:center!important;outline:none!important}",
      "#cocoApp .cocoFamilyPin label input:focus{border-color:#2aa7d8!important;box-shadow:0 0 0 4px rgba(42,167,216,.13)!important}",
      "#cocoApp .cocoFamilyPin [data-family-enter]{min-height:50px!important;margin-top:0!important}",
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
      "@media(min-width:901px) and (max-width:1180px){#cocoApp .cocoHomeAccessRowFinal3{grid-template-columns:minmax(280px,.9fr) minmax(440px,1.1fr)!important}#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:minmax(250px,.62fr) minmax(520px,1.38fr)!important}#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{grid-template-columns:minmax(0,1.15fr) minmax(190px,.85fr)!important;padding:18px!important}#cocoApp .cocoHomeBrainFinal3 .loginPoster{max-height:320px!important}}",
      "@media(max-width:900px){#cocoApp .cocoHomeAccessRowFinal3,#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:1fr!important}#cocoApp .cocoHomeAccessRowFinal3>.cocoFreemiumV16084,#cocoApp .cocoHomeAccessRowFinal3>.loginCard,#cocoApp .cocoHomeAccessRowFinal3>.carnet,#cocoApp .cocoHomeAccessRowFinal3>.eternaLauncherV159{grid-column:1!important;grid-row:auto!important}#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{grid-template-columns:1fr!important;min-height:0!important}#cocoApp .cocoHomeFinal3 .eternaLauncherVisualFinal3 img{max-width:620px}#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCardV159{grid-template-columns:1fr!important;min-height:0!important}#cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:none!important}#cocoApp .cocoHomeBrainFinal3{min-height:220px}#cocoApp .cocoHomeBrainFinal3 .loginPoster{max-height:330px!important}}",
      "@media(max-width:760px){.eternaV159{padding:0!important}.eternaV159Shell{height:100svh!important;height:100dvh!important;border-radius:0!important;border:0!important}.eternaV160ModeBar{margin:8px 10px 0;padding:10px;align-items:center}.eternaV160ModeBar small{font-size:10px}.eternaV160ChangeMode{display:inline-flex;align-items:center;justify-content:center}.eternaV160Start{margin:20px auto 12px;padding:13px}.eternaV160Start h3{font-size:21px}.eternaV160StartActions{grid-template-columns:repeat(2,minmax(0,1fr))}.eternaV160StartAction{min-height:60px;padding:9px}.eternaV160StartAction:last-child:nth-child(odd){grid-column:1/-1}.eternaV159Composer textarea{font-size:16px!important}#cocoApp .eternaV159ParentGrid,#cocoApp .eternaV160ProgressGrid{grid-template-columns:1fr!important}}",
      "@media(max-width:760px){html.eternaV160ViewportLocked,html.eternaV160ViewportLocked body{overflow:hidden!important;overscroll-behavior:none!important}#eternaOverlayV159.eternaV159.is-open{position:fixed!important;inset:auto!important;top:var(--eterna-vv-top,0px)!important;left:var(--eterna-vv-left,0px)!important;width:var(--eterna-vv-width,100vw)!important;height:var(--eterna-vv-height,100dvh)!important;min-height:0!important;max-height:none!important;padding:0!important;overflow:hidden!important;overscroll-behavior:none!important;background:#f7fcff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;place-items:stretch!important}#eternaOverlayV159 .eternaV159Shell{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:#f7fcff!important;box-shadow:none!important}#eternaOverlayV159 .eternaV159Top{position:relative!important;z-index:3!important;flex:0 0 auto!important;padding-top:max(12px,env(safe-area-inset-top))!important}#eternaOverlayV159 .eternaV159Body,#eternaOverlayV159 .eternaV159Main{min-height:0!important;height:100%!important;overflow:hidden!important}#eternaOverlayV159 .eternaV159Main{grid-template-rows:auto auto minmax(0,1fr) auto!important}#eternaOverlayV159 .eternaV159Chat{min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}#eternaOverlayV159 .eternaV159Composer{position:relative!important;z-index:3!important;flex:0 0 auto!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important;background:#f9fdff!important}}",
      "@media(min-width:761px) and (max-width:1024px){.eternaV159Body{grid-template-columns:1fr!important}.eternaV159Menu{display:none!important}.eternaV160ChangeMode{display:inline-flex!important;align-items:center;justify-content:center}.eternaV159Shell{position:relative;width:min(940px,96vw)!important;height:min(1000px,96dvh)!important}.eternaV160ModeSheet{align-items:center;justify-content:center;padding:22px}.eternaV160ModePanel{max-width:740px;border-radius:24px}.eternaV159IconBtn,.eternaV159Send{min-width:52px;height:52px}.eternaV159Composer textarea{min-height:52px;font-size:16px!important}}",
      "@media(orientation:landscape) and (max-height:620px){.eternaV159Top{padding-top:8px!important;padding-bottom:8px!important}.eternaV159TopCopy p{display:none}.eternaV160Start{margin:10px auto 6px}.eternaV159Chat{padding-top:10px!important}.eternaV159Composer{padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}",
      "@media(orientation:landscape) and (max-height:620px) and (max-width:1000px){#cocoApp .cocoHomeFinal3{gap:14px!important;margin-top:12px!important}#cocoApp .cocoHomeAccessRowFinal3,#cocoApp .cocoHomeGamesRowFinal3{grid-template-columns:1fr!important}#cocoApp .cocoHomeAccessRowFinal3>*{grid-column:1!important;grid-row:auto!important}#cocoApp .cocoHomeBrainFinal3{min-height:160px!important}#cocoApp .cocoHomeBrainFinal3 .loginPoster{max-height:230px!important}#cocoApp .cocoHomeFinal3 .eternaLauncherFinal3{min-height:0!important;padding:16px!important}}",
      "@media(prefers-reduced-motion:reduce){.eternaV159 *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("");
    document.head.appendChild(style)
  }

  function isEternaMobileViewport(){
    try{return window.matchMedia("(max-width: 760px)").matches}catch(e){return window.innerWidth<=760}
  }

  function syncEternaVisualViewport(){
    if(eternaViewportRaf)cancelAnimationFrame(eternaViewportRaf);
    eternaViewportRaf=requestAnimationFrame(function(){
      eternaViewportRaf=0;
      var o=document.getElementById("eternaOverlayV159");
      if(!o||!o.classList.contains("is-open")||!isEternaMobileViewport())return;
      var vv=window.visualViewport;
      var height=Math.max(1,Math.round(vv&&vv.height||window.innerHeight||document.documentElement.clientHeight||1));
      var width=Math.max(1,Math.round(vv&&vv.width||window.innerWidth||document.documentElement.clientWidth||1));
      var top=Math.max(0,Math.round(vv&&vv.offsetTop||0));
      var left=Math.max(0,Math.round(vv&&vv.offsetLeft||0));
      o.style.setProperty("--eterna-vv-height",height+"px");
      o.style.setProperty("--eterna-vv-width",width+"px");
      o.style.setProperty("--eterna-vv-top",top+"px");
      o.style.setProperty("--eterna-vv-left",left+"px")
    })
  }

  function lockEternaViewport(o){
    if(!isEternaMobileViewport()){if(eternaDesktopOverflow===null)eternaDesktopOverflow=document.body.style.overflow;document.body.style.overflow="hidden";return}
    if(!eternaPageLock){
      var html=document.documentElement,body=document.body;
      eternaPageLock={
        x:window.scrollX||0,y:window.scrollY||0,
        htmlOverflow:html.style.overflow,htmlOverscroll:html.style.overscrollBehavior,
        bodyOverflow:body.style.overflow,bodyOverscroll:body.style.overscrollBehavior,
        bodyPosition:body.style.position,bodyTop:body.style.top,bodyLeft:body.style.left,
        bodyRight:body.style.right,bodyWidth:body.style.width
      };
      html.classList.add("eternaV160ViewportLocked");
      body.classList.add("eternaV160ViewportLocked");
      html.style.overflow="hidden";html.style.overscrollBehavior="none";
      body.style.overflow="hidden";body.style.overscrollBehavior="none";
      body.style.position="fixed";body.style.top=(-eternaPageLock.y)+"px";body.style.left=(-eternaPageLock.x)+"px";body.style.right="0";body.style.width="100%";
      if(window.visualViewport){window.visualViewport.addEventListener("resize",syncEternaVisualViewport);window.visualViewport.addEventListener("scroll",syncEternaVisualViewport)}
      window.addEventListener("resize",syncEternaVisualViewport)
    }
    syncEternaVisualViewport()
  }

  function unlockEternaViewport(){
    var o=document.getElementById("eternaOverlayV159");
    if(o){["--eterna-vv-height","--eterna-vv-width","--eterna-vv-top","--eterna-vv-left"].forEach(function(name){o.style.removeProperty(name)})}
    if(!eternaPageLock){if(eternaDesktopOverflow!==null){document.body.style.overflow=eternaDesktopOverflow;eternaDesktopOverflow=null}return}
    var lock=eternaPageLock,html=document.documentElement,body=document.body;
    eternaPageLock=null;
    if(eternaViewportRaf){cancelAnimationFrame(eternaViewportRaf);eternaViewportRaf=0}
    if(window.visualViewport){window.visualViewport.removeEventListener("resize",syncEternaVisualViewport);window.visualViewport.removeEventListener("scroll",syncEternaVisualViewport)}
    window.removeEventListener("resize",syncEternaVisualViewport);
    html.classList.remove("eternaV160ViewportLocked");body.classList.remove("eternaV160ViewportLocked");
    html.style.overflow=lock.htmlOverflow;html.style.overscrollBehavior=lock.htmlOverscroll;
    body.style.overflow=lock.bodyOverflow;body.style.overscrollBehavior=lock.bodyOverscroll;
    body.style.position=lock.bodyPosition;body.style.top=lock.bodyTop;body.style.left=lock.bodyLeft;body.style.right=lock.bodyRight;body.style.width=lock.bodyWidth;
    requestAnimationFrame(function(){window.scrollTo(lock.x,lock.y)})
  }

  function watchEternaViewport(o){
    if(o.__eternaViewportObserver)return;
    o.__eternaViewportObserver=new MutationObserver(function(){
      if(o.classList.contains("is-open"))lockEternaViewport(o);else unlockEternaViewport()
    });
    o.__eternaViewportObserver.observe(o,{attributes:true,attributeFilter:["class"]})
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
    document.body.appendChild(o);watchEternaViewport(o);bindOverlay(o);renderModeBar();setPlaceholder();return o
  }

  function syncModeButtons(){var o=overlay();o.querySelectorAll("[data-et-mode]").forEach(function(x){x.classList.toggle("is-active",x.dataset.etMode===state.mode)});o.querySelectorAll("[data-et-modechoice]").forEach(function(x){x.classList.toggle("is-active",x.dataset.etModechoice===state.mode)})}
  function syncSendAvailability(){var o=document.getElementById("eternaOverlayV159");if(!o)return;var input=o.querySelector("[data-et-input]"),button=o.querySelector("[data-et-send]"),hasContent=Boolean(input&&input.value.trim()||state.imageData);if(button&&!state.busy)button.disabled=!hasContent}
  function announceUiReset(reason){try{window.dispatchEvent(new CustomEvent("coco:eterna-ui-reset",{detail:{reason:reason||"activity-reset",mode:state.mode}}))}catch(e){}}
  function resetVisibleSession(replaceActivity){invalidateInFlight("activity-reset");state.history=[];if(replaceActivity!==false)ensureActivity(state.mode,true);state.modeState=activityModeState();state.conversationState=freshConversationState();state.pedagogicalState=freshPedagogicalState(state.mode);state.lastReply="";state.inputSource="text";clearImage();stopAudio();persistLearningSession();var o=overlay(),i=o.querySelector("[data-et-input]"),composer=o.querySelector("[data-et-composer]");if(i)i.value="";if(composer)composer.classList.remove("is-complete");renderConversation(o.querySelector("[data-et-chat]"));syncSendAvailability();announceUiReset("activity-reset")}
  function setMode(mode,focusInput){if(!MODE_CONFIG[mode])mode="homework";var previous=state.mode,changed=mode!==previous;if(changed){invalidateInFlight("mode-switch");closeActivity(previous)}state.mode=mode;try{localStorage.setItem("coco_eterna_mode_v160",mode)}catch(e){}if(changed)resetVisibleSession(true);else ensureActivity(mode,false);syncModeButtons();renderModeBar();setPlaceholder();setStatus((changed?"Nueva actividad · ":"")+MODE_CONFIG[state.mode].label,"ok");if(focusInput!==false){var i=overlay().querySelector("[data-et-input]");if(i)i.focus()}}
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
    o.querySelector("[data-et-input]").addEventListener("input",function(){if(this.value.trim())state.inputSource="text";syncSendAvailability()});
    o.querySelector("[data-et-input]").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
    o.querySelector("[data-et-mic]").onclick=toggleRecord;syncSendAvailability()
  }

  function renderModeBar(){
    var o=overlay(),m=MODE_CONFIG[state.mode]||MODE_CONFIG.homework,bar=o.querySelector("[data-et-modebar]"),ms=state.modeState||{},progress="";
    if(state.mode==="exam"&&Number(ms.question_number||0)>0)progress='<span class="eternaV160ModeProgress">Pregunta '+esc(ms.question_number)+' · Aciertos '+esc(ms.correct_count||0)+' · Por revisar '+esc((ms.partial_count||0)+(ms.incorrect_count||0))+' · Nivel '+esc(ms.difficulty||2)+'</span>';
    else if(state.mode==="practice"&&(Number(ms.question_number||0)>0||ms.focus))progress='<span class="eternaV160ModeProgress">Ejercicio '+esc(ms.question_number||0)+' · Aciertos '+esc(ms.correct_count||0)+' · Errores '+esc((ms.partial_count||0)+(ms.incorrect_count||0))+' · Nivel '+esc(ms.difficulty||2)+(ms.focus?' · Reforzando '+esc(ms.focus):'')+'</span>';
    if(bar){bar.innerHTML='<span class="eternaV160ModeIcon">'+m.icon+'</span><span><b>Modo: '+esc(m.label)+'</b><small>'+esc(m.description)+'</small>'+progress+'</span><span class="eternaV160ModeActions"><button type="button" class="eternaV160NewActivity" data-et-newactivity>Nueva actividad</button><button type="button" class="eternaV160ChangeMode" data-et-changemode>Cambiar modo</button></span>';bar.querySelector("[data-et-changemode]").onclick=showModePicker;bar.querySelector("[data-et-newactivity]").onclick=function(){closeActivity(state.mode);resetVisibleSession(true);renderModeBar();setStatus("Nueva actividad · "+m.label,"ok");var i=o.querySelector("[data-et-input]");if(i)i.focus()}}
    syncModeButtons()
  }

  function setStatus(text,kind){var o=overlay(),s=o.querySelector("[data-et-status]"),d=o.querySelector("[data-et-dot]");if(s)s.textContent=text;if(d)d.className="eternaV159Dot"+(kind?" "+kind:"")}
  function setResultStatus(data){var status=String(data&&data.verification_status||""),ui=data&&data.ui_status,txt=status==="verified"?"Eterna lista":status==="blocked_out_of_scope"?"Eterna solo responde sobre aprendizaje escolar":status==="blocked_safety"?"Habla ahora con un adulto de confianza":status==="verification_conflict"?"Eterna está revisando la respuesta":ui&&ui.label?ui.label:"Eterna está revisando la respuesta",kind=status==="verified"?"ok":"warn";setStatus(txt,kind)}
  function setIdentity(){var o=overlay(),name=displayUserName((state.baseProfile&&state.baseProfile.apodo)||(state.session&&state.session.user&&state.session.user.user_metadata&&state.session.user.user_metadata.apodo)||"Alumno Coco")||"Alumno Coco",course=state.profile&&state.profile.school_year?state.profile.school_year:"Configura tu curso",stage=String(state.profile&&state.profile.stage||"").toLowerCase(),teen=/eso|bachillerato/.test(stage+" "+course.toLowerCase());o.querySelector("[data-et-name]").textContent=name;o.querySelector("[data-et-course]").textContent=course;o.dataset.etAgeBand=teen?"teen":"child"}
  function setPlaceholder(){var i=overlay().querySelector("[data-et-input]"),m=MODE_CONFIG[state.mode]||MODE_CONFIG.homework;if(i)i.placeholder=m.placeholder}

  async function open(options){
    var o=overlay();o.classList.add("is-open");lockEternaViewport(o);
    perfMark("eterna_overlay_visible");
    perfMeasure("eterna_click_to_overlay","eterna_open_click","eterna_overlay_visible");
    try{var saved=localStorage.getItem("coco_eterna_mode_v160");if(MODE_CONFIG[saved])state.mode=saved}catch(e){}
    setStatus("Comprobando tu cuenta…","");
    await loadData(Boolean(options&&options.force));restoreLearningSession();setIdentity();render();renderModeBar();syncSendAvailability();
    requestAnimationFrame(function(){var i=o.querySelector("[data-et-input]");if(i&&activeSubscription()&&state.profile)i.focus()})
  }

  function close(){invalidateInFlight("overlay-close");closeActivity(state.mode);persistLearningSession();state.history=[];state.conversationState=freshConversationState();state.pedagogicalState=freshPedagogicalState(state.mode);state.lastReply="";clearImage();var o=document.getElementById("eternaOverlayV159");if(o){hideModePicker();o.classList.remove("is-open")}unlockEternaViewport();stopAudio();announceUiReset("overlay-close")}

  function goToLogin(){
    rememberEternaAfterAuth();
    close();
    var login=document.querySelector("#cocoApp .loginCard,.loginCard");
    if(login){login.scrollIntoView({behavior:"smooth",block:"center"});var email=login.querySelector("#cEmail,input[type=email],input[autocomplete=email]");if(email)requestAnimationFrame(function(){requestAnimationFrame(function(){email.focus()})})}
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
      if(trialExpired()){
        chat.innerHTML=expiredConversionMarkup(true);
        bindCheckoutPlans(chat);chat.querySelector("[data-et-close]").onclick=close;setStatus("La prueba gratuita ha terminado","warn");return
      }
      chat.innerHTML='<div class="eternaV159Gate"><h3>Prueba Eterna gratis durante 7 días</h3><p>Empieza sin tarjeta ni datos bancarios. Al terminar, tú decides si quieres continuar.</p><div class="eternaV159GateList"><div>📸 Ayuda con tareas por foto</div><div>🎙️ Preguntas por voz</div><div>🧠 Memoria pedagógica</div><div>🔒 Solo apoyo escolar</div></div><div class="eternaV159Buttons"><button type="button" class="eternaV159Primary" data-et-family>Pedir a un adulto que la active</button><button type="button" class="eternaV159Secondary" data-et-close>Ahora no</button></div></div>';
      chat.querySelector("[data-et-family]").onclick=function(){close();var b=document.querySelector("#cocoApp .cocoFamiliaBtn");if(b)b.click()};chat.querySelector("[data-et-close]").onclick=close;setStatus("Activación familiar necesaria","warn");return
    }
    if(!state.profile||!state.profile.school_year||!state.profile.autonomous_community){composer.style.display="none";renderSetup(chat);setStatus("Falta configurar el curso","warn");return}
    composer.style.display="block";renderConversation(chat);setStatus("Eterna lista","ok")
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
    if(state.history.length){chat.innerHTML="";state.history.forEach(function(m,index){appendMessage(m.role,m.text,m.meta,false,index===state.history.length-1)});return}
    var p=startPanelForMode(),studentName=preferredStudentName(),startTitle=(studentName?"Hola, "+studentName+". ":"")+p.title;
    chat.innerHTML='<div class="eternaV160Start"><div class="eternaV160StartIcon">'+p.icon+'</div><h3>'+esc(startTitle)+'</h3><p>'+esc(p.text)+'</p><div class="eternaV160StartActions">'+p.actions.map(function(a){return '<button type="button" class="eternaV160StartAction" data-et-startaction="'+a[0]+'"><strong>'+a[1]+'</strong><small>'+a[2]+'</small></button>'}).join("")+'</div></div>';
    chat.querySelectorAll("[data-et-startaction]").forEach(function(b){b.onclick=function(){var action=b.dataset.etStartaction,o=overlay(),i=o.querySelector("[data-et-input]");if(action==="photo"){o.querySelector("[data-et-camera]").click();return}if(action==="voice"){o.querySelector("[data-et-mic]").click();return}if(action==="auto"){i.value="Empezamos.";state.inputSource="text";send();return}i.focus()}})
  }

  function cocoGameFor(subject){var s=String(subject||"").toLowerCase();if(/matem|físic|químic/.test(s))return"calculo";if(/lengua|literatura|idioma|francés/.test(s))return"palabras";if(/historia|geograf|ciencia|biolog/.test(s))return"verdadero";return"memoria"}
  function goCocoTraining(meta){var id=cocoGameFor(meta&&meta.subject),card=document.querySelector('#cocoApp .cocoGameCard[data-coco-juego="'+id+'"]');close();setTimeout(function(){if(!card)return;card.scrollIntoView({behavior:"smooth",block:"center"});card.classList.add("eternaSuggestedV159");setTimeout(function(){card.classList.remove("eternaSuggestedV159")},2600)},120)}

  function messageIsActionable(meta,explicit){var activity=currentActivity(),qid=meta&&meta.question_id;return explicit!==false&&Boolean(activity&&activity.phase==="WAIT"&&qid&&activity.question_id===qid)}
  function removeStaleQuickActions(){var o=document.getElementById("eternaOverlayV159");if(!o)return;o.querySelectorAll(".eternaV159Quick").forEach(function(node){node.remove()});o.querySelectorAll(".eternaV159Check[data-et-actionable]").forEach(function(node){node.removeAttribute("data-et-actionable");var button=node.querySelector("[data-et-answer]");if(button)button.remove()})}
  function appendMessage(role,text,meta,scroll,actionable){
    var chat=overlay().querySelector("[data-et-chat]"),welcome=chat.querySelector(".eternaV160Start");if(welcome)welcome.remove();
    var row=document.createElement("div");row.className="eternaV159Msg "+role;
    var tags="",safeSubject=cleanMetaText(meta&&meta.subject);if(safeSubject)tags+='<span class="eternaV159Tag">'+esc(safeSubject)+'</span>';if(meta&&meta.help_level!=null)tags+='<span class="eternaV159Tag">Ayuda '+esc(meta.help_level)+'/5</span>';
    var copyAction=role==="assistant"?'<button type="button" class="eternaV159Copy" data-et-copy aria-label="Copiar respuesta">⧉ Copiar</button>':"";
    var content='<div class="eternaV159Bubble">'+esc(cleanText(text))+(tags?'<div class="eternaV159Meta">'+tags+"</div>":"")+"</div>";
    row.innerHTML=role==="assistant"?'<div class="eternaV159Avatar" aria-hidden="true">✦</div>'+content+copyAction:content;chat.appendChild(row);
    if(role==="assistant"){var copy=row.querySelector("[data-et-copy]");if(copy)copy.onclick=async function(){var v=cleanText(text);try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(v);else{var ta=document.createElement("textarea");ta.value=v;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}copy.textContent="Copiado ✓";setTimeout(function(){copy.textContent="⧉ Copiar"},1400)}catch(e){copy.textContent="No se pudo copiar"}}}
    if(role==="assistant"&&meta&&meta.verification_status==="verified"){
      var canAct=messageIsActionable(meta,actionable);if(canAct)removeStaleQuickActions();
      if(meta.check_question){var check=document.createElement("div");check.className="eternaV159Check";if(canAct)check.setAttribute("data-et-actionable","1");check.innerHTML='<b>Comprueba que lo entendiste</b><p>'+esc(cleanText(meta.check_question))+'</p>'+(canAct?'<button type="button" data-et-answer>Responder</button>':"");var answer=check.querySelector("[data-et-answer]");if(answer)answer.onclick=function(){var i=overlay().querySelector("[data-et-input]");i.placeholder="Escribe tu respuesta…";i.focus()};chat.appendChild(check)}
      if(meta.practice_suggestion){var mission=document.createElement("div");mission.className="eternaV159Mission";mission.innerHTML='<span>🎯 MISIÓN ETERNA</span><p>'+esc(cleanText(meta.practice_suggestion))+'</p><div><button type="button" data-et-practice>Practicar ahora</button><button type="button" data-et-coco>Entrenar en Coco</button></div>';mission.querySelector("[data-et-practice]").onclick=function(){setMode("practice",false);var i=overlay().querySelector("[data-et-input]");i.value="Quiero practicar ahora esta recomendación. Hazme una sola pregunta cada vez y espera mi respuesta.";state.inputSource="text";send()};mission.querySelector("[data-et-coco]").onclick=function(){goCocoTraining(meta)};chat.appendChild(mission)}
      if(canAct){var q=document.createElement("div");q.className="eternaV159Quick";q.setAttribute("data-et-question-id",meta.question_id);q.innerHTML='<button type="button" data-et-understood>✅ Lo entendí</button><button type="button" data-et-hint>💡 Otra pista</button><button type="button" data-et-listen>🔊 Escuchar</button><button type="button" data-et-listen-slow aria-label="Escuchar más despacio">🐢 Más lento</button>';q.querySelector("[data-et-understood]").onclick=function(){sendStudentAction("understood",meta,q)};q.querySelector("[data-et-hint]").onclick=function(){sendStudentAction("hint_request",meta,q)};q.querySelector("[data-et-listen]").onclick=function(){speak(cleanText(text),1,this)};q.querySelector("[data-et-listen-slow]").onclick=function(){speak(cleanText(text),.82,this)};chat.appendChild(q)}
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

  function historyForApi(){return state.history.slice(-8).map(function(m){return{role:m.role,text:m.api_text||m.text,check_question:m.meta&&m.meta.check_question?m.meta.check_question:null,strategy_used:m.meta&&m.meta.strategy_used?m.meta.strategy_used:null,tutor_act:m.meta&&m.meta.tutor_act?m.meta.tutor_act:null,expected_student_act:m.meta&&m.meta.expected_student_act?m.meta.expected_student_act:null}})}

  function legacyActivityFromResponse(data,context){var c=stateContract(),before=context.activity,ms=data&&data.mode_state&&typeof data.mode_state==="object"?data.mode_state:{},ps=data&&data.pedagogical_state&&typeof data.pedagogical_state==="object"?data.pedagogical_state:{},question=cleanText(data&&data.check_question||ps.pending_question||""),qid=ps.pending_question_id||data&&data.question_id||null;if(question&&!c.validOpaqueId(qid))qid=c.resolveQuestionId(before,{previous_question:null,question:question});var assessment=String(data&&data.student_answer_assessment||"not_applicable");return c.sanitizeActivityState({contract_version:3,session_id:before.session_id,mode:context.mode,phase:qid?"WAIT":assessment!=="not_applicable"?"NEXT":"ASK",question_id:qid,practice_target:data&&data.practice_target||before.practice_target,question_number:ms.question_number==null?before.question_number:ms.question_number,correct_count:ms.correct_count==null?before.correct_count:ms.correct_count,partial_count:ms.partial_count==null?before.partial_count:ms.partial_count,incorrect_count:ms.incorrect_count==null?before.incorrect_count:ms.incorrect_count,difficulty:ms.difficulty==null?before.difficulty:ms.difficulty,hints_used:before.hints_used,last_action_id:context.client_turn_id},{mode:context.mode,session_id:before.session_id})}
  function responseContextValid(data,context){var c=stateContract(),activity=currentActivity(),epochOk=context&&context.recovered===true||context&&context.epoch===state.activityEpoch;if(!c||!context||context.uid!==sessionUserId()||context.mode!==state.mode||!epochOk||!activity||activity.session_id!==context.session_id)return false;if(data&&data.request_id&&data.request_id!==context.request_id)return false;if(data&&data.client_turn_id&&data.client_turn_id!==context.client_turn_id)return false;if(context.answered_question_id&&context.answered_question_id!==activity.question_id)return false;return true}
  function responseDedupeKey(data,context){return String(data&&data.event_id||data&&data.response_id||data&&data.request_id||context&&context.request_id||"")}
  function applyChatResponse(data,context){
    var c=stateContract();if(!c||!data||typeof data!=="object"||!responseContextValid(data,context))return{applied:false,reason:"STALE_CONTEXT"};
    var key=responseDedupeKey(data,context);if(key&&state.appliedResponses.has(key))return{applied:false,duplicate:true};
    context.activity=context.activity||currentActivity();var activity=data.activity_state&&typeof data.activity_state==="object"?c.sanitizeActivityState(data.activity_state,{mode:context.mode,session_id:context.session_id}):legacyActivityFromResponse(data,context),valid=c.validateActivityRequest(activity,{expected_mode:context.mode,expected_session_id:context.session_id});
    if(!valid.ok)return{applied:false,reason:"INVALID_ACTIVITY_STATE",errors:valid.errors};
    if(key){state.appliedResponses.add(key);if(state.appliedResponses.size>100)state.appliedResponses.delete(state.appliedResponses.values().next().value)}
    state.activities[state.mode]=valid.state;state.modeState=activityModeState(valid.state);
    var reply=cleanText(data.reply||"Necesito que me enseñes mejor el enunciado para poder ayudarte sin inventar nada."),meta={verification_status:data.verification_status||"needs_clarification",subject:cleanMetaText(data.subject),concept:cleanMetaText(data.concept),help_level:data.help_level,check_question:data.check_question||null,practice_suggestion:data.practice_suggestion||null,student_answer_assessment:data.student_answer_assessment||"not_applicable",strategy_used:data.strategy_used||null,mode_label:data.mode_label||null,event_id:data.event_id||key||null,session_id:valid.state.session_id,question_id:valid.state.question_id,request_id:context.request_id,client_turn_id:context.client_turn_id};
    var turn=context.turn||{intent:context.student_action||null},conv=updateConversationState(data,reply,turn,meta);meta.tutor_act=conv.tutor_act;meta.expected_student_act=conv.expected_student_act;meta.student_intent=turn.intent||context.student_action||null;
    if(data.pedagogical_state&&typeof data.pedagogical_state==="object")state.pedagogicalState=data.pedagogical_state;
    if(context.userEntry)state.history.push(context.userEntry);
    state.history.push({role:"assistant",text:reply,meta:meta});state.lastReply=reply;persistLearningSession();renderModeBar();appendMessage("assistant",reply,meta,true,true);if(data.verification_status==="verified"&&data.auto_speak===true)speak(reply,1);clearImage();state.inputSource="text";state.dataLoadedAt=0;setResultStatus(data);try{window.dispatchEvent(new CustomEvent("coco:eterna-response-applied",{detail:{request_id:context.request_id,client_turn_id:context.client_turn_id,session_id:context.session_id,mode:context.mode}}))}catch(e){}return{applied:true,activity_state:valid.state,meta:meta}
  }

  async function send(options){
    options=options&&typeof options==="object"?options:{};
    if(state.busy)return;
    var o=overlay(),input=o.querySelector("[data-et-input]"),rawText=String(options.text==null?input.value||"":options.text).trim();if(!rawText&&!state.imageData){setStatus("Escribe una pregunta o adjunta una foto","warn");input.focus();syncSendAvailability();return}
    var turn=rawText?resolveContextualTurn(rawText):{text:"",intent:"image_homework",directive:null};
    var activity=ensureActivity(state.mode,false);if(!activity){setStatus("Falta cargar el contrato de actividad","warn");return}
    var inferredAction=options.studentAction||(turn.intent==="new_topic"?"new_topic":activity.phase==="WAIT"?"answer":activity.phase==="NEXT"?"continue":"continue"),answeredQuestionId=activity.phase==="WAIT"&&inferredAction==="answer"?activity.question_id:(options.questionId||null),requestId=opaqueId("request"),clientTurnId=opaqueId("turn"),controller=typeof AbortController!=="undefined"?new AbortController():null,epoch=state.activityEpoch;
    state.busy=true;input.disabled=true;o.querySelector("[data-et-send]").disabled=true;
    var apiHistory=historyForApi(),shown=options.displayText||rawText||"He adjuntado una foto de mi tarea.",userEntry={role:"user",text:shown,api_text:turn.text||shown,meta:{student_intent:turn.intent,student_action:inferredAction,answered_question_id:answeredQuestionId}};appendMessage("user",shown,null,true,false);input.value="";setStatus("Eterna está pensando y comprobando…","warn");
    var context={uid:sessionUserId(),mode:state.mode,session_id:activity.session_id,activity:activity,epoch:epoch,request_id:requestId,client_turn_id:clientTurnId,answered_question_id:answeredQuestionId,student_action:inferredAction,turn:turn,userEntry:userEntry,controller:controller};state.activeRequest=context;
    try{
      var source=state.imageData&&!rawText?"image":state.inputSource||"text",directive=repetitionDirective(turn),body={text:(turn.text||rawText)||"Analiza esta imagen como tarea escolar. Primero identifica qué está impreso, qué hueco debe completar el alumno y solo después dame una pista.",mode:context.mode,mode_state:activityModeState(activity),input_source:source,image_data_url:state.imageData||null,history:apiHistory,conversation_state:state.conversationState||freshConversationState(),pedagogical_state:state.pedagogicalState||freshPedagogicalState(context.mode),client_state_contract:3,session_id:activity.session_id,request_id:requestId,client_turn_id:clientTurnId,answered_question_id:answeredQuestionId,student_action:inferredAction,student_intent:turn.intent||null,tutor_directive:turn.directive||null,repetition_guard:directive||null,client_version:VERSION};
      body.activity_state=stateContract().toPersistentActivityState(activity);
      var requestOptions={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)};if(controller)requestOptions.signal=controller.signal;
      var r=await api("/v1/chat",requestOptions),data=await safeJson(r);
      if(!r.ok){
        if(r.status===402||data&&data.error==="ETERNA_SUBSCRIPTION_REQUIRED"){state.dataLoadedAt=0;await loadData(true);render();return}
        if(data&&data.error==="ETERNA_DAILY_LIMIT")throw new Error("ETERNA_DAILY_LIMIT");throw new Error(data&&data.error?data.error:"No se pudo obtener respuesta.")
      }
      var applied=applyChatResponse(data,context);if(!applied.applied&&!applied.duplicate)throw new Error("ETERNA_STALE_RESPONSE")
    }catch(e){
      if(e&&e.name==="AbortError"||context.epoch!==state.activityEpoch)return;
      renderConversation(o.querySelector("[data-et-chat]"));
      var msg=e&&e.message==="ETERNA_ENDPOINT_NOT_CONFIGURED"?"Eterna todavía necesita que configures su Worker.":e&&e.message==="ETERNA_DAILY_LIMIT"?"Has alcanzado el límite familiar de consultas de Eterna por hoy. Un adulto puede revisarlo en Zona familiar.":"Ahora no puedo comprobar esta tarea con suficiente seguridad. Prueba de nuevo dentro de un momento.";
      appendMessage("assistant",msg,{verification_status:"needs_clarification"},true,false);if(rawText){input.value=rawText;state.inputSource=source==="voice"?"voice":"text"}setStatus(e&&e.message==="ETERNA_DAILY_LIMIT"?"Límite diario alcanzado":"No se pudo verificar · tu pregunta sigue preparada","warn")
    }finally{if(state.activeRequest===context){state.activeRequest=null;state.busy=false;input.disabled=false;syncSendAvailability();input.focus()}}
  }

  async function feedback(eventName,meta,eventId){var activity=currentActivity(),feedbackEvent=eventName==="hint_request"?"need_hint":eventName;eventId=eventId||opaqueId("feedback");if(state.submittedFeedback.has(eventId))return false;state.submittedFeedback.add(eventId);try{await api("/v1/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:feedbackEvent,event_id:eventId,session_id:activity&&activity.session_id||null,question_id:meta&&meta.question_id||activity&&activity.question_id||null,subject:meta&&meta.subject||null,concept:meta&&meta.concept||null,help_level:meta&&meta.help_level==null?null:meta&&meta.help_level,strategy_used:meta&&meta.strategy_used||null,mode:state.mode,client_state_contract:3})});state.dataLoadedAt=0;if(eventName==="understood")setStatus("Progreso pedagógico actualizado","ok");else if(eventName==="hint_request")setStatus("Eterna ajustará la siguiente pista","ok");return true}catch(e){return false}}
  function completeActivity(meta,quick){var activity=currentActivity(),chat=overlay().querySelector("[data-et-chat]"),composer=overlay().querySelector("[data-et-composer]");if(!activity||activity.phase!=="WAIT")return;removeStaleQuickActions();closeActivity(state.mode);persistLearningSession();if(composer)composer.classList.add("is-complete");var card=document.createElement("section");card.className="eternaV160Completion";card.setAttribute("role","status");card.innerHTML='<span class="eternaV160CompletionIcon" aria-hidden="true">✓</span><div><small>ACTIVIDAD TERMINADA</small><h3>Buen trabajo: has decidido que ya lo entiendes.</h3><p>Puedes parar aquí sin perder nada, empezar otra actividad o practicar algo parecido.</p><div><button type="button" data-et-complete-close>Terminar</button><button type="button" data-et-complete-new>Nueva actividad</button><button type="button" data-et-complete-practice>Practicar algo parecido</button></div></div>';chat.appendChild(card);card.querySelector("[data-et-complete-close]").onclick=close;card.querySelector("[data-et-complete-new]").onclick=function(){resetVisibleSession(true);renderModeBar();setStatus("Nueva actividad · "+MODE_CONFIG[state.mode].label,"ok")};card.querySelector("[data-et-complete-practice]").onclick=function(){setMode("practice",false);var i=overlay().querySelector("[data-et-input]");i.value="Quiero practicar un ejercicio parecido al que acabo de entender.";i.dispatchEvent(new Event("input",{bubbles:true}));i.focus()};setStatus("Actividad terminada · puedes parar aquí","ok");requestAnimationFrame(function(){card.scrollIntoView({behavior:"smooth",block:"nearest"})})}
  function sendStudentAction(action,meta,quick){var activity=currentActivity();if(state.busy||!activity||activity.phase!=="WAIT"||!meta||meta.question_id!==activity.question_id)return;var eventId=opaqueId("event"),buttons=quick&&quick.querySelectorAll("button");if(buttons)buttons.forEach(function(button){button.disabled=true});feedback(action,meta,eventId);if(action==="understood"){completeActivity(meta,quick);return}send({studentAction:"hint_request",questionId:activity.question_id,text:"Necesito otra pista distinta y concreta. No me des todavía la respuesta final.",displayText:"Otra pista"})}

  async function prepareImage(file){
    if(state.parentSettings&&state.parentSettings.allow_image_input===false){setStatus("Las fotos están desactivadas desde Zona Familiar","warn");alert("Las fotos están desactivadas desde Zona familiar.");return}
    if(!/^image\//i.test(file.type||"")){setStatus("El archivo no es una imagen · elige una foto","warn");alert("Selecciona una imagen.");return}
    if(file.size>15*1024*1024){setStatus("La foto supera 15 MB · elige una más pequeña","warn");alert("La imagen es demasiado grande. Usa una foto de menos de 15 MB.");return}
    try{setStatus("Preparando la foto…","warn");var data=await compressImage(file);state.imageData=data;state.imageName=file.name||"tarea.jpg";state.inputSource="image";var p=overlay().querySelector("[data-et-preview]");p.querySelector("img").src=data;p.querySelector("span").textContent="Imagen lista. Eterna distinguirá lo impreso de los huecos antes de ayudarte.";p.classList.add("show");syncSendAvailability();setStatus("Imagen lista para analizar","ok")}catch(e){setStatus("No pude preparar la foto · prueba con otra imagen","warn");alert("No se pudo preparar la imagen.")}
  }
  function compressImage(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onerror=reject;reader.onload=function(){var img=new Image();img.onerror=reject;img.onload=function(){var max=2200,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;var ctx=canvas.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);resolve(canvas.toDataURL("image/jpeg",.90))};img.src=reader.result};reader.readAsDataURL(file)})}
  function clearImage(){state.imageData=null;state.imageName="";var p=document.querySelector("#eternaOverlayV159 [data-et-preview]");if(p){p.classList.remove("show");p.querySelector("img").removeAttribute("src")}syncSendAvailability()}
  function recorderMime(){if(typeof MediaRecorder==="undefined")return"";var candidates=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"];if(typeof MediaRecorder.isTypeSupported!=="function")return"";for(var i=0;i<candidates.length;i++)if(MediaRecorder.isTypeSupported(candidates[i]))return candidates[i];return""}
  function audioFilename(type){var t=String(type||"").toLowerCase();if(t.indexOf("mp4")>=0||t.indexOf("m4a")>=0)return"pregunta.m4a";if(t.indexOf("ogg")>=0)return"pregunta.ogg";if(t.indexOf("wav")>=0)return"pregunta.wav";if(t.indexOf("mpeg")>=0||t.indexOf("mp3")>=0)return"pregunta.mp3";return"pregunta.webm"}

  async function microphonePermissionState(){try{if(navigator.permissions&&navigator.permissions.query){var p=await navigator.permissions.query({name:"microphone"});return p&&p.state||null}}catch(e){}return null}
  async function toggleRecord(){
    var b=overlay().querySelector("[data-et-mic]");
    if(state.parentSettings&&state.parentSettings.allow_audio_input===false){alert("El micrófono está desactivado desde Zona familiar.");return}
    if(state.recorder&&state.recorder.state==="recording"){state.recorder.stop();return}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){alert("Este navegador no permite grabar audio desde Eterna. Puedes escribir la pregunta.");return}
    try{
      var permission=await microphonePermissionState();if(permission==="denied"){alert("El micrófono está bloqueado para Coco en Forma. Actívalo en los permisos del navegador o de la app.");return}
      var stream=await navigator.mediaDevices.getUserMedia({audio:true}),mime=recorderMime(),options=mime?{mimeType:mime}:undefined;try{localStorage.setItem("coco_eterna_mic_granted_v1","1")}catch(_e){}state.chunks=[];
      var rec=options?new MediaRecorder(stream,options):new MediaRecorder(stream);state.recorder=rec;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)state.chunks.push(e.data)};
      rec.onstop=async function(){b.classList.remove("recording");b.textContent="🎙️";stream.getTracks().forEach(function(t){t.stop()});var type=rec.mimeType||mime||(state.chunks[0]&&state.chunks[0].type)||"audio/webm",blob=new Blob(state.chunks,{type:type});state.recorder=null;await transcribe(blob,audioFilename(type))};
      rec.start(250);b.classList.add("recording");b.textContent="■";setStatus("Escuchando… toca de nuevo para terminar","warn")
    }catch(e){alert("No se pudo acceder al micrófono. Revisa el permiso del navegador.")}
  }

  async function transcribe(blob,name){setStatus("Transcribiendo tu pregunta…","warn");try{var fd=new FormData();fd.append("audio",blob,name||audioFilename(blob.type));var r=await api("/v1/transcribe",{method:"POST",body:fd}),data=await safeJson(r);if(!r.ok||!data.text)throw new Error("TRANSCRIPTION_FAILED");var i=overlay().querySelector("[data-et-input]");i.value=cleanText(data.text);state.inputSource="voice";setStatus("He escrito lo que te he oído. Revísalo y envíalo.","ok");i.focus()}catch(e){setStatus("No pude transcribir el audio. Puedes escribirlo.","warn")}}
  function speechButtonLabel(button,status){if(!button)return;var playing=status===true||status==="playing",loading=status==="loading";button.classList.toggle("is-playing",playing||loading);button.setAttribute("aria-pressed",playing?"true":"false");button.setAttribute("aria-busy",loading?"true":"false");button.textContent=loading?"⏳ Preparando…":playing?"⏸ Pausar":button.hasAttribute("data-et-listen-slow")?"🐢 Más lento":"🔊 Escuchar"}
  function stopAudio(){try{if(state.lastAudio){state.lastAudio.pause();state.lastAudio=null}if(window.speechSynthesis)window.speechSynthesis.cancel();speechButtonLabel(state.lastSpeechButton,false);state.lastSpeechButton=null;state.lastUtterance=null}catch(e){}}
  async function speak(text,rate,button){if(state.parentSettings&&state.parentSettings.voice_enabled===false){alert("La voz de Eterna está desactivada desde Zona familiar.");return}if(button&&state.lastSpeechButton===button&&state.lastAudio){if(state.lastAudio.paused){await state.lastAudio.play();speechButtonLabel(button,true)}else{state.lastAudio.pause();speechButtonLabel(button,false)}return}stopAudio();state.lastSpeechButton=button||null;speechButtonLabel(button,"loading");try{var r=await api("/v1/speak",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:cleanText(String(text||"")).slice(0,1800)})});if(!r.ok)throw new Error("TTS");var blob=await r.blob();if(state.lastSpeechUrl)URL.revokeObjectURL(state.lastSpeechUrl);state.lastSpeechUrl=URL.createObjectURL(blob);var a=new Audio(state.lastSpeechUrl);a.playbackRate=rate||1;state.lastAudio=a;a.onended=function(){speechButtonLabel(button,false);if(state.lastAudio===a){state.lastAudio=null;state.lastSpeechButton=null}};a.onerror=a.onended;speechButtonLabel(button,true);await a.play();return}catch(e){speechButtonLabel(button,false)}try{if(window.speechSynthesis){var u=new SpeechSynthesisUtterance(cleanText(text));u.lang="es-ES";u.rate=rate||1;state.lastUtterance=u;state.lastSpeechButton=button||null;speechButtonLabel(button,true);u.onend=u.onerror=function(){speechButtonLabel(button,false);if(state.lastUtterance===u){state.lastUtterance=null;state.lastSpeechButton=null}};window.speechSynthesis.speak(u)}}catch(e){speechButtonLabel(button,false)}}

  async function subscriptionStatus(){await loadData(true);return state.subscription||{status:masterAccess()?"active":"inactive"}}
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
    var selectedLimit=String(card.querySelector("[data-et-limit]").value||"20"),expectedLimit=selectedLimit==="unlimited"?100:Number(selectedLimit||20);
    var expected={voice_enabled:card.querySelector("[data-et-voice]").checked,allow_image_input:card.querySelector("[data-et-images]").checked,allow_audio_input:card.querySelector("[data-et-audio]").checked,max_sessions_per_day:expectedLimit};
    var payload=Object.assign({},expected,{max_sessions_per_day:selectedLimit==="unlimited"?"unlimited":expectedLimit});
    try{
      var r=await api("/v1/parent-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"SETTINGS");
      state.parentSettings=d;state.dataLoadedAt=0;await loadData(true);
      var p=state.parentSettings||{},ok=(p.voice_enabled!==false)===expected.voice_enabled&&(p.allow_image_input!==false)===expected.allow_image_input&&(p.allow_audio_input!==false)===expected.allow_audio_input&&Number(p.max_sessions_per_day||20)===expected.max_sessions_per_day;
      if(!ok)throw new Error("PERSISTENCE");
      button.textContent="Guardado ✓";setTimeout(function(){button.textContent="Guardar ajustes";button.disabled=false},1200)
    }catch(e){button.disabled=false;button.textContent="Guardar ajustes";alert("No se pudieron guardar y confirmar los ajustes de Eterna.")}
  }

  function strategyName(k){return({socratic_question:"preguntas guiadas",worked_example:"ejemplos similares",analogy:"analogías",visual_structure:"apoyo visual y estructura",retrieval_practice:"preguntas de recuerdo",step_by_step:"pasos cortos",error_analysis:"análisis de errores",direct_explanation:"explicación directa"})[k]||k}

  function familyUniqueStrings(values){var seen=Object.create(null),out=[];(values||[]).forEach(function(v){v=cleanText(v);if(v&&!seen[v]){seen[v]=1;out.push(v)}});return out}
  function familyRetiredEnglish(row){var subject=String(row&&row.subject||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return /(^|[^a-z])ingles([^a-z]|$)/.test(subject)}
  function familyCountLabel(value,singular,plural){var n=Number(value||0);return n+" "+(n===1?singular:plural)}
  var FAMILY_SIGNAL_DEFINITION="Una señal es una evidencia orientativa obtenida de una respuesta, un intento, una corrección, una pista utilizada o el resultado de un ejercicio. Varias señales ayudan a estimar el progreso y pueden cambiar con nuevas actividades. No equivalen a una nota escolar, un diagnóstico ni una medición permanente de la capacidad del alumno.";
  function familyRecentUsageDays(usage){var now=Date.now(),cut=now-6*86400000,seen=Object.create(null);(usage||[]).forEach(function(row){var raw=row&&(row.usage_date||row.created_at||row.updated_at),d=raw?new Date(raw):null;if(d&&!isNaN(d.getTime())&&d.getTime()>=cut){seen[d.toISOString().slice(0,10)]=1}});return Object.keys(seen).length}
  function familyLearningSupportName(){var name=displayUserName(state.baseProfile&&state.baseProfile.apodo||state.session&&state.session.user&&state.session.user.user_metadata&&state.session.user.user_metadata.apodo||"Alumno Coco");return name||"Alumno Coco"}
  function buildFamilyLearningReportModel(exportData){
    exportData=exportData||{};var academicMemory=(Array.isArray(exportData.academic_memory)?exportData.academic_memory:[]).filter(function(x){return x&&cleanText(x.topic_label)&&!familyRetiredEnglish(x)}).slice(0,12),concepts=(Array.isArray(exportData.student_concept_memory)?exportData.student_concept_memory:[]).filter(function(x){return x&&cleanText(x.concept_label)&&!familyRetiredEnglish(x)}),observed=concepts.filter(function(x){return Number(x.attempts||0)>0}),strongest=observed.slice().sort(function(a,b){return Number(b.mastery_score||0)-Number(a.mastery_score||0)}).slice(0,3),reinforce=observed.slice().sort(function(a,b){return Number(a.mastery_score||0)-Number(b.mastery_score||0)}).slice(0,3),strategies=(Array.isArray(exportData.learning_strategy_memory)?exportData.learning_strategy_memory:[]).filter(function(x){return x&&cleanText(x.strategy_key)&&Number(x.evidence_count||0)>0&&!familyRetiredEnglish(x)}).sort(function(a,b){var ds=Number(b.success_score||0)-Number(a.success_score||0);return Math.abs(ds)>.001?ds:Number(b.evidence_count||0)-Number(a.evidence_count||0)}).slice(0,3),profile=exportData.student_profile||state.profile||{},subjects=familyUniqueStrings(concepts.map(function(x){return x.subject})),attempts=concepts.reduce(function(sum,x){return sum+Number(x.attempts||0)},0),errors=concepts.reduce(function(sum,x){return sum+Number(x.errors||0)},0),partials=concepts.reduce(function(sum,x){return sum+Number(x.partials||0)},0),independent=concepts.reduce(function(sum,x){return sum+Number(x.independent_successes||0)},0),assisted=concepts.reduce(function(sum,x){return sum+Number(x.assisted_successes||0)},0),activeDays=familyRecentUsageDays(exportData.usage||[]),lead=strongest[0]||null,next=reinforce[0]||null;
    var barSource=observed.slice().sort(function(a,b){return Number(b.attempts||0)-Number(a.attempts||0)}).slice(0,6),bars=barSource.map(function(x){return{label:cleanText(x.concept_label),sublabel:cleanText(x.subject)||"Aprendizaje",value:percent(x.mastery_score),detail:familyCountLabel(x.attempts,"señal observada","señales observadas")}}),panels=[{tone:"strength",icon:"★",eyebrow:"TUS FORTALEZAS",title:"Lo que parece estar más consolidado",text:"Según las actividades realizadas hasta ahora.",items:strongest.map(function(x){return{label:cleanText(x.concept_label),detail:cleanText(x.subject)||"Aprendizaje",percent:percent(x.mastery_score)}})},{tone:"reinforce",icon:"↗",eyebrow:"VAMOS A REFORZAR",title:"Áreas sugeridas para seguir practicando",text:"Son señales de práctica, no etiquetas permanentes.",items:reinforce.map(function(x){return{label:cleanText(x.concept_label),detail:(cleanText(x.subject)||"Aprendizaje")+" · "+familyCountLabel(x.attempts,"intento","intentos"),percent:percent(x.mastery_score)}})},{tone:"strategy",icon:"💡",eyebrow:"ASÍ PARECE AYUDARLE MÁS",title:"Estrategias que están funcionando",text:"Eterna seguirá ajustando la forma de explicar según la evidencia acumulada.",items:strategies.map(function(x){var score=Number(x.success_score);return{label:strategyName(x.strategy_key),detail:familyCountLabel(x.evidence_count,"evidencia","evidencias"),percent:isFinite(score)?percent(score):null}})},{tone:"activity",icon:"◎",eyebrow:"TU RECORRIDO",title:"Actividad observada",items:[{label:"Aciertos con poca ayuda",value:independent},{label:"Aciertos con apoyo",value:assisted},{label:"Errores registrados",value:errors},{label:"Respuestas parciales",value:partials}]}];
    return{academicMemory:academicMemory,theme:"learning",eyebrow:"APRENDIZAJE · ETERNA",title:"Mapa de fortalezas del aprendizaje",subtitle:"Tareas, explicaciones, preguntas escolares, práctica y preparación de exámenes: una lectura visual de las señales académicas observadas.",personName:familyLearningSupportName(),personMeta:[profile.school_year||"Curso no indicado",profile.autonomous_community||""].filter(Boolean).join(" · "),hero:{eyebrow:"FORTALEZA DESTACADA",title:lead?"Fortaleza destacada: "+cleanText(lead.concept_label):"Tu mapa de aprendizaje está empezando",text:lead?"Según las actividades realizadas, esta es la señal de dominio más alta observada hasta ahora. Puede cambiar con nueva práctica.":"Eterna irá completando este mapa a medida que haya más actividades escolares.",percent:lead?percent(lead.mastery_score):null},signalDefinition:FAMILY_SIGNAL_DEFINITION,metrics:[{value:concepts.length,label:"conceptos observados"},{value:attempts,label:"respuestas e intentos analizados"},{value:subjects.length,label:"materias trabajadas"},{value:activeDays+"/7",label:"días activos esta semana"}],bars:bars,barEyebrow:"CONCEPTOS OBSERVADOS",barTitle:"Progreso por conceptos",barScale:"Dominio aproximado · 0–100",panels:panels,groups:subjects.length?[{title:"Materias trabajadas",items:subjects}]:[],groupEyebrow:"CONTEXTO ESCOLAR",groupTitle:"Dónde se están generando señales",nextStep:{eyebrow:"PRÓXIMO PASO",title:next?"Reforzar: "+cleanText(next.concept_label):"Seguir creando señales variadas",text:next?"Una buena próxima práctica sería trabajar este concepto con pasos cortos y una comprobación al final.":"Realiza actividades variadas para que Eterna pueda distinguir fortalezas y áreas para reforzar con más fundamento."},note:"Informe pedagógico y orientativo. Las estimaciones pueden cambiar con nuevas actividades; no clasifican al alumno ni describen de forma permanente su manera de aprender."}
  }
  async function getFamilyLearningReportModel(force){
    var now=Date.now();if(!force&&familyLearningReportCache.model&&now-familyLearningReportCache.at<DATA_CACHE_MS)return familyLearningReportCache.model;if(familyLearningReportCache.promise)return familyLearningReportCache.promise;
    familyLearningReportCache.promise=(async function(){await loadData(false);if(!state.session)return null;var r=await api("/v1/export",{method:"GET"}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"EXPORT");var model=buildFamilyLearningReportModel(d);familyLearningReportCache.model=model;familyLearningReportCache.at=Date.now();return model})().finally(function(){familyLearningReportCache.promise=null});
    return familyLearningReportCache.promise
  }
  function invalidateFamilyLearningReport(){familyLearningReportCache.at=0;familyLearningReportCache.model=null;familyLearningReportCache.promise=null}

  function renderAcademicMemoryPanel(model){
    var rows=model&&Array.isArray(model.academicMemory)?model.academicMemory:[];
    if(!rows.length)return '<section class="eternaV160ProgressPanel"><div class="eternaV160ProgressHead"><b>Memoria de aprendizaje</b></div><p class="eternaV160ProgressIntro">Aquí aparecerán los temas que Eterna vaya recordando para poder retomarlos en futuras sesiones.</p></section>';
    var items=rows.slice(0,8).map(function(x){var topic=esc(x.topic_label||"Tema"),meaning=x.resolved_meaning?' · '+esc(x.resolved_meaning):'',subject=x.subject?' · '+esc(x.subject):'',summary=cleanText(x.summary_text||'');return '<div class="eternaV160ProgressBox"><b>'+topic+meaning+subject+'</b><span>'+esc(summary||'Tema trabajado y disponible para retomarlo.')+'</span></div>'}).join('');
    return '<section class="eternaV160ProgressPanel"><div class="eternaV160ProgressHead"><b>Temas que Eterna recuerda</b></div><p class="eternaV160ProgressIntro">Eterna conserva resúmenes académicos de lo que ella explicó para continuar el aprendizaje entre días. No guarda el audio, las fotos, los documentos ni el texto bruto del chat del menor en esta memoria.</p><div class="eternaV160ProgressGrid">'+items+'</div></section>'
  }

  async function exportEterna(button){
    /* v160.86: la exportación legacy deja de generar HTML propio.
       Cualquier invocación residual se deriva al único informe integral visible. */
    var integral=document.querySelector("#cocoApp [data-family-integral-report='1'] [data-family-integral-export]");
    if(integral&&!integral.disabled){try{integral.click();return true}catch(e){}}
    alert("El informe integral todavía se está preparando. Inténtalo de nuevo en unos segundos.");
    return false
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
    if(!confirm("¿Quieres borrar la memoria pedagógica y los temas recordados por Eterna?\n\nSe eliminará lo que Eterna ha aprendido sobre el progreso de este alumno, pero se conservarán su cuenta, curso, controles familiares y suscripción."))return;
    if(!confirm("Esta acción no se puede deshacer. ¿Confirmas que quieres borrar únicamente la memoria pedagógica?"))return;
    var original=button.textContent,protectedProfile=state.profile?Object.assign({},state.profile):null,protectedSettings=state.parentSettings?Object.assign({},state.parentSettings):null;
    button.disabled=true;button.textContent="Borrando…";
    try{
      var r=await api("/v1/delete-data",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"DELETE");
      await restoreProtectedData(protectedProfile,protectedSettings);
      state.history=[];state.learningMemory=[];state.strategyMemory=[];state.modeState=freshModeState();state.conversationState=freshConversationState();state.pedagogicalState=freshPedagogicalState(state.mode);clearLearningSession();state.dataLoadedAt=0;invalidateFamilyLearningReport();await loadData(true);
      button.textContent="Memoria borrada ✓";alert("La memoria pedagógica y los temas recordados por Eterna se han borrado. La cuenta, el curso, los controles familiares y la suscripción se conservan.");await injectFamilyCard(true)
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


  var FAMILY_PIN_TABLE="eterna_family_security";
  var FAMILY_PIN_CHANGE_KEY="coco_family_pin_change_v16043";
  var FAMILY_PIN_AUTO_KEY="coco_family_pin_auto_v16043";

  async function familyPinHashV160(pin){
    var bytes=new TextEncoder().encode("coco-familia-"+String(pin||""));
    var digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")
  }

  async function familyPinCloudRead(){
    await refreshSession();
    if(!state.session||!state.session.user)return null;
    var cli=client();if(!cli)return null;
    try{
      var r=await cli.from(FAMILY_PIN_TABLE).select("pin_hash").eq("user_id",state.session.user.id).maybeSingle();
      if(r&&r.error)throw r.error;
      return r&&r.data&&r.data.pin_hash?String(r.data.pin_hash):null
    }catch(e){return null}
  }

  async function familyPinCloudWrite(hash){
    await refreshSession();
    if(!state.session||!state.session.user)return false;
    var cli=client();if(!cli)return false;
    try{
      var r=await cli.from(FAMILY_PIN_TABLE).upsert({user_id:state.session.user.id,pin_hash:String(hash),updated_at:new Date().toISOString()},{onConflict:"user_id"});
      if(r&&r.error)throw r.error;
      return true
    }catch(e){return false}
  }

  function reopenFamilyGateWithPin(pin){
    try{sessionStorage.setItem(FAMILY_PIN_AUTO_KEY,String(pin||""))}catch(e){}
    var close=document.querySelector("#cocoApp .cocoFamilyV129 [data-family-close]");
    if(close)close.click();
    queueMicrotask(function(){
      var btn=document.querySelector("#cocoApp .cocoFamiliaBtn");
      if(btn)btn.click()
    })
  }

  function enhanceFamilyPinChange(){
    var change=document.querySelector("#cocoApp .cocoFamilyV129 [data-family-pin]");
    if(!change||change.dataset.eternaCloudPin==="1")return;
    change.dataset.eternaCloudPin="1";
    var original=change.onclick;
    change.onclick=function(event){
      try{sessionStorage.setItem(FAMILY_PIN_CHANGE_KEY,"1")}catch(e){}
      if(typeof original==="function")return original.call(change,event)
    }
  }

  async function enhanceFamilyPinGate(){
    var pinScreen=document.querySelector("#cocoApp .cocoFamilyV129 .cocoFamilyPin");
    if(!pinScreen||pinScreen.dataset.eternaCloudPin==="1")return;
    pinScreen.dataset.eternaCloudPin="1";

    var input=pinScreen.querySelector("input");
    var button=pinScreen.querySelector("[data-family-enter]");
    var error=pinScreen.querySelector(".cocoFamilyError");
    var copy=pinScreen.querySelector("p");
    if(!input||!button)return;

    var originalClick=button.onclick;
    var initialLocal="";
    try{initialLocal=String(localStorage.getItem("coco_pin_familia")||"")}catch(e){}
    var changeMode=false;
    try{changeMode=sessionStorage.getItem(FAMILY_PIN_CHANGE_KEY)==="1"}catch(e){}

    button.disabled=true;
    var cloudHash=await familyPinCloudRead();

    /* First migration: Safari's working local PIN becomes the account PIN in Supabase. */
    if(!cloudHash&&initialLocal&&/^[a-f0-9]{64}$/i.test(initialLocal)){
      if(await familyPinCloudWrite(initialLocal))cloudHash=initialLocal
    }

    if(cloudHash&&!changeMode){
      if(copy)copy.textContent="Introduce el PIN familiar. Es el mismo en Safari y en la app instalada.";
      button.textContent="Entrar en Zona Familiar"
    }else if(changeMode){
      if(copy)copy.textContent="Crea un nuevo PIN familiar de cuatro cifras. Se actualizará para todos tus dispositivos.";
      button.textContent="Guardar nuevo PIN y entrar"
    }
    input.setAttribute("autocomplete","off");
    button.disabled=false;

    button.onclick=async function(event){
      if(event){event.preventDefault();event.stopPropagation()}
      var pin=String(input.value||"").replace(/\D/g,"");
      if(pin.length!==4){
        if(error)error.textContent="Escribe exactamente cuatro cifras.";
        return
      }
      button.disabled=true;
      var digest=await familyPinHashV160(pin);

      if(changeMode){
        var changed=await familyPinCloudWrite(digest);
        if(!changed){
          button.disabled=false;
          if(error)error.textContent="No se pudo guardar el nuevo PIN. Comprueba la conexión e inténtalo otra vez.";
          return
        }
        cloudHash=digest;
        try{
          localStorage.setItem("coco_pin_familia",digest);
          sessionStorage.removeItem(FAMILY_PIN_CHANGE_KEY)
        }catch(e){}
        changeMode=false
      }else if(cloudHash){
        if(digest!==cloudHash){
          button.disabled=false;
          if(error)error.textContent="El PIN no es correcto.";
          input.select();
          return
        }
        try{localStorage.setItem("coco_pin_familia",cloudHash)}catch(e){}
      }else{
        var created=await familyPinCloudWrite(digest);
        if(!created){
          button.disabled=false;
          if(error)error.textContent="No se pudo sincronizar el PIN. Comprueba la conexión e inténtalo otra vez.";
          return
        }
        cloudHash=digest;
        try{localStorage.setItem("coco_pin_familia",digest)}catch(e){}
      }

      /*
       * If this browser/PWA had a different local hash when the original
       * gate was created, reopen once so the base closure captures the
       * synchronized account hash. Otherwise the original handler can run.
       */
      if(initialLocal&&cloudHash&&initialLocal!==cloudHash){
        reopenFamilyGateWithPin(pin);
        return
      }

      if(typeof originalClick==="function")return originalClick.call(button,event)
    };

    var autoPin="";
    try{autoPin=sessionStorage.getItem(FAMILY_PIN_AUTO_KEY)||"";if(autoPin)sessionStorage.removeItem(FAMILY_PIN_AUTO_KEY)}catch(e){}
    if(/^\d{4}$/.test(autoPin)){
      input.value=autoPin;
      queueMicrotask(function(){button.click()})
    }
  }

  function familyBodyNode(){return document.querySelector("#cocoApp .cocoFamilyV129Body,#cocoApp .cocoFamilyBody,#cocoApp [class*='Family'][class*='Body']")}
  function familyBaseReady(body){return body&&body.querySelector(".cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight")}
  function familyIsGate(body){
    if(!body)return true;var modal=body.closest(".cocoFamilyV129"),title=modal&&modal.querySelector("#cocoFamilyV129Title");
    return /acceso\s+familiar/i.test(String(title&&title.textContent||""))||!!body.querySelector(".cocoFamilyPin")
  }
  function familyMark(name,detail){try{performance.mark(name)}catch(e){}try{window.dispatchEvent(new CustomEvent("coco:"+name.replace(/_/g,"-"),{detail:detail||{}}))}catch(e){}}
  function canonicalFamilyCard(body){return body&&body.querySelector(".eternaV159FamilyCard[data-et-family-canonical='1'],.eternaV159FamilyCard")}
  function reserveFamilyCard(body){
    var card=canonicalFamilyCard(body);
    if(!card){
      card=document.createElement("section");card.className="eternaV159FamilyCard";card.dataset.etFamilyCanonical="1";card.dataset.etFamilyState="reserved";card.setAttribute("aria-busy","true");body.insertBefore(card,body.firstChild)
    }else card.dataset.etFamilyCanonical="1";
    return card
  }
  function preserveLegalAndClearFamilyCard(card){
    var legal=card&&card.querySelector(".eternaLegalV16058[data-et-legal-canonical='1'],.eternaLegalV16058");
    if(legal&&legal.parentElement!==card)card.appendChild(legal);
    Array.prototype.slice.call(card&&card.children||[]).forEach(function(node){if(node!==legal)node.remove()});
    return legal||null
  }
  function insertFamilyMarkup(card,html,legal){
    var temp=document.createElement("div");temp.innerHTML=html;
    while(temp.firstChild)card.insertBefore(temp.firstChild,legal||null)
  }
  function ensureFamilyDivider(body,card){
    /* v160.86: el separador visual legacy de Juegos deja de existir.
       Los datos de juegos siguen siendo propiedad del mapa base de Family y el
       renderer integral de coco-v153-fixes.js los consume sin duplicar títulos. */
    if(!body)return null;
    Array.prototype.slice.call(body.querySelectorAll(".cocoFamilyMapIntroV160[data-et-family-divider='1'],.cocoFamilyMapIntroV160")).forEach(function(divider){divider.remove()});
    return null
  }
  function familyGatePresentation(body){
    body.querySelectorAll(".eternaV159FamilyCard,.cocoFamilyMapIntroV160").forEach(function(n){n.remove()});
    var modal=body.closest(".cocoFamilyV129"),headerKicker=modal&&modal.querySelector("header span"),pinScreen=body.querySelector(".cocoFamilyPin");
    if(headerKicker)headerKicker.textContent="ZONA FAMILIAR · ACCESO PROTEGIDO";
    if(pinScreen){
      var pinCopy=pinScreen.querySelector("p");if(pinCopy)pinCopy.textContent="El PIN protege el progreso escolar de Eterna y el mapa de fortalezas de los juegos para la mente.";
      var pinButton=pinScreen.querySelector("[data-family-enter]");if(pinButton)pinButton.textContent=/crear/i.test(String(pinButton.textContent||""))?"Crear PIN y entrar":"Entrar en Zona Familiar"
    }
  }

  async function injectFamilyCard(force){
    var body=familyBodyNode();if(!body)return false;
    if(familyIsGate(body)){familyGatePresentation(body);return false}
    if(!familyBaseReady(body))return false;
    familyMark("family_base_ready",{body:body});

    var existing=canonicalFamilyCard(body);
    if(existing&&existing.dataset.etFamilyState==="ready"&&!force)return existing;
    if(familyRenderPromise&&familyRenderBody===body)return familyRenderPromise;

    /* Reserva síncrona del único owner de Family ANTES de cualquier await.
       Todas las llamadas concurrentes reutilizan esta tarjeta y la misma Promise. */
    var card=reserveFamilyCard(body);
    familyRenderBody=body;
    familyRenderPromise=(async function(){
      await subscriptionStatus();
      var memoryModel=null;try{memoryModel=await getFamilyLearningReportModel(false)}catch(e){}

      /* El modal puede cerrarse o volver al PIN mientras los datos se cargan. */
      if(!document.body.contains(body)||familyIsGate(body)||!familyBaseReady(body)){
        if(document.body.contains(card)&&familyIsGate(body))card.remove();
        return false
      }

      var familyModal=body.closest(".cocoFamilyV129");if(!familyModal)return false;
      var headerTitle=familyModal.querySelector("#cocoFamilyV129Title"),headerCopy=familyModal.querySelector("header p"),headerKicker=familyModal.querySelector("header span");
      /* v160.86 · El chrome del modal es neutral: el único encabezado de progreso
         pertenece al informe integral renderizado por CocoFamilyReportKit. */
      if(headerKicker)headerKicker.textContent="";
      if(headerTitle)headerTitle.textContent="";
      if(headerCopy)headerCopy.textContent="";

      var active=activeSubscription(),sub=state.subscription||{},expired=trialExpired(),ps=state.parentSettings||{voice_enabled:true,allow_image_input:true,allow_audio_input:true,max_sessions_per_day:20};
      var activeText=trialLabel(sub)||(String(sub.status||"").toLowerCase()==="active"?"suscripción activa":String(sub.status||"activa")),paidActive=String(sub.status||"")==="active"||masterAccess(),trialActive=String(sub.status||"")==="trialing"&&active,plans="";
      var paidFamilyPlan=String(sub.status||"").toLowerCase()==="active"&&["monthly","annual"].indexOf(String(sub.plan||"").toLowerCase())>=0,currentParentLimit=Number(ps.max_sessions_per_day||20);
      if(paidActive){
        plans='<div class="eternaV159Buttons"><button type="button" class="eternaV159Secondary" data-et-open>Abrir Eterna</button>'+(sub.provider_customer_id?'<button type="button" class="eternaV159Secondary" data-et-portal>Gestionar suscripción</button>':"")+'</div>'
      }else if(expired){
        plans=expiredConversionMarkup(false)
      }else{
        var trialBlock=trialActive
          ?'<div class="eternaV160TrialActive"><b>⭐ '+esc(activeText)+'</b><span>Puedes contratar el plan mensual o anual en cualquier momento, aunque todavía estés dentro de los 7 días de prueba.</span></div>'
          :'<div class="eternaV160TrialActive"><b>⭐ Prueba gratuita · 7 días</b><span>Empieza sin tarjeta ni datos bancarios. Al terminar, tú decides si quieres continuar.</span><button type="button" class="eternaV159Secondary" data-et-trial style="margin-top:9px">Empezar prueba gratis</button></div>';
        plans=trialBlock+
          '<div class="eternaV160UpgradeWrap"><div class="eternaV160UpgradeHead"><div><b>Elige tu plan cuando quieras</b><span>Los planes de pago están disponibles desde el primer día de la prueba. La activación se realiza al completar el pago.</span></div></div>'+
          paidPlanCards()+'</div>'
      }

      var promo='<div class="eternaV160FamilyPromo"><span>Enlace directo para compartir Eterna en redes o con otras familias.</span><button type="button" class="eternaV160ShareBtn" data-et-share>🔗 Compartir Eterna</button></div>',commercial=expired?plans+promo:promo+plans;
      var settings='<details class="eternaV159ParentSettings"><summary>Privacidad y controles de Eterna</summary><div class="eternaV159ParentGrid">'+
        '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir voz de Eterna</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-voice '+(ps.voice_enabled!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
        '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir fotos de tareas</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-images '+(ps.allow_image_input!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
        '<label class="eternaV160Toggle"><span class="eternaV160ToggleCopy"><strong>Permitir preguntas por micrófono</strong><small data-et-toggle-state></small></span><input type="checkbox" data-et-audio '+(ps.allow_audio_input!==false?"checked":"")+'><span class="eternaV160Switch" aria-hidden="true"></span></label>'+
        '<label>Consultas máximas al día <select data-et-limit>'+[10,20,30,50].map(function(x){return'<option value="'+x+'" '+(currentParentLimit===x?"selected":"")+'>'+x+"</option>"}).join("")+(paidFamilyPlan?'<option value="unlimited" '+(currentParentLimit===100?"selected":"")+'>Ilimitadas</option>':"")+'</select></label>'+
        '</div><p>Estos controles afectan únicamente a Eterna y a la ayuda escolar. Las fotos se procesan temporalmente y no se guardan por defecto.</p><div class="eternaV159Buttons"><button type="button" class="eternaV159Secondary" data-et-save-settings>Guardar ajustes</button><button type="button" class="eternaV159Danger" data-et-delete>Borrar memoria de Eterna</button></div></details>';

      var legal=preserveLegalAndClearFamilyCard(card);
      insertFamilyMarkup(card,
        '<span class="eternaV159FamilyStatus '+(active?"active":expired?"expired":"")+'">'+(masterAccess()?"acceso máster":active?esc(activeText):expired?"prueba finalizada":"no activa")+'</span>'+
        commercial+renderAcademicMemoryPanel(memoryModel)+settings,legal);
      ensureFamilyDivider(body,card);
      bindFamilyToggleLabels(card);

      var b=card.querySelector("[data-et-open]");if(b)b.onclick=function(){var closeFamily=document.querySelector("#cocoApp .cocoFamilyV129>header button");if(closeFamily)closeFamily.click();open()};
      b=card.querySelector("[data-et-portal]");if(b)b.onclick=function(){portal(b)};
      b=card.querySelector("[data-et-trial]");if(b)b.onclick=function(){startTrial(b)};
      bindCheckoutPlans(card);
      b=card.querySelector("[data-et-save-settings]");if(b)b.onclick=function(){saveParentSettings(card,b)};
      b=card.querySelector("[data-et-export]");if(b)b.onclick=function(){exportEterna(b)};
      b=card.querySelector("[data-et-delete]");if(b)b.onclick=function(){deleteEternaData(b)};
      b=card.querySelector("[data-et-share]");if(b)b.onclick=function(){shareEterna(b)};

      card.dataset.etFamilyState="ready";card.removeAttribute("aria-busy");
      familyMark("family_data_ready",{card:card,body:body});
      try{window.dispatchEvent(new CustomEvent("coco:family-card-ready",{detail:{card:card,body:body,source:"eterna-v159-v16072"}}))}catch(e){}

      /* Legal es estado de CUENTA. La capa legal coalesce su lectura y actualiza
         siempre el mismo nodo canónico. No hay replay con temporizadores. */
      if(window.ETERNA_LEGAL_SHIELD_V16058&&typeof window.ETERNA_LEGAL_SHIELD_V16058.render==="function"){
        await window.ETERNA_LEGAL_SHIELD_V16058.render(false)
      }
      return card
    })().finally(function(){if(familyRenderBody===body){familyRenderPromise=null;familyRenderBody=null}});
    return familyRenderPromise
  }

  function installAuthResume(){
    if(authWatcherInstalled)return;
    var cli=state.client;if(!cli||!cli.auth)return;
    authWatcherInstalled=true;
    try{
      cli.auth.onAuthStateChange(function(event,session){
        var old=sessionUserId()||state.learningSessionUser||"",nextId=session&&session.user&&session.user.id?String(session.user.id):"";if(old!==nextId&&(old||nextId))resetAccountLearningState();
        if(!session){state.session=null;clearLearningSession();return}
        state.session=session;state.dataLoadedAt=0;
        var pending=null;try{pending=JSON.parse(localStorage.getItem(RESUME_KEY)||"null")}catch(e){}
        if(pending&&Date.now()-Number(pending.at||0)<30*60*1000){
          if(MODE_CONFIG[pending.mode])state.mode=pending.mode;
          try{localStorage.removeItem(RESUME_KEY)}catch(e){}
          queueMicrotask(open)
        }
      })
    }catch(e){}
    window.addEventListener("coco:daily-user",function(e){
      if(!(e&&e.detail&&e.detail.userId))return;
      var pending=null;try{pending=JSON.parse(localStorage.getItem(RESUME_KEY)||"null")}catch(_e){}
      if(pending){state.dataLoadedAt=0;queueMicrotask(open)}
    })
  }

  function observerNeedsWork(records){
    for(var i=0;i<records.length;i++){
      var nodes=records[i].addedNodes||[];
      for(var j=0;j<nodes.length;j++){
        var n=nodes[j];if(n.nodeType!==1)continue;
        if((n.matches&&n.matches(".loginCard,.carnet,#retosCard,.retosCard,.cocoFamilyV129Body,.cocoFamilyBody,.cocoFamilyPin,.cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight"))||(n.querySelector&&n.querySelector(".loginCard,.carnet,#retosCard,.retosCard,.cocoFamilyV129Body,.cocoFamilyBody,.cocoFamilyPin,.cocoFamilyHero,.cocoFamilyStats,.cocoFamilyDomains,.cocoFamilyCoverage,.cocoFamilyInsight")))return true
      }
    }
    return false
  }

  function scheduleObserverWork(){
    if(observerRaf)return;
    observerRaf=requestAnimationFrame(function(){
      observerRaf=0;ensureHomeLayout();
      enhanceFamilyPinGate();
      enhanceFamilyPinChange();
      if(document.querySelector("#cocoApp .cocoFamilyV129Body,#cocoApp .cocoFamilyBody,#cocoApp [class*='Family'][class*='Body']"))injectFamilyCard(false)
    })
  }

  function startObserver(){
    var root=document.getElementById("cocoApp");if(!root||appObserver)return;
    ensureHomeLayout();
    enhanceFamilyPinGate();
    enhanceFamilyPinChange();
    appObserver=new MutationObserver(function(records){if(observerNeedsWork(records))scheduleObserverWork()});
    appObserver.observe(root,{childList:true,subtree:true})
  }

  function boot(){
    injectFinal3Styles();ensureHomeLayout();startObserver();client();
    var q=new URLSearchParams(location.search),aliases={tarea:"homework",homework:"homework",duda:"ask",ask:"ask",revisar:"review",review:"review",explicar:"explain",explain:"explain",examen:"exam",exam:"exam",practicar:"practice",practice:"practice"},requested=aliases[String(q.get("mode")||"").toLowerCase()]||null;
    if(requested){state.mode=requested;try{localStorage.setItem("coco_eterna_mode_v160",requested)}catch(e){}}
    if(q.get("eterna")==="1"||q.get("open")==="eterna")queueMicrotask(open)
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();

  window.CocoEternaFamilyReportDataV16087=Object.freeze({version:"160.87",getLearningModel:getFamilyLearningReportModel,invalidate:invalidateFamilyLearningReport,readOnly:true});

  window.CocoEternaV160=Object.freeze({
    open:open,openExpiredPlans:function(){return open({force:true})},close:close,version:VERSION,directUrl:directEternaUrl,share:shareEterna,outOfScopeMessage:OUT_SCOPE,
    applyChatResponse:applyChatResponse,
    getActivityContext:function(){var activity=ensureActivity(state.mode,false);return activity?{uid:sessionUserId(),mode:state.mode,session_id:activity.session_id,question_id:activity.question_id,phase:activity.phase,epoch:state.activityEpoch}:null},
    isRequestPending:function(){return Boolean(state.busy)},
    isMaster:function(){return masterAccess()},
    invalidateActivity:function(reason){invalidateInFlight(reason||"external-boundary")},
    audit:function(){return{isolatedModule:true,cocoMedEndpointUntouched:true,photoTemporary:true,scopeGateRequired:true,studentModel:true,distinctModes:true,adaptiveStrategies:true,responsiveTablet:true,familyControls:true,humanProgressReport:true,safeMemoryDelete:true,directSocialLink:true,rootScopedObserver:true,homeLayoutFinal3:true,familyPinFirst:true,familyPinAccountSync:true,familySectionsSeparated:true,trialPlansAlwaysVisible:true,tabletLauncher:true,trialCtaOpensSignup:true,ageAccessGate:false,agePedagogyOnly:true,criticalSecondaryDataSplit:true,familyLifecycleV2:true,sharedFamilyRenderPromise:true,canonicalFamilyBeforeAwait:true,tutorConversationalV3:true,conversationStateEphemeral:true,contextualReferenceResolutionV3:true,noRawConversationPersistence:true,responsiveDesktopV16072:true,mobileFixedViewportV160941:true}}
  });
  window.CocoPerformanceV160=Object.freeze({snapshot:function(){
    var nav=(performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||null;
    var resources=(performance.getEntriesByType&&performance.getEntriesByType("resource"))||[];
    return {version:VERSION,domInteractive:nav?Math.round(nav.domInteractive):null,domComplete:nav?Math.round(nav.domComplete):null,loadEventEnd:nav?Math.round(nav.loadEventEnd):null,resourceCount:resources.length,transferKB:Math.round(resources.reduce(function(n,r){return n+Number(r.transferSize||0)},0)/1024)}
  }});
  window.CocoEternaV159=window.CocoEternaV160;
})();
