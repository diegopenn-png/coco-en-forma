import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const dir='content-370-private-evidence',parts=[1,2,3,4].map(g=>JSON.parse(readFileSync(`${dir}/group-${g}/report.json`))),build=JSON.parse(readFileSync('content-370-build/report.json'));
for(const[i,r]of parts.entries()){
 assert.equal(r.phase,'canonical-private-verified');assert.equal(r.release,build.release_id);assert.equal(r.synthetic_group,i+1);assert.equal(r.regressions_passed,846);
 assert.equal(r.requests.length,[34,59,50,38][i]);assert.equal(r.new_lessons_tested.length,[10,20,18,12][i]);assert.equal(r.synthetic_cleanup.ok,true);assert.equal(r.synthetic_cleanup.deleted,true);
 assert.equal(r.production_changed,false);assert.equal(r.real_pupil_data_used,false);assert.equal(r.production_quota_unchanged,true);assert.equal(r.draft_content.lessons,370);assert.equal(r.draft_content.protocols,56);assert.equal(r.draft_content.hash_mismatches,0);
 for(const q of r.requests){assert.equal(q.generation_model_calls,0);assert.equal(q.generation_tokens,0)}
 assert.ok(r.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60);assert.equal(r.persistence_evidence.only_owned_routes,true);
 for(const key of ['base_version','base_deployment','base_code_etag','candidate_code_etag','source_sha256','runtime_sha256','source_commit'])assert.equal(r[key],parts[0][key]);assert.deepEqual(r.source_hashes,parts[0].source_hashes);
}
assert.equal(new Set(parts.map(p=>p.synthetic_id)).size,4);assert.equal(parts[1].nonrepeating_round_fix_preserved,true);
const tested=parts.flatMap(p=>p.new_lessons_tested);assert.deepEqual(tested.map(l=>l.lesson_id).sort(),[...build.added_ids].sort());
const requests=parts.flatMap((p,i)=>p.requests.map(q=>({...q,synthetic_group:i+1}))),duration=requests.map(q=>q.round_trip_ms).sort((a,b)=>a-b);assert.equal(requests.length,181);
const report={...parts[3],requests,synthetic_id:undefined,synthetic_group:undefined,new_lessons_tested:tested,synthetic_cleanup:{ok:true,deleted:true,identities:4},all_new_lessons_exercised:60,nonrepeating_round_fix_preserved:true,new_questions:180,lessons:370,questions:1110,protocols:56,
 group_evidence:parts.map(p=>({group:p.synthetic_group,requests:p.requests.length,lessons:p.new_lessons_tested.length,cleanup_verified:p.synthetic_cleanup.deleted,candidate_version:p.candidate_version,canonical_code_etag:p.candidate_code_etag,teaching_turns:p.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)})),
 persistence_evidence:{usage:parts.flatMap(p=>p.persistence_evidence.usage),only_owned_routes:true,recorded_routes:parts.reduce((n,p)=>n+p.persistence_evidence.recorded_routes,0)},
 latency:{samples:duration.length,p50_ms:duration[Math.floor(duration.length*.5)],p95_ms:duration[Math.floor(duration.length*.95)],max_ms:duration.at(-1),includes_actual_supabase_auth_and_network:true,physical_iPhone:false,transcription_and_tts_excluded:true},
 verified_at:new Date().toISOString(),human_teacher_reviewed:false,full_curriculum_complete:false};
writeFileSync(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({phase:report.phase,lessons:370,new_lessons:60,questions:1110,requests:181,generation_calls:0,identities_removed:4,old_round_fix_preserved:true,production_changed:false}));
