from pathlib import Path
import hashlib,json
p=Path('qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode()
s=s.replace("'combined-evidence/report.json'","'review-build-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
old="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
new="assert release=='eterna-library-2026.09-v4-256-reviewed-c993' and proof['lessons']==256 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==616"
assert old in s;s=s.replace(old,new)
s=s.replace("directory='combined-private-evidence'","directory='review-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'122648ab-15d5-4486-825b-996b06fd86e1'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:256,protocols:56,questions:768').replace('health.owned_library.lessons,217','health.owned_library.lessons,256').replace('lessons.length!==217','lessons.length!==256').replace('lessons:217,questions:651,protocols:56','lessons:256,questions:768,protocols:56')
s=s.replace("['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']","['infantil','i-listening'],['primaria','p-triangle-area'],['eso','e-reflection'],['bachillerato','b-climograph']")
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
generated=Path('qa/library/remote_combined_verify.mjs');text=generated.read_text()
assert "release='eterna-library-2026.09-v4-256-reviewed-c993'" in text
assert "'122648ab-15d5-4486-825b-996b06fd86e1'" in text
assert 'regressions_passed:616' in text and 'lessons:256' in text
assert text.count('report.ui_scenarios=42;')==1
text=text.replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.previous_ui_baseline_scenarios=42;report.previous_ui_baseline_commit="c993afecbdfe9a8f456af509b5b45b1b03ef4f47";')
Path('qa/curriculum-review/remote_reviewed.generated.mjs').write_text(text)
print('Prepared exact 96-turn real authenticated verification and draft-only content import. No production deployment.')
