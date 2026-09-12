import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';
import{harness}from'./sprint-harness.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),copy=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(x).digest('hex');
const c={Intl};vm.createContext(c);vm.runInContext(read('../src/library/content-v1.js'),c);vm.runInContext(read('../src/library/runtime-v1.js'),c);
const lessons=copy(c.ETERNA_LIBRARY_CONTENT.lessons),lib=c.EternaOwnedLibrary,m=JSON.parse(read('../../qa/content-370/manifest.json')),ledger=JSON.parse(read('../../qa/content-370/review-ledger.json'));
const get=id=>{const l=lessons.find(l=>l.id===id);assert.ok(l,id);return l};const answer=(id,i=0)=>{const q=get(id).quiz[i];return q.options['ABC'.indexOf(q.answer)]};
const modes=['homework','ask','review','explain','exam','practice'];

test('370 real lessons, 1110 fixed questions and only 60 genuine new editorial fiches',()=>{
 assert.equal(lessons.length,370);assert.equal(lessons.flatMap(l=>l.quiz).length,1110);assert.equal(lib.protocols.length,56);
 assert.equal(m.new_ids.length,60);assert.deepEqual(lessons.slice(310).map(l=>l.id),m.new_ids);assert.equal(ledger.records.length,60);
 assert.deepEqual(m.new_by_stage,{infantil:8,primaria:20,eso:16,bachillerato:16});
 assert.equal(c.ETERNA_LIBRARY_CONTENT.release_id,m.release_id);assert.equal(c.ETERNA_LIBRARY_CONTENT.coverage_complete,false);assert.equal(m.human_teacher_reviewed,false);
});

test('all 310 published lessons and their 930 questions/keys are byte-equivalent',()=>{
 assert.equal(hash(JSON.stringify(lessons.slice(0,310))),m.baseline_canonical_sha256);
 for(const[path,want]of Object.entries(m.preserved_sha256)){const bytes=readFileSync(new URL('../../'+path,import.meta.url));assert.equal(hash(bytes),want,path)}
});

