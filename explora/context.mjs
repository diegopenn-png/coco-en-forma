// Optional context is independent of the 54 scored items. This is a transparent
// rules-based baseline; it does not infer the meaning of free text or diagnose.
const options = entries => Object.freeze(entries.map(([id,label]) => Object.freeze({id,label})));
export const CONTEXT_FOCUS = options([
 ['general','Mi vida cotidiana'], ['parent','Como padre o madre'],
 ['adultchild','Como hijo o hija adulta'], ['partner','Mi relación de pareja'],
 ['work','Mi trabajo'], ['leader','Mi actividad profesional o liderazgo'],
 ['school','Mis estudios de colegio o instituto'], ['university','Mis estudios universitarios']
]);
const adultFocus = new Set(['parent','adultchild','partner','work','leader']);
const generalGoals = options([
 ['communicate','Expresar lo que necesito y escuchar'], ['boundaries','Acordar responsabilidades y límites'],
 ['organize','Organizar una tarea'], ['decide','Tomar una decisión concreta']
]);
const childGoals = options([
 ['communicate','Contar lo que necesito y escuchar'], ['boundaries','Decir qué quiero y pedir ayuda'],
 ['organize','Organizar una tarea pequeña'], ['decide','Elegir entre dos opciones']
]);
const studyGoals = options([
 ['remember','Recordar lo que estudio'], ['understand','Comprender y explicar un tema'],
 ['organize','Organizar el estudio'], ['help','Pedir ayuda con una duda']
]);
const generalObstacles = options([
 ['haste','Respondo antes de pensarlo'], ['uncertainty','Me falta información'],
 ['overload','Tengo demasiados compromisos'], ['avoiding','Voy dejando la conversación o tarea'],
 ['resources','Me faltan tiempo, materiales o apoyo']
]);
const studyObstacles = options([
 ['starting','Me cuesta empezar'], ['distraction','Las interrupciones me hacen perder el hilo'],
 ['confusion','No sé en qué paso me pierdo'], ['recall','Al cerrar el material no consigo recordarlo'],
 ['resources','Me faltan tiempo, materiales o apoyo']
]);
const childObstacles = options([
 ['haste','A veces respondo muy rápido'], ['uncertainty','Hay algo que no entiendo'],
 ['overload','Tengo muchas cosas para hacer'], ['avoiding','Dejo para después algo que quiero hacer'],
 ['resources','Necesito tiempo, materiales o ayuda']
]);
const isAdult = age => Number.isInteger(age) && age >= 18 && age <= 99;
const isChild = age => Number.isInteger(age) && age >= 6 && age < 12;
const isStudy = focus => focus === 'school' || focus === 'university';
const allowedFocus = (focus,age) => typeof focus === 'string' && CONTEXT_FOCUS.some(v=>v.id===focus) && (isAdult(age)||!adultFocus.has(focus)) ? focus : '';

