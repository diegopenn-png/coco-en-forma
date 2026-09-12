import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';import{harness}from'./sprint-harness.mjs';
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8'),hash=x=>createHash('sha256').update(x).digest('hex');
const c={Intl};vm.createContext(c);vm.runInContext(text('../src/library/content-v1.js'),c);vm.runInContext(text('../src/library/runtime-v1.js'),c);
const ls=JSON.parse(JSON.stringify(c.ETERNA_LIBRARY_CONTENT.lessons)),lib=c.EternaOwnedLibrary,m=JSON.parse(text('../../qa/content-410/manifest.json')),ledger=JSON.parse(text('../../qa/content-410/review-ledger.json'));
const get=id=>{const l=ls.find(l=>l.id===id);assert.ok(l,id);return l};const answer=(id,i=0)=>{const q=get(id).quiz[i];return q.options['ABC'.indexOf(q.answer)]};
test('410 actual lessons, 1230 questions and only forty non-overlapping new topics',()=>{
 assert.equal(ls.length,410);assert.equal(new Set(ls.map(l=>l.id)).size,410);assert.equal(ls.flatMap(l=>l.quiz).length,1230);assert.equal(lib.protocols.length,56);
 assert.equal(m.new_ids.length,40);assert.deepEqual(ls.slice(370).map(l=>l.id),m.new_ids);assert.equal(Object.keys(m.duplicate_drafts_not_activated).length,20);
 assert.deepEqual(m.counts_added,{infantil:6,primaria:12,eso:12,bachillerato:10});assert.equal(c.ETERNA_LIBRARY_CONTENT.release_id,m.release_id);assert.equal(c.ETERNA_LIBRARY_CONTENT.coverage_complete,false);
});
test('all 370 published objects are preserved and the current Worker revision stays pinned',()=>{
 assert.equal(hash(JSON.stringify(ls.slice(0,370))),m.baseline_canonical_sha256);
 for(const[path,want]of Object.entries(m.preserved_sha256))assert.equal(hash(readFileSync(new URL('../../'+path,import.meta.url))),want,path);
 assert.equal(hash(text('../src/index.js').replaceAll(m.release_id,m.baseline_release)),'56e1c27c91c27661d5116074b2443c61cdba4892f9037a18fadc4c962c01b5fd');
 assert.equal(hash(text('../src/library/runtime-v1.js').replaceAll(m.release_id,m.baseline_release)),'94529100f9cea9412e53910075edc366c6b05ee1c3b60e233717e06a4ddf5568');
});
for(const id of m.new_ids)test('new unique topic all scoped courses and six modes: '+id,()=>{
 const l=get(id),r=ledger.records.find(r=>r.lesson_id===id);assert.ok(r);assert.equal(r.content_sha256,hash(JSON.stringify(l)));assert.equal(r.human_teacher_reviewed,false);assert.equal(r.full_criterion_alignment_verified,false);assert.equal(r.classroom_validated,false);assert.equal(l.source_kind,'original_teaching_material');
 assert.deepEqual(r.checked_answers,l.quiz.map(q=>q.options['ABC'.indexOf(q.answer)]));
 for(const year of l.school_years){
  const profile={school_year:year};for(const alias of l.aliases)assert.equal(lib.exactLesson('Explícame '+alias,profile)?.id,id,alias+' '+year);
  for(const mode of ['homework','ask','review','explain','exam','practice']){
   const d=lib.decision({text:'Explícame '+l.title,profile,mode});assert.equal(d?.lesson.id,id);assert.equal(d.model_calls,0);assert.equal(d.generation_tokens,0);
   if(['homework','review'].includes(mode)){assert.equal(d.assessment,'not_applicable');assert.equal(d.check_question,null)}
   else for(let i=0;i<3;i++){
    const q=l.quiz[i],ped={current_mode:mode,active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${id}:${i}:0:${mode}`,expected_answer:'fabricated'};
    assert.equal(lib.decision({text:q.answer,profile,mode,pedState:ped})?.assessment,'correct');
    assert.equal(lib.decision({text:q.answer==='A'?'B':'A',profile,mode,pedState:ped})?.assessment,'incorrect');
    assert.equal(lib.decision({text:'Quiero justificar una respuesta distinta con mis propios pasos',profile,mode,pedState:ped}),null);
   }
  }
 }
 for(const q of l.quiz){assert.ok(q.question.length<500);assert.equal(new Set(q.options).size,3);assert.doesNotMatch(q.question,/del ejemplo|esa misma reaccion|en ese mismo caso/i)}
 assert.equal(lib.decision({text:l.title,profile:{school_year:'desconocido'},mode:'ask'}),null);assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0],preferred_language:'ca'},mode:'ask'}),null);assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0]},mode:'ask',image:'fixture'}),null);
});
test('new mathematical examples checked independently of stored answers',()=>{
 assert.equal(answer('p-double-half'),String(2*7));assert.equal(answer('p-carry-add'),String(28+17));assert.equal(answer('p-estimate'),String(200+300));assert.equal(answer('p-divisibility'),'150');assert.equal(150%10,0);
 assert.equal(answer('p-decimal-add'),((240+35)/100).toFixed(2).replace('.',','));assert.equal(answer('p-double-entry'),String(4+2));
 assert.equal(answer('e-slope'),String((7-3)/(3-1)));assert.equal(Number(answer('e-slope',1).replace('−','-')),-2);assert.equal(answer('e-circle-measures'),'9π cm²');assert.equal(answer('e-circle-measures',1),`${2*4} cm`);
 assert.equal(answer('e-program-loops'),String([1,1,1].reduce((a,b)=>a+b,0)));assert.equal(answer('b-optimization'),'4, en x=2');assert.equal(Math.max(...[-1,0,2].map(x=>x*x)),4);
 assert.equal(answer('b-electric-potential'),`+${2*3} J`);assert.equal(answer('b-coulomb'),'Un cuarto');assert.equal(1/(2**2),.25);
 for(const x of [-4,-1,0,2,5])assert.equal(2*(x+3),2*x+6);
 const map={T:'A',A:'U',C:'G',G:'C'};assert.equal([...('TAC')].map(v=>map[v]).join(''),'AUG');assert.equal(answer('b-transcription'),'5′-AUG-3′');
});
test('science qualifiers and philosophical attribution preserved',()=>{
 assert.match(get('e-osmosis').explanation,/igual presión y temperatura/);assert.match(get('e-geologic-time').explanation,/no invertida/);assert.match(get('b-enzymes').explanation,/no modifican/i);assert.match(get('b-marx').explanation,/crítica filosófica e histórica/);assert.match(get('p-en-a-an').explanation,/sonido inicial/);
});
test('new lessons operate inside canonical Worker with synthetic DB and zero generation',async()=>{
 for(const id of ['i-one-more','p-double-half','e-slope','b-coulomb']){const l=get(id),h=harness({year:l.school_years[0]});const r=await h.fetchTurn({text:'Explícame '+l.title,mode:'explain'});assert.equal(r.status,200);assert.equal(r.data.library_lesson_id,id);assert.equal(r.data.generation_model_calls,0);assert.equal(h.inferences.length,0);await h.drain()}
});
