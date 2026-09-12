"""Single-AI multidisciplinary review, never human certification.
Adds 48 owned lessons and only explicit reversible corrections over exact production.
"""
from pathlib import Path
import copy,json,hashlib,re,collections
ROOT=Path(__file__).resolve().parents[2]
OLD='eterna-library-2026.09-v4-256-reviewed-c993';RELEASE='eterna-library-2026.09-v5-304-panel-ffe822'
def digest(v):return hashlib.sha256(v if isinstance(v,bytes) else v.encode()).hexdigest()
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
EXPECTED={'eterna-worker/src/index.js':'e44de7bb8233758d3141198832abc6fc67f4a92e75ae633b95e5e55c78240623','eterna-worker/src/library/runtime-v1.js':'441bbdb5b2f87c50535f9a7113976b4af873f315067ffbd24c68815d2a01d2c3','eterna-worker/src/library/content-v1.js':'a6223c5926f8960ac83683a1a2c18670d6dc74a66f63a871fd3fd90ab4db946f','qa/library/lessons-v1.json':'5d4348d7c4db4c4387f5de3c3526212ceb745022fbec03191f2e41950ee5e2cf','eterna-worker/test/library-first.test.mjs':'dc99c8250bfb8e3a85a81bf2d0b04fbfa2b699a4c3bbe312b424ecae36445d4a','eterna-worker/test/library-editorial-review.test.mjs':'af2a48b073e522c4fc64f15ea3a428222054a96f7834f79e33631962df257be1'}
for path,want in EXPECTED.items():assert digest((ROOT/path).read_bytes())==want,path
base=json.loads((ROOT/'qa/library/lessons-v1.json').read_text());assert len(base)==256
lessons=copy.deepcopy(base);by={l['id']:l for l in lessons};corrections=[]
def change(id,field,value,why):
 target=by[id];before=copy.deepcopy(target[field]);assert before!=value
 target[field]=value;corrections.append({'lesson_id':id,'path':[field],'before':before,'after':value,'reason':why})
