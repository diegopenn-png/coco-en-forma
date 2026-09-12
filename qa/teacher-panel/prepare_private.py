from pathlib import Path
import hashlib
p=Path('.qa-combined/qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'panel-build-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v5-304-panel-ffe822' and proof['lessons']==304 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==674"
assert a in s;s=s.replace(a,b)
s=s.replace("directory='combined-private-evidence'","directory='panel-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'6181ec9c-d5be-44f1-a9a2-f7390fbfd73b'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:304,protocols:56,questions:912').replace('health.owned_library.lessons,217','health.owned_library.lessons,304').replace('lessons.length!==217','lessons.length!==304').replace('lessons:217,questions:651,protocols:56','lessons:304,questions:912,protocols:56')
s=s.replace("['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']","['infantil','i-describe'],['primaria','p-money'],['eso','e-coordinates'],['bachillerato','b-break-even']")
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
p=Path('qa/library/remote_combined_verify.mjs');js=p.read_text()
assert "release='eterna-library-2026.09-v5-304-panel-ffe822'" in js
assert "'6181ec9c-d5be-44f1-a9a2-f7390fbfd73b'" in js
assert 'regressions_passed:674' in js and 'lessons:304' in js
assert js.count('report.ui_scenarios=42;')==1
js=js.replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.previous_ui_baseline_scenarios=42;report.simulated_panel=true;report.human_teacher_reviewed=false;')
Path('qa/teacher-panel/remote_panel.generated.mjs').write_text(js)
print('96 actual authenticated fixed-content turns, draft-only import, unchanged production and full synthetic cleanup required.')
