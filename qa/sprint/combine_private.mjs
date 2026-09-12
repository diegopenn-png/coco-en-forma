import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const base='sprint-private-evidence',reports=[1,2,3,4].map(g=>JSON.parse(readFileSync(`${base}/group-${g}/report.json`))),build=JSON.parse(readFileSync('sprint-build-evidence/report.json'));
const release='eterna-library-2026.09-v6-310-traceable-12c672';
for(const[i,r]of reports.entries()){
 assert.equal(r.phase,'canonical-private-verified');assert.equal(r.release,release);assert.equal(r.synthetic_group,i+1);assert.equal(r.regressions_passed,753);
 assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);assert.equal(r.production_changed,false);assert.equal(r.real_pupil_data_used,false);assert.equal(r.production_quota_unchanged,true);
 assert.equal(r.draft_content.lessons,310);assert.equal(r.draft_content.protocols,56);assert.equal(r.draft_content.hash_mismatches,0);
 assert.equal(r.procedural_rounds.length,i===3?8:12);assert.equal(r.factory_enabled,true);assert.equal(r.compass_enabled,true);
 assert.ok(r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 for(const key of ['base_version','base_deployment','base_code_etag','candidate_code_etag','source_sha256','runtime_sha256','source_commit'])assert.equal(r[key],reports[0][key],key);
 assert.deepEqual(r.source_hashes,reports[0].source_hashes);assert.equal(r.persistence_evidence.only_owned_routes,true);
}
assert.equal(new Set(reports.map(r=>r.synthetic_id)).size,4);
const rounds=reports.flatMap(r=>r.procedural_rounds);assert.equal(rounds.length,44);assert.equal(new Set(rounds.map(x=>x.family)).size,22);
for(const family of new Set(rounds.map(x=>x.family)))assert.deepEqual(rounds.filter(x=>x.family===family).map(x=>x.mode).sort(),['exam','practice']);
assert.equal(reports[0].compass_probe.ok,true);assert.equal(reports[0].compass_probe.real_database_rpc,true);assert.equal(reports[0].compass_probe.anonymous_denied,true);
const ui=JSON.parse(readFileSync('sprint-ui-evidence/report.json'));assert.equal(ui.scenarios,16);assert.equal(ui.stats.model_calls,0);assert.equal(ui.errors.length,0);
const requests=reports.flatMap((r,i)=>r.requests.map(x=>({...x,synthetic_group:i+1}))),duration=requests.map(x=>x.round_trip_ms).sort((a,b)=>a-b);
const report={...reports.at(-1),synthetic_id:undefined,synthetic_group:undefined,requests,procedural_rounds:rounds,synthetic_identities_used:4,synthetic_cleanup:{ok:true,deleted:true,identities:4},compass_probe:reports[0].compass_probe,
 group_evidence:reports.map(r=>({group:r.synthetic_group,requests:r.requests.length,recorded_teaching_turns:r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0),candidate_version:r.candidate_version,code_etag:r.candidate_code_etag,cleanup_verified:r.synthetic_cleanup.deleted})),
 persistence_evidence:{usage:reports.flatMap(r=>r.persistence_evidence.usage),recorded_routes:reports.reduce((n,r)=>n+r.persistence_evidence.recorded_routes,0),only_owned_routes:true},
 ui_scenarios_newly_tested:ui.scenarios,ui_network:'synthetic Supabase; actual client and Worker state; no physical iPhone',ui_requests:ui.stats.requests,
 generated_question_instances_independently_checked:build.generated_question_instances_independently_checked,
 latency:{samples:duration.length,p50_ms:duration[Math.floor(duration.length*.5)],p95_ms:duration[Math.floor(duration.length*.95)],max_ms:duration.at(-1),includes_actual_supabase_auth_and_network:true,origin:'GitHub runner, not physical iPhone',transcription_and_tts_excluded:true},
 verified_at:new Date().toISOString(),full_curriculum_complete:false,human_teacher_reviewed:false};
writeFileSync(`${base}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({phase:report.phase,requests:requests.length,families:22,modes:2,ui_scenarios:16,actual_source_rpc:true,identities_removed:4,production_changed:false}));
