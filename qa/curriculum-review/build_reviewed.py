"""Build a reviewed content snapshot, never rewrite unrelated runtime behavior.
The base is immutable. Every correction has before/after evidence; no human review claim.
"""
from pathlib import Path
import copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
OLD='eterna-library-2026.09-v3-217-6b83'
RELEASE='eterna-library-2026.09-v4-256-reviewed-c993'
def sha(v):return hashlib.sha256(v if isinstance(v,bytes)else v.encode()).hexdigest()
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
expected={'eterna-worker/src/index.js':'a31668e29c999ed37d1232cb962de4f1bb3357824aa7c4c81c96301961544513','eterna-worker/src/library/runtime-v1.js':'e23eab7db96d9553ed61eeba584c6d99207731160ce8c5152ca56e4a7ce5daec','eterna-worker/src/library/content-v1.js':'f2ceaa8b07e82de6e88f04f4c123ac4ec6151fc3055169e828eb4b14c7615bb2','qa/library/lessons-v1.json':'f7e39eefe126ffcaf556625c9b3d0e61591057153fecc17d8ecd969a9c4c21ab','eterna-worker/test/library-first.test.mjs':'0c780c6307745633b85039c9246aa7eb43602f9e0f7a51d08f2d4dc003ae3298'}
for path,want in expected.items():assert sha((ROOT/path).read_bytes())==want,path
lessons=json.loads((ROOT/'qa/library/lessons-v1.json').read_text());assert len(lessons)==217
original=copy.deepcopy(lessons);by={l['id']:l for l in lessons};changes=[]
def change(id,path,value,reason):
 target=by[id]
 for key in path[:-1]:target=target[key]
 before=copy.deepcopy(target[path[-1]]);assert before!=value,(id,path)
 target[path[-1]]=value;changes.append({'lesson_id':id,'path':path,'before':before,'after':value,'reason':reason,'reviewer_kind':'AI-assisted editorial review','human_teacher_reviewed':False})
