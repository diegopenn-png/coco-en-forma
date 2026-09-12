// PRIVATE TEST WRAPPER ONLY. Never deploy. Fixed requests, no child accounts/data.
import worker from './index.js';
const nativeFetch=globalThis.fetch.bind(globalThis),expires=__EXPIRES__,tokenHash='__TOKEN_HASH__';let running=false;
const check=(ok,msg)=>{if(!ok)throw Error(msg)},json=x=>new Response(JSON.stringify(x),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function digest(t){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export default{async fetch(request,env){
 const fail=(x,status)=>new Response(JSON.stringify({error:x}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(Date.now()>expires||request.method!=='POST'||new URL(request.url).pathname!=='/__context_fixture')return fail('NOT_FOUND',404);
 if(await digest((request.headers.get('Authorization')||'').replace(/^Bearer /,''))!==tokenHash)return fail('UNAUTHORIZED',401);
 const raw=await request.text();if(!['{"case":"context"}','{"case":"fallback"}'].includes(raw))return fail('FIXTURE_REQUIRED',403);
 if(running)return fail('BUSY',409);running=true;
 const kind=JSON.parse(raw).case,uid=crypto.randomUUID(),allowModel=kind==='fallback',deferred=[];let aiCalls=0,openaiCalls=0;const results=[];
 const testEnv={...env,SUPABASE_URL:'https://context-fixture.invalid',SUPABASE_SECRET_KEY:'sb_secret_synthetic',SUPABASE_SERVICE_ROLE_KEY:'',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',SUPABASE_ANON_KEY:'',ENABLE_OFFICIAL_WEB_SEARCH:'false',AI:{run:async(model,input)=>{aiCalls++;check(allowModel&&aiCalls<=8,'Unexpected model call');return env.AI.run(model,input)}}};
 globalThis.fetch=async(input,init={})=>{
  const u=new URL(typeof input==='string'?input:input.url);
  if(u.hostname==='context-fixture.invalid'){
   const p=u.pathname;let rows=[];
   if(p==='/auth/v1/user')return json({id:uid,email:'fixture-adult@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z'});
   if(p.endsWith('/eterna_student_profiles'))rows=[{user_id:uid,school_year:'5º de Primaria',stage:'primaria',autonomous_community:'Andalucía',preferred_language:'es'}];
   else if(p.endsWith('/perfiles'))rows=[{apodo:'Prueba',edad:10,rol:'usuario'}];
   else if(p.endsWith('/eterna_subscriptions'))rows=[{status:'active',plan:'monthly'}];
   else if(p.endsWith('/eterna_legal_acceptances'))rows=[{terms_accepted:true,privacy_accepted:true,ai_notice_accepted:true,parental_authorization:true,relationship:'parent',accepted_at:'2026-09-11T00:00:00Z',legal_version:'2026-08-23-v1'}];
   else if(p.endsWith('/eterna_parent_settings'))rows=[{max_sessions_per_day:100,weekly_question_limit:1000,allow_audio_input:true,allow_image_input:false}];
   else if(p.endsWith('/eterna_concepts')){const l=globalThis.ETERNA_LIBRARY_CONTENT.lessons.find(x=>x.id==='p-prime');rows=[{id:'00000000-0000-4000-8000-000000000080',title:l.title,subject:l.subject,school_year:'5º de Primaria',summary:l.explanation,keywords:['números primos'],example_templates:[l.example],eterna_curriculum_sources:{title:'Referencia curricular de Primaria',official_url:l.curriculum_source}}]}
   return json(rows);
  }
  if(u.hostname==='api.openai.com'&&['/v1/responses','/v1/moderations'].includes(u.pathname)){openaiCalls++;check(allowModel&&openaiCalls<=8,'Unexpected fallback call');return nativeFetch(input,init)}
  throw Error('Unexpected external request in fixture');
 };
 const event={waitUntil(p){deferred.push(Promise.resolve(p));p.catch(()=>{})}};let session='session:context:'+crypto.randomUUID();
 async function turn(text,mode='explain',prev=null,history=[]){const id='request:context:'+crypto.randomUUID(),body={text,mode,history,client_state_contract:3,student_action:prev?'answer':'new_topic',request_id:id,client_turn_id:id,answered_question_id:prev?.pedagogical_state?.pending_question_id||null,session_id:session,activity_state:prev?.activity_state||{contract_version:3,session_id:session,mode,phase:'ASK',question_id:null,question_number:1,difficulty:1},pedagogical_state:prev?.pedagogical_state,mode_state:prev?.mode_state};const r=await worker.fetch(new Request('https://worker.test/v1/chat',{method:'POST',headers:{Authorization:'Bearer synthetic-token',Origin:'https://cocoenforma.com','Content-Type':'application/json'},body:JSON.stringify(body)}),testEnv,event);return{status:r.status,data:await r.json()}}
 try{
  let r=await turn('números primos'),first=r.data;check(r.status===200&&first.library_route==='owned-lesson-v1','First prepared reply failed');
  if(kind==='context'){
   r=await turn('Explícame Números primos más fácil: menos palabras, menos abstracción y menos pasos, pero mantén la precisión. No repitas literalmente la respuesta anterior.','explain',first);
   check(r.status===200&&r.data.library_route==='owned-lesson-v1'&&r.data.pedagogical_state.pending_question_id===first.pedagogical_state.pending_question_id,'Simplify context lost');
   r=await turn('C','explain',r.data);check(r.data.student_answer_assessment==='correct'&&!r.data.check_question,'Answer failed');
   r=await turn('hola Eterna','explain',r.data,[{role:'assistant',text:first.reply,check_question:first.check_question}]);check(r.status===200&&!r.data.pedagogical_state.pending_question,'Completed question revived');
   session='session:context:'+crypto.randomUUID();r=await turn('números primos','exam');r=await turn('C','exam',r.data);const before=r.data;
   r=await turn('¿Qué edad tienes?','exam',before);check(r.data.check_question===before.check_question&&r.data.concept===before.concept,'Cordiality dropped client context');
   r=await turn('Mi respuesta a tu última comprobación es no. Evalúala usando exactamente la pregunta anterior: '+r.data.check_question,'exam',r.data);check(r.data.student_answer_assessment==='correct','Canonical yes/no failed');
   r=await turn('B','exam',r.data);check(r.data.activity_state.phase==='CLOSE'&&r.data.activity_state.correct_count===3,'Exam closure failed');
   check(aiCalls===0&&openaiCalls===0,'Prepared context used inference');results.push({scenario:'simplify-close-greeting-exam-identity-answer',passed:true});
  }else{
   r=await turn('Ponme otro ejemplo distinto de números primos, sin volver a usar el 7 ni el 8.','explain',first,[{role:'user',text:'números primos'},{role:'assistant',text:first.reply,check_question:first.check_question}]);
   results.push({scenario:'actual-provider-fallback',status:r.status,verification:r.data.verification_status||null,reply:r.data.reply||null});
   check(r.status===200&&r.data.reply&&!r.data.library_route,'Real tutor fallback failed');check(aiCalls+openaiCalls>0,'Fallback was not exercised');check(r.data.reply!==first.reply,'Repeated original explanation');
  }
  await Promise.allSettled(deferred);return json({ok:true,case:kind,results,ai_calls:aiCalls,openai_calls:openaiCalls,synthetic_auth_and_database:true,child_data_accessed:false,compiled_canonical_worker:true});
 }catch(e){await Promise.allSettled(deferred);return new Response(JSON.stringify({ok:false,case:kind,error:String(e.message).slice(0,200),results,ai_calls:aiCalls,openai_calls:openaiCalls}),{status:500,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}finally{globalThis.fetch=nativeFetch;running=false}
}};
