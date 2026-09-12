from pathlib import Path
import json,hashlib
proof=json.loads(Path('content-410-evidence/report.json').read_text());release=proof['release_id'];assert release=='eterna-library-2026.09-v8-410-consolidated-1c484e' and proof['lessons']==410 and proof['tests_failed']==0 and proof['tests_passed']>906
raw=Path('.qa-combined/qa/library-combined/prepare_private.py').read_bytes();assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'content-410-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v8-410-consolidated-1c484e' and proof['lessons']==410 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']>906"
assert a in s;s=s.replace(a,b).replace("directory='combined-private-evidence'","directory='content-410-private'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'f69b654f-7a94-488f-9800-c0d5e935ae7b'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:410,protocols:56,questions:1230').replace('health.owned_library.lessons,217','health.owned_library.lessons,410').replace('lessons.length!==217','lessons.length!==410').replace('lessons:217,questions:651,protocols:56','lessons:410,questions:1230,protocols:56')
exec(compile(s,'verified-canonical-adapter','exec'),{'__name__':'__main__'})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
def replace(a,b):
 global js
 assert js.count(a)==1,(a[:80],js.count(a));js=js.replace(a,b)
replace("const script='coco-eterna-v159'","const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2].includes(QA_GROUP));\nconst script='coco-eterna-v159'")
replace("directory='content-410-private'","directory='content-410-private/group-'+QA_GROUP")
replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.synthetic_group=QA_GROUP;report.production_quota_unchanged=true;report.new_lessons_checked=[];')
lessons=json.loads(Path('qa/library/lessons-v1.json').read_text());assert len(lessons)==410
courses={}
for l in lessons[370:]:
 year=l['school_years'][0]
 if year not in courses:courses[year]={'command':'course_'+str(len(courses)),'profile':{'stage':l['stage'],'school_year':year}}
profiles={'infantil':{'stage':'infantil','school_year':'Infantil · 5 años'},'primaria':{'stage':'primaria','school_year':'5º de Primaria'},'eso':{'stage':'eso','school_year':'4º de ESO'},'bachillerato':{'stage':'bachillerato','school_year':'2º de Bachillerato'}};profiles.update({v['command']:v['profile']for v in courses.values()})
a="const profile={infantil:{stage:'infantil',school_year:'Infantil · 5 años'},primaria:{stage:'primaria',school_year:'5º de Primaria'},eso:{stage:'eso',school_year:'4º de ESO'},bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}};"
replace(a,'const profile='+json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+';')
replace("'bachillerato','stats','cleanup','stage_content'","'bachillerato','stats','cleanup','stage_content',"+','.join(repr(v['command'])for v in courses.values()))
replace("async function chat(text,mode='ask',previous=null){","async function chat(text,mode='ask',previous=null,action=null){")
replace("student_action:previous?'answer':'new_topic'","student_action:action||(previous?'answer':'new_topic')")
start=js.index(' for(const [stage,lid]of [[');end=js.index("\n await control('primaria');",start);end2=js.index('\n await new Promise(',end);assert start<end<end2
loop="""
 const commands=__COURSES__,added=globalThis.ETERNA_LIBRARY_CONTENT.lessons.slice(370+(QA_GROUP-1)*20,370+QA_GROUP*20);assert.equal(added.length,20);
 for(const[i,lesson]of added.entries()){
  const year=lesson.school_years[0];await control(commands[year]);const mode=['explain','ask','practice','exam'][i%4];
  let p=await chat('Explícame '+lesson.title,mode);assert.equal(p.library_lesson_id,lesson.id);assert.equal(p.generated_exercise,false);
  if(i===0){const q=p.pedagogical_state.pending_question_id;p=await chat('una pista',mode,p,'hint_request');assert.equal(p.pedagogical_state.pending_question_id,q);p=await chat('hola Eterna',mode,p,'continue');assert.equal(p.pedagogical_state.pending_question_id,q)}
  const own=globalThis.EternaOwnedLibrary.owned(p.pedagogical_state,{school_year:year},mode);assert.ok(own);assert.equal(own.lesson.id,lesson.id);
  p=await chat(own.question.answer,mode,p);assert.equal(p.student_answer_assessment,'correct');assert.equal(p.activity_state.correct_count,1);
  report.new_lessons_checked.push({lesson_id:lesson.id,school_year:year,mode,first_answer_verified:true,generation_calls:0});save();
 }
""".replace('__COURSES__',json.dumps({k:v['command']for k,v in courses.items()},ensure_ascii=False))
js=js[:start]+loop+js[end2:]
replace("report.phase='canonical-private-verified';","assert.equal(report.requests.length,42);assert.equal(report.new_lessons_checked.length,20);report.phase='canonical-private-verified';")
Path('qa/content-410/remote_private.generated.mjs').write_text(js);print('Prepared 40 unique lessons, 84 authenticated turns, two temporary identities; no production modifications.')
