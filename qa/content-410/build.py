from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2]
OLD='eterna-library-2026.09-v7-370-content-c26c61c';NEW='eterna-library-2026.09-v8-410-consolidated-1c484e'
BASE='1c484e01e2e3f5cf67fc5ad4eeeb5374ac52f767'
compact=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
hash=lambda x:hashlib.sha256(x if isinstance(x,bytes)else x.encode()).hexdigest()
previous=json.loads((R/'qa/library/lessons-v1.json').read_text());drafts=json.loads((R/'inputs/new-60-lessons.json').read_text())
assert len(previous)==370 and hash(compact(previous))=='176afb267e29ae4cddac764abfc5029a7a83952dcaa4620adf9c8f640f643f85'
assert len(drafts)==60 and hash(compact(drafts))=='dba340a7745ae6c011b3c101d8479852790488deb87c7a38011e3858989db13b'
# Semantic duplicate decisions, not merely different ids or rewritten titles. Keep the already published treatment.
exclude={'i-pairs':'i-one-each','i-length-compare':'i-long-short','p-sub-borrow':'p-regroup-subtraction','p-fraction-quantity':'p-fraction-quantity','p-mass-units':'p-mass-units','p-word-families':'p-word-family','p-instructions':'p-instruction-text','p-pollination':'p-pollination','p-simple-machines':'p-simple-machines','p-en-possessive':'p-en-possessives','e-identities':'e-notable-identities','e-pressure':'e-pressure','e-conservation-reaction':'e-mass-conservation','e-indirect-object':'e-indirect-object','b-primitive':'b-indefinite-integral','b-matrix-product':'b-matrix-multiplication','b-bayes':'b-bayes','b-enthalpy':'b-enthalpy','b-aristotle':'b-aristotle-virtue','b-reported-speech':'b-reported-speech'}
ids={l['id']for l in previous};assert set(exclude.values())<=ids
added=[]
for l in drafts:
 if l['id']in exclude:continue
 assert l['id']not in ids,l['id'];ids.add(l['id']);l['introduced_in_release']=NEW;added.append(l)
assert len(added)==40
lessons=previous+added;assert len(lessons)==410
preserved={p:hash((R/p).read_bytes())for p in ['eterna-worker/src/library/procedural-v1.js','eterna-worker/src/library/compass-data-v1.js','eterna-worker/src/library/curricular-compass-v1.js','eterna-state-contract-v3.js']}
assert preserved['eterna-worker/src/library/procedural-v1.js']=='371f32609b1b2c3d4ba50ab4f67a487629f6cc536ced031a583e4d0ca6e46d98'
for path,want in [('eterna-worker/src/index.js','0abc6e3e3b316974801331aec55b369d89dd78e2cf5ea982bdfc59943ca97d53'),('eterna-worker/src/library/runtime-v1.js','94529100f9cea9412e53910075edc366c6b05ee1c3b60e233717e06a4ddf5568')]:
 p=R/path;s=p.read_text();assert hash(s)==want,path;assert OLD in s;p.write_text(s.replace(OLD,NEW));assert p.read_text().replace(NEW,OLD)==s
payload={'release_id':NEW,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons}
(R/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA teaching support; not full curriculum or human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact(payload)+';\n')
(R/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
for path in ['eterna-worker/test/library-first.test.mjs','eterna-worker/test/sprint-harness.mjs']:
 p=R/path;s=p.read_text().replace(OLD,NEW)
 if 'library-first'in path:s=s.replace('370 actual micro-lessons','410 actual micro-lessons').replace('1110 distinct structured checks','1230 distinct structured checks').replace('all 1110 known checks','all 1230 known checks').replace('h.lessons.length,370','h.lessons.length,410').replace('l=>l.id)).size,370','l=>l.id)).size,410').replace('l=>l.quiz).length,1110','l=>l.quiz).length,1230').replace('assert.equal(n,1850)','assert.equal(n,2050)')
 p.write_text(s)
# Keep the complete historical 370-edition tests on their fixed slice, not falsified new claims.
p=R/'eterna-worker/test/content-370.test.mjs';s=p.read_text();needle="const text=p=>readFileSync(new URL(p,import.meta.url),'utf8')";assert s.count(needle)==1
s=s.replace(needle,"const text=p=>readFileSync(new URL(p,import.meta.url),'utf8').replaceAll('"+NEW+"','"+OLD+"')")
needle='const lessons=JSON.parse(JSON.stringify(box.ETERNA_LIBRARY_CONTENT.lessons))';assert s.count(needle)==1;s=s.replace(needle,needle[:-1]+'.slice(0,370))');p.write_text(s)
manifest={'release_id':NEW,'baseline_release':OLD,'baseline_commit':BASE,'baseline_lessons':370,'baseline_canonical_sha256':hash(compact(previous)),'lessons':410,'questions':1230,'protocols':56,'new_lessons':40,'new_questions':120,'new_ids':[l['id']for l in added],'counts_added':{s:sum(l['stage']==s for l in added)for s in ['infantil','primaria','eso','bachillerato']},'counts_by_stage':{s:sum(l['stage']==s for l in lessons)for s in ['infantil','primaria','eso','bachillerato']},'duplicate_drafts_not_activated':exclude,'preserved_sha256':preserved,'input_artifact_run':34692999112,'input_artifact_id':10298391104,'old_lesson_objects_preserved':370,'old_question_ids_and_keys_preserved':1110,'runtime_algorithm_changes':False,'microphone_changes':False,'generator_changes':False,'full_curriculum_complete':False,'human_teacher_reviewed':False}
records=[{'lesson_id':l['id'],'content_sha256':hash(compact(l)),'questions':[q['question']for q in l['quiz']],'checked_answers':[q['options']['ABC'.index(q['answer'])]for q in l['quiz']],'reviewer':'Single AI applying disciplinary perspectives','review_dimensions':['factual assumptions','age and clarity','self-contained stimulus','correct answer','misconception and hints','safety and inclusion'],'misconception_examined':l['misconception'],'full_criterion_alignment_verified':False,'human_teacher_reviewed':False,'classroom_validated':False}for l in added]
(R/'qa/content-410/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(R/'qa/content-410/added-lessons.json').write_text(json.dumps(added,ensure_ascii=False,indent=2)+'\n')
(R/'qa/content-410/review-ledger.json').write_text(json.dumps({'release_id':NEW,'single_AI':True,'records':records},ensure_ascii=False,indent=2)+'\n')
(R/'content-410-evidence').mkdir(exist_ok=True);(R/'content-410-evidence/build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps(manifest,ensure_ascii=False))
