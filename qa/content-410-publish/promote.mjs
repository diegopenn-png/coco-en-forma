// Promote only the immutable canonical version tested against actual authentication and Supabase.
// Never upload code here; never deploy a synthetic identity/import helper.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{createHash}from'node:crypto';
import{execFileSync}from'node:child_process';
import assert from'node:assert/strict';
const script='coco-eterna-v159',url='https://coco-eterna-v159.chatinmobiliario.workers.dev';
const release='eterna-library-2026.09-v8-410-consolidated-1c484e',oldRelease='eterna-library-2026.09-v7-370-content-c26c61c';
const expectedMain='679609154a891036d793f4ad656f3573ab07ed44',expectedParent='1c484e01e2e3f5cf67fc5ad4eeeb5374ac52f767';
const expectedBase='f69b654f-7a94-488f-9800-c0d5e935ae7b',expectedCandidate='c034c5d3-8fe8-4697-b589-1d2416ac4940';
const dir='content-410-production-evidence';mkdirSync(dir,{recursive:true});
const proof=JSON.parse(readFileSync('.verified/content-410-private/report.json')),build=JSON.parse(readFileSync('.verified/content-410-evidence/report.json'));
const hash=v=>createHash('sha256').update(v).digest('hex');
assert.equal(build.tested_commit,'bcad3f4d5a29a4326d687fd001eddc6bdb51e9ae');assert.equal(build.baseline_commit,expectedParent);assert.equal(build.release_id,release);
assert.equal(build.tests_passed,991);assert.equal(build.tests_failed,0);assert.equal(build.lessons,410);assert.equal(build.questions,1230);assert.equal(build.protocols,56);assert.equal(build.new_lessons,40);assert.equal(build.old_lesson_objects_preserved,370);assert.equal(build.old_question_ids_and_keys_preserved,1110);assert.equal(Object.keys(build.duplicate_drafts_not_activated).length,20);
assert.equal(proof.phase,'canonical-private-verified');assert.equal(proof.release,release);assert.equal(proof.base_version,expectedBase);assert.equal(proof.candidate_version,expectedCandidate);assert.equal(proof.base_deployment,'e9819b94-9ed4-4b36-b5b6-fec7732ab328');assert.equal(proof.regressions_passed,991);assert.equal(proof.requests.length,84);
assert.equal(proof.synthetic_cleanup.ok,true);assert.equal(proof.synthetic_cleanup.deleted,true);assert.equal(proof.synthetic_cleanup.identities,2);assert.equal(proof.synthetic_identities_used,2);
assert.equal(proof.new_lessons_checked.length,40);assert.deepEqual(proof.new_lessons_checked.map(x=>x.lesson_id),build.new_ids);assert.equal(new Set(build.new_ids).size,40);
assert.equal(proof.draft_content.lessons,410);assert.equal(proof.draft_content.questions,1230);assert.equal(proof.draft_content.protocols,56);assert.equal(proof.draft_content.hash_mismatches,0);
for(const q of proof.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
assert.equal(proof.production_changed,false);assert.equal(proof.real_pupil_data_used,false);assert.equal(proof.production_quota_unchanged,true);assert.equal(proof.previous_370_preserved,true);assert.equal(proof.procedural_factory_unchanged,true);
assert.equal(proof.unrelated_bindings_unchanged,true);assert.equal(proof.runtime_unchanged,true);
for(const[path,p]of Object.entries(build.blobs)){assert.equal(hash(readFileSync(path)),p.sha256,path);assert.deepEqual(proof.source_hashes[path],p,path)}
for(const[path,want]of Object.entries(build.preserved_sha256))assert.equal(hash(readFileSync(path)),want,path);
assert.equal(hash(readFileSync('eterna-worker/src/index.js')),'0325e9471f28f968c8425f854d0a7d3ed808e66bec6b00f4eb32593e8949208b');
assert.equal(hash(readFileSync('eterna-worker/src/library/procedural-v1.js')),'371f32609b1b2c3d4ba50ab4f67a487629f6cc536ced031a583e4d0ca6e46d98');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse',expectedMain+'^'),expectedParent);
assert.equal(git('rev-parse','HEAD:eterna-worker/src'),git('rev-parse',expectedMain+':eterna-worker/src'));
const allowed=new Set(['eterna-worker/LIBRARY_CONTENT_V8.md','eterna-worker/src/index.js','eterna-worker/src/library/content-v1.js','eterna-worker/src/library/runtime-v1.js','eterna-worker/test/library-first.test.mjs','eterna-worker/test/sprint-harness.mjs','eterna-worker/test/content-370.test.mjs','eterna-worker/test/content-410.test.mjs','qa/library/lessons-v1.json','qa/content-410/manifest.json','qa/content-410/added-lessons.json','qa/content-410/review-ledger.json']);
const changed=git('diff','--name-only',expectedParent,expectedMain).split('\n');assert.equal(changed.length,12);for(const p of changed)assert.ok(allowed.has(p),'Unrelated source change '+p);
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,''),account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
async function mainHead(){const r=await fetch('https://api.github.com/repos/diegopenn-png/coco-en-forma/git/ref/heads/main',{headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(25000)});assert.equal(r.status,200);return(await r.json()).object.sha}
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const p=await r.json();assert.ok(r.ok&&p.success!==false,'Cloudflare read failed '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100,'Expected one production version');return d}
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const fingerprint=v=>hash(JSON.stringify(canon(v))),reduced=v=>v.resources.bindings.filter(b=>b.name!=='ETERNA_LIBRARY_RELEASE').sort((a,b)=>a.name.localeCompare(b.name));
const baseline=await live();assert.equal(baseline.versions[0].version_id,expectedBase,'Concurrent production change');assert.equal(baseline.id,proof.base_deployment);assert.equal(await mainHead(),expectedMain);
const old=await cf('/versions/'+expectedBase),candidate=await cf('/versions/'+expectedCandidate);assert.equal(old.resources.script.etag,proof.base_code_etag);assert.equal(candidate.resources.script.etag,proof.candidate_code_etag);assert.equal(proof.candidate_code_etag,'d49175b4324e4032041d4a2ef190e60ac9067a42d73a67f8addacebeb1327ee1');
assert.equal(fingerprint(reduced(candidate)),fingerprint(reduced(old)),'Only library release may change');assert.equal(fingerprint(candidate.resources.script_runtime),fingerprint(old.resources.script_runtime),'Runtime changed');
const vars=Object.fromEntries(candidate.resources.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));assert.equal(vars.ETERNA_LIBRARY_RELEASE,release);assert.equal(vars.ENABLE_ETERNA_LIBRARY,'true');assert.equal(vars.ETERNA_EXERCISE_FACTORY,'v1');assert.equal(vars.ETERNA_CURRICULAR_COMPASS,'v1');
async function health(u,isNew){const r=await fetch(u+'/health',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);const h=await r.json();assert.equal(h.ok,true);assert.equal(h.owned_library.enabled,true);assert.equal(h.owned_library.release,isNew?release:oldRelease);assert.equal(h.owned_library.lessons,isNew?410:370);assert.equal(h.owned_library.protocols,56);assert.equal(h.owned_library.curriculum_complete,false);assert.equal(h.exercise_factory.enabled,true);assert.equal(h.exercise_factory.families,22);assert.equal(h.curricular_compass.enabled,true);assert.equal(h.curricular_compass.source_elements,9033);return h}
const configuration=h=>fingerprint({provider:h.ai_provider,models:h.model_configuration,features:h.features,supabase:h.supabase_configured,stripe:h.stripe_configured,openai:h.openai_configured,cloudflare:h.cloudflare_ai_configured});
async function denied(u){for(const path of ['/v1/chat','/v1/chat-job','/v1/transcribe']){const r=await fetch(u+path,{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,401,path)}}
assert.equal(proof.candidate_url,'https://c034c5d3-coco-eterna-v159.chatinmobiliario.workers.dev');
const before=await health(url,false),preview=await health(proof.candidate_url,true);assert.equal(configuration(before),configuration(preview));await denied(url);await denied(proof.candidate_url);
for(const b of candidate.resources.bindings)assert.ok(['plain_text','secret_text','ai'].includes(b.type),'Unmapped binding');
const rt=candidate.resources.script_runtime||{},ai=candidate.resources.bindings.find(b=>b.type==='ai'),config={name:script,main:'src/index.js',compatibility_date:rt.compatibility_date,compatibility_flags:rt.compatibility_flags||[],vars};if(ai)config.ai={binding:ai.name};if(rt.limits?.cpu_ms)config.limits={cpu_ms:rt.limits.cpu_ms};
writeFileSync('eterna-worker/.content410-publish.json',JSON.stringify(config));
const report={phase:'pre-promotion',production_commit:expectedMain,previous_production_commit:expectedParent,release,base_version:expectedBase,candidate_version:expectedCandidate,source_sha256:proof.source_sha256,runtime_sha256:proof.runtime_sha256,content_sha256:build.blobs['eterna-worker/src/library/content-v1.js'].sha256,canonical_etag:proof.candidate_code_etag,lessons:410,new_lessons:40,questions:1230,new_questions:120,protocols:56,procedural_families:22,counts_by_stage:build.counts_by_stage,counts_added:build.counts_added,overlapping_drafts_excluded:20,tests_passed:991,tests_failed:0,actual_private_requests:84,all_new_lessons_exercised:40,private_zero_generation_tokens:true,private_latency:proof.latency,synthetic_identities_deleted:2,old_lesson_objects_preserved:370,old_question_ids_and_keys_preserved:1110,no_repeat_round_fix_preserved:true,only_configuration_change:'ETERNA_LIBRARY_RELEASE',microphone_unchanged:true,frontend_unchanged:true,models_unchanged:true,quotas_unchanged:true,runtime_unchanged:true,source_change_paths:changed,ui_scenarios_newly_tested:0,physical_iphone_tested:false,production_changed:false,full_curriculum_complete:false,human_teacher_reviewed:false};
const save=()=>writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));save();
function deploy(id,message){try{execFileSync('npx',['wrangler','versions','deploy',id+'@100%','--name',script,'--config','.content410-publish.json','--message',message,'--yes'],{cwd:'eterna-worker',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024})}catch(e){throw Error('Controlled promotion failed '+e.status+'; confidential output omitted')}}
assert.equal((await live()).id,baseline.id);assert.equal(await mainHead(),expectedMain);let attempted=false;
try{
 attempted=true;deploy(expectedCandidate,'Activate forty verified non-duplicate lessons; preserve all 370 prior lessons, voice, rounds and settings');let current,passed=false;
 for(let i=0;i<6;i++){
  current=await live();const currentVersion=current.versions[0].version_id;assert.ok([expectedBase,expectedCandidate].includes(currentVersion),'Concurrent production deployment');
  if(currentVersion===expectedCandidate){try{const h=await health(url,true);assert.equal(configuration(h),configuration(before));await denied(url);report.live_features={owned_library:h.owned_library,exercise_factory:h.exercise_factory,curricular_compass:h.curricular_compass};passed=true;break}catch(e){report.last_health_error=String(e.message).slice(0,200)}}
  await new Promise(r=>setTimeout(r,5000));
 }
 assert.ok(passed,'Live verification failed');assert.equal(await mainHead(),expectedMain);assert.equal((await live()).id,current.id,'Deployment changed after verification');
 report.phase='production-verified';report.production_changed=true;report.production_version=expectedCandidate;report.deployment_id=current.id;report.verified_at=new Date().toISOString();save();console.log(JSON.stringify(report));
}catch(e){
 report.phase='not-ready';report.error=String(e.message).slice(0,300);
 if(attempted){const d=await live();if(d.versions[0].version_id===expectedCandidate){deploy(expectedBase,'Rollback failed 410-lesson content-only activation');report.rollback_verified=(await live()).versions[0].version_id===expectedBase}else report.rollback_skipped_concurrent_change=true}
 save();throw e;
}
