// One editorial model for the PDF and the on-screen report. No remote AI or personal data storage.
import {buildCoaching} from './coaching.mjs';
import {buildContextReport} from './context.mjs';
export const REPORT_VERSION='2026-10-31-context-4';
// Presentation supplied by the owner. This is not an institutional endorsement or individual review.
export const REPORT_SIGNATURE=Object.freeze({name:'Diego Pennise',role:'Coach Organizacional & Ontológico',education:'Universidad de San Andrés'});
export const COACHING_APPROACH='Coaching organizacional y ontológico: valores, escucha, lenguaje, emociones y acuerdos. Integra preguntas sobre creencias, propósito y acciones observables. Las referencias de psicología y psiquiatría aportan contexto educativo; este informe no aplica psicoterapia.';
const cases=[
 {belief:'Si no queda impecable, he fallado.',scene:'Una tarea compartida queda resuelta, pero de una forma distinta a la que habías imaginado.',automatic:'Podrías rehacerla, señalar primero el fallo o seguir revisando. El resultado mejora quizá, pero aumenta el esfuerzo y la otra persona pierde margen para participar.',choice:'Antes de intervenir, distingue un error importante de una preferencia. Decide qué necesita corregirse y qué puedes aceptar tal como está.',phrase:'Lo esencial está resuelto. Hay un detalle que prefiero de otra forma; podemos acordarlo para la próxima vez.'},
 {belief:'Si no estoy disponible, puedo decepcionar o perder cercanía.',scene:'Después de un día lleno, alguien te pide otro favor. Tú ya habías reservado ese rato para descansar.',automatic:'Podrías aceptar deprisa y esperar que la otra persona note tu esfuerzo. Si no lo reconoce, quizá aparezcan cansancio o enfado. El problema a explorar sería el acuerdo implícito, no la generosidad.',choice:'Haz una pausa antes de comprometerte. Comprueba si deseas ayudar, si tienes capacidad y si esperas algo que no has expresado. Puedes cuidar la relación sin aceptar esa petición.',phrase:'Me importa lo que te pasa. Hoy no puedo encargarme de eso; necesito mantener mi descanso. Podemos hablar mañana.'},
 {belief:'Mi valor depende de lo que consigo y de que se note.',scene:'Terminas algo importante, recibes poco reconocimiento y enseguida piensas en el siguiente objetivo.',automatic:'Podrías acelerar, mostrar solo lo que salió bien o esconder una duda. Así obtienes resultados, pero quizá no registras qué necesitas ni si la meta sigue siendo tuya.',choice:'Separa la evaluación del trabajo de la evaluación de tu persona. Elige qué conservarías de ese esfuerzo aunque nadie fuera a verlo.',phrase:'Este resultado importa, pero no explica todo lo que soy. Quiero revisar qué aprendí y qué coste estoy dispuesto a asumir.'},
 {belief:'Necesito sentir algo especial para que lo que hago tenga sentido.',scene:'Ves una experiencia ajena que parece extraordinaria y tu propio día empieza a parecer insuficiente.',automatic:'Podrías compararte, esperar inspiración o descartar una posibilidad real por no parecerse a la imaginada. La sensibilidad aporta profundidad; la comparación puede quitarte presencia.',choice:'Describe lo que tienes delante sin compararlo. Da un paso pequeño que exprese algo propio, aunque la emoción del momento sea corriente.',phrase:'Hoy no necesito una experiencia perfecta. Puedo hacer algo que tenga sentido para mí con lo que hay.'},
 {belief:'Necesito entenderlo todo antes de participar.',scene:'Te invitan a colaborar y todavía no conoces cada detalle de la propuesta.',automatic:'Podrías seguir investigando o retirarte para proteger tu energía. Prepararte ayuda, pero puede retrasar una experiencia que aportaría la información que falta.',choice:'Diferencia el dato indispensable del que solo reduce incomodidad. Acuerda una prueba con duración y alcance limitados.',phrase:'Puedo probar esta parte durante un rato. Después revisamos lo aprendido y decidimos cómo continuar.'},
 {belief:'Para decidir necesito estar seguro de que nada saldrá mal.',scene:'Debes tomar una decisión pequeña y dos personas de confianza te dan consejos diferentes.',automatic:'Podrías pedir más opiniones hasta encontrar tranquilidad. Cada consulta también puede abrir nuevas dudas y alejarte de tu propio criterio.',choice:'Escribe un riesgo concreto, una protección razonable y qué harías si el resultado no fuera el esperado. Decide el siguiente paso reversible.',phrase:'No tengo certeza completa. Sí tengo información suficiente para este paso y un modo de revisarlo.'},
 {belief:'Si mantengo todas las opciones abiertas, no perderé nada.',scene:'Aparece un plan atractivo mientras una actividad elegida ya ha entrado en su parte menos entretenida.',automatic:'Podrías cambiar de rumbo o sumar compromisos. La novedad da energía, pero quizá dispersa la atención y deja pendientes que después pesan.',choice:'Anota la nueva idea sin ejecutarla todavía. Completa una parte concreta de lo elegido y observa qué emoción aparece al quedarte.',phrase:'Esta idea me interesa. La guardaré; ahora quiero terminar el paso al que me comprometí.'},
 {belief:'Si cedo el control o muestro una duda, quedo desprotegido.',scene:'Alguien propone hacer a su manera una tarea que sueles dirigir tú.',automatic:'Podrías decidir deprisa, elevar el tono o asumir toda la responsabilidad. La firmeza protege, pero también puede reducir la colaboración que necesitas.',choice:'Aclara qué límite es importante y qué parte admite otra solución. Haz una pregunta antes de dar una instrucción.',phrase:'Para mí es importante cumplir este acuerdo. Cuéntame cómo lo harías; podemos decidir juntos el procedimiento.'},
 {belief:'Para conservar la paz conviene dejar mis preferencias para después.',scene:'El grupo propone un plan que no te convence y todos parecen estar de acuerdo.',automatic:'Podrías decir que sí para evitar tensión y luego desconectarte o posponer tu parte. El acuerdo aparente no permite que los demás conozcan tu preferencia.',choice:'Expresa una diferencia pequeña antes de retirarte o ceder por inercia. Busca un acuerdo que incluya también lo que te importa.',phrase:'A mí me apetece otra opción. Quiero escucharos y que mi preferencia también entre en la decisión.'}
];
const examples=[
 'Abre una conversación breve con «Quiero contarte algo y después escucharte». Habla de un hecho concreto.',
 'Elegid una tarea habitual y acordad quién la asume, qué incluye y cuándo se revisará el reparto.',
 'Acordad qué hará cada persona, para cuándo y qué contará como terminado. Si cambian los recursos o la carga, revisad el compromiso.',
 'Distingue «Ocurrió…» de «Lo interpreté como…». Nombra lo que sientes y el apoyo que necesitas; no tienes que sentirte bien para reconocerlo.',
 'Pon en la agenda un momento breve de descanso y prepara de antemano lo necesario para respetarlo.',
 'Ante una petición, responde «Voy a revisar si puedo y te confirmo». Usa esa pausa para elegir.',
 'Antes de una compra cotidiana, escribe para qué la quieres y qué cantidad cabe en tu presupuesto.',
 'Elige un valor que quieras expresar hoy y una actividad pequeña que lo represente. No hace falta encontrar una gran misión para dar sentido a ese paso.'
];
const bondExamples=[
 '«Me gustaría que esta tarde me escucharas diez minutos. No necesito una solución; quiero compartir cómo me siento».',
 'En vez de adelantarte a todo, pregunta: «¿Qué parte asumes tú esta semana?». Deja que la haga sin supervisarla a cada paso.',
 '«Puedo ocuparme de esta parte el jueves. Para añadir lo otro, tendríamos que mover una prioridad».',
 'Si aparece malestar tras ayudar, anota qué esperabas recibir. Comprueba si lo pediste o esperabas que lo adivinaran.',
 'Reserva un rato sin estar pendiente del teléfono. Avisa con claridad de cuándo volverás a estar disponible.',
 '«Hoy no me viene bien». Practica detener la explicación ahí, sin inventar una excusa ni ofrecer algo que tampoco deseas.',
 'Antes de un regalo, pregúntate: «¿Lo elegiría igual si la reacción fuera un simple gracias?». Ajusta el gasto a lo que puedes dar libremente.',
 'Haz una lista de tres cosas que te atraen por gusto propio. Prueba una sin convertirla en una tarea para otra persona.'
];
const observations=[
 'Si expresaste una petición concreta y escuchaste la respuesta, aunque no fuera la que esperabas.',
 'Si el reparto quedó explícito y permitió que cada persona asumiera su parte.',
 'Qué tarea avanzó y qué coste tuvo para tu tiempo y energía.',
 'Si pudiste distinguir el hecho, la emoción y la necesidad sin juzgarte.',
 'Qué facilitó o interrumpió el descanso; ajusta el entorno antes de exigirte más.',
 'Si tu respuesta coincidió con lo que podías y querías ofrecer.',
 'Si la decisión respondió a una necesidad elegida y respetó el límite de gasto.',
 'Qué te interesó durante la experiencia, más allá de hacerlo bien o recibir aprobación.'
];
const openActions=[
 'Cuenta una preferencia y pregunta por la de la otra persona. Escucha sin adelantarte a lo que va a decir.',
 'Escoge una tarea de convivencia que pueda repartirse de forma clara y revisa el acuerdo con quienes participan.',
 'Divide una tarea en un primer paso que puedas terminar hoy. Pide aclaración si no sabes qué se espera.',
 'Distingue qué ocurrió de lo que interpretaste. Pon nombre a la emoción y decide si necesitas apoyo.',
 'Prueba una rutina pequeña de descanso y observa cuándo te resulta más fácil sostenerla.',
 'Date tiempo para responder a una petición. Una pausa puede ayudarte a reconocer lo que prefieres.',
 'Revisa una compra cotidiana: su utilidad, el dinero disponible y si puede esperar.',
 'Recupera un interés propio y dale un espacio breve. No necesitas convertirlo en un logro.'
];
const childExamples=[
 '«Hoy prefiero este juego. ¿Qué te gustaría a ti?». Buscad una forma de turnaros.',
 'Elegid quién recoge una cosa y quién otra. Pedid ayuda si el reparto no resulta fácil.',
 'Empieza por una parte pequeña de los deberes. Si no la entiendes, cuenta exactamente dónde te pierdes.',
 'Puedes decirlo o dibujarlo: «Pasó esto y me sentí así». El adulto escucha sin corregir tu emoción.',
 'Elige una pausa breve después de una actividad. Observa si te apetece agua, moverte o estar tranquilo.',
 '«Necesito pensarlo». Para algo que te preocupa o no entiendes, habla con un adulto de confianza.',
 'Si tienes paga, separa con un adulto lo que quieres guardar y lo que puedes gastar.',
 'Prueba un juego o una actividad por curiosidad. Después cuenta qué parte te gustó.'
];
const teenExamples=[
 'Expresa a una amistad qué plan prefieres y escucha su propuesta. Podéis buscar un acuerdo sin coincidir en todo.',
 'Acuerda una responsabilidad en casa: qué incluye, cuándo la harás y qué ayuda necesitas. Revisa lo que resulte poco realista.',
 'Escoge un proyecto o una materia y define un paso de quince minutos. Si te bloqueas, formula una pregunta concreta.',
 'Distingue lo que pasó de lo que interpretaste. Escribe una emoción y qué apoyo te serviría; tú eliges con quién compartirlo.',
 'Observa qué actividad te deja cansado y prepara una pausa realista. Prueba qué te ayuda a recuperar atención y energía.',
 'Ante presión para aceptar algo, pide tiempo. Puedes expresar un límite y buscar apoyo en una persona adulta de confianza.',
 'Si dispones de dinero, decide qué quieres reservar y qué puedes gastar. Revisa una compra sin dejarte llevar solo por el grupo.',
 'Prueba algo que te interese fuera de las notas o de la aprobación en redes. Observa qué te gustaría seguir explorando.'
];
const childObservations=[
 'Si ambos pudisteis contar lo que queríais.', 'Si el acuerdo se entendió y alguien necesitó ayuda.',
 'Qué paso hiciste y qué pregunta te ayudó a seguir.', 'Qué palabra o dibujo te ayudó a explicarte.',
 'Qué pausa te hizo sentir más cómodo.', 'Si pudiste decir tu preferencia sin presión.',
 'Si entendiste la elección antes de gastar.', 'Qué te gustaría repetir, cambiar o dejar.'
];
const motives=[
 'hacer lo correcto y sostener un estándar de calidad', 'conservar cercanía y sentir que tu aportación tiene lugar',
 'avanzar hacia un resultado y recibir reconocimiento', 'expresar lo propio y encontrar significado',
 'comprender la situación y proteger tu energía', 'prever dificultades y contar con apoyos fiables',
 'mantener posibilidades y encontrar experiencias estimulantes', 'decidir por ti y proteger lo importante',
 'mantener la calma y encontrar un acuerdo compartido'
];
const tradeoffs=[
 'aceptar un resultado suficiente', 'dejar que otra persona se haga cargo', 'mostrar una duda sin resolverla enseguida',
 'actuar en un día corriente', 'participar sin saberlo todo', 'dar un paso sin otra confirmación',
 'cerrar una opción para sostener otra', 'escuchar una propuesta sin dirigirla', 'expresar una preferencia que difiere'
];
const fmt=n=>Number(n).toFixed(2).replace('.',',');
export function buildReport(result){
 const context=buildContextReport(result.context,result.age);
 const c=buildCoaching(result),minor=result.minor,focus=c.focus;
 const ranked=result.eligible?[...result.rows].sort((a,b)=>b.score-a.score):[];
 const primary=focus.length===1?c.profiles.find(p=>p.id===focus[0]):null;
 // Only show a secondary comparison when there is a unique second mean. Never break a tie by type id.
 const runners=primary?ranked.filter(r=>r.id!==primary.id):[];
 const second=primary&&runners.length&&runners.filter(r=>r.score===runners[0].score).length===1?c.profiles.find(p=>p.id===runners[0].id):null;
 const readings=primary?[primary,...(second?[second]:[])]:focus.map(id=>c.profiles.find(p=>p.id===id));
 const evidence=minor?'Las nueve medias sirven como punto de partida para hablar. No se selecciona un tipo ni se ordenan tus capacidades.':!result.eligible?'Faltan respuestas suficientes en una o más tendencias. Los huecos no indican una puntuación baja.':primary?`La media más alta es ${primary.name} (${fmt(ranked[0].score)}/5). ${second?`La siguiente es ${second.name} (${fmt(runners[0].score)}/5). Se comparan como dos perspectivas, no como un tipo combinado.`:'Hay empate entre las siguientes puntuaciones; no elegimos una segunda tendencia.'}`:focus.length?`Las medias próximas corresponden a ${focus.map(id=>{const r=result.rows.find(x=>x.id===id);return r.name+' ('+fmt(r.score)+'/5)'}).join(', ')}. No hay base para preferir una de ellas.`:'Muchas tendencias quedan próximas. El resultado no permite centrar la lectura en una sola; trabajaremos desde una situación elegida por ti.';
 let synthesis=minor?'Elige tú qué situación contar y qué parte reservarte. Quien acompaña puede preguntar «¿qué necesitabas?» y aceptar una respuesta diferente de la que esperaba. No se utiliza este cuaderno para comparar, premiar o decidir por ti.':primary&&second?`Ante una misma situación, ${primary.name} invita a explorar el deseo de ${motives[primary.id-1]}, mientras ${second.name} pone el foco en ${motives[second.id-1]}. Si ambas miradas te sirven, observa cuándo se apoyan y cuándo reclaman respuestas distintas. Imagina dos ensayos: ${tradeoffs[primary.id-1]} y ${tradeoffs[second.id-1]}. ¿Cuál te cuesta más y qué crees que perderías? Esa pregunta puede aclarar el motivo mejor que la conducta aislada. Busca también una situación en la que actuaste con flexibilidad. La comparación propone opciones para observar, no demuestra cómo se combinan en ti estas tendencias.`:primary?'Observa cuándo este modo de actuar te ayuda y cuándo se vuelve una respuesta automática. El objetivo no es eliminar un rasgo: es ampliar tus opciones cuando la estrategia habitual tiene un coste.':focus.length?'Para distinguir estas miradas, mantén el mismo episodio y cambia la pregunta sobre el motivo. No necesitas escoger una etiqueta. Si varias explicaciones encajan, conserva esa ambigüedad y observa otro contexto.':'Escoge un episodio reciente que te importe y describe primero los hechos. Después utiliza una pregunta de la guía final. La experiencia aporta el contexto que no puede aportar un empate de puntuaciones.';
 if(primary&&second&&[primary.id,second.id].sort().join(',')==='1,2')synthesis='Si te reconoces en ambas miradas, podrías unir cercanía, compromiso y atención a lo que necesita mejorar. Esa aportación puede ser valiosa cuando eliges libremente dónde implicarte. El coste posible aparece si asumes responsabilidades que nadie ha acordado contigo o si te cuesta dejar una tarea en manos de alguien que la hace de otra manera. Una regla que merece comprobarse sería: «Si no me ocupo yo, decepciono; si no sale bien, también». No sabemos si es tu caso. Busca una situación que la confirme y otra en la que hayas puesto un límite o aceptado ayuda sin perder cercanía. Para ampliar tus opciones, separa tres preguntas: ¿qué quiero ofrecer?, ¿qué me corresponde realmente?, ¿qué necesito pedir? Puedes conservar tu capacidad de cuidar y elegir un reparto más sostenible. Recibir ayuda también forma parte del vínculo: no siempre exige devolver inmediatamente otro favor.';
 const selectedCase=primary?cases[primary.id-1]:null;
 const episode=selectedCase?{...selectedCase,title:'Del impulso a una respuesta elegida',question:'¿Qué dato real apoya esa creencia y qué experiencia muestra que no siempre se cumple?',practice:['Describe un hecho y sepáralo de la interpretación que hiciste.','Nombra una emoción, una señal corporal y qué valor quieres cuidar.','Ensaya una petición, un límite o un acuerdo con alcance y plazo claros.','Prueba ese paso y registra lo ocurrido; contrástalo con lo que esperabas.']}:minor?{title:'Una situación, varias respuestas',belief:'Una respuesta de hoy no decide quién eres.',scene:'Un grupo quiere hacer una actividad y tú prefieres otra. Este es un ejemplo inventado; puedes elegir uno diferente.',automatic:'Quizá te callas, discutes o aceptas. Pregunta qué necesitabas en ese momento, sin considerar ninguna reacción como tu manera fija de ser.',choice:'Cuenta tu preferencia y escucha la de los demás. Si no podéis acordarlo o te sientes presionado, pide ayuda a una persona adulta de confianza.',phrase:'Yo prefiero esto. ¿Podemos turnarnos o buscar otra idea?',question:'¿Qué otra respuesta podrías probar sin dejar de cuidarte?',practice:['Cuenta o dibuja lo que pasó.','Nombra lo que querías o necesitabas.','Ensaya una frase con alguien de confianza.','Decide si quieres probarla; puedes cambiar de idea.']}:{title:'Explorar sin forzar una etiqueta',belief:'La primera explicación no tiene por qué ser la única.',scene:'Recibes una petición cuando ya tenías otro compromiso. Usa este ejemplo o elige un episodio de tu vida.',automatic:'Aceptar, posponer o negarte puede responder a cercanía, responsabilidad, prudencia u otros motivos. La conducta aislada no identifica una tendencia.',choice:'Escribe dos motivos posibles. Para cada uno, busca un hecho que lo apoye y otro que lo contradiga. Elige una respuesta que cuide lo importante en ese contexto.',phrase:'Antes de responder, quiero revisar qué necesito y qué puedo asumir.',question:'¿Qué información me falta para comprender mejor mi reacción?',practice:['Describe la petición y tu respuesta.','Propón dos explicaciones diferentes.','Busca un ejemplo que contradiga cada una.','Ensaya una alternativa pequeña y observa su efecto.']};
 const areas=c.profiles[0].areas.map((a,i)=>{
   const p=primary;
   return {...a,tip:p?p.areas[i].tip:minor?(result.age<12?childExamples[i]:teenExamples[i]):openActions[i],example:minor?(result.age<12?'Puedes contarlo con palabras o con un dibujo.':'Elige un ejemplo de tus amistades, estudios o proyectos y conserva lo que prefieras en privado.'):primary?.id===2?bondExamples[i]:examples[i],observe:minor?childObservations[i]:observations[i],source:p?p.name:null};
 });
 // Minor prompts already include a concrete scene; don't add the same generic sentence eight times.
 if(minor)areas.forEach(a=>a.example=null);
 const plan=[
 ['Elige','Define un cambio observable en una situación real y por qué te importa. Elige una sola acción de las ocho áreas para acercarte a él.'],
 ['Observa','Separa lo que ocurrió de lo que interpretaste. Nombra una emoción y una señal corporal, sin tratarlas como prueba de lo que piensa otra persona.'],
 ['Ensaya','Practica la conversación pendiente: qué necesitas, qué puedes ofrecer y qué acuerdo propones. Ajusta las palabras para que te resulten naturales.'],
 ['Actúa','Ponlo en práctica una vez. Registra qué hiciste y cómo respondió la situación, sin exigir un resultado concreto.'],
 ['Repite','Anticipa un obstáculo: «Si ocurre esto, haré este paso más pequeño». Prueba de nuevo y observa qué facilita sostener tu elección.'],
 ['Contrasta','Si quieres, pide a alguien de confianza una observación sobre lo que hiciste. No le pidas que defina quién eres.'],
 ['Decide','Revisa qué ayudó, qué tuvo un coste y qué repetirás. Puedes mantener, ajustar o descartar la práctica.']
 ].map(([title,text],i)=>({day:i+1,title,text:minor?c.plan[i].replace(/^Día \d · /,''):text}));
 if(context){
  const p=context.priorities[0];
  const days=[
   ['Elige',p.action],
   ['Comprueba',p.observe],
   ['Ajusta',context.priorities[1].action],
   ['Repite','Repite el primer paso en otra ocasión; anota qué cambió y qué siguió igual.'],
   ['Busca apoyo','Si te hace falta, explica qué has probado y formula una pregunta concreta a alguien de confianza.'],
   ['Contrasta','Compara lo que hiciste con el cambio que querías observar. Busca también qué no funcionó.'],
   ['Decide','Elige qué mantener, ajustar o dejar. Un resultado distinto del esperado también aporta información.']
  ];
  plan.splice(0,plan.length,...days.map(([title,text],i)=>({day:i+1,title,text})));
 }
 return {context,pages:context?5:7,version:REPORT_VERSION,signature:REPORT_SIGNATURE,approach:COACHING_APPROACH,title:primary?primary.title:minor?'Conocerte a tu ritmo':'Comprender antes de concluir',intro:primary?'La pregunta de fondo es qué intentas cuidar con tu forma habitual de actuar y qué otras opciones te permitirían hacerlo con menos coste. Esta lectura propone hipótesis para contrastar, no conclusiones sobre tu vida.':c.intro,evidence,primaryId:primary?.id??null,readings:readings.map(p=>({id:p.id,name:p.name,color:p.color,pattern:p.pattern,question:p.question,gift:p.gift})),synthesis,episode,areas,plan,glossary:c.profiles.map(p=>({id:p.id,name:p.name,color:p.color,drive:p.drive})),minor};
}