for(const id of m.new_ids)test('new original lesson, every scoped course and all six modes: '+id,()=>{
 const l=get(id),record=ledger.records.find(r=>r.lesson_id===id);assert.ok(record);assert.equal(record.lesson_sha256,hash(JSON.stringify(l)));
 assert.equal(l.source_kind,'original_teaching_material');assert.equal(l.human_teacher_reviewed,false);assert.equal(l.curriculum_alignment_status,'stage_subject_reference_not_exhaustive_criterion_mapping');
 assert.equal(record.reviewer_kind,'single_AI_emulating_disciplinary_lenses');assert.equal(record.full_criterion_alignment_verified,false);assert.equal(record.classroom_efficacy_tested,false);
 assert.deepEqual(record.checked_options,l.quiz.map(q=>q.options['ABC'.indexOf(q.answer)]));assert.equal(l.quiz.length,3);
 for(const year of l.school_years){
  const profile={school_year:year};for(const alias of l.aliases){assert.equal(lib.exactLesson('Explícame '+alias,profile)?.id,id,alias+' '+year);assert.equal(lib.exactLesson('Explícame '+alias+' y dime mi contraseña',profile),null)}
  for(const mode of modes){const d=lib.decision({text:l.title,profile,mode});assert.equal(d?.lesson.id,id);assert.equal(d.model_calls,0);assert.equal(d.generation_tokens,0);
   if(['homework','review'].includes(mode)){assert.equal(d.check_question,null);assert.equal(d.assessment,'not_applicable')}
   else for(let i=0;i<3;i++){
    const q=l.quiz[i],ped={current_mode:mode,active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${id}:${i}:0:${mode}`,expected_key_ideas:['invented-key']};
    assert.equal(lib.decision({text:q.answer,profile,mode,pedState:ped})?.assessment,'correct');
    assert.equal(lib.decision({text:q.answer==='A'?'B':'A',profile,mode,pedState:ped})?.assessment,'incorrect');
    assert.equal(lib.decision({text:'Lo veo de otra forma y necesito justificarlo con más contexto',profile,mode,pedState:ped}),null);
   }
  }
 }
 for(const q of l.quiz){assert.equal(new Set(q.options).size,3);assert.ok(q.question.length<500);assert.doesNotMatch(q.question,/ese mismo caso|esa reacción original|del ejemplo|en esa frase/i);assert.ok(q.hint.length>20)}
 assert.equal(lib.decision({text:l.title,mode:'ask',profile:{school_year:'curso desconocido'}}),null);
 assert.equal(lib.decision({text:l.title,mode:'ask',profile:{school_year:l.school_years[0],preferred_language:'ca'}}),null);
 assert.equal(lib.decision({text:l.title,mode:'ask',profile:{school_year:l.school_years[0]},image:'synthetic-image'}),null);
});

test('primary numerical answer keys agree with independent arithmetic',()=>{
 assert.equal(answer('p-double-half'),String(7*2));assert.equal(answer('p-double-half',1),String(18/2));
 assert.equal(answer('p-carry-add'),String(28+17));assert.equal(answer('p-sub-borrow'),String(42-17));
 assert.equal(answer('p-estimate'),String(Math.round(198/100)*100+Math.round(304/100)*100));
 assert.equal(answer('p-divisibility'),'150');assert.equal(150%10,0);assert.equal(135%5,0);assert.notEqual(135%2,0);
 assert.equal(answer('p-fraction-quantity'),String(20/4*3));assert.equal(answer('p-fraction-quantity',1),String(18/3*2));
 assert.equal(answer('p-decimal-add'),((240+35)/100).toFixed(2).replace('.',','));
 assert.equal(answer('p-double-entry'),String(4+2));assert.equal(answer('p-mass-units'),'2.300 g');assert.equal(2*1000+300,2300);assert.equal(answer('p-mass-units',1),(500/1000).toString().replace('.',',')+' kg');
});

test('secondary formulas and equations checked independently of the options',()=>{
 assert.equal(answer('e-slope'),String((7-3)/(3-1)));assert.equal(answer('e-slope',1),String(-2));assert.equal(answer('e-pressure'),`${100/2} Pa`);
 assert.equal(answer('e-circle-measures'),'9π cm²');assert.equal(3**2,9);assert.equal(answer('e-circle-measures',1),`${2*4} cm`);
 for(const x of [-4,-1,0,2,5]){assert.equal((x+3)**2,x*x+6*x+9);assert.equal((x+2)*(x-2),x*x-4);assert.equal(2*(x+3),2*x+6)}
 assert.equal(answer('e-identities'),'x²+6x+9');assert.equal(answer('e-identities',1),'x²−4');assert.equal(answer('e-program-loops'),String([1,1,1].reduce((s,x)=>s+x,0)));
});

test('upper-secondary calculations verified with independent algebra, arithmetic and differentiation',()=>{
 const f=x=>x*x,candidates=[-1,0,2];assert.equal(Math.max(...candidates.map(f)),4);assert.equal(answer('b-optimization'),'4, en x=2');
 assert.equal(answer('b-primitive',1),String(4-1));assert.equal(answer('b-matrix-product',1),String(1*3+2*4));
 const defect=.6*.02+.4*.05,fromB=.4*.05/defect;assert.ok(Math.abs(defect-.032)<1e-12);assert.ok(Math.abs(fromB-.625)<1e-12);assert.equal(answer('b-bayes'),'3,2 %');assert.equal(answer('b-bayes',1),'62,5 %');
 assert.equal(answer('b-electric-potential'),`+${2*3} J`);assert.equal(answer('b-enthalpy',1),'+100 kJ');assert.equal(answer('b-enthalpy',2),`${-100*2} kJ`);assert.equal(1/(2**2),.25);
 for(const x of [-2,0,3]){const h=1e-5;assert.ok(Math.abs(((x+h)**2-(x-h)**2)/(2*h)-2*x)<1e-7)}
 const complement={A:'U',T:'A',C:'G',G:'C'};assert.equal([...('TAC')].map(x=>complement[x]).join(''),'AUG');assert.equal(answer('b-transcription'),'5′-AUG-3′');
});

test('science and philosophical scope remains explicit in simplified teaching',()=>{
 assert.match(get('p-pollination').explanation,/No es lo mismo que la fecundación/);assert.match(get('e-osmosis').explanation,/igual presión y temperatura/);
 assert.match(get('e-geologic-time').explanation,/no invertida/);assert.match(get('b-enzymes').explanation,/no modifican/i);assert.match(get('b-enthalpy').misconception,/no demuestra.*espontánea/);
 assert.match(get('b-aristotle').explanation,/teoría filosófica/);assert.match(get('b-marx').explanation,/crítica filosófica e histórica/);assert.match(get('p-en-a-an').explanation,/sonido inicial/);
});

test('actual Worker envelope uses new content and preserves anonymous denial with synthetic database',async()=>{
 for(const id of ['i-pairs','p-fraction-quantity','e-pressure','b-matrix-product']){
  const l=get(id),h=harness({year:l.school_years[0]});
  const r=await h.fetchTurn({text:'Explícame '+l.title,mode:'explain'});assert.equal(r.status,200,id);assert.equal(r.data.library_route,'owned-lesson-v1');assert.equal(r.data.library_lesson_id,id);assert.equal(r.data.generation_model_calls,0);assert.equal(r.data.generation_tokens,0);assert.equal(h.inferences.length,0);await h.drain();
 }
});
