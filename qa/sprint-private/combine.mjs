import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const root='sprint-private-evidence',reports=[1,2].map(g=>JSON.parse(readFileSync(`${root}/group-${g}/report.json`)));
const release='eterna-library-2026.09-v6-310-traceable-12c672';
for(const[i,r]of reports.entries()){
 assert.equal(r.phase,'canonical-private-verified');assert.equal(r.release,release);assert.equal(r.synthetic_group,i+1);
 assert.equal(r.requests.length,i===0?40:100);assert.equal(r.requests.filter(q=>q.route==='owned-lesson-v1').length,i===0?40:44);
 assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);assert.equal(r.production_changed,false);assert.equal(r.real_pupil_data_used,false);assert.equal(r.production_quota_unchanged,true);
 assert.equal(r.regressions_passed,753);assert.equal(r.draft_content.lessons,310);assert.equal(r.draft_content.protocols,56);assert.equal(r.draft_content.hash_mismatches,0);assert.ok(r.synthetic_id);assert.ok(r.candidate_code_etag);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 assert.equal(r.persistence_evidence.only_owned_routes,true);assert.equal(r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0),i===0?40:44);
 assert.equal(r.compass_probe.ok,true);assert.equal(r.compass_probe.lower_grade_filtered,true);assert.equal(r.compass_probe.invalid_terms_rejected,true);assert.equal(r.compass_probe.anonymous_denied,true);assert.equal(r.compass_probe.student_data_used,false);
}
const[a,b]=reports;assert.notEqual(a.synthetic_id,b.synthetic_id);
for(const key of ['base_version','base_deployment','base_code_etag','candidate_code_etag','source_sha256','runtime_sha256','source_commit'])assert.equal(a[key],b[key],key+' differs between groups');assert.deepEqual(a.source_hashes,b.source_hashes);
assert.equal(new Set(b.procedural_families_tested).size,22);assert.equal(b.requests.filter(q=>q.generated_exercise).length,44);
const requests=reports.flatMap((r,i)=>r.requests.map(q=>({...q,synthetic_group:i+1}))),times=requests.map(q=>q.round_trip_ms).sort((x,y)=>x-y);
assert.equal(requests.length,140);assert.equal(requests.filter(q=>q.route==='owned-protocol-v1').length,56);
const report={...b,requests,synthetic_id:undefined,synthetic_group:undefined,synthetic_identities_used:2,synthetic_cleanup:{ok:true,deleted:true,identities:2},production_quota_unchanged:true,
 procedural_families:22,curated_teaching_turns:40,generated_teaching_turns:44,protocol_turns:56,
 group_evidence:reports.map(r=>({group:r.synthetic_group,requests:r.requests.length,teaching_turns:r.requests.filter(q=>q.route==='owned-lesson-v1').length,canonical_version:r.candidate_version,canonical_code_etag:r.candidate_code_etag,cleanup_verified:r.synthetic_cleanup.deleted})),
 persistence_evidence:{usage:reports.flatMap(r=>r.persistence_evidence.usage),recorded_routes:reports.reduce((n,r)=>n+r.persistence_evidence.recorded_routes,0),only_owned_routes:true},
 latency:{samples:times.length,p50_ms:times[Math.floor(times.length*.5)],p95_ms:times[Math.floor(times.length*.95)],max_ms:times.at(-1),includes_actual_supabase_auth_and_network:true,origin:'GitHub hosted runner; not physical iPhone',transcription_and_tts_excluded:true},verified_at:new Date().toISOString()};
writeFileSync(`${root}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({phase:report.phase,requests:140,families:22,identities:2,cleanup_verified:true,quota_changes:false,generation_model_calls:0,production_changed:false,latency:report.latency}));