change('i-shapes','simpler','Un círculo es redondito. Un triángulo tiene tres lados. Un cuadrado tiene cuatro lados iguales y cuatro esquinas rectas, como las de una hoja rectangular.','Infantil/geometría: retain the right-angle condition when simplifying; equal sides alone also describe non-square rhombi.')
change('p-prime','simpler','Un primo es un número natural mayor que 1 que solo tiene dos divisores positivos: 1 y él mismo. Por ejemplo, 7 se divide exactamente entre 1 y 7.','Primaria/matemáticas: preserve greater-than-one and exactly-two-divisors conditions in the accessible explanation.')
change('b-vectors','explanation','En coordenadas cartesianas ortonormales, un vector del plano puede representarse por dos componentes. Su módulo es la raíz de la suma de los cuadrados de las componentes. La suma se realiza componente a componente. Módulo, dirección y sentido son propiedades distintas.','Matemáticas: explicitly state the coordinate-basis assumptions behind the Euclidean component formula.')
change('e-motion','explanation','La velocidad es una magnitud vectorial: incluye módulo o rapidez, dirección y sentido. La aceleración mide cómo cambia la velocidad con el tiempo. Puede haber aceleración aunque la rapidez sea constante, si cambia la dirección. En un movimiento rectilíneo uniforme la velocidad es constante y la aceleración es cero.','Física: distinguish direction and sense explicitly without changing numerical keys.')
change('e-acceleration','example','En movimiento rectilíneo, tomando un mismo eje y sentido positivo, pasar de 2 a 8 m/s en 3 s da una aceleración media de (8−2)/3 = 2 m/s².','Física: make the sign convention explicit in the worked example as well as the question.')
# Keep repeated saved hints aligned when they contain an edited explanation verbatim.
for c in list(corrections):
 l=by[c['lesson_id']]
 if c['path'][0]in ('simpler','example'):
  hints=[c['after']if x==c['before']else x for x in l['hints']]
  if hints!=l['hints']:change(l['id'],'hints',hints,'Keep stored hints consistent with the explicitly reviewed text.')
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
NAMES={'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}
new=[]
for stage,part in [('infantil','infantil'),('primaria','primary'),('eso','eso'),('bachillerato','bachillerato')]:
 text=(ROOT/f'qa/teacher-panel/expansion-{part}.txt').read_text()
 # New reading questions must carry their own stimulus even when presented first in exam mode.
 text=text.replace('En esa misma frase, ¿dónde duerme la gata?','Lee: «La gata duerme en una caja». ¿Dónde duerme la gata?').replace('¿Qué color tiene la gata de esa frase?','Lee: «La gata duerme en una caja». ¿Qué color tiene la gata?')
 for line in text.splitlines():
  if not line.strip():continue
  row=line.split('|');assert len(row)==12,(stage,len(row),line[:70])
  id,title,subject,grades,aliases,explanation,simpler,example,questions,hint,misconception,why=row
  assert id not in by,id;low,high=map(int,grades.split('-'))
  quiz=[]
  for i,q in enumerate(questions.split('$')):
   stem,a,b,c,answer=q.split('~');assert answer in 'ABC' and len({a,b,c})==3
   quiz.append({'id':id+':q'+str(i),'question':stem,'options':[a,b,c],'answer':answer,'hint':hint,'level':i+1})
  assert len(quiz)==3
  years=[f'Infantil · {g} años'if stage=='infantil'else f'{g}º de {NAMES[stage]}'for g in range(low,high+1)]
  l={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':low,'grade_max':high,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explanation,'simpler':simpler,'example':example,'why':why,'misconception':misconception,'hints':[hint,simpler,example],'quiz':quiz,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage],'curriculum_source_key':SOURCES[stage],'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'Single AI model applying multidisciplinary teacher-role perspectives and reproducible checks; not independent human review','human_teacher_reviewed':False,'language':'es','license_note':'Material original ETERNA de apoyo. Referencia estatal por etapa; sin homologación ni aval oficial.','introduced_in_release':RELEASE,'curriculum_alignment_status':'stage_and_subject_family_reference_not_exhaustive_criteria_mapping','subject_availability':'Course, pathway, territorial curriculum and school offer determine availability.'}
  new.append(l);by[id]=l
assert len(new)==48,len(new);lessons+=new;assert len(lessons)==304
out=ROOT/'panel-build-evidence';out.mkdir(exist_ok=True)
ledger={'base_commit':'ffe822edc7985609ae69da41312ec32835193dcb','base_canonical_sha256':digest(compact(base)),'release_id':RELEASE,'corrections':corrections,'new_lesson_ids':[l['id']for l in new],'simulated_panel':True,'independent_models':False,'human_teacher_reviewed':False}
(ROOT/'qa/teacher-panel/changes.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
# An explicit per-item record distinguishes content inspection from measured classroom effectiveness.
roles=[{'id':'infantil','scope':'Juego, acompañamiento, lenguaje y participación en Infantil'},{'id':'primaria','scope':'Comprensión, progresión y alfabetización en Primaria'},{'id':'matematicas','scope':'Definiciones, supuestos, unidades y soluciones matemáticas'},{'id':'ciencias','scope':'Modelos físicos, químicos, biológicos y geológicos'},{'id':'lenguas','scope':'Lengua, lenguas extranjeras y clásicas; análisis contextual'},{'id':'humanidades','scope':'Historia, Geografía, Filosofía y Economía; fuentes y límites'},{'id':'artes','scope':'Artes, música, diseño, expresión y Educación Física'},{'id':'orientacion','scope':'Inclusión, cordialidad, seguridad, evaluación y autonomía'}]
def role(l):
 s=l['subject'].casefold()
 if l['stage']=='infantil':return'infantil'
 if 'matem' in s:return'matematicas'
 if any(k in s for k in ['biología','química','física y','ciencias','geología','tecnología']):return'ciencias'
 if any(k in s for k in ['lengua','latín','griego','literatura']):return'lenguas'
 if any(k in s for k in ['historia','geografía','filosofía','economía','empresa']):return'humanidades'
 if any(k in s for k in ['art','música','musical','dibujo','coro','diseño','volumen','educación física']):return'artes'
 return'primaria'if l['stage']=='primaria'else'orientacion'
records=[]
for l in lessons:
 records.append({'lesson_id':l['id'],'content_sha256':digest(compact(l)),'subject_lens':role(l),'second_lens':'infantil'if l['stage']=='infantil'else'orientacion','review_type':'multidisciplinary_simulation_single_AI','review_focus':{'misconception_to_prevent':l['misconception'],'reasoning_to_explain':l['why'],'self_contained_questions':[q['question']for q in l['quiz']],'checked_answers':[q['options']['ABC'.index(q['answer'])]for q in l['quiz']]},'explicit_changes':[c['reason']for c in corrections if c['lesson_id']==l['id']],'result':'suitable_as_bounded_introductory_support_subject_to_listed_limits','limits':['No classroom effectiveness validation','Not an exhaustive curriculum unit or mastery assessment','Editorial course placement; territorial/pathway availability must be checked'],'human_teacher_reviewed':False})
(ROOT/'qa/teacher-panel/review-ledger.json').write_text(json.dumps({'release_id':RELEASE,'roles':roles,'reviewers':'One AI system simulating role-specific perspectives, not eight independent teachers','records':records,'human_review_performed':False},ensure_ascii=False,indent=2)+'\n')
payload={'release_id':RELEASE,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons}
(ROOT/'eterna-worker/src/library/content-v1.js').write_text('/* Owned ETERNA support. Simulated AI panel; not complete curriculum or human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact(payload)+';\n')
(ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
for path in ['eterna-worker/src/index.js','eterna-worker/src/library/runtime-v1.js']:
 p=ROOT/path;s=p.read_text();assert OLD in s;s=s.replace(OLD,RELEASE).replace("const VERSION='library-first-v4-reviewed';","const VERSION='library-first-v5-panel';");p.write_text(s)
# Extend existing tests while preserving previous reversible review contracts.
p=ROOT/'eterna-worker/test/library-first.test.mjs';s=p.read_text().replace(OLD,RELEASE).replace('256 actual micro-lessons','304 actual micro-lessons').replace('768 distinct structured checks','912 distinct structured checks').replace('h.lessons.length,256','h.lessons.length,304').replace('l=>l.id)).size,256','l=>l.id)).size,304').replace('l=>l.quiz).length,768','l=>l.quiz).length,912').replace('all 768 known checks','all 912 known checks').replace('assert.equal(n,1280)','assert.equal(n,1520)')
s=s.replace('items=plain(current.slice(0,217))','items=undoPanelChanges(plain(current.slice(0,217)))')
s+='''\nfunction undoPanelChanges(items){const m=JSON.parse(text('../../qa/teacher-panel/changes.json')),by=new Map(items.map(l=>[l.id,l]));for(const c of [...m.corrections].reverse()){const l=by.get(c.lesson_id);if(!l)continue;assert.deepEqual(l[c.path[0]],c.after);l[c.path[0]]=c.before}return items;}\n''';p.write_text(s)
p=ROOT/'eterna-worker/test/library-editorial-review.test.mjs';s=p.read_text().replace("ls=JSON.parse(JSON.stringify(context.ETERNA_LIBRARY_CONTENT.lessons))","ls=undoPanelChanges(JSON.parse(JSON.stringify(context.ETERNA_LIBRARY_CONTENT.lessons.slice(0,256))))")
s+='''\nfunction undoPanelChanges(items){const m=JSON.parse(read('../../qa/teacher-panel/changes.json')),by=new Map(items.map(l=>[l.id,l]));for(const c of [...m.corrections].reverse()){const l=by.get(c.lesson_id);if(!l)continue;assert.deepEqual(l[c.path[0]],c.after);l[c.path[0]]=c.before}return items;}\n''';p.write_text(s)
report={'release_id':RELEASE,'lessons':304,'questions':912,'protocols':56,'added_lessons':48,'stages':dict(collections.Counter(l['stage']for l in lessons)),'correction_entries':len(corrections),'original_question_ids_preserved':768,'original_keys_preserved':768,'simulated_panel':True,'human_teacher_reviewed':False,'full_curriculum_complete':False,'reviewed_item_count':len(records),'runtime_algorithm_changed':False,'frontend_changed':False,'microphone_changed':False,'source_sha256':{path:digest((ROOT/path).read_bytes())for path in EXPECTED}}
(out/'build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
