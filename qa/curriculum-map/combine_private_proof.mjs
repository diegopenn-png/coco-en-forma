// Combine two fully cleaned-up synthetic sessions. Never treat a partial run as passing.
import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const root='traceable-private-evidence',reports=[1,2].map(g=>JSON.parse(readFileSync(`${root}/group-${g}/report.json`)));
const release='eterna-library-2026.09-v6-310-traceable-12c672';
for(const[i,r]of reports.entries()){
 assert.equal(r.phase,'canonical-private-verified');assert.equal(r.release,release);assert.equal(r.synthetic_group,i+1);
 assert.equal(r.requests.length,i===0?40:96);assert.equal(r.requests.filter(q=>q.route==='owned-lesson-v1').length,40);
 assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);
 assert.equal(r.production_changed,false);assert.equal(r.real_pupil_data_used,false);assert.equal(r.production_quota_unchanged,true);
 assert.equal(r.regressions_passed,685);assert.equal(r.draft_content.lessons,310);assert.equal(r.draft_content.protocols,56);assert.equal(r.draft_content.hash_mismatches,0);
 assert.ok(r.synthetic_id);assert.ok(r.candidate_code_etag);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 assert.equal(r.persistence_evidence.only_owned_routes,true);
 const used=r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0);
 assert.equal(used,40,'Each independent identity must record only its 40 teaching turns');
}
const[a,b]=reports;assert.notEqual(a.synthetic_id,b.synthetic_id,'Separate identities required, not resetting one account quota');
for(const key of ['base_version','base_deployment','base_code_etag','candidate_code_etag','source_sha256','runtime_sha256','source_commit'])assert.equal(a[key],b[key],key+' changed between groups');
assert.deepEqual(a.source_hashes,b.source_hashes);
const requests=reports.flatMap((r,i)=>r.requests.map(q=>({...q,synthetic_group:i+1})));
assert.equal(requests.length,136);
const expected=['i-full','p-lcm','e-app-permissions','b-stage-directions','b-ecosystem-matter','b-compound-meter','b-affine-cost','b-art-project'];
for(const lesson of expected){const rows=requests.filter(q=>q.lesson===lesson);assert.equal(rows.length,10,lesson);assert.deepEqual([...new Set(rows.map(q=>q.mode))].sort(),['ask','exam','explain','homework','practice','review'])}
assert.equal(requests.filter(q=>q.route==='owned-protocol-v1').length,56);
const durations=requests.map(q=>q.round_trip_ms).sort((x,y)=>x-y);
const report={...b,requests,synthetic_id:undefined,synthetic_group:undefined,
 synthetic_identities_used:2,synthetic_cleanup:{ok:true,deleted:true,identities:2},
 per_identity_lesson_turn_budget:40,production_quota_unchanged:true,new_subject_supports_exercised:6,
 group_evidence:reports.map(r=>({group:r.synthetic_group,requests:r.requests.length,teaching_turns:40,canonical_version:r.candidate_version,canonical_code_etag:r.candidate_code_etag,cleanup_verified:r.synthetic_cleanup.deleted})),
 persistence_evidence:{usage:reports.flatMap(r=>r.persistence_evidence.usage),recorded_routes:reports.reduce((n,r)=>n+r.persistence_evidence.recorded_routes,0),only_owned_routes:true},
 latency:{samples:durations.length,p50_ms:durations[Math.floor(durations.length*.5)],p95_ms:durations[Math.floor(durations.length*.95)],max_ms:durations.at(-1),includes_actual_supabase_auth_and_network:true,origin:'GitHub hosted runner; not physical iPhone',transcription_and_tts_excluded:true},
 verified_at:new Date().toISOString()};
writeFileSync(`${root}/report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:report.phase,requests:136,teaching_turns:80,protocol_turns:56,identities:2,cleanup_verified:true,quota_changes:false,model_calls:0,production_changed:false}));
