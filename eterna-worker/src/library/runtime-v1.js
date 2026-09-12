/* ETERNA owned teaching library. Pure, bounded, network-free decisions.
 * Only a complete allowlisted utterance may use the no-model path. Unknown,
 * mixed, current, sensitive or open-ended turns return null to the existing tutor.
 * Never trust a client's expected_answer: re-derive from a known question bank.
 */
(function(root){
  'use strict';
  const VERSION='library-first-v7-content';
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
  function appropriate(lesson,profile){if(profile?.preferred_language&&!/^es(?:-es)?$/i.test(profile.preferred_language))return false;const p=school(profile);return !!p&&p.stage===lesson.stage&&p.grade>=lesson.grade_min&&p.grade<=lesson.grade_max}
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
    {id:'school_boredom',aliases:['me aburro estudiando','estudiar es aburrido','no me gusta estudiar']},
    {"id": "concentration", "aliases": ["me cuesta concentrarme", "no consigo concentrarme"]},
    {"id": "overloaded", "aliases": ["tengo demasiados deberes", "tengo muchas tareas", "no se como organizar tantas tareas"]},
    {"id": "frustrated", "aliases": ["me frustra equivocarme", "estoy frustrado", "estoy frustrada", "esto me sale mal siempre"]},
    {"id": "celebrate", "aliases": ["lo he conseguido", "me ha salido bien", "estoy orgulloso de mi trabajo", "estoy orgullosa de mi trabajo"]},
    {"id": "show_reasoning", "aliases": ["quiero entenderlo y no memorizarlo", "quiero saber el razonamiento", "prefiero entenderlo"]},
    {"id": "teach_back", "aliases": ["puedo explicartelo yo", "quiero explicarlo con mis palabras"]},
    {"id": "ask_teacher", "aliases": ["como le digo al profesor que no entiendo", "como pido ayuda en clase"]},
    {"id": "study_together", "aliases": ["como estudio con un amigo", "como podemos estudiar juntos"]},
    {"id": "integrity", "aliases": ["hazme los deberes", "dame solo las respuestas", "quiero copiar las respuestas"]},
    {"id": "disagreement", "aliases": ["creo que te has equivocado", "esa respuesta esta mal", "no estoy de acuerdo contigo"]},
    {"id": "my_mistake", "aliases": ["me he equivocado", "he cometido un error"]},
    {"id": "curiosity", "aliases": ["me gusta aprender", "tengo curiosidad", "quiero aprender algo nuevo"]},
    {"id": "check_exam", "aliases": ["como reviso un examen", "como compruebo mis respuestas"]},
    {"id": "presentation_nerves", "aliases": ["me da miedo exponer", "me da verguenza exponer", "estoy nervioso por una exposicion"]},
    {"id": "source_check", "aliases": ["como se si una fuente es fiable", "como compruebo una fuente"]},
    {"id": "topic_choice", "aliases": ["puedo elegir el tema", "puedo hacer otra pregunta", "podemos cambiar de tema"]},
    {"id":"outline","aliases":["como hago un esquema","como preparo un esquema","como organizar un esquema"]},
    {"id":"flashcards","aliases":["como hago tarjetas de estudio","como uso tarjetas de repaso","como preparar flashcards"]},
    {"id":"spaced_review","aliases":["como repaso sin olvidarme","como repartir los repasos","como funciona el repaso espaciado"]},
    {"id":"check_answer","aliases":["como compruebo mi respuesta","como reviso un resultado","como se si mi respuesta esta bien"]},
    {"id":"teacher_difference","aliases":["mi profesor lo explico de otra manera","mi profesora lo explico de otra manera","en clase lo hacemos diferente"]},
    {"id":"multiple_methods","aliases":["hay otra forma de resolverlo","puede haber varias soluciones","todos tienen que hacerlo igual"]},
    {"id":"calculator_use","aliases":["puedo usar calculadora","esta mal usar calculadora","cuando uso la calculadora"]},
    {"id":"academic_integrity","aliases":["por que no me das la respuesta directamente","puedes hacer mis deberes por mi","quiero copiar sin entender"]},
    {"id":"manageable_text","aliases":["me cuesta seguir textos largos","me pierdo cuando hay mucho texto","necesito ir paso a paso"]},
    {"id":"unknown_word","aliases":["hay una palabra que no entiendo","no entiendo una palabra del enunciado","que hago si no conozco una palabra"]},
    {"id":"learning_purpose","aliases":["para que sirve aprender esto","por que tengo que aprender esto","que utilidad tiene estudiar"]},
    {"id":"content_sources","aliases":["de donde sacas las explicaciones","que fuentes utilizas","tus explicaciones son oficiales"]},
    {"id":"verify_ai","aliases":["como se si una ia se equivoca","como compruebo lo que dice una ia","debo creer todo lo que dice una ia"]},
    {"id":"no_official_grade","aliases":["esto es una nota oficial","tu puntuacion cuenta para el colegio","eres quien me pone la nota del cole"]},
    {"id":"trusted_adult","aliases":["puedo pedir ayuda a un adulto","puedo hacerlo con mi madre","puedo hacerlo con mi padre","puedo preguntar al profesor"]},
    {"id":"celebrate_process","aliases":["ya me sale","lo hice yo solo","lo hice yo sola"]}
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
      case'reading_embarrassment':return `Es comprensible que a veces dé vergüenza leer o preguntar${name}. Podemos empezar con una frase corta, a tu ritmo, y puedes pedir ayuda a tu profesor en privado. No hace falta hacerlo perfecto ni forzarte delante de todo el grupo.`;
      case'agency':return 'Sí, puedes equivocarte. Un error nos sirve para ver qué paso conviene revisar. Te señalaré algo concreto que puedas mejorar, sin etiquetas ni compararte con otros.';
      case'honesty':return 'Puedo equivocarme. Por eso distingo lo comprobado de lo dudoso, reviso los cálculos cuando es posible y no debería inventar una respuesta para parecer segura. Si algo no encaja, lo revisamos.';
      case'privacy':return 'Utilizo la información escolar disponible para ayudarte. No compartas contraseñas, dirección, teléfonos ni secretos que te hagan sentir inseguro. La información sobre el uso de datos está en Tu privacidad; si algo te preocupa, habla con un adulto de confianza.';
      case'human_support':return 'Puedo escucharte y ayudarte a aprender, pero soy una IA y no sustituyo a las personas que te quieren. También es importante poder hablar con tu familia, tus amigos o un profesor de confianza.';
      case'learning_plan':return 'Elige un objetivo pequeño, intenta recordarlo o resolver un ejemplo sin mirar y comprueba después qué faltaba. Haz una pausa y vuelve a practicar otro día. Podemos empezar por un tema concreto, sin convertir el estudio en una carrera.';
      case'small_step':return pending?'Empecemos por entender qué pide la pregunta. Dime qué parte reconoces y cuál te resulta nueva; no hace falta resolverla entera todavía.':'Empecemos por una sola cosa: dime la asignatura y el tema que quieres trabajar.';
      case'school_boredom':return 'Podemos cambiar la forma de trabajar: un ejemplo cercano, una pregunta corta o una actividad práctica. No hace falta que te guste todo para avanzar; busquemos una pequeña meta que tenga sentido para ti.';
      case"concentration":return "Podemos reducir la tarea a un paso y apartar lo que distraiga. Prueba un tramo breve y después descansa. Si te ocurre a menudo y te preocupa, cuéntaselo a tu familia o al profesor para buscar apoyo; no significa que seas incapaz.";
      case"overloaded":return "Cuando se juntan muchas tareas puede agobiar. Podemos separar lo urgente de lo que puede esperar y elegir un primer paso pequeño. ¿Qué tarea tienes que entregar antes?";
      case"frustrated":return "Es frustrante cuando lo intentas y no sale. No hace falta repetirlo de la misma forma: podemos revisar un solo paso o cambiar de ejemplo. También puedes hacer una pausa; tu valor no depende de este ejercicio.";
      case"celebrate":return "¡Qué bien que notes tu avance! Fíjate en qué te ayudó esta vez: esa estrategia puede servirte de nuevo. No necesito ponerte una nota para reconocer el trabajo que has hecho.";
      case"show_reasoning":return "Ese es un buen objetivo. Podemos conectar la idea con algo que ya sabes, ver por qué funciona y comprobarla con un ejemplo nuevo. Dime qué parte quieres comprender primero.";
      case"teach_back":return "Claro. Explícalo con tus palabras; primero miraré qué idea has captado y después qué conviene ajustar. No hace falta repetir mi explicación literalmente.";
      case"ask_teacher":return "Puedes decir: «Entiendo esta parte, pero me pierdo en este paso. ¿Podemos verlo con otro ejemplo?». Si hablar delante del grupo te cuesta, puedes pedir un momento para comentarlo en privado.";
      case"study_together":return "Podéis turnaros: una persona explica una idea, la otra hace una pregunta y después cambiáis. Comprobad las dudas en una fuente fiable y dejad que cada uno escriba su propia respuesta.";
      case"integrity":return "Puedo ayudarte a que sepas hacerlo, pero no a presentar mi trabajo como tuyo. Muéstrame una pregunta y lo que has intentado; empezamos con una pista útil y avanzamos desde ahí.";
      case"disagreement":return "Gracias por señalarlo. Puedo equivocarme. Dime qué paso o afirmación no encaja y lo revisaremos sin dar por hecho que yo tenga razón; tampoco voy a cambiar la respuesta sin comprobarla.";
      case"my_mistake":return "Podemos usarlo para saber qué revisar. Dime en qué paso crees que ocurrió y lo comprobamos; no voy a deducir un error concreto sin ver tu respuesta.";
      case"curiosity":return "La curiosidad es un buen punto de partida. Podemos elegir un tema del cole y explorarlo con una pregunta concreta. ¿Qué te gustaría entender?";
      case"check_exam":return "Revisa primero qué pide cada pregunta, luego tus pasos y, cuando corresponda, las unidades o la concordancia. En un cálculo, prueba una comprobación distinta. No cambies una respuesta solo por nervios: busca una razón.";
      case"presentation_nerves":return "Hablar delante de otros puede dar nervios. Prepara una idea de inicio, ensaya un tramo corto y apóyate en un esquema, no en memorizar todo. Puedes acordar con tu profesor una forma de empezar que te resulte más cómoda.";
      case"source_check":return "Mira quién publica, qué pruebas aporta, de cuándo es y si otras fuentes independientes lo confirman. Un diseño atractivo no garantiza veracidad. Para datos oficiales, busca el organismo competente y distingue una fuente de una opinión.";
      case"topic_choice":return "Sí, puedes elegir otro tema escolar o hacer otra pregunta. Dime cuál; no hace falta terminar esta parte para pedir un cambio. Si luego quieres volver, revisaremos el contexto disponible.";
      case "outline":return young?"Podemos ordenar la idea con dibujos o palabras cortas. Elige el tema y busca dos cosas importantes sobre él. ¿De qué tema quieres hacerlo?":"Empieza por el tema central, separa las ideas principales y coloca debajo los detalles que dependen de cada una. Usa palabras clave y relaciones claras, no un párrafo copiado en cada rama. ¿Sobre qué tema quieres organizarlo?";
      case "flashcards":return young?"En una cara puedes poner un dibujo o una pregunta corta y, detrás, la respuesta. Intenta recordarla antes de dar la vuelta. Un adulto puede ayudarte a preparar una tarjeta.":"Pon una sola pregunta concreta por tarjeta y una respuesta comprobada al dorso. Intenta responder antes de mirar y separa lo que recuerdas de lo que necesita repaso. Una tarjeta demasiado larga se convierte en una página para releer, no en una comprobación breve.";
      case "spaced_review":return young?"Podemos practicar una idea hoy y volver a recordarla otro día. No hace falta repetir todo muchas veces seguidas. Un adulto puede ayudarte a organizar pequeños ratos.":"Reparte el repaso entre varios momentos e intenta recuperar la idea sin mirar antes de comprobarla. Si cuesta, reduce el intervalo y vuelve con una ayuda concreta. No existe un calendario único que garantice memorizarlo todo: ajustamos según lo que realmente recuerdes.";
      case "check_answer":return young?"Mira qué pedía la pregunta y comprueba una cosa cada vez. En un cálculo podemos contar o probar al revés. Enséñame la pregunta y lo que hiciste.":"Compara tu respuesta con lo que pide el enunciado. Revisa datos, unidades y pasos; en una ecuación, sustituye el resultado, y en una explicación, comprueba que las razones sostienen la conclusión. Necesito ver el trabajo concreto antes de decirte que está bien.";
      case "teacher_difference":return young?"Puede haber otra manera de explicarlo. Muéstrame cómo lo hicisteis en clase y lo comparamos con calma, sin dar por hecho que alguien se ha equivocado.":"Gracias por señalarlo. Puede ser otro método, otra convención o un error que debamos corregir. Comparte el enunciado y la explicación de clase; revisaremos si ambos procedimientos cumplen las mismas condiciones. No voy a desautorizar a tu profesor sin examinarlo.";
      case "multiple_methods":return young?"A veces hay varios caminos. Lo importante es que cada paso tenga sentido. Dime qué camino has probado y veremos si funciona.":"Puede haber varios métodos correctos, y algunos problemas también tienen varias soluciones. Hay que distinguir método, resultado y condiciones del enunciado. Enséñame tu propuesta para comprobarla; no la descartaré solo porque sea diferente de una respuesta preparada.";
      case "calculator_use":return young?"Depende de lo que estéis practicando y de lo que indique tu profesor. Podemos usarla para comprobar cuando esté permitido, sin saltarnos la idea que estás aprendiendo.":"Sigue las indicaciones de la actividad y de tu profesor. La calculadora puede comprobar operaciones o facilitar un cálculo, pero no decide por ti qué operación corresponde ni justifica el razonamiento. En un examen, respeta las herramientas autorizadas.";
      case "academic_integrity":return young?"Te ayudaré para que puedas hacerlo tú: una pista, un ejemplo parecido y después tu intento. No necesitas saberlo todo antes de empezar.":"Puedo explicar el método, resolver un ejemplo de aprendizaje y revisar tu intento. No quiero sustituir tu trabajo por una respuesta que presentes como propia. Empecemos por el primer paso que no te sale; en una actividad evaluada, respetaremos sus reglas.";
      case "manageable_text":return young?"Vamos con una idea pequeña. Dime qué palabra o frase quieres mirar primero; no hace falta resolverlo todo de una vez.":"Podemos dividirlo en fragmentos y comprobar una idea antes de pasar a la siguiente. Dime qué frase te hizo perder el hilo. Si necesitas una adaptación habitual, conviene acordarla también con tu profesor o tu familia; no voy a sacar un diagnóstico de esta dificultad.";
      case "unknown_word":return young?"Dime la palabra y la frase donde aparece. Así puedo explicarla con un ejemplo que encaje, sin adivinar qué significa aquí.":"Comparte la palabra junto con la oración donde aparece. Primero revisamos su sentido en ese contexto; después reformulamos el enunciado. Una misma palabra puede significar cosas distintas según la materia y la frase.";
      case "learning_purpose":return young?"Es una buena pregunta. Dime qué idea estamos mirando y busquemos un ejemplo cercano: algo que puedas observar, explicar o hacer con ella.":"La utilidad depende del tema: puede ayudarnos a resolver situaciones, comprender el mundo o desarrollar una forma de razonar. No todos los contenidos tienen una aplicación inmediata. Podemos buscar un uso concreto y también qué capacidad intelectual estás practicando.";
      case "content_sources":return young?"Uso materiales preparados para ayudarte a aprender y referencias educativas. Soy una IA y puedo equivocarme; una explicación mía no es un texto oficial de tu colegio.":"Uso materiales propios de ETERNA, referencias curriculares y, cuando hace falta, el tutor de IA. La normativa indica qué aprendizajes se trabajan, pero no convierte cada explicación en texto oficial ni homologado. Para una afirmación importante conviene comprobar la fuente concreta y su vigencia.";
      case "verify_ai":return young?"No tienes que creer una respuesta solo porque suene segura. Podemos comprobar un ejemplo, volver a contar o preguntar a un adulto o a tu profesor cuando sea importante.":"Comprueba los pasos, busca fuentes pertinentes y distingue datos, interpretación y opinión. Una respuesta segura o bien escrita puede contener errores. En cálculos, verifica sustituyendo o con otro método; en hechos, contrasta fuentes fiables y actuales cuando corresponda.";
      case "no_official_grade":return young?"No pongo la nota oficial de tu colegio. Las preguntas de aquí nos ayudan a descubrir qué entiendes y qué conviene practicar.":"No. Los resultados de ETERNA orientan esta práctica y no sustituyen la evaluación de tu centro ni una revisión de tu profesor. Un acierto aislado tampoco demuestra dominar todo el tema; interesa ver cómo razonas y si puedes aplicar la idea de nuevo.";
      case "trusted_adult":return young?"Claro. Aprender con tu familia o con tu profesor puede ayudarte mucho. Puedes enseñarles qué parte te cuesta y explicar lo que ya has intentado.":"Sí. Pedir apoyo no invalida tu esfuerzo. Explica qué has entendido, muestra tu intento y señala dónde te has atascado. ETERNA es un recurso de apoyo, no un reemplazo de tu familia, de tu profesor ni de otras personas de confianza.";
      case "celebrate_process":return young?"¡Bien por ese avance! Cuéntame qué paso te ayudó. Así podrás volver a usarlo cuando aparezca algo parecido.":"¡Bien por ese avance! Identifica qué cambió en tu razonamiento o qué estrategia te ayudó. Podemos comprobarlo con otro caso cuando quieras; no voy a dar una respuesta por correcta sin haberla visto.";
      default:return null;
    }
  }
  let indexedSnapshot=null,indexedAliases=new Map();
  function aliasIndex(){
    const snapshot=root.ETERNA_LIBRARY_CONTENT;
    if(indexedSnapshot!==snapshot){
      const map=new Map();for(const l of lessons())for(const a of new Set([l.title,...l.aliases].map(a=>norm(a).replace(/^(?:el|la|los|las|un|una) /,'')))){const values=map.get(a)||[];values.push(l);map.set(a,values)}
      indexedSnapshot=snapshot;indexedAliases=map;
    }
    return indexedAliases;
  }
  function exactLesson(text,profile){
    if(typeof text!=='string'||text.length>230||/[\n\r<>`{}\[\]]/.test(text))return null;
    let s=whole(text);
    // A grammar, not a fuzzy substring match. Every remaining word must be an alias.
    s=s.replace(/^hola(?: eterna)? /,'')
      .replace(/^(?:me puedes|me podrias|puedes|podrias) (?:explicar|ensenar|ayudar a entender|ayudarme a entender)(?: un poco)? /,'')
      .replace(/^(?:me explicas|podemos repasar|podemos practicar|necesito ayuda con|tengo dudas sobre) /,'')
      .replace(/ (?:paso a paso|de forma sencilla|de manera sencilla)$/,'');
    s=s.replace(/^(?:quiero|necesito) (?:aprender|entender|practicar|repasar|estudiar)(?: sobre)? /,'')
      .replace(/^(?:explicame|explica|ensename|cuentame|ayudame con|ayudame a entender|repasar|practicar|repasemos|practiquemos)(?: sobre)? /,'')
      .replace(/^(?:que es|que son|en que consiste|como funciona|como funcionan) /,'')
      .replace(/^(?:el|la|los|las|un|una) /,'').trim();
    const hits=(aliasIndex().get(s)||[]).filter(l=>appropriate(l,profile));
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
    const s=whole(text),letter=s.match(/^(?:(?:creo que es|creo que|la respuesta es|la opcion|opcion|la) )?(a|b|c|be|ce)$/);
    if(letter)return {a:'A',b:'B',be:'B',c:'C',ce:'C'}[letter[1]];
    // Keep signs, decimal separators, powers, units and negation significant.
    const exact=v=>{const raw=String(v??'').normalize('NFC').replace(/−/g,'-').replace(/\s+/g,' ').trim();return /[0-9]|^(?:(?:es )?m\/?s(?:²|2)?|cm(?:²|³)?|m(?:²|³)?|kg|g|mg|s|ms|Hz|N|J|W|Pa|V|A|C|K|mol|L|mL|Ω|°C)$/i.test(raw)?raw:raw.toLocaleLowerCase('es-ES')};
    const value=exact(text),matches=q.options.map((o,i)=>[exact(o),'ABC'[i]]).filter(([o])=>o===value||'es '+o===value);
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
  root.EternaOwnedLibrary=Object.freeze({version:VERSION,release_id:'eterna-library-2026.09-v8-410-consolidated-1c484e',school,appropriate,protocol,cordial,protocols:PROTOCOLS,exactLesson,owned,clientTurn,decision,question,contextText});
})(globalThis);
