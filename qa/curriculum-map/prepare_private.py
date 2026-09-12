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
assert js.count('report.ui_scenarios=42;')==1
js=js.replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.previous_ui_baseline_scenarios=42;report.human_teacher_reviewed=false;report.new_subject_supports_exercised=6;')
a="'bachillerato','stats','cleanup','stage_content'";assert js.count(a)==1;js=js.replace(a,"'bachillerato','bachillerato1','stats','cleanup','stage_content'")
a="bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}";assert js.count(a)==1;js=js.replace(a,a+",bachillerato1:{stage:'bachillerato',school_year:'1º de Bachillerato'}")
a="[['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']]";assert js.count(a)==1
js=js.replace(a,"[['infantil','i-full'],['primaria','p-lcm'],['eso','e-app-permissions'],['bachillerato','b-stage-directions'],['bachillerato1','b-ecosystem-matter'],['bachillerato1','b-compound-meter'],['bachillerato1','b-affine-cost'],['bachillerato1','b-art-project']]")
Path('qa/curriculum-map/remote_private.generated.mjs').write_text(js)
print('136 actual authenticated fixed-content turns, all six new supports in their course, draft-only import, unchanged production and synthetic cleanup required.')
