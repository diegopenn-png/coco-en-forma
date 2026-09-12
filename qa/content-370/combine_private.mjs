import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const base='content-370-private',build=JSON.parse(readFileSync('content-370-evidence/report.json')),reports=[1,2,3].map(g=>JSON.parse(readFileSync(`${base}/group-${g}/report.json`)));
for(const[i,r]of reports.entries()){
 assert.equal(r.phase,'canonical-private-verified');assert.equal(r.synthetic_group,i+1);assert.equal(r.release,build.release_id);assert.equal(r.regressions_passed,build.tests_passed);
 assert.equal(r.requests.length,42);assert.equal(r.new_lessons_checked.length,20);assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);
 assert.equal(r.production_changed,false);assert.equal(r.real_pupil_data_used,false);assert.equal(r.production_quota_unchanged,true);assert.equal(r.unrelated_bindings_unchanged,true);assert.equal(r.runtime_unchanged,true);
 assert.equal(r.draft_content.lessons,370);assert.equal(r.draft_content.protocols,56);assert.equal(r.draft_content.hash_mismatches,0);
 assert.ok(r.persistence_evidence.usage.length);assert.ok(r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60);assert.equal(r.persistence_evidence.only_owned_routes,true);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 for(const key of ['base_version','base_deployment','base_code_etag','candidate_code_etag','source_sha256','runtime_sha256','source_commit'])assert.equal(r[key],reports[0][key],key);
 assert.deepEqual(r.source_hashes,reports[0].source_hashes);
}
assert.equal(new Set(reports.map(r=>r.synthetic_id)).size,3);
const checked=reports.flatMap(r=>r.new_lessons_checked);assert.equal(checked.length,60);assert.deepEqual(checked.map(x=>x.lesson_id),build.new_ids);assert.equal(new Set(checked.map(x=>x.lesson_id)).size,60);
const requests=reports.flatMap((r,i)=>r.requests.map(q=>({...q,synthetic_group:i+1}))),times=requests.map(q=>q.round_trip_ms).sort((a,b)=>a-b);
const report={...reports.at(-1),requests,new_lessons_checked:checked,synthetic_id:undefined,synthetic_group:undefined,
 synthetic_identities_used:3,synthetic_cleanup:{ok:true,deleted:true,identities:3},
 group_evidence:reports.map(r=>({group:r.synthetic_group,requests:r.requests.length,candidate_version:r.candidate_version,cleanup_verified:r.synthetic_cleanup.deleted})),
 latency:{samples:times.length,p50_ms:times[Math.floor(times.length*.5)],p95_ms:times[Math.floor(times.length*.95)],max_ms:times.at(-1),includes_actual_supabase_auth_and_network:true,origin:'GitHub runner, not physical iPhone',transcription_and_tts_excluded:true},
 new_lessons:60,new_questions:180,previous_310_preserved:true,procedural_factory_unchanged:true,full_curriculum_complete:false,human_teacher_reviewed:false,verified_at:new Date().toISOString()};
assert.equal(requests.length,126);writeFileSync(`${base}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({phase:report.phase,lessons:370,new_lessons:60,requests:126,model_calls:0,synthetic_identities_deleted:3,production_changed:false}));
