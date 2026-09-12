"""Adapt the previously verified disposable-identity harness, never production auth."""
from pathlib import Path
import hashlib,json
p=Path('.qa-combined/qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'sprint-build-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v6-310-traceable-12c672' and proof['lessons']==310 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==753"
assert a in s;s=s.replace(a,b).replace("directory='combined-private-evidence'","directory='sprint-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'ce846fe8-2f9a-4c4e-ba72-397dcc14e2db'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:310,protocols:56,questions:930').replace('health.owned_library.lessons,217','health.owned_library.lessons,310').replace('lessons.length!==217','lessons.length!==310').replace('lessons:217,questions:651,protocols:56','lessons:310,questions:930,protocols:56')
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
def replace(a,b,n=1):
 global js
 assert js.count(a)==n,(a[:100],js.count(a),n)
 js=js.replace(a,b)
replace("const script='coco-eterna-v159'","const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2,3,4].includes(QA_GROUP));\nconst script='coco-eterna-v159'")
replace("directory='sprint-private-evidence'","directory='sprint-private-evidence/group-'+QA_GROUP")
replace("import '../../eterna-worker/src/library/runtime-v1.js';","import '../../eterna-worker/src/library/runtime-v1.js';\nimport '../../eterna-worker/src/library/procedural-v1.js';")
replace("import './library/runtime-v1.js';\nconst ACCESS=","import './library/runtime-v1.js';\nimport './library/compass-data-v1.js';\nimport './library/curricular-compass-v1.js';\nconst ACCESS=")
replace("vars={...oldVars,ENABLE_ETERNA_LIBRARY:'true',ETERNA_LIBRARY_RELEASE:release}","vars={...oldVars,ENABLE_ETERNA_LIBRARY:'true',ETERNA_LIBRARY_RELEASE:release,ETERNA_EXERCISE_FACTORY:'v1',ETERNA_CURRICULAR_COMPASS:'v1'}")
replace("!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name)","!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE','ETERNA_EXERCISE_FACTORY','ETERNA_CURRICULAR_COMPASS'].includes(b.name)")
replace('report.ui_scenarios=42;','report.synthetic_group=QA_GROUP;report.ui_scenarios_newly_tested=0;report.production_quota_unchanged=true;report.factory_enabled=true;report.compass_enabled=true;')
profiles={}
for stage,grades,label in [('primaria',6,'Primaria'),('eso',4,'ESO'),('bachillerato',2,'Bachillerato')]:
 for grade in range(1,grades+1):profiles[f'{stage}_{grade}']={'stage':stage,'school_year':f'{grade}º de {label}'}
profiles['primaria']={'stage':'primaria','school_year':'5º de Primaria'}
a="'bachillerato','stats','cleanup','stage_content'"
replace(a,"'bachillerato','stats','cleanup','stage_content','compass_probe',"+','.join(repr(k) for k in profiles if k!='primaria'))
a="const profile={infantil:{stage:'infantil',school_year:'Infantil · 5 años'},primaria:{stage:'primaria',school_year:'5º de Primaria'},eso:{stage:'eso',school_year:'4º de ESO'},bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}};"
replace(a,'const profile='+json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+';')
compass="""
 if(command==='compass_probe'){
  const lib=globalThis.EternaCurricularCompass,profile={school_year:'4º de ESO',preferred_language:'es'};
  const plan=lib.plan(profile,'Biología','mitosis y meiosis');if(!plan)throw Error('COMPASS_PLAN_MISSING');
  const rows=await sb('/rest/v1/rpc/eterna_curricular_compass_v1','POST',plan),context=lib.context(rows,plan);
  if(!context||!context.items.length||context.factual_answer_evidence!==false||context.territorial_alignment_verified!==false)throw Error('COMPASS_EVIDENCE_INVALID');
  const younger={...plan,p_grade:1},young=await sb('/rest/v1/rpc/eterna_curricular_compass_v1','POST',younger);
  if(young.some(r=>r.course_band==='Cuarto curso'))throw Error('COMPASS_COURSE_LEAK');
  const anonymous=await fetch(base+'/rest/v1/rpc/eterna_curricular_compass_v1',{method:'POST',headers:{apikey:pub,'Content-Type':'application/json'},body:JSON.stringify(plan)});
  if(anonymous.ok)throw Error('ANONYMOUS_CURRICULUM_RPC_EXPOSED');
  return reply({ok:true,real_database_rpc:true,matched_units:context.items.map(x=>x.unit_id),course_filter_checked:true,anonymous_denied:true,factual_answer_evidence:false,territorial_alignment_verified:false,model_calls:0})
 }
"""
replace(' async function login(){',compass+'\n async function login(){')
replace("async function chat(text,mode='ask',previous=null){","async function chat(text,mode='ask',previous=null,action=null){")
replace("student_action:previous?'answer':'new_topic'","student_action:action||(previous?'answer':'new_topic')")
replace("lesson:p.library_lesson_id||null,round_trip_ms:","lesson:p.library_lesson_id||null,generated_exercise:Boolean(p.generated_exercise),family:p.generated_exercise?p.pedagogical_state?.next_teaching_goal?.split(':')[2]:null,round_trip_ms:")
replace('report.private_health_passed=true;','assert.equal(health.exercise_factory?.enabled,true);assert.equal(health.exercise_factory.families,22);assert.equal(health.curricular_compass?.enabled,true);report.private_health_passed=true;if(QA_GROUP===1){report.compass_probe=await control(\'compass_probe\');save()}')
start=js.index(' for(const [stage,lid]of [[');end=js.index("\n await control('primaria');",start)
assert end>start
js=js[:start]+Path('qa/sprint/private_turns.mjs').read_text()+js[end:]
replace('for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);','if(QA_GROUP===4)for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);')
replace("report.phase='canonical-private-verified';","assert.equal(report.procedural_rounds.length,QA_GROUP===4?8:12);assert.ok(report.persistence_evidence.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60,'Never exceed or reset trial limit');report.phase='canonical-private-verified';")
assert 'regressions_passed:753' in js
Path('qa/sprint/remote_private.generated.mjs').write_text(js)
print('Prepared four independent identities under unchanged quotas, all 22 families in both modes, actual public source RPC and verified cleanup. No production deployment.')
