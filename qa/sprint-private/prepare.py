from pathlib import Path
import hashlib
p=Path('.qa-combined/qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'sprint-build-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v6-310-traceable-12c672' and proof['lessons']==310 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==753 and proof['procedural_families']==22"
assert a in s;s=s.replace(a,b)
s=s.replace("directory='combined-private-evidence'","directory='sprint-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'ce846fe8-2f9a-4c4e-ba72-397dcc14e2db'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:310,protocols:56,questions:930').replace('health.owned_library.lessons,217','health.owned_library.lessons,310').replace('lessons.length!==217','lessons.length!==310').replace('lessons:217,questions:651,protocols:56','lessons:310,questions:930,protocols:56')
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
def replace(a,b):
 global js
 assert js.count(a)==1,(a[:100],js.count(a));js=js.replace(a,b)
replace("import '../../eterna-worker/src/library/runtime-v1.js';","import '../../eterna-worker/src/library/runtime-v1.js';\nimport '../../eterna-worker/src/library/procedural-v1.js';\nimport '../../eterna-worker/src/library/compass-data-v1.js';\nimport '../../eterna-worker/src/library/curricular-compass-v1.js';")
replace("const script='coco-eterna-v159'","const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2].includes(QA_GROUP));\nconst script='coco-eterna-v159'")
replace("directory='sprint-private-evidence'","directory='sprint-private-evidence/group-'+QA_GROUP")
replace("ETERNA_LIBRARY_RELEASE:release},rt=","ETERNA_LIBRARY_RELEASE:release,ETERNA_EXERCISE_FACTORY:'v1',ETERNA_CURRICULAR_COMPASS:'v1'},rt=")
replace("!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name)","!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE','ETERNA_EXERCISE_FACTORY','ETERNA_CURRICULAR_COMPASS'].includes(b.name)")
replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.previous_ui_baseline_scenarios=42;report.human_teacher_reviewed=false;report.synthetic_group=QA_GROUP;report.production_quota_unchanged=true;report.allowed_feature_changes=["ETERNA_EXERCISE_FACTORY=v1","ETERNA_CURRICULAR_COMPASS=v1"];')
replace("'bachillerato','stats','cleanup','stage_content'","'bachillerato','stats','cleanup','stage_content','compass_probe'")
# A fixed read-only source probe uses public normative rows only, not a pupil profile or chat.
probe="""
 if(command==='compass_probe'){
  const args={p_stage:'eso',p_grade:4,p_subjects:['Biología y Geología'],p_terms:['mitosis'],p_snapshot:'eterna-curriculum-map-2026.09.12-v1'};
  const rows=await sb('/rest/v1/rpc/eterna_curricular_compass_v1','POST',args);
  if(!Array.isArray(rows)||!rows.length||rows.length>3||rows.some(r=>r.stage!=='eso'||r.subject!=='Biología y Geología'||r.course_band!=='Cuarto curso'||!r.body.includes('mitosis')))throw Error('COMPASS_SCOPE_FAILED');
  const young=await sb('/rest/v1/rpc/eterna_curricular_compass_v1','POST',{...args,p_grade:1});
  if(young.some(r=>r.course_band==='Cuarto curso'))throw Error('COMPASS_GRADE_LEAK');
  const invalid=await sb('/rest/v1/rpc/eterna_curricular_compass_v1','POST',{...args,p_terms:['mitosis; DROP TABLE x']});if(invalid.length)throw Error('COMPASS_INPUT_GATE');
  const denied=await fetch(base+'/rest/v1/rpc/eterna_curricular_compass_v1',{method:'POST',headers:{apikey:pub,'Content-Type':'application/json'},body:JSON.stringify(args)});if(![401,403,404].includes(denied.status))throw Error('COMPASS_PUBLIC_ACCESS_NOT_BLOCKED');
  return reply({ok:true,rows:rows.map(r=>({unit_id:r.unit_id,stage:r.stage,subject:r.subject,course_band:r.course_band,kind:r.kind,text_sha256:r.text_sha256})),lower_grade_filtered:true,invalid_terms_rejected:true,anonymous_denied:true,student_data_used:false})
 }
"""
replace(' async function login(){',probe+'\n async function login(){')
replace('report.private_health_passed=true;','assert.equal(health.exercise_factory?.enabled,true);assert.equal(health.exercise_factory.families,22);assert.equal(health.curricular_compass?.enabled,true);assert.equal(health.curricular_compass.source_elements,9033);report.private_health_passed=true;report.compass_probe=await control("compass_probe");save();')
replace("for(const [stage,lid]of [['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']]){","if(QA_GROUP===1)for(const [stage,lid]of [['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']]){")
procedural="""
 if(QA_GROUP===2){
  const skills=globalThis.EternaProceduralPractice.skills;report.procedural_families_tested=[];
  for(const skill of skills){
   const stage=skill.min.primaria&&skill.min.primaria<=5?'primaria':skill.min.eso?'eso':'bachillerato';
   const school_year={primaria:'5º de Primaria',eso:'4º de ESO',bachillerato:'2º de Bachillerato'}[stage];
   await control(stage);const first=await chat('Dame ejercicios nuevos de '+skill.aliases[0],'practice');
   assert.equal(first.generated_exercise,true);assert.equal(first.generator_version,'procedural-practice-v1');
   const own=globalThis.EternaProceduralPractice.owned(first.pedagogical_state,{school_year,preferred_language:'es'},'practice');assert.ok(own,'Factory state cannot be independently reconstructed');assert.equal(own.lesson.skill_id,skill.id);
   const answered=await chat(own.question.answer,'practice',first);assert.equal(answered.generated_exercise,true);assert.equal(answered.student_answer_assessment,'correct');assert.equal(answered.activity_state.correct_count,1);assert.equal(answered.activity_state.question_number,2);
   report.procedural_families_tested.push(skill.id);save();
  }
  assert.equal(report.procedural_families_tested.length,22);
 }
"""
replace(" await control('primaria');\n for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);",procedural+"\n await control('primaria');\n if(QA_GROUP===2)for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);")
replace('generation_model_calls:0,generation_tokens:0});save();return p}',"generation_model_calls:0,generation_tokens:0,generated_exercise:Boolean(p.generated_exercise),generator_version:p.generator_version||null});save();return p}")
replace("report.phase='canonical-private-verified';","assert.equal(report.requests.length,QA_GROUP===1?40:100);assert.equal(report.requests.filter(r=>r.route==='owned-lesson-v1').length,QA_GROUP===1?40:44);report.phase='canonical-private-verified';")
assert 'regressions_passed:753' in js
Path('qa/sprint-private/remote.generated.mjs').write_text(js)
print('Prepared exact sprint canonical QA: 40 curated teaching turns + 44 generated teaching turns + 56 cordial turns; two disposable identities, unchanged quotas, fixed public curricular read probe, no deployment.')