def q(id,index,text):change(id,['quiz',index,'question'],text,'Make the question answerable without an unseen worked example; preserve the answer key.')
q('i-listening',0,'Escucha: «Lola lleva una semilla al jardín y la planta». ¿Quién planta la semilla?')
q('i-listening',1,'Escucha: «Lola lleva una semilla al jardín y la planta». ¿Dónde planta Lola la semilla?')
q('p-pronouns',0,'En «Lucía lee. Ella disfruta del cuento», ¿a quién se refiere «ella»?')
q('e-linear-systems',0,'Resuelve el sistema x + y = 7, x − y = 1. Su solución es…')
q('e-linear-systems',1,'Para comprobar una solución de un sistema de ecuaciones, sustituimos sus valores en…')
q('e-volume',0,'Un ortoedro mide 4 cm de largo, 3 cm de ancho y 2 cm de alto. Su volumen es…')
q('e-acceleration',0,'En línea recta y con el mismo sentido positivo, la velocidad pasa de 2 a 8 m/s en 3 s. La aceleración media es…')
q('b-quadratic',0,'Las soluciones reales de x² − 5x + 6 = 0 son…')
q('b-trigonometry',0,'En un triángulo rectángulo, la hipotenusa mide 5 y el cateto opuesto a un ángulo agudo mide 3. El seno de ese ángulo es…')
q('b-conditional',0,'Al lanzar un dado equilibrado de seis caras, sabemos que salió un número par. La probabilidad condicionada de obtener 6 es…')
q('b-work',0,'Una fuerza constante de 10 N actúa paralela y en el mismo sentido que un desplazamiento de 3 m. El trabajo que realiza es…')
q('b-waves',0,'Una onda se propaga a 340 m/s y tiene frecuencia 170 Hz. Su longitud de onda es…')
q('i-story',0,'Escucha: «Un conejo pierde su cesta y una tortuga le ayuda a buscarla». ¿Quién pierde la cesta?')
stimulus='Lee: «Al entrar, Julia dejó un paraguas mojado junto a la puerta». '
q('p-inference',0,stimulus+'¿Qué dice expresamente el texto?')
q('p-inference',1,stimulus+'Pensar que había llovido es…')
q('p-inference',2,stimulus+'¿Qué detalle no podemos asegurar con estas pistas?')
q('p-have',2,'La pregunta equivalente a «She has got a bike» en la construcción have got es…')
q('e-systems',0,'¿Qué pareja resuelve simultáneamente x + y = 7 y x − y = 1?')
q('e-quadratic',0,'Las soluciones reales de la ecuación x² − 5x + 6 = 0 son…')
q('e-trig',0,'En un triángulo rectángulo de lados 3, 4 y 5, ¿cuál es el seno del ángulo opuesto al lado de longitud 3?')
q('e-similarity',0,'Un rectángulo de 2 por 3 se amplía a otro de 4 por 6. La razón lineal de la ampliación es…')
q('e-mendel',0,'En el modelo mendeliano Aa × Aa, con segregación de alelos y fecundación aleatoria, la probabilidad de un descendiente aa es…')
q('e-mendel',1,'En un modelo con dominancia completa para un rasgo, llamar dominante a un alelo significa…')
q('e-mendel',2,'Las proporciones calculadas para un cruce mendeliano Aa × Aa…')
q('e-motion',0,'En movimiento rectilíneo y con el mismo sentido positivo, la velocidad pasa de 2 m/s a 8 m/s en 3 s. La aceleración media es…')
q('e-electric',0,'Una resistencia óhmica de 3 Ω tiene una diferencia de potencial de 6 V. La corriente que la atraviesa es…')
q('e-solution',0,'Una disolución contiene 10 g de soluto en 2 L de volumen final. Su concentración en masa es…')
q('e-population',0,'En el mismo territorio y periodo se registran 100 nacimientos, 80 defunciones, 30 llegadas y 20 salidas. El cambio poblacional por estos componentes es…')
q('e-direct-object',1,'Al sustituir «el libro» por un pronombre en «Lucía lee el libro», la forma adecuada es…')
q('e-subordinate',0,'En «Espero que llegues pronto», la oración subordinada es…')
q('e-subordinate',1,'En «Espero que llegues pronto», la subordinada «que llegues pronto» expresa…')
q('b-determinant',0,'El determinante de la matriz de dos filas (1, 2) y (3, 4) es…')
q('b-binomial',0,'En tres lanzamientos independientes de una moneda equilibrada, la probabilidad de obtener exactamente dos caras es…')
q('b-normal',0,'Al tipificar x = 130 con media μ = 100 y desviación típica σ = 15 mediante z = (x − μ)/σ, obtenemos…')
q('b-dot',0,'El producto escalar de los vectores u = (1, 2) y v = (2, −1) es…')
q('b-conditionals',0,'La oración «If I had more time, I would read more» utiliza el patrón básico del…')
change('i-living',['explanation'],'Las plantas y los animales son seres vivos. Necesitan condiciones adecuadas para vivir y pueden crecer y responder a lo que ocurre a su alrededor. Un coche puede moverse, pero no está vivo. Podemos observar plantas y animales con ayuda de un adulto y sin hacerles daño.','Concrete age-appropriate introduction instead of abstract population terminology in Infantil.')
change('p-noun',['quiz',0,'question'],'En «La mochila pesa», ¿qué palabra es un sustantivo?','Identify the category in a sentence; isolated infinitives or adjectives can have nominal uses.')
change('p-noun',['quiz',0,'options'],['La','Mochila','Pesa'],'Use contextual grammatical distractors, keeping correct option B.')
change('p-water',['explanation'],'El agua circula entre la superficie terrestre y la atmósfera. Puede evaporarse y condensarse formando gotitas de agua líquida. Las nubes también pueden contener cristales de hielo. El agua vuelve a la superficie como precipitación, se infiltra en el suelo o fluye hacia ríos y mares. Cada porción de agua puede seguir recorridos diferentes.','Distinguish condensation (gas to liquid) from formation of ice crystals; USGS Water Science School.')
change('p-perimeter',['explanation'],'El perímetro es la longitud del contorno de una figura plana. En un polígono se calcula sumando las longitudes de todos sus lados. Sus unidades son de longitud, como centímetros o metros. Los contornos curvos requieren otros procedimientos de medida o cálculo.','Scope the sum-of-sides method to polygons rather than all figures.')
change('p-angles',['explanation'],'Dos semirrectas con origen común forman un ángulo. Su amplitud mide la abertura y puede expresarse en grados. Un ángulo recto mide 90°; uno agudo es mayor de 0° y menor de 90°; uno obtuso es mayor de 90° y menor de 180°.','Distinguish the geometric object from the measure of its amplitude.')
change('p-add',['explanation'],'Sumar reúne cantidades o añade una cantidad a otra. El resultado se llama suma. Si cambias el orden de los sumandos, la suma correcta se conserva. Recalcular por otro procedimiento puede ayudar a detectar errores; cambiar solo el orden escrito no demuestra que un resultado sea correcto.','Commutativity alone is not independent verification of a computed answer.')
change('p-clock',['explanation'],'Una hora tiene 60 minutos y un minuto 60 segundos. En un reloj analógico sencillo de dos agujas, la aguja larga indica los minutos y la corta las horas. Otros relojes incorporan también un segundero. No confundas la hora del día con una duración.','Scope the two-hand explanation and acknowledge the second hand.')
change('e-cell',['explanation'],'La célula es la unidad estructural y funcional básica de los seres vivos. El modelo celular básico incluye membrana plasmática, material genético y un medio interno donde ocurren procesos. Las células eucariotas típicas tienen un núcleo delimitado por membrana; las procariotas no. Algunas células especializadas pierden estructuras durante su maduración.','Avoid an absolute all-eukaryotic-cells-have-nuclei statement that excludes specialized cells.')
change('e-cell',['simpler'],'Los seres vivos están formados por células. En el modelo básico, las eucariotas tienen núcleo y las procariotas no tienen uno delimitado por membrana. Hay células especializadas con particularidades.','Maintain the model qualifier when simplifying.')
change('e-cell',['hints',1],by['e-cell']['simpler'],'Keep the stored simplified hint consistent with the corrected explanation.')
change('e-metaphor',['example'],'En «tus ojos son estrellas», la imagen de estrellas sugiere brillo o admiración según el contexto; no afirma que haya astros físicamente en los ojos.','Provide the actual metaphor before interpreting an absent example.')
change('e-metaphor',['hints',2],by['e-metaphor']['example'],'Keep the example hint consistent.')
change('b-work',['example'],'Una fuerza constante de 10 N, paralela y en el mismo sentido que un desplazamiento de 3 m, realiza 30 J de trabajo.','Parallel also includes the opposite direction; explicitly require the same sense for positive work.')
change('b-work',['hints',2],by['b-work']['example'],'Keep the stored worked example consistent.')
change('e-mendel',['explanation'],'En un modelo mendeliano sencillo, un gen presenta variantes llamadas alelos. Con dominancia completa para el rasgo estudiado, el heterocigoto muestra el mismo fenotipo que el homocigoto para el alelo dominante. Dominante no significa mejor, más frecuente ni más fuerte; tampoco describe por sí solo toda la expresión molecular del gen. Muchos rasgos no siguen este modelo simple.','Define complete dominance through phenotype rather than equating it with molecular allele expression.')
change('e-mendel',['quiz',1,'options',0],'Que el heterocigoto muestra el rasgo asociado a ese alelo','Use the phenotype-based definition while preserving option A.')
# Avoid an unnecessary self-harm distractor in a very-young-child routine-help question.
change('i-help',['quiz',0,'options',2],'Dejar de intentarlo sin decir qué necesitas','Use a non-graphic, age-appropriate distractor unrelated to introducing harm.')
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
new=[]
for stage,filename in [('primaria','new-primary.txt'),('eso','new-eso.txt'),('bachillerato','new-bachillerato.txt')]:
 for line in (ROOT/'qa/curriculum-review'/filename).read_text().splitlines():
  if not line.strip():continue
  row=line.split('|');assert len(row)==12,(filename,len(row),line[:60])
  id,title,subject,grades,aliases,explanation,simpler,example,questions,hint,misconception,why=row
  assert id not in by,id
  low,high=map(int,grades.split('-'));assert 1<=low<=high<=({'primaria':6,'eso':4,'bachillerato':2}[stage])
  years=[f'{n}º de '+{'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}[stage]for n in range(low,high+1)]
  quiz=[]
  for i,z in enumerate(questions.split('$')):
   stem,a,b,c,answer=z.split('~');assert answer in 'ABC' and len({a,b,c})==3
   quiz.append({'id':id+':q'+str(i),'question':stem,'options':[a,b,c],'answer':answer,'hint':hint,'level':i+1})
  assert len(quiz)==3
  obj={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':low,'grade_max':high,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explanation,'simpler':simpler,'example':example,'why':why,'misconception':misconception,'hints':[hint,simpler,example],'quiz':quiz,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage],'curriculum_source_key':SOURCES[stage],'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'AI-assisted domain/editorial review plus explicit answer-key and regression tests; independent human teacher review pending','human_teacher_reviewed':False,'language':'es','license_note':'Material original ETERNA. Referencia curricular por etapa, no homologación ni aval oficial.','curriculum_alignment_status':'stage_subject_reference_not_exhaustive_criterion_mapping','introduced_in_release':RELEASE,'subject_availability':'Depends on territorial curriculum, modality and school offer; not mandatory for every student.'}
  new.append(obj);by[id]=obj
assert len(new)==39
lessons+=new;assert len(lessons)==256
for old,newl in zip(original,lessons):
 assert old['id']==newl['id'];assert [q['id']for q in old['quiz']]==[q['id']for q in newl['quiz']];assert [q['answer']for q in old['quiz']]==[q['answer']for q in newl['quiz']]
# All undeclared original content must still be byte-equivalent after undoing the explicit corrections.
restored=copy.deepcopy(lessons[:217]);rby={l['id']:l for l in restored}
for c in reversed(changes):
 target=rby[c['lesson_id']]
 for k in c['path'][:-1]:target=target[k]
 assert target[c['path'][-1]]==c['after'];target[c['path'][-1]]=c['before']
assert restored==original
payload={'release_id':RELEASE,'coverage_complete':False,'human_teacher_reviewed':False,'lessons':lessons}
(ROOT/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA reviewed teaching support; not full national curriculum or human certification. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+compact(payload)+';\n')
(ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
manifest={'release_id':RELEASE,'base_commit':'c993afecbdfe9a8f456af509b5b45b1b03ef4f47','base_lessons':217,'base_canonical_sha256':sha(compact(original)),'changes':changes,'new_ids':[l['id']for l in new],'human_teacher_reviewed':False,'review_scope':'AI-assisted factual, clarity, age, self-contained assessment and safeguarding review. Not classroom validation or complete territorial criterion mapping.'}
(ROOT/'qa/curriculum-review/corrections.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'eterna-worker/src/index.js';s=p.read_text();assert s.count(OLD)==3;s=s.replace(OLD,RELEASE);p.write_text(s)
p=ROOT/'eterna-worker/src/library/runtime-v1.js';s=p.read_text();s=s.replace("const VERSION='library-first-v3-combined';","const VERSION='library-first-v4-reviewed';").replace(OLD,RELEASE)
before='Puede dar vergüenza leer o preguntar delante de otros${name}; no tienes que ocultarlo ni hacerlo perfecto. Puedes empezar con una frase corta y pedir ayuda a tu profesor en privado. No hace falta hacerlo perfecto para empezar.'
after='Es comprensible que a veces dé vergüenza leer o preguntar${name}. Podemos empezar con una frase corta, a tu ritmo, y puedes pedir ayuda a tu profesor en privado. No hace falta hacerlo perfecto ni forzarte delante de todo el grupo.'
assert before in s;s=s.replace(before,after);p.write_text(s)
manifest['protocol_changes']=[{'protocol_id':'reading_embarrassment','before':before,'after':after,'reason':'Preserve acknowledgment of the feeling, remove redundant wording and reinforce choice and trusted human support.'}]
(ROOT/'qa/curriculum-review/corrections.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'eterna-worker/test/library-first.test.mjs';s=p.read_text().replace(OLD,RELEASE).replace('217 actual micro-lessons','256 actual micro-lessons').replace('651 distinct structured checks','768 distinct structured checks').replace('h.lessons.length,217','h.lessons.length,256').replace('l=>l.id)).size,217','l=>l.id)).size,256').replace('l=>l.quiz).length,651','l=>l.quiz).length,768').replace('all 651 known checks','all 768 known checks').replace('assert.equal(n,1085)','assert.equal(n,1280)').replace('h.lessons.slice(160).map(l=>l.id)','h.lessons.slice(160,217).map(l=>l.id)')
needle='JSON.stringify(plain(h.lessons.slice(0,160)))'
assert s.count(needle)==1;s=s.replace(needle,'JSON.stringify(restoreReviewedOriginals(h.lessons).slice(0,160))').replace('combined library preserves exact latest 160 teaching objects','reviewed library preserves the original 160 objects except explicit audited corrections')
helper="""
function restoreReviewedOriginals(current){
 const m=JSON.parse(text('../../qa/curriculum-review/corrections.json')),items=plain(current.slice(0,217)),by=new Map(items.map(l=>[l.id,l]));
 for(const c of [...m.changes].reverse()){let t=by.get(c.lesson_id);for(const k of c.path.slice(0,-1))t=t[k];const k=c.path.at(-1);assert.deepEqual(t[k],c.after,'Undeclared change at '+c.lesson_id+':'+c.path.join('.'));t[k]=c.before}
 return items;
}
"""
s+=helper;p.write_text(s)
report={'release_id':RELEASE,'base_lessons':217,'lessons':256,'questions':768,'protocols':56,'new_lessons':39,'correction_entries':len(changes),'corrected_lessons':len({c['lesson_id']for c in changes}),'question_stems_corrected':sum(c['path'][0]=='quiz' and c['path'][-1]=='question'for c in changes),'preserved_question_ids':651,'preserved_answer_keys':651,'runtime_algorithm_changed':False,'microphone_changed':False,'human_teacher_reviewed':False,'coverage_complete':False,'sha256':{path:sha((ROOT/path).read_bytes())for path in expected}}
(ROOT/'review-build-evidence').mkdir(exist_ok=True);(ROOT/'review-build-evidence/build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
