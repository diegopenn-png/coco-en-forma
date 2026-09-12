from pathlib import Path
import hashlib
p=Path('.qa-combined/qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'curriculum-traceability-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v6-310-traceable-12c672' and proof['lessons']==310 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==685"
assert a in s;s=s.replace(a,b)
s=s.replace("directory='combined-private-evidence'","directory='traceable-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'ce846fe8-2f9a-4c4e-ba72-397dcc14e2db'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:310,protocols:56,questions:930').replace('health.owned_library.lessons,217','health.owned_library.lessons,310').replace('lessons.length!==217','lessons.length!==310').replace('lessons:217,questions:651,protocols:56','lessons:310,questions:930,protocols:56')
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
assert "release='eterna-library-2026.09-v6-310-traceable-12c672'" in js
assert "'ce846fe8-2f9a-4c4e-ba72-397dcc14e2db'" in js
assert 'regressions_passed:685' in js and 'lessons:310' in js
# A single trial identity is capped at 60 teaching turns. Do not increase or reset
# production quotas: use two disposable identities with 40 teaching turns each.
a="const script='coco-eterna-v159'";assert js.count(a)==1
js=js.replace(a,"const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2].includes(QA_GROUP),'ETERNA_QA_GROUP must be 1 or 2');\n"+a)
a="directory='traceable-private-evidence'";assert js.count(a)==1
js=js.replace(a,"directory='traceable-private-evidence/group-'+QA_GROUP")
assert js.count('report.ui_scenarios=42;')==1
js=js.replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.previous_ui_baseline_scenarios=42;report.human_teacher_reviewed=false;report.synthetic_group=QA_GROUP;report.per_identity_lesson_turn_budget=40;report.production_quota_unchanged=true;')
a="'bachillerato','stats','cleanup','stage_content'";assert js.count(a)==1;js=js.replace(a,"'bachillerato','bachillerato1','stats','cleanup','stage_content'")
a="bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}";assert js.count(a)==1;js=js.replace(a,a+",bachillerato1:{stage:'bachillerato',school_year:'1º de Bachillerato'}")
a="[['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']]";assert js.count(a)==1
plan="[['infantil','i-full'],['primaria','p-lcm'],['eso','e-app-permissions'],['bachillerato','b-stage-directions'],['bachillerato1','b-ecosystem-matter'],['bachillerato1','b-compound-meter'],['bachillerato1','b-affine-cost'],['bachillerato1','b-art-project']]"
js=js.replace(a,plan+".slice(QA_GROUP===1?0:4,QA_GROUP===1?4:8)")
a='for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);';assert js.count(a)==1
js=js.replace(a,'if(QA_GROUP===2)'+a)
a="report.phase='canonical-private-verified';";assert js.count(a)==1
js=js.replace(a,"assert.equal(report.requests.length,QA_GROUP===1?40:96);assert.equal(report.requests.filter(r=>r.route==='owned-lesson-v1').length,40);"+a)
Path('qa/curriculum-map/remote_private.generated.mjs').write_text(js)
print('Prepared two independent synthetic identities: 40 teaching turns each, 56 cordial turns in group 2; 136 total. Student quotas, canonical source and production remain unchanged.')
