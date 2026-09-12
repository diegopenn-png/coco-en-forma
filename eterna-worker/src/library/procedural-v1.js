/* Deterministic exercise factory for ETERNA. No network or generative model.
 * Does not turn normative source paragraphs into unreviewed teaching claims.
 * A finite, explicit set of domain rules produces checkable variations.
 * Never trust an answer key or arbitrary expression supplied by a client.
 */
(function(root){
  'use strict';
  const VERSION='procedural-practice-v1';
  const STAGES=['primaria','eso','bachillerato'];
  const SRC={primaria:'BOE-A-2022-3296',eso:'BOE-A-2022-4975',bachillerato:'BOE-A-2022-5521'};
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim();
  const clean=v=>normalize(v).replace(/^hola(?: eterna)? /,'').replace(/^eterna /,'').replace(/ eterna$/,'').replace(/ (?:por favor|porfa|gracias)$/,'').trim();
  const specs=[
    ['add','sumas',['suma','sumas','adicion'],{primaria:1,eso:1,bachillerato:1}],
    ['subtract','restas',['resta','restas','sustraccion'],{primaria:1,eso:1,bachillerato:1}],
    ['multiply','multiplicaciones',['multiplicacion','multiplicaciones','tablas de multiplicar'],{primaria:3,eso:1,bachillerato:1}],
    ['divide','divisiones exactas',['division','divisiones','divisiones exactas'],{primaria:3,eso:1,bachillerato:1}],
    ['equivalent','fracciones equivalentes',['fracciones equivalentes'],{primaria:4,eso:1,bachillerato:1}],
    ['fraction_sum','sumas de fracciones',['suma de fracciones','sumas de fracciones','fracciones con igual denominador'],{primaria:5,eso:1,bachillerato:1}],
    ['percent','porcentajes',['porcentaje','porcentajes'],{primaria:5,eso:1,bachillerato:1}],
    ['linear','ecuaciones de primer grado',['ecuaciones','ecuaciones de primer grado','ecuaciones lineales'],{eso:1,bachillerato:1}],
    ['area','área de rectángulos',['area','areas','area de rectangulos','area del rectangulo'],{primaria:4,eso:1,bachillerato:1}],
    ['perimeter','perímetros de rectángulos',['perimetro','perimetros','perimetros de rectangulos'],{primaria:3,eso:1,bachillerato:1}],
    ['decimals','comparación de decimales',['decimales','comparacion de decimales'],{primaria:4,eso:1,bachillerato:1}],
    ['length','unidades de longitud',['longitud','metros y centimetros','unidades de longitud'],{primaria:3,eso:1,bachillerato:1}],
    ['duration','duraciones',['duraciones','horas y minutos','duracion'],{primaria:3,eso:1,bachillerato:1}],
    ['powers','potencias',['potencias','cuadrados y cubos'],{primaria:6,eso:1,bachillerato:1}],
    ['probability','probabilidad con dados',['probabilidad','probabilidad con dados'],{eso:2,bachillerato:1}],
    ['derivative','derivadas de monomios',['derivadas','derivadas de monomios'],{bachillerato:1}],
    ['to_be','el verbo to be',['to be','verbo to be','am is are'],{primaria:3,eso:1,bachillerato:1},'Lengua Extranjera: Inglés'],
    ['etre','el verbo être',['etre','verbo etre','etre en frances'],{eso:1,bachillerato:1},'Lengua Extranjera: Francés'],
    ['grammar','clases de palabras',['clases de palabras','sustantivos adjetivos y verbos','categorias gramaticales'],{primaria:3,eso:1,bachillerato:1},'Lengua Castellana y Literatura'],
    ['states','cambios de estado',['cambios de estado','estados de la materia'],{primaria:4,eso:1,bachillerato:1},'Ciencias'],
    ['speed','rapidez media',['rapidez media','distancia y tiempo'],{eso:2,bachillerato:1},'Física y Química'],
    ['scientific','notación científica',['notacion cientifica'],{eso:3,bachillerato:1}]
  ];
  const SKILLS=Object.freeze(specs.map(([id,title,aliases,min,subject='Matemáticas'])=>Object.freeze({id,title,aliases,min,subject,optional_subject_must_match_school_offer:['etre'].includes(id)})));
  const byId=new Map(SKILLS.map(s=>[s.id,s]));
  const MARK=/^proc:v1:([a-z_]+):([a-f0-9]{8}):([0-2]):([0-3]):(exam|practice)$/;
  function school(profile={}){
    if(profile.preferred_language&&!/^es(?:-es)?$/i.test(profile.preferred_language))return null;
    const s=normalize(profile.school_year);let m=s.match(/^([1-6])(?:º|o)? de primaria$/);if(m)return{stage:'primaria',grade:Number(m[1])};
    m=s.match(/^([1-4])(?:º|o)? de eso$/);if(m)return{stage:'eso',grade:Number(m[1])};
    m=s.match(/^([1-2])(?:º|o)? de bachillerato$/);return m?{stage:'bachillerato',grade:Number(m[1])}:null;
  }
  function eligible(skill,profile){const p=school(profile);return !!p&&Number.isInteger(skill?.min?.[p.stage])&&p.grade>=skill.min[p.stage]}
  function seedValue(value){if(typeof value==='string'&&/^[a-f0-9]{8}$/.test(value))return parseInt(value,16)>>>0;if(Number.isInteger(value)&&value>=0&&value<=0xffffffff)return value>>>0;throw new TypeError('Invalid bounded exercise seed')}
  const seedText=n=>(n>>>0).toString(16).padStart(8,'0');
  function rng(seed){let x=seed>>>0;return()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const r=a%b;a=b;b=r}return a||1}
  function rational(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b===0)throw Error('Invalid rational');if(b<0){a=-a;b=-b}const g=gcd(a,b);return{n:a/g,d:b/g}}
  const fraction=(a,b)=>{const r=rational(a,b);return r.d===1?String(r.n):`${r.n}/${r.d}`};
  const decimal=n=>(n/100).toFixed(2).replace('.',',');
  const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const canonAnswer=v=>String(v??'').normalize('NFC').replace(/−/g,'-').replace(/\s+/g,' ').trim();
  function options(correct,distractors,random){
    const values=[String(correct),...distractors.map(String)].filter((v,i,a)=>a.indexOf(v)===i);if(values.length<3)throw Error('Non-distinct exercise choices');
    const shuffled=values.slice(0,3);for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
    return{options:shuffled,answer:'ABC'[shuffled.indexOf(String(correct))]};
  }
  const semanticValue=(s)=>{const m=String(s).match(/^(-?\d+)(?:\/(\d+))?$/);return m?rational(Number(m[1]),Number(m[2]||1)):null};
  function makeQuestion(skill,seed,profile,position=0){
    const p=school(profile);if(!eligible(skill,profile))throw Error('Unsupported course for procedural exercise');
    const random=rng(seed),integer=(lo,hi)=>lo+Math.floor(random()*(hi-lo+1)),pick=xs=>xs[integer(0,xs.length-1)];
    const cap=p.stage==='primaria'?(p.grade===1?9:p.grade===2?20:p.grade===3?99:999):999;
    let question,correct,wrong,hint,worked,rule,params;
    const set=(q,a,w,h,work,r,par)=>{question=q;correct=String(a);wrong=w;hint=h;worked=work;rule=r;params=par};
    switch(skill.id){
      case'add':{const a=integer(1,cap),b=integer(1,cap),c=a+b;set(`Calcula ${a} + ${b}.`,c,[c+1,c-1],'Junta las dos cantidades. Puedes separar unidades y decenas antes de sumar.',`${a} + ${b} = ${c}. Comprobación: ${c} − ${b} = ${a}.`,'Sumar reúne cantidades. Recalcular con la resta permite comprobar este resultado.',{a,b});break}
      case'subtract':{const b=integer(1,cap),difference=integer(0,cap),a=b+difference;set(`Calcula ${a} − ${b}.`,difference,[difference+1,difference+2],'Piensa cuánto falta desde la cantidad que quitas hasta la inicial.',`${a} − ${b} = ${difference}. Comprobación: ${difference} + ${b} = ${a}.`,'La diferencia permite comprobar qué queda al quitar una cantidad.',{a,b});break}
      case'multiply':{const a=integer(2,p.stage==='primaria'?10:20),b=integer(2,p.stage==='primaria'?10:20),c=a*b;set(`Calcula ${a} × ${b}.`,c,[c+a,c-1],`Piensa en ${a} grupos de ${b}. No sumes solo los dos números.`,`${a} × ${b} = ${c}; ${c} ÷ ${a} = ${b}.`,'En números naturales, grupos de igual tamaño pueden contarse mediante una multiplicación.',{a,b});break}
      case'divide':{const b=integer(2,12),c=integer(2,12),a=b*c;set(`Divide ${a} entre ${b}. La división es exacta.`,c,[c+1,c+2],`Busca qué número, multiplicado por ${b}, da ${a}.`,`${a} ÷ ${b} = ${c}, porque ${b} × ${c} = ${a}.`,'Una división exacta puede comprobarse multiplicando divisor por cociente.',{a,b});break}
      case'equivalent':{const b=integer(2,12),a=integer(1,b-1),k=integer(2,6);const c=`${a*k}/${b*k}`;set(`¿Qué fracción es equivalente a ${a}/${b}?`,c,[`${a*k+1}/${b*k}`,`${a*k+2}/${b*k}`],'Multiplica numerador y denominador por el mismo número distinto de cero.',`${a}/${b} = ${a*k}/${b*k}: hemos multiplicado ambos términos por ${k}.`,'Fracciones equivalentes representan el mismo número aunque estén escritas con términos distintos.',{a,b,k});break}
      case'fraction_sum':{const d=integer(3,15),a=integer(1,d-1),b=integer(1,d-1);set(`Calcula ${a}/${d} + ${b}/${d}.`,fraction(a+b,d),[fraction(a+b+1,d),fraction(a+b+2,d)],'Las partes tienen el mismo tamaño: suma los numeradores y conserva el denominador.',`${a}/${d} + ${b}/${d} = ${a+b}/${d} = ${fraction(a+b,d)}.`,'Al sumar fracciones con igual denominador contamos partes del mismo tamaño.',{a,b,d});break}
      case'percent':{const percent=pick([10,20,25,50,75]),total=integer(1,20)*20,c=total*percent/100;set(`¿Cuánto es el ${percent} % de ${total}?`,c,[c+5,c+10],'Multiplica la cantidad total por el porcentaje y divide entre cien.',`${total} × ${percent} ÷ 100 = ${c}.`,'Un porcentaje expresa una parte por cada cien; siempre necesita un total de referencia.',{percent,total});break}
      case'linear':{const a=integer(2,9),x=integer(1,12),b=integer(1,20),c=a*x+b;set(`Resuelve ${a}x + ${b} = ${c}. ¿Cuánto vale x?`,x,[x+1,x+2],`Primero resta ${b} en ambos miembros; después divide entre ${a}.`,`${a}x = ${c} − ${b} = ${c-b}; x = ${c-b}/${a} = ${x}. Al sustituir: ${a}·${x}+${b}=${c}.`,'Una ecuación conserva sus soluciones al realizar operaciones equivalentes en los dos miembros.',{a,b,c});break}
      case'area':{const a=integer(2,20),b=integer(2,20),c=a*b;set(`Un rectángulo tiene base ${a} cm y altura ${b} cm. ¿Cuál es su área?`,`${c} cm²`,[`${c+1} cm²`,`${c+a} cm²`],'Piensa en filas y columnas de cuadrados unidad. Usa unidades cuadradas.',`Área = ${a} × ${b} = ${c} cm².`,'El área de un rectángulo es base por altura; no es la longitud del contorno.',{a,b});break}
      case'perimeter':{const a=integer(2,20),b=integer(2,20),c=2*(a+b);set(`Un rectángulo tiene lados de ${a} cm y ${b} cm. ¿Cuál es su perímetro?`,`${c} cm`,[`${c+2} cm`,`${c+4} cm`],'Recorre los cuatro lados: hay dos de cada longitud.',`Perímetro = ${a} + ${b} + ${a} + ${b} = ${c} cm.`,'El perímetro mide el contorno y se expresa en unidades de longitud.',{a,b});break}
      case'decimals':{const a=integer(1,850),b=a+integer(1,60),c=b+integer(1,60);set(`¿Cuál de estos números decimales es mayor?`,decimal(c),[decimal(a),decimal(b)],'Compara primero las unidades, después las décimas y luego las centésimas.',`${decimal(c)} > ${decimal(b)} > ${decimal(a)}. Comparamos posiciones, no la cantidad de cifras.`,'El valor de cada cifra decimal depende de su posición.',{hundredths:[a,b,c]});break}
      case'length':{const n=integer(2,90),unit=pick(['m_cm','km_m','cm_mm']),f=unit==='km_m'?1000:unit==='m_cm'?100:10,from={m_cm:'m',km_m:'km',cm_mm:'cm'}[unit],to={m_cm:'cm',km_m:'m',cm_mm:'mm'}[unit];set(`Expresa ${n} ${from} en ${to}.`,`${n*f} ${to}`,[`${n*f+f} ${to}`,`${n*f-f} ${to}`],`Una unidad de ${from} contiene ${f} unidades de ${to}.`,`${n} × ${f} = ${n*f}; por tanto, ${n} ${from} = ${n*f} ${to}.`,'Cambiar de unidad modifica el número de la medida, no la longitud del objeto.',{n,f,from,to});break}
      case'duration':{const start=integer(8*60,17*60),minutes=integer(10,100),end=start+minutes;set(`Una actividad empieza a las ${clock(start)} y dura ${minutes} minutos. ¿A qué hora termina el mismo día?`,clock(end),[clock(end+5),clock(end-5)],'Recuerda que sesenta minutos forman una hora, no cien.',`${clock(start)} más ${minutes} minutos son las ${clock(end)}.`,'Una duración indica cuánto tiempo pasa; no es lo mismo que una hora del reloj.',{start,minutes});break}
      case'powers':{const a=integer(2,9),n=integer(2,p.stage==='primaria'?2:3),c=a**n;set(`Calcula ${a}${n===2?'²':'³'}.`,c,[c+1,c+a],`Multiplica ${n} factores iguales a ${a}; no multipliques solo la base por el exponente.`,`Multiplicamos los factores: ${Array(n).fill(a).join(' × ')} = ${c}.`,'Una potencia de exponente natural indica cuántas veces aparece la base como factor.',{a,n});break}
      case'probability':{const k=integer(2,5),side=pick(['less','atmost']),fav=side==='less'?k-1:k;const a=fraction(fav,6),wrong0=fraction((fav%5)+1,6),wrong1=fraction(((fav+1)%5)+1,6);set(`Lanzamos un dado equilibrado de seis caras numeradas del 1 al 6. ¿Cuál es la probabilidad de obtener un número ${side==='less'?'menor que':'menor o igual que'} ${k}?`,a,[wrong0,wrong1],'Cuenta los resultados que cumplen la condición y compáralos con los seis equiprobables.',`Hay ${fav} resultados favorables de 6: ${fav}/6 = ${a}.`,'La proporción casos favorables/casos posibles se aplica aquí porque los resultados son equiprobables.',{k,side,fav});break}
      case'derivative':{const a=integer(2,9),n=integer(2,5),c=a*n;const expr=(coef,exp)=>`${coef}x${exp===1?'':'^'+exp}`;set(`Deriva f(x) = ${a}x^${n} respecto de x.`,expr(c,n-1),[expr(c+1,n-1),expr(c,n)],'Multiplica el coeficiente por el exponente y reduce el exponente en una unidad.',`f′(x) = ${a}·${n}x^(${n}−1) = ${expr(c,n-1)}.`,'Para este monomio, d(ax^n)/dx = a·n·x^(n−1).',{a,n});break}
      case'to_be':{const subjects=[['I','am'],['You','are'],['He','is'],['She','is'],['It','is'],['We','are'],['They','are']],sub=pick(subjects),end=pick(['here','at school','ready','in the classroom']);set(`Completa en presente: ${sub[0]} ___ ${end}.`,sub[1],['am','is','are'].filter(x=>x!==sub[1]),'Identifica el sujeto: I am; he/she/it is; you/we/they are.',`Con ${sub[0]} usamos ${sub[1]}: ${sub[0]} ${sub[1]} ${end}.`,'To be cambia de forma según el sujeto. Su traducción depende del contexto.',{subject:sub[0],ending:end});break}
      case'etre':{const subjects=[['Je','suis'],['Tu','es'],['Il','est'],['Elle','est'],['Nous','sommes'],['Vous','êtes'],['Ils','sont'],['Elles','sont']],sub=pick(subjects),end=pick(['ici','dans la classe','à la maison']);set(`Completa con être en presente: ${sub[0]} ___ ${end}.`,sub[1],['suis','es','est','sommes','êtes','sont'].filter(x=>x!==sub[1]),'Relaciona el sujeto con su forma: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.',`Con ${sub[0]} usamos ${sub[1]}: ${sub[0]} ${sub[1]} ${end}.`,'Être tiene formas irregulares. No se deduce su conjugación añadiendo una terminación fija.',{subject:sub[0],ending:end});break}
      case'grammar':{const item=pick([['La','casa','blanca'],['El','libro','rojo'],['La','gata','negra'],['El','perro','pequeño'],['El','coche','azul'],['La','flor','roja'],['La','niña','alta'],['El','árbol','verde']]),kind=pick(['sustantivo','adjetivo','verbo']),vals={sustantivo:item[1],adjetivo:item[2],verbo:'está'};set(`En «${item.join(' ')} está aquí», ¿qué palabra es ${kind==='verbo'?'el verbo':'un '+kind}?`,vals[kind],Object.values(vals).filter(x=>x!==vals[kind]),'Observa la función en esta oración: qué nombra, qué cualidad aporta y qué palabra es una forma verbal.',`En esta oración, «${vals[kind]}» funciona como ${kind}.`,'Analizamos las palabras en contexto, no solo por una definición aislada.',{item,kind});break}
      case'states':{const changes=[['sólido','líquido','fusión'],['líquido','gas','vaporización'],['gas','líquido','condensación'],['líquido','sólido','solidificación']],change=pick(changes),material=pick(['agua','una sustancia pura','la misma sustancia']);set(`Se describe un cambio físico de ${material}: pasa de estado ${change[0]} a ${change[1]}. ¿Cómo se llama ese cambio?`,change[2],changes.map(x=>x[2]).filter(x=>x!==change[2]),'Identifica por separado el estado inicial y el final. La sustancia no se transforma químicamente en otra.',`${change[0]} → ${change[1]}: ${change[2]}.`,'Un cambio de estado no es por sí mismo una reacción química.',{initial:change[0],final:change[1],material});break}
      case'speed':{const t=integer(2,20),v=integer(2,20),d=t*v;set(`En una actividad teórica, un objeto recorre ${d} m de distancia total en ${t} s. ¿Cuál es su rapidez media?`,`${v} m/s`,[`${v+1} m/s`,`${v+2} m/s`],'Divide la distancia total recorrida entre el tiempo total. No confundas distancia con desplazamiento.',`${d} m ÷ ${t} s = ${v} m/s.`,'La rapidez media se obtiene con distancia total/tiempo total. No requiere suponer un movimiento uniforme.',{d,t});break}
      case'scientific':{const a=integer(2,9),n=integer(3,6),value=a*10**n;set(`Escribe ${value} en notación científica normalizada.`,`${a} × 10^${n}`,[`${a+1} × 10^${n}`,`${a} × 10^${n-1}`],'La mantisa positiva debe ser al menos 1 y menor que 10. Cuenta cuántas posiciones cambia la coma.',`${value} = ${a} × 10^${n}.`,'En notación científica normalizada, el valor absoluto de la mantisa pertenece al intervalo [1,10).',{a,n,value});break}
      default:throw Error('Unknown fixed exercise family');
    }
    const q={id:`proc:${skill.id}:${seedText(seed)}:${position}`,question,...options(correct,wrong,random),hint,worked,rule,params,correct_value:correct};
    if(q.options.some((x,i,a)=>a.findIndex(v=>canonAnswer(v)===canonAnswer(x))!==i))throw Error('Ambiguous normalized options');
    if(question.length>420||q.options.some(x=>x.length>90))throw Error('Exercise exceeds state budget');
    return q;
  }
  function generate(skillId,seed,profile){
    const skill=byId.get(skillId);if(!eligible(skill,profile))return null;const n=seedValue(seed),p=school(profile),quiz=[],used=new Set();
    for(let position=0;position<3;position++){
      let q;for(let attempt=0;attempt<96;attempt++){const s=(n+Math.imul(position+1,0x9e3779b9)+attempt*7919)>>>0;q=makeQuestion(skill,s,profile,position);const key=q.question+'|'+[...q.options].sort().join('|');if(!used.has(key)){used.add(key);break}q=null}
      if(!q)throw Error('Insufficient distinct fixed-family variants');quiz.push(q);
    }
    const id=`proc-${skill.id}-${seedText(n)}`;
    return{id,title:`Práctica de ${skill.title}`,stage:p.stage,subject:skill.subject,school_years:[profile.school_year],grade_min:p.grade,grade_max:p.grade,aliases:[],explanation:quiz[0].rule,simpler:quiz[0].hint,example:quiz[0].worked,why:quiz[0].rule,misconception:'Revisa la condición y las unidades del enunciado; no elijas por la posición de una opción.',quiz,curriculum_source:'https://www.boe.es/buscar/act.php?id='+SRC[p.stage],curriculum_source_key:SRC[p.stage],source_kind:'deterministic_generated_exercise',generator_version:VERSION,skill_id:skillId,seed:seedText(n),human_teacher_reviewed:false,official_endorsement:false};
  }
  const question=q=>`${q.question}\n${q.options.map((o,i)=>`${'ABC'[i]}) ${o}`).join('\n')}`;
  function owned(ped,profile,mode){
    const m=String(ped?.next_teaching_goal||'').match(MARK);if(!m||m[5]!==mode||ped.current_mode!==mode)return null;
    const lesson=generate(m[1],m[2],profile);if(!lesson||normalize(ped.active_concept)!==normalize(lesson.title))return null;
    const position=Number(m[3]),attempts=Number(m[4]),q=lesson.quiz[position];
    if(ped.pending_question&&ped.pending_question!==question(q))return null;
    return{lesson,position,attempts,question:q};
  }
  function selected(text,profile){
    if(typeof text!=='string'||text.length>180||/[\n\r<>`{}\[\]]/.test(text))return null;
    let s=clean(text),m=s.match(/^(?:(?:dame|ponme|prepara|preparame|quiero|necesito|hagamos|hazme) )?(?:(?:mas|otros|nuevos) ejercicios|ejercicios(?: nuevos| variados)?|una ronda(?: nueva)?|practica variada|practicar con otros numeros) (?:de|sobre) (.+)$/);
    if(!m)return null;let target=m[1].replace(/^(?:la|el|las|los) /,'');
    const hits=SKILLS.filter(skill=>eligible(skill,profile)&&skill.aliases.includes(target));return hits.length===1?hits[0]:null;
  }
  function freshSeed(){if(root.crypto?.getRandomValues)return root.crypto.getRandomValues(new Uint32Array(1))[0];throw Error('Secure random seed unavailable')}
  function answer(text,q){
    const s=clean(text),m=s.match(/^(?:(?:creo que es|la respuesta es|la opcion|opcion|la) )?(a|b|c|be|ce)$/);
    if(m)return{a:'A',b:'B',be:'B',c:'C',ce:'C'}[m[1]];
    const raw=canonAnswer(text);const hits=q.options.map((v,i)=>[canonAnswer(v),i]).filter(([v])=>v===raw||'es '+v===raw);return hits.length===1?'ABC'[hits[0][1]]:null;
  }
  function clientTurn(text,{profile,pedState,mode}={}){
    const active=owned(pedState,profile,mode);if(!active)return text;const topic=active.lesson.title,n=normalize(text);
    const pairs=[
      [`Continúa ahora con lo que quedó pendiente sobre ${topic}. No repitas lo ya explicado; avanza al siguiente punto útil.`,'siguiente'],
      [`No lo entendí. Explícame de nuevo ${topic} con una estrategia realmente distinta: cambia la representación, analogía o ejemplo y divide la idea en menos pasos. No reformules simplemente la misma explicación.`,'no lo entiendo'],
      [`Explícame de nuevo ${topic} con una estrategia realmente distinta. No repitas la misma formulación: cambia de representación, ejemplo, analogía o pasos y parte de lo que ya estaba explicado.`,'no lo entiendo'],
      [`Explica por qué ocurre lo que acabamos de mencionar sobre ${topic}. Responde a la causa de la referencia anterior, sin cambiar de tema.`,'por qué']
    ];
    const easier=`Explícame ${topic} más fácil: menos palabras, menos abstracción y menos pasos, pero mantén la precisión. No repitas literalmente la respuesta anterior.`;
    pairs.push([easier,'más fácil'],['SIMPLIFICACIÓN OBLIGATORIA: explica la misma idea con palabras cotidianas, frases cortas y un solo ejemplo concreto. Evita términos técnicos o abstractos como base de la explicación; si uno es imprescindible, explícalo después con palabras sencillas. Máximo tres ideas y no repitas la formulación anterior. '+easier,'más fácil']);
    return pairs.find(([t])=>normalize(t)===n)?.[1]||text;
  }
  function decision({text,profile={},pedState={},modeState={},mode='practice',image=null,newTopic=false,seed}={}){
    if(image||!['exam','practice'].includes(mode)||typeof text!=='string'||text.length>230)return null;
    const active=!newTopic?owned(pedState,profile,mode):null,s=clean(text),skill=selected(text,profile);
    const count=x=>Math.max(0,Math.min(100,Number(x)||0));
    const output=(l,reply,pos,attempts,{check=true,assessment='not_applicable',relation='continuation_request',complete=false,help=0,mode_state=modeState}={})=>({
      lesson:l,reply,position:pos,attempts,check_question:check?question(l.quiz[pos]):null,assessment,relation,complete,help_level:help,strategy:assessment==='incorrect'?'error_analysis':help?'socratic_question':'retrieval_practice',mode_state:{...mode_state,focus:l.title},
      next_teaching_goal:`proc:v1:${l.skill_id}:${l.seed}:${pos}:${attempts}:${mode}`,safety_route:'closed-domain-library-allowlist',model_calls:0,generation_tokens:0,source_kind:'deterministic_generated_exercise',generated_exercise:true,generator_version:VERSION,version:VERSION,official_endorsement:false});
    const start=(id,n)=>{const l=generate(id,n,profile);if(!l)return null;const ms={...modeState,question_number:1,correct_count:0,incorrect_count:0,partial_count:0,difficulty:1};return output(l,'Vamos con tres ejercicios, uno cada vez. Puedes pedir una pista o parar cuando lo necesites.\n\n'+question(l.quiz[0]),0,0,{relation:'new_topic',mode_state:ms})};
    if(skill)return start(skill.id,seed===undefined?freshSeed():seed);
    if(!active)return null;
    const{lesson:l,position,attempts,question:q}=active,hasQ=Boolean(pedState.pending_question);
    if(/^(?:parar|terminar|terminamos|no quiero seguir|lo dejamos aqui|ya esta)$/.test(s))return output(l,'De acuerdo. Dejamos esta ronda aquí; no necesitas terminarla ahora.',position,attempts,{check:false,complete:true,relation:'closure_request'});
    if(!hasQ){
      if(/^(?:otra ronda|otra ronda nueva|mas ejercicios|otros ejercicios|mas ejercicios nuevos|seguimos practicando)$/.test(s))return start(l.skill_id,seed===undefined?(seedValue(l.seed)+0x9e3779b9)>>>0:seed);
      if(/^(?:por que|explica por que)$/.test(s))return output(l,q.worked,position,attempts,{check:false,complete:true,relation:'why_request'});
      return null;
    }
    if(/^(?:pista|una pista|dame una pista|no se|no lo se|ayudame|no lo entiendo|no entiendo|mas facil|explicamelo mas facil)$/.test(s)){
      const used=Math.min(3,count(pedState.current_help_level));if(used>=2)return null;
      const message=used===0?q.hint:`Vamos por partes. ${q.rule} Lee de nuevo la condición y descarta una opción que no la cumpla.`;
      return output(l,message+'\n\n'+question(q),position,attempts,{help:used+1,relation:s.includes('facil')?'simplification_request':'confusion_request'});
    }
    if(/^(?:por que|explica por que)$/.test(s))return output(l,q.rule+'\n\n'+question(q),position,attempts,{help:1,relation:'why_request'});
    if(/^(?:siguiente|otra pregunta|pasar|pasemos)$/.test(s)){
      if(position===2)return output(l,'Cerramos la ronda sin contar la pregunta omitida como acierto ni como error.',position,attempts,{check:false,complete:true,relation:'closure_request'});
      return output(l,'Pasamos sin puntuar la anterior.\n\n'+question(l.quiz[position+1]),position+1,0,{relation:'advance_sequence',mode_state:{...modeState,question_number:count(modeState.question_number)+1}});
    }
    const picked=answer(text,q);if(!picked)return null;
    const right=picked===q.answer,assessment=right?'correct':'incorrect',ms={...modeState,correct_count:count(modeState.correct_count)+(right?1:0),incorrect_count:count(modeState.incorrect_count)+(right?0:1)};
    if(!right&&attempts<2)return output(l,'No del todo. '+(attempts===0?q.hint:`Revisa el procedimiento: ${q.rule}`)+'\n\n'+question(q),position,attempts+1,{assessment,relation:'answer_to_pending',help:attempts+1,mode_state:ms});
    const feedback=(right?'Sí. ':'Revisamos la solución. ')+q.worked;
    if(position<2)return output(l,feedback+'\n\nProbamos otro caso:\n'+question(l.quiz[position+1]),position+1,0,{assessment,relation:'answer_to_pending',mode_state:{...ms,question_number:count(modeState.question_number)+1}});
    return output(l,feedback+'\n\nHemos terminado esta ronda. Es una práctica, no una nota oficial ni una prueba completa de dominio. Puedes pedir «otra ronda».',position,0,{check:false,assessment,relation:'answer_to_pending',complete:true,mode_state:ms});
  }
  root.EternaProceduralPractice=Object.freeze({version:VERSION,skills:SKILLS,school,eligible,generate,makeQuestion,owned,selected,decision,clientTurn,question,answer,semanticValue});
})(globalThis);
