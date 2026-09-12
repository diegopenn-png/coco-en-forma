from pathlib import Path
import json,hashlib
proof=json.loads(Path('content-370-evidence/report.json').read_text());release=proof['release_id']
assert release=='eterna-library-2026.09-v7-370-c26c61c' and proof['lessons']==370 and proof['tests_failed']==0 and proof['tests_passed']>779
raw=Path('.qa-combined/qa/library-combined/prepare_private.py').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'content-370-evidence/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v7-370-c26c61c' and proof['lessons']==370 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']>779"
assert a in s;s=s.replace(a,b)
s=s.replace("directory='combined-private-evidence'","directory='content-370-private'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'a632d0a8-7287-4521-b67d-23a422e8815e'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:370,protocols:56,questions:1110').replace('health.owned_library.lessons,217','health.owned_library.lessons,370').replace('lessons.length!==217','lessons.length!==370').replace('lessons:217,questions:651,protocols:56','lessons:370,questions:1110,protocols:56')
exec(compile(s,'verified-canonical-adapter','exec'),{'__name__':'__main__'})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
def replace(a,b):
 global js
 assert js.count(a)==1,(a[:80],js.count(a));js=js.replace(a,b)
replace("const script='coco-eterna-v159'","const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2,3].includes(QA_GROUP));\nconst script='coco-eterna-v159'")
replace("directory='content-370-private'","directory='content-370-private/group-'+QA_GROUP")
replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.synthetic_group=QA_GROUP;report.production_quota_unchanged=true;report.new_lessons_checked=[];')
all_lessons=json.loads(Path('qa/library/lessons-v1.json').read_text());assert len(all_lessons)==370
courses={}
for l in all_lessons[310:]:
 key=l['school_years'][0]
 if key not in courses:courses[key]={'command':'course_'+str(len(courses)),'profile':{'stage':l['stage'],'school_year':key}}
profiles={'infantil':{'stage':'infantil','school_year':'Infantil · 5 años'},'primaria':{'stage':'primaria','school_year':'5º de Primaria'},'eso':{'stage':'eso','school_year':'4º de ESO'},'bachillerato':{'stage':'bachillerato','school_year':'2º de Bachillerato'}}
profiles.update({v['command']:v['profile']for v in courses.values()})
a="const profile={infantil:{stage:'infantil',school_year:'Infantil · 5 años'},primaria:{stage:'primaria',school_year:'5º de Primaria'},eso:{stage:'eso',school_year:'4º de ESO'},bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}};"
replace(a,'const profile='+json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+';')
replace("'bachillerato','stats','cleanup','stage_content'","'bachillerato','stats','cleanup','stage_content',"+','.join(repr(v['command'])for v in courses.values()))
replace("async function chat(text,mode='ask',previous=null){","async function chat(text,mode='ask',previous=null,action=null){")
replace("student_action:previous?'answer':'new_topic'","student_action:action||(previous?'answer':'new_topic')")
start=js.index(' for(const [stage,lid]of [[');end=js.index("\n await control('primaria');",start);end2=js.index('\n await new Promise(',end)
assert start<end<end2
loop="""
 const courseCommands=__COURSES__,added=globalThis.ETERNA_LIBRARY_CONTENT.lessons.slice(310+(QA_GROUP-1)*20,310+QA_GROUP*20);assert.equal(added.length,20);
 for(const [i,lesson]of added.entries()){
  const year=lesson.school_years[0];await control(courseCommands[year]);const mode=['explain','ask','practice','exam'][i%4];
  let p=await chat('Explícame '+lesson.title,mode);assert.equal(p.library_lesson_id,lesson.id);assert.equal(p.generated_exercise,false);
  if(i===0){const questionId=p.pedagogical_state.pending_question_id;p=await chat('una pista',mode,p,'hint_request');assert.equal(p.pedagogical_state.pending_question_id,questionId);p=await chat('hola Eterna',mode,p,'continue');assert.equal(p.pedagogical_state.pending_question_id,questionId)}
  const owned=globalThis.EternaOwnedLibrary.owned(p.pedagogical_state,{school_year:year},mode);assert.ok(owned);assert.equal(owned.lesson.id,lesson.id);
  p=await chat(owned.question.answer,mode,p);assert.equal(p.student_answer_assessment,'correct');assert.equal(p.activity_state.correct_count,1);
  report.new_lessons_checked.push({lesson_id:lesson.id,school_year:year,mode,first_answer_verified:true,generation_calls:0});save();
 }
""".replace('__COURSES__',json.dumps({k:v['command']for k,v in courses.items()},ensure_ascii=False))
js=js[:start]+loop+js[end2:]
replace("report.phase='canonical-private-verified';","assert.equal(report.requests.length,42);assert.equal(report.new_lessons_checked.length,20);report.phase='canonical-private-verified';")
assert "'a632d0a8-7287-4521-b67d-23a422e8815e'" in js
Path('qa/content-370/remote_private.generated.mjs').write_text(js)
print('Prepared 60 real lesson openings and answer checks across three disposable identities; 126 total turns with hints/greetings; no production changes.')
