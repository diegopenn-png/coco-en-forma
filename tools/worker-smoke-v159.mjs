import worker from '../eterna-worker/src/index.js';

const calls=[];
const realFetch=globalThis.fetch;
function responseOutput(obj){return new Response(JSON.stringify({output_text:JSON.stringify(obj),usage:{input_tokens:30,output_tokens:20}}),{status:200,headers:{'content-type':'application/json'}})}

globalThis.fetch=async (url,init={})=>{
  const u=String(url); calls.push({url:u,method:init.method||'GET'});
  if(u.includes('/auth/v1/user')) return new Response(JSON.stringify({id:'11111111-1111-1111-1111-111111111111',email:'tester@example.com'}),{status:200});
  if(u.includes('/rest/v1/eterna_student_profiles')) return new Response(JSON.stringify([{user_id:'11111111-1111-1111-1111-111111111111',stage:'primaria',school_year:'5º de Primaria',autonomous_community:'Andalucía'}]),{status:200});
  if(u.includes('/rest/v1/perfiles')) return new Response(JSON.stringify([{apodo:'CocoTest',edad:10}]),{status:200});
  if(u.includes('/rest/v1/eterna_mastery')) return new Response(JSON.stringify([]),{status:200});
  if(u.includes('/rest/v1/eterna_student_concept_memory')) return new Response(JSON.stringify([]),{status:200});
  if(u.includes('/rest/v1/eterna_subscriptions')) return new Response(JSON.stringify([{status:'active',plan:'tester'}]),{status:200});
  if(u.includes('/rest/v1/eterna_parent_settings')) return new Response(JSON.stringify([{voice_enabled:true,allow_image_input:true,allow_audio_input:true,max_sessions_per_day:20}]),{status:200});
  if(u.includes('/rest/v1/eterna_usage') && (init.method||'GET')==='GET') return new Response(JSON.stringify([{usage_date:'2026-08-21',chat_requests:0,image_requests:0,input_tokens:0,output_tokens:0,speech_characters:0}]),{status:200});
  if(u.includes('/rest/v1/eterna_concepts')) return new Response(JSON.stringify([]),{status:200});
  if(u.includes('/rest/v1/')) return new Response(JSON.stringify([]),{status:200});
  if(u.endsWith('/v1/moderations')) return new Response(JSON.stringify({results:[{flagged:false,categories:{}}]}),{status:200,headers:{'content-type':'application/json'}});
  if(u.endsWith('/v1/responses')){
    const body=JSON.parse(init.body);
    const name=body?.text?.format?.name;
    const whole=JSON.stringify(body.input||[]);
    if(name==='eterna_scope'){
      if(/película favorita|chat de fútbol/i.test(whole)) return responseOutput({scope:'out_of_scope',subject:null,concept:null,needs_clarification:false,self_contained:false,reason:'No académico'});
      if(/me hacen daño/i.test(whole)) return responseOutput({scope:'safety',subject:null,concept:null,needs_clarification:false,self_contained:false,reason:'Posible riesgo'});
      return responseOutput({scope:'school',subject:'Matemáticas',concept:'sumas',needs_clarification:false,self_contained:true,reason:'Ejercicio escolar'});
    }
    if(name==='eterna_tutor') {
      const answered=/Mi respuesta es 4/i.test(whole);
      return responseOutput({reply:answered?'Correcto. Has comprobado la suma.':'Vamos con una pista: piensa qué significa sumar dos cantidades.',subject:'Matemáticas',concept:'sumas',help_level:answered?0:1,check_question:answered?null:'¿Cuánto es 2 + 2?',practice_suggestion:'Practica una suma parecida.',student_answer_assessment:answered?'correct':'not_applicable',used_curriculum:false,needs_clarification:false});
    }
    if(name==='eterna_verify') return responseOutput({verified:true,requires_clarification:false,issues:[],corrected_reply:null});
  }
  throw new Error('Mock fetch no cubre '+u);
};

const env={
  ALLOWED_ORIGINS:'https://www.cocoenforma.com',
  OPENAI_API_KEY:'test-openai',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',
  TESTER_EMAILS:'tester@example.com',MAX_CHAT_REQUESTS_PER_DAY:'60'
};
function req(path,body,origin='https://www.cocoenforma.com',auth=true){return new Request('https://eterna.example'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(auth?{Authorization:'Bearer user-token'}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});}
function assert(x,msg){if(!x)throw new Error('FAIL '+msg);console.log('✓ '+msg)}

let r=await worker.fetch(new Request('https://eterna.example/health'),env);assert(r.status===200,'health responde');
r=await worker.fetch(req('/v1/chat',{text:'2 + 2',mode:'homework'},'https://evil.example'),env);assert(r.status===403,'origen no autorizado bloqueado');
r=await worker.fetch(req('/v1/chat',{text:'2 + 2',mode:'homework'},'https://www.cocoenforma.com',false),env);assert(r.status===401,'petición sin sesión bloqueada');
r=await worker.fetch(req('/v1/chat',{text:'Dime tu película favorita',mode:'ask'}),env);let d=await r.json();assert(r.status===200&&d.verification_status==='blocked_out_of_scope','tema ajeno termina en respuesta fija');assert(d.reply==='Estoy aquí para ayudarte con el cole y con tu aprendizaje. Para cualquier otra duda o tema, habla con tus padres o con un adulto de confianza.','texto fuera de ámbito exacto');
r=await worker.fetch(req('/v1/chat',{text:'En casa me hacen daño y tengo miedo',mode:'ask'}),env);d=await r.json();assert(r.status===200&&d.verification_status==='blocked_safety','posible riesgo infantil usa ruta separada');
r=await worker.fetch(req('/v1/chat',{text:'No entiendo 2 + 2',mode:'homework'}),env);d=await r.json();assert(r.status===200&&d.verification_status==='verified','consulta escolar atraviesa tutor + verificador');assert(d.help_level===1,'scaffolding devuelve nivel de ayuda');
const responseCalls=calls.filter(c=>c.url.endsWith('/v1/responses')).length;assert(responseCalls>=5,'scope/tutor/verifier fueron llamados según ruta');
const beforeMemoryWrites=calls.filter(c=>c.url.includes('/rest/v1/eterna_student_concept_memory')&&c.method==='POST').length;
r=await worker.fetch(req('/v1/chat',{text:'Mi respuesta es 4',mode:'practice',history:[{role:'assistant',content:'¿Cuánto es 2 + 2?',check_question:'¿Cuánto es 2 + 2?'}]}),env);d=await r.json();assert(r.status===200&&d.student_answer_assessment==='correct','respuesta a comprobación se evalúa como correcta');
const afterMemoryWrites=calls.filter(c=>c.url.includes('/rest/v1/eterna_student_concept_memory')&&c.method==='POST').length;assert(afterMemoryWrites>beforeMemoryWrites,'autolearning actualiza Student Model tras comprobación verificada');
console.log('WORKER SMOKE v159 OK');
globalThis.fetch=realFetch;
