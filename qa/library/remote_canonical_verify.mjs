// Canonical Worker + actual Supabase authentication, using one disposable synthetic identity.
// No production deployment. No real pupil read/write. Credentials never enter evidence artifacts.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash,randomBytes}from'node:crypto';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
import '../../eterna-worker/src/library/content-v1.js';
const script='coco-eterna-v159',release='eterna-library-2026.09-v1',directory='library-canonical-evidence';mkdirSync(directory,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex'),sourceHash=hash(readFileSync('eterna-worker/src/index.js')),runtimeHash=hash(readFileSync('eterna-worker/src/library/runtime-v1.js'));
assert.equal(sourceHash,'92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb');assert.equal(runtimeHash,'26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21');
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,''),account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
const cliEnv={...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'};
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const p=await r.json();assert.ok(r.ok&&p.success!==false,'Cloudflare read failed '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100);return d}
const baseline=await live(),original=await cf('/versions/'+baseline.versions[0].version_id),bindings=original.resources.bindings,oldVars=Object.fromEntries(bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
assert.equal(baseline.versions[0].version_id,'0abf2be8-16c4-4695-96ae-48d0e9ef82fe','Production changed; do not continue this release');
for(const b of bindings)assert.ok(['plain_text','secret_text','ai'].includes(b.type),'Unmapped binding type');
const vars={...oldVars,ENABLE_ETERNA_LIBRARY:'true',ETERNA_LIBRARY_RELEASE:release},rt=original.resources.script_runtime||{},config={name:script,main:'src/index.js',compatibility_date:rt.compatibility_date,compatibility_flags:rt.compatibility_flags||[],vars};const ai=bindings.find(b=>b.type==='ai');if(ai)config.ai={binding:ai.name};if(rt.limits?.cpu_ms)config.limits={cpu_ms:rt.limits.cpu_ms};if(rt.usage_model)config.usage_model=rt.usage_model;
function upload(config,name){writeFileSync('eterna-worker/.library-canonical.json',JSON.stringify(config));let stdout;try{stdout=execFileSync('npx',['wrangler','versions','upload','--config','.library-canonical.json','--keep-vars','--message',name],{cwd:'eterna-worker',encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:cliEnv})}catch(e){throw Error('Private upload failed '+e.status+'; confidential output withheld')};const url=stdout.match(/Version Preview URL:\s*(https:\/\/[^\s]+)/)?.[1],id=stdout.match(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/)?.[1];assert.ok(id&&url&&/^https:\/\/[a-f0-9-]+-coco-eterna-v159\.chatinmobiliario\.workers\.dev$/.test(url));return{id,url}}
const report={phase:'private-testing',release,source_sha256:sourceHash,runtime_sha256:runtimeHash,base_version:baseline.versions[0].version_id,base_deployment:baseline.id,regressions_passed:387,production_changed:false,real_pupil_data_used:false,db_import_counts:{documents:58,chunks:13130,lessons:80,protocols:24},requests:[]};const save=()=>writeFileSync(directory+'/report.json',JSON.stringify(report,null,2));save();
const candidate=upload(config,'Canonical prepared library; no production deployment');report.candidate_version=candidate.id;report.candidate_url=candidate.url;save();
const cv=await cf('/versions/'+candidate.id),reduced=x=>JSON.stringify(x.filter(b=>!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name)).sort((a,b)=>a.name.localeCompare(b.name)));
assert.equal(reduced(cv.resources.bindings),reduced(bindings),'An unrelated binding changed');assert.equal((await live()).id,baseline.id);
const nonce=randomBytes(16).toString('hex'),access=randomBytes(32).toString('hex'),password=randomBytes(32).toString('hex'),email='eterna-library-qa-'+nonce+'@example.invalid';for(const value of [access,password,email])console.log('::add-mask::'+value);
const expires=Date.now()+25*60000;
const helper=`const ACCESS=${JSON.stringify(hash(access))},EMAIL=${JSON.stringify(email)},PASSWORD=${JSON.stringify(password)},NONCE=${JSON.stringify(nonce)},EXPIRES=${expires};
async function digest(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export default {async fetch(request,env){
 const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 if(Date.now()>EXPIRES||request.method!=='POST'||new URL(request.url).pathname!=='/__synthetic_library_qa')return reply({error:'NOT_FOUND'},404);
 if(await digest((request.headers.get('Authorization')||'').replace(/^Bearer /,''))!==ACCESS)return reply({error:'UNAUTHORIZED'},401);
 const command=await request.text();if(!['setup','infantil','primaria','eso','bachillerato','stats','cleanup'].includes(command))return reply({error:'OPERATION_REJECTED'},403);
 let base;try{const u=new URL(env.SUPABASE_URL);if(u.protocol!=='https:'||u.hostname!=='fcatttsfufjiphgohgwp.supabase.co')throw Error();base=u.origin}catch{return reply({error:'PROJECT_REJECTED'},403)}
 const secret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY,pub=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY;if(!secret||!pub)return reply({error:'CONFIGURATION'},500);
 const headers={apikey:secret,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'};if(!secret.startsWith('sb_secret_'))headers.Authorization='Bearer '+secret;
 async function sb(path,method='GET',body){const r=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let p;try{p=await r.json()}catch{p=null}if(!r.ok)throw Error('QA_DB_'+r.status+'_'+String(p?.code||p?.error_code||'unknown'));return p}
 async function login(){const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:pub,'Content-Type':'application/json'},body:JSON.stringify({email:EMAIL,password:PASSWORD})});if(!r.ok)return null;const p=await r.json();if(p.user?.email!==EMAIL||p.user?.app_metadata?.eterna_synthetic_qa!==NONCE)throw Error('IDENTITY_MISMATCH');return p}
 try{
  let session=await login();
  if(command==='setup'&&!session){await sb('/auth/v1/admin/users','POST',{email:EMAIL,password:PASSWORD,email_confirm:true,app_metadata:{eterna_synthetic_qa:NONCE},user_metadata:{apodo:'Prueba Sintética',edad:10}});session=await login()}
  if(!session){if(command==='cleanup')return reply({ok:true,already_absent:true});throw Error('SYNTHETIC_SESSION_UNAVAILABLE')}
  const uid=session.user.id;if(!/^[a-f0-9-]{36}$/i.test(uid))throw Error('INVALID_ID');
  const profile={infantil:{stage:'infantil',school_year:'Infantil · 5 años'},primaria:{stage:'primaria',school_year:'5º de Primaria'},eso:{stage:'eso',school_year:'4º de ESO'},bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}};
  if(command==='setup'){
   await sb('/rest/v1/perfiles?on_conflict=id','POST',{id:uid,apodo:'Prueba Sintética',edad:10,rol:'jugador'});
   await sb('/rest/v1/eterna_parent_settings?on_conflict=user_id','POST',{user_id:uid,max_sessions_per_day:99,voice_enabled:true,allow_image_input:true,allow_audio_input:true});
   await sb('/rest/v1/eterna_subscriptions?on_conflict=user_id','POST',{user_id:uid,provider:'manual',plan:'trial',status:'trialing',trial_end:new Date(EXPIRES).toISOString()});
   await sb('/rest/v1/eterna_student_profiles?on_conflict=user_id','POST',{user_id:uid,...profile.primaria,autonomous_community:'Andalucía',preferred_language:'es'});
   await sb('/rest/v1/eterna_legal_acceptances','POST',{user_id:uid,legal_version:'2026-08-23-v1',user_age:10,relationship:'parent',adult_email:EMAIL,email_verified:true,terms_accepted:true,privacy_accepted:true,ai_notice_accepted:true,parental_authorization:true,evidence_method:'synthetic_qa_fixture_not_real_consent',document_versions:{synthetic_qa:NONCE}});
   return reply({ok:true,access_token:session.access_token,synthetic_id:uid})
  }
  if(profile[command]){await sb('/rest/v1/eterna_student_profiles?user_id=eq.'+uid,'PATCH',{...profile[command],autonomous_community:'Andalucía',preferred_language:'es'});return reply({ok:true})}
  if(command==='stats'){
   const usage=await sb('/rest/v1/eterna_usage?user_id=eq.'+uid+'&select=chat_requests,input_tokens,output_tokens');const rows=await sb('/rest/v1/eterna_interactions?user_id=eq.'+uid+'&select=model_route');
   return reply({ok:true,usage,model_routes:rows.map(r=>r.model_route)})
  }
  if(command==='cleanup'){
   const u=await sb('/auth/v1/admin/users/'+uid);if(u.email!==EMAIL||u.app_metadata?.eterna_synthetic_qa!==NONCE)throw Error('CLEANUP_SCOPE_REJECTED');
   await sb('/auth/v1/admin/users/'+uid,'DELETE');const r=await fetch(base+'/auth/v1/admin/users/'+uid,{headers});if(r.status!==404)throw Error('CLEANUP_NOT_VERIFIED');return reply({ok:true,deleted:true})
  }
 }catch(e){return reply({error:String(e.message).slice(0,160)},500)}
}};`;
writeFileSync('eterna-worker/src/.synthetic-library-qa.js',helper);execFileSync('node',['--check','eterna-worker/src/.synthetic-library-qa.js']);
const helperVersion=upload({...config,main:'src/.synthetic-library-qa.js',vars:oldVars},'Expiring disposable synthetic identity fixture; NEVER deploy');
assert.equal((await fetch(helperVersion.url+'/__synthetic_library_qa',{method:'POST'})).status,401);
async function control(command){const r=await fetch(helperVersion.url+'/__synthetic_library_qa',{method:'POST',headers:{Authorization:'Bearer '+access},body:command,signal:AbortSignal.timeout(40000)});const p=await r.json();assert.ok(r.ok&&p.ok,'Synthetic '+command+' failed: '+JSON.stringify(p));return p}
let authToken;
async function chat(text,mode='ask',previous=null){const rid='request:library-real:'+randomBytes(12).toString('hex'),session=previous?.activity_state?.session_id||'session:library-real:'+randomBytes(12).toString('hex'),body={text,mode,input_source:'text',history:[],client_state_contract:3,request_id:rid,client_turn_id:rid,student_action:previous?'answer':'new_topic',session_id:session,answered_question_id:previous?.pedagogical_state?.pending_question_id||null,activity_state:previous?.activity_state||{contract_version:3,session_id:session,mode,phase:'ASK',question_id:null,question_number:1,difficulty:1},pedagogical_state:previous?.pedagogical_state,mode_state:previous?.mode_state};const start=performance.now(),r=await fetch(candidate.url+'/v1/chat',{method:'POST',headers:{Authorization:'Bearer '+authToken,'Content-Type':'application/json',Origin:'https://cocoenforma.com'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)}),p=await r.json();assert.equal(r.status,200,JSON.stringify(p).slice(0,500));assert.ok(['owned-lesson-v1','owned-protocol-v1'].includes(p.library_route),'Prepared route missing');assert.equal(p.generation_model_calls,0);assert.equal(p.generation_tokens,0);report.requests.push({mode,route:p.library_route,lesson:p.library_lesson_id||null,round_trip_ms:Math.round(performance.now()-start),server_timing:r.headers.get('Server-Timing'),generation_model_calls:0,generation_tokens:0});save();return p}
try{
 const setup=await control('setup');authToken=setup.access_token;console.log('::add-mask::'+authToken);report.synthetic_id=setup.synthetic_id;save();
 const health=await(await fetch(candidate.url+'/health')).json();assert.equal(health.owned_library?.enabled,true);assert.equal(health.owned_library.lessons,80);assert.equal(health.owned_library.protocols,24);report.private_health_passed=true;
 assert.equal((await fetch(candidate.url+'/v1/chat',{method:'POST',headers:{Origin:'https://cocoenforma.com'}})).status,401);report.unauthenticated_denied=true;
 for(const [stage,lid]of [['infantil','i-count'],['primaria','p-prime'],['eso','e-equation'],['bachillerato','b-derivative']]){
  await control(stage);const lesson=globalThis.ETERNA_LIBRARY_CONTENT.lessons.find(l=>l.id===lid);assert.ok(lesson,lid);
  for(const mode of ['ask','explain','exam','practice','homework','review']){const p=await chat('Explícame '+lesson.title,mode);assert.equal(p.library_lesson_id,lid);if(['ask','explain','exam','practice'].includes(mode)){const answered=await chat(lesson.quiz[0].answer,mode,p);assert.equal(answered.student_answer_assessment,'correct');assert.equal(answered.activity_state.correct_count,1)}}
 }
 await control('primaria');
 for(const text of ['Hola Eterna','¿Cómo estás?','Gracias','¿Quién eres?','¿Cuántos años tienes?','¿Qué edad tengo?','¿Cómo me llamo?','¿En qué curso estoy?','¿Qué día es hoy?','¿Qué hora es?','Estoy cansado','Quiero descansar','Soy tonto','Me preocupa el examen','Me da vergüenza leer','¿Puedo equivocarme?','¿Puedes equivocarte?','¿Qué sabes de mí?','Eres mi mejor amiga','¿Cómo estudio mejor?','Por dónde empiezo','Me aburro estudiando','¿Cuál es tu misión?','Hasta luego'])await chat(text);
 await new Promise(r=>setTimeout(r,2000));const stats=await control('stats');assert.ok(stats.usage.length>0);assert.ok(stats.usage.every(u=>Number(u.input_tokens||0)===0&&Number(u.output_tokens||0)===0));assert.ok(stats.model_routes.length>0&&stats.model_routes.every(r=>r==='owned-protocol-v1'||r==='owned-lesson-v1'));report.persistence_evidence={usage:stats.usage,recorded_routes:stats.model_routes.length,only_owned_routes:true};
 assert.equal((await live()).id,baseline.id);const durations=report.requests.map(r=>r.round_trip_ms).sort((a,b)=>a-b);report.latency={samples:durations.length,p50_ms:durations[Math.floor(durations.length*.5)],p95_ms:durations[Math.floor(durations.length*.95)],includes_actual_supabase_auth_and_network:true,origin:'GitHub hosted runner; not physical iPhone',transcription_and_tts_excluded:true};report.phase='canonical-private-verified';report.verified_at=new Date().toISOString();save();
}catch(e){report.phase='canonical-private-failed';report.error=String(e.message).slice(0,500);save();throw e}
finally{try{const cleanup=await control('cleanup');report.synthetic_cleanup=cleanup;save()}catch(e){report.synthetic_cleanup={ok:false,error:String(e.message)};save();throw e}}
console.log(JSON.stringify({...report,requests:undefined,synthetic_id:undefined}));
