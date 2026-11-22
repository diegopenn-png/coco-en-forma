// Original reflective coaching prompts, not a validated personality interpretation.
import {TYPES} from './types.mjs';
export const REPORT_PAGES=7;
export const AREAS=[
 {id:'relationships',name:'Relaciones y pareja',child:'Amistades',question:'¿Qué necesito expresar y qué estoy suponiendo sin preguntar?'},
 {id:'family',name:'Familia y convivencia',child:'Familia y convivencia',question:'¿Qué acuerdo pequeño haría más fácil convivir esta semana?'},
 {id:'work',name:'Trabajo y aprendizaje',child:'Colegio y aprendizaje',question:'¿Qué paso puedo dar con los recursos que ya tengo?'},
 {id:'emotions',name:'Emociones y cuidado personal',child:'Emociones',question:'¿Qué siento, qué necesito y cómo puedo pedir apoyo?'},
 {id:'habits',name:'Hábitos y descanso',child:'Rutinas y descanso',question:'¿Cuál es la versión más pequeña de un hábito que sí puedo sostener?'},
 {id:'decisions',name:'Decisiones y límites',child:'Decisiones y límites',question:'¿Elijo por lo que me importa o para evitar una incomodidad?'},
 {id:'money',name:'Dinero y consumo',child:'Paga y consumo',question:'¿Qué necesidad intento resolver con esta compra?'},
 {id:'purpose',name:'Propósito y disfrute',child:'Intereses y juego',question:'¿Qué me importa aunque nadie lo premie ni lo vea?'}
];
const childQuestions=['¿Qué quieres contarle a tu amigo?','¿Qué tarea podemos repartir en casa?','¿Qué pequeño paso te gustaría probar?','¿Qué sientes y qué ayuda necesitas?','¿Qué rutina pequeña te gustaría probar?','¿Qué prefieres tú? ¿Necesitas tiempo para pensarlo?','¿Para qué quieres comprarlo?','¿A qué te gustaría jugar o qué te gustaría aprender?'];
const profiles=[
 {pattern:'Si te reconoces en Criterio, quizá busques tranquilidad haciendo las cosas bien. Esa coherencia puede convertirse en rigidez cuando cualquier error parece inaceptable. El movimiento útil es conservar tus valores y flexibilizar la manera de llevarlos a la práctica.',trigger:'Una tarea imperfecta, un acuerdo incumplido o la sensación de injusticia.',shift:'Cambiar «debería ser perfecto» por «¿qué es suficiente y valioso aquí?».',tips:[
 'Antes de corregir, pregunta si la otra persona quiere una idea o que la escuches. Expresa también algo que valoras.',
 'Acordad un mínimo compartido para una tarea doméstica. Deja espacio para que otra persona la haga a su manera.',
 'Define tres criterios de terminado antes de empezar. Entrega una primera versión cuando los cumpla y recoge comentarios.',
 'Cuando aparezca autocrítica, escribe el hecho sin insultarte. Añade una frase que dirías a alguien a quien quieres.',
 'Reserva un descanso sin condicionarlo a terminarlo todo. Observa si puedes disfrutarlo aunque quede algo pendiente.',
 'Separa un valor importante de una preferencia personal. Negocia la preferencia sin renunciar a un límite que te protege.',
 'Fija un tiempo breve para comparar una compra cotidiana. Decide con criterios suficientes y evita revisar indefinidamente.',
 'Haz una actividad creativa sin corregir el resultado. Valora la experiencia y no solo si quedó bien.'
 ]},
 {pattern:'Si te reconoces en Vínculo, puede que dar y acompañar te ayuden a sentir cercanía. El coste aparece cuando esperas que alguien descubra tus necesidades sin nombrarlas. Practicar la reciprocidad permite cuidar sin tener que ganarte cada relación.',trigger:'No recibir reconocimiento, sentir distancia o que alguien no necesite tu ayuda.',shift:'Cambiar la ayuda automática por una oferta libre y una petición clara.',tips:[
 'Di qué necesitas sin probar primero cuánto has hecho por la otra persona. Deja que pueda responder con libertad.',
 'Pregunta antes de ayudar. Repartid una responsabilidad concreta para que cuidar no recaiga siempre en quien se ofrece primero.',
 'Antes de aceptar una tarea extra, revisa tu carga. Ofrece un alcance y una fecha que realmente puedas cumplir.',
 'Nombra una necesidad propia antes de preguntar por las ajenas. Pide apoyo directamente, sin disculparte por necesitarlo.',
 'Agenda un rato para ti y protégelo como una cita con alguien importante. No lo canceles por una petición no urgente.',
 'Ensaya un no amable: «Esta vez no puedo; sí puedo hacer esto otro». Ofrece alternativa solo si la deseas.',
 'Antes de un regalo, decide cuánto quieres gastar libremente. No lo uses para asegurar cariño ni para generar una deuda.',
 'Elige una actividad que te guste aunque no ayude a nadie. Descubre qué disfrutas cuando no eres imprescindible.'
 ]},
 {pattern:'Si te reconoces en Logro, ver avances puede darte energía y dirección. A veces esa capacidad deja poco espacio para reconocer cansancio, dudas o intereses que no lucen. La propuesta es vincular tus metas a valores propios y permitirte existir fuera del resultado.',trigger:'Una comparación, un fracaso visible o la impresión de estar quedándote atrás.',shift:'Separar tu valor personal del rendimiento de una tarea.',tips:[
 'Cuenta una experiencia incluyendo cómo te sentiste, no solo lo que conseguiste. Escucha sin intentar impresionar ni resolver.',
 'Comparte un rato sin objetivos ni pantallas. No conviertas el encuentro en otra actividad que deba salir perfecta.',
 'Elige una meta por su sentido y otra medida de progreso distinta del reconocimiento. Reconoce la aportación del equipo.',
 'Al terminar una tarea, nombra una emoción y una necesidad antes de pasar a la siguiente. Deja espacio al cansancio.',
 'Pon una hora de cierre a la jornada. Descansar no necesita justificarse como una estrategia para producir más.',
 'Pregúntate si aceptarías ese objetivo sin poder contarlo. Revisa qué coste tiene para tus relaciones y tu tiempo.',
 'Separa una compra útil de una compra para dar imagen. Espera un día antes de decidir sobre la segunda.',
 'Aprende algo en lo que puedas ser principiante. Disfrútalo sin publicarlo, competir ni convertirlo en una nueva marca personal.'
 ]},
 {pattern:'Si te reconoces en Identidad, quizá valores mucho el significado y la expresión auténtica. Compararte con una versión ideal de tu vida puede eclipsar lo que ya existe. El ejercicio es dar sitio a tu sensibilidad sin esperar una emoción extraordinaria para actuar.',trigger:'Sentirte poco comprendido o comparar tu vida cotidiana con la imagen de otra persona.',shift:'Pasar de lo que parece faltar a una experiencia concreta que sí está disponible.',tips:[
 'Explica una necesidad concreta en lugar de esperar que comprendan toda tu experiencia. Pregunta cómo vive la situación la otra persona.',
 'Reconoce un gesto cotidiano de cuidado. No tiene que ser extraordinario para tener significado en la convivencia.',
 'Trabaja quince minutos en una tarea importante aunque no llegue la inspiración. Conserva una idea propia en una entrega sencilla.',
 'Distingue «siento tristeza» de «todo está mal». Describe qué ocurrió hoy y qué apoyo te serviría ahora.',
 'Crea un ritual pequeño y repetible, como leer una página. Puedes sostenerlo incluso en un día poco especial.',
 'Compara opciones reales, con ventajas y límites. No enfrentes una opción posible con una alternativa imaginada sin inconvenientes.',
 'Anota qué esperas sentir al comprar algo. Busca también una forma sencilla de expresar esa necesidad sin consumir.',
 'Haz un registro de tres momentos ordinarios con sentido. La autenticidad también puede aparecer en lo repetido.'
 ]},
 {pattern:'Si te reconoces en Comprensión, observar y entender puede ayudarte a sentir autonomía. El desafío surge cuando esperar a saber más te mantiene fuera de la experiencia. Puedes cuidar tu energía y participar a la vez, con compromisos pequeños y explícitos.',trigger:'Demandas inesperadas, mucha interacción o sentir que no tienes preparación suficiente.',shift:'Cambiar la preparación interminable por una participación acotada.',tips:[
 'Explica cuándo necesitas espacio y cuándo volverás a conversar. Un límite con una hora de regreso puede ofrecer claridad y cercanía.',
 'Participa en una tarea compartida con un tiempo acordado. Expresa tus límites antes de retirarte por saturación.',
 'Define la información mínima para probar una idea. Haz una prueba breve y aprende de lo que ocurra en la práctica.',
 'Además de explicar lo que pasó, nombra cómo te afectó. Puedes empezar con una palabra y pedir tiempo para continuar.',
 'Alterna un rato de concentración con una pausa fuera de la pantalla. Observa qué te ayuda a recuperar energía.',
 'Pon un plazo a una decisión pequeña. Si falta información, identifica qué dato cambiaría realmente tu elección.',
 'Limita las comparaciones de una compra sencilla a unas pocas opciones. Más información no siempre resuelve la incertidumbre.',
 'Comparte una idea aún incompleta con alguien de confianza. Explora qué descubres al participar, además de estudiar a solas.'
 ]},
 {pattern:'Si te reconoces en Seguridad, anticipar y buscar apoyos puede ayudarte a actuar con prudencia. Cuando cada comprobación abre otra duda, quizá necesites ensayar confianza en un paso pequeño. No se trata de eliminar riesgos, sino de distinguir los concretos de los imaginados.',trigger:'Mensajes ambiguos, cambios de plan o no saber con quién puedes contar.',shift:'Pasar de buscar certeza total a preparar un paso razonable y reversible.',tips:[
 'Pregunta por una conducta concreta antes de interpretar lo que significa. Pide claridad sin convertir la conversación en una prueba de lealtad.',
 'Acordad un plan sencillo para un imprevisto habitual. Después volved a la actividad, sin ensayar cada problema posible.',
 'Escribe un riesgo real, una medida útil y el siguiente paso. Evita añadir comprobaciones que no cambiarían la decisión.',
 'Divide una hoja entre hechos y posibilidades. Elige una acción sobre lo que sabes y comparte lo que te preocupa.',
 'Prueba una rutina breve sin buscar otra confirmación cada día. Revisa cómo funcionó después de una semana.',
 'Toma una decisión pequeña y reversible por tu cuenta. Anota qué aprendiste, también si el resultado fue imperfecto.',
 'Antes de una compra, contrasta datos básicos y condiciones. No decidas solo por una urgencia comercial o por tranquilizar una duda.',
 'Recuerda una ocasión en que resolviste algo inesperado. Elige una experiencia nueva pequeña con apoyo disponible, no con garantías totales.'
 ]},
 {pattern:'Si te reconoces en Posibilidades, imaginar alternativas puede darte vitalidad y creatividad. La dificultad puede aparecer cuando abrir otra opción evita cerrar algo o escuchar una emoción incómoda. La práctica es combinar curiosidad con presencia y compromisos de tamaño realista.',trigger:'Aburrimiento, sentirte limitado o encontrarte con una emoción que no quieres sostener.',shift:'Elegir una posibilidad y permitir que también tenga partes difíciles.',tips:[
 'Escucha una dificultad sin cambiar enseguida de tema ni buscar el lado positivo. Pregunta qué necesita la otra persona.',
 'Elige un plan compartido y completa también la parte menos entretenida. Pregunta por el ritmo que necesitan los demás.',
 'Guarda las ideas nuevas en una lista y termina un paso del proyecto actual antes de abrir otro.',
 'Haz una pausa y nombra lo incómodo sin forzarte a resolverlo. Si pesa demasiado, busca compañía y apoyo.',
 'Reduce un hábito a diez minutos y repítelo antes de variar. Celebra completar, no solo estrenar.',
 'Al decir sí a algo, identifica a qué estás diciendo no. Protege un compromiso que ya habías elegido.',
 'Deja una compra no necesaria en una lista hasta mañana. Comprueba si sigue interesándote cuando pasó la emoción inicial.',
 'Elige una experiencia sencilla y préstale atención hasta el final. Observa qué disfrutas sin añadir otra actividad.'
 ]},
 {pattern:'Si te reconoces en Autonomía, la firmeza puede ayudarte a defender límites y proteger lo importante. Puede costar más escuchar o recibir ayuda cuando todo se vive como una disputa por el control. La propuesta es unir claridad con curiosidad y permitir una vulnerabilidad elegida.',trigger:'Sentirte controlado, tratado injustamente o expuesto sin poder decidir.',shift:'Conservar el límite y bajar la intensidad con la que lo comunicas.',tips:[
 'Expresa qué te dolió antes de discutir quién tiene razón. Haz una pregunta y escucha la respuesta completa.',
 'Comparte una decisión que sueles tomar por todos. Pide propuestas sin corregirlas antes de haberlas entendido.',
 'Delega una tarea acordando resultado y revisión. Deja espacio real para que otra persona elija cómo realizarla.',
 'Cuando suba la intensidad, pide una pausa con hora de regreso. Nombra la necesidad que quieres proteger al volver.',
 'Incluye un momento de descanso que no sea otra prueba de resistencia. Reconoce una señal temprana de cansancio.',
 'Distingue un límite propio de una orden para otra persona. Formula qué harás tú si ese límite no se respeta.',
 'En una compra o gasto compartido, escucha el criterio de los demás. No confundas decidir rápido con decidir por todos.',
 'Acepta ayuda en una tarea pequeña. Comprueba cómo se siente compartir responsabilidad sin perder tu capacidad de elegir.'
 ]},
 {pattern:'Si te reconoces en Armonía, escuchar y encontrar puntos comunes puede facilitar la convivencia. El coste aparece cuando tus preferencias desaparecen para evitar tensión. Practicar una presencia más visible permite buscar acuerdos donde también estás incluido.',trigger:'Una discusión, prioridades en conflicto o alguien que expresa su opinión con mucha fuerza.',shift:'Pasar de acomodarte automáticamente a decir una preferencia concreta.',tips:[
 'Expresa una preferencia antes de preguntar qué quiere la otra persona. Un desacuerdo pequeño también puede caber en una relación cercana.',
 'Propón un reparto concreto de una tarea. Comprueba que tu sí sea una elección y no una manera de terminar la conversación.',
 'Elige una prioridad propia al empezar el día y dedica diez minutos a ella antes de responder a todas las demandas.',
 'Observa una incomodidad que sueles minimizar. Escríbela con tus palabras antes de decidir si necesitas hablarla.',
 'Prepara el primer paso de una tarea y una hora de inicio. No esperes a tener ganas de hacerla completa.',
 'Ante una propuesta, date un momento: «Lo pienso y te digo». Después responde con una preferencia o un límite claro.',
 'Revisa un gasto recurrente que has dejado pasar por inercia. Decide conscientemente si todavía te sirve.',
 'Recupera un interés que has ido posponiendo. Reserva un momento pequeño y cuéntale a alguien por qué te importa.'
 ]}
];
const childPractices=[
 ['Explica a un amigo lo que prefieres sin corregir su forma de jugar.','Prueba una tarea y acepta un pequeño error.','Habla con un adulto sobre algo que te exigiste mucho.','Termina una tarea corta cuando esté suficientemente bien.'],
 ['Pregunta si tu amigo quiere ayuda y cuenta también qué necesitas tú.','Pide ayuda en una tarea sin sentir que debes devolverla enseguida.','Di a un adulto qué necesitas hoy, aunque sea diferente a lo que necesitan otros.','Reserva un rato para un juego que tú elijas.'],
 ['Comparte algo que disfrutaste sin contar quién ganó.','Prueba una actividad nueva en la que puedas aprender poco a poco.','Cuenta cómo te sentiste con un resultado, no solo qué nota obtuviste.','Haz una pausa aunque quede una tarea para después.'],
 ['Cuenta qué te gustaría hacer sin compararte con otro amigo.','Empieza una tarea breve aunque hoy no te parezca especial.','Nombra una emoción y recuerda que no dura siempre igual.','Busca algo agradable en una rutina cotidiana.'],
 ['Di cuándo quieres estar un rato a solas y cuándo te gustaría volver al juego.','Prueba un paso de una tarea antes de entenderla por completo.','Cuenta a un adulto una emoción con una palabra o un dibujo.','Alterna una actividad a solas con otra compartida que elijas.'],
 ['Pregunta lo que pasó antes de pensar que alguien ya no quiere jugar contigo.','Elige un paso pequeño con la información que ya tienes.','Distingue con un adulto lo que ocurrió de lo que imaginas que podría ocurrir.','Prueba una rutina pequeña y cuenta después cómo te fue.'],
 ['Escucha a tu amigo hasta el final, aunque se te ocurra un plan nuevo.','Termina un paso del juego o tarea antes de cambiar a otra cosa.','Cuenta algo que te molestó sin tener que convertirlo enseguida en algo divertido.','Haz una actividad breve completa antes de elegir la siguiente.'],
 ['Di lo que quieres con voz tranquila y pregunta qué quiere tu amigo.','Deja que otra persona elija cómo hacer una parte del trabajo compartido.','Cuenta a un adulto algo que te dolió; pedir ayuda también está bien.','Descansa cuando notes cansancio, sin tener que demostrar cuánto aguantas.'],
 ['Di qué juego prefieres aunque otra persona elija uno distinto.','Empieza por una tarea que sea importante para ti.','Cuenta una pequeña molestia antes de dejarla siempre para después.','Elige una hora y un primer paso para algo que llevas posponiendo.']
];
export function coachingProfile(id,minor=false,age=minor?10:30){
 const t=TYPES.find(x=>x.id===id);if(!t)throw Error('Unknown tendency');const c=profiles[id-1];
 const teen=minor&&age>=12;const child=childPractices[id-1];const tips=minor?[child[0],'Elegid juntos una pequeña tarea de convivencia. Cada persona puede contar qué le resulta fácil y qué ayuda necesita.',child[1],child[2],child[3],'Practica decir «necesito pensarlo» o «prefiero otra cosa». Para una decisión difícil, pide ayuda a un adulto de confianza.','Si tienes paga, elige con un adulto qué guardar y qué gastar. Antes de una compra, cuenta por qué la quieres.','Elige un juego o interés por curiosidad, sin tener que destacar. Después cuenta qué disfrutaste y qué cambiarías.']:c.tips;
 return {...t,...c,pattern:minor?'Esta mirada es una invitación para conversar, no una descripción fija de ti. '+t.drive+' Busca un ejemplo que encaje y otro que sea diferente. Tú decides qué te sirve.':c.pattern,areas:AREAS.map((a,i)=>({...a,question:minor&&age<12?childQuestions[i]:a.question,name:minor?(teen&&a.id==='relationships'?'Amistades y vínculos':teen&&a.id==='work'?'Estudios y proyectos':teen&&a.id==='purpose'?'Intereses y futuro':a.child):a.name,tip:teen?tips[i].replace(/un juego/g,'una actividad').replace(/al juego/g,'a la actividad').replace(/tarea/g,'actividad').replace(/un adulto(?: de confianza)?/g,'una persona adulta de confianza'):tips[i]}))};
}
// Original, optional experiments. A score selects a question to explore, never a life story.
const experiments=[
 {title:'Un criterio suficiente',contrast:'¿Cuándo aceptaste un resultado suficiente? Comprueba si el problema era el estándar, un acuerdo confuso o los recursos disponibles.',action:'En una tarea pequeña, acuerda qué dos condiciones bastan para terminar y entrega cuando se cumplan, sin añadir una revisión automática.',observe:'Registra si cumpliste lo acordado, cuántas revisiones hiciste y qué diferencia real habría aportado seguir corrigiendo.',adjust:'Si apareció un error importante, ajusta el criterio con datos. Si solo cambió una preferencia, decide si merece otra revisión.'},
 {title:'Una ayuda elegida',contrast:'¿Has dicho que no y conservado la cercanía? Revisa también si había un reparto desigual de tareas, en vez de atribuirte toda la carga.',action:'Ante una petición pequeña, pregunta qué ayuda hace falta y ofrece solo una parte que puedas asumir; expresa también una necesidad propia.',observe:'Anota qué se pidió, qué acordaste y si tu ofrecimiento cabía en tu tiempo. La gratitud de otra persona no es la medida del ensayo.',adjust:'Si faltaban recursos o el reparto era desigual, renegocia el acuerdo. Reduce la oferta antes de exigirte estar más disponible.'},
 {title:'Un resultado con sentido',contrast:'¿Qué actividad elegirías sin reconocimiento? Distingue tu preferencia de la presión de un plazo, una obligación o una evaluación externa.',action:'Elige una tarea pequeña por una razón propia y define un resultado suficiente. Al terminar, registra un aprendizaje antes de abrir otra meta.',observe:'Comprueba si hiciste lo elegido y qué coste tuvo en tiempo. Reconocer una duda o pedir ayuda también aporta información útil.',adjust:'Si el objetivo dependía de aprobación ajena, reformúlalo como una acción propia. Si no te importa, puedes sustituirlo por otro.'},
 {title:'Un paso en un día corriente',contrast:'¿En qué día corriente hiciste algo con sentido? Comprueba si faltaban recursos o compañía antes de explicar la dificultad solo por comparación.',action:'Elige una actividad que exprese algo propio y haz una versión sencilla, aunque hoy no llegue la inspiración. Decide tú qué conservar de ella.',observe:'Describe qué hiciste y qué parte tuvo sentido para ti, sin compararla con una experiencia ajena ni exigir una emoción especial.',adjust:'Si no encajó, cambia el contexto o la actividad. Una experiencia corriente no prueba que te falte profundidad o autenticidad.'},
 {title:'Un ensayo acotado',contrast:'¿Cuándo participar te ayudó a comprender? Distingue una preparación necesaria de una pausa elegida o de una demanda realmente excesiva.',action:'Prueba una parte pequeña de una tarea con un límite de tiempo acordado. Anota una pregunta que solo puedas resolver participando.',observe:'Registra qué información nueva aportó el ensayo y si respetaste el límite. Anota también qué preparación sí resultó necesaria.',adjust:'Si la carga era excesiva, reduce el alcance o pide apoyo. Si un dato cambia la decisión, búscalo antes del siguiente ensayo.'},
 {title:'Un paso revisable',contrast:'¿Cuándo decidiste con información suficiente? Revisa si había un riesgo real o instrucciones ambiguas antes de atribuir toda duda a tu tendencia.',action:'Para una decisión pequeña y reversible, escribe un riesgo concreto, una protección razonable y cuándo revisarás lo decidido; da ese primer paso.',observe:'Cuenta qué comprobaciones cambiaron la decisión y cuáles repitieron la misma información. Registra el resultado sin exigir certeza total.',adjust:'Si apareció un riesgo nuevo, actualiza el plan. Si no cambió la información, decide si otra consulta aportaría algo antes de hacerla.'},
 {title:'Una opción hasta el siguiente paso',contrast:'¿Cuándo sostuviste una tarea poco entretenida? Comprueba si el cambio de rumbo respondía a una prioridad real o a una opción más atractiva.',action:'Escoge un paso concreto de un compromiso y termínalo antes de abrir otra actividad. Guarda las ideas nuevas en una lista para revisarlas después.',observe:'Anota qué parte cerraste, qué idea pospusiste y si apareció una necesidad de descanso o ayuda. Completar no exige disfrutar cada momento.',adjust:'Si el compromiso era demasiado grande, reduce el paso. Si cambió una prioridad real, renegocia el acuerdo en vez de mantenerlo por inercia.'},
 {title:'Un acuerdo con espacio compartido',contrast:'¿Cuándo escuchar otra propuesta protegió lo importante? Distingue un límite necesario de una preferencia sobre cómo deben actuar los demás.',action:'En una tarea compartida segura, expresa un límite importante y pregunta cómo lo haría la otra persona. Acordad qué parte puede decidir cada cual.',observe:'Comprueba si el límite quedó claro y si escuchaste una propuesta completa antes de decidir. La obediencia ajena no mide tu avance.',adjust:'Si faltaban garantías o el contexto no era seguro, no te expongas para cumplir el ejercicio. Revisa el apoyo y el alcance del acuerdo.'},
 {title:'Una preferencia con lugar propio',contrast:'¿Cuándo expresaste una diferencia y el vínculo continuó? Comprueba si había presión real o falta de opciones antes de atribuir el silencio a un rasgo.',action:'En una decisión cotidiana pequeña, expresa tu preferencia antes de acomodarte al grupo. Escucha otra opción y propone un acuerdo que también te incluya.',observe:'Anota si tu preferencia fue expresada y si el acuerdo se entendió. Que el grupo elija otra cosa no borra lo que tú pudiste decir.',adjust:'Si te resultó difícil, empieza en un contexto con más confianza o escribe antes la frase. Puedes buscar apoyo sin forzarte a discutir.'}
];

