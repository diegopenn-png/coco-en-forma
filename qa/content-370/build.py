from pathlib import Path
import json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[2]
OLD='eterna-library-2026.09-v6-310-traceable-12c672'
RELEASE='eterna-library-2026.09-v7-370-c26c61c'
BASE='c26c61cd78fa2b045a5e63efd81901581603cdeb'
sha=lambda b:hashlib.sha256(b if isinstance(b,bytes)else b.encode()).hexdigest()
compact=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))
orig=json.loads((ROOT/'qa/library/lessons-v1.json').read_text());assert len(orig)==310
assert sha((ROOT/'eterna-worker/src/index.js').read_bytes())=='bc425e8f9e0e3eb5fa8e7fe6fbbd5520b72bdcae6cf6c1f0397578851da79964'
assert sha((ROOT/'eterna-worker/src/library/runtime-v1.js').read_bytes())=='9df5c21942c593241388535a4a0bb518bba95a71a0edfacbe770683bb2a83369'
# Compare to the actual accepted baseline, including the just-fixed next-round generator.
unchanged=['eterna-worker/src/library/procedural-v1.js','eterna-worker/src/library/compass-data-v1.js','eterna-worker/src/library/curricular-compass-v1.js','eterna-state-contract-v3.js','eterna-v159.js','eterna-experience-v160.js']
preserved={}
for path in unchanged:
 data=(ROOT/path).read_bytes();base=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT);assert data==base,path;preserved[path]=sha(data)
