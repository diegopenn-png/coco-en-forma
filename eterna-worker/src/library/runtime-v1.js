/* ETERNA owned teaching library. Pure, bounded, network-free decisions.
 * Only a complete allowlisted utterance may use the no-model path. Unknown,
 * mixed, current, sensitive or open-ended turns return null to the existing tutor.
 * Never trust a client's expected_answer: re-derive from a known question bank.
 */
(function(root){
  'use strict';
  const VERSION='library-first-v1.1';
  const MODES=new Set(['homework','ask','review','explain','exam','practice']);
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-ES').replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim();
  const whole=v=>{const s=norm(v).replace(/^eterna /,'').replace(/ eterna$/,'').replace(/^(?:por favor|porfa) /,'').replace(/ (?:por favor|porfa|gracias)$/,'').trim();return s==='eterna'?'hola':s};
  const bounded=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(100,Number(v)|0)):0;
  const array=v=>Array.isArray(v)?v:[];
  const lessons=()=>array(root.ETERNA_LIBRARY_CONTENT?.lessons);
  const named=v=>String(v??'').replace(/[^\p{L}\p{M} '-]/gu,'').trim().split(/\s+/)[0].slice(0,24);
  function school(profile={}){
    const label=norm(profile.school_year);let m;
    if(/infantil/.test(label)){m=label.match(/([0-5])\s*anos/);return {stage:'infantil',grade:m?Number(m[1]):0}}
    if(/primaria/.test(label)){m=label.match(/([1-6])/);return m?{stage:'primaria',grade:Number(m[1])}:null}
    if(/\beso\b/.test(label)){m=label.match(/([1-4])/);return m?{stage:'eso',grade:Number(m[1])}:null}
    if(/bachillerato/.test(label)){m=label.match(/([1-2])/);return m?{stage:'bachillerato',grade:Number(m[1])}:null}
    return null;
  }
  function appropriate(lesson,profile){const p=school(profile);return !!p&&p.stage===lesson.stage&&p.grade>=lesson.grade_min&&p.grade<=lesson.grade_max}
  const PROTOCOLS=Object.freeze([
    {id:'hello',aliases:['hola','buenos dias','buenas tardes','buenas noches','hey','ey']},
    {id:'how_are_you',aliases:['como estas','que tal','hola como estas','todo bien']},
    {id:'thanks',aliases:['gracias','muchas gracias','mil gracias','te lo agradezco','me has ayudado mucho','de nada']},
    {id:'goodbye',aliases:['adios','hasta luego','nos vemos','chao','chau','hasta manana']},
    {id:'identity',aliases:['quien eres','que eres','como te llamas','eres eterna','eres una persona','eres humana','eres un robot','eres una ia']},
    {id:'mission',aliases:['que puedes hacer','para que sirves','cual es tu mision','como me puedes ayudar']},
    {id:'ai_age',aliases:['cuantos anos tienes','que edad tienes','cuando es tu cumpleanos']},
    {id:'student_age',aliases:['cuantos anos tengo','que edad tengo','sabes mi edad']},
    {id:'student_name',aliases:['como me llamo','sabes mi nombre']},
    {id:'student_course',aliases:['en que curso estoy','sabes mi curso']},
    {id:'date',aliases:['que dia es hoy','cual es la fecha de hoy','a que dia estamos']},
    {id:'time',aliases:['que hora es','que hora es ahora']},
    {id:'pause',aliases:['necesito descansar','quiero descansar','podemos hacer una pausa','hagamos una pausa','voy a descansar','espera un momento']},
    {id:'tired',aliases:['estoy cansado','estoy cansada','me siento cansado','me siento cansada']},
    {id:'self_doubt',aliases:['soy tonto','soy tonta','se me da todo mal','nunca voy a aprender','no soy capaz']},
    {id:'exam_nerves',aliases:['estoy nervioso por el examen','estoy nerviosa por el examen','me preocupa el examen','tengo miedo al examen']},
    {id:'reading_embarrassment',aliases:['me da verguenza leer','me da verguenza leer en voz alta','me da verguenza preguntar en clase']},
    {id:'agency',aliases:['puedo equivocarme','esta mal equivocarse','que pasa si me equivoco']},
    {id:'honesty',aliases:['puedes equivocarte','siempre tienes razon','eres perfecta']},
    {id:'privacy',aliases:['que sabes de mi','guardas lo que te digo','puedo contarte un secreto']},
    {id:'human_support',aliases:['eres mi mejor amiga','solo quiero hablar contigo','solo tu me entiendes']},
    {id:'learning_plan',aliases:['como estudio mejor','como puedo estudiar mejor','como organizo el estudio']},
    {id:'small_step',aliases:['por donde empiezo','no se por donde empezar']},
    {id:'school_boredom',aliases:['me aburro estudiando','estudiar es aburrido','no me gusta estudiar']}
  ]);
  const protocolIndex=new Map(PROTOCOLS.flatMap(p=>p.aliases.map(a=>[a,p.id])));
  function protocol(text){if(typeof text!=='string'||text.length>150)return null;const normalized=norm(text),withoutName=normalized.replace(/^eterna /,'').replace(/ eterna$/,'');const id=protocolIndex.get(normalized)||protocolIndex.get(withoutName==='eterna'?'hola':withoutName);return id?{kind:'library_protocol',protocol:id}:null}
  function cordial(kind,{text='',profile={},base={},pedState={},now=new Date()}={}){
    const n=named(base.apodo||profile.apodo),name=n?', '+n:'',pending=Boolean(pedState.pending_question),index=bounded(pedState.turn_index)%3,p=school(profile),young=p?.stage==='infantil'||(p?.stage==='primaria'&&p.grade<=2);
    const continuation=pending?'Podemos seguir con la pregunta que teníamos, sin empezar de nuevo.':'Dime qué te gustaría aprender hoy.';
    switch(kind){
      case'hello':return [`¡Hola${name}! ${continuation}`,`¡Qué bien verte por aquí${name}! ${continuation}`,`¡Hola${name}! Vamos paso a paso. ${continuation}`][index];
      case'how_are_you':return `Estoy lista para ayudarte${name}. ${pending?'Seguimos con calma cuando estés preparado.':'¿Cómo vienes hoy: con una duda o con ganas de practicar?'}`;
      case'thanks':return [`¡De nada${name}! Podemos avanzar a tu ritmo.`,`¡De nada${name}! Me alegra que la explicación te haya servido.`,`Gracias a ti por trabajar la idea${name}. Podemos continuar cuando te venga bien.`][index];
      case'goodbye':return `¡Hasta luego${name}! Descansa y disfruta también fuera de la pantalla.`;
      case'identity':return young?'Me llamo Eterna. Soy una IA: un programa que te ayuda a aprender. No soy una persona y a veces puedo equivocarme.':'Me llamo Eterna. Soy la IA tutora escolar de Coco en Forma, no una persona. Te ayudo a comprender, practicar y revisar; puedo equivocarme, así que compruebo lo importante y te diré cuando algo no esté claro.';
      case'mission':return 'Mi trabajo es ayudarte a aprender, no hacer pasar mis respuestas por tu trabajo. Puedo explicar una idea de otra forma, darte una pista, revisar un intento o practicar contigo una pregunta cada vez.';
      case'ai_age':return 'No tengo edad ni cumpleaños como una persona: soy una IA. Puedo adaptar la explicación al curso con el que estás trabajando.';
      case'student_age':{const age=Number(base.edad??profile.age);return Number.isInteger(age)&&age>=3&&age<=99?`En el perfil figura que tienes ${age} años. Si ese dato ha cambiado, se puede corregir en el perfil.`:'No tengo una edad confirmada en el perfil. Puedo adaptar el trabajo al curso que tienes configurado; no hace falta que me des tu fecha de nacimiento.'}
      case'student_name':return n?`En el perfil apareces como ${n}.`:'No tengo un nombre confirmado en este perfil; podemos seguir sin que me des datos personales.';
      case'student_course':return profile.school_year?`Tu perfil está configurado en ${String(profile.school_year).slice(0,80)}. Si no es tu curso actual, conviene actualizarlo.`:'No tengo un curso confirmado en el perfil.';
      case'date':{const zone=norm(profile.autonomous_community)==='canarias'?'Atlantic/Canary':'Europe/Madrid';return `Hoy es ${new Intl.DateTimeFormat('es-ES',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now)}.`}
      case'time':{const canary=norm(profile.autonomous_community)==='canarias',zone=canary?'Atlantic/Canary':'Europe/Madrid';return `Son las ${new Intl.DateTimeFormat('es-ES',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}).format(now)}, ${canary?'hora de Canarias':'hora peninsular española'}.`}
      case'pause':return `Claro${name}. Puedes dejarlo aquí y descansar; no hace falta terminar ahora. ${pending?'La pregunta queda pendiente para cuando retomes la actividad.':''}`.trim();
      case'tired':return `Gracias por decírmelo${name}. Hagamos una pausa fuera de la pantalla. Después podemos volver con un solo paso pequeño; no hay que hacerlo todo de golpe.`;
      case'self_doubt':return `Que una tarea te cueste no dice cuánto vales${name}. Podemos dividirla en pasos pequeños y probar otra explicación. ${pending?'Dime en qué parte de la pregunta te has atascado.':'¿Qué parte te está costando ahora?'}`;
      case'exam_nerves':return `Entiendo que el examen pueda preocuparte${name}. No necesitas demostrarlo todo de golpe: podemos practicar una pregunta y revisar qué te ayuda. Si esos nervios te desbordan, coméntalo con tu familia o tu profesor.`;
      case'reading_embarrassment':return `Preguntar o equivocarse al leer no es un motivo de vergüenza${name}. Puedes empezar con una frase corta y pedir ayuda a tu profesor en privado. No hace falta hacerlo perfecto para empezar.`;
      case'agency':return 'Sí, puedes equivocarte. Un error nos sirve para ver qué paso conviene revisar. Te señalaré algo concreto que puedas mejorar, sin etiquetas ni compararte con otros.';
      case'honesty':return 'Puedo equivocarme. Por eso distingo lo comprobado de lo dudoso, reviso los cálculos cuando es posible y no debería inventar una respuesta para parecer segura. Si algo no encaja, lo revisamos.';
      case'privacy':return 'Utilizo la información escolar disponible para ayudarte. No compartas contraseñas, dirección, teléfonos ni secretos que te hagan sentir inseguro. La información sobre el uso de datos está en Tu privacidad; si algo te preocupa, habla con un adulto de confianza.';
      case'human_support':return 'Puedo escucharte y ayudarte a aprender, pero soy una IA y no sustituyo a las personas que te quieren. También es importante poder hablar con tu familia, tus amigos o un profesor de confianza.';
      case'learning_plan':return 'Elige un objetivo pequeño, intenta recordarlo o resolver un ejemplo sin mirar y comprueba después qué faltaba. Haz una pausa y vuelve a practicar otro día. Podemos empezar por un tema concreto, sin convertir el estudio en una carrera.';
      case'small_step':return pending?'Empecemos por entender qué pide la pregunta. Dime qué parte reconoces y cuál te resulta nueva; no hace falta resolverla entera todavía.':'Empecemos por una sola cosa: dime la asignatura y el tema que quieres trabajar.';
      case'school_boredom':return 'Podemos cambiar la forma de trabajar: un ejemplo cercano, una pregunta corta o una actividad práctica. No hace falta que te guste todo para avanzar; busquemos una pequeña meta que tenga sentido para ti.';
      default:return null;
    }
  }
  function exactLesson(text,profile){
    if(typeof text!=='string'||text.length>230||/[\n\r<>`{}\[\]]/.test(text))return null;
    let s=whole(text);
    // A grammar, not a fuzzy substring match. Every remaining word must be an alias.
    s=s.replace(/^(?:quiero|necesito) (?:aprender|entender|practicar|repasar|estudiar)(?: sobre)? /,'')
      .replace(/^(?:explicame|explica|ensename|cuentame|ayudame con|ayudame a entender|repasar|practicar|repasemos|practiquemos)(?: sobre)? /,'')
      .replace(/^(?:que es|que son|en que consiste|como funciona|como funcionan) /,'')
      .replace(/^(?:el|la|los|las|un|una) /,'').trim();
    const hits=lessons().filter(l=>appropriate(l,profile)&&[l.title,...l.aliases].some(a=>norm(a).replace(/^(?:el|la|los|las|un|una) /,'')===s));
    return hits.length===1?hits[0]:null;
  }
  const MARK=/^lib:v1:([a-z0-9-]+):([0-2]):([0-3]):(homework|ask|review|explain|exam|practice)$/;
  function owned(ped,profile,mode){
    const m=String(ped?.next_teaching_goal||'').match(MARK);if(!m||m[4]!==mode||ped.current_mode!==mode)return null;
    const lesson=lessons().find(l=>l.id===m[1]);if(!lesson||!appropriate(lesson,profile)||norm(ped.active_concept)!==norm(lesson.title))return null;
    const position=Number(m[2]),attempts=Number(m[3]),q=lesson.quiz[position];
    if(ped.pending_question&&ped.pending_question!==question(q))return null;
    return {lesson,position,attempts,question:q};
  }
  // The PWA expands a few short commands before sending them. Decode only the
  // complete canonical templates for the verified current lesson/question.
  // Never strip an arbitrary prefix, trailing clause, or untrusted answer key.
  function clientTurn(text,{profile={},pedState={},mode='ask'}={}){
    if(typeof text!=='string'||text.length>2400)return text;
    const active=owned(pedState,profile,mode);if(!active)return text;
    const topic=active.lesson.title,templates=new Map();
    const add=(raw,value)=>templates.set(norm(raw),value);
    if(pedState.pending_question){
      for(const answer of ['sí','no'])add(`Mi respuesta a tu última comprobación es ${answer}. Evalúala usando exactamente la pregunta anterior: ${question(active.question)}`,answer);
    }else add(`Sí. Continúa con la explicación que acababas de ofrecer sobre ${topic} y resuelve lo que quedó pendiente.`,'siguiente');
    add(`Continúa ahora con lo que quedó pendiente sobre ${topic}. No repitas lo ya explicado; avanza al siguiente punto útil.`,'siguiente');
    add(`Explica por qué ocurre lo que acabamos de mencionar sobre ${topic}. Responde a la causa de la referencia anterior, sin cambiar de tema.`,'por qué');
    add(`No lo entendí. Explícame de nuevo ${topic} con una estrategia realmente distinta: cambia la representación, analogía o ejemplo y divide la idea en menos pasos. No reformules simplemente la misma explicación.`,'no lo entiendo');
    add(`Explícame de nuevo ${topic} con una estrategia realmente distinta. No repitas la misma formulación: cambia de representación, ejemplo, analogía o pasos y parte de lo que ya estaba explicado.`,'no lo entiendo');
    const simpler=`Explícame ${topic} más fácil: menos palabras, menos abstracción y menos pasos, pero mantén la precisión. No repitas literalmente la respuesta anterior.`;
    const prefix='SIMPLIFICACIÓN OBLIGATORIA: explica la misma idea con palabras cotidianas, frases cortas y un solo ejemplo concreto. Evita términos técnicos o abstractos como base de la explicación; si uno es imprescindible, explícalo después con palabras sencillas. Máximo tres ideas y no repitas la formulación anterior. ';
    add(simpler,'más fácil');add(prefix+simpler,'más fácil');
    return templates.get(norm(text))||text;
  }
  const question=q=>`${q.question}\n${q.options.map((o,i)=>`${'ABC'[i]}) ${o}`).join('\n')}`;
  function choice(text,q){
    const s=whole(text),letter=s.match(/^(?:(?:creo que es|creo que|la respuesta es|la opcion|opcion|la) )?([abc])$/);
    if(letter)return letter[1].toUpperCase();
    const matches=q.options.map((o,i)=>[norm(o),'ABC'[i]]).filter(([o])=>o===s||'es '+o===s);
    return matches.length===1?matches[0][1]:null;
  }
  function decision({text,profile={},pedState={},modeState={},mode='ask',image=null,newTopic=false}={}){
    if(image||!MODES.has(mode)||typeof text!=='string'||text.length>230)return null;
    const s=whole(text),active=!newTopic?owned(pedState,profile,mode):null,direct=exactLesson(text,profile);
    const base={safety_route:'closed-domain-library-allowlist',model_calls:0,generation_tokens:0,version:VERSION,source_kind:'original_teaching_material',official_endorsement:false};
    const output=(l,reply,check=null,assessment='not_applicable',position=0,attempts=0,relation='continuation_request',extra={})=>({
      ...base,lesson:l,reply,check_question:check,assessment,position,attempts,relation,
      mode_state:{...modeState,focus:l.title},help_level:0,strategy:check?'retrieval_practice':'direct_explanation',
      next_teaching_goal:`lib:v1:${l.id}:${position}:${attempts}:${mode}`, ...extra
    });
    if(active){
      const {lesson:l,position,attempts,question:q}=active,hasQ=Boolean(pedState.pending_question);
      if(/^(?:terminar|terminamos|parar|no quiero seguir|ya esta|lo dejamos aqui)$/.test(s))return output(l,'De acuerdo. Dejamos la actividad aquí. Puedes retomarla en otra ocasión.',null,'not_applicable',position,attempts,'closure_request',{complete:true});
      if(/^(?:no lo entiendo|no entiendo|explicamelo mas facil|mas facil|no lo comprendo|otra explicacion)$/.test(s)){
        if(array(pedState.explained_points).includes('lib:v1:simpler'))return null;
        // Never disclose a prepared solution before the first exam/practice attempt.
        const scaffold=['exam','practice'].includes(mode)&&hasQ?q.hint:l.simpler;
        return output(l,scaffold+(hasQ?'\n\nVolvemos a la misma pregunta:\n'+question(q):''),hasQ?question(q):null,'not_applicable',position,attempts,'simplification_request',{help_level:1,strategy:'analogy',explained_marker:'lib:v1:simpler'});
      }
      if(/^(?:un ejemplo|otro ejemplo|dame un ejemplo|ponme otro ejemplo|explicamelo con un ejemplo)$/.test(s)){
        if(array(pedState.explained_points).includes('lib:v1:example')||(['exam','practice'].includes(mode)&&hasQ&&attempts===0))return null;
        return output(l,l.example+(hasQ?'\n\nPrueba ahora:\n'+question(q):''),hasQ?question(q):null,'not_applicable',position,attempts,'example_request',{help_level:2,strategy:'worked_example',explained_marker:'lib:v1:example'});
      }
      if(/^(?:por que|explica por que|explicame por que)$/.test(s)){
        if(array(pedState.explained_points).includes('lib:v1:why')||(['exam','practice'].includes(mode)&&hasQ&&attempts===0))return null;
        return output(l,l.why+(hasQ?'\n\nPara comprobar la idea:\n'+question(q):''),hasQ?question(q):null,'not_applicable',position,attempts,'why_request',{explained_marker:'lib:v1:why'});
      }
      if(hasQ&&/^(?:una pista|dame una pista|pista|no se|no lo se|ayudame)$/.test(s)){
        const h=Math.min(2,bounded(pedState.current_help_level));
        const hints=[q.hint,'Mira las tres opciones y descarta una que contradiga la idea principal. Puedes responder con A, B o C.',`Busca la relación con esta idea: ${l.simpler}`];
        if(h>=2&&['exam','practice'].includes(mode)&&attempts===0)return null;
        return output(l,hints[h]+'\n\n'+question(q),question(q),'not_applicable',position,attempts,'confusion_request',{help_level:h+1,strategy:'socratic_question'});
      }
      if(hasQ){
        const picked=choice(text,q);
        if(picked){
          const correct=picked===q.answer,assessment=correct?'correct':'incorrect',state={...modeState,focus:l.title};
          state.correct_count=bounded(state.correct_count)+(correct?1:0);state.incorrect_count=bounded(state.incorrect_count)+(correct?0:1);
          state.difficulty=Math.max(1,Math.min(5,Number(state.difficulty||2)+(correct?1:-1)));
          if(!correct&&mode!=='exam'&&attempts<2)return output(l,`No del todo. ${attempts===0?q.hint:'Revisa la relación entre la pregunta y cada opción; no hace falta adivinar.'}\n\n${question(q)}`,question(q),assessment,position,attempts+1,'answer_to_pending',{mode_state:state,help_level:attempts+1,strategy:'error_analysis'});
          const feedback=correct?`Sí: ${q.options['ABC'.indexOf(q.answer)]}.`:`En esta pregunta, la opción adecuada es ${q.answer}: ${q.options['ABC'.indexOf(q.answer)]}. ${q.hint}`;
          if(position<2&&['exam','practice'].includes(mode)){
            const next=l.quiz[position+1];state.question_number=bounded(state.question_number)+1;
            return output(l,feedback+'\n\nSeguimos con una sola pregunta:\n'+question(next),question(next),assessment,position+1,0,'answer_to_pending',{mode_state:state,strategy:'retrieval_practice'});
          }
          const ending=['exam','practice'].includes(mode)?'Hemos terminado esta ronda de tres preguntas. Los resultados son una orientación de esta práctica, no una nota oficial.':'Hemos comprobado esta idea. Puedes pedirme otro ejemplo o cambiar de tema.';
          return output(l,feedback+'\n\n'+ending,null,assessment,position,0,'answer_to_pending',{mode_state:state,complete:true});
        }
        if(/^(?:siguiente|otra pregunta|pasar|pasemos)$/.test(s)&&position<2){
          const state={...modeState,focus:l.title,question_number:bounded(modeState.question_number)+1};
          return output(l,'Pasamos sin contar la anterior como acierto ni como error.\n\n'+question(l.quiz[position+1]),question(l.quiz[position+1]),'not_applicable',position+1,0,'advance_sequence',{mode_state:state});
        }
        // Do not guess whether an open natural-language answer is wrong. Existing tutor handles it.
      }else if(/^(?:siguiente|otra pregunta|practicar|seguimos|continuar|si)$/.test(s)&&position<2){
        const state={...modeState,focus:l.title,question_number:bounded(modeState.question_number)+1};
        return output(l,'Comprobamos otra parte de la idea:\n'+question(l.quiz[position+1]),question(l.quiz[position+1]),'not_applicable',position+1,0,'continuation_request',{mode_state:state});
      }
    }
    if(!direct)return null;
    const l=direct;
    if(mode==='homework')return output(l,`${l.simpler}\n\nPara ayudarte con tu tarea concreta, escribe el enunciado y dime qué has intentado. Te daré una pista cada vez, sin hacer el trabajo por ti.`,null,'not_applicable',0,0,'new_topic',{strategy:'socratic_question',needs_clarification:true});
    if(mode==='review')return output(l,`Revisamos ${l.title.toLocaleLowerCase('es-ES')}. Necesito ver el enunciado y tu respuesta o tus pasos. Primero comprobaré lo que está bien y después el primer error que se pueda demostrar.`,null,'not_applicable',0,0,'new_topic',{strategy:'error_analysis',needs_clarification:true});
    const q=l.quiz[0],state={...modeState,focus:l.title,question_number:1,correct_count:0,partial_count:0,incorrect_count:0,difficulty:1};
    if(['exam','practice'].includes(mode))return output(l,(mode==='exam'?'Hacemos una ronda de tres preguntas, de una en una. Inténtalo antes de ver la explicación.':'Practicamos una idea cada vez. Si te cuesta, puedes pedir una pista.')+'\n\n'+question(q),question(q),'not_applicable',0,0,'new_topic',{mode_state:state});
    return output(l,`${l.explanation}\n\n${l.example}\n\nPara comprobar una sola idea:\n${question(q)}`,question(q),'not_applicable',0,0,'new_topic',{mode_state:state,explained_markers:['lib:v1:intro','lib:v1:example']});
  }
  function contextText(lesson){if(!lesson)return '';return `Material original ETERNA revisado por IA, no texto oficial ni revisión humana. Nivel editorial ${lesson.school_years.join(', ')}.\n${lesson.title}: ${lesson.explanation}\nEjemplo: ${lesson.example}\nError frecuente: ${lesson.misconception}\nLa referencia ${lesson.curriculum_source} es curricular, no aval oficial de esta lección.`}
  root.EternaOwnedLibrary=Object.freeze({version:VERSION,release_id:'eterna-library-2026.09-v1',school,appropriate,protocol,cordial,protocols:PROTOCOLS,exactLesson,owned,clientTurn,decision,question,contextText});
})(globalThis);