export function buildExperiment(result,primaryId=null){
 const sourceId=!result.minor&&result.eligible&&result.leaders.length===1&&result.leaders[0]===primaryId?primaryId:null;
 let exercise=sourceId?experiments[sourceId-1]:null;
 if(result.minor){
  exercise=result.age<12?{title:'Tú eliges un pequeño paso',action:'Elige tú un juego o una tarea pequeña y cuenta qué prefieres. Puedes decirlo o dibujarlo; una persona adulta escucha sin responder por ti.',observe:'Cuenta qué intentaste y qué ayuda te sirvió. No hace falta hacerlo perfecto ni compartir algo que quieras guardar para ti.',adjust:'Puedes repetir, cambiar o dejar la actividad. Si no entiendes la propuesta o te sientes presionado, pide ayuda a alguien de confianza.'}:{title:'Una decisión que puedas revisar',action:'Elige tú una situación de amistades, estudios o un proyecto. Expresa una preferencia y acuerda un paso pequeño; tú decides qué contar y qué reservarte.',observe:'Registra qué hiciste, qué apoyo necesitaste y qué cambió en la situación. La opinión de otras personas no define quién eres.',adjust:'Reduce el paso si hay demasiada carga, busca apoyo si lo necesitas o elige otra situación. Puedes discrepar con la propuesta.'};
 }else if(!exercise){
  exercise={title:'Un episodio, dos explicaciones',action:'Elige un episodio real y escribe dos motivos posibles para tu respuesta. Busca un dato a favor y una excepción para cada uno antes de ensayar una alternativa.',observe:'Registra qué explicación encajó, qué dato faltaba y qué hiciste de otra manera. Puedes conservar más de una posibilidad abierta.',adjust:'Si ninguna explicación sirve, cambia la pregunta o el episodio. Revisa acuerdos, recursos y presión externa antes de atribuirte un rasgo.'};
 }
 const cue=result.minor?'Elige una situación que tú quieras explorar; puedes omitirla o pedir acompañamiento.':'Elige una situación pequeña y segura que quieras comprender. La propuesta solo es útil si reconoces ese contexto.';
 return {...exercise,sourceId,cue,steps:[cue,exercise.action,exercise.observe,exercise.adjust]};
}

