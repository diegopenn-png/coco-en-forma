// One-off controlled import. No child rows, no arbitrary SQL, no production deployment.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{createHash,randomBytes}from'node:crypto';
import{execFileSync}from'node:child_process';
import assert from'node:assert/strict';
import '../../eterna-worker/src/library/content-v1.js';
import '../../eterna-worker/src/library/runtime-v1.js';
const release='eterna-library-2026.09-v1',script='coco-eterna-v159',out='library-stage-evidence';mkdirSync(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex');
assert.equal(hash(readFileSync('eterna-worker/src/index.js')),'92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb');
const report={phase:'prepared',release,production_changed:false,child_data_accessed:false};const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));save();
const docs=JSON.parse(readFileSync('.official-library/documents.json')),chunks=readFileSync('.official-library/chunks.jsonl','utf8').trim().split('\n').map(JSON.parse),collection=JSON.parse(readFileSync('.official-library/collection-report.json'));
assert.equal(docs.length,58);assert.equal(chunks.length,13130);assert.equal(collection.national_complete_texts,4);
for(const d of docs){assert.equal(d.release_id,release);assert.equal(hash(d.text_body),d.content_sha256);assert.equal(d.review_status,d.jurisdiction==='ES-STATE'?'source_checked':'quarantined');if(['ES-CT','ES-VC','ES-IB','ES-GA','ES-PV'].includes(d.jurisdiction))d.language='und';}
for(const c of chunks){assert.equal(c.release_id,release);assert.equal(hash(c.body),c.content_sha256);assert.ok(c.body.length<=16000);}
const lessons=globalThis.ETERNA_LIBRARY_CONTENT.lessons.map(l=>({lesson_id:release+':'+l.id,release_id:release,stage:l.stage,subject:l.subject,title:l.title,school_years:l.school_years,aliases:l.aliases,review_status:'editorial_checked',payload:l,content_sha256:hash(JSON.stringify(l))}));
const protocols=globalThis.EternaOwnedLibrary.protocols.map(p=>{const payload={...p,implementation:'eterna-worker/src/library/runtime-v1.js',implementation_sha256:hash(readFileSync('eterna-worker/src/library/runtime-v1.js')),context_sensitive:true,generated_live_data:['date','time','student_age','student_name','student_course'].includes(p.id),sample_response:globalThis.EternaOwnedLibrary.cordial(p.id,{now:new Date('2026-09-12T10:00:00Z')}),sample_is_fixture_not_live_answer:true};return{protocol_id:release+':'+p.id,release_id:release,payload,content_sha256:hash(JSON.stringify(payload))}});
const tables={eterna_library_documents:docs,eterna_library_chunks:chunks,eterna_library_lessons:lessons,eterna_library_protocols:protocols};
const batches=[];
for(const[table,rows]of Object.entries(tables)){
 let current=[],bytes=0;
 for(const row of rows){const size=Buffer.byteLength(JSON.stringify(row));if(current.length&&(bytes+size>500000||current.length>=80)){batches.push(JSON.stringify({table,rows:current}));current=[];bytes=0}current.push(row);bytes+=size;}
 if(current.length)batches.push(JSON.stringify({table,rows:current}));
}
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,''),account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const p=await r.json();if(!r.ok||p.success===false)throw Error('Cloudflare read failed '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100);return d}
const baseline=await live(),version=await cf('/versions/'+baseline.versions[0].version_id),bindings=version.resources.bindings;report.production_version=baseline.versions[0].version_id;report.production_deployment=baseline.id;save();
const vars=Object.fromEntries(bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
assert.ok(String(vars.SUPABASE_URL||'').includes('fcatttsfufjiphgohgwp'));
const access=randomBytes(32).toString('hex');console.log('::add-mask::'+access);
const expires=Date.now()+25*60000,probeBody=JSON.stringify({probe:'synthetic-library-only'}),allowed=[probeBody,...batches].map(hash);
const generated=`import './library/content-v1.js';\nimport './library/runtime-v1.js';\nconst ALLOWED=new Set(${JSON.stringify(allowed)}),TABLES=new Set(${JSON.stringify(Object.keys(tables))});
async function digest(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export default{async fetch(request,env){
 const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 if(Date.now()>${expires}||request.method!=='POST'||new URL(request.url).pathname!=='/__library_stage')return reply({error:'NOT_FOUND'},404);
 if(await digest((request.headers.get('Authorization')||'').replace(/^Bearer /,''))!==${JSON.stringify(hash(access))})return reply({error:'UNAUTHORIZED'},401);
 const raw=await request.text();if(raw.length>14000000||!ALLOWED.has(await digest(raw)))return reply({error:'PAYLOAD_NOT_ALLOWED'},403);
 const data=JSON.parse(raw);
 if(data.probe){
   const l=globalThis.EternaOwnedLibrary;let cases=0;const durations=[];
   for(const lesson of globalThis.ETERNA_LIBRARY_CONTENT.lessons)for(const mode of ['homework','ask','review','explain','exam','practice']){const start=performance.now(),r=l.decision({text:'Explícame '+lesson.title,profile:{school_year:lesson.school_years[0]},mode});durations.push(performance.now()-start);if(!r||r.lesson.id!==lesson.id||r.model_calls!==0)throw Error('Private compiled library test failed');cases++}
   durations.sort((a,b)=>a-b);return reply({ok:true,cases,model_calls:0,generation_tokens:0,compute_p95_ms:durations[Math.floor(durations.length*.95)],network_included:false,synthetic_only:true})
 }
 if(!TABLES.has(data.table)||!Array.isArray(data.rows)||data.rows.some(r=>r.release_id!==${JSON.stringify(release)}))return reply({error:'SCOPE_REJECTED'},403);
 const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;if(!key)return reply({error:'CONFIGURATION'},500);
 const headers={apikey:key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'};if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
 const base=env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/';
 const gate=await fetch(base+'eterna_library_releases?release_id=eq.${release}&select=status',{headers});const state=await gate.json();if(!gate.ok||state.length!==1||state[0].status!=='draft')return reply({error:'RELEASE_NOT_DRAFT'},409);
 const r=await fetch(base+data.table,{method:'POST',headers,body:JSON.stringify(data.rows)});
 if(!r.ok){const error=await r.json().catch(()=>({}));return reply({error:'IMPORT_FAILED',http_status:r.status,code:error.code||null},502)}
 return reply({ok:true,table:data.table,rows:data.rows.length})
}};`;
writeFileSync('eterna-worker/src/.library-stage.js',generated);
const runtime=version.resources.script_runtime||{},config={name:script,main:'src/.library-stage.js',compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags||[],vars};const ai=bindings.find(b=>b.type==='ai');if(ai)config.ai={binding:ai.name};if(runtime.limits?.cpu_ms)config.limits={cpu_ms:runtime.limits.cpu_ms};
writeFileSync('eterna-worker/.library-stage.json',JSON.stringify(config));
let stdout;
try{stdout=execFileSync('npx',['wrangler','versions','upload','--config','.library-stage.json','--keep-vars','--message','Expiring hash-allowlisted public curriculum import only; NEVER deploy'],{cwd:'eterna-worker',encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'}})}catch(e){throw Error('Private upload failed '+e.status+'; confidential binding output omitted')}
const url=stdout.match(/Version Preview URL:\s*(https:\/\/[^\s]+)/)?.[1];assert.ok(url&&/^https:\/\/[a-f0-9-]+-coco-eterna-v159\.chatinmobiliario\.workers\.dev$/.test(url));assert.equal((await live()).id,baseline.id);
assert.equal((await fetch(url+'/__library_stage',{method:'POST'})).status,401);
async function post(body){let last;for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(url+'/__library_stage',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(60000)});const p=await r.json();if(!r.ok||!p.ok)throw Error(JSON.stringify(p));return p}catch(e){last=e;await new Promise(r=>setTimeout(r,1500))}}throw last}
report.compiled_runtime_probe=await post(probeBody);save();console.log('Private compiled runtime: '+report.compiled_runtime_probe.cases+' cases, zero model calls');
let completed=0;report.imported={};
try{
 for(const body of batches){const p=await post(body);completed++;report.imported[p.table]=(report.imported[p.table]||0)+p.rows;report.completed_batches=completed;save();if(completed%25===0)console.log('Imported batches '+completed+'/'+batches.length)}
 assert.equal((await live()).id,baseline.id);report.phase='draft-import-complete';report.production_unchanged=true;report.regional_quarantined=54;report.failed_sources=collection.failed_sources.length;report.verified_at=new Date().toISOString();save();console.log(JSON.stringify(report));
}catch(e){report.phase='draft-import-incomplete';report.error=String(e.message).slice(0,400);save();throw e}
