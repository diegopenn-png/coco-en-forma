// Read-only reconciliation after the intended exact-code production promotion happened during extra QA.
// Never rewrite a failed test record as passed, never deploy, never change authentication or pupil data.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const dir='sprint-postpublication-evidence';mkdirSync(dir,{recursive:true});
const expectedMain='86ddb64a64554f83408dfb2afeccf45dd486c455',script='coco-eterna-v159',release='eterna-library-2026.09-v6-310-traceable-12c672';
const publication=JSON.parse(readFileSync('.publication/report.json'));
const groups=[1,2,3,4].map(i=>JSON.parse(readFileSync(`.integration/sprint-private-evidence/group-${i}/report.json`)));
const ui=JSON.parse(readFileSync('.integration/sprint-ui-evidence/report.json'));
assert.equal(publication.phase,'production-verified');assert.equal(publication.production_commit,expectedMain);assert.equal(publication.release,release);assert.equal(publication.tests_passed,753);assert.equal(publication.private_requests,140);assert.equal(publication.private_zero_generation_tokens,true);
assert.equal(publication.production_version,'9480a578-cca5-4412-bbfd-fbfbf27c11c1');assert.equal(publication.deployment_id,'a18a6334-0248-46cf-93c2-105bc84c8540');
assert.equal(ui.scenarios,16);assert.equal(ui.stats.requests,64);assert.equal(ui.stats.model_calls,0);assert.equal(ui.errors.length,0);
for(const [i,r]of groups.entries()){
 assert.equal(r.phase,i<3?'canonical-private-verified':'canonical-private-failed');assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);assert.equal(r.real_pupil_data_used,false);
 assert.equal(r.requests.length,i<3?51:95);assert.equal(r.procedural_rounds.length,i<3?12:8);assert.equal(r.regressions_passed,753);
 assert.equal(r.source_sha256,publication.source_sha256);assert.equal(r.candidate_code_etag,publication.canonical_etag);assert.equal(r.runtime_unchanged,true);assert.equal(r.unrelated_bindings_unchanged,true);assert.equal(r.production_quota_unchanged,true);
 assert.equal(r.draft_content.lessons,310);assert.equal(r.draft_content.hash_mismatches,0);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 for(const t of r.procedural_rounds){assert.equal(t.questions_completed,3);assert.equal(t.single_pending_question,true);assert.equal(t.correct_count_verified,true);assert.equal(t.zero_generation,true)}
 assert.ok(r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60);
}
assert.equal(new Set(groups.map(r=>r.synthetic_id)).size,4);
const halted=groups[3];assert.ok(halted.error.includes(publication.deployment_id));assert.ok(halted.error.includes(halted.base_deployment));assert.ok(!halted.error.includes('Prepared route missing'));
const rounds=groups.flatMap(r=>r.procedural_rounds);assert.equal(rounds.length,44);assert.equal(new Set(rounds.map(x=>x.family)).size,22);for(const f of new Set(rounds.map(x=>x.family)))assert.deepEqual(rounds.filter(x=>x.family===f).map(x=>x.mode).sort(),['exam','practice']);
assert.equal(groups[0].compass_probe.real_database_rpc,true);assert.equal(groups[0].compass_probe.anonymous_denied,true);assert.equal(groups[0].compass_probe.course_filter_checked,true);
const hash=v=>createHash('sha256').update(v).digest('hex');
for(const[path,p]of Object.entries(groups[0].source_hashes))if(path.startsWith('eterna-worker/src/'))assert.equal(hash(readFileSync(path)),p.sha256,path);
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,''),account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});const p=await r.json();assert.ok(r.ok&&p.success!==false,'Cloudflare read failed');return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100);return d}
async function head(){const r=await fetch('https://api.github.com/repos/diegopenn-png/coco-en-forma/git/ref/heads/main',{headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);return(await r.json()).object.sha}
const deployment=await live();assert.equal(deployment.id,publication.deployment_id);assert.equal(deployment.versions[0].version_id,publication.production_version);assert.equal(await head(),expectedMain);
const version=await cf('/versions/'+publication.production_version);assert.equal(version.resources.script.etag,publication.canonical_etag);
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const fingerprint=v=>hash(JSON.stringify(canon(v)));
const sortedBindings=v=>[...v.resources.bindings].sort((a,b)=>a.name.localeCompare(b.name));
for(const group of groups){const candidate=await cf('/versions/'+group.candidate_version);assert.equal(candidate.resources.script.etag,version.resources.script.etag);assert.equal(fingerprint(sortedBindings(candidate)),fingerprint(sortedBindings(version)));assert.equal(fingerprint(candidate.resources.script_runtime),fingerprint(version.resources.script_runtime))}
const vars=Object.fromEntries(version.resources.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));assert.equal(vars.ETERNA_LIBRARY_RELEASE,release);assert.equal(vars.ETERNA_EXERCISE_FACTORY,'v1');assert.equal(vars.ETERNA_CURRICULAR_COMPASS,'v1');
const publicURL='https://coco-eterna-v159.chatinmobiliario.workers.dev';
const healthResponse=await fetch(publicURL+'/health',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(healthResponse.status,200);const health=await healthResponse.json();
assert.equal(health.ok,true);assert.equal(health.owned_library.enabled,true);assert.equal(health.owned_library.lessons,310);assert.equal(health.owned_library.protocols,56);assert.equal(health.owned_library.release,release);assert.equal(health.exercise_factory.enabled,true);assert.equal(health.exercise_factory.families,22);assert.equal(health.curricular_compass.enabled,true);assert.equal(health.curricular_compass.source_elements,9033);
const unauth={};for(const path of ['/v1/chat','/v1/chat-job','/v1/transcribe']){const r=await fetch(publicURL+path,{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,401,path);unauth[path]=r.status}
assert.equal((await live()).id,deployment.id);assert.equal(await head(),expectedMain);
const requests=groups.flatMap(r=>r.requests),times=requests.map(r=>r.round_trip_ms).sort((a,b)=>a-b);
const report={phase:'published-version-and-extra-integration-reconciled',production_commit:expectedMain,production_version:publication.production_version,deployment_id:deployment.id,release,source_sha256:publication.source_sha256,canonical_etag:version.resources.script.etag,verified_at:new Date().toISOString(),writes_performed:false,
 official_publication_run:34683308528,official_publication_success:true,accepted_private_release_requests:140,accepted_private_release_latency:publication.private_latency,
 additional_integration_run:34683137471,additional_run_original_conclusion:'failure_due_to_expected_deployment_change',original_failure_not_relabelled:true,concurrent_change_explained_by_exact_tested_promotion:true,
 extra_completed_response_checks:requests.length,extra_completed_three_question_rounds:44,families_in_both_modes:22,extra_response_generation_calls:0,extra_response_generation_tokens:0,extra_private_latency:{samples:times.length,p50_ms:times[Math.floor(times.length*.5)],p95_ms:times[Math.floor(times.length*.95)],max_ms:times.at(-1),origin:'GitHub runner, not physical iPhone',transcription_and_tts_excluded:true},extra_synthetic_identities_removed:4,
 ui:{scenarios:16,requests:64,model_calls:0,actual_client_and_worker_state:true,synthetic_database:true,physical_iPhone:false,microphone_tested:false},
 exact_compiled_code_and_bindings_match:true,real_compass_rpc_verified:true,unauthenticated_routes_denied:unauth,
 live_features:{owned_library:health.owned_library,exercise_factory:health.exercise_factory,curricular_compass:health.curricular_compass},
 full_curriculum_complete:false,human_teacher_reviewed:false,microphone_changes:false,frontend_changes:false,model_changes:false,quota_changes:false};
writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