export function coachingContrast(id){return experiments[id-1]?.contrast??'';}

export function buildCoaching(result){
 const focus=!result.minor&&result.eligible&&result.leaders.length<=3?result.leaders:[];
 const title=result.minor?'Una conversación para crecer juntos':!result.eligible?'Primero, completa tu mapa':focus.length===1?'De tus respuestas a una hipótesis':focus.length?'Explora los matices entre tus tendencias':'Un mapa amplio, sin una conclusión única';
 const intro=result.minor?(result.age>=12?'Puedes explorar cómo actúas entre amistades, estudios y decisiones con más autonomía. Tú eliges qué contar y qué reservarte; una persona adulta de confianza acompaña sin definirte. Tus respuestas no fijan tu identidad.':'Tus respuestas no deciden quién eres. Elige una situación del colegio, de casa o con amigos. Cuenta qué pasó con tus propias palabras; el adulto escucha y pregunta, sin responder por ti.'):!result.eligible?'Faltan respuestas para comparar. Puedes leer las nueve miradas y escoger una pregunta, sin extraer conclusiones de los huecos.':focus.length===1?`En tus respuestas destaca ${focus[0]} · ${TYPES[focus[0]-1].name}. Úsalo como hipótesis de autoobservación, no como una definición: la misma conducta puede tener motivos diferentes según la situación.`:focus.length?`Aparecen próximas ${focus.map(id=>id+' · '+TYPES[id-1].name).join(', ')}. Contrasta qué buscabas en una misma situación; una diferencia pequeña de puntuación no decide tu identidad.`:'Las respuestas no separan claramente unas pocas tendencias. No forzamos un resultado: elige un episodio real y usa las nueve miradas para explorar motivos distintos.';
 return {focus,title,intro,profiles:TYPES.map(t=>coachingProfile(t.id,result.minor,result.age)),questions:result.minor?['¿Qué pasó y cómo te sentiste?','¿Qué querías o necesitabas en ese momento?','¿Qué te gustaría probar la próxima vez?','¿Quién puede acompañarte si necesitas ayuda?']:['¿Qué ocurrió, sin interpretar las intenciones de los demás?','¿Qué querías conseguir o evitar?','¿Cómo te ayudó tu reacción y qué coste tuvo?','¿Qué ejemplo contradice tu primera interpretación?','¿Qué respuesta alternativa pequeña quieres ensayar?'],plan:result.minor?[
 'Día 1 · Elige una situación que quieras contar. Un adulto escucha sin darte un tipo.',
 'Día 2 · Nombra una emoción y algo que necesitabas.',
 'Día 3 · Escoge una de las nueve miradas y busca también un ejemplo diferente.',
 'Día 4 · Elige una acción pequeña que quieras probar, sin obligación de hacerlo perfecto.',
 'Día 5 · Pruébala y pide ayuda si la necesitas.',
 'Día 6 · Cuenta qué pasó. El adulto pregunta qué te sirvió, sin calificarte.',
 'Día 7 · Decide qué repetir o cambiar. Guarda solo lo que te resulte útil.'
 ]:[
 'Día 1 · Elige un área y describe una situación reciente con hechos concretos.',
 'Día 2 · Nombra tu motivación, la emoción y la necesidad que querías atender.',
 'Día 3 · Contrasta dos miradas: busca un ejemplo a favor y otro que no encaje.',
 'Día 4 · Elige una acción del informe y ponle momento, lugar y duración de diez minutos.',
 'Día 5 · Prueba la acción. Registra qué hiciste y qué efecto observaste, sin juzgarte.',
 'Día 6 · Pide una observación concreta a alguien de confianza, sin pedirle que te tipifique.',
 'Día 7 · Revisa qué te sirvió, qué no y qué ajustarás. El progreso es observar y elegir.'
 ]};
}