export function contextOptions(age,focus) {
 const study=isStudy(allowedFocus(focus,age));
 return {goals:study?studyGoals:isChild(age)?childGoals:generalGoals,obstacles:study?studyObstacles:isChild(age)?childObstacles:generalObstacles};
}
function plain(raw) {
 try {return raw && typeof raw==='object' && !Array.isArray(raw) && (Object.getPrototypeOf(raw)===Object.prototype||Object.getPrototypeOf(raw)===null) ? raw : null;} catch {return null;}
}
// Read only own data properties: inherited keys, getters, objects and extra
// fields never become context. HTML escaping belongs to the output renderer.
function own(raw,key) {try {return Object.getOwnPropertyDescriptor(raw,key)?.value;} catch {return undefined;}}
function text(raw,key,max) {
 const v=own(raw,key);if(typeof v!=='string')return '';
 return Array.from(v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim()).slice(0,max).join('');
}
export function normalizeContext(raw,age) {
 const data=plain(raw)||{},focus=allowedFocus(own(data,'focus'),age),available=contextOptions(age,focus);
 const goal=own(data,'goal'),obstacle=own(data,'obstacle'),minutes=own(data,'minutes');
 return {focus,goal:available.goals.some(v=>v.id===goal)?goal:'',obstacle:available.obstacles.some(v=>v.id===obstacle)?obstacle:'',scene:text(data,'scene',220),success:text(data,'success',140),minutes:[5,10,20].includes(minutes)?minutes:['5','10','20'].includes(minutes)?Number(minutes):''};
}
export function hasContext(context) {
 const c=plain(context);return Boolean(c&&['focus','goal','obstacle','scene','success','minutes'].some(k=>{const v=own(c,k);return typeof v==='string'?v.trim().length>0:[5,10,20].includes(v);}));
}
const priority=(title,why,action,observe)=>({title,why,action,observe});
function needPractice(c,age) {
 const child=isChild(age),study=isStudy(c.focus),slot=c.minutes?`Reserva ${c.minutes} minutos, si te resulta posible. `:'';
 if(study) {
  if(c.goal==='remember')return priority('Recupera y comprueba','Elegiste trabajar el recuerdo.',slot+'Cierra el material, cuenta lo que recuerdas y vuelve a abrirlo para corregir lo que falte.','Qué pudiste recuperar y qué necesitas repasar en otro momento.');
  if(c.goal==='understand')return priority('Explica con un ejemplo','Quieres comprender un tema.',slot+'Explica una idea con tus palabras y añade un ejemplo. Contrástalos con el material o con tu docente.','Qué parte puedes explicar y dónde necesitas una aclaración.');
  if(c.goal==='organize')return priority('Reparte la práctica','Elegiste organizar el estudio.',slot+'Escoge una parte del tema y dos días distintos para practicarla. Ajusta el tamaño de la tarea a tu tiempo real.','Qué sesiones pudiste hacer y qué parte queda pendiente.');
  if(c.goal==='help')return priority('Formula una duda concreta','Quieres pedir ayuda.',slot+'Muestra un intento y pregunta por el paso que no entiendes a tu docente o a alguien que pueda ayudarte.','Si la respuesta te permite intentar el siguiente paso.');
  return priority('Elige qué necesitas practicar','Elegiste un ámbito de estudio, sin indicar un objetivo.',slot+'Prueba una tarea breve y decide si necesitas recordar, entender, organizarte o pedir una aclaración.','En qué paso te detuviste y qué apoyo te serviría.');
 }
 if(c.goal==='communicate') {
  const action=child?'Cuenta algo que necesitas y pregunta qué necesita la otra persona. Un adulto de confianza puede ayudarte.':c.focus==='parent'?'Busca un momento tranquilo para preguntar a tu hijo cómo vivió una situación. Después expresa tu necesidad sin decidir por él lo que siente.':c.focus==='partner'?'Describe un hecho, expresa una necesidad y haz una petición concreta. Después escucha cómo lo vivió tu pareja.':c.focus==='adultchild'?'Expresa a tus padres una preferencia concreta y escucha la suya. Diferencia escuchar de estar de acuerdo.':c.focus==='work'||c.focus==='leader'?'Aclara un hecho con la otra persona y pregunta qué información le falta. Acordad el siguiente paso.':'Describe un hecho, di qué necesitas y formula una petición. Deja espacio para escuchar la respuesta.';
  return priority('Abre una conversación', 'Elegiste expresar lo que necesitas y escuchar.', action,'Si pudiste expresar una petición y escuchar una respuesta.');
 }
 if(c.goal==='boundaries')return priority('Aclara un acuerdo','Quieres revisar responsabilidades o límites.',child?'Cuenta qué puedes hacer y qué ayuda necesitas. Pide a un adulto de confianza que te ayude a acordarlo.':'Elige un compromiso y aclara qué incluye, quién lo asume y cuándo se revisará. Di si necesitas renegociarlo.','Si cada persona entendió lo que le corresponde.');
 if(c.goal==='organize')return priority('Define el primer paso','Elegiste organizar una tarea.',slot+(child?'Escoge una parte pequeña y prepara lo necesario. Pide ayuda si no sabes cómo empezar.':'Escribe qué sería terminar una parte pequeña. Prepara lo necesario y prueba ese paso.'),'Qué parte terminaste y qué necesitas para continuar.');
 if(c.goal==='decide')return priority('Compara dos opciones','Quieres tomar una decisión concreta.',child?'Cuenta dos opciones y algo que te guste o te preocupe de cada una. Consulta a un adulto si lo necesitas.':'Compara dos opciones: qué valor cuidan, qué coste tienen y qué dato falta. Prueba un paso reversible cuando sea posible.','Qué información te ayudó a elegir o a aplazar con una razón clara.');
 return priority('Escoge una acción propia','No indicaste un objetivo; puedes elegirlo ahora.',child?'Piensa qué te gustaría hacer de otra manera en una situación. Puedes contarlo o dibujarlo.':'Describe una acción pequeña que dependa de ti en la situación que quieres trabajar.','Si puedes reconocer cuándo la hiciste, sin depender de la aprobación ajena.');
}
const barriers={
 haste:['Haz una pausa','Indicaste que respondes deprisa.','Antes de responder, nombra el hecho y comprueba si necesitas tiempo para pensar.','Si la pausa te permitió elegir qué decir.','Una pausa podría ayudarte a separar lo ocurrido de tu primera interpretación.'],
 uncertainty:['Busca el dato que falta','Señalaste que te falta información.','Escribe una pregunta concreta y decide quién o qué fuente puede aclararla.','Si el dato obtenido cambia tu siguiente paso.','La dificultad podría estar en una información que todavía no tienes, no en falta de capacidad.'],
 overload:['Revisa la carga real','Señalaste demasiados compromisos.','Revisa qué es imprescindible, qué puede esperar y qué ayuda puedes pedir. Acláralo con las personas implicadas.','Qué compromiso pudiste reducir o renegociar.','Quizá necesites ajustar la carga antes de exigirte otra estrategia personal.'],
 avoiding:['Concreta una ocasión','Indicaste que lo dejas para después.','Elige una ocasión posible para iniciar una sola parte. Si no ocurre, revisa qué lo impidió y reduce el paso.','Qué facilitó o impidió empezar.','Una ocasión y un primer paso más claros podrían facilitar el inicio; conviene comprobarlo.'],
 resources:['Pide un recurso concreto','Señalaste falta de tiempo, materiales o apoyo.','Identifica un recurso que te falta y una persona que pueda ayudarte a conseguirlo o a adaptar la tarea.','Si el recurso estuvo disponible y qué alternativa quedó.','Puede que la dificultad esté en las condiciones disponibles; no todo depende de tu esfuerzo.'],
 starting:['Prepara el comienzo','Indicaste que te cuesta empezar.','Deja listo el material y señala una primera tarea muy pequeña antes de tu próxima sesión.','Si preparar el comienzo hizo más fácil iniciar.','El comienzo podría resultar más accesible al reducir decisiones y preparar el material.'],
 distraction:['Cambia una condición','Señalaste interrupciones.','Elige una interrupción que puedas reducir y prueba un lugar o momento más adecuado. Pide ayuda si no puedes cambiarlo.','Qué interrupciones siguieron presentes.','Una condición del entorno podría estar dificultando mantener el hilo; prueba un cambio manejable.'],
 confusion:['Localiza el paso difícil','Indicaste que no sabes dónde te pierdes.','Compara tu intento con un ejemplo resuelto y marca el primer paso que no puedes explicar.','Qué pregunta concreta aparece al comparar.','Encontrar el primer paso confuso podría ayudarte a pedir una aclaración más útil.'],
 recall:['Vuelve en otro momento','Indicaste dificultad al cerrar el material.','Reserva otro día para volver sobre una parte pequeña. Comprueba con el material qué cambió desde el primer intento.','Qué recuerdas tras la pausa y qué sigue necesitando práctica.','Podría ser útil revisar cómo practicas y cuándo vuelves al tema, sin convertir una dificultad en una etiqueta.']
};
export function buildContextReport(raw,age) {
 const c=normalizeContext(raw,age);if(!hasContext(c))return null;
 const available=contextOptions(age,c.focus),study=isStudy(c.focus),child=isChild(age);
 const focusLabel=CONTEXT_FOCUS.find(v=>v.id===c.focus)?.label||'Una situación elegida por ti';
 const goalLabel=available.goals.find(v=>v.id===c.goal)?.label||'Objetivo por elegir';
 const obstacleLabel=available.obstacles.find(v=>v.id===c.obstacle)?.label||'Obstáculo no indicado';
 const chosen=needPractice(c,age),barrier=barriers[c.obstacle];
 const second=barrier?priority(...barrier.slice(0,4)):priority('Observa las condiciones','No indicaste un obstáculo.','Prueba el primer paso y anota qué lo facilitó o dificultó: tiempo, claridad, materiales o ayuda.','Qué condición convendría mantener o cambiar.');
 const review=priority('Revisa y ajusta','Una práctica necesita contraste con tu experiencia.',child?'Después de probarlo, cuenta o dibuja qué hiciste y qué ayuda necesitas. Puedes mantener, cambiar o dejar la actividad.':'Al terminar la semana, compara lo que hiciste con tu objetivo. Decide qué mantener, ajustar o dejar. Pide una observación si te sirve.','Una acción realizada y un ajuste para el próximo intento.');
 const summary=[`Has elegido: ${focusLabel.toLowerCase()}.`,c.goal?`Quieres ${goalLabel.toLowerCase()}.`:'Aún puedes concretar qué quieres cambiar.',c.obstacle?`Como dificultad señalas: ${obstacleLabel.toLowerCase()}.`:'No has indicado qué lo dificulta.'].join(' ');
 return {
  title:study?'Tu situación de aprendizaje':'Tu situación y tus próximos pasos',summary,
  hypothesis:barrier?barrier[4]:'Todavía falta contexto para proponer una explicación. Observa una situación antes de elegir qué cambiar.',
  alternative:'También pueden influir las instrucciones, el tiempo disponible y otras personas. Contrasta la propuesta con lo que realmente ocurre.',
  questions:child?['¿Cuándo te resulta más fácil y qué es distinto?','¿Qué ayuda te gustaría pedir?']:['¿Cuándo no ocurre esta dificultad y qué cambia?','¿Qué otra explicación o apoyo conviene considerar?'],
  priorities:[chosen,second,review],scene:c.scene,success:c.success,focusLabel,goalLabel,obstacleLabel,
  sourceNote:study?'Prácticas de estudio: guía IES/WWC (2007) y Karpicke y Blunt (2011). Se eligen por tu objetivo, no por eneatipo; no garantizan notas.':'Propuestas de reflexión según tus elecciones. No son conclusiones clínicas ni se deducen de una puntuación.'
 };
}
