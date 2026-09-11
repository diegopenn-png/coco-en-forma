/* ETERNA prepared-content router v1. Pure, bounded and fail-open to the existing tutor.
 * No model, fetch, pupil storage, speech control or UI code. Inputs outside this small
 * grammar MUST fall through; keyword similarity is never used to grade an answer.
 */
(function(root){
  'use strict';
  const data=root.EternaLibraryContentV1;
  if(!data||data.schema_version!==1||data.lessons.length!==80)throw Error('Invalid ETERNA library bundle');
  const lessons=new Map(data.lessons.map(l=>[l.id,l])), protocols=new Map(data.protocols.map(p=>[p.id,p]));
  const clean=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const sentence=v=>clean(v).replace(/[¿?¡!.,;:]+/g,' ').replace(/\s+/g,' ').trim();
  const topic=v=>sentence(v).replace(/^(?:el|la|los|las|un|una|unos|unas)\s+/,'');
  const bounded=v=>typeof v==='string'&&v.length<=300&&!/[\r\n<>]/.test(v);
  function course(profile){
    const label=clean(profile?.school_year),stage=/infantil/.test(label)?'infantil':/primaria|\bepo\b/.test(label)?'primaria':/\beso\b|secundaria/.test(label)?'eso':/bachillerato/.test(label)?'bachillerato':null;
    const match=stage==='infantil'?label.match(/(?:^|\s|·)([3-5])\s*anos/):label.match(/^([1-6])(?:º|o|\.)?\s*(?:de\s+)?/);
    if(!stage||!match||profile?.preferred_language&&!/^es(?:-es)?$/i.test(profile.preferred_language))return null;
    return {stage,year:Number(match[1]),age:stage==='infantil'?Number(match[1]):(stage==='primaria'?5:stage==='eso'?11:15)+Number(match[1])};
  }
  function available(l,profile){const c=course(profile);return !!(c&&c.stage===l.stage&&c.year>=l.min_year&&c.year<=l.max_year)}
  function hash(v){let n=2166136261;for(const c of String(v||''))n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n}
  function variant(p,key){return p.variants[hash(key)%p.variants.length]}
  function displayName(ctx){return String(ctx?.base?.apodo||ctx?.profile?.apodo||'').replace(/[^\p{L}\p{N} '-]/gu,'').trim().split(/\s+/)[0].slice(0,24)}
  function protocolKind(raw){
    if(!bounded(raw))return null;const t=sentence(raw);
    if(/^(?:hola|buenos dias|buenas tardes|buenas noches|buenas)(?: eterna)?$/.test(t))return 'greeting';
    if(/^(?:muchas gracias|gracias|mil gracias)(?: eterna)?$/.test(t))return 'thanks';
    if(/^(?:adios|hasta luego|hasta pronto|nos vemos|chao|chau)(?: eterna)?$/.test(t))return 'goodbye';
    if(/^(?:(?:hola )?eterna )?(?:como estas|que tal estas|que tal)(?: eterna)?$/.test(t))return 'wellbeing';
    if(/^(?:quien eres|que eres|como te llamas|eres una ia|eres una persona|eres humana|eres un robot|cual es tu mision|para que sirves)(?: eterna)?$/.test(t))return 'identity';
    if(/^(?:cuantos anos tienes|que edad tienes)(?: eterna)?$/.test(t))return 'ai_age';
    if(/^(?:cuantos anos tengo|que edad tengo|recuerdas mi edad)$/.test(t))return 'student_age';
    if(/^(?:como me llamo|recuerdas mi nombre)$/.test(t))return 'student_name';
    if(/^(?:en que curso estoy|cual es mi curso|que curso tengo)$/.test(t))return 'student_course';
    if(/^(?:que dia es hoy|que fecha es hoy|a que dia estamos)$/.test(t))return 'date';
    if(/^(?:que hora es|que hora es ahora)$/.test(t))return 'clock';
    if(/^(?:estoy|me siento) (?:muy )?cansad[oa]$/.test(t))return 'fatigue';
    if(/^(?:esto me frustra|me cuesta aprender|me siento frustrad[oa] con esta tarea)$/.test(t))return 'frustration';
    if(/^(?:necesito una pausa|quiero descansar|paramos un momento|hagamos una pausa)$/.test(t))return 'pause';
    if(/^(?:necesitas mi direccion|necesitas mi telefono|necesitas mi contrasena)$/.test(t))return 'privacy';
    if(/^(?:que puedes hacer|en que me puedes ayudar|como puedes ayudarme)$/.test(t))return 'capabilities';
    if(/^(?:te has equivocado|creo que te has equivocado|esa respuesta esta mal)$/.test(t))return 'correction_invite';
    if(/^(?:repite la pregunta|puedes repetir la pregunta|cual era la pregunta)$/.test(t))return 'repeat_question';
    return null;
  }
  function basePayload(mode,ps,ms){return {reply:'',verification_status:'verified',ui_status:{label:'Contenido preparado de Eterna',tone:'success',kind:'verified'},subject:null,concept:null,help_level:null,check_question:null,practice_suggestion:null,student_answer_assessment:'not_applicable',strategy_used:null,mode_state:{...ms},pedagogical_state:{...ps,current_mode:mode,student_answer_assessment:'not_applicable',turn_index:Math.min(500,Number(ps.turn_index||0)+1)},auto_speak:false,teacher_library:true,library_release:data.release_id,response_source:'prepared_lesson',inference:{calls:0,input_tokens:0,output_tokens:0}}}
  function protocolReply({text,mode,ctx,pedState={},modeState={},sessionId='',now=new Date(),timeZone='Europe/Madrid'}){
    const kind=protocolKind(text),p=protocols.get(kind);if(!p)return null;
    const name=displayName(ctx),young=(course(ctx.profile)?.age||99)<=8,ps=pedState,out=basePayload(mode,ps,modeState);
    let answer=variant(p,sessionId+'|'+ps.turn_index);if(young&&p.young)answer=p.young;
    const n=name?', '+name:'';
    if(kind==='greeting'){
      const t=sentence(text),prefix=t.startsWith('buenos dias')?'Buenos días':t.startsWith('buenas tardes')?'Buenas tardes':t.startsWith('buenas noches')?'Buenas noches':null;
      if(prefix)answer=`¡${prefix}${n}! Estoy lista para ayudarte.`;
    }
    if(kind==='student_age'){const age=Number(ctx?.base?.edad);answer=Number.isInteger(age)&&age>0&&age<120?answer.replace('{age}',String(age)):p.missing}
    if(kind==='student_name')answer=name?answer.replace('{student}',name):p.missing;
    if(kind==='student_course')answer=answer.replace('{course}',String(ctx?.profile?.school_year||'un curso pendiente de configurar').slice(0,90));
    if(kind==='date'||kind==='clock'){
      const zone=clean(ctx?.profile?.autonomous_community)==='canarias'?'Atlantic/Canary':timeZone==='Atlantic/Canary'?'Atlantic/Canary':'Europe/Madrid';
      const label=zone==='Atlantic/Canary'?'hora de Canarias':'hora peninsular de España';
      answer=answer.replace('{zone}',label).replace('{time}',new Intl.DateTimeFormat('es-ES',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}).format(now)).replace('{date}',new Intl.DateTimeFormat('es-ES',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now));
    }
    if(kind==='pause'&&!ps.pending_question)answer=p.no_question;
    if(kind==='repeat_question'){
      if(!ps.pending_question){answer='No tengo una pregunta pendiente en esta actividad. Dime el tema y empezamos.'}
      else{out.check_question=ps.pending_question;answer=answer.replace('{name}',n)}
    }
    if(ps.pending_question&&p.resume)answer+=' '+p.resume;
    out.reply=answer.replaceAll('{name}',n);out.response_source='protocol';out.protocol_id=kind;out.situational=true;out.situational_kind='library_'+kind;out.resume_available=!!ps.pending_question;
    out.ui_status={label:'Eterna',tone:'success',kind:'verified'};return out;
  }
  function lessonRequest(raw,profile){
    if(!bounded(raw))return null;let t=sentence(raw).replace(/^hola(?: eterna)?\s+/, '').replace(/(?: por favor| gracias)$/, '');
    const prefixes=/^(?:me puedes explicar|puedes explicarme|podrias explicarme|explicame|explica|ensename|quiero entender|quiero aprender|cuentame sobre|hablame de|no entiendo|necesito entender|repasemos|vamos a repasar|quiero repasar|quiero practicar|vamos a practicar|practiquemos|practicar|hazme preguntas sobre|hazme un examen de|preparame para un examen de|tengo un examen de|ayudame con|ayudame a entender)\s+/;
    t=t.replace(prefixes,'').replace(/^(?:que es|que son|como funciona|como funcionan)\s+/,'').replace(/^(?:sobre|acerca de)\s+/,'');
    const key=topic(t);if(!key)return null;
    const found=data.lessons.filter(l=>available(l,profile)&&l.aliases.some(a=>topic(a)===key));
    return found.length===1?found[0]:null;
  }
  function questionText(q){return `${q.prompt}\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}`}
  function marker(l,mode,start,seq,nonce){return `libv1:${l.id}:${mode}:${start}:${seq}:${nonce}`}
  function parsePending(ps,mode,profile){
    const m=String(ps.pending_question_id||'').match(/^libv1:([a-z]+-[a-z0-9-]+):(ask|explain|exam|practice):([0-2]):([0-2]):([a-zA-Z0-9-]{6,40})$/);
    if(!m||m[2]!==mode||ps.current_mode!==mode)return null;
    const l=lessons.get(m[1]);if(!l||!available(l,profile)||ps.active_concept!==l.title)return null;
    const start=Number(m[3]),seq=Number(m[4]),q=l.questions[(start+seq)%l.questions.length];
    if(ps.pending_question!==questionText(q)||ps.expected_answer_type!=='choice')return null;
    return {lesson:l,start,seq,nonce:m[5],question:q};
  }
  function ownsPending(ps,mode,profile){return !!parsePending(ps,mode,profile)}
  function selectedOption(raw,q){
    let t=clean(raw).replace(/[¿?¡!]+$/g,'').trim();
    t=t.replace(/^(?:creo que (?:es )?|la respuesta es |elijo |escojo )/,'');
    const m=t.match(/^(?:la |opcion |la opcion |respuesta |letra )?(a|b|c|be|ce)[.)]?$/);
    if(m)return {index:{a:0,b:1,be:1,c:2,ce:2}[m[1]]};
    // Do not strip signs, units, exponents or negations from a mathematical answer.
    const exact=clean(raw).replace(/−/g,'-'),matches=q.options.map((x,i)=>clean(x).replace(/−/g,'-')===exact?i:-1).filter(i=>i>=0);
    return matches.length===1?{index:matches[0]}:null;
  }
  function finishQuestion(out){const p=out.pedagogical_state;p.pending_question=null;p.pending_question_id=null;p.expected_answer_type='none';p.expected_key_ideas=[];p.expected_student_act='none';p.last_question_type='none';p.unresolved_question=null;out.check_question=null;return out}
  function newQuestion(l,mode,ps,ms,start,seq,nonce,reply){
    const out=basePayload(mode,ps,ms),q=l.questions[(start+seq)%3],qt=questionText(q);
    out.reply=reply;out.subject=l.subject;out.concept=l.title;out.help_level=0;out.strategy_used='retrieval_practice';out.check_question=qt;out.lesson_id=l.id;
    out.mode_state={...ms,focus:l.title,question_number:seq+1};
    Object.assign(out.pedagogical_state,{active_topic:l.title,active_subject:l.subject,active_concept:l.title,pending_question:qt,pending_question_id:marker(l,mode,start,seq,nonce),expected_answer_type:'choice',expected_key_ideas:[],likely_misconceptions:[l.misconception],current_help_level:0,last_strategy:'retrieval_practice',last_tutor_act:'ask_choice',last_question_type:'choice',expected_student_act:'answer',unresolved_question:qt,next_teaching_goal:`libv1:${l.id}:${mode}`,conversation_stage:mode==='exam'?'examining':mode==='practice'?'practicing':'awaiting_student_answer'});
    return out;
  }
  function lessonReply({text,mode,ctx,pedState={},modeState={},sessionId='',studentAction=null,startsNewTopic=false}){
    if(!bounded(text)||!['homework','ask','review','explain','exam','practice'].includes(mode))return null;
    const profile=ctx?.profile;if(!course(profile))return null;
    const ps=pedState,ms=modeState,t=sentence(text),pending=startsNewTopic?null:parsePending(ps,mode,profile),requested=pending&&selectedOption(text,pending.question)?null:lessonRequest(text,profile);
    const active=!startsNewTopic&&String(ps.next_teaching_goal||'').match(/^libv1:([a-z]+-[a-z0-9-]+):(ask|explain|exam|practice)$/);
    const activeLesson=active&&active[2]===mode?lessons.get(active[1]):null;
    const l=requested||pending?.lesson||(activeLesson&&available(activeLesson,profile)?activeLesson:null);if(!l)return null;
    const young=course(profile).age<=8;
    if(requested){
      if(mode==='homework'||mode==='review'){
        const out=finishQuestion(basePayload(mode,ps,ms));out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;out.verification_status='needs_clarification';out.ui_status={label:'Necesito ver tu ejercicio',tone:'warning',kind:'clarification'};
        out.reply=mode==='review'?`Vamos a revisar ${l.title.toLowerCase()}. Muéstrame el enunciado y lo que has hecho; así puedo distinguir un error real de una forma diferente de resolverlo.`:`Te ayudo con ${l.title.toLowerCase()}. Muéstrame el enunciado y dime hasta dónde has llegado; empezaremos por una sola pista.`;
        Object.assign(out.pedagogical_state,{active_topic:l.title,active_subject:l.subject,active_concept:l.title,conversation_stage:'clarifying',last_tutor_act:'ask_open',expected_student_act:'clarify',next_teaching_goal:'comprender el trabajo real del alumno'});return out;
      }
      const nonce=(root.crypto?.randomUUID?root.crypto.randomUUID():String(hash(sessionId+'|'+ps.turn_index))+'seed').slice(0,36),start=hash(sessionId+'|'+l.id)%3;
      const reply=['exam','practice'].includes(mode)?`Vamos con ${l.title.toLowerCase()}. Una pregunta cada vez; puedes responder con la letra o con la opción completa.`:(young?l.simple:l.explanation)+'\n\n'+l.example;
      const out=newQuestion(l,mode,{...ps,simplification_level:0,confusion_count:0}, {...ms,correct_count:0,partial_count:0,incorrect_count:0},start,0,nonce,reply);
      if(['ask','explain'].includes(mode)){out.strategy_used='direct_explanation';out.pedagogical_state.last_strategy='direct_explanation'}return out;
    }
    if(/^(?:terminar|terminamos|finalizar|cerrar|quiero terminar|dejamos aqui)$/.test(t)||studentAction==='close'){
      const out=finishQuestion(basePayload(mode,ps,ms));out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;
      out.reply=['exam','practice'].includes(mode)?`Cerramos este bloque de ${l.title.toLowerCase()}: ${ms.correct_count||0} respuestas correctas y ${ms.incorrect_count||0} intentos con error. Es el resultado de esta práctica, no una nota de toda la asignatura.`:`De acuerdo, lo dejamos aquí. Hemos trabajado ${l.title.toLowerCase()}.`;
      out.pedagogical_state.conversation_stage='complete';out.pedagogical_state.next_teaching_goal=null;return out;
    }
    if(/^(?:no se|no lo se|dame una pista|necesito una pista|otra pista|no entiendo|no lo entiendo|explicamelo mas facil|mas facil|explicamelo mejor|explicamelo de otra forma)$/.test(t)||['hint_request','not_understood'].includes(studentAction)){
      if(!pending&&ps.simplification_level>=1)return null; // Never repeat the same prepared explanation indefinitely.
      const out=basePayload(mode,ps,ms),help=Math.min(5,Number(ps.current_help_level||0)+1);out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;out.help_level=help;out.strategy_used=help===1?'socratic_question':'worked_example';
      out.reply=help===1?`Vamos con un paso pequeño. ${pending?l.hint:l.simple}`:help===2?`Probemos otra forma. ${l.simple}\n\n${l.example}`:null;
      if(!out.reply)return null;
      out.check_question=pending?ps.pending_question:null;out.pedagogical_state.current_help_level=help;out.pedagogical_state.last_strategy=out.strategy_used;out.pedagogical_state.simplification_level=Number(ps.simplification_level||0)+1;out.pedagogical_state.confusion_count=Number(ps.confusion_count||0)+1;
      if(studentAction==='hint_request')out.library_hint=true;return out;
    }
    if(/^(?:dame un ejemplo|ponme un ejemplo|otro ejemplo|un ejemplo)$/.test(t)){
      if(ps.last_strategy==='worked_example')return null;const out=basePayload(mode,ps,ms);out.reply=l.example;out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;out.strategy_used='worked_example';out.pedagogical_state.last_strategy='worked_example';out.check_question=pending?ps.pending_question:null;return out;
    }
    if(/^(?:explicame mas|cuentame mas|quiero saber mas|profundiza|mas detalles)$/.test(t)){
      if(ps.last_strategy==='visual_structure')return null;const out=basePayload(mode,ps,ms);out.reply=l.more;out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;out.strategy_used='visual_structure';out.pedagogical_state.last_strategy='visual_structure';out.check_question=pending?ps.pending_question:null;return out;
    }
    if(!pending)return null;
    const chosen=selectedOption(text,pending.question);if(!chosen)return null;
    const correct=chosen.index===pending.question.answer_index,assessment=correct?'correct':'incorrect',out=basePayload(mode,ps,ms);
    const updated={...ms,question_number:pending.seq+1,correct_count:Number(ms.correct_count||0)+(correct?1:0),incorrect_count:Number(ms.incorrect_count||0)+(correct?0:1)};
    out.mode_state=updated;out.subject=l.subject;out.concept=l.title;out.lesson_id=l.id;out.student_answer_assessment=assessment;out.help_level=Number(ps.current_help_level||0);out.strategy_used=correct?'retrieval_practice':'error_analysis';out.pedagogical_state.student_answer_assessment=assessment;
    if(!correct&&Number(ps.current_help_level||0)>=2)return null;
    if(!correct){out.reply=`No del todo. ${l.hint} Vuelve a mirar las opciones; seguimos con esta misma pregunta.`;out.check_question=ps.pending_question;out.pedagogical_state.current_help_level=Math.min(5,Number(ps.current_help_level||0)+1);out.pedagogical_state.last_strategy='error_analysis';return out}
    const feedback=`Sí: ${pending.question.options[chosen.index]}.`;
    if(['exam','practice'].includes(mode)&&pending.seq<2){const next=newQuestion(l,mode,ps,updated,pending.start,pending.seq+1,pending.nonce,feedback+' Seguimos con otra idea del mismo tema.');next.student_answer_assessment=assessment;next.pedagogical_state.student_answer_assessment=assessment;next.help_level=out.help_level;return next}
    finishQuestion(out);out.reply=['exam','practice'].includes(mode)?`${feedback} Has completado las tres preguntas de este bloque, con ${updated.correct_count} respuestas correctas y ${updated.incorrect_count} intentos con error. Estos tres ejercicios no bastan para afirmar que dominas todo el tema.`:`${feedback} ${l.more}`;
    out.pedagogical_state.last_tutor_act='summarize';out.pedagogical_state.last_strategy='retrieval_practice';out.pedagogical_state.conversation_stage=['exam','practice'].includes(mode)?'complete':'explaining';out.pedagogical_state.next_teaching_goal=['exam','practice'].includes(mode)?null:`libv1:${l.id}:${mode}`;return out;
  }
  root.EternaLibraryFirstV1=Object.freeze({releaseId:data.release_id,lessonCount:data.lessons.length,questionCount:data.lessons.length*3,protocolCount:data.protocols.length,protocolKind,protocolReply,lessonReply,ownsPending,course,lessonRequest,questionText});
})(globalThis);
