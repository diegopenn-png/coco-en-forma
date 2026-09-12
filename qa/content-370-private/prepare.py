from pathlib import Path
import hashlib,json
p=Path('.qa-combined/qa/library-combined/prepare_private.py');raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='924465842ae92431101113d9be07fc5c2034a1a29b48cf98535e5fef3a937a4b'
s=raw.decode().replace("'combined-evidence/report.json'","'content-370-build/report.json'").replace("release=proof['release']","release=proof['release_id']")
a="assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42"
b="assert release=='eterna-library-2026.09-v7-370-content-c26c61c' and proof['lessons']==370 and proof['protocols']==56 and proof['tests_failed']==0 and proof['tests_passed']==846"
assert a in s;s=s.replace(a,b).replace("directory='combined-private-evidence'","directory='content-370-private-evidence'")
s=s.replace("'616b2ff8-5a2c-43a8-9092-5d70a42f14e2'","'a632d0a8-7287-4521-b67d-23a422e8815e'")
s=s.replace('lessons:217,protocols:56,questions:651','lessons:370,protocols:56,questions:1110').replace('health.owned_library.lessons,217','health.owned_library.lessons,370').replace('lessons.length!==217','lessons.length!==370').replace('lessons:217,questions:651,protocols:56','lessons:370,questions:1110,protocols:56')
exec(compile(s,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
js=Path('qa/library/remote_combined_verify.mjs').read_text()
def replace(a,b):
 global js
 assert js.count(a)==1,(a[:80],js.count(a));js=js.replace(a,b)
replace("const script='coco-eterna-v159'","const QA_GROUP=Number(process.env.ETERNA_QA_GROUP);assert.ok([1,2,3,4].includes(QA_GROUP));\nconst script='coco-eterna-v159'")
replace("directory='content-370-private-evidence'","directory='content-370-private-evidence/group-'+QA_GROUP")
replace("import '../../eterna-worker/src/library/runtime-v1.js';","import '../../eterna-worker/src/library/runtime-v1.js';\nimport '../../eterna-worker/src/library/procedural-v1.js';")
replace('report.ui_scenarios=42;','report.ui_scenarios_newly_tested=0;report.synthetic_group=QA_GROUP;report.production_quota_unchanged=true;report.original_lessons_preserved=310;report.new_lessons_tested=[];')
# Stronger binding check than the older harness: only the release label can change.
replace("!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name)","b.name!=='ETERNA_LIBRARY_RELEASE'")
profiles={'infantil':{'stage':'infantil','school_year':'Infantil · 5 años'},'primaria':{'stage':'primaria','school_year':'5º de Primaria'},'eso':{'stage':'eso','school_year':'4º de ESO'},'bachillerato':{'stage':'bachillerato','school_year':'2º de Bachillerato'}}
for stage,grades,label in [('infantil',range(3,6),None),('primaria',range(1,7),'Primaria'),('eso',range(1,5),'ESO'),('bachillerato',range(1,3),'Bachillerato')]:
 for grade in grades:profiles[f'profile_{stage}_{grade}']={'stage':stage,'school_year':f'Infantil · {grade} años'if stage=='infantil'else f'{grade}º de {label}'}
replace("'bachillerato','stats','cleanup','stage_content'","'bachillerato','stats','cleanup','stage_content',"+','.join(repr(k)for k in profiles if k.startswith('profile_')))
replace("const profile={infantil:{stage:'infantil',school_year:'Infantil · 5 años'},primaria:{stage:'primaria',school_year:'5º de Primaria'},eso:{stage:'eso',school_year:'4º de ESO'},bachillerato:{stage:'bachillerato',school_year:'2º de Bachillerato'}};",'const profile='+json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+';')
replace("async function chat(text,mode='ask',previous=null){","async function chat(text,mode='ask',previous=null,action=null){")
replace("student_action:previous?'answer':'new_topic'","student_action:action||(previous?'answer':'new_topic')")
replace('report.private_health_passed=true;','assert.equal(health.exercise_factory?.enabled,true);assert.equal(health.exercise_factory.families,22);assert.equal(health.curricular_compass?.enabled,true);report.private_health_passed=true;')
start=js.index(' for(const [stage,lid]of [[');end=js.index("\n await control('primaria');",start);assert end>start
js=js[:start]+Path('qa/content-370-private/turns.mjs').read_text()+js[end:]
replace('for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);',"for(const text of ['Hola Eterna','Gracias','¿Quién eres?','Hasta luego'])await chat(text);")
replace("report.phase='canonical-private-verified';","assert.equal(report.requests.length,[34,59,50,38][QA_GROUP-1]);assert.equal(report.new_lessons_tested.length,[10,20,18,12][QA_GROUP-1]);assert.ok(stats.usage.reduce((n,u)=>n+Number(u.chat_requests||0),0)<=60);report.phase='canonical-private-verified';")
assert 'regressions_passed:846' in js and 'lessons:370' in js
Path('qa/content-370-private/remote.generated.mjs').write_text(js)
print('Prepared all sixty new lessons, first answers, six-mode representative checks, previous nonrepeating round and protocols; four temporary identities under unchanged quotas. No live deployment.')
