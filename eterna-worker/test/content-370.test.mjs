import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8').replaceAll('eterna-library-2026.09-v8-410-consolidated-1c484e','eterna-library-2026.09-v7-370-content-c26c61c'),hash=v=>createHash('sha256').update(v).digest('hex');
const box={Intl};vm.createContext(box);vm.runInContext(text('../src/library/content-v1.js'),box);vm.runInContext(text('../src/library/runtime-v1.js'),box);
const lessons=JSON.parse(JSON.stringify(box.ETERNA_LIBRARY_CONTENT.lessons)).slice(0,370),lib=box.EternaOwnedLibrary,m=JSON.parse(text('../../qa/content-370/manifest.json')),ledger=JSON.parse(text('../../qa/content-370/review-ledger.json'));
const get=id=>{const l=lessons.find(l=>l.id===id);assert.ok(l,id);return l};
const answer=(id,i=0)=>{const q=get(id).quiz[i];return q.options['ABC'.indexOf(q.answer)]};
test('370 edition is a real 60-lesson addition, not generated variants or renamed old entries',()=>{
 assert.equal(lessons.length,370);assert.equal(lessons.flatMap(l=>l.quiz).length,1110);assert.equal(lib.protocols.length,56);
 assert.equal(m.added_ids.length,60);assert.deepEqual(lessons.slice(310).map(l=>l.id),m.added_ids);assert.equal(new Set(lessons.map(l=>l.id)).size,370);
 assert.deepEqual(Object.fromEntries(['infantil','primaria','eso','bachillerato'].map(s=>[s,lessons.filter(l=>l.stage===s).length])),{infantil:48,primaria:115,eso:115,bachillerato:92});
 assert.equal(box.ETERNA_LIBRARY_CONTENT.coverage_complete,false);assert.equal(box.ETERNA_LIBRARY_CONTENT.human_teacher_reviewed,false);
});
test('all 310 previous lesson objects and 930 stable answer keys are byte-equivalent',()=>{
 assert.equal(hash(JSON.stringify(lessons.slice(0,310))),m.baseline_canonical_sha256);assert.equal(m.baseline_canonical_sha256,'591f22c5f2abf2b8f2ab1e5bf576ad4426208045632ad7ef5634cf188763010d');assert.equal(m.old_question_ids_and_keys_preserved,930);assert.equal(m.runtime_algorithm_changes,false);
});
test('new review records describe exact content and do not invent independent teachers or full alignment',()=>{
 assert.equal(ledger.records.length,60);assert.equal(ledger.human_review_performed,false);assert.match(ledger.reviewer,/One AI/);
 for(const r of ledger.records){const l=get(r.lesson_id);assert.equal(hash(JSON.stringify(l)),r.content_sha256);assert.deepEqual(r.questions,l.quiz.map(q=>q.question));assert.deepEqual(r.checked_answers,l.quiz.map(q=>q.options['ABC'.indexOf(q.answer)]));assert.equal(r.human_teacher_reviewed,false);assert.equal(r.classroom_validated,false);assert.equal(l.curriculum_alignment_status,'stage_reference_not_exhaustive_criterion_mapping');}
});
for(const id of m.added_ids)test('new content '+id+': every mode, scoped aliases and self-contained keys',()=>{
 const l=get(id);for(const year of new Set([l.school_years[0],l.school_years.at(-1)])){
  const profile={school_year:year};for(const alias of l.aliases)assert.equal(lib.exactLesson('Explícame '+alias,profile)?.id,id,year+' '+alias);
  for(const mode of ['homework','ask','review','explain','exam','practice']){
   const d=lib.decision({text:'Explícame '+l.title,profile,mode});assert.equal(d?.lesson.id,id);assert.equal(d.model_calls,0);assert.equal(d.generation_tokens,0);
   if(['homework','review'].includes(mode)){assert.equal(d.assessment,'not_applicable');assert.equal(d.check_question,null)}
   else for(let i=0;i<3;i++){
    const q=l.quiz[i],p={current_mode:mode,active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${id}:${i}:0:${mode}`,expected_answer:'fabricated'};
    assert.equal(lib.decision({text:q.answer,profile,mode,pedState:p})?.assessment,'correct');
    assert.equal(lib.decision({text:'Tengo una respuesta distinta que quiero argumentar con mis propios pasos',profile,mode,pedState:p}),null);
   }
  }
 }
 for(const q of l.quiz){assert.doesNotMatch(q.question,/con esos mismos datos|en ese equilibrio|del ejemplo|esa misma frase/i);assert.equal(new Set(q.options).size,3);assert.match(q.answer,/^[ABC]$/)}
 assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0],preferred_language:'ca'},mode:'ask'}),null);
 assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0]},mode:'ask',image:'test-image'}),null);
});
test('new numerical answer keys agree with independent arithmetic',()=>{
 const expected=[['p-fraction-quantity',0,String(20/5*3)],['p-fraction-quantity',1,String(28/4)],['p-common-denominator',0,'5/6'],['p-regroup-subtraction',0,String(42-17)],['p-distributive',0,String(6*14)],['p-division-remainder',2,Math.ceil(17/5)+' cajas'],['p-mass-units',0,'2.300 g'],['p-temperature',0,String(3-(-2))+' °C'],['e-algebra-value',0,'−1'],['e-thales',0,String(10*3/6)],['e-probability-tree',0,'1/4'],['e-speed-conversion',0,String(72/3.6)+' m/s'],['e-speed-conversion',1,String(5*3.6)+' km/h'],['e-pressure',0,String(100/.5)+' Pa'],['e-mass-conservation',0,String(12+32)+' g'],['e-genes-chromosomes',2,'46 cromosomas en ese modelo celular'],['b-line-equations',0,String(2*3+1)],['b-matrix-multiplication',0,String(1*3+2*4)],['b-bayes',0,'1/2'],['b-bayes',1,'3/4'],['b-electric-field',0,'2 N a la izquierda'],['b-enthalpy',1,'−100 kJ']];
 for(const[id,i,v]of expected)assert.equal(answer(id,i),v,id);assert.equal((.75*.5)/(.75*.5+.25*.5),.75);assert.equal(-.01*200,-2);
});
test('new calculus and algebra worked rules pass independent value checks',()=>{
 for(const x of [-3,-1.2,0,.4,4]){assert.ok(Math.abs((x+3)**2-(x*x+6*x+9))<1e-10);const h=1e-5;const f=z=>z*z*(z+1),F=z=>z**3/3;assert.ok(Math.abs((f(x+h)-f(x-h))/(2*h)-(3*x*x+2*x))<1e-6);assert.ok(Math.abs((F(x+h)-F(x-h))/(2*h)-x*x)<1e-6)}
 assert.equal(answer('b-product-rule'),'3x² + 2x');assert.equal(answer('b-indefinite-integral'),'x³/3');assert.match(get('b-indefinite-integral').explanation,/distinto de −1/);
});
test('new lessons preserve safety, model qualifiers and no historical monocultures',()=>{
 assert.match(get('p-magnetism').explanation,/no todos los metales/);assert.match(get('p-germination').explanation,/necesidades de luz varían/);assert.match(get('p-pollination').explanation,/No es lo mismo/);
 assert.match(get('e-acids-bases').explanation,/25 °C/);assert.match(get('e-acids-bases').explanation,/No se identifica/);assert.match(get('b-osmosis').explanation,/igual presión/);assert.match(get('b-lechatelier').explanation,/no cambia por sí solo/);
 assert.match(get('e-alandalus').explanation,/extensión y organización cambiaron/);assert.match(get('e-feudalism').explanation,/No todos los campesinos/);assert.match(get('i-disagree-kindly').explanation,/no encontramos/);
});
test('procedural, compass and the current canonical Worker revision stay pinned',()=>{
 assert.equal(hash(text('../src/library/procedural-v1.js')),'371f32609b1b2c3d4ba50ab4f67a487629f6cc536ced031a583e4d0ca6e46d98');
 assert.equal(hash(text('../src/library/curricular-compass-v1.js')),'f92dda2bfa99d6b05486ec6848a0a62dcaa5141f5b8577c23fd2c86f1db14096');
 assert.equal(hash(text('../src/library/compass-data-v1.js')),'cd8fd84bd5891e4d42600392e3a3939b773f6b69c1b84f3567416d2e760c104b');
 const OLD=m.baseline_release,NEW=m.release_id;
 assert.equal(hash(text('../src/index.js').replaceAll(NEW,OLD)),'3fbe344b748a89cea832b7680c9ad41c5a872b30435388263ba729af2491882f');
 assert.equal(hash(text('../src/library/runtime-v1.js').replaceAll(NEW,OLD).replace("const VERSION='library-first-v7-content';","const VERSION='library-first-v6-traceable';")),'9df5c21942c593241388535a4a0bb518bba95a71a0edfacbe770683bb2a83369');
});
