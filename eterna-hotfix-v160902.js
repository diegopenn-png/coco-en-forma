/* ETERNA client hotfix · 160.90.2-hf1
 * Scope: mode isolation + pending-math input guard + review arithmetic guard
 *        + homework scaffolding guard + stronger SIMPLIFY instruction.
 * Does not change auth, subscription, Safety, School Scope, Supabase or attribution.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_HOTFIX_160902_HF1__)return;
  root.__ETERNA_HOTFIX_160902_HF1__=true;

  var VERSION='160.90.2-hf1';
  var baseFetch=typeof root.fetch==='function'?root.fetch.bind(root):null;
  var lastChatMode=null;
  var forceFreshNext=false;
  var pendingByMode=Object.create(null);

  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t}return a||1}
  function rat(n,d){if(!Number.isFinite(n)||!Number.isFinite(d)||!d)return null;if(d<0){n=-n;d=-d}var g=gcd(Math.round(n),Math.round(d));return{n:Math.round(n/g),d:Math.round(d/g)}}
  function parseRational(s){
    s=clean(s).replace(/,/g,'.');
    var f=s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);if(f&&Number(f[2])!==0)return rat(Number(f[1]),Number(f[2]));
    if(/^-?\d+(?:\.\d+)?$/.test(s)){
      if(s.indexOf('.')<0)return rat(Number(s),1);
      var p=s.split('.'),scale=Math.pow(10,p[1].length);return rat(Number(p[0])*scale+(Number(p[0])<0?-1:1)*Number(p[1]),scale)
    }
    return null
  }
  function sameRat(a,b){return!!(a&&b&&a.n===b.n&&a.d===b.d)}
  function ratText(r){return!r?'':(r.d===1?String(r.n):(r.n+'/'+r.d))}

  function mathExpected(question){
    var q=clean(question).replace(/[−–—]/g,'-').replace(/÷/g,'÷').replace(/·/g,'×');
    var m=q.match(/(-?\d+(?:[.,]\d+)?(?:\s*\/\s*-?\d+)?)\s*(×|x|\*|\+|-|÷|:)\s*(-?\d+(?:[.,]\d+)?(?:\s*\/\s*-?\d+)?)/i);
    if(m){
      var a=parseRational(m[1]),b=parseRational(m[3]),op=m[2],r=null;if(!a||!b)return null;
      if(op==='×'||op==='x'||op==='X'||op==='*')r=rat(a.n*b.n,a.d*b.d);
      else if(op==='+')r=rat(a.n*b.d+b.n*a.d,a.d*b.d);
      else if(op==='-')r=rat(a.n*b.d-b.n*a.d,a.d*b.d);
      else if((op==='÷'||op===':')&&b.n!==0)r=rat(a.n*b.d,a.d*b.n);
      return r?{value:r,kind:r.d===1?'number':'fraction',expression:m[1]+' '+op+' '+m[3]}:null
    }
    var eq=q.match(/fracci[oó]n\s+equivalente\s+a\s+(-?\d+)\s*\/\s*(-?\d+)\s+con\s+denominador\s+(-?\d+)/i);
    if(eq&&Number(eq[2])&&Number(eq[3])){
      var n=Number(eq[1]),d=Number(eq[2]),targetD=Number(eq[3]),targetN=n*targetD/d;
      if(Number.isInteger(targetN))return{value:rat(targetN,targetD),kind:'fraction',expression:null}
    }
    return null
  }

  function answerFromBodyText(text){
    var s=clean(text);
    var wrapped=s.match(/^Mi respuesta a tu última comprobación es\s+(.+?)\.\s+Evalúala usando exactamente la pregunta anterior:/i);
    if(wrapped)s=clean(wrapped[1]);
    return s
  }
  function isBareYesNo(s){return /^(?:s[ií]|no)$/i.test(clean(s))}
  function responseJson(data,status){return new Response(JSON.stringify(data),{status:status||200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
  function modeLabel(mode){return({homework:'Ayúdame con mi tarea',ask:'Pregunta del cole',review:'Revisa lo que hice',explain:'Explícame un tema',exam:'Prepárame para un examen',practice:'Practicar lo que me cuesta'})[mode]||''}
  function clearPedagogicalState(){
    try{if(root.ETERNA_EXPERIENCE_V16049&&typeof root.ETERNA_EXPERIENCE_V16049.resetPedagogicalState==='function')root.ETERNA_EXPERIENCE_V16049.resetPedagogicalState()}catch(_e){}
  }
  function clearActivityState(){pendingByMode=Object.create(null);forceFreshNext=true;clearPedagogicalState()}
  function clonePedState(ped,question){
    var out=ped&&typeof ped==='object'?JSON.parse(JSON.stringify(ped)):{};
    if(question){out.pending_question=question}else{out.pending_question=null;out.expected_student_act=null}
    return out
  }
  function pendingPayload(mode,reply,pending,modeState){
    return{
      reply:reply,
      verification_status:'verified',subject:pending&&pending.subject||'Matemáticas',concept:pending&&pending.concept||null,
      help_level:pending&&pending.help_level!=null?pending.help_level:1,
      check_question:pending&&pending.question||null,practice_suggestion:null,
      student_answer_assessment:'not_applicable',strategy_used:'socratic_question',mode_label:modeLabel(mode),
      mode_state:modeState||{},pedagogical_state:clonePedState(pending&&pending.pedagogical_state,pending&&pending.question),
      auto_speak:false,client_hotfix:VERSION
    }
  }
  function correctReviewPayload(body,pending,answer,expected){
    var expression=expected&&expected.expression?expected.expression:pending.question.replace(/[¿?]/g,'').replace(/^Cu[aá]nto es\s*/i,'').replace(/=\s*$/,'').trim();
    var shown=ratText(answer);
    return{
      reply:'Correcto: '+expression+' = '+shown+'.',verification_status:'verified',subject:pending.subject||'Matemáticas',concept:pending.concept||null,
      help_level:1,check_question:null,practice_suggestion:null,student_answer_assessment:'correct',strategy_used:'error_analysis',mode_label:modeLabel('review'),
      mode_state:body.mode_state||{},pedagogical_state:clonePedState(pending.pedagogical_state,null),auto_speak:false,client_hotfix:VERSION
    }
  }
  function strengthenSimplify(body){
    if(String(body.student_intent||'')!=='simplify'&&String(body.tutor_directive||'')!=='SIMPLIFY')return;
    var prefix='SIMPLIFICACIÓN OBLIGATORIA: explica la misma idea con palabras cotidianas, frases cortas y un solo ejemplo concreto. Evita términos técnicos o abstractos como base de la explicación; si uno es imprescindible, explícalo después con palabras sencillas. Máximo tres ideas y no repitas la formulación anterior. ';
    if(String(body.text||'').indexOf('SIMPLIFICACIÓN OBLIGATORIA:')!==0)body.text=prefix+String(body.text||'')
  }
  function answerLeaked(reply,expected){
    if(!expected)return false;var a=ratText(expected.value),r=clean(reply);if(!a)return false;
    var safe=a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return new RegExp('(?:=|es|da|resultado(?:\\s+es)?)[\\s:]*'+safe.replace('/', '\\/')+'(?:\\b|$)','i').test(r)
  }
  function safeHomeworkReply(){return'Vamos paso a paso. Empieza solo por este primer paso y dime qué resultado te da. Cuando lo tengas, seguimos con el siguiente.'}

  function parseChatInit(init){
    if(!init||typeof init.body!=='string')return null;
    try{var body=JSON.parse(init.body);return body&&typeof body==='object'?body:null}catch(_e){return null}
  }
  function withBody(init,body){var next=Object.assign({},init||{});next.body=JSON.stringify(body);return next}

  if(baseFetch){
    var hotfixFetch=async function(input,init){
      var url=typeof input==='string'?input:(input&&input.url)||'',isChat=/\/v1\/chat(?:\?|$)/.test(url);
      if(!isChat)return baseFetch(input,init);
      var body=parseChatInit(init);if(!body)return baseFetch(input,init);
      var mode=String(body.mode||'homework');

      /* Defense in depth: a new mode must never inherit a pending question. */
      if(forceFreshNext||(lastChatMode!==null&&mode!==lastChatMode)){
        delete body.pedagogical_state;body.history=[];pendingByMode[mode]=null;clearPedagogicalState();forceFreshNext=false
      }
      lastChatMode=mode;
      strengthenSimplify(body);

      var pending=pendingByMode[mode]||null,expected=pending&&mathExpected(pending.question),answerText=answerFromBodyText(body.text),answer=parseRational(answerText);

      /* "Sí"/"No" is not a numeric result. Do not mark it wrong or alter progress. */
      if(pending&&expected&&isBareYesNo(answerText)){
        var ask=expected.kind==='fraction'?'Necesito que respondas con una fracción, por ejemplo 2/4. Inténtalo de nuevo.':'Necesito que respondas con un número. Inténtalo de nuevo.';
        return responseJson(pendingPayload(mode,ask,pending,body.mode_state))
      }

      /* Review mode: deterministic simple arithmetic wins over a false model negative. */
      if(mode==='review'&&pending&&expected&&answer&&sameRat(answer,expected.value)){
        pendingByMode[mode]=null;
        return responseJson(correctReviewPayload(body,pending,answer,expected))
      }

      var response=await baseFetch(input,withBody(init,body));
      if(!response||!response.ok)return response;
      var data;try{data=await response.clone().json()}catch(_e){return response}
      if(!data||typeof data!=='object')return response;

      /* Homework must not reveal the answer to the very check it asks the child to do. */
      if(mode==='homework'&&data.check_question){
        var checkExpected=mathExpected(data.check_question);
        if(checkExpected&&answerLeaked(data.reply,checkExpected)){
          data.reply=safeHomeworkReply();
          data.student_answer_assessment='not_applicable';
          data.strategy_used='step_by_step';
          data.client_hotfix=VERSION
        }
      }

      if(data.check_question){
        pendingByMode[mode]={question:clean(data.check_question),pedagogical_state:data.pedagogical_state&&typeof data.pedagogical_state==='object'?data.pedagogical_state:null,subject:data.subject||null,concept:data.concept||null,help_level:data.help_level}
      }else if(String(data.student_answer_assessment||'')==='correct'||String(data.verification_status||'')==='blocked_out_of_scope'){
        pendingByMode[mode]=null
      }
      return responseJson(data,response.status)
    };
    hotfixFetch.__eternaHotfix160902HF1=true;
    root.fetch=hotfixFetch
  }

  /* Primary fix: switching activity clears the hidden pedagogical state too. */
  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('[data-et-modechoice],[data-et-mode]'):null;
    if(!target||target.classList.contains('is-active'))return;
    clearActivityState()
  },true);

  root.ETERNA_HOTFIX_160902_HF1=Object.freeze({version:VERSION,reset:clearActivityState});
})(window);
