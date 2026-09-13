import fs from 'node:fs';

const file='eterna-worker/src/index.js';
let src=fs.readFileSync(file,'utf8');
const once=(from,to,label)=>{
  if(!src.includes(from)) throw new Error(`missing anchor: ${label}`);
  src=src.replace(from,to);
};

once('const VERSION="160.98.2-greeting-timing";','const VERSION="160.99.0-conversation-director";','version');

const director=`
const CONVERSATION_DIRECTOR_VERSION="conversation-director-v1";
function directorNorm(value){return String(value??"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLocaleLowerCase("es-ES").replace(/[¿?¡!.,;:]+/g," ").replace(/\\s+/g," ").trim()}
function profileAgeFromContext(ctx){
  const candidates=[ctx?.base?.birth_date,ctx?.base?.fecha_nacimiento,ctx?.profile?.birth_date,ctx?.profile?.fecha_nacimiento];
  for(const candidate of candidates){const calculated=ageFromBirthDate(String(candidate||""));if(calculated!=null)return calculated}
  const direct=Number(ctx?.base?.edad??ctx?.profile?.age);return Number.isInteger(direct)&&direct>=0&&direct<=130?direct:null
}
function isStudentAgeQuestion(text){const n=directorNorm(text);return /^(?:eterna )?(?:que edad tengo|cuantos anos tengo|sabes mi edad|te acuerdas de mi edad)$/.test(n)}
function explicitAcademicSwitch(text){const n=directorNorm(text);return /^(?:(?:vale|ok) )?(?:ahora|cambiando de tema|cambio de tema|volvamos|retomemos|sigamos con|continuemos con)\\b/.test(n)||/\\b(?:matematicas|lengua|ingles|biologia|fisica|quimica|historia|geografia|examen|deberes|tarea|ejercicio)\\b/.test(n)}
function interventionTags(text){const n=directorNorm(text),tags=[];if(/adulto|madre|padre|profesor|familia/.test(n))tags.push("adult_support");if(/112|emergencia|peligro inmediato/.test(n))tags.push("emergency");if(/te entiendo|entiendo que|vaya|siento que/.test(n))tags.push("validation");if(/que te pasa|que ocurrio|que paso|que parte|como te sientes/.test(n))tags.push("clarify");if(/puedes|prueba|haz|dile|cuentale|habla con|anota/.test(n))tags.push("action");if(/te sirvio|ha ayudado|como estas ahora|mejor ahora/.test(n))tags.push("check");return tags}
function recentInterventionTags(history){const seen=new Set();for(const item of Array.isArray(history)?history.slice(-8):[]){if(item?.role!=="assistant")continue;for(const tag of interventionTags(item.text||item.reply||""))seen.add(tag)}return [...seen]}
function conversationDirector({text,history=[],ctx,pedState={},scope,currentSituation}={}){
  const safety=childSafeguardingCategory(text);
  if(safety)return{version:CONVERSATION_DIRECTOR_VERSION,route:"safety",safety_category:safety};
  if(isStudentAgeQuestion(text))return{version:CONVERSATION_DIRECTOR_VERSION,route:"profile_age",age:profileAgeFromContext(ctx)};
  const activeThread=sanitizeRelationalThread(pedState?.relational_thread);
  if(activeThread&&!explicitAcademicSwitch(text))return{version:CONVERSATION_DIRECTOR_VERSION,route:"personal",reason:"active_relational_thread",recent_interventions:recentInterventionTags(history)};
  if(currentSituation&&isRelationalSituation(currentSituation))return{version:CONVERSATION_DIRECTOR_VERSION,route:"personal",reason:"current_relational_signal",recent_interventions:recentInterventionTags(history)};
  if(explicitAcademicSwitch(text))return{version:CONVERSATION_DIRECTOR_VERSION,route:"academic",reason:"explicit_switch"};
  return{version:CONVERSATION_DIRECTOR_VERSION,route:scope?.scope==="school"?"academic":"general",recent_interventions:recentInterventionTags(history)}
}
function profileAgePayload(age,pedState,mode,modeState){
  const reply=age==null?"No tengo tu edad confirmada en el perfil. Pide a un adulto que la complete en Zona Familiar; no voy a inventarla.":\`Tienes \${age} años.\`;
  return{reply,verification_status:"verified",subject:null,concept:null,help_level:0,check_question:null,practice_suggestion:null,student_answer_assessment:"not_applicable",strategy_used:null,mode_label:MODE_PROFILES[mode].label,mode_state:modeState,pedagogical_state:pedState,auto_speak:true,conversation_director:CONVERSATION_DIRECTOR_VERSION}
}
`;
once('const AGE_PEDAGOGY={',director+'\nconst AGE_PEDAGOGY={','director insertion');

once('  const scope=scopeV3Guard(text,academic,incomingPedState,history),vision=image?academic.vision:null;\n  if(scope.scope==="safety"){',
'  const scope=scopeV3Guard(text,academic,incomingPedState,history),vision=image?academic.vision:null;\n  const director=conversationDirector({text,history,ctx,pedState:incomingPedState,scope,currentSituation});\n  if(scope.scope==="safety"||director.route==="safety"){','director route');

once('  const aq=scope.scope==="school"&&scope.needs_clarification&&scope.ambiguity?ambQ(scope):null;',
'  if(director.route==="profile_age")return json(profileAgePayload(director.age,incomingPedState,mode,incomingModeState));\n  const aq=scope.scope==="school"&&scope.needs_clarification&&scope.ambiguity?ambQ(scope):null;','age route');

once('  if(scope.scope==="school"&&scope.intent==="personal_help"){',
'  if(scope.scope==="school"&&(scope.intent==="personal_help"||director.route==="personal")){','personal route');

once('async function relationalTutor(env,{text,history,ctx,situation,pedState}){const policy=ageTeachingProfile(ctx),thread=sanitizeRelationalThread(pedState?.relational_thread),studentName=displayStudentName(ctx?.base?.apodo||ctx?.profile?.apodo||"");const prompt=`Devuelve JSON. Eres Eterna en una conversación de acompañamiento docente con un menor.',
'async function relationalTutor(env,{text,history,ctx,situation,pedState}){const policy=ageTeachingProfile(ctx),thread=sanitizeRelationalThread(pedState?.relational_thread),studentName=displayStudentName(ctx?.base?.apodo||ctx?.profile?.apodo||""),recentInterventions=recentInterventionTags(history);const prompt=`Devuelve JSON. Eres Eterna en una conversación de acompañamiento docente con un menor.','relational context');

once('OBJETIVO: escucha y acompaña como una gran profesora, sin convertirte en terapeuta, amiga exclusiva ni sustituta de la familia o del centro.\nREGLAS:',
'OBJETIVO: escucha y acompaña como una gran profesora, sin convertirte en terapeuta, amiga exclusiva ni sustituta de la familia o del centro.\nINTERVENCIONES YA UTILIZADAS RECIENTEMENTE=\${JSON.stringify(recentInterventions)}. No repitas una intervención ya utilizada salvo que aparezca información nueva que la haga necesaria; el siguiente turno debe avanzar de escuchar→comprender→aclarar→ayudar→comprobar→cerrar.\nREGLAS:','semantic repetition');

once('  relational_continuity_v1:true,adaptive_teacher_presence_v1:true,transient_relational_thread_v1:true,',
'  relational_continuity_v1:true,adaptive_teacher_presence_v1:true,transient_relational_thread_v1:true,conversation_director_v1:true,semantic_repetition_guard_v1:true,profile_age_resolution_v1:true,','health flags');

fs.writeFileSync(file,src);
console.log('conversation director patch applied');
