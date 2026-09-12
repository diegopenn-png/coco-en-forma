"""Add six subject-gap supports to an immutable 304-lesson baseline.
This is not exhaustive curriculum coverage. Keep every old lesson byte-equivalent.
"""
from pathlib import Path
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[2]
RELEASE='eterna-library-2026.09-v6-310-traceable-12c672'
OLD='eterna-library-2026.09-v5-304-panel-ffe822'
def sha(v):return hashlib.sha256(v if isinstance(v,bytes) else v.encode()).hexdigest()
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
expected={'eterna-worker/src/index.js':'ba0d2c1675ba8c752925d77cc3953dfe2392d7b342cdd608595c191a729e3b01','eterna-worker/src/library/content-v1.js':'9f6a9779637562e249455e06f56128e0891b39633af09955beba26e8f4eb6f05','eterna-worker/src/library/runtime-v1.js':'8a25caab42d0f4c854f06c1f75f32b9774357cf0d5702e65dcb505ab4014c998','qa/library/lessons-v1.json':'3a39907bab5f6788c69c2e1923aedf1a7315fcb1f2c5e11f09679d817ecb82e2','eterna-worker/test/library-first.test.mjs':'fae0e312d5e81db521475b7a48ed515b9c539d7f52e9cbccb512d7bc6ce45972'}
for path,want in expected.items():assert sha((ROOT/path).read_bytes())==want,path
lessons=json.loads((ROOT/'qa/library/lessons-v1.json').read_text());assert len(lessons)==304
old_hash=sha(compact(lessons));ids={l['id']for l in lessons};new=[]
for line in (ROOT/'qa/curriculum-map/fill_subject_gaps.txt').read_text().splitlines():
 if not line.strip():continue
 parts=line.split('|');assert len(parts)==13,(len(parts),line[:50])
 id,title,subject,stage,grades,aliases,explanation,simpler,example,checks,hint,misconception,why=parts
 assert id not in ids;ids.add(id);assert stage in ('eso','bachillerato')
 low,high=map(int,grades.split('-'));assert 1<=low<=high<=({'eso':4,'bachillerato':2}[stage])
 years=[f'{n}º de '+{'eso':'ESO','bachillerato':'Bachillerato'}[stage]for n in range(low,high+1)]
 quiz=[]
 for i,q in enumerate(checks.split('$')):
  stem,a,b,c,answer=q.split('~');assert answer in 'ABC' and len({a,b,c})==3
  quiz.append({'id':id+':q'+str(i),'question':stem,'options':[a,b,c],'answer':answer,'hint':hint,'level':i+1})
 assert len(quiz)==3
 source='BOE-A-2022-4975'if stage=='eso'else'BOE-A-2022-5521'
 l={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':low,'grade_max':high,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explanation,'simpler':simpler,'example':example,'why':why,'misconception':misconception,'hints':[hint,simpler,example],'quiz':quiz,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+source,'curriculum_source_key':source,'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'Single-AI multidisciplinary simulation: subject correctness, didactic clarity, inclusion, assessment scope and exact source linkage; not an independent human review','human_teacher_reviewed':False,'language':'es','license_note':'Material original ETERNA; referencia oficial por etapa y vinculación parcial explícita. No homologación.','introduced_in_release':RELEASE,'curriculum_alignment_status':'reviewed_partial_support_not_whole_criterion_fulfilment','subject_availability':'Depends on territorial curriculum, modality and school offer; not mandatory for every student.'}
 new.append(l)
assert len(new)==6
lessons+=new;assert len(lessons)==310 and sha(compact(lessons[:304]))==old_hash
payload={'release_id':RELEASE,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons}
(ROOT/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA support: source-traceable, not exhaustive curriculum or human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact(payload)+';\n')
(ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'eterna-worker/src/index.js';s=p.read_text();assert s.count(OLD)==3;s=s.replace(OLD,RELEASE);p.write_text(s)
p=ROOT/'eterna-worker/src/library/runtime-v1.js';s=p.read_text();assert s.count(OLD)==1;assert s.count("const VERSION='library-first-v5-panel';")==1
s=s.replace(OLD,RELEASE).replace("const VERSION='library-first-v5-panel';","const VERSION='library-first-v6-traceable';");p.write_text(s)
p=ROOT/'eterna-worker/test/library-first.test.mjs';s=p.read_text().replace(OLD,RELEASE).replace('304 actual micro-lessons','310 actual micro-lessons').replace('912 distinct structured checks','930 distinct structured checks').replace('h.lessons.length,304','h.lessons.length,310').replace('l=>l.id)).size,304','l=>l.id)).size,310').replace('l=>l.quiz).length,912','l=>l.quiz).length,930').replace('all 912 known checks','all 930 known checks').replace('assert.equal(n,1520)','assert.equal(n,1550)');p.write_text(s)
p=ROOT/'eterna-worker/test/teacher-panel.test.mjs';s=p.read_text();assert s.count('copy(c.ETERNA_LIBRARY_CONTENT.lessons)')==1;s=s.replace('copy(c.ETERNA_LIBRARY_CONTENT.lessons)','copy(c.ETERNA_LIBRARY_CONTENT.lessons.slice(0,304))');p.write_text(s)
manifest={'release_id':RELEASE,'baseline_release_id':OLD,'baseline_commit':'12c672a4e67646f8da3bba125ccdaade7e34d7a0','baseline_lessons':304,'baseline_canonical_sha256':old_hash,'lessons':310,'questions':930,'protocols':56,'added_lesson_ids':[x['id']for x in new],'baseline_lessons_byte_equivalent':True,'runtime_algorithms_unchanged':True,'microphone_unchanged':True,'full_curriculum_complete':False,'human_teacher_reviewed':False}
(ROOT/'qa/curriculum-map/release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False))