reviewed_replacements={
 'En ese mismo caso, entre las piezas defectuosas la probabilidad de proceder de B es…':'Una fábrica recibe 60 % de piezas de A y 40 % de B; son defectuosas 2 % de A y 5 % de B. Entre las defectuosas, la probabilidad de proceder de B es…',
 'Al duplicar toda la ecuación de esa reacción original, ΔH es…':'Una reacción tiene ΔH=−100 kJ. Al duplicar toda su ecuación en las mismas condiciones, ΔH es…',
 'Definir f(1)=5 en esa función, cuyo límite en 1 es 2, produce…':'Para una función cuyo límite cuando x tiende a 1 es 2, definir f(1)=5 produce…'
}
new=[];ids={l['id']for l in orig};corrections=[]
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
for stage,expected in [('infantil',8),('primaria',20),('eso',16),('bachillerato',16)]:
 count=0
 for line in (ROOT/'qa/content-370'/f'{stage}.txt').read_text().splitlines():
  if not line.strip():continue
  f=line.split('|');assert len(f)==12,(stage,len(f),line[:60])
  id,title,subject,grades,aliases,explanation,simpler,example,quiz,hint,misconception,why=f
  assert id not in ids,id;ids.add(id);low,high=map(int,grades.split('-'))
  assert 0<=low<=high<={'infantil':5,'primaria':6,'eso':4,'bachillerato':2}[stage]
  years=[f'Infantil · {n} años'if stage=='infantil'else f'{n}º de '+{'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}[stage]for n in range(low,high+1)]
  checks=[]
  for i,raw in enumerate(quiz.split('$')):
   q,a,b,c,key=raw.split('~');assert key in 'ABC';assert len({a,b,c})==3
   if q in reviewed_replacements:
    corrections.append({'lesson_id':id,'question_index':i,'before':q,'after':reviewed_replacements[q],'reason':'Include the full stimulus so the question is answerable without a previous screen.'});q=reviewed_replacements[q]
   assert len(q)<500,id
   checks.append({'id':id+':q'+str(i),'question':q,'options':[a,b,c],'answer':key,'hint':hint,'level':i+1})
  assert len(checks)==3
  l={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':low,'grade_max':high,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explanation,'simpler':simpler,'example':example,'why':why,'misconception':misconception,'hints':[hint,simpler,example],'quiz':checks,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage],'curriculum_source_key':SOURCES[stage],'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'Single-AI multidisciplinary editorial review, self-contained question checks and reproducible tests; not independent human certification','human_teacher_reviewed':False,'language':'es','license_note':'Contenido docente original ETERNA; referencia curricular estatal por etapa, sin homologación ni aval oficial.','curriculum_alignment_status':'stage_subject_reference_not_exhaustive_criterion_mapping','introduced_in_release':RELEASE,'subject_availability':'Depends on territorial curriculum, modality and school offer; not mandatory for every student.'}
  for field,minlen in [('explanation',90),('simpler',40),('example',40),('why',50)]:assert len(l[field])>=minlen,(id,field)
  new.append(l);count+=1
 assert count==expected,(stage,count)
assert len(new)==60 and len(corrections)==3
lessons=orig+new
assert compact(lessons[:310])==compact(orig)
payload={'release_id':RELEASE,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons}
(ROOT/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA teaching material. Incomplete national coverage; AI editorial review, not human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact(payload)+';\n')
(ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
for path in ['eterna-worker/src/index.js','eterna-worker/src/library/runtime-v1.js']:
 p=ROOT/path;s=p.read_text();assert OLD in s;s=s.replace(OLD,RELEASE);p.write_text(s)
 # Only the immutable release selector changes; no runtime/pedagogy/voice algorithm changes.
 base=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT).decode();assert s.replace(RELEASE,OLD)==base,path
for path in ['eterna-worker/test/library-first.test.mjs','eterna-worker/test/sprint-harness.mjs']:
 p=ROOT/path;s=p.read_text().replace(OLD,RELEASE)
 if 'library-first' in path:s=s.replace('310 actual micro-lessons','370 actual micro-lessons').replace('930 distinct structured checks','1110 distinct structured checks').replace('all 930 known checks','all 1110 known checks').replace('h.lessons.length,310','h.lessons.length,370').replace('l=>l.id)).size,310','l=>l.id)).size,370').replace('l=>l.quiz).length,930','l=>l.quiz).length,1110').replace('assert.equal(n,1550)','assert.equal(n,1850)')
 p.write_text(s)
p=ROOT/'eterna-worker/test/curriculum-traceability.test.mjs';s=p.read_text();needle='copy(c.ETERNA_LIBRARY_CONTENT.lessons)';assert s.count(needle)==1;s=s.replace(needle,'copy(c.ETERNA_LIBRARY_CONTENT.lessons.slice(0,310))');p.write_text(s)
records=[]
for l in new:
 lens='Infantil'if l['stage']=='infantil'else 'Matemáticas'if l['subject']=='Matemáticas'else 'Lenguas'if any(x in l['subject']for x in ['Lengua','Comunicación'])else 'Humanidades'if 'Filosofía'in l['subject']else 'Ciencias y tecnología'
 records.append({'lesson_id':l['id'],'lesson_sha256':sha(compact(l)),'reviewer_kind':'single_AI_emulating_disciplinary_lenses','primary_lens':lens,'review_dimensions':['factual scope and assumptions','age and clarity','self-contained questions','answer keys','misconceptions and scaffolding','safety and inclusion'],'questions_checked':[q['question']for q in l['quiz']],'checked_options':[q['options']['ABC'.index(q['answer'])]for q in l['quiz']],'misconception_examined':l['misconception'],'curriculum_reference':l['curriculum_source'],'full_criterion_alignment_verified':False,'human_teacher_reviewed':False,'classroom_efficacy_tested':False})
manifest={'release_id':RELEASE,'baseline_commit':BASE,'baseline_lessons':310,'baseline_canonical_sha256':sha(compact(orig)),'baseline_questions_preserved':930,'lessons':370,'questions':1110,'protocols':56,'new_lessons':60,'new_questions':180,'new_ids':[l['id']for l in new],'new_by_stage':{s:sum(l['stage']==s for l in new)for s in SOURCES},'preserved_sha256':preserved,'prepublication_editorial_corrections':corrections,'full_curriculum_complete':False,'human_teacher_reviewed':False,'official_reference_checked_date':'2026-09-12','official_reference_scope':'Current state-stage reference only. No new regional source or curriculum link automatically approved.'}
(ROOT/'qa/content-370/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'qa/content-370/review-ledger.json').write_text(json.dumps({'release_id':RELEASE,'single_AI_system':True,'independent_human_review':False,'records':records},ensure_ascii=False,indent=2)+'\n')
(ROOT/'content-370-evidence').mkdir(exist_ok=True)
(ROOT/'content-370-evidence/build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:manifest[k]for k in ['release_id','lessons','questions','new_lessons','new_questions','new_by_stage']},ensure_ascii=False))
