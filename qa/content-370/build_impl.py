"""Append exact original content; stage and course references are not legal endorsement."""
from pathlib import Path
import hashlib,json,re,copy
ROOT=Path(__file__).resolve().parents[2]
OLD='eterna-library-2026.09-v6-310-traceable-12c672';NEW='eterna-library-2026.09-v7-370-content-c26c61c'
compact=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':'))
sha=lambda v:hashlib.sha256(v if isinstance(v,bytes)else v.encode()).hexdigest()
original=json.loads((ROOT/'qa/library/lessons-v1.json').read_text())[:310]
assert len(original)==310 and sha(compact(original))=='591f22c5f2abf2b8f2ab1e5bf576ad4426208045632ad7ef5634cf188763010d'
expected={'eterna-worker/src/index.js':'bc425e8f9e0e3eb5fa8e7fe6fbbd5520b72bdcae6cf6c1f0397578851da79964','eterna-worker/src/library/runtime-v1.js':'9df5c21942c593241388535a4a0bb518bba95a71a0edfacbe770683bb2a83369','eterna-worker/src/library/procedural-v1.js':'371f32609b1b2c3d4ba50ab4f67a487629f6cc536ced031a583e4d0ca6e46d98'}
for path,h in expected.items():
 s=(ROOT/path).read_text().replace(NEW,OLD).replace("const VERSION='library-first-v7-content';","const VERSION='library-first-v6-traceable';")
 assert sha(s)==h,path+' diverged from verified baseline; stop'
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
COUNT={'infantil':10,'primaria':20,'eso':18,'bachillerato':12};new=[];ids={l['id']for l in original}
for stage,want in COUNT.items():
 lines=[s for s in(ROOT/'qa/content-370'/f'{stage}.txt').read_text().splitlines()if s.strip()];assert len(lines)==want,(stage,len(lines))
 for line in lines:
  row=line.split('|');assert len(row)==12,(stage,len(row),line[:50])
  id,title,subject,grades,aliases,explanation,simpler,example,questions,hint,misconception,why=row
  assert id not in ids,id;ids.add(id);lo,hi=map(int,grades.split('-'))
  if stage=='infantil':assert 3<=lo<=hi<=5;years=[f'Infantil · {n} años'for n in range(lo,hi+1)]
  else:
   assert 1<=lo<=hi<={'primaria':6,'eso':4,'bachillerato':2}[stage]
   years=[f'{n}º de '+{'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}[stage]for n in range(lo,hi+1)]
  quiz=[]
  for i,q in enumerate(questions.split('$')):
   stem,a,b,c,answer=q.split('~');assert answer in 'ABC';assert len({a,b,c})==3
   assert 10<len(stem)<600;quiz.append({'id':f'{id}:q{i}','question':stem,'options':[a,b,c],'answer':answer,'hint':hint,'level':i+1})
  assert len(quiz)==3 and len(explanation)>=90 and len(simpler)>=40 and len(example)>=40 and len(why)>=50,id
  l={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':lo,'grade_max':hi,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explanation,'simpler':simpler,'example':example,'why':why,'misconception':misconception,'hints':[hint,simpler,example],'quiz':quiz,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage],'curriculum_source_key':SOURCES[stage],'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'AI-assisted content and age-appropriateness review; self-contained assessment, answer checks and regression tests; not independent human teacher certification','human_teacher_reviewed':False,'language':'es','license_note':'Material original ETERNA. Referencia normativa por etapa; sin homologación ni aval oficial.','curriculum_alignment_status':'stage_reference_not_exhaustive_criterion_mapping','subject_availability':'Editorial course range; actual subject availability depends on territory, modality and school offer.','introduced_in_release':NEW}
  new.append(l)
lessons=original+new;assert len(lessons)==370
(ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(ROOT/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA content; finite coverage and AI-assisted review, no human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact({'release_id':NEW,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons})+';\n')
for path in ['eterna-worker/src/index.js','eterna-worker/src/library/runtime-v1.js']:
 p=ROOT/path;s=p.read_text().replace(OLD,NEW)
 if path.endswith('runtime-v1.js'):s=s.replace("const VERSION='library-first-v6-traceable';","const VERSION='library-first-v7-content';")
 p.write_text(s)
# Update active release identifiers in fixtures, not algorithms or the source archive.
for p in (ROOT/'eterna-worker/test').glob('*.mjs'):
 s=p.read_text();n=s.replace(OLD,NEW)
 if n!=s:p.write_text(n)
p=ROOT/'eterna-worker/test/library-first.test.mjs';s=p.read_text()
for a,b in [('310 actual micro-lessons','370 actual micro-lessons'),('930 distinct structured checks','1110 distinct structured checks'),('h.lessons.length,310','h.lessons.length,370'),('l=>l.id)).size,310','l=>l.id)).size,370'),('l=>l.quiz).length,930','l=>l.quiz).length,1110'),('all 930 known checks','all 1110 known checks'),('assert.equal(n,1550)','assert.equal(n,1850)')]:s=s.replace(a,b)
p.write_text(s)
p=ROOT/'eterna-worker/test/curriculum-traceability.test.mjs';s=p.read_text().replace('const ls=copy(c.ETERNA_LIBRARY_CONTENT.lessons),','const ls=copy(c.ETERNA_LIBRARY_CONTENT.lessons.slice(0,310)),');p.write_text(s)
manifest={'release_id':NEW,'baseline_release':OLD,'baseline_commit':'c26c61cd78fa2b045a5e63efd81901581603cdeb','baseline_lessons':310,'baseline_canonical_sha256':sha(compact(original)),'new_lessons':60,'new_questions':180,'lessons':370,'questions':1110,'protocols':56,'counts_added':COUNT,'added_ids':[l['id']for l in new],'old_lessons_changed':False,'old_question_ids_and_keys_preserved':930,'runtime_algorithm_changes':False,'microphone_changes':False,'procedural_changes':False,'full_curriculum_complete':False,'human_teacher_reviewed':False,'new_content_sha256':sha(compact(new))}
(ROOT/'qa/content-370/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
review={'reviewer':'One AI system applying discipline, age, clarity, assessment and safeguarding perspectives; not independent humans','human_review_performed':False,'scope':'New 60 original micro-lessons only; state-stage references, not complete territorial criteria','records':[]}
for l in new:
 review['records'].append({'lesson_id':l['id'],'content_sha256':sha(compact(l)),'stage':l['stage'],'subject':l['subject'],'questions':[q['question']for q in l['quiz']],'checked_answers':[q['options']['ABC'.index(q['answer'])]for q in l['quiz']],'conceptual_caution':l['misconception'],'reasoning_reference':l['why'],'simplification':l['simpler'],'source_role':'curriculum stage reference, not a factual citation for every teaching claim','human_teacher_reviewed':False,'classroom_validated':False})
(ROOT/'qa/content-370/review-ledger.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
(ROOT/'content-370-build').mkdir(exist_ok=True)
(ROOT/'content-370-build/inventory.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False))
